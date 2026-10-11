/* 題庫：fraction-div 分數除以整數、整數除以分數、分數除分數、分數除法應用（對應舊單元 上2）
   題庫工 A 自編。數字風格：分數／帶分數／小數／整數混合，全部用 kit.Q 精確運算（規格第 11 節）。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, shuffle = K.shuffle, gcd = K.gcd;
  const Q = K.Q, qAdd = K.qAdd, qSub = K.qSub, qMul = K.qMul, qDiv = K.qDiv, qCmp = K.qCmp;
  /* 學生看得到的分數，分母不得超過 60，否則重抽 */
  function qFrac(q) { if (q.d > 60) throw new Error("重抽"); return K.qFrac(q); }
  const T = "fraction-div";
  const cnt = {};
  /* 偶發的選項撞名（干擾項與正解相同）時自動重抽，最多 30 次 */
  /* 學生看得到的字串：分母不得超過 60、不得有 9 位以上數字，否則重抽（accepted 內的則直接剔除） */
  function badStr(x) {
    x = String(x);
    let m; const re = /(\d+)\/(\d+)/g;
    while ((m = re.exec(x))) if (Number(m[2]) > 60) return true;
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
  /* 顯示：dec 遇無限小數時退回帶分數 */
  function decOK(q) { if (!K.qIsTerminating(q)) return false; const s = K.qDec(q); return s !== null && Math.abs(Number(s) - q.n / q.d) < 1e-12; }
  /* 答案包裝：K.qAnswer 的小數寫法若被四捨五入到 4 位（不精確）就剔除，避免把錯的小數當等價答案 */
  function qa(q, fl) { const o = K.qAnswer(q, fl); const v = q.n / q.d; o.accepted = o.accepted.filter(function (x) { return !/^d+.d+$/.test(x) || Math.abs(Number(x) - v) < 1e-12; }); return o; }
  function sh(q, fl) { if (q.d > 60 && !(fl === "dec" && decOK(q))) throw new Error("重抽"); return fl === "dec" ? (decOK(q) ? K.qDec(q) : K.qMixed(q)) : fl === "mixed" ? K.qMixed(q) : qFrac(q); }
  function inv(q) { return Q(q.d, q.n); }
  function ansFl(a, b) { return (a === "dec" || b === "dec") ? "dec" : (a === "mixed" || b === "mixed") ? "mixed" : "frac"; }
  function term(q) { return K.qIsTerminating(q); }
  function small(q) { return q.n <= 150 && q.d <= 60; }
  const F3 = ["frac", "mixed", "dec", "dec", "dec"];
  const OA = { min: 1, max: 4 };
  /* 產生除法一組：被除數 a、除數 b、商 r（皆正有理數，商乾淨） */
  function pair(FA, FB, oa, ob) {
    for (let t = 0; t < 400; t++) {
      const fa = K.flavor(FA), fb = K.flavor(FB);
      const a = K.randQ(fa, oa || OA), b = K.randQ(fb, ob || { min: 0.2, max: 3 });
      if (qCmp(a, b) === 0) continue;
      const r = qDiv(a, b), fr = ansFl(fa, fb);
      if (fr === "dec" && !decOK(r)) continue;
      if (!small(r)) continue;
      return { a: a, b: b, r: r, fa: fa, fb: fb, fr: fr };
    }
    throw new Error("重抽");
  }
  function ex(p) {
    return sh(p.a, p.fa) + " ÷ " + sh(p.b, p.fb) + "\n= " + qFrac(p.a) + " ÷ " + qFrac(p.b) + "\n= " + qFrac(p.a) + " × " + qFrac(inv(p.b)) + "\n= " + sh(p.r, p.fr) + "。";
  }
  function wrongList(p) {
    const a = p.a, b = p.b, r = p.r;
    const c = [qMul(a, b), qDiv(b, a), qMul(r, b), qDiv(r, b), qMul(r, Q(10)), qDiv(r, Q(10)), qAdd(r, Q(1)), qDiv(a, qAdd(b, Q(1))), qMul(r, Q(2)), qDiv(r, Q(2))];
    return c.filter(function (x) { return x.n > 0 && qCmp(x, r) !== 0 && (p.fr !== "dec" || decOK(x)) && small(x); }).map(function (x) { return sh(x, p.fr); });
  }
  function stemEq(p) { return sh(p.a, p.fa) + " ÷ " + sh(p.b, p.fb); }
  function ansObj(p) { const o = qa(p.r, p.fr); return { answer: o.answer, accepted: o.accepted }; }
  const HINT = "(請以最簡分數、帶分數或小數作答)";

  const single = [
    mk("single", 1, "basic", function () {
      const p = pair(F3, ["int"], null, { min: 2, max: 6 });
      const r = S(sh(p.r, p.fr), wrongList(p));
      r.stem = stemEq(p) + " = ?";
      r.explain = "除以整數,等於乘以它的倒數(分數除以整數:分母乘以整數)。\n" + ex(p);
      return r;
    }),
    mk("single", 2, "basic", function () {
      const p = pair(["int"], F3, { min: 2, max: 12 }, { min: 0.2, max: 3 });
      const r = S(sh(p.r, p.fr), wrongList(p));
      r.stem = stemEq(p) + " = ?";
      r.explain = "整數除以分數(或小數),等於乘以它的倒數。\n" + ex(p);
      return r;
    }),
    mk("single", 3, "trap", function () {
      const p = pair(F3, F3);
      const r = S(sh(p.r, p.fr), wrongList(p));
      r.stem = stemEq(p) + " = ?";
      r.explain = "除以一個數,等於乘以它的倒數(只翻「除數」;小數先化成分數):\n" + ex(p);
      r.trapNote = "常見錯誤:忘了把除數翻成倒數,直接相乘,得到 " + sh(qMul(p.a, p.b), p.fr) + ";或是翻錯數(翻了被除數),得到 " + sh(qDiv(p.b, p.a), p.fr) + "。小數、帶分數要先化成分數再做。";
      return r;
    }),
    mk("single", 4, "trap", function () {
      const fN = K.flavor(["int", "dec", "frac", "mixed"]);
      const N = K.randQ(fN, { min: 2, max: 12 });
      const fd = K.flavor(["frac", "dec"]);
      const d = K.randQ(fd, { min: 0.2, max: 0.9 });
      const bigger = qDiv(N, d);
      if (fd === "dec" && !decOK(bigger)) throw new Error("重抽");
      const sN = sh(N, fN), sd = sh(d, fd);
      const correct = sN + " ÷ " + sd;
      const cands = [
        sN + " ÷ " + sh(K.randQ(K.flavor(["mixed", "dec"]), { min: 1.2, max: 3 }), pick(["mixed", "dec"])),
        sN + " ÷ " + int(2, 5),
        sN + " × " + sd,
        sN + " ÷ " + sh(Q(int(2, 4) * 2 + 1, 2), pick(["mixed", "dec"])),
        sN + " × " + sh(K.randQ(pick(["frac", "dec"]), { min: 0.2, max: 0.9 }), pick(["frac", "dec"]))
      ];
      const r = S(correct, cands);
      r.stem = "下列哪一個算式的結果,會比 " + sN + " 大?";
      r.explain = "除以小於 1 的數,商會變大:" + correct + " = " + sh(bigger, ansFl(fN, fd)) + ",比 " + sN + " 大。\n其他選項是除以大於 1 的數,或乘以小於 1 的數,結果都比 " + sN + " 小。";
      r.trapNote = "常見錯誤:以為「除法的結果一定比較小」。除以真分數(小於 1 的數)時,商反而變大;除以大於 1 的數才變小。";
      return r;
    }),
    mk("single", 5, "extend", function () {
      const fb = K.flavor(["frac", "dec", "mixed"]), fc = K.flavor(["frac", "dec", "int", "mixed"]);
      const B = K.randQ(fb, { min: 0.2, max: 3 }), C = K.randQ(fc, { min: 1, max: 4 });
      const X = qMul(C, B), fx = ansFl(fb, fc);
      if (fx === "dec" && !decOK(X)) throw new Error("重抽");
      if (!small(X)) throw new Error("重抽");
      const wr = [qDiv(C, B), qAdd(C, B), qMul(X, Q(10)), qDiv(X, Q(10)), qDiv(X, B), qMul(X, B)].filter(function (x) { return x.n > 0 && qCmp(x, X) !== 0 && (fx !== "dec" || decOK(x)); }).map(function (x) { return sh(x, fx); });
      const r = S(sh(X, fx), wr);
      r.stem = "某數除以 " + sh(B, fb) + " 之後得到 " + sh(C, fc) + ",請問某數是多少?";
      r.explain = "倒推:商 × 除數 = 被除數。\n某數 = " + sh(C, fc) + " × " + sh(B, fb) + " = " + qFrac(C) + " × " + qFrac(B) + " = " + sh(X, fx) + "。";
      return r;
    })
  ];

  function eqLine(ok) {
    const kind = pick([0, 1, 2]);
    const p = kind === 0 ? pair(F3, ["int"], null, { min: 2, max: 6 }) : kind === 1 ? pair(["int"], F3, { min: 2, max: 12 }, { min: 0.2, max: 3 }) : pair(F3, F3);
    const w = wrongList(p);
    return stemEq(p) + " = " + (ok ? sh(p.r, p.fr) : pick(w));
  }
  function showT(q, fl) { return sh(q, fl); }

  const multi = [
    mk("multi", 2, "basic", function () {
      const ng = int(2, 3), used = {}, goods = [], bads = [];
      let guard = 0;
      while (goods.length < ng && guard++ < 100) { const x = eqLine(true); if (!used[x]) { used[x] = 1; goods.push(x); } }
      while (bads.length < 5 - ng && guard++ < 200) { const x = eqLine(false); if (!used[x]) { used[x] = 1; bads.push(x); } }
      return M("下列算式,哪些是正確的?選出所有正確的。", goods, bads, "逐題檢查:除以一個數(小數先化成分數),等於乘以它的倒數,再用乘法驗算。\n正確的算式是:" + goods.join(";") + "。其餘的商算錯了。");
    }),
    mk("multi", 3, "basic", function () {
      const fR = K.flavor(["frac", "dec", "mixed", "int"]);
      const R = K.randQ(fR, { min: 1, max: 4 });
      const Ds = [];
      let guard = 0;
      while (Ds.length < 5 && guard++ < 200) {
        const fd = K.flavor(["frac", "dec", "mixed", "int"]);
        const D = K.randQ(fd, { min: 0.2, max: 4 });
        if (qCmp(D, Q(1)) === 0 || Ds.some(function (e) { return qCmp(e.D, D) === 0; })) continue;
        Ds.push({ D: D, fd: fd });
      }
      if (Ds.length < 5) throw new Error("重抽");
      const ng = int(2, 3), goods = [], bads = [];
      Ds.forEach(function (e, i) {
        const fx = ansFl(fR, e.fd);
        if (i < ng) { const x = qMul(R, e.D); if (fx === "dec" && !decOK(x)) throw new Error("重抽"); goods.push(showT(x, fx) + " ÷ " + sh(e.D, e.fd)); }
        else { const x = qDiv(R, e.D); if (fx === "dec" && !decOK(x)) throw new Error("重抽"); bads.push(showT(x, fx) + " ÷ " + sh(e.D, e.fd)); }
      });
      return M("下列哪些算式的商等於 " + sh(R, fR) + "?選出所有正確的。", goods, bads,
        "商 = " + sh(R, fR) + ",被除數應該等於 商 × 除數。\n逐一檢查:" + goods.join("、") + " 的商都是 " + sh(R, fR) + ";其餘選項的被除數算錯了(用了除而不是乘),商不等於 " + sh(R, fR) + "。");
    }),
    mk("multi", 3, "trap", function () {
      const fN = K.flavor(["int", "dec", "frac", "mixed"]);
      const N = K.randQ(fN, { min: 2, max: 12 });
      const fd = K.flavor(["frac", "dec"]), d = K.randQ(fd, { min: 0.2, max: 0.9 });
      const fx = K.flavor(["mixed", "dec"]), x = K.randQ(fx, { min: 1.2, max: 3 });
      const fa = K.flavor(["frac", "dec", "mixed"]), A = K.randQ(fa, { min: 1, max: 4 });
      const k = int(2, 5);
      const Ak = qDiv(A, Q(k)), fk = ansFl(fa, "frac");
      if (fk === "dec" && !decOK(Ak)) throw new Error("重抽");
      const sN = sh(N, fN);
      const trues = [
        sN + " ÷ " + sh(d, fd) + " 的商比 " + sN + " 大",
        "任何正數,除以大於 1 的數,商都會比原來的數小",
        sh(A, fa) + " ÷ " + k + " 的商是 " + sh(Ak, fk),
        sN + " ÷ " + sh(d, fd) + " 與 " + sN + " × " + qFrac(inv(d)) + " 的結果相同"
      ];
      const falses = [
        "除法的商一定比被除數小",
        sN + " ÷ " + sh(d, fd) + " 的商比 " + sN + " 小",
        sh(A, fa) + " ÷ " + k + " 的商是 " + sh(qMul(A, Q(k)), fa === "dec" ? "dec" : fa),
        sN + " ÷ " + sh(x, fx) + " 的商比 " + sN + " 大"
      ];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "除以大於 1 的數商變小;除以小於 1 的數(真分數、小於 1 的小數)商變大。除以一個數等於乘以它的倒數;除以整數 k,是把原數平分成 k 份。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:認為除法的商一定比被除數小(除以小於 1 的數時商變大);整數除以分數時忘了翻倒數;把「÷ k」做成「× k」。");
    }),
    mk("multi", 4, "trap", function () {
      const fN = K.flavor(["int", "dec", "frac", "mixed"]);
      const N = K.randQ(fN, { min: 1, max: 6 });
      const sN = sh(N, fN);
      const small1 = [], big1 = [];
      let guard = 0;
      while ((small1.length < 3 || big1.length < 3) && guard++ < 200) {
        const f1 = K.flavor(["frac", "dec"]);
        const d1 = K.randQ(f1, { min: 0.2, max: 0.9 });
        const s1 = sN + " ÷ " + sh(d1, f1);
        if (small1.length < 3 && !small1.includes(s1)) small1.push(s1);
        const f2 = K.flavor(["mixed", "dec", "int"]);
        const d2 = K.randQ(f2, { min: 1.2, max: 4 });
        const s2 = sN + " ÷ " + sh(d2, f2);
        if (big1.length < 3 && qCmp(d2, Q(1)) > 0 && !big1.includes(s2)) big1.push(s2);
      }
      const goods = small1.slice(0, int(2, 3)), bads = big1.slice(0, 2);
      return M("下列哪些算式的商,比 " + sN + " 大?選出所有正確的。", goods, bads,
        "除以小於 1 的數,商會變大:" + goods.join("、") + "。\n其他是除以大於 1 的數,商比 " + sN + " 小。",
        "常見錯誤:一看到「÷」就以為商會變小。除數小於 1 時,商比被除數大;除數大於 1 時,商才比被除數小。");
    }),
    mk("multi", 5, "extend", function () {
      const fa = K.flavor(["frac", "dec", "mixed"]);
      const A = K.randQ(fa, { min: 1, max: 6 });
      let k, m; do { k = int(2, 5); m = int(2, 5); } while (k === m || k + m === k * m);
      const n = k * m, sA = sh(A, fa);
      const res = qDiv(A, Q(n)), fr = fa;
      if (fr === "dec" && !decOK(res)) throw new Error("重抽");
      const goods = [sA + " ÷ " + k + " ÷ " + m, sA + " ÷ (" + k + "×" + m + ")", sA + " × " + qFrac(Q(1, n))];
      const wrongs = [sA + " ÷ " + k + " × " + m, sA + " ÷ (" + k + "+" + m + ")", sA + " × " + k + " ÷ " + m, sA + " ÷ " + k];
      const gs = shuffle(goods).slice(0, int(2, 3)), bs = shuffle(wrongs).slice(0, 2);
      return M("下列哪些算式的結果,等於 " + sA + " ÷ " + n + "?選出所有正確的。", gs, bs,
        sA + " ÷ " + n + " = " + sh(res, fr) + "。連除兩個數,等於除以它們的乘積;除以 " + n + " 也等於乘以 " + qFrac(Q(1, n)) + "。\n" +
        "「÷" + k + " × " + m + "」是除了又乘回去,「÷(" + k + "+" + m + ")」是加不是乘,結果都不是 " + sh(res, fr) + "。");
    })
  ];

  const tf = [
    mk("tf", 1, "basic", function () {
      const right = Math.random() < 0.5, line = eqLine(right);
      const rhs = line.split(" = ")[1];
      return { stem: line + "。", answer: right, explain: "除以一個數等於乘以它的倒數,用乘法驗算商。" + (right ? "這個商是對的,敘述正確。" : "正確的商不是 " + rhs + ",敘述錯誤。") };
    }),
    mk("tf", 2, "trap", function () {
      const fN = K.flavor(["int", "dec", "frac", "mixed"]);
      const N = K.randQ(fN, { min: 2, max: 12 });
      const big = Math.random() < 0.5;
      const fd = K.flavor(big ? ["mixed", "dec"] : ["frac", "dec"]);
      const d = K.randQ(fd, big ? { min: 1.2, max: 3 } : { min: 0.2, max: 0.9 });
      const smaller = qCmp(d, Q(1)) > 0;
      const sN = sh(N, fN);
      return { stem: sN + " ÷ " + sh(d, fd) + " 的商,一定比 " + sN + " 小。", answer: smaller,
        explain: sN + " ÷ " + sh(d, fd) + " = " + sN + " × " + qFrac(inv(d)) + (smaller ? ",除數大於 1,商比 " + sN + " 小,敘述正確。" : ",除數小於 1,商比 " + sN + " 大,敘述錯誤。"),
        trapNote: "易錯觀念:以為除法的商一定比被除數小。只有除以大於 1 的數,商才會變小;除以小於 1 的數,商會變大。" };
    }),
    mk("tf", 3, "trap", function () {
      const fa = K.flavor(F3), A = K.randQ(fa, { min: 1, max: 4 }), k = int(2, 6), sA = sh(A, fa);
      const pool = [
        { s: sA + " ÷ " + k + " = " + sA + " × " + qFrac(Q(1, k)), a: true, w: "除以 " + k + " 等於乘以 1/" + k + ",正確。" },
        { s: sA + " ÷ " + k + " = " + sA + " × " + k, a: false, w: "除以 " + k + " 是乘以 1/" + k + ",不是乘以 " + k + "。" },
        { s: k + " ÷ " + sA + " = " + k + " × " + qFrac(inv(A)), a: true, w: "除以 " + sA + " 等於乘以它的倒數 " + qFrac(inv(A)) + ",正確。" },
        { s: k + " ÷ " + sA + " = " + k + " × " + qFrac(A), a: false, w: "漏了翻倒數,正確是 " + k + " × " + qFrac(inv(A)) + "。" },
        { s: sA + " ÷ " + qFrac(Q(1, k)) + " = " + sA + " × " + k, a: true, w: "除以 1/" + k + " 等於乘以 " + k + ",正確。" },
        { s: sA + " ÷ " + qFrac(Q(1, k)) + " = " + sA + " ÷ " + k, a: false, w: "除以 1/" + k + " 等於乘以 " + k + ",不是除以 " + k + "。" }
      ];
      const x = pick(pool);
      return { stem: x.s + "。", answer: x.a, explain: x.w, trapNote: "易錯:除以 k 是乘以 1/k;除以分數(或小數)要乘以它的倒數;除以 1/k 等於乘以 k。小數先化成分數再翻倒數。" };
    }),
    mk("tf", 4, "basic", function () {
      const right = Math.random() < 0.5, p = pair(F3, F3);
      const w = wrongList(p);
      const res = right ? sh(p.r, p.fr) : pick(w);
      return { stem: stemEq(p) + " = " + res + "。", answer: right,
        explain: ex(p) + (right ? "\n敘述正確。" : "\n商是 " + sh(p.r, p.fr) + ",不是 " + res + "。") };
    }),
    mk("tf", 5, "extend", function () {
      const fb = K.flavor(["frac", "dec", "mixed"]), fc = K.flavor(["frac", "dec", "int", "mixed"]);
      const B = K.randQ(fb, { min: 0.2, max: 3 }), C = K.randQ(fc, { min: 1, max: 4 });
      const truth = qDiv(C, B), fx = ansFl(fb, fc);
      if (fx === "dec" && !decOK(truth)) throw new Error("重抽");
      const wrongs = [qMul(C, B), qDiv(B, C)].filter(function (x) { return qCmp(x, truth) !== 0 && (fx !== "dec" || decOK(x)); });
      if (!wrongs.length) throw new Error("重抽");
      const right = Math.random() < 0.5, X = right ? truth : pick(wrongs);
      return { stem: "某數乘以 " + sh(B, fb) + " 之後得到 " + sh(C, fc) + ",所以某數是 " + sh(X, fx) + "。", answer: right,
        explain: "倒推:某數 = " + sh(C, fc) + " ÷ " + sh(B, fb) + " = " + qFrac(C) + " × " + qFrac(inv(B)) + " = " + sh(truth, fx) + (right ? ",敘述正確。" : ",不是 " + sh(X, fx) + "。") };
    })
  ];

  const fill = [
    mk("fill", 1, "basic", function () {
      const p = pair(F3, ["int"], null, { min: 2, max: 6 }), a = ansObj(p);
      return { stem: stemEq(p) + " = ____" + HINT, answer: a.answer, accepted: a.accepted, explain: "分數(小數)除以整數,等於乘以整數的倒數。\n" + ex(p) };
    }),
    mk("fill", 2, "basic", function () {
      const p = pair(["int"], F3, { min: 2, max: 12 }, { min: 0.2, max: 3 }), a = ansObj(p);
      return { stem: stemEq(p) + " = ____" + HINT, answer: a.answer, accepted: a.accepted, explain: "整數除以分數(小數),等於乘以它的倒數。\n" + ex(p) };
    }),
    mk("fill", 3, "basic", function () {
      const p = pair(F3, F3), a = ansObj(p);
      return { stem: stemEq(p) + " = ____" + HINT, answer: a.answer, accepted: a.accepted, explain: ex(p) };
    }),
    mk("fill", 4, "trap", function () {
      const p = pair(["mixed"], ["int", "frac", "dec"], { min: 1, max: 4 }, { min: 0.2, max: 3 }), a = ansObj(p);
      return { stem: stemEq(p) + " = ____" + HINT, answer: a.answer, accepted: a.accepted,
        explain: "先把帶分數(和小數)化成假分數:" + sh(p.a, "mixed") + " = " + qFrac(p.a) + "。\n" + ex(p),
        trapNote: "常見錯誤:只拿整數部分或分數部分去除,或沒有先化成假分數就直接算。帶分數相除,要先化成假分數再計算。" };
    }),
    mk("fill", 5, "extend", function () {
      const fb = K.flavor(["frac", "dec"]), fc = K.flavor(["int", "dec", "frac"]);
      const B = K.randQ(fb, { min: 0.2, max: 0.9 }), X0 = K.flavor(["int", "dec", "mixed"]);
      const X = K.randQ(X0, { min: 2, max: 12 }), C = qMul(X, B);
      const fx = ansFl(fb, X0);
      if (!decOK(C) && (fb === "dec" || fc === "dec")) throw new Error("重抽");
      const fcc = term(C) && (fb === "dec" || X0 === "dec") ? "dec" : "frac";
      if (fx === "dec" && !decOK(X)) throw new Error("重抽");
      const a = qa(X, fx);
      return { stem: "某數的 " + sh(B, fb) + " 是 " + sh(C, fcc) + ",某數是 ____" + HINT, answer: a.answer, accepted: a.accepted,
        explain: "某數 × " + sh(B, fb) + " = " + sh(C, fcc) + ",所以某數 = " + sh(C, fcc) + " ÷ " + sh(B, fb) + " = " + qFrac(C) + " × " + qFrac(inv(B)) + " = " + sh(X, fx) + "。" };
    })
  ];

  const calc = [
    mk("calc", 1, "basic", function () {
      const p = pair(F3, ["int"], null, { min: 2, max: 6 }), a = ansObj(p);
      return { stem: "計算:" + stemEq(p), answer: a.answer, accepted: a.accepted, explain: "列式:" + ex(p) };
    }),
    mk("calc", 2, "basic", function () {
      const p = pair(["int"], F3, { min: 2, max: 12 }, { min: 0.2, max: 3 }), a = ansObj(p);
      return { stem: "計算:" + stemEq(p), answer: a.answer, accepted: a.accepted, explain: "列式:" + ex(p) };
    }),
    mk("calc", 3, "basic", function () {
      const p = pair(F3, F3), a = ansObj(p);
      return { stem: "計算:" + stemEq(p), answer: a.answer, accepted: a.accepted, explain: "列式:" + ex(p) };
    }),
    mk("calc", 4, "trap", function () {
      const p = pair(["mixed"], ["mixed", "frac", "dec"], { min: 1, max: 4 }, { min: 0.2, max: 3 }), a = ansObj(p);
      return { stem: "計算:" + stemEq(p), answer: a.answer, accepted: a.accepted,
        explain: "先把帶分數(和小數)化成假分數:" + qFrac(p.a) + " ÷ " + qFrac(p.b) + "。\n" + ex(p),
        trapNote: "常見錯誤:帶分數沒化成假分數,直接拿整數部分和分數部分分別去除。帶分數相除一定要先化成假分數。" };
    }),
    mk("calc", 5, "extend", function () {
      const f1 = K.flavor(F3), f2 = K.flavor(F3), f3 = K.flavor(F3);
      const a = K.randQ(f1, { min: 1, max: 3 }), b = K.randQ(f2, { min: 1, max: 3 }), c = K.randQ(f3, { min: 0.2, max: 3 });
      const s = qAdd(a, b), r = qDiv(s, c), fr = ansFl(ansFl(f1, f2), f3);
      if (fr === "dec" && !(decOK(r) && decOK(s))) throw new Error("重抽");
      if (!small(r)) throw new Error("重抽");
      const ans = qa(r, fr);
      return { stem: "計算:(" + sh(a, f1) + " + " + sh(b, f2) + ") ÷ " + sh(c, f3), answer: ans.answer, accepted: ans.accepted,
        explain: "先算括號:" + sh(a, f1) + " + " + sh(b, f2) + " = " + qFrac(a) + " + " + qFrac(b) + " = " + qFrac(s) + "。\n再除以 " + sh(c, f3) + ":" + qFrac(s) + " × " + qFrac(inv(c)) + " = " + sh(r, fr) + "。" };
    })
  ];

  const word = [
    mk("word", 2, "basic", function () {
      const fa = K.flavor(F3), A = K.randQ(fa, { min: 1, max: 5 }), k = int(2, 6), r = qDiv(A, Q(k));
      if (fa === "dec" && !decOK(r)) throw new Error("重抽");
      const a = qa(r, fa);
      return { stem: "媽媽把 " + sh(A, fa) + " 公升的果汁,平分裝進 " + k + " 個杯子,每個杯子裝幾公升?", answer: a.answer, accepted: a.accepted, units: ["公升", "L", "l"],
        explain: "平分用除法:" + sh(A, fa) + " ÷ " + k + " = " + qFrac(A) + " × " + qFrac(Q(1, k)) + " = " + sh(r, fa) + "。\n答:" + sh(r, fa) + " 公升。" };
    }),
    mk("word", 3, "basic", function () {
      const fd = K.flavor(["frac", "dec"]), d = K.randQ(fd, { min: 0.2, max: 0.9 }), c = int(3, 15), N = qMul(d, Q(c));
      const fN = K.flavor(["dec", "mixed"]);
      if (fN === "dec" && !decOK(N)) throw new Error("重抽");
      return { stem: "有 " + sh(N, fN) + " 公斤的米,要平均裝進袋子裡,每袋裝 " + sh(d, fd) + " 公斤,可以裝成幾袋?", answer: String(c), units: ["袋"],
        explain: "看 " + sh(N, fN) + " 公斤裡有幾個 " + sh(d, fd) + " 公斤,用除法:" + qFrac(N) + " ÷ " + qFrac(d) + " = " + qFrac(N) + " × " + qFrac(inv(d)) + " = " + c + "。\n答:" + c + " 袋。" };
    }),
    mk("word", 4, "trap", function () {
      const fA = K.flavor(["mixed", "dec"]), A = K.randQ(fA, { min: 2, max: 8 });
      const fd = K.flavor(["frac", "dec"]), d = K.randQ(fd, { min: 0.2, max: 0.9 });
      const q = qDiv(A, d), val = Math.floor(q.n / q.d);
      if (q.d === 1 || val < 2 || val > 15) throw new Error("重抽");
      if (fA === "dec" && !decOK(A)) throw new Error("重抽");
      return { stem: "水槽裡有 " + sh(A, fA) + " 公升的水,要裝進小水瓶,每個小水瓶最多可裝 " + sh(d, fd) + " 公升。最多可以裝滿幾個小水瓶?", answer: String(val), units: ["個", "瓶"],
        explain: "水量 ÷ 每瓶容量 = " + qFrac(A) + " ÷ " + qFrac(d) + " = " + qFrac(A) + " × " + qFrac(inv(d)) + " = " + K.qMixed(q) + "。\n裝滿的瓶子只能算整數個,所以最多裝滿 " + val + " 個(剩下的水不夠再裝滿一瓶)。",
        trapNote: "常見錯誤:直接把商 " + K.qMixed(q) + " 當作答案。題目問「最多可以裝滿幾個」,商不是整數時,分數的部分不夠裝滿一個,要捨去,只能算 " + val + " 個。" };
    }),
    mk("word", 4, "extend", function () {
      const fN = K.flavor(["int", "dec", "mixed"]), N = K.randQ(fN, { min: 3, max: 12 });
      const d = pick([3, 4, 5, 6, 8]), n = pick([1, 2, 3].filter(function (x) { return x < d && gcd(x, d) === 1; })), f = Q(n, d), k = int(2, 4);
      const rest = qMul(N, qSub(Q(1), f)), each = qDiv(rest, Q(k)), fe = fN === "int" ? "frac" : fN;
      if (fe === "dec" && !(decOK(each) && decOK(N) && decOK(qMul(N, f)))) throw new Error("重抽");
      if (!small(each)) throw new Error("重抽");
      const a = qa(each, fe);
      return { stem: "一條緞帶長 " + sh(N, fN) + " 公尺,先用掉全長的 " + qFrac(f) + ",剩下的平均剪成 " + k + " 段,每段長幾公尺?", answer: a.answer, accepted: a.accepted, units: ["公尺", "m"],
        explain: "用掉 " + sh(N, fN) + " × " + qFrac(f) + " = " + sh(qMul(N, f), fe) + " 公尺,剩下 " + qFrac(rest) + " 公尺(即全長的 " + qFrac(qSub(Q(1), f)) + ")。\n平分成 " + k + " 段:" + qFrac(rest) + " ÷ " + k + " = " + sh(each, fe) + " 公尺。" };
    }),
    mk("word", 5, "extend", function () {
      const d = pick([3, 4, 5, 6, 7, 8]), n = pick([1, 2, 3, 4, 5].filter(function (x) { return x < d - 0 && gcd(x, d) === 1; })), f = Q(n, d);
      const fX = K.flavor(["int", "dec", "mixed"]), X = K.randQ(fX, { min: 4, max: 24 });
      const Rr = qMul(X, qSub(Q(1), f)), fR = fX === "int" ? "frac" : fX;
      if (fR === "dec" && !(decOK(Rr) && decOK(X))) throw new Error("重抽");
      if (!small(Rr) || !small(X)) throw new Error("重抽");
      const a = qa(X, fX === "int" ? "frac" : fX);
      return { stem: "一桶油倒出了全部的 " + qFrac(f) + " 之後,桶子裡還剩 " + sh(Rr, fR) + " 公升。這桶油原來有幾公升?", answer: a.answer, accepted: a.accepted, units: ["公升", "L", "l"],
        explain: "倒出 " + qFrac(f) + ",剩下 1 - " + qFrac(f) + " = " + qFrac(qSub(Q(1), f)) + "。\n剩下的 " + sh(Rr, fR) + " 公升就是全部的 " + qFrac(qSub(Q(1), f)) + ",所以全部 = " + qFrac(Rr) + " ÷ " + qFrac(qSub(Q(1), f)) + " = " + qFrac(Rr) + " × " + qFrac(inv(qSub(Q(1), f))) + " = " + sh(X, fX === "int" ? "frac" : fX) + " 公升。" };
    })
  ];

  ExamBank.register(T, "fraction-div-basic", single.concat(multi, tf, fill, calc, word));
})();
