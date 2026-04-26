from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    web_image_optimizer_enabled = fields.Boolean(
        string="Enable image optimizer",
        config_parameter="web_image_optimizer.enabled",
        default=True,
    )
    web_image_optimizer_default_trigger_mode = fields.Selection(
        [
            ("auto", "Auto"),
            ("manual", "Manual"),
            ("off", "Off"),
        ],
        string="Default trigger mode",
        config_parameter="web_image_optimizer.default_trigger_mode",
        default="auto",
    )
    web_image_optimizer_default_profile = fields.Selection(
        [("lossless_webp", "Lossless WebP")],
        string="Default optimization profile",
        config_parameter="web_image_optimizer.default_profile",
        default="lossless_webp",
    )
    web_image_optimizer_soft_target_kb = fields.Integer(
        string="Soft target size (KB)",
        config_parameter="web_image_optimizer.soft_target_kb",
        default=100,
    )
