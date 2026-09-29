// お知らせは読むだけなので Firebase SDK を使わず Firestore の REST API で取得する (SDK だと約290KB)。
// 公開されている読み取り専用の API キー。書き込みは firestore.rules で管理者に限定している。
const NEWS_ENDPOINT = "https://firestore.googleapis.com/v1/projects/enka-a3819/databases/(default)/documents/news"
  + "?key=AIzaSyCpKJ5PuXPLXubvvXzRimZj9YnQ_1jsikc&pageSize=100";

// トップに最初から開いて見せる件数。残りは「過去のお知らせ」にたたむ。
const NEWS_VISIBLE = 3;

// 営業時間 (日本時間, 分単位)。水曜定休。
const HOURS = [
  { open: 11 * 60, close: 16 * 60, label: "カフェタイム" },
  { open: 18 * 60, close: 23 * 60, label: "バルタイム" }
];
const CLOSED_WEEKDAY = 3;

// ファーストビューの写真を切り替える間隔
const SLIDE_INTERVAL = 6500;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatTime(minutes) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

function tokyoNow(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23"
  }).formatToParts(date).map(part => [part.type, part.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return { weekday, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function openStatus(now) {
  if (now.weekday === CLOSED_WEEKDAY) {
    return { state: "closed", text: "本日（水曜）は定休日です" };
  }
  for (const slot of HOURS) {
    if (now.minutes < slot.open) {
      const soon = slot.open - now.minutes <= 60;
      return { state: soon ? "soon" : "closed", text: `準備中・${formatTime(slot.open)}から${slot.label}` };
    }
    if (now.minutes < slot.close) {
      return { state: "open", text: `営業中・${slot.label}は${formatTime(slot.close)}まで` };
    }
  }
  return { state: "closed", text: "本日の営業は終了しました" };
}

function renderOpenStatus() {
  const box = document.getElementById("open-status");
  const text = document.getElementById("open-status-text");
  if (!box || !text) return;
  const status = openStatus(tokyoNow());
  box.dataset.state = status.state;
  text.textContent = status.text;
}

function newsItemHtml(item) {
  const excerpt = String(item.content || "").replace(/\s+/g, " ").trim();
  return `
    <details class="news-item">
      <summary>
        <span class="news-meta">
          <time datetime="${escapeHtml(item.datetime || "")}">${escapeHtml(item.date || item.datetime || "")}</time>
          ${item.category ? `<span class="news-tag">${escapeHtml(item.category)}</span>` : ""}
        </span>
        <span class="news-title">${escapeHtml(item.title || "")}</span>
        ${excerpt ? `<span class="news-excerpt">${escapeHtml(excerpt)}</span>` : ""}
        <svg class="icon news-chevron" aria-hidden="true"><use href="#i-chevron"/></svg>
      </summary>
      <div class="news-body">${escapeHtml(item.content || "")}</div>
    </details>`;
}

function renderLatestNews(item) {
  const meta = document.getElementById("hero-news-meta");
  const title = document.getElementById("hero-news-title");
  if (!title) return;
  if (!item) {
    title.textContent = "お知らせ一覧を見る";
    return;
  }
  if (meta) {
    meta.innerHTML = `
      <time datetime="${escapeHtml(item.datetime || "")}">${escapeHtml(item.date || item.datetime || "")}</time>
      ${item.category ? `<span class="news-tag">${escapeHtml(item.category)}</span>` : ""}`;
  }
  title.textContent = item.title || "";
}

function renderNews(items) {
  const list = document.getElementById("news-list");
  const archive = document.getElementById("news-archive");
  const more = document.getElementById("news-more");
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<p class="news-empty">現在お知らせはありません。</p>';
    renderLatestNews(null);
    return;
  }
  const sorted = [...items].sort((a, b) => String(b.datetime || "").localeCompare(String(a.datetime || "")));
  renderLatestNews(sorted[0]);
  list.innerHTML = sorted.slice(0, NEWS_VISIBLE).map(item => newsItemHtml(item)).join("");
  const rest = sorted.slice(NEWS_VISIBLE);
  if (archive && more && rest.length) {
    archive.innerHTML = rest.map(item => newsItemHtml(item)).join("");
    more.hidden = false;
    more.textContent = `過去のお知らせを見る（${rest.length}件）`;
    more.addEventListener("click", () => {
      const expanded = more.getAttribute("aria-expanded") === "true";
      archive.hidden = expanded;
      more.setAttribute("aria-expanded", String(!expanded));
      more.textContent = expanded ? `過去のお知らせを見る（${rest.length}件）` : "過去のお知らせを閉じる";
    });
  }
}

// Firestore REST のドキュメントを { title: "...", ... } の形に直す
export function fromFirestoreDocument(doc) {
  const item = {};
  for (const [key, value] of Object.entries(doc?.fields ?? {})) {
    item[key] = value.stringValue ?? value.timestampValue ?? value.integerValue ?? value.booleanValue ?? null;
  }
  return item;
}

async function loadNews() {
  try {
    const res = await fetch(NEWS_ENDPOINT, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = ((await res.json()).documents ?? []).map(fromFirestoreDocument);
    if (items.length) return items;
  } catch (err) {
    console.error("Firestoreからのお知らせ読み込みに失敗:", err);
  }
  try {
    const res = await fetch("news.json", { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error("news.json の読み込みに失敗:", err);
  }
  return [];
}

function setupSlideshow() {
  const slides = [...document.querySelectorAll(".hero-slide")];
  const dotsBox = document.getElementById("hero-dots");
  if (slides.length < 2) return;
  const dots = slides.map((_, index) => {
    const dot = document.createElement("span");
    if (index === 0) dot.className = "is-active";
    dotsBox?.append(dot);
    return dot;
  });
  let current = 0;
  const loaded = slides.map((_, index) => index === 0);

  // 2枚目以降は最初の表示が終わってから読み込む
  const loadRest = () => slides.slice(1).forEach((slide, offset) => {
    const source = slide.querySelector("source[data-srcset]");
    const img = slide.querySelector("img[data-src]");
    if (source) source.srcset = source.dataset.srcset;
    if (!img) return;
    img.addEventListener("load", () => { loaded[offset + 1] = true; }, { once: true });
    img.src = img.dataset.src;
  });
  if (document.readyState === "complete") loadRest();
  else window.addEventListener("load", loadRest, { once: true });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  setInterval(() => {
    if (document.hidden) return;
    let next = (current + 1) % slides.length;
    while (!loaded[next] && next !== current) next = (next + 1) % slides.length;
    if (next === current) return;
    slides[current].classList.remove("is-active");
    dots[current].classList.remove("is-active");
    slides[next].classList.add("is-active");
    dots[next].classList.add("is-active");
    current = next;
  }, SLIDE_INTERVAL);
}

function setupHeader() {
  const header = document.getElementById("site-header");
  const hero = document.querySelector(".hero");
  const actionBar = document.getElementById("action-bar");
  if (!header || !hero) return;
  const update = () => {
    const heroBottom = hero.getBoundingClientRect().bottom;
    header.classList.toggle("is-solid", window.scrollY > 40);
    actionBar?.classList.toggle("is-visible", heroBottom < 0);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function setupMobileNav() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("mobile-nav");
  if (!toggle || !nav) return;
  const icon = toggle.querySelector("use");
  const setOpen = open => {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    icon?.setAttribute("href", open ? "#i-close" : "#i-menu");
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", event => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
}

function setupReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    targets.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  targets.forEach(el => observer.observe(el));
}

function init() {
  renderOpenStatus();
  setInterval(renderOpenStatus, 60 * 1000);
  setupSlideshow();
  setupHeader();
  setupMobileNav();
  setupReveal();
  loadNews().then(renderNews);
}

if (typeof document !== "undefined" && document.getElementById("news-list")) {
  document.documentElement.classList.add("js");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}
