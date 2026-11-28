/**
 * / and /zh/: the homepage, built from the copy deck (src/content/home.ts), as the 2026-11-27 design has it:
 *
 *   the journey      one night slab with the chart of the Milky Way, sticky under the head, and five steps over it:
 *                    the hero (the owner's line from 《观沧海》 as the h1, the second sentence in jade, the claim in
 *                    plain words, Aha and a key), then Aha, Bots, the Model API and Pricing, each a plate of words while
 *                    the chart's camera moves to that product (../Journey.tsx, ../milkyWay.ts)
 *   first request    the call in cURL, Python and Node.js (the kit's Tabs and Code with Copy), beside the words and
 *                    the links to a key, the docs and the model prices
 *   pricing          no subscription: the three figures (the kit's Stats) and where a fee shows
 *   the closing      Start with Aha, and its two buttons
 */
import { Code } from "@/components/s1lin/code";
import { Stat, StatGroup } from "@/components/s1lin/stat";
import { Tabs } from "@/components/s1lin/tabs";
import { FIRST_REQUEST, HOME, hrefFor } from "@/content/home";
import { useI18n } from "@/i18n";
import { Journey } from "../Journey";
import { LinkButton, More, Section, SectionHead } from "../parts";

/** The first request: the words and links beside the call, in a tab a language. */
function FirstRequest() {
  const { lang } = useI18n();
  const { code } = HOME;
  return (
    <Section id="home-code" className="h-home-paper">
      <div className="h-first">
        <div className="h-first__words">
          <p className="h-eyebrow">
            <span>{code.eyebrow[lang]}</span>
          </p>
          <h2 id="home-code" className="h-h2">
            {code.title[lang]}
          </h2>
          <p className="h-lead">{code.lead[lang]}</p>
          <div className="h-actions">
            <LinkButton href={hrefFor(code.primary.href, lang)} variant="go">
              {code.primary.label[lang]}
            </LinkButton>
            {code.links.map((link) => (
              <More key={link.href} href={hrefFor(link.href, lang)}>
                {link.label[lang]}
              </More>
            ))}
          </div>
        </div>
        <Tabs
          className="h-first__code"
          label={code.tabs[lang]}
          tabs={FIRST_REQUEST.map((s) => ({
            id: s.id,
            label: s.label,
            content: (
              <Code block copy label={<span>POST /v1/chat/completions</span>}>
                {s.code}
              </Code>
            ),
          }))}
        />
      </div>
    </Section>
  );
}

/** No subscription: the three figures, and where a fee shows. */
function Pricing() {
  const { lang } = useI18n();
  const { pricing } = HOME;
  return (
    <Section id="home-pricing" className="h-home-paper">
      <SectionHead id="home-pricing" eyebrow={pricing.eyebrow[lang]} title={pricing.title[lang]} lead={pricing.lead[lang]} />
      <StatGroup className="h-home-stats">
        {pricing.stats.map((s) => (
          <Stat key={s.id} data-stat={s.id} label={s.label[lang]} value={s.value} />
        ))}
      </StatGroup>
      <p className="h-small h-home-note">{pricing.note[lang]}</p>
    </Section>
  );
}

export function Home() {
  const { lang } = useI18n();
  const { closing } = HOME;
  return (
    <>
      <Journey />
      <FirstRequest />
      <Pricing />
      <Section id="home-final" className="h-home-paper">
        <div className="h-home-close">
          <div>
            <h2 id="home-final" className="h-h2">
              {closing.title[lang]}
            </h2>
            <p className="h-lead">{closing.lead[lang]}</p>
          </div>
          <div className="h-actions">
            <LinkButton href={hrefFor(closing.primary.href, lang)} variant="go">
              {closing.primary.label[lang]}
            </LinkButton>
            <LinkButton href={hrefFor(closing.secondary.href, lang)}>{closing.secondary.label[lang]}</LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}
