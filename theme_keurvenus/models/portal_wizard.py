from odoo import _, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError


class PortalWizardUser(models.TransientModel):
    _inherit = "portal.wizard.user"

    new_password = fields.Char(string="Nouveau mot de passe")
    confirm_password = fields.Char(string="Confirmer")

    def _check_can_manage_passwords(self):
        if not self.env.user.has_group("base.group_system"):
            raise AccessError(_("Seuls les administrateurs peuvent gerer les mots de passe des utilisateurs."))

    def _validate_password_fields(self):
        self.ensure_one()
        password = (self.new_password or "").strip()
        if not password:
            raise ValidationError(_("Indiquez un nouveau mot de passe."))
        if password != (self.confirm_password or "").strip():
            raise ValidationError(_("Les deux mots de passe ne correspondent pas."))
        if len(password) < 8:
            raise ValidationError(_("Le mot de passe doit contenir au moins 8 caracteres."))
        if self.user_id == self.env.user:
            raise UserError(_("Utilisez le menu utilisateur pour changer votre propre mot de passe."))
        return password

    def _ensure_portal_or_existing_user(self):
        self.ensure_one()
        user_sudo = self.user_id.sudo()
        if not user_sudo:
            self._assert_user_email_uniqueness()
            self._update_partner_email()
            company = self.partner_id.company_id or self.env.company
            user_sudo = self.sudo().with_company(company.id)._create_user()

        if user_sudo._is_internal():
            raise UserError(_(
                "Ce contact est lie a un utilisateur interne. Creez ou selectionnez un contact client separe "
                "avant de definir un mot de passe portail."
            ))

        group_portal = self.env.ref("base.group_portal")
        group_public = self.env.ref("base.group_public")
        user_sudo.write({"active": True, "group_ids": [(4, group_portal.id), (3, group_public.id)]})

        return user_sudo

    def action_set_portal_password(self):
        self.ensure_one()
        self._check_can_manage_passwords()
        password = self._validate_password_fields()
        user_sudo = self._ensure_portal_or_existing_user()
        user_sudo._change_password(password)
        self.write({"new_password": False, "confirm_password": False})
        return self.action_refresh_modal()
