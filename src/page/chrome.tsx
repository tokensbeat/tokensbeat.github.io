/**
 * The running head and the foot, as tokensbeat.com (v4) has them (PublicHeader.vue, SiteFooter.vue), in the console's
 * look: the orbit mark and the wordmark; Platform (a panel of the Serve and Support pages, each with its picture, its
 * status and a line, over a scrim that sets it apart from the page), Aha, Pricing, Support and Docs; the language, the
 * theme, Launch Aha (a quiet link to aha.tokensbeat.com) and Get started (the go button, to /start/, where the visitor
 * chooses the console or Aha). No Sign in: each product signs its own visitors in (owner, 2026-11-02). Under 1100 px
 * the links go into a menu sheet that opens with Get started and Launch Aha; on a phone Get started stays in the bar
 * and Launch Aha and the language pair move into the sheet. The foot repeats the pages in three columns (two on a
 * phone), says what the four labels mean in one row, and gives the API endpoint.
 *
 * The bar's controls have no line round them (owner, 2026-11-02): the language, the theme (an icon alone, the
 * language's 30px), the quiet Launch Aha, and Get started, the one filled action, all 30px tall. The language switch
 * is the kit's LangSwitch as a pair of links to this page in each language (each is its own prerendered page): 30px
 * in the bar, 40px in the phone's sheet, 24px in the foot. The theme is the reader's choice on <html data-theme>,
 * restored before first paint by the script in index.html.
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/app/Logo";
import { cn } from "@/components/s1lin/cn";
import { LangSwitch as Switch } from "@/components/s1lin/lang-switch";
import { useDark } from "@/components/s1lin/use-dark";
import { C } from "@/content/copy";
import { API_BASE_URL, links } from "@/content/links";
import { appPagePath, type AppPage } from "@/content/routes";
import { NAV_SERVE, NAV_SUPPORT, pagePath, sitePage, type PageId } from "@/content/site";
import { LANGS, tagOf, useI18n, type Lang } from "@/i18n";
import { PAGE_ICONS } from "./icons";
import { BeatLine, LinkButton, StatusChip } from "./parts";

export const THEME_KEY = "tb-home-theme";

/** The page being shown: the head marks it, the language switch links to it in the other language. */
export const PageContext = createContext<AppPage>("home");
export const usePage = () => useContext(PageContext);

const LANGUAGE_NAME: Record<Lang, { short: string; name: string }> = {
  en: { short: "EN", name: "English" },
  zh: { short: "中文", name: "中文" },
};

export function setTheme(theme: "light" | "dark"): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage blocked: the choice lasts for this page */
  }
}

/** One square button with no line round it: the sun on night paper (back to paper), the moon on paper (to night). */
export function ThemeToggle() {
  const dark = useDark();
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="h-theme"
      aria-label={dark ? t("Switch to light mode") : t("Switch to dark mode")}
      title={dark ? t("Light mode") : t("Dark mode")}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <svg className="h-theme__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        {dark ? (
          <>
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1.2v1.9M8 12.9v1.9M1.2 8h1.9M12.9 8h1.9M3.2 3.2l1.35 1.35M11.45 11.45l1.35 1.35M3.2 12.8l1.35-1.35M11.45 4.55l1.35-1.35" />
          </>
        ) : (
          <path d="M13.6 9.9A5.9 5.9 0 0 1 6.1 2.4a5.9 5.9 0 1 0 7.5 7.5Z" />
        )}
      </svg>
    </button>
  );
}

/**
 * EN and 中文, each in its own language, as links to this page in that language (the kit's LangSwitch): the one in
 * force in the ink with a dot under it, the other dimmer, no box round them.
 */
export function LangSwitch({ className, size }: { className?: string; size?: "md" | "sm" | "xs" }) {
  const { lang, t } = useI18n();
  const page = usePage();
  const target = page === "404" ? "home" : page;
  return (
    <Switch
      className={className}
      label={t("Language")}
      size={size}
      value={lang}
      options={LANGS.map((l) => ({ value: l, label: LANGUAGE_NAME[l].short, name: LANGUAGE_NAME[l].name, lang: tagOf(l), href: appPagePath(target, l) }))}
    />
  );
}

