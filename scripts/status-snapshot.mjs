#!/usr/bin/env node
/**
 * The status page's snapshot (dist/status.json): the API gateway's and Aha's public health endpoints, probed once now,
 * each with the time. /status/ shows Aha from it ("Checked when the site was last published, at …"), because Aha lets
 * no other site read its health check, and shows Unknown once the probe is 13 hours old. scripts/prerender.mjs writes
 * it on a build unless HOME_STATUS_PROBE=0; the Pages workflow builds with the probe off, checks the build, then runs
 * this alone just before it publishes, and again on its six-hourly schedule (.github/workflows/pages.yml):
 *
 *   node scripts/status-snapshot.mjs [--dist dist]
 *
 * The file is replaced in one step (written beside it, then renamed), so nothing ever reads half of it.
 */
import { rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const STATUS_PROBES = [
  { id: "api", url: "https://api.tokensbeat.com/health" },
  { id: "aha", url: "https://aha.tokensbeat.com/healthz" },
];

/**
 * One public health endpoint, probed once: ok true/false by its answer, null when nothing answered in time.
 * @param {string} url
 */
export async function probe(url) {
  const at = new Date().toISOString();
  try {
    const res = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
    await res.text();
    return { ok: res.ok, status: res.status, checked_at: at };
  } catch {
    return { ok: null, status: 0, checked_at: at };
  }
}

/**
 * Probes every endpoint and writes <dist>/status.json; returns the snapshot.
 * @param {string} dist
 */
export async function writeStatusSnapshot(dist) {
  const results = await Promise.all(STATUS_PROBES.map(async (p) => /** @type {const} */ ([p.id, await probe(p.url)])));
  const snapshot = { version: 1, generated_at: new Date().toISOString(), probes: Object.fromEntries(results) };
  const out = path.join(dist, "status.json");
  await writeFile(`${out}.tmp`, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(`${out}.tmp`, out);
  return snapshot;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--dist");
  const dist = i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
  const snapshot = await writeStatusSnapshot(dist);
  console.log(`wrote ${path.join(dist, "status.json")}: ${Object.entries(snapshot.probes).map(([id, p]) => `${id} ${p.ok}`).join(", ")}`);
}
