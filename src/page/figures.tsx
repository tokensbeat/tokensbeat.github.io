/**
 * Screenshots set as a paper sets photographs (owner, 2026-11-06, after the TokensBeat feature on s1lin.tokensbeat.com):
 * the capture in a hairline browser frame (a bar with three dots and the address) on an offset plate, then the caption
 * (its figure number, what it shows) with the credit at the right, which says the account is a demo one.
 *
 * Each figure carries its light and its dark capture, both lazy; the stylesheet shows the one for the reader's theme
 * and a picture that is not shown is never fetched. The frame keeps the capture's shape before it arrives, so nothing
 * on the page moves when it does (and the prerendered page has the same box). Every figure is below the first screen.
 *
 *   Shot     one figure
 *   Pending  the same frame for what has no screenshot because it is not open yet (dashed, hatched, no picture)
 *   Spread   a figure beside its section's points, numbered, as a feature sets its picture beside the copy
 *   Stories  a section as a page of a paper: the lead story with its picture beside its words, then the others two by
 *            two under a column rule (Aha's apps)
 */
import { Fragment, type ReactNode } from "react";
import { cn } from "@/components/s1lin/cn";
import { SHOT_HEIGHT, SHOT_WIDTH, SHOTS, shotSrc, type ShotId } from "@/content/shots";
import { useI18n } from "@/i18n";
import { More } from "./parts";

/** A credit's parts ("Aha · demo account · 6 Nov 2026"): a line breaks between two, never inside one or before a dot. */
const SEP = " · ";

/** "Fig. 3" / "图 3". */
function figLabel(n: number, lang: "en" | "zh") {
  return lang === "zh" ? `图 ${n}` : `Fig. ${n}`;
}

/** The frame: the bar with the address (decoration), then the view (the capture, or what stands in for it). */
function Frame({ host, pending = false, children }: { host: string; pending?: boolean; children: ReactNode }) {
  return (
    <div className={cn("h-fig__frame", pending && "is-pending")}>
      <p className="h-fig__bar" aria-hidden="true">
        <span className="h-fig__dots" />
        <span className="h-fig__host">{host}</span>
      </p>
      <div className="h-fig__view">{children}</div>
    </div>
  );
}

/** One screenshot: framed, captioned and credited. */
export function Shot({ id, n, className }: { id: ShotId; n?: number; className?: string }) {
  const { lang } = useI18n();
  const shot = SHOTS[id];
  const alt = shot.alt[lang];
  return (
    <figure className={cn("h-fig", className)} data-shot={id}>
      <Frame host={shot.host}>
        {(["light", "dark"] as const).map((theme) => (
          <img
            key={theme}
            className={`h-fig__img h-fig__img--${theme}`}
            src={shotSrc(id, theme, lang)}
            width={SHOT_WIDTH}
            height={SHOT_HEIGHT}
            loading="lazy"
            decoding="async"
            alt={alt}
            data-tone={theme}
          />
        ))}
      </Frame>
      <figcaption className="h-fig__cap">
        <span className="h-fig__credit">
          {shot.credit[lang].split(SEP).map((part, i, all) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span className="h-fig__credit-part">{i < all.length - 1 ? `${part} ·` : part}</span>
            </Fragment>
          ))}
        </span>
        <span className="h-fig__text">
          {n != null && <b className="h-fig__no">{figLabel(n, lang)}</b>}
          {shot.caption[lang]}
        </span>
      </figcaption>
    </figure>
  );
}

/** The frame for something not open yet: no screenshot, because there is nothing anyone can use to take one. */
export function Pending({ host, label, note }: { host: string; label: string; note: string }) {
  return (
    <figure className="h-fig h-fig--bare h-fig--pending" data-shot="pending">
      <Frame host={host} pending>
        <span className="h-fig__pending">
          <span className="h-fig__pending-ring" aria-hidden="true" />
          <span className="h-fig__pending-label">{label}</span>
          <span className="h-fig__pending-note">{note}</span>
        </span>
      </Frame>
    </figure>
  );
}

export interface Point {
  id: string;
  /** A point may be a sentence alone. */
  title?: string;
  body: string;
}

/** A section's picture beside its points (`flip`: the picture at the right). */
export function Spread({ shot, n, points, flip = false, after }: { shot: ShotId; n: number; points: Point[]; flip?: boolean; after?: ReactNode }) {
  return (
    <div className={cn("h-spread", flip && "h-spread--flip")}>
      <Shot id={shot} n={n} />
      <div className="h-spread__copy">
        <ol className="h-spread__points">
          {points.map((p, i) => (
            <li key={p.id} data-point={p.id}>
              <span className="h-spread__n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              {p.title && <h3 className="h-spread__title">{p.title}</h3>}
              <p className={p.title ? "h-body" : "h-spread__line"}>{p.body}</p>
            </li>
          ))}
        </ol>
        {after}
      </div>
    </div>
  );
}

export interface Story {
  id: string;
  shot: ShotId;
  title: string;
  body: string;
  /** Where the story goes on (a link always has its words). */
  link?: { href: string; label: string };
}

/** The apps as a page of a paper: the first is the lead, the rest two by two. Figures are numbered from 1. */
export function Stories({ items }: { items: Story[] }) {
  return (
    <ul className="h-stories">
      {items.map((s, i) => (
        <li key={s.id} className={cn("h-story", i === 0 && "h-story--lead")} data-story={s.id}>
          <Shot id={s.shot} n={i + 1} />
          <div className="h-story__words">
            <h3 className="h-story__title">{s.title}</h3>
            <p className="h-story__body">{s.body}</p>
            {s.link && <More href={s.link.href}>{s.link.label}</More>}
          </div>
        </li>
      ))}
    </ul>
  );
}
