/**
 * /agents/: v4's SiteAgentsView. Your assistant as a persona with tools on the runtime behind Aha, in early access. The
 * runtime has no screens of its own yet; Aha, the first app on it, is shown as it opens (../figures.tsx).
 */
import { Check, Shield } from "lucide-react";
import { C } from "@/content/copy";
import { ticketUrl } from "@/content/links";
import { pagePath, SITE_CODE } from "@/content/site";
import { useI18n } from "@/i18n";
import { CtaArt } from "../CtaArt";
import { Shot } from "../figures";
import { CodeSlab, CtaBand, Lines, LinkButton, More, NotYet, PageHero, Section, SectionHead, StatusChip, Steps, SupportServe } from "../parts";

const ABC = ["a", "b", "c"] as const;

export function Agents() {
  const { lang, t } = useI18n();
  const ticket = ticketUrl(t(C.common.ticketSubject.agents), lang);
  const A = C.agents;
  return (
    <>
      <PageHero
        id="agents-title"
        eyebrow={t(A.eyebrow)}
        status="early"
        title={t(A.title)}
        lead={t(A.lead)}
        note={t(C.common.ticketNote)}
        actions={
          <>
            <LinkButton href={ticket} variant="go">
              {t(C.common.requestAccess)}
            </LinkButton>
            <More href={pagePath("aha", lang)}>{t(A.proof.title)}</More>
          </>
        }
        visual={<CodeSlab title={t(A.slabTitle)} note={t(A.slabNote)} code={SITE_CODE.agentRun} />}
      />

      <Section id="agents-how">
        <SectionHead id="agents-how" eyebrow={t(A.how.eyebrow)} title={t(A.how.title)} lead={t(A.how.lead)} status="early" />
        <Steps items={(["persona", "tools", "key"] as const).map((id) => ({ title: t(A.how[`${id}Title`]), body: t(A.how[`${id}Body`]) }))} />
      </Section>

      <Section id="agents-builtin" band>
        <div className="h-two">
          <div className="h-two__col">
            <p className="h-eyebrow">
              <span>{t(A.builtin.eyebrow)}</span>
              <StatusChip status="early" />
            </p>
            <h2 id="agents-builtin" className="h-h2 h-two__title">
              {t(A.builtin.title)}
            </h2>
            <Lines one icon={Check} items={(["search", "image", "limits"] as const).map((id) => t(A.builtin[id]))} />
          </div>
          <div className="h-two__col">
            <p className="h-eyebrow">
              <span>{t(A.isolation.eyebrow)}</span>
              <StatusChip status="early" />
            </p>
            <h2 className="h-h2 h-two__title">{t(A.isolation.title)}</h2>
            <p className="h-body">{t(A.isolation.lead)}</p>
            <Lines one icon={Shield} items={(["stores", "caps", "token", "audit"] as const).map((id) => t(A.isolation[id]))} />
          </div>
        </div>
      </Section>

      <Section id="agents-proof">
        <div className="h-split">
          <Shot id="aha" n={1} />
          <div className="h-split__copy">
            <StatusChip status="live" />
            <h2 id="agents-proof" className="h-h2">
              {t(A.proof.title)}
            </h2>
            <p className="h-lead">{t(A.proof.body)}</p>
            <More href={pagePath("aha", lang)}>{t(C.common.learnMore)}</More>
          </div>
        </div>
        <NotYet id="agents-missing" items={(["docs", "selfServe", "console"] as const).map((id) => t(A.missing[id]))} />
      </Section>

      <SupportServe id="agents-rails" support={ABC.map((id) => t(A.support[id]))} serve={ABC.map((id) => t(A.serve[id]))} />

      <CtaBand id="agents-cta" title={t(A.cta.title)} lead={t(A.cta.lead)} aside={<CtaArt art="agents" />}>
        <LinkButton href={ticket} variant="go">
          {t(C.common.requestAccess)}
        </LinkButton>
        <LinkButton href={pagePath("models", lang)}>{t(C.pages.models.name)}</LinkButton>
      </CtaBand>
    </>
  );
}
