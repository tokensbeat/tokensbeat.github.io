/**
 * The homepage's figure, v4's SiteOrbit drawn in this site's hand: your app is the planet at the core (the brand's
 * jade); the Serve ring around it carries what runs your app (models, billing, users via Aha, the agent runtime, the
 * database, storage), a wider dashed orbit carries what helps you build (docs, people, the Supabase move, the cloud dev
 * box). Each moon is a link with its status.
 *
 * Each moon is a small body in the planet's own ASCII (./orbitMoonArt.ts), its status its shape (whole, half, rim,
 * dashed rim) and its hue, drawn once as text over a disc of the night that hides what it passes in front of.
 *
 * The moons travel (./orbitMotion.ts): the Serve ring once in 90 s, the Support orbit once in 150 s the other way,
 * smaller and fainter on the far side, hidden where they pass behind the planet's top. Each label rides beside its moon
 * (outwards on the Serve ring, above or below on the Support orbit); when two labels would overlap, the farther one
 * gives way until they part. Everything moves by transforms from one requestAnimationFrame loop, which also turns the
 * planet; the server renders the first frame. The moons stop while the pointer is on the figure or the focus is in it
 * (so a label stays put to be read and clicked), for a moment after a touch, and while the reader's Pause button says
 * so (that also stops the planet, and the hero's stars: the pause can be the hero's, passed in). Nothing runs
 * off-screen (IntersectionObserver), and under reduced motion the figure is the first frame, still. The figure has no
 * frame of its own: it stands in the hero, on the night sky, with its key under it.
 *
 * The labels sit on the orbit when the figure is 720 px wide or more (a container query); narrower, the figure is the
 * planet and its moving moons alone, and the page's cards right under it name the same parts. Pointing at a label (or
 * focusing it) lights its moon. The planet is v4's own ASCII art (orbitScene.ts,
 * copied verbatim): 140 x 45 characters that turn once in ~50 s at 8 frames a second. The prerendered HTML holds its
 * first frame, sized by the stage's width (80cqw / 84); once mounted it is laid out at 10px and scaled to 80 % of the
 * stage, as v4 does (glyph advances round badly at 3-4 px). The rings are drawn over it, the Serve ring's far half
 * masked round the core.
 */
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { C } from "@/content/copy";
import { links } from "@/content/links";
import { pagePath, STATUSES, type SiteStatus } from "@/content/site";
import { useI18n } from "@/i18n";
import { CELL_W, moonArt } from "./orbitMoonArt";
import { createOrbitScene } from "./orbitScene";
import {
  arcPath,
  CORE_R,
  CX,
  CY,
  declutter,
  labelBox,
  labelPlace,
  labelTransform,
  moonState,
  moonTransform,
  RINGS,
  STAGE_H,
  STAGE_W,
  type Box,
  type LabelPlace,
  type RingId,
} from "./orbitMotion";
import { BeatLine } from "./parts";

// The brand planet alone (no built-in moons), turning once every ~50 s.
const scene = createOrbitScene([], { planetSpin: 0.12 });
const FIRST_FRAME = scene.render(0);
/** The planet's frames per second (v4's). */
const PLANET_FPS = 8;
/** How long the moons wait after a touch lifts, so a tapped label is still under the finger. */
const TOUCH_HOLD_MS = 2500;

type MoonId = "models" | "billing" | "users" | "agents" | "database" | "storage" | "docs" | "people" | "migrate" | "workspace";

/** The moons, in reading order, at their first-frame angles (v4's). */
export const MOONS: readonly { id: MoonId; ring: RingId; angle: number; status: SiteStatus }[] = [
  { id: "models", ring: "serve", angle: -14, status: "live" },
  { id: "billing", ring: "serve", angle: 16, status: "live" },
  { id: "users", ring: "serve", angle: 64, status: "coming" },
  { id: "agents", ring: "serve", angle: 100, status: "early" },
  { id: "database", ring: "serve", angle: 140, status: "early" },
  { id: "storage", ring: "serve", angle: 207, status: "early" },
  { id: "docs", ring: "support", angle: -118, status: "live" },
  { id: "people", ring: "support", angle: -62, status: "live" },
  { id: "migrate", ring: "support", angle: 62, status: "coming" },
  { id: "workspace", ring: "support", angle: 118, status: "beta" },
];