export function Brand({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  return (
    <a className={cn("h-brand", className)} href={pagePath("home", lang)} aria-label={t("TokensBeat home")}>
      <Logo className="h-brand__mark" />
      <b>TokensBeat</b>
    </a>
  );
}

const GROUPS = [
  { id: "serve", items: NAV_SERVE },
  { id: "support", items: NAV_SUPPORT },
] as const;

/** The Platform panel's groups (and the menu sheet's): Serve, then Support; each page with its status (and line). */
function PageGroups({ blurbs, idPrefix }: { blurbs: boolean; idPrefix: string }) {
  const { lang, t } = useI18n();
  const page = usePage();
  return (
    <>
      {GROUPS.map((g) => (
        <div key={g.id} className="h-group" role="group" aria-labelledby={`${idPrefix}-${g.id}`}>
          <p id={`${idPrefix}-${g.id}`} className="h-group__title">
            <span>{t(C.nav[g.id])}</span>
            {t(C.nav[`${g.id}Note`])}
          </p>
          <ul>
            {g.items.map((id) => {
              const p = sitePage(id);
              const Icon = PAGE_ICONS[id];
              return (
                <li key={id}>
                  <a className="h-item" href={pagePath(id, lang)} aria-current={page === id ? "page" : undefined}>
                    {Icon && (
                      <span className="h-item__icon" aria-hidden="true">
                        <Icon focusable="false" />
                      </span>
                    )}
                    <span className="h-item__name">
                      <span>{t(C.pages[id].name)}</span>
                      {p.status && <StatusChip status={p.status} size="sm" />}
                    </span>
                    {blurbs && <span className="h-item__blurb">{t(C.pages[id].blurb)}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

export function RunningHead() {
  const { lang, t } = useI18n();
  const page = usePage();
  const to = links(lang);
  const root = useRef<HTMLElement>(null);
  const [platform, setPlatform] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!platform && !menu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // The trigger of whichever was open gets the focus back.
      const trigger = menu ? ".h-head__menu" : ".h-head__platform";
      setPlatform(false);
      setMenu(false);
      root.current?.querySelector<HTMLElement>(trigger)?.focus();
    }
    function onPointer(e: PointerEvent) {
      if (root.current && e.target instanceof Node && !root.current.contains(e.target)) {
        setPlatform(false);
        setMenu(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [platform, menu]);

  const current = (id: PageId) => (page === id ? "page" : undefined);
  const inDocs = page.startsWith("docs:") ? "page" : undefined;

  return (
    <header ref={root} className={cn("h-head", page === "home" && "h-head--cosmos", (platform || menu) && "is-open")}>
      <nav className="h-wrap h-head__bar" aria-label={t(C.nav.label)}>
        <Brand />
        <ul className="h-head__links">
          <li>
            <button
              type="button"
              className="h-head__link h-head__platform"
              aria-expanded={platform}
              aria-controls="h-platform"
              onClick={() => {
                setPlatform((v) => !v);
                setMenu(false);
              }}
            >
              {t(C.nav.platform)}
              <ChevronDown className="h-head__chevron" aria-hidden="true" focusable="false" />
            </button>
          </li>
          <li>
            <a className="h-head__link" href={pagePath("aha", lang)} aria-current={current("aha")}>
              {t(C.nav.aha)}
            </a>
          </li>
          <li>
            <a className="h-head__link" href={pagePath("pricing", lang)} aria-current={current("pricing")}>
              {t(C.nav.pricing)}
            </a>
          </li>
          <li>
            <a className="h-head__link" href={pagePath("help", lang)} aria-current={current("help")}>
              {t(C.nav.help)}
            </a>
          </li>
          <li>
            <a className="h-head__link" href={to.docs} aria-current={inDocs}>
              {t(C.nav.docs)}
            </a>
          </li>
        </ul>
        <div className="h-head__end">
          <LangSwitch className="h-head__lang" />
          <ThemeToggle />
          <a className="h-head__link h-head__aha" href={to.aha}>
            {t(C.nav.launchAha)}
          </a>
          <LinkButton href={pagePath("start", lang)} variant="go" arrow={false} className="h-head__cta">
            {t(C.nav.getStarted)}
          </LinkButton>
          <button
            type="button"
            className="h-head__menu"
            aria-expanded={menu}
            aria-controls="h-sheet"
            aria-label={t(menu ? C.nav.closeMenu : C.nav.menu)}
            onClick={() => {
              setMenu((v) => !v);
              setPlatform(false);
            }}
          >
            {menu ? <X aria-hidden="true" focusable="false" /> : <Menu aria-hidden="true" focusable="false" />}
          </button>
        </div>
      </nav>

      <div
        className="h-scrim"
        hidden={!platform && !menu}
        aria-hidden="true"
        onClick={() => {
          setPlatform(false);
          setMenu(false);
        }}
      />

      <div id="h-platform" className="h-panel" hidden={!platform}>
        <div className="h-wrap h-panel__grid">
          <PageGroups blurbs idPrefix="h-platform" />
        </div>
      </div>

      <div id="h-sheet" className="h-sheet" hidden={!menu}>
        <div className="h-wrap h-sheet__in">
          <div className="h-sheet__account">
            <LinkButton href={pagePath("start", lang)} variant="go">
              {t(C.nav.getStarted)}
            </LinkButton>
            <LinkButton href={to.aha}>{t(C.nav.launchAha)}</LinkButton>
          </div>
          <div className="h-sheet__groups">
            <PageGroups blurbs={false} idPrefix="h-sheet" />
          </div>
          <div className="h-sheet__end">
            <ul className="h-sheet__links">
              <li>
                <a className="h-sheet__link" href={pagePath("pricing", lang)} aria-current={current("pricing")}>
                  {t(C.nav.pricing)}
                </a>
              </li>
              <li>
                <a className="h-sheet__link" href={to.docs} aria-current={inDocs}>
                  {t(C.nav.docs)}
                </a>
              </li>
            </ul>
            <LangSwitch className="h-sheet__lang" size="md" />
          </div>
        </div>
      </div>
    </header>
  );
}

/** "Live: Production-ready and open to all." without "Live:" (the chip beside it says it): the words after the first colon. */
export function afterLabel(text: string): string {
  const cut = text.search(/[:：]/);
  return cut < 0 ? text : text.slice(cut + 1).trim();
}

export function Foot() {
  const { lang, t } = useI18n();
  const to = links(lang);
  const columns = [
    { id: "serve", title: t(C.nav.serve), links: NAV_SERVE.map((id) => ({ href: pagePath(id, lang), label: t(C.pages[id].name) })) },
    {
      id: "support",
      title: t(C.nav.support),
      links: [...NAV_SUPPORT.map((id) => ({ href: pagePath(id, lang), label: t(C.pages[id].name) })), { href: to.docs, label: t(C.footer.docs) }],
    },
    {
      id: "company",
      title: t(C.footer.company),
      links: [
        { href: pagePath("start", lang), label: t(C.pages.start.name) },
        { href: pagePath("pricing", lang), label: t(C.pages.pricing.name) },
        { href: to.plaza, label: t(C.footer.plaza) },
        { href: to.news, label: t(C.footer.news) },
        { href: to.console, label: t(C.footer.console) },
        { href: to.terms, label: t(C.footer.terms) },
        { href: to.privacy, label: t(C.footer.privacy) },
      ],
    },
  ];
  return (
    <footer className="h-foot">
      <div className="h-wrap h-foot__top">
        <div className="h-foot__brand">
          <Brand />
          <p>{t(C.footer.tagline)}</p>
          <BeatLine animated={false} className="h-foot__beat" />
        </div>
        <nav className="h-foot__cols" aria-label={t(C.footer.company)}>
          {columns.map((c) => (
            <div key={c.id} className="h-foot__col">
              <p className="h-foot__head">{c.title}</p>
              <ul>
                {c.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="h-wrap h-foot__legend" role="note" aria-label={t(C.status.legendTitle)}>
        {(
          [
            ["live", C.status.legendLive],
            ["beta", C.status.legendBeta],
            ["early", C.status.legendEarly],
            ["coming", C.status.legendComing],
          ] as const
        ).map(([status, text]) => (
          <p key={status}>
            <StatusChip status={status} size="sm" /> <span>{afterLabel(t(text))}</span>
          </p>
        ))}
      </div>
      <div className="h-wrap h-foot__meta">
        <span>© TokensBeat</span>
        <LangSwitch className="h-foot__lang" size="xs" />
        <span className="h-foot__endpoint">
          {t(C.footer.endpoint)} <code>{API_BASE_URL}</code>
        </span>
      </div>
    </footer>
  );
}
