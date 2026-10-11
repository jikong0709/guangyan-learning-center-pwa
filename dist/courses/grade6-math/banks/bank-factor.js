/* 題庫：factor 質數、合數、質因數分解、最大公因數、最小公倍數（對應舊單元 上1）
   題庫工 A 自編。全部 gen 每次產生新數字。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, gcd = K.gcd, lcm = K.lcm, shuffle = K.shuffle;
  const T = "factor";
  const cnt = {};
  function mk(type, level, tag, gen) {
    cnt[type] = (cnt[type] || 0) + 1;
    const n = cnt[type];
    return { id: T + "-" + type + "-L" + level + "-" + (n < 10 ? "0" : "") + n, type: type, level: level, tag: tag, gen: retry(gen) };
  }
  /* 偶發的選項撞名（干擾項與正解相同）時自動重抽，最多 30 次 */
  function retry(g) {
    return function (kit) {
      let last;
      for (let t = 0; t < 30; t++) {
        try { return g(kit); } catch (e) { if (!/選項重複|干擾項不足/.test(e.message)) throw e; last = e; }
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

  ExamBank.register(T, "factor-basic", single.concat(multi, tf, fill, calc, word));
})();
