/**
 * The site links no retired console address: console.tokensbeat.com's /start, /usage, /models/api and its tabs and
 * the old Models addresses (/plaza/models, /plaza/bench, /model-plaza, /available-channels, /monitor) only redirect
 * now, each costing the reader a second hop. Link the page itself: /models (with ?view=simple, status, pricing or
 * bench), /keys, /keys/requests, /keys/setup. Read: a console address written out, a path passed to consoleUrl, and a
 * path right after a ${…} in a template. src/seo/moved.ts is left out: it maps the old addresses on purpose.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(import.meta.dirname, "..");
const RETIRED = "(?:start|usage|plaza/models|plaza/bench|model-plaza|available-channels|monitor|models/api)";
const PATTERNS = [
  new RegExp(`console\\.tokensbeat\\.com/${RETIRED}(?=[/?#"'\`]|$)`),
  new RegExp(`\\b(?:consoleUrl|consolePage|toConsole)\\(\\s*["'\`]/${RETIRED}(?=[/?#"'\`])`),
  new RegExp(`\\$\\{[^}]+\\}/${RETIRED}(?=[/?#"'\`])`),
];

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return sources(p);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
  });
}

describe("links to the console", () => {
  it("name no retired console address", () => {
    const hits = sources(SRC)
      .filter((f) => path.relative(SRC, f) !== path.join("seo", "moved.ts"))
      .flatMap((f) =>
        readFileSync(f, "utf8")
          .split("\n")
          .flatMap((line, i) => (PATTERNS.some((re) => re.test(line)) ? [`${path.relative(SRC, f)}:${i + 1}`] : [])),
      );
    expect(hits).toEqual([]);
  });

  it("would catch each form it reads", () => {
    const caught = (line: string) => PATTERNS.some((re) => re.test(line));
    expect(caught('href: "https://console.tokensbeat.com/models/api"')).toBe(true);
    expect(caught("consoleUrl('/usage?x=1', lang)")).toBe(true);
    expect(caught("`${CONSOLE_ORIGIN}/plaza/bench`")).toBe(true);
    expect(caught('href: "https://console.tokensbeat.com/models?view=bench"')).toBe(false);
    expect(caught("consoleUrl('/keys/requests', lang)")).toBe(false);
    expect(caught("`${CONSOLE_ORIGIN}/startup`")).toBe(false);
  });
});
