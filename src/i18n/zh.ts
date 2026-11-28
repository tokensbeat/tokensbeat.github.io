/**
 * All the Chinese on the site, keyed by the English (src/i18n/index.tsx). The pages' words are the Vue site's own
 * (./zh-site.ts, generated with src/content/copy.ts from its English and Chinese site locales, the brand written
 * TokensBeat); the code examples' notes are its storefront's; the kit's words are the console's. i18n.test.ts renders
 * every Chinese page and fails on any English left without Chinese.
 */
import { ZH_SITE } from "./zh-site";

export const ZH: Readonly<Record<string, string>> = {
  ...ZH_SITE,
  // kit
  "kit::Copy": "复制",
  "kit::Copied": "已复制",
  "kit::Failed": "复制失败",
  "kit::Copied to the clipboard": "已复制到剪贴板",
  "kit::Could not copy: select the text and copy it": "无法复制：请选中文字后手动复制",
  "kit::Copy code": "复制代码",
  "kit::Code": "代码",
  "kit::Copy {name}": "复制 {name}",
  "kit::Loading": "加载中",
  "kit::Nothing here yet.": "暂无数据",
  "kit::Same fare": "同价",
  "kit:: and ": " 和 ",
  // the head and the foot
  "Language": "语言",
  "Switch to dark mode": "切换到深色模式",
  "Switch to light mode": "切换到浅色模式",
  "Dark mode": "深色模式",
  "Light mode": "浅色模式",
  "TokensBeat home": "TokensBeat 首页",
  // Aha's apps on the Aha page (src/page/pages/Aha.tsx)
  "Open in Aha": "在 Aha 中打开",
  // the homepage orbit
  "Pause the orbit": "暂停轨道动画",
  "Play the orbit": "播放轨道动画",
  // the AI models page's code examples (Vue storefront.ts snippets)
  "Code examples": "代码示例",
  "Merge this into your Codex config. A Best price key works, or a key pinned to an OpenAI route.":
    "将以上内容合并到 Codex 配置中。「最优价格」Key 或固定在 OpenAI 线路上的 Key 都可以用。",
  "Set TOKENSBEAT_API_KEY in your shell first.": "请先在终端中设置 TOKENSBEAT_API_KEY。",
  "Install the SDK with python -m pip install openai.": "先运行 python -m pip install openai 安装 SDK。",
  "Install the SDK with npm install openai.": "先运行 npm install openai 安装 SDK。",
  // the price maps on the homepage and the pricing page (src/page/PriceMap.tsx, src/lib/priceMap.ts) and the AI models page's link to them
  "The price map": "价格地图",
  "AI API pricing is a mess. Here's the map.": "AI API 的价格一团乱，这是地图。",
  "One line a model family, one stop a model, placed by its output price: cheaper on the left, pricier on the right, in fare zones. Where models of different families cost the same, the lines meet at an interchange. Each price is the lowest TokensBeat charges for that model, in USD per 1M tokens, live from the Service Plaza.":
    "一个模型家族一条线，一个模型一站，按输出价定位：左边便宜，右边贵，分成票价区。不同家族价格相同的模型在换乘站相遇。每个价格都是 TokensBeat 对这个模型收取的最低价，单位美元 / 每百万 token，实时取自服务广场。",
  "Price map of the models, by family and output price": "按家族和输出价绘制的模型价格地图",
  "TokensBeat's prices now, at standard hours. Point at a stop for its prices; open it in the console for the rest.":
    "TokensBeat 现在的价格，按标准时段计。指向一站看价格，在控制台中打开看更多。",
  "{n} more are in the plaza, free or without a price.": "另有 {n} 个模型在服务广场里免费或未标价。",
  "1 more is in the plaza, free or without a price.": "另有 1 个模型在服务广场里免费或未标价。",
  "USD per 1M tokens · in / out under each stop · log scale": "美元 / 每百万 token · 每站下方为输入 / 输出 · 对数刻度",
  "stop": "站",
  "priced on input": "按输入计价",
  "same fare": "同价换乘",
  "Every price, every route, as a table": "每个价格、每条线路的表格",
  "By the piece": "按件计价",
  "Models priced per image or per request cannot sit on a token axis. They have their own small map, in USD per piece; the unit is on every stop.":
    "按张或按次计价的模型放不进 token 的坐标轴，它们有自己的小地图，单位美元 / 件；每站标明单位。",
  "Price map of models priced per image or request": "按张或按次计价模型的价格地图",
  "The lowest price per image, request or second; size tiers are in the console.": "每张、每次或每秒的最低价；尺寸档位见控制台。",
  "USD per piece · log scale": "美元 / 件 · 对数刻度",
  "The price map as a list": "价格地图的列表版",
  "Priced per 1M tokens, input / output": "按每百万 token 计价，输入 / 输出",
  "Priced by the piece": "按件计价",
  "Live prices are in the Service Plaza": "实时价格在服务广场里",
  "Sign in to the console to see every model and what it costs.": "登录控制台，查看每个模型和它的价格。",
  "The map could not load just now": "地图暂时没能加载",
  "Every model's price is in the Service Plaza.": "每个模型的价格都在服务广场里。",
  "No prices to map yet": "还没有可以画进地图的价格",
  "Open the Service Plaza": "打开服务广场",
  "See the price map": "查看价格地图",
  "← Cheaper": "← 更便宜",
  "Pricier →": "更贵 →",
  "Zone {n}": "{n} 区",
  "under {price}": "低于 {price}",
  "{price} and up": "{price} 起",
  "same price, change here": "同价，可在此换乘",
  "Same fare: {names}, {fare}": "同价：{names}，{fare}",
  "{list} and {last}": "{list} 和 {last}",
  "{fare} out": "输出 {fare}",
  "from {group}": "来自 {group}",
  "Other": "其他",
  "Priced on input; output is free": "按输入计价，输出免费",
  "Input / output, USD per 1M tokens": "输入 / 输出，每百万 token 美元",
  "USD per image": "每张图片，美元",
  "USD per request": "每次请求，美元",
  "USD per second of video": "每秒视频，美元",
  "unit::image": "张",
  "unit::req": "次",
  "unit::s": "秒",
  // the social card's description (public/og)
  "TokensBeat: Galaxies of Intelligence. Born from Within. Your creation at the core, the Bedrock ring and the Vanguard orbit around it.":
    "TokensBeat：星汉灿烂，若出其里。你的创造在中心，四周是基座内环与护航外圈。",
};
