import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocFromServer, getDocs, runTransaction, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { defaultMenuData } from "./menu-data.js";
import { createMenuStore, updateMenuItem } from "./menu-store.mjs";

// 他サイトの iframe に埋め込まれた管理画面は操作させない（クリックジャッキング対策）。
// GitHub Pages ではヘッダーで frame-ancestors を指定できないため、画面側で防ぐ。
if (window.top !== window.self) {
  document.documentElement.innerHTML = "";
  throw new Error("admin page must not be framed");
}

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
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const els = {
  loginBtn: document.getElementById("login-btn"),
  logoutBtn: document.getElementById("logout-btn"),
  userInfo: document.getElementById("user-info"),
  adminContent: document.getElementById("admin-content"),
  adminBadge: document.getElementById("admin-badge"),
  newsList: document.getElementById("news-list"),
  newsForm: document.getElementById("news-form"),
  newsId: document.getElementById("news-id"),
  newsTitle: document.getElementById("news-title"),
  newsDate: document.getElementById("news-date"),
  newsDatetime: document.getElementById("news-datetime"),
  newsCategory: document.getElementById("news-category"),
  newsCategoryColor: document.getElementById("news-category-color"),
  newsContent: document.getElementById("news-content"),
  newsImage: document.getElementById("news-image"),
  newsAlt: document.getElementById("news-alt"),
  formStatus: document.getElementById("form-status"),
  cancelBtn: document.getElementById("cancel-btn"),
  reloadBtn: document.getElementById("reload-btn"),
  saveBtn: document.getElementById("save-btn"),
  menuReloadBtn: document.getElementById("menu-reload-btn"),
  menuSeedBtn: document.getElementById("menu-seed-btn"),
  menuGroupTabs: document.getElementById("menu-group-tabs"),
  menuGroupForm: document.getElementById("menu-group-form"),
  menuGroupTitle: document.getElementById("menu-group-title"),
  menuGroupNavLabel: document.getElementById("menu-group-nav-label"),
  menuGroupLabel: document.getElementById("menu-group-label"),
  menuAddGroupBtn: document.getElementById("menu-add-group-btn"),
  menuDeleteGroupBtn: document.getElementById("menu-delete-group-btn"),
  menuSectionForm: document.getElementById("menu-section-form"),
  menuSectionId: document.getElementById("menu-section-id"),
  menuSectionTitle: document.getElementById("menu-section-title"),
  menuSectionNotes: document.getElementById("menu-section-notes"),
  menuClearSectionBtn: document.getElementById("menu-clear-section-btn"),
  menuItemForm: document.getElementById("menu-item-form"),
  menuItemIndex: document.getElementById("menu-item-index"),
  menuItemSection: document.getElementById("menu-item-section"),
  menuItemName: document.getElementById("menu-item-name"),
  menuItemPrice: document.getElementById("menu-item-price"),
  menuItemNote: document.getElementById("menu-item-note"),
  menuClearItemBtn: document.getElementById("menu-clear-item-btn"),
  menuStatus: document.getElementById("menu-status"),
  menuEditorList: document.getElementById("menu-editor-list")
};

let currentUser = null;
let isAdmin = false;
let menuData = structuredClone(defaultMenuData);
let activeMenuGroupId = menuData.groups[0]?.id || "";
let renderedMenuGroupId = activeMenuGroupId;
let editingItem = null;
let menuBusy = false;
let authVersion = 0;

const NEWS_COLLECTION = "news";
const ADMIN_COLLECTION = "admins";
const MENU_COLLECTION = "menus";
const MENU_DOCUMENT = "current";
const menuRef = doc(db, MENU_COLLECTION, MENU_DOCUMENT);
const menuStore = createMenuStore({
  read: async () => {
    const snap = await getDocFromServer(menuRef);
    return snap.exists() ? snap.data() : null;
  },
  transact: callback => runTransaction(db, transaction => callback({
    read: async () => {
      const snap = await transaction.get(menuRef);
      return snap.exists() ? snap.data() : null;
    },
    write: payload => transaction.set(menuRef, payload)
  })),
  stamp: serverTimestamp
});
const menuThemeCycle = ["amber", "pink", "purple", "emerald", "orange", "stone"];
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

