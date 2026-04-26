# -*- coding: utf-8 -*-

import json
import re
import unicodedata
from os import getenv
from urllib.parse import urlencode
from xml.sax.saxutils import escape as xml_escape

from markupsafe import Markup
from werkzeug.exceptions import NotFound

from odoo import fields, http
from odoo.http import request, route
from odoo.tools import escape_psql, html2plaintext
from odoo.addons.website.controllers.main import Website
from odoo.addons.website_sale.controllers.main import WebsiteSale


LOCAL_STOREFRONT_HOSTS = {"127.0.0.1", "localhost", "::1"}
STOREFRONT_WRAPPER_URLS = {
    "local": "http://localhost:3000",
    "production": "https://www.keurvenus.sn",
}
SEO_STATIC_ROUTES = [
    ("/", "daily", "1.0"),
    ("/shop", "daily", "0.9"),
    ("/collections", "weekly", "0.7"),
    ("/lookbook", "weekly", "0.6"),
    ("/about", "monthly", "0.5"),
    ("/contact", "monthly", "0.5"),
]
DEFAULT_SEO_KEYWORDS = [
    "Kër Venus",
    "boutique maison Dakar",
    "vaisselle Dakar",
    "verrerie Dakar",
    "cuisine Dakar",
    "maison Dakar",
    "décoration intérieure Dakar",
]
SEO_CATEGORY_TARGETS = [
    {
        "patterns": ["batteries-de-cuisine", "batterie de cuisine", "batteries de cuisine"],
        "title": "Batteries de cuisine à Dakar | Marmites, casseroles et faitouts Kër Venus",
        "description": (
            "Achetez vos batteries de cuisine à Dakar chez Kër Venus: marmites, casseroles, "
            "faitouts, ustensiles et essentiels de cuisson pour une cuisine élégante."
        ),
        "keywords": [
            "batterie de cuisine Dakar",
            "batteries de cuisine Dakar",
            "marmites Dakar",
            "casseroles Dakar",
            "faitouts Dakar",
            "ustensiles de cuisine Dakar",
        ],
    },
    {
        "patterns": ["verrerie", "verres", "tasses", "carafes"],
        "title": "Verrerie à Dakar | Verres, tasses et carafes Kër Venus",
        "description": (
            "Découvrez la verrerie Kër Venus à Dakar: verres, tasses, carafes, "
            "pichets et pièces de table pour recevoir avec élégance."
        ),
        "keywords": [
            "verrerie Dakar",
            "verres Dakar",
            "tasses Dakar",
            "carafes Dakar",
            "pichets Dakar",
            "art de la table Dakar",
        ],
    },
    {
        "patterns": ["cuisine-conservation", "conservation", "boites-a-lunch", "glacieres", "isotherme"],
        "title": "Cuisine et conservation à Dakar | Lunch box, glacières et isothermes",
        "description": (
            "Sélection cuisine et conservation à Dakar: boîtes à lunch, glacières, "
            "contenants isothermes et accessoires pratiques Kër Venus."
        ),
        "keywords": [
            "conservation cuisine Dakar",
            "lunch box Dakar",
            "glacières Dakar",
            "boîtes à lunch Dakar",
            "isotherme Dakar",
            "accessoires cuisine Dakar",
        ],
    },
    {
        "patterns": ["cuisine", "ustensiles", "rangement-organisation"],
        "title": "Cuisine à Dakar | Accessoires, rangement et ustensiles Kër Venus",
        "description": (
            "Équipez votre cuisine à Dakar avec Kër Venus: accessoires de cuisine, "
            "rangement, organisation, ustensiles et pièces pratiques au style raffiné."
        ),
        "keywords": [
            "cuisine Dakar",
            "accessoires cuisine Dakar",
            "ustensiles cuisine Dakar",
            "rangement cuisine Dakar",
            "organisation cuisine Dakar",
            "boutique cuisine Dakar",
        ],
    },
    {
        "patterns": ["maison", "poubelles", "rangement"],
        "title": "Maison à Dakar | Décoration, rangement et accessoires Kër Venus",
        "description": (
            "Découvrez l’univers maison Kër Venus à Dakar: décoration intérieure, "
            "rangement, poubelles à pédale et accessoires pour un quotidien plus élégant."
        ),
        "keywords": [
            "maison Dakar",
            "accessoires maison Dakar",
            "décoration intérieure Dakar",
            "rangement maison Dakar",
            "poubelles à pédale Dakar",
            "boutique maison Dakar",
        ],
    },
]


