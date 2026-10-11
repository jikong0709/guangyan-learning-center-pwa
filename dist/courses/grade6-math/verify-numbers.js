/* 數字豐富度檢查（規格第 11 節）：node verify-numbers.js [topic ...]
   指標：題幹裡「整數／小數／分數(含帶分數)」三種風格的占比，以及每個 spec 是否能出多種風格。 */
global.window = global;
const path = require("path"), fs = require("fs");
require(path.join(__dirname, "../../exam-engine/kit.js"));
const specs = {};
global.ExamBank = { register(t, g, a) { (specs[t] = specs[t] || []).push(...a); } };
const dir = path.join(__dirname, "banks");
fs.readdirSync(dir).filter(f => /^bank-.*\.js$/.test(f)).forEach(f => require(path.join(dir, f)));

const only = process.argv.slice(2);
const N = 200;
const EXEMPT = { factor: { frac: true, dec: true }, "fraction-div": { int: true }, decimal: { int: true, frac: true } };   // 因數倍數本質整數；分數除法／小數除法題幹必含該類數字，不要求「純整數」題
const flavorsOf = txt => {
  const t = String(txt).replace(/3\.14|22\/7/g, " ");       // 圓周率常數不算「小數／分數命題」
  const mixed = /\d+\s*又\s*\d+\/\d+|\d+ \d+\/\d+/.test(t);
  const frac = /\d+\/\d+/.test(t.replace(/\d+\s*又\s*\d+\/\d+|\d+ \d+\/\d+/g, " "));
  const dec = /\d\.\d/.test(t);
  const s = new Set();
  if (mixed) s.add("mixed"); if (frac) s.add("frac"); if (dec) s.add("dec");
  if (!mixed && !frac && !dec) s.add("int");
  return s;
};
let bad = 0;
console.log("topic          整數only  含小數  含分數/帶分數  多風格spec(calc/fill/word)  位數規模  結果");
for (const t of Object.keys(specs)) {
  if (only.length && !only.includes(t)) continue;
  const ex = EXEMPT[t] || {};
  let n = 0, cInt = 0, cDec = 0, cFrac = 0;
  let numSpecs = 0, multiSpecs = 0; const digitBuckets = new Set();
  const notes = [];
  for (const s of specs[t]) {
    const seen = new Set(); const stems = new Set();
    for (let i = 0; i < N; i++) {
      const o = s.gen(ExamKit); const txt = o.stem;   // 只算題幹（選項會帶出計算結果，不算命題風格）
      stems.add(o.stem); n++;
      const f = flavorsOf(txt);
      if (f.has("int")) cInt++; if (f.has("dec")) cDec++; if (f.has("frac") || f.has("mixed")) cFrac++;
      f.forEach(x => seen.add(x));
      (txt.match(/\d+/g) || []).forEach(m => digitBuckets.add(Math.min(m.length, 4)));
    }
    if (["calc", "fill", "word"].includes(s.type) && stems.size > 5) { numSpecs++; if (seen.size >= 2) multiSpecs++; else notes.push(s.id); }
  }
  const p = x => Math.round(100 * x / n);
  const okInt = ex.int || p(cInt) >= 20, okDec = ex.dec || p(cDec) >= 25, okFrac = ex.frac || p(cFrac) >= 25;
  const okMulti = ex.dec && ex.frac ? true : numSpecs === 0 || multiSpecs / numSpecs >= 0.6;
  const okDigits = digitBuckets.size >= (ex.dec ? 3 : 2);
  const ok = okInt && okDec && okFrac && okMulti && okDigits;
  if (!ok) bad++;
  console.log(t.padEnd(14), (p(cInt) + "%").padEnd(9), (p(cDec) + "%").padEnd(7), (p(cFrac) + "%").padEnd(13),
    (multiSpecs + "/" + numSpecs).padEnd(26), ([...digitBuckets].sort().join(",")).padEnd(9), ok ? "PASS" : "FAIL");
  if (!ok && notes.length) console.log("   單一風格的 calc/fill/word spec：" + notes.join(", "));
}
console.log(bad ? "HAS FAIL (" + bad + " topics)" : "ALL PASS");
process.exit(bad ? 1 : 0);
