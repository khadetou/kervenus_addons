/** @odoo-module **/

import { registry } from "@web/core/registry";
import { session } from "@web/session";

/**
 * Override the title service to use custom backend title from settings.
 * This replaces "Odoo" with the configured custom title in browser tabs.
 */
export const debrandingTitleService = {
    start() {
        const titleCounters = {};
        const titleParts = {};
        
        // Get custom title from session info, default to "Odoo"
        const customTitle = session.backend_title || "Odoo";

        function getParts() {
            return Object.assign({}, titleParts);
        }

        function setCounters(counters) {
            for (const key in counters) {
                const val = counters[key];
                if (!val) {
                    delete titleCounters[key];
                } else {
                    titleCounters[key] = val;
                }
            }
            updateTitle();
        }

        function setParts(parts) {
            for (const key in parts) {
                const val = parts[key];
                if (!val) {
                    delete titleParts[key];
                } else {
                    titleParts[key] = val;
                }
            }
            updateTitle();
        }

        function updateTitle() {
            const counter = Object.values(titleCounters).reduce((acc, count) => acc + count, 0);
            // Use custom title instead of hardcoded "Odoo"
            const name = Object.values(titleParts).join(" - ") || customTitle;
            if (!counter) {
                document.title = name;
            } else {
                document.title = `(${counter}) ${name}`;
            }
        }

        // Set initial title
        document.title = customTitle;

        return {
            /**
             * @returns {string}
             */
            get current() {
                return document.title;
            },
            getParts,
            setCounters,
            setParts,
        };
    },
};

// Replace the default title service with our custom one
registry.category("services").add("title", debrandingTitleService, { force: true });

