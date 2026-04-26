from odoo.tests import TransactionCase, tagged


@tagged("post_install", "-at_install")
class TestContactCustomerSupplierFilter(TransactionCase):
    def test_partner_role_updates_ranks(self):
        partner = self.env["res.partner"].create({"name": "Partner Type Test"})

        self.assertFalse(partner.partner_role)

        partner.partner_role = "customer"
        self.assertEqual(partner.partner_role, "customer")
        self.assertGreater(partner.customer_rank, 0)
        self.assertEqual(partner.supplier_rank, 0)

        partner.partner_role = "supplier"
        self.assertEqual(partner.partner_role, "supplier")
        self.assertEqual(partner.customer_rank, 0)
        self.assertGreater(partner.supplier_rank, 0)

        partner.partner_role = "both"
        self.assertEqual(partner.partner_role, "both")
        self.assertGreater(partner.customer_rank, 0)
        self.assertGreater(partner.supplier_rank, 0)

    def test_search_mode_keeps_default_partner_type(self):
        customer = self.env["res.partner"].with_context(
            res_partner_search_mode="customer"
        ).create({"name": "Customer Partner"})
        supplier = self.env["res.partner"].with_context(
            res_partner_search_mode="supplier"
        ).create({"name": "Supplier Partner"})

        self.assertEqual(customer.partner_role, "customer")
        self.assertEqual(supplier.partner_role, "supplier")

    def test_sale_and_purchase_partner_fields_have_expected_domain(self):
        self.assertEqual(
            self.env["sale.order"]._fields["partner_id"].domain,
            "[('customer_rank', '>', 0)]",
        )
        self.assertEqual(
            self.env["purchase.order"]._fields["partner_id"].domain,
            "[('supplier_rank', '>', 0)]",
        )
