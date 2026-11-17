/** Reading this app's stylesheets in tests: their rules and a property's value. */
/** The style rules of a stylesheet, at any depth of @media or @layer. */
export function rules(css: string): { selector: string; body: string }[] {
  const out: { selector: string; body: string }[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const walk = (s: string) => {
    let at = 0;
    while (at < s.length) {
      const open = s.indexOf("{", at);
      if (open < 0) return;
      const head = s.slice(at, open).trim();
      let depth = 1;
      let close = open + 1;
      for (; close < s.length && depth > 0; close++) depth += s[close] === "{" ? 1 : s[close] === "}" ? -1 : 0;
      const body = s.slice(open + 1, close - 1);
      if (head.startsWith("@")) walk(body);
      else out.push({ selector: head.slice(head.lastIndexOf(";") + 1).trim(), body });
      at = close;
    }
  };
  walk(text);
  return out;
}
export const prop = (body: string, name: string) => body.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`))?.[1].trim();
