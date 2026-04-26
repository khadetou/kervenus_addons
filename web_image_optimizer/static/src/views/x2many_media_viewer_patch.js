import { patch } from "@web/core/utils/patch";
import { X2ManyMediaViewer } from "@html_editor/fields/x2many_field/x2many_media_viewer";
import {
    normalizeImageOptimizationMode,
    optimizeBinaryImage,
} from "@web_image_optimizer/core/image_optimizer_service";

patch(X2ManyMediaViewer.prototype, {
    async onImageSave(attachments) {
        const attachmentIds = attachments.map((attachment) => attachment.id);
        const attachmentRecords = await this.orm.searchRead(
            "ir.attachment",
            [["id", "in", attachmentIds]],
            ["id", "datas", "name", "mimetype"],
            {}
        );
        const mode = normalizeImageOptimizationMode(
            this.props.imageOptimizationMode,
            this.props.convertToWebp
        );
        for (const attachment of attachmentRecords) {
            const imageList = this.props.record.data[this.props.name];
            if (!attachment.datas) {
                return this.notification.add(
                    `Cannot add URL type attachment "${attachment.name}". Please try to reupload this image.`,
                    {
                        type: "warning",
                    }
                );
            }
            let optimized = {
                data: attachment.datas,
                name: attachment.name,
                summary: undefined,
            };
            if (!["off", "manual"].includes(mode)) {
                optimized = await optimizeBinaryImage({
                    name: attachment.name,
                    data: attachment.datas,
                    mimetype: attachment.mimetype,
                    trigger_mode: mode,
                    create_report_compatibility: true,
                });
            }
            if (optimized.summary) {
                this.notification.add(optimized.summary, {
                    type: optimized.changed ? "success" : "info",
                });
            }
            imageList.addNewRecord({ position: "bottom" }).then((record) => {
                const activeFields = imageList.activeFields;
                const updateData = {};
                for (const field in activeFields) {
                    if (optimized.data && this.supportedFields.includes(field)) {
                        updateData[field] = optimized.data;
                        updateData.name = optimized.name;
                    }
                }
                record.update(updateData);
            });
        }
    },
});
