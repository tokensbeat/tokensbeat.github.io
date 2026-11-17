/**
 * The docs (tokensbeat.com/docs), ported from the Vue site's docs on 2026-11-02 with its words
 * unchanged but the brand, written TokensBeat, and where the account lives: tokensbeat.com is this site, so signing in
 * is at console.tokensbeat.com (two sentences, each with a console link beside it); this file is now where they are
 * kept. The articles' facts are as that
 * file dated them:
 *   Examples use public model IDs and customer keys, never upstream credentials. Catalogue facts (key plans, public
 *   routes and their models, payment limits) reflect production on October 28-29, 2026. Prices are not written here:
 *   the Service Plaza (Models) shows them. Update these facts together with the live groups and the checkout settings.
 * A link's href is an address of the old site: /docs/<slug> and /legal/<id> are pages here (in the reader's language),
 * the account pages (/keys, /purchase, /plaza/models…) the console's (src/docs/links.ts).
 *
 * Loaded by the pages that show it only (src/main.tsx imports this module before it hydrates a content page; the
 * prerender imports it directly), so the homepage's script does not carry the docs.
 */
export type DocText = { en: string; zh: string }
const l = (en: string, zh: string): DocText => ({ en, zh })
export type DocBlock =
  | { type: 'text' | 'note'; text: DocText }
  | { type: 'steps' | 'list'; items: DocText[] }
  | { type: 'code'; label: string; code: string }
  | { type: 'table'; headings: DocText[]; rows: DocText[][] }
  | { type: 'links'; items: { label: DocText; href: string }[] }
export interface DocSection { id: string; title: DocText; blocks: DocBlock[] }
export interface DocArticle { slug: string; group: string; title: DocText; description: DocText; sections: DocSection[] }

export const DOCS_UI = {
  title: l('Documentation', '使用文档'),
  search: l('Search documentation', '搜索文档'),
  noResults: l('No matching guides. Try “API”, “Codex”, “images”, or “billing”.', '未找到相关指南，试试「API」「Codex」「图片」或「计费」。'),
  navigation: l('Browse guides', '浏览指南'),
  onThisPage: l('On this page', '本页内容'),
  previous: l('Previous', '上一篇'),
  next: l('Next', '下一篇'),
  copy: l('Copy', '复制'),
  copied: l('Copied', '已复制'),
  copyFailed: l('Select the code and copy it manually.', '请选中代码并手动复制。'),
  notFound: l('Guide not found', '未找到文档'),
  notFoundBody: l('Choose a guide from the sidebar or return to the quickstart.', '请从侧栏选择指南，或返回快速开始。'),
  quickstart: l('Start building', '快速开始'),
  keys: l('Get an API key', '获取 API 密钥'),
  home: l('Home', '主页'),
}
export const DOC_GROUPS = [
  { id: 'start', title: l('Get started', '快速开始') },
  { id: 'cli', title: l('Coding tools', '编程工具') },
  { id: 'agent', title: l('Aha', 'Aha') },
  { id: 'api', title: l('API guides', 'API 接入') },
  { id: 'help', title: l('Help', '帮助') },
]

const bashKey = `export TOKENSBEAT_API_KEY='YOUR_TOKENSBEAT_API_KEY'`
const powershellKey = `$env:TOKENSBEAT_API_KEY = 'YOUR_TOKENSBEAT_API_KEY'`
const models = String.raw`curl https://api.tokensbeat.com/v1/models \
  -H "Authorization: Bearer $TOKENSBEAT_API_KEY"`
const chat = String.raw`curl https://api.tokensbeat.com/v1/chat/completions \
  -H "Authorization: Bearer $TOKENSBEAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.8",
    "messages": [{"role": "user", "content": "Reply with OK only."}],
    "max_tokens": 128,
    "chat_template_kwargs": {"enable_thinking": false}
  }'`
const gptChatBody = '{\n  "model": "gpt-5.6-sol",\n  "messages": [\n    {"role": "system", "content": "Answer in one sentence."},\n    {"role": "user", "content": "What is a rate limit?"}\n  ]\n}'
const responses = String.raw`curl -N https://api.tokensbeat.com/v1/responses \
  -H "Authorization: Bearer $TOKENSBEAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.6-sol",
    "input": "Reply with OK only.",
    "stream": true,
    "store": false
  }'`
const usage = String.raw`curl "https://api.tokensbeat.com/v1/usage?days=7" \
  -H "Authorization: Bearer $TOKENSBEAT_API_KEY"`
const imageGenerate = String.raw`curl https://api.tokensbeat.com/v1/images/generations \
  -H "Authorization: Bearer $TOKENSBEAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "A watercolor lighthouse at dawn",
    "size": "1024x1024",
    "n": 1
  }' | jq -r '.data[0].b64_json' | base64 --decode > lighthouse.png`
const imageEdit = String.raw`curl https://api.tokensbeat.com/v1/images/edits \
  -H "Authorization: Bearer $TOKENSBEAT_API_KEY" \
  -F model=gpt-image-2 \
  -F image=@lighthouse.png \
  -F prompt="Add a small red boat in the foreground" \
  | jq -r '.data[0].b64_json' | base64 --decode > lighthouse-boat.png`
const pythonQwen = 'import os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ["TOKENSBEAT_API_KEY"],\n    base_url="https://api.tokensbeat.com/v1",\n)\n\nreply = client.chat.completions.create(\n    model="qwen3.8",\n    messages=[{"role": "user", "content": "Reply with OK only."}],\n    max_tokens=128,\n    extra_body={"chat_template_kwargs": {"enable_thinking": False}},\n)\nprint(reply.choices[0].message.content)\nprint(reply.usage)'
const pythonResponses = 'import os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ["TOKENSBEAT_API_KEY"],\n    base_url="https://api.tokensbeat.com/v1",\n)\n\nresponse = client.responses.create(\n    model="gpt-5.6-sol",\n    input="Reply with OK only.",\n    store=False,\n)\nprint(response.output_text)\nprint(response.usage)'
const nodeQwen = 'import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: process.env.TOKENSBEAT_API_KEY,\n  baseURL: "https://api.tokensbeat.com/v1",\n});\n\nconst reply = await client.chat.completions.create({\n  model: "qwen3.8",\n  messages: [{ role: "user", content: "Reply with OK only." }],\n  max_tokens: 128,\n  chat_template_kwargs: { enable_thinking: false },\n});\nconsole.log(reply.choices[0].message.content);\nconsole.log(reply.usage);'
const codexConfig = 'model = "gpt-5.6-sol"\nmodel_provider = "tokensbeat"\n\n[model_providers.tokensbeat]\nname = "TokensBeat"\nbase_url = "https://api.tokensbeat.com/v1"\nwire_api = "responses"\nenv_key = "TOKENSBEAT_API_KEY"\nrequires_openai_auth = false\nsupports_websockets = false'
// A key that reaches Claude models (the Anthropic family): the base URL and the key are enough.
const claudeCodeClaudeBash = `export ANTHROPIC_BASE_URL="https://api.tokensbeat.com"
export ANTHROPIC_AUTH_TOKEN="YOUR_TOKENSBEAT_API_KEY"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`
// A key pinned to the Qwen route: every model Claude Code asks for is mapped to qwen3.8.
const claudeCodeBash = `export ANTHROPIC_BASE_URL="https://api.tokensbeat.com"
export ANTHROPIC_AUTH_TOKEN="YOUR_TOKENSBEAT_API_KEY"
export ANTHROPIC_MODEL="qwen3.8"
export ANTHROPIC_DEFAULT_OPUS_MODEL="qwen3.8"
export ANTHROPIC_DEFAULT_SONNET_MODEL="qwen3.8"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="qwen3.8"
export ANTHROPIC_DEFAULT_FABLE_MODEL="qwen3.8"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`
const claudeCodePowershell = `$env:ANTHROPIC_BASE_URL = "https://api.tokensbeat.com"
$env:ANTHROPIC_AUTH_TOKEN = "YOUR_TOKENSBEAT_API_KEY"
$env:ANTHROPIC_MODEL = "qwen3.8"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "qwen3.8"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "qwen3.8"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "qwen3.8"
$env:ANTHROPIC_DEFAULT_FABLE_MODEL = "qwen3.8"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"`
const claudeCodeSettings = `{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.tokensbeat.com",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_TOKENSBEAT_API_KEY",
    "ANTHROPIC_MODEL": "qwen3.8",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "qwen3.8",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "qwen3.8",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "qwen3.8",
    "ANTHROPIC_DEFAULT_FABLE_MODEL": "qwen3.8",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}`
const keyLinks: DocBlock = { type: 'links', items: [
  { label: l('Open API keys', '打开 API 密钥'), href: '/keys' },
  { label: l('View usage', '查看使用记录'), href: '/usage' },
] }

