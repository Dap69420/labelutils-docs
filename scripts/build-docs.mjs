import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const docsRoot = path.join(root, "docs");
const outRoot = path.join(root, "site-dist");

const navigation = [
  {
    group: "Get Started",
    pages: [
      ["Welcome", "Get Started/welcome.mdx", "/"],
      ["Getting started", "Get Started/getting-started.mdx", "/getting-started"],
    ],
  },
  {
    group: "For artists",
    pages: [["Artist guide", "For artists/artist-guide.mdx", "/artist-guide"]],
  },
  {
    group: "For staff",
    pages: [
      ["Staff workflow", "For staff/staff-workflow.mdx", "/staff-workflow"],
      ["Support tickets", "For staff/support-tickets.mdx", "/support-tickets"],
    ],
  },
  {
    group: "Premium",
    pages: [
      ["Free vs Pro", "Premium/free-vs-pro.mdx", "/free-vs-pro"],
      ["Planned Pro+", "Premium/pro-plus.mdx", "/pro-plus"],
    ],
  },
  {
    group: "Reference",
    pages: [
      ["Commands", "Reference/commands.mdx", "/commands"],
      ["FAQ", "Reference/faq.mdx", "/faq"],
    ],
  },
];

const flatPages = navigation.flatMap((section) =>
  section.pages.map(([label, file, href]) => ({ label, file, href, group: section.group })),
);

const pageIcons = {
  "/": "home",
  "/welcome": "home",
  "/getting-started": "rocket",
  "/artist-guide": "music",
  "/staff-workflow": "users",
  "/support-tickets": "ticket",
  "/free-vs-pro": "star",
  "/pro-plus": "sparkles",
  "/commands": "terminal",
  "/faq": "help",
};

const groupIcons = {
  "Get Started": "rocket",
  "For artists": "music",
  "For staff": "users",
  Premium: "star",
  Reference: "terminal",
};

const iconPaths = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>',
  rocket: '<path d="M4.5 16.5c-1 1.1-1.5 2.6-1.5 4.5 1.9 0 3.4-.5 4.5-1.5"/><path d="M9 15 7 17l-2-2 2-2"/><path d="M14 10l-4 4 4 4 4-4c2.5-2.5 3.6-6 3-11-5-.6-8.5.5-11 3Z"/><circle cx="15" cy="9" r="1.5"/>',
  music: '<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  ticket: '<path d="M3 9V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>',
  sparkles: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="m19 15 .7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9Z"/><path d="m5 3 .7 2.1L8 6l-2.3.9L5 9l-.7-2.1L2 6l2.3-.9Z"/>',
  terminal: '<path d="m4 17 6-5-6-5"/><path d="M12 19h8"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.7 2.7 0 1 1 4.4 2.1c-1.2.9-1.9 1.5-1.9 2.9"/><path d="M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  note: '<path d="M4 4h11l5 5v11H4Z"/><path d="M15 4v5h5"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  tip: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.5 14a6 6 0 1 1 7 0c-.8.7-1.2 1.5-1.4 2H9.9c-.2-.5-.6-1.3-1.4-2Z"/>',
  warning: '<path d="M12 3 2 21h20Z"/><path d="M12 9v5"/><path d="M12 17h.01"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
};

function icon(name, className = "icon") {
  const paths = iconPaths[name] || iconPaths.info;
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function cleanText(value) {
  return value
    .replaceAll("â€”", "-")
    .replaceAll("â€“", "-")
    .replaceAll("âœ…", "Included")
    .replaceAll("âŒ", "Not included")
    .replaceAll("Â·", "-")
    .replaceAll("Â", "")
    .replaceAll("�", "")
    .replaceAll("\\+", "+")
    .replace(/\r\n/g, "\n");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return [{}, source];
  const data = {};
  for (const line of match[1].split("\n")) {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*"?([^"]*)"?$/);
    if (item) data[item[1]] = item[2];
  }
  return [data, source.slice(match[0].length)];
}

