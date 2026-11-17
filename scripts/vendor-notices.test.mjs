// @vitest-environment node
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findVendored, noticesFor, vendorNotices } from "./vendor-notices.mjs";

const SRC = path.resolve(import.meta.dirname, "../src");

describe("the licences of code and art taken from other projects", () => {
  it("are found beside that code: the model logos (LobeHub) and the closing band's sharks (drewdi)", () => {
    const found = findVendored(SRC);
    const byDir = Object.fromEntries(found.map((v) => [path.relative(SRC, v.dir), v.notice]));
    expect(Object.keys(byDir).sort()).toEqual(["assets/model-logos", "page/sharks"]);
    expect(byDir["page/sharks"]).toMatch(/^src\/page\/sharks:\n\nMIT License\n\nCopyright \(c\) 2026 drewdi\n/);
    expect(byDir["assets/model-logos"]).toMatch(/Copyright \(c\) 2023 LobeHub/);
  });

  it("go at the top of each built chunk that holds such code, once, and nowhere else", () => {
    const plugin = vendorNotices(SRC);
    const sharks = path.join(SRC, "page/sharks/world.ts");
    const logo = `${path.join(SRC, "assets/model-logos/qwen-color.svg")}?raw`;
    const bundle = {
      "assets/water.js": { type: "chunk", code: "var e=1;", modules: { [sharks]: {}, [path.join(SRC, "page/sharks/render.ts")]: {} } },
      "assets/index.js": { type: "chunk", code: "var t=2;", modules: { [logo]: {}, [path.join(SRC, "App.tsx")]: {} } },
      "assets/data.js": { type: "chunk", code: "var d=3;", modules: { [path.join(SRC, "docs/data.ts")]: {} } },
      "assets/index.css": { type: "asset", source: "a{}" },
    };
    // @ts-expect-error: the hook is called as Rolldown would, with only what it reads.
    plugin.generateBundle({}, bundle);
    expect(bundle["assets/water.js"].code).toMatch(/^\/\*!\nsrc\/page\/sharks:\n\nMIT License\n\nCopyright \(c\) 2026 drewdi[\s\S]*\*\/\nvar e=1;$/);
    expect(bundle["assets/water.js"].code.match(/drewdi/g)).toHaveLength(1);
    expect(bundle["assets/index.js"].code).toMatch(/^\/\*!\nsrc\/assets\/model-logos:[\s\S]*LobeHub[\s\S]*\*\/\nvar t=2;$/);
    expect(bundle["assets/data.js"].code).toBe("var d=3;");
    expect(noticesFor([path.join(SRC, "page/StarField.tsx")], findVendored(SRC))).toEqual([]);
  });
});
