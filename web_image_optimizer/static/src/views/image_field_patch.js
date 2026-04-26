import { _t } from "@web/core/l10n/translation";
import { isBinarySize } from "@web/core/utils/binary";
import { patch } from "@web/core/utils/patch";
import { ImageField, imageField } from "@web/views/fields/image/image_field";
import { X2ManyMediaViewer, x2ManyMediaViewer } from "@html_editor/fields/x2many_field/x2many_media_viewer";
import {
    normalizeImageOptimizationMode,
    optimizeBinaryImage,
} from "@web_image_optimizer/core/image_optimizer_service";

ImageField.props = {
    ...ImageField.props,
    imageOptimizationMode: { type: String, optional: true },
};

const originalExtractProps = imageField.extractProps;
imageField.extractProps = (params) => {
    const props = originalExtractProps(params);
    const options = params.options || {};
    return {
        ...props,
        imageOptimizationMode: normalizeImageOptimizationMode(
            options.image_optimization,
            options.convert_to_webp
        ),
    };
};

if (!imageField.supportedOptions.some((option) => option.name === "image_optimization")) {
    imageField.supportedOptions.push({
        label: _t("Image optimization"),
        name: "image_optimization",
        type: "selection",
        choices: [
            { label: _t("Inherit"), value: "inherit" },
            { label: _t("Auto"), value: "auto" },
            { label: _t("Manual"), value: "manual" },
            { label: _t("Off"), value: "off" },
        ],
    });
}

patch(ImageField.prototype, {
    setup() {
        super.setup();
        this.state.isOptimizing = false;
    },

    get imageOptimizationMode() {
        return normalizeImageOptimizationMode(
            this.props.imageOptimizationMode,
            this.props.convertToWebp
        );
    },

    async _readCurrentBinaryFieldData() {
        const currentValue = this.props.record.data[this.props.name];
        if (!currentValue || this.fieldType !== "binary") {
            return null;
        }
        if (!isBinarySize(currentValue)) {
            return currentValue;
        }
        if (!this.props.record.resId) {
            return null;
        }
        const [record] = await this.orm.read(
            this.props.record.resModel,
            [this.props.record.resId],
            [this.props.name],
            { context: { bin_size: false } }
        );
        return record?.[this.props.name];
    },

    async _runBinaryOptimization({
        name,
        data,
        mimetype,
        triggerMode,
        force = false,
        createReportCompatibility = false,
    }) {
        this.state.isOptimizing = true;
        try {
            const result = await optimizeBinaryImage({
                name,
                data,
                mimetype,
                trigger_mode: triggerMode,
                force,
                create_report_compatibility: createReportCompatibility,
            });
            if (result.summary) {
                this.notification.add(result.summary, {
                    type: result.changed ? "success" : "info",
                });
            }
            return result;
        } finally {
            this.state.isOptimizing = false;
        }
    },

    async onFileUploaded(info) {
        this.state.isValid = true;
        if (["off", "manual"].includes(this.imageOptimizationMode)) {
            this.props.record.update({ [this.props.name]: info.data });
            return;
        }
        const result = await this._runBinaryOptimization({
            name: info.name,
            data: info.data,
            mimetype: info.type,
            triggerMode: this.imageOptimizationMode,
            createReportCompatibility: this.imageOptimizationMode !== "off",
        });
        await this.props.record.update({ [this.props.name]: result.data });
    },

    async onOptimizeImage() {
        const data = await this._readCurrentBinaryFieldData();
        if (!data) {
            return;
        }
        const result = await this._runBinaryOptimization({
            name: `${this.props.record.resModel}_${this.props.name}.png`,
            data,
            mimetype: undefined,
            triggerMode: "manual",
            force: true,
            createReportCompatibility: true,
        });
        await this.props.record.update({ [this.props.name]: result.data });
    },
});

X2ManyMediaViewer.props = {
    ...X2ManyMediaViewer.props,
    imageOptimizationMode: { type: String, optional: true },
};

const originalX2ManyExtractProps = x2ManyMediaViewer.extractProps;
x2ManyMediaViewer.extractProps = (params, dynamicInfo) => {
    const props = originalX2ManyExtractProps(params, dynamicInfo);
    const options = params.options || {};
    return {
        ...props,
        imageOptimizationMode: normalizeImageOptimizationMode(
            options.image_optimization,
            options.convert_to_webp
        ),
    };
};
