# TokensBeat site

TokensBeat's public website: the product pages, the docs and the legal documents, in English and Chinese. It is a
Vite + React app, prerendered to static HTML, and published on GitHub Pages at <https://tokensbeat.github.io>.

## Develop

Node 22.22 or later.

```sh
npm ci
npm run dev        # http://127.0.0.1:5330
npm run check      # typecheck, lint, tests, and no reseller named in public text
```

## Build

```sh
VITE_HOME_SITE_URL=https://tokensbeat.github.io VITE_HOME_API_ORIGIN=https://api.tokensbeat.com HOME_STATUS_PROBE=0 npm run build
SITE_ORIGIN=https://tokensbeat.github.io API_ORIGIN=https://api.tokensbeat.com npm run check:dist
npm run preview    # serves dist/ on http://127.0.0.1:4331
```

`VITE_HOME_SITE_URL` is the public origin. Only a build for `https://tokensbeat.com` is indexable; any other origin
marks every page `noindex` and writes no sitemap. `VITE_HOME_API_ORIGIN` is where the pages' live checks go (prices,
top-up status, API health).

## Publish

`.github/workflows/pages.yml` checks, builds and publishes on every push to `main`, and every six hours to refresh the
status page's snapshot (`status.json`). It can also be run by hand.

## Legal documents

`legal/` holds the Markdown of the terms, the privacy policy and the operators' compliance commitment. They are a
copy: the TokensBeat product repository owns these texts, and a check there fails while the two differ. Change them
there first, then copy the files here unchanged.
