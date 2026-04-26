# -*- coding: utf-8 -*-
{
    'name': 'Saytu Debranding',
    'summary': 'Remove Odoo branding and replace with Saytu branding',
    'description': '''
        Saytu Debranding Module
        =======================
        
        This module removes all Odoo branding from the Odoo 19 Community Edition
        and replaces it with Saytu branding.
        
        Features:
        ---------
        * Removes "Powered by Odoo" footer text
        * Replaces "Mon compte Odoo.com" with "Mon compte Saytu"
        * Removes odoo.com links from login page, database manager, and user menu
        * Replaces Odoo logos with Saytu branding
        * Customizes login page branding
        * Updates database manager page
        * Removes Odoo references from error dialogs
        * Updates page titles from "Odoo" to "Saytu"
        * Hides "My Odoo.com Account" menu item
        
        The module uses proper Odoo inheritance patterns and doesn't modify core files.
        All branding can be easily customized by editing the module files.
    ''',
    'version': '19.0.1.0.0',
    'category': 'Tools',
    'license': 'LGPL-3',
    'author': 'Custom Development',
    'website': 'https://www.saytu.com',
    'depends': [
        'base',
        'web',
    ],
    'data': [
        'views/webclient_templates.xml',
        'views/database_manager_templates.xml',
    ],
    'assets': {
        'web.assets_backend': [
            # JavaScript files
            'saytu_debranding/static/src/webclient/user_menu_items.js',
            'saytu_debranding/static/src/webclient/error_dialogs.js',
            
            # SCSS styles
            'saytu_debranding/static/src/scss/debranding.scss',
        ],
        'web.assets_frontend': [
            # Frontend styles
            'saytu_debranding/static/src/scss/debranding.scss',
        ],
    },
    'images': [
        'static/description/icon.png',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}

