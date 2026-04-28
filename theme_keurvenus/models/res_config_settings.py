from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    theme_keurvenus_auth_mode = fields.Selection(
        related="website_id.theme_keurvenus_auth_mode",
        readonly=False,
    )
