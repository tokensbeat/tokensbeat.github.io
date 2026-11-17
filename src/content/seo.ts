/**
 * Each page's title and description for search and sharing, as tokensbeat.com's earlier Vue site (v4) gave them, in
 * English with its Chinese, the brand written
 * TokensBeat. src/seo/head.ts writes them into each prerendered page.
 */
import type { PageId } from "./site";

export interface SeoText {
  title: string;
  description: string;
}

export const SEO: Readonly<Record<PageId, { en: SeoText; zh: SeoText }>> = {
  home: {
    // Plain words, not the headline's: the hero's h1 is a line of Cao Cao's poem, which says nothing a search engine
    // can rank. The title is the claim under it; the description names the gateway, Aha with its bots and Aha Code,
    // and the backend that is opening in stages.
    en: {
      title: "TokensBeat: one key for the AI models, and Aha with its working bots",
      description: "AI models through one API key at public prices, and Aha: chat, bots that run your routines while you are away, and Aha Code on your own Windows computer. A Postgres backend and an agent runtime are in early access.",
    },
    zh: {
      title: "TokensBeat：一把密钥通 AI 模型，Aha 里有干活的机器人",
      description: "一把 API 密钥调用各家 AI 模型，价格公开；还有 Aha：对话、在你离开时按例行任务干活的机器人，以及在你自己 Windows 电脑上的 Aha 代码。Postgres 后端与 Agent 运行时处于抢先体验。",
    },
  },
  database: {
    en: {
      title: "Postgres database and auth for your app | TokensBeat",
      description: "Its own Postgres 17 per project with a REST API, sign-in and row-level security, at Supabase's API paths. In early access.",
    },
    zh: { title: "应用的 Postgres 数据库与认证 | TokensBeat", description: "每个项目一个独立的 Postgres 17，带 REST API、登录和行级安全，API 路径与 Supabase 相同。目前是抢先体验。" },
  },
  storage: {
    en: {
      title: "Storage, realtime and functions | TokensBeat",
      description:
        "Private buckets and realtime database changes next to your Postgres project, in early access, with its keys and row-level security. Functions are coming.",
    },
    zh: { title: "存储、实时和函数 | TokensBeat", description: "私有存储桶和数据库实时变更（抢先体验），和你的 Postgres 项目放在一起，用同一套密钥和行级安全。函数即将推出。" },
  },
  models: {
    en: {
      title: "One API key for the leading AI models | TokensBeat",
      description:
        "Anthropic, OpenAI, Google and open-weight models behind one endpoint, with key plans and a public price for every model. Pay per request from one balance.",
    },
    zh: {
      title: "一个 API Key 调用主流 AI 模型 | TokensBeat",
      description: "Anthropic、OpenAI、Google 和开放权重模型，统一一个接口地址，带 Key 方案，每个模型的价格公开可查。按请求从一份余额中扣费。",
    },
  },
  agents: {
    en: {
      title: "An agent runtime for your app's assistant | TokensBeat",
      description:
        "The runtime behind Aha for your app: your persona and tools as functions per run, web search and images built in, billed to your own key. Early access.",
    },
    zh: {
      title: "给你的助手用的 Agent 运行时 | TokensBeat",
      description: "Aha 背后的运行时，开放给你的应用：每次运行注入你的人设和函数形式的工具，内置网页搜索和图片，费用计入你自己的 Key。抢先体验。",
    },
  },
  workspace: {
    en: {
      title: "A cloud dev box with Claude Code and Codex | TokensBeat",
      description:
        "Your own Linux machine in the cloud with Claude Code, Codex and Opera, over SSH, VS Code or a browser desktop, billed per running hour. Beta, invite only.",
    },
    zh: {
      title: "预装 Claude Code 与 Codex 的云端开发机 | TokensBeat",
      description: "你自己的云端 Linux 机器，预装 Claude Code、Codex 和 Opera，可用 SSH、VS Code 或浏览器桌面连接，按运行小时计费。Beta，需要邀请。",
    },
  },
  aha: {
    en: {
      title: "Aha: the agent app built on TokensBeat",
      description: "Chat with tools, research with sources, images, apps and a store at aha.tokensbeat.com, paid from your TokensBeat balance.",
    },
    zh: { title: "Aha：跑在 TokensBeat 上的 Agent 应用", description: "能用工具的对话、有出处的研究、图片、应用和商店，地址 aha.tokensbeat.com，用你的 TokensBeat 余额付费。" },
  },
  supabase: {
    en: {
      title: "A Supabase alternative with AI built in | TokensBeat",
      description: "An honest comparison with Supabase: the same open-source services at the same API paths, what is not there yet, and how a move will work.",
    },
    zh: { title: "内置 AI 的 Supabase 替代方案 | TokensBeat", description: "与 Supabase 的如实对比：开源服务和 API 路径相同，哪些功能还没有，以及迁移会怎么做。" },
  },
  pricing: {
    en: {
      title: "Pricing: pay as you go from one balance | TokensBeat",
      description:
        "Top up by card or Link from $5, or USDT or USDC from $15, and pay per use for AI models, images, sessions and workspaces. Fees shown at checkout.",
    },
    zh: {
      title: "价格：一份余额，按量计费 | TokensBeat",
      description: "银行卡或 Link 5 美元起充，USDT 或 USDC 15 美元起；AI 模型、图片、私有会话和工作区按用量计费。手续费在结账时显示。",
    },
  },
  help: {
    en: {
      title: "Support: guides and people | TokensBeat",
      description: "17 guides for keys, billing, the APIs, Codex and Claude Code, and support tickets answered by the people who run TokensBeat.",
    },
    zh: { title: "支持：指南与真人 | TokensBeat", description: "17 篇指南，涵盖 Key、计费、各类 API、Codex 和 Claude Code；支持工单由运营 TokensBeat 的人回复。" },
  },
  build: {
    en: {
      title: "Build your product on TokensBeat: early access",
      description:
        "A Postgres backend and an agent runtime in early access, for our own apps first; self-serve projects with model budgets are coming.",
    },
    zh: { title: "在 TokensBeat 上做你的产品：抢先体验", description: "Postgres 后端和 Agent 运行时处于抢先体验阶段，先给我们自己的应用用；带模型预算的自助项目即将推出。" },
  },
  status: {
    en: {
      title: "Status: website, API and Aha | TokensBeat",
      description: "Whether the TokensBeat website, API gateway and Aha are up right now, from their public health checks. No model names or prices.",
    },
    zh: { title: "状态：网站、API 与 Aha | TokensBeat", description: "根据公开的健康检查，查看 TokensBeat 网站、API 网关和 Aha 是否正常。不显示模型名称和价格。" },
  },
  start: {
    en: {
      title: "Get started: the console or Aha | TokensBeat",
      description:
        "Open the TokensBeat console for API keys, top-ups, usage, the Service Plaza and invoices, or launch Aha, the AI agent app. One account works for both.",
    },
    zh: {
      title: "开始使用：控制台或 Aha | TokensBeat",
      description: "打开 TokensBeat 控制台，管理 API Key、充值、用量、服务广场和发票；或者启动 AI Agent 应用 Aha。两边用同一个账户。",
    },
  },
};
