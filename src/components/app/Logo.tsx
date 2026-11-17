/**
 * The TokensBeat mark in one colour, as the newspaper (news.tokensbeat.com) prints it: the core, cut where the orbit
 * crosses it; the orbit, cut around the moon; the moon.
 * The colour is the text colour (logo.css): the brand jade on paper, the light ink at night.
 *
 * The cuts are SVG masks; each logo gets its own mask ids (useId), so two logos on one page never share them.
 * Decorative by default (the wordmark is beside it); give it a `title` where it stands alone. `mono` draws it in the
 * text colour around it instead of the brand jade: an empty state's mark, in one colour (as the console's Logo).
 */
import { useId } from "react";
import { cn } from "@/components/s1lin/cn";
import "./logo.css";

const ORBIT = "M78 256A178 62 0 0 0 434 256";

export function Logo({ className, title, mono = false }: { className?: string; title?: string; mono?: boolean }) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const cut = `tb-logo-cut-${uid}`;
  const moon = `tb-logo-moon-${uid}`;
  return (
    <svg
      className={cn("c-logo", mono && "c-logo--mono", className)}
      viewBox="0 0 512 512"
      focusable="false"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <mask id={cut} maskUnits="userSpaceOnUse" x="-64" y="-64" width="640" height="640">
          <rect x="-64" y="-64" width="640" height="640" fill="white" />
          <path d={ORBIT} transform="rotate(-22 256 256)" fill="none" stroke="black" strokeWidth="54" strokeLinecap="round" />
        </mask>
        <mask id={moon} maskUnits="userSpaceOnUse" x="-64" y="-64" width="640" height="640">
          <rect x="-64" y="-64" width="640" height="640" fill="white" />
          <circle cx="421" cy="189" r="37" fill="black" />
        </mask>
      </defs>
      <g transform="translate(256 256) scale(1.08) translate(-265 -254)" fill="currentColor">
        <circle cx="256" cy="256" r="92" mask={`url(#${cut})`} />
        <g mask={`url(#${moon})`}>
          <path d={ORBIT} transform="rotate(-22 256 256)" fill="none" stroke="currentColor" strokeWidth="26" strokeLinecap="round" />
        </g>
        <circle cx="421" cy="189" r="30" />
      </g>
    </svg>
  );
}
