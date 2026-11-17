/** /database/: v4's SiteDatabaseView. Postgres and sign-in per project, in early access; what is not there yet. */
import { Shield } from "lucide-react";
import { C } from "@/content/copy";
import { links, ticketUrl } from "@/content/links";
import { pagePath, SITE_CODE } from "@/content/site";
import { useI18n } from "@/i18n";
import { CtaArt } from "../CtaArt";
import { CodeSlab, CtaBand, FaqList, FeatureCells, Lines, LinkButton, More, NotYet, PageHero, Section, SectionHead, SupportServe } from "../parts";

const INCLUDES = ["postgres", "rest", "auth", "keys", "rls", "jwks", "backups", "console"] as const;
const MISSING = ["signup", "direct", "editor", "branching", "selfServe"] as const;
const ISOLATION = ["network", "egress", "secrets", "limits"] as const;
const ABC = ["a", "b", "c"] as const;

export function Database() {
  const { lang, t } = useI18n();
  const ticket = ticketUrl(t(C.common.ticketSubject.database), lang);
  const D = C.database;
  return (
    <>
      <PageHero
        id="database-title"
        eyebrow={t(D.eyebrow)}
        status="early"
        title={t(D.title)}
        lead={t(D.lead)}
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
          <>
            <CodeSlab title={t(D.slabTitle)} note={t(D.slabNote)} code={SITE_CODE.projectEndpoints} />
            <CodeSlab title="REST · RLS" code={SITE_CODE.restCurl} />
          </>
        }
      />

      <Section id="database-includes">
        <SectionHead id="database-includes" eyebrow={t(D.includes.eyebrow)} title={t(D.includes.title)} lead={t(D.includes.lead)} status="early" />
        <FeatureCells columns={4} items={INCLUDES.map((id) => ({ id, title: t(D.includes[`${id}Title`]), body: t(D.includes[`${id}Body`]) }))} />
        <NotYet id="database-missing" items={MISSING.map((id) => t(D.missing[id]))} />
      </Section>

      <Section id="database-isolation" band>
        <SectionHead id="database-isolation" eyebrow={t(D.isolation.eyebrow)} title={t(D.isolation.title)} lead={t(D.isolation.lead)} />
        <Lines icon={Shield} items={ISOLATION.map((id) => t(D.isolation[id]))} />
      </Section>

      <SupportServe id="database-rails" support={ABC.map((id) => t(D.support[id]))} serve={ABC.map((id) => t(D.serve[id]))} />

      <FaqList id="database-faq" items={(["js", "psql", "price"] as const).map((id) => ({ id, question: t(D.faq[`${id}Q`]), answer: t(D.faq[`${id}A`]) }))} />

      <CtaBand id="database-cta" title={t(D.cta.title)} lead={t(D.cta.lead)} aside={<CtaArt art="database" />}>
        <LinkButton href={ticket} variant="go">
          {t(C.common.requestAccess)}
        </LinkButton>
        <LinkButton href={links(lang).keys}>{t(C.common.getKey)}</LinkButton>
      </CtaBand>
    </>
  );
}
