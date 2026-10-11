/* 題庫：mixed-ops 小數與分數四則混合運算、簡化計算（分配律等）。題庫工 B
   數字風格：整數、小數、分數、帶分數混合出現；全部用 kit.Q 精確運算。 */
(function () {
  "use strict";
  const K = window.ExamKit, Q = K.Q, qa = K.qAdd, qs = K.qSub, qm = K.qMul, qd = K.qDiv;
  const S = [];
  /* 輸出後處理：分數平方一律加括號；分母 > 60 的分數或 9 位以上數字視為不乾淨，重抽 */
  function fixSq(s) { return typeof s === "string" ? s.replace(/(\d+ \d+\/\d+|\d+\/\d+)²/g, "($1)²") : s; }
  function post(o) {
    ["stem", "explain", "trapNote"].forEach(function (f) { if (o[f] !== undefined) o[f] = fixSq(o[f]); });
    if (o.options) o.options = o.options.map(fixSq);
    if (typeof o.answer === "string" && o.stem && !/分數/.test(o.stem)) {
      const hm = o.answer.match(/(\d+)\/(\d+)$/);
      if (hm) { let dn = +hm[2]; while (dn % 2 === 0) dn /= 2; while (dn % 5 === 0) dn /= 5; if (dn !== 1) o.stem += "（請以分數作答）"; }
    }
    if (o.accepted) o.accepted = o.accepted.filter(function (a) { const mm = /(\d+)\/(\d+)$/.exec(a); return !(mm && +mm[2] > 100); });
    const all = [o.stem, o.explain, o.trapNote, o.answer, o.options ? o.options.join(" ") : ""].join(" ");
    const re = /(\d+)\/(\d+)/g; let m;
    while ((m = re.exec(all))) { if (+m[2] > 60) throw new Error("retry"); }
    if (/\d{9,}/.test(all)) throw new Error("retry");
    return o;
  }
  let INT = false;
  function add(id, type, level, tag, gen) {
    S.push({ id: "mixed-ops-" + id, type, level, tag, gen: function (k) {
      INT = k.int(0, 9) < 4;   /* 約四成的題目全用整數出題 */
      let e; for (let i = 0; i < 80; i++) { try { return post(gen(k)); } catch (x) { e = x; } } throw e;
    } });
  }
  function dg(q) { let d = q.d, a = 0, b = 0; while (d % 2 === 0) { d /= 2; a++; } while (d % 5 === 0) { d /= 5; b++; } return d === 1 ? Math.max(a, b) : 99; }
  function pos() { for (let i = 0; i < arguments.length; i++) { if (arguments[i].n <= 0) throw new Error("retry"); } }
  function dec4() { for (let i = 0; i < arguments.length; i++) { if (dg(arguments[i]) > 4) throw new Error("retry"); } }
  function I(n) { return Q(n, 1); }
  /* 顯示：整數直接寫；fl=dec 且有限小數→小數；fl=frac/mixed→帶分數；其餘有限小數優先 */
  function auto(q, fl) { if (q.d === 1) return String(q.n); if ((fl === "frac" || fl === "mixed") && q.d <= 20) return K.qMixed(q); if (dg(q) <= 4) return K.qDec(q); return K.qMixed(q); }
  function wrap(s) { return /[ \/]/.test(s) ? "(" + s + ")" : s; }
  function ex(x) { return wrap(auto(x.q, x.fl)); }       /* 算式中的數（分數加括號） */
  function dd(x) { return auto(x.q, x.fl); }              /* 敘述中的數 */
  function os(q, fl) { if (q.n <= 0) return null; if ((fl === "frac" || fl === "mixed") && q.d <= 20) return K.qMixed(q); if (dg(q) <= 4) return K.qDec(q); return q.d <= 20 ? K.qMixed(q) : null; }
  function sc(k, correct, cands, fl) {
    const c = os(correct, fl); if (c === null) throw new Error("retry");
    const w = k.distractors(c, cands.map(function (q) { return os(q, fl); }).filter(function (x) { return x !== null; }), 3);
    if (w.length < 3) throw new Error("retry");
    return { options: [c].concat(w), answer: 0 };
  }
  function mu(k, goods, bads) {
    const g = k.shuffle(goods).slice(0, k.int(2, 3)), b = k.shuffle(bads).slice(0, 2), all = g.concat(b);
    if (new Set(all).size !== all.length) throw new Error("retry");
    return { options: all, answer: g.map(function (_, i) { return i; }) };
  }
  function ans(q, fl) { return K.qAnswer(q, fl === "frac" || fl === "mixed" ? fl : "dec"); }
  /* 隨機數：{q, fl} */
  function N(k, flavors, lo, hi, dens, w) {
    const fl = INT ? "int" : k.flavor(flavors, w);
    return { q: k.randQ(fl, { min: lo, max: hi, dens: dens || [2, 4, 5, 8, 10], places: 1 }), fl: fl };
  }
  const ALL = ["int", "dec", "mixed", "frac"];
  const PAIRS = [["1/2", "0.5"], ["1/4", "0.25"], ["3/4", "0.75"], ["1/5", "0.2"], ["2/5", "0.4"], ["3/5", "0.6"], ["1/8", "0.125"], ["3/8", "0.375"], ["7/20", "0.35"], ["9/25", "0.36"], ["1 1/4", "1.25"], ["2 1/2", "2.5"], ["3 3/4", "3.75"], ["1 3/5", "1.6"], ["2 1/8", "2.125"], ["4 2/5", "4.4"]];
  const FR3 = [[1, 2], [3, 4], [2, 3], [3, 5], [5, 6], [4, 5], [1, 3], [2, 5], [3, 8], [5, 8]];
  function FQ(p) { return Q(p[0], p[1]); }
  /* 小於 1 的數：0.1~0.9 或常見真分數 */
  function SM(k, w) { if (INT) return { q: I(k.int(2, 5)), fl: "int" }; return k.flavor(["dec", "frac"], w || [3, 1]) === "dec" ? { q: Q(k.int(1, 9), 10), fl: "dec" } : { q: FQ(k.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5]])), fl: "frac" }; }

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const a = N(k, ["dec", "dec", "int"], 1, 4, [10, 5], [3, 3, 1]), f = N(k, ["frac", "mixed"], 1, 3, [2, 4, 5, 10]), v = qa(a.q, f.q); dec4(v);
    const c = sc(k, v, [qm(v, I(10)), qd(v, I(10)), qm(a.q, f.q), K.qSub(a.q, f.q).n > 0 ? K.qSub(a.q, f.q) : K.qSub(f.q, a.q), qa(a.q, qa(I(f.q.n), I(f.q.d)))], "dec");
    return Object.assign(c, { stem: "計算 " + dd(a) + " + " + ex(f) + "，結果是多少？",
      explain: "解析：" + ex(f) + " = " + auto(f.q, "dec") + "，" + dd(a) + " + " + auto(f.q, "dec") + " = " + auto(v, "dec") + "。小數與分數相加，先化成同一種形式。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const a = N(k, ["dec", "mixed", "int"], 1, 5, [2, 4, 5]), b = SM(k, [5, 1]), c0 = k.int(3, 12), fl = a.fl === "mixed" ? "mixed" : "dec";
    const v = qa(a.q, qm(b.q, I(c0))); dec4(v);
    const c = sc(k, v, [qm(qa(a.q, b.q), I(c0)), qm(qm(a.q, b.q), I(c0)), qa(qa(a.q, b.q), I(c0)), qa(qm(a.q, b.q), I(c0)), qa(qm(qm(a.q, b.q), I(c0)), I(c0))], fl);
    return Object.assign(c, { stem: "計算 " + dd(a) + " + " + ex(b) + " × " + c0 + "，結果是多少？",
      explain: "解析：先乘後加：" + ex(b) + " × " + c0 + " = " + auto(qm(b.q, I(c0)), fl) + "，" + dd(a) + " + " + auto(qm(b.q, I(c0)), fl) + " = " + auto(v, fl) + "。",
      trapNote: "由左到右先加（" + dd(a) + " + " + ex(b) + "）再乘 " + c0 + "，會得到 " + auto(qm(qa(a.q, b.q), I(c0)), fl) + "，是忽略「先乘除後加減」的錯誤。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    let i, j, l;
    do { i = k.int(0, 9); j = k.int(0, 9); l = k.int(0, 9); } while (i === j || j === l || i === l);
    const A = FQ(FR3[i]), B = FQ(FR3[j]), C = FQ(FR3[l]), res = qm(qd(A, B), C), fo = k.pick(["frac", "mixed"]);
    const c = sc(k, res, [qm(qm(A, B), C), qd(qd(A, B), C), qd(A, qm(B, C)), qm(qd(B, A), C), qd(qm(A, B), C), qd(qm(B, C), A)], fo);
    const sA = K.qFrac(A), sB = K.qFrac(B), sC = K.qFrac(C);
    return Object.assign(c, { stem: "計算 " + sA + " ÷ " + sB + " × " + sC + "，結果是多少？",
      explain: "解析：乘除同級由左到右。" + sA + " ÷ " + sB + " = " + sA + " × " + K.qFrac(qd(I(1), B)) + " = " + K.qFrac(qd(A, B)) + "，再 × " + sC + " = " + K.qFrac(res) + "。",
      trapNote: "除以分數要乘它的倒數；若把「÷」直接當成「×」會得到 " + K.qFrac(qm(qm(A, B), C)) + "，先算後面的乘法則得到 " + K.qFrac(qd(A, qm(B, C))) + "，都不對。" });
  });
  add("single-L3-02", "single", 3, "basic", function (k) {
    const x = N(k, ["dec", "dec", "mixed"], 1, 9, [2, 4, 5]), up = k.int(0, 1) === 1, v = qm(x.q, I(100)); dec4(v);
    const c = sc(k, v, [qm(x.q, I(99)), qm(x.q, I(101)), qm(x.q, I(10)), qm(x.q, I(1000))], "dec");
    return Object.assign(c, { stem: up ? "用簡便方法計算 " + dd(x) + " × 101 − " + dd(x) + "，結果是多少？" : "用簡便方法計算 " + dd(x) + " × 99 + " + dd(x) + "，結果是多少？",
      explain: up ? "解析：" + dd(x) + " × 101 − " + dd(x) + " × 1 = " + dd(x) + " × (101 − 1) = " + dd(x) + " × 100 = " + auto(v, "dec") + "。"
        : "解析：" + dd(x) + " × 99 + " + dd(x) + " × 1 = " + dd(x) + " × (99 + 1) = " + dd(x) + " × 100 = " + auto(v, "dec") + "。" });
  });
  add("single-L3-03", "single", 3, "trap", function (k) {
    const f = k.pick([[3, 4], [2, 5], [3, 5], [3, 2], [5, 4], [1, 2]]), tt = N(k, ["int", "dec", "mixed"], 2, 10, [2, 4], [2, 3, 3]), x = qm(tt.q, I(f[0])), res = qm(tt.q, I(f[1])); dec4(x, res);
    const c = sc(k, res, [qm(x, FQ(f)), qd(x, I(f[0] * f[1])), qm(x, I(f[0] * f[1])), qm(tt.q, I(f[0])), tt.q, qm(x, I(f[1])), qa(x, I(f[1]))], tt.fl === "mixed" ? "mixed" : "dec");
    return Object.assign(c, { stem: "計算 " + auto(x, tt.fl) + " ÷ " + f[0] + "/" + f[1] + "，結果是多少？",
      explain: "解析：除以分數等於乘它的倒數：" + auto(x, tt.fl) + " × " + f[1] + "/" + f[0] + " = " + auto(x, tt.fl) + " ÷ " + f[0] + " × " + f[1] + " = " + auto(tt.q, tt.fl) + " × " + f[1] + " = " + auto(res, tt.fl) + "。",
      trapNote: "除以 " + f[0] + "/" + f[1] + " 時沒有倒過來，直接乘 " + f[0] + "/" + f[1] + "，會得到 " + auto(qm(x, FQ(f)), "dec") + "。" });
  });
  add("single-L4-01", "single", 4, "extend", function (k) {
    const f = FQ(k.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5]])), d = Q(k.pick([25, 50, 75, 20, 40]), 100), m = I(k.pick([20, 40])), c0 = N(k, ["int", "dec"], 1, 5, [2], [2, 2]);
    const s = qa(f, d), v = qs(qm(s, m), c0.q); pos(v); dec4(v);
    const c = sc(k, v, [qa(qm(s, m), c0.q), qm(s, qs(m, c0.q)), qs(qa(f, qm(d, m)), c0.q), qm(s, m), qs(qa(s, m), c0.q)], "dec");
    return Object.assign(c, { stem: "計算 (" + K.qFrac(f) + " + " + auto(d, "dec") + ") × " + m.n + " − " + dd(c0) + "，結果是多少？",
      explain: "解析：括號內 " + auto(f, "dec") + " + " + auto(d, "dec") + " = " + auto(s, "dec") + "；" + auto(s, "dec") + " × " + m.n + " = " + auto(qm(s, m), "dec") + "；再減 " + dd(c0) + " 得 " + auto(v, "dec") + "。" });
  });
  add("single-L4-02", "single", 4, "basic", function (k) {
    const p = k.pick([[Q(4, 5), Q(5, 4)], [Q(1, 4), I(4)], [Q(1, 2), I(2)], [Q(5, 2), Q(2, 5)], [Q(2, 3), Q(3, 2)], [Q(3, 4), Q(4, 3)]]), c0 = N(k, ["dec", "mixed", "int"], 2, 9, [2, 4, 5]);
    const sa = p[0].d === 1 || dg(p[0]) <= 4 ? auto(p[0], "dec") : K.qFrac(p[0]), sb = p[1].d === 1 || dg(p[1]) <= 4 ? auto(p[1], "dec") : K.qFrac(p[1]);
    const c = sc(k, c0.q, [qm(c0.q, I(10)), qd(c0.q, I(10)), qm(c0.q, p[0]), qm(c0.q, p[1]), qm(c0.q, I(2))], c0.fl === "mixed" ? "mixed" : "dec");
    return Object.assign(c, { stem: "計算 " + wrap(sa) + " × " + wrap(sb) + " × " + ex(c0) + "，用簡便方法最快，結果是多少？",
      explain: "解析：" + sa + " × " + sb + " = 1，所以 1 × " + dd(c0) + " = " + dd(c0) + "。先把乘起來剛好是 1 的兩個數結合。" });
  });
  add("single-L5-01", "single", 5, "extend", function (k) {
    if (k.int(0, 1) === 0) {
      const dv = k.pick([Q(2, 5), Q(1, 2), Q(1, 4), Q(3, 4)]), ad = SM(k, [1, 1]), j = N(k, ["int", "dec"], 2, 12, [2], [2, 2]);
      const x = qm(dv, j.q), v = qa(j.q, ad.q); dec4(x, v); pos(x);
      const c = sc(k, x, [qm(v, dv), qm(qa(v, ad.q), dv), qs(v, ad.q), qs(qd(v, dv), ad.q), qa(qm(v, dv), ad.q), qm(j.q, I(1))], "dec");
      return Object.assign(c, { stem: "□ ÷ " + wrap(auto(dv, "dec")) + " + " + ex(ad) + " = " + auto(v, "dec") + "，□ 是多少？",
        explain: "解析：逆向推回去：先減 " + dd(ad) + "：" + auto(v, "dec") + " − " + dd(ad) + " = " + auto(j.q, "dec") + "，再乘 " + auto(dv, "dec") + "：" + auto(j.q, "dec") + " × " + auto(dv, "dec") + " = " + auto(x, "dec") + "。" });
    }
    const s = N(k, ["frac", "dec", "mixed"], 1, 3, [2, 4, 5]), m = k.pick([2, 4, 5, 10]), inc = N(k, ["int", "dec"], 2, 6, [2], [2, 2]), x = qa(s.q, inc.q), v = qm(inc.q, I(m)); dec4(x, v); pos(v);
    const c = sc(k, x, [qs(qd(v, I(m)), s.q).n > 0 ? qs(qd(v, I(m)), s.q) : qa(qd(v, I(m)), qm(s.q, I(2))), qa(qm(v, I(m)), s.q), qd(v, I(m)), qs(qm(v, I(m)), s.q), qs(v, s.q).n > 0 ? qs(v, s.q) : qa(v, I(m))], s.fl === "mixed" ? "mixed" : "dec");
    return Object.assign(c, { stem: "(□ − " + ex(s) + ") × " + m + " = " + auto(v, "dec") + "，□ 是多少？",
      explain: "解析：逆向推回去：先除以 " + m + "：" + auto(v, "dec") + " ÷ " + m + " = " + auto(inc.q, "dec") + "，再加 " + dd(s) + "：" + auto(inc.q, "dec") + " + " + dd(s) + " = " + auto(x, "dec") + "。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const a = N(k, ["int", "dec"], 2, 9, [2]), b = N(k, ["int", "dec"], 2, 9, [2]), c0 = N(k, ["int", "dec"], 2, 9, [2]);
    const A = ex(a), B = ex(b), C = ex(c0);
    const c = mu(k,
      [A + " + " + B + " × " + C + " 要先算 " + B + " × " + C, A + " × (" + B + " + " + C + ") 要先算括號裡的 " + B + " + " + C, A + " − " + B + " ÷ " + C + " 要先算 " + B + " ÷ " + C],
      [A + " + " + B + " × " + C + " 要先算 " + A + " + " + B, A + " − " + B + " + " + C + " 要先算 " + B + " + " + C, A + " ÷ " + B + " × " + C + " 要先算 " + B + " × " + C]);
    return Object.assign(c, { stem: "關於四則運算的順序，選出所有正確的敘述。",
      explain: "解析：先乘除後加減；有括號先算括號；同級運算（+ − 或 × ÷）由左到右。" });
  });
  add("multi-L2-01", "multi", 2, "basic", function (k) {
    const ps = k.shuffle(PAIRS).slice(0, 5);
    const goods = [ps[0][0] + " = " + ps[0][1], ps[1][0] + " = " + ps[1][1], ps[2][0] + " = " + ps[2][1]];
    const bads = [ps[3][0] + " = " + ps[4][1], ps[4][0] + " = " + ps[3][1]];
    return Object.assign(mu(k, goods, bads), { stem: "下列分數與小數的互換，選出所有正確的。",
      explain: "解析：分數化小數是分子 ÷ 分母，例如 " + ps[0][0] + " = " + ps[0][1] + "、" + ps[1][0] + " = " + ps[1][1] + "；" + ps[3][0] + " 應該是 " + ps[3][1] + "。" });
  });
  add("multi-L3-01", "multi", 3, "basic", function (k) {
    const a = N(k, ["int", "dec"], 12, 30, [2], [2, 3]), b = N(k, ["int", "dec"], 5, 11, [2], [2, 3]), c0 = N(k, ["int", "dec", "frac"], 2, 9, [2, 4], [3, 2, 1]);
    pos(qs(a.q, b.q));
    const A = ex(a), B = ex(b), C = ex(c0);
    const c = mu(k,
      [A + " × " + C + " + " + B + " × " + C + " = (" + A + " + " + B + ") × " + C, C + " × (" + A + " − " + B + ") = " + C + " × " + A + " − " + C + " × " + B, A + " × " + C + " − " + B + " × " + C + " = (" + A + " − " + B + ") × " + C],
      [A + " × " + C + " + " + B + " × " + C + " = " + A + " × " + C + " + " + B, C + " × (" + A + " + " + B + ") = " + C + " × " + A + " + " + B, A + " ÷ (" + B + " + " + C + ") = " + A + " ÷ " + B + " + " + A + " ÷ " + C]);
    return Object.assign(c, { stem: "關於分配律與簡便計算，選出所有正確的算式。",
      explain: "解析：乘法對加減有分配律，例如 " + A + " × " + C + " + " + B + " × " + C + " = (" + A + " + " + B + ") × " + C + "；括號外的數要乘括號內每一項。但除法的分母部分不能這樣拆。" });
  });
  add("multi-L4-01", "multi", 4, "trap", function (k) {
    const a = N(k, ["int", "dec"], 30, 80, [2], [2, 3]), b = N(k, ["int", "dec", "frac"], 2, 18, [2, 4], [2, 3, 1]), c0 = N(k, ["int", "dec", "frac"], 2, 14, [2, 4], [2, 3, 1]);
    const A = ex(a), B = ex(b), C = ex(c0);
    const c = mu(k,
      [A + " ÷ (" + B + " × " + C + ") = " + A + " ÷ " + B + " ÷ " + C, A + " − (" + B + " + " + C + ") = " + A + " − " + B + " − " + C, A + " − (" + B + " − " + C + ") = " + A + " − " + B + " + " + C],
      [A + " ÷ (" + B + " × " + C + ") = " + A + " ÷ " + B + " × " + C, A + " − (" + B + " + " + C + ") = " + A + " − " + B + " + " + C, A + " − (" + B + " − " + C + ") = " + A + " − " + B + " − " + C]);
    return Object.assign(c, { stem: "拆括號時要小心符號，選出所有正確的等式。",
      explain: "解析：括號前是「−」或「÷」時，拆括號後括號內的運算要變號，例如：− (" + B + " + " + C + ") = − " + B + " − " + C + "；− (" + B + " − " + C + ") = − " + B + " + " + C + "；÷ (" + B + " × " + C + ") = ÷ " + B + " ÷ " + C + "。",
      trapNote: "括號前面是減號或除號，拆括號後裡面的「+/−」「×/÷」都要「變號」，直接照抄是最常見的錯誤。" });
  });
  add("multi-L4-02", "multi", 4, "extend", function (k) {
    const n = N(k, ["int", "dec", "mixed"], 4, 40, [2, 4], [2, 3, 2]), A = ex(n);
    const c = mu(k,
      [A + " × 0.25 = " + A + " ÷ 4", A + " × 0.5 = " + A + " ÷ 2", A + " ÷ 0.25 = " + A + " × 4", A + " ÷ 0.1 = " + A + " × 10", A + " × 1.25 = " + A + " + " + A + " ÷ 4"],
      [A + " × 0.25 = " + A + " ÷ 2", A + " ÷ 0.5 = " + A + " ÷ 2", A + " ÷ 0.1 = " + A + " ÷ 10", A + " × 0.2 = " + A + " ÷ 2", A + " × 1.5 = " + A + " + " + A + " ÷ 4"]);
    return Object.assign(c, { stem: "小數與分數、乘法與除法可以互相轉換，選出所有正確的等式。",
      explain: "解析：乘 0.25 就是除以 4，乘 0.5 就是除以 2；除以 0.25 就是乘 4，除以 0.1 就是乘 10；× 1.25 = × (1 + 1/4)。" });
  });

  /* ---------- tf ---------- */
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const i = k.int(0, PAIRS.length - 1), p = PAIRS[i], ok = k.int(0, 1) === 1;
    const other = PAIRS[(i + k.int(1, PAIRS.length - 1)) % PAIRS.length];
    return { stem: p[0] + " = " + (ok ? p[1] : other[1]), answer: ok,
      explain: "解析：" + p[0] + " 化成小數是 " + p[1] + "（分子 ÷ 分母）。" + (ok ? "所以正確。" : "所以寫成 " + other[1] + " 是錯的。") };
  });
  add("tf-L2-01", "tf", 2, "trap", function (k) {
    const a = N(k, ["dec", "mixed", "int"], 5, 20, [2, 4]), b = N(k, ["int", "dec"], 2, 9, [2], [2, 2]), c0 = k.int(2, 9), ok = k.int(0, 1) === 1;
    const t = qa(a.q, qm(b.q, I(c0))), f = qm(qa(a.q, b.q), I(c0)); dec4(t, f);
    const fl = a.fl === "mixed" ? "mixed" : "dec";
    return { stem: dd(a) + " + " + ex(b) + " × " + c0 + " = " + auto(ok ? t : f, fl), answer: ok,
      explain: "解析：先乘後加：" + ex(b) + " × " + c0 + " = " + auto(qm(b.q, I(c0)), fl) + "，" + dd(a) + " + " + auto(qm(b.q, I(c0)), fl) + " = " + auto(t, fl) + "。",
      trapNote: "(" + dd(a) + " + " + ex(b) + ") × " + c0 + " = " + auto(f, fl) + " 是「由左到右」算的結果，沒有先乘除後加減。" };
  });
  add("tf-L3-01", "tf", 3, "basic", function (k) {
    const x = N(k, ["int", "dec", "frac"], 2, 9, [2, 4], [3, 3, 1]), y = N(k, ["int", "dec"], 10, 30, [2], [2, 3]), z = N(k, ["int", "dec"], 5, 20, [2], [2, 3]), ok = k.int(0, 1) === 1;
    const X = ex(x), Y = ex(y), Z = ex(z);
    return { stem: X + " × " + Y + " + " + X + " × " + Z + " = " + X + " × " + (ok ? "(" + Y + " + " + Z + ")" : Y + " + " + Z), answer: ok,
      explain: "解析：分配律 " + X + " × " + Y + " + " + X + " × " + Z + " = " + X + " × (" + Y + " + " + Z + ")。" + (ok ? "" : "右邊沒有括號，只有 " + Y + " 乘 " + X + "，" + Z + " 沒有乘，所以錯誤。") };
  });
  add("tf-L3-02", "tf", 3, "trap", function (k) {
    const f = k.pick([[1, 2], [3, 4], [2, 5], [3, 5], [3, 2], [5, 4], [5, 3], [7, 4]]), x = N(k, ["int", "dec", "mixed"], 2, 12, [2, 4], [2, 3, 2]), big = k.int(0, 1) === 1, less = f[0] < f[1];
    const truth = big ? less : !less;
    return { stem: dd(x) + " ÷ " + f[0] + "/" + f[1] + " 的商會比 " + dd(x) + " " + (big ? "大" : "小") + "。", answer: truth,
      explain: "解析：除以 " + f[0] + "/" + f[1] + " 就是乘 " + f[1] + "/" + f[0] + "；" + f[1] + "/" + f[0] + (less ? " 大於 1，所以商比原數大。" : " 小於 1，所以商比原數小。"),
      trapNote: "「除法一定越除越小」只在除以大於 1 的數時成立；除以小於 1 的數（如 " + f[0] + "/" + f[1] + (less ? "" : "，這個是大於 1") + "）結果會變大。" };
  });
  add("tf-L4-01", "tf", 4, "trap", function (k) {
    const a = N(k, ["int", "dec"], 30, 60, [2], [2, 3]), b = N(k, ["int", "dec", "mixed"], 10, 19, [2, 4], [2, 3, 2]), c0 = N(k, ["int", "dec"], 2, 7, [2], [2, 2]), ok = k.int(0, 1) === 1;
    const t = qa(qs(a.q, b.q), c0.q), f = qs(qs(a.q, b.q), c0.q); pos(t, f); dec4(t, f);
    const fl = b.fl === "mixed" ? "mixed" : "dec";
    return { stem: dd(a) + " − (" + dd(b) + " − " + dd(c0) + ") = " + auto(ok ? t : f, fl), answer: ok,
      explain: "解析：先算括號：" + dd(b) + " − " + dd(c0) + " = " + auto(qs(b.q, c0.q), fl) + "，" + dd(a) + " − " + auto(qs(b.q, c0.q), fl) + " = " + auto(t, fl) + "。",
      trapNote: "拆括號時括號前是「−」，括號內的減號要變成加號：" + dd(a) + " − " + dd(b) + " + " + dd(c0) + "；寫成 − " + dd(c0) + " 就是 " + auto(f, fl) + "，錯。" };
  });
  add("tf-L5-01", "tf", 5, "extend", function (k) {
    const mult = k.pick([Q(6, 5), Q(3, 2), Q(5, 2), Q(3, 4), Q(2, 5)]), x = N(k, ["int", "dec", "mixed"], 5, 40, [2, 4, 5], [2, 3, 2]), v = qm(x.q, mult), ok = k.int(0, 1) === 1;
    const wrong = qm(v, mult); dec4(v, wrong, x.q);
    const fl = x.fl === "mixed" ? "mixed" : "dec";
    return { stem: "某數乘 " + auto(mult, "dec") + " 的積是 " + auto(v, fl) + "，所以這個數是 " + auto(ok ? x.q : wrong, fl) + "。", answer: ok,
      explain: "解析：逆向用除法：" + auto(v, fl) + " ÷ " + auto(mult, "dec") + " = " + auto(x.q, fl) + "。" + (ok ? "所以正確。" : "敘述中的 " + auto(wrong, fl) + " 是把 " + auto(v, fl) + " 再乘 " + auto(mult, "dec") + " 得到的，方向反了。") };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const a = N(k, ["dec", "mixed", "int"], 1, 5, [2, 4, 5], [3, 2, 1]), b = SM(k, [1, 1]), v = qm(a.q, b.q); dec4(v);
    return Object.assign({ stem: dd(a) + " × " + ex(b) + " = （　）",
      explain: "解析：" + dd(a) + " × " + ex(b) + " = " + auto(v, "dec") + "。" }, ans(v, a.fl === "mixed" ? "mixed" : "dec"));
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const a = N(k, ["dec", "mixed"], 1, 4, [2, 4, 5], [3, 2]), f = N(k, ["frac", "mixed"], 1, 3, [2, 4, 5, 10]), v = qa(a.q, f.q); dec4(v);
    return Object.assign({ stem: dd(a) + " + " + ex(f) + " = （　）（可寫小數或分數）",
      explain: "解析：" + ex(f) + " = " + auto(f.q, "dec") + "，" + dd(a) + " + " + auto(f.q, "dec") + " = " + auto(v, "dec") + "。" }, ans(v, "dec"));
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const a = N(k, ["int", "dec", "mixed"], 10, 30, [2, 4], [2, 3, 2]), b = N(k, ["dec", "int"], 1, 3, [2], [3, 1]), c0 = k.int(2, 8) * 2, e = INT ? I(k.pick([2, 4, 5])) : k.pick([Q(1, 2), Q(1, 5), Q(2, 5), Q(1, 4)]), j = k.int(2, 9), d = qm(e, I(j));
    const v = qs(qa(a.q, qm(b.q, I(c0))), I(j)); pos(v); dec4(v);
    return Object.assign({ stem: dd(a) + " + " + ex(b) + " × " + c0 + " − " + auto(d, "dec") + " ÷ " + wrap(auto(e, "dec")) + " = （　）",
      explain: "解析：先乘除：" + ex(b) + " × " + c0 + " = " + auto(qm(b.q, I(c0)), "dec") + "，" + auto(d, "dec") + " ÷ " + auto(e, "dec") + " = " + j + "；再由左到右：" + dd(a) + " + " + auto(qm(b.q, I(c0)), "dec") + " − " + j + " = " + auto(v, "dec") + "。",
      trapNote: "先加減再乘除是最常見的錯誤，例如先算 " + dd(a) + " + " + ex(b) + "；要先把兩個乘除算完。" }, ans(v, a.fl === "mixed" ? "mixed" : "dec"));
  });
  add("fill-L3-02", "fill", 3, "basic", function (k) {
    const p = INT ? k.pick([[I(25), I(4), I(100)], [I(5), I(2), I(10)], [I(2), I(5), I(10)], [I(4), I(25), I(100)]]) : k.pick([[Q(25, 2), Q(4, 5), I(10)], [I(25), Q(2, 5), I(10)], [Q(1, 8), I(8), I(1)], [Q(5, 2), I(4), I(10)], [Q(5, 4), I(8), I(10)], [Q(1, 4), I(4), I(1)], [Q(1, 2), I(2), I(1)]]);
    const x = N(k, ["int", "dec", "mixed"], 3, 29, [2, 4], [3, 3, 2]), v = qm(x.q, p[2]); dec4(v);
    return Object.assign({ stem: "用簡便方法計算：" + dd(x) + " × " + wrap(auto(p[0], "dec")) + " × " + wrap(auto(p[1], "dec")) + " = （　）",
      explain: "解析：先算 " + auto(p[0], "dec") + " × " + auto(p[1], "dec") + " = " + auto(p[2], "dec") + "，再 " + dd(x) + " × " + auto(p[2], "dec") + " = " + auto(v, "dec") + "。（乘法交換、結合律）" }, ans(v, x.fl === "mixed" ? "mixed" : "dec"));
  });
  add("fill-L4-01", "fill", 4, "trap", function (k) {
    const a = N(k, ["int", "dec"], 30, 60, [2], [2, 3]), b = N(k, ["int", "dec", "mixed"], 2, 6, [2, 4], [2, 3, 2]), c0 = N(k, ["int", "dec"], 2, 6, [2], [2, 2]), d = k.pick([Q(1, 2), I(2), Q(3, 2)]);
    const bc = qa(b.q, c0.q), v = qs(a.q, qm(bc, d)); pos(v); dec4(v);
    const wrong = qm(qs(qs(a.q, b.q), c0.q), d);
    return Object.assign({ stem: dd(a) + " − (" + dd(b) + " + " + dd(c0) + ") × " + wrap(auto(d, "dec")) + " = （　）",
      explain: "解析：先算括號 " + dd(b) + " + " + dd(c0) + " = " + auto(bc, "dec") + "；再乘 " + auto(d, "dec") + " 得 " + auto(qm(bc, d), "dec") + "；最後 " + dd(a) + " − " + auto(qm(bc, d), "dec") + " = " + auto(v, "dec") + "。",
      trapNote: "括號算完還要先乘再減；若直接 " + dd(a) + " − " + auto(bc, "dec") + "，再乘 " + auto(d, "dec") + "，會得到 " + auto(wrong, "dec") + "。" }, ans(v, b.fl === "mixed" ? "mixed" : "dec"));
  });
  add("fill-L4-02", "fill", 4, "extend", function (k) {
    const cs = k.shuffle([["1/2", Q(1, 2)], ["1/4", Q(1, 4)], ["3/4", Q(3, 4)], ["0.5", Q(1, 2)], ["0.25", Q(1, 4)], ["0.75", Q(3, 4)]]).slice(0, 3), x = N(k, ["int", "dec", "mixed"], 4, 60, [2, 4], [3, 2, 2]);
    const sum = cs.reduce(function (s, c) { return qa(s, c[1]); }, I(0)), v = qm(sum, x.q); dec4(v);
    const X = ex(x);
    return Object.assign({ stem: "用簡便方法計算：" + X + " × " + cs[0][0] + " + " + X + " × " + cs[1][0] + " + " + X + " × " + cs[2][0] + " = （　）",
      explain: "解析：提出 " + dd(x) + "：" + dd(x) + " × (" + cs[0][0] + " + " + cs[1][0] + " + " + cs[2][0] + ") = " + dd(x) + " × " + auto(sum, "dec") + " = " + auto(v, "dec") + "。" }, ans(v, x.fl === "mixed" ? "mixed" : "dec"));
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const m = k.pick([Q(3, 4), Q(3, 5), Q(2, 5), Q(5, 4)]), cc = k.pick([Q(1, 2), Q(1, 4), Q(3, 2)]), x = N(k, ["int", "dec", "mixed"], 2, 30, [2, 4], [3, 2, 2]);
    const v = qa(qm(x.q, m), cc); dec4(v, x.q);
    const ms = k.int(0, 1) ? K.qFrac(m) : auto(m, "dec"), cs2 = k.int(0, 1) ? K.qFrac(cc) : auto(cc, "dec");
    return Object.assign({ stem: "□ × " + wrap(ms) + " + " + wrap(cs2) + " = " + auto(v, "dec") + "，□ = （　）",
      explain: "解析：逆向：" + auto(v, "dec") + " − " + cs2 + " = " + auto(qs(v, cc), "dec") + "，再 ÷ " + ms + " = " + dd(x) + "。" }, ans(x.q, x.fl === "mixed" ? "mixed" : "dec"));
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const a = N(k, ["dec", "mixed", "int"], 1, 5, [2, 4, 5], [3, 2, 1]), b = k.int(2, 9), c0 = N(k, ["dec", "frac"], 1, 5, [2, 4], [3, 1]), v = qa(qm(a.q, I(b)), c0.q); dec4(v);
    return Object.assign({ stem: ex(a) + " × " + b + " + " + ex(c0),
      explain: "解析：先乘 " + dd(a) + " × " + b + " = " + auto(qm(a.q, I(b)), "dec") + "，再加 " + dd(c0) + " = " + auto(v, "dec") + "。" }, ans(v, a.fl === "mixed" ? "mixed" : "dec"));
  });
  add("calc-L2-01", "calc", 2, "trap", function (k) {
    const a = N(k, ["int", "dec", "mixed"], 20, 40, [2, 4], [2, 3, 2]), b0 = INT ? I(k.pick([2, 4, 5])) : k.pick([Q(1, 5), Q(2, 5), Q(1, 2), Q(1, 4)]), j = k.int(2, 9), b = qm(b0, I(j)), d = N(k, ["dec", "mixed", "int"], 1, 4, [2, 4], [3, 2, 1]), e = k.int(2, 8);
    const v = qa(qs(a.q, I(j)), qm(d.q, I(e))); pos(v); dec4(v);
    return Object.assign({ stem: dd(a) + " − " + auto(b, "dec") + " ÷ " + wrap(auto(b0, "dec")) + " + " + ex(d) + " × " + e,
      explain: "解析：先乘除：" + auto(b, "dec") + " ÷ " + auto(b0, "dec") + " = " + j + "，" + ex(d) + " × " + e + " = " + auto(qm(d.q, I(e)), "dec") + "；再由左到右：" + dd(a) + " − " + j + " + " + auto(qm(d.q, I(e)), "dec") + " = " + auto(v, "dec") + "。",
      trapNote: "若先算 " + dd(a) + " − " + auto(b, "dec") + "，會把運算順序弄錯；也要注意減號後面是「商」而不是「商 + 積」。" }, ans(v, a.fl === "mixed" ? "mixed" : "dec"));
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const f = FQ(k.pick(FR3)), d = Q(k.pick([50, 25, 75, 20, 40]), 100), g = FQ(k.pick(FR3)), v = qa(f, qm(d, g));
    const o = K.qAnswer(v, "dec");
    return Object.assign({ stem: K.qFrac(f) + " + " + auto(d, "dec") + " × " + K.qFrac(g) + (K.qIsTerminating(v) ? "（答案可寫分數或小數）" : "（請以分數作答）"),
      explain: "解析：先乘：" + auto(d, "dec") + " × " + K.qFrac(g) + " = " + K.qFrac(qm(d, g)) + "；再加 " + K.qFrac(f) + " = " + K.qFrac(v) + "。" }, o);
  });
  add("calc-L3-02", "calc", 3, "basic", function (k) {
    const a = N(k, ["dec", "mixed"], 1, 9, [2, 4, 5], [3, 2]), tot = I(k.pick([10, 5, 20])), b = qs(tot, a.q), c0 = N(k, ["dec", "mixed", "int"], 1, 8, [2, 4], [3, 2, 1]); pos(b);
    const v = qm(tot, c0.q); dec4(v);
    return Object.assign({ stem: "用簡便方法計算：" + ex(a) + " × " + ex(c0) + " + " + wrap(auto(b, a.fl === "mixed" ? "mixed" : "dec")) + " × " + ex(c0),
      explain: "解析：提出 " + dd(c0) + "：(" + dd(a) + " + " + auto(b, a.fl === "mixed" ? "mixed" : "dec") + ") × " + dd(c0) + " = " + tot.n + " × " + dd(c0) + " = " + auto(v, "dec") + "。" }, ans(v, c0.fl === "mixed" ? "mixed" : "dec"));
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const b = INT ? I(k.pick([2, 4, 5])) : k.pick([Q(1, 5), Q(2, 5), Q(1, 2), Q(1, 4), Q(4, 5)]), j = k.int(2, 12), a = qm(b, I(j)), c0 = N(k, ["dec", "mixed", "int"], 1, 4, [2, 4], [3, 2, 1]), v = qm(I(j), c0.q); dec4(v);
    return Object.assign({ stem: auto(a, "dec") + " ÷ " + wrap(auto(b, "dec")) + " × " + ex(c0),
      explain: "解析：乘除同級由左到右：" + auto(a, "dec") + " ÷ " + auto(b, "dec") + " = " + j + "，" + j + " × " + dd(c0) + " = " + auto(v, "dec") + "。",
      trapNote: "若先算 " + auto(b, "dec") + " × " + dd(c0) + " = " + auto(qm(b, c0.q), "dec") + "，再用 " + auto(a, "dec") + " 去除，會得到 " + auto(qd(a, qm(b, c0.q)), "dec") + "，是錯的；同級運算不能隨意調換順序。" }, ans(v, c0.fl === "mixed" ? "mixed" : "dec"));
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const cs = k.shuffle([["1/2", Q(1, 2)], ["1/4", Q(1, 4)], ["3/4", Q(3, 4)], ["0.5", Q(1, 2)], ["0.25", Q(1, 4)], ["0.75", Q(3, 4)]]).slice(0, 3), x = N(k, ["int", "dec", "mixed"], 4, 60, [2, 4], [3, 2, 2]);
    const sum = cs.reduce(function (s, c) { return qa(s, c[1]); }, I(0)), v = qm(sum, x.q); dec4(v);
    const X = ex(x);
    return Object.assign({ stem: X + " × " + cs[0][0] + " + " + X + " × " + cs[1][0] + " + " + X + " × " + cs[2][0] + "（可用提出公因數簡化）",
      explain: "解析：" + dd(x) + " × (" + cs[0][0] + " + " + cs[1][0] + " + " + cs[2][0] + ") = " + dd(x) + " × " + auto(sum, "dec") + " = " + auto(v, "dec") + "。" }, ans(v, x.fl === "mixed" ? "mixed" : "dec"));
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const kg = N(k, ["dec", "mixed"], 1, 5, [2], [3, 2]), price = N(k, ["int", "dec"], 12, 48, [2], [3, 1]), total = qm(kg.q, price.q); pos(total); dec4(total);
    const pay = I(Math.ceil(total.n / total.d / 50 + 0.01) * 50), ch = qs(pay, total);
    return Object.assign({ stem: "蘋果每公斤 " + dd(price) + " 元，媽媽買了 " + dd(kg) + " 公斤，付了 " + pay.n + " 元，應該找回多少元？", units: ["元"],
      explain: "解析：蘋果共 " + dd(price) + " × " + dd(kg) + " = " + auto(total, "dec") + " 元；找回 " + pay.n + " − " + auto(total, "dec") + " = " + auto(ch, "dec") + "（元）。" }, ans(ch, "dec"));
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const f = N(k, ["frac", "mixed"], 1, 3, [2, 4, 5]), d = N(k, ["dec"], 1, 3, [10], [1]), v = qa(f.q, d.q); dec4(v);
    return Object.assign({ stem: "一條緞帶長 " + dd(f) + " 公尺，另一條長 " + dd(d) + " 公尺，兩條接起來共幾公尺？", units: ["公尺", "m"],
      explain: "解析：" + dd(f) + " = " + auto(f.q, "dec") + " 公尺，" + auto(f.q, "dec") + " + " + dd(d) + " = " + auto(v, "dec") + "（公尺）。" }, ans(v, f.fl === "mixed" ? "mixed" : "dec"));
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const f = INT ? [k.pick([2, 3, 4]), 1] : k.pick([[1, 4], [3, 10], [3, 5], [3, 4], [2, 5], [1, 2]]), j = k.int(4, 12), tot = qm(Q(f[0], f[1]), I(j)), fl = k.flavor(["dec", "mixed"]); dec4(tot);
    const wrong = qm(tot, Q(f[0], f[1])), cup = f[1] === 1 ? String(f[0]) : f[0] + "/" + f[1], rec = f[1] === 1 ? "1/" + f[0] : f[1] + "/" + f[0];
    return Object.assign({ stem: "一瓶果汁有 " + auto(tot, fl) + " 公升，每個杯子倒 " + cup + " 公升，可以倒滿幾杯？", answer: String(j), units: ["杯"],
      explain: "解析：" + auto(tot, fl) + " ÷ " + cup + " = " + auto(tot, fl) + " × " + rec + " = " + j + "（杯）。",
      trapNote: "總量要「除以」每杯的量；若乘 " + cup + " 會得到 " + auto(wrong, "dec") + "，杯數不可能是這樣。" });
  });
  add("word-L4-01", "word", 4, "extend", function (k) {
    const f = FQ(k.pick([[2, 5], [1, 4], [3, 10], [1, 5]])), d = Q(k.pick([50, 40, 20, 25]), 100), x = I(400 * k.int(1, 3));
    const rem = qm(qm(x, qs(I(1), f)), qs(I(1), d)); dec4(rem);
    return Object.assign({ stem: "小芸有 " + x.n + " 元，先用 " + K.qFrac(f) + " 買書，再用剩下的錢的 " + auto(d, "dec") + " 買文具，最後還剩多少元？", units: ["元"],
      explain: "解析：買書後剩 " + x.n + " × (1 − " + K.qFrac(f) + ") = " + K.qFrac(qm(x, qs(I(1), f))) + " 元；再剩下的 (1 − " + auto(d, "dec") + ") 倍：最後剩 " + auto(rem, "dec") + "（元）。" }, ans(rem, "dec"));
  });
  add("word-L4-02", "word", 4, "trap", function (k) {
    const x2 = N(k, ["int", "dec"], 200, 600, [2], [2, 3]).q, b2 = N(k, ["int", "dec"], 20, 50, [2], [2, 3]).q, v = qs(qm(x2, Q(4, 5)), b2); pos(v); dec4(v);
    const wrong = qm(qs(x2, b2), Q(4, 5));
    return Object.assign({ stem: "一件外套標價 " + auto(x2, "dec") + " 元，先打 8 折，結帳時再用一張 " + auto(b2, "dec") + " 元的折價券折抵，要付多少元？", units: ["元"],
      explain: "解析：先打折：" + auto(x2, "dec") + " × 0.8 = " + auto(qm(x2, Q(4, 5)), "dec") + " 元；再折抵：" + auto(qm(x2, Q(4, 5)), "dec") + " − " + auto(b2, "dec") + " = " + auto(v, "dec") + "（元）。",
      trapNote: "若先扣折價券再打 8 折：(" + auto(x2, "dec") + " − " + auto(b2, "dec") + ") × 0.8 = " + auto(wrong, "dec") + " 元，順序不同結果就不同；要照題目敘述的順序列式。" }, ans(v, "dec"));
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const form = k.int(0, 1) === 0, x = N(k, ["int", "dec", "mixed"], 2, 20, [2, 5], [3, 2, 2]);
    if (form) {
      const v = qs(qm(x.q, Q(3, 5)), Q(3, 5)); pos(v); dec4(v, x.q);
      return Object.assign({ stem: "小明想了一個數，把它乘 0.6 以後再減去 3/5，得到 " + auto(v, "dec") + "，這個數是多少？",
        explain: "解析：逆向：" + auto(v, "dec") + " + 3/5 = " + auto(qa(v, Q(3, 5)), "dec") + "，再 ÷ 0.6 = " + dd(x) + "。" }, ans(x.q, x.fl === "mixed" ? "mixed" : "dec"), { units: ["個"] });
    }
    const v = qs(qm(x.q, Q(3, 4)), Q(1, 2)); pos(v); dec4(v, x.q);
    return Object.assign({ stem: "老師想了一個數，把它乘 0.75 以後再減去 1/2，得到 " + auto(v, "dec") + "，這個數是多少？",
      explain: "解析：逆向：" + auto(v, "dec") + " + 1/2 = " + auto(qa(v, Q(1, 2)), "dec") + "，再 ÷ 0.75 = " + dd(x) + "。" }, ans(x.q, x.fl === "mixed" ? "mixed" : "dec"), { units: ["個"] });
  });

  /* ---------- 教材 □ 未知數題（規格第 14 節） ---------- */
  add("fill-L1-03", "fill", 1, "basic", function (k) {
    const x = N(k, ["dec", "mixed", "int"], 1, 5, [2, 4, 5], [3, 2, 1]), f = N(k, ["frac", "dec"], 1, 3, [2, 4, 5, 10], [2, 2]), v = qa(x.q, f.q); dec4(v);
    return Object.assign({ stem: "□ + " + ex(f) + " = " + auto(v, x.fl === "mixed" ? "mixed" : "dec") + "，□ 是多少？",
      explain: "解析：□ = " + auto(v, x.fl === "mixed" ? "mixed" : "dec") + " − " + dd(f) + " = " + dd(x) + "。" }, ans(x.q, x.fl === "mixed" ? "mixed" : "dec"));
  });
  add("fill-L2-02", "fill", 2, "basic", function (k) {
    const x = N(k, ["int", "dec", "mixed"], 2, 9, [2, 4, 5], [2, 3, 2]), m = N(k, ["dec", "mixed", "int"], 2, 9, [2, 4], [3, 2, 1]), v = qm(x.q, m.q); dec4(v, x.q);
    return Object.assign({ stem: ex(m) + " × □ = " + auto(v, m.fl === "mixed" || x.fl === "mixed" ? "mixed" : "dec") + "，□ 是多少？",
      explain: "解析：□ = " + auto(v, "dec") + " ÷ " + dd(m) + " = " + dd(x) + "。" }, ans(x.q, x.fl === "mixed" ? "mixed" : "dec"));
  });
  add("calc-L2-02", "calc", 2, "basic", function (k) {
    const q = N(k, ["int", "dec", "mixed"], 2, 9, [2, 4, 5], [2, 3, 2]), x = N(k, ["int", "dec"], 2, 9, [2], [2, 3]), a = qm(q.q, x.q); dec4(a);
    return Object.assign({ stem: auto(a, "dec") + " ÷ □ = " + dd(q) + "，求 □：" + auto(a, "dec") + " ÷ " + ex(q),
      explain: "解析：被除數 ÷ 商 = 除數，□ = " + auto(a, "dec") + " ÷ " + dd(q) + " = " + dd(x) + "。" }, ans(x.q, x.fl === "mixed" ? "mixed" : "dec"));
  });
  add("single-L3-04", "single", 3, "trap", function (k) {
    const f = k.pick([[3, 4], [2, 5], [3, 5], [5, 4], [3, 2]]), x = N(k, ["int", "dec", "mixed"], 4, 40, [2, 4], [3, 3, 2]), y = qm(x.q, FQ(f)); dec4(y, x.q);
    const fl = x.fl === "mixed" ? "mixed" : "dec";
    const c = sc(k, x.q, [qm(y, FQ(f)), qs(y, FQ(f)).n > 0 ? qs(y, FQ(f)) : qa(y, FQ(f)), qd(y, I(f[0])), qm(y, I(f[1]))], fl);
    return Object.assign(c, { stem: "□ × (" + f[0] + "/" + f[1] + ") = " + auto(y, fl) + "，□ 是多少？",
      explain: "解析：□ = " + auto(y, fl) + " ÷ " + f[0] + "/" + f[1] + " = " + auto(y, fl) + " × " + f[1] + "/" + f[0] + " = " + auto(x.q, fl) + "。",
      trapNote: "求 □ 要用除法（÷ " + f[0] + "/" + f[1] + "，也就是 × " + f[1] + "/" + f[0] + "）；直接 × " + f[0] + "/" + f[1] + " 會得到 " + auto(qm(y, FQ(f)), "dec") + "，把方向弄反了。" });
  });
  add("word-L3-02", "word", 3, "trap", function (k) {
    const f = k.pick([[3, 5], [3, 4], [2, 5], [1, 4]]), x = N(k, ["int", "dec"], 20, 100, [2], [3, 2]), y = qm(x.q, FQ(f)); dec4(y, x.q);
    return Object.assign({ stem: "小明買筆記本花了 " + auto(y, "dec") + " 元，這是他帶來的錢的 " + f[0] + "/" + f[1] + "，他帶了 □ 元。", units: ["元"],
      explain: "解析：花掉的錢 = 帶來的錢 × " + f[0] + "/" + f[1] + "，□ = " + auto(y, "dec") + " ÷ " + f[0] + "/" + f[1] + " = " + auto(x.q, "dec") + "（元）。",
      trapNote: "「是帶來的錢的 " + f[0] + "/" + f[1] + "」，帶來的錢是整體（1），要用除法還原；把 " + auto(y, "dec") + " 再 × " + f[0] + "/" + f[1] + " 會得到 " + auto(qm(y, FQ(f)), "dec") + "，比花掉的還少，不合理。" }, ans(x.q, "dec"));
  });
  add("tf-L4-02", "tf", 4, "trap", function (k) {
    const x = N(k, ["int", "dec", "mixed"], 2, 20, [2, 4], [3, 3, 2]), v = qm(x.q, I(4)), ok = k.int(0, 1) === 1, w = ok ? x.q : qm(v, Q(1, 4).n ? Q(4, 1) : Q(4, 1)); dec4(v, x.q, w);
    const fl = x.fl === "mixed" ? "mixed" : "dec";
    return { stem: "□ ÷ 0.25 = " + auto(v, fl) + "，所以 □ = " + auto(w, fl) + "。", answer: ok,
      explain: "解析：被除數 = 商 × 除數，□ = " + auto(v, fl) + " × 0.25 = " + auto(x.q, fl) + "。",
      trapNote: "求被除數要用「乘」：商 × 除數；若再除以 0.25（= × 4）會得到 " + auto(qm(v, I(4)), fl) + "，方向弄反了。" };
  });
  add("calc-L4-02", "calc", 4, "extend", function (k) {
    const m = k.pick([Q(3, 2), Q(5, 2), Q(3, 4), Q(2, 5), Q(5, 4)]), x = N(k, ["int", "dec", "mixed"], 4, 30, [2, 4], [3, 3, 2]), s = N(k, ["int", "dec", "mixed"], 1, 6, [2, 4], [3, 2, 2]), v = qs(qm(x.q, m), s.q); pos(v); dec4(v, x.q);
    const fl = x.fl === "mixed" ? "mixed" : "dec";
    return Object.assign({ stem: "□ × " + wrap(auto(m, "dec")) + " − " + ex(s) + " = " + auto(v, fl) + "，求 □：(" + auto(v, fl) + " + " + ex(s) + ") ÷ " + wrap(auto(m, "dec")),
      explain: "解析：先把減掉的 " + dd(s) + " 加回去：" + auto(v, fl) + " + " + dd(s) + " = " + auto(qa(v, s.q), fl) + "，再 ÷ " + auto(m, "dec") + " = " + dd(x) + "。" }, ans(x.q, fl));
  });
  add("fill-L4-03", "fill", 4, "extend", function (k) {
    const fl = k.flavor(["dec", "mixed"]), y = N(k, [fl], 2, 9, [2, 4]), gap = N(k, [fl], 1, 5, [2, 4]), x = qa(y.q, gap.q), S2 = qa(x, y.q); dec4(S2, gap.q);
    return Object.assign({ stem: "□ + △ = " + auto(S2, fl) + "，□ − △ = " + auto(gap.q, fl) + "，△ 是多少？",
      explain: "解析：△ = (和 − 差) ÷ 2 = (" + auto(S2, fl) + " − " + auto(gap.q, fl) + ") ÷ 2 = " + auto(y.q, fl) + "（□ = " + auto(x, fl) + "）。" }, ans(y.q, fl));
  });

  ExamBank.register("mixed-ops", "mixed-ops-main", S);
})();
