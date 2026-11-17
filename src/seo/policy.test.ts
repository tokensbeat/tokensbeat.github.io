import { contentSecurityPolicy, policyTags, REFERRER_POLICY } from "./policy";

const directive = (policy: string, name: string) => policy.split("; ").find((d) => d.startsWith(`${name} `));

describe("the pages' policy (<meta> tags)", () => {
  it("allows this origin, the inline scripts by hash and the API origin the live checks call", () => {
    const policy = contentSecurityPolicy(["sha256-a", "sha256-b"], ["https://api.tokensbeat.com"]);
    expect(directive(policy, "default-src")).toBe("default-src 'self'");
    expect(directive(policy, "script-src")).toBe("script-src 'self' https://static.cloudflareinsights.com 'sha256-a' 'sha256-b'");
    expect(directive(policy, "connect-src")).toBe("connect-src 'self' https://api.tokensbeat.com https://cloudflareinsights.com");
    expect(directive(policy, "object-src")).toBe("object-src 'none'");
    expect(policy).not.toMatch(/\*|'unsafe-eval'|https:(?!\/\/)/);
  });

  it("allows Cloudflare Web Analytics' beacon and nothing wider", () => {
    const policy = contentSecurityPolicy(["sha256-a"], ["https://api.tokensbeat.com"]);
    // The beacon's script origin may only load scripts; its report origin may only be connected to.
    expect(directive(policy, "connect-src")).not.toContain("static.cloudflareinsights.com");
    expect(policy.split("; ").filter((d) => d.includes("cloudflareinsights.com")).map((d) => d.split(" ")[0])).toEqual(["script-src", "connect-src"]);
  });

  it("leaves out what a <meta> policy cannot say", () => {
    const policy = contentSecurityPolicy([]);
    for (const name of ["frame-ancestors", "report-uri", "sandbox"]) expect(directive(policy, name)).toBeUndefined();
  });

  it("writes the policy and the referrer policy as tags whose attribute it cannot end", () => {
    const tags = policyTags({ hashes: ["sha256-YWJj+/="], apiOrigin: "https://api.tokensbeat.com" });
    const [csp, referrer] = tags.split("\n").map((l) => l.trim());
    expect(csp).toBe(`<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(["sha256-YWJj+/="], ["https://api.tokensbeat.com"])}" />`);
    expect(csp.match(/"/g)).toHaveLength(4);
    expect(referrer).toBe(`<meta name="referrer" content="${REFERRER_POLICY}" />`);
    expect(directive(policyTags({ hashes: [] }).split('content="')[1], "connect-src")).toBe("connect-src 'self' https://cloudflareinsights.com");
  });

  it("refuses an API origin that is not an https origin, and a hash that is not one", () => {
    expect(() => policyTags({ hashes: [], apiOrigin: "http://api.tokensbeat.com" })).toThrow();
    expect(() => policyTags({ hashes: [], apiOrigin: "https://api.tokensbeat.com/v1" })).toThrow();
    expect(() => policyTags({ hashes: [], apiOrigin: "https://x.example; script-src *" })).toThrow();
    expect(() => policyTags({ hashes: ["sha256-a' 'unsafe-inline"] })).toThrow();
  });
});
