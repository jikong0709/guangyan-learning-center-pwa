/* 教材慣用寫法檢查（規格第 12 節）：學生可見文字不得出現獨立英文字母（未知數要用 □）。 */
global.window = global;
const path = require("path"), fs = require("fs");
require(path.join(__dirname, "../../exam-engine/kit.js"));
const specs = {};
global.ExamBank = { register(t, g, a) { (specs[t] = specs[t] || []).push(...a); } };
const dir = path.join(__dirname, "banks");
fs.readdirSync(dir).filter(f => /^bank-.*\.js$/.test(f)).forEach(f => require(path.join(dir, f)));
const re = /[A-Za-zＡ-Ｚａ-ｚ]+|[*]/g;
const bad = {};
for (const t of Object.keys(specs)) for (const s of specs[t]) for (let i = 0; i < 100; i++) {
  const o = s.gen(ExamKit);
  const txt = [o.stem, ...(o.options || []), o.explain, o.trapNote || "", (typeof o.answer === "string" ? o.answer : ""), ...(o.accepted || [])].join(" ");
  const m = txt.match(re);
  if (m && !bad[s.id]) bad[s.id] = { letters: [...new Set(m)].join(""), sample: txt.replace(/\s+/g, " ").slice(0, 80) };
}
// □ 未知數題覆蓋（規格第 12 節）：每個 topic 要有足夠含 □ 的 spec（factor 只要 4 個，其他 8 個），且涵蓋 level 1~5 至少 4 級
const boxBad = [];
for (const t of Object.keys(specs)) {
  const ids = new Set(), lv = new Set();
  for (const s of specs[t]) { for (let i = 0; i < 40; i++) { if (String(s.gen(ExamKit).stem).includes("□")) { ids.add(s.id); lv.add(s.level); break; } } }
  const need = t === "factor" ? 4 : 8;
  if (ids.size < need || lv.size < 4) boxBad.push(t + "：含 □ 的 spec " + ids.size + "/" + need + "，level 涵蓋 " + [...lv].sort().join(","));
}
boxBad.forEach(x => console.log("FAIL □覆蓋", x));
const ks = Object.keys(bad);
ks.forEach(k => console.log("FAIL", k, "[" + bad[k].letters + "]", bad[k].sample));
const nfail = ks.length + boxBad.length;
console.log(nfail ? "HAS FAIL (" + nfail + ")" : "ALL PASS");
process.exit(nfail ? 1 : 0);
