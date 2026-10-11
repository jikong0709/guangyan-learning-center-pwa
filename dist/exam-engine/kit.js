/* 出題共用工具包（跨科目共用）。題庫檔只准用這裡的函式，不自己重寫隨機/分數工具。 */
(function (global) {
  "use strict";
  const kit = {
    int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    gcd(a, b) { a = Math.abs(a); b = Math.abs(b); return b === 0 ? a : kit.gcd(b, a % b); },
    lcm(a, b) { return Math.abs(a * b) / kit.gcd(a, b); },
    /* 最簡分數字串："3/4"，分母為 1 時回整數字串 */
    frac(n, d) { const g = kit.gcd(n, d); n /= g; d /= g; if (d < 0) { n = -n; d = -d; } return d === 1 ? String(n) : n + "/" + d; },
    /* 去除浮點誤差，最多 4 位小數，整數不帶小數點 */
    num(x) { return String(Number(Number(x).toFixed(4))); },
    /* 取 n 個與 correct 不同、彼此不同的干擾選項（字串）；pool 為候選產生器或陣列 */
    distractors(correct, candidates, n) {
      const seen = new Set([String(correct)]); const out = [];
      for (const c of kit.shuffle(candidates)) { const s = String(c); if (!seen.has(s)) { seen.add(s); out.push(s); if (out.length === n) break; } }
      return out;
    },
    /* 組單選題 options：回傳 {options, answer}，answer 為正解索引（未洗牌，引擎會洗牌重算） */
    choices(correct, wrongs) { return { options: [String(correct)].concat(wrongs.map(String)), answer: 0 }; }
  };
  global.ExamKit = kit;
})(window);
