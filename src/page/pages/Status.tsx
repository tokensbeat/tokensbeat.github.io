/**
 * /status/: v4's SiteStatusView. Is it working right now? Public checks only:
 *   website   this page answered, so the website does (shown once the page runs)
 *   api       GET /health from the browser, on the API origin (src/page/live.ts: api.tokensbeat.com in the published
 *             build); an error answer is a problem, no answer (or a "backend unreachable" from a host that passes
 *             it on) is Unknown: it may be the visitor's connection or the link, not the gateway
 *   aha       the snapshot the build probed (/status.json): Aha lets no other site read its health check
 *   runtime, support   no public check yet
 * The prerender makes no request: every check says Checking until the page runs.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/s1lin/button";
import { cn } from "@/components/s1lin/cn";
import { C } from "@/content/copy";
import { docUrl, links } from "@/content/links";
import { pagePath } from "@/content/site";
import { useI18n } from "@/i18n";
import { apiUrl, fetchWithTimeout, SNAPSHOT_MAX_AGE_MS, type StatusSnapshot } from "../live";
import { CtaArt } from "../CtaArt";
import { BeatLine, CtaBand, Lines, LinkButton, More, PageHero, Section, SectionHead } from "../parts";

type ComponentId = "website" | "api" | "aha" | "runtime" | "support";
type RowState = "operational" | "problem" | "checking" | "unknown" | "unchecked";
interface LiveResult {
  ok: boolean;
  at: Date;
  answered: boolean;
}
const COMPONENTS: readonly ComponentId[] = ["website", "api", "aha", "runtime", "support"];
/** The API gateway's health, on the API origin (src/page/live.ts). */
export const API_HEALTH_PATH = "/health";
export const STATUS_SNAPSHOT_PATH = "/status.json";

