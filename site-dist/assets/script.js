
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
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
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
    ? items.map((item) => '<a class="search-result" href="' + item.href + '"><strong>' + item.title + '</strong><span>' + item.group + ' - ' + (item.description || "LabelUtils documentation") + '</span></a>').join("")
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
