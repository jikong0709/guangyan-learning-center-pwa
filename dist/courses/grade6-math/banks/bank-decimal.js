/* 題庫：decimal 小數除法、商的概數（四捨五入到指定位）、生活應用（對應舊單元 上3）
   題庫工 A 自編。數字風格：整數／小數／（少量）分數，全部用 kit.Q 精確運算（規格第 11 節）。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, shuffle = K.shuffle;
  const Q = K.Q, qAdd = K.qAdd, qSub = K.qSub, qMul = K.qMul, qDiv = K.qDiv, qCmp = K.qCmp, qFrac = K.qFrac;
  const T = "decimal";
  const cnt = {};
  /* 學生看得到的字串：分母不得超過 100、不得有 9 位以上數字，否則重抽（accepted 內的則直接剔除） */
  function badStr(x) {
    x = String(x);
    let m; const re = /(\d+)\/(\d+)/g;
    while ((m = re.exec(x))) if (Number(m[2]) > 100) return true;
    return /\d{9,}|\d+\.\d{5,}/.test(x);
  }
  function retry(g) {
    return function (kit) {
      let last;
      for (let t = 0; t < 300; t++) {
        try {
          const r = g(kit);
          if (r.accepted) r.accepted = r.accepted.filter(function (x) { return !badStr(x); });
          const seen = [r.stem, r.explain, r.trapNote || "", String(r.answer)].concat(r.options || []);
          if (seen.some(badStr)) throw new Error("重抽");
          return r;
        } catch (e) { if (!/選項重複|干擾項不足|重抽/.test(e.message)) throw e; last = e; }
      }
      throw last;
    };
  }
  function mk(type, level, tag, gen) {
    cnt[type] = (cnt[type] || 0) + 1;
    const n = cnt[type];
    return { id: T + "-" + type + "-L" + level + "-" + (n < 10 ? "0" : "") + n, type: type, level: level, tag: tag, gen: retry(gen) };
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
  /* 有限小數（最多 4 位且精確）才可用小數顯示 */
  function decOK(q) { if (!K.qIsTerminating(q)) return false; const s = K.qDec(q); return s !== null && Math.abs(Number(s) - q.n / q.d) < 1e-12; }
  function dsh(q) { return decOK(q) ? K.qDec(q) : K.qMixed(q); }
  function places(q) { const s = K.qDec(q); const i = s === null ? -1 : s.indexOf("."); return i < 0 ? 0 : s.length - i - 1; }
  function qa(q) { const o = K.qAnswer(q, "dec"); const v = q.n / q.d; o.accepted = o.accepted.filter(function (x) { return !/^\d+\.\d+$/.test(x) || Math.abs(Number(x) - v) < 1e-12; }); return o; }
  function sho(q, fl) { return fl === "frac" ? qFrac(q) : dsh(q); }
  const FR = { dens: [2, 4, 5, 8, 10] };
  function gen1(fl, o) { return K.randQ(fl, Object.assign({}, FR, o || {})); }
  /* 取一組可除得盡（≤4 位小數）的除法 */
  function pairD(FA, FB, oa, ob, opt) {
    opt = opt || {};
    for (let t = 0; t < 500; t++) {
      const fa = K.flavor(FA), fb = K.flavor(FB);
      const a = gen1(fa, oa), b = gen1(fb, ob);
      const r = qDiv(a, b);
      if (!decOK(r) || r.n > 200000) continue;
      if (opt.nonInt && r.d === 1) continue;
      if (opt.bothIntNonInt && fa === "int" && fb === "int" && r.d === 1) continue;
      if (qCmp(a, b) === 0) continue;
      return { a: a, b: b, r: r, fa: fa, fb: fb };
    }
    throw new Error("重抽");
  }
  function stemEq(p) { return sho(p.a, p.fa) + " ÷ " + sho(p.b, p.fb); }
  function ex(p) {
    const s = p.fb === "frac" ? 0 : places(p.b);
    const head = stemEq(p);
    if (p.fb === "frac") return head + "\n分數 " + qFrac(p.b) + " 先化成小數 " + dsh(p.b) + "(或把除數翻成倒數相乘),\n" + head + " = " + dsh(p.r) + "。\n驗算:" + dsh(p.r) + " × " + sho(p.b, p.fb) + " = " + sho(p.a, p.fa) + "。";
    if (s > 0) { const m = Q(Math.pow(10, s)); return head + "\n除數化成整數:被除數和除數同時乘 " + Math.pow(10, s) + ",\n= " + dsh(qMul(p.a, m)) + " ÷ " + dsh(qMul(p.b, m)) + " = " + dsh(p.r) + "。\n驗算:" + dsh(p.r) + " × " + dsh(p.b) + " = " + dsh(p.a) + "。"; }
    return head + " = " + dsh(p.r) + "。\n驗算:" + dsh(p.r) + " × " + dsh(p.b) + " = " + dsh(p.a) + "。商的小數點要和被除數的小數點對齊。";
  }
  function wrongsOf(p) {
    const r = p.r;
    const c = [qMul(r, Q(10)), qDiv(r, Q(10)), qMul(r, Q(100)), qDiv(r, Q(100)), qAdd(r, Q(1, 10)), qMul(r, Q(2)), qAdd(r, Q(1)), qDiv(r, Q(2))];
    return c.filter(function (x) { return x.n > 0 && qCmp(x, r) !== 0 && decOK(x); }).map(dsh);
  }
  /* 四捨五入到小數第 p 位（精確整數運算） */
  function rnd(q, p) {
    const m = Math.pow(10, p), am = q.n * m, B = q.d;
    return { r: Math.floor((2 * am + B) / (2 * B)), trunc: (am - am % B) / B, tie: (2 * am) % (2 * B) === B, exact: am % B === 0 };
  }
  function pad(r, p) { return (r / Math.pow(10, p)).toFixed(p); }
  function place(p) { return p === 1 ? "小數第一位(十分位)" : "小數第二位(百分位)"; }
  function noteRound(q, p) {
    const m = rnd(q, p);
    return "商約 " + (q.n / q.d).toFixed(p + 2) + "…,看小數第 " + (p + 1) + " 位:" + (m.r > m.trunc ? "大於等於 5,要進位" : "小於 5,捨去") + ",取到" + place(p) + "是 " + pad(m.r, p) + "。";
  }
  /* 取一組除不盡、需要進位的概數題 */
  function roundCase() {
    for (let t = 0; t < 500; t++) {
      const fa = K.flavor(["int", "dec"]), fb = K.flavor(["int", "int", "dec"]);
      const a = gen1(fa, fa === "int" ? { min: 5, max: 60 } : { min: 2, max: 40 });
      const b = fb === "int" ? Q(pick([3, 6, 7, 9, 11, 13])) : Q(pick([3, 6, 7, 9, 11, 13]), 10);
      const q = qDiv(a, b), p = pick([1, 2]), m = rnd(q, p);
      if (m.exact || m.tie || m.r === m.trunc) continue;
      return { a: a, b: b, fa: fa, fb: fb === "int" ? "int" : "dec", q: q, p: p, m: m };
    }
    throw new Error("重抽");
  }
  function stemRound(c) { return sho(c.a, c.fa) + " ÷ " + sho(c.b, c.fb) + " 的商,四捨五入到" + place(c.p) + ",約是 "; }
  const DEC2 = { min: 0.2, max: 2.5 };

  const single = [
    mk("single", 1, "basic", function () {
      const p = pairD(["dec", "dec", "int"], ["int"], { min: 1, max: 30 }, { min: 2, max: 9 }, { bothIntNonInt: true });
      const r = S(dsh(p.r), wrongsOf(p));
      r.stem = stemEq(p) + " = ?"; r.explain = ex(p);
      return r;
    }),
    mk("single", 2, "basic", function () {
      const p = pairD(["int"], ["dec", "dec", "frac"], { min: 2, max: 60 }, DEC2);
      const r = S(dsh(p.r), wrongsOf(p));
      r.stem = stemEq(p) + " = ?"; r.explain = ex(p);
      return r;
    }),
    mk("single", 3, "trap", function () {
      const p = pairD(["dec", "int"], ["dec"], { min: 1, max: 60 }, { min: 0.12, max: 0.99, places: 2 });
      const r = S(dsh(p.r), wrongsOf(p));
      r.stem = stemEq(p) + " = ?"; r.explain = ex(p);
      r.trapNote = "常見錯誤:除數的小數點移了兩位,被除數卻只移一位(或移了三位),商就會差 10 倍或 100 倍,得到 " + dsh(qMul(p.r, Q(10))) + " 或 " + dsh(qDiv(p.r, Q(10))) + "。被除數和除數的小數點要「同時、移相同的位數」。";
      return r;
    }),
    mk("single", 4, "trap", function () {
      const fN = K.flavor(["int", "dec"]), N = gen1(fN, { min: 4, max: 60 });
      const fd = K.flavor(["dec", "dec", "frac"]);
      const d = fd === "frac" ? Q(pick([1, 3]), 4) : gen1("dec", { min: 0.2, max: 0.9 });
      const big = qDiv(N, d);
      if (!decOK(big)) throw new Error("重抽");
      const sN = sho(N, fN), sd = sho(d, fd === "frac" ? "frac" : "dec");
      const correct = sN + " ÷ " + sd;
      const cands = [sN + " ÷ " + dsh(gen1("dec", { min: 1.2, max: 3 })), sN + " ÷ " + int(2, 5), sN + " × " + dsh(gen1("dec", { min: 0.2, max: 0.9 })), sN + " ÷ " + dsh(Q(int(5, 9), 4)), sN + " ÷ " + pick(["1.25", "1.6", "2.5"])];
      const r = S(correct, cands);
      r.stem = "下列哪一個算式的結果,會比 " + sN + " 大?";
      r.explain = "除以小於 1 的數,商會變大:" + correct + " = " + dsh(big) + ",比 " + sN + " 大。\n其他選項是除以大於 1 的數,或乘以小於 1 的數,結果都比 " + sN + " 小。";
      r.trapNote = "常見錯誤:以為「除法的商一定比被除數小」。除數小於 1 時,商比被除數大;除數大於 1 時,商才比被除數小。";
      return r;
    }),
    mk("single", 5, "extend", function () {
      const fd = K.flavor(["dec", "int"]), d = gen1(fd, { min: 0.2, max: 5 });
      const fq = K.flavor(["dec", "int"]), q = gen1(fq, { min: 3, max: 40 });
      const d2 = gen1("dec", { min: 0.2, max: 4 });
      const X = qMul(q, d), q2 = qDiv(X, d2);
      if (!decOK(X) || !decOK(q2) || qCmp(d, d2) === 0 || X.n > 100000) throw new Error("重抽");
      const wr = [q, qMul(X, d2), qMul(q2, Q(10)), qDiv(q2, Q(10)), qMul(q, d2), qMul(q2, Q(2))].filter(function (x) { return x.n > 0 && qCmp(x, q2) !== 0 && decOK(x); }).map(dsh);
      const r = S(dsh(q2), wr);
      r.stem = "某數除以 " + sho(d, fd) + " 的商是 " + sho(q, fq) + "。如果改成除以 " + dsh(d2) + ",商會是多少?";
      r.explain = "先求某數:" + sho(q, fq) + " × " + sho(d, fd) + " = " + dsh(X) + "。\n再除以 " + dsh(d2) + ":" + dsh(X) + " ÷ " + dsh(d2) + " = " + dsh(q2) + "。";
      return r;
    })
  ];

  function eqLine(ok) {
    const k = pick([0, 1, 2]);
    const p = k === 0 ? pairD(["dec", "int"], ["int"], { min: 1, max: 30 }, { min: 2, max: 9 }, { bothIntNonInt: true }) : k === 1 ? pairD(["int"], ["dec", "frac"], { min: 2, max: 60 }, DEC2) : pairD(["dec"], ["dec"], { min: 1, max: 60 }, { min: 0.12, max: 0.99 });
    const w = wrongsOf(p);
    return stemEq(p) + " = " + (ok ? dsh(p.r) : pick(w));
  }
  function evalExpr(e) { return Function("return (" + e.replace(/÷/g, "/").replace(/×/g, "*") + ")")(); }

  const multi = [
    mk("multi", 2, "basic", function () {
      const ng = int(2, 3), used = {}, goods = [], bads = [];
      let guard = 0;
      while (goods.length < ng && guard++ < 100) { const x = eqLine(true); if (!used[x]) { used[x] = 1; goods.push(x); } }
      while (bads.length < 5 - ng && guard++ < 200) { const x = eqLine(false); if (!used[x]) { used[x] = 1; bads.push(x); } }
      return M("下列算式,哪些是正確的?選出所有正確的。", goods, bads, "用乘法驗算(商 × 除數 = 被除數)逐題檢查。正確的算式是:" + goods.join(";") + "。其餘的商,小數點位置差了 10 倍或 100 倍。");
    }),
    mk("multi", 3, "basic", function () {
      const fR = K.flavor(["dec", "int"]), R = gen1(fR, { min: 1.2, max: 20 });
      const Ds = []; let guard = 0;
      while (Ds.length < 5 && guard++ < 400) {
        const fd = K.flavor(["dec", "dec", "frac", "int"]);
        const D = gen1(fd, { min: 0.2, max: 4 });
        if (qCmp(D, Q(1)) === 0 || Ds.some(function (e) { return qCmp(e.D, D) === 0; })) continue;
        if (!decOK(qMul(R, D)) || !decOK(qDiv(R, D))) continue;
        Ds.push({ D: D, fd: fd });
      }
      if (Ds.length < 5) throw new Error("重抽");
      const ng = int(2, 3), goods = [], bads = [];
      Ds.forEach(function (e, i) {
        const x = i < ng ? qMul(R, e.D) : qDiv(R, e.D);
        if (!decOK(x)) throw new Error("重抽");
        (i < ng ? goods : bads).push(dsh(x) + " ÷ " + sho(e.D, e.fd));
      });
      return M("下列哪些算式的商等於 " + sho(R, fR) + "?選出所有正確的。", goods, bads,
        "商是 " + sho(R, fR) + ",被除數應該等於 商 × 除數。檢查:" + goods.join("、") + " 的商都是 " + sho(R, fR) + ";其他選項的被除數算錯了。");
    }),
    mk("multi", 3, "trap", function () {
      const fN = K.flavor(["int", "dec"]), N = gen1(fN, { min: 4, max: 40 }), sN = sho(N, fN);
      const d = pick([0.2, 0.4, 0.5, 0.8]), x = pick([1.2, 1.5, 2.5]);
      const fr = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8]]);
      const fq = Q(fr[0], fr[1]), fdec = dsh(fq);
      const wrongDec = pick([dsh(qMul(fq, Q(10))), dsh(qDiv(fq, Q(10)))]);
      const trues = [
        sN + " ÷ 0.5 的結果,和 " + sN + " × 2 相同",
        "被除數和除數同時乘 10,商不變",
        sN + " ÷ " + d + " 的商比 " + sN + " 大",
        sN + " ÷ " + x + " 的商比 " + sN + " 小",
        qFrac(fq) + " 化成小數是 " + fdec
      ];
      const falses = [
        sN + " ÷ 0.1 的結果,和 " + sN + " ÷ 10 相同",
        "除法的商一定比被除數小",
        sN + " ÷ " + d + " 的商比 " + sN + " 小",
        "被除數和除數同時乘 10,商也跟著乘 10",
        qFrac(fq) + " 化成小數是 " + wrongDec
      ];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "除以 0.5 就是乘以 2;除以 0.1 就是乘以 10;除數小於 1 商變大,除數大於 1 商變小;被除數和除數同乘一個數,商不變;分數化小數是分子 ÷ 分母(" + qFrac(fq) + " = " + fdec + ")。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:以為除法的商一定變小、以為除以 0.1 等於除以 10、以為被除數和除數同乘 10 商也跟著乘 10、分數化小數時小數點位置搞錯。");
    }),
    mk("multi", 4, "trap", function () {
      const fN = K.flavor(["dec", "dec", "int"]), N = gen1(fN, { min: 3, max: 30 }), sN = sho(N, fN);
      const bigger = shuffle([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 0.25, 0.75]).slice(0, 3).map(function (d) { return sN + " ÷ " + d; });
      const smaller = shuffle(["1.2", "1.5", "2.5", "3", "4", "1.25"]).slice(0, 3).map(function (d) { return sN + " ÷ " + d; });
      const goods = bigger.slice(0, int(2, 3)), bads = smaller.slice(0, 2);
      return M("下列哪些算式的商,比 " + sN + " 大?選出所有正確的。", goods, bads,
        "除以小於 1 的數,商會比被除數大:" + goods.join("、") + "。\n其他是除以大於 1 的數,商比 " + sN + " 小。",
        "常見錯誤:看到「÷」就認為商會變小。除數小於 1 時,商比被除數大。");
    }),
    mk("multi", 5, "extend", function () {
      const b = pick([0.6, 0.8, 1.2, 0.25, 0.4, 4, 5]), c = gen1(pick(["int", "dec"]), { min: 3, max: 20 });
      const bq = Q(Math.round(b * 100), 100), aq = qMul(c, bq);
      if (!decOK(aq)) throw new Error("重抽");
      const a = dsh(aq), bs = K.num(b);
      const base = a + " ÷ " + bs;
      const goods = ["(" + a + " × 10) ÷ (" + bs + " × 10)", "(" + a + " ÷ 10) ÷ (" + bs + " ÷ 10)", "(" + a + " × 100) ÷ (" + bs + " × 100)", "(" + a + " × 2) ÷ (" + bs + " × 2)"];
      const wrongs = ["(" + a + " × 10) ÷ " + bs, a + " ÷ (" + bs + " × 10)", "(" + a + " × 10) ÷ (" + bs + " × 100)", "(" + a + " ÷ 10) ÷ " + bs];
      const gs = shuffle(goods).slice(0, int(2, 3)), bw = shuffle(wrongs).slice(0, 2);
      return M("下列哪些算式的商,和 " + base + " 的商相同?選出所有正確的。", gs, bw,
        base + " = " + dsh(c) + "。被除數和除數「同時」乘(或除以)相同的數,商不變,所以 " + gs.join("、") + " 的商都是 " + dsh(c) + "。\n其他選項只改了其中一個數,或兩個數改的倍數不同,商就變了。");
    })
  ];

  const tf = [
    mk("tf", 1, "basic", function () {
      const right = Math.random() < 0.5, line = eqLine(right), rhs = line.split(" = ")[1];
      return { stem: line + "。", answer: right, explain: "用乘法驗算(商 × 除數 = 被除數)。" + (right ? "這個商是對的,敘述正確。" : "正確的商不是 " + rhs + "(小數點的位置要用乘法驗算),敘述錯誤。") };
    }),
    mk("tf", 2, "trap", function () {
      const fN = K.flavor(["int", "dec"]), N = gen1(fN, { min: 4, max: 50 });
      const d = pick([0.2, 0.4, 0.5, 0.8, 1.2, 1.5, 2.5]);
      const smaller = d > 1, sN = sho(N, fN);
      return { stem: sN + " ÷ " + d + " 的商,一定比 " + sN + " 小。", answer: smaller,
        explain: sN + " ÷ " + d + (smaller ? ",除數大於 1,商比 " + sN + " 小,敘述正確。" : ",除數小於 1,商比 " + sN + " 大,敘述錯誤。"),
        trapNote: "易錯觀念:以為除法的商一定比被除數小。除以小於 1 的數,商會變大。" };
    }),
    mk("tf", 3, "trap", function () {
      const fa = K.flavor(["dec", "int"]), fb = K.flavor(["dec", "dec"]);
      const a = gen1(fa, { min: 1, max: 40, places: 1 }), b = gen1(fb, { min: 0.2, max: 9, places: 1 });
      const right = Math.random() < 0.5, m = Q(10);
      const A2 = qMul(a, m), B2 = qMul(b, m), B3 = qMul(B2, m);
      const lhs = sho(a, fa) + " ÷ " + dsh(b), rhs = right ? dsh(A2) + " ÷ " + dsh(B2) : dsh(A2) + " ÷ " + dsh(B3);
      return { stem: lhs + " = " + rhs + "。", answer: right,
        explain: right ? "被除數和除數同時乘 10,商不變:" + lhs + " = " + dsh(A2) + " ÷ " + dsh(B2) + ",敘述正確。" : "被除數乘了 10,除數卻乘了 100,商會變成原來的 1/10,兩邊不相等,敘述錯誤。",
        trapNote: "易錯:被除數和除數移動小數點(同乘一個數)要「相同位數」才能保持商不變;只移其中一個,商會差 10 倍。" };
    }),
    mk("tf", 4, "basic", function () {
      const c = roundCase(), right = Math.random() < 0.5, v = pad(right ? c.m.r : c.m.trunc, c.p);
      return { stem: stemRound(c) + v + "。", answer: right,
        explain: noteRound(c.q, c.p) + "\n" + (right ? "所以敘述正確。" : "答案應是 " + pad(c.m.r, c.p) + ",不是 " + v + "。") };
    }),
    mk("tf", 5, "extend", function () {
      const fd = K.flavor(["dec", "dec", "int"]), d = gen1(fd, { min: 0.2, max: 9 });
      const fq = K.flavor(["dec", "int"]), q = gen1(fq, { min: 1.2, max: 30 });
      const X = qMul(q, d);
      if (!decOK(X) || qCmp(d, Q(1)) === 0) throw new Error("重抽");
      const right = Math.random() < 0.5, use = right ? X : pick([qMul(X, Q(10)), qDiv(X, Q(10))]);
      if (!decOK(use)) throw new Error("重抽");
      return { stem: "某數除以 " + sho(d, fd) + " 的商是 " + sho(q, fq) + ",所以某數是 " + dsh(use) + "。", answer: right,
        explain: "倒推:某數 = 商 × 除數 = " + sho(q, fq) + " × " + sho(d, fd) + " = " + dsh(X) + (right ? ",敘述正確。" : ",不是 " + dsh(use) + "。") };
    })
  ];

  const HINT = "";
  const fill = [
    mk("fill", 1, "basic", function () {
      const p = pairD(["dec", "dec", "int"], ["int"], { min: 1, max: 30 }, { min: 2, max: 9 }, { bothIntNonInt: true }), a = qa(p.r);
      return { stem: stemEq(p) + " = ____", answer: a.answer, accepted: a.accepted, explain: ex(p) };
    }),
    mk("fill", 2, "basic", function () {
      const p = pairD(["int"], ["dec", "dec", "frac"], { min: 2, max: 60 }, DEC2), a = qa(p.r);
      return { stem: stemEq(p) + " = ____", answer: a.answer, accepted: a.accepted, explain: ex(p) };
    }),
    mk("fill", 3, "basic", function () {
      const p = pairD(["dec", "dec", "int", "frac"], ["dec", "dec", "frac"], { min: 1, max: 60 }, { min: 0.12, max: 2.5 }), a = qa(p.r);
      return { stem: stemEq(p) + " = ____", answer: a.answer, accepted: a.accepted, explain: ex(p) };
    }),
    mk("fill", 4, "trap", function () {
      const c = roundCase(), v = pad(c.m.r, c.p);
      return { stem: stemRound(c) + "____。", answer: K.num(c.m.r / Math.pow(10, c.p)), accepted: [v],
        explain: noteRound(c.q, c.p),
        trapNote: "常見錯誤:只把商「捨去」到要求的位數,得到 " + pad(c.m.trunc, c.p) + "。四捨五入要看下一位:大於等於 5 要進位,答案才是 " + v + "。" };
    }),
    mk("fill", 5, "extend", function () {
      const fb = K.flavor(["dec", "int", "frac"]), b = fb === "int" ? Q(pick([2, 3, 4, 5, 8])) : fb === "frac" ? Q(pick([1, 3]), 4) : Q(pick([2, 4, 5, 6, 8, 12, 25]), pick([10, 10, 100]));
      const fc = K.flavor(["int", "dec"]), c = gen1(fc, { min: 3, max: 20 });
      const m = pick([2, 5, 10]), n = pick([2, 5, 10]);
      const aq = qMul(c, b), ans = qMul(c, Q(m * n));
      if (!decOK(aq) || !decOK(ans)) throw new Error("重抽");
      const a = qa(ans);
      return { stem: "已知 " + dsh(aq) + " ÷ " + sho(b, fb === "frac" ? "frac" : "dec") + " = " + sho(c, fc) + ",則 (" + dsh(aq) + " × " + m + ") ÷ (" + sho(b, fb === "frac" ? "frac" : "dec") + " ÷ " + n + ") = ____",
        answer: a.answer, accepted: a.accepted,
        explain: "被除數乘 " + m + ",商變成 " + m + " 倍;除數除以 " + n + ",商變成 " + n + " 倍。\n所以商 = " + sho(c, fc) + " × " + m + " × " + n + " = " + dsh(ans) + "。" };
    })
  ];

  const calc = [
    mk("calc", 1, "basic", function () {
      const p = pairD(["dec", "dec", "int"], ["int"], { min: 1, max: 40, places: 2 }, { min: 2, max: 9 }, { bothIntNonInt: true }), a = qa(p.r);
      return { stem: "計算:" + stemEq(p), answer: a.answer, accepted: a.accepted, explain: "列式:" + ex(p) };
    }),
    mk("calc", 2, "basic", function () {
      const p = pairD(["int"], ["dec", "dec", "frac"], { min: 3, max: 80 }, { min: 0.2, max: 3 }), a = qa(p.r);
      return { stem: "計算:" + stemEq(p), answer: a.answer, accepted: a.accepted, explain: "列式:" + ex(p) };
    }),
    mk("calc", 3, "basic", function () {
      const p = pairD(["dec", "dec", "dec", "frac"], ["dec", "dec", "dec", "frac"], { min: 1, max: 80 }, { min: 0.12, max: 3 }), a = qa(p.r);
      return { stem: "計算:" + stemEq(p), answer: a.answer, accepted: a.accepted, explain: "列式:" + ex(p) };
    }),
    mk("calc", 4, "trap", function () {
      const w = int(1, 9), s = int(1, 9), q = Q(w * 100 + s, 100), fb = K.flavor(["int", "int", "dec"]);
      const b = fb === "int" ? Q(int(2, 9)) : Q(int(2, 9), 10);
      const aq = qMul(q, b);
      if (!decOK(aq)) throw new Error("重抽");
      const a = qa(q);
      return { stem: "計算:" + dsh(aq) + " ÷ " + dsh(b), answer: a.answer, accepted: a.accepted,
        explain: "列式:" + ex({ a: aq, b: b, r: q, fa: "dec", fb: fb === "int" ? "int" : "dec" }) + "\n商的整數部分 " + w + " 之後,下一位不夠除,要在商的小數點後寫 0,再往下除,得 " + dsh(q) + "。",
        trapNote: "常見錯誤:中間某一位不夠除時,漏寫商的 0,把答案寫成 " + K.num(w + s / 10) + "。商的 0 是佔位用的,不能省。" };
    }),
    mk("calc", 5, "extend", function () {
      const f1 = K.flavor(["dec", "int"]), b1 = f1 === "int" ? Q(pick([2, 3, 4, 5])) : Q(pick([4, 5, 6, 9, 12]), 10), q1 = gen1(pick(["int", "dec"]), { min: 3, max: 12 });
      const b2 = Q(pick([4, 5, 8, 25, 15]), pick([10, 100])), q2 = gen1(pick(["int", "dec"]), { min: 3, max: 12 });
      const a1 = qMul(q1, b1), a2 = qMul(q2, b2), sum = qAdd(q1, q2);
      if (!decOK(a1) || !decOK(a2) || !decOK(sum)) throw new Error("重抽");
      const a = qa(sum);
      return { stem: "計算:" + dsh(a1) + " ÷ " + dsh(b1) + " + " + dsh(a2) + " ÷ " + dsh(b2), answer: a.answer, accepted: a.accepted,
        explain: "分別計算:" + dsh(a1) + " ÷ " + dsh(b1) + " = " + dsh(q1) + ",\n" + dsh(a2) + " ÷ " + dsh(b2) + " = " + dsh(q2) + "。\n相加:" + dsh(q1) + " + " + dsh(q2) + " = " + dsh(sum) + "。" };
    })
  ];

  const word = [
    mk("word", 2, "basic", function () {
      const k = int(3, 8), ft = K.flavor(["dec", "dec", "int"]);
      const price = gen1("dec", { min: 3.5, max: 18 }), total = ft === "int" ? Q(int(20, 120)) : qMul(price, Q(k));
      const pr = qDiv(total, Q(k));
      if (!decOK(pr) || !decOK(total) || pr.d === 1 && ft !== "int") throw new Error("重抽");
      const a = qa(pr);
      return { stem: "小美買了 " + k + " 枝一樣的原子筆,一共付了 " + dsh(total) + " 元。每枝原子筆多少元?", answer: a.answer, accepted: a.accepted, units: ["元"],
        explain: "總價 ÷ 數量 = 單價:" + dsh(total) + " ÷ " + k + " = " + dsh(pr) + "。\n答:每枝 " + dsh(pr) + " 元。" };
    }),
    mk("word", 3, "basic", function () {
      const fd = K.flavor(["dec", "dec", "frac"]), d = fd === "frac" ? Q(pick([1, 3]), 4) : gen1("dec", { min: 0.4, max: 1.5 });
      const c = int(5, 40), N = qMul(d, Q(c));
      if (!decOK(N)) throw new Error("重抽");
      return { stem: "一條緞帶長 " + dsh(N) + " 公尺,每個蝴蝶結要用 " + sho(d, fd === "frac" ? "frac" : "dec") + " 公尺,而且不能有剩。這條緞帶可以做幾個蝴蝶結?", answer: String(c), units: ["個"],
        explain: "緞帶總長 ÷ 每個用量:" + dsh(N) + " ÷ " + sho(d, fd === "frac" ? "frac" : "dec") + " = " + c + "。\n答:" + c + " 個。" };
    }),
    mk("word", 4, "trap", function () {
      const fA = K.flavor(["dec", "int"]), A = gen1(fA, { min: 15, max: 42 }), D = gen1("dec", { min: 1.2, max: 3.5, places: 1 });
      const q = qDiv(A, D), v = Math.ceil(q.n / q.d - 1e-12);
      if (q.d === 1 || v < 5 || v > 30) throw new Error("重抽");
      return { stem: "果汁工廠有 " + sho(A, fA) + " 公升的果汁,要全部裝進瓶子,每個瓶子最多可以裝 " + dsh(D) + " 公升。至少需要幾個瓶子才能全部裝完?", answer: String(v), units: ["個", "瓶"],
        explain: sho(A, fA) + " ÷ " + dsh(D) + " ≈ " + (q.n / q.d).toFixed(2) + "…,商不是整數,最後還剩一點果汁,也需要多一個瓶子。\n所以至少需要 " + v + " 個瓶子(無條件進入)。",
        trapNote: "常見錯誤:用四捨五入或直接捨去,得到 " + Math.floor(q.n / q.d) + " 或 " + Math.round(q.n / q.d) + " 個,會有果汁裝不下。「至少需要幾個才能全部裝完」要用「無條件進入」。" };
    }),
    mk("word", 4, "extend", function () {
      for (let t = 0; t < 300; t++) {
        const fa = K.flavor(["dec", "dec", "int"]), a = gen1(fa, { min: 2.5, max: 40, places: 1 });
        const tm = pick([3, 6, 7, 9, 11]), B = Q(tm), q = qDiv(a, B), m = rnd(q, 1);
        if (m.exact || m.tie) continue;
        return { stem: "小明騎腳踏車," + tm + " 小時騎了 " + sho(a, fa) + " 公里。平均每小時騎幾公里?(四捨五入到小數第一位)", answer: K.num(m.r / 10), accepted: [pad(m.r, 1)], units: ["公里", "公里/小時", "km"],
          explain: "平均每小時 = 距離 ÷ 時間:" + sho(a, fa) + " ÷ " + tm + " = " + (q.n / q.d).toFixed(3) + "…。\n取到小數第一位,看第二位決定進位或捨去,得 " + pad(m.r, 1) + " 公里。" };
      }
      throw new Error("重抽");
    }),
    mk("word", 5, "extend", function () {
      for (let t = 0; t < 400; t++) {
        const N = int(4, 12), fc = K.flavor(["dec", "int"]), c = gen1(fc, { min: 1, max: 9 }), fd = K.flavor(["dec", "int", "dec"]), d = gen1(fd, { min: 0.2, max: 4 });
        const tot = qMul(Q(N), c), r = qDiv(tot, d);
        if (!decOK(tot) || r.d !== 1 || r.n < 3 || r.n > 60 || r.n === N) continue;
        return { stem: "把果汁倒進 " + N + " 個一樣的杯子,每杯倒 " + sho(c, fc) + " 公升,剛好倒完。如果改用每杯容量 " + sho(d, fd) + " 公升的杯子來裝,剛好裝滿,需要幾個杯子?", answer: String(r.n), units: ["個", "杯"],
          explain: "果汁總量 = " + N + " × " + sho(c, fc) + " = " + dsh(tot) + " 公升。\n改用每杯 " + sho(d, fd) + " 公升:" + dsh(tot) + " ÷ " + sho(d, fd) + " = " + r.n + " 個。" };
      }
      throw new Error("重抽");
    })
  ];

  ExamBank.register(T, "decimal-basic", single.concat(multi, tf, fill, calc, word));
})();
