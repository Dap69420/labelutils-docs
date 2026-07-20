import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const docsRoot = path.join(root, "docs");
const outRoot = path.join(root, "site-dist");
const logoSource = path.join(docsRoot, "logo.png");

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
      ["Dashboard", "For staff/dashboard.mdx", "/dashboard"],
    ],
  },
  {
    group: "Premium",
    pages: [
      ["Free vs Pro", "Premium/free-vs-pro.mdx", "/free-vs-pro"],
      ["Pro+", "Premium/pro-plus.mdx", "/pro-plus"],
    ],
  },
  {
    group: "Reference",
    pages: [
      ["Commands", "Reference/commands.mdx", "/commands"],
      ["FAQ", "Reference/faq.mdx", "/faq"],
      ["Developer API", "Reference/api.md", "/api"],
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
  "/dashboard": "terminal",
  "/free-vs-pro": "star",
  "/pro-plus": "sparkles",
  "/commands": "terminal",
  "/faq": "help",
  "/api": "terminal",
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
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
  newspaper: '<path d="M4 22h14a2 2 0 0 0 2-2V7H4v15Z"/><path d="M4 7V5a2 2 0 0 1 2-2h12v4"/><path d="M8 11h8"/><path d="M8 15h8"/><path d="M8 19h5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><rect x="4" y="4" width="11" height="11" rx="2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
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
    /<Button\s+([^>]*)>([\s\S]*?)<\/Button>/g,
    (_match, attrs, body) => {
      const href = attrValue(attrs, "href") || "#";
      return stashHtml(`<a class="doc-button" href="${escapeHtml(href)}">${renderInline(body.trim())}</a>`);
    },
  );

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
    .map((line) =>
      line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((cell) => renderTableCell(cell.trim())),
    );
  const [head, ...body] = rows;
  return `<div class="table-wrap"><table><thead><tr>${head
    .map((cell) => `<th>${cell}</th>`)
    .join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderTableCell(value) {
  if (value === "✓") {
    return '<span class="feature-mark feature-yes" aria-label="Included">&check;</span>';
  }
  if (value === "✕" || value === "×") {
    return '<span class="feature-mark feature-no" aria-label="Not included">&times;</span>';
  }
  if (value === "Yes") {
    return '<span class="feature-mark feature-yes" aria-label="Included">&check;</span>';
  }
  if (value === "No") {
    return '<span class="feature-mark feature-no" aria-label="Not included">&times;</span>';
  }
  return renderInline(value);
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

function plainTextFromMdx(source) {
  return cleanText(source)
    .replace(/^---\n[\s\S]*?\n---\n?/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>|[\]()]|https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sidebar(currentHref) {
  return navigation
    .map(
      (section) =>
        `<section class="nav-section"><h2>${icon(groupIcons[section.group] || "info", "section-icon")}${escapeHtml(section.group)}</h2>${section.pages
          .map(([label, _file, href]) => {
            const active = href === currentHref || (currentHref === "/" && href === "/");
            return `<a class="${active ? "active" : ""}" href="${href}"><span>${escapeHtml(label)}</span></a>`;
          })
          .join("")}</section>`,
    )
    .join("");
}

function extractToc(content) {
  const headings = [];
  content.replace(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g, (_match, level, id, title) => {
    const cleanTitle = title.replace(/<[^>]*>/g, "").trim();
    if (cleanTitle) headings.push({ level: Number(level), id, title: cleanTitle });
    return "";
  });
  return headings;
}

function tocMarkup(content) {
  const headings = extractToc(content).slice(0, 12);
  if (!headings.length) {
    return `<p class="toc-empty">No sections yet.</p>`;
  }
  return headings
    .map((heading) => `<a class="toc-depth-${heading.level}" href="#${heading.id}">${escapeHtml(heading.title)}</a>`)
    .join("");
}

function pageShell(page, content, allPages) {
  const currentIndex = allPages.findIndex((item) => item.href === page.href);
  const prev = allPages[currentIndex - 1];
  const next = allPages[currentIndex + 1];
  const title = page.meta.title || page.label;
  const description = page.meta.description || "Vektra documentation";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - Vektra Docs</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="icon" type="image/png" href="/assets/logo.png">
  <link rel="apple-touch-icon" href="/assets/logo.png">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <header class="topbar">
    <a class="top-brand" href="/">
      <img src="/assets/logo.png" alt="" class="top-logo">
      <strong>Vektra</strong>
      <span>Docs</span>
    </a>
    <div class="top-actions">
      <button class="search-trigger" type="button" data-open-search>${icon("search")}<span>Search...</span><kbd>Ctrl K</kbd></button>
      <button class="assistant-trigger" type="button" data-open-assistant>${icon("sparkles")}<span>Ask Assistant</span></button>
    </div>
    <nav class="top-links" aria-label="Primary">
      <a href="https://vektra.games">Dashboard</a>
      <a href="https://discord.gg/Hysd3GSQxQ">Support</a>
      <a class="dashboard-link" href="https://discord.com/oauth2/authorize?client_id=1513286315201007737&permissions=4503926112110592&integration_type=0&scope=bot%20applications.commands">Invite</a>
      <button class="theme-button" type="button" aria-label="Dark theme">${icon("moon")}</button>
      <button class="menu-toggle" type="button" aria-label="Open navigation">${icon("menu")}</button>
    </nav>
  </header>
  <aside class="sidebar">
    <div class="sidebar-shortcuts">
      <a href="/">${icon("book", "shortcut-icon")}<span>Documentation</span></a>
      <a href="/commands">${icon("newspaper", "shortcut-icon")}<span>Commands</span></a>
    </div>
    <nav>${sidebar(page.href)}</nav>
  </aside>
  <div class="layout">
    <main class="content">
      <article class="article">
        <p class="eyebrow">${escapeHtml(page.group)}</p>
        <div class="article-header">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p class="page-description">${escapeHtml(description)}</p>
          </div>
          <button class="copy-page" type="button" data-copy-page>${icon("copy")}<span>Copy page</span></button>
        </div>
        ${content}
      </article>
      <nav class="pager">
        ${prev ? `<a href="${prev.href}"><span>Previous</span><strong>${icon("arrow", "pager-icon pager-prev")}${escapeHtml(prev.label)}</strong></a>` : "<span></span>"}
        ${next ? `<a href="${next.href}"><span>Next</span><strong>${escapeHtml(next.label)}${icon("arrow", "pager-icon")}</strong></a>` : "<span></span>"}
      </nav>
      <footer class="footer">
        <span>Vektra Docs</span>
        <span>Built for labels, artists, and staff teams.</span>
      </footer>
    </main>
    <aside class="toc" aria-label="On this page">
      <h2>${icon("menu", "toc-icon")}On this page</h2>
      ${tocMarkup(content)}
    </aside>
  </div>
  <div class="search-dialog" data-search-dialog hidden>
    <div class="dialog-backdrop" data-close-dialog></div>
    <section class="search-panel" role="dialog" aria-modal="true" aria-label="Search docs">
      <label>${icon("search")}<input type="search" data-search-input placeholder="Search docs..." autocomplete="off"></label>
      <div class="search-results" data-search-results></div>
    </section>
  </div>
  <section class="assistant-panel" data-assistant-panel hidden aria-label="Ask Assistant">
    <div class="assistant-header">
      <strong>Ask Assistant</strong>
      <button type="button" data-close-assistant>Close</button>
    </div>
    <div class="assistant-messages" data-assistant-messages>
      <p class="assistant-empty">Ask about setup, commands, premium tiers, tickets, or artist submissions.</p>
    </div>
  </section>
  <form class="assistant-composer" data-assistant-form>
    <input name="question" data-assistant-input autocomplete="off" placeholder="Ask a question...">
    <kbd>Ctrl I</kbd>
    <button type="submit" aria-label="Send question">${icon("send")}</button>
  </form>
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
    path.join(outRoot, "assets", "search-index.json"),
    JSON.stringify(
      pages.map((page) => ({
        title: page.meta.title || page.label,
        description: page.meta.description || "",
        group: page.group,
        href: page.href,
        text: plainTextFromMdx(page.body).slice(0, 4000),
      })),
      null,
      2,
    ),
    "utf8",
  );
  await copyFile(logoSource, path.join(outRoot, "assets", "logo.png")).catch(() => {});
  await writeFile(
    path.join(outRoot, "sitemap.txt"),
    pages.map((page) => page.href).join("\n") + "\n",
    "utf8",
  );
}

const styles = `
:root {
  color-scheme: dark;
  --bg: #090d0d;
  --panel: #0f1513;
  --panel-2: #141c18;
  --text: #eef5f1;
  --muted: #96a79f;
  --line: #26332d;
  --brand: #16a34a;
  --brand-light: #22c55e;
  --warn: #f59e0b;
  --radius: 8px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
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
  width: 286px;
  overflow-y: auto;
  border-right: 1px solid var(--line);
  background: #0b100e;
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
  display: block;
  border-radius: 8px;
  background: #06100b;
  color: #03120a;
  font-weight: 800;
  overflow: hidden;
  border: 1px solid var(--line);
}
.brand-logo {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
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
  background: var(--panel-2);
  border-color: var(--line);
  color: var(--text);
}
.nav-section a.active {
  box-shadow: inset 3px 0 0 var(--brand-light);
}
.nav-icon {
  width: 16px;
  height: 16px;
  color: var(--brand-light);
}
.content {
  margin-left: 286px;
  max-width: 980px;
  padding: 46px 56px 72px;
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
  margin-bottom: 16px;
  color: var(--brand-light);
  background: var(--panel);
  border: 1px solid var(--line);
}
.hero-icon .icon { width: 26px; height: 26px; }
.hero p {
  margin: 0 0 8px;
  color: var(--brand-light);
  font-weight: 700;
  font-size: 14px;
}
.hero h1 {
  font-size: clamp(36px, 6vw, 64px);
  line-height: 1;
  margin: 0 0 14px;
  letter-spacing: 0;
}
.hero span { color: var(--muted); font-size: 18px; }
.article h2 { margin-top: 36px; font-size: 28px; line-height: 1.2; }
.article h3 { margin-top: 24px; font-size: 19px; }
.article p, .article li { color: #d6e2db; }
.article a {
  color: var(--brand-light);
  text-decoration: none;
  border-bottom: 1px solid rgba(34, 197, 94, 0.35);
}
.article .doc-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  margin: 10px 0 4px;
  padding: 8px 14px;
  border: 1px solid var(--brand);
  border-radius: var(--radius);
  background: var(--brand);
  color: #04130a;
  font-weight: 700;
  text-decoration: none;
}
.article .doc-button:hover {
  background: var(--brand-light);
}
.article code {
  background: #121a16;
  border: 1px solid var(--line);
  padding: 2px 5px;
  border-radius: 5px;
  font-size: 0.92em;
}
pre {
  overflow-x: auto;
  background: #070b09;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
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
th { color: var(--text); background: var(--panel); }
td { color: #d6e2db; }
.feature-mark {
  width: 24px;
  height: 24px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  font-weight: 800;
  line-height: 1;
}
.feature-yes {
  color: #052e16;
  background: var(--brand-light);
}
.feature-no {
  color: #fecaca;
  background: #3b1618;
  border: 1px solid #7f1d1d;
}
.callout {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: var(--radius);
  padding: 16px;
  margin: 20px 0;
}
.callout-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 8px;
}
.callout-title .icon { width: 18px; height: 18px; color: var(--brand-light); }
.callout-warning .callout-title .icon { color: var(--warn); }
.callout-title strong { display: block; }
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
  background: var(--panel);
  text-decoration: none;
}
.doc-card:hover {
  border-color: var(--brand);
  background: var(--panel-2);
}
.card-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--brand-light);
  background: #101815;
  border: 1px solid var(--line);
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
  background: var(--panel);
}
.step-number {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--brand-light);
  color: #03120a;
  font-weight: 800;
}
.step h3 { margin: 0 0 8px; }
.accordion details {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
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
  border-color: var(--brand);
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
  background: var(--panel);
}
.pager a:hover {
  border-color: var(--brand);
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
.pager-icon { width: 16px; height: 16px; color: var(--brand-light); }
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
  }
  body.nav-open .sidebar { transform: translateX(0); }
  .content {
    margin-left: 0;
    padding: 42px 20px 56px;
  }
  .card-grid, .pager { grid-template-columns: 1fr; }
}
.topbar {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 40;
  height: 58px;
  display: grid;
  grid-template-columns: 280px minmax(320px, 1fr) auto;
  align-items: center;
  gap: 22px;
  padding: 0 28px;
  border-bottom: 1px solid rgba(38, 51, 45, 0.72);
  background: rgba(7, 12, 10, 0.92);
  backdrop-filter: blur(18px);
}
.top-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  min-width: 0;
}
.top-logo {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  object-fit: cover;
}
.top-brand strong {
  font-size: 22px;
  line-height: 1;
}
.top-brand span {
  color: var(--muted);
  font-weight: 700;
}
.top-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.search-trigger,
.assistant-trigger,
.theme-button,
.menu-toggle,
.copy-page,
.assistant-header button {
  min-height: 36px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(10, 16, 14, 0.8);
  color: #d8e4de;
  font: inherit;
}
.search-trigger,
.assistant-trigger {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 13px;
}
.search-trigger {
  width: min(100%, 340px);
  justify-content: flex-start;
  color: var(--muted);
}
.search-trigger kbd,
.assistant-composer kbd {
  margin-left: auto;
  color: #87958e;
  font-size: 12px;
  font-family: inherit;
}
.assistant-trigger:hover,
.search-trigger:hover,
.copy-page:hover,
.theme-button:hover {
  border-color: #3b4d45;
  color: var(--text);
}
.top-links {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  font-weight: 700;
}
.top-links a {
  text-decoration: none;
  color: #b8c7bf;
}
.dashboard-link {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 18px;
  border-radius: 8px;
  background: #178f48;
  color: #f3fff8 !important;
}
.theme-button {
  width: 36px;
  padding: 0;
  display: inline-grid;
  place-items: center;
}
.menu-toggle {
  display: none;
}
.sidebar {
  top: 58px;
  width: 292px;
  padding: 28px 26px 46px;
  background: #07100d;
  border-right-color: rgba(38, 51, 45, 0.72);
}
.sidebar-shortcuts {
  display: grid;
  gap: 10px;
  margin-bottom: 30px;
}
.sidebar-shortcuts a {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #aebbb5;
  font-weight: 700;
  text-decoration: none;
}
.shortcut-icon {
  width: 28px;
  height: 28px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 7px;
  color: #c8d4cf;
  background: #101815;
}
.nav-section {
  margin: 31px 0;
}
.nav-section h2 {
  color: #e5ece8;
  font-size: 15px;
  text-transform: none;
  margin-bottom: 10px;
}
.section-icon {
  color: #f1f7f3;
}
.nav-section a {
  min-height: 36px;
  padding: 7px 16px;
  color: #a7b4ad;
  font-size: 15px;
  border-radius: 8px;
}
.nav-section a.active {
  color: #00f0a0;
  background: #062a1e;
  border-color: transparent;
  box-shadow: none;
  font-weight: 700;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 760px) 220px;
  gap: 72px;
  margin-left: 292px;
  padding: 88px 56px 96px;
}
.content {
  margin-left: 0;
  max-width: none;
  padding: 0 0 78px;
}
.article-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: start;
  margin-bottom: 34px;
}
.eyebrow {
  margin: 0 0 8px;
  color: #00f0a0 !important;
  font-weight: 800;
  font-size: 14px;
}
.article h1 {
  margin: 0 0 8px;
  font-size: 34px;
  line-height: 1.12;
  letter-spacing: 0;
}
.page-description {
  margin: 0;
  color: #a7b4ad !important;
  font-size: 19px;
}
.copy-page {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  white-space: nowrap;
}
.article {
  font-size: 16px;
}
.article h2 {
  margin-top: 52px;
  font-size: 27px;
}
.article h3 {
  margin-top: 30px;
  font-size: 17px;
}
.article p,
.article li {
  color: #aebbb5;
  font-size: 17px;
}
.article strong {
  color: #f0f5f2;
}
.article code {
  color: #edf5f1;
  background: #1b2420;
  border: 0;
  font-weight: 700;
}
pre {
  position: relative;
  border-color: #26332d;
  border-radius: 8px;
  background: #080d0b;
  padding: 18px 54px 18px 18px;
}
pre::after {
  content: "Copy";
  position: absolute;
  top: 13px;
  right: 14px;
  color: #9eadac;
  font-size: 12px;
}
.callout {
  display: block;
  border-radius: 14px;
  padding: 18px 20px;
  background: #111a16;
}
.callout-info,
.callout-note {
  background: #0b1d35;
  border-color: #245bb3;
}
.callout-tip {
  background: #06351f;
  border-color: #0d8d4f;
}
.callout-warning {
  background: #2b2110;
  border-color: #8a6218;
}
.callout-title {
  margin-bottom: 0;
}
.callout-title strong {
  display: none;
}
.callout p {
  color: #d7e4de;
}
.card-grid {
  gap: 16px;
}
.doc-card {
  min-height: 158px;
  padding: 22px 24px;
  background: #08110e;
  border-color: #26332d;
}
.doc-card:hover {
  background: #0a1712;
}
.card-icon {
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: #00f0a0;
}
.steps {
  gap: 0;
}
.step {
  position: relative;
  grid-template-columns: 32px 1fr;
  padding: 0 0 28px;
  border: 0;
  background: transparent;
}
.step:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 15px;
  top: 36px;
  bottom: 0;
  width: 1px;
  background: var(--line);
}
.step-number {
  position: relative;
  z-index: 1;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #202a25;
  color: #dce8e2;
}
.table-wrap {
  border-radius: 0;
}
th {
  background: transparent;
}
th,
td {
  border-color: #18231f;
}
.feature-mark {
  width: auto;
  height: auto;
  border-radius: 0;
  background: transparent;
  font-size: 16px;
}
.feature-yes {
  color: #20e05d;
}
.feature-no {
  color: #ff432e;
  border: 0;
}
.toc {
  position: sticky;
  top: 96px;
  align-self: start;
  max-height: calc(100vh - 120px);
  overflow: auto;
  padding-left: 8px;
}
.toc h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: #dfe8e3;
  font-size: 14px;
}
.toc-icon {
  width: 15px;
  height: 15px;
}
.toc a,
.toc-empty {
  display: block;
  margin: 0;
  padding: 5px 0;
  color: #9eaaa4;
  text-decoration: none;
  font-size: 14px;
  line-height: 1.45;
}
.toc a:hover,
.toc a.active {
  color: #00f0a0;
}
.toc-depth-3 {
  padding-left: 14px !important;
}
.footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 72px;
  padding-top: 34px;
  border-top: 1px solid var(--line);
  color: #728078;
}
.search-dialog[hidden],
.assistant-panel[hidden] {
  display: none;
}
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.55);
}
.search-panel {
  position: fixed;
  z-index: 90;
  top: 78px;
  left: 50%;
  width: min(640px, calc(100vw - 28px));
  transform: translateX(-50%);
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #08100d;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}
.search-panel label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}
.search-panel input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
}
.search-results {
  max-height: 420px;
  overflow: auto;
  padding: 8px;
}
.search-result {
  display: block;
  padding: 12px;
  border-radius: 8px;
  color: #dfe8e3;
  text-decoration: none;
}
.search-result:hover,
.search-result.active {
  background: #102018;
}
.search-result strong {
  display: block;
}
.search-result span {
  display: block;
  margin-top: 3px;
  color: #91a099;
  font-size: 13px;
}
.assistant-panel {
  position: fixed;
  z-index: 70;
  right: 26px;
  bottom: 104px;
  width: min(460px, calc(100vw - 28px));
  max-height: min(620px, calc(100vh - 140px));
  display: grid;
  grid-template-rows: auto 1fr;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #08100d;
  box-shadow: 0 18px 70px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}
