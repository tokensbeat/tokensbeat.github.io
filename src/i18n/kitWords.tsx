/**
 * The @s1lin kit's own words in the page's language, for the parts the site uses (Code's Copy and what a screen
 * reader hears after it; the pricing page's maps). Keys carry the "kit::" context, as in the console.
 */
import { useMemo, type ReactNode } from "react";
import { S1Words, type S1WordMap } from "@/components/s1lin/words";
import { useT } from "./index";

export function KitWords({ children }: { children: ReactNode }) {
  const t = useT();
  const words = useMemo<Partial<S1WordMap>>(
    () => ({
      copy: t("kit::Copy"),
      copied: t("kit::Copied"),
      copyFailed: t("kit::Failed"),
      copiedMessage: t("kit::Copied to the clipboard"),
      copyFailedMessage: t("kit::Could not copy: select the text and copy it"),
      copyName: (name) => t("kit::Copy {name}", { name }),
      copyCode: t("kit::Copy code"),
      code: t("kit::Code"),
      // the pricing page's maps (MetroMap): its ghost lines, its empty words, an interchange's heading
      loading: t("kit::Loading"),
      empty: t("kit::Nothing here yet."),
      sameFare: t("kit::Same fare"),
      and: t("kit:: and "),
    }),
    [t],
  );
  return <S1Words words={words}>{children}</S1Words>;
}
