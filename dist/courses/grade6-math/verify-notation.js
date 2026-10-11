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
  const txt = [o.stem, ...(o.options || []), o.explain, o.trapNote || "", String(o.answer), ...(o.accepted || [])].join(" ");
  const m = txt.match(re);
  if (m && !bad[s.id]) bad[s.id] = { letters: [...new Set(m)].join(""), sample: txt.replace(/\s+/g, " ").slice(0, 80) };
}
const ks = Object.keys(bad);
ks.forEach(k => console.log("FAIL", k, "[" + bad[k].letters + "]", bad[k].sample));
console.log(ks.length ? "HAS FAIL (" + ks.length + " specs)" : "ALL PASS");
process.exit(ks.length ? 1 : 0);
