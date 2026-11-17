/**
 * /aha/: v4's SiteAhaView. Aha, the agent app we run on our own platform: what it does (with its storage, and Aha Code,
 * the coding agent in early access inside Aha for Windows), its apps (LaTeX and TokensBeat News among them), each set as a story with its
 * own screenshot (../figures.tsx), and its store.
 */
import { BookOpen, Gift, LayoutGrid, MessageCircle, Sparkles, SquareTerminal, Zap } from "lucide-react";
import { C } from "@/content/copy";
import { ahaAppUrl, docUrl, links, NEWS_URL } from "@/content/links";
import { pagePath, type SiteStatus } from "@/content/site";
import { useI18n } from "@/i18n";
import { CtaArt } from "../CtaArt";
import { Stories } from "../figures";
import { CtaBand, FeatureCells, LinkButton, More, NotYet, PageHero, Section, SectionHead } from "../parts";

const TILES = [
  { id: "chat", icon: MessageCircle, label: C.aha.today.chatTitle },
  { id: "research", icon: BookOpen, label: C.aha.today.researchTitle },
  { id: "images", icon: Sparkles, label: C.aha.today.imagesTitle },
  { id: "apps", icon: LayoutGrid, label: C.aha.apps.eyebrow },
  { id: "store", icon: Gift, label: C.aha.store.eyebrow },
  { id: "workspace", icon: SquareTerminal, label: C.aha.today.workspaceTitle },
] as const;

const TODAY: readonly (readonly ["chat" | "research" | "images" | "documents" | "video" | "session" | "workspace" | "storage" | "code", SiteStatus])[] = [
  ["chat", "live"],
  ["research", "live"],
  ["images", "live"],
  ["documents", "live"],
  ["video", "beta"],
  ["session", "live"],
  ["workspace", "beta"],
  ["storage", "live"],
  // Released inside Aha for Windows, shown for the accounts TokensBeat turns on (2026-11-16).
  ["code", "early"],
];

/** The apps in the order the page sets them: LaTeX leads, the others two by two. Each is shown by its own screenshot. */
const APPS = ["latex", "beads", "metro", "diary", "news"] as const;

export function Aha() {
  const { lang, t } = useI18n();
  const to = links(lang);
  const A = C.aha;
  return (
    <>
      <PageHero
        id="aha-title"
        eyebrow={t(A.eyebrow)}
        status="live"
        title={t(A.title)}
        lead={t(A.lead)}
        note={t(A.phone)}
        actions={
          <>
            <LinkButton href={to.aha} variant="go">
              {t(C.common.openAha)}
            </LinkButton>
            <More href={docUrl("agent", lang)}>{t(C.common.readDocs)}</More>
          </>
        }
        visual={
          <div className="h-slab h-night h-tiles" data-theme="dark" aria-hidden="true">
            <p className="h-slab__bar">
              <span className="h-slab__title">aha.tokensbeat.com</span>
            </p>
            <ul className="h-tiles__grid">
              {TILES.map((tile) => (
                <li key={tile.id}>
                  <tile.icon className="h-tiles__icon" focusable="false" />
                  <span>{t(tile.label)}</span>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section id="aha-today">
        <SectionHead id="aha-today" eyebrow={t(A.today.eyebrow)} title={t(A.today.title)} />
        <FeatureCells
          items={TODAY.map(([id, status]) => ({
            id,
            status,
            title: t(A.today[`${id}Title`]),
            body: t(A.today[`${id}Body`]),
            ...(id === "workspace" ? { href: pagePath("workspace", lang), linkLabel: t(C.common.learnMore) } : {}),
            ...(id === "storage" ? { href: to.plazaStorage, linkLabel: t(C.footer.plaza) } : {}),
          }))}
        />
      </Section>

      <Section id="aha-apps" band>
        <SectionHead id="aha-apps" eyebrow={t(A.apps.eyebrow)} title={t(A.apps.title)} lead={t(A.apps.lead)} status="live" />
        <Stories
          items={APPS.map((id) => ({
            id,
            shot: id,
            title: t(A.apps[id]),
            body: t(A.apps[`${id}Body`]),
            link: id === "news" ? { href: NEWS_URL, label: "news.tokensbeat.com" } : { href: ahaAppUrl(id), label: t("Open in Aha") },
          }))}
        />
      </Section>

      <Section id="aha-store">
        <SectionHead id="aha-store" eyebrow={t(A.store.eyebrow)} title={t(A.store.title)} status="live" />
        <ul className="h-lines">
          <li>
            <Sparkles className="h-lines__icon" aria-hidden="true" focusable="false" />
            <span>{t(A.store.readings)}</span>
          </li>
          <li>
            <Zap className="h-lines__icon" aria-hidden="true" focusable="false" />
            <span>{t(A.store.skills)}</span>
          </li>
        </ul>
        <NotYet id="aha-store-missing" items={[t(A.store.consult)]} />
      </Section>

      <Section id="aha-reach" band>
        <SectionHead id="aha-reach" eyebrow={t(A.reach.eyebrow)} title={t(A.reach.title)} lead={t(A.reach.lead)} status="coming" />
        <More href={pagePath("build", lang)}>{t(C.pages.build.name)}</More>
      </Section>

      <CtaBand id="aha-cta" title={t(A.cta.title)} lead={t(A.cta.lead)} aside={<CtaArt art="aha" />}>
        <LinkButton href={to.aha} variant="go">
          {t(C.common.openAha)}
        </LinkButton>
        <LinkButton href={pagePath("pricing", lang)}>{t(C.common.seePricing)}</LinkButton>
      </CtaBand>
    </>
  );
}
