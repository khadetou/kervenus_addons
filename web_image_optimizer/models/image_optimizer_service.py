import io
from dataclasses import dataclass

from PIL import Image, ImageOps, features

from odoo.tools.mimetypes import guess_mimetype


ELIGIBLE_MIMETYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
PASSTHROUGH_MIMETYPES = {"image/gif", "image/svg+xml"}


@dataclass
class ImageOptimizationResult:
    source_mimetype: str
    optimized_mimetype: str
    original_bytes: bytes
    optimized_bytes: bytes
    size_delta: int
    gain_ratio: float
    reason: str
    changed: bool

    def to_dict(self):
        return {
            "source_mimetype": self.source_mimetype,
            "optimized_mimetype": self.optimized_mimetype,
            "original_bytes": self.original_bytes,
            "optimized_bytes": self.optimized_bytes,
            "size_delta": self.size_delta,
            "gain_ratio": self.gain_ratio,
            "reason": self.reason,
            "changed": self.changed,
        }


class ImageOptimizerService:
    @staticmethod
    def summarize_result(result):
        original_kb = len(result["original_bytes"]) / 1024 if result.get("original_bytes") else 0
        optimized_kb = len(result["optimized_bytes"]) / 1024 if result.get("optimized_bytes") else 0
        if result.get("changed"):
            return f"{original_kb:.0f} KB -> {optimized_kb:.0f} KB, WebP lossless"

        reason = result.get("reason")
        if reason == "webp_not_available":
            return "Kept original, WebP optimization is unavailable on this server"
        if reason == "passthrough_format":
            return "Kept original, this format is intentionally not optimized"
        if reason == "unsupported_format":
            return "Kept original, this image format is not supported by the optimizer"
        return "Kept original, no smaller lossless variant"

    @classmethod
    def optimize(cls, source, mimetype=None, soft_target_kb=100):
        source_mimetype = mimetype or guess_mimetype(source)
        if source_mimetype in PASSTHROUGH_MIMETYPES:
            return ImageOptimizationResult(
                source_mimetype=source_mimetype,
                optimized_mimetype=source_mimetype,
                original_bytes=source,
                optimized_bytes=source,
                size_delta=0,
                gain_ratio=0.0,
                reason="passthrough_format",
                changed=False,
            )
        if source_mimetype not in ELIGIBLE_MIMETYPES:
            return ImageOptimizationResult(
                source_mimetype=source_mimetype,
                optimized_mimetype=source_mimetype,
                original_bytes=source,
                optimized_bytes=source,
                size_delta=0,
                gain_ratio=0.0,
                reason="unsupported_format",
                changed=False,
            )

        if not cls._can_encode_webp():
            return ImageOptimizationResult(
                source_mimetype=source_mimetype,
                optimized_mimetype=source_mimetype,
                original_bytes=source,
                optimized_bytes=source,
                size_delta=0,
                gain_ratio=0.0,
                reason="webp_not_available",
                changed=False,
            )

        image = Image.open(io.BytesIO(source))
        image.load()
        image = ImageOps.exif_transpose(image)
        icc_profile = image.info.get("icc_profile")
        save_kwargs = {
            "format": "WEBP",
            "lossless": True,
            "method": 6,
            "exact": True,
        }
        if icc_profile:
            save_kwargs["icc_profile"] = icc_profile

        optimized_buffer = io.BytesIO()
        try:
            image.save(optimized_buffer, **save_kwargs)
        except (OSError, KeyError):
            return ImageOptimizationResult(
                source_mimetype=source_mimetype,
                optimized_mimetype=source_mimetype,
                original_bytes=source,
                optimized_bytes=source,
                size_delta=0,
                gain_ratio=0.0,
                reason="webp_not_available",
                changed=False,
            )

        optimized_bytes = optimized_buffer.getvalue()
        size_delta = len(source) - len(optimized_bytes)
        gain_ratio = size_delta / len(source) if source else 0.0
        soft_target_bytes = max(int(soft_target_kb or 0) * 1024, 0)

        if len(optimized_bytes) >= len(source):
            return ImageOptimizationResult(
                source_mimetype=source_mimetype,
                optimized_mimetype=source_mimetype,
                original_bytes=source,
                optimized_bytes=source,
                size_delta=0,
                gain_ratio=0.0,
                reason="no_smaller_lossless_variant",
                changed=False,
            )

        reason = "optimized_lossless_webp"
        if soft_target_bytes and len(optimized_bytes) > soft_target_bytes:
            reason = "optimized_above_soft_target"
        return ImageOptimizationResult(
            source_mimetype=source_mimetype,
            optimized_mimetype="image/webp",
            original_bytes=source,
            optimized_bytes=optimized_bytes,
            size_delta=size_delta,
            gain_ratio=gain_ratio,
            reason=reason,
            changed=True,
        )

    @staticmethod
    def _can_encode_webp():
        try:
            return bool(features.check("webp")) and "WEBP" in Image.SAVE
        except Exception:
            return False
