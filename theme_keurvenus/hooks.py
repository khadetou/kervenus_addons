from odoo import SUPERUSER_ID, api


DEFAULT_HOMEPAGE_ARCH = """
<t name="Homepage" t-name="website.homepage">
    <t t-call="website.layout" pageName.f="homepage">
        <div id="wrap" class="oe_structure oe_empty"/>
    </t>
</t>
""".strip()


def uninstall_hook(cr, registry):
    env = api.Environment(cr, SUPERUSER_ID, {})
    homepage_views = env["website.page"].sudo().search([
        ("url", "=", "/"),
        ("view_id.key", "=", "website.homepage"),
    ]).mapped("view_id")
    base_homepage = env.ref("website.homepage", raise_if_not_found=False)
    views = (homepage_views | base_homepage).filtered(
        lambda view: view.type == "qweb"
        and "theme_keurvenus.theme_keurvenus_homepage_content" in (view.arch_db or "")
    )
    for view in views:
        view.write({"arch_db": DEFAULT_HOMEPAGE_ARCH})
