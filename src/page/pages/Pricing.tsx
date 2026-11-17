/**
 * /pricing/: v4's SitePricingView. Pay as you go from one balance: how to top up, what each service costs, how to
 * keep spending in check. Live: when the backend's public settings say top-ups are closed, the top-up button goes and
 * the page says top-ups are paused (the prerender knows no settings, so it shows the button). After what each service
 * costs, the price map: every model's price, live from the Service Plaza (../PriceMap.tsx).
 */
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { C } from "@/content/copy";
import { docUrl, links } from "@/content/links";
import type { SiteStatus } from "@/content/site";
import { useI18n } from "@/i18n";
import { topUpsClosed } from "../live";
import { PriceMap } from "../PriceMap";
import { CtaArt } from "../CtaArt";
import { BeatLine, CtaBand, FeatureCells, Lines, LinkButton, PageHero, Section, SectionHead, StatusChip } from "../parts";

type Row = "models" | "images" | "sessions" | "workspaces" | "aha" | "agents" | "database" | "storage" | "realtime";
const ROWS: readonly (readonly [Row, SiteStatus])[] = [
  ["models", "live"],
  ["images", "live"],
  ["sessions", "live"],
  ["workspaces", "beta"],
  ["aha", "live"],
  ["agents", "early"],
  ["database", "early"],
  ["storage", "early"],
  ["realtime", "early"],
];
const BALANCE: readonly Row[] = ["models", "images", "sessions", "workspaces", "aha"];

export function Pricing() {
  const { lang, t } = useI18n();
  const to = links(lang);
  const P = C.pricing;
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const ctl = new AbortController();
    topUpsClosed(ctl.signal).then(setClosed, () => undefined);
    return () => ctl.abort();
  }, []);

  return (
    <>
      <PageHero
        id="pricing-title"
        eyebrow={t(P.eyebrow)}
        title={t(P.title)}
        lead={t(P.lead)}
        actions={
          <>
            {!closed && (
              <LinkButton href={to.topUp} variant="go">
                {t(P.pay.cta)}
              </LinkButton>
            )}
            <LinkButton href={to.plaza}>{t(P.plazaCta)}</LinkButton>
          </>
        }
        visual={
          <div className="h-slab h-night h-balance" data-theme="dark" aria-hidden="true">
            <p className="h-slab__bar">
              <span className="h-slab__title">{t(C.home.diagram.billing)}</span>
              <span>USD</span>
            </p>
            <div className="h-balance__body">
              <p className="h-balance__figure">
                $5<span>+</span>
              </p>
              <ul>
                {BALANCE.map((id) => (
                  <li key={id}>
                    <span>{t(P.table[id])}</span>
                    <BeatLine animated={false} className="h-balance__beat" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      />
      {closed && (
        <div className="h-wrap">
          <p className="h-paused" role="status">
            {t(P.paused)}
          </p>
        </div>
      )}

      <Section id="pricing-pay">
        <SectionHead id="pricing-pay" eyebrow={t(P.pay.eyebrow)} title={t(P.pay.title)} />
        <FeatureCells columns={4} items={(["min", "fee", "currency", "refund"] as const).map((id) => ({ id, title: t(P.pay[`${id}Title`]), body: t(P.pay[`${id}Body`]) }))} />
      </Section>

      <Section id="pricing-table" band>
        <SectionHead id="pricing-table" eyebrow={t(P.table.eyebrow)} title={t(P.table.title)} />
        <table className="h-table h-table--price">
          <caption className="h-visually-hidden">{t(P.table.title)}</caption>
          <thead>
            <tr>
              <th scope="col">{t(P.table.service)}</th>
              <th scope="col">{t(P.table.unit)}</th>
              <th scope="col">{t(P.table.status)}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([id, status]) => (
              <tr key={id} data-row={id}>
                <th scope="row">{t(P.table[id])}</th>
                <td data-label={t(P.table.unit)}>{t(P.table[`${id}Unit`])}</td>
                <td data-label={t(P.table.status)}>
                  <StatusChip status={status} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <PriceMap />

      <Section id="pricing-control">
        <SectionHead id="pricing-control" eyebrow={t(P.control.eyebrow)} title={t(P.control.title)} />
        <Lines icon={Check} items={(["caps", "simple", "usage", "plaza"] as const).map((id) => t(P.control[id]))} />
      </Section>

      <CtaBand id="pricing-cta" title={t(P.cta.title)} lead={t(P.cta.lead)} aside={<CtaArt art="pricing" />}>
        <LinkButton href={to.keys} variant="go">
          {t(C.common.getKey)}
        </LinkButton>
        <LinkButton href={docUrl("billing", lang)}>{t(C.common.readDocs)}</LinkButton>
      </CtaBand>
    </>
  );
}
