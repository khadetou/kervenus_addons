/** @odoo-module **/

import { ErrorDialog } from "@web/core/errors/error_dialogs";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

/**
 * Patch ErrorDialog to replace "Odoo" with "Saytu" in error titles
 * 
 * This removes Odoo branding from error dialog titles:
 * - "Odoo Server Error" → "Saytu Server Error"
 * - "Odoo Client Error" → "Saytu Client Error"
 * - "Odoo Network Error" → "Saytu Network Error"
 */

patch(ErrorDialog.prototype, {
    /**
     * Override inferTitle to use Saytu branding instead of Odoo
     */
    inferTitle() {
        // Call the original method first
        super.inferTitle(...arguments);
        
        // Replace "Odoo" with "Saytu" in the title
        if (this.title) {
            this.title = this.title.replace(/Odoo/g, "Saytu");
        }
        
        // Alternative: Set custom titles directly
        if (!this.props.type) {
            return;
        }
        
        switch (this.props.type) {
            case "server":
                this.title = _t("Saytu Server Error");
                break;
            case "script":
                this.title = _t("Saytu Client Error");
                break;
            case "network":
                this.title = _t("Saytu Network Error");
                break;
        }
    },
});

