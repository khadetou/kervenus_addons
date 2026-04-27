from odoo import _, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    def action_open_keurvenus_portal_password_wizard(self):
        self.ensure_one()
        return {
            "name": _("Acces portail et mot de passe"),
            "type": "ir.actions.act_window",
            "res_model": "keurvenus.portal.password.wizard",
            "view_mode": "form",
            "target": "new",
            "context": {
                "default_partner_id": self.id,
                "active_model": self._name,
                "active_id": self.id,
            },
        }