class KeurVenusWebsite(Website):
    @route()
    def index(self, **kw):
        return storefront_host("/")

    @route()
    def robots(self, **kwargs):
        return build_robots_response()

    @route()
    def sitemap_xml_index(self, **kwargs):
        return build_sitemap_response()


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
        variant = self._default_variant(product)
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
            "image_url": self._product_image_url(variant or product, "image_512"),
            "gallery": self._serialize_product_images(variant or product),
            "variants": self._serialize_product_variants(product),
            "variant_options": self._serialize_variant_options(product),
            "selected_combination": self._serialize_selected_combination(variant),
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

    def _default_variant(self, product):
        variant_id = product._get_first_possible_variant_id()
        variant = request.env["product.product"].sudo().browse(variant_id).exists() if variant_id else False
        if product.valid_product_template_attribute_line_ids:
            return (
                variant.filtered("product_template_attribute_value_ids")
                or product.product_variant_ids.filtered("product_template_attribute_value_ids")[:1]
                or variant
                or product.product_variant_id
                or product.product_variant_ids[:1]
            )
        return variant or product.product_variant_id or product.product_variant_ids[:1]

    def _serialize_product_variants(self, product):
        variants = product.product_variant_ids.filtered(lambda variant: variant.active)
        if product.valid_product_template_attribute_line_ids:
            variants = variants.filtered("product_template_attribute_value_ids")
        variants = variants.sorted(
            lambda variant: (variant.default_code or "", variant.id)
        )
        return [self._serialize_variant(product, variant) for variant in variants]

    def _serialize_variant(self, product, variant):
        combination_info = variant._get_combination_info_variant()
        currency = combination_info.get("currency") or product.currency_id
        attribute_values = variant.product_template_attribute_value_ids.sorted(
            lambda value: (
                value.attribute_id.sequence,
                value.attribute_id.id,
                value.product_attribute_value_id.sequence,
                value.id,
            )
        )
        price = float(combination_info.get("price") or variant.lst_price or product.list_price or 0.0)
        list_price = float(combination_info.get("list_price") or price)
        compare_price = list_price if combination_info.get("has_discounted_price") and list_price > price else 0.0
        free_qty = float(combination_info.get("free_qty") or 0.0)

        return {
            "id": variant.id,
            "template_id": product.id,
            "product_id": variant.id,
            "name": variant.with_context(display_default_code=False).display_name,
            "display_name": combination_info.get("display_name") or variant.display_name,
            "default_code": variant.default_code or "",
            "attribute_value_ids": attribute_values.ids,
            "attribute_values": [
                self._serialize_variant_value(value)
                for value in attribute_values
            ],
            "price": {
                "amount": price,
                "compare_amount": compare_price,
                "discounted": bool(compare_price),
                "currency": self._currency(currency),
            },
            "image_url": self._product_image_url(variant, "image_512"),
            "gallery": self._serialize_product_images(variant),
            "is_combination_possible": bool(combination_info.get("is_combination_possible", True)),
            "free_qty": free_qty,
            "qty_available": free_qty,
            "allow_out_of_stock_order": bool(combination_info.get("allow_out_of_stock_order", True)),
        }

    def _serialize_variant_options(self, product):
        lines = product.valid_product_template_attribute_line_ids.sorted(
            lambda line: (line.attribute_id.sequence, line.attribute_id.id, line.sequence, line.id)
        )
        variant_records = product.product_variant_ids.filtered(lambda variant: variant.active)
        groups = []
        for line in lines:
            attribute = line.attribute_id
            values = line.product_template_value_ids.sorted(
                lambda value: (value.product_attribute_value_id.sequence, value.id)
            )
            value_items = []
            for value in values:
                variant_ids = [
                    variant.id
                    for variant in variant_records
                    if value in variant.product_template_attribute_value_ids
                ]
                value_items.append({
                    **self._serialize_variant_value(value),
                    "variant_ids": variant_ids,
                })
            if value_items:
                groups.append({
                    "id": attribute.id,
                    "name": attribute.name,
                    "display_type": attribute.display_type,
                    "values": value_items,
                })
        return groups

    def _serialize_variant_value(self, value):
        attribute_value = value.product_attribute_value_id
        return {
            "id": value.id,
            "attribute_id": value.attribute_id.id,
            "attribute_name": value.attribute_id.name,
            "name": value.name,
            "display_type": value.display_type,
            "html_color": value.html_color or "",
            "image_url": (
                f"/web/image/product.attribute.value/{attribute_value.id}/image"
                if getattr(attribute_value, "image", False)
                else ""
            ),
            "price_extra": float(value.price_extra or 0.0),
        }

    def _serialize_selected_combination(self, variant):
        if not variant:
            return False
        values = variant.product_template_attribute_value_ids.sorted(
            lambda value: (
                value.attribute_id.sequence,
                value.attribute_id.id,
                value.product_attribute_value_id.sequence,
                value.id,
            )
        )
        return {
            "template_id": variant.product_tmpl_id.id,
            "product_id": variant.id,
            "attribute_value_ids": values.ids,
            "attribute_summary": values._get_combination_name(),
        }

    def _serialize_product_images(self, product_or_variant):
        images = []
        seen = set()
        for image_record in self._product_gallery_records(product_or_variant):
            key = (image_record._name, image_record.id)
            if key in seen:
                continue
            seen.add(key)
            images.append({
                "id": image_record.id,
                "model": image_record._name,
                "image_url": self._product_image_url(image_record, "image_1024"),
            })
        return images

    def _product_gallery_records(self, product_or_variant):
        if (
            product_or_variant._name == "product.product"
            and product_or_variant.product_variant_image_ids
        ):
            return [product_or_variant] + list(product_or_variant.product_variant_image_ids)
        return product_or_variant._get_images()

    def _product_image_url(self, record, size):
        return f"/web/image/{record._name}/{record.id}/{size}"

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


