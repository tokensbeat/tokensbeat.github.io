/** /build/: v4's SiteBuildView. Build your product on TokensBeat: what a project gets, how to join the list. */
import { Info } from "lucide-react";
import { C } from "@/content/copy";
import { links, ticketUrl } from "@/content/links";
import { pagePath, type SiteStatus } from "@/content/site";
import { useI18n } from "@/i18n";
import { CtaArt } from "../CtaArt";
import { CtaBand, FeatureCells, Lines, LinkButton, More, PageHero, Section, SectionHead, StatusChip, Steps } from "../parts";

type Layer = "data" | "keys" | "agent" | "deploy" | "domain" | "reach" | "person";

/** A project, as the self-serve plan builds it: the backend first, then keys, agent, deploys and domain. */
const STACK: readonly (readonly [Layer, SiteStatus])[] = [
  ["reach", "coming"],
  ["domain", "coming"],
  ["deploy", "coming"],
  ["agent", "early"],
  ["keys", "coming"],
  ["data", "early"],
  ["person", "live"],
];
const GETS: readonly (readonly [Layer, SiteStatus])[] = [
  ["data", "early"],
  ["keys", "coming"],
  ["agent", "early"],
  ["deploy", "coming"],
  ["domain", "coming"],
  ["reach", "coming"],
  ["person", "live"],
];

export function Build() {
  const { lang, t } = useI18n();
  const ticket = ticketUrl(t(C.common.ticketSubject.build), lang);
  const B = C.build;
  return (
    <>
      <PageHero
        id="build-title"
        eyebrow={t(B.eyebrow)}
        status="early"
        title={t(B.title)}
        lead={t(B.lead)}
        note={t(C.common.ticketNote)}
        actions={
          <>
            <LinkButton href={ticket} variant="go">
              {t(C.common.requestAccess)}
            </LinkButton>
            <More href={pagePath("supabase", lang)}>{t(C.common.compare)}</More>
          </>
        }
        visual={
          <div className="h-slab h-night h-layers" data-theme="dark" aria-hidden="true">
            <p className="h-slab__bar">
              <span className="h-slab__title">{t(B.gets.eyebrow)}</span>
            </p>
            <ol className="h-layers__list">
              {STACK.map(([id, status]) => (
                <li key={id} className={`is-${status}`}>
                  <span>{t(B.gets[`${id}Title`])}</span>
                  <StatusChip status={status} size="sm" />
                </li>
              ))}
            </ol>
          </div>
        }
      />

      <Section id="build-gets">
        <SectionHead id="build-gets" eyebrow={t(B.gets.eyebrow)} title={t(B.gets.title)} />
        <FeatureCells items={GETS.map(([id, status]) => ({ id, status, title: t(B.gets[`${id}Title`]), body: t(B.gets[`${id}Body`]) }))} />
      </Section>

      <Section id="build-apply" band>
        <SectionHead id="build-apply" eyebrow={t(B.apply.eyebrow)} title={t(B.apply.title)} />
        <Steps items={(["s1", "s2", "s3"] as const).map((id) => ({ title: t(B.apply[id]), body: t(B.apply[`${id}Body`]) }))} />
        <p className="h-after">
          <LinkButton href={ticket} variant="go">
            {t(C.common.requestAccess)}
          </LinkButton>
        </p>
      </Section>

      <Section id="build-honest">
        <SectionHead id="build-honest" eyebrow={t(B.honest.eyebrow)} title={t(B.honest.title)} />
        <Lines icon={Info} items={(["selfServe", "prices", "labels"] as const).map((id) => t(B.honest[id]))} />
      </Section>

      <CtaBand id="build-cta" title={t(B.cta.title)} lead={t(B.cta.lead)} aside={<CtaArt art="build" />}>
        <LinkButton href={ticket} variant="go">
          {t(C.common.requestAccess)}
        </LinkButton>
        <LinkButton href={links(lang).keys}>{t(C.common.getKey)}</LinkButton>
      </CtaBand>
    </>
  );
}
