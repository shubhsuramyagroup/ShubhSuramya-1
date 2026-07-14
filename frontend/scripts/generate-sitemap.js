// ─────────────────────────────────────────────────────────────────────────────
// Build-time sitemap generator.
//
// Writes public/sitemap.xml with the static marketing routes PLUS one entry per
// Firestore project (route: /project-details/:id), so dynamic project pages are
// discovered automatically.
//
// It reads projects through the Firestore REST API (public read, same access the
// client uses) — no firebase SDK bootstrapping needed in Node. It is designed to
// NEVER fail the build: on any error it falls back to the static routes only and
// always exits 0.
//
// Run automatically before `vite build` (see package.json), or on demand:
//   node scripts/generate-sitemap.js
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { SITE } from "../src/seo/siteConfig.js";

const OUT = new URL("../public/sitemap.xml", import.meta.url);
const ENV = new URL("../.env", import.meta.url);

// ── env: prefer process.env (CI/Vercel), fall back to parsing frontend/.env ──
function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(ENV, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].replace(/^["']|["']$/g, "");
      if (env[key] === undefined) env[key] = val;
    }
  } catch {
    /* no .env file — rely on process.env */
  }
  return env;
}

const env = loadEnv();
const SITE_URL = (env.SITE_URL || SITE.url).replace(/\/+$/, "");
const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID;
const API_KEY = env.VITE_FIREBASE_API_KEY;

const today = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/projects", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
];

function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
    priority ? `    <priority>${priority}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

// ── fetch project docs via Firestore REST (paginated) ──
async function fetchProjects() {
  if (!PROJECT_ID || !API_KEY || typeof fetch !== "function") return [];
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/projects`;
  const out = [];
  let pageToken = "";
  for (let i = 0; i < 20; i++) {
    const url = `${base}?key=${API_KEY}&pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    for (const doc of data.documents || []) {
      const id = String(doc.name || "").split("/").pop();
      if (id) out.push({ id, updateTime: doc.updateTime });
    }
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }
  return out;
}

async function main() {
  let projects = [];
  try {
    projects = await fetchProjects();
    console.log(`[sitemap] fetched ${projects.length} project(s) from Firestore`);
  } catch (err) {
    console.warn(`[sitemap] project fetch failed, writing static routes only: ${err?.message || err}`);
  }

  const entries = [
    ...STATIC_ROUTES.map((r) =>
      urlEntry({ loc: `${SITE_URL}${r.path}`, lastmod: today, changefreq: r.changefreq, priority: r.priority })
    ),
    ...projects.map((p) =>
      urlEntry({
        loc: `${SITE_URL}/project-details/${p.id}`,
        lastmod: p.updateTime ? p.updateTime.slice(0, 10) : today,
        changefreq: "monthly",
        priority: "0.8",
      })
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  writeFileSync(OUT, xml, "utf8");
  console.log(`[sitemap] wrote ${entries.length} URLs → public/sitemap.xml`);
}

main()
  .catch((err) => console.warn(`[sitemap] generation error (non-fatal): ${err?.message || err}`))
  .finally(() => process.exit(0));