class KeurVenusSeoController(http.Controller):
    @http.route("/robots.txt", type="http", auth="public", website=True, multilang=False, sitemap=False)
    def robots(self, **kwargs):
        return build_robots_response()

    @http.route("/sitemap.xml", type="http", auth="public", website=True, multilang=False, sitemap=False)
    def sitemap(self, **kwargs):
        return build_sitemap_response()

    def _build_sitemap(self):
        urls = []
        for path, changefreq, priority in SEO_STATIC_ROUTES:
            urls.append(self._sitemap_entry(path, changefreq=changefreq, priority=priority))

        Product = request.env["product.template"].sudo()
        product_domain = fields.Domain.AND([
            request.website.sale_product_domain(),
            [("type", "!=", "service")],
        ])

        Category = request.env["product.public.category"].with_context(lang=_lang()).sudo()
        categories = Category.search(request.website.website_domain(), order="sequence asc, id asc")
        for category in categories:
            count = Product.search_count(
                fields.Domain.AND([product_domain, [("public_categ_ids", "child_of", category.id)]])
            )
            if count <= 0:
                continue
            path = f"/shop?{urlencode({'category': slugify(category.name, category.id)})}"
            _title, _description, keywords = category_seo_content(category)
            urls.append(
                self._sitemap_entry(
                    path,
                    lastmod=category.write_date,
                    changefreq="weekly",
                    priority="0.85" if has_target_keyword(keywords) else "0.7",
                    images=[
                        absolute_storefront_asset_url(
                            f"/web/image/product.public.category/{category.id}/image_512"
                        )
                    ],
                )
            )

        products = Product.with_context(lang=_lang()).search(
            product_domain,
            order="website_sequence asc, write_date desc, id desc",
        )
        storefront_api = KeurVenusStorefrontController()
        for product in products:
            variant = storefront_api._default_variant(product)
            image_records = storefront_api._product_gallery_records(variant or product)
            images = [
                absolute_storefront_asset_url(storefront_api._product_image_url(image_record, "image_1024"))
                for image_record in image_records[:6]
            ]
            urls.append(
                self._sitemap_entry(
                    f"/shop/{slugify(product.name, product.id)}",
                    lastmod=product.write_date,
                    changefreq="weekly",
                    priority="0.8",
                    images=images,
                )
            )

        return "\n".join([
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
            *urls,
            "</urlset>",
            "",
        ])

    def _sitemap_entry(self, path, lastmod=None, changefreq="weekly", priority="0.5", images=None):
        parts = [
            "  <url>",
            f"    <loc>{xml_escape(absolute_storefront_url(path))}</loc>",
        ]
        if lastmod:
            parts.append(f"    <lastmod>{fields.Date.to_string(lastmod)}</lastmod>")
        parts.extend([
            f"    <changefreq>{changefreq}</changefreq>",
            f"    <priority>{priority}</priority>",
        ])
        for image_url in images or []:
            parts.extend([
                "    <image:image>",
                f"      <image:loc>{xml_escape(image_url)}</image:loc>",
                "    </image:image>",
            ])
        parts.append("  </url>")
        return "\n".join(parts)


