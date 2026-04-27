# -*- coding: utf-8 -*-

import json
import re
import unicodedata
from os import getenv
from urllib.parse import parse_qs, urlencode
from xml.sax.saxutils import escape as xml_escape

from markupsafe import Markup
from werkzeug.exceptions import NotFound

from odoo import fields, http
from odoo.exceptions import UserError, ValidationError
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
        return storefront_host("/", storefront_main_object_for_path("/"))

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
        return storefront_host(path or "/shop", storefront_main_object_for_path(path or "/shop"))

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
            "/portal/invoices",
            "/portal/invoices/<int:document_id>",
            "/portal/orders",
            "/portal/orders/<int:document_id>",
            "/portal/quotes",
            "/portal/quotes/<int:document_id>",
            "/register",
            "/reset-password",
            "/wishlist",
        ],
        type="http",
        auth="public",
        website=True,
        sitemap=False,
    )
    def storefront_page(self, **kwargs):
        path = request.httprequest.full_path.rstrip("?")
        return storefront_host(path or "/", storefront_main_object_for_path(path or "/"))


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
        "/api/keurvenus/storefront/seo",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def seo(self, path="/", **kwargs):
        path = path or "/"
        main_object = storefront_main_object_for_path(path)
        return self._json({"seo": seo_payload(path, main_object)})

    @http.route(
        "/api/keurvenus/storefront/auth/signup",
        type="http",
        auth="public",
        methods=["POST"],
        website=True,
        csrf=False,
    )
    def auth_signup(self, **kwargs):
        payload = self._json_payload()
        name = " ".join((payload.get("name") or "").split())
        login = " ".join((payload.get("login") or payload.get("email") or "").split()).lower()
        password = payload.get("password") or ""
        confirm_password = payload.get("confirm_password") or ""

        if request.env["res.users"].sudo()._get_signup_invitation_scope() != "b2c":
            return self._json({"error": "La creation de compte public n'est pas activee."}, status=403)
        if not name or not login or not password:
            return self._json({"error": "Nom, e-mail et mot de passe sont requis."}, status=400)
        if password != confirm_password:
            return self._json({"error": "Les mots de passe ne correspondent pas."}, status=400)
        if len(password.strip()) < 8:
            return self._json({"error": "Le mot de passe doit contenir au moins 8 caracteres."}, status=400)

        try:
            login, password = request.env["res.users"].sudo().signup({
                "name": name,
                "login": login,
                "email": login,
                "password": password,
            })
            credential = {"login": login, "password": password, "type": "password"}
            request.session.authenticate(request.env, credential)
            request.env.cr.commit()
        except Exception as exc:
            message = str(exc)
            if request.env["res.users"].sudo().with_context(active_test=False).search_count([("login", "=", login)], limit=1):
                message = "Un compte existe deja avec cette adresse e-mail."
            return self._json({"error": message or "Impossible de creer le compte."}, status=400)

        return self._json({"ok": True, "redirect_url": payload.get("redirect") or "/portal"})

    @http.route(
        "/api/keurvenus/storefront/auth/reset-password",
        type="http",
        auth="public",
        methods=["POST"],
        website=True,
        csrf=False,
    )
    def auth_reset_password(self, **kwargs):
        payload = self._json_payload()
        login = " ".join((payload.get("login") or payload.get("email") or "").split()).lower()
        if not login:
            return self._json({"error": "Adresse e-mail requise."}, status=400)

        reset_enabled = request.env["ir.config_parameter"].sudo().get_param("auth_signup.reset_password") == "True"
        if not reset_enabled:
            return self._json({"error": "La reinitialisation du mot de passe n'est pas activee."}, status=403)

        try:
            request.env["res.users"].sudo().reset_password(login)
        except UserError as exc:
            return self._json({"error": str(exc)}, status=400)
        except Exception as exc:
            if "No account found" not in str(exc):
                return self._json({"error": str(exc) or "Impossible d'envoyer l'e-mail de reinitialisation."}, status=400)

        return self._json({
            "ok": True,
            "message": "Si un compte existe pour cette adresse, un lien de reinitialisation a ete envoye.",
        })

    @http.route(
        "/api/keurvenus/storefront/auth/reset-password/confirm",
        type="http",
        auth="public",
        methods=["POST"],
        website=True,
        csrf=False,
    )
    def auth_reset_password_confirm(self, **kwargs):
        payload = self._json_payload()
        token = payload.get("token") or ""
        password = payload.get("password") or ""
        confirm_password = payload.get("confirm_password") or ""
        if not token:
            return self._json({"error": "Le lien de reinitialisation est invalide."}, status=400)
        if password != confirm_password:
            return self._json({"error": "Les mots de passe ne correspondent pas."}, status=400)
        if len(password.strip()) < 8:
            return self._json({"error": "Le mot de passe doit contenir au moins 8 caracteres."}, status=400)

        try:
            request.env["res.users"].sudo().signup({"password": password}, token)
            request.env.cr.commit()
        except Exception as exc:
            return self._json({"error": str(exc) or "Impossible de mettre a jour le mot de passe."}, status=400)

        return self._json({"ok": True, "message": "Votre mot de passe a ete reinitialise."})

    @http.route(
        "/api/keurvenus/storefront/portal",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def portal_dashboard(self, **kwargs):
        if request.env.user._is_public():
            return self._json({"error": "Veuillez vous connecter."}, status=401)

        partner = self._portal_partner()
        quotes = self._portal_sale_orders(partner, ("draft", "sent"), limit=6)
        orders = self._portal_sale_orders(partner, ("sale", "done"), limit=6)
        invoices = self._portal_invoices(partner, limit=6)
        overdue_domain = fields.Domain.AND([
            self._portal_invoice_domain(partner),
            [
                ("invoice_date_due", "<", fields.Date.today()),
                ("payment_state", "not in", ("paid", "in_payment")),
            ],
        ])

        return self._json({
            "session": self._serialize_portal_session(partner),
            "profile": {
                "name": request.env.user.name,
                "login": request.env.user.login,
                "partner": self._serialize_partner(partner),
            },
            "counters": {
                "quotes": request.env["sale.order"].sudo().search_count(self._portal_sale_order_domain(partner, ("draft", "sent"))),
                "orders": request.env["sale.order"].sudo().search_count(self._portal_sale_order_domain(partner, ("sale", "done"))),
                "invoices": request.env["account.move"].sudo().search_count(self._portal_invoice_domain(partner)),
                "overdue_invoices": request.env["account.move"].sudo().search_count(overdue_domain),
                "wishlist": self._portal_wishlist_count(partner),
                "addresses": request.env["res.partner"].sudo().search_count([("id", "child_of", partner.commercial_partner_id.id)]),
            },
            "recent_quotes": [self._serialize_sale_document(order, "quote") for order in quotes],
            "recent_orders": [self._serialize_sale_document(order, "order") for order in orders],
            "recent_invoices": [self._serialize_invoice_document(invoice) for invoice in invoices],
        })

    @http.route(
        "/api/keurvenus/storefront/portal/orders",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def portal_orders(self, page=1, page_size=12, **kwargs):
        if request.env.user._is_public():
            return self._json({"error": "Veuillez vous connecter."}, status=401)
        partner = self._portal_partner()
        orders = self._portal_sale_orders(partner, ("sale", "done"), page=page, page_size=page_size)
        return self._json({"items": [self._serialize_sale_document(order, "order") for order in orders]})

    @http.route(
        "/api/keurvenus/storefront/portal/orders/<int:order_id>",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def portal_order_detail(self, order_id, **kwargs):
        if request.env.user._is_public():
            return self._json({"error": "Veuillez vous connecter."}, status=401)
        partner = self._portal_partner()
        order = request.env["sale.order"].sudo().search(
            fields.Domain.AND([self._portal_sale_order_domain(partner, ("sale", "done")), [("id", "=", order_id)]]),
            limit=1,
        )
        if not order:
            return self._json({"error": "Commande introuvable."}, status=404)
        return self._json({"item": self._serialize_sale_document(order, "order", detailed=True)})

    @http.route(
        "/api/keurvenus/storefront/portal/quotes",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def portal_quotes(self, page=1, page_size=12, **kwargs):
        if request.env.user._is_public():
            return self._json({"error": "Veuillez vous connecter."}, status=401)
        partner = self._portal_partner()
        quotes = self._portal_sale_orders(partner, ("draft", "sent"), page=page, page_size=page_size)
        return self._json({"items": [self._serialize_sale_document(order, "quote") for order in quotes]})

    @http.route(
        "/api/keurvenus/storefront/portal/quotes/<int:order_id>",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def portal_quote_detail(self, order_id, **kwargs):
        if request.env.user._is_public():
            return self._json({"error": "Veuillez vous connecter."}, status=401)
        partner = self._portal_partner()
        order = request.env["sale.order"].sudo().search(
            fields.Domain.AND([self._portal_sale_order_domain(partner, ("draft", "sent")), [("id", "=", order_id)]]),
            limit=1,
        )
        if not order:
            return self._json({"error": "Devis introuvable."}, status=404)
        return self._json({"item": self._serialize_sale_document(order, "quote", detailed=True)})

    @http.route(
        "/api/keurvenus/storefront/portal/invoices",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def portal_invoices(self, page=1, page_size=12, **kwargs):
        if request.env.user._is_public():
            return self._json({"error": "Veuillez vous connecter."}, status=401)
        partner = self._portal_partner()
        invoices = self._portal_invoices(partner, page=page, page_size=page_size)
        return self._json({"items": [self._serialize_invoice_document(invoice) for invoice in invoices]})

    @http.route(
        "/api/keurvenus/storefront/portal/invoices/<int:invoice_id>",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def portal_invoice_detail(self, invoice_id, **kwargs):
        if request.env.user._is_public():
            return self._json({"error": "Veuillez vous connecter."}, status=401)
        partner = self._portal_partner()
        invoice = request.env["account.move"].sudo().search(
            fields.Domain.AND([self._portal_invoice_domain(partner), [("id", "=", invoice_id)]]),
            limit=1,
        )
        if not invoice:
            return self._json({"error": "Facture introuvable."}, status=404)
        return self._json({"item": self._serialize_invoice_document(invoice, detailed=True)})

    @http.route(
        "/api/keurvenus/storefront/cart",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def cart(self, **kwargs):
        return self._json({"cart": self._serialize_cart(request.cart)})

    @http.route(
        "/api/keurvenus/storefront/cart/add",
        type="http",
        auth="public",
        methods=["POST"],
        website=True,
        csrf=False,
    )
    def cart_add(self, **kwargs):
        payload = self._json_payload()
        product_id = int(payload.get("product_id") or 0)
        product_template_id = int(payload.get("product_template_id") or 0)
        quantity = int(payload.get("quantity") or 1)
        order = request.cart or request.website._create_cart()
        product = request.env["product.product"].sudo().browse(product_id).exists()
        if not product:
            return self._json({"error": "Produit introuvable."}, status=404)
        order.with_context(skip_cart_verification=True)._cart_add(
            product_id=product.id,
            quantity=quantity,
        )
        return self._json({"cart": self._serialize_cart(order)})

    @http.route(
        "/api/keurvenus/storefront/cart/update",
        type="http",
        auth="public",
        methods=["POST"],
        website=True,
        csrf=False,
    )
    def cart_update(self, **kwargs):
        payload = self._json_payload()
        order = request.cart
        if not order:
            return self._json({"cart": self._serialize_cart(False)})
        line_id = int(payload.get("line_id") or 0)
        quantity = int(payload.get("quantity") or 0)
        if line_id:
            order._cart_update_line_quantity(line_id, quantity)
        return self._json({"cart": self._serialize_cart(order)})

    @http.route(
        "/api/keurvenus/storefront/checkout",
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
        csrf=False,
    )
    def checkout(self, **kwargs):
        order = request.cart
        if order:
            order = self._prepare_checkout_order(order)
        return self._json({
            "checkout": {
                "authenticated": not request.env.user._is_public(),
                "login_url": "/login?redirect=/checkout",
                "signup_url": "/register?redirect=/checkout",
                "cart": self._serialize_cart(order),
                "delivery_methods": self._serialize_delivery_methods(order),
                "payment_methods": self._serialize_payment_methods(order),
                "coming_soon_payment_methods": self._coming_soon_payment_methods(order),
                "settings": self._checkout_settings(order),
                "selected_delivery_method_id": order.carrier_id.id if order and order.carrier_id else False,
                "selected_payment_method_id": False,
                "account_on_checkout": request.website.account_on_checkout,
            },
        })

    @http.route(
        "/api/keurvenus/storefront/checkout/submit",
        type="http",
        auth="public",
        methods=["POST"],
        website=True,
        csrf=False,
    )
    def checkout_submit(self, **kwargs):
        if request.env.user._is_public() and request.website.account_on_checkout == "mandatory":
            return self._json({
                "error": "Veuillez créer un compte ou vous connecter pour commander.",
                "login_url": "/login?redirect=/checkout",
                "signup_url": "/register?redirect=/checkout",
            }, status=401)

        order = request.cart
        if not order or not order.order_line:
            return self._json({"error": "Votre panier est vide."}, status=400)

        payload = self._json_payload()
        try:
            order = self._prepare_checkout_order(order)
            self._update_checkout_partner(payload.get("customer") or {}, order)
            self._apply_delivery_method(order, payload.get("delivery_method_id"))
            payment_method = self._payment_method_from_payload(order, payload.get("payment_method_id"))
            order._recompute_cart()
            order._check_cart_is_ready_to_be_paid()
            self._annotate_order_payment_choice(order, payment_method)
            if order.state in ("draft", "sent"):
                order._validate_order()
            invoices = self._create_unpaid_invoices(order)
            request.session["sale_last_order_id"] = order.id
            request.website.sale_reset()
        except (UserError, ValidationError) as exc:
            return self._json({"error": str(exc)}, status=400)

        invoice = invoices[:1]
        return self._json({
            "order": self._serialize_order_result(order, invoice, payment_method),
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
            "seo": seo_payload(f"/shop/{slugify(product.name, product.id)}", product),
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
            "seo": seo_payload(f"/shop?{urlencode({'category': slugify(category.name, category.id)})}", category),
        }

    def _currency(self, currency):
        return {
            "id": currency.id,
            "name": currency.name,
            "symbol": currency.symbol,
            "position": currency.position,
        }

    def _json_payload(self):
        try:
            return request.get_json_data() or {}
        except ValueError:
            return {}

    def _serialize_cart(self, order):
        currency = order.currency_id if order else request.website.currency_id
        if not order:
            return {
                "id": False,
                "lines": [],
                "items_count": 0,
                "amount_untaxed": 0,
                "amount_delivery": 0,
                "amount_tax": 0,
                "amount_total": 0,
                "currency": self._currency(currency),
            }
        lines = []
        for line in order.website_order_line:
            if line.is_delivery:
                continue
            product = line.product_id
            template = product.product_tmpl_id
            values = product.product_template_attribute_value_ids.sorted(
                lambda value: (value.attribute_id.sequence, value.id)
            )
            lines.append({
                "id": line.id,
                "product_id": product.id,
                "template_id": template.id,
                "slug": slugify(template.name, template.id),
                "name": template.name,
                "variant_values": [value.name for value in values],
                "quantity": line.product_uom_qty,
                "price_unit": line.price_unit,
                "price_subtotal": line.price_subtotal,
                "image_url": self._product_image_url(product, "image_512"),
            })
        return {
            "id": order.id,
            "name": order.name,
            "lines": lines,
            "items_count": int(order.cart_quantity),
            "amount_untaxed": float(order.amount_untaxed),
            "amount_delivery": float(order.amount_delivery),
            "amount_tax": float(order.amount_tax),
            "amount_total": float(order.amount_total),
            "amount_untaxed_formatted": self._format_money(order.amount_untaxed, currency),
            "amount_delivery_formatted": self._format_money(order.amount_delivery, currency),
            "amount_tax_formatted": self._format_money(order.amount_tax, currency),
            "amount_total_formatted": self._format_money(order.amount_total, currency),
            "currency": self._currency(currency),
        }

    def _format_money(self, amount, currency):
        return request.env["ir.qweb.field.monetary"].value_to_html(
            amount,
            {"display_currency": currency},
        )

    def _format_money_text(self, amount, currency):
        return html2plaintext(str(self._format_money(amount, currency))).strip()

    def _portal_partner(self):
        return request.env.user.sudo().partner_id.commercial_partner_id

    def _portal_sale_order_domain(self, partner, states):
        return [
            ("partner_id", "child_of", partner.id),
            ("state", "in", tuple(states)),
        ]

    def _portal_invoice_domain(self, partner):
        return [
            ("commercial_partner_id", "=", partner.id),
            ("move_type", "in", ("out_invoice", "out_refund")),
            ("state", "!=", "cancel"),
        ]

    def _portal_sale_orders(self, partner, states, page=1, page_size=12, limit=False):
        page = max(int(page or 1), 1)
        page_size = min(max(int(page_size or 12), 1), 50)
        return request.env["sale.order"].sudo().search(
            self._portal_sale_order_domain(partner, states),
            order="date_order desc, id desc",
            limit=limit or page_size,
            offset=0 if limit else (page - 1) * page_size,
        )

    def _portal_invoices(self, partner, page=1, page_size=12, limit=False):
        page = max(int(page or 1), 1)
        page_size = min(max(int(page_size or 12), 1), 50)
        return request.env["account.move"].sudo().search(
            self._portal_invoice_domain(partner),
            order="invoice_date desc, date desc, id desc",
            limit=limit or page_size,
            offset=0 if limit else (page - 1) * page_size,
        )

    def _portal_wishlist_count(self, partner):
        if "product.wishlist" not in request.env:
            return 0
        return request.env["product.wishlist"].sudo().search_count([
            ("partner_id", "=", partner.id),
        ])

    def _serialize_portal_session(self, partner):
        return {
            "authenticated": True,
            "user": {
                "id": request.env.user.id,
                "name": request.env.user.name,
                "login": request.env.user.login,
                "is_internal_user": request.env.user._is_internal(),
                "partner": self._serialize_partner(partner),
            },
            "cart_count": int(request.cart.cart_quantity) if request.cart else 0,
            "wishlist_count": self._portal_wishlist_count(partner),
            "payment_url": "/checkout",
            "portal_url": "/portal",
            "portal_links": [],
            "odoo_base_url": request.httprequest.host_url.rstrip("/"),
            "backoffice_url": backoffice_url("/odoo"),
            "signup_enabled": True,
            "is_internal_user": request.env.user._is_internal(),
        }

    def _serialize_partner(self, partner):
        return {
            "id": partner.id,
            "name": partner.name,
            "email": partner.email or "",
            "phone": partner.phone or getattr(partner, "mobile", "") or "",
            "street": partner.street or "",
            "street2": partner.street2 or "",
            "zip": partner.zip or "",
            "city": partner.city or "",
            "state_id": partner.state_id.id if partner.state_id else False,
            "country_id": partner.country_id.id if partner.country_id else False,
            "country_name": partner.country_id.name if partner.country_id else "",
        }

    def _serialize_sale_document(self, order, document_type, detailed=False):
        order._portal_ensure_token()
        storefront_path = f"/portal/{'quotes' if document_type == 'quote' else 'orders'}/{order.id}"
        invoices = order.invoice_ids.filtered(lambda move: move.move_type in ("out_invoice", "out_refund") and move.state != "cancel")
        pickings = order.picking_ids.filtered(lambda picking: picking.state != "cancel") if hasattr(order, "picking_ids") else request.env["stock.picking"]
        return {
            "id": order.id,
            "name": order.name,
            "date": fields.Date.to_string(order.date_order.date()) if order.date_order else False,
            "date_order": fields.Date.to_string(order.date_order.date()) if order.date_order else False,
            "state": order.state,
            "amount_total": float(order.amount_total),
            "amount_total_formatted": self._format_money_text(order.amount_total, order.currency_id),
            "amount_due": float(sum(invoices.mapped("amount_residual"))) if invoices else 0.0,
            "amount_due_formatted": self._format_money_text(sum(invoices.mapped("amount_residual")), order.currency_id) if invoices else self._format_money_text(0, order.currency_id),
            "href": storefront_path,
            "odoo_portal_url": f"/odoo/my/orders/{order.id}?access_token={order.access_token}",
            "preview_url": self._portal_preview_url(order),
            "download_url": self._portal_download_url(order),
            "payment_reference": order.client_order_ref or order.payment_term_id.name or "",
            "invoice_status": order.invoice_status or "",
            "delivery_status": self._sale_delivery_status(pickings),
            "salesperson": self._serialize_user(order.user_id),
            "partner": self._serialize_partner(order.partner_id.commercial_partner_id),
            "invoice_partner": self._serialize_partner(order.partner_invoice_id),
            "shipping_partner": self._serialize_partner(order.partner_shipping_id),
            "delivery": {
                "carrier": order.carrier_id.name if order.carrier_id else "",
                "amount": float(order.amount_delivery or 0.0),
                "amount_formatted": self._format_money_text(order.amount_delivery, order.currency_id),
            },
            "amount_untaxed": float(order.amount_untaxed),
            "amount_tax": float(order.amount_tax),
            "amount_untaxed_formatted": self._format_money_text(order.amount_untaxed, order.currency_id),
            "amount_tax_formatted": self._format_money_text(order.amount_tax, order.currency_id),
            "lines": [
                self._serialize_sale_document_line(line, order.currency_id)
                for line in order.order_line
                if line.display_type not in ("line_section", "line_note", "payment_term")
            ],
            "related_invoices": [self._serialize_related_invoice(invoice) for invoice in invoices],
            "shipments": [self._serialize_shipment(picking) for picking in pickings],
            "type": document_type,
            "detailed": detailed,
        }

    def _serialize_sale_document_line(self, line, currency):
        product = line.product_id
        template = product.product_tmpl_id if product else False
        return {
            "id": line.id,
            "name": line.name,
            "quantity": float(line.product_uom_qty),
            "price_unit": float(line.price_unit),
            "subtotal": float(line.price_subtotal),
            "price_unit_formatted": self._format_money_text(line.price_unit, currency),
            "subtotal_formatted": self._format_money_text(line.price_subtotal, currency),
            "product_id": product.id if product else False,
            "template_id": template.id if template else False,
            "slug": slugify(template.name, template.id) if template else "",
            "image_url": self._product_image_url(product, "image_256") if product and product.image_1920 else "",
        }

    def _serialize_invoice_document(self, invoice, detailed=False):
        invoice._portal_ensure_token()
        storefront_path = f"/portal/invoices/{invoice.id}"
        sale_orders = invoice.line_ids.sale_line_ids.order_id
        return {
            "id": invoice.id,
            "name": invoice.name,
            "date": fields.Date.to_string(invoice.date) if invoice.date else False,
            "invoice_date": fields.Date.to_string(invoice.invoice_date) if invoice.invoice_date else False,
            "due_date": fields.Date.to_string(invoice.invoice_date_due) if invoice.invoice_date_due else False,
            "state": invoice.state,
            "payment_state": invoice.payment_state,
            "amount_total": float(invoice.amount_total),
            "amount_total_formatted": self._format_money_text(invoice.amount_total, invoice.currency_id),
            "amount_due": float(invoice.amount_residual),
            "amount_due_formatted": self._format_money_text(invoice.amount_residual, invoice.currency_id),
            "href": storefront_path,
            "odoo_portal_url": f"/odoo/my/invoices/{invoice.id}?access_token={invoice.access_token}",
            "preview_url": self._portal_preview_url(invoice),
            "download_url": self._portal_download_url(invoice),
            "payment_reference": invoice.payment_reference or invoice.ref or invoice.invoice_origin or "",
            "invoice_origin": invoice.invoice_origin or "",
            "salesperson": self._serialize_user(invoice.invoice_user_id),
            "partner": self._serialize_partner(invoice.commercial_partner_id),
            "invoice_partner": self._serialize_partner(invoice.partner_id),
            "amount_untaxed": float(invoice.amount_untaxed),
            "amount_tax": float(invoice.amount_tax),
            "amount_untaxed_formatted": self._format_money_text(invoice.amount_untaxed, invoice.currency_id),
            "amount_tax_formatted": self._format_money_text(invoice.amount_tax, invoice.currency_id),
            "lines": [
                self._serialize_invoice_document_line(line, invoice.currency_id)
                for line in invoice.invoice_line_ids
                if line.display_type not in ("line_section", "line_note", "payment_term")
            ],
            "related_orders": [self._serialize_related_order(order) for order in sale_orders],
            "detailed": detailed,
        }

    def _serialize_invoice_document_line(self, line, currency):
        product = line.product_id
        template = product.product_tmpl_id if product else False
        return {
            "id": line.id,
            "name": line.name,
            "quantity": float(line.quantity),
            "price_unit": float(line.price_unit),
            "subtotal": float(line.price_subtotal),
            "price_unit_formatted": self._format_money_text(line.price_unit, currency),
            "subtotal_formatted": self._format_money_text(line.price_subtotal, currency),
            "product_id": product.id if product else False,
            "template_id": template.id if template else False,
            "slug": slugify(template.name, template.id) if template else "",
            "image_url": self._product_image_url(product, "image_256") if product and product.image_1920 else "",
        }

    def _serialize_user(self, user):
        if not user:
            return {"id": False, "name": "", "email": "", "phone": ""}
        partner = user.partner_id
        return {
            "id": user.id,
            "name": user.name or "",
            "email": user.login or partner.email or "",
            "phone": partner.phone or partner.mobile or "",
        }

    def _serialize_related_invoice(self, invoice):
        invoice._portal_ensure_token()
        return {
            "id": invoice.id,
            "name": invoice.name,
            "date": fields.Date.to_string(invoice.invoice_date) if invoice.invoice_date else False,
            "state": invoice.state,
            "payment_state": invoice.payment_state,
            "amount_total_formatted": self._format_money_text(invoice.amount_total, invoice.currency_id),
            "amount_due_formatted": self._format_money_text(invoice.amount_residual, invoice.currency_id),
            "href": f"/portal/invoices/{invoice.id}",
            "download_url": self._portal_download_url(invoice),
        }

    def _serialize_related_order(self, order):
        order._portal_ensure_token()
        document_type = "quote" if order.state in ("draft", "sent") else "order"
        return {
            "id": order.id,
            "name": order.name,
            "date": fields.Date.to_string(order.date_order.date()) if order.date_order else False,
            "state": order.state,
            "amount_total_formatted": self._format_money_text(order.amount_total, order.currency_id),
            "href": f"/portal/{'quotes' if document_type == 'quote' else 'orders'}/{order.id}",
            "type": document_type,
        }

    def _serialize_shipment(self, picking):
        return {
            "id": picking.id,
            "name": picking.name,
            "state": picking.state,
            "state_label": dict(picking._fields["state"].selection).get(picking.state, picking.state),
            "scheduled_date": fields.Date.to_string(picking.scheduled_date.date()) if picking.scheduled_date else False,
            "date_done": fields.Date.to_string(picking.date_done.date()) if picking.date_done else False,
        }

    def _sale_delivery_status(self, pickings):
        if not pickings:
            return {"state": "none", "label": "Non livré"}
        states = set(pickings.mapped("state"))
        if states <= {"done"}:
            return {"state": "done", "label": "Livré"}
        if "assigned" in states:
            return {"state": "assigned", "label": "Prêt"}
        if "confirmed" in states or "waiting" in states:
            return {"state": "preparation", "label": "Préparation"}
        return {"state": ",".join(sorted(states)), "label": "Non livré"}

    def _portal_download_url(self, record):
        try:
            return record.get_portal_url(report_type="pdf", download=True)
        except Exception:
            return ""

    def _portal_preview_url(self, record):
        try:
            return record.get_portal_url(report_type="pdf", download=False)
        except Exception:
            return ""

    def _prepare_checkout_order(self, order):
        order = order.sudo().with_context(lang=self._lang(), website_id=request.website.id)
        if order.partner_id == request.website.user_id.sudo().partner_id and not request.env.user._is_public():
            partner = request.env.user.partner_id.sudo()
            order.write({
                "partner_id": partner.id,
                "partner_invoice_id": partner.id,
                "partner_shipping_id": partner.id,
            })
        if order._has_deliverable_products():
            delivery_methods = order._get_delivery_methods()
            if delivery_method := order._get_preferred_delivery_method(delivery_methods):
                if not order.carrier_id or order.carrier_id not in delivery_methods:
                    order._set_delivery_method(delivery_method)
        order._recompute_cart()
        return order

    def _serialize_delivery_methods(self, order):
        if not order or not order._has_deliverable_products():
            return []
        methods = []
        for carrier in order._get_delivery_methods():
            rate = carrier.rate_shipment(order)
            price = float(rate.get("price") or 0.0) if rate.get("success") else 0.0
            methods.append({
                "id": carrier.id,
                "name": carrier.name,
                "description": html2plaintext(carrier.website_description or carrier.carrier_description or "").strip(),
                "price": price,
                "price_formatted": self._format_money(price, order.currency_id),
                "selected": carrier == order.carrier_id,
                "is_pickup": any(word in carrier.name.lower() for word in ("retrait", "pickup", "magasin", "boutique")),
                "allows_cash_on_delivery": bool(carrier.allow_cash_on_delivery),
                "invoice_policy": carrier.invoice_policy,
                "available": bool(rate.get("success")),
                "message": rate.get("error_message") or "",
            })
        return methods

    def _serialize_payment_methods(self, order):
        if not order:
            return []
        providers = request.env["payment.provider"].sudo()._get_compatible_providers(
            order.company_id.id,
            order.partner_invoice_id.id,
            order.amount_total,
            currency_id=order.currency_id.id,
            sale_order_id=order.id,
        )
        methods = request.env["payment.method"].sudo()._get_compatible_payment_methods(
            providers.ids,
            order.partner_invoice_id.id,
            currency_id=order.currency_id.id,
        )
        items = []
        for provider in providers:
            provider_methods = methods.filtered(lambda method: provider.id in method.provider_ids.ids)
            provider_method_records = provider_methods or provider.payment_method_ids
            if not provider_method_records:
                items.append({
                    "id": f"{provider.id}:0",
                    "provider_id": provider.id,
                    "provider_name": provider.name,
                    "provider_code": provider.code,
                    "method_id": False,
                    "name": provider.name,
                    "code": provider.code,
                    "flow": "offline" if provider.code == "custom" else "redirect",
                    "available": True,
                })
                continue
            for method in provider_method_records:
                items.append({
                    "id": f"{provider.id}:{method.id}",
                    "provider_id": provider.id,
                    "provider_name": provider.name,
                    "provider_code": provider.code,
                    "method_id": method.id,
                    "name": method.name,
                    "code": method.code,
                    "flow": "offline" if provider.code == "custom" else "redirect",
                    "available": True,
                })
        return items

    def _checkout_settings(self, order):
        website = request.website
        default_invoice_policy = (
            request.env["ir.default"].sudo()._get(
                "product.template",
                "invoice_policy",
                company_id=order.company_id.id if order else request.env.company.id,
            )
            or "order"
        )
        order_lines_invoice_on_order = True
        if order and order.website_order_line:
            product_lines = order.website_order_line.filtered(lambda line: not line.is_delivery)
            order_lines_invoice_on_order = all(
                line.product_id.invoice_policy == "order" for line in product_lines
            )
        invoice_on_confirmation = default_invoice_policy == "order" and order_lines_invoice_on_order
        return {
            "account_on_checkout": website.account_on_checkout,
            "guest_checkout": website.account_on_checkout in ("optional", "disabled"),
            "ecommerce_access": website.ecommerce_access,
            "add_to_cart_action": website.add_to_cart_action,
            "show_line_subtotals_tax_selection": website.show_line_subtotals_tax_selection,
            "invoice_policy": default_invoice_policy,
            "invoice_on_confirmation": invoice_on_confirmation,
            "automatic_invoice": bool(
                request.env["ir.config_parameter"].sudo().get_param("sale.automatic_invoice")
            ),
            "portal_payment_enabled": bool(
                request.env["ir.config_parameter"].sudo().get_param("account_payment.enable_portal_payment")
            ),
            "order_lines_invoice_on_order": order_lines_invoice_on_order,
        }

    def _coming_soon_payment_methods(self, order):
        active_names = " ".join(
            f"{item['provider_name']} {item['name']}".lower()
            for item in self._serialize_payment_methods(order)
        )
        soon = []
        for label, icon in (("Orange Money", "orange-money"), ("Wave", "wave")):
            if label.lower().split()[0] not in active_names:
                soon.append({"id": icon, "name": label, "available": False, "label": "Bientôt"})
        return soon

    def _update_checkout_partner(self, values, order):
        name = " ".join(
            part for part in [values.get("first_name"), values.get("last_name")] if part
        ).strip() or values.get("name")
        email = (values.get("email") or "").strip()
        phone = (values.get("phone") or "").strip()
        street = (values.get("street") or values.get("address") or "").strip()
        city = (values.get("city") or "").strip()
        if not name:
            raise ValidationError("Veuillez renseigner le nom du client.")
        if not email:
            raise ValidationError("Veuillez renseigner l'adresse e-mail du client.")
        if not phone:
            raise ValidationError("Veuillez renseigner le téléphone du client.")
        if not street and order._has_deliverable_products():
            raise ValidationError("Veuillez renseigner l'adresse de livraison.")

        if request.env.user._is_public():
            Partner = request.env["res.partner"].sudo()
            partner = Partner.search([("email", "=", email)], limit=1)
            if not partner or partner == request.website.user_id.sudo().partner_id:
                partner = Partner.create({
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "street": street,
                    "city": city,
                    "company_id": order.company_id.id,
                })
        else:
            partner = request.env.user.partner_id.sudo()
        name = " ".join(
            part for part in [values.get("first_name"), values.get("last_name")] if part
        ).strip() or values.get("name") or partner.name
        write_values = {
            "name": name,
            "email": email or partner.email,
            "phone": phone or partner.phone,
            "street": street or partner.street,
            "city": city or partner.city,
        }
        partner.write({key: value for key, value in write_values.items() if value})
        order.write({
            "partner_id": partner.id,
            "partner_invoice_id": partner.id,
            "partner_shipping_id": partner.id,
        })

    def _apply_delivery_method(self, order, delivery_method_id):
        if not order._has_deliverable_products():
            return
        delivery_method_id = int(delivery_method_id or 0)
        available = order._get_delivery_methods()
        carrier = available.filtered(lambda item: item.id == delivery_method_id)[:1]
        if not carrier:
            carrier = order._get_preferred_delivery_method(available)
        if not carrier:
            raise ValidationError("Aucune méthode de livraison disponible.")
        order._set_delivery_method(carrier)

    def _payment_method_from_payload(self, order, raw_payment_method_id):
        payment_methods = self._serialize_payment_methods(order)
        payment_method = next(
            (item for item in payment_methods if item["id"] == str(raw_payment_method_id)),
            None,
        )
        if not payment_method and payment_methods:
            payment_method = payment_methods[0]
        if not payment_method:
            raise ValidationError("Aucun moyen de paiement actif n'est disponible.")
        return payment_method

    def _annotate_order_payment_choice(self, order, payment_method):
        order.write({
            "client_order_ref": payment_method["name"],
            "note": Markup(
                f"<p>Moyen de paiement choisi: <strong>{xml_escape(payment_method['name'])}</strong>"
                f" via {xml_escape(payment_method['provider_name'])}.</p>"
            ),
        })

    def _create_unpaid_invoices(self, order):
        invoices = order.invoice_ids.filtered(lambda move: move.move_type == "out_invoice")
        settings = self._checkout_settings(order)
        if not invoices and settings["invoice_on_confirmation"]:
            order._force_lines_to_invoice_policy_order()
            invoices = order._create_invoices()
        draft_invoices = invoices.filtered(lambda move: move.state == "draft")
        if draft_invoices:
            draft_invoices.action_post()
        return invoices

    def _serialize_order_result(self, order, invoice, payment_method):
        return {
            "id": order.id,
            "name": order.name,
            "state": order.state,
            "amount_total": float(order.amount_total),
            "amount_total_formatted": self._format_money(order.amount_total, order.currency_id),
            "payment_method": payment_method,
            "portal_url": f"/odoo/my/orders/{order.id}?access_token={order.access_token}",
            "invoice": {
                "id": invoice.id if invoice else False,
                "name": invoice.name if invoice else "",
                "state": invoice.state if invoice else "",
                "payment_state": invoice.payment_state if invoice else "",
                "portal_url": f"/odoo/my/invoices/{invoice.id}?access_token={invoice.access_token}" if invoice else "",
            },
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
                            category.website_meta_og_img or f"/web/image/product.public.category/{category.id}/image_512"
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
            if product.website_meta_og_img:
                images.insert(0, absolute_storefront_asset_url(product.website_meta_og_img))
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
        main_object = storefront_main_object_for_path(path) or request.website
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

    normalized_path = (path or "/").split("?", 1)[0].rstrip("/") or "/"
    page_record = main_object if main_object and main_object._name == "website.page" else storefront_page_from_path(normalized_path)
    if page_record:
        title = page_record.website_meta_title or title
        description = short_text(page_record.website_meta_description or description)
        keywords = unique_keywords((page_record.website_meta_keywords or "").split(",") + keywords)
        image_url = absolute_storefront_asset_url(page_record.website_meta_og_img or image_url)

    category = main_object if main_object and main_object._name == "product.public.category" else storefront_category_from_path(path)
    if category:
        title, description, keywords = category_seo_content(category)
        image_url = absolute_storefront_asset_url(
            category.website_meta_og_img or f"/web/image/product.public.category/{category.id}/image_512"
        )
        structured_data = collection_page_schema(category.name, description, path)
    elif normalized_path == "/shop":
        title = page_record.website_meta_title if page_record and page_record.website_meta_title else "Boutique Kër Venus | Vaisselle, verrerie, cuisine et maison à Dakar"
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
            product.website_meta_og_img
            or KeurVenusStorefrontController()._product_image_url(variant or product, "image_1024")
        )
        product_url = absolute_storefront_url(f"/shop/{slugify(product.name, product.id)}")
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


def seo_payload(path="/", main_object=None):
    values = storefront_seo_values(path, main_object or storefront_main_object_for_path(path))
    return {
        "title": values["seo_title"],
        "description": values["seo_description"],
        "keywords": values["seo_keywords"],
        "image": values["seo_image_url"],
        "path": path or "/",
    }


def storefront_main_object_for_path(path="/"):
    category = storefront_category_from_path(path)
    if category:
        return category
    page = storefront_page_from_path((path or "/").split("?", 1)[0].rstrip("/") or "/")
    return page or request.website


def storefront_page_from_path(path="/"):
    normalized_path = (path or "/").split("?", 1)[0].rstrip("/") or "/"
    Page = request.env["website.page"].with_context(lang=_lang()).sudo()
    return Page.search(
        fields.Domain.AND([
            request.website.website_domain(),
            [("url", "=", normalized_path)],
        ]),
        limit=1,
    )


def storefront_category_from_path(path):
    raw_path = path or ""
    normalized_path = raw_path.split("?", 1)[0].rstrip("/") or "/"
    if normalized_path != "/shop":
        return False
    slug = request.httprequest.args.get("category")
    if not slug and "?" in raw_path:
        slug = (parse_qs(raw_path.split("?", 1)[1]).get("category") or [None])[0]
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
        return (
            category.website_meta_title or target["title"],
            short_text(category.website_meta_description or target["description"]),
            unique_keywords((category.website_meta_keywords or "").split(",") + target["keywords"] + DEFAULT_SEO_KEYWORDS),
        )

    description = short_text(
        category.website_meta_description
        or html2plaintext(category.website_description or "").strip()
        or f"Découvrez la sélection {category.name} Kër Venus à Dakar: maison, cuisine, vaisselle et décoration intérieure."
    )
    keywords = unique_keywords([
        *(category.website_meta_keywords or "").split(","),
        f"{category.name} Dakar",
        f"acheter {category.name} Dakar",
        "Kër Venus Dakar",
        *DEFAULT_SEO_KEYWORDS,
    ])
    return category.website_meta_title or f"{category.name} à Dakar | Boutique Kër Venus", description, keywords


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
