/**
 * The homepage's journey (2026-11-27): one night slab, sticky under the head, holding the chart of the Milky Way
 * (./milkyWay.ts), and five steps that scroll over it, a screen each: the hero with the poem, then Aha, Bots, the Model
 * API and Pricing, each a kit plate of words. Where the reader is in the steps moves the chart's camera along the river
 * to that product. The slab's bar says where the chart is and holds Pause; the ruler at its foot jumps to a stop.
 *
 * The slab is night in both themes (data-theme="dark" on it, as every night slab of the site). The server renders the
 * words, the notes and an empty canvas; the browser draws. The loop runs only while the slab is on screen and the tab
 * is visible; under reduced motion the chart follows the scroll without moving on its own and Pause is hidden.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown, Pause, Play } from "lucide-react";
import { Button } from "@/components/s1lin/button";
import { cn } from "@/components/s1lin/cn";
import { Plate } from "@/components/s1lin/plate";
import { HOME, hrefFor, keepsCase, type HomeStop } from "@/content/home";
import { useI18n } from "@/i18n";
import { createChart, scrollStop, STOP_COUNT, type Chart } from "./milkyWay";
import { LinkButton, More, StatusChip } from "./parts";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void): () => void {
  const mq = window.matchMedia?.(REDUCED);
  mq?.addEventListener?.("change", onChange);
  return () => mq?.removeEventListener?.("change", onChange);
}

/** The reader asked for less motion (false on the server, where nothing moves). */
function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia?.(REDUCED).matches ?? false, () => false);
}

/** A label in mono caps that keeps Aha's and TokensBeat's capitals. */
const caseOf = (text: string) => (keepsCase(text) ? "h-keep-case" : undefined);

/** "02 / 04 · Bots": the stop in force, out of the last. */
const whereText = (i: number, name: string) => `0${i} / 0${STOP_COUNT - 1} · ${name}`;

/** One stop's plate: eyebrow, title, lead, its points under a rule, and where to go. */
function StopPlate({ stop }: { stop: HomeStop }) {
  const { lang } = useI18n();
  const id = `home-stop-${stop.id}`;
  return (
    <Plate as="article" className="j__plate" data-theme="dark" aria-labelledby={id}>
      <p className="h-eyebrow">
        <span className={caseOf(stop.eyebrow[lang])}>{stop.eyebrow[lang]}</span>
      </p>
      <h2 id={id} className="h-h2">
        {stop.title[lang]}
      </h2>
      <p className="h-lead">{stop.lead[lang]}</p>
      <ul className="j__points">
        {stop.points.map((point) => (
          <li key={point.id} data-point={point.id}>
            {point.title && <b>{point.title[lang]}</b>}
            {point.status && <StatusChip status={point.status} size="sm" />}
            {point.title ? <span className="j__point-body">{point.body[lang]}</span> : point.body[lang]}
          </li>
        ))}
      </ul>
      <div className="h-actions">
        {stop.primary && (
          <LinkButton href={hrefFor(stop.primary.href, lang)} variant="go" size="sm">
            {stop.primary.label[lang]}
          </LinkButton>
        )}
        {stop.links.map((link) => (
          <More key={link.href} href={hrefFor(link.href, lang)}>
            {link.label[lang]}
          </More>
        ))}
      </div>
    </Plate>
  );
}

