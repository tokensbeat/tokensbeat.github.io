/**
 * The content pages (src/content/routes.ts) in the site's look: a guide of the docs (/docs/…: the Vue site's DocsView,
 * its words unchanged: the guides by group with a filter, the article, its sections on the side, the previous and next
 * guide) and a legal document (/legal/<id>/: LegalDocumentView, the Markdown as HTML). Their words come from
 * ContentDataContext (src/docs/data.ts, which this module never imports: the other pages' script must not carry them).
 * Every link of the old site's form goes where it lives now (./links.ts), in the page's language.
 */
import { createContext, useContext, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Code } from "@/components/s1lin/code";
import { cn } from "@/components/s1lin/cn";
import { docPath, isContentPage, legalPath, LEGAL_IDS, type DocSlug, type LegalId } from "@/content/routes";
import { useI18n, type Lang } from "@/i18n";
import { usePage } from "@/page/chrome";
import { More } from "@/page/parts";
import type { DocArticle, DocBlock, DocText } from "./articles";
import type { ContentData } from "./data";
import { resolveContentHref } from "./links";
import { renderMarkdown } from "./markdown";

export const ContentDataContext = createContext<ContentData | null>(null);

/** The page App shows for a content page: the guide or the legal document its address names. */
export function ContentPage() {
  const page = usePage();
  const data = useContext(ContentDataContext);
  if (!data || !isContentPage(page)) throw new Error(`content page ${page} without its words`);
  return page.startsWith("docs:") ? <DocsPage data={data} slug={page.slice(5) as DocSlug} /> : <LegalPage data={data} id={page.slice(6) as LegalId} />;
}

const pick = (lang: Lang) => (v: DocText) => v[lang];

/* ------------------------------------------------------------------ docs */