.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
}
.assistant-header button {
  min-height: 30px;
  padding: 0 10px;
}
.assistant-messages {
  overflow: auto;
  padding: 14px;
}
.assistant-empty {
  margin: 0;
  color: #91a099;
}
.assistant-message {
  max-width: 92%;
  margin: 0 0 12px;
  padding: 11px 13px;
  border-radius: 12px;
  color: #dce8e2;
  background: #111a16;
  white-space: pre-wrap;
}
.assistant-message.user {
  margin-left: auto;
  background: #06351f;
}
.assistant-message.error {
  background: #321616;
  color: #ffd6d6;
}
.assistant-composer {
  position: fixed;
  z-index: 75;
  left: calc(292px + 56px);
  bottom: 26px;
  width: min(760px, calc(100vw - 404px));
  min-height: 62px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px 0 16px;
  border: 1px solid #506059;
  border-radius: 15px;
  background: rgba(8, 16, 13, 0.96);
  backdrop-filter: blur(14px);
}
.assistant-composer:focus-within {
  border-color: #7a8d84;
}
.assistant-composer input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
}
.assistant-composer button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  color: #dff9eb;
  background: #176f43;
}
.search-trigger,
.assistant-trigger,
.theme-button,
.copy-page,
.assistant-header button,
.dashboard-link,
.article .doc-button,
.assistant-composer button,
.doc-card,
.search-result {
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}
.assistant-trigger:hover,
.search-trigger:hover,
.copy-page:hover,
.theme-button:hover {
  border-color: #16d977;
  color: var(--text);
  background: rgba(11, 35, 24, 0.9);
  box-shadow: 0 0 0 3px rgba(22, 217, 119, 0.08);
  transform: translateY(-1px);
}
.dashboard-link,
.article .doc-button,
.assistant-composer button {
  background: #16a34a;
  color: #03120a;
  box-shadow: 0 10px 24px rgba(22, 163, 74, 0.22);
}
.dashboard-link {
  color: #f3fff8 !important;
}
.dashboard-link:hover,
.article .doc-button:hover {
  background: #22c55e;
  box-shadow: 0 14px 30px rgba(34, 197, 94, 0.3);
  transform: translateY(-1px);
}
.assistant-composer:focus-within {
  border-color: #18d174;
  box-shadow: 0 0 0 4px rgba(24, 209, 116, 0.09), 0 18px 50px rgba(0, 0, 0, 0.28);
}
.assistant-composer button:hover {
  background: #22c55e;
  box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
  transform: translateY(-1px) scale(1.03);
}
.doc-card:hover {
  border-color: #15995a;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.24);
  transform: translateY(-2px);
}
.dialog-backdrop {
  animation: backdrop-fade 150ms ease both;
}
.search-panel {
  transform-origin: top center;
  animation: search-pop 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.search-result:hover,
.search-result.active {
  transform: translateX(2px);
}
.assistant-panel {
  transform-origin: bottom right;
  animation: assistant-slide 210ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.assistant-message {
  animation: message-pop 170ms ease both;
}
@keyframes backdrop-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes search-pop {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}
@keyframes assistant-slide {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes message-pop {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 1180px) {
  .topbar {
    grid-template-columns: auto 1fr auto;
  }
  .toc {
    display: none;
  }
  .layout {
    grid-template-columns: minmax(0, 760px);
    gap: 0;
  }
}
@media (max-width: 860px) {
  .topbar {
    grid-template-columns: 1fr auto;
    padding: 0 12px;
  }
  .top-actions {
    display: none;
  }
  .top-links a:not(.dashboard-link),
  .theme-button {
    display: none;
  }
  .menu-toggle {
    position: static;
    display: inline-grid;
  }
  .sidebar {
    top: 58px;
  }
  .layout {
    margin-left: 0;
    padding: 82px 20px 108px;
  }
  .article-header {
    grid-template-columns: 1fr;
  }
  .copy-page {
    width: max-content;
  }
  .assistant-composer {
    left: 14px;
    right: 14px;
    bottom: 14px;
    width: auto;
  }
  .assistant-composer kbd {
    display: none;
  }
}
`;

const clientScript = `
const menuButton = document.querySelector(".menu-toggle");
const searchDialog = document.querySelector("[data-search-dialog]");
const searchInput = document.querySelector("[data-search-input]");
const searchResults = document.querySelector("[data-search-results]");
const assistantPanel = document.querySelector("[data-assistant-panel]");
const assistantForm = document.querySelector("[data-assistant-form]");
const assistantInput = document.querySelector("[data-assistant-input]");
const assistantMessages = document.querySelector("[data-assistant-messages]");
let searchIndexPromise;
let searchItems = [];

menuButton?.addEventListener("click", () => document.body.classList.toggle("nav-open"));
document.querySelectorAll(".sidebar a").forEach((link) => {
  link.addEventListener("click", () => document.body.classList.remove("nav-open"));
});

function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch("/assets/search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((items) => {
        searchItems = Array.isArray(items) ? items : [];
        return searchItems;
      })
      .catch(() => []);
  }
  return searchIndexPromise;
}