const PATHS = {
  support: `${arcPath("support", 0, 360, 120)}Z`,
  serveBack: arcPath("serve", 180, 360, 60),
  serveFront: arcPath("serve", 0, 180, 60),
};

const FIRST = MOONS.map((m) => ({ moon: moonState(m.ring, m.angle, 0), label: labelPlace(m.ring, m.angle, 0) }));

/** Each moon's ASCII, and the diameter of its disc in the text's em (a column is 0.6em wide and CELL_W units). */
const MOON_ART = MOONS.map((m) => {
  const r = RINGS[m.ring].moonR;
  return { text: moonArt(r, m.status), style: { "--moon-d": `${((2 * r * 0.6) / CELL_W).toFixed(3)}em` } as CSSProperties };
});

/** A status as a shape (dot, half dot, ring, dashed ring), the same as the moons and the chips draw it. */
function Pip({ status }: { status: SiteStatus }) {
  return <i className={`h-orbit__pip h-orbit__pip--${status}`} aria-hidden="true" />;
}

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia?.(REDUCED);
  mq?.addEventListener?.("change", onChange);
  return () => mq?.removeEventListener?.("change", onChange);
}
/** Whether the figure moves at all: never on the server (the first frame is still), not under reduced motion. */
function useMoving() {
  return useSyncExternalStore(
    subscribeReduced,
    () => !window.matchMedia?.(REDUCED).matches,
    () => false,
  );
}

/**
 * The loop: the planet's frames and the moons' travel, held while `paused`. Returns the figure's, the stage's and the
 * planet text's refs, and whether the figure moves at all.
 */
