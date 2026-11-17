/**
 * /workspace/: v4's SiteWorkspaceView. A cloud dev box with your agents installed, in beta by invitation; what it comes
 * with beside the console's page for it (../figures.tsx).
 */
import { Clock } from "lucide-react";
import { C } from "@/content/copy";
import { links, ticketUrl } from "@/content/links";
import { SITE_CODE } from "@/content/site";
import { useI18n } from "@/i18n";
import { CtaArt } from "../CtaArt";
import { Spread } from "../figures";
import { CodeSlab, CtaBand, Lines, LinkButton, More, PageHero, Section, SectionHead, SupportServe } from "../parts";

const ABC = ["a", "b", "c"] as const;

export function Workspace() {
  const { lang, t } = useI18n();
  const to = links(lang);
  const ticket = ticketUrl(t(C.common.ticketSubject.workspace), lang);
  const W = C.workspace;
  return (
    <>
      <PageHero
        id="workspace-title"
        eyebrow={t(W.eyebrow)}
        status="beta"
        title={t(W.title)}
        lead={t(W.lead)}
        actions={
          <>
            <LinkButton href={ticket} variant="go">
              {t(C.common.askInvite)}
            </LinkButton>
            <More href={to.ahaWorkspace}>{t(W.open)}</More>
          </>
        }
        visual={<CodeSlab title={t(W.slabTitle)} code={SITE_CODE.workspaceTerminal} />}
      />

      <Section id="workspace-gets">
        <SectionHead id="workspace-gets" eyebrow={t(W.gets.eyebrow)} title={t(W.gets.title)} />
        <Spread shot="workspaces" n={1} points={(["os", "agents", "browser", "connect"] as const).map((id) => ({ id, title: t(W.gets[`${id}Title`]), body: t(W.gets[`${id}Body`]) }))} />
      </Section>

      <Section id="workspace-billing" band>
        <SectionHead id="workspace-billing" eyebrow={t(W.billing.eyebrow)} title={t(W.billing.title)} lead={t(W.billing.lead)} />
        <Lines icon={Clock} items={(["hour", "busy", "retire", "backups"] as const).map((id) => t(W.billing[id]))} />
        <p className="h-after">
          <More href={to.plazaWorkspaces}>{t(C.footer.plaza)}</More>
        </p>
      </Section>

      <Section id="workspace-fits">
        <div className="h-teaser">
          <h2 id="workspace-fits" className="h-h2">
            {t(W.fits.title)}
          </h2>
          <p className="h-lead">{t(W.fits.body)}</p>
        </div>
      </Section>

      <SupportServe id="workspace-rails" support={ABC.map((id) => t(W.support[id]))} serve={ABC.map((id) => t(W.serve[id]))} />

      <CtaBand id="workspace-cta" title={t(W.cta.title)} lead={t(W.cta.lead)} aside={<CtaArt art="workspace" />}>
        <LinkButton href={ticket} variant="go">
          {t(C.common.askInvite)}
        </LinkButton>
        <LinkButton href={to.ahaWorkspace}>{t(W.open)}</LinkButton>
      </CtaBand>
    </>
  );
}