export function Status() {
  const { lang, t } = useI18n();
  const P = C.statusPage;
  const [mounted, setMounted] = useState(false);
  const [api, setApi] = useState<LiveResult | null>(null);
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(null);
  const [snapshotState, setSnapshotState] = useState<"loading" | "loaded" | "missing">("loading");
  const [checking, setChecking] = useState(true);
  const [now, setNow] = useState(0);
  const controller = useRef<AbortController | null>(null);

  const formatTime = (at: string | Date) => {
    const date = typeof at === "string" ? new Date(at) : at;
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const checkAll = useCallback(async () => {
    controller.current?.abort();
    const ctl = new AbortController();
    controller.current = ctl;
    setChecking(true);
    setNow(Date.now());
    setApi(null);
    const live = (async () => {
      try {
        const result = await fetchWithTimeout(apiUrl(API_HEALTH_PATH), ctl.signal, async (r) => {
          await r.text();
          // The gateway answers in JSON. The server's "backend unreachable", or anything else (a server that does not
          // pass /health on, answering with its 404 page), is no answer from the gateway, not the gateway's own error.
          const json = (r.headers.get("content-type") ?? "").includes("json");
          return { ok: r.ok && json, answered: json && r.headers.get("x-home-upstream") !== "unreachable" };
        });
        if (!ctl.signal.aborted) setApi({ ...result, at: new Date() });
      } catch {
        if (!ctl.signal.aborted) setApi({ ok: false, answered: false, at: new Date() });
      }
    })();
    const snap = (async () => {
      let body: StatusSnapshot | null;
      try {
        body = await fetchWithTimeout(STATUS_SNAPSHOT_PATH, ctl.signal, async (r) => (r.ok ? ((await r.json()) as StatusSnapshot) : null));
      } catch {
        body = null;
      }
      if (ctl.signal.aborted) return;
      const ok = body && body.version === 1 && body.probes && typeof body.probes === "object" ? body : null;
      setSnapshot(ok);
      setSnapshotState(ok ? "loaded" : "missing");
    })();
    await Promise.all([live, snap]);
    if (controller.current === ctl) setChecking(false);
  }, []);

  useEffect(() => {
    // Mounting is what the website row reports: the page answered and runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    void checkAll();
    // A clock for snapshot expiry: an open page turns an old snapshot into Unknown without a reload.
    const clock = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      controller.current?.abort();
      clearInterval(clock);
    };
  }, [checkAll]);

  function stateOf(id: ComponentId): { state: RowState; source: string } {
    switch (id) {
      case "website":
        return { state: mounted ? "operational" : "checking", source: t(P.source.page) };
      case "api": {
        if (!api) return { state: "checking", source: t(P.source.live) };
        const time = formatTime(api.at);
        if (api.ok) return { state: "operational", source: t(P.source.liveAt, { time }) };
        if (!api.answered) return { state: "unknown", source: t(P.source.liveUnreachable, { time }) };
        return { state: "problem", source: t(P.source.liveError, { time }) };
      }
      case "aha": {
        if (snapshotState === "loading") return { state: "checking", source: t(P.overallChecking) };
        const probe = snapshot?.probes.aha;
        if (!probe) return { state: "unknown", source: t(P.source.snapshotMissing) };
        const time = formatTime(probe.checked_at);
        const checkedAt = new Date(probe.checked_at).getTime();
        if (!Number.isFinite(checkedAt) || now - checkedAt > SNAPSHOT_MAX_AGE_MS) return { state: "unknown", source: t(P.source.snapshotStale, { time }) };
        if (probe.ok === null) return { state: "unknown", source: t(P.source.snapshotUnreachable, { time }) };
        return { state: probe.ok ? "operational" : "problem", source: t(P.source.snapshot, { time }) };
      }
      case "runtime":
        return { state: "unchecked", source: t(P.source.none.runtime) };
      case "support":
        return { state: "unchecked", source: t(P.source.none.support) };
    }
  }

  const rows = COMPONENTS.map((id) => ({ id, ...stateOf(id) }));
  const states = rows.map((r) => r.state);
  const overall = states.includes("problem") ? "problem" : states.includes("checking") ? "checking" : states.includes("unknown") ? "unknown" : "ok";
  const overallText = t({ checking: P.overallChecking, ok: P.overallOk, problem: P.overallProblem, unknown: P.overallUnknown }[overall]);

  return (
    <>
      <PageHero
        id="status-title"
        eyebrow={t(P.eyebrow)}
        title={t(P.title)}
        lead={t(P.lead)}
        actions={
          <>
            <Button variant="go" disabled={checking} onClick={() => void checkAll()}>
              {t(P.recheck)}
            </Button>
            <More href={pagePath("help", lang)}>{t(C.pages.help.name)}</More>
          </>
        }
      />

      <section className="h-section h-status-section" aria-labelledby="status-board">
        <div className="h-wrap">
          <div className="h-slab h-night h-status" data-theme="dark">
            <div className="h-status__head">
              <h2 id="status-board" className="h-status__title">
                {t(P.board)}
              </h2>
              <p className={cn("h-status__overall", `is-${overall}`)} role="status" aria-live="polite">
                <span className="h-status__dot" aria-hidden="true" />
                {overallText}
              </p>
            </div>
            <BeatLine className="h-status__beat" animated={overall === "ok"} />
            <ul className="h-status__rows">
              {rows.map((row) => (
                <li key={row.id} className="h-status__row" data-component={row.id} data-state={row.state}>
                  <div className="h-status__name">
                    <span className={cn("h-status__state-dot", `is-${row.state}`)} aria-hidden="true" />
                    <div>
                      <h3>{t(P.components[row.id])}</h3>
                      <p>{t(P.components[`${row.id}Body`])}</p>
                    </div>
                  </div>
                  <div className="h-status__state">
                    <span className={cn("h-status__label", `is-${row.state}`)}>{t(P.state[row.state])}</span>
                    <p className="h-status__source">{row.source}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Section id="status-how" band>
        <SectionHead id="status-how" eyebrow={t(P.how.eyebrow)} title={t(P.how.title)} />
        <Lines icon={Info} items={(["api", "aha", "runtime", "models"] as const).map((id) => t(P.how[id]))} />
      </Section>

      <CtaBand id="status-cta" title={t(P.cta.title)} lead={t(P.cta.lead)} aside={<CtaArt art="status" />}>
        <LinkButton href={links(lang).newTicket} variant="go">
          {t(C.common.openTicket)}
        </LinkButton>
        <LinkButton href={docUrl("troubleshooting", lang)}>{t(C.help.guides.troubleshooting)}</LinkButton>
      </CtaBand>
    </>
  );
}
