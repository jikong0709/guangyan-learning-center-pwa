/* 題庫：decimal 小數除法、商的概數（四捨五入到指定位）、生活應用（對應舊單元 上3）
   題庫工 A 自編。數字風格：整數／小數／（少量）分數，全部用 kit.Q 精確運算（規格第 11 節）。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, shuffle = K.shuffle;
  const Q = K.Q, qAdd = K.qAdd, qSub = K.qSub, qMul = K.qMul, qDiv = K.qDiv, qCmp = K.qCmp, qFrac = K.qFrac;
  const T = "decimal";
  const cnt = {};
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

  /* ===== 教材式 □ 未知數題（規格第 14 節）===== */
  function dv(lo, hi, FLs, places) { for (let t = 0; t < 50; t++) { const fl = K.flavor(FLs || ["dec", "dec", "int"]); const q = gen1(fl, { min: lo, max: hi, places: places }); if (qCmp(q, Q(1)) !== 0) return { q: q, f: fl }; } throw new Error("重抽"); }
  function shv(o) { return sho(o.q, o.f); }
  function need(q) { if (!decOK(q) || q.n > 200000 || qCmp(q, Q(1)) === 0) throw new Error("重抽"); return q; }

  const boxes = [
    mk("calc", 1, "basic", function () {
      const X = dv(1, 20), b = dv(0.2, 9, ["dec", "int", "int"]), c = need(qMul(X.q, b.q)), a = qa(X.q);
      return { stem: "求 □ 是多少:「□ × " + shv(b) + " = " + dsh(c) + "」", answer: a.answer, accepted: a.accepted,
        explain: "□ × " + shv(b) + " = " + dsh(c) + ",所以 □ = " + dsh(c) + " ÷ " + shv(b) + " = " + dsh(X.q) + "。\n驗算:" + dsh(X.q) + " × " + shv(b) + " = " + dsh(c) + "。" };
    }),
    mk("fill", 2, "basic", function () {
      const c = dv(1, 20), b = dv(0.2, 9, ["dec", "int"]), X = need(qMul(c.q, b.q)), a = qa(X);
      return { stem: "「□ ÷ " + shv(b) + " = " + shv(c) + "」,□ = ____", answer: a.answer, accepted: a.accepted,
        explain: "被除數 = 商 × 除數,所以 □ = " + shv(c) + " × " + shv(b) + " = " + dsh(X) + "。\n驗算:" + dsh(X) + " ÷ " + shv(b) + " = " + shv(c) + "。" };
    }),
    mk("calc", 3, "basic", function () {
      const X = dv(0.2, 9, ["dec", "dec", "int"]), c = dv(1, 20, ["dec", "int"]), a0 = need(qMul(X.q, c.q)), a = qa(X.q);
      return { stem: "求 □ 是多少:「" + dsh(a0) + " ÷ □ = " + shv(c) + "」", answer: a.answer, accepted: a.accepted,
        explain: "除數 = 被除數 ÷ 商,所以 □ = " + dsh(a0) + " ÷ " + shv(c) + " = " + dsh(X.q) + "。\n驗算:" + dsh(a0) + " ÷ " + dsh(X.q) + " = " + shv(c) + "。" };
    }),
    mk("single", 3, "trap", function () {
      const c = dv(1, 20), b = dv(0.2, 0.9, ["dec"]), X = need(qMul(c.q, b.q));
      const wr = [qDiv(c.q, b.q), qDiv(b.q, c.q), qAdd(c.q, b.q), qMul(X, Q(10)), qDiv(X, Q(10))].filter(function (x) { return x.n > 0 && qCmp(x, X) !== 0 && decOK(x); }).map(dsh);
      const r = S(dsh(X), wr);
      r.stem = "「□ ÷ " + shv(b) + " = " + shv(c) + "」,□ 是多少?";
      r.explain = "被除數 = 商 × 除數:□ = " + shv(c) + " × " + shv(b) + " = " + dsh(X) + "。";
      r.trapNote = "常見錯誤:把 □ 移到另一邊時,方向弄反,用 " + shv(c) + " ÷ " + shv(b) + " = " + dsh(qDiv(c.q, b.q)) + "。□ 在被除數的位置,要用「商 × 除數」;並且除以小於 1 的數,商會比被除數大,所以 □ 應該比 " + shv(c) + " 小。";
      return r;
    }),
    mk("fill", 4, "trap", function () {
      const b = dv(0.5, 9, ["dec", "int"]), c = dv(2, 9, ["int", "dec"]), d = dv(1, 9, ["dec", "int"]);
      const X = need(qAdd(qMul(d.q, c.q), b.q)), a = qa(X);
      if (!decOK(qDiv(b.q, c.q))) throw new Error("重抽");
      return { stem: "「(□ - " + shv(b) + ") ÷ " + shv(c) + " = " + shv(d) + "」,□ = ____", answer: a.answer, accepted: a.accepted,
        explain: "括號裡的 □ - " + shv(b) + " 是被除數 = 商 × 除數 = " + shv(d) + " × " + shv(c) + " = " + dsh(qMul(d.q, c.q)) + "。\n□ = " + dsh(qMul(d.q, c.q)) + " + " + shv(b) + " = " + dsh(X) + "。\n驗算:(" + dsh(X) + " - " + shv(b) + ") ÷ " + shv(c) + " = " + shv(d) + "。",
        trapNote: "常見錯誤:還原時順序弄反,先加再乘,或把減 " + shv(b) + " 變成再減一次,得到 " + dsh(qSub(qMul(d.q, c.q), b.q).n > 0 ? qSub(qMul(d.q, c.q), b.q) : Q(1)) + "。要由後往前還原:先乘回除數,再加回減掉的數。" };
    }),
    mk("tf", 2, "trap", function () {
      const X = dv(0.2, 9, ["dec", "int"]), c = dv(0.2, 9, ["dec", "int"]), a0 = need(qMul(X.q, c.q));
      const wrong = qMul(a0, c.q); if (!decOK(wrong) || qCmp(wrong, X.q) === 0) throw new Error("重抽");
      const right = Math.random() < 0.5, v = right ? X.q : wrong;
      return { stem: "「" + dsh(a0) + " ÷ □ = " + shv(c) + "」,所以 □ = " + dsh(v) + "。", answer: right,
        explain: "除數 = 被除數 ÷ 商 = " + dsh(a0) + " ÷ " + shv(c) + " = " + dsh(X.q) + (right ? ",敘述正確。" : ",不是 " + dsh(v) + "(那是把被除數和商相乘)。"),
        trapNote: "易錯:□ 在除數的位置時,要用「被除數 ÷ 商」,不能用乘法。" };
    }),
    mk("single", 5, "extend", function () {
      const X = dv(2, 12, ["dec", "int"]), Y = dv(0.5, 6, ["dec"]);
      if (qCmp(X.q, Y.q) <= 0) throw new Error("重抽");
      const s = need(qAdd(X.q, Y.q)), d = need(qSub(X.q, Y.q));
      const wr = [Y.q, qDiv(d, Q(2)), qDiv(s, Q(2)), d, qAdd(s, d)].filter(function (x) { return x.n > 0 && qCmp(x, X.q) !== 0 && decOK(x); }).map(dsh);
      const r = S(dsh(X.q), wr);
      r.stem = "已知「□ + △ = " + dsh(s) + "」,「□ - △ = " + dsh(d) + "」,□ 是多少?";
      r.explain = "兩式相加,2 個 □ = " + dsh(s) + " + " + dsh(d) + " = " + dsh(qAdd(s, d)) + ",所以 □ = " + dsh(qAdd(s, d)) + " ÷ 2 = " + dsh(X.q) + "。(△ = " + dsh(Y.q) + ")";
      return r;
    }),
    mk("fill", 5, "extend", function () {
      const X = dv(1, 12, ["dec", "int"]), b = dv(0.2, 9, ["dec", "int"]), d = dv(1, 9, ["int", "dec"]);
      const c = need(qDiv(qMul(X.q, b.q), d.q)), a = qa(X.q);
      if (!decOK(qDiv(b.q, d.q))) throw new Error("重抽");
      return { stem: "「□ × " + shv(b) + " ÷ " + shv(d) + " = " + dsh(c) + "」,□ = ____", answer: a.answer, accepted: a.accepted,
        explain: "由後往前還原:先 × " + shv(d) + ":" + dsh(c) + " × " + shv(d) + " = " + dsh(qMul(c, d.q)) + ";再 ÷ " + shv(b) + ":□ = " + dsh(qMul(c, d.q)) + " ÷ " + shv(b) + " = " + dsh(X.q) + "。" };
    }),
    mk("word", 4, "extend", function () {
      const X = dv(1, 9, ["dec", "int"]), price = dv(12, 90, ["dec", "int"]), total = need(qMul(X.q, price.q)), a = qa(X.q);
      return { stem: "葡萄每公斤 " + shv(price) + " 元,小美買了 □ 公斤,一共付了 " + dsh(total) + " 元。可以列成「" + shv(price) + " × □ = " + dsh(total) + "」,□ 是多少公斤?", answer: a.answer, accepted: a.accepted, units: ["公斤"],
        explain: "單價 × 重量 = 總價,所以 □ = " + dsh(total) + " ÷ " + shv(price) + " = " + dsh(X.q) + " 公斤。\n驗算:" + shv(price) + " × " + dsh(X.q) + " = " + dsh(total) + "。" };
    })
  ];

  /* ===== 解法二（規格第 16 節）：與解法一不同的思路，用這一題實際的數字動態產生 ===== */
  const NUMRE_SRC = "\\d+ \\d+/\\d+|\\d+/\\d+|\\d+\\.\\d+%?|\\d+%?";
  function pq(t) {
    t = String(t).trim(); let m;
    if ((m = t.match(/^(\d+) (\d+)\/(\d+)$/))) return Q(Number(m[1]) * Number(m[3]) + Number(m[2]), Number(m[3]));
    if ((m = t.match(/^(\d+)\/(\d+)$/))) return Q(Number(m[1]), Number(m[2]));
    if ((m = t.match(/^(\d+)\.(\d+)(%?)$/))) { const base = Q(Number(m[1] + m[2]), Math.pow(10, m[2].length)); return m[3] ? qMul(base, Q(1, 100)) : base; }
    if ((m = t.match(/^(\d+)(%?)$/))) return m[2] ? Q(Number(m[1]), 100) : Q(Number(m[1]));
    throw new Error("重抽");
  }
  function tk(s) { return (String(s).match(new RegExp(NUMRE_SRC, "g")) || []).map(pq); }
  function qeval(str) {
    const re = new RegExp("\\s*(" + NUMRE_SRC + "|[()+\\-×÷])", "g"), toks = []; let m;
    while ((m = re.exec(str))) toks.push(m[1]);
    let i = 0;
    function expr() { let v = term(); while (toks[i] === "+" || toks[i] === "-") { const op = toks[i++], w = term(); v = op === "+" ? qAdd(v, w) : qSub(v, w); } return v; }
    function term() { let v = fac(); while (toks[i] === "×" || toks[i] === "÷") { const op = toks[i++], w = fac(); v = op === "×" ? qMul(v, w) : qDiv(v, w); } return v; }
    function fac() { const t = toks[i++]; if (t === "(") { const v = expr(); i++; return v; } return pq(t); }
    return expr();
  }
  /* 自我核對：解法二算出來的值必須和標準答案一致，否則丟錯（不讓錯的解法二出貨） */
  function numOf(s) { return pq(String(s).replace(/%$/, "").trim()); }
  function ck(q, s) { let a; try { a = numOf(s); } catch (e) { return q; } if (qCmp(q, a) !== 0) throw new Error("explain2 與答案不一致:" + String(s)); return q; }
  function ckTf(r, truth) { if (!!truth !== !!r.answer) throw new Error("explain2 與答案不一致(是非)"); }
  function ckMulti(r, flags) { const want = flags.map(function (f, i) { return f ? i : -1; }).filter(function (i) { return i >= 0; }).join(","); if (r.answer.join(",") !== want) throw new Error("explain2 與答案不一致(複選)"); }
  function ckSingle(r, flags) { if (!flags[r.answer] || flags.filter(Boolean).length !== 1) throw new Error("explain2 與答案不一致(單選)"); }
  function ckEq(a, b) { if (qCmp(a, b) !== 0) throw new Error("explain2 內部算式不一致"); }
  function unitOf(r) { return r.units && r.units[0] ? " " + r.units[0] : ""; }
  function goodsOf(r) { return r.answer.map(function (i) { return r.options[i]; }).join("、"); }
  function verdict(r) { return "所以敘述" + (r.answer ? "正確" : "錯誤") + "。"; }
  function sig1(x) { return Number(Number(x).toPrecision(1)); }
  function placesOf(q) { const t = dsh(q), i = t.indexOf("."); return i < 0 ? 0 : t.length - i - 1; }
  /* 計數單位法：兩個數都換成「幾個 0.1（0.01…）」，單位一樣，就直接比個數 */
  function estAlt(aS, bS, fin) {
    const a = pq(aS), b = pq(bS), k = Math.max(placesOf(a), placesOf(b));
    ck(qDiv(a, b), fin);
    if (k === 0) {
      const aa = a.n, bb = b.n, w = Math.floor(aa / bb), rem = aa - w * bb;
      if (rem === 0) return aa + " ÷ " + bb + " 剛好整除,得 " + w + "。\n答案是 " + fin + "。";
      return "先用整數除:" + aa + " ÷ " + bb + " = " + w + " 餘 " + rem + "。\n餘下的 " + rem + " 再除以 " + bb + ":" + rem + " ÷ " + bb + " = " + dsh(Q(rem, bb)) + "。\n合起來:" + w + " + " + dsh(Q(rem, bb)) + " = " + fin + "。\n答案是 " + fin + "。";
    }
    const u = Q(1, Math.pow(10, k)), A = qMul(a, Q(Math.pow(10, k))), B = qMul(b, Q(Math.pow(10, k)));
    return "用計數單位想:每個計數單位是 " + dsh(u) + "。" + aS + " 是 " + A.n + " 個 " + dsh(u) + ",\n" + bS + " 是 " + B.n + " 個 " + dsh(u) + "。\n單位一樣大,所以相除就是比個數:" + A.n + " ÷ " + B.n + " = " + fin + "。\n答案是 " + fin + "。";
  }
  function exprParts(r) { return r.stem.replace(/^計算:/, "").replace(/ = \?.*$/, "").replace(/ = ____.*$/, "").split(" ÷ "); }
  function lhs(eq, x) { return eq.split(" = ")[0].replace(/□/g, x); }
  function leftTok(eq) { return tk(eq.split(" = ")[0].replace(/□/g, "")); }
  function mulBoxText(eq, ansStr) {
    const b = leftTok(eq)[0], c = eqRight(eq), X = qDiv(c, b); ck(X, ansStr);
    if (b.d === 1) return "□ 的 " + b.n + " 倍是 " + dsh(c) + ",把 " + dsh(c) + " 平分成 " + b.n + " 份,每份就是 □:" + dsh(c) + " ÷ " + b.n + " = " + dsh(X) + "。";
    const k = Math.max(placesOf(b), placesOf(c)), m = Math.pow(10, k), B2 = qMul(b, Q(m)), C2 = qMul(c, Q(m));
    return "等式兩邊同時乘 " + m + ",把小數變成整數:□ × " + dsh(B2) + " = " + dsh(C2) + "。\n□ = " + dsh(C2) + " ÷ " + dsh(B2) + " = " + dsh(X) + "。";
  }
  function boxEq(r) { return r.stem.match(/「([^」]*□[^」]*)」/)[1]; }
  function subst(eq, xs) { return qeval(eq.split(" = ")[0].replace(/□/g, "(" + xs + ")")); }
  function eqRight(eq) { return qeval(eq.split(" = ")[1]); }
  function lineV(line) { const p = line.split(" = "), q = qeval(p[0]), c = qeval(p[1]); return [qCmp(q, c) === 0, q]; }
  function placeOfStem(s) { return /第一位/.test(s) ? 1 : 2; }
  /* 夾擠法：商落在哪兩個 p 位小數之間，離哪一個比較近 */
  function squeeze(q, p) {
    const m = rnd(q, p), den = Math.pow(10, p), lo = Q(m.trunc, den), hi = Q(m.trunc + 1, den), mid = Q(2 * m.trunc + 1, 2 * den), up = qCmp(q, mid) > 0;
    return { text: "商在 " + dsh(lo) + " 和 " + dsh(hi) + " 之間,中點是 " + dsh(mid) + "。商 " + (up ? "大於" : "小於") + " 中點,所以比較靠近 " + (up ? dsh(hi) : dsh(lo)) + "。", val: up ? hi : lo };
  }
  function stmtV(s) {
    let m;
    if (s === "被除數和除數同時乘 10,商不變") return [true, "舉例:6 ÷ 2 = 3,60 ÷ 20 = 3"];
    if (s === "被除數和除數同時乘 10,商也跟著乘 10") return [false, "舉例:6 ÷ 2 = 3,60 ÷ 20 還是 3"];
    if (s === "除法的商一定比被除數小") return [false, "舉反例:6 ÷ 0.5 = 12,比 6 大"];
    if ((m = s.match(/^(.+) ÷ 0\.5 的結果,和 (.+) × 2 相同$/))) { const q1 = qeval(m[1] + " ÷ 0.5"), q2 = qeval(m[2] + " × 2"); return [qCmp(q1, q2) === 0, m[1] + " ÷ 0.5 = " + dsh(q1) + "," + m[2] + " × 2 = " + dsh(q2)]; }
    if ((m = s.match(/^(.+) ÷ 0\.1 的結果,和 (.+) ÷ 10 相同$/))) { const q1 = qeval(m[1] + " ÷ 0.1"), q2 = qeval(m[2] + " ÷ 10"); return [qCmp(q1, q2) === 0, m[1] + " ÷ 0.1 = " + dsh(q1) + "," + m[2] + " ÷ 10 = " + dsh(q2)]; }
    if ((m = s.match(/^(.+) ÷ ([\d.]+) 的商比 (.+) (大|小)$/))) { const q = qeval(m[1] + " ÷ " + m[2]), N = qeval(m[3]), big = qCmp(q, N) > 0; return [(m[4] === "大") === big, m[1] + " ÷ " + m[2] + " = " + dsh(q) + ",比 " + m[3] + (big ? " 大" : " 小")]; }
    if ((m = s.match(/^(\d+\/\d+) 化成小數是 (.+)$/))) { const q = qeval(m[1]); return [qCmp(q, pq(m[2])) === 0, m[1] + " = 分子 ÷ 分母 = " + dsh(q)]; }
    return [null, "?"];
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
    "decimal-single-L1-01": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.options[r.answer]); },
    "decimal-single-L2-02": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.options[r.answer]); },
    "decimal-single-L3-03": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.options[r.answer]); },
    "decimal-single-L4-04": function (r) {
      const N = tk(r.stem)[0];
      ckSingle(r, r.options.map(function (o) { return qCmp(qeval(o), N) > 0; }));
      const ls = r.options.map(function (o, i) { const q = qeval(o); return "第 " + (i + 1) + " 個,結果是 " + dsh(q) + (qCmp(q, N) > 0 ? ",大於 " : ",小於 ") + dsh(N); });
      return "算出每個選項的結果再比大小。" + ls.join(";") + "。比 " + dsh(N) + " 大的是 " + r.options[r.answer] + "。";
    },
    "decimal-single-L5-05": function (r) {
      const t = tk(r.stem), d = t[0], q = t[1], d2 = t[2], k = qDiv(d2, d), q2 = qDiv(q, k);
      ck(q2, r.options[r.answer]);
      return "看除數的變化:除數從 " + dsh(d) + " 變成 " + dsh(d2) + ",變成原來的 " + dsh(k) + " 倍。\n除數變成 " + dsh(k) + " 倍,商就要反過來,除以 " + dsh(k) + ":" + dsh(q) + " ÷ " + dsh(k) + " = " + dsh(q2) + "。\n所以商是 " + r.options[r.answer] + "。";
    },
    "decimal-single-L3-06": function (r) {
      const eq = boxEq(r), b = leftTok(eq)[0], c = eqRight(eq), X = qMul(c, b);
      ckSingle(r, r.options.map(function (o) { return qCmp(subst(eq, o), c) === 0; }));
      return "「□ ÷ " + dsh(b) + " = " + dsh(c) + "」表示:把 □ 每 " + dsh(b) + " 分成一份,剛好分成 " + dsh(c) + " 份。\n所以 □ 就是 " + dsh(c) + " 個 " + dsh(b) + " 合起來:□ = " + dsh(c) + " × " + dsh(b) + " = " + dsh(X) + ",選 " + r.options[r.answer] + "。";
    },
    "decimal-single-L5-07": function (r) {
      const eqs = (r.stem.match(/「[^」]*」/g) || []).map(function (x) { return x.slice(1, -1); });
      const S0 = pq(eqs[0].split(" = ")[1]), D0 = pq(eqs[1].split(" = ")[1]), t = qSub(S0, D0), y = qDiv(t, Q(2)), X = qAdd(y, D0);
      ckSingle(r, r.options.map(function (o) { return qCmp(pq(o), X) === 0; }));
      return "由「□ - △ = " + dsh(D0) + "」知道 □ 比 △ 大 " + dsh(D0) + ",也就是 □ = △ + " + dsh(D0) + "。\n把它放進「□ + △ = " + dsh(S0) + "」:△ + " + dsh(D0) + " + △ = " + dsh(S0) + ",所以 2 個 △ = " + dsh(S0) + " - " + dsh(D0) + " = " + dsh(t) + ",△ = " + dsh(y) + "。\n□ = " + dsh(y) + " + " + dsh(D0) + " = " + dsh(X) + ",所以 □ = " + r.options[r.answer] + "。";
    },
    "decimal-multi-L2-01": function (r) { const flags = [], wh = r.options.map(function (o) { const p = o.split(" = "), prod = qMul(pq(p[1]), tk(p[0].split(" ÷ ")[1])[0]), ok = qCmp(prod, tk(p[0].split(" ÷ ")[0])[0]) === 0; flags.push(ok); return p[1] + " × " + p[0].split(" ÷ ")[1] + " = " + dsh(prod) + (ok ? ",等於被除數" : ",不等於被除數"); }); ckMulti(r, flags); return "用「商 × 除數」驗算每一題:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。"; },
    "decimal-multi-L3-02": function (r) { const R0 = tk(r.stem)[0], flags = [], wh = r.options.map(function (o) { const q = qeval(o); flags.push(qCmp(q, R0) === 0); return "商是 " + dsh(q) + (qCmp(q, R0) === 0 ? ",等於 " + dsh(R0) : ",不等於 " + dsh(R0)); }); ckMulti(r, flags); return "目標是商等於 " + dsh(R0) + ",逐一算算看:\n" + rows(r, flags, wh) + "。\n所以選第 " + pickIdx(r) + " 個。"; },
    "decimal-multi-L3-03": function (r) { const flags = [], wh = r.options.map(function (o) { const v = stmtV(o); if (v[0] === null) throw new Error("explain2 找不到對應的敘述:" + o); flags.push(v[0]); return v[1]; }); ckMulti(r, flags); return "舉例或算算看每一句:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。"; },
    "decimal-multi-L4-04": function (r) { const N = tk(r.stem)[0], flags = [], wh = r.options.map(function (o) { const q = qeval(o); flags.push(qCmp(q, N) > 0); return "商是 " + dsh(q) + (qCmp(q, N) > 0 ? ",比 " + dsh(N) + " 大" : ",比 " + dsh(N) + " 小"); }); ckMulti(r, flags); return "算出每個商,再和 " + dsh(N) + " 比大小:\n" + rows(r, flags, wh) + "。\n所以商比較大的是第 " + pickIdx(r) + " 個。"; },
    "decimal-multi-L5-05": function (r) { const m = r.stem.match(/和 (.+?) ÷ (.+?) 的商相同/), base = qeval(m[1] + " ÷ " + m[2]), flags = [], wh = r.options.map(function (o) { const q = qeval(o); flags.push(qCmp(q, base) === 0); return "商是 " + dsh(q) + (qCmp(q, base) === 0 ? ",和 " + dsh(base) + " 一樣" : ",和 " + dsh(base) + " 不一樣"); }); ckMulti(r, flags); return "先算出題目的商 " + dsh(base) + ",再把每個選項算出來:\n" + rows(r, flags, wh) + "。\n所以選第 " + pickIdx(r) + " 個。"; },
    "decimal-tf-L1-01": function (r) { const p = r.stem.replace(/。$/, "").split(" = "), parts = p[0].split(" ÷ "), prod = qMul(pq(p[1]), pq(parts[1])); ckTf(r, qCmp(prod, pq(parts[0])) === 0); return "用乘法驗算:商 × 除數 = " + p[1] + " × " + parts[1] + " = " + dsh(prod) + (qCmp(prod, pq(parts[0])) === 0 ? ",正好是被除數 " + parts[0] + "。" : ",不是被除數 " + parts[0] + "。") + verdict(r); },
    "decimal-tf-L2-02": function (r) { const m = r.stem.match(/^(.+) ÷ (.+) 的商,一定比 (.+) 小。$/), q = qeval(m[1] + " ÷ " + m[2]); ckTf(r, qCmp(q, qeval(m[3])) < 0); return "舉例算算看:" + m[1] + " ÷ " + m[2] + " = " + dsh(q) + ",比 " + m[3] + (qCmp(q, qeval(m[3])) > 0 ? " 大" : " 小") + "。" + verdict(r); },
    "decimal-tf-L3-03": function (r) { const p = r.stem.replace(/。$/, "").split(" = "), q1 = qeval(p[0]), q2 = qeval(p[1]); ckTf(r, qCmp(q1, q2) === 0); return "兩邊各自算出來:左邊 " + p[0] + " = " + dsh(q1) + ",右邊 " + p[1] + " = " + dsh(q2) + (qCmp(q1, q2) === 0 ? ",兩邊相等。" : ",兩邊不相等。") + verdict(r); },
    "decimal-tf-L4-04": function (r) { const m = r.stem.match(/^(.+?) ÷ (.+?) 的商/), q = qeval(m[1] + " ÷ " + m[2]), p = placeOfStem(r.stem), sq = squeeze(q, p), claim = pq(r.stem.match(/約是 ([\d.]+)。$/)[1]); ckTf(r, qCmp(sq.val, claim) === 0); return "夾擠法:" + sq.text + "\n四捨五入到" + place(p) + "是 " + dsh(sq.val) + (qCmp(sq.val, claim) === 0 ? ",和敘述的 " + dsh(claim) + " 一樣。" : ",不是敘述的 " + dsh(claim) + "。") + verdict(r); },
    "decimal-tf-L5-05": function (r) { const t = tk(r.stem), d = t[0], q = t[1], X = t[2], v = qDiv(X, d); ckTf(r, qCmp(v, q) === 0); return "代入檢查:如果某數是 " + dsh(X) + ",除以 " + dsh(d) + " 得 " + dsh(v) + (qCmp(v, q) === 0 ? ",正好是 " + dsh(q) + "。" : ",不是 " + dsh(q) + "。") + verdict(r); },
    "decimal-tf-L2-06": function (r) {
      const eq = boxEq(r), a = leftTok(eq)[0], c = eqRight(eq), x = r.stem.match(/所以 □ = (.+)。$/)[1], X = qDiv(a, c);
      ckTf(r, qCmp(X, pq(x)) === 0);
      return "「" + dsh(a) + " ÷ □ = " + dsh(c) + "」表示:" + dsh(a) + " 平分成 " + dsh(c) + " 份,每份是 □,所以 □ = " + dsh(a) + " ÷ " + dsh(c) + " = " + dsh(X) + "。\n敘述寫的是 " + x + (qCmp(X, pq(x)) === 0 ? ",和算出來的一樣。" : ",和算出來的不一樣。") + verdict(r);
    },
    "decimal-fill-L1-01": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.answer); },
    "decimal-fill-L2-02": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.answer); },
    "decimal-fill-L3-03": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.answer); },
    "decimal-fill-L4-04": function (r) { const m = r.stem.match(/^(.+?) ÷ (.+?) 的商/), q = qeval(m[1] + " ÷ " + m[2]), p = placeOfStem(r.stem), sq = squeeze(q, p); ck(sq.val, r.answer); return "夾擠法:" + sq.text + "\n四捨五入到" + place(p) + "是 " + r.answer + "。"; },
    "decimal-fill-L5-05": function (r) { const m = r.stem.match(/則 (.+) = ____/); const e = m[1], val = qeval(e); ck(val, r.answer); const mm = e.match(/^\((.+?) × (\d+)\) ÷ \((.+?) ÷ (\d+)\)$/); return "直接算:先算括號,被除數 " + mm[1] + " × " + mm[2] + " = " + dsh(qMul(pq(mm[1]), pq(mm[2]))) + ",除數 " + mm[3] + " ÷ " + mm[4] + " = " + dsh(qDiv(pq(mm[3]), pq(mm[4]))) + "。\n再相除:" + dsh(qMul(pq(mm[1]), pq(mm[2]))) + " ÷ " + dsh(qDiv(pq(mm[3]), pq(mm[4]))) + " = " + dsh(val) + "。答案是 " + r.answer + "。"; },
    "decimal-fill-L2-06": function (r) {
      const eq = boxEq(r), b = leftTok(eq)[0], c = eqRight(eq), X = qMul(c, b); ck(X, r.answer);
      return "「□ ÷ " + dsh(b) + " = " + dsh(c) + "」表示:把 □ 每 " + dsh(b) + " 分成一份,剛好分成 " + dsh(c) + " 份。\n所以 □ 就是 " + dsh(c) + " 個 " + dsh(b) + " 合起來:□ = " + dsh(c) + " × " + dsh(b) + " = " + r.answer + "。";
    },
    "decimal-fill-L4-07": function (r) {
      const eq = boxEq(r), lt = leftTok(eq), b = lt[0], c = lt[1], d = eqRight(eq), bc = qDiv(b, c), u = qAdd(d, bc), X = qMul(u, c); ck(X, r.answer);
      return "用分配律拆開:(□ 減 " + dsh(b) + ") ÷ " + dsh(c) + " = □ ÷ " + dsh(c) + " 減 " + dsh(b) + " ÷ " + dsh(c) + "。\n" + dsh(b) + " ÷ " + dsh(c) + " = " + dsh(bc) + ",所以「□ ÷ " + dsh(c) + " 減 " + dsh(bc) + "」是 " + dsh(d) + ",□ ÷ " + dsh(c) + " 就是 " + dsh(d) + " 加 " + dsh(bc) + " = " + dsh(u) + "。\n□ = " + dsh(u) + " × " + dsh(c) + " = " + r.answer + "。";
    },
    "decimal-fill-L5-08": function (r) {
      const eq = boxEq(r), lt = leftTok(eq), b = lt[0], d = lt[1], c = eqRight(eq), k = qDiv(b, d), X = qDiv(c, k); ck(X, r.answer);
      return "先乘又除,可以合在一起:□ × " + dsh(b) + " ÷ " + dsh(d) + " = □ × (" + dsh(b) + " ÷ " + dsh(d) + ")。\n" + dsh(b) + " ÷ " + dsh(d) + " = " + dsh(k) + ",所以 □ × " + dsh(k) + " = " + dsh(c) + "。\n□ = " + dsh(c) + " ÷ " + dsh(k) + " = " + r.answer + "。";
    },
    "decimal-calc-L1-01": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.answer); },
    "decimal-calc-L2-02": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.answer); },
    "decimal-calc-L3-03": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.answer); },
    "decimal-calc-L4-04": function (r) { const p = exprParts(r); return estAlt(p[0], p[1], r.answer); },
    "decimal-calc-L5-05": function (r) {
      const e = r.stem.replace(/^計算:/, ""), m = e.match(/^(.+?) ÷ (.+?) \+ (.+?) ÷ (.+)$/), q1 = qDiv(pq(m[1]), pq(m[2])), q2 = qDiv(pq(m[3]), pq(m[4]));
      ck(qAdd(q1, q2), r.answer);
      return "找一個數乘 " + m[2] + " 得 " + m[1] + ":○ = " + dsh(q1) + "(" + dsh(q1) + " × " + m[2] + " = " + m[1] + ")。\n找一個數乘 " + m[4] + " 得 " + m[3] + ":△ = " + dsh(q2) + "(" + dsh(q2) + " × " + m[4] + " = " + m[3] + ")。\n○ + △ = " + dsh(q1) + " + " + dsh(q2) + " = " + r.answer + "。";
    },
    "decimal-calc-L1-06": function (r) { return mulBoxText(boxEq(r), r.answer) + "\n所以 □ = " + r.answer + "。"; },
    "decimal-calc-L3-07": function (r) {
      const eq = boxEq(r), a = leftTok(eq)[0], c = eqRight(eq), X = qDiv(a, c); ck(X, r.answer);
      return "「" + dsh(a) + " ÷ □ = " + dsh(c) + "」表示:" + dsh(a) + " 平分成 " + dsh(c) + " 份,每一份就是 □。\n□ = " + dsh(a) + " ÷ " + dsh(c) + " = " + r.answer + "。";
    },
    "decimal-word-L2-01": function (r) { const t = r.stem.match(/一共付了 (.+?) 元/)[1], k = r.stem.match(/買了 (\d+) 枝/)[1]; return estAlt(t, k, r.answer).replace("答案是 " + r.answer + "。", "每枝 " + r.answer + unitOf(r) + "。"); },
    "decimal-word-L3-02": function (r) { const t = tk(r.stem), N = t[0], d = t[1], c = Number(r.answer), prod = qMul(Q(c), d); ckEq(prod, N); return "用乘法想:每個蝴蝶結 " + dsh(d) + " 公尺,做 " + c + " 個要 " + c + " × " + dsh(d) + " = " + dsh(prod) + " 公尺,正好是全長 " + dsh(N) + " 公尺。\n所以可以做 " + r.answer + unitOf(r) + "。"; },
    "decimal-word-L4-03": function (r) { const t = tk(r.stem), A = t[0], D = t[1], v = Number(r.answer); if (!(qCmp(qMul(D, Q(v - 1)), A) < 0 && qCmp(qMul(D, Q(v)), A) >= 0)) throw new Error("explain2 與答案不一致"); return "列出整數倍:" + dsh(D) + " × " + (v - 1) + " = " + dsh(qMul(D, Q(v - 1))) + "(還沒裝完 " + dsh(A) + "),\n" + dsh(D) + " × " + v + " = " + dsh(qMul(D, Q(v))) + "(夠裝了)。\n所以至少需要 " + r.answer + unitOf(r) + "。"; },
    "decimal-word-L4-04": function (r) { const t = tk(r.stem), tm = t[0], A = t[1], q = qDiv(A, tm), sq = squeeze(q, 1); ck(sq.val, r.answer); return "夾擠法:平均每小時 " + dsh(A) + " ÷ " + dsh(tm) + " 公里。" + sq.text + "\n四捨五入到小數第一位是 " + r.answer + unitOf(r) + "。"; },
    "decimal-word-L5-05": function (r) { const t = tk(r.stem), N = t[0], c = t[1], d = t[2], f = qDiv(c, d); ck(qMul(N, f), r.answer); return "看杯子大小的變化:每杯從 " + dsh(c) + " 公升變成 " + dsh(d) + " 公升,是原來的 " + dsh(qDiv(d, c)) + " 倍,同樣的果汁需要的杯子數是原來的 " + dsh(f) + " 倍。\n" + dsh(N) + " × " + dsh(f) + " = " + r.answer + unitOf(r) + "。"; },
    "decimal-word-L4-06": function (r) {
      const t = tk(r.stem), price = t[0], total = t[1], w = Math.floor(total.n / total.d / (price.n / price.d)), X0 = qMul(price, Q(w)), rest = qSub(total, X0), part = qDiv(rest, price), ans = qAdd(Q(w), part);
      ck(ans, r.answer);
      return "把總價拆開:先買 " + w + " 公斤,要 " + dsh(price) + " × " + w + " = " + dsh(X0) + " 元。\n" + dsh(total) + " - " + dsh(X0) + " = " + dsh(rest) + " 元" + (rest.n === 0 ? ",正好買完。" : ",還能買 " + dsh(rest) + " ÷ " + dsh(price) + " = " + dsh(part) + " 公斤。") + "\n" + (rest.n === 0 ? "所以買了 " : "合起來 " + w + " + " + dsh(part) + " = ") + r.answer + unitOf(r) + "。";
    }
  };


  /* PRE（解法一的方法說明） */
