/**
 * One page of the site in one language. The same tree is rendered to HTML at build time (entry-server.tsx) and
 * hydrated in the browser (main.tsx); nothing in it may differ between the two (no dates, no storage, no window).
 * A content page (a guide or a legal document: src/content/routes.ts) needs its words, `content` (src/docs/data.ts),
 * which the prerender imports and the browser loads before it hydrates such a page.
 */
import { C } from "@/content/copy";
import { isContentPage, type AppPage } from "@/content/routes";
import { ContentDataContext, ContentPage } from "@/docs/ContentPage";
import type { ContentData } from "@/docs/data";
import { I18nProvider, useT, type Lang } from "@/i18n";
import { KitWords } from "@/i18n/kitWords";
import { Foot, PageContext, RunningHead } from "@/page/chrome";
import { NotFound } from "@/page/NotFound";
import { PAGE_COMPONENTS } from "@/page/pages";

export type { AppPage };

function Shell({ page }: { page: AppPage }) {
  const t = useT();
  const Page = page === "404" ? NotFound : isContentPage(page) ? ContentPage : PAGE_COMPONENTS[page];
  if (!Page) throw new Error(`no component for page ${page}`);
  const titleId = page === "404" ? "nf-title" : isContentPage(page) ? "content-title" : `${page}-title`;
  return (
    <div className="h-app">
      <a className="h-skip" href="#main">
        {t(C.nav.skip)}
      </a>
      <RunningHead />
      <main id="main" className="h-main" tabIndex={-1} aria-labelledby={titleId}>
        <Page />
      </main>
      <Foot />
    </div>
  );
}

export function App({ lang, page = "home", content = null }: { lang: Lang; page?: AppPage; content?: ContentData | null }) {
  return (
    <I18nProvider lang={lang}>
      <KitWords>
        <PageContext.Provider value={page}>
          <ContentDataContext.Provider value={content}>
            <Shell page={page} />
          </ContentDataContext.Provider>
        </PageContext.Provider>
      </KitWords>
    </I18nProvider>
  );
}
