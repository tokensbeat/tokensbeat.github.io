/**
 * Under the pointer a button turns over (owner, 2026-11-02: "the button hovering should have color flipping"): the kit's
 * Button does it in components/s1lin/button.css (the @s1lin kit's test/button-hover.test.ts), and lint/rules/
 * kit-button-tokens.yml keeps this app's stylesheets from painting .s1-btn over it. These are the homepage's own buttons,
 * drawn in its stylesheets: each turns to the ink with its words in the paper, never the old tint of the second paper.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prop, rules } from "../test/css";

const SRC = join(__dirname, "..");

/** Each stylesheet and the buttons it draws (the class, a class name must not run on into a longer one). */
const BUTTONS: Record<string, string[]> = {
  "styles/home.css": [".h-head__menu", ".h-theme"],
};

describe("the homepage's own buttons turn over under the pointer", () => {
  for (const [file, classes] of Object.entries(BUTTONS)) {
    const all = rules(readFileSync(join(SRC, file), "utf8"));
    for (const cls of classes) {
      const own = (r: { selector: string }) => r.selector.split(",").some((b) => new RegExp(`${cls.replace(/[.[\]()]/g, "\\$&")}(?![\\w-])[^\\s>+~]*:hover`).test(b.trim()));
      it(`${file}: ${cls} under the pointer is the ink, its words the paper`, () => {
        const hovers = all.filter(own);
        expect(hovers.length, `a :hover rule for ${cls}`).toBeGreaterThan(0);
        const turned = hovers.filter((r) => /var\(--s1-ink\)/.test(prop(r.body, "background(?:-color)?") ?? "") && prop(r.body, "color") === "var(--s1-paper)");
        expect(turned.length, `${cls}: background var(--s1-ink) and color var(--s1-paper) under the pointer`).toBeGreaterThan(0);
        for (const r of hovers) expect(prop(r.body, "background(?:-color)?") ?? "", `${r.selector}: not a tint`).not.toMatch(/paper-2|color-mix|--aha-hover|--brand-hover/);
      });
    }
  }
});
