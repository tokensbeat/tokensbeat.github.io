/**
 * The price maps (owner 2026-11-02): the gateway's public price list drawn on the @s1lin MetroMap, one line a
 * model family with its logo, each model a stop at the lowest price TokensBeat charges for it (src/lib/priceMap.ts):
 * models priced by the token at their output price in five fare zones, where lines of the same fare meet at an
 * interchange; models priced by the image or the request on a second small map, by the piece. No table here: the
 * console's Pro view is the table, and a link under the caption goes there. The maps' text alternative is a visually
 * hidden list of the same data (`aria-details`). Each stop links to the model in the console's plaza.
 *
 * Two places (owner 2026-11-03: "show the map in the home page, but no status"): /pricing/ has both maps; the homepage
 * (`where="home"`) has the token map under the same heading, then links to /pricing/'s maps and to the console's table.
 * Neither shows a status: a stop's card is its prices and where they come from.
 *
 * The prices are live: the prerender knows none, so the page is built with ghost lines in their place and the browser
 * fills them in after hydration (src/page/live.ts plazaPrices: GET /api/v1/model-plaza/prices, anonymous, on the API
 * origin the policy's connect-src already names; the gateway answers it while the plaza itself needs a sign-in). When
 * the gateway does not publish its prices (the owner's switch, model_plaza_public_prices), or cannot be read, the
 * section keeps its heading and says so under the TokensBeat mark, with a button to the plaza.
 */
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/s1lin/empty-state";
import { MetroGlyph, MetroMap, type MetroLine } from "@/components/s1lin/metro-map";
import { Logo } from "@/components/app/Logo";
import { C } from "@/content/copy";
import { consoleUrl, links } from "@/content/links";
import { pagePath } from "@/content/site";
import { useI18n } from "@/i18n";
import { interchange, pieceAxis, priceMaps, tokenAxis, zones, type PlazaGroup } from "@/lib/priceMap";
import { plazaPrices } from "./live";
import { LinkButton, More, Section, SectionHead } from "./parts";

type Phase = { phase: "loading" } | { phase: "open"; groups: PlazaGroup[] } | { phase: "closed" } | { phase: "failed" };

/** Where the maps are: the section's id (its heading's, and the anchor other pages link to) and its text alternative's. */
const PLACES = {
  pricing: { id: "pricing-map", list: "pricing-map-list" },
  home: { id: "home-price-map", list: "home-price-map-list" },
} as const;

/** The maps as nested lists: each line, then each stop as a screen reader hears it on the map. */
function Listed({ lines, label }: { lines: MetroLine[]; label: string }) {
  if (!lines.length) return null;
  return (
    <ul aria-label={label}>
      {lines.map((line) => (
        <li key={line.id}>
          {line.name}
          <ul>
            {line.stations
              .filter((s) => s.x != null)
              .map((s) => (
                <li key={s.id}>{[s.label, s.value].filter(Boolean).join(", ")}</li>
              ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export function PriceMap({ where = "pricing" }: { where?: keyof typeof PLACES }) {
  const { lang, t } = useI18n();
  const P = C.pricing.map;
  const { id, list: listId } = PLACES[where];
  const home = where === "home";
  const [state, setState] = useState<Phase>({ phase: "loading" });

  useEffect(() => {
    const ctl = new AbortController();
    plazaPrices(ctl.signal).then(
      (r) => setState(r.state === "open" ? { phase: "open", groups: r.groups } : { phase: "closed" }),
      () => !ctl.signal.aborted && setState({ phase: "failed" }),
    );
    return () => ctl.abort();
  }, []);

  const maps = useMemo(
    () =>
      priceMaps(state.phase === "open" ? state.groups : null, t, (model, groupId) =>
        consoleUrl(`/models?model=${encodeURIComponent(model)}&group=${groupId}`, lang),
      ),
    [state, t, lang],
  );
  const zoneList = useMemo(() => zones(t), [t]);
  const axes = useMemo(() => ({ tokens: tokenAxis(t), pieces: pieceAxis(t) }), [t]);
  const meets = useMemo(() => ({ tokens: interchange(t, "tokens"), pieces: interchange(t, "pieces") }), [t]);

  // The homepage draws the token map only; /pricing/ has the piece map too.
  const pieces = home ? [] : maps.pieces;
  const drawn = maps.tokens.length > 0 || pieces.length > 0;
  const [title, body] =
    state.phase === "closed" ? [P.closedTitle, P.closedBody] : state.phase === "failed" ? [P.failedTitle, P.failedBody] : [P.emptyTitle, P.closedBody];
  const toPlaza = (
    <LinkButton href={links(lang).plaza} arrow>
      {t(P.open)}
    </LinkButton>
  );
  const nothing = (
    <EmptyState mark={<Logo mono />} title={t(title)} action={toPlaza}>
      <p>{t(body)}</p>
    </EmptyState>
  );
  const unpriced = maps.unpriced === 0 ? "" : ` ${maps.unpriced === 1 ? t(P.unpricedOne) : t(P.unpriced, { n: maps.unpriced })}`;

  return (
    <Section id={id} className={home ? "h-pricemap h-pricemap--home" : "h-pricemap"}>
      <SectionHead id={id} eyebrow={t(P.eyebrow)} title={t(P.title)} lead={t(P.lead)} stacked />
      {state.phase !== "open" || !drawn ? (
        // Loading, closed (prices not published), failed, or a list with nothing to draw: one map, its ghosts or its words.
        <MetroMap className="h-pricemap__map" lines={[]} loading={state.phase === "loading" ? 6 : false} empty={nothing} />
      ) : (
        <>
          {maps.tokens.length > 0 && (
            <MetroMap
              className="h-pricemap__map"
              lines={maps.tokens}
              axis={axes.tokens}
              zones={zoneList}
              interchange={meets.tokens}
              label={t(P.label)}
              details={listId}
              caption={`${t(P.caption)}${unpriced}`}
              legend={
                <>
                  {t(P.legend)} · <MetroGlyph kind="stop" />
                  {t(P.legendStop)} · <MetroGlyph kind="input" />
                  {t(P.legendInput)} · <MetroGlyph kind="interchange" />
                  {t(P.legendSame)}
                </>
              }
            />
          )}
          {home ? (
            <p className="h-after h-after--row">
              <More href={`${pagePath("pricing", lang)}#${PLACES.pricing.id}`}>{t(P.all)}</More>
              <More href={consoleUrl("/models?view=pricing", lang)}>{t(P.table)}</More>
            </p>
          ) : (
            <p className="h-pricemap__more">
              <LinkButton href={consoleUrl("/models?view=pricing", lang)} arrow>
                {t(P.table)}
              </LinkButton>
            </p>
          )}
          {pieces.length > 0 && (
            <div className="h-pricemap__piece">
              <h3 className="h-h3">{t(P.pieceTitle)}</h3>
              <p className="h-small h-pricemap__lede">{t(P.pieceLead)}</p>
              <MetroMap
                className="h-pricemap__map"
                lines={pieces}
                axis={axes.pieces}
                interchange={meets.pieces}
                label={t(P.pieceLabel)}
                details={listId}
                caption={t(P.pieceCaption)}
                legend={t(P.pieceLegend)}
              />
            </div>
          )}
          <div id={listId} className="h-visually-hidden">
            <p>{t(P.list)}</p>
            <Listed lines={maps.tokens} label={t(P.tokenList)} />
            <Listed lines={pieces} label={t(P.pieceList)} />
          </div>
        </>
      )}
    </Section>
  );
}
