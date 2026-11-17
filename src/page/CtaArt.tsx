/**
 * A product page's closing art: a variation of the homepage's ASCII (the sharks' water, the hero's stars, the orbit's
 * moons and planet), one per page, chosen in ./ctaArt.ts, set in the closing band's column beside the words
 * (parts.tsx CtaBand `aside`) in a colour of its own (--c-cta-art). The server renders the canvas empty and it is
 * decorative (aria-hidden: the band's words are the text); the art's code is fetched only when the band comes near
 * the screen (./lazyArt.ts).
 */
import { useLazyArt } from "./lazyArt";

/** The pages whose closing band has art: every page with a closing band but the homepage (its sharks are its own). */
export type CtaArtId = "aha" | "storage" | "database" | "supabase" | "pricing" | "models" | "help" | "status" | "workspace" | "agents" | "build";

export function CtaArt({ art }: { art: CtaArtId }) {
  const canvas = useLazyArt(() => import("./ctaArt").then(({ startCtaArt }) => (el) => startCtaArt(el, art)));
  return <canvas ref={canvas} className="h-cta-art" data-art={art} aria-hidden="true" />;
}
