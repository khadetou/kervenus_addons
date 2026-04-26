import base64
import io
import re

from PIL import Image, ImageOps

from odoo import _, api, fields, models

from .image_optimizer_service import ELIGIBLE_MIMETYPES, ImageOptimizerService


class IrAttachment(models.Model):
    _inherit = "ir.attachment"

    optimization_profile = fields.Char(default="lossless_webp")
    optimization_status = fields.Selection(
        [
            ("original", "Original"),
            ("optimized", "Optimized"),
            ("unchanged", "Unchanged"),
            ("compatibility", "Compatibility"),
        ],
        default=False,
    )
    optimization_gain_pct = fields.Float()

    @api.model
    def _get_image_optimizer_settings(self):
        params = self.env["ir.config_parameter"].sudo()
        return {
            "enabled": params.get_param("web_image_optimizer.enabled", "True") == "True",
            "trigger_mode": params.get_param(
                "web_image_optimizer.default_trigger_mode", "auto"
            ),
            "profile": params.get_param(
                "web_image_optimizer.default_profile", "lossless_webp"
            ),
            "soft_target_kb": int(
                params.get_param("web_image_optimizer.soft_target_kb", "100") or 100
            ),
        }

    def _is_image_optimizer_eligible(self):
        self.ensure_one()
        return self.type == "binary" and not self.url and self.mimetype in ELIGIBLE_MIMETYPES

    def _get_raw_bytes(self):
        self.ensure_one()
        if self.raw:
            return self.raw
        if self.datas:
            return base64.b64decode(self.datas)
        return b""

    def _build_optimization_summary(self, result):
        self.ensure_one()
        summary = ImageOptimizerService.summarize_result(result)
        return _(summary)

    def _get_compatibility_attachment(self):
        self.ensure_one()
        return self.search(
            [
                ("res_model", "=", "ir.attachment"),
                ("res_id", "=", self.id),
                ("optimization_status", "=", "compatibility"),
                ("mimetype", "=", "image/jpeg"),
            ],
            limit=1,
        )

    def _ensure_report_compatibility_attachment(self):
        self.ensure_one()
        if self.mimetype != "image/webp":
            return False
        compatibility = self._get_compatibility_attachment()
        if compatibility:
            return compatibility
        image = Image.open(io.BytesIO(self._get_raw_bytes()))
        image.load()
        image = ImageOps.exif_transpose(image)
        if image.mode not in ["RGB", "L"]:
            background = Image.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.getchannel("A") if "A" in image.getbands() else None)
            image = background
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", optimize=True, quality=95)
        return self.create(
            {
                "name": re.sub(r"\.webp$", ".jpg", self.name, flags=re.I),
                "datas": base64.b64encode(buffer.getvalue()),
                "res_model": "ir.attachment",
                "res_id": self.id,
                "public": False,
                "mimetype": "image/jpeg",
                "optimization_profile": self.optimization_profile or "lossless_webp",
                "optimization_status": "compatibility",
            }
        )

    def get_preferred_delivery_attachment(self):
        self.ensure_one()
        return self if self.optimization_status != "original" else (self.search(
            [("original_id", "=", self.id), ("optimization_status", "=", "optimized")], limit=1
        ) or self)

    def optimize_existing_attachment(
        self,
        profile=None,
        force=False,
        ensure_report_compatibility=False,
    ):
        self.ensure_one()
        settings = self._get_image_optimizer_settings()
        profile = profile or settings["profile"]
        if not settings["enabled"]:
            return {"attachment": self, "changed": False, "reason": "optimizer_disabled"}
        if self.original_id and self.optimization_status == "optimized":
            if ensure_report_compatibility:
                self._ensure_report_compatibility_attachment()
            return {
                "attachment": self,
                "changed": False,
                "reason": "already_optimized",
                "summary": self._build_optimization_summary(
                    {
                        "original_bytes": self.original_id._get_raw_bytes(),
                        "optimized_bytes": self._get_raw_bytes(),
                        "changed": True,
                    }
                ),
            }
        if not self._is_image_optimizer_eligible():
            return {"attachment": self, "changed": False, "reason": "unsupported"}

        result = ImageOptimizerService.optimize(
            self._get_raw_bytes(),
            mimetype=self.mimetype,
            soft_target_kb=settings["soft_target_kb"],
        ).to_dict()

        gain_pct = max(result["gain_ratio"] * 100.0, 0.0)
        if not result["changed"]:
            self.write(
                {
                    "optimization_profile": profile,
                    "optimization_status": "unchanged",
                    "optimization_gain_pct": gain_pct,
                }
            )
            return {
                "attachment": self,
                "changed": False,
                "reason": result["reason"],
                "summary": self._build_optimization_summary(result),
                "result": result,
            }

        original_attachment = self.original_id
        if not original_attachment:
            original_attachment = self.copy(
                {
                    "res_model": "ir.attachment",
                    "res_id": self.id,
                    "public": False,
                    "original_id": False,
                    "optimization_profile": profile,
                    "optimization_status": "original",
                    "optimization_gain_pct": gain_pct,
                }
            )

        optimized_name = re.sub(r"\.(jpe?g|png)$", ".webp", self.name, flags=re.I)
        if optimized_name == self.name and not optimized_name.lower().endswith(".webp"):
            optimized_name = f"{self.name}.webp"
        self.write(
            {
                "name": optimized_name,
                "datas": base64.b64encode(result["optimized_bytes"]),
                "mimetype": result["optimized_mimetype"],
                "original_id": original_attachment.id,
                "optimization_profile": profile,
                "optimization_status": "optimized",
                "optimization_gain_pct": gain_pct,
            }
        )
        if ensure_report_compatibility:
            self._ensure_report_compatibility_attachment()
        return {
            "attachment": self,
            "changed": True,
            "reason": result["reason"],
            "summary": self._build_optimization_summary(result),
            "result": result,
        }

    def optimize_for_media_use(
        self,
        trigger_mode="inherit",
        force=False,
        ensure_report_compatibility=False,
    ):
        self.ensure_one()
        settings = self._get_image_optimizer_settings()
        effective_mode = settings["trigger_mode"] if trigger_mode == "inherit" else trigger_mode
        if effective_mode == "off":
            return {"attachment": self, "changed": False, "reason": "optimizer_disabled"}
        if effective_mode == "manual" and not force:
            return {"attachment": self, "changed": False, "reason": "manual_mode"}
        return self.optimize_existing_attachment(
            profile=settings["profile"],
            force=force,
            ensure_report_compatibility=ensure_report_compatibility,
        )
