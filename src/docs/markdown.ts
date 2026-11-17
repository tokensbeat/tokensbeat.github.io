/**
 * The Markdown of the legal documents (docs/legal/*.md) as HTML, for src/docs/LegalPage.tsx. Only what those files use,
 * so the site needs no Markdown library: headings, paragraphs, bullet and numbered lists (an indented line continues an
 * item), pipe tables, **bold**, *italic*, `code` and [links](href). Every character of the text is escaped first; a
 * link is kept only if `link` returns a target for its href (the page passes its own: the site's addresses, the
 * console's, https), otherwise its words stay as plain text. The same input gives the same HTML on the server and in
 * the browser, so a hydrated page matches its prerender.
 *
 * Headings move down one step under the page's own h1: "#" and "##" are h2, "###" h3, deeper h4. A leading "#"
 * heading is the document's own title, which the page prints itself: drop it before (LegalPage does).
 */

export interface LinkTarget {
  href: string;
  /** Opens in a new tab (another site). */
  external: boolean;
}

export type LinkResolver = (href: string) => LinkTarget | null;

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Bold and italic in already escaped text. */
function emphasis(html: string): string {
  return html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*\w])\*(?![\s*])(.+?)\*(?![*\w])/g, "$1<em>$2</em>");
}

/** Text with links, bold and italic (no code spans: inline() splits those out first). */
function rich(text: string, link: LinkResolver): string {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    out += emphasis(escape(text.slice(last, m.index)));
    const label = emphasis(escape(m[1]));
    const target = link(m[2]);
    out += target ? `<a href="${escape(target.href)}"${target.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>` : label;
    last = (m.index ?? 0) + m[0].length;
  }
  return out + emphasis(escape(text.slice(last)));
}

/** One line or paragraph of inline Markdown as HTML. */
export function inline(text: string, link: LinkResolver): string {
  return text
    .split(/(`[^`]+`)/)
    .map((part, i) => (i % 2 ? `<code>${escape(part.slice(1, -1))}</code>` : rich(part, link)))
    .join("");
}

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;
const TABLE = /^\s*\|/;

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

/** A Markdown document (the subset above) as HTML. */
export function renderMarkdown(markdown: string, link: LinkResolver): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  const isBlockStart = (line: string) => HEADING.test(line) || BULLET.test(line) || NUMBERED.test(line) || TABLE.test(line);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      const level = Math.min(Math.max(heading[1].length, 2), 4);
      out.push(`<h${level}>${inline(heading[2], link)}</h${level}>`);
      i++;
      continue;
    }
    if (TABLE.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && TABLE.test(lines[i])) rows.push(lines[i++]);
      const [head, rule, ...body] = rows;
      const isRule = rule !== undefined && cells(rule).every((c) => /^:?-{3,}:?$/.test(c));
      const bodyRows = isRule ? body : rows.slice(1);
      const th = cells(head).map((c) => `<th scope="col">${inline(c, link)}</th>`).join("");
      const tr = bodyRows.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c, link)}</td>`).join("")}</tr>`).join("");
      out.push(`<div class="h-prose__table" role="region" tabindex="0"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`);
      continue;
    }
    const numbered = NUMBERED.exec(line);
    if (numbered || BULLET.test(line)) {
      const ordered = Boolean(numbered);
      const marker = ordered ? NUMBERED : BULLET;
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i];
        const m = marker.exec(current);
        if (m) {
          items.push(ordered ? m[2] : m[1]);
          i++;
        } else if (current.trim() && /^\s+/.test(current) && items.length && !isBlockStart(current)) {
          // An indented line continues the item above it.
          items[items.length - 1] += ` ${current.trim()}`;
          i++;
        } else if (!current.trim() && i + 1 < lines.length && marker.test(lines[i + 1])) {
          // A blank line between two items: the same list.
          i++;
        } else break;
      }
      const start = ordered && numbered && numbered[1] !== "1" ? ` start="${Number(numbered[1])}"` : "";
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}${start}>${items.map((item) => `<li>${inline(item, link)}</li>`).join("")}</${tag}>`);
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) paragraph.push(lines[i++].trim());
    out.push(`<p>${inline(paragraph.join(" "), link)}</p>`);
  }
  return out.join("\n");
}
