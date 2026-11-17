// The stylesheets first, in cascade order: the base (layers declared), the console's colours, the page.
import "./styles/app.css";
import "./styles/theme.css";
import "./styles/home.css";
import "./styles/docs.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App, type AppPage } from "./App";
import { appPageOfPath, isContentPage } from "./content/routes";
import type { ContentData } from "./docs/data";
import { langOfPath } from "./i18n";
import { BUILT_PAGES } from "./page/pages";

const root = document.getElementById("root")!;
// The page says what it is (scripts/prerender.mjs): data-page on the root, the language in its address. The dev
// server sends index.html for every path, so there the address decides.
function pageOf(): AppPage {
  const said = root.dataset.page ?? "";
  if (said === "404" || (BUILT_PAGES as string[]).includes(said) || isContentPage(said)) return said as AppPage;
  const fromPath = appPageOfPath(location.pathname);
  return fromPath && (isContentPage(fromPath) || BUILT_PAGES.includes(fromPath as (typeof BUILT_PAGES)[number])) ? fromPath : "404";
}

function start(page: AppPage, content: ContentData | null) {
  const app = (
    <StrictMode>
      <App lang={page === "404" ? "en" : langOfPath(location.pathname)} page={page} content={content} />
    </StrictMode>
  );
  // The build is prerendered; the dev server is not.
  if (root.hasChildNodes()) hydrateRoot(root, app);
  else createRoot(root).render(app);
}

const page = pageOf();
// A guide or a legal document hydrates with its words, a module of their own (src/docs/data.ts); the other pages
// never load it.
if (isContentPage(page)) void import("./docs/data").then((m) => start(page, m.CONTENT_DATA));
else start(page, null);
