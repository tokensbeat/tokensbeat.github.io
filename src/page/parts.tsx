/**
 * The parts every page is built from, after v4's site components (the earlier Vue site): the status
 * chip, the beat line, a page's hero, a section and its head, feature cells, lines with icons, numbered steps, "Not
 * there yet", the Support / Serve rails, questions, the closing band and a code slab. Drawn in the @s1lin kit's
 * character (serif display, mono labels, hairlines, "+" corners) in the console's colours (src/styles/theme.css).
 *
 * A "night" slab is the kit's own night paper inside the page (data-theme="dark" on the element): the code, the
 * proof board and the orbit's legend stay dark on light paper, and sit a step above the paper at night.
 */
import type { ReactNode } from "react";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight, Check, Plus, type LucideIcon } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/s1lin/button";
import { cn } from "@/components/s1lin/cn";
import { useOverflow } from "@/components/s1lin/use-overflow";
import { C } from "@/content/copy";
import type { SiteStatus } from "@/content/site";
import { useT } from "@/i18n";

/* ------------------------------------------------------------------ small */

/** Live, Beta, Early access or Coming, in words, with a shape (dot, half dot, ring, dashed ring) in the status's hue. */
export function StatusChip({ status, size = "md", className }: { status: SiteStatus; size?: "sm" | "md"; className?: string }) {
  const t = useT();
  return (
    <span className={cn("h-chip", `h-chip--${status}`, size === "sm" && "h-chip--sm", className)} data-status={status}>
      <span className="h-chip__dot" aria-hidden="true" />
      {t(C.status[status])}
    </span>
  );
}

