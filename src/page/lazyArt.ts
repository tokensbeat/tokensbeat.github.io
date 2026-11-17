/**
 * A closing band's art starts only near the screen: its code is a dynamic import, fetched once the band's canvas comes
 * within LOAD_MARGIN of view (IntersectionObserver), so a page's first load carries none of it; the server renders the
 * canvas empty. Shared by the homepage's sharks (./SharkWater.tsx) and the product pages' art (./CtaArt.tsx).
 */
import { useEffect, useRef } from "react";

/** How far ahead of the screen the art starts loading. */
export const LOAD_MARGIN = "600px 0px";

export interface ArtHandle {
  stop(): void;
}

/**
 * The ref for the art's canvas. `load` fetches the art's code and gives back what starts it on the canvas; it is
 * called once, when the canvas first comes near, and not at all where there is no IntersectionObserver to wait for
 * (then the art loads at once). Unmounting stops the art, and an art whose code arrives after that never starts.
 */
export function useLazyArt(load: () => Promise<(canvas: HTMLCanvasElement) => ArtHandle>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const loader = useRef(load);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let handle: ArtHandle | null = null;
    let gone = false;
    const start = () =>
      loader.current().then(
        (run) => {
          if (!gone) handle = run(el);
        },
        () => undefined,
      );
    const near =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (entries) => {
              if (!entries.some((e) => e.isIntersecting)) return;
              near?.disconnect();
              void start();
            },
            { rootMargin: LOAD_MARGIN },
          )
        : null;
    if (near) near.observe(el);
    else void start();
    return () => {
      gone = true;
      near?.disconnect();
      handle?.stop();
    };
  }, []);

  return canvas;
}