function setStatus(msg, variant = "neutral") {
  const colors = {
    neutral: "text-stone-600",
    success: "text-green-700",
    error: "text-red-700"
  };
  els.formStatus.className = `col-span-2 text-sm ${colors[variant] || colors.neutral}`;
  els.formStatus.textContent = msg;
}

function renderNews(items) {
  if (!els.newsList) return;
  if (!items.length) {
    els.newsList.innerHTML = '<div class="p-4 text-center text-stone-500">まだお知らせがありません。</div>';
    return;
  }
  els.newsList.innerHTML = items.map(item => {
    const imageUrl = safeImageUrl(item.image);
    const imageHtml = imageUrl ? `<div class="w-full md:w-1/4"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.alt || "")}" class="w-full rounded-lg object-cover aspect-video"></div>` : "";
    const categoryClass = safeBadgeClass(item.category_color);
    return `
      <div class="p-4 flex flex-col md:flex-row gap-4">
        ${imageHtml}
        <div class="flex-1">
          <p class="text-xs text-stone-500 mb-1">
            <time datetime="${escapeHtml(item.datetime || "")}">${escapeHtml(item.date || "")}</time>
            <span class="ml-3 inline-block px-2 py-1 rounded text-white text-[11px] ${categoryClass}">${escapeHtml(item.category || "")}</span>
          </p>
          <h3 class="text-lg font-semibold mb-1">${escapeHtml(item.title || "")}</h3>
          <p class="text-sm text-stone-700 leading-relaxed">${escapeHtml(item.content || "")}</p>
          <div class="mt-3 flex gap-2">
            <button data-id="${escapeHtml(item.id)}" class="edit-btn px-3 py-1 rounded bg-stone-900 text-white text-sm hover:bg-stone-700">編集</button>
            <button data-id="${escapeHtml(item.id)}" class="delete-btn px-3 py-1 rounded bg-red-100 text-red-700 text-sm hover:bg-red-200">削除</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function loadNews() {
  if (!isAdmin && !currentUser) {
    els.newsList.innerHTML = '<div class="p-4 text-center text-stone-500">ログインしてください。</div>';
    return;
  }
  els.newsList.innerHTML = '<div class="p-4 text-center text-stone-500">読み込み中...</div>';
  try {
    const q = query(collection(db, NEWS_COLLECTION), orderBy("datetime", "desc"));
    const snap = await getDocs(q);
    const items = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderNews(items);
    attachRowHandlers();
  } catch (err) {
    console.error("News load failed", err);
    els.newsList.innerHTML = '<div class="p-4 text-center text-red-700">読み込みに失敗しました。</div>';
  }
}

async function checkAdmin(user) {
  if (!user) return false;
  try {
    const ref = doc(db, ADMIN_COLLECTION, user.uid);
    const snap = await getDoc(ref);
    return snap.exists() && snap.data().active === true;
  } catch (err) {
    console.warn("Admin check failed", err);
    return false;
  }
}

function fillForm(item) {
  els.newsId.value = item?.id || "";
  els.newsTitle.value = item?.title || "";
  els.newsDate.value = item?.date || "";
  els.newsDatetime.value = item?.datetime ? item.datetime.split("T")[0] : "";
  els.newsCategory.value = item?.category || "";
  els.newsCategoryColor.value = item?.category_color || "bg-stone-500";
  els.newsContent.value = item?.content || "";
  els.newsImage.value = item?.image || "";
  els.newsAlt.value = item?.alt || "";
  if (item?.id) {
    els.saveBtn.textContent = "更新";
    els.cancelBtn.classList.remove("hidden");
  } else {
    els.saveBtn.textContent = "追加";
    els.cancelBtn.classList.add("hidden");
  }
}

function clearForm() {
  fillForm({});
  setStatus("");
}

function attachRowHandlers() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const snap = await getDoc(doc(db, NEWS_COLLECTION, id));
      if (!snap.exists()) return;
      fillForm({ id, ...snap.data() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("削除しますか？")) return;
      try {
        await deleteDoc(doc(db, NEWS_COLLECTION, btn.dataset.id));
        setStatus("削除しました", "success");
        loadNews();
      } catch (err) {
        console.error(err);
        setStatus("削除に失敗しました", "error");
      }
    });
  });
}

function safeSlug(value, fallback) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

function uniqueId(base, list) {
  const existing = new Set(list.map(item => item.id));
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function activeMenuGroup() {
  return menuData.groups.find(group => group.id === activeMenuGroupId) || menuData.groups[0];
}

function sectionById(group, sectionId) {
  return group?.sections.find(section => section.id === sectionId);
}

function setMenuStatus(msg, variant = "neutral") {
  if (!els.menuStatus) return;
  const colors = {
    neutral: "text-stone-600",
    success: "text-green-700",
    error: "text-red-700"
  };
  els.menuStatus.className = `text-sm ${colors[variant] || colors.neutral}`;
  els.menuStatus.textContent = msg;
}

function normalizeMenuData(data) {
  const groups = Array.isArray(data?.groups) ? data.groups : [];
  return {
    groups: groups.map((group, groupIndex) => ({
      id: safeSlug(group.id, `group-${groupIndex + 1}`),
      navLabel: String(group.navLabel || group.title || `メニュー${groupIndex + 1}`).trim(),
      title: String(group.title || group.navLabel || `メニュー${groupIndex + 1}`).trim(),
      label: String(group.label || "").trim(),
      icon: group.icon || defaultMenuData.groups[groupIndex]?.icon || "fa-solid fa-utensils text-amber-700",
      theme: group.theme || menuThemeCycle[groupIndex % menuThemeCycle.length],
      sections: (Array.isArray(group.sections) ? group.sections : []).map((section, sectionIndex) => ({
        id: safeSlug(section.id, `section-${sectionIndex + 1}`),
        title: String(section.title || `セクション${sectionIndex + 1}`).trim(),
        notes: Array.isArray(section.notes) ? section.notes.map(note => String(note).trim()).filter(Boolean) : [],
        items: (Array.isArray(section.items) ? section.items : []).map(item => ({
          name: String(item.name || "").trim(),
          price: String(item.price || "").trim(),
          note: String(item.note || "").trim()
        })).filter(item => item.name)
      }))
    })).filter(group => group.title && group.sections)
  };
}

async function saveMenuData(successMessage = "メニューを保存しました") {
  if (!isAdmin || !menuStore.ready || menuBusy) return false;
  const version = authVersion;
  menuBusy = true;
  syncMenuControls();
  setMenuStatus("保存中です…");
  try {
    const saved = await menuStore.save(normalizeMenuData(menuData));
    if (version !== authVersion) return false;
    menuData = normalizeMenuData(saved);
    clearSectionForm();
    clearItemForm();
    renderMenuEditor();
    setMenuStatus(successMessage, "success");
    return true;
  } catch (error) {
    if (version !== authVersion) return false;
    menuData = normalizeMenuData(menuStore.data ?? defaultMenuData);
    activeMenuGroupId = renderedMenuGroupId;
    setMenuStatus(error.code === "menu-conflict"
      ? "別の画面でメニューが更新されました。再読込して最新の内容を確認してから、編集し直してください。"
      : "保存を確認できませんでした。通信状態を確認して、もう一度保存してください。", "error");
    return false;
  } finally {
    if (version === authVersion) { menuBusy = false; syncMenuControls(); }
  }
}

async function loadMenuEditor() {
  if (!els.menuEditorList || !isAdmin || menuBusy) return;
  const version = authVersion;
  menuBusy = true;
  syncMenuControls();
  els.menuEditorList.innerHTML = '<div class="p-4 text-center text-stone-500">読み込み中...</div>';
  try {
    const data = await menuStore.load();
    if (version !== authVersion) return;
    menuData = normalizeMenuData(data ?? defaultMenuData);
    activeMenuGroupId = menuData.groups[0]?.id || "";
    clearSectionForm();
    clearItemForm();
    renderMenuEditor();
    setMenuStatus(data ? "メニューを読み込みました" : "初期メニューを表示しています。保存すると公開されます。");
  } catch (err) {
    if (version !== authVersion) return;
    els.menuEditorList.textContent = "メニューを読み込めませんでした。";
    setMenuStatus("通信状態を確認して再読込してください。読み込みが完了するまで編集・保存はできません。", "error");
  } finally {
    if (version === authVersion) { menuBusy = false; syncMenuControls(); }
  }
}

function syncMenuControls() {
  const panel = els.menuGroupForm.closest("section");
  panel.querySelectorAll("button, input, select, textarea").forEach(control => {
    control.disabled = !isAdmin || menuBusy || !menuStore.ready;
  });
  els.menuReloadBtn.disabled = !isAdmin || menuBusy;
  els.menuSeedBtn.hidden = menuStore.data !== null || !menuStore.ready;
}

// Guard the entire editor before handlers can mutate the working copy.
for (const type of ["click", "submit"]) {
  els.menuGroupForm.closest("section").addEventListener(type, event => {
    if (event.target.closest("#menu-reload-btn") && !menuBusy && isAdmin) return;
    if (!isAdmin || menuBusy || !menuStore.ready) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

function fillGroupForm(group) {
  if (!group) return;
  els.menuGroupTitle.value = group.title || "";
  els.menuGroupNavLabel.value = group.navLabel || group.title || "";
  els.menuGroupLabel.value = group.label || "";
}

function clearSectionForm() {
  els.menuSectionId.value = "";
  els.menuSectionTitle.value = "";
  els.menuSectionNotes.value = "";
}

function clearItemForm() {
  editingItem = null;
  els.menuItemIndex.value = "";
  els.menuItemName.value = "";
  els.menuItemPrice.value = "";
  els.menuItemNote.value = "";
}

function renderMenuEditor() {
  if (!els.menuGroupTabs || !els.menuEditorList) return;
  const group = activeMenuGroup();
  activeMenuGroupId = group?.id || "";
  renderedMenuGroupId = activeMenuGroupId;
  fillGroupForm(group);

  els.menuGroupTabs.innerHTML = menuData.groups.map(tab => {
    const active = tab.id === activeMenuGroupId;
    const cls = active
      ? "bg-stone-900 text-white border-stone-900"
      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100";
    return `<button type="button" data-group-id="${escapeHtml(tab.id)}" class="menu-tab px-4 py-2 rounded-full border text-sm transition ${cls}">${escapeHtml(tab.navLabel || tab.title)}</button>`;
  }).join("");

  const selectedSection = els.menuItemSection.value;
  els.menuItemSection.innerHTML = (group?.sections || []).map(section => (
    `<option value="${escapeHtml(section.id)}">${escapeHtml(section.title)}</option>`
  )).join("");

  if (group?.sections.some(section => section.id === selectedSection)) els.menuItemSection.value = selectedSection;
  els.menuEditorList.innerHTML = (group?.sections || []).map(section => {
    const items = section.items.map((item, index) => `
      <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between rounded-lg bg-white border border-stone-200 p-3">
        <div>
          <div class="font-medium">${escapeHtml(item.name)}</div>
          <div class="text-sm text-stone-600">${escapeHtml(item.price || "")}${item.note ? ` / ${escapeHtml(item.note)}` : ""}</div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button type="button" data-section-id="${escapeHtml(section.id)}" data-item-index="${index}" class="menu-edit-item px-3 py-1 rounded bg-stone-900 text-white text-sm hover:bg-stone-700">編集</button>
          <button type="button" data-section-id="${escapeHtml(section.id)}" data-item-index="${index}" class="menu-delete-item px-3 py-1 rounded bg-red-100 text-red-700 text-sm hover:bg-red-200">削除</button>
        </div>
      </div>
    `).join("");
    const notes = section.notes.length
      ? `<div class="text-xs text-stone-500 space-y-1">${section.notes.map(note => `<p>${escapeHtml(note)}</p>`).join("")}</div>`
      : "";
    return `
      <div class="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="text-lg font-semibold">${escapeHtml(section.title)}</h3>
            ${notes}
          </div>
          <div class="flex gap-2">
            <button type="button" data-section-id="${escapeHtml(section.id)}" class="menu-edit-section px-3 py-1 rounded bg-stone-900 text-white text-sm hover:bg-stone-700">編集</button>
            <button type="button" data-section-id="${escapeHtml(section.id)}" class="menu-delete-section px-3 py-1 rounded bg-red-100 text-red-700 text-sm hover:bg-red-200">削除</button>
          </div>
        </div>
        <div class="space-y-2">${items || '<div class="text-sm text-stone-500">まだメニューがありません。</div>'}</div>
      </div>
    `;
  }).join("");

  attachMenuHandlers();
}

function attachMenuHandlers() {
  document.querySelectorAll(".menu-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      activeMenuGroupId = btn.dataset.groupId;
      clearSectionForm();
      clearItemForm();
      renderMenuEditor();
    });
  });

  document.querySelectorAll(".menu-edit-section").forEach(btn => {
    btn.addEventListener("click", () => {
      const group = activeMenuGroup();
      const section = sectionById(group, btn.dataset.sectionId);
      if (!section) return;
      els.menuSectionId.value = section.id;
      els.menuSectionTitle.value = section.title;
      els.menuSectionNotes.value = section.notes.join("\n");
      els.menuSectionTitle.focus();
    });
  });

  document.querySelectorAll(".menu-delete-section").forEach(btn => {
    btn.addEventListener("click", async () => {
      const group = activeMenuGroup();
      const section = sectionById(group, btn.dataset.sectionId);
      if (!section || !confirm(`「${section.title}」を削除しますか？`)) return;
      group.sections = group.sections.filter(item => item.id !== section.id);
      clearSectionForm();
      clearItemForm();
      await saveMenuData("セクションを削除しました");
    });
  });

  document.querySelectorAll(".menu-edit-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const group = activeMenuGroup();
      const section = sectionById(group, btn.dataset.sectionId);
      const index = Number(btn.dataset.itemIndex);
      const item = section?.items[index];
      if (!item) return;
      editingItem = { groupId: group.id, sectionId: section.id, index };
      els.menuItemSection.value = section.id;
      els.menuItemIndex.value = String(index);
      els.menuItemName.value = item.name;
      els.menuItemPrice.value = item.price || "";
      els.menuItemNote.value = item.note || "";
      els.menuItemName.focus();
    });
  });

  document.querySelectorAll(".menu-delete-item").forEach(btn => {
    btn.addEventListener("click", async () => {
      const group = activeMenuGroup();
      const section = sectionById(group, btn.dataset.sectionId);
      const index = Number(btn.dataset.itemIndex);
      const item = section?.items[index];
      if (!item || !confirm(`「${item.name}」を削除しますか？`)) return;
      section.items.splice(index, 1);
      clearItemForm();
      await saveMenuData("メニュー項目を削除しました");
    });
  });
}

els.newsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isAdmin) {
    setStatus("権限がありません。", "error");
    return;
  }
  const payload = {
    title: els.newsTitle.value.trim(),
    date: els.newsDate.value.trim(),
    datetime: els.newsDatetime.value,
    category: els.newsCategory.value.trim(),
    category_color: safeBadgeClass(els.newsCategoryColor.value),
    content: els.newsContent.value.trim(),
    image: els.newsImage.value.trim() || null,
    alt: els.newsAlt.value.trim() || "",
    updatedAt: serverTimestamp()
  };
  if (!payload.title || !payload.date || !payload.datetime || !payload.category || !payload.content) {
    setStatus("必須項目を入力してください。", "error");
    return;
  }
  try {
    if (els.newsId.value) {
      await updateDoc(doc(db, NEWS_COLLECTION, els.newsId.value), payload);
      setStatus("更新しました", "success");
    } else {
      await addDoc(collection(db, NEWS_COLLECTION), payload);
      setStatus("追加しました", "success");
    }
    clearForm();
    loadNews();
  } catch (err) {
    console.error(err);
    setStatus("保存に失敗しました", "error");
  }
});

els.cancelBtn.addEventListener("click", clearForm);
els.reloadBtn.addEventListener("click", loadNews);

els.menuReloadBtn.addEventListener("click", loadMenuEditor);

els.menuSeedBtn.addEventListener("click", async () => {
  if (menuStore.data !== null || !confirm("初期メニューを公開しますか？")) return;
  menuData = normalizeMenuData(structuredClone(defaultMenuData));
  activeMenuGroupId = menuData.groups[0]?.id || "";
  await saveMenuData("初期メニューを保存しました");
});

els.menuGroupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const group = activeMenuGroup();
  if (!group) return;
  const title = els.menuGroupTitle.value.trim();
  const navLabel = els.menuGroupNavLabel.value.trim() || title;
  if (!title || !navLabel) {
    setMenuStatus("大分類の表示名とタブ名を入力してください。", "error");
    return;
  }
  Object.assign(group, { title, navLabel, label: els.menuGroupLabel.value.trim() });
  await saveMenuData("大分類を更新しました");
});

els.menuAddGroupBtn.addEventListener("click", async () => {
  const title = els.menuGroupTitle.value.trim();
  const navLabel = els.menuGroupNavLabel.value.trim() || title;
  if (!title) {
    setMenuStatus("追加する大分類の表示名を入力してください。", "error");
    return;
  }
  const id = uniqueId(safeSlug(navLabel || title, "menu"), menuData.groups);
  const group = {
    id,
    navLabel,
    title,
    label: els.menuGroupLabel.value.trim(),
    icon: "fa-solid fa-utensils text-amber-700",
    theme: menuThemeCycle[menuData.groups.length % menuThemeCycle.length],
    sections: []
  };
  menuData.groups.push(group);
  activeMenuGroupId = id;
  clearSectionForm();
  clearItemForm();
  await saveMenuData("大分類を追加しました");
});

els.menuDeleteGroupBtn.addEventListener("click", async () => {
  const group = activeMenuGroup();
  if (!group || menuData.groups.length <= 1) {
    setMenuStatus("大分類は1つ以上必要です。", "error");
    return;
  }
  if (!confirm(`「${group.title}」を削除しますか？`)) return;
  menuData.groups = menuData.groups.filter(item => item.id !== group.id);
  activeMenuGroupId = menuData.groups[0]?.id || "";
  clearSectionForm();
  clearItemForm();
  await saveMenuData("大分類を削除しました");
});

els.menuSectionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const group = activeMenuGroup();
  if (!group) return;
  const title = els.menuSectionTitle.value.trim();
  if (!title) {
    setMenuStatus("セクション名を入力してください。", "error");
    return;
  }
  const notes = els.menuSectionNotes.value
    .split(/\r?\n/)
    .map(note => note.trim())
    .filter(Boolean);
  const sectionId = els.menuSectionId.value;
  const current = sectionId ? sectionById(group, sectionId) : null;
  if (current) {
    current.title = title;
    current.notes = notes;
  } else {
    group.sections.push({
      id: uniqueId(safeSlug(title, "section"), group.sections),
      title,
      notes,
      items: []
    });
  }
  await saveMenuData(current ? "セクションを更新しました" : "セクションを追加しました");
});

els.menuClearSectionBtn.addEventListener("click", clearSectionForm);

els.menuItemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const group = activeMenuGroup();
  const section = sectionById(group, els.menuItemSection.value);
  if (!section) {
    setMenuStatus("追加先セクションを選択してください。", "error");
    return;
  }
  const item = {
    name: els.menuItemName.value.trim(),
    price: els.menuItemPrice.value.trim(),
    note: els.menuItemNote.value.trim()
  };
  if (!item.name) {
    setMenuStatus("メニュー名を入力してください。", "error");
    return;
  }
  try {
    updateMenuItem(group, editingItem, section.id, item);
    await saveMenuData(editingItem ? "メニュー項目を更新しました" : "メニュー項目を追加しました");
  } catch {
    setMenuStatus("編集対象が見つかりません。再読込してから編集し直してください。", "error");
  }
});

els.menuClearItemBtn.addEventListener("click", clearItemForm);

els.loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error(err);
    alert("ログインに失敗しました");
  }
});

els.logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  const version = ++authVersion;
  currentUser = user;
  isAdmin = false;
  menuBusy = false;
  menuStore.reset();
  clearItemForm();
  clearSectionForm();
  els.adminContent.classList.add("hidden");
  syncMenuControls();
  const permitted = await checkAdmin(user);
  if (version !== authVersion) return;
  isAdmin = permitted;
  els.userInfo.textContent = user ? `${user.displayName || user.email}` : "未ログイン";
  els.adminBadge.textContent = isAdmin ? "管理者" : "閲覧のみ";
  els.adminBadge.className = `px-3 py-1 rounded-full text-xs font-semibold ${isAdmin ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-700"}`;
  els.loginBtn.classList.toggle("hidden", !!user);
  els.logoutBtn.classList.toggle("hidden", !user);
  els.adminContent.classList.toggle("hidden", !isAdmin);
  if (user) {
    loadNews();
    if (isAdmin) loadMenuEditor();
  } else {
    els.newsList.innerHTML = '<div class="p-4 text-center text-stone-500">ログインしてください。</div>';
  }
});
