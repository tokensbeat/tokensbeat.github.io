/**
 * / and /zh/: the homepage, built from the copy deck (src/content/home.ts). It leads with what is live (2026-11-16):
 *
 *   the hero        one composition on the night sky (the same in both themes: data-theme="dark" on it): the headline
 *                   is the owner's line from 《观沧海》 in two sentences (the second in jade), under it the claim in
 *                   plain words, one line and two buttons (Aha, a key), and under them the moving orbit on twinkling
 *                   stars (../StarField.tsx) that stop with the orbit's Pause
 *   new this month  three dated lines, as a paper's index: what opened, when and in which state, each a link to its
 *                   section below
 *   Bots            Aha's working bots: a bot's room in the coming Workspace (labelled Coming) beside four numbered
 *                   points; then today's list, small (labelled Live), what wakes a bot (a ruled table) and what keeps
 *                   it in bounds, two notes that fold to a row each on a phone
 *   Aha Code        early access: the approval card's screenshot beside four points, who sees it, then the Windows
 *                   download and how to ask for it
 *   the models      one kind of key: four lines beside the call (with Copy), then the price map (owner 2026-11-03:
 *                   "AI API pricing is a mess. Here's the map. Show the map in the home page, but no status":
 *                   ../PriceMap.tsx)
 *   the rails       also in Aha, four cards led by their screenshots (../figures.tsx), across the page; under it what
 *                   opens in stages (Bedrock) beside the people and tools (Vanguard), each card one line and its
 *                   status, the whole card the link
 *   pricing         beside four questions
 *   the closing     its line in the page's language (owner 2026-11-12: one language at a time), two buttons, and
 *                   ASCII sharks swimming in a column of their own (../SharkWater.tsx)
 */
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Copy } from "@/components/s1lin/copy";
import { C } from "@/content/copy";
import { headlineLines, HOME, homeSection, hrefFor, type HomeItem, type HomePoint, type HomeSection } from "@/content/home";
import { ENDPOINT_SNIPPETS, pagePath } from "@/content/site";
import { useI18n, type Lang } from "@/i18n";
import type { ShotId } from "@/content/shots";
import { Shot, Spread, type Point } from "../figures";
import { itemIcon } from "../icons";
import { OrbitFigure } from "../Orbit";
import { BeatLine, CodeSlab, CtaBand, FaqList, Lines, LinkButton, More, Section, SectionHead, StatusChip } from "../parts";
import { PriceMap } from "../PriceMap";
import { SharkWater } from "../SharkWater";
import { StarField } from "../StarField";

/** The pictures of Also in Aha's cards: a screenshot of each. */
const AHA_SHOTS: Readonly<Record<string, ShotId>> = { latex: "latex", news: "news", metro: "metro", "aha-storage": "storage" };

/** The call the models section prints: the docs' own cURL example. */
const CURL = ENDPOINT_SNIPPETS.find((s) => s.id === "curl")!;

/** A deck's points in the page's language, as a Spread takes them. */
const pointsOf = (points: HomePoint[], lang: Lang): Point[] => points.map((p) => ({ id: p.id, title: p.title?.[lang], body: p.body[lang] }));

/**
 * One rail: the eyebrow and title, then a card per item. The Serve rail is a night slab; a wide one spans both columns.
 * `shots`: each card leads with its picture (Also in Aha), side by side four across on a wide screen. `after`: what
 * follows the cards (a link to the whole of it).
 */
function Rail({ section, night = false, wide = false, shots = false, after }: { section: HomeSection; night?: boolean; wide?: boolean; shots?: boolean; after?: ReactNode }) {
  const { lang } = useI18n();
  const id = `home-${section.id}`;
  return (
    <section
      className={`h-lean-rail${night ? " h-night" : ""}${wide ? " h-lean-rail--wide" : ""}`}
      data-theme={night ? "dark" : undefined}
      data-rail={section.id}
      aria-labelledby={id}
    >
      <p className="h-eyebrow">
        <span>{section.eyebrow[lang]}</span>
      </p>
      <h2 id={id} className="h-h2 h-lean-rail__title">
        {section.title[lang]}
      </h2>
      <ul className={`h-lean-cards${shots ? " h-lean-cards--shots" : ""}`}>
        {(section.items ?? []).map((item) => {
          const Icon = itemIcon(item.id) ?? ArrowRight;
          return (
            <li key={item.id} className={`h-lean-card${shots ? " h-shot-card" : ""}`} data-item={item.id}>
              {shots ? (
                <Shot id={shotOf(item)} bare className="h-shot-card__fig" />
              ) : (
                <span className="h-lean-card__icon" aria-hidden="true">
                  <Icon focusable="false" />
                </span>
              )}
              <div className="h-lean-card__text">
                <h3 className="h-lean-card__name">
                  <a href={hrefFor(item.href, lang)}>{item.name[lang]}</a>
                </h3>
                <p className="h-lean-card__line">{item.line[lang]}</p>
              </div>
              <StatusChip status={item.status} size="sm" className="h-lean-card__chip" />
              <ArrowRight className="h-lean-card__arrow" aria-hidden="true" focusable="false" />
            </li>
          );
        })}
      </ul>
      {after}
    </section>
  );
}

