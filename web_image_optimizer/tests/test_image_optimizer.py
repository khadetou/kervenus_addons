import base64
import io
import json

from PIL import Image, ImageDraw

import odoo.tests
from odoo.tests.common import HttpCase, TransactionCase
from odoo.tools.json import scriptsafe as json_safe


def make_test_png():
    image = Image.new("RGBA", (320, 240), (255, 255, 255, 255))
    draw = ImageDraw.Draw(image)
    for offset in range(0, 320, 20):
        draw.rectangle((offset, 0, offset + 10, 240), fill=(34, 139, 230, 255))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@odoo.tests.tagged("-at_install", "post_install")
class TestImageOptimizer(TransactionCase):
    def test_optimize_existing_attachment_creates_hidden_original(self):
        png = make_test_png()
        attachment = self.env["ir.attachment"].create(
            {
                "name": "pattern.png",
                "raw": png,
                "res_model": "ir.ui.view",
                "res_id": 0,
                "public": True,
                "mimetype": "image/png",
            }
        )
        result = attachment.optimize_existing_attachment()
        self.assertIn(result["reason"], {"optimized_lossless_webp", "optimized_above_soft_target"})
        self.assertTrue(result["changed"])
        self.assertEqual(attachment.mimetype, "image/webp")
        self.assertTrue(attachment.original_id)
        self.assertEqual(attachment.optimization_status, "optimized")
        self.assertEqual(attachment.original_id.optimization_status, "original")

    def test_optimize_unchanged_attachment_marks_state(self):
        png = Image.new("RGBA", (8, 8), (255, 0, 0, 255))
        buffer = io.BytesIO()
        png.save(buffer, format="PNG")
        attachment = self.env["ir.attachment"].create(
            {
                "name": "tiny.png",
                "raw": buffer.getvalue(),
                "res_model": "ir.ui.view",
                "res_id": 0,
                "public": True,
                "mimetype": "image/png",
            }
        )
        result = attachment.optimize_existing_attachment()
        self.assertFalse(result["changed"])
        self.assertEqual(attachment.optimization_status, "unchanged")


@odoo.tests.tagged("-at_install", "post_install")
class TestImageOptimizerHttp(HttpCase):
    def test_binary_optimize_route_returns_payload(self):
        self.authenticate("admin", "admin")
        payload = {
            "params": {
                "name": "pattern.png",
                "data": base64.b64encode(make_test_png()).decode(),
                "mimetype": "image/png",
                "trigger_mode": "auto",
            }
        }
        response = self.url_open(
            "/web_image_optimizer/binary/optimize",
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"},
        ).json()
        self.assertIn("result", response)
        self.assertIn("data", response["result"])
        self.assertIn("summary", response["result"])

    def test_attachment_add_data_route_returns_media_info(self):
        self.authenticate("admin", "admin")
        payload = {
            "params": {
                "name": "pattern.png",
                "data": base64.b64encode(make_test_png()).decode(),
                "is_image": True,
                "res_model": "ir.ui.view",
                "res_id": 0,
            }
        }
        response = self.url_open(
            "/web_image_optimizer/attachment/add_data",
            data=json_safe.dumps(payload),
            headers={"Content-Type": "application/json"},
        ).json()
        self.assertFalse("error" in response, response)
        self.assertIn("optimization", response["result"])