def slugify(value, record_id):
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    return f"{slug or 'produit'}-{record_id}"


def build_robots_response():
    sitemap_url = f"{public_storefront_base_url()}/sitemap.xml"
    content = "\n".join([
        "User-agent: *",
        "Allow: /",
        "Allow: /odoo/web/image/",
        "Disallow: /api/",
        "Disallow: /odoo/",
        "Disallow: /cart",
        "Disallow: /checkout",
        "Disallow: /login",
        "Disallow: /portal",
        "Disallow: /wishlist",
        f"Sitemap: {sitemap_url}",
        "",
    ])
    return request.make_response(
        content,
        headers=[
            ("Content-Type", "text/plain; charset=utf-8"),
            ("Cache-Control", "public, max-age=3600"),
        ],
    )


def build_sitemap_response():
    content = KeurVenusSeoController()._build_sitemap()
    return request.make_response(
        content,
        headers=[
            ("Content-Type", "application/xml; charset=utf-8"),
            ("Cache-Control", "public, max-age=3600"),
        ],
    )


def storefront_host(path="/", main_object=None):
    if not main_object:
        main_object = request.website
    seo = storefront_seo_values(path, main_object)
    return request.render(
        "theme_keurvenus.storefront_host",
        {
            "storefront_url": storefront_url(path),
            "storefront_path": path,
            "main_object": main_object,
            "seo_object": main_object,
            **seo,
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
    base_url = storefront_base_url()
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{base_url.rstrip('/')}{normalized_path}"


def storefront_base_url():
    override_url = getenv("KEURVENUS_STOREFRONT_URL")
    if override_url:
        return override_url

    environment = "local" if is_local_storefront_request() else "production"
    return STOREFRONT_WRAPPER_URLS[environment]


def public_storefront_base_url():
    return (getenv("KEURVENUS_PUBLIC_URL") or STOREFRONT_WRAPPER_URLS["production"]).rstrip("/")


def absolute_storefront_url(path="/"):
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{public_storefront_base_url()}{normalized_path}"


def absolute_storefront_asset_url(path=""):
    if not path:
        return absolute_storefront_url("/LOGO.svg")
    if path.startswith(("http://", "https://")):
        return path
    if path.startswith("/odoo/"):
        return absolute_storefront_url(path)
    if path.startswith("/web/"):
        return absolute_storefront_url(f"/odoo{path}")
    return absolute_storefront_url(path)


def storefront_seo_values(path, main_object):
    title = "Kër Venus | Maison, décoration et art de vivre à Dakar"
    description = (
        "Boutique Kër Venus à Dakar: vaisselle, verrerie, accessoires de cuisine, "
        "batteries de cuisine, décoration intérieure et pièces maison."
    )
    keywords = list(DEFAULT_SEO_KEYWORDS)
    image_url = absolute_storefront_url("/LOGO.svg")
    structured_data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Kër Venus",
        "url": public_storefront_base_url(),
        "logo": image_url,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Dakar",
            "addressCountry": "SN",
        },
    }

    category = storefront_category_from_path(path)
    if category:
        title, description, keywords = category_seo_content(category)
        image_url = absolute_storefront_asset_url(f"/web/image/product.public.category/{category.id}/image_512")
        structured_data = collection_page_schema(category.name, description, path)
    elif (path or "").split("?", 1)[0].rstrip("/") == "/shop":
        title = "Boutique Kër Venus | Vaisselle, verrerie, cuisine et maison à Dakar"
        structured_data = collection_page_schema("Boutique Kër Venus", description, "/shop")

    if main_object and main_object._name == "product.template":
        product = main_object.sudo().with_context(lang=_lang())
        summary = html2plaintext(
            product.website_meta_description
            or product.description_ecommerce
            or product.description_sale
            or ""
        ).strip()
        description = short_text(summary or f"{product.name}, sélection maison Kër Venus disponible à Dakar.")
        title = product.website_meta_title or f"{product.name} | Kër Venus"
        category = KeurVenusStorefrontController()._main_public_category(product)
        category_name = category.name if category else product.categ_id.name
        product_keywords = [
            product.name,
            f"{product.name} Dakar",
            f"{category_name} Dakar" if category_name else "",
            *(product.website_meta_keywords or "").split(","),
        ]
        keywords = unique_keywords(product_keywords + DEFAULT_SEO_KEYWORDS)
        variant = KeurVenusStorefrontController()._default_variant(product)
        image_url = absolute_storefront_asset_url(
            KeurVenusStorefrontController()._product_image_url(variant or product, "image_1024")
        )
        product_url = absolute_storefront_url(product.website_url or f"/shop/{slugify(product.name, product.id)}")
        structured_data = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": description,
            "image": [image_url],
            "brand": {"@type": "Brand", "name": "Kër Venus"},
            "category": category_name or "",
            "url": product_url,
            "offers": {
                "@type": "Offer",
                "url": product_url,
                "priceCurrency": product.currency_id.name or "XOF",
                "price": float(product.list_price or 0.0),
                "availability": "https://schema.org/InStock",
                "itemCondition": "https://schema.org/NewCondition",
            },
        }

    return {
        "seo_title": title,
        "seo_description": description,
        "seo_keywords": ", ".join(unique_keywords(keywords)),
        "seo_canonical_url": absolute_storefront_url(path),
        "seo_image_url": image_url,
        "seo_json_ld": Markup(json.dumps(structured_data, ensure_ascii=False)),
    }


