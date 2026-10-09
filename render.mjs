/**
 * Rebuilds the guide document (guide-data.js) from pages.json and guide-copy.mjs.
 * The viewer (index.html, guide.css, guide.js) is left alone.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { copy } from "./guide-copy.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(root, "pages.json"), "utf8"));

function pageRecord(sectionName, page) {
  const extra = copy[page.id];
  if (!extra) throw new Error(`Missing copy for ${page.id}`);
  return {
    id: page.id,
    title: page.title,
    path: page.path,
    section: sectionName,
    clickTab: page.clickTab || "",
    summary: extra.summary,
    steps: extra.steps,
    tip: extra.tip || "",
    controls: extra.controls,
  };
}

const pages = [
  pageRecord("Getting started", {
    id: "welcome",
    title: "Welcome",
    path: "/store",
  }),
];
const groups = [
  {
    name: "Getting started",
    pages: [{ id: "welcome", title: "Welcome" }],
  },
];

for (const section of catalog.sections) {
  const sectionPages = section.pages.map((page) => pageRecord(section.name, page));
  pages.push(...sectionPages);
  groups.push({
    name: section.name,
    pages: section.pages.map((page) => ({ id: page.id, title: page.title })),
  });
}

const known = new Set(pages.map((page) => page.id));
const unused = Object.keys(copy).filter((id) => !known.has(id));
if (unused.length) {
  throw new Error(`Copy has no page in pages.json: ${unused.join(", ")}`);
}

const data = { pages, groups };
writeFileSync(join(root, "guide-data.js"), `window.GUIDE_DATA = ${JSON.stringify(data)};\n`);
console.log("Wrote guide-data.js", pages.length, "pages");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const nav = groups.map((group) => {
  const links = group.pages.map((page) => `<a href="#${page.id}">${escapeHtml(page.title)}</a>`).join("");
  return `<div class="group"><p>${escapeHtml(group.name)}</p>${links}</div>`;
}).join("");

const articles = pages.map((page) => {
  const steps = (page.steps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const controls = (page.controls || []).map((item, index) => {
    const name = item.name || item;
    const text = item.text || "";
    return `<article class="setting"><div class="setting-index">${String(index + 1).padStart(2, "0")}</div><div><h3>${escapeHtml(name)}</h3><p>${escapeHtml(text)}</p></div></article>`;
  }).join("");
  const where = `<div class="find"><div><span>Go to</span><span class="path">${escapeHtml(page.path)}</span></div>${page.clickTab ? `<div><span>Then choose</span>${escapeHtml(page.clickTab)}</div>` : ""}</div>`;
  const shot = existsSync(join(root, "screenshots", `${page.id}.png`))
    ? `<figure class="shot"><img src="screenshots/${page.id}.png" alt="${escapeHtml(page.title)}"><figcaption>This is the ${escapeHtml(page.title)} screen.</figcaption></figure>`
    : "";
  return `<article class="sheet" id="${page.id}">
    <p class="crumb">Guide / ${escapeHtml(page.section || "Guide")}</p>
    <p class="kicker">${escapeHtml(page.section || "Guide")}</p>
    <h1>${escapeHtml(page.title)}</h1>
    <p class="lead">${escapeHtml(page.summary)}</p>
    ${where}
    ${shot}
    ${steps ? `<h2>What to do</h2><ol class="steps">${steps}</ol>` : ""}
    ${controls ? `<h2>What you will see on the screen</h2>${controls}` : ""}
    ${page.tip ? `<div class="tip"><strong>Heads up</strong>${escapeHtml(page.tip)}</div>` : ""}
  </article>`;
}).join("\n");

const documentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Store1920 Seller Dashboard Guide</title>
  <style>
    :root { color-scheme: light; --nav:#12141a; --nav-ink:#e7e9ef; --nav-muted:#9aa3b5; --paper:#f4f1ea; --card:#fffdf9; --ink:#1c1915; --body:#3f3a33; --muted:#746c62; --line:#e6dfd2; --accent:#c45c26; --accent-soft:#fff1e6; --link:#9a4318; --good-soft:#e8f6ee; }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; color: var(--ink); background: var(--paper); text-align: left; font: 16px/1.65 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
    a { color: var(--link); }
    .app { display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: 100vh; }
    aside.nav { position: sticky; top: 0; height: 100vh; overflow: auto; background: linear-gradient(180deg, var(--nav) 0%, #181b24 100%); color: var(--nav-ink); padding: 22px 14px 36px; }
    .brand { margin: 0 8px 16px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,.08); }
    .brand b { display: block; font-size: 15px; letter-spacing: .04em; }
    .brand span { display: block; margin-top: 3px; color: var(--nav-muted); font-size: 12px; }
    .group { margin-bottom: 14px; }
    .group p { margin: 0 8px 4px; color: #b7c0d4; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .group a { display: block; border-radius: 8px; padding: 7px 10px; color: #d5dbe6; font-size: 13.5px; text-decoration: none; }
    .group a:hover { background: rgba(255,255,255,.06); color: white; }
    main { min-width: 0; padding: 36px 48px 72px; }
    .sheet { max-width: 820px; margin: 0 0 28px; background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 36px 40px 28px; box-shadow: 0 18px 50px rgba(60, 40, 20, .06); }
    .crumb, .kicker { margin: 0 0 8px; color: var(--muted); font-size: 13px; }
    .kicker { color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0 0 14px; font-size: 36px; line-height: 1.2; font-weight: 700; letter-spacing: 0; }
    .lead { margin: 0 0 18px; font-size: 16.5px; }
    .find { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 26px; }
    .find div { border: 1px solid var(--line); background: #faf7f2; border-radius: 999px; padding: 6px 12px; font-size: 13px; color: var(--body); }
    .find span { color: var(--muted); margin-right: 6px; }
    .path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; color: var(--ink); }
    h2 { margin: 8px 0 12px; font-size: 13px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
    .steps { margin: 0 0 28px; padding: 0; list-style: none; counter-reset: step; }
    .steps li { position: relative; margin: 0 0 12px; padding: 12px 14px 12px 52px; border: 1px solid var(--line); border-radius: 12px; background: #fff; color: var(--body); font-size: 15px; }
    .steps li::before { counter-increment: step; content: counter(step); position: absolute; left: 12px; top: 12px; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: white; font-size: 13px; font-weight: 700; line-height: 26px; text-align: center; }
    .setting { display: grid; grid-template-columns: 46px minmax(0, 1fr); align-items: start; gap: 12px; margin: 0 0 12px; padding: 16px 16px 14px; border: 1px solid var(--line); border-radius: 14px; background: linear-gradient(180deg, #fff 0%, #fffaf4 100%); }
    .setting-index { width: 36px; height: 36px; border-radius: 10px; background: var(--accent-soft); color: var(--accent); font-size: 13px; font-weight: 750; display: grid; place-items: center; }
    .setting h3 { margin: 2px 0 6px; font-size: 17px; }
    .setting p { margin: 0; color: var(--body); font-size: 15px; }
    .shot { margin: 28px 0 8px; }
    .shot img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 14px; background: #f6f3ee; }
    .shot figcaption { margin-top: 8px; color: var(--muted); font-size: 13px; }
    .tip { margin: 22px 0 0; border-radius: 14px; background: var(--good-soft); color: #184832; padding: 14px 16px; font-size: 14.5px; }
    .tip strong { display: block; margin-bottom: 2px; letter-spacing: .04em; font-size: 12px; text-transform: uppercase; }
    @media (max-width: 800px) {
      .app { grid-template-columns: 1fr; }
      aside.nav { position: relative; height: auto; }
      main { padding: 16px; }
      .sheet { padding: 22px 16px; }
      h1 { font-size: 32px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="nav">
      <p class="brand"><b>STORE1920</b><span>Seller dashboard guide</span></p>
      ${nav}
    </aside>
    <main>${articles}</main>
  </div>
</body>
</html>
`;

const documentPath = join(root, "documentation.html");
writeFileSync(documentPath, documentHtml);
console.log("Wrote", documentPath);