export const DOC_ARTICLES: DocArticle[] = [
  {
    slug: 'quickstart', group: 'start', title: l('Quickstart', '快速开始'),
    description: l('From sign-in to your first response in a few minutes.', '几分钟内完成登录、充值并获得第一个响应。'),
    sections: [
      { id: 'connect', title: l('One endpoint for your applications', '统一的 API 地址'), blocks: [
        { type: 'text', text: l('TokensBeat gives you prepaid, usage-based access to models from Anthropic (Claude), OpenAI (GPT), Google (Gemini) and open-weight labs such as Qwen, through one API key. One account and one balance cover the API, coding tools such as Codex and Claude Code, and Aha.', 'TokensBeat 通过一个 API 密钥，按用量从预付余额中扣费，提供 Anthropic（Claude）、OpenAI（GPT）、Google（Gemini）以及 Qwen 等开放权重厂商的模型。同一个账户和余额可用于 API、Codex 与 Claude Code 等编程工具，以及 Aha。') },
        { type: 'code', label: 'Base URL', code: 'https://api.tokensbeat.com/v1' },
      ] },
      { id: 'prepare', title: l('Set up your account', '准备账户'), blocks: [
        { type: 'steps', items: [
          l('Sign in at console.tokensbeat.com with your email, GitHub, Google, or X account. Your email address must be verified.', '在 console.tokensbeat.com 使用邮箱、GitHub、Google 或 X 账号登录。邮箱需完成验证。'),
          l('Add credit. New accounts start with a $0 balance, and requests are refused until the balance is positive. Open Top up, choose an amount, and pay by card or stablecoin.', '充值余额。新账户初始余额为 $0，余额为正数前请求会被拒绝。打开「充值」，选择金额，使用银行卡或稳定币支付。'),
          l('Open API Keys. In the Simple view, Get my key makes one key on the Best price plan, with a spending cap of $20 per 30 days that you can change. Copy the key and store it somewhere safe.', '打开「API 密钥」。在简易视图中点击「获取我的 Key」，会创建一个「最优价格」方案的密钥，每 30 天消费上限 $20，可随时修改。复制密钥并妥善保存。'),
        ] },
        { type: 'links', items: [
          { label: l('Sign in', '登录'), href: '/login' },
          { label: l('Top up', '充值'), href: '/purchase' },
          { label: l('Open API keys', '打开 API 密钥'), href: '/keys' },
          { label: l('Credits and payments', '余额与支付'), href: '/docs/billing' },
        ] },
      ] },
      { id: 'first-request', title: l('Send a request', '发送第一个请求'), blocks: [
        { type: 'text', text: l('In a Bash terminal, replace the placeholder with your TokensBeat API key, then run the request below. Keep the key on your server or local machine.', '在 Bash 终端中，将占位符替换为你的 TokensBeat API 密钥，然后执行下面的请求。密钥应保存在服务端或本地环境中。') },
        { type: 'code', label: 'Bash · environment', code: bashKey },
        { type: 'code', label: 'cURL · qwen3.8', code: chat },
        { type: 'text', text: l('Read the answer from choices[0].message.content. The usage object contains the token counts, and the request appears on the Usage page with its cost.', '回答位于 choices[0].message.content，usage 对象包含 token 数量。该请求及其费用会出现在「使用记录」页面。') },
        { type: 'links', items: [{ label: l('Windows and WSL instructions', 'Windows 与 WSL 配置'), href: '/docs/windows-wsl' }, { label: l('Choose a model', '选择模型'), href: '/docs/models' }] },
      ] },
      { id: 'next', title: l('Where to go next', '下一步'), blocks: [
        { type: 'list', items: [
          l('Code in your terminal: connect Codex (GPT models) or Claude Code (Claude models, or qwen3.8 with a key pinned to the Qwen route) with your key.', '在终端中编程：用你的密钥接入 Codex（GPT 模型）或 Claude Code（Claude 模型；固定在 Qwen 线路上的密钥则使用 qwen3.8）。'),
          l('Build an app: use the Chat Completions or Responses API, or the OpenAI SDKs for Python and JavaScript.', '开发应用：使用 Chat Completions 或 Responses API，或 Python 与 JavaScript 的 OpenAI SDK。'),
          l('Work in the browser: open Aha for chat, research, images, and video.', '在浏览器中工作：打开 Aha，进行对话、研究、生成图片与视频。'),
        ] },
        { type: 'links', items: [
          { label: l('Codex', 'Codex'), href: '/docs/codex' },
          { label: l('Claude Code', 'Claude Code'), href: '/docs/claude-code' },
          { label: l('Aha', 'Aha'), href: '/docs/agent' },
        ] },
      ] },
    ],
  },
  {
    slug: 'account', group: 'start', title: l('Account and sign-in', '账户与登录'),
    description: l('Sign in, find your way around the console, and manage your profile.', '登录、熟悉控制台并管理个人资料。'),
    sections: [
      { id: 'sign-in', title: l('Sign in', '登录'), blocks: [
        { type: 'text', text: l('TokensBeat sign-in is provided by Clerk. On the sign-in page you can continue with GitHub, Google, or X, or enter your email address or username. Signing up works the same way from the Sign up link.', 'TokensBeat 使用 Clerk 提供登录服务。在登录页可以使用 GitHub、Google 或 X 继续，也可以输入邮箱或用户名。通过「注册」链接注册的流程相同。') },
        { type: 'list', items: [
          l('Your email address must be verified before the console opens. If you see a verification error, finish the email verification in the sign-in window and try again.', '邮箱验证后才能进入控制台。如提示需要验证，请在登录窗口完成邮箱验证后重试。'),
          l('If you sign in with a provider that uses the same verified email as an existing TokensBeat account, you reach that same account, with its balance and keys.', '如果使用的登录方式与已有 TokensBeat 账户的已验证邮箱相同，会进入同一个账户，余额和密钥均保留。'),
          l('One browser holds one signed-in account. Signing in to another account replaces the session in every tab, so pages opened for the previous account, such as a pending payment, will report that you have no permission.', '同一浏览器同时只能登录一个账户。登录另一个账户会替换所有标签页的会话，为原账户打开的页面（例如待支付订单）会提示无权限。'),
        ] },
      ] },
      { id: 'new-account', title: l('What a new account includes', '新账户的初始状态'), blocks: [
        { type: 'table', headings: [l('Setting', '项目'), l('Default', '默认值')], rows: [
          [l('Balance', '余额'), l('$0. Top up before your first request.', '$0。首次调用前请先充值。')],
          [l('Concurrent requests', '并发请求数'), l('5 at a time, shared by all your keys', '同时 5 个，所有密钥共享')],
          [l('Model access', '模型权限'), l('Every public route: Anthropic, OpenAI, Google, open-weight and image models. Private routes, such as voice, on request.', '所有公开线路：Anthropic、OpenAI、Google、开放权重与图片模型。私有线路（如语音）需申请。')],
        ] },
      ] },
      { id: 'console', title: l('The console', '控制台'), blocks: [
        { type: 'table', headings: [l('Page', '页面'), l('Use it to', '用途')], rows: [
          [l('Dashboard', '仪表盘'), l('See your balance, today’s requests and spend, token totals, and recent activity.', '查看余额、今日请求与消费、token 总量和最近的调用。')],
          [l('API Keys', 'API 密钥'), l('Create, restrict, and copy keys, and get ready-made client configuration.', '创建、限制和复制密钥，并获取现成的客户端配置。')],
          [l('Service Plaza', '服务广场'), l('Compare live model status and current prices, and see private sessions and workspaces.', '查看模型的实时状态与当前价格，以及私有会话与云工作区。')],
          [l('Usage', '使用记录'), l('Inspect every request and export it as CSV.', '查看每次请求，并导出为 CSV。')],
          [l('Top up and Orders', '充值与订单'), l('Add credit and follow your payments.', '充值并跟踪支付订单。')],
          [l('Redeem', '兑换'), l('Apply a redeem code.', '使用兑换码。')],
          [l('Profile', '个人资料'), l('Change your username and avatar and manage sign-in security.', '修改用户名和头像，管理登录安全设置。')],
        ] },
        { type: 'text', text: l('The header shows your available balance and lets you switch between English and 中文 and between light and dark themes. The Aha link in the sidebar opens the agent workspace.', '页面顶部显示可用余额，并可在 English 与中文、浅色与深色主题之间切换。侧栏中的 Aha 链接会打开智能体工作区。') },
      ] },
      { id: 'profile', title: l('Profile and security', '个人资料与安全'), blocks: [
        { type: 'text', text: l('Profile shows your role, account status, balance, concurrency limit, and member-since date. You can change your username and avatar there. Email address, password, and two-step verification are managed through Manage account, which opens your Clerk account settings.', '「个人资料」显示角色、账户状态、余额、并发上限和注册日期，并可修改用户名和头像。邮箱、密码和两步验证可通过「管理账户」在 Clerk 账户设置中管理。') },
        { type: 'links', items: [{ label: l('Open profile', '打开个人资料'), href: '/profile' }] },
      ] },
    ],
  },
  {
    slug: 'api-keys', group: 'start', title: l('API keys', 'API 密钥管理'),
    description: l('Create credentials for each app and control how they are used.', '为不同应用创建密钥，并控制使用范围。'),
    sections: [
      { id: 'create', title: l('Create a key', '创建密钥'), blocks: [
        { type: 'steps', items: [
          l('Sign in and open API Keys. The Simple view makes one Best price key in one click; for every option, switch to the Pro view and choose Create.', '登录后打开「API 密钥」。简易视图可一键创建一个「最优价格」密钥；如需全部选项，请切换到专业视图并点击「创建」。'),
          l('Enter a name you will recognize, such as the app or machine that will use the key.', '填写便于识别的名称，例如使用该密钥的应用或设备。'),
          l('Choose a plan, or pin the key to one route. Best price reaches every model of the plan and takes a discount route wherever one exists; Official only uses official routes only; a pinned key reaches one route’s models at that route’s rate.', '选择一个方案，或将密钥固定在一条线路上。「最优价格」可调用方案内的所有模型，有折扣线路时优先使用；「仅官方」只使用官方线路；固定线路的密钥只能调用该线路的模型，并按该线路的倍率计费。'),
          l('Optionally set a quota, spending windows, an expiry date, and IP restrictions. You can change all of them later.', '可选设置额度、消费周期限额、有效期和 IP 限制，之后均可修改。'),
          l('Save and copy the key. Generated keys start with sk-. The list shows only the first and last characters; the Copy button copies the full key.', '保存并复制密钥。系统生成的密钥以 sk- 开头。列表只显示首尾字符，「复制」按钮会复制完整密钥。'),
        ] },
        { type: 'text', text: l('You can also supply your own key value when creating a key: at least 16 characters using letters, digits, underscores, or hyphens.', '创建时也可以自定义密钥值：至少 16 个字符，可使用字母、数字、下划线和连字符。') },
        keyLinks,
      ] },
      { id: 'settings', title: l('Key settings', '密钥设置'), blocks: [
        { type: 'table', headings: [l('Setting', '设置'), l('What it does', '作用'), l('When it blocks a request', '拦截时的响应')], rows: [
          [l('Plan or route', '方案或线路'), l('A plan (Best price or Official only) reaches every model of its routes, and the gateway picks the route for each request. A pinned key uses one route (group) and its price multiplier. You can change either later.', '方案（「最优价格」或「仅官方」）可调用其线路中的所有模型，网关为每个请求选择线路。固定线路的密钥只使用一条线路（分组）及其价格倍率。之后均可更改。'), l('404 MODEL_NOT_IN_PLAN for a model outside the plan; 404 model_not_found for a model outside a pinned route', '调用方案外的模型返回 404 MODEL_NOT_IN_PLAN；调用固定线路外的模型返回 404 model_not_found')],
          [l('Quota (USD)', '额度（美元）'), l('Total spending allowed for this key. 0 means unlimited. Reset it from the edit form.', '该密钥累计可消费的金额，0 表示不限。可在编辑表单中重置。'), l('429 API_KEY_QUOTA_EXHAUSTED', '429 API_KEY_QUOTA_EXHAUSTED')],
          [l('Spending windows (USD)', '周期限额（美元）'), l('Caps for 5 hours, 1 day, 7 days and 30 days. Each window starts with the first spend after the previous window ended. 0 means unlimited. A key made in the Simple view starts with $20 per 30 days.', '5 小时、1 天、7 天和 30 天的消费上限。每个周期从上一周期结束后的首次消费开始计算，0 表示不限。简易视图创建的密钥默认每 30 天 $20。'), l('429 rate_limit_exceeded until the window ends', '周期结束前返回 429 rate_limit_exceeded')],
          [l('Expiry', '有效期'), l('Choose 7, 30, or 90 days, or a custom date and time.', '可选 7、30、90 天或自定义日期时间。'), l('403 API_KEY_EXPIRED', '403 API_KEY_EXPIRED')],
          [l('IP allowlist and blocklist', 'IP 白名单与黑名单'), l('One IP address or CIDR range per line.', '每行一个 IP 地址或 CIDR 网段。'), l('403 ACCESS_DENIED', '403 ACCESS_DENIED')],
          [l('Status', '状态'), l('Turn a key off without deleting it.', '停用密钥而不删除。'), l('401 API_KEY_DISABLED', '401 API_KEY_DISABLED')],
        ] },
        { type: 'note', text: l('Quotas and windows limit spending; they do not add funds. Every key draws on your account balance, and requests are refused once the balance reaches zero.', '额度与周期限额只用于限制消费，不会增加余额。所有密钥都从账户余额中扣费，余额归零后请求会被拒绝。') },
      ] },
      { id: 'authentication', title: l('Authenticate requests', '请求认证'), blocks: [
        { type: 'code', label: 'HTTP header', code: 'Authorization: Bearer YOUR_TOKENSBEAT_API_KEY' },
        { type: 'text', text: l('The gateway also accepts the key in an x-api-key or x-goog-api-key header, which some clients use. Never put a key in the URL: requests with ?key= or ?api_key= are rejected with 400. Website sign-in sessions and upstream provider keys are not API credentials.', '网关也接受 x-api-key 或 x-goog-api-key 请求头，部分客户端会使用这两种方式。不要把密钥放在 URL 中：带有 ?key= 或 ?api_key= 的请求会返回 400。网站登录会话和上游服务商密钥不能作为 API 凭证。') },
      ] },
      { id: 'use-key', title: l('Ready-made client configuration', '现成的客户端配置'), blocks: [
        { type: 'list', items: [
          l('Use key opens copy-ready setup for the clients that fit the key’s plan or route, such as Codex, Claude Code, and OpenCode, with tabs for macOS/Linux, Command Prompt, and PowerShell. Check it works sends one short, billed test request.', '「使用密钥」会针对该方案或线路适用的客户端（如 Codex、Claude Code、OpenCode）给出可直接复制的配置，并提供 macOS/Linux、命令提示符和 PowerShell 选项卡。「检查是否可用」会发送一次简短的计费测试请求。'),
          l('Import to CC-Switch adds the key to CC-Switch with one click.', '「导入 CC-Switch」可一键将密钥添加到 CC-Switch。'),
          l('Select several keys to change their group, status, quota, limits, expiry, or IP lists together.', '勾选多个密钥后，可批量修改分组、状态、额度、限额、有效期或 IP 名单。'),
        ] },
        { type: 'note', text: l('Always use a model your key can call. If a generated configuration names a model that GET /v1/models does not list for your key, change it to one that does.', '请确保使用密钥可调用的模型。如果生成的配置中的模型不在该密钥的 GET /v1/models 列表中，请改为列表中的模型。') },
      ] },
      { id: 'security', title: l('Keep keys safe', '密钥安全'), blocks: [
        { type: 'list', items: [
          l('Use a separate key for each app or machine, so you can turn one off without affecting the others.', '每个应用或设备使用独立密钥，停用其中一个不会影响其他。'),
          l('Give shared or experimental keys a quota or spending windows to cap what they can spend.', '为共享或试验用的密钥设置额度或周期限额，限制可能产生的费用。'),
          l('If a key is exposed, disable or delete it at once and create a replacement.', '密钥泄露后，立即停用或删除，并创建新的密钥。'),
          l('Keep keys out of public repositories, screenshots, and browser code.', '不要把密钥放进公开仓库、截图或浏览器端代码。'),
          l('Aha creates keys named agent-ui, agent-ui-search, agent-ui-image, and agent-ui-video for its own use. Leave them in place; they are recreated if deleted.', 'Aha 会创建名为 agent-ui、agent-ui-search、agent-ui-image 和 agent-ui-video 的密钥供自身使用，请保留它们，删除后会自动重新创建。'),
        ] },
      ] },
    ],
  },
  {
    slug: 'models', group: 'start', title: l('Models and pricing', '模型与价格'),
    description: l('Plans, routes and model IDs, and how each request is priced.', '方案、线路与模型 ID，以及每次请求如何计价。'),
    sections: [
      { id: 'groups', title: l('Plans, routes and model IDs', '方案、线路与模型 ID'), blocks: [
        { type: 'text', text: l('A key either carries a plan or is pinned to one route (a group). A plan key reaches every model of its routes, and the gateway picks the route for each request. These routes are open to every account:', '密钥要么使用一个方案，要么固定在一条线路（分组）上。方案密钥可调用其所有线路中的模型，网关为每个请求选择线路。以下线路对所有账户开放：') },
        { type: 'table', headings: [l('Route', '线路'), l('Family', '系列'), l('Models', '模型'), l('Plans', '方案')], rows: [
          [l('Claude · Discount', 'Claude · Discount'), l('Anthropic', 'Anthropic'), l('Claude models', 'Claude 系列模型'), l('Best price', '最优价格')],
          [l('OpenAI · Discount', 'OpenAI · Discount'), l('OpenAI', 'OpenAI'), l('gpt-6.1-sol, gpt-6.1-terra, gpt-6-astra, gpt-5.6-sol', 'gpt-6.1-sol、gpt-6.1-terra、gpt-6-astra、gpt-5.6-sol'), l('Best price', '最优价格')],
          [l('Google · Official', 'Google · Official'), l('Google', 'Google'), l('gemini-3.8-flash', 'gemini-3.8-flash'), l('Best price, Official only', '最优价格、仅官方')],
          [l('Qwen', 'Qwen'), l('Open weight', '开放权重'), l('qwen3.8', 'qwen3.8'), l('Best price, Official only', '最优价格、仅官方')],
          [l('DeepSeek · Discount, GLM · Discount, Kimi · Discount', 'DeepSeek · Discount、GLM · Discount、Kimi · Discount'), l('Open weight', '开放权重'), l('DeepSeek, GLM and Kimi models', 'DeepSeek、GLM 与 Kimi 系列模型'), l('Best price', '最优价格')],
          [l('Grok · Discount', 'Grok · Discount'), l('xAI', 'xAI'), l('Grok models', 'Grok 系列模型'), l('Best price', '最优价格')],
          [l('Draw', 'Draw'), l('Images', '图片'), l('gpt-image-2, gemini-3.1-flash-image, gemini-3-pro-image-preview', 'gpt-image-2、gemini-3.1-flash-image、gemini-3-pro-image-preview'), l('Best price', '最优价格')],
        ] },
        { type: 'list', items: [
          l('Discount routes are priced below the official price and are served through trusted third parties. Best price uses them wherever they exist.', '折扣线路的价格低于官方价格，由受信任的第三方提供。「最优价格」会在有折扣线路时优先使用。'),
          l('Official only uses official routes only. There is no official Claude or OpenAI route at the moment, so an Official only key reaches the Google and Qwen models.', '「仅官方」只使用官方线路。目前没有 Claude 或 OpenAI 的官方线路，因此「仅官方」密钥可调用 Google 与 Qwen 模型。'),
          l('Use each model in the API style of its family: GPT models with Responses or Chat Completions, Claude models with Anthropic Messages, Gemini with the Gemini API, qwen3.8 with Chat Completions, image models with the Images API.', '请按模型系列使用对应的 API：GPT 模型使用 Responses 或 Chat Completions，Claude 模型使用 Anthropic Messages，Gemini 使用 Gemini API，qwen3.8 使用 Chat Completions，图片模型使用 Images API。'),
          l('Private routes, such as voice, are listed in Service Plaza with Request access.', '私有线路（如语音）在服务广场中列出，可点击「申请访问」。'),
        ] },
        { type: 'note', text: l('Availability can change. The list your own key returns from GET /v1/models is authoritative. A key pinned to one route cannot call models of another route.', '模型供应可能变化，请以你的密钥调用 GET /v1/models 返回的列表为准。固定在一条线路上的密钥不能调用其他线路的模型。') },
      ] },
      { id: 'discovery', title: l('List models for your key', '查询密钥可用的模型'), blocks: [
        { type: 'code', label: 'cURL · Bash', code: models },
        { type: 'text', text: l('Use an exact id from data as the model field. GET /v1/models/{id} returns one model, or 404 model_not_found if your key cannot use it.', '将 data 中的准确 id 填入 model 字段。GET /v1/models/{id} 返回单个模型；如果密钥无法使用该模型，则返回 404 model_not_found。') },
      ] },
      { id: 'prices', title: l('Prices', '价格'), blocks: [
        { type: 'text', text: l('Text models are billed per token: input, cached input and output, each priced per 1 million tokens. Image models are billed per image or per token, depending on the model. A discount route’s price is below the official price.', '文本模型按 token 计费：输入、缓存输入与输出分别按每 100 万 tokens 定价。图片模型按张或按 token 计费，取决于模型。折扣线路的价格低于官方价格。') },
        { type: 'note', text: l('Prices change with the routes, so they are not copied here. Service Plaza (Models) always shows your current price for every model, including any personal rate, next to the official price. Sign in to open it.', '价格会随线路变化，因此不在此处列出。服务广场的「模型」页始终显示每个模型的当前价格（含个人倍率）以及官方价格。登录后即可查看。') },
        { type: 'links', items: [{ label: l('How charges are calculated', '费用计算方式'), href: '/docs/usage' }, { label: l('Open the Models page', '打开模型页'), href: '/plaza/models' }] },
      ] },
      { id: 'plaza', title: l('Service Plaza', '服务广场'), blocks: [
        { type: 'text', text: l('Service Plaza shows everything you can buy here: Models, Private sessions and Workspaces. Its Models page has a Simple view, by family, and a Pro view that lists every route with exact prices and 24-hour status. Sign in to open it from the sidebar.', '服务广场展示本站提供的全部服务：模型、私有会话与云工作区。其中「模型」页有按系列展示的简易视图，以及列出每条线路准确价格与 24 小时状态的专业视图。登录后可从侧栏打开。') },
        { type: 'list', items: [
          l('Status: whether each model is working, slow, or down this hour, with 24-hour availability, success rate, median latency, and median time to first token. It combines real gateway traffic with a short test question sent to chat models that had no real requests since their last check (about every 20 minutes); client errors are not counted.', '状态：各模型本小时是否正常、变慢或不可用，以及 24 小时可用率、成功率、延迟中位数和首 token 时间中位数。数据结合真实网关流量，以及对上次检查以来没有真实请求的对话模型发送的简短测试问题（约每 20 分钟一次）；不计客户端错误。'),
          l('Pricing: your price next to the official price, with input, output, and cache rates per million tokens, or per-image and per-second rates where they apply.', '价格：你的价格与官方价格对照，包括每 100 万 tokens 的输入、输出与缓存价格，以及适用时的按张、按秒价格。'),
          l('In the Pro view, filter by platform, route, model name, or status.', '在专业视图中，可按平台、线路、模型名称或状态筛选。'),
        ] },
        { type: 'links', items: [{ label: l('Open the Models page', '打开模型页'), href: '/plaza/models' }, { label: l('Private sessions', '私有会话'), href: '/plaza/sessions' }, { label: l('Workspaces', '云工作区'), href: '/plaza/workspaces' }] },
      ] },
      { id: 'qwen', title: l('Qwen3.8-Flash', 'Qwen3.8-Flash'), blocks: [
        { type: 'text', text: l('The public model ID is qwen3.8, on the Qwen route, with a 262,144-token context window. Qwen thinks before answering by default; add chat_template_kwargs with enable_thinking set to false for short, direct answers.', '公开模型 ID 为 qwen3.8，位于 Qwen 线路，上下文窗口为 262,144 tokens。Qwen 默认会先思考再回答；如需简短直接的回答，请在 chat_template_kwargs 中将 enable_thinking 设为 false。') },
      ] },
    ],
  },
  {
    slug: 'billing', group: 'start', title: l('Credits and payments', '余额与支付'),
    description: l('Top up your balance, follow your orders, and redeem codes.', '充值余额、跟踪订单并使用兑换码。'),
    sections: [
      { id: 'credits', title: l('Prepaid balance', '预付余额'), blocks: [
        { type: 'text', text: l('TokensBeat uses prepaid credit. Each request deducts its cost from your balance when it finishes, and the header always shows what is left. Requests are refused with 403 INSUFFICIENT_BALANCE once the balance reaches zero.', 'TokensBeat 使用预付余额。每次请求结束后从余额中扣除费用，页面顶部会显示剩余余额。余额归零后，请求会返回 403 INSUFFICIENT_BALANCE。') },
        { type: 'text', text: l('A request that is already running always completes and is charged in full, so a long request can take the balance slightly below zero. Top up to continue.', '已开始的请求会正常完成并全额计费，因此较长的请求可能使余额略低于零。充值后即可继续使用。') },
      ] },
      { id: 'top-up', title: l('Top up', '充值'), blocks: [
        { type: 'steps', items: [
          l('Open Top up from the sidebar.', '从侧栏打开「充值」。'),
          l('Choose a quick amount or enter your own, then choose a payment method.', '选择快捷金额或输入自定义金额，然后选择支付方式。'),
          l('Check the summary, which shows the amount credited and your balance after the top-up, and pay.', '核对汇总信息（到账金额与充值后余额），然后支付。'),
          l('Credit is added as soon as the payment is confirmed. The result page updates on its own.', '支付确认后立即到账，结果页面会自动更新。'),
        ] },
        { type: 'table', headings: [l('Method', '支付方式'), l('How it works', '说明'), l('Per order', '单笔限额')], rows: [
          [l('Card or Link (Stripe)', '银行卡或 Link（Stripe）'), l('Pay in Stripe’s secure payment form.', '在 Stripe 安全支付表单中完成付款。'), l('$5 to $10,000', '$5 至 $10,000')],
          [l('USDT (NOWPayments)', 'USDT（NOWPayments）'), l('Choose a network shown at checkout and send the exact amount displayed.', '选择结算页显示的网络，并发送页面显示的准确金额。'), l('From $15', '最低 $15')],
          [l('USDC (NOWPayments)', 'USDC（NOWPayments）'), l('Choose a network shown at checkout and send the exact amount displayed.', '选择结算页显示的网络，并发送页面显示的准确金额。'), l('From $15', '最低 $15')],
        ] },
        { type: 'note', text: l('The checkout always shows the methods and limits currently available. For stablecoins, send on the network you selected; funds sent on another network cannot be credited automatically.', '结算页始终显示当前可用的支付方式与限额。使用稳定币时请在所选网络上转账，通过其他网络发送的资金无法自动到账。') },
        { type: 'links', items: [{ label: l('Top up', '充值'), href: '/purchase' }] },
      ] },
      { id: 'orders', title: l('Orders', '订单'), blocks: [
        { type: 'list', items: [
          l('Orders lists every payment with its amount, method, and status. You can filter by status and cancel an order that is still pending.', '「订单」列出每笔支付的金额、方式和状态，可按状态筛选，并取消仍在等待支付的订单。'),
          l('An unpaid order expires after 30 minutes, and you can have up to three pending orders at a time.', '未支付的订单 30 分钟后过期，同时最多保留 3 个待支付订单。'),
          l('If you paid but the order expired before the payment was confirmed, the payment is still credited once the provider confirms it. Check Orders before paying again.', '如果已付款但订单在确认前过期，服务商确认后仍会到账。再次付款前请先查看「订单」。'),
        ] },
        { type: 'links', items: [{ label: l('Open orders', '打开订单'), href: '/orders' }] },
      ] },
      { id: 'refunds', title: l('Refunds', '退款'), blocks: [
        { type: 'text', text: l('Refunds are not available as a self-service option in the console. Contact TokensBeat support with your order number. Stablecoin refunds are processed manually. See the Terms of Service for details.', '控制台暂不提供自助退款。请携带订单号联系 TokensBeat 支持团队，稳定币退款需人工处理。详情请参阅服务条款。') },
        { type: 'links', items: [{ label: l('Terms of Service', '服务条款'), href: '/legal/terms' }] },
      ] },
      { id: 'redeem', title: l('Redeem codes', '兑换码'), blocks: [
        { type: 'text', text: l('A redeem code can add balance, raise your concurrency limit, or grant a subscription. Enter it on the Redeem page. Codes are single-use, case-sensitive, and applied immediately; the page also keeps a history of past redemptions and balance adjustments.', '兑换码可增加余额、提高并发上限或开通订阅。在「兑换」页面输入即可。兑换码仅能使用一次，区分大小写，立即生效；该页面也会保留兑换和余额调整记录。') },
        { type: 'links', items: [{ label: l('Redeem a code', '使用兑换码'), href: '/redeem' }] },
      ] },
    ],
  },
  {
    slug: 'usage', group: 'start', title: l('Usage and spending', '用量与消费'),
    description: l('Check every request, understand each charge, and track spending from code.', '查看每次请求，理解每笔费用，并通过代码跟踪消费。'),
    sections: [
      { id: 'usage-page', title: l('The Usage page', '使用记录页面'), blocks: [
        { type: 'text', text: l('Usage lists every request with its time, API key, model, endpoint, request type (streaming or not), tokens, cost, time to first token, total duration, and client IP. Where a model name was mapped, the upstream model is shown too.', '「使用记录」列出每次请求的时间、API 密钥、模型、接口、请求类型（是否流式）、tokens、费用、首 token 时间、总耗时和客户端 IP。如存在模型映射，也会显示上游模型。') },
        { type: 'list', items: [
          l('Tokens are split into input, output, cache read, cache write, and image tokens.', 'Tokens 分为输入、输出、缓存读取、缓存写入和图片 tokens。'),
          l('Hover over a cost to see its breakdown, the rate multiplier, and the original and billed amounts.', '将鼠标悬停在费用上，可查看明细、倍率以及原始与实际扣费金额。'),
          l('Filter by key, model, group, request type, billing mode, and date range; charts show models, groups, endpoints, and token trends.', '可按密钥、模型、分组、请求类型、计费方式和日期范围筛选；图表展示模型、分组、接口和 token 趋势。'),
          l('Export the current view as CSV, including reasoning effort, rate multiplier, billed cost, and latency.', '可将当前视图导出为 CSV，包含推理强度、倍率、实际费用和延迟。'),
        ] },
        { type: 'links', items: [{ label: l('View usage', '查看使用记录'), href: '/usage' }, { label: l('Open dashboard', '打开仪表盘'), href: '/dashboard' }] },
      ] },
      { id: 'calculation', title: l('How a charge is calculated', '费用计算方式'), blocks: [
        { type: 'code', label: 'USD', code: 'cost = ( uncached_input_tokens × input_price\n       + cached_input_tokens   × cached_input_price\n       + output_tokens         × output_price ) / 1,000,000\n       × group_rate_multiplier' },
        { type: 'list', items: [
          l('Reasoning tokens count as output tokens.', '推理 tokens 计入输出 tokens。'),
          l('Cached pricing applies only to cache-hit tokens that the upstream reports.', '缓存价格仅适用于上游报告的缓存命中 tokens。'),
          l('Amounts are rounded to 8 decimal places. There is no minimum charge per request.', '金额保留 8 位小数，每次请求没有最低收费。'),
          l('If a stream is interrupted or your client disconnects, the tokens already generated are still charged.', '如果流式输出中断或客户端断开连接，已生成的 tokens 仍会计费。'),
        ] },
        { type: 'text', text: l('Example: a qwen3.8 request with 17 uncached input tokens and 2 output tokens costs 17 × 0.15 / 1,000,000 + 2 × 0.47 / 1,000,000 = $0.00000349.', '示例：一次 qwen3.8 请求包含 17 个非缓存输入 tokens 和 2 个输出 tokens，费用为 17 × 0.15 / 1,000,000 + 2 × 0.47 / 1,000,000 = $0.00000349。') },
      ] },
      { id: 'usage-api', title: l('Check spending from code', '通过代码查询消费'), blocks: [
        { type: 'text', text: l('GET /v1/usage returns, for the key you send: your balance, today’s and total spend and tokens, the key’s quota and spending windows, and daily and per-model statistics. Use days (1 to 90), or start_date and end_date, to choose the range, and timezone to set the day boundary. It works even when your balance is zero.', 'GET /v1/usage 会返回所用密钥对应的：账户余额、今日与累计的消费和 tokens、该密钥的额度与周期限额，以及按日和按模型的统计。可用 days（1 至 90）或 start_date 与 end_date 指定范围，用 timezone 设置日期边界。余额为零时也可调用。') },
        { type: 'code', label: 'cURL · Bash', code: usage },
        { type: 'text', text: l('To check a key in the browser instead, open the key usage page and paste the key. It shows the same quotas, limits, and statistics.', '也可以在浏览器中打开密钥用量页面并粘贴密钥，查看相同的额度、限额和统计信息。') },
        { type: 'links', items: [{ label: l('Key usage page', '密钥用量页面'), href: '/key-usage' }] },
      ] },
    ],
  },
  {
    slug: 'codex', group: 'cli', title: l('Codex configuration', 'Codex 配置'),
    description: l('Connect Codex CLI to TokensBeat with your own API key.', '通过 TokensBeat API 密钥接入 Codex CLI。'),
    sections: [
      { id: 'install', title: l('Install Codex CLI', '安装 Codex CLI'), blocks: [
        { type: 'text', text: l('Create a TokensBeat key on the Best price plan (the Simple view’s key), or pin one to the OpenAI · Discount route. Then install the current Codex CLI on a machine with Node.js and npm.', '先创建一个「最优价格」方案的 TokensBeat 密钥（即简易视图中的密钥），或固定在 OpenAI · Discount 线路上的密钥，然后在已安装 Node.js 和 npm 的环境中安装最新版 Codex CLI。') },
        { type: 'code', label: 'Terminal', code: 'npm install -g @openai/codex@latest\ncodex --version' },
      ] },
      { id: 'key', title: l('Set your API key', '设置 API 密钥'), blocks: [
        { type: 'text', text: l('Set this variable in the terminal where you will launch Codex. Replace the placeholder with your TokensBeat key.', '在将要启动 Codex 的终端中设置环境变量，并用你的 TokensBeat 密钥替换占位符。') },
        { type: 'code', label: 'macOS / Linux / WSL · Bash', code: bashKey },
        { type: 'code', label: 'Windows · PowerShell', code: powershellKey },
      ] },
      { id: 'configuration', title: l('Configure the provider', '配置服务商'), blocks: [
        { type: 'text', text: l('Back up your existing user configuration, then merge these settings into ~/.codex/config.toml (Windows: %USERPROFILE%\\.codex\\config.toml). Keep top-level settings before TOML tables and avoid duplicate keys. Leave your existing approval and sandbox settings in place.', '先备份用户配置，再将以下设置合并至 ~/.codex/config.toml（Windows：%USERPROFILE%\\.codex\\config.toml）。顶层配置需放在 TOML 表之前，避免重复定义。保留原有审批和沙箱设置。') },
        { type: 'code', label: 'config.toml', code: codexConfig },
      ] },
      { id: 'models', title: l('Choose a model', '选择模型'), blocks: [
        { type: 'text', text: l('Set model to a GPT model your key can call. gpt-5.6-sol is a good default; gpt-6.1-sol and gpt-6.1-terra cost less per token, and gpt-6-astra is the highest-priced. Run GET /v1/models with your key to see the full list.', '将 model 设置为密钥可调用的 GPT 模型。gpt-5.6-sol 是不错的默认选择；gpt-6.1-sol 与 gpt-6.1-terra 的 token 单价更低，gpt-6-astra 价格最高。使用密钥调用 GET /v1/models 可查看完整列表。') },
        { type: 'links', items: [{ label: l('Models and pricing', '模型与价格'), href: '/docs/models' }] },
      ] },
      { id: 'launch', title: l('Launch and verify', '启动并验证'), blocks: [
        { type: 'code', label: 'Terminal', code: 'codex' },
        { type: 'text', text: l('Restart Codex after changing provider settings. Send a short prompt and check that the request appears on the Usage page. Your account needs credit, and GUI clients also need access to the environment variable.', '更改服务商设置后重启 Codex。发送一个简短提示词，并在「使用记录」中确认请求。账户需有余额，图形界面客户端也需要能读取该环境变量。') },
        { type: 'text', text: l('Prefer not to edit files by hand? Use key on your key generates a complete Codex setup, including a variant that uses WebSocket streaming.', '不想手动编辑文件？在密钥上点击「使用密钥」，即可生成完整的 Codex 配置，其中也包括使用 WebSocket 流式传输的版本。') },
        { type: 'links', items: [{ label: l('Official Codex configuration reference', 'Codex 官方配置参考'), href: 'https://learn.chatgpt.com/docs/config-file/config-reference' }] },
      ] },
    ],
  },
  {
    slug: 'claude-code', group: 'cli', title: l('Claude Code', 'Claude Code'),
    description: l('Run Claude Code on Claude models, or on qwen3.8, through the Anthropic Messages endpoint.', '通过 Anthropic Messages 接口，在 Claude 模型或 qwen3.8 上运行 Claude Code。'),
    sections: [
      { id: 'overview', title: l('How it works', '工作原理'), blocks: [
        { type: 'text', text: l('Claude Code speaks the Anthropic Messages API. With a Best price key, or a key pinned to the Claude · Discount route, it runs on Claude. With a key pinned to the Qwen route, TokensBeat translates its requests to qwen3.8, so Claude Code works as your terminal agent on Qwen. A key pinned to the OpenAI · Discount route does not accept /v1/messages.', 'Claude Code 使用 Anthropic Messages API。使用「最优价格」密钥，或固定在 Claude · Discount 线路上的密钥时，它运行在 Claude 上。使用固定在 Qwen 线路上的密钥时，TokensBeat 会把请求转换给 qwen3.8，因此可以在 Qwen 上使用 Claude Code 作为终端智能体。固定在 OpenAI · Discount 线路上的密钥不接受 /v1/messages。') },
        { type: 'code', label: 'Terminal', code: 'npm install -g @anthropic-ai/claude-code\nclaude --version' },
      ] },
      { id: 'configure', title: l('Point Claude Code at TokensBeat', '将 Claude Code 指向 TokensBeat'), blocks: [
        { type: 'text', text: l('Set these variables before you start Claude Code. The base URL has no /v1 because Claude Code adds /v1/messages itself. With a key that reaches Claude models, the base URL and the key are enough, as long as GET /v1/models lists the models Claude Code asks for; otherwise set ANTHROPIC_MODEL to a Claude model ID from that list.', '启动 Claude Code 前设置以下变量。基础地址不带 /v1，因为 Claude Code 会自行添加 /v1/messages。使用可调用 Claude 模型的密钥时，只要 GET /v1/models 列出了 Claude Code 请求的模型，设置基础地址和密钥即可；否则请把 ANTHROPIC_MODEL 设为该列表中的某个 Claude 模型 ID。') },
        { type: 'code', label: 'Claude key · Bash', code: claudeCodeClaudeBash },
        { type: 'text', text: l('With a key pinned to the Qwen route, also set the model variables: they map every model Claude Code asks for to qwen3.8, and without them its Claude model names are rejected.', '使用固定在 Qwen 线路上的密钥时，还需设置模型变量：它们会把 Claude Code 请求的所有模型映射为 qwen3.8，缺少这些变量时其 Claude 模型名称会被拒绝。') },
        { type: 'code', label: 'Qwen route key · macOS / Linux / WSL · Bash', code: claudeCodeBash },
        { type: 'code', label: 'Qwen route key · Windows · PowerShell', code: claudeCodePowershell },
        { type: 'text', text: l('To keep the settings for every session, including the VS Code extension, put them in ~/.claude/settings.json (Windows: %USERPROFILE%\\.claude\\settings.json) instead.', '如需对所有会话（包括 VS Code 扩展）生效，请改为写入 ~/.claude/settings.json（Windows：%USERPROFILE%\\.claude\\settings.json）。') },
        { type: 'code', label: 'Qwen route key · settings.json', code: claudeCodeSettings },
      ] },
      { id: 'verify', title: l('Launch and verify', '启动并验证'), blocks: [
        { type: 'code', label: 'Terminal', code: 'claude' },
        { type: 'text', text: l('Send a short prompt. On the Usage page the request appears with the model it ran on and endpoint /v1/messages. If you see 404 model_not_found, the key cannot call the model Claude Code asked for: pick a model your key lists, or with a Qwen route key set every model variable; if you see 403 about /v1/messages dispatch, the key is pinned to the OpenAI · Discount route.', '发送一个简短提示词。在「使用记录」中，该请求会显示实际使用的模型，接口为 /v1/messages。如出现 404 model_not_found，说明密钥无法调用 Claude Code 请求的模型：请选择密钥列出的模型；使用 Qwen 线路密钥时请设置所有模型变量。如出现与 /v1/messages dispatch 相关的 403，说明密钥固定在 OpenAI · Discount 线路上。') },
      ] },
    ],
  },
  {
    slug: 'windows-wsl', group: 'cli', title: l('Windows and WSL', 'Windows 与 WSL'),
    description: l('Use the correct environment and shell syntax on Windows.', '在 Windows 上使用正确的环境和命令语法。'),
    sections: [
      { id: 'powershell', title: l('PowerShell quickstart', 'PowerShell 快速开始'), blocks: [
        { type: 'text', text: l('Use Invoke-RestMethod for a native PowerShell request. This example calls qwen3.8: use a Best price key or a key pinned to the Qwen route.', '使用 PowerShell 原生的 Invoke-RestMethod 发起请求。此示例调用 qwen3.8：请使用「最优价格」密钥或固定在 Qwen 线路上的密钥。') },
        { type: 'code', label: 'PowerShell', code: powershellKey + String.raw`

$headers = @{ Authorization = "Bearer $env:TOKENSBEAT_API_KEY" }
$body = @{
  model = 'qwen3.8'
  messages = @(@{ role = 'user'; content = 'Reply with OK only.' })
  max_tokens = 128
  chat_template_kwargs = @{ enable_thinking = $false }
} | ConvertTo-Json -Depth 5

$reply = Invoke-RestMethod ` + '`' + String.raw`
  -Uri 'https://api.tokensbeat.com/v1/chat/completions' ` + '`' + String.raw`
  -Method Post -Headers $headers -ContentType 'application/json' -Body $body
$reply.choices[0].message.content` },
        { type: 'text', text: l('Variables set with $env: last only for the current PowerShell window. To keep the key for new windows, set it as a user environment variable in System Properties, then open a new terminal.', '用 $env: 设置的变量仅在当前 PowerShell 窗口有效。如需在新窗口中保留，请在“系统属性”中将其设为用户环境变量，然后打开新的终端。') },
      ] },
      { id: 'wsl', title: l('Keep WSL configuration inside WSL', '在 WSL 内配置运行环境'), blocks: [
        { type: 'text', text: l('If you run Codex or Claude Code inside WSL, install Node.js and the tool there, set the environment variables in that shell, and edit the configuration files in the Linux home directory. The Windows user directory and environment are separate.', '如果在 WSL 内运行 Codex 或 Claude Code，请在 WSL 中安装 Node.js 和对应工具，在该 shell 中设置环境变量，并编辑 Linux 用户目录下的配置文件。Windows 用户目录与环境变量是独立的。') },
        { type: 'code', label: 'WSL · Bash', code: 'node --version\nnpm --version\ncodex --version' },
        { type: 'links', items: [{ label: l('Continue with Codex configuration', '继续配置 Codex'), href: '/docs/codex' }, { label: l('Set up Claude Code', '配置 Claude Code'), href: '/docs/claude-code' }] },
      ] },
    ],
  },
  {
    slug: 'agent', group: 'agent', title: l('Aha', 'Aha'),
    description: l('Chat, research, and create images and video in the browser with your TokensBeat account.', '使用 TokensBeat 账户，在浏览器中对话、研究并生成图片和视频。'),
    sections: [
      { id: 'overview', title: l('What the agent does', '功能概览'), blocks: [
        { type: 'text', text: l('Aha, at aha.tokensbeat.com, is our agent: a workspace where it can search, read, write files, and create media for you. It uses the same sign-in, balance, and pricing as the rest of TokensBeat.', 'Aha（aha.tokensbeat.com）是我们的智能体：一个可以为你搜索、阅读、编写文件和生成媒体内容的工作区。它与 TokensBeat 其他服务使用相同的登录、余额和价格。') },
        { type: 'links', items: [{ label: l('Open Aha', '打开 Aha'), href: 'https://aha.tokensbeat.com' }] },
      ] },
      { id: 'billing', title: l('Sign-in, keys, and billing', '登录、密钥与计费'), blocks: [
        { type: 'list', items: [
          l('Sign in with the same account you use on console.tokensbeat.com. The agent needs an existing TokensBeat account for that sign-in.', '使用与 console.tokensbeat.com 相同的账户登录。智能体需要该登录对应的 TokensBeat 账户已经存在。'),
          l('On first use it creates keys named agent-ui, agent-ui-search, agent-ui-image, and agent-ui-video in your account. Its requests are billed through those keys, appear on your Usage page, and are charged from your balance.', '首次使用时，它会在你的账户中创建 agent-ui、agent-ui-search、agent-ui-image 和 agent-ui-video 密钥。智能体的请求通过这些密钥计费，会出现在「使用记录」中，并从余额扣费。'),
          l('The header shows your balance and links to your profile, API keys, and Top up.', '页面顶部显示余额，并提供个人资料、API 密钥和充值的链接。'),
        ] },
        { type: 'links', items: [{ label: l('Open the console', '打开控制台'), href: '/dashboard' }] },
      ] },
      { id: 'chat', title: l('Chat and tools', '对话与工具'), blocks: [
        { type: 'list', items: [
          l('Pick a model from the picker. It lists your keys and the chat models each key can call; the run is billed to the key you choose.', '在模型选择器中选择模型。它会列出你的密钥以及每个密钥可调用的对话模型，本次运行将计费到所选密钥。'),
          l('Attach up to 10 files of up to 25 MB each. Text is extracted from PDF and Word documents.', '最多可附加 10 个文件，每个不超过 25 MB。PDF 和 Word 文档会提取文本。'),
          l('Tools include web search and page reading, academic search across OpenAlex, arXiv, and Crossref, and files in your workspace.', '工具包括网页搜索与阅读、OpenAlex、arXiv 和 Crossref 学术检索，以及工作区文件操作。'),
          l('In Ask mode the agent asks before it acts; in Auto mode it proceeds on its own.', '「询问」模式下，智能体在执行操作前会征求你的同意；「自动」模式下会自行执行。'),
          l('Save a useful run as a personal skill and reuse it later.', '可将有用的对话保存为个人技能，之后重复使用。'),
          l('Download workspace files one at a time or as a zip. Each account has 2 GB of storage, and uploads that are never used are removed after 24 hours.', '工作区文件可单独下载或打包为 zip。每个账户有 2 GB 存储空间，未被使用的上传文件 24 小时后删除。'),
        ] },
      ] },
      { id: 'images', title: l('Images', '图片'), blocks: [
        { type: 'text', text: l('The Images page creates 1 to 4 images per request with gpt-image-2, as square (1024 × 1024), landscape (1536 × 1024), or portrait (1024 × 1536). Images are billed at the gpt-image-2 rates in Models and pricing.', '「图片」页面使用 gpt-image-2，每次生成 1 至 4 张图片，可选正方形（1024 × 1024）、横向（1536 × 1024）或纵向（1024 × 1536）。按「模型与价格」中的 gpt-image-2 价格计费。') },
      ] },
      { id: 'video', title: l('Video (limited preview)', '视频（限量预览）'), blocks: [
        { type: 'text', text: l('Video generation with MiniMax H3 is in limited preview and is enabled per account. When it is available to you, the Video page opens a project editor where you combine prompt cards (subject, scene, camera, style, audio, things to avoid) with optional first and last frames.', '基于 MiniMax H3 的视频生成目前为限量预览，需按账户开通。开通后，「视频」页面会打开项目编辑器，你可以组合提示卡片（主体、场景、镜头、风格、音频、需避免的内容），并可选首帧和尾帧。') },
        { type: 'list', items: [
          l('Length 3, 5, 8, or 10 seconds; 480p, 720p, or 1080p (1080p up to 5 seconds); 16:9, 9:16, or 1:1; 24 fps with audio.', '时长 3、5、8 或 10 秒；分辨率 480p、720p 或 1080p（1080p 最长 5 秒）；画幅 16:9、9:16 或 1:1；24 fps，含音频。'),
          l('Video is billed per second of output. The editor shows the price before you generate, and the cost is reserved from your balance when the job starts.', '视频按输出秒数计费。生成前编辑器会显示价格，任务开始时会从余额中预留费用。'),
          l('Finished videos stay in your projects until you delete them.', '生成的视频会保留在项目中，直到你删除。'),
        ] },
      ] },
      // Phone tasks (added 2026-11-02, after the port): the Aha app for Android bundles a phone agent (the open-source
      // Mika, under Aha's name) and sets it up with the user's own key in one tap.
      { id: 'phone-tasks', title: l('Phone tasks (Android app)', '手机任务（安卓应用）'), blocks: [
        { type: 'text', text: l('The Aha app for Android can also use the other apps on your phone for you. Say what you want done, and its phone agent taps, types and scrolls on a screen of its own while you keep using your phone. It is built on Mika, an open-source phone agent, and appears as Aha.', 'Aha 安卓应用还能替你操作手机上的其他应用。说出要做的事，它的手机助理会在自己的虚拟屏幕上点按、输入和滑动，不影响你继续用手机。它基于开源项目 Mika，在应用里以 Aha 的名字出现。') },
        { type: 'steps', items: [
          l('Install the Aha app for Android and sign in with your TokensBeat account. Working other apps needs Android 12 or later; on Android 11 it can still chat and use the web.', '安装 Aha 安卓应用，并用你的 TokensBeat 账户登录。操作其他应用需要 Android 12 或更高版本；在 Android 11 上仍可对话和使用网页。'),
          l('Tap the bar at the top (Aha) to open the menu, and choose Phone tasks under Apps. The first time, choose Set up and open: Aha makes a key named “Aha phone agent” in your account and chooses gemini-3.8-flash for the agent. There is nothing to copy or paste.', '点按顶部的 Aha 栏打开菜单，在「应用」下选择「手机任务」。第一次使用时点「设置并打开」：Aha 会在你的账户里生成一个名为「Aha phone agent」的密钥，并为它选好 gemini-3.8-flash，无需复制粘贴。'),
          l('In the agent, follow Set up phone control: pair Wireless debugging once (in Settings › Developer options; it walks you through it), then turn on its accessibility service, listed as Aha.', '在手机任务里按「设置手机操作」完成设置：配对一次「无线调试」（在“设置 › 开发者选项”中，它会一步步带你完成），再打开它的无障碍服务（显示为 Aha）。'),
          l('Give it a task on its own screen, for example “set an alarm for 7:30 tomorrow”. From then on Phone tasks opens it directly; the gear beside Phone tasks sets it up again.', '在它自己的界面里交给它一个任务，例如「明天早上 7:30 设个闹钟」。之后点「手机任务」会直接打开它；旁边的齿轮可以重新设置。'),
        ] },
        { type: 'list', items: [
          l('Its requests are billed to your balance through the key “Aha phone agent”, which you can see and turn off on the API keys page. It calls the model at every step of a task, so long tasks add up.', '它的请求通过密钥「Aha phone agent」从你的余额扣费，你可以在「API 密钥」页面查看或停用这个密钥。它在任务的每一步都会调用模型，较长的任务费用会累积。'),
          l('It sends what it reads on your screen, including screenshots and the text of chats it opens, to the model through TokensBeat.', '它会把在屏幕上读到的内容（包括截图和它打开的聊天文字）经由 TokensBeat 发送给模型。'),
          l('It asks before paying, hands sign-ins and verification codes to you, and never operates the Aha app itself. If you set up another model provider in the agent yourself, Aha asks before replacing it.', '付款前它会先问你，登录和验证码交给你自己处理，它也从不操作 Aha 应用本身。如果你已经在手机任务里设置了别的模型服务商，Aha 会先问你再替换。'),
          l('Letting an app operate other apps automatically may break their terms of service.', '让应用自动操作其他应用可能违反这些应用的服务条款。'),
        ] },
        { type: 'links', items: [
          { label: l('Open API keys', '打开 API 密钥'), href: '/keys' },
          { label: l('Mika with your own key', '用自己的密钥接入 Mika'), href: '/docs/compatible-apps#mika' },
        ] },
      ] },
    ],
  },
  {
    slug: 'chat-completions', group: 'api', title: l('Chat Completions', 'Chat Completions'),
    description: l('Send a list of messages and receive JSON or a text stream.', '发送消息列表，获得 JSON 响应或文本流。'),
    sections: [
      { id: 'request', title: l('Create a completion', '创建对话请求'), blocks: [
        { type: 'text', text: l('POST /v1/chat/completions accepts a model and a messages array. The example calls qwen3.8 (a Best price key or a key pinned to the Qwen route) and disables Qwen thinking for a short answer.', 'POST /v1/chat/completions 接收 model 和 messages 数组。示例调用 qwen3.8（使用「最优价格」密钥或固定在 Qwen 线路上的密钥），并关闭 Qwen 思考模式以获得简短回答。') },
        { type: 'code', label: 'cURL · Bash', code: chat },
      ] },
      { id: 'gpt', title: l('Use GPT models', '使用 GPT 模型'), blocks: [
        { type: 'text', text: l('For a GPT model, send the same request with the GPT model ID. TokensBeat converts it to the Responses API and returns a normal Chat Completions response. For reasoning controls and other Responses features, call the Responses API directly.', '调用 GPT 模型时，将同样请求中的模型换成 GPT 模型 ID 即可。TokensBeat 会将其转换为 Responses API，并返回标准的 Chat Completions 响应。如需推理控制等 Responses 功能，请直接调用 Responses API。') },
        { type: 'code', label: 'JSON · request body', code: gptChatBody },
        { type: 'note', text: l('Image models (gpt-image-*) are not accepted here; use the Images API instead.', '此接口不接受图片模型（gpt-image-*），请改用 Images API。') },
      ] },
      { id: 'streaming', title: l('Stream the answer', '流式输出'), blocks: [
        { type: 'text', text: l('Add stream: true and stream_options.include_usage: true to the request. Use curl -N to display events as they arrive. Read text from choices[].delta.content and usage from the final usage event.', '在请求中添加 stream: true 和 stream_options.include_usage: true。使用 curl -N 实时显示事件，从 choices[].delta.content 读取文本，从最后的用量事件读取 usage。') },
        { type: 'code', label: 'JSON · additional fields', code: '{\n  "stream": true,\n  "stream_options": { "include_usage": true }\n}' },
        { type: 'list', items: [
          l('While a request waits for a free concurrency slot, the stream sends comment lines that start with a colon to keep the connection open. Ignore them.', '请求等待空闲并发槽位时，流中会发送以冒号开头的注释行以保持连接，请忽略这些行。'),
          l('If an error occurs after the stream has started, it arrives as an error event inside the stream.', '如果流开始后发生错误，会以流内的错误事件返回。'),
        ] },
        { type: 'note', text: l('A streaming HTTP 200 only confirms that the stream opened. Check for error events and the final completion marker before treating the response as successful.', '流式请求的 HTTP 200 仅表示连接已经建立。请检查流中的错误事件和最终结束标记，确认响应是否完整成功。') },
      ] },
    ],
  },
  {
    slug: 'responses', group: 'api', title: l('Responses API', 'Responses API'),
    description: l('The native API for GPT models and the endpoint Codex uses.', 'GPT 模型的原生接口，也是 Codex 使用的接口。'),
    sections: [
      { id: 'request', title: l('Create a streamed response', '创建流式响应'), blocks: [
        { type: 'text', text: l('Use POST /v1/responses with a GPT model: a Best price key or a key pinned to the OpenAI · Discount route. The example below uses gpt-5.6-sol.', '使用 GPT 模型调用 POST /v1/responses：请使用「最优价格」密钥或固定在 OpenAI · Discount 线路上的密钥。以下示例使用 gpt-5.6-sol。') },
        { type: 'code', label: 'cURL · Bash', code: responses },
      ] },
      { id: 'events', title: l('Read server-sent events', '处理 SSE 事件'), blocks: [
        { type: 'list', items: [
          l('Append response.output_text.delta events to display the answer.', '将 response.output_text.delta 事件中的内容追加显示为回答。'),
          l('Wait for response.completed with completed status and read its usage.', '等待状态为 completed 的 response.completed 事件，并读取其中的 usage。'),
          l('Handle response.failed and error events, even after an HTTP 200. If the gateway hits an error mid-stream, it ends the stream with response.failed.', '即使 HTTP 状态为 200，也需处理 response.failed 和 error 事件。网关在流中途遇到错误时，会以 response.failed 结束流。'),
        ] },
      ] },
      { id: 'state', title: l('Conversation state', '会话状态'), blocks: [
        { type: 'text', text: l('Send store: false and pass the conversation history you need in input. Do not rely on responses being stored for you: retrieving or deleting a stored response by ID is not supported.', '请设置 store: false，并在 input 中传入所需的历史上下文。不要依赖响应被托管存储：不支持按 ID 获取或删除已存储的响应。') },
      ] },
      { id: 'websocket', title: l('WebSocket mode', 'WebSocket 模式'), blocks: [
        { type: 'text', text: l('Clients such as Codex can also open a WebSocket on GET /v1/responses. The first message must be a response.create event with a model. Each key can hold up to 64 WebSocket connections; beyond that the gateway answers 429 and asks you to retry after 5 seconds.', 'Codex 等客户端也可以通过 GET /v1/responses 建立 WebSocket 连接。第一条消息必须是包含 model 的 response.create 事件。每个密钥最多 64 个 WebSocket 连接，超出后网关返回 429，并建议 5 秒后重试。') },
      ] },
      { id: 'qwen', title: l('Qwen through Responses', '通过 Responses 调用 Qwen'), blocks: [
        { type: 'text', text: l('Keys pinned to the Qwen route can send basic text requests here with model qwen3.8. They are converted to Chat Completions, so advanced Responses features depend on what that conversion supports.', '固定在 Qwen 线路上的密钥也可以使用 qwen3.8 调用此接口发送基本文本请求。请求会转换为 Chat Completions，高级 Responses 功能取决于转换的支持情况。') },
      ] },
    ],
  },
  {
    slug: 'images', group: 'api', title: l('Image generation', '图片生成'),
    description: l('Create and edit images with the image models of the Draw route.', '使用 Draw 线路的图片模型生成和编辑图片。'),
    sections: [
      { id: 'generate', title: l('Generate an image', '生成图片'), blocks: [
        { type: 'text', text: l('POST /v1/images/generations with a Best price key or a key pinned to the Draw route. The example uses gpt-image-2; the Draw route also has gemini-3.1-flash-image and gemini-3-pro-image-preview. The response follows the OpenAI Images format, with each image as base64 data in data[].b64_json. The example uses jq to save it.', '使用「最优价格」密钥或固定在 Draw 线路上的密钥调用 POST /v1/images/generations。示例使用 gpt-image-2；Draw 线路还提供 gemini-3.1-flash-image 与 gemini-3-pro-image-preview。响应遵循 OpenAI Images 格式，每张图片以 base64 数据返回在 data[].b64_json 中。示例使用 jq 保存图片。') },
        { type: 'code', label: 'cURL · Bash', code: imageGenerate },
        { type: 'table', headings: [l('Field', '字段'), l('Notes', '说明')], rows: [
          [l('prompt', 'prompt'), l('Required. Describe the image.', '必填，描述图片内容。')],
          [l('n', 'n'), l('Number of images, at least 1.', '图片数量，至少为 1。')],
          [l('size', 'size'), l('For example 1024x1024, 1536x1024, or 1024x1536.', '例如 1024x1024、1536x1024 或 1024x1536。')],
          [l('quality, background, output_format', 'quality、background、output_format'), l('Optional and passed to the model.', '可选，原样传给模型。')],
        ] },
      ] },
      { id: 'edit', title: l('Edit an image', '编辑图片'), blocks: [
        { type: 'text', text: l('POST /v1/images/edits accepts multipart form data with one or more image files of up to 20 MB each. JSON requests must reference images by URL in images[].image_url; uploaded file IDs are not supported.', 'POST /v1/images/edits 接受 multipart 表单，可上传一个或多个图片文件，每个不超过 20 MB。JSON 请求需通过 images[].image_url 以 URL 引用图片，不支持上传后的文件 ID。') },
        { type: 'code', label: 'cURL · Bash', code: imageEdit },
      ] },
      { id: 'billing', title: l('Billing and limits', '计费与限制'), blocks: [
        { type: 'list', items: [
          l('Image requests are billed at the model’s image price (per image or per token, shown in Service Plaza) and appear on the Usage page.', '图片请求按该模型的图片价格计费（按张或按 token，见服务广场），并显示在「使用记录」中。'),
          l('Image models are not available through Chat Completions or Responses.', '图片模型不能通过 Chat Completions 或 Responses 调用。'),
          l('Keys pinned to a chat-only route, such as Qwen, cannot call the Images API; the gateway answers 404.', '固定在仅对话线路（如 Qwen）上的密钥不能调用 Images API，网关会返回 404。'),
        ] },
        { type: 'links', items: [{ label: l('Plans, routes and prices', '方案、线路与价格'), href: '/docs/models' }] },
      ] },
    ],
  },
  {
    slug: 'sdks', group: 'api', title: l('Python and JavaScript', 'Python 与 JavaScript'),
    description: l('Use the official OpenAI SDKs with the TokensBeat base URL.', '通过官方 OpenAI SDK 连接 TokensBeat API。'),
    sections: [
      { id: 'python', title: l('Python', 'Python'), blocks: [
        { type: 'code', label: 'Install', code: 'python -m pip install openai' },
        { type: 'code', label: 'Python · qwen3.8 · Chat Completions', code: pythonQwen },
        { type: 'code', label: 'Python · gpt-5.6-sol · Responses', code: pythonResponses },
      ] },
      { id: 'javascript', title: l('JavaScript', 'JavaScript'), blocks: [
        { type: 'code', label: 'Install', code: 'npm install openai' },
        { type: 'code', label: 'Node.js · qwen3.8 · example.mjs', code: nodeQwen },
        { type: 'note', text: l('Run these examples on your server or local machine with TOKENSBEAT_API_KEY set. Do not enable browser-side API-key use.', '请先设置 TOKENSBEAT_API_KEY，然后在服务端或本地运行示例。不要在浏览器端暴露 API 密钥。') },
      ] },
      { id: 'retries', title: l('Timeouts and retries', '超时与重试'), blocks: [
        { type: 'text', text: l('The SDKs retry 429 and 5xx responses automatically. Long reasoning requests can take minutes, so raise the client timeout rather than lowering it, and prefer streaming for long outputs.', 'SDK 会自动重试 429 和 5xx 响应。较长的推理请求可能需要数分钟，请适当提高而非降低客户端超时时间；长输出建议使用流式传输。') },
      ] },
    ],
  },
  {
    slug: 'compatible-apps', group: 'api', title: l('Compatible apps', '第三方应用接入'),
    description: l('Connect an app that supports a custom OpenAI-compatible provider.', '接入支持自定义 OpenAI 兼容服务商的应用。'),
    sections: [
      { id: 'settings', title: l('Provider settings', '服务商设置'), blocks: [
        { type: 'text', text: l('For apps with a custom OpenAI-compatible provider, use the values below. Field names vary between apps.', '如果应用支持自定义 OpenAI 兼容服务商，请使用以下配置。不同应用的字段名称可能不同。') },
        { type: 'table', headings: [l('Setting', '设置'), l('Value', '值')], rows: [
          [l('Provider name', '服务商名称'), l('TokensBeat', 'TokensBeat')],
          [l('API base URL', 'API 基础地址'), l('https://api.tokensbeat.com/v1', 'https://api.tokensbeat.com/v1')],
          [l('API key', 'API 密钥'), l('Your TokensBeat API key', '你的 TokensBeat API 密钥')],
          [l('Model', '模型'), l('A model your key lists, such as qwen3.8 or gpt-5.6-sol with a Best price key', '密钥列出的模型，例如「最优价格」密钥可使用 qwen3.8 或 gpt-5.6-sol')],
        ] },
        { type: 'text', text: l('Most apps call Chat Completions, which works for qwen3.8 and the GPT models. If an app offers a Responses option, use it for GPT models to get the full feature set.', '大多数应用调用 Chat Completions，qwen3.8 与 GPT 模型均可使用。如果应用提供 Responses 选项，使用 GPT 模型时建议选用，以获得完整功能。') },
      ] },
      { id: 'check', title: l('Verify the connection', '验证连接'), blocks: [
        { type: 'steps', items: [
          l('Save the provider, refresh the model list if the app supports it, and select a model your key can use.', '保存服务商，按需刷新模型列表，然后选择密钥可用的模型。'),
          l('Send a short message and check that a matching entry appears on the Usage page.', '发送简短消息，并确认「使用记录」中出现对应记录。'),
          l('If the app appends /v1 automatically, enter https://api.tokensbeat.com as its host. The final URL must contain /v1 only once.', '如果应用自动添加 /v1，请将主机地址填为 https://api.tokensbeat.com。最终地址中只能出现一次 /v1。'),
        ] },
      ] },
      { id: 'opencode', title: l('OpenCode and CC-Switch', 'OpenCode 与 CC-Switch'), blocks: [
        { type: 'text', text: l('Use key on the API Keys page generates an opencode.json for OpenCode, and Import to CC-Switch adds the key to CC-Switch in one click.', '在「API 密钥」页面点击「使用密钥」可生成 OpenCode 的 opencode.json；「导入 CC-Switch」可一键将密钥添加到 CC-Switch。') },
        keyLinks,
      ] },
      // Mika (github.com/wangzan101/mika; added 2026-11-02 from the Vue site's docs-mika branch, after the port) builds
      // its URLs as {base}/models, {base}/chat/completions, {base}/responses and {base}/v1/messages (Anthropic). Checked
      // against the live gateway on 1 Nov 2026 with gemini-3.8-flash over Chat Completions: model list, streamed tool
      // call with stream_options, tool-result replay and a screenshot as an image_url data URL. Mika sends no
      // chat_template_kwargs, so qwen3.8 always thinks. The Aha app for Android bundles it (Phone tasks, set up in one tap).
      { id: 'mika', title: l('Mika (Android)', 'Mika（安卓）'), blocks: [
        { type: 'text', text: l('Mika is a free, open-source Android app, not made by TokensBeat, that operates the apps on your phone and the web for you. It needs a model that supports tool calling, and a TokensBeat key can be its model provider.', 'Mika 是一款免费开源的安卓应用（并非 TokensBeat 出品），可以替你操作手机上的应用和网页。它需要支持工具调用的模型，可以用 TokensBeat 密钥作为它的模型服务商。') },
        { type: 'note', text: l('The Aha app for Android has Mika built in as Phone tasks, and sets it up with your key in one tap. The steps below are for the Mika app on its own.', 'Aha 安卓应用已内置 Mika（即「手机任务」），可一键用你的密钥完成设置。以下步骤适用于单独安装的 Mika 应用。') },
        { type: 'steps', items: [
          l('Create a key just for Mika and give it spending windows. Mika calls the model at every step of a task, so long tasks add up.', '为 Mika 单独创建一个密钥并设置周期限额。Mika 在任务的每一步都会调用模型，较长的任务费用会累积。'),
          l('In Mika, open Settings › Model, add a provider and choose Custom (自定义). Pick the interface type and base URL for your model from the table below, then paste the key.', '在 Mika 中打开「设置 › 模型」，添加服务商并选择「自定义」。按下表为你要使用的模型选择接口类型和基础地址，然后粘贴密钥。'),
          l('Choose Test and save. Mika lists the models your key can use and sends one short, billed test request.', '点击「测试并保存」。Mika 会列出密钥可用的模型，并发送一次简短的测试请求（会计费）。'),
          l('Choose the main model. If it understands images, as gemini-3.8-flash does, set the vision model to Use main model so Mika can read screenshots.', '选择主模型。如果主模型能理解图片（例如 gemini-3.8-flash），请将看图模型设为「用主模型」，以便 Mika 读取截图。'),
        ] },
        { type: 'table', headings: [l('Model', '模型'), l('Interface type', '接口类型'), l('Base URL', '基础地址')], rows: [
          [l('gemini-3.8-flash, qwen3.8', 'gemini-3.8-flash、qwen3.8'), l('OpenAI-compatible', 'OpenAI 兼容'), l('https://api.tokensbeat.com/v1', 'https://api.tokensbeat.com/v1')],
          [l('GPT models', 'GPT 系列模型'), l('OpenAI Responses', 'OpenAI Responses'), l('https://api.tokensbeat.com/v1', 'https://api.tokensbeat.com/v1')],
          [l('Claude models', 'Claude 系列模型'), l('Anthropic', 'Anthropic'), l('https://api.tokensbeat.com (without /v1; Mika adds it)', 'https://api.tokensbeat.com（不带 /v1，Mika 会自动添加）')],
        ] },
        { type: 'list', items: [
          l('qwen3.8 thinks before answering by default, and Mika has no setting to turn that off, so each step takes longer.', 'qwen3.8 默认先思考再回答，Mika 没有关闭思考的设置，因此每一步耗时更长。'),
          l('Mika sends what it reads on your screen, including screenshots and the text of chats it opens, to the model you set up. With a TokensBeat key, that goes through TokensBeat to the model’s provider.', 'Mika 会把它在屏幕上读到的内容（包括截图和它打开的聊天文字）发送给你设置的模型。使用 TokensBeat 密钥时，这些内容会经由 TokensBeat 发送给模型服务商。'),
          l('Letting an app operate other apps automatically may break their terms of service. Mika is supported by its own developers, not by TokensBeat.', '让应用自动操作其他应用可能违反这些应用的服务条款。Mika 由其开发者提供支持，而非 TokensBeat。'),
        ] },
        { type: 'links', items: [
          { label: l('Open API keys', '打开 API 密钥'), href: '/keys' },
          { label: l('Models and pricing', '模型与价格'), href: '/docs/models' },
          { label: l('Phone tasks in the Aha app', 'Aha 应用中的手机任务'), href: '/docs/agent#phone-tasks' },
          { label: l('Mika on GitHub', 'Mika 的 GitHub 页面'), href: 'https://github.com/wangzan101/mika' },
        ] },
      ] },
    ],
  },
  {
    slug: 'errors', group: 'help', title: l('Errors and limits', '错误与限制'),
    description: l('What each error means, and the limits that apply to your account.', '各类错误的含义，以及账户适用的限制。'),
    sections: [
      { id: 'format', title: l('Error format', '错误格式'), blocks: [
        { type: 'text', text: l('Errors return JSON. Key and account checks use {"code": "...", "message": "..."}; model errors use the format of the API you called, for example {"error": {"type": "...", "code": "...", "message": "..."}} for OpenAI-style endpoints. Some messages are in Chinese, so handle errors by HTTP status and code rather than message text.', '错误以 JSON 返回。密钥和账户检查使用 {"code": "...", "message": "..."}；模型调用错误使用所调接口的格式，例如 OpenAI 风格接口为 {"error": {"type": "...", "code": "...", "message": "..."}}。部分错误信息为中文，请根据 HTTP 状态码和 code 处理，而不是依赖信息文本。') },
      ] },
      { id: 'codes', title: l('Common errors', '常见错误'), blocks: [
        { type: 'table', headings: [l('Status', '状态'), l('Code', '代码'), l('Meaning and fix', '含义与处理')], rows: [
          [l('400', '400'), l('api_key_in_query_deprecated', 'api_key_in_query_deprecated'), l('The key was sent in the URL. Send it in the Authorization header.', '密钥放在了 URL 中。请改用 Authorization 请求头。')],
          [l('400', '400'), l('—', '—'), l('Invalid JSON, a missing model, or a parameter the model does not accept.', 'JSON 无效、缺少 model，或参数不被模型接受。')],
          [l('401', '401'), l('API_KEY_REQUIRED, INVALID_API_KEY', 'API_KEY_REQUIRED、INVALID_API_KEY'), l('No key, or the key does not exist. Check the Bearer header.', '缺少密钥或密钥不存在。请检查 Bearer 请求头。')],
          [l('401', '401'), l('API_KEY_DISABLED, USER_INACTIVE', 'API_KEY_DISABLED、USER_INACTIVE'), l('The key or the account is turned off.', '密钥或账户已停用。')],
          [l('403', '403'), l('INSUFFICIENT_BALANCE, billing_error', 'INSUFFICIENT_BALANCE、billing_error'), l('The balance is zero or below. Top up.', '余额为零或负数。请充值。')],
          [l('403', '403'), l('API_KEY_EXPIRED', 'API_KEY_EXPIRED'), l('The key passed its expiry date. Extend it or create a new key.', '密钥已过期。请延长有效期或创建新密钥。')],
          [l('403', '403'), l('ACCESS_DENIED', 'ACCESS_DENIED'), l('Your IP is outside the key’s allowlist or on its blocklist.', '你的 IP 不在密钥白名单中或在黑名单中。')],
          [l('403', '403'), l('GROUP_DISABLED, GROUP_NOT_ALLOWED', 'GROUP_DISABLED、GROUP_NOT_ALLOWED'), l('The key’s route is off or no longer available to you. Move the key to a plan or another route.', '密钥所在线路已停用或不再对你开放。请将密钥改为方案或其他线路。')],
          [l('404', '404'), l('MODEL_NOT_IN_PLAN', 'MODEL_NOT_IN_PLAN'), l('No route of the key’s plan offers the model on this endpoint. Run GET /v1/models with the same key.', '密钥所用方案中没有线路在此接口提供该模型。请用同一密钥调用 GET /v1/models。')],
          [l('404', '404'), l('model_not_found', 'model_not_found'), l('The model is not on the key’s pinned route. Run GET /v1/models with the same key.', '模型不在密钥固定的线路中。请用同一密钥调用 GET /v1/models。')],
          [l('404', '404'), l('—', '—'), l('The endpoint is not available for the key’s route, for example images with a key pinned to the Qwen route.', '该接口不适用于密钥所在线路，例如使用固定在 Qwen 线路上的密钥调用图片接口。')],
          [l('413', '413'), l('—', '—'), l('The request body is larger than the limit.', '请求体超过大小限制。')],
          [l('429', '429'), l('API_KEY_QUOTA_EXHAUSTED, insufficient_quota', 'API_KEY_QUOTA_EXHAUSTED、insufficient_quota'), l('The key used its whole quota. Raise or reset the quota.', '密钥额度已用完。请提高或重置额度。')],
          [l('429', '429'), l('rate_limit_exceeded', 'rate_limit_exceeded'), l('A 5-hour, daily, 7-day or 30-day spending window is used up, or the per-minute request limit was hit. Wait for Retry-After or the window to end. On /v1/chat/completions, error.code says which: key_window_full (the key’s window), quota_exhausted (your platform quota) or rate_limited (the per-minute limit).', '5 小时、每日、7 天或 30 天周期限额已用完，或触发每分钟请求数限制。请按 Retry-After 等待或等到周期结束。在 /v1/chat/completions 上，error.code 会说明原因：key_window_full（密钥的周期限额）、quota_exhausted（平台额度）或 rate_limited（每分钟请求数限制）。')],
          [l('429', '429'), l('rate_limited', 'rate_limited'), l('Too many requests at once, or the upstream is rate limited. Lower your parallelism and retry after a short wait.', '同时请求过多，或上游限流。请降低并发，稍等后重试。')],
          [l('429', '429'), l('INVALID_AUTH_RATE_LIMITED', 'INVALID_AUTH_RATE_LIMITED'), l('Too many requests with invalid keys from your address. Fix the key and wait for Retry-After.', '来自你的地址的无效密钥请求过多。请修正密钥并按 Retry-After 等待。')],
          [l('502, 503', '502、503'), l('upstream_error, api_error', 'upstream_error、api_error'), l('The upstream service failed or is busy. Retry with backoff.', '上游服务出错或繁忙。请退避后重试。')],
        ] },
      ] },
      { id: 'limits', title: l('Limits', '限制'), blocks: [
        { type: 'table', headings: [l('Limit', '限制'), l('Value', '值')], rows: [
          [l('Concurrent requests', '并发请求'), l('5 per account by default, shared by all keys. Extra requests wait up to 30 seconds for a free slot, then return 429.', '默认每个账户 5 个，所有密钥共享。超出的请求最多等待 30 秒，之后返回 429。')],
          [l('Request body', '请求体大小'), l('256 MB for most endpoints; 20 MB per uploaded image file.', '大多数接口为 256 MB；每个上传图片文件 20 MB。')],
          [l('Responses WebSocket', 'Responses WebSocket'), l('64 connections per key.', '每个密钥 64 个连接。')],
          [l('Idle stream', '流式空闲'), l('A stream with no data for 180 seconds is closed.', '流式传输 180 秒无数据时会被关闭。')],
          [l('Spending', '消费'), l('The quota and spending windows you set on each key.', '各密钥上设置的额度与周期限额。')],
        ] },
      ] },
      { id: 'retries', title: l('Retrying safely', '安全重试'), blocks: [
        { type: 'list', items: [
          l('Retry 429 and 5xx responses with exponential backoff, and honor Retry-After when it is present.', '对 429 和 5xx 响应使用指数退避重试，如有 Retry-After 请遵循。'),
          l('Do not retry other 4xx responses unchanged; fix the request first.', '其他 4xx 响应请先修正请求，不要原样重试。'),
          l('Before repeating a request that may have completed, check the Usage page so you are not charged twice.', '重复可能已完成的请求前，请先查看「使用记录」，避免重复计费。'),
        ] },
      ] },
    ],
  },
  {
    slug: 'troubleshooting', group: 'help', title: l('Troubleshooting', '常见问题'),
    description: l('Fixes for the problems people run into most often.', '最常见问题的解决方法。'),
    sections: [
      { id: 'model', title: l('“Model is not available for this group”', '“Model is not available for this group”'), blocks: [
        { type: 'text', text: l('The key is pinned to a route that does not offer that model. Run GET /v1/models with the same key and use an id from the list, or move the key to the Best price plan, which reaches every public route.', '密钥固定的线路不提供该模型。请用同一密钥调用 GET /v1/models 并使用列表中的 id，或将密钥改为「最优价格」方案，它可调用所有公开线路。') },
      ] },
      { id: 'balance', title: l('Requests fail with insufficient balance', '提示余额不足'), blocks: [
        { type: 'text', text: l('Requests stop when the balance reaches zero, even if the key still has quota. Top up; a long request just before may have taken the balance slightly below zero.', '余额归零后请求会停止，即使密钥仍有额度。请充值；此前较长的请求可能已使余额略低于零。') },
        { type: 'links', items: [{ label: l('Top up', '充值'), href: '/purchase' }] },
      ] },
      { id: 'codex-login', title: l('Codex keeps asking you to sign in', 'Codex 仍然要求登录'), blocks: [
        { type: 'text', text: l('Confirm model_provider is tokensbeat, requires_openai_auth is false, and TOKENSBEAT_API_KEY exists in the process that starts Codex. Check for another configuration overriding your provider, then restart the client.', '确认 model_provider 为 tokensbeat，requires_openai_auth 为 false，且启动 Codex 的进程能读取 TOKENSBEAT_API_KEY。检查是否有其他配置覆盖服务商设置，然后重启客户端。') },
      ] },
      { id: 'claude-code', title: l('Claude Code returns 403 or 404', 'Claude Code 返回 403 或 404'), blocks: [
        { type: 'text', text: l('A 403 about /v1/messages dispatch means the key is pinned to the OpenAI · Discount route; use a Best price key or a key pinned to the Claude · Discount or Qwen route. A 404 (model_not_found or MODEL_NOT_IN_PLAN) means Claude Code asked for a model the key cannot call: with a Claude key, set ANTHROPIC_MODEL to a Claude model ID that GET /v1/models lists; with a Qwen route key, set ANTHROPIC_MODEL and every ANTHROPIC_DEFAULT_*_MODEL variable to qwen3.8.', '与 /v1/messages dispatch 相关的 403 表示密钥固定在 OpenAI · Discount 线路上，请改用「最优价格」密钥，或固定在 Claude · Discount 或 Qwen 线路上的密钥。404（model_not_found 或 MODEL_NOT_IN_PLAN）表示 Claude Code 请求了密钥无法调用的模型：使用 Claude 密钥时，请将 ANTHROPIC_MODEL 设为 GET /v1/models 列出的 Claude 模型 ID；使用 Qwen 线路密钥时，请将 ANTHROPIC_MODEL 和所有 ANTHROPIC_DEFAULT_*_MODEL 变量设为 qwen3.8。') },
        { type: 'links', items: [{ label: l('Claude Code setup', 'Claude Code 配置'), href: '/docs/claude-code' }] },
      ] },
      { id: 'url', title: l('The app reports 404 for every request', '应用的每个请求都返回 404'), blocks: [
        { type: 'text', text: l('The URL probably contains /v1 twice, or none at all. API clients need https://api.tokensbeat.com/v1; apps that append /v1 themselves need https://api.tokensbeat.com; Claude Code needs https://api.tokensbeat.com.', '地址中可能出现了两次 /v1，或缺少 /v1。API 客户端应使用 https://api.tokensbeat.com/v1；会自动添加 /v1 的应用应使用 https://api.tokensbeat.com；Claude Code 应使用 https://api.tokensbeat.com。') },
      ] },
      { id: 'order-permission', title: l('A payment page says you have no permission', '支付页面提示无权限'), blocks: [
        { type: 'text', text: l('The order belongs to a different account than the one now signed in, usually because you signed in to another account in the same browser. Sign back in to the account that created the order, or let the order expire and create a new one.', '该订单属于另一个账户，而不是当前登录的账户，通常是因为在同一浏览器中登录了其他账户。请重新登录创建订单的账户，或等订单过期后重新下单。') },
      ] },
      { id: 'support', title: l('Share useful diagnostics', '提供有效的排查信息'), blocks: [
        { type: 'text', text: l('When you ask for help, include the request time, key name, model, endpoint, HTTP status, error code and message, and the x-request-id response header if your client shows it. Remove sensitive prompt content, and never include your full API key.', '寻求帮助时，请提供请求时间、密钥名称、模型、接口、HTTP 状态、错误代码与信息，以及客户端可见的 x-request-id 响应头。请移除敏感提示词内容，不要附带完整 API 密钥。') },
        keyLinks,
      ] },
    ],
  },
]