PRE["decimal-calc-L5-05"] = function () { return "方法:除數化成整數,被除數的小數點同步右移相同的位數,再用整數除法。\n"; };
PRE["decimal-calc-L1-06"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["decimal-fill-L2-06"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["decimal-calc-L3-07"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["decimal-single-L5-07"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["decimal-single-L5-05"] = function () { return "想法:被除數沒有變,只有除數變了,所以要先把被除數求出來。\n"; };
PRE["decimal-word-L2-01"] = function () { return "想法:總價平分給每一枝,用除法就能求出單價。\n"; };
PRE["decimal-single-L3-06"] = function () { return "想法:□ 在被除數的位置,被除數 = 商 × 除數。\n"; };
PRE["decimal-tf-L2-06"] = function () { return "想法:□ 在除數的位置,除數 = 被除數 ÷ 商。\n"; };
PRE["decimal-word-L4-06"] = function () { return "想法:單價 × 重量 = 總價,所以重量 = 總價 ÷ 單價。\n"; };
PRE["decimal-tf-L2-02"] = function () { return "想法:先算出商,再和被除數比大小。" + String.fromCharCode(10); };
PRE["decimal-tf-L5-05"] = function () { return "想法:除法的逆運算是乘法,乘回去就能還原被除數。" + String.fromCharCode(10); };
PRE["decimal-multi-L3-03"] = function () { return "想法:每一句都用算式或例子檢查看看。" + String.fromCharCode(10); };
PRE["decimal-multi-L2-01"] = function () { return "想法:除法算得對不對,用商乘回除數就能知道。" + String.fromCharCode(10); };
PRE["decimal-fill-L5-08"] = function () { return "想法:先乘再除的算式,可以倒著一步一步還原,最後得到 □。" + String.fromCharCode(10); };
  ExamBank.register(T, "decimal-basic", single.concat(multi, tf, fill, calc, word, boxes));
})();
