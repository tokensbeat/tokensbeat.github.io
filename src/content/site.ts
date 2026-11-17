/**
 * The site's map, as tokensbeat.com's earlier Vue site (v4) had it: its twelve pages and /start/, how the head's
 * Platform menu groups them, and the status label every product claim carries; plus the facts and code the pages
 * print. Words live in ./copy.ts.
 *   live    open to everyone today
 *   beta    open with limits (invite only, limited preview)
 *   early   built and tested; open to our own apps first, to other builders later
 *   coming  planned, not built
 *
 * Addresses: each page is a folder, /<slug>/ in English and /zh/<slug>/ in Chinese (the homepage / and /zh/), each
 * prerendered (scripts/prerender.mjs). v4's /ai-models is /ai-models/ here; the docs and the legal documents are pages
 * of this site too (./routes.ts).
 */
import type { Lang } from "@/i18n";

export type SiteStatus = "live" | "beta" | "early" | "coming";
export const STATUSES: readonly SiteStatus[] = ["live", "beta", "early", "coming"];

export type PageId = "home" | "database" | "storage" | "models" | "agents" | "workspace" | "aha" | "supabase" | "pricing" | "help" | "build" | "status" | "start";

export interface SitePage {
  id: PageId;
  /** The folder: "" for the homepage. */
  slug: string;
  /** Serve: what runs your app in production. Support: what helps you while you build. */
  group: "serve" | "support" | "company";
  status?: SiteStatus;
}

export const SITE_PAGES: readonly SitePage[] = [
  { id: "home", slug: "", group: "company" },
  { id: "database", slug: "database", group: "serve", status: "early" },
  { id: "storage", slug: "storage", group: "serve", status: "early" },
  { id: "models", slug: "ai-models", group: "serve", status: "live" },
  { id: "agents", slug: "agents", group: "serve", status: "early" },
  { id: "aha", slug: "aha", group: "serve", status: "live" },
  { id: "workspace", slug: "workspace", group: "support", status: "beta" },
  { id: "supabase", slug: "supabase", group: "support" },
  { id: "help", slug: "help", group: "support" },
  { id: "build", slug: "build", group: "support" },
  { id: "status", slug: "status", group: "support" },
  { id: "pricing", slug: "pricing", group: "company" },
  // Get started: the head's go button; the visitor chooses the console or Aha.
  { id: "start", slug: "start", group: "company" },
];

const byId = new Map(SITE_PAGES.map((p) => [p.id, p]));

export function sitePage(id: PageId): SitePage {
  const page = byId.get(id);
  if (!page) throw new Error(`unknown site page ${id}`);
  return page;
}

/** The Platform menu, in order: Serve first (the product), then Support. */
export const NAV_SERVE: readonly PageId[] = ["database", "storage", "models", "agents", "aha"];
export const NAV_SUPPORT: readonly PageId[] = ["workspace", "supabase", "help", "status", "build"];

/** A page's address in a language: /, /zh/, /database/, /zh/database/. */
export function pagePath(id: PageId, lang: Lang): string {
  const slug = sitePage(id).slug;
  return `/${lang === "zh" ? "zh/" : ""}${slug ? `${slug}/` : ""}`;
}

/** The page an address shows (the language is langOfPath's); null for an address with no page. */
export function pageOfPath(pathname: string): PageId | null {
  const rest = pathname.replace(/^\/zh(?=\/|$)/, "").replace(/^\/+|\/+$/g, "");
  return SITE_PAGES.find((p) => p.slug === rest)?.id ?? null;
}

/** The docs guides the help page lists, by their slug (/docs/<id>/: ./routes.ts DOC_SLUGS). */
export const HELP_GUIDES = [
  { id: "quickstart", group: "start" },
  { id: "api-keys", group: "start" },
  { id: "billing", group: "start" },
  { id: "usage", group: "start" },
  { id: "models", group: "api" },
  { id: "chat-completions", group: "api" },
  { id: "responses", group: "api" },
  { id: "images", group: "api" },
  { id: "sdks", group: "api" },
  { id: "codex", group: "tools" },
  { id: "claude-code", group: "tools" },
  { id: "compatible-apps", group: "tools" },
  { id: "agent", group: "tools" },
  { id: "errors", group: "fix" },
  { id: "troubleshooting", group: "fix" },
] as const;

/**
 * The API styles the gateway serves that a public route answers today, by their path under the base URL (v4's
 * SiteModelsView). /v1/embeddings exists as a route, but no public group offers an embedding model.
 */
export const API_STYLES = [
  { id: "chat", path: "/v1/chat/completions" },
  { id: "responses", path: "/v1/responses" },
  { id: "messages", path: "/v1/messages" },
  { id: "gemini", path: "/v1beta/models" },
  { id: "images", path: "/v1/images/generations" },
] as const;

