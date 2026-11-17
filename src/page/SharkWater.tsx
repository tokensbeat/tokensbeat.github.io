/**
 * The closing band's sharks (./sharks/water.ts) as a canvas in the band's own column. The server renders the canvas
 * empty and it is decorative (aria-hidden: the band's words are the text). The water's code is fetched only when the
 * band comes within a screen of view (./lazyArt.ts), so it costs the homepage's first load nothing.
 */
import { cn } from "@/components/s1lin/cn";
import { useLazyArt } from "./lazyArt";

export function SharkWater({ className }: { className?: string }) {
  const canvas = useLazyArt(() => import("./sharks/water").then(({ startSharkWater }) => (el) => startSharkWater(el)));
  return <canvas ref={canvas} className={cn("h-sharks", className)} aria-hidden="true" />;
}
