/**
 * /storage/: v4's SiteStorageView. Private buckets and realtime in early access; TokensBeat Files, the file store for
 * projects and Aha, built and not switched on yet; functions are next.
 */
import { C } from "@/content/copy";
import { ticketUrl } from "@/content/links";
import { pagePath, SITE_CODE } from "@/content/site";
import { useI18n } from "@/i18n";
import { CtaArt } from "../CtaArt";
import { CodeSlab, CtaBand, FeatureCells, LinkButton, More, NotYet, PageHero, Section, SectionHead, SupportServe } from "../parts";

const ABC = ["a", "b", "c"] as const;

export function Storage() {
  const { lang, t } = useI18n();
  const ticket = ticketUrl(t(C.common.ticketSubject.storage), lang);
  const S = C.storage;
  return (
    <>
      <PageHero
        id="storage-title"
        eyebrow={t(S.eyebrow)}
        status="early"
        title={t(S.title)}
        lead={t(S.lead)}
        note={t(C.common.ticketNote)}
        actions={
          <>
            <LinkButton href={ticket} variant="go">
              {t(C.common.requestAccess)}
            </LinkButton>
            <More href={pagePath("database", lang)}>{t(C.pages.database.name)}</More>
          </>
        }
        visual={<CodeSlab title={t(S.slabTitle)} code={SITE_CODE.storageCurl} />}
      />

      <Section id="storage-files">
        <SectionHead id="storage-files" eyebrow={t(S.storage.eyebrow)} title={t(S.storage.title)} lead={t(S.storage.lead)} status="early" />
        <FeatureCells items={(["private", "size", "console"] as const).map((id) => ({ id, title: t(S.storage[`${id}Title`]), body: t(S.storage[`${id}Body`]) }))} />
        <NotYet id="storage-missing" items={[t(S.storage.transforms)]} />
      </Section>

      <Section id="storage-filestore" band>
        <SectionHead id="storage-filestore" eyebrow={t(S.files.eyebrow)} title={t(S.files.title)} lead={t(S.files.lead)} status="early" />
        <FeatureCells
          columns={2}
          items={(["upload", "check", "read", "share"] as const).map((id) => ({ id, title: t(S.files[`${id}Title`]), body: t(S.files[`${id}Body`]) }))}
        />
        <NotYet id="storage-filestore-missing" items={[t(S.files.search)]} />
      </Section>

      <Section id="storage-realtime">
        <SectionHead id="storage-realtime" eyebrow={t(S.realtime.eyebrow)} title={t(S.realtime.title)} lead={t(S.realtime.lead)} />
        <FeatureCells
          columns={2}
          items={[
            { id: "changes", status: "early", title: t(S.realtime.changesTitle), body: t(S.realtime.changesBody) },
            { id: "channels", status: "coming", title: t(S.realtime.channelsTitle), body: t(S.realtime.channelsBody) },
          ]}
        />
      </Section>

      <Section id="storage-functions" band>
        <SectionHead id="storage-functions" eyebrow={t(S.functions.eyebrow)} title={t(S.functions.title)} lead={t(S.functions.lead)} status="coming" />
        <FeatureCells
          columns={2}
          items={[
            { id: "serverless", status: "coming", title: t(S.functions.serverlessTitle), body: t(S.functions.serverlessBody) },
            {
              id: "tools",
              status: "early",
              title: t(S.functions.toolsTitle),
              body: t(S.functions.toolsBody),
              href: pagePath("agents", lang),
              linkLabel: t(C.pages.agents.name),
            },
          ]}
        />
      </Section>

      <SupportServe id="storage-rails" support={ABC.map((id) => t(S.support[id]))} serve={ABC.map((id) => t(S.serve[id]))} />

      <CtaBand id="storage-cta" title={t(S.cta.title)} lead={t(S.cta.lead)} aside={<CtaArt art="storage" />}>
        <LinkButton href={ticket} variant="go">
          {t(C.common.requestAccess)}
        </LinkButton>
        <LinkButton href={pagePath("workspace", lang)}>{t(C.pages.workspace.name)}</LinkButton>
      </CtaBand>
    </>
  );
}
