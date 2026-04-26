# -*- coding: utf-8 -*-
{
    "name": "Contacts Client Fournisseur",
    "version": "19.0.1.0.0",
    "summary": "Ajoute le choix client/fournisseur sur les contacts et filtre les partenaires en vente et achat",
    "category": "Contacts",
    "author": "OpenAI",
    "license": "LGPL-3",
    "depends": [
        "contacts",
        "account",
        "sale_management",
        "purchase",
    ],
    "data": [
        "views/res_partner_views.xml",
        "views/sale_purchase_views.xml",
    ],
    "installable": True,
    "application": False,
    "auto_install": False,
}
