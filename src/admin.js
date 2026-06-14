import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";

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
  saveBtn: document.getElementById("save-btn")
};

let currentUser = null;
let isAdmin = false;

const NEWS_COLLECTION = "news";
const ADMIN_COLLECTION = "admins";
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
  currentUser = user;
  isAdmin = await checkAdmin(user);
  els.userInfo.textContent = user ? `${user.displayName || user.email}` : "未ログイン";
  els.adminBadge.textContent = isAdmin ? "管理者" : "閲覧のみ";
  els.adminBadge.className = `px-3 py-1 rounded-full text-xs font-semibold ${isAdmin ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-700"}`;
  els.loginBtn.classList.toggle("hidden", !!user);
  els.logoutBtn.classList.toggle("hidden", !user);
  els.adminContent.classList.toggle("hidden", !isAdmin);
  if (user) {
    loadNews();
  } else {
    els.newsList.innerHTML = '<div class="p-4 text-center text-stone-500">ログインしてください。</div>';
  }
});
