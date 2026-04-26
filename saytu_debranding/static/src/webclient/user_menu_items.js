/** @odoo-module **/

import { registry } from "@web/core/registry";

/**
 * Remove "My Odoo.com Account" from user menu
 *
 * This removes the menu item that links to odoo.com account page.
 * The item is registered in the user_menuitems registry with id "odoo_account".
 */

const userMenuRegistry = registry.category("user_menuitems");

// Remove the "My Odoo.com Account" menu item
// Note: In Odoo 19, the registry key is "odoo_account" not "account"
if (userMenuRegistry.contains("odoo_account")) {
    userMenuRegistry.remove("odoo_account");
}

/**
 * Optionally, you can add a custom "My Saytu Account" menu item here:
 * 
 * import { _t } from "@web/core/l10n/translation";
 * import { browser } from "@web/core/browser/browser";
 * 
 * function saytAccountItem(env) {
 *     return {
 *         type: "item",
 *         id: "saytu_account",
 *         description: _t("Mon compte Saytu"),
 *         callback: () => {
 *             browser.open("https://www.saytu.com/account", "_blank");
 *         },
 *         sequence: 60,
 *     };
 * }
 * 
 * userMenuRegistry.add("saytu_account", saytAccountItem);
 */