function useOrbitMotion(paused: boolean) {
  const figure = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const moving = useMoving();
  const pausedRef = useRef(paused);
  const syncRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current();
  }, [paused]);

  useEffect(() => {
    const fig = figure.current;
    const box = stage.current;
    const text = pre.current;
    if (!fig || !box || !text) return;
    const moonEls = [...box.querySelectorAll<HTMLElement>(".h-orbit__moon")];
    const labelEls = [...box.querySelectorAll<HTMLElement>(".h-orbit__labels > li")];
    const textNode = text.firstChild instanceof Text ? text.firstChild : null;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;

    let stageW = 0;
    let sizes: { w: number; h: number }[] = [];
    let hidden = new Set<number>();
    const places: LabelPlace[] = FIRST.map((f) => f.label);
    const depths: number[] = FIRST.map((f) => f.moon.depth);

    /** The moons and their labels at `t` seconds: transforms and opacity only, then which labels give way. */
    const drawMoons = (t: number) => {
      MOONS.forEach((m, i) => {
        const s = moonState(m.ring, m.angle, t);
        const moon = moonEls[i];
        const label = labelEls[i];
        moon.style.transform = moonTransform(s);
        moon.style.opacity = s.opacity.toFixed(3);
        const side = s.front ? "front" : "back";
        if (moon.dataset.side !== side) {
          moon.dataset.side = side;
          if (label) label.dataset.side = side;
        }
        places[i] = labelPlace(m.ring, m.angle, t);
        depths[i] = s.depth;
        if (label) label.style.transform = labelTransform(places[i]);
      });
      // Labels give way only where they are drawn on the orbit (a wide figure); measured, never read per frame.
      if (!stageW || sizes.length !== labelEls.length || !sizes.every((s) => s.w > 0)) return;
      const boxes: Box[] = places.map((p, i) => labelBox(p, stageW, sizes[i].w, sizes[i].h));
      const next = declutter(boxes, depths, hidden);
      labelEls.forEach((li, i) => {
        if (next.has(i) !== hidden.has(i)) li.toggleAttribute("data-hidden", next.has(i));
      });
      hidden = next;
    };

    let moonT = 0;
    let planetT = 0;
    let planetFrame = 0;
    const measure = () => {
      if (!box.clientWidth || !text.offsetWidth) return;
      stageW = box.clientWidth;
      box.style.setProperty("--so-scale", String((stageW * 0.8) / text.offsetWidth));
      box.dataset.measured = "";
      sizes = labelEls.map((li) => ({ w: li.offsetWidth, h: li.offsetHeight }));
      drawMoons(moonT);
    };
    measure();
    const resizer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    resizer?.observe(box);
    void document.fonts?.ready.then(measure);

    let raf = 0;
    let last = 0;
    let inView = false;
    let hover = false;
    let focus = false;
    let holdUntil = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      planetT += dt;
      const frame = Math.floor(planetT * PLANET_FPS);
      if (frame !== planetFrame && textNode) {
        planetFrame = frame;
        textNode.data = scene.render(frame / PLANET_FPS);
      }
      if (hover || focus || now < holdUntil) return;
      moonT += dt;
      drawMoons(moonT);
    };
    const sync = () => {
      const run = inView && !reduced?.matches && !pausedRef.current;
      if (run && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      fig.toggleAttribute("data-moving", run);
    };
    syncRef.current = sync;

    const onMotion = () => {
      if (reduced?.matches) {
        // Back to the first frame, still.
        moonT = 0;
        planetT = 0;
        planetFrame = 0;
        if (textNode) textNode.data = FIRST_FRAME;
        drawMoons(0);
      }
      sync();
    };
    reduced?.addEventListener?.("change", onMotion);

    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            sync();
          })
        : null;
    if (observer) observer.observe(fig);
    else {
      inView = true;
      sync();
    }

    // Hold the moons while the reader points at the figure or works in it; light the moon of the item pointed at.
    const moonIndex = (target: EventTarget | null) => {
      const el = target instanceof Element ? target.closest<HTMLElement>("[data-moon]") : null;
      return el ? MOONS.findIndex((m) => m.id === el.dataset.moon) : -1;
    };
    const light = (i: number) => moonEls.forEach((el, k) => el.toggleAttribute("data-active", k === i));
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "touch") hover = true;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "touch") hover = false;
      light(-1);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") holdUntil = Number.POSITIVE_INFINITY;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") holdUntil = performance.now() + TOUCH_HOLD_MS;
    };
    const onOver = (e: Event) => light(moonIndex(e.target));
    const onFocusIn = (e: FocusEvent) => {
      focus = true;
      light(moonIndex(e.target));
    };
    const onFocusOut = (e: FocusEvent) => {
      focus = e.relatedTarget instanceof Node && fig.contains(e.relatedTarget);
      if (!focus) light(-1);
    };
    fig.addEventListener("pointerenter", onEnter);
    fig.addEventListener("pointerleave", onLeave);
    fig.addEventListener("pointerdown", onDown);
    fig.addEventListener("pointerup", onUp);
    fig.addEventListener("pointercancel", onUp);
    fig.addEventListener("pointerover", onOver);
    fig.addEventListener("focusin", onFocusIn);
    fig.addEventListener("focusout", onFocusOut);

    return () => {
      reduced?.removeEventListener?.("change", onMotion);
      observer?.disconnect();
      resizer?.disconnect();
      fig.removeEventListener("pointerenter", onEnter);
      fig.removeEventListener("pointerleave", onLeave);
      fig.removeEventListener("pointerdown", onDown);
      fig.removeEventListener("pointerup", onUp);
      fig.removeEventListener("pointercancel", onUp);
      fig.removeEventListener("pointerover", onOver);
      fig.removeEventListener("focusin", onFocusIn);
      fig.removeEventListener("focusout", onFocusOut);
      syncRef.current = () => undefined;
      cancelAnimationFrame(raf);
      raf = 0;
    };
  }, []);

  return { figure, stage, pre, moving };
}

/**
 * The figure. Its Pause is its own unless the hero passes `paused` and `onPausedChange` (the hero's stars stop with
 * it).
 */
