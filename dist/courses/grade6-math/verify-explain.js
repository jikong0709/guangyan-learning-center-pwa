/* 解題思路檢查（規格第 16 節）：每個 spec 的 gen 必須同時提供 explain（解法一）與 explain2（解法二，不同思路）。
   node verify-explain.js [topic ...] */
global.window = global;
const path = require("path"), fs = require("fs");
require(path.join(__dirname, "../../exam-engine/kit.js"));
const specs = {};
global.ExamBank = { register(t, g, a) { (specs[t] = specs[t] || []).push(...a); } };
const dir = path.join(__dirname, "banks");
fs.readdirSync(dir).filter(f => /^bank-.*\.js$/.test(f)).forEach(f => require(path.join(dir, f)));
const only = process.argv.slice(2), N = 60;
const squash = s => String(s).replace(/\s+/g, "").replace(/[，。；：、（）()]/g, "");
const numTokens = s => {
  const out = []; const t = String(s);
  (t.match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?/g) || []).forEach(x => {
    let m;
    if ((m = x.match(/^(\d+)\s+(\d+)\/(\d+)$/))) out.push(+m[1] + m[2] / m[3]);
    else if ((m = x.match(/^(\d+)\/(\d+)$/))) out.push(m[1] / m[2]);
    else out.push(parseFloat(x));
  });
  return out;
};
const val = a => { const t = numTokens(a); return t.length ? t[0] : null; };
const grams = s => { const q = squash(s), g = new Set(); for (let i = 0; i < q.length - 1; i++) g.add(q.slice(i, i + 2)); return g; };
const sim = (a, b) => { const A = grams(a), B = grams(b); let n = 0; A.forEach(x => { if (B.has(x)) n++; }); return n / Math.max(1, Math.min(A.size, B.size)); };
let bad = 0, total = 0; const problems = {};
const add = (id, msg) => { (problems[id] = problems[id] || new Set()).add(msg); };
for (const t of Object.keys(specs)) {
  if (only.length && !only.includes(t)) continue;
  for (const s of specs[t]) {
    total++;
    for (let i = 0; i < N; i++) {
      let o; try { o = s.gen(ExamKit); } catch (e) { add(s.id, "gen 丟錯"); break; }
      const e2 = o.explain2;
      if (typeof e2 !== "string" || !e2.trim()) { add(s.id, "缺 explain2"); break; }
      if (e2.length < 14) add(s.id, "explain2 太短");
      if (e2.length > 400) add(s.id, "explain2 太長(>400)");
      if (squash(e2) === squash(o.explain)) add(s.id, "explain2 與 explain 相同");
      else if (sim(o.explain, e2) > 0.6) add(s.id, "explain2 與 explain 太像（相似度>0.6，需不同思路）");
      if (/這個方法是照題目的數字直接列式計算/.test(o.explain + e2)) add(s.id, "含填充句「這個方法是照題目的數字直接列式計算」（解法二沒有真的換思路）");
      if (/\d+\/\d+\/\d+/.test(e2 + o.explain)) add(s.id, "出現巢狀分數（如 1/3/7）");
      if (/[=＝]\s*[-−]\s*\d/.test(e2) || /[（(]\s*[-−]\s*\d/.test(e2)) add(s.id, "解法二出現負數（國小六年級未學）");
      if (/(?<![\d.\/÷×＋－+\-−*]\s?)(?<![\d.\/])(\d+(?:\.\d+)?)\s*[=＝]\s*\1(?![\d.\/])/.test(e2)) add(s.id, "解法二含恆等式假步驟（如 4 = 4）");
      if (/[。，、]{2,}|。、|、。/.test(e2)) add(s.id, "解法二標點重複");
      if (/公寸/.test(e2 + o.explain)) add(s.id, "使用未定義單位「公寸」");
      // 2026-10-11 第七輪新增：機械改寫造成的文字損壞
      if (/(圓周率)\s*\1|([一-龥]{2,4})\s+\2(?![一-龥])/.test(e2)) add(s.id, "解法二有重複詞（如「圓周率 圓周率」）");
      if ((e2.match(/[(（]/g) || []).length !== (e2.match(/[)）]/g) || []).length) add(s.id, "解法二括號不成對");
      if (/\/\d\)\d|\d\)\d+\//.test(e2)) add(s.id, "解法二帶分數被拆壞（如 (42 3/1)0）");
      if (/(^|[^\d)）\s.])\s?[-−]\s?\d/.test(e2) || /(是|等於|得|為)\s?[-−]\s?\d/.test(e2)) add(s.id, "解法二出現負數（國小六年級未學）");
      if (/(?<![\d.\/])(\d+\/\d+)\s*[=＝等於]+\s*\1(?![\d.\/])/.test(e2)) add(s.id, "解法二含分數恆等式（如 4/5 = 4/5）");
      if (/[。，、；]\s?[:：]/.test(e2)) add(s.id, "解法二標點錯誤（如「。:」）");
      if (/\d(加|減|乘|除以)\d/.test(e2)) add(s.id, "解法二運算詞前後缺空格");
      if (/(?<![\d.\/])(?:\d{4,}\/\d+|\d{3}\/\d{2,})(?![\d\/])/.test(e2)) add(s.id, "解法二出現大分子假分數（難讀，請改帶分數或小數）");
      if (/敘述寫\s*圓周率|寫\s*圓周率\s*(?:倍|平方|公分)/.test(e2)) add(s.id, "3.14 被誤換成「圓周率」（題目量值不得替換）");
      if (/[A-Za-zＡ-Ｚａ-ｚ]/.test(e2.replace(/π/g, ""))) add(s.id, "explain2 含英文字母");
      if (/undefined|NaN|null/.test(e2)) add(s.id, "explain2 含 undefined/NaN");
      // 最終答案必須出現在解法二
      let okAns = true;
      if (s.type === "fill" || s.type === "calc" || s.type === "word") {
        const forms = [o.answer].concat(o.accepted || []).map(squash);
        const q2 = squash(e2); const av = val(o.answer);
        const nums = numTokens(e2);
        okAns = forms.some(f => f && q2.includes(f)) || (av !== null && nums.some(n => Math.abs(n - av) <= 1e-9 * Math.max(1, Math.abs(av))));
      } else if (s.type === "single") {
        const opt = o.options && o.options[o.answer]; okAns = opt !== undefined && squash(e2).includes(squash(opt));
      } else if (s.type === "tf") {
        okAns = /正確|錯誤|對|錯|成立|不成立/.test(e2);
      } else if (s.type === "multi") {
        okAns = (o.answer || []).some(ix => squash(e2).includes(squash(o.options[ix])));
        // 複選解法二必須逐項檢驗：每個選項（含錯項）的文字都要出現，且要有算式或理由（不得只有樣板句）
        if (!(o.options || []).every(op => squash(e2).includes(squash(op)))) add(s.id, "複選解法二沒有逐項檢驗（有選項文字未出現）");
        if ((e2.match(/\d/g) || []).length < 3 && !/[×÷＋－＝=]/.test(e2)) add(s.id, "複選解法二只有樣板、沒有算式或理由");
      }
      if (!okAns) add(s.id, "explain2 沒有寫出最終答案／正解");
    }
  }
}
Object.keys(problems).forEach(id => { bad++; if (bad <= 4000) console.log("FAIL", id, [...problems[id]].join("；")); });
console.log(bad ? "HAS FAIL (" + bad + "/" + total + " specs)" : "ALL PASS (" + total + " specs)");
process.exit(bad ? 1 : 0);
