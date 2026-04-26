# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Odoo Debranding',
    'version': '19.0.1.0.0',
    'category': 'Tools',
    'summary': 'Complete backend debranding with custom favicon, title, and database manager logo',
    'description': """
Odoo Backend Debranding
=======================

This module allows administrators to:
- Replace the default Odoo favicon in the backend interface
- Customize the browser tab title for the backend
- Remove "My Odoo.com Account" link from user menu
- Remove Odoo branding from the "About" section in Settings
- Replace the Odoo logo on the database selector/manager screens
- Configure branding settings from General Settings

Features:
---------
* Custom favicon upload with format validation (ICO, PNG, SVG supported)
* Custom backend title to replace "Odoo" in browser tabs
* Removes "My Odoo.com Account" menu item from user dropdown
* Removes Odoo S.A. copyright and license links from About section
* Removes database expiration notice
* Custom logo for database selector and manager screens
  (place your logo at: odoo_debranding/static/img/database_logo.png)
* Settings accessible only to administrators
* Proper caching and serving of custom favicon
    """,
    'author': 'Custom Development',
    'website': '',
    'depends': ['base_setup', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/res_config_settings_views.xml',
        'views/webclient_templates.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'odoo_debranding/static/src/js/title_service.js',
            'odoo_debranding/static/src/js/user_menu_items.js',
            'odoo_debranding/static/src/js/res_config_edition.js',
            'odoo_debranding/static/src/xml/res_config_edition.xml',
        ],
    },
    'installable': True,
    'auto_install': False,
    'application': False,
    'license': 'LGPL-3',
}

