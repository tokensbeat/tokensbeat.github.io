/**
 * Code or art taken from another project lives in a folder of src/ with that project's LICENSE beside it (the model
 * logos, the closing band's sharks). The licences we take (MIT) ask for the notice in every copy, and the built
 * chunks are copies, but Vite's minifier drops every comment, legal ones too; keeping all legal comments instead
 * would put each icon's @license into the main chunk (+9 KB). So after minifying, a chunk that holds a module from
 * such a folder starts with that folder's LICENSE, once.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * The folders under `srcDir` that hold a LICENSE, each with its notice text.
 * @param {string} srcDir
 * @returns {{ dir: string; notice: string }[]}
 */
export function findVendored(srcDir) {
  /** @type {{ dir: string; notice: string }[]} */
  const found = [];
  /** @param {string} dir */
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name));
    }
    const licence = path.join(dir, "LICENSE");
    if (dir !== srcDir && existsSync(licence)) {
      const relative = path.relative(path.dirname(srcDir), dir).split(path.sep).join("/");
      found.push({ dir: dir + path.sep, notice: `${relative}:\n\n${readFileSync(licence, "utf8").trim()}` });
    }
  };
  walk(srcDir);
  return found;
}

/**
 * The notices a chunk must carry: those of the vendored folders its modules come from.
 * @param {string[]} moduleIds
 * @param {{ dir: string; notice: string }[]} vendored
 */
export function noticesFor(moduleIds, vendored) {
  const ids = moduleIds.map((id) => id.split("?")[0]);
  return vendored.filter((v) => ids.some((id) => id.startsWith(v.dir))).map((v) => v.notice);
}

/** @param {string} notice */
const asComment = (notice) => `/*!\n${notice.replaceAll("*/", "* /")}\n*/\n`;

/**
 * The Vite plugin: prepends the notices to each chunk that needs them. It runs at generateBundle, after the minifier
 * (a renderChunk comment would be stripped); the file's hash is taken before, so it covers the code, not the notice.
 * @param {string} srcDir
 * @returns {import("vite").Plugin}
 */
export function vendorNotices(srcDir) {
  const vendored = findVendored(srcDir);
  return {
    name: "vendor-notices",
    apply: "build",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== "chunk") continue;
        const notices = noticesFor(Object.keys(file.modules), vendored);
        if (notices.length) file.code = notices.map(asComment).join("") + file.code;
      }
    },
  };
}
