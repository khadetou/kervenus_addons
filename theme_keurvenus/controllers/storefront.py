# -*- coding: utf-8 -*-

import re
import unicodedata
from os import getenv

from werkzeug.exceptions import NotFound

from odoo import fields, http
from odoo.http import request, route
from odoo.tools import escape_psql, html2plaintext
from odoo.addons.website.controllers.main import Website
from odoo.addons.website_sale.controllers.main import WebsiteSale


class KeurVenusWebsite(Website):
    @route()
    def index(self, **kw):
        return storefront_host("/")


class KeurVenusWebsiteSale(WebsiteSale):
    @route()
    def shop(self, page=0, category=None, search="", min_price=0.0, max_price=0.0, tags="", **post):
        path = request.httprequest.full_path.rstrip("?")
        return storefront_host(path or "/shop")

    @route()
    def product(self, product, category=None, pricelist=None, **kwargs):
        return storefront_host(product.website_url or f"/shop/{slugify(product.name, product.id)}", product)

    @route(["/shop/config/website"], type="jsonrpc", auth="user")
    def _change_website_config(self, **options):
        if not request.env.user.has_group("website.group_website_restricted_editor"):
            raise NotFound()

        response = super()._change_website_config(**options)
        current_website = request.env["website"].get_current_website()
        pagination_type = options.get("theme_keurvenus_pagination_type")
        if pagination_type in {"pagination", "infinite_scroll"}:
            current_website.write({"theme_keurvenus_pagination_type": pagination_type})
        return response


class KeurVenusStorefrontPages(http.Controller):
    @http.route(
        [
            "/about",
            "/cart",
            "/checkout",
            "/collections",
            "/collections/<path:slug>",
            "/contact",
            "/login",
            "/lookbook",
            "/portal",
            "/wishlist",
        ],
        type="http",
        auth="public",
        website=True,
        sitemap=False,
    )
    def storefront_page(self, **kwargs):
        path = request.httprequest.full_path.rstrip("?")
        return storefront_host(path or "/")


