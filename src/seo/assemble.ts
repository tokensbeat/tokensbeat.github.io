/**
 * One prerendered page from the client's index.html (scripts/prerender.mjs, through the server build): the page's
 * <html lang>, its head between the template's <!--head--> markers (and font preloads), its HTML in the root.
 */
export interface AssemblePage {
  lang: string;
  head: string;
  rootAttrs?: string;
  body: string;
  /** Font files to preload (/assets/…woff2). */
  preload?: string[];
}

export function assemble(template: string, page: AssemblePage): string {
  const html = /<html lang="[^"]*">/;
  const head = /<!--head-->[\s\S]*?<!--\/head-->/;
  const root = /<div id="root"><\/div>/;
  const checks: [string, RegExp][] = [
    ["<html lang>", html],
    ["<!--head--> markers", head],
    ['an empty <div id="root">', root],
  ];
  for (const [what, re] of checks) {
    if (!re.test(template)) throw new Error(`prerender: ${what} not found in dist/index.html`);
  }
  const fonts = (page.preload ?? []).map((href) => `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin />`);
  // Functions as replacements, so a "$" in the page ("From $5") is never read as a replacement pattern.
  return template
    .replace(html, () => `<html lang="${page.lang}">`)
    .replace(head, () => [page.head, ...fonts].join("\n    "))
    .replace(root, () => `<div id="root"${page.rootAttrs ?? ""}>${page.body}</div>`);
}
