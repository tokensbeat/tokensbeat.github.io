/**
 * The screenshots the product pages carry (owner, 2026-11-06: "Add a screenshot for each section, use s1lin's
 * tokenbeat section's style. Actually, for other pages as well"): real captures of the products, cropped to the
 * feature, 1600 x 1000 WebP in src/assets/shots/, a light and a dark capture each and, where the product speaks
 * Chinese, an English and a Chinese one (<id>-<light|dark>-<en|zh>.webp). The page shows the one for its language and
 * the reader's theme (src/page/figures.tsx).
 *
 * Every capture is made from demo data: Aha from a local build signed in as a demo user, the console from its mock
 * build, News from the public site above its first headline. No real account, name, e-mail, balance, key or chat is in
 * any of them.
 *
 * Each has its words in both languages: the address on its frame, the alternative text, the caption and the credit.
 */
import type { Lang } from "@/i18n";
import type { Bi } from "./home";

export type ShotId = "latex" | "beads" | "metro" | "diary" | "news" | "aha" | "newkey" | "models" | "workspaces" | "ticket";
export type Theme = "light" | "dark";

export interface Shot {
  id: ShotId;
  /** The address on the frame's bar. */
  host: string;
  alt: Bi;
  caption: Bi;
  credit: Bi;
}

/** Every capture's size: the figures reserve this shape before the picture arrives. */
export const SHOT_WIDTH = 1600;
export const SHOT_HEIGHT = 1000;

const AHA = "aha.tokensbeat.com";
const CONSOLE = "console.tokensbeat.com";
const ahaCredit: Bi = { en: "Aha · demo account · 6 Nov 2026", zh: "Aha · 演示账户 · 2026 年 11 月 6 日" };
const consoleCredit: Bi = { en: "Console · demo data · 6 Nov 2026", zh: "控制台 · 演示数据 · 2026 年 11 月 6 日" };