/** Code shown on the pages (v4's SITE_CODE). Endpoint paths are the project's real paths; the host is a placeholder. */
export const SITE_CODE = {
  projectPaths: [
    { path: "/rest/v1", label: "PostgREST" },
    { path: "/auth/v1", label: "GoTrue" },
    { path: "/storage/v1", label: "Storage" },
    { path: "/realtime/v1", label: "Realtime" },
  ],
  projectEndpoints: `PROJECT_URL/rest/v1       PostgREST
PROJECT_URL/auth/v1       GoTrue
PROJECT_URL/storage/v1    Storage
PROJECT_URL/realtime/v1   Realtime`,
  restCurl: `curl "$PROJECT_URL/rest/v1/notes?select=id,title&done=eq.false" \\
  -H "apikey: $ANON_KEY" \\
  -H "Authorization: Bearer $USER_TOKEN"`,
  storageCurl: `# Upload a file into a private bucket
curl -X POST "$PROJECT_URL/storage/v1/object/avatars/u1.png" \\
  -H "apikey: $ANON_KEY" \\
  -H "Authorization: Bearer $USER_TOKEN" \\
  -H "Content-Type: image/png" \\
  --data-binary "@u1.png"

# Listen for database changes
wss://PROJECT_HOST/realtime/v1/websocket?apikey=$ANON_KEY`,
  workspaceTerminal: `$ ssh aha-workspace
workspace:~$ claude        # Claude Code
workspace:~$ codex         # Codex
workspace:~$ claude mcp add opera -- \\
    npx -y @playwright/mcp@latest \\
    --cdp-endpoint http://127.0.0.1:9222`,
  supabaseClient: `import { createClient } from '@supabase/supabase-js'

const db = createClient(PROJECT_URL, ANON_KEY)

const { data } = await db
  .from('notes')
  .select('id, title')
  .eq('done', false)`,
  agentRun: `{
  "assistant": {
    "name": "Ada",
    "operator": "Your company",
    "instructions": "Answer questions about orders."
  },
  "tools": [{
    "name": "find_order",
    "description": "Look up an order by its number",
    "parameters": {
      "type": "object",
      "properties": { "number": { "type": "string" } }
    },
    "effect": "read",
    "transport": {
      "kind": "http", "endpoint": "api", "path": "orders"
    },
    "approval": "none"
  }]
}`,
} as const;

/**
 * The AI models page's code examples (v4's EndpointSnippets), with the notes under each.
 * The Codex provider's display name is written TokensBeat.
 */
export const ENDPOINT_SNIPPETS = [
  {
    id: "codex",
    label: "Codex",
    file: "~/.codex/config.toml",
    note: "Merge this into your Codex config. A Best price key works, or a key pinned to an OpenAI route.",
    code: `model = "gpt-5.6-sol"
model_provider = "tokensbeat"

[model_providers.tokensbeat]
name = "TokensBeat"
base_url = "https://api.tokensbeat.com/v1"
wire_api = "responses"
env_key = "TOKENSBEAT_API_KEY"
requires_openai_auth = false
supports_websockets = false`,
  },
  {
    id: "curl",
    label: "cURL",
    file: "Terminal",
    note: "Set TOKENSBEAT_API_KEY in your shell first.",
    code: `curl https://api.tokensbeat.com/v1/chat/completions \\
  -H "Authorization: Bearer $TOKENSBEAT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen3.8",
    "messages": [{"role": "user", "content": "Reply with OK only."}],
    "max_tokens": 128,
    "chat_template_kwargs": {"enable_thinking": false}
  }'`,
  },
  {
    id: "python",
    label: "Python",
    file: "main.py",
    note: "Install the SDK with python -m pip install openai.",
    code: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["TOKENSBEAT_API_KEY"],
    base_url="https://api.tokensbeat.com/v1",
)

reply = client.chat.completions.create(
    model="qwen3.8",
    messages=[{"role": "user", "content": "Reply with OK only."}],
    max_tokens=128,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}},
)
print(reply.choices[0].message.content)
print(reply.usage)`,
  },
  {
    id: "node",
    label: "Node.js",
    file: "example.mjs",
    note: "Install the SDK with npm install openai.",
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.TOKENSBEAT_API_KEY,
  baseURL: "https://api.tokensbeat.com/v1",
});

const reply = await client.chat.completions.create({
  model: "qwen3.8",
  messages: [{ role: "user", content: "Reply with OK only." }],
  max_tokens: 128,
  chat_template_kwargs: { enable_thinking: false },
});
console.log(reply.choices[0].message.content);
console.log(reply.usage);`,
  },
] as const;