export function OrbitFigure({ paused: pausedProp, onPausedChange }: { paused?: boolean; onPausedChange?: (paused: boolean) => void } = {}) {
  const { lang, t } = useI18n();
  const [ownPaused, setOwnPaused] = useState(false);
  const paused = pausedProp ?? ownPaused;
  const setPaused = onPausedChange ?? setOwnPaused;
  const { figure, stage, pre, moving } = useOrbitMotion(paused);
  const docs = links(lang).docs;
  const hrefOf = (id: MoonId): string =>
    ({
      models: pagePath("models", lang),
      billing: pagePath("pricing", lang),
      users: pagePath("aha", lang),
      agents: pagePath("agents", lang),
      database: pagePath("database", lang),
      storage: pagePath("storage", lang),
      docs,
      people: pagePath("help", lang),
      migrate: pagePath("supabase", lang),
      workspace: pagePath("workspace", lang),
    })[id];

  return (
    <figure ref={figure} className="h-orbit" aria-labelledby="h-orbit-caption" data-paused={paused ? "" : undefined}>
      <button
        type="button"
        className="h-orbit__pause"
        hidden={!moving}
        aria-label={t(paused ? "Play the orbit" : "Pause the orbit")}
        title={t(paused ? "Play the orbit" : "Pause the orbit")}
        onClick={() => setPaused(!paused)}
      >
        {paused ? <Play aria-hidden="true" focusable="false" /> : <Pause aria-hidden="true" focusable="false" />}
      </button>

      <div ref={stage} className="h-orbit__stage">
        <div className="h-orbit__ascii" aria-hidden="true">
          <pre ref={pre} className="h-orbit__planet-text">
            {FIRST_FRAME}
          </pre>
        </div>
        <svg className="h-orbit__art" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} aria-hidden="true" focusable="false">
          <defs>
            <mask id="h-orbit-core-hole" maskUnits="userSpaceOnUse" x="0" y="0" width={STAGE_W} height={STAGE_H}>
              <rect x="0" y="0" width={STAGE_W} height={STAGE_H} fill="#fff" />
              <circle cx={CX} cy={CY} r={CORE_R + 6} fill="#000" />
            </mask>
          </defs>
          <path className="h-orbit__support" d={PATHS.support} />
          <path className="h-orbit__serve" d={PATHS.serveBack} mask="url(#h-orbit-core-hole)" />
          <path className="h-orbit__serve" d={PATHS.serveFront} />
        </svg>
        <div className="h-orbit__moons" aria-hidden="true">
          {MOONS.map((m, i) => (
            <span
              key={m.id}
              className={`h-orbit__moon h-orbit__moon--${m.status} is-${m.ring}`}
              data-moon={m.id}
              data-side={FIRST[i].moon.front ? "front" : "back"}
              style={{ transform: moonTransform(FIRST[i].moon), opacity: FIRST[i].moon.opacity.toFixed(3) }}
            >
              <span className="h-orbit__moon-art" style={MOON_ART[i].style}>
                {MOON_ART[i].text}
              </span>
            </span>
          ))}
        </div>
        <div className="h-orbit__core">
          <span className="h-orbit__core-name">{t(C.home.diagram.app)}</span>
          <span className="h-orbit__core-note">{t(C.home.diagram.appNote)}</span>
          <BeatLine className="h-orbit__core-beat" />
        </div>
        <ul className="h-orbit__labels" aria-label={t(C.home.diagram.label)}>
          {MOONS.map((m, i) => (
            <li
              key={m.id}
              className={`is-${m.ring}`}
              data-side={FIRST[i].moon.front ? "front" : "back"}
              style={{ transform: labelTransform(FIRST[i].label) }}
            >
              <a className="h-orbit__pill" href={hrefOf(m.id)} data-moon={m.id}>
                <Pip status={m.status} />
                <span>{t(C.home.orbit[m.id])}</span>{" "}
                <span className="h-visually-hidden">({t(C.status[m.status])})</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <figcaption id="h-orbit-caption" className="h-orbit__bar">
        <span className="h-orbit__legend">
          <i className="h-orbit__key h-orbit__key--serve" aria-hidden="true" />
          <b>{t(C.home.diagram.serve)}</b>
          {t(C.home.diagram.serveWhen)}
        </span>
        <span className="h-orbit__legend">
          <i className="h-orbit__key h-orbit__key--support" aria-hidden="true" />
          <b>{t(C.home.diagram.support)}</b>
          {t(C.home.diagram.supportWhen)}
        </span>
        <span className="h-orbit__states">
          {STATUSES.map((s) => (
            <span key={s} className="h-orbit__state">
              <Pip status={s} />
              {t(C.status[s])}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
