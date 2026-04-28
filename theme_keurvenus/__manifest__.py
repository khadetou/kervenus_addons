# -*- coding: utf-8 -*-
{
    "name": "Theme Keur Venus",
    "version": "19.0.1.0.0",
    "category": "Theme/Ecommerce",
    "summary": "Theme eCommerce Odoo 19 inspire du template Keur Venus",
    "description": """
Theme Keur Venus adapte le template premium Keur Venus en un theme Odoo 19
autonome, fidele visuellement et compatible avec Website, Website Sale,
Wishlist et Auth Signup.
""",
    "author": "Codex",
    "maintainer": "Codex",
    "license": "LGPL-3",
    "depends": [
        "website",
        "website_sale",
        "website_sale_wishlist",
        "auth_signup",
        "portal",
    ],
    "data": [
        "security/ir.model.access.csv",
        "data/ir_asset.xml",
        "data/storefront_seo_pages.xml",
        "data/checkout_delivery_payment.xml",
        "views/layout.xml",
        "views/storefront_host.xml",
        "views/header.xml",
        "views/footer.xml",
        "views/snippets.xml",
        "views/homepage.xml",
        "data/homepage_sync.xml",
        "views/shop_templates.xml",
        "views/product_templates.xml",
        "views/product_variant_media_views.xml",
        "views/res_config_settings_views.xml",
        "views/portal_user_password_views.xml",
        "views/cart_templates.xml",
        "views/wishlist_templates.xml",
        "views/auth_templates.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "theme_keurvenus/static/src/scss/theme_keurvenus.scss",
            "theme_keurvenus/static/src/js/theme_keurvenus.js",
        ],
        "website.website_builder_assets": [
            "theme_keurvenus/static/src/website_builder/pagination_option.xml",
            "theme_keurvenus/static/src/website_builder/pagination_option_plugin.js",
        ],
    },
    "images": [
        "static/src/img/keurvenus/logo.svg",
    ],
    "installable": True,
    "application": False,
    "auto_install": False,
    "uninstall_hook": "uninstall_hook",
}
