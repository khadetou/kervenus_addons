# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from lxml import html

import odoo
from odoo import http
from odoo.http import request
from odoo.tools.misc import file_open

from odoo.addons.base.models.ir_qweb import render as qweb_render
from odoo.addons.web.controllers.database import Database, DBNAME_PATTERN


class DatabaseDebranding(Database):
    """
    Override the database controller to use custom branding
    on the database selector and manager screens.
    """

    def _render_template(self, **d):
        """Override to use custom debranded template."""
        d.setdefault('manage', True)
        d['insecure'] = odoo.tools.config.verify_admin_password('admin')
        d['list_db'] = odoo.tools.config['list_db']
        d['langs'] = odoo.service.db.exp_list_lang()
        d['countries'] = odoo.service.db.exp_list_countries()
        d['pattern'] = DBNAME_PATTERN
        
        # Add custom logo URL
        d['custom_logo_url'] = '/odoo_debranding/database_logo'
        
        # databases list
        try:
            d['databases'] = http.db_list()
            d['incompatible_databases'] = odoo.service.db.list_db_incompatible(d['databases'])
        except odoo.exceptions.AccessDenied:
            d['databases'] = [request.db] if request.db else []

        templates = {}

        # Try to load our custom template first, fallback to original
        try:
            with file_open("odoo_debranding/static/src/public/database_manager.qweb.html", "r") as fd:
                templates['database_manager'] = fd.read()
        except FileNotFoundError:
            with file_open("web/static/src/public/database_manager.qweb.html", "r") as fd:
                templates['database_manager'] = fd.read()
        
        with file_open("web/static/src/public/database_manager.master_input.qweb.html", "r") as fd:
            templates['master_input'] = fd.read()
        with file_open("web/static/src/public/database_manager.create_form.qweb.html", "r") as fd:
            templates['create_form'] = fd.read()

        def load(template_name):
            fromstring = html.document_fromstring if template_name == 'database_manager' else html.fragment_fromstring
            return (fromstring(templates[template_name]), template_name)

        return qweb_render('database_manager', d, load)

    @http.route('/web/database/selector', type='http', auth="none")
    def selector(self, **kw):
        if request.db:
            request.env.cr.close()
        return self._render_template(manage=False)

    @http.route('/web/database/manager', type='http', auth="none")
    def manager(self, **kw):
        if request.db:
            request.env.cr.close()
        return self._render_template()

