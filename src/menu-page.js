import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { defaultMenuData } from "./menu-data.js";

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

const borderByTheme = {
  amber: "border-amber-100",
  pink: "border-pink-100",
  purple: "border-purple-100",
  emerald: "border-emerald-100",
  orange: "border-orange-100",
  stone: "border-stone-200"
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeId(value, fallback) {
  const text = String(value ?? "").trim().toLowerCase();
  return text.replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function normalizeMenuData(data) {
  const groups = Array.isArray(data?.groups) ? data.groups : [];
  return {
    ...defaultMenuData,
    ...data,
    groups: groups.map((group, groupIndex) => ({
      id: safeId(group.id, `group-${groupIndex + 1}`),
      navLabel: group.navLabel || group.title || `メニュー${groupIndex + 1}`,
      title: group.title || group.navLabel || `メニュー${groupIndex + 1}`,
      label: group.label || "",
      icon: group.icon || "fa-solid fa-utensils text-amber-700",
      theme: group.theme || "stone",
      sections: (Array.isArray(group.sections) ? group.sections : []).map((section, sectionIndex) => ({
        id: safeId(section.id, `section-${groupIndex + 1}-${sectionIndex + 1}`),
        title: section.title || `セクション${sectionIndex + 1}`,
        items: Array.isArray(section.items) ? section.items : [],
        notes: Array.isArray(section.notes) ? section.notes : []
      }))
    }))
  };
}

function renderNav(groups) {
  const nav = document.getElementById("menu-nav");
  const heroLinks = document.getElementById("menu-hero-links");
  if (nav) {
    nav.innerHTML = groups.map(group => (
      `<a href="#${escapeHtml(group.id)}" class="hover:text-amber-200">${escapeHtml(group.navLabel)}</a>`
    )).join("");
  }
  if (heroLinks) {
    heroLinks.innerHTML = groups.slice(0, 4).map((group, index) => {
      const cls = index === 0
        ? "rounded-full bg-white text-stone-900 px-4 py-2 font-semibold"
        : "rounded-full bg-white/12 border border-white/25 px-4 py-2";
      return `<a href="#${escapeHtml(group.id)}" class="${cls}">${escapeHtml(group.navLabel)}</a>`;
    }).join("");
  }
}

function renderItem(item) {
  const note = item.note ? `<p class="text-sm text-gray-600 pl-4">${escapeHtml(item.note)}</p>` : "";
  return `
    <div>
      <div class="grid-item">
        <span>${escapeHtml(item.name || "")}</span>
        ${item.price ? `<span class="price">${escapeHtml(item.price)}</span>` : ""}
      </div>
      ${note}
    </div>
  `;
}

function renderSection(section, theme) {
  const borderClass = borderByTheme[theme] || borderByTheme.stone;
  const items = section.items.map(renderItem).join("");
  const notes = section.notes.map(note => (
    `<p class="text-xs text-gray-500 mt-2">${escapeHtml(note)}</p>`
  )).join("");
  return `
    <div class="section-card border ${borderClass}">
      <h3 class="text-lg font-semibold mb-3">${escapeHtml(section.title)}</h3>
      <div class="space-y-2">${items}</div>
      ${notes}
    </div>
  `;
}

function renderGroup(group) {
  const sections = group.sections.map(section => renderSection(section, group.theme)).join("");
  return `
    <section id="${escapeHtml(group.id)}" class="section-card space-y-6">
      <div class="flex items-center space-x-3">
        <i class="${escapeHtml(group.icon)}"></i>
        <div>
          ${group.label ? `<p class="section-label">${escapeHtml(group.label)}</p>` : ""}
          <h2 class="menu-section-title text-2xl md:text-3xl font-bold">${escapeHtml(group.title)}</h2>
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-6">${sections}</div>
    </section>
  `;
}

async function loadMenuData() {
  try {
    const snap = await getDoc(doc(db, "menus", "current"));
    if (snap.exists()) return normalizeMenuData(snap.data());
  } catch (err) {
    console.error("Firestoreからメニューを読み込めませんでした:", err);
  }
  return normalizeMenuData(defaultMenuData);
}

async function renderMenuPage() {
  const root = document.getElementById("menu-root");
  if (!root) return;
  const data = await loadMenuData();
  renderNav(data.groups);
  root.innerHTML = data.groups.map(renderGroup).join("");
}

renderMenuPage().finally(() => {
  window.showMenuContent?.();
});