export function Journey() {
  const { lang } = useI18n();
  const { hero, chart: words, stops } = HOME;
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const moving = useRef({ paused, reduced });
  useEffect(() => {
    moving.current = { paused, reduced };
  }, [paused, reduced]);

  useEffect(() => {
    const stageEl = stage.current;
    const canvasEl = canvas.current;
    const stepsEl = stepsRef.current;
    if (!stageEl || !canvasEl || !stepsEl) return;
    const steps = [...stepsEl.querySelectorAll<HTMLElement>(".j__step")];
    const plates = [...stepsEl.querySelectorAll<HTMLElement>(".j__plate")];
    const headLine = () => document.querySelector<HTMLElement>(".h-head")?.offsetHeight ?? 0;
    const where = () => scrollStop(steps.map((s) => s.getBoundingClientRect().top), headLine());
    const chart: Chart | null = createChart({ stage: stageEl, canvas: canvasEl, plates: () => plates, stopName: (k) => words.stops[k][lang] });

    const S = { p: where(), t: 0, last: 0, visible: true, raf: 0 };
    const sync = (p: number) => {
      if (mark.current) mark.current.style.transform = `translateX(${(p * 100).toFixed(2)}%)`;
      setCurrent(Math.round(p));
    };
    const frame = (now: number) => {
      S.raf = requestAnimationFrame(frame);
      const dt = S.last ? Math.min(0.1, (now - S.last) / 1000) : 0.016;
      S.last = now;
      const target = where();
      const { paused: still, reduced: calm } = moving.current;
      S.p = calm ? target : S.p + (target - S.p) * Math.min(1, dt * 6);
      if (Math.abs(target - S.p) < 0.0005) S.p = target;
      if (!still && !calm) S.t += dt;
      sync(S.p);
      if (S.visible) chart?.draw(S.p, S.t);
    };
    const start = () => {
      if (S.raf) return;
      S.last = 0;
      S.raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(S.raf);
      S.raf = 0;
    };

    sync(S.p);
    chart?.draw(S.p, S.t);
    start();

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const seen = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([e]) => (S.visible = e.isIntersecting));
    seen?.observe(stageEl);
    const sized =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            chart?.resize();
            chart?.draw(S.p, S.t);
          });
    sized?.observe(stageEl);
    let live = true;
    document.fonts?.ready.then(() => {
      if (!live) return;
      chart?.remeasure();
      chart?.draw(S.p, S.t);
    });
    return () => {
      live = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      seen?.disconnect();
      sized?.disconnect();
    };
  }, [lang, words]);

  /** Scroll to a stop: its step's top under the head. */
  const jump = (i: number) => {
    const step = stepsRef.current?.querySelectorAll<HTMLElement>(".j__step")[i];
    if (!step) return;
    const head = document.querySelector<HTMLElement>(".h-head")?.offsetHeight ?? 0;
    window.scrollTo({ top: step.getBoundingClientRect().top + window.scrollY - head, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section className="j" aria-labelledby="home-title">
      <div ref={stage} className="j__stage" data-theme="dark">
        <canvas ref={canvas} className="j__cv" role="img" aria-label={words.label[lang]} />
        <div className="j__notes" aria-hidden="true">
          {words.notes.map((note) => (
            <div key={note.id} className="j__note" data-note={note.id}>
              <b className={caseOf(note.name[lang])}>{note.name[lang]}</b>
              {note.line && <i>{note.line[lang]}</i>}
            </div>
          ))}
        </div>
        <div className="j__bar">
          <span className="j__title">{words.title[lang]}</span>
          <span className="j__where">
            <span>{whereText(current, words.stops[current][lang])}</span>
            {!reduced && (
              <Button
                variant="icon"
                size="sm"
                className="j__pause"
                aria-label={(paused ? words.play : words.pause)[lang]}
                aria-pressed={paused}
                onClick={() => setPaused((v) => !v)}
              >
                {paused ? <Play aria-hidden="true" focusable="false" /> : <Pause aria-hidden="true" focusable="false" />}
              </Button>
            )}
          </span>
        </div>
        <nav className="j__ruler" aria-label={words.stopsLabel[lang]}>
          <div className="j__ruler-in">
            <ol>
              {words.stops.map((name, i) => (
                <li key={i}>
                  <button type="button" className="j__stop" aria-current={i === current ? "step" : undefined} onClick={() => jump(i)}>
                    <b>0{i}</b>
                    <span className={caseOf(name[lang])}>{name[lang]}</span>
                  </button>
                </li>
              ))}
            </ol>
            <span ref={mark} className="j__mark" aria-hidden="true" />
          </div>
        </nav>
      </div>

      <div ref={stepsRef} className="j__steps">
        <div className="j__step j__step--hero">
          <div className="h-wrap">
            <div className="j__hero" data-theme="dark">
              <p className="h-eyebrow">
                <span className={caseOf(hero.eyebrow[lang])}>{hero.eyebrow[lang]}</span>
              </p>
              <h1 id="home-title" className="h-h1 j__h1">
                <span>{hero.titleA[lang]}</span>
                {lang === "zh" ? "" : " "}
                <em>{hero.titleB[lang]}</em>
              </h1>
              <p className="h-lead">{hero.lead[lang]}</p>
              <div className="h-actions">
                <LinkButton href={hrefFor(hero.primary.href, lang)} variant="go">
                  {hero.primary.label[lang]}
                </LinkButton>
                <LinkButton href={hrefFor(hero.secondary.href, lang)}>{hero.secondary.label[lang]}</LinkButton>
              </div>
              <button type="button" className={cn("h-more", "j__hint")} onClick={() => jump(1)}>
                {hero.hint[lang]}
                <ArrowDown className="h-more__icon" aria-hidden="true" focusable="false" />
              </button>
            </div>
          </div>
        </div>
        {stops.map((stop) => (
          <div key={stop.id} className="j__step" data-step={stop.id}>
            <div className="h-wrap">
              <StopPlate stop={stop} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
