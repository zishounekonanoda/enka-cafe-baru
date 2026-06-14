import { readFile, writeFile } from "node:fs/promises";

const files = [
  "assets/js/admin.bundle.js",
  "assets/js/home-news.bundle.js",
  "assets/js/menu.bundle.js",
  "assets/js/vendor/ScrollTrigger.min.js",
  "assets/js/vendor/gsap.min.js"
];

for (const file of files) {
  const text = await readFile(file, "utf8");
  const normalized = text
    .split(/\r?\n/)
    .map(line => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
  await writeFile(file, normalized, "utf8");
}
