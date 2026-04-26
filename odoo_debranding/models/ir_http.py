# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, models


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        """Add backend title to session info for JavaScript access."""
        result = super().session_info()
        ICP = self.env['ir.config_parameter'].sudo()
        backend_title = ICP.get_param('odoo_debranding.backend_title', '')
        result['backend_title'] = backend_title or 'Odoo'
        return result

    def webclient_rendering_context(self):
        """Add favicon and title to webclient context."""
        context = super().webclient_rendering_context()
        ICP = self.env['ir.config_parameter'].sudo()
        
        # Get custom favicon
        backend_favicon = ICP.get_param('odoo_debranding.backend_favicon', '')
        if backend_favicon:
            context['custom_favicon'] = '/odoo_debranding/favicon'
        
        # Get custom title
        backend_title = ICP.get_param('odoo_debranding.backend_title', '')
        if backend_title:
            context['custom_title'] = backend_title
        
        return context

