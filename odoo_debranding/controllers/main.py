# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import base64
import hashlib

from odoo import http
from odoo.http import request
from odoo.tools import file_open


class DebrandingController(http.Controller):

    @http.route('/odoo_debranding/favicon', type='http', auth='public',
                methods=['GET'], readonly=True)
    def get_favicon(self, **kw):
        """Serve the custom backend favicon."""
        ICP = request.env['ir.config_parameter'].sudo()
        favicon_data = ICP.get_param('odoo_debranding.backend_favicon', '')

        if favicon_data:
            try:
                favicon_bytes = base64.b64decode(favicon_data)

                # Detect content type
                content_type = self._detect_image_type(favicon_bytes)

                # Generate ETag for caching
                etag = hashlib.md5(favicon_bytes).hexdigest()

                # Check if client has cached version
                if_none_match = request.httprequest.headers.get('If-None-Match')
                if if_none_match and if_none_match == etag:
                    return request.make_response('', status=304)

                response = request.make_response(favicon_bytes, headers=[
                    ('Content-Type', content_type),
                    ('Content-Length', len(favicon_bytes)),
                    ('Cache-Control', 'public, max-age=604800'),  # 7 days
                    ('ETag', etag),
                ])
                return response
            except Exception:
                pass

        # Fallback to default favicon
        return self._get_default_favicon()

    @http.route('/odoo_debranding/database_logo', type='http', auth='none',
                methods=['GET'], readonly=True, cors='*')
    def get_database_logo(self, **kw):
        """
        Serve the custom logo for database selector/manager screens.
        This route works without authentication (auth='none') since it's
        accessed before any database is selected.
        """
        # Try to get custom logo from file in module's static folder
        try:
            with file_open('odoo_debranding/static/img/database_logo.png', 'rb') as f:
                logo_bytes = f.read()
                content_type = self._detect_image_type(logo_bytes)
                etag = hashlib.md5(logo_bytes).hexdigest()

                if_none_match = request.httprequest.headers.get('If-None-Match')
                if if_none_match and if_none_match == etag:
                    return request.make_response('', status=304)

                return request.make_response(logo_bytes, headers=[
                    ('Content-Type', content_type),
                    ('Content-Length', len(logo_bytes)),
                    ('Cache-Control', 'public, max-age=604800'),
                    ('ETag', etag),
                ])
        except FileNotFoundError:
            pass

        # Fallback: return empty/transparent image or redirect to default
        return self._get_default_database_logo()

    def _detect_image_type(self, data):
        """Detect the MIME type of image data."""
        # ICO signature
        if data[:4] == b'\x00\x00\x01\x00':
            return 'image/x-icon'
        # PNG signature
        if data[:8] == b'\x89PNG\r\n\x1a\n':
            return 'image/png'
        # JPEG signature
        if data[:2] == b'\xff\xd8':
            return 'image/jpeg'
        # SVG (check for XML/SVG content)
        if data[:5] == b'<?xml' or b'<svg' in data[:100]:
            return 'image/svg+xml'
        # GIF signature
        if data[:6] in (b'GIF87a', b'GIF89a'):
            return 'image/gif'
        # WebP signature
        if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
            return 'image/webp'
        # Default to PNG
        return 'image/png'

    def _get_default_favicon(self):
        """Return the default Odoo favicon."""
        try:
            with file_open('web/static/img/favicon.ico', 'rb') as f:
                favicon_bytes = f.read()
                response = request.make_response(favicon_bytes, headers=[
                    ('Content-Type', 'image/x-icon'),
                    ('Content-Length', len(favicon_bytes)),
                    ('Cache-Control', 'public, max-age=604800'),
                ])
                return response
        except Exception:
            return request.not_found()

    def _get_default_database_logo(self):
        """Return a transparent placeholder or the default Odoo logo."""
        # Return a minimal transparent PNG as placeholder
        # 1x1 transparent PNG
        transparent_png = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        )
        return request.make_response(transparent_png, headers=[
            ('Content-Type', 'image/png'),
            ('Content-Length', len(transparent_png)),
            ('Cache-Control', 'public, max-age=604800'),
        ])

