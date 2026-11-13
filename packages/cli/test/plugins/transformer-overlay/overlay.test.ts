import { describe, expect, it } from "vitest";
import { overlayTransformer } from "../../../src/plugins/transformer-overlay/index.js";

type Json = Record<string, any>;

function source(): Json {
  return {
    openapi: "3.1.0",
    info: { title: "Petstore", version: "1.0.0" },
    paths: {
      "/pets": {
        get: { summary: "List pets", tags: ["pets"], responses: {} },
        post: { summary: "Create a pet", tags: ["pets"], responses: {} },
      },
      "/internal/metrics": { get: { responses: {} } },
    },
  };
}

async function apply(document: Json, ...overlays: string[]) {
  const files = Object.fromEntries(overlays.map((text, index) => [`overlay-${index}.yaml`, text]));
  const context = {
    reader: { readText: async (path: string) => files[path] ?? "" },
    options: { overlays: Object.keys(files) },
  };
  const result = await overlayTransformer.transformDocument(document, context);
  return { document: result.document as Json, findings: result.findings };
}

describe("overlayTransformer", () => {
  it("merges updates into the objects the target selects", async () => {
    const { document, findings } = await apply(
      source(),
      `overlay: 1.0.0
info: { title: Nombres en español, version: 1.0.0 }
actions:
  - target: $.paths['/pets'].get
    update:
      summary: Listar mascotas
      x-openchasqui-folder: Catálogos/Mascotas
`,
    );

    expect(findings).toEqual([]);
    expect(document.paths["/pets"].get).toEqual({
      summary: "Listar mascotas",
      tags: ["pets"],
      responses: {},
      "x-openchasqui-folder": "Catálogos/Mascotas",
    });
  });

  it("appends the update when the target is an array", async () => {
    const { document } = await apply(
      source(),
      `overlay: 1.0.0
info: { title: t, version: 1 }
actions:
  - target: $.paths['/pets'].post.tags
    update: write
`,
    );

    expect(document.paths["/pets"].post.tags).toEqual(["pets", "write"]);
  });

  it("removes every node the target selects", async () => {
    const { document } = await apply(
      source(),
      `overlay: 1.0.0
info: { title: t, version: 1 }
actions:
  - target: $.paths['/internal/metrics']
    remove: true
`,
    );

    expect(Object.keys(document.paths)).toEqual(["/pets"]);
  });

  it("applies actions in order, each one on the result of the previous", async () => {
    const { document } = await apply(
      source(),
      `overlay: 1.0.0
info: { title: t, version: 1 }
actions:
  - target: $.paths['/pets'].get
    update: { x-step: one }
  - target: $.paths['/pets'][?@['x-step'] == 'one']
    update: { summary: Found by the first action }
`,
    );

    expect(document.paths["/pets"].get.summary).toBe("Found by the first action");
  });

  it("warns when a target matches nothing, since it is usually a typo", async () => {
    const { findings } = await apply(
      source(),
      `overlay: 1.0.0
info: { title: t, version: 1 }
actions:
  - target: $.paths['/pest'].get
    update: { summary: x }
`,
    );

    expect(findings).toEqual([
      expect.objectContaining({
        severity: "warning",
        message: expect.stringContaining("targets nothing"),
      }),
    ]);
  });

  it("reports an overlay without a valid version or actions", async () => {
    const { findings } = await apply(
      source(),
      "overlay: 2.0.0\ninfo: { title: t, version: 1 }\nactions: []\n",
    );

    expect(findings[0]).toMatchObject({ severity: "error", file: "overlay-0.yaml" });
  });

  it("reports an invalid JSONPath instead of failing the run", async () => {
    const { findings } = await apply(
      source(),
      `overlay: 1.0.0
info: { title: t, version: 1 }
actions:
  - target: $.paths[
    update: { summary: x }
`,
    );

    expect(findings[0]).toMatchObject({
      severity: "error",
      message: expect.stringContaining("invalid target"),
    });
  });

  it("never changes the document it receives", async () => {
    const original = source();
    await apply(
      original,
      "overlay: 1.0.0\ninfo: { title: t, version: 1 }\nactions:\n  - target: $.info\n    update: { title: Changed }\n",
    );

    expect(original.info.title).toBe("Petstore");
  });
});
