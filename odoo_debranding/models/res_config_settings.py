# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import base64

from odoo import api, fields, models
from odoo.exceptions import ValidationError
from odoo.tools.image import image_process


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # Use computed field with inverse for Binary since config_parameter
    # doesn't support Binary fields directly
    backend_favicon = fields.Binary(
        string='Backend Favicon',
        compute='_compute_backend_favicon',
        inverse='_inverse_backend_favicon',
        help='Upload a custom favicon for the backend interface. '
             'Supported formats: ICO, PNG, SVG. Recommended size: 32x32 or 64x64 pixels.'
    )
    backend_title = fields.Char(
        string='Backend Title',
        config_parameter='odoo_debranding.backend_title',
        help='Custom title to display in browser tabs instead of "Odoo". '
             'Leave empty to use the default "Odoo" title.'
    )

    @api.depends_context('uid')
    def _compute_backend_favicon(self):
        """Load favicon from ir.config_parameter."""
        ICP = self.env['ir.config_parameter'].sudo()
        favicon_b64 = ICP.get_param('odoo_debranding.backend_favicon', '')
        for record in self:
            record.backend_favicon = favicon_b64 or False

    def _inverse_backend_favicon(self):
        """Save favicon to ir.config_parameter with validation and processing."""
        ICP = self.env['ir.config_parameter'].sudo()

        for record in self:
            if record.backend_favicon:
                # Validate the favicon
                record._validate_favicon(record.backend_favicon)

                # Process and save the favicon
                processed_favicon = record._process_favicon(record.backend_favicon)
                ICP.set_param('odoo_debranding.backend_favicon', processed_favicon)
            else:
                # Clear the favicon
                ICP.set_param('odoo_debranding.backend_favicon', '')

    def _validate_favicon(self, favicon_data):
        """Validate favicon format and size."""
        if not favicon_data:
            return

        try:
            # Handle both bytes and string (base64)
            if isinstance(favicon_data, str):
                favicon_bytes = base64.b64decode(favicon_data)
            else:
                favicon_bytes = base64.b64decode(favicon_data)

            # Check file size (max 100KB)
            if len(favicon_bytes) > 100 * 1024:
                raise ValidationError(
                    'Favicon file size must not exceed 100KB.'
                )

            # Check file signature for supported formats
            if not self._is_valid_favicon_format(favicon_bytes):
                raise ValidationError(
                    'Invalid favicon format. Supported formats: ICO, PNG, SVG, GIF.'
                )
        except ValidationError:
            raise
        except Exception:
            raise ValidationError(
                'Invalid favicon file. Please upload a valid image file.'
            )

    @api.model
    def _is_valid_favicon_format(self, data):
        """Check if the data is a valid favicon format (ICO, PNG, SVG, or GIF)."""
        # ICO signature
        if data[:4] == b'\x00\x00\x01\x00':
            return True
        # PNG signature
        if data[:8] == b'\x89PNG\r\n\x1a\n':
            return True
        # SVG (check for XML/SVG content)
        if data[:5] == b'<?xml' or b'<svg' in data[:100]:
            return True
        # GIF signature (also commonly used)
        if data[:6] in (b'GIF87a', b'GIF89a'):
            return True
        return False

    def _process_favicon(self, favicon_data):
        """Process and optimize favicon, return base64 string for storage."""
        if not favicon_data:
            return ''

        try:
            # Ensure we have a string for storage
            if isinstance(favicon_data, bytes):
                favicon_b64 = favicon_data.decode('ascii')
            else:
                favicon_b64 = favicon_data

            favicon_bytes = base64.b64decode(favicon_b64)

            # Only process raster images (not SVG)
            if not (favicon_bytes[:5] == b'<?xml' or b'<svg' in favicon_bytes[:100]):
                # Process to create a proper ICO format
                processed = image_process(
                    favicon_bytes,
                    size=(64, 64),
                    crop='center',
                    output_format='ICO'
                )
                return base64.b64encode(processed).decode('ascii')

            # For SVG, return as-is
            return favicon_b64

        except Exception:
            # If processing fails, return the original
            if isinstance(favicon_data, bytes):
                return favicon_data.decode('ascii')
            return favicon_data

