/**
 * The screenshots the product pages carry (owner, 2026-11-06: "Add a screenshot for each section, use s1lin's
 * tokenbeat section's style. Actually, for other pages as well"): real captures of the products, cropped to the
 * feature, 1600 x 1000 WebP in src/assets/shots/, a light and a dark capture each and, where the product speaks
 * Chinese, an English and a Chinese one (<id>-<light|dark>-<en|zh>.webp). The page shows the one for its language and
 * the reader's theme (src/page/figures.tsx).
 *
 * One capture is of something not released: `room`, the Workspace built for the next Aha update, taken from its
 * branch's build with sample bots; its `status` is "coming" and its caption and credit say so.
 *
 * Every capture is made from demo data: Aha from a local build signed in as a demo user (Bots: the app's five starter
 * bots, its API answered from memory; Aha Code: the Windows app's own page with the app's bridge answered from memory,
 * one invented project), the console from its mock build, News from the public site above its first headline. No real account, name, e-mail, balance, key or chat is in
 * any of them.
 *
 * Each has its words in both languages: the address on its frame, the alternative text, the caption and the credit.
 */
import type { Lang } from "@/i18n";
import type { Bi } from "./home";
import type { SiteStatus } from "./site";

export type ShotId = "room" | "bots" | "code" | "latex" | "beads" | "metro" | "diary" | "news" | "aha" | "storage" | "newkey" | "models" | "workspaces" | "ticket";
export type Theme = "light" | "dark";

export interface Shot {
  id: ShotId;
  /** The address on the frame's bar. */
  host: string;
  alt: Bi;
  caption: Bi;
  credit: Bi;
  /**
   * On a phone a whole capture is too small to read: a figure beside its points shows this part of it larger (the
   * capture scaled by `zoom` about `origin`, a CSS transform-origin), clipped by the frame. The caption must hold for
   * the part as for the whole.
   */
  focus?: { zoom: number; origin: string };
  /**
   * What the picture shows, in the site's status words, said on its caption: `coming` for a capture of something
   * built and not released (its caption and credit must say so), `live` for what is open today beside it.
   */
  status?: SiteStatus;
  /** With a status: when, in two or three words, said beside the chip on the frame's bar ("next Aha update", "today"). */
  when?: Bi;
}

/** Every capture's size: the figures reserve this shape before the picture arrives. */
export const SHOT_WIDTH = 1600;
export const SHOT_HEIGHT = 1000;

const AHA = "aha.tokensbeat.com";
const CONSOLE = "console.tokensbeat.com";
const ahaCredit: Bi = { en: "Aha · demo account · 6 Nov 2026", zh: "Aha · 演示账户 · 2026 年 11 月 6 日" };
const consoleCredit: Bi = { en: "Console · demo data · 6 Nov 2026", zh: "控制台 · 演示数据 · 2026 年 11 月 6 日" };

export const SHOTS: Readonly<Record<ShotId, Shot>> = {
  // The Workspace of the next Aha update (the house: a room for each bot), captured from its branch's build with
  // sample bots. Not released: the caption and the credit say so, and nothing else on the site claims it.
  room: {
    id: "room",
    host: "Aha",
    alt: {
      en: "A bot's room in the new Workspace, drawn in 3D: a corner room with a sage wall and a terracotta floor, where a small white robot works at a desk with a screen by the window, beside two armchairs, a rug and plants. A bar above reads All rooms and Atlas's room; a card below names the bot Atlas, its job, its model and that it is working, with Open chat and Room style.",
      zh: "新工作间里一个机器人的房间，3D 画面：墙是灰绿色，地面是陶红色，一个白色小机器人在窗边带屏幕的书桌前干活，旁边有两把扶手椅、一块地毯和几盆植物。上方写着「全部房间」和「Atlas 的房间」；下方的卡片写着机器人 Atlas、它的分工、所用模型和「正在干活」，还有「打开对话」和「房间风格」。",
    },
    caption: {
      en: "The new Workspace, coming in the next Aha update: a house where each bot will have a room, and pressing a room will take you inside. Here Atlas, a sample bot, is at work in its own.",
      zh: "新的工作间，随下一次 Aha 更新推出：一栋房子，每个机器人会有一间自己的房间，到时点一下就能走进去。图中是示例机器人 Atlas 在自己的房间里干活。",
    },
    credit: { en: "Aha · next update · sample bots · 16 Nov 2026", zh: "Aha · 下次更新 · 示例机器人 · 2026 年 11 月 16 日" },
    status: "coming",
    when: { en: "next Aha update", zh: "下一次 Aha 更新" },
    // On a phone: the room and the bot's card, a step closer (the pill above them and the empty ground at the right
    // are left out).
    focus: { zoom: 1.18, origin: "6% 87%" },
  },
  bots: {
    id: "bots",
    host: `${AHA}/#/bots`,
    alt: {
      en: "The Bots page in Aha, as a list: five bots with their jobs. Scout the researcher is reading 12 pages, Quill the writer is writing, Patch the coder needs an answer and has an Answer button, Lookout is idle. Each shows its runs and the percent of its share it has used.",
      zh: "Aha 的机器人页面，列表视图：五个机器人和各自的分工。研究员阿探正在读 12 个网页，写手墨墨正在写，工程师补丁在等你决定、旁边有「去回答」按钮，值守守望空闲。每个机器人都列出运行次数和已用份额的百分比。",
    },
    caption: {
      en: "Today: the Bots list. Patch, the coder, waits for an answer. Use is a percent of each bot's share.",
      zh: "今天的样子：机器人列表。工程师补丁在等你回复。用量按各自份额的百分比显示。",
    },
    credit: { en: "Aha · demo account · 16 Nov 2026", zh: "Aha · 演示账户 · 2026 年 11 月 16 日" },
    // The card that waits for the user, whole and alone: the lower left of the capture.
    focus: { zoom: 2.2, origin: "8% 100%" },
    status: "live",
    when: { en: "today", zh: "今天" },
  },
  code: {
    id: "code",
    host: "Aha Code",
    alt: {
      en: "Aha Code in the Aha for Windows window, in a project named orders-api, on a chat titled No error for a bad e-mail: Aha waits for approval to run pytest, with Deny and Allow once on the card and a box to always allow this command in this project.",
      zh: "Aha Windows 版窗口里的 Aha 代码，项目名为 orders-api，对话标题是「错误邮箱没有提示」：Aha 等你批准运行 pytest，卡片上有「拒绝」和「允许一次」，还有一个在本项目里始终允许这条命令的选项。",
    },
    caption: {
      en: "Before a command runs, Aha Code asks: deny it, allow it once, or always in this project.",
      zh: "运行命令之前，Aha 代码先问你：拒绝、允许一次，或在这个项目里一直允许。",
    },
    credit: { en: "Aha for Windows · demo project · 16 Nov 2026", zh: "Aha Windows 版 · 演示项目 · 2026 年 11 月 16 日" },
  },
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
  storage: {
    id: "storage",
    host: CONSOLE,
    alt: {
      en: "The console's Storage page: 13.4 MB used of a free 500 MB quota, and the space by kind: uploads, images, chats, LaTeX, diary photos and video frames.",
      zh: "控制台的存储页：免费 500 MB 配额已用 13.4 MB，下面按类别列出空间：上传、图片、对话、LaTeX、日记照片和视频帧。",
    },
    caption: { en: "One quota for everything kept in Aha, measured by kind.", zh: "Aha 里保存的一切共用一份配额，按类别统计。" },
    credit: consoleCredit,
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
