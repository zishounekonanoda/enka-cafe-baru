import { cp, mkdir } from "node:fs/promises";

await mkdir("assets/fontawesome/css", { recursive: true });
await mkdir("assets/fontawesome/webfonts", { recursive: true });

await cp(
  "node_modules/@fortawesome/fontawesome-free/css/all.min.css",
  "assets/fontawesome/css/all.min.css"
);
await cp(
  "node_modules/@fortawesome/fontawesome-free/webfonts",
  "assets/fontawesome/webfonts",
  { recursive: true }
);
