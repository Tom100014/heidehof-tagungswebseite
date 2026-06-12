// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://hotel-der-heidehof.de";

const today = new Date().toISOString().split("T")[0];

// Public, indexable routes. Admin routes and the multi-step conference-guests
// flow are intentionally omitted (they are gated/stateful and blocked in robots.txt).
const entries = [
  { path: "/", lastmod: today, changefreq: "weekly", priority: "1.0" },
  { path: "/tagungspauschalen", lastmod: today, changefreq: "monthly", priority: "0.9" },
  { path: "/tagungsraeume", lastmod: today, changefreq: "monthly", priority: "0.9" },
  { path: "/ausstattung-technik", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/outdoor-aktiv", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/restaurant", lastmod: today, changefreq: "weekly", priority: "0.7" },
  { path: "/ein-tag-bei-uns", lastmod: today, changefreq: "monthly", priority: "0.6" },
  { path: "/wellness", lastmod: today, changefreq: "monthly", priority: "0.9" },
  { path: "/spa", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/speisekarte", lastmod: today, changefreq: "weekly", priority: "0.8" },
  { path: "/getraenkekarte", lastmod: today, changefreq: "weekly", priority: "0.8" },
  { path: "/veranstaltungen", lastmod: today, changefreq: "weekly", priority: "0.8" },
  { path: "/menue-bestellung", lastmod: today, changefreq: "weekly", priority: "0.6" },
  { path: "/impressum", lastmod: today, changefreq: "yearly", priority: "0.3" },
  { path: "/datenschutz", lastmod: today, changefreq: "yearly", priority: "0.3" },
  { path: "/agb", lastmod: today, changefreq: "yearly", priority: "0.3" },
];

function generateSitemap(items) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
