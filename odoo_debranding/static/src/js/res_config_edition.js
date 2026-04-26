/** @odoo-module **/

import { registry } from "@web/core/registry";
import { session } from "@web/session";
import { Setting } from "@web/views/form/setting/setting";

import { Component } from "@odoo/owl";
import { standardWidgetProps } from "@web/views/widgets/standard_widget_props";

/**
 * Override the ResConfigEdition widget to remove Odoo branding.
 * This replaces the original widget that displays version, copyright, and license info.
 */
class ResConfigEditionDebranded extends Component {
    static template = "odoo_debranding.res_config_edition";
    static components = { Setting };
    static props = {
        ...standardWidgetProps,
    };

    setup() {
        // Only expose version number, not expiration date or other branding
        this.serverVersion = session.server_version;
        // Explicitly set expirationDate to null to hide it
        this.expirationDate = null;
    }
}

export const resConfigEditionDebranded = {
    component: ResConfigEditionDebranded,
};

// Replace the original widget with our debranded version
registry.category("view_widgets").add("res_config_edition", resConfigEditionDebranded, { force: true });