/** A card's screenshot on the Also in Aha rail; a card without one is a broken deck. */
function shotOf(item: HomeItem): ShotId {
  const shot = AHA_SHOTS[item.id];
  if (!shot) throw new Error(`the homepage deck's ${item.id} has no screenshot`);
  return shot;
}

/** New this month: three dated lines under one rule, as a paper's index; each goes to its section on this page. */
function NewsStrip() {
  const { lang } = useI18n();
  const { news } = HOME;
  return (
    <section className="h-news" aria-labelledby="home-news">
      <div className="h-wrap h-news__wrap">
        <h2 id="home-news" className="h-news__label">
          {news.label[lang]}
        </h2>
        <ol className="h-news__list">
          {news.items.map((item) => (
            <li key={item.id} className="h-news__item" data-news={item.id}>
              <p className="h-news__meta">
                <time className="h-news__date">{item.date[lang]}</time>
                <StatusChip status={item.status} size="sm" />
              </p>
              <h3 className="h-news__name">
                <a href={hrefFor(item.href, lang)}>{item.name[lang]}</a>
              </h3>
              <p className="h-news__line">{item.line[lang]}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A phone, where a feature's notes fold to a row each. */
const PHONE = "(max-width: 639px)";

/**
 * A note under a feature's picture and points: its title, then a table or lines. It is a disclosure that the page
 * renders open; on a phone it closes once the page is live (the reader opens the one they want), so the section stays
 * short there. Without scripts it stays open.
 */
function Note({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (ref.current && window.matchMedia?.(PHONE).matches) ref.current.open = false;
  }, []);
  return (
    <details ref={ref} className="h-feat__note" data-note={id} open>
      <summary className="h-feat__sum">
        <h3 className="h-feat__h3">{title}</h3>
      </summary>
      {children}
    </details>
  );
}

/**
 * Bots: the lead picture is a bot's room in the Workspace of the next Aha update (owner, 2026-11-16: the rooms are
 * the more attractive picture), labelled Coming on its caption, beside the four points, which are all live today;
 * under them today's list, small and close on the bot that waits (labelled Live), then what wakes a bot (a table of the
 * real shapes) and what bounds it. On a phone today's list comes straight after the room, before the points (the
 * stylesheet's order), so what is open today is seen at once.
 */
function BotsFeature() {
  const { lang } = useI18n();
  const { bots } = HOME;
  return (
    <Section id="home-bots" className="h-feat h-feat--bots">
      <SectionHead id="home-bots" eyebrow={bots.eyebrow[lang]} status={bots.status} title={bots.title[lang]} lead={bots.line[lang]} />
      <Spread shot="room" n={1} lead points={pointsOf(bots.points, lang)} after={<More href={hrefFor(bots.link.href, lang)}>{bots.link.label[lang]}</More>} />
      <div className="h-feat__notes h-feat__notes--today">
        <Shot id="bots" n={2} close className="h-feat__today" />
        <Note id="wakes" title={bots.wakes.title[lang]}>
          <table className="h-wakes">
            <tbody>
              {bots.wakes.rows.map((row) => (
                <tr key={row.id} data-wake={row.id}>
                  <th scope="row">{row.what[lang]}</th>
                  <td>{row.how[lang]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Note>
        <Note id="bounds" title={bots.bounds.title[lang]}>
          <Lines one items={bots.bounds.lines.map((l) => l[lang])} />
        </Note>
      </div>
    </Section>
  );
}

/** Aha Code, in early access: the approval card beside its points; who sees it, then the Windows download and how to ask. */
function CodeFeature() {
  const { lang } = useI18n();
  const { code } = HOME;
  return (
    <Section id="home-code" band className="h-feat">
      <SectionHead id="home-code" eyebrow={code.eyebrow[lang]} status={code.status} title={code.title[lang]} lead={code.line[lang]} />
      <Spread
        shot="code"
        n={3}
        flip
        points={pointsOf(code.points, lang)}
        after={
          <div className="h-feat__get">
            <p className="h-small h-feat__small">{code.note[lang]}</p>
            <div className="h-actions">
              <LinkButton href={hrefFor(code.primary.href, lang)} variant="go">
                {code.primary.label[lang]}
              </LinkButton>
              <More href={hrefFor(code.secondary.href, lang)}>{code.secondary.label[lang]}</More>
            </div>
          </div>
        }
      />
    </Section>
  );
}

/** The models: what one kind of key means, in four lines, beside the call itself; the price map follows. */
function ModelsFeature() {
  const { lang, t } = useI18n();
  const { models } = HOME;
  return (
    <Section id="home-models" className="h-feat h-feat--models">
      <SectionHead id="home-models" eyebrow={models.eyebrow[lang]} status={models.status} title={models.title[lang]} />
      <div className="h-models">
        <div className="h-models__words">
          <Lines one items={models.lines.map((l) => l[lang])} />
          <div className="h-actions">
            <LinkButton href={hrefFor(models.primary.href, lang)} variant="go">
              {models.primary.label[lang]}
            </LinkButton>
            <More href={hrefFor(models.secondary.href, lang)}>{models.secondary.label[lang]}</More>
            <More href={hrefFor(models.page.href, lang)}>{models.page.label[lang]}</More>
          </div>
        </div>
        <CodeSlab title="cURL" note={t(CURL.note)} code={CURL.code} action={<Copy value={CURL.code} label={t("kit::Copy {name}", { name: "cURL" })} />} />
      </div>
    </Section>
  );
}

/** A headline sentence in clauses that do not break inside (Chinese breaks between any two characters otherwise). */
function Clauses({ text }: { text: string }) {
  const parts = text.split(/(?<=[，、；])/);
  if (parts.length < 2) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => (
        <span key={i} className="h-clause">
          {part}
        </span>
      ))}
    </>
  );
}

/** A headline a line at a time (headlineLines); a Chinese line never breaks inside (word-break: keep-all in zh.css). */
function HeadlineLines({ text, lang }: { text: string; lang: Lang }) {
  return (
    <>
      {headlineLines(text, lang).map((line, i) => (
        <Fragment key={i}>
          {i > 0 && lang === "en" ? " " : null}
          <span className="h-cta__line" data-line="">
            {line}
          </span>
        </Fragment>
      ))}
    </>
  );
}

/** The pricing line with its first dollar amount set as a figure in the money colour. */
function PriceLine({ text }: { text: string }) {
  const m = /\$\d+(?:\.\d+)?|\d+(?:\.\d+)?\s?美元/.exec(text);
  if (!m) return <p className="h-lead">{text}</p>;
  return (
    <p className="h-lead">
      {text.slice(0, m.index)}
      <b className="h-lean-price__amount">{m[0]}</b>
      {text.slice(m.index + m[0].length)}
    </p>
  );
}

export function Home() {
  const { lang, t } = useI18n();
  const { hero, faq, closing } = HOME;
  const pricing = homeSection("pricing");
  const aha = homeSection("aha");
  const [paused, setPaused] = useState(false);

  return (
    <>
      <section className="h-hero h-lean-hero h-cosmos" data-theme="dark" aria-labelledby="home-title">
        <StarField paused={paused} />
        <div className="h-wrap h-lean-hero__copy">
          <h1 id="home-title" className="h-h1 h-home-title">
            <span>
              <Clauses text={hero.titleA[lang]} />
            </span>
            {lang === "zh" ? "" : " "}
            <em>
              <Clauses text={hero.titleB[lang]} />
            </em>
          </h1>
          <p className="h-home-claim">{hero.claim[lang]}</p>
          <p className="h-lead h-lean-hero__line">{hero.line[lang]}</p>
          <div className="h-actions h-lean-hero__actions">
            <LinkButton href={hrefFor(hero.primary.href, lang)} variant="go">
              {hero.primary.label[lang]}
            </LinkButton>
            <LinkButton href={hrefFor(hero.secondary.href, lang)}>{hero.secondary.label[lang]}</LinkButton>
          </div>
        </div>
        <div className="h-wrap h-lean-hero__figure">
          <OrbitFigure paused={paused} onPausedChange={setPaused} />
        </div>
      </section>

      <NewsStrip />
      <BotsFeature />
      <CodeFeature />
      <ModelsFeature />
      <PriceMap where="home" />

      <div className="h-section h-lean-rails-section">
        <div className="h-wrap h-lean-rails">
          <Rail section={aha} wide shots after={aha.more && <More href={hrefFor(aha.more.href, lang)} className="h-lean-rail__more">{aha.more.label[lang]}</More>} />
          <Rail section={homeSection("serve")} night />
          <Rail section={homeSection("support")} />
        </div>
      </div>

      <section className="h-section h-band h-lean-price-section" aria-labelledby="home-pricing">
        <div className="h-wrap h-lean-price-grid">
          <div className="h-lean-price">
            <p className="h-eyebrow">
              <span>{pricing.eyebrow[lang]}</span>
            </p>
            <h2 id="home-pricing" className="h-h2">
              {pricing.title[lang]}
            </h2>
            {pricing.line && <PriceLine text={pricing.line[lang]} />}
            <BeatLine className="h-lean-price__beat" animated={false} />
            <More href={pagePath("pricing", lang)}>{t(C.common.seePricing)}</More>
          </div>
          <FaqList
            id="home-faq"
            embedded
            items={faq.map((x, i) => ({ id: `q${i + 1}`, question: x.q[lang], answer: x.a[lang] }))}
          />
        </div>
      </section>

      <CtaBand id="home-final" title={<HeadlineLines text={closing.title[lang]} lang={lang} />} aside={<SharkWater />}>
        <LinkButton href={hrefFor(closing.button.href, lang)} variant="go">
          {closing.button.label[lang]}
        </LinkButton>
        <LinkButton href={hrefFor(closing.second.href, lang)}>{closing.second.label[lang]}</LinkButton>
      </CtaBand>
    </>
  );
}