function attrValue(attrs, name) {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : "";
}

function dedent(value) {
  const lines = value.replace(/\s+$/, "").split("\n");
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^\s*/)?.[0].length || 0);
  const minIndent = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(minIndent)).join("\n").trim();
}

function convertComponents(source, stashHtml) {
  let text = source;

  text = text.replace(
    /<CardGroup[^>]*>([\s\S]*?)<\/CardGroup>/g,
    (_match, body) => {
      const cards = [];
      body.replace(/<Card\s+([^>]*)>([\s\S]*?)<\/Card>/g, (_card, attrs, content) => {
        cards.push({
          title: attrValue(attrs, "title"),
          href: attrValue(attrs, "href"),
          icon: attrValue(attrs, "icon") || pageIcons[attrValue(attrs, "href")] || "info",
          body: renderInline(content.trim()),
        });
        return "";
      });
      return stashHtml(`<div class="card-grid">${cards
        .map(
          (card) =>
            `<a class="doc-card" href="${escapeHtml(card.href)}"><span class="card-icon">${icon(card.icon)}</span><strong>${escapeHtml(card.title)}</strong><span>${card.body}</span></a>`,
        )
        .join("")}</div>`);
    },
  );

  text = text.replace(
    /<Steps[^>]*>([\s\S]*?)<\/Steps>/g,
    (_match, body) => {
      const steps = [];
      body.replace(/<Step\s+([^>]*)>([\s\S]*?)<\/Step>/g, (_step, attrs, content) => {
        steps.push({
          title: attrValue(attrs, "title"),
          body: renderBlocks(dedent(content)),
        });
        return "";
      });
      return stashHtml(`<div class="steps">${steps
        .map(
          (step, index) =>
            `<section class="step"><span class="step-number">${index + 1}</span><div><h3>${escapeHtml(step.title)}</h3>${step.body}</div></section>`,
        )
        .join("")}</div>`);
    },
  );

  text = text.replace(
    /<AccordionGroup[^>]*>([\s\S]*?)<\/AccordionGroup>/g,
    (_match, body) => {
      const items = [];
      body.replace(/<Accordion\s+([^>]*)>([\s\S]*?)<\/Accordion>/g, (_accordion, attrs, content) => {
        items.push({
          title: attrValue(attrs, "title"),
          body: renderBlocks(dedent(content)),
        });
        return "";
      });
      return stashHtml(`<div class="accordion">${items
        .map(
          (item) =>
            `<details><summary>${escapeHtml(item.title)}</summary><div>${item.body}</div></details>`,
        )
        .join("")}</div>`);
    },
  );

  text = text.replace(
    /<(Info|Note|Tip|Warning)[^>]*>([\s\S]*?)<\/\1>/g,
    (_match, kind, body) =>
      stashHtml(`<aside class="callout callout-${kind.toLowerCase()}"><div class="callout-title">${icon(kind.toLowerCase())}<strong>${kind}</strong></div>${renderBlocks(dedent(body))}</aside>`),
  );

  return text;
}

function renderInline(value) {
  let text = escapeHtml(cleanText(value.trim()));
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return text;
}

