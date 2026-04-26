/** @odoo-module **/

import { registry } from "@web/core/registry";

/**
 * Remove the "My Odoo.com Account" menu item from the user menu.
 * This is part of the debranding effort to remove Odoo.com references.
 */
const userMenuRegistry = registry.category("user_menuitems");

// Remove the odoo_account item if it exists
if (userMenuRegistry.contains("odoo_account")) {
    userMenuRegistry.remove("odoo_account");
}

