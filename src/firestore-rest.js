// 公開ページは読むだけなので Firebase SDK (数百KB) を使わず、Firestore の REST API を直接呼ぶ。
// API キーは公開前提の読み取り用。書き込みは firestore.rules で管理者に限定している。
const BASE = "https://firestore.googleapis.com/v1/projects/enka-a3819/databases/(default)/documents";
const KEY = "AIzaSyCpKJ5PuXPLXubvvXzRimZj9YnQ_1jsikc";

// Firestore REST の型付きの値 ({ stringValue: "..." } など) を普通の値に直す
export function fromFirestoreValue(value) {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(fromFirestoreValue);
  if ("mapValue" in value) return fromFirestoreDocument(value.mapValue);
  return null;
}

export function fromFirestoreDocument(doc) {
  const item = {};
  for (const [key, value] of Object.entries(doc?.fields ?? {})) item[key] = fromFirestoreValue(value);
  return item;
}

async function getJson(path) {
  const res = await fetch(`${BASE}/${path}${path.includes("?") ? "&" : "?"}key=${KEY}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore HTTP ${res.status}`);
  return res.json();
}

export async function listDocuments(collection) {
  const json = await getJson(`${collection}?pageSize=100`);
  return (json?.documents ?? []).map(fromFirestoreDocument);
}

export async function getDocument(path) {
  const json = await getJson(path);
  return json ? fromFirestoreDocument(json) : null;
}
