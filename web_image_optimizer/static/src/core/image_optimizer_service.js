import { rpc } from "@web/core/network/rpc";

export function normalizeImageOptimizationMode(mode, convertToWebp = false) {
    if (mode) {
        return mode;
    }
    return convertToWebp ? "auto" : "inherit";
}

export async function addOptimizedAttachmentData(params) {
    return rpc("/web_image_optimizer/attachment/add_data", params);
}

export async function optimizeAttachmentIds(attachmentIds, options = {}) {
    return rpc("/web_image_optimizer/attachment/optimize", {
        attachment_ids: attachmentIds,
        ...options,
    });
}

export async function optimizeBinaryImage(params) {
    return rpc("/web_image_optimizer/binary/optimize", params);
}
