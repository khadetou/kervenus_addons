from odoo import api, fields, models
from odoo.tools import html2plaintext as _html2plaintext
def html2plaintext(html):
    if isinstance(html, dict): html = next(iter(html.values())) if html else ""
    return _html2plaintext(html)


THEME_KEURVENUS_HOMEPAGE_ARCH = """
<t name="Homepage" t-name="website.homepage">
    <t t-call="website.layout" pageName.f="homepage">
        <t t-call="theme_keurvenus.theme_keurvenus_homepage_content"/>
    </t>
</t>
""".strip()

KV_CATEGORY_FALLBACK_IMAGES = (
    "/theme_keurvenus/static/src/img/keurvenus/coffee-table.jpg",
    "/theme_keurvenus/static/src/img/keurvenus/hero-living.jpg",
    "/theme_keurvenus/static/src/img/keurvenus/bedroom-linen.jpg",
    "/theme_keurvenus/static/src/img/keurvenus/wellness-diffuser.jpg",
    "/theme_keurvenus/static/src/img/keurvenus/gift-edit.jpg",
    "/theme_keurvenus/static/src/img/keurvenus/plate-showcase.jpg",
)

KV_PRODUCT_FALLBACK_IMAGES = (
    "/theme_keurvenus/static/src/img/keurvenus/aurora-set.jpg",
    "/theme_keurvenus/static/src/img/keurvenus/linen-calm.jpg",
    "/theme_keurvenus/static/src/img/keurvenus/plate-showcase.jpg",
    "/theme_keurvenus/static/src/img/keurvenus/mugs-aura.jpg",
)


class Website(models.Model):
    _inherit = "website"

    theme_keurvenus_pagination_type = fields.Selection(
        [
            ("pagination", "Pagination normale"),
            ("infinite_scroll", "Scroll infini"),
        ],
        string="Type de pagination Kër Venus",
        default="pagination",
        required=True,
    )

    def _theme_keurvenus_get_homepage_products(self, limit=4):
        self.ensure_one()
        Product = self.env["product.template"].with_context(website_id=self.id).sudo()
        base_domain = fields.Domain.AND([self.sale_product_domain(), [("type", "!=", "service")]])
        products = Product.search(
            fields.Domain.AND([base_domain, [("image_1920", "!=", False)]]),
            order="website_sequence asc, id desc",
            limit=limit,
        )
        if len(products) < limit:
            products |= Product.search(
                fields.Domain.AND([base_domain, [("id", "not in", products.ids)]]),
                order="website_sequence asc, id desc",
                limit=limit - len(products),
            )
        return products[:limit]

    def _theme_keurvenus_get_homepage_product_cards(self, limit=4):
        self.ensure_one()
        product_cards = []
        for index, product in enumerate(self._theme_keurvenus_get_homepage_products(limit=limit)):
            categories = product.public_categ_ids.sorted(lambda categ: (categ.sequence, categ.id))
            category = categories[:1]
            image_url = (
                f"/web/image/product.template/{product.id}/image_1024"
                if product.image_1920
                else KV_PRODUCT_FALLBACK_IMAGES[index % len(KV_PRODUCT_FALLBACK_IMAGES)]
            )
            summary = html2plaintext(product.description_sale or "").strip()
            product_cards.append({
                "product": product,
                "category": category,
                "variant_id": product._get_first_possible_variant_id(),
                "image_url": image_url,
                "summary": (summary[:96] if summary else (category.name if category else self.env._("Selection maison"))),
            })
        return product_cards

    def _theme_keurvenus_get_homepage_category_cards(self, limit=6):
        self.ensure_one()
        Product = self.env["product.template"].with_context(website_id=self.id).sudo()
        Category = self.env["product.public.category"].with_context(website_id=self.id).sudo()
        product_domain = fields.Domain.AND([self.sale_product_domain(), [("type", "!=", "service")]])
        categories = Category.search(
            fields.Domain.AND([self.website_domain(), [("has_published_products", "=", True)]]),
            order="sequence asc, id asc",
            limit=max(limit * 3, limit),
        )

        category_cards = []
        for category in categories:
            count_domain = fields.Domain.AND([product_domain, [("public_categ_ids", "child_of", category.id)]])
            published_count = Product.search_count(count_domain)
            if not published_count:
                continue

            preview_product = Product.search(
                fields.Domain.AND([count_domain, [("image_1920", "!=", False)]]),
                order="website_sequence asc, id desc",
                limit=1,
            )
            image_url = (
                f"/web/image/product.public.category/{category.id}/image_1024"
                if category.image_1920
                else (
                    f"/web/image/product.template/{preview_product.id}/image_1024"
                    if preview_product
                    else KV_CATEGORY_FALLBACK_IMAGES[len(category_cards) % len(KV_CATEGORY_FALLBACK_IMAGES)]
                )
            )
            category_cards.append({
                "category": category,
                "count": published_count,
                "eyebrow": category.parent_id.name if category.parent_id else self.env._("Collection maison"),
                "image_url": image_url,
            })
            if len(category_cards) >= limit:
                break
        return category_cards

    def _theme_keurvenus_get_homepage_product_filters(self, product_cards=None, category_cards=None, limit=3):
        self.ensure_one()
        categories = []
        for product_card in product_cards or []:
            category = product_card.get("category")
            if category:
                categories.append(category)
        if not categories:
            for category_card in category_cards or []:
                category = category_card.get("category")
                if category:
                    categories.append(category)

        filters = []
        seen_category_ids = set()
        for category in categories:
            if category.id in seen_category_ids or not category.has_published_products:
                continue
            seen_category_ids.add(category.id)
            filters.append(category)
            if len(filters) >= limit:
                break
        return filters

    @api.model
    def _theme_keurvenus_apply_homepage(self):
        homepage_views = self.env["website.page"].sudo().search([
            ("url", "=", "/"),
            ("view_id.key", "=", "website.homepage"),
        ]).mapped("view_id")
        base_homepage = self.env.ref("website.homepage", raise_if_not_found=False)
        views = (homepage_views | base_homepage).filtered(lambda view: view.type == "qweb")
        for view in views:
            view.write({"arch_db": THEME_KEURVENUS_HOMEPAGE_ARCH})
        return True