function renderTable(lines) {
  const rows = lines
    .filter((line, index) => index !== 1)
    .map((line) => line.trim().slice(1, -1).split("|").map((cell) => renderInline(cell.trim())));
  const [head, ...body] = rows;
  return `<div class="table-wrap"><table><thead><tr>${head
    .map((cell) => `<th>${cell}</th>`)
    .join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderBlocks(source) {
  const htmlBlocks = [];
  let text = cleanText(source);
  const placeholders = [];
  const stashHtml = (html) => {
    const key = `@@HTML_${placeholders.length}@@`;
    placeholders.push(html);
    return `\n${key}\n`;
  };
  text = convertComponents(text, stashHtml);

  const lines = text.split("\n");
  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("@@HTML_")) {
      htmlBlocks.push(placeholders[Number(line.match(/@@HTML_(\d+)@@/)?.[1] || 0)]);
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim() || "text";
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      htmlBlocks.push(`<pre><code data-language="${escapeHtml(language)}">${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^#{1,4}\s/.test(line)) {
      const level = line.match(/^#+/)?.[0].length || 2;
      const title = line.replace(/^#{1,4}\s*/, "");
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      htmlBlocks.push(`<h${level} id="${id}">${renderInline(title)}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.trim().startsWith("|") && lines[index + 1]?.includes("---")) {
      const tableLines = [line];
      index += 1;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      htmlBlocks.push(renderTable(tableLines));
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }
      htmlBlocks.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }
      htmlBlocks.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,4}\s/.test(lines[index]) &&
      !lines[index].startsWith("```") &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith("|") &&
      !lines[index].startsWith("@@HTML_")
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    htmlBlocks.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return htmlBlocks.join("\n");
}

function sidebar(currentHref) {
  return navigation
    .map(
      (section) =>
        `<section class="nav-section"><h2>${icon(groupIcons[section.group] || "info", "section-icon")}${escapeHtml(section.group)}</h2>${section.pages
          .map(([label, _file, href]) => {
            const active = href === currentHref || (currentHref === "/" && href === "/");
            return `<a class="${active ? "active" : ""}" href="${href}">${icon(pageIcons[href] || "info", "nav-icon")}<span>${escapeHtml(label)}</span></a>`;
          })
          .join("")}</section>`,
    )
    .join("");
}

function pageShell(page, content, allPages) {
  const currentIndex = allPages.findIndex((item) => item.href === page.href);
  const prev = allPages[currentIndex - 1];
  const next = allPages[currentIndex + 1];
  const title = page.meta.title || page.label;
  const description = page.meta.description || "LabelUtils documentation";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - LabelUtils Docs</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <button class="menu-toggle" type="button" aria-label="Open navigation">Menu</button>
  <aside class="sidebar">
    <a class="brand" href="/">
      <span class="brand-mark">${icon("music", "brand-icon")}</span>
      <span><strong>LabelUtils</strong><small>Docs</small></span>
    </a>
    <nav>${sidebar(page.href)}</nav>
  </aside>
  <main class="content">
    <div class="hero">
      <span class="hero-icon">${icon(pageIcons[page.href] || groupIcons[page.group] || "info")}</span>
      <p>${escapeHtml(page.group)}</p>
      <h1>${escapeHtml(title)}</h1>
      <span>${escapeHtml(description)}</span>
    </div>
    <article class="article">${content}</article>
    <nav class="pager">
      ${prev ? `<a href="${prev.href}"><span>Previous</span><strong>${icon("arrow", "pager-icon pager-prev")}${escapeHtml(prev.label)}</strong></a>` : "<span></span>"}
      ${next ? `<a href="${next.href}"><span>Next</span><strong>${escapeHtml(next.label)}${icon("arrow", "pager-icon")}</strong></a>` : "<span></span>"}
    </nav>
  </main>
  <script src="/assets/script.js"></script>
</body>
</html>`;
}

async function writePage(route, html) {
  const targetDir = route === "/" ? outRoot : path.join(outRoot, route.replace(/^\//, ""));
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, "index.html"), html, "utf8");
}

async function build() {
  await rm(outRoot, { recursive: true, force: true });
  await mkdir(path.join(outRoot, "assets"), { recursive: true });

  const pages = [];
  for (const page of flatPages) {
    const source = await readFile(path.join(docsRoot, page.file), "utf8");
    const [meta, body] = readFrontmatter(cleanText(source));
    pages.push({ ...page, meta, body });
  }

  for (const page of pages) {
    const html = pageShell(page, renderBlocks(page.body), pages);
    await writePage(page.href, html);
    if (page.href === "/") {
      await writePage("/welcome", html);
    }
  }

  await writeFile(path.join(outRoot, "assets", "styles.css"), styles, "utf8");
  await writeFile(path.join(outRoot, "assets", "script.js"), clientScript, "utf8");
  await writeFile(
    path.join(outRoot, "sitemap.txt"),
    pages.map((page) => page.href).join("\n") + "\n",
    "utf8",
  );
}

const styles = `
:root {
  color-scheme: dark;
  --bg: #050807;
  --bg-soft: #090d0d;
  --panel: #0d1311;
  --panel-2: #121b17;
  --panel-3: #17231d;
  --text: #f0f7f3;
  --muted: #8fa39a;
  --line: #1d2a25;
  --line-strong: #2e453a;
  --brand: #16a34a;
  --brand-light: #22c55e;
  --brand-2: #38bdf8;
  --warn: #f59e0b;
  --radius: 8px;
  --shadow: 0 20px 60px rgba(0, 0, 0, 0.34);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background:
    radial-gradient(circle at 30% 0%, rgba(34, 197, 94, 0.08), transparent 34rem),
    linear-gradient(180deg, #070b0a 0%, var(--bg) 38rem);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.65;
}
a { color: inherit; }
.icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 304px;
  overflow-y: auto;
  border-right: 1px solid rgba(46, 69, 58, 0.62);
  background: rgba(6, 10, 9, 0.94);
  backdrop-filter: blur(14px);
  padding: 22px 18px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  margin-bottom: 28px;
}
.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--brand-light), #0ea5e9);
  color: #03120a;
  font-weight: 800;
  box-shadow: 0 10px 30px rgba(22, 163, 74, 0.22);
}
.brand-icon { width: 22px; height: 22px; }
.brand small { display: block; color: var(--muted); }
.nav-section { margin: 20px 0; }
.nav-section h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0;
  margin: 0 0 8px;
}
.section-icon {
  width: 14px;
  height: 14px;
  color: var(--brand-light);
}
.nav-section a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius);
  color: #cbd8d0;
  text-decoration: none;
  font-size: 14px;
  border: 1px solid transparent;
}
.nav-section a:hover, .nav-section a.active {
  background: rgba(18, 27, 23, 0.9);
  border-color: rgba(46, 69, 58, 0.74);
  color: var(--text);
}
.nav-section a.active {
  box-shadow: inset 3px 0 0 var(--brand-light);
}
.nav-icon {
  width: 16px;
  height: 16px;
  color: #86efac;
}
.content {
  margin-left: 304px;
  max-width: 1040px;
  padding: 56px 64px 80px;
}
.hero {
  position: relative;
  border-bottom: 1px solid var(--line);
  padding-bottom: 28px;
  margin-bottom: 32px;
}
.hero-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  margin-bottom: 18px;
  color: #bbf7d0;
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.22), rgba(56, 189, 248, 0.12));
  border: 1px solid rgba(74, 222, 128, 0.18);
}
.hero-icon .icon { width: 26px; height: 26px; }
.hero p {
  margin: 0 0 8px;
  color: #86efac;
  font-weight: 700;
  font-size: 14px;
}
.hero h1 {
  font-size: clamp(36px, 6vw, 64px);
  line-height: 1;
  margin: 0 0 14px;
  letter-spacing: 0;
}
.hero span { color: #aabdb5; font-size: 18px; }
.article h2 { margin-top: 36px; font-size: 28px; line-height: 1.2; }
.article h3 { margin-top: 24px; font-size: 19px; }
.article p, .article li { color: #d6e2db; }
.article a {
  color: #86efac;
  text-decoration: none;
  border-bottom: 1px solid rgba(134, 239, 172, 0.35);
}
.article code {
  background: #101815;
  border: 1px solid #22332b;
  padding: 2px 5px;
  border-radius: 5px;
  font-size: 0.92em;
}
pre {
  overflow-x: auto;
  background: #030604;
  border: 1px solid #1c2b24;
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}
pre code {
  background: transparent;
  border: 0;
  padding: 0;
}
.table-wrap { overflow-x: auto; margin: 18px 0; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th, td {
  border-bottom: 1px solid var(--line);
  padding: 11px 10px;
  text-align: left;
  vertical-align: top;
}
th { color: var(--text); background: #0c1411; }
td { color: #d6e2db; }
.callout {
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(18, 27, 23, 0.96), rgba(11, 17, 14, 0.96));
  border-radius: var(--radius);
  padding: 16px;
  margin: 20px 0;
  box-shadow: var(--shadow);
}
.callout-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 8px;
}
.callout-title .icon { width: 18px; height: 18px; color: #86efac; }
.callout-warning .callout-title .icon { color: var(--warn); }
.callout strong { display: block; }
.callout p { margin: 0; }
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 22px 0;
}
.doc-card {
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 8px;
  min-height: 126px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(180deg, rgba(18, 27, 23, 0.98), rgba(10, 15, 13, 0.98));
  text-decoration: none;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.24);
  transition: border-color 160ms ease, transform 160ms ease, background 160ms ease;
}
.doc-card:hover {
  border-color: rgba(34, 197, 94, 0.72);
  transform: translateY(-2px);
  background: linear-gradient(180deg, rgba(23, 35, 29, 0.98), rgba(12, 19, 16, 0.98));
}
.card-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #bbf7d0;
  background: rgba(22, 163, 74, 0.12);
  border: 1px solid rgba(134, 239, 172, 0.16);
}
.card-icon .icon { width: 18px; height: 18px; }
.doc-card strong { display: block; }
.doc-card span { color: var(--muted); }
.steps { display: grid; gap: 16px; margin: 22px 0; }
.step {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(180deg, rgba(18, 27, 23, 0.96), rgba(9, 14, 12, 0.96));
}
.step-number {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--brand-light), #38bdf8);
  color: #03120a;
  font-weight: 800;
}
.step h3 { margin: 0 0 8px; }
.accordion details {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(13, 19, 17, 0.94);
  margin: 12px 0;
  padding: 0 16px;
}
.accordion summary {
  cursor: pointer;
  padding: 14px 0;
  color: var(--text);
  font-weight: 700;
}
.accordion details[open] {
  border-color: rgba(34, 197, 94, 0.42);
}
.pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  border-top: 1px solid var(--line);
  margin-top: 48px;
  padding-top: 24px;
}
.pager a {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px;
  text-decoration: none;
  background: rgba(13, 19, 17, 0.94);
}
.pager a:hover {
  border-color: rgba(34, 197, 94, 0.58);
}
.pager a:last-child { text-align: right; }
.pager span { display: block; color: var(--muted); font-size: 13px; }
.pager strong {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
}
.pager a:last-child strong { justify-content: flex-end; }
.pager-icon { width: 16px; height: 16px; color: #86efac; }
.pager-prev { transform: rotate(180deg); }
.menu-toggle { display: none; }
@media (max-width: 860px) {
  .menu-toggle {
    display: block;
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 30;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 8px 12px;
    background: var(--panel);
    color: var(--text);
  }
  .sidebar {
    transform: translateX(-100%);
    transition: transform 180ms ease;
    z-index: 20;
    box-shadow: 30px 0 90px rgba(0, 0, 0, 0.45);
  }
  body.nav-open .sidebar { transform: translateX(0); }
  .content {
    margin-left: 0;
    padding: 42px 20px 56px;
  }
  .card-grid, .pager { grid-template-columns: 1fr; }
}
`;

const clientScript = `
const button = document.querySelector(".menu-toggle");
button?.addEventListener("click", () => document.body.classList.toggle("nav-open"));
document.querySelectorAll(".sidebar a").forEach((link) => {
  link.addEventListener("click", () => document.body.classList.remove("nav-open"));
});
`;

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
