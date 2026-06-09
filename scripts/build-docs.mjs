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
          body: renderInline(content.trim()),
        });
        return "";
      });
      return stashHtml(`<div class="card-grid">${cards
        .map(
          (card) =>
            `<a class="doc-card" href="${escapeHtml(card.href)}"><strong>${escapeHtml(card.title)}</strong><span>${card.body}</span></a>`,
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
      stashHtml(`<aside class="callout callout-${kind.toLowerCase()}"><strong>${kind}</strong>${renderBlocks(dedent(body))}</aside>`),
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
        `<section class="nav-section"><h2>${escapeHtml(section.group)}</h2>${section.pages
          .map(([label, _file, href]) => {
            const active = href === currentHref || (currentHref === "/" && href === "/");
            return `<a class="${active ? "active" : ""}" href="${href}">${escapeHtml(label)}</a>`;
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
      <span class="brand-mark">LU</span>
      <span><strong>LabelUtils</strong><small>Docs</small></span>
    </a>
    <nav>${sidebar(page.href)}</nav>
  </aside>
  <main class="content">
    <div class="hero">
      <p>${escapeHtml(page.group)}</p>
      <h1>${escapeHtml(title)}</h1>
      <span>${escapeHtml(description)}</span>
    </div>
    <article class="article">${content}</article>
    <nav class="pager">
      ${prev ? `<a href="${prev.href}"><span>Previous</span>${escapeHtml(prev.label)}</a>` : "<span></span>"}
      ${next ? `<a href="${next.href}"><span>Next</span>${escapeHtml(next.label)}</a>` : "<span></span>"}
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
  --bg: #0b0f0d;
  --panel: #111714;
  --panel-2: #17211c;
  --text: #edf5f0;
  --muted: #9bad9f;
  --line: #26352d;
  --brand: #22c55e;
  --brand-2: #38bdf8;
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
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 292px;
  overflow-y: auto;
  border-right: 1px solid var(--line);
  background: #0d130f;
  padding: 20px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  margin-bottom: 28px;
}
.brand-mark {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--brand);
  color: #06120b;
  font-weight: 800;
}
.brand small { display: block; color: var(--muted); }
.nav-section { margin: 20px 0; }
.nav-section h2 {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0;
  margin: 0 0 8px;
}
.nav-section a {
  display: block;
  padding: 8px 10px;
  border-radius: var(--radius);
  color: #cbd8d0;
  text-decoration: none;
  font-size: 14px;
}
.nav-section a:hover, .nav-section a.active {
  background: var(--panel-2);
  color: var(--text);
}
.content {
  margin-left: 292px;
  max-width: 980px;
  padding: 48px 56px 72px;
}
.hero {
  border-bottom: 1px solid var(--line);
  padding-bottom: 28px;
  margin-bottom: 32px;
}
.hero p {
  margin: 0 0 8px;
  color: var(--brand);
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
.article code {
  background: #18221d;
  border: 1px solid var(--line);
  padding: 2px 5px;
  border-radius: 5px;
  font-size: 0.92em;
}
pre {
  overflow-x: auto;
  background: #080c0a;
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
th { color: var(--text); background: #111915; }
td { color: #d6e2db; }
.callout {
  border: 1px solid var(--line);
  border-left: 4px solid var(--brand);
  background: var(--panel);
  border-radius: var(--radius);
  padding: 14px 16px;
  margin: 20px 0;
}
.callout-warning { border-left-color: var(--warn); }
.callout strong { display: block; margin-bottom: 6px; }
.callout p { margin: 0; }
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 22px 0;
}
.doc-card {
  display: block;
  min-height: 126px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  text-decoration: none;
}
.doc-card:hover { border-color: var(--brand); }
.doc-card strong { display: block; margin-bottom: 8px; }
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
  background: var(--brand);
  color: #06120b;
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
.pager a:last-child { text-align: right; }
.pager span { display: block; color: var(--muted); font-size: 13px; }
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
