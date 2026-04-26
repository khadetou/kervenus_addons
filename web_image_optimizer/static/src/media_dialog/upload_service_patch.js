import { _t } from "@web/core/l10n/translation";
import { patch } from "@web/core/utils/patch";
import { checkFileSize } from "@web/core/utils/files";
import { humanNumber } from "@web/core/utils/numbers";
import { getDataURLFromFile } from "@web/core/utils/urls";
import {
    AUTOCLOSE_DELAY,
    AUTOCLOSE_DELAY_LONG,
    uploadService,
} from "@html_editor/main/media/media_dialog/upload_progress_toast/upload_service";
import { addOptimizedAttachmentData } from "@web_image_optimizer/core/image_optimizer_service";

patch(uploadService, {
    start(env, services) {
        const service = super.start(...arguments);
        const { notification } = services;
        service.uploadFiles = async (files, { resModel, resId, isImage }, onUploaded) => {
            const sortedFiles = Array.from(files).sort((a, b) => a.size - b.size);
            for (const file of sortedFiles) {
                let fileSize = file.size;
                if (!checkFileSize(fileSize, notification)) {
                    return null;
                }
                fileSize = fileSize ? `${humanNumber(fileSize)}B` : "";
                service.incrementId();
                const id = service.fileId;
                file.progressToastId = id;
                service.addFile({
                    id,
                    name: file.name,
                    size: fileSize,
                });
            }

            for (const sortedFile of sortedFiles) {
                const file = service.progressToast.files[sortedFile.progressToastId];
                let dataURL;
                try {
                    dataURL = await getDataURLFromFile(sortedFile);
                } catch {
                    service.deleteFile(file.id);
                    env.services.notification.add(_t('Could not load the file "%s".', sortedFile.name), {
                        type: "danger",
                    });
                    continue;
                }
                try {
                    const attachment = await addOptimizedAttachmentData({
                        name: file.name,
                        data: dataURL.split(",")[1],
                        res_id: resId,
                        res_model: resModel,
                        is_image: !!isImage,
                        width: 0,
                        quality: 0,
                        trigger_mode: "inherit",
                    });
                    if (attachment.error) {
                        file.hasError = true;
                        file.errorMessage = attachment.error;
                    } else {
                        file.uploaded = true;
                        file.summary = attachment.optimization?.summary;
                        await onUploaded(attachment);
                        if (file.summary) {
                            env.services.notification.add(file.summary, {
                                type: attachment.optimization?.changed ? "success" : "info",
                            });
                        }
                    }
                    const messageAutocloseDelay = file.hasError
                        ? AUTOCLOSE_DELAY_LONG
                        : AUTOCLOSE_DELAY;
                    setTimeout(() => service.deleteFile(file.id), messageAutocloseDelay);
                } catch (error) {
                    file.hasError = true;
                    setTimeout(() => service.deleteFile(file.id), AUTOCLOSE_DELAY_LONG);
                    throw error;
                }
            }
        };
        return service;
    },
});