function scoreItem(item, query) {
  const words = query.toLowerCase().split(/\\s+/).filter(Boolean);
  const title = item.title.toLowerCase();
  const text = (item.group + " " + item.description + " " + item.text).toLowerCase();
  return words.reduce((score, word) => {
    if (title.includes(word)) score += 8;
    if (text.includes(word)) score += 2;
    return score;
  }, 0);
}

function searchDocs(query) {
  const trimmed = query.trim();
  if (!trimmed) return searchItems.slice(0, 6);
  return searchItems
    .map((item) => ({ item, score: scoreItem(item, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((entry) => entry.item);
}

function renderSearchResults(items) {
  if (!searchResults) return;
  searchResults.innerHTML = items.length
    ? items.map((item) => '<a class="search-result" href="' + item.href + '"><strong>' + item.title + '</strong><span>' + item.group + ' - ' + (item.description || "Vektra documentation") + '</span></a>').join("")
    : '<p class="assistant-empty">No matching docs found.</p>';
}

async function openSearch() {
  await loadSearchIndex();
  if (!searchDialog || !searchInput) return;
  searchDialog.hidden = false;
  renderSearchResults(searchDocs(searchInput.value));
  requestAnimationFrame(() => searchInput.focus());
}

function closeSearch() {
  if (searchDialog) searchDialog.hidden = true;
}

document.querySelectorAll("[data-open-search]").forEach((button) => {
  button.addEventListener("click", openSearch);
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", closeSearch);
});
searchInput?.addEventListener("input", () => renderSearchResults(searchDocs(searchInput.value)));
searchResults?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeSearch();
});

function openAssistant() {
  if (assistantPanel) assistantPanel.hidden = false;
  requestAnimationFrame(() => assistantInput?.focus());
}

function closeAssistant() {
  if (assistantPanel) assistantPanel.hidden = true;
}

document.querySelectorAll("[data-open-assistant]").forEach((button) => {
  button.addEventListener("click", openAssistant);
});
document.querySelector("[data-close-assistant]")?.addEventListener("click", closeAssistant);

function appendAssistantMessage(role, text) {
  if (!assistantMessages) return null;
  assistantMessages.querySelector(".assistant-empty")?.remove();
  const message = document.createElement("div");
  message.className = "assistant-message " + role;
  message.textContent = text;
  assistantMessages.append(message);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
  return message;
}

async function askAssistant(question) {
  await loadSearchIndex();
  const context = searchDocs(question).slice(0, 5).map((item) => ({
    title: item.title,
    href: item.href,
    text: item.text.slice(0, 1200),
  }));
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, context }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Assistant is unavailable right now.");
  }
  return data.answer || "I could not find a useful answer.";
}

assistantForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = assistantInput?.value.trim();
  if (!question) return;
  openAssistant();
  assistantInput.value = "";
  appendAssistantMessage("user", question);
  const pending = appendAssistantMessage("assistant", "Thinking...");
  try {
    pending.textContent = await askAssistant(question);
  } catch (error) {
    pending.classList.add("error");
    pending.textContent = error.message || "Assistant is unavailable right now.";
  }
});

document.querySelector("[data-copy-page]")?.addEventListener("click", async () => {
  const text = document.querySelector(".article")?.innerText || document.title;
  await navigator.clipboard?.writeText(text);
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
    event.preventDefault();
    openAssistant();
  }
  if (event.key === "Escape") {
    closeSearch();
    closeAssistant();
  }
});

const tocLinks = [...document.querySelectorAll(".toc a")];
const headings = tocLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
  if (!visible) return;
  tocLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + visible.target.id));
}, { rootMargin: "-90px 0px -70% 0px", threshold: [0, 1] });
headings.forEach((heading) => observer.observe(heading));
`;

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
