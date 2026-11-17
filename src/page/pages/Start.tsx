/**
 * /start/ and /zh/start/: where the head's Get started leads (owner, 2026-11-02). A short title, then two choices side
 * by side (stacked on a phone), each a framed card with its picture, its address, one line of what it is and its one
 * action; the whole card is the link. The console (for building, on the night slab as the homepage's Serve rail is)
 * and Aha (the agent app, on paper). Under them, the docs and pricing for a visitor who is not sure yet.
 *
 * A visitor who arrived with an invite code (?aff=CODE: a referral link to this page) goes to the console's sign-up
 * with it. The code is read in the browser after hydration (useSyncExternalStore: the prerendered page, and the first
 * render that hydrates it, have none, so the two agree).
 */
import { useSyncExternalStore } from "react";
import { LayoutDashboard, MessagesSquare, type LucideIcon } from "lucide-react";
import { C } from "@/content/copy";
import { AHA_URL, CONSOLE_ORIGIN, consoleEntry, docUrl, inviteCode } from "@/content/links";
import { pagePath } from "@/content/site";
import { useI18n } from "@/i18n";
import { BeatLine, LinkButton, More } from "../parts";

const noChange = () => () => {};
const codeInAddress = () => inviteCode(new URLSearchParams(window.location.search).get("aff"));

/** The invite code in this page's address, or null (always null on the server and while hydrating). */
function useInviteCode(): string | null {
  return useSyncExternalStore(noChange, codeInAddress, () => null);
}

function Choice({ id, icon: Icon, host, name, line, href, action, night = false }: { id: string; icon: LucideIcon; host: string; name: string; line: string; href: string; action: string; night?: boolean }) {
  return (
    <li className={`h-start__choice${night ? " h-night" : ""}`} data-theme={night ? "dark" : undefined} data-choice={id}>
      <span className="h-start__icon" aria-hidden="true">
        <Icon focusable="false" />
      </span>
      <p className="h-start__host">{host}</p>
      <h2 id={`start-${id}`} className="h-start__name">
        {name}
      </h2>
      <p className="h-start__line">{line}</p>
      <LinkButton href={href} variant="go" className="h-start__go">
        {action}
      </LinkButton>
    </li>
  );
}

export function Start() {
  const { lang, t } = useI18n();
  const S = C.start;
  const aff = useInviteCode();
  return (
    <section className="h-hero h-start" aria-labelledby="start-title">
      <div className="h-wrap h-start__in">
        <div className="h-start__head">
          <p className="h-eyebrow">
            <span>{t(S.eyebrow)}</span>
          </p>
          <h1 id="start-title" className="h-h1 h-start__title">
            {t(S.title)}
          </h1>
          <p className="h-lead">{t(S.lead)}</p>
        </div>
        <ul className="h-start__choices">
          <Choice
            id="console"
            icon={LayoutDashboard}
            host={new URL(CONSOLE_ORIGIN).host}
            name={t(S.console.name)}
            line={t(S.console.line)}
            href={consoleEntry(lang, aff)}
            action={t(S.console.go)}
            night
          />
          <Choice id="aha" icon={MessagesSquare} host={new URL(AHA_URL).host} name={t(S.aha.name)} line={t(S.aha.line)} href={AHA_URL} action={t(C.nav.launchAha)} />
        </ul>
        <p className="h-start__more">
          <span>{t(S.notSure)}</span>
          <More href={docUrl("quickstart", lang)}>{t(C.common.readDocs)}</More>
          <More href={pagePath("pricing", lang)}>{t(C.common.seePricing)}</More>
        </p>
      </div>
      <div className="h-wrap">
        <BeatLine className="h-hero__beat" />
      </div>
    </section>
  );
}
