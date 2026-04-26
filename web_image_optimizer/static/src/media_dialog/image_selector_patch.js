import { _t } from "@web/core/l10n/translation";
import { patch } from "@web/core/utils/patch";
import { ImageSelector } from "@html_editor/main/media/media_dialog/image_selector";
import { FileSelectorControlPanel } from "@html_editor/main/media/media_dialog/file_selector";
import { optimizeAttachmentIds } from "@web_image_optimizer/core/image_optimizer_service";

FileSelectorControlPanel.props = {
    ...FileSelectorControlPanel.props,
    optimizeSelected: { type: Function, optional: true },
    hasOptimizableSelection: { type: Boolean, optional: true },
};

patch(ImageSelector.prototype, {
    get hasOptimizableSelection() {
        return this.props.selectedMedia[this.props.id].some((media) => media.mediaType === "attachment");
    },

    async optimizeSelectedAttachments() {
        const attachmentIds = this.props.selectedMedia[this.props.id]
            .filter((media) => media.mediaType === "attachment")
            .map(({ id }) => id);
        if (!attachmentIds.length) {
            return;
        }
        const result = await optimizeAttachmentIds(attachmentIds);
        const optimizedAttachments = (result.attachments || []).map((attachment) => ({
            ...attachment,
            mediaType: "attachment",
        }));
        this.props.selectedMedia[this.props.id] = optimizedAttachments;
        this.state.attachments = await this.fetchAttachments(
            this.NUMBER_OF_ATTACHMENTS_TO_DISPLAY,
            0
        );
        const summaries = optimizedAttachments
            .map((attachment) => attachment.optimization?.summary)
            .filter(Boolean);
        this.notificationService.add(summaries[0] || _t("Image optimization finished."), {
            type: "success",
        });
    },
});