def storefront_category_from_path(path):
    if not (path or "").split("?", 1)[0].rstrip("/") == "/shop":
        return False
    slug = request.httprequest.args.get("category")
    if not slug:
        return False
    return KeurVenusStorefrontController()._category_from_slug(slug)


def category_seo_content(category):
    slug = slugify(category.name, category.id)
    key = f"{category.name} {slug}".lower()
    target = next(
        (
            item
            for item in SEO_CATEGORY_TARGETS
            if any(pattern in key for pattern in item["patterns"])
        ),
        None,
    )
    if target:
        return target["title"], target["description"], unique_keywords(target["keywords"] + DEFAULT_SEO_KEYWORDS)

    description = short_text(
        html2plaintext(category.website_description or "").strip()
        or f"Découvrez la sélection {category.name} Kër Venus à Dakar: maison, cuisine, vaisselle et décoration intérieure."
    )
    keywords = unique_keywords([
        f"{category.name} Dakar",
        f"acheter {category.name} Dakar",
        "Kër Venus Dakar",
        *DEFAULT_SEO_KEYWORDS,
    ])
    return f"{category.name} à Dakar | Boutique Kër Venus", description, keywords


def collection_page_schema(name, description, path):
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": name,
        "description": description,
        "url": absolute_storefront_url(path),
        "isPartOf": {
            "@type": "WebSite",
            "name": "Kër Venus",
            "url": public_storefront_base_url(),
        },
        "publisher": {
            "@type": "Organization",
            "name": "Kër Venus",
            "url": public_storefront_base_url(),
            "logo": absolute_storefront_url("/LOGO.svg"),
        },
    }


def unique_keywords(values):
    seen = set()
    result = []
    for value in values:
        value = " ".join((value or "").split())
        if not value:
            continue
        key = value.lower()
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result


def has_target_keyword(keywords):
    joined = " ".join(keywords).lower()
    return any(
        target in joined
        for target in ("verrerie", "cuisine", "maison", "batterie")
    )


def short_text(value, limit=155):
    text = " ".join((value or "").split())
    if len(text) <= limit:
        return text
    return f"{text[:limit - 1].strip()}…"


def _lang():
    return request.env.context.get("lang") or request.website.default_lang_id.code or "fr_FR"


def is_local_storefront_request():
    host = request.httprequest.host.split(":", 1)[0].strip("[]").lower()
    forwarded_host = (request.httprequest.headers.get("X-Forwarded-Host") or "").split(",", 1)[0]
    forwarded_host = forwarded_host.split(":", 1)[0].strip("[]").lower()
    return host in LOCAL_STOREFRONT_HOSTS or forwarded_host in LOCAL_STOREFRONT_HOSTS
