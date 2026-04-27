from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError
from odoo.tools import email_normalize


class KeurvenusPortalPasswordWizard(models.TransientModel):
    _name = "keurvenus.portal.password.wizard"
    _description = "Keur Venus Portal Password Wizard"
    _transient_max_hours = 0.2

    partner_id = fields.Many2one("res.partner", string="Contact", required=True, readonly=True)
    user_id = fields.Many2one(
        "res.users",
        string="Utilisateur lie",
        compute="_compute_user_id",
        compute_sudo=True,
    )
    login = fields.Char(string="E-mail de connexion", required=True)
    password = fields.Char(string="Nouveau mot de passe", required=True)
    confirm_password = fields.Char(string="Confirmer le mot de passe", required=True)
    user_state = fields.Selection(
        [
            ("new", "A creer"),
            ("portal", "Portail"),
            ("internal", "Utilisateur interne"),
            ("other", "Utilisateur existant"),
        ],
        string="Statut",
        compute="_compute_user_state",
    )
    notice = fields.Text(string="Note", compute="_compute_notice")

    @api.model
    def default_get(self, fields_list):
        values = super().default_get(fields_list)
        partner_id = values.get("partner_id") or self.env.context.get("active_id")
        if partner_id:
            partner = self.env["res.partner"].browse(partner_id)
            values.setdefault("partner_id", partner.id)
            values.setdefault("login", email_normalize(partner.email or "") or partner.email or "")
        return values

    @api.depends("partner_id")
    def _compute_user_id(self):
        for wizard in self:
            wizard.user_id = wizard.partner_id.with_context(active_test=False).user_ids[:1]

    @api.depends("user_id", "user_id.active", "user_id.group_ids")
    def _compute_user_state(self):
        for wizard in self:
            user = wizard.user_id
            if not user:
                wizard.user_state = "new"
            elif user._is_internal():
                wizard.user_state = "internal"
            elif user._is_portal():
                wizard.user_state = "portal"
            else:
                wizard.user_state = "other"

    @api.depends("user_state")
    def _compute_notice(self):
        for wizard in self:
            if wizard.user_state == "new":
                wizard.notice = _("Aucun utilisateur n'est lie a ce contact. Un compte portail sera cree.")
            elif wizard.user_state == "portal":
                wizard.notice = _("Ce contact a deja un compte portail. Le mot de passe sera mis a jour.")
            elif wizard.user_state == "internal":
                wizard.notice = _(
                    "Ce contact est lie a un utilisateur interne. Pour un client portail, creez ou selectionnez "
                    "un contact client separe afin de ne jamais exposer le backoffice."
                )
            else:
                wizard.notice = _("Un utilisateur existe pour ce contact. L'acces portail sera ajoute si necessaire.")

    def _check_can_manage_passwords(self):
        if not self.env.user.has_group("base.group_system"):
            raise AccessError(_("Seuls les administrateurs peuvent gerer les mots de passe des utilisateurs."))

    def _normalized_login(self):
        self.ensure_one()
        login = email_normalize(self.login or "")
        if not login:
            raise ValidationError(_("Indiquez une adresse e-mail valide pour la connexion."))
        return login

    def _validate_password(self):
        self.ensure_one()
        if self.password != self.confirm_password:
            raise ValidationError(_("Les deux mots de passe ne correspondent pas."))
        if len((self.password or "").strip()) < 8:
            raise ValidationError(_("Le mot de passe doit contenir au moins 8 caracteres."))
        if self.user_id == self.env.user:
            raise UserError(_("Utilisez le menu utilisateur pour changer votre propre mot de passe."))
        if self.user_id and self.user_id._is_internal():
            raise UserError(_(
                "Ce contact est lie a un utilisateur interne. Pour des raisons de securite, "
                "creez ou selectionnez un contact client portail separe avant de definir un mot de passe client."
            ))

    def _find_conflicting_user(self, login):
        self.ensure_one()
        domain = [("login", "=", login)]
        if self.user_id:
            domain.append(("id", "!=", self.user_id.id))
        return self.env["res.users"].with_context(active_test=False).sudo().search(domain, limit=1)

    def _create_portal_user(self, login):
        self.ensure_one()
        company = self.partner_id.company_id or self.env.company
        return self.env["res.users"].sudo().with_company(company)._create_user_from_template(
            {
                "name": self.partner_id.name,
                "email": login,
                "login": login,
                "partner_id": self.partner_id.id,
                "company_id": company.id,
                "company_ids": [(6, 0, company.ids)],
            }
        )

    def action_apply(self):
        self.ensure_one()
        self._check_can_manage_passwords()
        self._validate_password()
        login = self._normalized_login()

        conflicting_user = self._find_conflicting_user(login)
        if conflicting_user:
            raise ValidationError(
                _("L'adresse %(login)s est deja utilisee par l'utilisateur %(user)s.", login=login, user=conflicting_user.name)
            )

        group_portal = self.env.ref("base.group_portal")
        group_public = self.env.ref("base.group_public")
        user = self.user_id.sudo() or self._create_portal_user(login)

        values = {
            "login": login,
            "email": login,
            "active": True,
        }
        if not user._is_internal():
            values["group_ids"] = [(4, group_portal.id), (3, group_public.id)]
        user.write(values)
        user._change_password(self.password)
        self.partner_id.sudo().write({"email": login})

        message = _("L'acces portail et le mot de passe ont ete mis a jour.")
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("Acces portail"),
                "message": message,
                "type": "success",
                "sticky": False,
                "next": {"type": "ir.actions.act_window_close"},
            },
        }
