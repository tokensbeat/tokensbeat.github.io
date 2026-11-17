/**
 * /ai-models/: v4's SiteModelsView. One key to the leading models: the base URL to copy and code examples in four
 * tabs, the four families (with their makers' marks), the API styles, key plans and the plaza (and the pricing page's
 * price map), each beside a screenshot of the console (../figures.tsx), and what production needs.
 */
import { Check } from "lucide-react";
import { Copy } from "@/components/s1lin/copy";
import { Tabs } from "@/components/s1lin/tabs";
import { VendorMark } from "@/components/app/VendorMark";
import { C } from "@/content/copy";
import { API_BASE_URL, docUrl, links } from "@/content/links";
import { API_STYLES, ENDPOINT_SNIPPETS, pagePath } from "@/content/site";
import { useI18n } from "@/i18n";
import type { VendorId } from "@/lib/vendor";
import { CtaArt } from "../CtaArt";
import { Spread } from "../figures";
import { CtaBand, FeatureCells, Lines, LinkButton, More, PageHero, Section, SectionHead, SupportServe } from "../parts";

const ABC = ["a", "b", "c"] as const;
const FAMILIES: readonly { id: "anthropic" | "openai" | "google" | "open"; marks: readonly VendorId[] }[] = [
  { id: "anthropic", marks: ["anthropic"] },
  { id: "openai", marks: ["openai"] },
  { id: "google", marks: ["google"] },
  { id: "open", marks: ["qwen", "deepseek", "kimi", "zhipu"] },
];

/** A line of code with the base URL marked in jade, as v4 marks the line that carries it. */
function CodeLines({ code }: { code: string }) {
  return (
    <code>
      {code.split("\n").map((line, i) => {
        const at = line.indexOf(API_BASE_URL);
        return (
          <span key={i} className={at >= 0 ? "h-snippets__line is-key" : "h-snippets__line"}>
            {at >= 0 ? (
              <>
                {line.slice(0, at)}
                <mark>{API_BASE_URL}</mark>
                {line.slice(at + API_BASE_URL.length)}
              </>
            ) : (
              line || " "
            )}
          </span>
        );
      })}
    </code>
  );
}

/** The base URL with Copy, and the code examples in tabs on a night slab. */
function Endpoint() {
  const { t } = useI18n();
  return (
    <>
      <div className="h-endpoint">
        <span className="h-endpoint__label">{t(C.models.endpointLabel)}</span>
        <code className="h-endpoint__url">{API_BASE_URL}</code>
        <Copy value={API_BASE_URL} label={t("kit::Copy {name}", { name: API_BASE_URL })} />
      </div>
      <div className="h-slab h-night h-snippets" data-theme="dark">
        <Tabs
          label={t("Code examples")}
          tabs={ENDPOINT_SNIPPETS.map((s) => ({
            id: s.id,
            label: s.label,
            content: (
              <div className="h-snippets__panel">
                <div className="h-snippets__file">
                  <span>{s.file}</span>
                  <Copy value={s.code} label={t("kit::Copy {name}", { name: s.label })} />
                </div>
                <pre tabIndex={0} role="region" aria-label={`${s.label} · ${s.file}`}>
                  <CodeLines code={s.code} />
                </pre>
                <p className="h-snippets__note">{t(s.note)}</p>
              </div>
            ),
          }))}
        />
      </div>
    </>
  );
}

export function Models() {
  const { lang, t } = useI18n();
  const to = links(lang);
  const M = C.models;
  return (
    <>
      <PageHero
        id="models-title"
        eyebrow={t(M.eyebrow)}
        status="live"
        title={t(M.title)}
        lead={t(M.lead)}
        actions={
          <>
            <LinkButton href={to.keys} variant="go">
              {t(C.common.getKey)}
            </LinkButton>
            <LinkButton href={docUrl("models", lang)}>{t(C.common.readDocs)}</LinkButton>
          </>
        }
        visual={<Endpoint />}
      />

      <Section id="models-families">
        <SectionHead id="models-families" eyebrow={t(M.families.eyebrow)} title={t(M.families.title)} lead={t(M.families.lead)} />
        <FeatureCells
          columns={4}
          items={FAMILIES.map((f) => ({
            id: f.id,
            status: "live",
            title: t(M.families[f.id]),
            body: t(M.families[`${f.id}Body`]),
            art: (
              <span className="h-cell__art" aria-hidden="true">
                {f.marks.map((v) => (
                  <VendorMark key={v} vendor={v} size={34} />
                ))}
              </span>
            ),
          }))}
        />
      </Section>

      <Section id="models-apis" band>
        <SectionHead id="models-apis" eyebrow={t(M.apis.eyebrow)} title={t(M.apis.title)} lead={t(M.apis.lead)} />
        <ul className="h-apis">
          {API_STYLES.map((api) => (
            <li key={api.id}>
              <span className="h-apis__name">{t(M.apis[api.id])}</span>
              <code>{api.path}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="models-plans">
        <SectionHead id="models-plans" eyebrow={t(M.plans.eyebrow)} title={t(M.plans.title)} lead={t(M.plans.lead)} />
        <Spread shot="newkey" n={1} points={(["best", "official", "simple", "check"] as const).map((id) => ({ id, title: t(M.plans[`${id}Title`]), body: t(M.plans[`${id}Body`]) }))} />
      </Section>

      <Section id="models-plaza" band>
        <SectionHead id="models-plaza" eyebrow={t(M.plaza.eyebrow)} title={t(M.plaza.title)} lead={t(M.plaza.lead)} />
        <Spread
          shot="models"
          n={2}
          flip
          points={(["prices", "health", "bench", "private"] as const).map((id) => ({ id, title: t(M.plaza[`${id}Title`]), body: t(M.plaza[`${id}Body`]) }))}
          after={
            <p className="h-after--row">
              <More href={to.plaza}>{t(M.plaza.cta)}</More>
              <More href={`${pagePath("pricing", lang)}#pricing-map`}>{t(M.plaza.mapCta)}</More>
            </p>
          }
        />
      </Section>

      <Section id="models-production">
        <SectionHead id="models-production" eyebrow={t(M.production.eyebrow)} title={t(M.production.title)} />
        <Lines icon={Check} items={(["usage", "caps", "groups", "balance"] as const).map((id) => t(M.production[id]))} />
      </Section>

      <SupportServe id="models-rails" support={ABC.map((id) => t(M.support[id]))} serve={ABC.map((id) => t(M.serve[id]))} />

      <CtaBand id="models-cta" title={t(M.cta.title)} lead={t(M.cta.lead)} aside={<CtaArt art="models" />}>
        <LinkButton href={to.keys} variant="go">
          {t(C.common.getKey)}
        </LinkButton>
        <LinkButton href={pagePath("pricing", lang)}>{t(C.common.seePricing)}</LinkButton>
      </CtaBand>
    </>
  );
}
