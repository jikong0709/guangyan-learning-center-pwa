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
  /* 學生看得到的字串：分母不得超過 60、不得有 9 位以上數字，否則重抽（accepted 內的則直接剔除；accepted 可含精確的長小數） */
  function badStr(x) {
    x = String(x);
    let m; const re = /(\d+)\/(\d+)/g;
    while ((m = re.exec(x))) if (Number(m[2]) > 60) return true;
    return /\d{9,}|\d+\.\d{5,}/.test(x);
  }
  function badAcc(x) {
    x = String(x);
    let m; const re = /(\d+)\/(\d+)/g;
    while ((m = re.exec(x))) if (Number(m[2]) > 60) return true;
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
  /* 顯示：dec 遇無限小數時退回帶分數 */
  function decOK(q) { if (!K.qIsTerminating(q)) return false; const s = K.qDec(q); return s !== null && Math.abs(Number(s) - q.n / q.d) < 1e-12; }
  /* 答案包裝：K.qAnswer 的小數寫法若被四捨五入到 4 位（不精確）就剔除，避免把錯的小數當等價答案 */
  function qa(q, fl) { const o = K.qAnswer(q, (fl === "int" || fl === "frac") ? "mixed" : fl); const v = q.n / q.d; o.accepted = o.accepted.filter(function (x) { return !/^\d+\.\d+$/.test(x) || Math.abs(Number(x) - v) < 1e-12; }); return o; }
  function sh(q, fl) { if (q.d > 60 && !(fl === "dec" && decOK(q))) throw new Error("重抽"); return fl === "dec" ? (decOK(q) ? K.qDec(q) : K.qMixed(q)) : (fl === "mixed" || fl === "frac") ? K.qMixed(q) : qFrac(q); }
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
    const res = ok ? sh(p.r, p.fr) : pick(w);
    if (res === sh(p.b, p.fb) || res === sh(p.a, p.fa)) throw new Error("重抽");
    return stemEq(p) + " = " + res;
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
      const fd = K.flavor(["frac", "dec"]), d = K.randQ(fd, { min: 0.2, max: 0.9, places: 1 });
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
        "除以大於 1 的數商變小;除以小於 1 的數(真分數、小於 1 的小數)商變大。除以一個數等於乘以它的倒數;除以整數(例如 ÷ 3),是把原數平分成 3 份。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:認為除法的商一定比被除數小(除以小於 1 的數時商變大);整數除以分數時忘了翻倒數;把「÷ 3」做成「× 3」。");
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
      const fa = K.flavor(F3), A = K.randQ(fa, { min: 1, max: 4, places: 1 }), k = int(2, 6), sA = sh(A, fa);
      const pool = [
        { s: sA + " ÷ " + k + " = " + sA + " × " + qFrac(Q(1, k)), a: true, w: "除以 " + k + " 等於乘以 1/" + k + ",正確。" },
        { s: sA + " ÷ " + k + " = " + sA + " × " + k, a: false, w: "除以 " + k + " 是乘以 1/" + k + ",不是乘以 " + k + "。" },
        { s: k + " ÷ " + sA + " = " + k + " × " + qFrac(inv(A)), a: true, w: "除以 " + sA + " 等於乘以它的倒數 " + qFrac(inv(A)) + ",正確。" },
        { s: k + " ÷ " + sA + " = " + k + " × " + qFrac(A), a: false, w: "漏了翻倒數,正確是 " + k + " × " + qFrac(inv(A)) + "。" },
        { s: sA + " ÷ " + qFrac(Q(1, k)) + " = " + sA + " × " + k, a: true, w: "除以 1/" + k + " 等於乘以 " + k + ",正確。" },
        { s: sA + " ÷ " + qFrac(Q(1, k)) + " = " + sA + " ÷ " + k, a: false, w: "除以 1/" + k + " 等於乘以 " + k + ",不是除以 " + k + "。" }
      ];
      const x = pick(pool);
      return { stem: x.s + "。", answer: x.a, explain: x.w, trapNote: "易錯:除以 " + k + " 是乘以 1/" + k + ";除以分數(或小數)要乘以它的倒數;除以 1/" + k + " 等於乘以 " + k + "。小數先化成分數再翻倒數。" };
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

  /* ===== 教材式 □ 未知數題（規格第 14 節）===== */
  function bx(minv, maxv, FA) { const f = K.flavor(FA || F3); return { q: K.randQ(f, { min: minv, max: maxv }), f: f }; }
  function okb(o) { return o.f !== "dec" || decOK(o.q); }
  function chkc(c, fc) { if (qCmp(c, Q(1)) === 0) throw new Error("重抽"); if (fc === "dec" && !decOK(c)) throw new Error("重抽"); if (!small(c)) throw new Error("重抽"); }
  function ver(X, b, c, fx, fb, fc, op) { return "驗算:" + (op === "mul" ? sh(X, fx) + " × " + sh(b, fb) : op === "div1" ? sh(X, fx) + " ÷ " + sh(b, fb) : sh(b, fb) + " ÷ " + sh(X, fx)) + " = " + sh(c, fc) + "。"; }

  const boxes = [
    mk("calc", 1, "basic", function () {
      const X = bx(0.5, 4), b = bx(0.5, 3); if (!okb(X) || !okb(b)) throw new Error("重抽");
      const c = qMul(X.q, b.q), fc = ansFl(X.f, b.f); chkc(c, fc);
      const a = qa(X.q, X.f);
      return { stem: "求 □ 是多少:「□ × " + sh(b.q, b.f) + " = " + sh(c, fc) + "」", answer: a.answer, accepted: a.accepted,
        explain: "□ × " + sh(b.q, b.f) + " = " + sh(c, fc) + ",所以 □ = " + sh(c, fc) + " ÷ " + sh(b.q, b.f) + " = " + qFrac(c) + " × " + qFrac(inv(b.q)) + " = " + sh(X.q, X.f) + "。\n" + ver(X.q, b.q, c, X.f, b.f, fc, "mul") };
    }),
    mk("fill", 2, "basic", function () {
      const X = bx(0.5, 5), b = bx(0.5, 3); if (!okb(X) || !okb(b)) throw new Error("重抽");
      const c = qDiv(X.q, b.q), fc = ansFl(X.f, b.f); chkc(c, fc);
      const a = qa(X.q, X.f);
      return { stem: "「□ ÷ " + sh(b.q, b.f) + " = " + sh(c, fc) + "」,□ = ____" + HINT, answer: a.answer, accepted: a.accepted,
        explain: "□ ÷ " + sh(b.q, b.f) + " = " + sh(c, fc) + ",被除數 = 商 × 除數,所以 □ = " + sh(c, fc) + " × " + sh(b.q, b.f) + " = " + sh(X.q, X.f) + "。\n" + ver(X.q, b.q, c, X.f, b.f, fc, "div1") };
    }),
    mk("calc", 3, "basic", function () {
      const X = bx(0.5, 3), c = bx(0.5, 3); if (!okb(X) || !okb(c)) throw new Error("重抽");
      const a0 = qMul(X.q, c.q), fa = ansFl(X.f, c.f); chkc(a0, fa); if (qCmp(X.q, c.q) === 0) throw new Error("重抽");
      const a = qa(X.q, X.f);
      return { stem: "求 □ 是多少:「" + sh(a0, fa) + " ÷ □ = " + sh(c.q, c.f) + "」", answer: a.answer, accepted: a.accepted,
        explain: sh(a0, fa) + " ÷ □ = " + sh(c.q, c.f) + ",除數 = 被除數 ÷ 商,所以 □ = " + sh(a0, fa) + " ÷ " + sh(c.q, c.f) + " = " + sh(X.q, X.f) + "。\n" + ver(X.q, a0, c.q, X.f, fa, c.f, "div2") };
    }),
    mk("single", 3, "trap", function () {
      const X = bx(0.5, 3), b = bx(0.5, 3); if (!okb(X) || !okb(b)) throw new Error("重抽");
      const c = qMul(X.q, b.q), fc = ansFl(X.f, b.f), fx = X.f; chkc(c, fc);
      const wr = [qMul(c, b.q), qDiv(b.q, c), qAdd(c, b.q), qSub(c, b.q).n > 0 ? qSub(c, b.q) : qAdd(c, Q(1)), qMul(X.q, Q(10))].filter(function (x) { return x.n > 0 && qCmp(x, X.q) !== 0 && (fx !== "dec" || decOK(x)) && small(x); }).map(function (x) { return sh(x, fx); });
      const r = S(sh(X.q, fx), wr);
      r.stem = "「□ × " + sh(b.q, b.f) + " = " + sh(c, fc) + "」,□ 是多少?";
      r.explain = "已知積和其中一個因數,另一個因數 = 積 ÷ 因數:□ = " + sh(c, fc) + " ÷ " + sh(b.q, b.f) + " = " + sh(X.q, fx) + "。";
      r.trapNote = "常見錯誤:把 □ 移到另一邊時方向弄反,用乘法 " + sh(c, fc) + " × " + sh(b.q, b.f) + " = " + sh(qMul(c, b.q), fx) + ",或把被除數、除數顛倒。乘法的未知因數要用「積 ÷ 已知因數」。";
      return r;
    }),
    mk("fill", 4, "trap", function () {
      const X = bx(1, 3, ["frac", "dec"]), c = bx(1, 3, ["mixed", "frac"]); if (!okb(X) || !okb(c)) throw new Error("重抽");
      const a0 = qMul(X.q, c.q), fa = ansFl(X.f, c.f); chkc(a0, fa); if (qCmp(X.q, c.q) === 0) throw new Error("重抽");
      const a = qa(X.q, X.f);
      return { stem: "「" + sh(a0, fa) + " ÷ □ = " + sh(c.q, c.f) + "」,□ = ____" + HINT, answer: a.answer, accepted: a.accepted,
        explain: "除數 = 被除數 ÷ 商:□ = " + sh(a0, fa) + " ÷ " + sh(c.q, c.f) + " = " + qFrac(a0) + " × " + qFrac(inv(c.q)) + " = " + sh(X.q, X.f) + "。\n" + ver(X.q, a0, c.q, X.f, fa, c.f, "div2"),
        trapNote: "常見錯誤:把 □ 當成被除數,算成 " + sh(a0, fa) + " × " + sh(c.q, c.f) + "。□ 在除數的位置,要用「被除數 ÷ 商」,不能用乘法。" };
    }),
    mk("tf", 2, "trap", function () {
      const X = bx(0.5, 3), b = bx(0.5, 3); if (!okb(X) || !okb(b)) throw new Error("重抽");
      const c = qMul(X.q, b.q), fc = ansFl(X.f, b.f); chkc(c, fc);
      const wrong = qMul(c, b.q); if (qCmp(wrong, X.q) === 0 || (X.f === "dec" && !decOK(wrong)) || !small(wrong)) throw new Error("重抽");
      const right = Math.random() < 0.5, v = right ? X.q : wrong;
      return { stem: "「□ × " + sh(b.q, b.f) + " = " + sh(c, fc) + "」,所以 □ = " + sh(v, X.f === "frac" ? "mixed" : X.f) + "。", answer: right,
        explain: "□ = " + sh(c, fc) + " ÷ " + sh(b.q, b.f) + " = " + sh(X.q, X.f) + (right ? ",敘述正確。" : ",不是 " + sh(v, X.f) + "(那是用乘法算出來的)。"),
        trapNote: "易錯:乘法算式中求未知因數要用除法(積 ÷ 已知因數),不是把兩個數相乘。" };
    }),
    mk("calc", 5, "extend", function () {
      const X = bx(1, 4), b = bx(0.5, 3), c = bx(1, 3); if (!okb(X) || !okb(b) || !okb(c)) throw new Error("重抽");
      const d = qDiv(qAdd(X.q, b.q), c.q), fd = ansFl(ansFl(X.f, b.f), c.f); chkc(d, fd);
      const a = qa(X.q, X.f);
      return { stem: "求 □ 是多少:「(□ + " + sh(b.q, b.f) + ") ÷ " + sh(c.q, c.f) + " = " + sh(d, fd) + "」", answer: a.answer, accepted: a.accepted,
        explain: "括號內的和 = 商 × 除數 = " + sh(d, fd) + " × " + sh(c.q, c.f) + " = " + sh(qMul(d, c.q), fd) + "。\n□ = " + sh(qMul(d, c.q), fd) + " - " + sh(b.q, b.f) + " = " + sh(X.q, X.f) + "。" };
    }),
    mk("fill", 5, "extend", function () {
      const X = bx(1, 4), b = bx(0.5, 3, ["frac", "dec"]), c = bx(0.5, 2, ["frac", "dec"]); if (!okb(X) || !okb(b) || !okb(c)) throw new Error("重抽");
      const d = qMul(qDiv(X.q, b.q), c.q), fd = ansFl(ansFl(X.f, b.f), c.f); chkc(d, fd);
      const a = qa(X.q, X.f);
      return { stem: "「□ ÷ " + sh(b.q, b.f) + " × " + sh(c.q, c.f) + " = " + sh(d, fd) + "」,□ = ____" + HINT, answer: a.answer, accepted: a.accepted,
        explain: "由後往前還原:先 ÷ " + sh(c.q, c.f) + ":" + sh(d, fd) + " ÷ " + sh(c.q, c.f) + " = " + sh(qDiv(d, c.q), fd) + ";再 × " + sh(b.q, b.f) + ":□ = " + sh(qDiv(d, c.q), fd) + " × " + sh(b.q, b.f) + " = " + sh(X.q, X.f) + "。" };
    }),
    mk("single", 5, "extend", function () {
      const f1 = K.flavor(F3), f2 = K.flavor(F3);
      const X = K.randQ(f1, { min: 2, max: 6 }), Y = K.randQ(f2, { min: 0.5, max: 2 });
      if (qCmp(X, Y) <= 0) throw new Error("重抽");
      const fs = ansFl(f1, f2), s = qAdd(X, Y), d = qSub(X, Y);
      if (fs === "dec" && !(decOK(s) && decOK(d) && decOK(X))) throw new Error("重抽");
      const fx = fs;
      const wr = [Y, qDiv(d, Q(2)), qDiv(s, Q(2)), d, qAdd(s, d), qSub(s, d)].filter(function (x) { return x.n > 0 && qCmp(x, X) !== 0 && (fx !== "dec" || decOK(x)) && small(x); }).map(function (x) { return sh(x, fx); });
      const r = S(sh(X, fx), wr);
      r.stem = "已知「□ + △ = " + sh(s, fs) + "」,「□ - △ = " + sh(d, fs) + "」,□ 是多少?";
      r.explain = "兩式相加:□ + △ + □ - △ = 2 個 □ = " + sh(s, fs) + " + " + sh(d, fs) + " = " + sh(qAdd(s, d), fs) + ",所以 □ = " + sh(qAdd(s, d), fs) + " ÷ 2 = " + sh(X, fx) + "。(△ = " + sh(Y, fx) + ")";
      return r;
    }),
    mk("word", 4, "extend", function () {
      const fN = K.flavor(["int", "dec", "mixed"]), X = K.randQ(fN, { min: 4, max: 24 });
      const d = pick([3, 4, 5, 6, 8]), n = pick([1, 2, 3].filter(function (x) { return x < d && gcd(x, d) === 1; })), f = Q(n, d), R = qMul(X, qSub(Q(1), f));
      const fx = fN === "int" ? "frac" : fN;
      if (fx === "dec" && !(decOK(X) && decOK(R))) throw new Error("重抽");
      if (!small(R) || !small(X)) throw new Error("重抽");
      const a = qa(X, fx);
      return { stem: "果汁原有 □ 公升,倒出全部的 " + qFrac(f) + " 後,還剩 " + sh(R, fx) + " 公升。可以列成「□ × (1 - " + qFrac(f) + ") = " + sh(R, fx) + "」,□ 是多少公升?", answer: a.answer, accepted: a.accepted, units: ["公升", "L", "l"],
        explain: "剩下的是全部的 1 - " + qFrac(f) + " = " + qFrac(qSub(Q(1), f)) + "。□ = " + sh(R, fx) + " ÷ " + qFrac(qSub(Q(1), f)) + " = " + qFrac(R) + " × " + qFrac(inv(qSub(Q(1), f))) + " = " + sh(X, fx) + " 公升。" };
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
  const lcm = K.lcm;
  /* 自我核對：解法二算出來的值必須和標準答案一致，否則丟錯（不讓錯的解法二出貨） */
  function numOf(s) { return pq(String(s).replace(/%$/, "").trim()); }
  function ck(q, s) { let a; try { a = numOf(s); } catch (e) { return q; } if (qCmp(q, a) !== 0) throw new Error("explain2 與答案不一致:" + String(s)); return q; }
  function ckTf(r, truth) { if (!!truth !== !!r.answer) throw new Error("explain2 與答案不一致(是非)"); }
  function ckMulti(r, flags) { const want = flags.map(function (f, i) { return f ? i : -1; }).filter(function (i) { return i >= 0; }).join(","); if (r.answer.join(",") !== want) throw new Error("explain2 與答案不一致(複選)"); }
  function ckSingle(r, flags) { if (!flags[r.answer] || flags.filter(Boolean).length !== 1) throw new Error("explain2 與答案不一致(單選)"); }
  function ckEq(a, b) { if (qCmp(a, b) !== 0) throw new Error("explain2 內部算式不一致"); }
  function fq(q) { if (q.d > 60) throw new Error("重抽"); return K.qMixed(q); }
  function unitOf(r) { return r.units && r.units[0] ? " " + r.units[0] : ""; }
  function goodsOf(r) { return r.answer.map(function (i) { return r.options[i]; }).join("、"); }
  function verdict(r) { return "所以敘述" + (r.answer ? "正確" : "錯誤") + "。"; }
  /* 通分法（個數說法）：兩數換成同一個單位分數的幾個，商就是個數相除 */
  function divAlt(aS, bS, fin, chk) {
    const a = pq(aS), b = pq(bS), D = lcm(a.d, b.d);
    if (D > 60) throw new Error("重抽");
    ck(qDiv(a, b), chk === undefined ? fin : chk);
    const x = a.n * (D / a.d), y = b.n * (D / b.d);
    if (D === 1) return "兩個都是整數:" + x + " ÷ " + y + " = " + fq(Q(x, y)) + "。\n答案是 " + fin + "。";
    return "把兩個數都換成「幾個 1/" + D + "」:" + aS + " 是 " + x + " 個 1/" + D + ",\n" + bS + " 是 " + y + " 個 1/" + D + "。\n單位一樣大,所以相除就是比個數:" + x + " ÷ " + y + " = " + fq(Q(x, y)) + "。\n答案是 " + fin + "。";
  }
  function exprParts(r) { return r.stem.replace(/^計算:/, "").replace(/ = \?.*$/, "").replace(/ = ____.*$/, "").split(" ÷ "); }
  function lhs(eq, x) { return eq.split(" = ")[0].replace(/□/g, x); }
  function leftTok(eq) { return tk(eq.split(" = ")[0].replace(/□/g, "")); }
  /* □ × b = c：b = n/d，表示把 □ 平分成 d 份，取 n 份就是 c */
  function mulBoxText(eq, ansStr) {
    const b = leftTok(eq)[0], c = eqRight(eq), u = qDiv(c, Q(b.n)), X = qMul(u, Q(b.d));
    ck(X, ansStr);
    return "把 " + fq(b) + " 想成「平分成 " + b.d + " 份,取 " + b.n + " 份」:□ 平分成 " + b.d + " 份,取 " + b.n + " 份就是 " + fq(c) + "。\n" + b.n + " 份是 " + fq(c) + ",1 份 = " + fq(c) + " ÷ " + b.n + " = " + fq(u) + ";□ 有 " + b.d + " 份,□ = " + fq(u) + " × " + b.d + " = " + fq(X) + "。";
  }
  function boxEq(r) { const m = r.stem.match(/「([^」]*□[^」]*)」/); return m[1]; }
  /* 代入檢查：把 □ 換成某數，算出左邊是否等於右邊 */
  function subst(eq, xs) { const parts = eq.split(" = "); const L = parts[0].replace(/□/g, "(" + xs + ")"); return qeval(L); }
  function eqRight(eq) { return qeval(eq.split(" = ")[1]); }
  function stmtV(s) {
    let m;
    if (s === "除法的商一定比被除數小") return [false, "舉反例:6 ÷ 1/2 = 12,比 6 大"];
    if (s === "任何正數,除以大於 1 的數,商都會比原來的數小") return [true, "舉例:12 ÷ 3 = 4,比 12 小"];
    if ((m = s.match(/^(.+) ÷ (.+) 的商比 (.+) (大|小)$/))) { const q = qeval(m[1] + " ÷ " + m[2]), N = qeval(m[3]), big = qCmp(q, N) > 0; return [(m[4] === "大") === big, m[1] + " ÷ " + m[2] + " = " + fq(q) + ",比 " + m[3] + (big ? " 大" : " 小")]; }
    if ((m = s.match(/^(.+) ÷ (\d+) 的商是 (.+)$/))) { const q = qeval(m[1] + " ÷ " + m[2]); return [qCmp(q, qeval(m[3])) === 0, m[1] + " ÷ " + m[2] + " = " + fq(q)]; }
    if ((m = s.match(/^(.+) ÷ (.+) 與 (.+) × (.+) 的結果相同$/))) { const q1 = qeval(m[1] + " ÷ " + m[2]), q2 = qeval(m[3] + " × " + m[4]); return [qCmp(q1, q2) === 0, fq(q1) + " 和 " + fq(q2)]; }
    return [null, "?"];
  }
  function lineV(line) { const p = line.split(" = "); const q = qeval(p[0]), c = qeval(p[1]); return [qCmp(q, c) === 0, p[0] + " 的商是 " + fq(q)]; }

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
    "fraction-div-single-L1-01": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.options[r.answer]); },
    "fraction-div-single-L2-02": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.options[r.answer]); },
    "fraction-div-single-L3-03": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.options[r.answer]); },
    "fraction-div-single-L4-04": function (r) {
      const N = tk(r.stem)[0], flags = r.options.map(function (o) { return qCmp(qeval(o), N) > 0; });
      ckSingle(r, flags);
      const ls = r.options.map(function (o) { const q = qeval(o); return o + " = " + fq(q) + (qCmp(q, N) > 0 ? ",比較大" : ",比較小"); });
      return "估算並逐一算出結果:" + ls.join(";") + "。只有選項 " + r.options[r.answer] + " 的結果比 " + fq(N) + " 大。";
    },
    "fraction-div-single-L5-05": function (r) { const t = tk(r.stem), B = t[0], C = t[1], X = pq(r.options[r.answer]), q = qDiv(X, B); ckEq(q, C); return "代入檢查:如果某數是 " + r.options[r.answer] + ",除以 " + fq(B) + " 得 " + fq(q) + ",正好是 " + fq(C) + ",符合題目。\n所以某數是 " + r.options[r.answer] + "。"; },
    "fraction-div-single-L3-06": function (r) {
      const eq = boxEq(r), c = eqRight(eq); ckSingle(r, r.options.map(function (o) { return qCmp(subst(eq, o), c) === 0; }));
      return mulBoxText(eq, r.options[r.answer]) + "\n所以 □ = " + r.options[r.answer] + "。";
    },
    "fraction-div-single-L5-07": function (r) {
      const eqs = (r.stem.match(/「[^」]*」/g) || []).map(function (x) { return x.slice(1, -1); });
      const S0 = pq(eqs[0].split(" = ")[1]), D0 = pq(eqs[1].split(" = ")[1]), t = qSub(S0, D0), y = qDiv(t, Q(2)), X = qAdd(y, D0);
      ckSingle(r, r.options.map(function (o) { return qCmp(pq(o), X) === 0; }));
      return "由「□ - △ = " + fq(D0) + "」知道 □ 比 △ 大 " + fq(D0) + ",也就是 □ = △ + " + fq(D0) + "。\n把它放進「□ + △ = " + fq(S0) + "」:△ + " + fq(D0) + " + △ = " + fq(S0) + ",所以 2 個 △ = " + fq(S0) + " - " + fq(D0) + " = " + fq(t) + ",△ = " + fq(y) + "。\n□ = " + fq(y) + " + " + fq(D0) + " = " + fq(X) + ",所以 □ = " + r.options[r.answer] + "。";
    },
    "fraction-div-multi-L2-01": function (r) { const flags = [], wh = r.options.map(function (o) { const v = lineV(o); flags.push(v[0]); return v[0] ? "商真的是 " + fq(qeval(o.split(" = ")[0])) : "實際的商是 " + fq(qeval(o.split(" = ")[0])); }); ckMulti(r, flags); return "把每一題的被除數和除數通分,只比分子,算出真正的商:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。"; },
    "fraction-div-multi-L3-02": function (r) { const R0 = tk(r.stem)[0], flags = [], wh = r.options.map(function (o) { const q = qeval(o); flags.push(qCmp(q, R0) === 0); return "商是 " + fq(q) + (qCmp(q, R0) === 0 ? ",等於 " + fq(R0) : ",不等於 " + fq(R0)); }); ckMulti(r, flags); return "目標是商等於 " + fq(R0) + ",逐一算算看:\n" + rows(r, flags, wh) + "。\n所以選第 " + pickIdx(r) + " 個。"; },
    "fraction-div-multi-L3-03": function (r) { const flags = [], wh = r.options.map(function (o) { const v = stmtV(o); if (v[0] === null) throw new Error("explain2 找不到對應的敘述:" + o); flags.push(v[0]); return v[1]; }); ckMulti(r, flags); return "舉例或算算看每一句:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。"; },
    "fraction-div-multi-L4-04": function (r) { const N = tk(r.stem)[0], flags = [], wh = r.options.map(function (o) { const q = qeval(o); flags.push(qCmp(q, N) > 0); return "商是 " + fq(q) + (qCmp(q, N) > 0 ? ",比 " + fq(N) + " 大" : ",比 " + fq(N) + " 小"); }); ckMulti(r, flags); return "算出每個商,再和 " + fq(N) + " 比大小:\n" + rows(r, flags, wh) + "。\n所以商比較大的是第 " + pickIdx(r) + " 個。"; },
    "fraction-div-multi-L5-05": function (r) { const t = tk(r.stem), base = qDiv(t[0], t[1]), flags = [], wh = r.options.map(function (o) { const q = qeval(o); flags.push(qCmp(q, base) === 0); return "結果是 " + fq(q) + (qCmp(q, base) === 0 ? ",和 " + fq(base) + " 一樣" : ",和 " + fq(base) + " 不一樣"); }); ckMulti(r, flags); return "先算出題目的結果 " + fq(base) + ",再把每個選項算出來:\n" + rows(r, flags, wh) + "。\n所以選第 " + pickIdx(r) + " 個。"; },
    "fraction-div-tf-L1-01": function (r) { const p = r.stem.replace(/。$/, "").split(" = "), q = qeval(p[0]), c = qeval(p[1]); ckTf(r, qCmp(q, c) === 0); return "用乘法驗算:把題目的商 " + p[1] + " 乘回除數,看是否等於被除數。實際上 " + p[0] + " = " + fq(q) + (qCmp(q, c) === 0 ? ",和 " + p[1] + " 相等。" : ",和 " + p[1] + " 不相等。") + verdict(r); },
    "fraction-div-tf-L2-02": function (r) {
      const m = r.stem.match(/^(.+) ÷ (.+) 的商,一定比 (.+) 小。$/), N = qeval(m[3]), d = qeval(m[2]), q = qeval(m[1] + " ÷ " + m[2]), small = qCmp(d, Q(1)) > 0;
      ckTf(r, qCmp(q, N) < 0);
      return "先拿除數和 1 比一比:" + m[2] + (small ? " 比 1 大" : " 比 1 小") + "。\n" + m[3] + " ÷ 1 = " + m[3] + (small ? ";除數比 1 大,每份比 1 還大,分得出的份數就比 " + m[3] + " 少,商會變小" : ";除數比 1 小,每份比 1 還小,分得出的份數就比 " + m[3] + " 多,商會變大") + "。\n算算看:" + m[1] + " ÷ " + m[2] + " = " + fq(q) + "。" + verdict(r);
    },
    "fraction-div-tf-L3-03": function (r) { const p = r.stem.replace(/。$/, "").split(" = "), q1 = qeval(p[0]), q2 = qeval(p[1]); ckTf(r, qCmp(q1, q2) === 0); return "兩邊各自算出來:左邊 " + p[0] + " = " + fq(q1) + ",右邊 " + p[1] + " = " + fq(q2) + (qCmp(q1, q2) === 0 ? ",兩邊相等。" : ",兩邊不相等。") + verdict(r); },
    "fraction-div-tf-L4-04": function (r) { const p = r.stem.replace(/。$/, "").split(" = "), parts = p[0].split(" ÷ "); ckTf(r, qCmp(qeval(p[0]), pq(p[1])) === 0); return divAlt(parts[0], parts[1], fq(qeval(p[0]))).replace("答案是", "真正的商是") + "\n題目寫的是 " + p[1] + "。" + verdict(r); },
    "fraction-div-tf-L5-05": function (r) { const t = tk(r.stem), B = t[0], C = t[1], X = t[2], v = qMul(X, B); ckTf(r, qCmp(v, C) === 0); return "代入檢查:如果某數是 " + fq(X) + ",乘以 " + fq(B) + " 得 " + fq(v) + (qCmp(v, C) === 0 ? ",正好是 " + fq(C) + "。" : ",不是 " + fq(C) + "。") + verdict(r); },
    "fraction-div-tf-L2-06": function (r) {
      const eq = boxEq(r), c = eqRight(eq), x = r.stem.match(/所以 □ = (.+)。$/)[1], b = leftTok(eq)[0], u = qDiv(c, Q(b.n)), X = qMul(u, Q(b.d));
      ckTf(r, qCmp(X, pq(x)) === 0);
      return "把 " + fq(b) + " 想成「平分成 " + b.d + " 份,取 " + b.n + " 份」:" + b.n + " 份是 " + fq(c) + ",1 份 = " + fq(c) + " ÷ " + b.n + " = " + fq(u) + ",□ 有 " + b.d + " 份,□ = " + fq(u) + " × " + b.d + " = " + fq(X) + "。\n敘述寫的是 " + x + (qCmp(X, pq(x)) === 0 ? ",和算出來的一樣。" : ",和算出來的不一樣。") + verdict(r);
    },
    "fraction-div-fill-L1-01": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.answer); },
    "fraction-div-fill-L2-02": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.answer); },
    "fraction-div-fill-L3-03": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.answer); },
    "fraction-div-fill-L4-04": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.answer); },
    "fraction-div-fill-L5-05": function (r) {
      const t = tk(r.stem), B = t[0], C = t[1], X = pq(r.answer);
      ckEq(qMul(X, B), C);
      return "先估一估:" + (qCmp(B, Q(1)) < 0 ? "某數只取了一部分就是 " + fq(C) + ",所以某數比 " + fq(C) + " 大。" : "某數的倍數是 " + fq(C) + ",所以某數不會比 " + fq(C) + " 大。") + "\n代入檢查:" + r.answer + " × " + fq(B) + " = " + fq(qMul(X, B)) + ",正好是 " + fq(C) + "。\n所以某數是 " + r.answer + "。";
    },
    "fraction-div-fill-L2-06": function (r) {
      const eq = boxEq(r), b = leftTok(eq)[0], c = eqRight(eq), X = qMul(c, b); ck(X, r.answer);
      return "「□ ÷ " + fq(b) + " = " + fq(c) + "」表示:把 □ 每 " + fq(b) + " 分成一份,剛好分成 " + fq(c) + " 份。\n所以 □ 就是 " + fq(c) + " 個 " + fq(b) + " 合起來:□ = " + fq(c) + " × " + fq(b) + " = " + r.answer + "。";
    },
    "fraction-div-fill-L4-07": function (r) {
      const eq = boxEq(r), a = leftTok(eq)[0], c = eqRight(eq), X = qDiv(a, c); ck(X, r.answer);
      return "「" + fq(a) + " ÷ □ = " + fq(c) + "」表示:" + fq(a) + " 裡面包含 " + fq(c) + " 個 □(也就是把 " + fq(a) + " 平分成 " + fq(c) + " 份)。\n每份就是 □:□ = " + fq(a) + " ÷ " + fq(c) + " = " + r.answer + "。";
    },
    "fraction-div-fill-L5-08": function (r) {
      const eq = boxEq(r), lt = leftTok(eq), b = lt[0], c = lt[1], d = eqRight(eq), k = qDiv(c, b), X = qDiv(d, k); ck(X, r.answer);
      return "先除又乘,可以合在一起:□ ÷ " + fq(b) + " × " + fq(c) + " = □ × (" + fq(c) + " ÷ " + fq(b) + ")。\n" + fq(c) + " ÷ " + fq(b) + " = " + fq(k) + ",所以 □ × " + fq(k) + " = " + fq(d) + "。\n□ = " + fq(d) + " ÷ " + fq(k) + " = " + r.answer + "。";
    },
    "fraction-div-calc-L1-01": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.answer); },
    "fraction-div-calc-L2-02": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.answer); },
    "fraction-div-calc-L3-03": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.answer); },
    "fraction-div-calc-L4-04": function (r) { const p = exprParts(r); return divAlt(p[0], p[1], r.answer); },
    "fraction-div-calc-L5-05": function (r) {
      const t = tk(r.stem), a = t[0], b = t[1], c = t[2], sum = qAdd(qDiv(a, c), qDiv(b, c));
      ck(sum, r.answer);
      return "用分配律:先各自除以 " + fq(c) + "。\n" + fq(a) + " ÷ " + fq(c) + " = " + fq(qDiv(a, c)) + ",\n" + fq(b) + " ÷ " + fq(c) + " = " + fq(qDiv(b, c)) + "。\n相加:" + fq(qDiv(a, c)) + " + " + fq(qDiv(b, c)) + " = " + fq(sum) + "。答案是 " + r.answer + "。";
    },
    "fraction-div-calc-L1-06": function (r) { return mulBoxText(boxEq(r), r.answer) + "\n所以 □ = " + r.answer + "。"; },
    "fraction-div-calc-L3-07": function (r) {
      const eq = boxEq(r), a = leftTok(eq)[0], c = eqRight(eq), X = qDiv(a, c); ck(X, r.answer);
      return "「" + fq(a) + " ÷ □ = " + fq(c) + "」表示:" + fq(a) + " 平分成 " + fq(c) + " 份,每一份就是 □。\n□ = " + fq(a) + " ÷ " + fq(c) + " = " + r.answer + "。";
    },
    "fraction-div-calc-L5-08": function (r) {
      const eq = boxEq(r), lt = leftTok(eq), b = lt[0], c = lt[1], d = eqRight(eq), bc = qDiv(b, c), u = qSub(d, bc), X = qMul(u, c); ck(X, r.answer);
      return "用分配律拆開:(□ + " + fq(b) + ") ÷ " + fq(c) + " = □ ÷ " + fq(c) + " + " + fq(b) + " ÷ " + fq(c) + "。\n" + fq(b) + " ÷ " + fq(c) + " = " + fq(bc) + ",所以 □ ÷ " + fq(c) + " = " + fq(d) + " - " + fq(bc) + " = " + fq(u) + "。\n□ = " + fq(u) + " × " + fq(c) + " = " + r.answer + "。";
    },
    "fraction-div-word-L2-01": function (r) { const t = tk(r.stem); return divAlt(r.stem.match(/把 (.+?) 公升/)[1], String(t[1].n), r.answer + unitOf(r), r.answer); },
    "fraction-div-word-L3-02": function (r) { const t = tk(r.stem), N = t[0], d = t[1], c = Number(r.answer); ckEq(qMul(Q(c), d), N); return "用乘法想:每袋 " + fq(d) + " 公斤," + c + " 袋就是 " + c + " × " + fq(d) + " = " + fq(qMul(Q(c), d)) + " 公斤,正好是全部的 " + fq(N) + " 公斤。\n所以可以裝 " + r.answer + unitOf(r) + "。"; },
    "fraction-div-word-L4-03": function (r) { const t = tk(r.stem), A = t[0], d = t[1], v = Number(r.answer); if (!(qCmp(qMul(d, Q(v)), A) <= 0 && qCmp(qMul(d, Q(v + 1)), A) > 0)) throw new Error("explain2 與答案不一致"); return "列出整數倍:" + fq(d) + " × " + v + " = " + fq(qMul(d, Q(v))) + "(不超過 " + fq(A) + "),\n" + fq(d) + " × " + (v + 1) + " = " + fq(qMul(d, Q(v + 1))) + "(超過 " + fq(A) + ")。\n所以最多裝滿 " + r.answer + unitOf(r) + "。"; },
    "fraction-div-word-L4-04": function (r) {
      const t = tk(r.stem), N = t[0], f = t[1], k = t[2], g = qDiv(qSub(Q(1), f), k);
      ck(qMul(N, g), r.answer);
      return "先看每段占全長的幾分之幾:剩下的是全長的 " + fq(qSub(Q(1), f)) + ",平分成 " + fq(k) + " 段,每段是全長的 " + fq(g) + "。\n每段 = " + fq(N) + " × " + fq(g) + " = " + r.answer + unitOf(r) + "。";
    },
    "fraction-div-word-L5-05": function (r) {
      const t = tk(r.stem), f = t[0], R0 = t[1], rest = qSub(Q(1), f);
      ck(qMul(qDiv(R0, Q(f.d - f.n)), Q(f.d)), r.answer);
      return "畫線段圖:把全部平分成 " + f.d + " 份,倒出 " + f.n + " 份,剩 " + (f.d - f.n) + " 份。\n" + (f.d - f.n) + " 份是 " + fq(R0) + ",1 份 = " + fq(R0) + " ÷ " + (f.d - f.n) + " = " + fq(qDiv(R0, Q(f.d - f.n))) + "。\n全部 " + f.d + " 份 = " + fq(qDiv(R0, Q(f.d - f.n))) + " × " + f.d + " = " + r.answer + unitOf(r) + "。(剩下的是全部的 " + fq(rest) + ")";
    },
    "fraction-div-word-L4-06": function (r) {
      const t = tk(r.stem), f = t[0], R0 = t[1];
      ck(qMul(qDiv(R0, Q(f.d - f.n)), Q(f.d)), r.answer);
      return "畫線段圖:把原有的果汁平分成 " + f.d + " 份,倒出 " + f.n + " 份,剩 " + (f.d - f.n) + " 份。\n" + (f.d - f.n) + " 份是 " + fq(R0) + ",1 份 = " + fq(R0) + " ÷ " + (f.d - f.n) + " = " + fq(qDiv(R0, Q(f.d - f.n))) + ",全部 " + f.d + " 份 = " + r.answer + unitOf(r) + "。";
    }
  };


  /* PRE（解法一的方法說明） */
