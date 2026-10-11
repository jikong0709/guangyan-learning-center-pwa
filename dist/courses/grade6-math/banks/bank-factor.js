/* 題庫：factor 質數、合數、質因數分解、最大公因數、最小公倍數（對應舊單元 上1）
   題庫工 A 自編。全部 gen 每次產生新數字。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, gcd = K.gcd, lcm = K.lcm, shuffle = K.shuffle;
  const T = "factor";
  const cnt = {};
  /* 解法一與解法二的字面相似度（二連字重疊比例） */
  function simTxt(a, b) {
    const sq = function (s) { return String(s).replace(/s+/g, "").replace(/[，。；：、（）()]/g, ""); };
    const gr = function (s) { const q = sq(s), g = new Set(); for (let i = 0; i < q.length - 1; i++) g.add(q.slice(i, i + 2)); return g; };
    const A = gr(a), B = gr(b); let n = 0; A.forEach(function (x) { if (B.has(x)) n++; });
    return n / Math.max(1, Math.min(A.size, B.size));
  }
  function mk(type, level, tag, gen) {
    cnt[type] = (cnt[type] || 0) + 1;
    const n = cnt[type];
    const idv = T + "-" + type + "-L" + level + "-" + (n < 10 ? "0" : "") + n;
    return { id: idv, type: type, level: level, tag: tag, gen: retry(function (kit) { const r = gen(kit); const f = ALT[idv]; if (f && !r.explain2) r.explain2 = f(r); const p1 = PRE[idv]; if (p1) r.explain = p1(r) + r.explain; r.explain = pi(pm(r.explain)); r.explain2 = pi(pm(r.explain2)); r.stem = pm(r.stem); if (r.options) r.options = r.options.map(pm); return r; }, type) };
  }
  /* 學生看得到的字串：分母不得超過 100、不得有 9 位以上數字，否則重抽（accepted 內的則直接剔除；accepted 可含精確的長小數） */
  function badStr(x) {
    x = String(x);
    let m; const re = /(\d+)\/(\d+)/g;
    while ((m = re.exec(x))) if (Number(m[2]) > 60) return true;
    return /\d{9,}|\d+\.\d{5,}/.test(x);
  }
  function badAcc(x) {
    x = String(x);
    let m; const re = /(\d+)\/(\d+)/g;
    while ((m = re.exec(x))) if (Number(m[2]) > 100) return true;
    return /\d{9,}/.test(x.replace(/\.\d+/, ""));
  }
  /* fill／calc／word 的答案若是「無限小數」（寫成分數），題幹補「（請以分數作答）」，已提到分數就不重複；
     這時也把「或小數作答」的提示改成只允許分數／帶分數。有限小數的答案不補。 */
  function nonTerminating(ans) {
    const m = /(\d+)\/(\d+)\s*$/.exec(String(ans));
    if (!m) return false;
    let d = Number(m[2]);
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    return d !== 1;
  }
  function addHint(r, type) {
    if ((type === "fill" || type === "calc" || type === "word") && typeof r.answer === "string" && nonTerminating(r.answer)) {
      if (/或小數作答/.test(r.stem)) r.stem = r.stem.replace("、帶分數或小數作答", "或帶分數作答").replace("或小數作答", "作答");
      if (!/分數/.test(r.stem)) r.stem = r.stem + "(請以分數作答)";
    }
    return r;
  }
  function retry(g, type) {
    return function (kit) {
      let last;
      for (let t = 0; t < 300; t++) {
        try {
          const r = addHint(g(kit), type);
          if (r.accepted) r.accepted = r.accepted.filter(function (x) { return !badAcc(x); });
          const seen = [r.stem, r.explain, r.explain2 || "", r.trapNote || "", String(r.answer)].concat(r.options || []);
          if (seen.some(badStr)) throw new Error("重抽");
          return r;
        } catch (e) { if (!/選項重複|干擾項不足|重抽/.test(e.message)) throw e; last = e; }
      }
      throw last;
    };
  }
  function S(correct, cands) {
    const w = K.distractors(correct, cands, 3);
    if (w.length < 3) throw new Error("干擾項不足");
    return K.choices(correct, w);
  }
  function M(stem, goods, bads, explain, trapNote) {
    const opts = goods.concat(bads).map(String);
    if (new Set(opts).size !== opts.length) throw new Error("複選選項重複");
    const o = { stem: stem, options: opts, answer: goods.map(function (_, i) { return i; }), explain: explain };
    if (trapNote) o.trapNote = trapNote;
    return o;
  }
  function isPrime(n) { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  function factorize(n) { const r = []; for (let p = 2; p * p <= n; p++) while (n % p === 0) { r.push(p); n /= p; } if (n > 1) r.push(n); return r; }
  function divisors(n) { const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; }
  function coprime(lo, hi) { let m, n; do { m = int(lo, hi); n = int(lo, hi); } while (m === n || gcd(m, n) !== 1); return [m, n]; }
  function gcd3(a, b, c) { return gcd(gcd(a, b), c); }
  function lcm3(a, b, c) { return lcm(lcm(a, b), c); }
  const PR = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  const CO = [21, 27, 33, 39, 45, 49, 51, 55, 57, 63, 65, 69, 77, 81, 85, 87, 91, 93, 95];

  const single = [
    mk("single", 1, "basic", function () {
      if (Math.random() < 0.5) {
        const p = pick(PR);
        const r = S(String(p), shuffle(CO).slice(0, 6).map(String));
        r.stem = "下列哪一個數是質數?"; r.explain = "質數只有 1 和它自己兩個因數。" + p + " 的因數只有 1 和 " + p + ",所以是質數;其他選項都還有別的因數,是合數。";
        return r;
      }
      const c = pick(CO);
      const r = S(String(c), shuffle(PR).slice(0, 6).map(String));
      r.stem = "下列哪一個數是合數?";
      r.explain = c + " 除了 1 和 " + c + " 之外,還有因數 " + factorize(c)[0] + ",所以是合數;其他選項都只有兩個因數,是質數。";
      return r;
    }),
    mk("single", 2, "basic", function () {
      const g = (Math.random() < 0.5 ? int(2, 12) : int(12 + 1, 12 * 3)), p = coprime(2, 9), m = p[0], n = p[1], a = g * m, b = g * n;
      const r = S(String(g), [lcm(a, b), Math.abs(a - b) === g ? g + 1 : Math.abs(a - b), g * 2, g + 1, Math.min(a, b), m * n, g + 2].map(String));
      r.stem = a + " 和 " + b + " 的最大公因數是多少?";
      r.explain = a + " = " + g + "×" + m + ",\n" + b + " = " + g + "×" + n + ",\n" + m + " 和 " + n + " 互質,所以最大公因數 = " + g + "。";
      return r;
    }),
    mk("single", 3, "trap", function () {
      const g = (Math.random() < 0.5 ? int(2, 9) : int(9 + 1, 9 * 3)), p = coprime(2, 7), m = p[0], n = p[1], a = g * m, b = g * n, L = g * m * n;
      const r = S(String(L), [a * b, g, m * n, a + b, L + g, a * n].map(String));
      r.stem = a + " 和 " + b + " 的最小公倍數是多少?";
      r.explain = a + " = " + g + "×" + m + ",\n" + b + " = " + g + "×" + n + "。\n最小公倍數 = " + g + "×" + m + "×" + n + " = " + L + "。";
      r.trapNote = "常見錯誤:直接把兩數相乘 " + a + "×" + b + " = " + (a * b) + "。相乘得到的是公倍數,但兩數有公因數 " + g + " 時,不是最小的;要先除掉重複的公因數。";
      return r;
    }),
    mk("single", 4, "trap", function () {
      const k = int(3, 4), f = [];
      for (let i = 0; i < k; i++) f.push(pick([2, 3, 5, 7]));
      f.sort(function (x, y) { return x - y; });
      const N = f.reduce(function (x, y) { return x * y; }, 1);
      const correct = f.join("×");
      const c = [];
      for (let i = 0; i < f.length - 1; i++) { const g = f.slice(); g.splice(i, 2, f[i] * f[i + 1]); c.push(g.join("×")); }
      const w = f.slice(); const last = w[w.length - 1]; w[w.length - 1] = pick([2, 3, 5, 7].filter(function (x) { return x !== last; })); c.push(w.join("×"));
      c.push("1×" + correct);
      const r = S(correct, c);
      r.stem = "下列哪一個,是 " + N + " 分解質因數的結果(寫成質數連乘)?";
      r.explain = N + " 一直用質數去除:" + N + " = " + correct + "。每個因數都是質數,且乘起來等於 " + N + "。";
      r.trapNote = "常見錯誤:選到乘積雖然也是 " + N + ",但裡面含有合數(例如把兩個質數先乘起來)或含有 1 的選項。質因數分解要求每個因數都是質數,1 不是質數。";
      return r;
    }),
    mk("single", 5, "extend", function () {
      const g = int(2, 6), p = coprime(2, 6), m = p[0], n = p[1], a = g * m, b = g * n, L = g * m * n;
      const r = S(String(b), [n, L - a, m * n, g + n, a + g, L / a * g + g].map(String));
      r.stem = "甲、乙兩數的最大公因數是 " + g + ",最小公倍數是 " + L + "。已知甲數是 " + a + ",求乙數是多少?";
      r.explain = "兩數的乘積 = 最大公因數 × 最小公倍數,\n所以乙數 = " + g + "×" + L + " ÷ " + a + " = " + (g * L) + " ÷ " + a + " = " + b + "。";
      return r;
    })
  ];

  const multi = [
    mk("multi", 2, "basic", function () {
      const nc = int(2, 3);
      const goods = shuffle(PR).slice(0, nc).sort(function (x, y) { return x - y; });
      const bads = shuffle(CO).slice(0, 5 - nc).sort(function (x, y) { return x - y; });
      return M("下列各數中,哪些是質數?選出所有正確的。", goods, bads,
        "質數只有 1 和自己兩個因數。質數是:" + goods.join("、") + "。\n其餘 " + bads.map(function (b) { return b + "(=" + factorize(b).join("×") + ")"; }).join("、") + " 都是合數。");
    }),
    mk("multi", 3, "basic", function () {
      const g = pick([4, 6, 8, 9, 10, 12]), p = coprime(2, 5), a = g * p[0], b = g * p[1];
      const da = divisors(a), db = divisors(b);
      const cd = da.filter(function (x) { return b % x === 0; });
      const goods = shuffle(cd).slice(0, cd.length >= 3 ? 3 : 2).sort(function (x, y) { return x - y; });
      const pool = [a, b, lcm(a, b)].concat(da.filter(function (x) { return b % x !== 0; }), db.filter(function (x) { return a % x !== 0; }));
      const bads = [];
      shuffle(pool).forEach(function (x) { if (bads.length < 2 && bads.indexOf(x) < 0 && goods.indexOf(x) < 0) bads.push(x); });
      return M(a + " 和 " + b + " 的公因數有哪些?選出所有正確的。", goods, bads,
        a + " 的因數:" + da.join("、") + ";\n" + b + " 的因數:" + db.join("、") + "。\n兩邊都有的才是公因數:" + cd.join("、") + "。");
    }),
    mk("multi", 3, "trap", function () {
      const p = pick(PR), c = pick(CO), d = factorize(c)[0];
      const trues = [
        p + " 是質數,因為它只有 1 和 " + p + " 兩個因數。",
        "1 既不是質數,也不是合數。",
        c + " 是合數,因為它除了 1 和 " + c + " 之外,還有因數 " + d + "。",
        "2 是質數,而且是唯一的偶質數。"
      ];
      const falses = [
        c + " 是奇數,所以 " + c + " 一定是質數。",
        "質數都是奇數。",
        "1 是最小的質數。",
        "兩個質數相加,和一定是質數。"
      ];
      const goods = shuffle(trues).slice(0, int(2, 3));
      const bads = shuffle(falses).slice(0, 5 - goods.length > 2 ? 2 : 5 - goods.length);
      const r = M("下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "正確的敘述要符合定義:質數恰有兩個因數,1 只有一個因數(既非質數也非合數),2 是唯一的偶質數。\n錯誤的例子:" + c + "=" + factorize(c).join("×") + " 是奇數卻是合數;3+5=8 是合數;質數 2 是偶數。",
        "常見錯誤:認為奇數都是質數(如 " + c + ")、質數都是奇數(漏了 2)、把 1 當質數。");
      return r;
    }),
    mk("multi", 4, "trap", function () {
      const g = int(2, 4), p = coprime(2, 5), a = g * p[0], b = g * p[1], L = lcm(a, b);
      const goods = shuffle([1, 2, 3, 4]).slice(0, int(2, 3)).sort(function (x, y) { return x - y; }).map(function (k) { return k * L; });
      const wp = [];
      for (let k = 1; k <= 6; k++) { if ((k * a) % b !== 0) wp.push(k * a); if ((k * b) % a !== 0) wp.push(k * b); }
      const bads = [];
      shuffle(wp).forEach(function (x) { if (bads.length < 2 && bads.indexOf(x) < 0 && goods.indexOf(x) < 0) bads.push(x); });
      return M(a + " 和 " + b + " 的公倍數有哪些?選出所有正確的。", goods, bads,
        "最小公倍數 = " + L + ",公倍數就是 " + L + " 的倍數:" + L + "、" + (2 * L) + "、" + (3 * L) + "……\n" +
        "選項中只有 " + goods.join("、") + " 同時是 " + a + " 和 " + b + " 的倍數。" + bads.join("、") + " 只是其中一數的倍數,不是公倍數。",
        "常見錯誤:看到某數是 " + a + " 或 " + b + " 的倍數就選。公倍數必須「同時」是兩個數的倍數,可以用最小公倍數 " + L + " 的倍數來檢查。");
    }),
    mk("multi", 5, "extend", function () {
      const g = int(2, 4), p = coprime(2, 4), a = g * p[0], b = g * p[1], L = lcm(a, b);
      const k0 = int(2, 3), lo = k0 * L, hi = (k0 + 2) * L;
      const inRange = [k0 * L, (k0 + 1) * L, (k0 + 2) * L];
      const goods = shuffle(inRange).slice(0, 2).sort(function (x, y) { return x - y; });
      const pool = [L, (k0 + 3) * L];
      for (let k = 1; k <= 20; k++) {
        [k * a, k * b].forEach(function (x) { if (x >= lo && x <= hi && x % L !== 0) pool.push(x); });
      }
      const bads = [];
      shuffle(pool).forEach(function (x) { if (bads.length < 2 && bads.indexOf(x) < 0 && goods.indexOf(x) < 0) bads.push(x); });
      return M("有一個數同時是 " + a + " 和 " + b + " 的倍數,而且介於 " + lo + " 到 " + hi + " 之間(包含 " + lo + " 和 " + hi + ")。下列哪些數有可能是這個數?選出所有正確的。", goods, bads,
        a + " 和 " + b + " 的最小公倍數是 " + L + ",所以要找 " + L + " 的倍數。" + lo + " 到 " + hi + " 之間的有 " + inRange.join("、") + "。\n" +
        "選項中符合的是 " + goods.join("、") + ";" + bads.join("、") + " 不是公倍數,或不在範圍內。");
    })
  ];

  const tf = [
    mk("tf", 1, "basic", function () {
      const isP = Math.random() < 0.5, n = isP ? pick(PR) : pick(CO);
      return { stem: n + " 是質數。", answer: isP,
        explain: isP ? n + " 只有 1 和 " + n + " 兩個因數,是質數。" : n + " = " + factorize(n).join("×") + ",還有 1 和 " + n + " 以外的因數,是合數,不是質數。" };
    }),
    mk("tf", 2, "trap", function () {
      const c = pick(CO), p = pick(PR);
      const pool = [
        { s: "1 是質數。", a: false, w: "質數必須恰好有兩個因數,1 只有一個因數(它自己),所以 1 不是質數,也不是合數。" },
        { s: "2 是質數,也是偶數。", a: true, w: "2 的因數只有 1 和 2,是質數;2 又是偶數,而且是唯一的偶質數。" },
        { s: "所有的質數都是奇數。", a: false, w: "2 是質數卻是偶數,所以這句話是錯的。" },
        { s: "最小的合數是 4。", a: true, w: "2、3 是質數,4 = 2×2 有因數 1、2、4,是最小的合數。" },
        { s: c + " 是奇數,所以它是質數。", a: false, w: c + " = " + factorize(c).join("×") + ",是合數。奇數不一定是質數。" },
        { s: p + " 是質數,所以 " + p + " 的倍數裡," + (p * 2) + " 也是質數。", a: false, w: p + " 以外的倍數至少有 1、" + p + "、自己三個因數,是合數。" },
        { s: "1 是合數。", a: false, w: "1 只有一個因數,不是合數也不是質數。" }
      ];
      const x = pick(pool);
      return { stem: x.s, answer: x.a, explain: x.w, trapNote: "易錯觀念:1 不是質數;2 是唯一的偶質數;奇數不一定是質數;質數的倍數(除了它自己)都是合數。" };
    }),
    mk("tf", 3, "trap", function () {
      const co = Math.random() < 0.4;
      let a, b;
      if (co) { const p = coprime(4, 15); a = p[0]; b = p[1]; } else { do { a = int(4, 15); b = int(4, 15); } while (a === b || gcd(a, b) === 1); }
      const L = lcm(a, b), truth = (L === a * b);
      return { stem: a + " 和 " + b + " 的最小公倍數是 " + (a * b) + "。", answer: truth,
        explain: a + " 和 " + b + " 的最大公因數是 " + gcd(a, b) + "," + (truth ? "兩數互質,所以最小公倍數 = " + a + "×" + b + " = " + (a * b) + "。" : "最小公倍數 = " + a + "×" + b + " ÷ " + gcd(a, b) + " = " + L + ",不是 " + (a * b) + "。"),
        trapNote: "易錯:以為最小公倍數一定等於兩數相乘。只有兩數互質(最大公因數是 1)時才成立,有公因數時要再除掉公因數。" };
    }),
    mk("tf", 4, "basic", function () {
      const g = (Math.random() < 0.5 ? int(2, 9) : int(9 + 1, 9 * 3)), p = coprime(2, 7), a = g * p[0], b = g * p[1];
      const right = Math.random() < 0.5;
      const x = right ? g : pick([lcm(a, b), g + 1, Math.min(a, b), g * 2].filter(function (v) { return v !== g; }));
      return { stem: a + " 和 " + b + " 的最大公因數是 " + x + "。", answer: right,
        explain: a + " = " + g + "×" + p[0] + ",\n" + b + " = " + g + "×" + p[1] + "。\n最大公因數是 " + g + (right ? ",敘述正確。" : ",不是 " + x + "。") };
    }),
    mk("tf", 5, "extend", function () {
      const g = int(2, 6), p = coprime(2, 6), L = g * p[0] * p[1];
      const right = Math.random() < 0.5;
      const X = right ? g * L : pick([g + L, L * L / g, L / g].filter(function (v) { return v !== g * L; }));
      return { stem: "甲、乙兩數的最大公因數是 " + g + ",最小公倍數是 " + L + ",則甲數和乙數的乘積是 " + K.num(X) + "。", answer: right,
        explain: "兩數的乘積 = 最大公因數 × 最小公倍數 = " + g + "×" + L + " = " + (g * L) + (right ? ",敘述正確。" : ",不是 " + K.num(X) + "。") };
    })
  ];

  const fill = [
    mk("fill", 1, "basic", function () {
      let a = int(10, 90), p = a + 1; while (!isPrime(p)) p++;
      return { stem: "比 " + a + " 大的最小質數是 ____。", answer: String(p), explain: "從 " + (a + 1) + " 往上逐一檢查:" + (a + 1) + " 到 " + (p - 1) + " 都有質數以外的因數,第一個只有 1 和自己兩個因數的是 " + p + "。" };
    }),
    mk("fill", 2, "basic", function () {
      const g = (Math.random() < 0.5 ? int(2, 9) : int(9 + 1, 9 * 3)), p = coprime(2, 8), a = g * p[0], b = g * p[1], L = g * p[0] * p[1];
      return { stem: a + " 和 " + b + " 的最小公倍數是 ____。", answer: String(L), explain: a + " = " + g + "×" + p[0] + ",\n" + b + " = " + g + "×" + p[1] + "。\n最小公倍數 = " + g + "×" + p[0] + "×" + p[1] + " = " + L + "。" };
    }),
    mk("fill", 3, "basic", function () {
      const k = int(3, 4), f = [];
      for (let i = 0; i < k; i++) f.push(pick([2, 3, 5, 7, 11]));
      f.sort(function (x, y) { return x - y; });
      const N = f.reduce(function (x, y) { return x * y; }, 1), mx = f[f.length - 1];
      return { stem: N + " 的質因數中,最大的是 ____。", answer: String(mx), explain: N + " = " + f.join("×") + ",其中最大的質因數是 " + mx + "。" };
    }),
    mk("fill", 4, "trap", function () {
      const g = pick([6, 8, 9, 10, 12, 16]), p = coprime(2, 5), a = g * p[0], b = g * p[1];
      const cd = divisors(a).filter(function (x) { return b % x === 0; });
      return { stem: a + " 和 " + b + " 的公因數共有 ____ 個。", answer: String(cd.length), accepted: [cd.length + "個"], units: ["個"],
        explain: a + " 和 " + b + " 的最大公因數是 " + gcd(a, b) + ",公因數就是最大公因數的因數:" + cd.join("、") + ",共 " + cd.length + " 個。",
        trapNote: "常見錯誤:把「最大公因數 " + gcd(a, b) + "」當成答案。題目問的是公因數的「個數」,要把 " + gcd(a, b) + " 的所有因數都數進去(包含 1)。" };
    }),
    mk("fill", 5, "extend", function () {
      let a, b, c, L;
      do { const s = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20]; const t = shuffle(s); a = t[0]; b = t[1]; c = t[2]; L = lcm3(a, b, c); } while (L > 360 || L === Math.max(a, b, c));
      return { stem: a + "、" + b + "、" + c + " 三個數的最小公倍數是 ____。", answer: String(L),
        explain: "先求 " + a + " 和 " + b + " 的最小公倍數 " + lcm(a, b) + ",再和 " + c + " 求最小公倍數:" + L + "。" };
    })
  ];

  const calc = [
    mk("calc", 1, "basic", function () {
      const g = (Math.random() < 0.5 ? int(2, 12) : int(12 + 1, 12 * 3)), p = coprime(2, 9), a = g * p[0], b = g * p[1];
      return { stem: "求 " + a + " 和 " + b + " 的最大公因數。", answer: String(g), explain: "短除法:" + a + " 和 " + b + " 同除以 " + g + ",得 " + p[0] + " 和 " + p[1] + ",已互質。最大公因數 = " + g + "。" };
    }),
    mk("calc", 2, "basic", function () {
      const g = (Math.random() < 0.5 ? int(2, 8) : int(8 + 1, 8 * 3)), p = coprime(2, 9), a = g * p[0], b = g * p[1], L = g * p[0] * p[1];
      return { stem: "求 " + a + " 和 " + b + " 的最小公倍數。", answer: String(L), explain: "短除法:同除以 " + g + ",商 " + p[0] + " 和 " + p[1] + " 互質。最小公倍數 = " + g + "×" + p[0] + "×" + p[1] + " = " + L + "。" };
    }),
    mk("calc", 3, "basic", function () {
      const g = (Math.random() < 0.5 ? int(6, 24) : int(24 + 1, 24 * 3)), p = coprime(3, 9), a = g * p[0], b = g * p[1];
      const G = gcd(a, b);
      return { stem: "利用短除法或質因數分解,求 " + a + " 和 " + b + " 的最大公因數。", answer: String(G),
        explain: a + " = " + factorize(a).join("×") + ",\n" + b + " = " + factorize(b).join("×") + "。\n共同的質因數相乘,最大公因數 = " + G + "。" };
    }),
    mk("calc", 4, "trap", function () {
      const ps = shuffle([2, 3, 5, 7, 11]).slice(0, 3).sort(function (x, y) { return x - y; });
      const rep = ps[int(0, 1)];
      const f = [rep, rep, ps[0] === rep ? ps[1] : ps[0]];
      const other = ps.filter(function (x) { return f.indexOf(x) < 0; })[0];
      f.push(other);
      f.sort(function (x, y) { return x - y; });
      const N = f.reduce(function (x, y) { return x * y; }, 1);
      const distinct = f.filter(function (x, i) { return f.indexOf(x) === i; });
      const s = distinct.reduce(function (x, y) { return x + y; }, 0);
      return { stem: N + " 有哪幾個不同的質因數?請算出這些不同質因數的總和。", answer: String(s),
        explain: N + " = " + f.join("×") + ",不同的質因數是 " + distinct.join("、") + ",總和 = " + distinct.join("+") + " = " + s + "。",
        trapNote: "常見錯誤:把重複的質因數 " + rep + " 也加兩次,得到 " + f.reduce(function (x, y) { return x + y; }, 0) + "。「不同的」質因數,重複的只算一次。" };
    }),
    mk("calc", 5, "extend", function () {
      const g = int(2, 6), p = coprime(2, 7), a = g * p[0], b = g * p[1], L = g * p[0] * p[1];
      return { stem: "求 " + a + " 和 " + b + " 的「最大公因數」與「最小公倍數」的和。", answer: String(g + L),
        explain: "最大公因數 = " + g + ",最小公倍數 = " + L + "(" + g + "×" + p[0] + "×" + p[1] + ")。\n和 = " + g + " + " + L + " = " + (g + L) + "。" };
    })
  ];

  const word = [
    mk("word", 2, "basic", function () {
      const p = coprime(3, 9), g = int(1, 2), a = p[0] * g, b = p[1] * g, L = lcm(a, b);
      return { stem: "甲路公車每 " + a + " 分鐘發一班車,乙路公車每 " + b + " 分鐘發一班車。兩路公車在早班同時發車後,至少要再過多少分鐘,才會又同時發車?", answer: String(L), units: ["分鐘", "分"],
        explain: "要找 " + a + " 和 " + b + " 的最小公倍數。\n" + a + " 和 " + b + " 的最小公倍數 = " + L + "。\n答:" + L + " 分鐘後。" };
    }),
    mk("word", 3, "basic", function () {
      const g = int(2, 8), p = coprime(2, 9), a = g * p[0] * int(1, 2), b = g * p[1] * int(1, 2), G = gcd(a, b);
      return { stem: "有 " + a + " 顆糖果和 " + b + " 塊餅乾,要平均分給一些小朋友,每人分到的糖果一樣多、餅乾也一樣多,而且全部分完。最多可以分給幾位小朋友?", answer: String(G), units: ["位", "人", "個"],
        explain: "人數要同時能整除 " + a + " 和 " + b + ",要最多就是最大公因數。\n" + a + " 和 " + b + " 的最大公因數 = " + G + "。\n答:" + G + " 位。" };
    }),
    mk("word", 4, "trap", function () {
      const g = (Math.random() < 0.5 ? int(3, 12) : int(12 + 1, 12 * 3)), p = coprime(2, 5), a = g * p[0], b = g * p[1], n = p[0] * p[1];
      return { stem: "一塊長 " + a + " 公分、寬 " + b + " 公分的長方形紙板,要剪成大小相同的正方形,而且正方形的邊長要盡量長、紙板不能有剩。可以剪出幾個正方形?", answer: String(n), units: ["個", "張", "塊"],
        explain: "正方形邊長最大 = " + a + " 和 " + b + " 的最大公因數 = " + g + " 公分。\n長邊可剪 " + a + "÷" + g + " = " + p[0] + " 個,寬邊可剪 " + b + "÷" + g + " = " + p[1] + " 個。\n共 " + p[0] + "×" + p[1] + " = " + n + " 個。",
        trapNote: "常見錯誤:算出最大公因數 " + g + " 就當成答案。" + g + " 是正方形的邊長(公分),題目問的是「個數」,還要用長寬各自除以邊長再相乘。" };
    }),
    mk("word", 4, "extend", function () {
      const g = int(2, 7), t = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), a = g * t[0], b = g * t[1], c = g * t[2], G = gcd3(a, b, c);
      return { stem: "三條繩子分別長 " + a + " 公分、" + b + " 公分、" + c + " 公分,要剪成長度相同的小段,而且不能有剩。每一小段最長是幾公分?", answer: String(G), units: ["公分", "cm"],
        explain: "每段長度要能整除三個長度,最長就是三數的最大公因數。\n先求 " + a + " 和 " + b + " 的最大公因數 " + gcd(a, b) + ",再和 " + c + " 求最大公因數,得 " + G + "。\n答:" + G + " 公分。" };
    }),
    mk("word", 5, "extend", function () {
      let a, b, c, L;
      do { const t = shuffle([2, 3, 4, 5, 6, 8, 9, 10, 12, 15]); a = t[0]; b = t[1]; c = t[2]; L = lcm3(a, b, c); } while (L > 180 || L === Math.max(a, b, c));
      return { stem: "甲每 " + a + " 天、乙每 " + b + " 天、丙每 " + c + " 天輪值一次。今天三個人剛好同時輪值,至少再過幾天,三個人會再度同一天輪值?", answer: String(L), units: ["天", "日"],
        explain: "要求 " + a + "、" + b + "、" + c + " 的最小公倍數。\n先求 " + a + " 和 " + b + " 的最小公倍數 " + lcm(a, b) + ",再和 " + c + " 求最小公倍數,得 " + L + "。\n答:" + L + " 天後。" };
    })
  ];

  /* ===== 教材式 □ 未知數題（規格第 14 節）===== */
  const boxes = [
    mk("single", 1, "basic", function () {
      const B = int(3, 40), k = int(3, 30), A = B * k;
      const r = S(String(k), [A + B, A - B, A * B, B, k + 1, k - 1, k * 2].map(String));
      r.stem = "「" + A + " = " + B + " × □」,□ 是多少?";
      r.explain = A + " ÷ " + B + " = " + k + ",所以 □ = " + k + "。(驗算:" + B + " × " + k + " = " + A + ")";
      return r;
    }),
    mk("fill", 2, "basic", function () {
      const g = (Math.random() < 0.5 ? int(2, 12) : int(13, 36)), p = coprime(2, 9), a = g * p[0], b = g * p[1];
      return { stem: "「□ 是 " + a + " 與 " + b + " 的最大公因數」,□ = ____", answer: String(g),
        explain: a + " = " + g + "×" + p[0] + ",\n" + b + " = " + g + "×" + p[1] + ",\n" + p[0] + " 和 " + p[1] + " 互質,所以 □ = " + g + "。" };
    }),
    mk("tf", 3, "trap", function () {
      const g = int(2, 12), p = coprime(2, 7), a = g * p[0], b = g * p[1], L = lcm(a, b);
      const right = Math.random() < 0.5, x = right ? g : pick([L, Math.min(a, b), g * 2].filter(function (v) { return v !== g; }));
      return { stem: "「□ 是 " + a + " 的因數,也是 " + b + " 的因數」,□ 最大是 " + x + "。", answer: right,
        explain: a + " 和 " + b + " 的公因數中最大的是最大公因數 " + g + (right ? ",敘述正確。" : ",不是 " + x + "。"),
        trapNote: "易錯:「同時是兩數的因數」要找的是最大公因數;最小公倍數 " + L + " 或較小的數 " + Math.min(a, b) + " 都不是兩數共同的因數。" };
    }),
    mk("calc", 4, "trap", function () {
      const g = int(2, 9), p = coprime(2, 7), m = p[0], n = p[1], a = g * m, b = g * n, L = g * m * n;
      return { stem: "「" + a + " 與 □ 的最大公因數是 " + g + ",最小公倍數是 " + L + "」,求 □。", answer: String(b),
        explain: "兩數的乘積 = 最大公因數 × 最小公倍數:" + a + " × □ = " + g + " × " + L + " = " + (g * L) + ",所以 □ = " + (g * L) + " ÷ " + a + " = " + b + "。\n驗算:" + a + " 與 " + b + " 的最大公因數是 " + g + ",最小公倍數是 " + L + "。",
        trapNote: "常見錯誤:只用最小公倍數,算成 " + L + " ÷ " + a + " = " + K.num(L / a) + ",漏掉最大公因數 " + g + "。要用「兩數乘積 = 最大公因數 × 最小公倍數」。" };
    }),
    mk("word", 5, "extend", function () {
      const g = int(2, 6), p = coprime(2, 6), m = p[0], n = p[1], a = g * m, b = g * n, L = g * m * n;
      return { stem: "甲每 " + a + " 天、乙每 □ 天去一次圖書館。今天兩人同時去,下一次要 " + L + " 天後才又同一天去,而且 " + a + " 與 □ 的最大公因數是 " + g + "。乙每 □ 是多少天去一次?", answer: String(b), units: ["天", "日"],
        explain: "同一天再去的間隔是最小公倍數 " + L + "。兩數乘積 = 最大公因數 × 最小公倍數:" + a + " × □ = " + g + " × " + L + " = " + (g * L) + ",□ = " + (g * L) + " ÷ " + a + " = " + b + " 天。" };
    })
  ];

  /* ===== 解法二（規格第 16 節）：與解法一不同的思路，用這一題實際的數字動態產生 ===== */
  const NM = function (s) { return (String(s).match(/\d+/g) || []).map(Number); };
  function spf(n) { for (let d = 2; d * d <= n; d++) if (n % d === 0) return d; return n; }
  function eu(a, b) { let x = Math.max(a, b), y = Math.min(a, b); const st = []; while (y) { st.push(x + " ÷ " + y + " = " + Math.floor(x / y) + " 餘 " + (x % y)); const t = x % y; x = y; y = t; } return { s: st.join(";"), g: x }; }
  function lcmTxt(a, b) {
    const e = eu(a, b), L = a / e.g * b, mx = Math.max(a, b), mn = Math.min(a, b);
    if (L / mx <= 10) { const ms = []; for (let k = 1; k <= L / mx; k++) ms.push(mx * k); return mx + " 的倍數:" + ms.join("、") + ",第一個也是 " + mn + " 的倍數的是 " + L; }
    return "先求最大公因數 " + e.g + "(" + e.s + "),再算 " + a + " ÷ " + e.g + " × " + b + " = " + L;
  }
  function cdTxt(a, b) {
    const da = divisors(a), db = divisors(b);
    if (da.length > 12 || db.length > 12) { const e = eu(a, b); return "用輾轉相除法:" + e.s + ";最後的除數 " + e.g + " 就是最大公因數"; }
    const cd = da.filter(function (x) { return b % x === 0; });
    return a + " 的因數:" + da.join("、") + ";" + b + " 的因數:" + db.join("、") + ";共同的有 " + cd.join("、") + ",最大的是 " + cd[cd.length - 1];
  }
  function chain(N) { const st = []; let n = N; while (n > 1) { const d = spf(n); st.push(n + " ÷ " + d + " = " + (n / d)); n /= d; } return st.join(";"); }
  function expMap(n) { const m = {}; factorize(n).forEach(function (p) { m[p] = (m[p] || 0) + 1; }); return m; }
  function fstr(n) { return factorize(n).join("×"); }
  /* 自我核對：解法二算出來的值必須和標準答案一致，否則丟錯 */
  function fk(v, r) { if (String(v) !== String(r.answer)) throw new Error("explain2 與答案不一致:" + v); }
  function fkOpt(v, r) { if (String(v) !== String(r.options[r.answer])) throw new Error("explain2 與答案不一致:" + v); }
  function ftf(r, truth) { if (!!truth !== !!r.answer) throw new Error("explain2 與答案不一致(是非)"); }
  function fm(r, flags) { const want = flags.map(function (x, i) { return x ? i : -1; }).filter(function (i) { return i >= 0; }).join(","); if (r.answer.join(",") !== want) throw new Error("explain2 與答案不一致(複選)"); }
  function fs1(r, flags) { if (!flags[r.answer] || flags.filter(Boolean).length !== 1) throw new Error("explain2 與答案不一致(單選)"); }
  function fdesc(n) { return factorize(n).length === 1 ? n + " 是質數" : n + " = " + fstr(n); }
  /* 短除法：同除以共同的質數，直到兩個商互質 */
  function sdText(a, b) {
    const st = [], dv = []; let x = a, y = b;
    for (;;) {
      let p = 0;
      for (let d = 2; d <= Math.min(x, y); d++) if (isPrime(d) && x % d === 0 && y % d === 0) { p = d; break; }
      if (!p) break;
      st.push("同除以 " + p + " 得 " + (x / p) + "、" + (y / p)); dv.push(p); x /= p; y /= p;
    }
    const g = dv.reduce(function (m, v) { return m * v; }, 1);
    return { g: g, x: x, y: y, text: a + " 和 " + b + " 用短除法:" + (st.length ? st.join(";") : "沒有共同的質因數") + (dv.length > 1 ? ";除數相乘 " + dv.join("×") + " = " + g : dv.length ? ";除數是 " + g : "") };
  }
  function unitOf(r) { return r.units && r.units[0] ? " " + r.units[0] : ""; }
  function goodsOf(r) { return r.answer.map(function (i) { return r.options[i]; }).join("、"); }
  function stmtV(s) {
    let m;
    if ((m = s.match(/^(\d+) 是質數,因為它只有 1 和 \d+ 兩個因數。$/))) return [true, m[1] + " 只有 1 和 " + m[1] + " 兩個因數"];
    if (s === "1 既不是質數,也不是合數。") return [true, "1 只有 1 個因數"];
    if ((m = s.match(/^(\d+) 是合數,因為它除了 1 和 \d+ 之外,還有因數 (\d+)。$/))) return [true, m[1] + " ÷ " + m[2] + " = " + (m[1] / m[2]) + " 整除"];
    if (s === "2 是唯一的偶質數" || s === "2 是質數,而且是唯一的偶質數。") return [true, "別的偶數都能被 2 整除"];
    if ((m = s.match(/^(\d+) 是奇數,所以 \d+ 一定是質數。$/))) { const d = spf(+m[1]); return [false, m[1] + " ÷ " + d + " = " + (m[1] / d) + ",是合數"]; }
    if (s === "質數都是奇數。") return [false, "2 是偶數卻是質數"];
    if (s === "1 是最小的質數。") return [false, "1 只有 1 個因數,不是質數"];
    if (s === "兩個質數相加,和一定是質數。") return [false, "3 + 5 = 8 是合數"];
    return [null, "?"];
  }
  function tf2t(s) {
    if (s === "2 是質數,也是偶數。" || s === "最小的合數是 4。") return true;
    if (s === "1 是質數。" || s === "所有的質數都是奇數。" || s === "1 是合數。" || /是奇數,所以它是質數。$/.test(s) || /的倍數裡/.test(s)) return false;
    throw new Error("explain2 找不到對應的敘述:" + s);
  }
  function tf2(s) {
    let m;
    if (s === "1 是質數。") return "1 只有 1 個因數,質數要恰好 2 個因數";
    if (s === "2 是質數,也是偶數。") return "2 的因數只有 1 和 2;2 ÷ 2 = 1 整除,是偶數";
    if (s === "所有的質數都是奇數。") return "舉反例:2 是質數,卻是偶數";
    if (s === "最小的合數是 4。") return "合數至少有 3 個因數;2、3 只有 2 個,4 有 1、2、4 三個";
    if ((m = s.match(/^(\d+) 是奇數,所以它是質數。$/))) { const d = spf(+m[1]); return "試除:" + m[1] + " ÷ " + d + " = " + (m[1] / d) + ",有別的因數"; }
    if ((m = s.match(/^(\d+) 是質數,所以 \d+ 的倍數裡,(\d+) 也是質數。$/))) return m[2] + " ÷ 2 = " + (m[2] / 2) + ",有因數 2,不是質數";
    if (s === "1 是合數。") return "合數至少有 3 個因數,1 只有 1 個";
    return "舉例檢查";
  }

  /* 帶分數參與運算時一律加括號，例如 (2 1/2) ÷ 5 */
  /* 複選解法二：逐項檢驗（每個選項含錯項都寫出算式或理由） */
  function rows(r, flags, whys) { return r.options.map(function (o, i) { return (i + 1) + ". " + o + " → " + (flags[i] ? "對" : "錯") + "," + whys[i]; }).join(";\n"); }
  function pickIdx(r) { return r.answer.map(function (i) { return i + 1; }).join("、"); }
  function pm(s) {
    return String(s)
      .replace(/(?<![(\d\/])(\d+ \d+\/\d+)(?=\s*[×÷+]|\s+-\s)/g, "($1)")
      .replace(/(?<=[×÷+]\s|\s-\s)(\d+ \d+\/\d+)(?![\d\/)])/g, "($1)");
  }
  /* 解析文字裡「某分數 = 同一個分數」的巧合（結果剛好等於其中一個運算數），改寫成「結果是」，避免看起來像恆等式 */
  function pi(s) {
    const fix = function (t) { return t.replace(/(?<![\d.\/])(\d+\/\d+)\s*=\s*(\1)(?![\d.\/])/g, function (m, a, b) { return a + ",結果是 " + b; }); };
    return String(s).split("\n").map(function (ln) { const k = ln.indexOf(" → "); return /^\d+\. /.test(ln) && k >= 0 ? ln.slice(0, k) + fix(ln.slice(k)) : fix(ln); }).join("\n");
  }
  const PRE = {};

  const ALT = {
    "factor-single-L1-01": function (r) {
      const wantP = /質數/.test(r.stem), ns = r.options.map(Number); fs1(r, ns.map(function (n) { return wantP ? isPrime(n) : (n > 1 && !isPrime(n)); }));
      const ls = ns.map(function (n) { const d = spf(n); return n + (d === n ? " 試除沒有別的因數" : " ÷ " + d + " = " + (n / d)); });
      return "排除法:逐一試除。" + ls.join(";") + "。所以" + (wantP ? "質數" : "合數") + "是 " + r.options[r.answer] + "。";
    },
    "factor-single-L2-02": function (r) { const [a, b] = NM(r.stem), e = eu(a, b); fkOpt(e.g, r); return "輾轉相除法:" + e.s + "。最後的除數 " + e.g + " 就是最大公因數,選 " + r.options[r.answer] + "。"; },
    "factor-single-L3-03": function (r) { const [a, b] = NM(r.stem), sd = sdText(a, b), L = sd.g * sd.x * sd.y; fkOpt(L, r); return "用短除法:" + sd.text + "。\n最小公倍數 = 除數和最後的商全部相乘 = " + (sd.g > 1 ? sd.g + " × " : "") + sd.x + " × " + sd.y + " = " + L + ",選 " + r.options[r.answer] + "。"; },
    "factor-single-L4-04": function (r) {
      const N = NM(r.stem)[0], flags = r.options.map(function (o) { const fa = o.split("×").map(Number); return fa.reduce(function (x, y) { return x * y; }, 1) === N && fa.every(isPrime); });
      fs1(r, flags);
      const ls = r.options.map(function (o) { const fa = o.split("×").map(Number), p = fa.reduce(function (x, y) { return x * y; }, 1); return o + " = " + p + (fa.every(function (x) { return isPrime(x); }) ? "" : "(含合數或 1)"); });
      return "把每個選項乘回去檢查:" + ls.join(";") + "。要乘積正確、而且每個因數都是質數,選 " + r.options[r.answer] + "。";
    },
    "factor-single-L5-05": function (r) { const [g, L, a] = NM(r.stem), b = Number(r.options[r.answer]); if (gcd(a, b) !== g || lcm(a, b) !== L) throw new Error("explain2 與答案不一致"); return "代入檢查:乙數是 " + b + " 時," + a + " 與 " + b + " 的最大公因數是 " + gcd(a, b) + "、最小公倍數是 " + lcm(a, b) + ",和題目的 " + g + "、" + L + " 一樣。所以乙數是 " + b + "。"; },
    "factor-single-L1-06": function (r) {
      const [A, B] = NM(r.stem), k = A / B, c = Math.max(1, Math.floor(k / 2)); fs1(r, r.options.map(function (o) { return B * Number(o) === A; }));
      return "數一數 " + A + " 裡面有幾個 " + B + ":先拿 " + c + " 個 " + B + ",是 " + c + " × " + B + " = " + (c * B) + ",還剩 " + A + " - " + (c * B) + " = " + (A - c * B) + ";剩下的 " + (A - c * B) + " 又有 " + (k - c) + " 個 " + B + "。\n合起來 " + c + " + " + (k - c) + " = " + k + " 個,所以 □ = " + r.options[r.answer] + "。";
    },
    "factor-multi-L2-01": function (r) {
      const ns = r.options.map(Number), fl = ns.map(isPrime); fm(r, fl);
      const wh = ns.map(function (n) { const d = spf(n); return d === n ? "試除 2 到 " + (n - 1) + " 都除不盡,只有 1 和 " + n + " 兩個因數" : n + " ÷ " + d + " = " + (n / d) + ",多了因數 " + d; });
      return "逐一檢查每個數有沒有別的因數:\n" + rows(r, fl, wh) + "。\n所以質數是第 " + pickIdx(r) + " 個。";
    },
    "factor-multi-L3-02": function (r) {
      const [a, b] = NM(r.stem), xs = r.options.map(Number), fl = xs.map(function (x) { return a % x === 0 && b % x === 0; }); fm(r, fl);
      const wh = xs.map(function (x) { return a % x !== 0 ? a + " ÷ " + x + " 除不盡" : b % x !== 0 ? b + " ÷ " + x + " 除不盡" : a + " ÷ " + x + " = " + (a / x) + ",且 " + b + " ÷ " + x + " = " + (b / x); });
      return "把每個選項分別去除 " + a + " 和 " + b + ":\n" + rows(r, fl, wh) + "。\n所以公因數是第 " + pickIdx(r) + " 個。";
    },
    "factor-multi-L3-03": function (r) {
      const flags = [], wh = r.options.map(function (o) { const v = stmtV(o); if (v[0] === null) throw new Error("explain2 找不到對應的敘述:" + o); flags.push(v[0]); return v[1]; }); fm(r, flags);
      return "舉例子逐句檢查:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。";
    },
    "factor-multi-L4-04": function (r) {
      const [a, b] = NM(r.stem), xs = r.options.map(Number), fl = xs.map(function (x) { return x % a === 0 && x % b === 0; }); fm(r, fl);
      const wh = xs.map(function (x) { return x % a !== 0 ? x + " ÷ " + a + " 除不盡,不是 " + a + " 的倍數" : x % b !== 0 ? x + " ÷ " + b + " 除不盡,不是 " + b + " 的倍數" : x + " ÷ " + a + " = " + (x / a) + ",x ÷ ".replace("x", x) + b + " = " + (x / b); });
      return "公倍數要同時是 " + a + " 和 " + b + " 的倍數:\n" + rows(r, fl, wh) + "。\n所以公倍數是第 " + pickIdx(r) + " 個。";
    },
    "factor-multi-L5-05": function (r) {
      const n = NM(r.stem), a = n[0], b = n[1], lo = n[2], hi = n[3], xs = r.options.map(Number), fl = xs.map(function (x) { return x % a === 0 && x % b === 0 && x >= lo && x <= hi; }); fm(r, fl);
      const wh = xs.map(function (x) { return x % a !== 0 || x % b !== 0 ? "不是 " + a + " 和 " + b + " 的公倍數" : x < lo ? "太小,比 " + lo + " 還小" : x > hi ? "太大,比 " + hi + " 還大" : x + " ÷ " + a + " = " + (x / a) + "、" + x + " ÷ " + b + " = " + (x / b) + ",又在範圍內"; });
      return "要同時是公倍數又在 " + lo + " 到 " + hi + " 之間:\n" + rows(r, fl, wh) + "。\n所以選第 " + pickIdx(r) + " 個。";
    },
    "factor-tf-L1-01": function (r) {
      const n = NM(r.stem)[0], rt = Math.floor(Math.sqrt(n)), ls = []; let hit = 0;
      for (let d = 2; d <= rt && !hit; d++) { ls.push(n + " ÷ " + d + " 餘 " + (n % d)); if (n % d === 0) hit = d; }
      ftf(r, !hit);
      return "只要試除到 " + rt + " 就夠了,因為 " + (rt + 1) + " × " + (rt + 1) + " 已經比 " + n + " 大,再大的因數一定會和前面的配成對。\n" + (ls.length ? ls.join(";") + "。" : "") + (hit ? "餘 0,表示 " + hit + " 能整除,不是質數。" : "都有餘數,沒有別的因數,是質數。") + "所以敘述" + (r.answer ? "正確" : "錯誤") + "。";
    },
    "factor-tf-L2-02": function (r) { ftf(r, tf2t(r.stem)); return "查一查定義:" + tf2(r.stem) + "。所以這句話" + (r.answer ? "正確" : "錯誤") + "。"; },
    "factor-tf-L3-03": function (r) { const [a, b, c] = NM(r.stem), L = lcm(a, b); ftf(r, L === c); return "列倍數法:" + lcmTxt(a, b) + "。最小公倍數是 " + L + (L === c ? ",和敘述的 " + c + " 一樣" : ",不是 " + c) + "。所以敘述" + (r.answer ? "正確" : "錯誤") + "。"; },
    "factor-tf-L4-04": function (r) { const [a, b, x] = NM(r.stem), sd = sdText(a, b); ftf(r, sd.g === x); return "用短除法找最大公因數:" + sd.text + "。\n最大公因數是 " + sd.g + (sd.g === x ? ",和敘述的 " + x + " 一樣" : ",不是敘述的 " + x) + "。所以敘述" + (r.answer ? "正確" : "錯誤") + "。"; },
    "factor-tf-L5-05": function (r) {
      const [g, L, X] = NM(r.stem), k = L / g; let m = 1, n = k;
      for (let d = 2; d * d <= k; d++) if (k % d === 0 && gcd(d, k / d) === 1) { m = d; n = k / d; }
      ftf(r, g * L === X);
      const p = g * m, q = g * n;
      return "找一組真的數來試試:甲數 = " + g + " × " + m + " = " + p + ",乙數 = " + g + " × " + n + " = " + q + "。\n它們的最大公因數是 " + gcd(p, q) + "、最小公倍數是 " + lcm(p, q) + ",和題目一樣。\n乘積 " + p + " × " + q + " = " + (p * q) + (p * q === X ? ",和敘述的 " + X + " 一樣。" : ",不是敘述的 " + X + "。") + "所以敘述" + (r.answer ? "正確" : "錯誤") + "。";
    },
    "factor-tf-L3-06": function (r) { const [a, b, x] = NM(r.stem), sd = sdText(a, b); ftf(r, sd.g === x); return "同時是 " + a + " 和 " + b + " 的因數,就是它們的公因數;公因數中最大的就是最大公因數。\n用短除法求最大公因數:" + sd.text + "。\n最大是 " + sd.g + (sd.g === x ? ",和敘述的 " + x + " 一樣" : ",不是敘述的 " + x) + "。所以敘述" + (r.answer ? "正確" : "錯誤") + "。"; },
    "factor-fill-L1-01": function (r) { const a = NM(r.stem)[0], p = Number(r.answer), ps = []; for (let n = 2; n <= p; n++) if (isPrime(n)) ps.push(n); if (!(ps[ps.length - 1] === p && p > a && ps.filter(function (x) { return x > a; }).length === 1)) throw new Error("explain2 與答案不一致"); return "查質數表:" + ps.join("、") + "……。比 " + a + " 大的第一個質數是 " + p + "。"; },
    "factor-fill-L2-02": function (r) { const [a, b] = NM(r.stem); fk(lcm(a, b), r); return "列倍數法:" + lcmTxt(a, b) + "。答案是 " + r.answer + "。"; },
    "factor-fill-L3-03": function (r) { const N = NM(r.stem)[0]; fk(Math.max.apply(null, factorize(N)), r); return "連續用質數去除:" + chain(N) + "。用到的質數中最大的是 " + r.answer + "。"; },
    "factor-fill-L4-04": function (r) { const [a, b] = NM(r.stem), cd = divisors(a).filter(function (x) { return b % x === 0; }); fk(cd.length, r); return "列出每個數的因數:" + a + " 的因數:" + divisors(a).join("、") + ";" + b + " 的因數:" + divisors(b).join("、") + "。共同的有 " + cd.join("、") + ",共 " + cd.length + " 個。"; },
    "factor-fill-L5-05": function (r) {
      const [a, b, c] = NM(r.stem); fk(lcm(lcm(a, b), c), r); const ms = [a, b, c].map(expMap), mx = {};
      ms.forEach(function (m) { Object.keys(m).forEach(function (p) { mx[p] = Math.max(mx[p] || 0, m[p]); }); });
      const parts = []; Object.keys(mx).forEach(function (p) { for (let i = 0; i < mx[p]; i++) parts.push(p); });
      return "分解質因數:" + fdesc(a) + ",\n" + fdesc(b) + ",\n" + fdesc(c) + "。\n每個質數取出現最多次的:" + parts.join("×") + " = " + r.answer + "。";
    },
    "factor-fill-L2-06": function (r) { const [a, b] = NM(r.stem); fk(gcd(a, b), r); return "列出共同的因數:" + cdTxt(a, b) + "。所以 □ = " + r.answer + "。"; },
    "factor-calc-L1-01": function (r) { const [a, b] = NM(r.stem); fk(gcd(a, b), r); return "列出共同的因數:" + cdTxt(a, b) + "。答案是 " + r.answer + "。"; },
    "factor-calc-L2-02": function (r) { const [a, b] = NM(r.stem); fk(lcm(a, b), r); return "列倍數法:" + lcmTxt(a, b) + "。答案是 " + r.answer + "。"; },
    "factor-calc-L3-03": function (r) { const [a, b] = NM(r.stem), e = eu(a, b); fk(e.g, r); return "輾轉相除法:" + e.s + "。最後的除數 " + e.g + " 就是最大公因數,答案是 " + r.answer + "。"; },
    "factor-calc-L4-04": function (r) { const N = NM(r.stem)[0], ds = []; factorize(N).forEach(function (p) { if (ds.indexOf(p) < 0) ds.push(p); }); fk(ds.reduce(function (x, y) { return x + y; }, 0), r); return "連續用質數去除:" + chain(N) + "。用到的不同質數有 " + ds.join("、") + ",相加 " + ds.join(" + ") + " = " + r.answer + "。"; },
    "factor-calc-L5-05": function (r) {
      const [a, b] = NM(r.stem), ma = expMap(a), mb = expMap(b), keys = {}; Object.keys(ma).concat(Object.keys(mb)).forEach(function (p) { keys[p] = 1; });
      const lo = [], hi = []; Object.keys(keys).forEach(function (p) { const x = ma[p] || 0, y = mb[p] || 0; for (let i = 0; i < Math.min(x, y); i++) lo.push(p); for (let i = 0; i < Math.max(x, y); i++) hi.push(p); });
      const g = lo.length ? lo.reduce(function (m, v) { return m * Number(v); }, 1) : 1, L = hi.reduce(function (m, v) { return m * Number(v); }, 1); fk(g + L, r);
      return "把兩個數分解質因數:" + fdesc(a) + ";" + fdesc(b) + "。\n最大公因數取共同的、次數少的:" + (lo.length > 1 ? lo.join("×") + " = " : "") + (lo.length ? g : "沒有共同的質因數,是 1") + ";最小公倍數每個質數都取次數多的:" + (hi.length > 1 ? hi.join("×") + " = " : "") + L + "。\n兩個相加:" + g + " + " + L + " = " + r.answer + "。";
    },
    "factor-calc-L4-06": function (r) { const [a, g, L0] = NM(r.stem), m = a / g, n = L0 / a; fk(g * n, r); if (gcd(a, g * n) !== g || lcm(a, g * n) !== L0) throw new Error("explain2 與答案不一致"); return "最大公因數是 " + g + ",所以兩個數都是 " + g + " 的倍數,可以寫成 " + a + " = " + g + " × " + m + " 和 □ = " + g + " × (另一個數,和 " + m + " 互質)。\n最小公倍數 = " + g + " × " + m + " × (另一個數) = " + L0 + ",所以(另一個數)= " + L0 + " ÷ " + a + " = " + n + "。\n□ = " + g + " × " + n + " = " + r.answer + "。"; },
    "factor-word-L2-01": function (r) { const [a, b] = NM(r.stem); fk(lcm(a, b), r); return "列時間表:" + lcmTxt(a, b) + "。所以至少再過 " + r.answer + unitOf(r) + "。"; },
    "factor-word-L3-02": function (r) { const [a, b] = NM(r.stem), sd = sdText(a, b); fk(sd.g, r); return "人數要能同時整除 " + a + " 和 " + b + ",最多就是最大公因數。\n" + sd.text + "。所以最多 " + r.answer + unitOf(r) + "。"; },
    "factor-word-L4-03": function (r) { const [a, b] = NM(r.stem), sd = sdText(a, b), g = sd.g; fk(a * b / (g * g), r); return "正方形的邊長要最長又剛好剪完,邊長就是兩邊的最大公因數。\n" + sd.text + ",邊長是 " + g + " 公分。\n用面積想:紙板面積 " + a + " × " + b + " = " + (a * b) + ",一個正方形面積 " + g + " × " + g + " = " + (g * g) + ",共 " + (a * b) + " ÷ " + (g * g) + " = " + r.answer + unitOf(r) + "。"; },
    "factor-word-L4-04": function (r) { const [a, b, c] = NM(r.stem), e = eu(a, b), e2 = eu(e.g, c); fk(e2.g, r); return "先看 " + a + " 和 " + b + ":" + e.s + ",最大公因數 " + e.g + "。\n再看 " + e.g + " 和 " + c + ":" + e2.s + ",最大公因數 " + e2.g + "。\n每段最長 " + r.answer + unitOf(r) + "。"; },
    "factor-word-L5-05": function (r) {
      const [a, b, c] = NM(r.stem); fk(lcm(lcm(a, b), c), r); const ms = [a, b, c].map(expMap), mx = {};
      ms.forEach(function (m) { Object.keys(m).forEach(function (p) { mx[p] = Math.max(mx[p] || 0, m[p]); }); });
      const parts = []; Object.keys(mx).forEach(function (p) { for (let i = 0; i < mx[p]; i++) parts.push(p); });
      return "分解質因數:" + fdesc(a) + "," + fdesc(b) + ",\n" + fdesc(c) + "。\n每個質數取出現最多次的相乘:" + parts.join("×") + " = " + r.answer + "。所以再過 " + r.answer + unitOf(r) + "。";
    },
    "factor-word-L5-06": function (r) { const n = NM(r.stem), a = n[0], L0 = n[1], g = n[3], m = a / g, k = L0 / a; fk(g * k, r); if (gcd(a, g * k) !== g || lcm(a, g * k) !== L0) throw new Error("explain2 與答案不一致"); return "最大公因數是 " + g + ",所以兩個數都是 " + g + " 的倍數,可以寫成 " + a + " = " + g + " × " + m + " 和 □ = " + g + " × (另一個數,和 " + m + " 互質)。\n再過 " + L0 + " 天才會同一天,最小公倍數 " + L0 + " = " + g + " × " + m + " × (另一個數),所以(另一個數)= " + L0 + " ÷ " + a + " = " + k + "。\n□ = " + g + " × " + k + " = " + r.answer + unitOf(r) + "。"; }
  };


  /* PRE（解法一的方法說明） */
