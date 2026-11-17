/**
 * A vendor's mark beside a model or group name: the vendor's logo in its hue on a faint tile of the same hue
 * (`--c-vendor-<id>` from src/styles/theme.css; ink when a theme sets none). Decorative: the model or vendor name
 * is always written beside it. Unknown vendors get the name's first letter.
 */
import type { CSSProperties } from "react";
import { cn } from "@/components/s1lin/cn";
import { useT } from "@/i18n";
import { VENDOR_LOGOS } from "@/lib/vendorLogos";
import { VENDOR_NAME, vendorOf, type VendorId } from "@/lib/vendor";
import "./vendor-mark.css";

/** A vendor's hue as a CSS value, for chart bars and chips (`style={{ color: vendorHue(v) }}`). */
export function vendorHue(vendor: VendorId): string {
  return `var(--c-vendor-${vendor}, var(--s1-ink-2))`;
}

type Props = {
  vendor: VendorId;
  /** Pixel size of the tile (the logo is ~70 % of it). */
  size?: number;
  /** The name the letter fallback is taken from (the model or group name). */
  label?: string;
  /** Logo only, no tile. */
  bare?: boolean;
  /** Show the vendor's name in a tooltip. */
  titled?: boolean;
  className?: string;
};

export function VendorMark({ vendor, size = 22, label, bare = false, titled = false, className }: Props) {
  const t = useT();
  const paths = VENDOR_LOGOS[vendor];
  const style = { "--vm-size": `${size}px` } as CSSProperties;
  const common = {
    className: cn("c-vendor", bare && "c-vendor--bare", className),
    "data-vendor": vendor,
    style,
    // Makers' names stay in Latin; "Mixed" and "Other" are words (common.ts has their Chinese).
    title: titled ? t(VENDOR_NAME[vendor]) : undefined,
    "aria-hidden": true as const,
  };
  if (paths) {
    return (
      <span {...common}>
        <svg viewBox="0 0 24 24" fillRule="evenodd" focusable="false">
          {paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      </span>
    );
  }
  if (vendor === "composite") {
    return (
      <span {...common}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} focusable="false">
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path strokeLinecap="round" d="M8.7 10.7 15.3 7.3M8.7 13.3l6.6 3.4" />
        </svg>
      </span>
    );
  }
  return (
    <span {...common} data-letter="">
      {(label ?? VENDOR_NAME[vendor]).trim().charAt(0).toUpperCase() || "·"}
    </span>
  );
}

/** The mark for a model id (and the platform it is served on). */
export function ModelMark({ model, platform, ...rest }: Omit<Props, "vendor" | "label"> & { model: string; platform?: string | null }) {
  return <VendorMark vendor={vendorOf(model, platform)} label={model} {...rest} />;
}