export const SHOTS: Readonly<Record<ShotId, Shot>> = {
  latex: {
    id: "latex",
    host: AHA,
    alt: {
      en: "Aha's LaTeX app with a short paper, Cooling a cup of tea: its three files on the left, the source with highlighting in the middle and the compiled PDF, with its equations and a reference, on the right.",
      zh: "Aha 的 LaTeX 应用里的一篇短文《一杯茶怎样变凉》：左边是三个文件，中间是高亮的源码，右边是编译好的 PDF，有公式和参考文献。",
    },
    caption: { en: "A one-page note in three files, its source beside the PDF the server compiled.", zh: "一篇三个文件的短文，源码旁边就是服务器编译出的 PDF。" },
    credit: ahaCredit,
  },
  beads: {
    id: "beads",
    host: AHA,
    alt: {
      en: "Aha's bead pattern app: the built-in pixel heart turned into a pegboard chart with numbered rows and columns, beside the steps that choose the picture, the size and the style.",
      zh: "Aha 的拼豆图纸应用：内置的像素爱心变成标好行列的钉板图纸，左边是选图片、尺寸和风格的步骤。",
    },
    caption: { en: "The app's own pixel heart, as a chart to bead from.", zh: "应用自带的像素爱心，做成了可以照着拼的图纸。" },
    credit: ahaCredit,
  },
  metro: {
    id: "metro",
    host: AHA,
    alt: {
      en: "Metro2Line in Aha: the subway of central Tokyo, nine lines and 119 stations, drawn as a line map in each line's colour, with the lines listed beside it.",
      zh: "Aha 里的地铁线路图：东京市中心的地铁，9 条线路、119 个车站，按各线颜色画成线路图，线路列表在旁边。",
    },
    caption: { en: "Central Tokyo's subway, drawn from OpenStreetMap.", zh: "东京市中心的地铁，取自 OpenStreetMap。" },
    credit: ahaCredit,
  },
  diary: {
    id: "diary",
    host: AHA,
    alt: {
      en: "The shared diary in Aha: a demo couple's book, with countdowns to their birthdays and anniversary, and November's pages pinned to a board, each with a drawn picture and a few lines.",
      zh: "Aha 里的共享日记：一对演示情侣的小本子，有生日和纪念日的倒计时，十一月的几页钉在回忆墙上，每页一幅手绘图和几句话。",
    },
    caption: { en: "A demo couple's November: pages, drawings and the days to come.", zh: "一对演示情侣的十一月：日记、图画和倒数的日子。" },
    credit: ahaCredit,
  },
  news: {
    id: "news",
    host: "news.tokensbeat.com",
    alt: {
      en: "The top of TokensBeat News on a phone, on 6 November 2026: the nameplate, the edition's date and update time, and the front page and ranking tabs.",
      zh: "2026 年 11 月 6 日手机上的 TokensBeat 时报顶部：报头、这一期的日期和更新时间，以及头版和排行两个栏目。",
    },
    caption: { en: "The nameplate and the edition's line, above the first story.", zh: "报头和这一期的信息，在第一条新闻之上。" },
    credit: { en: "news.tokensbeat.com · 6 Nov 2026", zh: "news.tokensbeat.com · 2026 年 11 月 6 日" },
  },
  aha: {
    id: "aha",
    host: AHA,
    alt: {
      en: "Aha's start screen: the composer under What shall we make today?, five things to try, and three examples Aha has made: a contract brief, a launch deck and a budget sheet.",
      zh: "Aha 的首页：「今天，我们做点什么？」下面是输入框和五件可以试试的事，还有 Aha 做过的三个示例：合同摘要、发布会幻灯片和支出对比表。",
    },
    caption: { en: "Aha, the first app on the runtime, as a person opens it.", zh: "Aha：运行时上的第一个应用，打开时的样子。" },
    credit: ahaCredit,
  },
  newkey: {
    id: "newkey",
    host: CONSOLE,
    alt: {
      en: "The console's New key page: Simple chosen over Pro, then the Best price plan chosen over Official only, then a name.",
      zh: "控制台的新建密钥页：先选简单而非专业，再选最优价格而非仅官方，然后起个名字。",
    },
    caption: { en: "A new key: the kind, then the plan, then a name.", zh: "新建密钥：先选类型，再选方案，最后起名。" },
    credit: consoleCredit,
  },
  models: {
    id: "models",
    host: CONSOLE,
    alt: {
      en: "The Service Plaza's Models page: Anthropic, OpenAI, Google and the open-weight makers, each with its models' status and lowest price, and a model to start with.",
      zh: "服务广场的模型页：Anthropic、OpenAI、Google 和开放权重模型的厂商，各自列出模型状态和最低价，还推荐了一个入门模型。",
    },
    caption: { en: "Models by maker, each with its status and its price.", zh: "按厂商列出的模型，各带状态和价格。" },
    credit: consoleCredit,
  },
  workspaces: {
    id: "workspaces",
    host: CONSOLE,
    alt: {
      en: "The console's Workspaces page: a drawing of the workspace's desktop with Opera and a terminal, beside what is installed: Claude Code, Codex, Opera, VS Code and the toolchain.",
      zh: "控制台的工作区页：左边画着工作区桌面上的 Opera 和终端，右边是装好的软件：Claude Code、Codex、Opera、VS Code 和工具链。",
    },
    caption: { en: "What a workspace comes with, as the console lists it.", zh: "控制台列出的工作区自带软件。" },
    credit: consoleCredit,
  },
  ticket: {
    id: "ticket",
    host: CONSOLE,
    alt: {
      en: "A support ticket in the console: a question about an invoice and a person's answer under it, marked Support replied.",
      zh: "控制台里的一张工单：一个关于发票的问题，下面是客服的回答，状态为客服已回复。",
    },
    caption: { en: "A ticket and a person's answer, in the console.", zh: "控制台里的一张工单，和真人的回复。" },
    credit: consoleCredit,
  },
};

/** The capture files, by their name in src/assets/shots (Vite gives each its hashed address under /assets/). */
const FILES = import.meta.glob<string>("../assets/shots/*.webp", { eager: true, import: "default" });

/** The address of a shot's capture for a theme and a language. A missing capture is a broken build. */
export function shotSrc(id: ShotId, theme: Theme, lang: Lang): string {
  const src = FILES[`../assets/shots/${id}-${theme}-${lang}.webp`];
  if (!src) throw new Error(`no capture src/assets/shots/${id}-${theme}-${lang}.webp`);
  return src;
}