PRE["factor-single-L3-03"] = function () { return "方法:把兩個數拆成「最大公因數 × 互質的數」,最大公因數和最小公倍數就能直接讀出來。\n"; };
PRE["factor-tf-L2-02"] = function () { return "方法:把兩個數拆成「最大公因數 × 互質的數」,最大公因數和最小公倍數就能直接讀出來。\n"; };
PRE["factor-tf-L4-04"] = function () { return "方法:把兩個數拆成「最大公因數 × 互質的數」,最大公因數和最小公倍數就能直接讀出來。\n"; };
PRE["factor-tf-L5-05"] = function () { return "方法:把兩個數拆成「最大公因數 × 互質的數」,最大公因數和最小公倍數就能直接讀出來。\n"; };
PRE["factor-calc-L5-05"] = function () { return "方法:把兩個數拆成「最大公因數 × 互質的數」,最大公因數和最小公倍數就能直接讀出來。\n"; };
PRE["factor-word-L3-02"] = function () { return "方法:把兩個數拆成「最大公因數 × 互質的數」,最大公因數和最小公倍數就能直接讀出來。\n"; };
PRE["factor-single-L1-06"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["factor-tf-L3-06"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["factor-calc-L4-06"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["factor-tf-L3-03"] = function () { return "想法:先找出兩數的最小公倍數,再和敘述裡的數比一比。" + String.fromCharCode(10); };
PRE["factor-fill-L4-04"] = function () { return "想法:公因數都是最大公因數的因數,數一數就知道有幾個。" + String.fromCharCode(10); };
PRE["factor-word-L4-03"] = function () { return "想法:先求正方形的邊長,再算長邊、寬邊各剪幾個。" + String.fromCharCode(10); };
PRE["factor-fill-L3-03"] = function () { return "想法:一直用最小的質數去除,除到商是 1 為止,用到的質數就是質因數。" + String.fromCharCode(10); };
  ExamBank.register(T, "factor-basic", single.concat(multi, tf, fill, calc, word, boxes));
})();
