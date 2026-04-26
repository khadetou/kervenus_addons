# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    "name": "Web Image Optimizer",
    "summary": "Centralized image optimization for media dialog and image fields",
    "version": "19.0.1.0.0",
    "category": "Website/Website",
    "license": "LGPL-3",
    "depends": ["base_setup", "web", "html_editor"],
    "data": [
        "views/res_config_settings_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "web_image_optimizer/static/src/core/image_optimizer_service.js",
            "web_image_optimizer/static/src/views/image_field_patch.js",
            "web_image_optimizer/static/src/views/image_field.xml",
            "web_image_optimizer/static/src/views/x2many_media_viewer_patch.js",
        ],
        "html_editor.assets_media_dialog": [
            "web_image_optimizer/static/src/core/image_optimizer_service.js",
            "web_image_optimizer/static/src/media_dialog/upload_service_patch.js",
            "web_image_optimizer/static/src/media_dialog/image_selector_patch.js",
            "web_image_optimizer/static/src/media_dialog/file_selector.xml",
        ],
        "web.assets_unit_tests": [
            "web_image_optimizer/static/tests/**/*",
        ],
    },
    "installable": True,
}
