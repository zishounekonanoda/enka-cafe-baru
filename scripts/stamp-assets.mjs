// 公開用フォルダ (_site) の HTML が読み込む CSS / JS に、中身のハッシュを ?v= として付ける。
// GitHub Pages はファイルを最大10分キャッシュさせるので、付けないと「新しい HTML + 古い CSS」の
// 組み合わせで表示が崩れることがある。中身が変わればURLも変わり、ブラウザが必ず取り直す。
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const siteDir = resolve(process.argv[2] ?? "_site");
const pages = ["index.html", "menu.html", "admin/index.html"];

for (const page of pages) {
  const pagePath = join(siteDir, page);
  const html = await readFile(pagePath, "utf8");
  const replacements = [];
  for (const match of html.matchAll(/(?:href|src)="(\.{1,2}\/[^"?#]+\.(?:css|js))"/g)) {
    const url = match[1];
    const hash = createHash("sha256").update(await readFile(join(dirname(pagePath), url))).digest("hex").slice(0, 10);
    replacements.push([`"${url}"`, `"${url}?v=${hash}"`]);
  }
  let stamped = html;
  for (const [from, to] of replacements) stamped = stamped.replaceAll(from, to);
  await writeFile(pagePath, stamped, "utf8");
  console.log(`${page}: ${replacements.length} assets stamped`);
}
