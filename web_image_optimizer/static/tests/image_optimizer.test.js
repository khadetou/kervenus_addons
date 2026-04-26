import { expect, test } from "@odoo/hoot";
import { click, queryFirst, setInputFiles, waitFor } from "@odoo/hoot-dom";
import {
    defineModels,
    fields,
    models,
    mountView,
    onRpc,
} from "@web/../tests/web_test_helpers";

const MY_IMAGE =
    "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

class Partner extends models.Model {
    name = fields.Char();
    document = fields.Binary();

    _records = [{ id: 1, name: "first record", document: MY_IMAGE }];
}

defineModels([Partner]);

test("image field upload uses binary optimizer route", async () => {
    let optimizerCalled = false;
    onRpc("/web_image_optimizer/binary/optimize", ({ params }) => {
        optimizerCalled = true;
        expect(params.name).toBe("fake_file.png");
        return {
            name: "fake_file.webp",
            data: MY_IMAGE,
            mimetype: "image/webp",
            changed: true,
            summary: "10 KB -> 6 KB, WebP lossless",
            size_delta: 4096,
            gain_ratio: 0.4,
        };
    });

    await mountView({
        type: "form",
        resModel: "partner",
        arch: /* xml */ `
            <form>
                <field name="document" widget="image" options="{'image_optimization': 'auto'}"/>
            </form>
        `,
    });

    await click("input[type=file]", { visible: false });
    await setInputFiles([new File([Uint8Array.from([137, 80, 78, 71])], "fake_file.png", { type: "image/png" })]);
    await waitFor(`div[name="document"] img[data-src^="data:image/"]`);
    expect(optimizerCalled).toBe(true);
});

test("image field shows optimize button for existing image", async () => {
    await mountView({
        type: "form",
        resModel: "partner",
        resId: 1,
        arch: /* xml */ `
            <form>
                <field name="document" widget="image" options="{'image_optimization': 'manual'}"/>
            </form>
        `,
    });
    expect(queryFirst(".o_optimize_file_button")).not.toBeNull();
});
