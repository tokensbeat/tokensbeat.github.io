/** /help/: v4's SiteHelpView. Guides for every step, a person by ticket, the status page, help for builders. */
import { ArrowRight, Users } from "lucide-react";
import { C } from "@/content/copy";
import { docUrl, links } from "@/content/links";
import { HELP_GUIDES, pagePath } from "@/content/site";
import { useI18n } from "@/i18n";
import { CtaArt } from "../CtaArt";
import { Spread } from "../figures";
import { BeatLine, CtaBand, Lines, LinkButton, More, NotYet, PageHero, Section, SectionHead, StatusChip } from "../parts";

const PEOPLE = ["open", "reply", "track"] as const;

export function Help() {
  const { lang, t } = useI18n();
  const to = links(lang);
  const H = C.help;
  const groups = (["start", "api", "tools", "fix"] as const).map((id) => ({ id, guides: HELP_GUIDES.filter((g) => g.group === id).map((g) => g.id) }));
  return (
    <>
      <PageHero
        id="help-title"
        eyebrow={t(H.eyebrow)}
        title={t(H.title)}
        lead={t(H.lead)}
        actions={
          <>
            <LinkButton href={to.newTicket} variant="go">
              {t(C.common.openTicket)}
            </LinkButton>
            <LinkButton href={to.docs}>{t(C.common.readDocs)}</LinkButton>
          </>
        }
        visual={
          <div className="h-slab h-night h-flow" data-theme="dark" aria-hidden="true">
            <p className="h-slab__bar">
              <span className="h-slab__title">{t(C.common.openTicket)}</span>
              <StatusChip status="live" size="sm" />
            </p>
            <ol className="h-flow__list">
              {PEOPLE.map((id) => (
                <li key={id}>
                  <span className="h-flow__dot" />
                  {t(H.people[id])}
                </li>
              ))}
            </ol>
            <BeatLine className="h-flow__beat" />
          </div>
        }
      />

      <Section id="help-guides">
        <SectionHead id="help-guides" eyebrow={t(H.guides.eyebrow)} title={t(H.guides.title)} lead={t(H.guides.lead)} status="live" />
        <div className="h-guides">
          {groups.map((g) => (
            <div key={g.id} className="h-guides__group">
              <h3 className="h-guides__head">{t(H.guides[g.id])}</h3>
              <ul>
                {g.guides.map((id) => (
                  <li key={id}>
                    <a className="h-guides__link" href={docUrl(id, lang)}>
                      <span>{t(H.guides[id])}</span>
                      <ArrowRight className="h-guides__arrow" aria-hidden="true" focusable="false" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="h-after">
          <More href={to.docs}>{t(H.guides.all)}</More>
        </p>
      </Section>

      <Section id="help-people" band>
        <SectionHead id="help-people" eyebrow={t(H.people.eyebrow)} title={t(H.people.title)} lead={t(H.people.lead)} status="live" />
        <Spread
          shot="ticket"
          n={1}
          points={PEOPLE.map((id) => ({ id, body: t(H.people[id]) }))}
          after={<More href={to.newTicket}>{t(C.common.openTicket)}</More>}
        />
      </Section>

      <Section id="help-status">
        <SectionHead id="help-status" eyebrow={t(H.status.eyebrow)} title={t(H.status.title)} lead={t(H.status.lead)} />
        <More href={pagePath("status", lang)}>{t(H.status.cta)}</More>
      </Section>

      <Section id="help-builders" band>
        <SectionHead id="help-builders" eyebrow={t(H.builders.eyebrow)} title={t(H.builders.title)} status="early" />
        <Lines icon={Users} items={(["setup", "review"] as const).map((id) => t(H.builders[id]))} />
        <NotYet id="help-builders-missing" items={[t(H.builders.consult)]} />
        <p className="h-after h-legal">
          <More href={to.terms}>{t(C.footer.terms)}</More>
          <More href={to.privacy}>{t(C.footer.privacy)}</More>
        </p>
      </Section>

      <CtaBand id="help-cta" title={t(H.cta.title)} lead={t(H.cta.lead)} aside={<CtaArt art="help" />}>
        <LinkButton href={to.newTicket} variant="go">
          {t(C.common.openTicket)}
        </LinkButton>
        <LinkButton href={docUrl("troubleshooting", lang)}>{t(H.guides.troubleshooting)}</LinkButton>
      </CtaBand>
    </>
  );
}
