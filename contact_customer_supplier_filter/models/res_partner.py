from odoo import api, fields, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    partner_role = fields.Selection(
        selection=[
            ("customer", "Client"),
            ("supplier", "Fournisseur"),
            ("both", "Client et fournisseur"),
        ],
        string="Type de partenaire",
        compute="_compute_partner_role",
        inverse="_inverse_partner_role",
        help="Permet de definir rapidement si ce contact est un client, un fournisseur ou les deux.",
    )

    @api.depends("customer_rank", "supplier_rank")
    def _compute_partner_role(self):
        for partner in self:
            is_customer = partner.customer_rank > 0
            is_supplier = partner.supplier_rank > 0
            if is_customer and is_supplier:
                partner.partner_role = "both"
            elif is_customer:
                partner.partner_role = "customer"
            elif is_supplier:
                partner.partner_role = "supplier"
            else:
                partner.partner_role = False

    def _inverse_partner_role(self):
        for partner in self:
            vals = {}
            if partner.partner_role == "customer":
                if partner.customer_rank <= 0:
                    vals["customer_rank"] = 1
                if partner.supplier_rank:
                    vals["supplier_rank"] = 0
            elif partner.partner_role == "supplier":
                if partner.supplier_rank <= 0:
                    vals["supplier_rank"] = 1
                if partner.customer_rank:
                    vals["customer_rank"] = 0
            elif partner.partner_role == "both":
                if partner.customer_rank <= 0:
                    vals["customer_rank"] = 1
                if partner.supplier_rank <= 0:
                    vals["supplier_rank"] = 1
            else:
                vals = {
                    "customer_rank": 0,
                    "supplier_rank": 0,
                }
            if vals:
                partner.write(vals)
