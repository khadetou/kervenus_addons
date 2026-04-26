import { BuilderAction } from "@html_builder/core/builder_action";
import { Plugin } from "@html_editor/plugin";
import { rpc } from "@web/core/network/rpc";
import { registry } from "@web/core/registry";

class KeurVenusPaginationOptionPlugin extends Plugin {
    static id = "keurVenusPaginationOptionPlugin";

    resources = {
        builder_actions: {
            SetKeurVenusPaginationTypeAction,
        },
    };
}

export class SetKeurVenusPaginationTypeAction extends BuilderAction {
    static id = "setKeurVenusPaginationType";

    setup() {
        this.reload = {};
    }

    isApplied({ editingElement, value }) {
        return editingElement.dataset.kvPaginationType === value;
    }

    apply({ value }) {
        return rpc("/shop/config/website", {
            theme_keurvenus_pagination_type: value,
        });
    }
}

registry
    .category("website-plugins")
    .add(KeurVenusPaginationOptionPlugin.id, KeurVenusPaginationOptionPlugin);
