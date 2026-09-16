import fs from "node:fs";
const P = "src/domain/heading.ts";
let s = fs.readFileSync(P, "utf8");
const from = `  // 1. / 1.2 / 1.2.3
  { test: /^(\d+(?:\.\d+)*)\.?\s+\S/, depthOf: (m) => m[1].split(".").length - 1 },`;
const to = `  // 1.2 / 1.2.3 — 마디가 여럿이면 번호가 확실하다
  { test: /^(\d{1,3}(?:\.\d{1,3})+)\.?\s+\S/, depthOf: (m) => m[1].split(".").length - 1 },
  // 1. — 마디가 하나면 점이 있어야 한다. 없으면 연도나 수량과 구별되지 않는다
  { test: /^\d{1,3}\.\s+\S/, depthOf: () => 0 },`;
if (!s.includes(from)) { console.log("찾지 못함"); process.exit(1); }
fs.writeFileSync(P, s.replace(from, to), "utf8");
console.log("고침");
