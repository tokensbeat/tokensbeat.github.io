/** dist/404.html: what the server sends for an address it has no page for, in both languages (it cannot know which). */
import { LinkButton } from "./parts";

export function NotFound() {
  return (
    <section className="h-hero h-404" aria-labelledby="nf-title">
      <div className="h-wrap h-404__in">
        <p className="h-eyebrow">
          <span>404</span>
        </p>
        <h1 id="nf-title" className="h-h1">
          <span>Page not found.</span> <em lang="zh-CN">页面不存在。</em>
        </h1>
        <p className="h-lead">There is nothing at this address. The homepage links every page of the site.</p>
        <p className="h-lead" lang="zh-CN">
          这个地址没有内容。首页有本站每个页面的入口。
        </p>
        <div className="h-actions">
          <LinkButton href="/" variant="go">
            Go to the homepage
          </LinkButton>
          <LinkButton href="/zh/">
            <span lang="zh-CN">返回中文首页</span>
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