/** The beat: a flat line with one pulse. Decorative; it marks what we keep running. */
export function BeatLine({ animated = true, className }: { animated?: boolean; className?: string }) {
  const d = "M0 20 H250 L262 20 L270 8 L280 34 L292 2 L302 30 L310 20 H600";
  return (
    <svg className={cn("h-beat", animated && "is-animated", className)} viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="h-beat__base" d={d} />
      <path className="h-beat__pulse" d={d} pathLength={100} />
    </svg>
  );
}

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** A link in words with an arrow: on this site an arrow right, to another site an arrow up and out. */
export function More({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const Icon = isExternal(href) ? ArrowUpRight : ArrowRight;
  return (
    <a className={cn("h-more", className)} href={href}>
      {children}
      <Icon className="h-more__icon" aria-hidden="true" focusable="false" />
    </a>
  );
}

/** A button that is a link: "go" for the one thing to do (with an arrow), "plain" beside it; "sm" on a plate. */
export function LinkButton({
  href,
  variant = "plain",
  size,
  arrow = variant === "go",
  children,
  className,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const Icon = isExternal(href) && !href.startsWith("https://console.tokensbeat.com") ? ArrowUpRight : ArrowRight;
  return (
    <Button href={href} variant={variant} size={size} className={cn("h-btn", className)}>
      {children}
      {arrow && <Icon className="h-btn__icon" aria-hidden="true" focusable="false" />}
    </Button>
  );
}

/* ------------------------------------------------------------------ page structure */

/** A page's opening: eyebrow (and status), the page's one h1, the lead, what to do, a note, and a picture beside. */
export function PageHero({
  id,
  eyebrow,
  status,
  title,
  lead,
  note,
  actions,
  visual,
}: {
  id: string;
  eyebrow: string;
  status?: SiteStatus;
  title: string;
  lead: string;
  note?: string;
  actions?: ReactNode;
  visual?: ReactNode;
}) {
  return (
    <section className="h-hero" aria-labelledby={id}>
      <div className={cn("h-wrap h-hero__grid", visual && "has-visual")}>
        <div className="h-hero__copy">
          <p className="h-eyebrow">
            <span>{eyebrow}</span>
            {status && <StatusChip status={status} />}
          </p>
          <h1 id={id} className="h-h1">
            {title}
          </h1>
          <p className="h-lead">{lead}</p>
          {actions && <div className="h-actions">{actions}</div>}
          {note && <p className="h-small h-hero__note">{note}</p>}
        </div>
        {visual && <div className="h-hero__visual">{visual}</div>}
      </div>
      <div className="h-wrap">
        <BeatLine className="h-hero__beat" />
      </div>
    </section>
  );
}

/** A section of a page, named by its h2 (`id`); `band` sets it on the second paper, the width of the page. */
export function Section({ id, band = false, className, children }: { id: string; band?: boolean; className?: string; children: ReactNode }) {
  return (
    <section className={cn("h-section", band && "h-band", className)} aria-labelledby={id}>
      <div className="h-wrap">{children}</div>
    </section>
  );
}

/** A section's head: the eyebrow (and status) over the title, the lead beside it on a wide page. */
export function SectionHead({ id, eyebrow, title, lead, status, stacked = false }: { id: string; eyebrow: string; title: string; lead?: string; status?: SiteStatus; stacked?: boolean }) {
  return (
    <div className={cn("h-section-head", stacked && "is-stacked", !lead && "is-bare")}>
      <div>
        <p className="h-eyebrow">
          <span>{eyebrow}</span>
          {status && <StatusChip status={status} />}
        </p>
        <h2 id={id} className="h-h2">
          {title}
        </h2>
      </div>
      {lead && <p className="h-lead">{lead}</p>}
    </div>
  );
}

export interface Cell {
  id: string;
  title: string;
  body: string;
  status?: SiteStatus;
  points?: string[];
  href?: string;
  linkLabel?: string;
  /** Something drawn at the top of the cell (vendor marks). */
  art?: ReactNode;
}

/** Feature cells: a grid of framed cells, each a title (and status), words, points and a link. */
export function FeatureCells({ items, columns = 3 }: { items: Cell[]; columns?: 2 | 3 | 4 }) {
  return (
    <ul className="h-cells" data-cols={columns}>
      {items.map((item) => (
        <li key={item.id} className="h-cell" data-cell={item.id}>
          {item.art}
          <div className="h-cell__top">
            <h3 className="h-h3">{item.title}</h3>
            {item.status && <StatusChip status={item.status} size="sm" />}
          </div>
          <p className="h-body">{item.body}</p>
          {item.points && item.points.length > 0 && (
            <ul className="h-points">
              {item.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {item.href && (
            <More href={item.href} className="h-cell__more">
              {item.linkLabel}
            </More>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Lines, each with an icon: what a part does, how it is guarded, what to know. */
export function Lines({ items, icon: Icon = Check, one = false }: { items: string[]; icon?: LucideIcon; one?: boolean }) {
  return (
    <ul className={cn("h-lines", one && "h-lines--one")}>
      {items.map((line) => (
        <li key={line}>
          <Icon className="h-lines__icon" aria-hidden="true" focusable="false" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/** Numbered steps, in order. */
export function Steps({ items, five = false }: { items: { title: string; body: string }[]; five?: boolean }) {
  return (
    <ol className={cn("h-steps", five && "h-steps--5")}>
      {items.map((s, i) => (
        <li key={s.title}>
          <span className="h-steps__n" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="h-h3">{s.title}</h3>
          <p className="h-body">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

/** What is not there yet, said plainly, in a dashed frame. */
export function NotYet({ id, items, title }: { id: string; items: string[]; title?: string }) {
  const t = useT();
  return (
    <aside className="h-notyet" aria-labelledby={id}>
      <h3 id={id} className="h-notyet__title">
        <StatusChip status="coming" size="sm" />
        <span>{title ?? t(C.common.notYet)}</span>
      </h3>
      <ul>
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}

/** The two rails of a product page: how we support you while you build, how we serve it in production. */
export function SupportServe({ id, support, serve }: { id: string; support: string[]; serve: string[] }) {
  const t = useT();
  return (
    <section className="h-section h-rails-section" aria-labelledby={`${id}-support`}>
      <div className="h-wrap">
        <div className="h-rails">
          <div className="h-rail">
            <p className="h-rail__tag">
              <span>01</span>
              {t(C.nav.support)}
            </p>
            <h2 id={`${id}-support`} className="h-rail__title">
              {t(C.common.supportTitle)}
            </h2>
            <Lines items={support} one />
          </div>
          <div className="h-rail h-rail--serve h-night" data-theme="dark">
            <p className="h-rail__tag">
              <span>02</span>
              {t(C.nav.serve)}
            </p>
            <h2 className="h-rail__title">{t(C.common.serveTitle)}</h2>
            <Lines items={serve} one />
            <BeatLine className="h-rail__beat" />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Questions and their answers, each a disclosure that works without script. On its own it is a section with the
 * title beside the list; `embedded`, it is the title over the list, to sit in a column of another section.
 */
export function FaqList({ id, items, title, embedded = false }: { id: string; items: { id: string; question: string; answer: string }[]; title?: string; embedded?: boolean }) {
  const t = useT();
  const body = (
    <>
      <h2 id={id} className="h-h2 h-faq__title">
        {title ?? t(C.common.faqTitle)}
      </h2>
      <div className="h-faq__list">
        {items.map((item) => (
          <details key={item.id} className="h-faq__item" data-faq={item.id}>
            <summary>
              <span className="h-faq__q">{item.question}</span>
              <Plus className="h-faq__icon" aria-hidden="true" focusable="false" />
            </summary>
            <p className="h-body">{item.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
  if (embedded) {
    return (
      <section className="h-faq h-faq--embedded" aria-labelledby={id}>
        {body}
      </section>
    );
  }
  return (
    <section className="h-section" aria-labelledby={id}>
      <div className="h-wrap h-faq">{body}</div>
    </section>
  );
}

/**
 * The closing band: the last thing to do, on the brand's jade. `aside` is a column of its own beside the words,
 * running to the plate's edges (a product page's art), and is decorative: hidden from screen readers.
 */
export function CtaBand({ id, title, lead, aside, children }: { id: string; title: ReactNode; lead?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={cn("h-cta", aside != null && "h-cta--aside")} aria-labelledby={id}>
      <div className="h-wrap">
        <div className="h-cta__plate">
          <div className="h-cta__words">
            <BeatLine className="h-cta__beat" />
            <h2 id={id} className="h-cta__title">
              {title}
            </h2>
            {lead && <p className="h-cta__lead">{lead}</p>}
            <div className="h-actions">{children}</div>
          </div>
          {aside != null && (
            <div className="h-cta__aside" aria-hidden="true">
              {aside}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Code on a night slab, under a bar with its name (a note in jade, and an action such as Copy); a long line scrolls inside it. */
export function CodeSlab({ title, note, code, action, className }: { title: string; note?: string; code: string; action?: ReactNode; className?: string }) {
  const pre = useRef<HTMLPreElement>(null);
  const over = useOverflow(pre);
  return (
    <figure className={cn("h-slab h-night h-code", className)} data-theme="dark">
      <figcaption className="h-slab__bar">
        <span className="h-slab__title">{title}</span>
        {note && <span className="h-slab__note">{note}</span>}
        {action && <span className="h-slab__action">{action}</span>}
      </figcaption>
      <pre ref={pre} tabIndex={over ? 0 : undefined} role={over ? "region" : undefined} aria-label={over ? title : undefined}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
