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
    ],
    "data": [
        "data/ir_asset.xml",
        "views/layout.xml",
        "views/header.xml",
        "views/footer.xml",
        "views/snippets.xml",
        "views/homepage.xml",
        "data/homepage_sync.xml",
        "views/shop_templates.xml",
        "views/product_templates.xml",
        "views/cart_templates.xml",
        "views/wishlist_templates.xml",
        "views/auth_templates.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "theme_keurvenus/static/src/scss/theme_keurvenus.scss",
            "theme_keurvenus/static/src/js/theme_keurvenus.js",
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
