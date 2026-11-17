/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The homepage's public origin, for canonical links, hreflang, Open Graph and the sitemap (src/seo/head.ts). */
  readonly VITE_HOME_SITE_URL?: string;
  /** The API origin the live checks call (src/page/live.ts); unset: this site's own origin. */
  readonly VITE_HOME_API_ORIGIN?: string;
  /** "1": keep every page out of search engines (a preview build; src/seo/head.ts). */
  readonly VITE_HOME_NOINDEX?: string;
}
