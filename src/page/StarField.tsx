/**
 * The hero's twinkling stars (./starField.ts) as a canvas behind it. The server renders the canvas empty; the browser
 * draws the sky once mounted and fades it in. `paused` is the orbit's Pause button: it stops the stars too.
 */
import { useEffect, useRef } from "react";
import { cn } from "@/components/s1lin/cn";
import { startStarField } from "./starField";

export function StarField({ paused = false, className }: { paused?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current();
  }, [paused]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const field = startStarField(el, () => pausedRef.current);
    syncRef.current = field.sync;
    return () => {
      syncRef.current = () => undefined;
      field.stop();
    };
  }, []);

  return <canvas ref={canvas} className={cn("h-cosmos__stars", className)} aria-hidden="true" />;
}
