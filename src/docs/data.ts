/**
 * The words of the content pages (the docs and the legal documents), in one module: src/main.tsx imports it before it
 * hydrates such a page (so the other pages' script never carries them) and the prerender imports it directly.
 */
import { DOC_ARTICLES, DOC_GROUPS, DOCS_UI } from "./articles";
import { LEGAL_DOCS } from "./legal";

export const CONTENT_DATA = { articles: DOC_ARTICLES, groups: DOC_GROUPS, ui: DOCS_UI, legal: LEGAL_DOCS };
export type ContentData = typeof CONTENT_DATA;
