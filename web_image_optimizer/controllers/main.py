import base64

from odoo import _, http
from odoo.addons.html_editor.controllers.main import HTML_Editor
from odoo.exceptions import UserError
from odoo.http import request
from odoo.tools.image import image_process
from odoo.tools.mimetypes import guess_mimetype

from ..models.image_optimizer_service import ImageOptimizerService


SUPPORTED_IMAGE_MIMETYPES = {
    "image/gif": ".gif",
    "image/jpe": ".jpe",
    "image/jpeg": ".jpeg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
}


class WebImageOptimizerController(HTML_Editor):
    def _prepare_upload_attachment(self, name, data, is_image, width=0, height=0, quality=0):
        data = base64.b64decode(data)
        if not is_image:
            return name, data

        format_error_msg = _(
            "Uploaded image's format is not supported. Try with: %s",
            ", ".join(SUPPORTED_IMAGE_MIMETYPES.values()),
        )
        try:
            mimetype = guess_mimetype(data)
            if mimetype not in SUPPORTED_IMAGE_MIMETYPES:
                raise UserError(format_error_msg)
            return name, image_process(
                data, size=(width, height), quality=quality, verify_resolution=True
            )
        except (ValueError, UserError) as error:
            raise UserError(error.args[0]) from error

    def _serialize_binary_result(self, result):
        optimized = result["optimized_bytes"]
        return {
            "name": result.get("optimized_name"),
            "data": base64.b64encode(optimized).decode(),
            "mimetype": result["optimized_mimetype"],
            "changed": result["changed"],
            "reason": result["reason"],
            "size_delta": result["size_delta"],
            "gain_ratio": result["gain_ratio"],
            "summary": result["summary"],
        }

    @http.route(
        "/web_image_optimizer/attachment/add_data",
        type="jsonrpc",
        auth="user",
        methods=["POST"],
        website=True,
    )
    def add_optimized_attachment_data(
        self,
        name,
        data,
        is_image,
        trigger_mode="inherit",
        quality=0,
        width=0,
        height=0,
        res_id=False,
        res_model="ir.ui.view",
        **kwargs,
    ):
        try:
            name, data = self._prepare_upload_attachment(
                name, data, is_image, width=width, height=height, quality=quality
            )
        except UserError as error:
            return {"error": error.args[0]}
        self._clean_context()
        attachment = self._attachment_create(
            name=name, data=data, res_id=res_id, res_model=res_model
        )
        if is_image:
            optimization = attachment.optimize_for_media_use(trigger_mode=trigger_mode)
            attachment = optimization["attachment"]
            media_info = attachment._get_media_info()
            media_info["optimization"] = {
                "changed": optimization.get("changed", False),
                "reason": optimization.get("reason"),
                "summary": optimization.get("summary"),
            }
            return media_info
        return attachment._get_media_info()

    @http.route(
        "/web_image_optimizer/attachment/optimize",
        type="jsonrpc",
        auth="user",
        methods=["POST"],
        website=True,
    )
    def optimize_existing_attachments(
        self,
        attachment_ids,
        ensure_report_compatibility=False,
        **kwargs,
    ):
        self._clean_context()
        attachments = request.env["ir.attachment"].browse(attachment_ids).exists()
        results = []
        for attachment in attachments:
            optimization = attachment.optimize_for_media_use(
                trigger_mode="manual",
                force=True,
                ensure_report_compatibility=ensure_report_compatibility,
            )
            preferred = optimization["attachment"]
            media_info = preferred._get_media_info()
            media_info["optimization"] = {
                "changed": optimization.get("changed", False),
                "reason": optimization.get("reason"),
                "summary": optimization.get("summary"),
            }
            results.append(media_info)
        return {"attachments": results}

    @http.route(
        "/web_image_optimizer/binary/optimize",
        type="jsonrpc",
        auth="user",
        methods=["POST"],
        website=True,
    )
    def optimize_binary_image(
        self,
        name,
        data,
        mimetype=None,
        trigger_mode="inherit",
        create_report_compatibility=False,
        **kwargs,
    ):
        self._clean_context()
        IrAttachment = request.env["ir.attachment"]
        settings = IrAttachment._get_image_optimizer_settings()
        effective_mode = settings["trigger_mode"] if trigger_mode == "inherit" else trigger_mode
        raw = base64.b64decode(data)
        if not settings["enabled"] or effective_mode == "off":
            return {
                "name": name,
                "data": data,
                "mimetype": mimetype or guess_mimetype(raw),
                "changed": False,
                "reason": "optimizer_disabled",
                "summary": _("Optimizer disabled"),
                "size_delta": 0,
                "gain_ratio": 0,
            }
        if effective_mode == "manual" and not kwargs.get("force"):
            return {
                "name": name,
                "data": data,
                "mimetype": mimetype or guess_mimetype(raw),
                "changed": False,
                "reason": "manual_mode",
                "summary": _("Optimization available on demand"),
                "size_delta": 0,
                "gain_ratio": 0,
            }

        result = ImageOptimizerService.optimize(
            raw,
            mimetype=mimetype or guess_mimetype(raw),
            soft_target_kb=settings["soft_target_kb"],
        ).to_dict()
        result["summary"] = _(ImageOptimizerService.summarize_result(result))
        result["optimized_name"] = (
            (
                name.rsplit(".", 1)[0] + ".webp"
                if result["changed"] and name and "." in name
                else f"{name}.webp"
            )
            if result["changed"] and name
            else name
        )

        if create_report_compatibility and result["changed"]:
            attachment = request.env["ir.attachment"].create(
                {
                    "name": result["optimized_name"] or name,
                    "datas": base64.b64encode(result["optimized_bytes"]),
                    "res_model": "ir.attachment",
                    "res_id": 0,
                    "public": False,
                    "mimetype": result["optimized_mimetype"],
                    "optimization_profile": settings["profile"],
                    "optimization_status": "optimized",
                }
            )
            attachment._ensure_report_compatibility_attachment()

        return self._serialize_binary_result(result)
