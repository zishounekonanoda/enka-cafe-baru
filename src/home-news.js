import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpKJ5PuXPLXubvvXzRimZj9YnQ_1jsikc",
  authDomain: "enka-a3819.firebaseapp.com",
  projectId: "enka-a3819",
  storageBucket: "enka-a3819.firebasestorage.app",
  messagingSenderId: "443017242406",
  appId: "1:443017242406:web:c09fcbd620295312bcc3e7",
  measurementId: "G-EGEKEVL665"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const newsListEl = document.getElementById("news-list");

const allowedBadgeClasses = new Set([
  "bg-stone-500",
  "bg-stone-700",
  "bg-amber-500",
  "bg-amber-700",
  "bg-orange-500",
  "bg-red-500",
  "bg-red-600",
  "bg-green-500",
  "bg-green-600",
  "bg-blue-500",
  "bg-blue-600",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500"
]);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeBadgeClass(value) {
  const className = String(value ?? "").trim();
  return allowedBadgeClasses.has(className) ? className : "bg-stone-500";
}

function safeImageUrl(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  try {
    const url = new URL(text, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function renderLatest(items) {
  const target = document.getElementById("hero-latest-news-body");
  if (!target) return;
  if (!items.length) {
    target.textContent = "お知らせはまだありません。";
    return;
  }
  target.dataset.loaded = "true";
  const item = items[0];
  const date = item.date || item.datetime || "";
  const categoryClass = safeBadgeClass(item.category_color);
  target.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-xs font-semibold text-white ${categoryClass}">
        ${escapeHtml(item.category || "お知らせ")}
      </span>
      <time class="text-white/70 text-xs" datetime="${escapeHtml(item.datetime || "")}">${escapeHtml(date)}</time>
    </div>
    <div class="font-semibold">${escapeHtml(item.title || "")}</div>
    <a href="#news" class="inline-block text-sm underline underline-offset-4">お知らせを読む</a>
  `;
}

function renderNews(items) {
  if (!newsListEl) return;
  if (!items.length) {
    newsListEl.innerHTML = '<div class="text-center text-gray-500">まだお知らせがありません。</div>';
    return;
  }
  newsListEl.dataset.loaded = "true";
  newsListEl.innerHTML = items.map(item => {
    const imageUrl = safeImageUrl(item.image);
    const imageHtml = imageUrl
      ? `<div class="md:w-1/3 lg:w-1/4"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.alt || "")}" class="w-full rounded-lg object-cover aspect-video shadow-md"></div>`
      : '<div class="hidden md:block md:w-1/3 lg:w-1/4"></div>';
    const categoryClass = safeBadgeClass(item.category_color);
    return `
      <div class="gsap-fade-up flex flex-col md:flex-row gap-6 border-b border-gray-200 py-8 last:border-b-0" data-animate="static">
        ${imageHtml}
        <div class="flex-1">
          <p class="text-sm text-gray-500 mb-2">
            <time datetime="${escapeHtml(item.datetime || "")}">${escapeHtml(item.date || "")}</time>
            <span class="ml-4 inline-block ${categoryClass} text-white text-xs font-semibold px-2 py-1 rounded">${escapeHtml(item.category || "")}</span>
          </p>
          <h3 class="text-xl font-bold mb-2">${escapeHtml(item.title || "")}</h3>
          <p class="text-gray-600 leading-relaxed">${escapeHtml(item.content || "")}</p>
        </div>
      </div>`;
  }).join("");
}

async function loadNewsFromLocalJson() {
  try {
    const res = await fetch("news.json");
    if (!res.ok) throw new Error("local json load failed");
    const items = await res.json();
    renderLatest(items);
    renderNews(items);
  } catch (err) {
    console.error("ローカルJSONの読み込みも失敗:", err);
    if (newsListEl) {
      newsListEl.innerHTML = '<div class="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-lg text-center"><i class="fas fa-info-circle mr-2"></i>お知らせの読み込みに失敗しました。</div>';
    }
  }
}

async function loadNewsFromFirestore() {
  if (!newsListEl) return;
  newsListEl.innerHTML = '<div class="text-center text-gray-500">読み込み中...</div>';
  try {
    const q = query(collection(db, "news"), orderBy("datetime", "desc"));
    const snap = await getDocs(q);
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (!items.length) {
      await loadNewsFromLocalJson();
      return;
    }
    renderLatest(items);
    renderNews(items);
  } catch (err) {
    console.error("Firestoreからのお知らせ読み込みに失敗:", err);
    await loadNewsFromLocalJson();
  } finally {
    window.setupScrollTriggers?.();
  }
}

loadNewsFromFirestore();