/** The guides by group, with a filter over their words in both languages (as the Vue site's search). */
function DocsNav({ data, slug }: { data: ContentData; slug: DocSlug }) {
  const { lang } = useI18n();
  const text = pick(lang);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return data.groups
      .map((g) => ({ ...g, articles: data.articles.filter((a) => a.group === g.id && (!term || JSON.stringify(a).toLocaleLowerCase().includes(term))) }))
      .filter((g) => g.articles.length);
  }, [data, query]);
  return (
    <div className="h-docnav">
      <label className="h-docnav__search">
        <Search className="h-docnav__icon" aria-hidden="true" focusable="false" />
        <input type="search" value={query} placeholder={text(data.ui.search)} aria-label={text(data.ui.search)} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <nav aria-label={text(data.ui.navigation)}>
        {groups.map((g) => (
          <div key={g.id} className="h-docnav__group">
            <p className="h-docnav__head">{text(g.title)}</p>
            <ul>
              {g.articles.map((a) => (
                <li key={a.slug}>
                  <a href={docPath(a.slug as DocSlug, lang)} aria-current={a.slug === slug ? "page" : undefined}>
                    {text(a.title)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!groups.length && (
          <p className="h-docnav__none" role="status">
            {text(data.ui.noResults)}
          </p>
        )}
      </nav>
    </div>
  );
}

function Block({ block, section }: { block: DocBlock; section: string }) {
  const { lang } = useI18n();
  const text = pick(lang);
  switch (block.type) {
    case "text":
      return <p className="h-docs__p">{text(block.text)}</p>;
    case "note":
      return (
        <p className="h-docs__note" role="note">
          {text(block.text)}
        </p>
      );
    case "steps":
      return (
        <ol className="h-docs__steps">
          {block.items.map((item, i) => (
            <li key={i}>{text(item)}</li>
          ))}
        </ol>
      );
    case "list":
      return (
        <ul className="h-docs__list">
          {block.items.map((item, i) => (
            <li key={i}>{text(item)}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <Code block copy label={block.label} className="h-docs__code">
          {block.code}
        </Code>
      );
    case "table":
      return (
        <div className="h-prose__table" role="region" aria-label={section} tabIndex={0}>
          <table>
            <thead>
              <tr>
                {block.headings.map((h, i) => (
                  <th key={i} scope="col">
                    {text(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{text(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "links":
      return (
        <p className="h-docs__links">
          {block.items.map((link) => {
            const to = resolveContentHref(link.href, lang);
            return to ? (
              <More key={link.href} href={to.href}>
                {text(link.label)}
              </More>
            ) : null;
          })}
        </p>
      );
  }
}

function DocsPage({ data, slug }: { data: ContentData; slug: DocSlug }) {
  const { lang } = useI18n();
  const text = pick(lang);
  const index = data.articles.findIndex((a) => a.slug === slug);
  const article: DocArticle | undefined = data.articles[index];
  if (!article) throw new Error(`no guide ${slug}`);
  const group = data.groups.find((g) => g.id === article.group);
  const previous = data.articles[index - 1];
  const next = data.articles[index + 1];
  return (
    <section className="h-docs" aria-labelledby="content-title">
      <div className="h-wrap h-docs__grid">
        <aside className="h-docs__side">
          <DocsNav data={data} slug={slug} />
        </aside>
        <article className="h-docs__article">
          <div className="h-docs__head">
            <p className="h-eyebrow">
              <span>{group ? text(group.title) : text(data.ui.title)}</span>
            </p>
            <h1 id="content-title" className="h-docs__title">
              {text(article.title)}
            </h1>
            <p className="h-lead">{text(article.description)}</p>
          </div>
          <details className="h-docs__browse">
            <summary>{text(data.ui.navigation)}</summary>
            <DocsNav data={data} slug={slug} />
          </details>
          {article.sections.map((s) => (
            <section key={s.id} id={s.id} className="h-docs__section" aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`} className="h-docs__h2">
                <a href={`#${s.id}`}>{text(s.title)}</a>
              </h2>
              {s.blocks.map((b, i) => (
                <Block key={i} block={b} section={text(s.title)} />
              ))}
            </section>
          ))}
          <nav className="h-docs__pager" aria-label={text(data.ui.navigation)}>
            {previous && (
              <a className="h-docs__prev" href={docPath(previous.slug as DocSlug, lang)}>
                <span>
                  <ArrowLeft aria-hidden="true" focusable="false" />
                  {text(data.ui.previous)}
                </span>
                {text(previous.title)}
              </a>
            )}
            {next && (
              <a className="h-docs__next" href={docPath(next.slug as DocSlug, lang)}>
                <span>
                  {text(data.ui.next)}
                  <ArrowRight aria-hidden="true" focusable="false" />
                </span>
                {text(next.title)}
              </a>
            )}
          </nav>
        </article>
        <aside className="h-docs__toc">
          <nav aria-label={text(data.ui.onThisPage)}>
            <p className="h-docnav__head">{text(data.ui.onThisPage)}</p>
            <ul>
              {article.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{text(s.title)}</a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ legal */

const UPDATED: DocText = { en: "Updated: {date}", zh: "更新日期：{date}" };
const SEE_ALSO: DocText = { en: "See also", zh: "另见" };

function LegalPage({ data, id }: { data: ContentData; id: LegalId }) {
  const { lang } = useI18n();
  const text = pick(lang);
  const doc = data.legal[id];
  const html = useMemo(() => renderMarkdown(doc.markdown[lang], (href) => resolveContentHref(href, lang)), [doc, lang]);
  // Terms and privacy link to each other (the operators' commitment stands apart).
  const related = id === "admin-compliance" ? [] : LEGAL_IDS.filter((other) => other !== id && other !== "admin-compliance");
  return (
    <section className="h-docs h-legaldoc" aria-labelledby="content-title">
      <div className="h-wrap h-legaldoc__in">
        <div className="h-docs__head">
          <p className="h-eyebrow">
            <span>{text(doc.label)}</span>
          </p>
          <h1 id="content-title" className="h-docs__title">
            {text(doc.title)}
          </h1>
          {doc.updated[lang] && <p className="h-small h-legaldoc__date">{text(UPDATED).replace("{date}", doc.updated[lang])}</p>}
        </div>
        <div className={cn("h-prose", lang === "zh" && "h-prose--zh")} dangerouslySetInnerHTML={{ __html: html }} />
        {related.length > 0 && (
          <p className="h-legaldoc__also">
            <span>{text(SEE_ALSO)}</span>
            {related.map((other) => (
              <More key={other} href={legalPath(other, lang)}>
                {text(data.legal[other].title)}
              </More>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
