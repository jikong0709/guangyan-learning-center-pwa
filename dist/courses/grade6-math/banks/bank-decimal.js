/* 題庫：decimal 小數除法、商的概數（四捨五入到指定位）、生活應用（對應舊單元 上3）
   題庫工 A 自編。小數一律以整數縮放運算，避免浮點誤差。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, shuffle = K.shuffle, gcd = K.gcd;
  const T = "decimal";
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
  /* 整數 n 縮放 10^p 倍後的小數字串 */
  function D(n, p) { return K.num(n / Math.pow(10, p)); }
  /* A/B 四捨五入到小數第 p 位：回傳 {r:縮放整數, trunc:無條件捨去縮放整數, tie, exact} */
  function rnd(A, B, p) {
    const m = Math.pow(10, p), am = A * m;
    return { r: Math.floor((2 * am + B) / (2 * B)), trunc: (am - am % B) / B, tie: (2 * am) % (2 * B) === B, exact: am % B === 0 };
  }
  function pad(r, p) { return (r / Math.pow(10, p)).toFixed(p); }
  /* 位數名稱 */
  function place(p) { return p === 1 ? "小數第一位(十分位)" : "小數第二位(百分位)"; }
  function nextDigitNote(A, B, p) {
    const m = rnd(A, B, p);
    return "商約 " + (A / B).toFixed(p + 2) + "…,看小數第 " + (p + 1) + " 位:" + (m.r > m.trunc ? "大於等於 5,要進位" : "小於 5,捨去") + ",取到" + place(p) + "是 " + pad(m.r, p) + "。";
  }
  const D100 = [20, 25, 40, 50, 60, 75, 80, 150, 250];

  const single = [
    mk("single", 1, "basic", function () {
      const p = pick([1, 2]); let qi;
      do { qi = p === 1 ? int(12, 99) : int(102, 399); } while (qi % 10 === 0);
      const k = int(2, 9), a = D(qi * k, p), q = D(qi, p);
      const r = S(q, [D(qi * 10, p), D(qi, p + 1), D(qi + 1, p), D(qi * 100, p)]);
      r.stem = a + " ÷ " + k + " = ?";
      r.explain = a + " ÷ " + k + " = " + q + "。\n驗算:" + q + " × " + k + " = " + a + "。商的小數點要和被除數的小數點對齊。";
      return r;
    }),
    mk("single", 2, "basic", function () {
      let d, q, N100;
      do { d = pick(D100); q = int(3, 60); N100 = q * d; } while (N100 % 100 !== 0 || N100 / 100 < 2);
      const N = N100 / 100, dd = D(d, 2);
      const r = S(String(q), [q * 10, K.num(q / 10), K.num(N * d / 100), q * 100, q + 10]);
      r.stem = N + " ÷ " + dd + " = ?";
      r.explain = "除數 " + dd + " 要變成整數,被除數同樣移位:\n" + N + " ÷ " + dd + " = " + (N * 100) + " ÷ " + d + " = " + q + "。\n驗算:" + q + " × " + dd + " = " + N + "。";
      return r;
    }),
    mk("single", 3, "trap", function () {
      let bi; do { bi = int(11, 99); } while (bi % 10 === 0);
      const q = int(2, 60), a = D(q * bi, 2), b = D(bi, 2);
      const r = S(String(q), [q * 10, K.num(q / 10), q * 100, K.num(q / 100)]);
      r.stem = a + " ÷ " + b + " = ?";
      r.explain = "除數 " + b + " 乘 100 變成 " + bi + ",被除數也要乘 100:" + (q * bi) + " ÷ " + bi + " = " + q + "。\n驗算:" + q + " × " + b + " = " + a + "。";
      r.trapNote = "常見錯誤:除數小數點移了兩位,被除數卻只移一位(或移了三位),商就會差 10 倍或 100 倍,得到 " + (q * 10) + " 或 " + K.num(q / 10) + "。被除數和除數的小數點要「同時、移相同的位數」。";
      return r;
    }),
    mk("single", 4, "trap", function () {
      const N = int(5, 60), d = pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.8]);
      const correct = N + " ÷ " + d;
      const cands = [N + " ÷ " + pick([1.2, 1.5, 2.5]), N + " ÷ " + int(2, 5), N + " × " + pick([0.3, 0.7, 0.9]), N + " ÷ " + pick([1.25, 1.6, 4])];
      const r = S(correct, cands);
      r.stem = "下列哪一個算式的結果,會比 " + N + " 大?";
      r.explain = "除以小於 1 的數,商會變大:" + correct + " = " + K.num(N / d) + ",比 " + N + " 大。\n其他選項是除以大於 1 的數,或乘以小於 1 的數,結果都比 " + N + " 小。";
      r.trapNote = "常見錯誤:以為「除法的商一定比被除數小」。除數小於 1 時,商比被除數大;除數大於 1 時,商才比被除數小。";
      return r;
    }),
    mk("single", 5, "extend", function () {
      let X, d, d2, qi, q2i;
      const L = [20, 25, 40, 50, 80, 150, 250, 400, 500];
      do { X = int(3, 30); d = pick(L); d2 = pick(L); qi = X * 10000 / d; q2i = X * 10000 / d2; } while (d === d2 || !Number.isInteger(qi) || !Number.isInteger(q2i) || X * d2 / 100 === X);
      const q = D(qi, 2), q2 = D(q2i, 2);
      const r = S(q2, [q, K.num(X * d2 / 100), K.num(qi / 100 * d2 / 100), D(q2i * 10, 2), D(q2i, 3)]);
      r.stem = "某數除以 " + D(d, 2) + " 的商是 " + q + "。如果改成除以 " + D(d2, 2) + ",商會是多少?";
      r.explain = "先求某數:" + q + " × " + D(d, 2) + " = " + X + "。\n再除以 " + D(d2, 2) + ":" + X + " ÷ " + D(d2, 2) + " = " + q2 + "。";
      return r;
    })
  ];

  function eqLine(ok) {
    if (Math.random() < 0.5) {
      const p = pick([1, 2]); let qi;
      do { qi = p === 1 ? int(12, 99) : int(102, 399); } while (qi % 10 === 0);
      const k = int(2, 9), a = D(qi * k, p), q = D(qi, p);
      return a + " ÷ " + k + " = " + (ok ? q : pick([D(qi * 10, p), D(qi, p + 1)]));
    }
    let d, q, N100;
    do { d = pick(D100); q = int(3, 60); N100 = q * d; } while (N100 % 100 !== 0 || N100 / 100 < 2);
    return (N100 / 100) + " ÷ " + D(d, 2) + " = " + (ok ? q : pick([q * 10, K.num(q / 10)]));
  }
  function evalExpr(e) { return Function("return (" + e.replace(/÷/g, "/").replace(/×/g, "*") + ")")(); }

  const multi = [
    mk("multi", 2, "basic", function () {
      const ng = int(2, 3), used = {}, goods = [], bads = [];
      while (goods.length < ng) { const x = eqLine(true); if (!used[x]) { used[x] = 1; goods.push(x); } }
      while (bads.length < 5 - ng) { const x = eqLine(false); if (!used[x]) { used[x] = 1; bads.push(x); } }
      return M("下列算式,哪些是正確的?選出所有正確的。", goods, bads, "用乘法驗算(商 × 除數 = 被除數)逐題檢查。正確的算式是:" + goods.join(";") + "。其餘的商,小數點位置差了 10 倍。");
    }),
    mk("multi", 3, "basic", function () {
      const ri = int(12, 99), R = D(ri, 1);
      const ys = shuffle([0.2, 0.4, 0.5, 0.8, 1.5, 2.5, 4, 0.25]).slice(0, 5), ng = int(2, 3), goods = [], bads = [];
      ys.forEach(function (y, i) {
        const x = K.num(ri / 10 * y);
        if (i < ng) goods.push(x + " ÷ " + y);
        else bads.push(K.num(ri / 10 * y * pick([10, 0.1])) + " ÷ " + y);
      });
      return M("下列哪些算式的商等於 " + R + "?選出所有正確的。", goods, bads,
        "商是 " + R + ",被除數應該等於 商 × 除數。檢查:" + goods.map(function (g) { return g; }).join("、") + " 的商都是 " + R + ";其他選項的被除數多了或少了 10 倍。");
    }),
    mk("multi", 3, "trap", function () {
      const N = int(4, 40), d = pick([0.2, 0.4, 0.5, 0.8]), x = pick([1.2, 1.5, 2.5]);
      const trues = [
        N + " ÷ 0.5 的結果,和 " + N + " × 2 相同",
        "被除數和除數同時乘 10,商不變",
        N + " ÷ " + d + " 的商比 " + N + " 大",
        N + " ÷ " + x + " 的商比 " + N + " 小"
      ];
      const falses = [
        N + " ÷ 0.1 的結果,和 " + N + " ÷ 10 相同",
        "除法的商一定比被除數小",
        N + " ÷ " + d + " 的商比 " + N + " 小",
        "被除數和除數同時乘 10,商也跟著乘 10"
      ];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "除以 0.5 就是乘以 2;除以 0.1 就是乘以 10;除數小於 1 商變大,除數大於 1 商變小;被除數和除數同乘一個數,商不變。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:以為除法的商一定變小、以為除以 0.1 等於除以 10、以為被除數和除數同乘 10 商也跟著乘 10。");
    }),
    mk("multi", 4, "trap", function () {
      const N = D(int(31, 99), 1);
      const bigger = shuffle([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 0.25]).slice(0, 3).map(function (d) { return N + " ÷ " + d; });
      const smaller = shuffle([1.2, 1.5, 2.5, 3, 4]).slice(0, 3).map(function (d) { return N + " ÷ " + d; });
      const goods = bigger.slice(0, int(2, 3)), bads = smaller.slice(0, 2);
      return M("下列哪些算式的商,比 " + N + " 大?選出所有正確的。", goods, bads,
        "除以小於 1 的數,商會比被除數大:" + goods.join("、") + "。\n其他是除以大於 1 的數,商比 " + N + " 小。",
        "常見錯誤:看到「÷」就認為商會變小。除數小於 1 時,商比被除數大。");
    }),
    mk("multi", 5, "extend", function () {
      const b = pick([0.6, 0.8, 1.2, 0.25, 0.4]), qi = int(3, 20), a = K.num(qi * b);
      const base = a + " ÷ " + b;
      const goods = [
        "(" + a + " × 10) ÷ (" + b + " × 10)",
        "(" + a + " ÷ 10) ÷ (" + b + " ÷ 10)",
        "(" + a + " × 100) ÷ (" + b + " × 100)",
        "(" + a + " × 2) ÷ (" + b + " × 2)"
      ];
      const wrongs = [
        "(" + a + " × 10) ÷ " + b,
        a + " ÷ (" + b + " × 10)",
        "(" + a + " × 10) ÷ (" + b + " × 100)",
        "(" + a + " ÷ 10) ÷ " + b
      ];
      const gs = shuffle(goods).slice(0, int(2, 3)), bs = shuffle(wrongs).slice(0, 2);
      return M("下列哪些算式的商,和 " + base + " 的商相同?選出所有正確的。", gs, bs,
        base + " = " + qi + "。被除數和除數「同時」乘(或除以)相同的數,商不變,所以 " + gs.join("、") + " 的商都是 " + qi + "。\n其他選項只改了其中一個數,或兩個數改的倍數不同,商就變了。");
    })
  ];

  const tf = [
    mk("tf", 1, "basic", function () {
      const line = eqLine(Math.random() < 0.5);
      const m = line.split(" = "), lhs = m[0], rhs = m[1];
      const truth = Math.abs(evalExpr(lhs) - Number(rhs)) < 1e-9;
      return { stem: line + "。", answer: truth, explain: lhs + " = " + K.num(evalExpr(lhs)) + (truth ? ",敘述正確。" : ",不是 " + rhs + "。小數點的位置要用乘法驗算。") };
    }),
    mk("tf", 2, "trap", function () {
      const N = int(4, 50), d = pick([0.2, 0.4, 0.5, 0.8, 1.2, 1.5, 2.5]);
      const smaller = d > 1;
      return { stem: N + " ÷ " + d + " 的商,一定比 " + N + " 小。", answer: smaller,
        explain: N + " ÷ " + d + " = " + K.num(N / d) + (smaller ? ",比 " + N + " 小,敘述正確(除數大於 1)。" : ",比 " + N + " 大,敘述錯誤(除數小於 1)。"),
        trapNote: "易錯觀念:以為除法的商一定比被除數小。除以小於 1 的數,商會變大。" };
    }),
    mk("tf", 3, "trap", function () {
      const b = int(2, 9), a = b * int(2, 9);
      const A = D(a, 1), B = D(b, 1), right = Math.random() < 0.5;
      const lhs = A + " ÷ " + B, rhs = right ? a + " ÷ " + b : (a * 10) + " ÷ " + b;
      return { stem: lhs + " = " + rhs + "。", answer: right,
        explain: "被除數和除數要同時乘 10:" + lhs + " = " + a + " ÷ " + b + " = " + (a / b) + (right ? ",敘述正確。" : "。而 " + (a * 10) + " ÷ " + b + " = " + (a * 10 / b) + ",兩邊不相等。"),
        trapNote: "易錯:被除數和除數移動小數點(同乘一個數)要「相同位數」才能保持商不變;只移其中一個,商會差 10 倍。" };
    }),
    mk("tf", 4, "basic", function () {
      let A, B, p, m;
      do { B = pick([3, 6, 7, 9, 11, 13]); A = int(40, 300); p = pick([1, 2]); m = rnd(A, B * 10, p); } while (m.exact || m.tie || m.r === m.trunc);
      const right = Math.random() < 0.5, v = pad(right ? m.r : m.trunc, p);
      const x = D(A, 1);
      return { stem: x + " ÷ " + B + " 的商,四捨五入到" + place(p) + ",約是 " + v + "。", answer: right,
        explain: nextDigitNote(A, B * 10, p) + "\n" + (right ? "所以敘述正確。" : "答案應是 " + pad(m.r, p) + ",不是 " + v + "。") };
    }),
    mk("tf", 5, "extend", function () {
      const di = int(12, 99), d = D(di, 1), qi = int(12, 60), q = D(qi, 1);
      const X = K.num(qi * di / 100), right = Math.random() < 0.5;
      const use = right ? X : pick([K.num(qi * di / 10), K.num(qi * di / 1000)]);
      return { stem: "某數除以 " + d + " 的商是 " + q + ",所以某數是 " + use + "。", answer: right,
        explain: "倒推:某數 = 商 × 除數 = " + q + " × " + d + " = " + X + (right ? ",敘述正確。" : ",不是 " + use + "。") };
    })
  ];

  const fill = [
    mk("fill", 1, "basic", function () {
      const p = pick([1, 2]); let qi;
      do { qi = p === 1 ? int(12, 99) : int(102, 399); } while (qi % 10 === 0);
      const k = int(2, 9), a = D(qi * k, p);
      return { stem: a + " ÷ " + k + " = ____", answer: D(qi, p), explain: a + " ÷ " + k + " = " + D(qi, p) + "。驗算:" + D(qi, p) + " × " + k + " = " + a + "。" };
    }),
    mk("fill", 2, "basic", function () {
      let d, q, N100;
      do { d = pick(D100); q = int(3, 60); N100 = q * d; } while (N100 % 100 !== 0 || N100 / 100 < 2);
      return { stem: (N100 / 100) + " ÷ " + D(d, 2) + " = ____", answer: String(q),
        explain: "除數和被除數同時乘 100:" + N100 + " ÷ " + d + " = " + q + "。" };
    }),
    mk("fill", 3, "basic", function () {
      const pb = pick([1, 2]); let bi; do { bi = pb === 1 ? int(12, 99) : int(102, 399); } while (bi % 10 === 0 || pb === 2 && bi > 250);
      const qi = int(12, 99), a = D(qi * bi, pb + 1), b = D(bi, pb);
      return { stem: a + " ÷ " + b + " = ____", answer: D(qi, 1),
        explain: "除數 " + b + " 與被除數同時移位,算出商 " + D(qi, 1) + "。\n驗算:" + D(qi, 1) + " × " + b + " = " + a + "。" };
    }),
    mk("fill", 4, "trap", function () {
      let A, B, p, m;
      do { B = pick([3, 6, 7, 9, 11, 13]); A = int(40, 300); p = pick([1, 2]); m = rnd(A, B * 10, p); } while (m.exact || m.tie || m.r === m.trunc);
      return { stem: D(A, 1) + " ÷ " + B + " 的商,四捨五入到" + place(p) + ",約是 ____。", answer: D(m.r, p), accepted: [pad(m.r, p)],
        explain: nextDigitNote(A, B * 10, p),
        trapNote: "常見錯誤:只把商「捨去」到要求的位數,得到 " + pad(m.trunc, p) + "。四捨五入要看下一位:大於等於 5 要進位,答案才是 " + pad(m.r, p) + "。" };
    }),
    mk("fill", 5, "extend", function () {
      const b = pick([0.2, 0.4, 0.5, 0.6, 0.8, 1.2, 2.5]), ci = int(5, 40), c = D(ci * 5, 1);
      const a = K.num(ci * 5 / 10 * b), m = pick([2, 5, 10]), n = pick([2, 5, 10]);
      const ans = K.num(ci * 5 / 10 * m * n);
      return { stem: "已知 " + a + " ÷ " + b + " = " + c + ",則 (" + a + " × " + m + ") ÷ (" + b + " ÷ " + n + ") = ____",
        answer: ans,
        explain: "被除數乘 " + m + ",商變成 " + m + " 倍;除數除以 " + n + ",商變成 " + n + " 倍。\n所以商 = " + c + " × " + m + " × " + n + " = " + ans + "。" };
    })
  ];

  const calc = [
    mk("calc", 1, "basic", function () {
      let qi; do { qi = int(102, 399); } while (qi % 10 === 0);
      const k = int(2, 9), a = D(qi * k, 2);
      return { stem: "計算:" + a + " ÷ " + k, answer: D(qi, 2), explain: "列式:" + a + " ÷ " + k + " = " + D(qi, 2) + "。\n驗算:" + D(qi, 2) + " × " + k + " = " + a + "。" };
    }),
    mk("calc", 2, "basic", function () {
      let d, q, N100;
      do { d = pick(D100.concat([125, 375])); q = int(4, 80); N100 = q * d; } while (N100 % 100 !== 0 || N100 / 100 < 3);
      return { stem: "計算:" + (N100 / 100) + " ÷ " + D(d, 2), answer: String(q), explain: "列式:" + (N100 / 100) + " ÷ " + D(d, 2) + "\n= " + N100 + " ÷ " + d + "(兩數同乘 100)\n= " + q + "。" };
    }),
    mk("calc", 3, "basic", function () {
      let bi; do { bi = int(12, 96); } while (bi % 10 === 0);
      const qi = int(12, 99), a = D(qi * bi, 3), b = D(bi, 2);
      return { stem: "計算:" + a + " ÷ " + b, answer: D(qi, 1), explain: "列式:" + a + " ÷ " + b + "\n除數 " + b + " 乘 100 變成 " + bi + ",被除數也乘 100 變成 " + D(qi * bi, 1) + ",再算 " + D(qi * bi, 1) + " ÷ " + bi + " = " + D(qi, 1) + "。\n驗算:" + D(qi, 1) + " × " + b + " = " + a + "。" };
    }),
    mk("calc", 4, "trap", function () {
      const w = int(1, 9), s = int(1, 9), qi = w * 100 + s, k = int(2, 9);
      const a = D(qi * k, 2), q = D(qi, 2);
      return { stem: "計算:" + a + " ÷ " + k, answer: q,
        explain: "列式:" + a + " ÷ " + k + "。\n個位商 " + w + " 之後,下一位不夠除,要在商的小數點後寫 0,再往下除,得 " + q + "。\n驗算:" + q + " × " + k + " = " + a + "。",
        trapNote: "常見錯誤:中間某一位不夠除時,漏寫商的 0,把答案寫成 " + K.num(w + s / 10) + "。商的 0 是佔位用的,不能省。" };
    }),
    mk("calc", 5, "extend", function () {
      const b1 = pick([0.9, 0.6, 0.4, 0.5, 1.2]), q1 = int(3, 12), b2 = pick([0.8, 0.4, 0.5, 0.25, 1.5]), q2 = int(3, 12);
      const a1 = K.num(q1 * b1), a2 = K.num(q2 * b2);
      return { stem: "計算:" + a1 + " ÷ " + b1 + " + " + a2 + " ÷ " + b2, answer: K.num(q1 + q2),
        explain: "分別計算:" + a1 + " ÷ " + b1 + " = " + q1 + ",\n" + a2 + " ÷ " + b2 + " = " + q2 + "。\n相加:" + q1 + " + " + q2 + " = " + (q1 + q2) + "。" };
    })
  ];

  const word = [
    mk("word", 2, "basic", function () {
      const k = int(3, 8); let pi; do { pi = int(35, 180); } while (pi % 10 === 0);
      const price = D(pi, 1), total = D(pi * k, 1);
      return { stem: "小美買了 " + k + " 枝一樣的原子筆,一共付了 " + total + " 元。每枝原子筆多少元?", answer: price, units: ["元"],
        explain: "總價 ÷ 數量 = 單價:" + total + " ÷ " + k + " = " + price + "。\n答:每枝 " + price + " 元。" };
    }),
    mk("word", 3, "basic", function () {
      const d = pick([0.4, 0.5, 0.6, 0.8, 1.2, 1.5]), q = int(5, 40), N = K.num(q * d);
      return { stem: "一條緞帶長 " + N + " 公尺,每個蝴蝶結要用 " + d + " 公尺,而且不能有剩。這條緞帶可以做幾個蝴蝶結?", answer: String(q), units: ["個"],
        explain: "緞帶總長 ÷ 每個用量:" + N + " ÷ " + d + " = " + q + "。\n答:" + q + " 個。" };
    }),
    mk("word", 4, "trap", function () {
      let A, Bv, v;
      do { A = int(150, 420); Bv = pick([12, 15, 18, 24, 25, 35]); v = Math.ceil(A / Bv); } while (A % Bv === 0 || v < 5 || v > 30);
      return { stem: "果汁工廠有 " + D(A, 1) + " 公升的果汁,要全部裝進瓶子,每個瓶子最多可以裝 " + D(Bv, 1) + " 公升。至少需要幾個瓶子才能全部裝完?", answer: String(v), units: ["個", "瓶"],
        explain: D(A, 1) + " ÷ " + D(Bv, 1) + " = " + (A / Bv).toFixed(2) + "…,商不是整數,最後還剩一點果汁,也需要多一個瓶子。\n所以至少需要 " + v + " 個瓶子(無條件進入)。",
        trapNote: "常見錯誤:直接捨去小數,只算 " + Math.floor(A / Bv) + " 個,會有果汁裝不下。「至少需要幾個才能全部裝完」有餘數就要再多一個,也就是「無條件進入」。" };
    }),
    mk("word", 4, "extend", function () {
      let A, B, m;
      do { B = pick([3, 6, 7, 9]); A = int(25, 120); m = rnd(A, B * 10, 1); } while (m.exact || m.tie);
      return { stem: "小明騎腳踏車," + B + " 小時騎了 " + D(A, 1) + " 公里。平均每小時騎幾公里?(四捨五入到小數第一位)", answer: D(m.r, 1), accepted: [pad(m.r, 1)], units: ["公里", "公里/小時", "km"],
        explain: "平均每小時 = 距離 ÷ 時間:" + D(A, 1) + " ÷ " + B + " = " + (A / B / 10).toFixed(3) + "…。\n取到小數第一位,看第二位決定進位或捨去,得 " + pad(m.r, 1) + " 公里。" };
    }),
    mk("word", 5, "extend", function () {
      let N, ci, d, T10, r;
      const ds = [2, 3, 4, 5, 6, 8, 12, 15];
      do { N = int(4, 12); ci = int(3, 9); T10 = N * ci; d = pick(ds); r = T10 / d; } while (!Number.isInteger(r) || r === N || r < 3);
      return { stem: "把果汁倒進 " + N + " 個一樣的杯子,每杯倒 " + D(ci, 1) + " 公升,剛好倒完。如果改用每杯容量 " + D(d, 1) + " 公升的杯子來裝,剛好裝滿,需要幾個杯子?", answer: String(r), units: ["個", "杯"],
        explain: "果汁總量 = " + N + " × " + D(ci, 1) + " = " + D(T10, 1) + " 公升。\n改用每杯 " + D(d, 1) + " 公升:" + D(T10, 1) + " ÷ " + D(d, 1) + " = " + r + " 個。" };
    })
  ];

  ExamBank.register(T, "decimal-basic", single.concat(multi, tf, fill, calc, word));
})();