PRE["fraction-div-tf-L2-02"] = function () { return "方法:除以一個數,等於乘以它的倒數(分子、分母上下對調),再約成最簡。\n"; };
PRE["fraction-div-tf-L4-04"] = function () { return "方法:除以一個數,等於乘以它的倒數(分子、分母上下對調),再約成最簡。\n"; };
PRE["fraction-div-fill-L3-03"] = function () { return "方法:除以一個數,等於乘以它的倒數(分子、分母上下對調),再約成最簡。\n"; };
PRE["fraction-div-fill-L5-05"] = function () { return "方法:除以一個數,等於乘以它的倒數(分子、分母上下對調),再約成最簡。\n"; };
PRE["fraction-div-calc-L1-01"] = function () { return "方法:除以一個數,等於乘以它的倒數(分子、分母上下對調),再約成最簡。\n"; };
PRE["fraction-div-calc-L2-02"] = function () { return "方法:除以一個數,等於乘以它的倒數(分子、分母上下對調),再約成最簡。\n"; };
PRE["fraction-div-calc-L3-03"] = function () { return "方法:除以一個數,等於乘以它的倒數(分子、分母上下對調),再約成最簡。\n"; };
PRE["fraction-div-word-L2-01"] = function () { return "方法:除以一個數,等於乘以它的倒數(分子、分母上下對調),再約成最簡。\n"; };
PRE["fraction-div-word-L5-05"] = function () { return "方法:除以一個數,等於乘以它的倒數(分子、分母上下對調),再約成最簡。\n"; };
PRE["fraction-div-calc-L1-06"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["fraction-div-fill-L2-06"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["fraction-div-calc-L3-07"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["fraction-div-tf-L2-06"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["fraction-div-single-L5-07"] = function () { return "方法:把兩個式子左右兩邊分別相加,△ 就會一加一減互相抵消,先求出 □ 的 2 倍。\n"; };
PRE["fraction-div-calc-L5-05"] = function () { return "想法:括號裡先把兩個數相加,再除以最後的數。" + String.fromCharCode(10); };
PRE["fraction-div-word-L4-04"] = function () { return "想法:先算出剩下多少,再平均分成幾段。" + String.fromCharCode(10); };
PRE["fraction-div-calc-L5-08"] = function () { return "想法:括號裡的 □ 和已知的數是相加的關係,要把除法還原後再把加上去的數減掉。" + String.fromCharCode(10); };
  ExamBank.register(T, "fraction-div-basic", single.concat(multi, tf, fill, calc, word, boxes));
})();
