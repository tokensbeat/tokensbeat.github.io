/** /supabase/: v4's SiteSupabaseView. An honest comparison with Supabase, how a move will work, what stays different. */
import { ArrowDown, CircleAlert } from "lucide-react";
import { C } from "@/content/copy";
import { links, ticketUrl } from "@/content/links";
import { SITE_CODE, type SiteStatus } from "@/content/site";
import { useI18n } from "@/i18n";
import { CtaArt } from "../CtaArt";
import { CodeSlab, CtaBand, Lines, LinkButton, PageHero, Section, SectionHead, StatusChip, Steps } from "../parts";

type T = typeof C.supabase.table;
interface Row {
  id: "postgres" | "rest" | "auth" | "rls" | "storage" | "realtime" | "client" | "functions" | "direct" | "studio" | "recovery" | "models" | "agent" | "devbox" | "app";
  them: "yes" | "no" | "text";
  status: SiteStatus;
}

/** Each row's TokensBeat status (as the earlier Vue site gave it); "text" rows say more than yes. */
const GROUPS: { id: "groupBackend" | "groupAi"; rows: Row[] }[] = [
  {
    id: "groupBackend",
    rows: [
      { id: "postgres", them: "yes", status: "early" },
      { id: "rest", them: "yes", status: "early" },
      { id: "auth", them: "text", status: "early" },
      { id: "rls", them: "yes", status: "early" },
      { id: "storage", them: "text", status: "early" },
      { id: "realtime", them: "text", status: "early" },
      { id: "client", them: "yes", status: "early" },
      { id: "functions", them: "yes", status: "coming" },
      { id: "direct", them: "yes", status: "coming" },
      { id: "studio", them: "yes", status: "coming" },
      { id: "recovery", them: "yes", status: "coming" },
    ],
  },
  {
    id: "groupAi",
    rows: [
      { id: "models", them: "no", status: "live" },
      { id: "agent", them: "no", status: "early" },
      { id: "devbox", them: "no", status: "beta" },
      { id: "app", them: "no", status: "live" },
    ],
  },
];

function themOf(table: T, row: Row): string {
  if (row.them === "yes") return table.yes;
  if (row.them === "no") return table.no;
  return table[`${row.id as "auth" | "storage" | "realtime"}Them`];
}

export function Supabase() {
  const { lang, t } = useI18n();
  const ticket = ticketUrl(t(C.common.ticketSubject.supabase), lang);
  const S = C.supabase;
  const T = S.table;
  return (
    <>
      <PageHero
        id="supabase-title"
        eyebrow={t(S.eyebrow)}
        title={t(S.title)}
        lead={t(S.lead)}
        note={t(S.early)}
        actions={
          <>
            <LinkButton href={ticket} variant="go">
              {t(C.common.requestAccess)}
            </LinkButton>
            <a className="h-more" href="#supabase-table">
              {t(T.title)}
              <ArrowDown className="h-more__icon" aria-hidden="true" focusable="false" />
            </a>
          </>
        }
        visual={
          <div className="h-slab h-night h-paths" data-theme="dark">
            <p className="h-slab__bar">
              <span className="h-slab__title">{t(C.home.compare.same)}</span>
              <StatusChip status="early" size="sm" />
            </p>
            <ul className="h-paths__list">
              {SITE_CODE.projectPaths.map((row) => (
                <li key={row.path}>
                  <code>{row.path}</code>
                  <span>{row.label}</span>
                </li>
              ))}
            </ul>
            <div className="h-paths__plus">
              <p>{t(C.home.compare.more)}</p>
              <ul>
                <li>
                  <span>{t(T.models)}</span>
                  <StatusChip status="live" size="sm" />
                </li>
                <li>
                  <span>{t(T.agent)}</span>
                  <StatusChip status="early" size="sm" />
                </li>
                <li>
                  <span>{t(T.devbox)}</span>
                  <StatusChip status="beta" size="sm" />
                </li>
              </ul>
            </div>
          </div>
        }
      />

      <Section id="supabase-table">
        <SectionHead id="supabase-table" eyebrow={t(T.eyebrow)} title={t(T.title)} lead={t(T.lead)} />
        <table className="h-table h-table--compare">
          <caption className="h-visually-hidden">{t(T.title)}</caption>
          <thead>
            <tr>
              <th scope="col">{t(T.capability)}</th>
              <th scope="col">{t(T.supabase)}</th>
              <th scope="col">{t(T.tokensbeat)}</th>
            </tr>
          </thead>
          {GROUPS.map((g) => (
            <tbody key={g.id}>
              <tr className="h-table__group">
                <th scope="colgroup" colSpan={3}>
                  {t(T[g.id])}
                </th>
              </tr>
              {g.rows.map((row) => (
                <tr key={row.id} data-row={row.id}>
                  <th scope="row">{t(T[row.id])}</th>
                  <td data-label={t(T.supabase)} className="h-table__them">
                    {t(themOf(T, row))}
                  </td>
                  <td data-label={t(T.tokensbeat)}>
                    <div className="h-table__us">
                      <StatusChip status={row.status} size="sm" />
                      <span>{t(T[`${row.id}Us`])}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </Section>

      <Section id="supabase-steps" band>
        <SectionHead id="supabase-steps" eyebrow={t(S.steps.eyebrow)} title={t(S.steps.title)} lead={t(S.steps.lead)} status="early" />
        <Steps five items={(["s1", "s2", "s3", "s4", "s5"] as const).map((id) => ({ title: t(S.steps[id]), body: t(S.steps[`${id}Body`]) }))} />
        <div className="h-client">
          <CodeSlab title="supabase-js" note={t(T.clientUs)} code={SITE_CODE.supabaseClient} />
        </div>
      </Section>

      <Section id="supabase-differ">
        <SectionHead id="supabase-differ" eyebrow={t(S.differ.eyebrow)} title={t(S.differ.title)} />
        <Lines icon={CircleAlert} items={(["direct", "functions", "auth", "region"] as const).map((id) => t(S.differ[id]))} />
      </Section>

      <CtaBand id="supabase-cta" title={t(S.cta.title)} lead={t(S.cta.lead)} aside={<CtaArt art="supabase" />}>
        <LinkButton href={ticket} variant="go">
          {t(C.common.requestAccess)}
        </LinkButton>
        <LinkButton href={links(lang).keys}>{t(C.common.getKey)}</LinkButton>
      </CtaBand>
    </>
  );
}
