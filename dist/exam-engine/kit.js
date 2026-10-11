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

  /* ===== 有理數工具（2026-10-11 追加）：讓同一題型能用「整數／小數／分數／帶分數」各種數字命題 ===== */
  const Q = (n, d) => { d = d === undefined ? 1 : d; if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error("kit.Q 只接受整數分子分母（收到 " + n + "/" + d + "）；請先乘以 10 的冪換成整數"); if (d < 0) { n = -n; d = -d; } const g = kit.gcd(n, d) || 1; return { n: n / g, d: d / g }; };
  kit.Q = Q;
  kit.qAdd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  kit.qSub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  kit.qMul = (a, b) => Q(a.n * b.n, a.d * b.d);
  kit.qDiv = (a, b) => Q(a.n * b.d, a.d * b.n);
  kit.qCmp = (a, b) => a.n * b.d - b.n * a.d;
  kit.qVal = a => a.n / a.d;
  kit.qIsInt = a => a.d === 1;
  kit.qIsTerminating = a => { let d = a.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
  /* 顯示：假分數 "7/4"（整數則 "3"） */
  kit.qFrac = a => a.d === 1 ? String(a.n) : a.n + "/" + a.d;
  /* 顯示：帶分數 "1 3/4"（真分數／整數則同 qFrac） */
  kit.qMixed = a => { if (a.d === 1 || Math.abs(a.n) < a.d) return kit.qFrac(a); const w = Math.trunc(a.n / a.d), r = Math.abs(a.n) - Math.abs(w) * a.d; return r === 0 ? String(w) : w + " " + r + "/" + a.d; };
  /* 顯示：有限小數字串；無限小數回 null */
  kit.qDec = a => { if (!kit.qIsTerminating(a)) return null; let d = a.d, t = 0, f = 0; while (d % 2 === 0) { d /= 2; t++; } while (d % 5 === 0) { d /= 5; f++; } return Math.max(t, f) > 4 ? null : kit.num(a.n / a.d); };
  /* 依風格顯示：flavor = "int" | "dec" | "frac" | "mixed"；dec 遇無限小數時退回分數 */
  kit.qShow = (a, flavor) => flavor === "dec" ? (kit.qDec(a) || kit.qFrac(a)) : flavor === "mixed" ? kit.qMixed(a) : kit.qFrac(a);
  /* 隨機取一種風格；allowed 例如 ["int","dec","frac","mixed"]，weights 同長度（省略則平均） */
  kit.flavor = (allowed, weights) => { allowed = allowed || ["int", "dec", "frac", "mixed"]; if (!weights) return kit.pick(allowed); let t = weights.reduce((x, y) => x + y, 0), r = Math.random() * t; for (let i = 0; i < allowed.length; i++) { r -= weights[i]; if (r <= 0) return allowed[i]; } return allowed[allowed.length - 1]; };
  /* 隨機產生指定風格的正有理數。opts: {min,max}（以數值計，預設 1~12）、dens（分母候選，預設 [2,3,4,5,6,8,10]）、places（小數位數 1 或 2，預設隨機）
     int：整數；dec：1~2 位小數（保證不是整數）；frac：真分數；mixed：帶分數（整數部分+真分數） */
  kit.randQ = (flavor, opts) => {
    opts = opts || {}; const lo = opts.min === undefined ? 1 : opts.min, hi = opts.max === undefined ? 12 : opts.max;
    const dens = opts.dens || [2, 3, 4, 5, 6, 8, 10];
    if (flavor === "int") return Q(kit.int(Math.ceil(lo), Math.floor(hi)));
    if (flavor === "dec") { const p = opts.places || kit.pick([1, 2]), m = Math.pow(10, p); const a = Math.ceil(lo * m), b = Math.floor(hi * m); if (b - a < 1 && a % m === 0) return Q(a / m); let n, g = 0; do { n = kit.int(a, b); } while (n % m === 0 && ++g < 200); return n % m === 0 ? Q(n / m) : Q(n, m); }
    const d = kit.pick(dens); let n;
    if (flavor === "frac") { do { n = kit.int(1, d - 1); } while (kit.gcd(n, d) !== 1 && d > 2); return Q(n, d); }
    const w = kit.int(Math.max(1, Math.ceil(lo)), Math.max(1, Math.floor(hi))); do { n = kit.int(1, d - 1); } while (kit.gcd(n, d) !== 1 && d > 2); return Q(w * d + n, d);
  };
  /* 把有理數答案包成 {answer, accepted}：flavor 決定標準答案的樣式，其餘等價寫法放 accepted（小數／假分數／帶分數） */
  kit.qAnswer = (a, flavor) => { const forms = [kit.qFrac(a), kit.qMixed(a)]; const dec = kit.qDec(a); if (dec !== null) forms.push(dec); const main = kit.qShow(a, flavor); return { answer: main, accepted: Array.from(new Set(forms)).filter(x => x !== main) }; };
  global.ExamKit = kit;
})(window);