class KeurVenusStorefrontController(http.Controller):
    @http.route(
        "/api/keurvenus/storefront/config",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def config(self, **kwargs):
        return self._json({"config": self._storefront_config()})

    @http.route(
        "/api/keurvenus/storefront/products",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def products(
        self,
        page=1,
        page_size=24,
        category="",
        search="",
        attribute_values="",
        tags="",
        min_price=0.0,
        max_price=0.0,
        **kwargs,
    ):
        page = max(int(page or 1), 1)
        page_size = min(max(int(page_size or 24), 1), 96)
        Product = self._product_model()
        domain = self._product_domain()
        category_record = self._category_from_slug(category)
        if category_record:
            domain = fields.Domain.AND([domain, [("public_categ_ids", "child_of", category_record.id)]])
        search = " ".join((search or "").split())
        fuzzy_search = False
        if search:
            domain, fuzzy_search = self._product_search_domain(domain, search, category_record)
        if attribute_value_dict := self._attribute_value_dict(attribute_values or kwargs.get("attribute_values")):
            for attribute_domain in Product._get_attribute_value_domain(attribute_value_dict):
                domain = fields.Domain.AND([domain, attribute_domain])
        if tag_ids := self._tag_ids(tags):
            domain = fields.Domain.AND([domain, [("product_tag_ids", "in", tag_ids)]])
        min_price = float(min_price or 0.0)
        max_price = float(max_price or 0.0)
        if min_price:
            domain = fields.Domain.AND([domain, [("list_price", ">=", min_price)]])
        if max_price:
            domain = fields.Domain.AND([domain, [("list_price", "<=", max_price)]])
        total = Product.search_count(domain)
        products = Product.search(
            domain,
            order="website_sequence asc, id desc",
            limit=page_size,
            offset=(page - 1) * page_size,
        )

        return self._json({
            "items": [self._serialize_product(product, index) for index, product in enumerate(products)],
            "page": page,
            "page_size": page_size,
            "total": total,
            "has_more": page * page_size < total,
            "search": search,
            "fuzzy_search": fuzzy_search,
            "config": self._storefront_config(),
            "category": self._serialize_category(category_record, Product, self._product_domain()) if category_record else False,
        })

    @http.route(
        "/api/keurvenus/storefront/products/<string:slug>",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def product(self, slug, **kwargs):
        product_id = self._id_from_slug(slug)
        product = request.env["product.template"].sudo().browse(product_id).exists() if product_id else False
        if product:
            product = self._product_model().search(
                fields.Domain.AND([self._product_domain(), [("id", "=", product.id)]]),
                limit=1,
            )
        if not product:
            product = self._find_product_by_slug(slug)
        if not product:
            return self._json({"error": "Produit introuvable."}, status=404)
        return self._json({"item": self._serialize_product(product, 0)})

    @http.route(
        "/api/keurvenus/storefront/products/<string:slug>/publish",
        type="http",
        auth="user",
        methods=["POST"],
        website=True,
        csrf=False,
    )
    def publish_product(self, slug, **kwargs):
        if not request.env.user._is_internal():
            return self._json({"error": "Acces reserve aux utilisateurs internes."}, status=403)

        try:
            payload = request.get_json_data() or {}
        except ValueError:
            payload = {}
        published = bool(payload.get("published", True))
        product_id = self._id_from_slug(slug)
        product = request.env["product.template"].sudo().browse(product_id).exists() if product_id else False
        if not product:
            product = self._find_product_by_slug(slug)
        if not product:
            return self._json({"error": "Produit introuvable."}, status=404)

        product.write({"is_published": published})
        return self._json({"item": self._serialize_product(product, 0)})

    @http.route(
        "/api/keurvenus/storefront/home",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def home(self, **kwargs):
        products = self._product_model().search(
            self._product_domain(),
            order="website_sequence asc, id desc",
            limit=8,
        )
        return self._json({
            "featured_products": [
                self._serialize_product(product, index, featured=True)
                for index, product in enumerate(products)
            ],
        })

    @http.route(
        "/api/keurvenus/storefront/categories",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def categories(self, **kwargs):
        Category = request.env["product.public.category"].with_context(lang=self._lang()).sudo()
        categories = Category.search(
            request.website.website_domain(),
            order="sequence asc, id asc",
        )
        Product = self._product_model()
        product_domain = self._product_domain()
        items = []
        for category in categories:
            items.append(self._serialize_category(category, Product, product_domain))
        return self._json({"items": items})

    @http.route(
        "/api/keurvenus/storefront/filters",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def filters(self, category="", search="", **kwargs):
        Product = self._product_model()
        domain = self._product_domain()
        category_record = self._category_from_slug(category)
        if category_record:
            domain = fields.Domain.AND([domain, [("public_categ_ids", "child_of", category_record.id)]])
        search = " ".join((search or "").split())
        if search:
            domain, _fuzzy_search = self._product_search_domain(domain, search, category_record)

        products = Product.search(domain)
        prices = [price for price in products.mapped("list_price") if price is not None]
        Category = request.env["product.public.category"].with_context(lang=self._lang()).sudo()
        return self._json({
            "categories": [
                self._serialize_category(record, Product, self._product_domain())
                for record in Category.search(request.website.website_domain(), order="sequence asc, id asc")
            ],
            "tags": self._filter_tags(Product, domain),
            "attributes": self._filter_attributes(Product, domain, products),
            "price": {
                "enabled": bool(request.website.is_view_active("website_sale.filter_products_price")),
                "min": float(min(prices) if prices else 0.0),
                "max": float(max(prices) if prices else 0.0),
                "currency": self._currency(request.website.currency_id),
            },
        })

    def _product_model(self):
        return request.env["product.template"].with_context(
            website_id=request.website.id,
            lang=self._lang(),
        ).sudo()

    def _product_domain(self):
        return fields.Domain.AND([
            request.website.sale_product_domain(),
            [("type", "!=", "service")],
        ])

    def _serialize_product(self, product, index=0, featured=False):
        category = self._main_public_category(product)
        variant = product.product_variant_id or product.product_variant_ids[:1]
        summary = html2plaintext(product.description_sale or "").strip()
        category_name = category.name if category else (product.categ_id.name or "Maison")
        collection_name = (
            category.parent_id.name
            if category and category.parent_id
            else (product.categ_id.parent_id.name if product.categ_id.parent_id else "Keur Venus")
        )

        return {
            "id": product.id,
            "template_id": product.id,
            "product_id": variant.id if variant else False,
            "slug": slugify(product.name, product.id),
            "name": product.name,
            "subtitle": category_name,
            "description": product.description_sale or "",
            "description_plain": summary or category_name,
            "price": {
                "amount": float(product.list_price or 0.0),
                "currency": self._currency(product.currency_id),
            },
            "category": {
                "id": category.id if category else False,
                "slug": slugify(category.name, category.id) if category else "",
                "name": category_name,
                "parent_id": category.parent_id.id if category and category.parent_id else False,
                "parent_slug": slugify(category.parent_id.name, category.parent_id.id) if category and category.parent_id else "",
                "parent_name": collection_name,
            },
            "collection": collection_name,
            "categories": [
                {
                    "id": category_item.id,
                    "slug": slugify(category_item.name, category_item.id),
                    "name": category_item.name,
                    "parent_id": category_item.parent_id.id if category_item.parent_id else False,
                    "parent_slug": slugify(category_item.parent_id.name, category_item.parent_id.id) if category_item.parent_id else "",
                    "parent_name": category_item.parent_id.name if category_item.parent_id else "",
                }
                for category_item in product.public_categ_ids.sorted(lambda categ: (categ.parent_path or "", categ.sequence, categ.id))
            ],
            "image_url": f"/web/image/product.template/{product.id}/image_512",
            "gallery": [
                {"image_url": f"/web/image/product.template/{product.id}/image_1024"},
            ],
            "is_published": bool(product.is_published),
            "published": bool(product.is_published),
            "odoo_edit_url": backoffice_url(
                f"/odoo/action-website_sale.product_template_action_website/{product.id}"
            ),
            "free_qty": 1,
            "qty_available": 1,
            "allow_out_of_stock_order": True,
            "featured": featured or index < 8,
            "material": "Selection premium",
            "color": "Tons naturels",
            "tags": [
                {"id": tag.id, "name": tag.name, "slug": slugify(tag.name, tag.id)}
                for tag in product.product_tag_ids.filtered(lambda tag: tag.visible_to_customers)
            ],
        }

    def _serialize_category(self, category, Product, product_domain):
        if not category:
            return False
        count = Product.search_count(
            fields.Domain.AND([product_domain, [("public_categ_ids", "child_of", category.id)]])
        )
        description = html2plaintext(category.website_description or "").strip()
        parent = category.parent_id
        parent_path = (category.parent_path or "").strip("/").split("/") if category.parent_path else []
        image_url = f"/web/image/product.public.category/{category.id}/image_512"
        preview_product = Product.search(
            fields.Domain.AND(
                [
                    product_domain,
                    [
                        ("public_categ_ids", "child_of", category.id),
                        ("image_1920", "!=", False),
                    ],
                ]
            ),
            order="is_published desc, website_sequence asc, sequence asc, id desc",
            limit=1,
        )
        if preview_product:
            image_url = f"/web/image/product.template/{preview_product.id}/image_512"
        return {
            "id": category.id,
            "slug": slugify(category.name, category.id),
            "name": category.name,
            "description": description or "Une selection maison Keur Venus.",
            "image_url": image_url,
            "product_count": count,
            "count": count,
            "featured": count > 0,
            "parent_id": parent.id if parent else False,
            "parent_slug": slugify(parent.name, parent.id) if parent else "",
            "parent_name": parent.name if parent else "",
            "sequence": category.sequence,
            "depth": max(len(parent_path) - 1, 0),
            "website_url": f"/shop/category/{slugify(category.name, category.id)}",
        }

    def _currency(self, currency):
        return {
            "id": currency.id,
            "name": currency.name,
            "symbol": currency.symbol,
            "position": currency.position,
        }

    def _find_product_by_slug(self, slug):
        for product in self._product_model().search(self._product_domain(), limit=300):
            if slugify(product.name, product.id) == slug:
                return product
        return False

    def _product_search_domain(self, base_domain, search, category_record=False):
        """Mirror Odoo shop search: every typed word must match one product field."""
        exact_domain = self._product_search_exact_domain(base_domain, search)
        Product = self._product_model()
        if Product.search_count(exact_domain):
            return exact_domain, False

        fuzzy_search = self._product_fuzzy_search(search, category_record)
        if fuzzy_search and fuzzy_search.lower() != search.lower():
            fuzzy_domain = self._product_search_exact_domain(base_domain, fuzzy_search)
            if Product.search_count(fuzzy_domain):
                return fuzzy_domain, fuzzy_search

        return exact_domain, False

    def _product_search_exact_domain(self, base_domain, search):
        Product = self._product_model()
        search_fields = [
            field_name
            for field_name in (
                "name",
                "default_code",
                "variants_default_code",
                "description",
                "description_sale",
                "website_description",
                "public_categ_ids.name",
            )
            if field_name.split(".")[0] in Product._fields
        ]
        domain = fields.Domain.AND([base_domain])
        for search_term in search.split():
            term = escape_psql(search_term)
            domain = fields.Domain.AND([
                domain,
                fields.Domain.OR([
                    fields.Domain(field_name, "ilike", term)
                    for field_name in search_fields
                ]),
            ])
        return domain

    def _product_fuzzy_search(self, search, category_record=False):
        options = {
            "displayDescription": True,
            "displayDetail": False,
            "displayExtraDetail": False,
            "displayExtraLink": True,
            "displayImage": False,
            "allowFuzzy": True,
            "category": str(category_record.id) if category_record else None,
            "tags": False,
            "min_price": 0,
            "max_price": 0,
            "attribute_value_dict": {},
            "display_currency": None,
        }
        _, _, fuzzy_search = request.website._search_with_fuzzy(
            "products_only",
            search,
            limit=1,
            order="is_published desc, website_sequence asc, id desc",
            options=options,
        )
        return fuzzy_search

    def _attribute_value_dict(self, raw_values):
        if not raw_values:
            return {}
        values = re.split(r"[, ]+", raw_values) if isinstance(raw_values, str) else raw_values
        result = {}
        for value in values:
            if not value:
                continue
            try:
                attribute_id, value_id = [int(part) for part in str(value).split("-", 1)]
            except (TypeError, ValueError):
                continue
            result.setdefault(attribute_id, set()).add(value_id)
        return {attribute_id: list(value_ids) for attribute_id, value_ids in result.items()}

    def _tag_ids(self, raw_tags):
        if not raw_tags:
            return []
        raw_items = re.split(r"[, ]+", raw_tags) if isinstance(raw_tags, str) else raw_tags
        Tag = request.env["product.tag"].with_context(lang=self._lang()).sudo()
        visible_tags = Tag.search([
            ("visible_to_customers", "=", True),
            "|",
            ("website_id", "=", False),
            ("website_id", "=", request.website.id),
        ])
        ids = []
        for raw_item in raw_items:
            if not raw_item:
                continue
            if str(raw_item).isdigit():
                ids.append(int(raw_item))
            else:
                ids.extend(tag.id for tag in visible_tags if slugify(tag.name, tag.id) == raw_item)
        return ids

    def _filter_tags(self, Product, domain):
        if not request.website.is_view_active("website_sale.filter_products_tags"):
            return []
        tags = request.env["product.tag"].with_context(lang=self._lang()).sudo().search([
            ("visible_to_customers", "=", True),
            "|",
            ("website_id", "=", False),
            ("website_id", "=", request.website.id),
        ], order="sequence asc, id asc")
        return [
            {
                "id": tag.id,
                "slug": slugify(tag.name, tag.id),
                "name": tag.name,
                "count": Product.search_count(fields.Domain.AND([domain, [("product_tag_ids", "in", tag.id)]])),
            }
            for tag in tags
        ]

    def _filter_attributes(self, Product, domain, products):
        if not products:
            return []
        AttributeLine = request.env["product.template.attribute.line"].with_context(lang=self._lang()).sudo()
        lines = AttributeLine.search([
            ("product_tmpl_id", "in", products.ids),
            ("attribute_id.visibility", "=", "visible"),
        ], order="attribute_id, sequence, id")
        groups = []
        for attribute, attribute_lines in lines.grouped("attribute_id").items():
            values = attribute_lines.mapped("value_ids").sorted()
            value_items = []
            for value in values:
                value_items.append({
                    "id": value.id,
                    "slug": f"{attribute.id}-{value.id}",
                    "name": value.name,
                    "count": Product.search_count(fields.Domain.AND([
                        domain,
                        [("attribute_line_ids.value_ids", "in", value.id)],
                    ])),
                    "html_color": value.html_color or "",
                })
            if value_items:
                groups.append({
                    "id": attribute.id,
                    "name": attribute.name,
                    "display_type": attribute.display_type,
                    "values": value_items,
                })
        return groups

    def _category_from_slug(self, category):
        category_id = self._id_from_slug(category)
        if category_id:
            record = request.env["product.public.category"].sudo().browse(category_id).exists()
            if record:
                return record
        if category:
            Category = request.env["product.public.category"].with_context(lang=self._lang()).sudo()
            for record in Category.search(request.website.website_domain(), order="sequence asc, id asc"):
                if slugify(record.name, record.id) == category:
                    return record
        return False

    def _main_public_category(self, product):
        categories = product.public_categ_ids.sorted(
            lambda categ: (-(len((categ.parent_path or "").split("/"))), categ.sequence, categ.id)
        )
        return categories[:1]

    def _id_from_slug(self, slug):
        match = re.search(r"-(\d+)$", slug or "")
        return int(match.group(1)) if match else 0

    def _lang(self):
        return request.env.context.get("lang") or request.website.default_lang_id.code or "fr_FR"

    def _json(self, payload, status=200):
        return request.make_json_response(
            payload,
            headers=[("Cache-Control", "no-store")],
            status=status,
        )

    def _storefront_config(self):
        website = request.website
        pagination_type = website.theme_keurvenus_pagination_type or "pagination"
        if pagination_type not in {"pagination", "infinite_scroll"}:
            pagination_type = "pagination"
        return {
            "pagination_type": pagination_type,
            "page_size": int(website.shop_ppg or 24),
        }


def slugify(value, record_id):
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    return f"{slug or 'produit'}-{record_id}"


def storefront_host(path="/", main_object=None):
    if not main_object:
        main_object = request.website
    return request.render(
        "theme_keurvenus.storefront_host",
        {
            "storefront_url": storefront_url(path),
            "storefront_path": path,
            "main_object": main_object,
            "seo_object": main_object,
            "edit_in_backend": bool(
                main_object
                and "website_published" in main_object._fields
                and main_object._name != "website.page"
            ),
            "editable": False,
            "translatable": False,
        },
    )


def backoffice_url(path="/"):
    base_url = (
        request.env["ir.config_parameter"].sudo().get_param("web.base.url")
        or request.httprequest.host_url
    )
    base_url = base_url.rstrip("/")
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{base_url}{normalized_path}"


def storefront_url(path="/"):
    base_url = (
        getenv("KEURVENUS_STOREFRONT_URL")
        or request.env["ir.config_parameter"].sudo().get_param("theme_keurvenus.storefront_url")
        or "http://localhost:3000"
    )
    base_url = base_url.rstrip("/")
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{base_url}{normalized_path}"
