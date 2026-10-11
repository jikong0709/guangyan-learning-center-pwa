/* 題庫：fraction-div 分數除以整數、整數除以分數、分數除分數、分數除法應用（對應舊單元 上2）
   題庫工 A 自編。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, gcd = K.gcd, lcm = K.lcm, shuffle = K.shuffle, F = K.frac;
  const T = "fraction-div";
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
  /* 真分數 [n,d],最簡 */
  function pf(lo, hi) { let n, d; do { d = int(lo, hi); n = int(1, d - 1); } while (gcd(n, d) !== 1); return [n, d]; }
  function red(n, d) { const g = gcd(n, d); return [n / g, d / g]; }
  function dec(n, d) { const r = red(n, d); let q = r[1], a = 0, b = 0; while (q % 2 === 0) { q /= 2; a++; } while (q % 5 === 0) { q /= 5; b++; } if (q !== 1 || Math.max(a, b) > 4) return null; return K.num(r[0] / r[1]); }
  function mixed(n, d) { const r = red(n, d); if (r[1] > 1 && r[0] > r[1]) return Math.floor(r[0] / r[1]) + " " + (r[0] % r[1]) + "/" + r[1]; return null; }
  function acc(n, d) { return [dec(n, d), mixed(n, d)].filter(function (x) { return x; }); }
  function fs(n, d) { return n + "/" + d; }

  const single = [
    mk("single", 1, "basic", function () {
      const p = pf(3, 9), n = p[0], d = p[1], k = int(2, 6);
      const r = S(F(n, d * k), [F(n * k, d), F(n, d + k), F(d * k, n), F(n, d), F(n + k, d)]);
      r.stem = fs(n, d) + " ÷ " + k + " = ?";
      r.explain = "分數除以整數,分母乘以這個整數:\n" + fs(n, d) + " ÷ " + k + " = " + n + "/(" + d + "×" + k + ") = " + F(n, d * k) + "。";
      return r;
    }),
    mk("single", 2, "basic", function () {
      const k = int(2, 9), p = pf(3, 9), n = p[0], d = p[1];
      const r = S(F(k * d, n), [F(k * n, d), F(n, k * d), F(d, k * n), F(k, n * d), F(k * d, n + 1)]);
      r.stem = k + " ÷ " + fs(n, d) + " = ?";
      r.explain = "整數除以分數,等於乘以這個分數的倒數:\n" + k + " ÷ " + fs(n, d) + " = " + k + " × " + fs(d, n) + " = " + F(k * d, n) + "。";
      return r;
    }),
    mk("single", 3, "trap", function () {
      let a, b, c, d, p, q;
      do { p = pf(3, 9); q = pf(3, 9); a = p[0]; b = p[1]; c = q[0]; d = q[1]; } while (a * d === b * c);
      const r = S(F(a * d, b * c), [F(a * c, b * d), F(b * c, a * d), F(b * d, a * c), F(a, b * c), F(a * d, b)]);
      r.stem = fs(a, b) + " ÷ " + fs(c, d) + " = ?";
      r.explain = "除以一個分數,等於乘以它的倒數(只翻「除數」):\n" + fs(a, b) + " ÷ " + fs(c, d) + " = " + fs(a, b) + " × " + fs(d, c) + " = " + F(a * d, b * c) + "。";
      r.trapNote = "常見錯誤:忘了把除數翻成倒數,直接分子乘分子、分母乘分母,得到 " + F(a * c, b * d) + ";或是翻錯分數(翻了被除數),得到 " + F(b * c, a * d) + "。";
      return r;
    }),
    mk("single", 4, "trap", function () {
      const N = int(4, 20), p = int(1, 4), q = p + int(1, 4);
      const g = gcd(p, q), pp = p / g, qq = q / g;
      const correct = N + " ÷ (" + fs(pp, qq) + ")";
      const k = int(2, 4);
      const cands = [N + " ÷ (" + fs(qq, pp) + ")", N + " ÷ " + k, N + " × (" + fs(pp, qq) + ")", N + " ÷ " + (qq + 1), N + " ÷ (" + fs(qq + 1, qq) + ")"];
      const r = S(correct, cands);
      r.stem = "下列哪一個算式的結果,會比 " + N + " 大?";
      r.explain = "除以一個小於 1 的數(真分數),結果會變大:" + correct + " = " + N + " × " + fs(qq, pp) + " = " + F(N * qq, pp) + ",比 " + N + " 大。\n其他選項是除以大於 1 的數,或乘以真分數,結果都比 " + N + " 小。";
      r.trapNote = "常見錯誤:以為「除法的結果一定比較小」。除以真分數(小於 1 的數)時,商反而變大;除以大於 1 的數才變小。";
      return r;
    }),
    mk("single", 5, "extend", function () {
      const p = pf(3, 7), q = pf(3, 7), n = p[0], d = p[1], m = q[0], k = q[1];
      const X = [m * n, k * d];
      const r = S(F(X[0], X[1]), [F(m * d, k * n), F(k * n, m * d), F(m * n, k * d + 1), F(m, k * n)]);
      r.stem = "某數除以 " + fs(n, d) + " 之後得到 " + fs(m, k) + ",請問某數是多少?";
      r.explain = "倒推:商 × 除數 = 被除數。\n某數 = " + fs(m, k) + " × " + fs(n, d) + " = " + F(X[0], X[1]) + "。";
      return r;
    })
  ];

  function eqnA() { const p = pf(3, 9), k = int(2, 6); return { n: p[0], d: p[1], k: k, res: F(p[0], p[1] * k) }; }
  function wrongRes(n, d, k) { return pick([F(n * k, d), F(n, d + k), F(n + k, d * k)].filter(function (x) { return x !== F(n, d * k); })); }
  function eqB() { const p = pf(3, 9), k = int(2, 9); return { n: p[0], d: p[1], k: k, res: F(k * p[1], p[0]) }; }
  function wrongResB(n, d, k) { return pick([F(k * n, d), F(n, k * d), F(d, k * n)].filter(function (x) { return x !== F(k * d, n); })); }

  const multi = [
    mk("multi", 2, "basic", function () {
      const ng = int(2, 3);
      const used = {};
      const goods = [], bads = [];
      while (goods.length < ng) { const x = isAgen(true); if (!used[x]) { used[x] = 1; goods.push(x); } }
      while (bads.length < 5 - ng) { const x = isAgen(false); if (!used[x]) { used[x] = 1; bads.push(x); } }
      function isAgen(ok) {
        if (Math.random() < 0.5) { const e = eqnA(); return e.n + "/" + e.d + " ÷ " + e.k + " = " + (ok ? e.res : wrongRes(e.n, e.d, e.k)); }
        const e = eqB(); return e.k + " ÷ " + e.n + "/" + e.d + " = " + (ok ? e.res : wrongResB(e.n, e.d, e.k));
      }
      return M("下列算式,哪些是正確的?選出所有正確的。", goods, bads, "逐題檢查:分數 ÷ 整數,分母乘整數;整數 ÷ 分數,乘以分數的倒數。\n正確的算式是:" + goods.join(";") + "。");
    }),
    mk("multi", 3, "basic", function () {
      const R = pf(2, 6), ra = R[0], rb = R[1];
      const Ds = shuffle([[2, 3], [3, 4], [1, 2], [3, 5], [5, 6], [2, 5], [1, 3]]).slice(0, 5);
      const ng = int(2, 3), goods = [], bads = [];
      Ds.forEach(function (D, i) {
        const x = F(ra * D[0], rb * D[1]);
        if (i < ng) goods.push(x + " ÷ " + fs(D[0], D[1]));
        else { const y = F(ra * D[1], rb * D[0]); const s = y + " ÷ " + fs(D[0], D[1]); if (y !== x) bads.push(s); }
      });
      return M("下列哪些算式的商等於 " + fs(ra, rb) + "?選出所有正確的。", goods, bads.slice(0, 5 - ng),
        "商 = " + fs(ra, rb) + ",被除數應該是 商 × 除數。\n把每個選項的被除數除以除數檢查:" + goods.join("、") + " 的商都是 " + fs(ra, rb) + "。");
    }),
    mk("multi", 3, "trap", function () {
      const N = int(3, 12), p = int(1, 4), q = p + int(1, 4), g = gcd(p, q), a = p / g, b = q / g;
      const trues = [
        N + " ÷ " + fs(a, b) + " 的商比 " + N + " 大",
        "任何正數,除以大於 1 的數,商都會比原來的數小",
        fs(a, b) + " ÷ " + (b + 1) + " 的商是 " + fs(a, b * (b + 1)),
        N + " ÷ " + fs(a, b) + " 與 " + N + " × " + fs(b, a) + " 的結果相同"
      ];
      const falses = [
        "除法的商一定比被除數小",
        N + " ÷ " + fs(a, b) + " = " + N + " × " + fs(a, b),
        fs(a, b) + " ÷ " + (b + 1) + " = " + fs(a * (b + 1), b),
        "除以真分數,商會比被除數小"
      ];
      const goods = shuffle(trues).slice(0, int(2, 3));
      const bads = shuffle(falses).slice(0, 2);
      return M("下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "除以大於 1 的數商變小;除以真分數(小於 1 的數)商變大。分數 ÷ 整數,分母乘以整數;整數 ÷ 分數,乘以分數的倒數。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:認為除法的商一定比被除數小(除以真分數時商變大);整數除以分數時忘了翻倒數;分數除以整數卻把分子乘上整數。");
    }),
    mk("multi", 4, "trap", function () {
      const p = pf(3, 8), a = p[0], b = p[1];
      const bigger = [], smaller = [];
      const ds = [[1, 2], [2, 3], [3, 4], [1, 3], [3, 5], [2, 5], [4, 5]];
      shuffle(ds).slice(0, 3).forEach(function (d) { bigger.push(fs(a, b) + " ÷ " + fs(d[0], d[1])); });
      shuffle([2, 3, 4, 5]).slice(0, 2).forEach(function (k) { smaller.push(fs(a, b) + " ÷ " + k); });
      smaller.push(fs(a, b) + " ÷ " + fs(5, 4)); smaller.push(fs(a, b) + " ÷ " + fs(3, 2));
      const goods = bigger.slice(0, int(2, 3)), bads = shuffle(smaller).slice(0, 2);
      return M("下列哪些算式的商,比 " + fs(a, b) + " 大?選出所有正確的。", goods, bads,
        "除以小於 1 的數(真分數),商會變大:" + goods.join("、") + "。\n其他是除以大於 1 的數,商會比 " + fs(a, b) + " 小。",
        "常見錯誤:一看到「÷」就以為商會變小。除數小於 1 時,商比被除數大;除數大於 1 時,商才比被除數小。");
    }),
    mk("multi", 5, "extend", function () {
      const p = pf(3, 8), a = p[0], b = p[1];
      let k, m;
      do { k = int(2, 5); m = int(2, 5); } while (k === m || k + m === k * m);
      const goods = [fs(a, b) + " ÷ " + k + " ÷ " + m, fs(a, b) + " ÷ (" + k + "×" + m + ")", fs(a, b) + " × " + fs(1, k * m)];
      const wrongs = [fs(a, b) + " ÷ " + k + " × " + m, fs(a, b) + " ÷ (" + k + "+" + m + ")", fs(a, b) + " × " + k + " ÷ " + m, fs(a, b) + " ÷ " + k];
      const gs = shuffle(goods).slice(0, int(2, 3)), bs = shuffle(wrongs).slice(0, 2);
      return M("下列哪些算式的結果,等於 " + fs(a, b) + " ÷ " + (k * m) + "?選出所有正確的。", gs, bs,
        fs(a, b) + " ÷ " + (k * m) + " = " + F(a, b * k * m) + "。連除兩個數,等於除以它們的乘積;除以 " + (k * m) + " 也等於乘以 " + fs(1, k * m) + "。\n" +
        "「÷" + k + " × " + m + "」是除了又乘回去,「÷(" + k + "+" + m + ")」是加不是乘,都不是 " + (k * m) + " 的倒數效果。");
    })
  ];

  const tf = [
    mk("tf", 1, "basic", function () {
      const p = pf(3, 9), n = p[0], d = p[1], k = int(2, 6), right = Math.random() < 0.5;
      const res = right ? F(n, d * k) : wrongRes(n, d, k);
      return { stem: fs(n, d) + " ÷ " + k + " = " + res + "。", answer: right,
        explain: fs(n, d) + " ÷ " + k + " = " + fs(n, d) + " × " + fs(1, k) + " = " + F(n, d * k) + (right ? ",敘述正確。" : ",不是 " + res + "。") };
    }),
    mk("tf", 2, "trap", function () {
      const N = int(3, 15);
      let p, q; do { p = int(2, 7); q = int(2, 7); } while (p === q || gcd(p, q) !== 1);
      const smaller = p > q;
      return { stem: N + " ÷ " + fs(p, q) + " 的商,一定比 " + N + " 小。", answer: smaller,
        explain: N + " ÷ " + fs(p, q) + " = " + N + " × " + fs(q, p) + " = " + F(N * q, p) + (smaller ? ",比 " + N + " 小,敘述正確(因為除數大於 1)。" : ",比 " + N + " 大,敘述錯誤(因為除數小於 1)。"),
        trapNote: "易錯觀念:以為除法的商一定比被除數小。只有除以大於 1 的數,商才會變小;除以真分數,商會變大。" };
    }),
    mk("tf", 3, "trap", function () {
      const p = pf(3, 9), n = p[0], d = p[1], k = int(2, 6);
      const pool = [
        { s: k + " ÷ " + fs(n, d) + " = " + k + " × " + fs(d, n), a: true, w: "整數除以分數,要乘以分數的倒數,所以正確。" },
        { s: k + " ÷ " + fs(n, d) + " = " + k + " × " + fs(n, d), a: false, w: "漏了翻倒數,正確是 " + k + " × " + fs(d, n) + "。" },
        { s: fs(n, d) + " ÷ " + k + " = " + fs(n * k, d), a: false, w: "分數除以整數,是分母乘以整數,正確是 " + F(n, d * k) + "。" },
        { s: fs(n, d) + " ÷ " + k + " = " + fs(n, d * k), a: true, w: "分母乘以 " + k + ",得 " + fs(n, d * k) + "(未約分),正確。" },
        { s: fs(n, d) + " ÷ " + fs(1, k) + " = " + fs(n, d * k), a: false, w: "除以 1/" + k + " 等於乘以 " + k + ",結果是 " + F(n * k, d) + "。" }
      ];
      const x = pick(pool);
      return { stem: x.s + "。", answer: x.a, explain: x.w, trapNote: "易錯:分數 ÷ 整數,是「分母」乘整數(分子不動);整數 ÷ 分數,是乘以分數的「倒數」;除以 1/k 等於乘以 k。" };
    }),
    mk("tf", 4, "basic", function () {
      let a, b, c, d, p, q;
      do { p = pf(3, 8); q = pf(3, 8); a = p[0]; b = p[1]; c = q[0]; d = q[1]; } while (a * d === b * c);
      const right = Math.random() < 0.5;
      const res = right ? F(a * d, b * c) : pick([F(a * c, b * d), F(b * c, a * d)].filter(function (x) { return x !== F(a * d, b * c); }));
      return { stem: fs(a, b) + " ÷ " + fs(c, d) + " = " + res + "。", answer: right,
        explain: fs(a, b) + " ÷ " + fs(c, d) + " = " + fs(a, b) + " × " + fs(d, c) + " = " + F(a * d, b * c) + (right ? ",敘述正確。" : ",不是 " + res + "。") };
    }),
    mk("tf", 5, "extend", function () {
      const p = pf(3, 7), q = pf(3, 7), n = p[0], d = p[1], m = q[0], k = q[1];
      const right = Math.random() < 0.5, truth = F(m * d, k * n);
      const wrong = pick([F(m * n, k * d), F(k * n, m * d)].filter(function (x) { return x !== truth; }));
      const X = right ? truth : wrong;
      return { stem: "某數乘以 " + fs(n, d) + " 之後得到 " + fs(m, k) + ",所以某數是 " + X + "。", answer: right,
        explain: "倒推:某數 = " + fs(m, k) + " ÷ " + fs(n, d) + " = " + fs(m, k) + " × " + fs(d, n) + " = " + truth + (right ? ",敘述正確。" : ",不是 " + X + "。") };
    })
  ];

  const fill = [
    mk("fill", 1, "basic", function () {
      const p = pf(3, 9), n = p[0], d = p[1], k = int(2, 6), r = red(n, d * k);
      return { stem: fs(n, d) + " ÷ " + k + " = ____(請以最簡分數作答)", answer: F(n, d * k), accepted: acc(n, d * k),
        explain: fs(n, d) + " ÷ " + k + " = " + n + "/(" + d + "×" + k + ") = " + fs(n, d * k) + " = " + F(n, d * k) + "。" };
    }),
    mk("fill", 2, "basic", function () {
      const k = int(2, 9), p = pf(3, 9), n = p[0], d = p[1];
      return { stem: k + " ÷ " + fs(n, d) + " = ____(請以最簡分數或整數作答)", answer: F(k * d, n), accepted: acc(k * d, n),
        explain: k + " ÷ " + fs(n, d) + " = " + k + " × " + fs(d, n) + " = " + F(k * d, n) + "。" };
    }),
    mk("fill", 3, "basic", function () {
      let a, b, c, d, p, q;
      do { p = pf(3, 9); q = pf(3, 9); a = p[0]; b = p[1]; c = q[0]; d = q[1]; } while (a * d === b * c);
      return { stem: fs(a, b) + " ÷ " + fs(c, d) + " = ____(請以最簡分數或整數作答)", answer: F(a * d, b * c), accepted: acc(a * d, b * c),
        explain: fs(a, b) + " ÷ " + fs(c, d) + " = " + fs(a, b) + " × " + fs(d, c) + " = " + F(a * d, b * c) + "。" };
    }),
    mk("fill", 4, "trap", function () {
      const w = int(1, 3), p = pf(3, 7), n = p[0], d = p[1], k = int(2, 5);
      const impN = w * d + n;
      return { stem: w + " " + n + "/" + d + " ÷ " + k + " = ____(請以最簡分數作答,例如 5/6)", answer: F(impN, d * k), accepted: acc(impN, d * k),
        explain: "先把帶分數化成假分數:" + w + " " + n + "/" + d + " = " + impN + "/" + d + "。\n再除以 " + k + ":" + impN + "/" + d + " ÷ " + k + " = " + impN + "/(" + d + "×" + k + ") = " + F(impN, d * k) + "。",
        trapNote: "常見錯誤:只拿整數部分 " + w + " 或分數部分去除,或沒有先化成假分數就直接算。帶分數相除,要先化成假分數再計算。" };
    }),
    mk("fill", 5, "extend", function () {
      const d = int(3, 8);
      let n; do { n = int(1, d - 1); } while (gcd(n, d) !== 1);
      const X = d * int(2, 6), m = X * n / d;
      return { stem: "某數的 " + fs(n, d) + " 是 " + m + ",某數是 ____。", answer: String(X),
        explain: "某數 × " + fs(n, d) + " = " + m + ",所以某數 = " + m + " ÷ " + fs(n, d) + " = " + m + " × " + fs(d, n) + " = " + X + "。" };
    })
  ];

  const calc = [
    mk("calc", 1, "basic", function () {
      const p = pf(4, 9), n = p[0], d = p[1], k = int(2, 5);
      return { stem: "計算:" + fs(n, d) + " ÷ " + k, answer: F(n, d * k), accepted: acc(n, d * k),
        explain: "列式:" + fs(n, d) + " ÷ " + k + "\n= " + n + "/(" + d + "×" + k + ")\n= " + F(n, d * k) + "。" };
    }),
    mk("calc", 2, "basic", function () {
      const k = int(2, 9), p = pf(4, 9), n = p[0], d = p[1];
      return { stem: "計算:" + k + " ÷ " + fs(n, d), answer: F(k * d, n), accepted: acc(k * d, n),
        explain: "列式:" + k + " ÷ " + fs(n, d) + "\n= " + k + " × " + fs(d, n) + "\n= " + F(k * d, n) + "。" };
    }),
    mk("calc", 3, "basic", function () {
      let a, b, c, d, p, q;
      do { p = pf(3, 9); q = pf(3, 9); a = p[0]; b = p[1]; c = q[0]; d = q[1]; } while (a * d === b * c);
      return { stem: "計算:" + fs(a, b) + " ÷ " + fs(c, d), answer: F(a * d, b * c), accepted: acc(a * d, b * c),
        explain: "列式:" + fs(a, b) + " ÷ " + fs(c, d) + "\n= " + fs(a, b) + " × " + fs(d, c) + "\n= " + F(a * d, b * c) + "。" };
    }),
    mk("calc", 4, "trap", function () {
      const w = int(1, 3), p = pf(3, 6), n = p[0], d = p[1], q = pf(3, 6), c = q[0], e = q[1];
      const impN = w * d + n;
      return { stem: "計算:" + w + " " + n + "/" + d + " ÷ " + fs(c, e), answer: F(impN * e, d * c), accepted: acc(impN * e, d * c),
        explain: "先把帶分數化成假分數:" + w + " " + n + "/" + d + " = " + impN + "/" + d + "。\n" + impN + "/" + d + " ÷ " + fs(c, e) + " = " + impN + "/" + d + " × " + fs(e, c) + " = " + F(impN * e, d * c) + "。",
        trapNote: "常見錯誤:帶分數沒化成假分數,直接拿整數部分 " + w + " 和分數部分 " + fs(n, d) + " 分別去除。帶分數相除一定要先化成假分數。" };
    }),
    mk("calc", 5, "extend", function () {
      const p = pf(3, 6), q = pf(3, 6), r = pf(3, 6);
      const sn = p[0] * q[1] + q[0] * p[1], sd = p[1] * q[1];
      return { stem: "計算:(" + fs(p[0], p[1]) + " + " + fs(q[0], q[1]) + ") ÷ " + fs(r[0], r[1]), answer: F(sn * r[1], sd * r[0]), accepted: acc(sn * r[1], sd * r[0]),
        explain: "先算括號:" + fs(p[0], p[1]) + " + " + fs(q[0], q[1]) + " = " + F(sn, sd) + "。\n再除以 " + fs(r[0], r[1]) + ":" + F(sn, sd) + " × " + fs(r[1], r[0]) + " = " + F(sn * r[1], sd * r[0]) + "。" };
    })
  ];

  const word = [
    mk("word", 2, "basic", function () {
      const p = pf(3, 8), n = p[0], d = p[1], k = int(2, 5);
      return { stem: "媽媽把 " + fs(n, d) + " 公升的果汁,平分裝進 " + k + " 個杯子,每個杯子裝幾公升?", answer: F(n, d * k), accepted: acc(n, d * k), units: ["公升", "L", "l"],
        explain: "平分用除法:" + fs(n, d) + " ÷ " + k + " = " + n + "/(" + d + "×" + k + ") = " + F(n, d * k) + "。\n答:" + F(n, d * k) + " 公升。" };
    }),
    mk("word", 3, "basic", function () {
      let n, d; do { n = int(1, 3); d = int(2, 6); } while (gcd(n, d) !== 1);
      const t = int(2, 5), N = n * t, c = d * t;
      return { stem: "有 " + N + " 公斤的米,要平均裝進袋子裡,每袋裝 " + fs(n, d) + " 公斤,可以裝成幾袋?", answer: String(c), units: ["袋"],
        explain: "看 " + N + " 公斤裡有幾個 " + fs(n, d) + " 公斤,用除法:" + N + " ÷ " + fs(n, d) + " = " + N + " × " + fs(d, n) + " = " + c + "。\n答:" + c + " 袋。" };
    }),
    mk("word", 4, "trap", function () {
      let NN, b, n, d, num, den, val;
      do {
        const p = pf(2, 5), r = pf(3, 7);
        b = p[1]; NN = p[0] + p[1] * int(1, 4); n = r[0]; d = r[1];
        num = NN * d; den = b * n; val = Math.floor(num / den);
      } while (num % den === 0 || val < 2 || val > 15);
      return { stem: "水槽裡有 " + fs(NN, b) + " 公升的水,要裝進小水瓶,每個小水瓶最多可裝 " + fs(n, d) + " 公升。最多可以裝滿幾個小水瓶?", answer: String(val), units: ["個", "瓶"],
        explain: "水量 ÷ 每瓶容量 = " + fs(NN, b) + " ÷ " + fs(n, d) + " = " + fs(NN, b) + " × " + fs(d, n) + " = " + F(num, den) + " ≈ " + K.num(num / den) + "。\n裝滿的瓶子只能算整數個,所以最多裝滿 " + val + " 個(剩下的水不夠再裝滿一瓶)。",
        trapNote: "常見錯誤:直接把商 " + F(num, den) + " 當作答案。題目問「最多可以裝滿幾個」,商不是整數時,小數或分數的部分不夠裝滿一個,要捨去,只能算 " + val + " 個。" };
    }),
    mk("word", 4, "extend", function () {
      const d = int(3, 6);
      let n; do { n = int(1, d - 1); } while (gcd(n, d) !== 1);
      const k = int(2, 4), N = d * k * int(1, 3);
      const rest = N - N * n / d, each = rest / k;
      return { stem: "一條緞帶長 " + N + " 公尺,先用掉全長的 " + fs(n, d) + ",剩下的平均剪成 " + k + " 段,每段長幾公尺?", answer: K.num(each), accepted: acc(rest, k), units: ["公尺", "m"],
        explain: "用掉 " + N + "×" + fs(n, d) + " = " + (N * n / d) + " 公尺,剩下 " + N + " - " + (N * n / d) + " = " + rest + " 公尺。\n平分成 " + k + " 段:" + rest + " ÷ " + k + " = " + K.num(each) + " 公尺。" };
    }),
    mk("word", 5, "extend", function () {
      const d = int(3, 7);
      let n; do { n = int(1, d - 2); } while (gcd(n, d) !== 1);
      const X = d * int(2, 6), R = X - X * n / d;
      return { stem: "一桶油倒出了全部的 " + fs(n, d) + " 之後,桶子裡還剩 " + R + " 公升。這桶油原來有幾公升?", answer: String(X), units: ["公升", "L", "l"],
        explain: "倒出 " + fs(n, d) + ",剩下 1 - " + fs(n, d) + " = " + fs(d - n, d) + "。\n剩下的 " + R + " 公升就是全部的 " + fs(d - n, d) + ",所以全部 = " + R + " ÷ " + fs(d - n, d) + " = " + R + " × " + fs(d, d - n) + " = " + X + " 公升。" };
    })
  ];

  ExamBank.register(T, "fraction-div-basic", single.concat(multi, tf, fill, calc, word));
})();
