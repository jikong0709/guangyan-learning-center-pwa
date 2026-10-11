/* 題庫：solve-upper 和差問題、規律、雞兔同籠。題庫工 B
   數字風格：和差、規律、價錢型雞兔同籠的數量可為整數、小數、帶分數；全部用 kit.Q 精確運算。 */
(function () {
  "use strict";
  const K = window.ExamKit, Q = K.Q, qa = K.qAdd, qs = K.qSub, qm = K.qMul, qd = K.qDiv;
  const S = [];
  /* 輸出後處理：分數平方一律加括號；分母 > 60 的分數或 9 位以上數字視為不乾淨，重抽 */
  function fixSq(s) { return typeof s === "string" ? s.replace(/(\d+ \d+\/\d+|\d+\/\d+)²/g, "($1)²") : s; }
  function post(o) {
    ["stem", "explain", "trapNote"].forEach(function (f) { if (o[f] !== undefined) o[f] = fixSq(o[f]); });
    if (o.options) o.options = o.options.map(fixSq);
    const all = [o.stem, o.explain, o.trapNote, o.answer, o.options ? o.options.join(" ") : ""].join(" ");
    const re = /(\d+)\/(\d+)/g; let m;
    while ((m = re.exec(all))) { if (+m[2] > 60) throw new Error("retry"); }
    if (/\d{9,}/.test(all)) throw new Error("retry");
    return o;
  }
  function add(id, type, level, tag, gen) {
    S.push({ id: "solve-upper-" + id, type, level, tag, gen: function (k) {
      let e; for (let i = 0; i < 80; i++) { try { return post(gen(k)); } catch (x) { e = x; } } throw e;
    } });
  }
  function dg(q) { let d = q.d, a = 0, b = 0; while (d % 2 === 0) { d /= 2; a++; } while (d % 5 === 0) { d /= 5; b++; } return d === 1 ? Math.max(a, b) : 99; }
  function need() { for (let i = 0; i < arguments.length; i++) { const q = arguments[i]; if (q.n <= 0 || dg(q) > 4) throw new Error("retry"); } }
  function I(n) { return Q(n, 1); }
  function auto(q, fl) { if (q.d === 1) return String(q.n); if (fl === "mixed" && q.d <= 20) return K.qMixed(q); return dg(q) <= 4 ? K.qDec(q) : K.qMixed(q); }
  function sc(k, correct, cands, fl) {
    const c = auto(correct, fl); if (correct.n <= 0) throw new Error("retry");
    const w = k.distractors(c, cands.filter(function (q) { return q.n > 0 && (dg(q) <= 4 || fl === "mixed"); }).map(function (q) { return auto(q, fl); }), 3);
    if (w.length < 3) throw new Error("retry");
    return { options: [c].concat(w), answer: 0 };
  }
  function mu(k, goods, bads) {
    const g = k.shuffle(goods).slice(0, k.int(2, 3)), b = k.shuffle(bads).slice(0, 2), all = g.concat(b);
    if (new Set(all).size !== all.length) throw new Error("retry");
    return { options: all, answer: g.map(function (_, i) { return i; }) };
  }
  function ans(q, fl) { return K.qAnswer(q, fl === "mixed" ? "mixed" : "dec"); }
  function ex(q, fl) { const s = auto(q, fl); return /[ \/]/.test(s) ? "(" + s + ")" : s; }
  function FL(k) { return k.flavor(["int", "dec", "mixed"], [1, 4.5, 4.5]); }
  function RQ(k, fl, lo, hi) { return k.randQ(fl, { min: lo, max: hi, dens: [2, 4], places: 1 }); }
  /* 和差：大數 x、小數 y */
  function sd(k, lo, hi) {
    const fl = FL(k), y = RQ(k, fl, lo, hi), gap = RQ(k, fl, 2, Math.max(4, Math.floor(hi / 2))), x = qa(y, gap);
    const S2 = qa(x, y); need(S2, gap, x, y);
    return { fl: fl, x: x, y: y, S: S2, D: gap, A: function (q) { return auto(q, fl); } };
  }
  /* 兩種單價問題（雞兔同籠）：雞兔（整數）或價錢（小數／帶分數） */
  function two(k) {
    if (k.int(0, 2) === 0) {
      let c, r; do { c = k.int(3, 20); r = k.int(3, 20); } while (c === r);
      return { an: true, fl: "int", a1: I(2), a2: I(4), lo: I(c), hi: I(r), h: I(c + r), T: I(2 * c + 4 * r), unit: "隻" };
    }
    const fl = k.flavor(["dec", "mixed"]), a1 = RQ(k, fl, 2, 9), a2 = qa(a1, RQ(k, fl, 1, 5)), c1 = k.int(3, 15), c2 = k.int(3, 15);
    if (c1 === c2) throw new Error("retry");
    const T = qa(qm(a1, I(c1)), qm(a2, I(c2))); need(a1, a2, T);
    return { an: false, fl: fl, a1: a1, a2: a2, lo: I(c1), hi: I(c2), h: I(c1 + c2), T: T, unit: "支" };
  }
  function two_stem(t, askHigh) {
    const A = function (q) { return auto(q, t.fl); };
    if (t.an) return "雞和兔共 " + t.h.n + " 隻，腳共 " + t.T.n + " 隻，" + (askHigh ? "兔" : "雞") + "有幾隻？";
    return "文具店的甲種筆每支 " + A(t.a1) + " 元、乙種筆每支 " + A(t.a2) + " 元，小美共買了 " + t.h.n + " 支，付了 " + A(t.T) + " 元，" + (askHigh ? "乙" : "甲") + "種筆買了幾支？";
  }
  function two_expl(t, askHigh) {
    const A = function (q) { return auto(q, t.fl); };
    const base = qm(t.a1, t.h), dif = qs(t.T, base), gap = qs(t.a2, t.a1);
    if (t.an) return "解析：假設全是雞，腳有 2 × " + t.h.n + " = " + A(base) + " 隻，少了 " + A(t.T) + " − " + A(base) + " = " + A(dif) + " 隻；每把 1 隻雞換成兔多 2 隻腳，所以兔有 " + A(dif) + " ÷ 2 = " + t.hi.n + " 隻，雞有 " + t.lo.n + " 隻。" + (askHigh ? "" : "");
    return "解析：假設全買甲種，共 " + A(t.a1) + " × " + t.h.n + " = " + A(base) + " 元，少了 " + A(t.T) + " − " + A(base) + " = " + A(dif) + " 元；每把 1 支甲換成乙多 " + A(t.a2) + " − " + A(t.a1) + " = " + A(gap) + " 元，所以乙種有 " + A(dif) + " ÷ " + A(gap) + " = " + t.hi.n + " 支，甲種有 " + t.lo.n + " 支。";
  }
  function arith(k) {
    const fl = FL(k), a = RQ(k, fl, 2, 9), d = RQ(k, fl, 2, 6), n = k.int(8, 20);
    return { fl: fl, a: a, d: d, n: n, A: function (q) { return auto(q, fl); },
      nth: function (m) { return qa(a, qm(d, I(m - 1))); },
      head: function () { const A = function (q) { return auto(q, fl); }; return A(a) + "、" + A(qa(a, d)) + "、" + A(qa(a, qm(d, I(2)))) + "、" + A(qa(a, qm(d, I(3)))) + "……"; } };
  }
  function three(k) {
    const fl = FL(k), z = RQ(k, fl, 5, 25), b = RQ(k, fl, 2, 8), a = RQ(k, fl, 2, 8), S2 = qa(qm(I(3), z), qa(qm(I(2), b), a)); need(S2, z, b, a);
    return { fl: fl, z: z, b: b, a: a, S: S2, A: function (q) { return auto(q, fl); } };
  }

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const p = sd(k, 12, 60);
    const c = sc(k, p.x, [p.y, qa(p.S, p.D), qd(p.S, I(2)), qd(p.D, I(2))], p.fl);
    return Object.assign(c, { stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，其中較大的數是多少？",
      explain: "解析：大數 = (和 + 差) ÷ 2 = (" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "。" });
  });
  add("single-L1-02", "single", 1, "basic", function (k) {
    const p = sd(k, 15, 70);
    const c = sc(k, p.y, [p.x, qs(p.S, p.D), qd(p.S, I(2)), qd(p.D, I(2)), qa(p.S, p.D), p.D, p.S], p.fl);
    return Object.assign(c, { stem: "甲、乙兩袋米共 " + p.A(p.S) + " 公斤，甲袋比乙袋重 " + p.A(p.D) + " 公斤，乙袋重多少公斤？",
      explain: "解析：小數 = (和 − 差) ÷ 2 = (" + p.A(p.S) + " − " + p.A(p.D) + ") ÷ 2 = " + p.A(p.y) + "（公斤）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const t = arith(k), v = t.nth(t.n), A = t.A;
    const c = sc(k, v, [qa(t.a, qm(t.d, I(t.n))), qm(t.d, I(t.n)), qa(t.a, qm(t.d, I(t.n + 1))), qm(t.a, I(t.n)), qa(t.a, qm(t.d, I(t.n - 2))), qm(t.d, I(t.n - 1))], t.fl);
    return Object.assign(c, { stem: "有一列數：" + t.head() + "照這個規律排下去，第 " + t.n + " 個數是多少？",
      explain: "解析：每次增加 " + A(t.d) + "，第 " + t.n + " 個數 = 第 1 個數 + (" + t.n + " − 1) × " + A(t.d) + " = " + A(t.a) + " + " + A(qm(t.d, I(t.n - 1))) + " = " + A(v) + "。",
      trapNote: "第 1 個數還沒有增加，到第 " + t.n + " 個數只增加了 " + (t.n - 1) + " 次；誤用 " + t.n + " 次會得到 " + A(qa(t.a, qm(t.d, I(t.n)))) + "。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    const t = two(k);
    const A = function (q) { return auto(q, t.fl); };
    const c = sc(k, t.hi, [t.lo, qd(t.h, I(2)), qs(t.T, t.h), qd(t.T, t.a2), qs(t.T, qm(t.a1, t.h))], "int");
    const ds = qs(qm(t.a2, t.h), t.T);
    return Object.assign(c, { stem: two_stem(t, true), explain: two_expl(t, true),
      trapNote: "最後一步若用 " + A(ds) + " ÷ " + A(qs(t.a2, t.a1)) + " 算出的是" + (t.an ? "雞" : "甲種") + "（" + t.lo.n + (t.an ? " 隻" : " 支") + "）；要看清楚題目問的是哪一種。" });
  });
  add("single-L3-02", "single", 3, "basic", function (k) {
    const n0 = k.int(5, 15);
    const cs = [4 * n0, 3 * n0, 3 * n0 + 2, 3 * n0 - 1].map(String), w = k.distractors(String(3 * n0 + 1), cs, 3);
    return { stem: "用火柴棒排正方形：1 個正方形要 4 根，連排 2 個要 7 根，連排 3 個要 10 根……連排 " + n0 + " 個正方形需要幾根火柴棒？", options: [String(3 * n0 + 1)].concat(w), answer: 0,
      explain: "解析：第 1 個用 4 根，之後每多 1 個正方形多 3 根，所以共 4 + 3 × (" + n0 + " − 1) = 3 × " + n0 + " + 1 = " + (3 * n0 + 1) + "（根）。" };
  });
  add("single-L4-01", "single", 4, "trap", function (k) {
    const m = k.int(8, 40);
    const cs = [m, m - 1, Math.round(3 * m / 2), m + 2].map(String), w = k.distractors(String(m + 1), cs, 3);
    return { stem: "三個連續整數的和是 " + (3 * m) + "，其中最大的數是多少？", options: [String(m + 1)].concat(w), answer: 0,
      explain: "解析：連續三個整數的中間數 = 和 ÷ 3 = " + (3 * m) + " ÷ 3 = " + m + "，最大的數 = " + m + " + 1 = " + (m + 1) + "。",
      trapNote: "和 ÷ 3 得到的 " + m + " 是中間那個數，不是最大的數；最大的要再加 1。" };
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const x = k.int(3, 12), y = k.int(3, 12), h = x + y, V = 10 * x + 5 * y;
    const cs = [y, V / 10, x / 2, V / 15, h, V - 5 * h].map(function (v) { return String(Number(v.toFixed(4))); }), w = k.distractors(String(x), cs, 3);
    return { stem: "存錢筒裡只有 10 元和 5 元的硬幣，共 " + h + " 個，總共 " + V + " 元，10 元硬幣有幾個？", options: [String(x)].concat(w), answer: 0,
      explain: "解析：假設全是 5 元，共 5 × " + h + " = " + (5 * h) + " 元，少了 " + V + " − " + (5 * h) + " = " + (V - 5 * h) + " 元；每把 1 個 5 元換成 10 元多 5 元，所以 10 元有 " + (V - 5 * h) + " ÷ 5 = " + x + " 個。" };
  });
  add("single-L4-03", "single", 4, "extend", function (k) {
    let t, b;
    do { t = k.int(3, 15); b = k.int(3, 15); } while (t === b);
    const h = t + b, W = 3 * t + 2 * b;
    const cs = [b, Math.round(W / 3), 3 * h - W + 1, h - 1, W - h].map(String), w = k.distractors(String(t), cs, 3);
    return { stem: "遊樂場裡三輪車和腳踏車共 " + h + " 輛，輪子共 " + W + " 個（三輪車有 3 個輪子、腳踏車有 2 個輪子），三輪車有幾輛？", options: [String(t)].concat(w), answer: 0,
      explain: "解析：假設全是腳踏車，輪子有 2 × " + h + " = " + (2 * h) + " 個，少了 " + (W - 2 * h) + " 個；每把 1 輛腳踏車換成三輪車多 1 個輪子，所以三輪車有 " + (W - 2 * h) + " 輛。" };
  });
  add("single-L5-01", "single", 5, "extend", function (k) {
    const t = three(k), A = t.A, jia = qa(t.z, qa(t.a, t.b)), yi = qa(t.z, t.b);
    const c = sc(k, jia, [yi, qd(t.S, I(3)), qa(t.z, t.a), t.z, qa(t.z, qm(I(2), t.b)), qa(t.z, qa(t.a, qm(I(2), t.b))), qa(t.z, qm(I(2), t.a))], t.fl);
    return Object.assign(c, { stem: "甲、乙、丙三袋糖共 " + A(t.S) + " 公斤，乙袋比丙袋多 " + A(t.b) + " 公斤，甲袋又比乙袋多 " + A(t.a) + " 公斤，甲袋有幾公斤？",
      explain: "解析：把乙、甲都換成「丙的重量」：乙 = 丙 + " + A(t.b) + "，甲 = 丙 + " + A(qa(t.a, t.b)) + "。三袋共 3 個丙 + " + A(qa(qm(I(2), t.b), t.a)) + " = " + A(t.S) + "，丙 = (" + A(t.S) + " − " + A(qa(qm(I(2), t.b), t.a)) + ") ÷ 3 = " + A(t.z) + "，甲 = " + A(t.z) + " + " + A(qa(t.a, t.b)) + " = " + A(jia) + "（公斤）。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const p = sd(k, 12, 50);
    const c = mu(k,
      ["大數是 " + p.A(p.x), "小數是 " + p.A(p.y), "大數 − 小數 = " + p.A(p.D), "大數 + 小數 = " + p.A(p.S)],
      ["大數是 " + p.A(p.y), "小數是 " + p.A(p.x), "大數是 " + p.A(qd(p.S, I(2)))]);
    return Object.assign(c, { stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，選出所有正確的敘述。",
      explain: "解析：大數 = (" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "，小數 = (" + p.A(p.S) + " − " + p.A(p.D) + ") ÷ 2 = " + p.A(p.y) + "。" });
  });
  add("multi-L2-01", "multi", 2, "basic", function (k) {
    const t = arith(k), A = t.A, n0 = Math.min(t.n, 15), v = t.nth(n0);
    if (t.a.n * t.d.d === t.d.n * t.a.d) throw new Error("retry");
    const c = mu(k,
      ["第 " + n0 + " 個數是 " + A(v), "每一個數都比前一個數多 " + A(t.d), "第 " + (n0 + 1) + " 個數是 " + A(qa(v, t.d))],
      ["第 " + n0 + " 個數是 " + A(qa(t.a, qm(t.d, I(n0)))), "每一個數都比前一個數多 " + A(t.a), "第 " + n0 + " 個數是 " + A(qm(t.d, I(n0)))]);
    return Object.assign(c, { stem: "數列：" + t.head() + "照規律排下去，選出所有正確的敘述。",
      explain: "解析：公差是 " + A(t.d) + "，第 " + n0 + " 個數 = " + A(t.a) + " + " + (n0 - 1) + " × " + A(t.d) + " = " + A(v) + "，下一個再加 " + A(t.d) + "。" });
  });
  add("multi-L3-01", "multi", 3, "trap", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, gap = qs(t.a2, t.a1);
    const nl = t.an ? "雞" : "甲種筆", nh = t.an ? "兔" : "乙種筆", u = t.unit;
    const c = mu(k,
      [nl + "有 " + t.lo.n + " " + u, nh + "有 " + t.hi.n + " " + u, "假設全是" + nl + "，" + (t.an ? "腳" : "總價") + "會是 " + A(qm(t.a1, t.h)) + (t.an ? " 隻" : " 元"), "每把 1" + (t.an ? "隻雞換成 1 隻兔，腳" : "支甲換成 1 支乙，總價") + "會多 " + A(gap) + (t.an ? " 隻" : " 元")],
      [nl + "有 " + t.hi.n + " " + u, nh + "有 " + t.lo.n + " " + u, "每把 1" + (t.an ? "隻雞換成 1 隻兔，腳" : "支甲換成 1 支乙，總價") + "會多 " + A(qa(gap, t.a1)) + (t.an ? " 隻" : " 元")]);
    return Object.assign(c, { stem: t.an ? "雞和兔共 " + t.h.n + " 隻，腳共 " + t.T.n + " 隻，選出所有正確的敘述。" : "甲種筆每支 " + A(t.a1) + " 元、乙種筆每支 " + A(t.a2) + " 元，共買 " + t.h.n + " 支，付了 " + A(t.T) + " 元，選出所有正確的敘述。",
      explain: two_expl(t, true),
      trapNote: t.an ? "雞 2 腳、兔 4 腳，換一隻只多 2 隻腳（4 − 2），不是多 4 隻；也容易把雞兔隻數說反。" : "換一支多的是兩種單價的「差」" + A(gap) + " 元，不是乙種的單價；也容易把甲乙支數說反。" });
  });
  add("multi-L4-01", "multi", 4, "trap", function (k) {
    const m = k.int(6, 30);
    const c = mu(k,
      ["中間的數是 " + m, "最小的數是 " + (m - 1), "最大的數是 " + (m + 1)],
      ["最小的數是 " + m, "最大的數是 " + (m + 2), "中間的數是 " + (3 * m / 2)]);
    return Object.assign(c, { stem: "三個連續整數的和是 " + (3 * m) + "，選出所有正確的敘述。",
      explain: "解析：和 ÷ 3 = " + (3 * m) + " ÷ 3 = " + m + "，這是中間數；三數為 " + (m - 1) + "、" + m + "、" + (m + 1) + "。",
      trapNote: "和 ÷ 3 得到的是平均數（中間數），不是最小或最大的數。" });
  });
  add("multi-L5-01", "multi", 5, "extend", function (k) {
    const t = three(k), A = t.A, jia = qa(t.z, qa(t.a, t.b)), yi = qa(t.z, t.b);
    const c = mu(k,
      ["丙有 " + A(t.z) + " 公斤", "乙有 " + A(yi) + " 公斤", "甲有 " + A(jia) + " 公斤", "甲比丙多 " + A(qa(t.a, t.b)) + " 公斤"],
      ["甲有 " + A(qa(t.z, t.a)) + " 公斤", "丙有 " + A(yi) + " 公斤", "甲比丙多 " + A(t.a) + " 公斤"]);
    return Object.assign(c, { stem: "甲、乙、丙三袋糖共 " + A(t.S) + " 公斤，乙比丙多 " + A(t.b) + " 公斤，甲比乙多 " + A(t.a) + " 公斤，選出所有正確的敘述。",
      explain: "解析：丙 = (" + A(t.S) + " − " + A(t.b) + " − " + A(qa(t.a, t.b)) + ") ÷ 3 = " + A(t.z) + "，乙 = " + A(yi) + "，甲 = " + A(jia) + "。" });
  });

  /* ---------- tf ---------- */
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const p = sd(k, 12, 50), ok = k.int(0, 1) === 1;
    return { stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，所以較大的數是 " + p.A(ok ? p.x : p.y) + "。", answer: ok,
      explain: "解析：大數 = (" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "，小數是 " + p.A(p.y) + "。" };
  });
  add("tf-L2-01", "tf", 2, "basic", function (k) {
    const t = arith(k), ok = k.int(0, 1) === 1, A = t.A, v = ok ? t.nth(t.n) : qa(t.a, qm(t.d, I(t.n)));
    return { stem: "數列 " + t.head() + "照規律排下去，第 " + t.n + " 個數是 " + A(v) + "。", answer: ok,
      explain: "解析：第 " + t.n + " 個數 = " + A(t.a) + " + (" + t.n + " − 1) × " + A(t.d) + " = " + A(t.nth(t.n)) + "。" };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const t = two(k), ok = k.int(0, 1) === 1, v = ok ? t.hi : t.lo, A = function (q) { return auto(q, t.fl); };
    const nh = t.an ? "兔" : "乙種筆";
    return { stem: (t.an ? "雞和兔共 " + t.h.n + " 隻，腳共 " + t.T.n + " 隻，" : "甲種筆每支 " + A(t.a1) + " 元、乙種筆每支 " + A(t.a2) + " 元，共買 " + t.h.n + " 支，付了 " + A(t.T) + " 元，") + nh + (t.an ? "有 " + v.n + " 隻。" : "買了 " + v.n + " 支。"), answer: ok,
      explain: two_expl(t, true),
      trapNote: "兩種數量容易說反；" + t.lo.n + " 是" + (t.an ? "雞" : "甲種筆") + "的數量，" + nh + "是 " + t.hi.n + "。" };
  });
  add("tf-L3-02", "tf", 3, "trap", function (k) {
    const x = k.int(10, 40), y = k.int(3, 9), ok = k.int(0, 1) === 1, S2 = x + y, D = ok ? x - y : x - y + 1;
    return { stem: "兩個整數的和是 " + S2 + "，差是 " + D + "，這樣的兩個整數存在。", answer: ok,
      explain: "解析：大數 = (和 + 差) ÷ 2 = (" + S2 + " + " + D + ") ÷ 2 = " + ((S2 + D) / 2) + "，" + (ok ? "是整數，存在。" : "不是整數，所以不存在這樣的兩個整數。"),
      trapNote: "和與差必須同為奇數或同為偶數，兩數才會是整數；一奇一偶時，(和 + 差) ÷ 2 會出現 .5。" };
  });
  add("tf-L4-01", "tf", 4, "trap", function (k) {
    const m = k.int(8, 40), ok = k.int(0, 1) === 1, v = ok ? m + 1 : m;
    return { stem: "三個連續整數的和是 " + (3 * m) + "，最大的數是 " + v + "。", answer: ok,
      explain: "解析：中間數 " + (3 * m) + " ÷ 3 = " + m + "，最大的數是 " + (m + 1) + "。",
      trapNote: "和 ÷ 3 只能得到中間那個數 " + m + "，不是最大的數。" };
  });
  add("tf-L5-01", "tf", 5, "extend", function (k) {
    const n0 = k.int(6, 20), ok = k.int(0, 1) === 1, v = ok ? 2 * n0 + 1 : 3 * n0;
    return { stem: "用火柴棒排連續的正三角形：1 個用 3 根，2 個用 5 根，3 個用 7 根……排 " + n0 + " 個要用 " + v + " 根。", answer: ok,
      explain: "解析：第 1 個 3 根，之後每多 1 個多 2 根，共 3 + 2 × (" + n0 + " − 1) = " + (2 * n0 + 1) + " 根。" };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const p = sd(k, 12, 60);
    return Object.assign({ stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，大數是（　）。",
      explain: "解析：(" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "。" }, ans(p.x, p.fl));
  });
  add("fill-L1-02", "fill", 1, "basic", function (k) {
    const p = sd(k, 15, 70);
    return Object.assign({ stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，小數是（　）。",
      explain: "解析：(" + p.A(p.S) + " − " + p.A(p.D) + ") ÷ 2 = " + p.A(p.y) + "。" }, ans(p.y, p.fl));
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const t = arith(k), v = t.nth(t.n);
    return Object.assign({ stem: "規律：" + t.head() + "第 " + t.n + " 個數是（　）。",
      explain: "解析：" + t.A(t.a) + " + (" + t.n + " − 1) × " + t.A(t.d) + " = " + t.A(v) + "。" }, ans(v, t.fl));
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, ds = qs(qm(t.a2, t.h), t.T), gap = qs(t.a2, t.a1);
    const expl = t.an ? "解析：假設全是兔，腳 4 × " + t.h.n + " = " + A(qm(t.a2, t.h)) + " 隻，多了 " + A(ds) + " 隻；每把 1 隻兔換成雞少 2 隻，雞 = " + A(ds) + " ÷ 2 = " + t.lo.n + "。"
      : "解析：假設全買乙種，共 " + A(qm(t.a2, t.h)) + " 元，多了 " + A(ds) + " 元；每把 1 支乙換成甲少 " + A(gap) + " 元，甲種 = " + A(ds) + " ÷ " + A(gap) + " = " + t.lo.n + "。";
    return { stem: (t.an ? "雞和兔共 " + t.h.n + " 隻，腳共 " + t.T.n + " 隻，雞有（　）隻。" : "甲種筆每支 " + A(t.a1) + " 元、乙種筆每支 " + A(t.a2) + " 元，共買 " + t.h.n + " 支，付了 " + A(t.T) + " 元，甲種筆買了（　）支。"),
      answer: String(t.lo.n), units: ["隻", "支"], explain: expl,
      trapNote: "假設全是" + (t.an ? "兔" : "乙種") + "時，多出的" + (t.an ? "腳" : "錢") + "要除以「單價的差」" + A(gap) + "；除以其他數都會錯。" };
  });
  add("fill-L4-01", "fill", 4, "extend", function (k) {
    const fl = FL(k), a = RQ(k, fl, 2, 8), d = RQ(k, fl, 2, 5), n0 = 2 * k.int(2, 5), A = function (q) { return auto(q, fl); };
    const last = qa(a, qm(d, I(n0 - 1))), tot = qd(qm(qa(a, last), I(n0)), I(2)); need(tot, last);
    return Object.assign({ stem: "等差數列：" + A(a) + "、" + A(qa(a, d)) + "、" + A(qa(a, qm(d, I(2)))) + "……共 " + n0 + " 個數，全部加起來等於（　）。",
      explain: "解析：最後一個數 = " + A(a) + " + " + (n0 - 1) + " × " + A(d) + " = " + A(last) + "；總和 = (首 + 尾) × 個數 ÷ 2 = (" + A(a) + " + " + A(last) + ") × " + n0 + " ÷ 2 = " + A(tot) + "。" }, ans(tot, fl));
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const t = three(k), A = t.A;
    return Object.assign({ stem: "甲、乙、丙三桶油共 " + A(t.S) + " 公升，乙比丙多 " + A(t.b) + " 公升，甲比乙多 " + A(t.a) + " 公升，丙桶有（　）公升。", units: ["公升"],
      explain: "解析：甲 = 丙 + " + A(qa(t.a, t.b)) + "，乙 = 丙 + " + A(t.b) + "；三桶共 3 個丙 + " + A(qa(t.a, qm(I(2), t.b))) + " = " + A(t.S) + "，丙 = (" + A(t.S) + " − " + A(qa(t.a, qm(I(2), t.b))) + ") ÷ 3 = " + A(t.z) + "。" }, ans(t.z, t.fl));
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const p = sd(k, 12, 60);
    return Object.assign({ stem: "和是 " + p.A(p.S) + "、差是 " + p.A(p.D) + "，求大數：(" + ex(p.S, p.fl) + " + " + ex(p.D, p.fl) + ") ÷ 2",
      explain: "解析：" + p.A(qa(p.S, p.D)) + " ÷ 2 = " + p.A(p.x) + "。" }, ans(p.x, p.fl));
  });
  add("calc-L2-01", "calc", 2, "basic", function (k) {
    const p = sd(k, 15, 70);
    return Object.assign({ stem: "和是 " + p.A(p.S) + "、差是 " + p.A(p.D) + "，求小數：(" + ex(p.S, p.fl) + " − " + ex(p.D, p.fl) + ") ÷ 2",
      explain: "解析：" + p.A(qs(p.S, p.D)) + " ÷ 2 = " + p.A(p.y) + "。" }, ans(p.y, p.fl));
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, ds = qs(t.T, qm(t.a1, t.h)), gap = qs(t.a2, t.a1);
    return Object.assign({ stem: t.an ? "雞兔同籠，共 " + t.h.n + " 隻、腳 " + t.T.n + " 隻，求兔數：(" + t.T.n + " − 2 × " + t.h.n + ") ÷ 2"
      : "兩種筆共 " + t.h.n + " 支，甲每支 " + A(t.a1) + " 元、乙每支 " + A(t.a2) + " 元，共 " + A(t.T) + " 元，求乙種的支數：(" + ex(t.T, t.fl) + " − " + ex(t.a1, t.fl) + " × " + t.h.n + ") ÷ (" + ex(t.a2, t.fl) + " − " + ex(t.a1, t.fl) + ")",
      explain: "解析：" + (t.an ? "2 × " + t.h.n + " = " + A(qm(t.a1, t.h)) + "，" : A(t.a1) + " × " + t.h.n + " = " + A(qm(t.a1, t.h)) + "，") + A(t.T) + " − " + A(qm(t.a1, t.h)) + " = " + A(ds) + "，÷ " + A(gap) + " = " + t.hi.n + "。" }, ans(t.hi, "int"));
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, ds = qs(qm(t.a2, t.h), t.T), gap = qs(t.a2, t.a1);
    return Object.assign({ stem: t.an ? "雞兔同籠，共 " + t.h.n + " 隻、腳 " + t.T.n + " 隻，求雞數：(4 × " + t.h.n + " − " + t.T.n + ") ÷ 2"
      : "兩種筆共 " + t.h.n + " 支，甲每支 " + A(t.a1) + " 元、乙每支 " + A(t.a2) + " 元，共 " + A(t.T) + " 元，求甲種的支數：(" + ex(t.a2, t.fl) + " × " + t.h.n + " − " + ex(t.T, t.fl) + ") ÷ (" + ex(t.a2, t.fl) + " − " + ex(t.a1, t.fl) + ")",
      explain: "解析：" + (t.an ? "4" : A(t.a2)) + " × " + t.h.n + " = " + A(qm(t.a2, t.h)) + "，" + A(qm(t.a2, t.h)) + " − " + A(t.T) + " = " + A(ds) + "，÷ " + A(gap) + " = " + t.lo.n + "。",
      trapNote: "先乘後減，括號內算完再除；若寫成沒有括號的 " + (t.an ? "4" : A(t.a2)) + " × " + t.h.n + " − " + A(t.T) + " ÷ " + A(gap) + "，就會先除，答案不同。" }, ans(t.lo, "int"));
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const fl = FL(k), a = RQ(k, fl, 2, 8), d = RQ(k, fl, 2, 5), n0 = 2 * k.int(2, 6), A = function (q) { return auto(q, fl); };
    const last = qa(a, qm(d, I(n0 - 1))), tot = qd(qm(qa(a, last), I(n0)), I(2)); need(tot, last);
    return Object.assign({ stem: "首項 " + A(a) + "、每項加 " + A(d) + "、共 " + n0 + " 項，求總和：(" + ex(a, fl) + " + (" + ex(a, fl) + " + (" + n0 + " − 1) × " + ex(d, fl) + ")) × " + n0 + " ÷ 2",
      explain: "解析：末項 " + A(a) + " + " + (n0 - 1) + " × " + A(d) + " = " + A(last) + "；(" + A(a) + " + " + A(last) + ") × " + n0 + " ÷ 2 = " + A(tot) + "。" }, ans(tot, fl));
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const p = sd(k, 25, 45);
    return Object.assign({ stem: "兩條緞帶共長 " + p.A(p.S) + " 公尺，紅色的比藍色的長 " + p.A(p.D) + " 公尺，紅色緞帶長幾公尺？", units: ["公尺", "m"],
      explain: "解析：(" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "（公尺）。" }, ans(p.x, p.fl));
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const fl = FL(k), a = RQ(k, fl, 10, 50), d = RQ(k, fl, 5, 20), n0 = k.int(6, 12), A = function (q) { return auto(q, fl); }, v = qa(a, qm(d, I(n0 - 1)));
    return Object.assign({ stem: "小樹苗第 1 週高 " + A(a) + " 公分，之後每一週都比前一週多長高 " + A(d) + " 公分，第 " + n0 + " 週它高多少公分？", units: ["公分", "cm"],
      explain: "解析：第 " + n0 + " 週 = " + A(a) + " + (" + n0 + " − 1) × " + A(d) + " = " + A(v) + "（公分）。" }, ans(v, fl));
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, ds = qs(qm(t.a2, t.h), t.T), gap = qs(t.a2, t.a1);
    return Object.assign({ stem: t.an ? "農場裡有雞和兔共 " + t.h.n + " 隻，數一數共有 " + t.T.n + " 隻腳，雞有幾隻？" : "文具店的甲種筆每支 " + A(t.a1) + " 元、乙種筆每支 " + A(t.a2) + " 元，小美共買了 " + t.h.n + " 支，付了 " + A(t.T) + " 元，甲種筆買了幾支？", answer: String(t.lo.n), units: ["隻", "支"],
      explain: t.an ? "解析：假設全是兔，腳 " + A(qm(t.a2, t.h)) + " 隻，多出 " + A(ds) + " 隻；每把 1 隻兔換成雞少 2 隻腳，雞 = " + A(ds) + " ÷ 2 = " + t.lo.n + "（隻）。" : "解析：假設全買乙種，共 " + A(qm(t.a2, t.h)) + " 元，多出 " + A(ds) + " 元；每換 1 支少 " + A(gap) + " 元，甲種 = " + A(ds) + " ÷ " + A(gap) + " = " + t.lo.n + "（支）。",
      trapNote: "題目問的是" + (t.an ? "雞" : "甲種筆") + "；先求" + (t.an ? "兔" : "乙種") + "再答" + (t.an ? "兔" : "乙種") + "是常見失誤。也別忘記要除以單價的差 " + A(gap) + "。" });
  });
  add("word-L4-01", "word", 4, "extend", function (k) {
    if (k.int(0, 1) === 0) {
      const x = k.int(3, 12), y = k.int(3, 12), h = x + y, V = 10 * x + 5 * y;
      return { stem: "撲滿裡只有 10 元和 5 元硬幣，共 " + h + " 個，合計 " + V + " 元，10 元硬幣有幾個？", answer: String(x), units: ["個"],
        explain: "解析：假設全是 5 元：" + (5 * h) + " 元，少 " + (V - 5 * h) + " 元；每換 1 個多 5 元，10 元硬幣 = " + (V - 5 * h) + " ÷ 5 = " + x + "（個）。" };
    }
    const fl = k.flavor(["dec", "mixed"]), A = function (q) { return auto(q, fl); }, kid = RQ(k, fl, 2, 9), adult = qa(kid, RQ(k, fl, 2, 8)), c1 = k.int(3, 15), c2 = k.int(3, 15);
    if (c1 === c2) throw new Error("retry");
    const T = qa(qm(kid, I(c1)), qm(adult, I(c2))); need(kid, adult, T);
    const base = qm(kid, I(c1 + c2)), gap = qs(adult, kid);
    return Object.assign({ stem: "遊樂園兒童票每張 " + A(kid) + " 元、成人票每張 " + A(adult) + " 元，共賣出 " + (c1 + c2) + " 張，收入 " + A(T) + " 元，成人票賣出幾張？", answer: String(c2), units: ["張"],
      explain: "解析：假設全是兒童票：" + A(kid) + " × " + (c1 + c2) + " = " + A(base) + " 元，少 " + A(qs(T, base)) + " 元；每換 1 張多 " + A(gap) + " 元，成人票 = " + A(qs(T, base)) + " ÷ " + A(gap) + " = " + c2 + "（張）。" });
  });
  add("word-L4-02", "word", 4, "trap", function (k) {
    const m = k.int(8, 21);
    return { stem: "月曆上同一直行相鄰的三個日期（上下相差 7 天），三個日期的和是 " + (3 * m) + "，其中最大的日期是幾號？", answer: String(m + 7), units: ["號", "日"],
      explain: "解析：中間日期 = " + (3 * m) + " ÷ 3 = " + m + " 號，最大的 = " + m + " + 7 = " + (m + 7) + " 號。",
      trapNote: "月曆上下相鄰差 7，不是差 1；若誤當成連續整數會得到 " + (m + 1) + " 號。" };
  });
  add("word-L4-03", "word", 4, "extend", function (k) {
    let t, b;
    do { t = k.int(3, 15); b = k.int(3, 15); } while (t === b);
    const h = t + b, W = 3 * t + 2 * b;
    return { stem: "公園裡三輪車和腳踏車共 " + h + " 輛，輪子共 " + W + " 個（三輪車 3 個輪子、腳踏車 2 個輪子），三輪車有幾輛？", answer: String(t), units: ["輛"],
      explain: "解析：假設全是腳踏車，輪子 " + (2 * h) + " 個，少 " + (W - 2 * h) + " 個；每換 1 輛多 1 個輪子，三輪車 " + (W - 2 * h) + " 輛。" };
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const fl = FL(k), n0 = 2 * k.int(2, 5), a = RQ(k, fl, 2, 6), d = RQ(k, fl, 1, 3), A = function (q) { return auto(q, fl); };
    const last = qa(a, qm(d, I(n0 - 1))), tot = qd(qm(qa(a, last), I(n0)), I(2)); need(tot, last);
    return Object.assign({ stem: "把木條排成階梯：最短的一條長 " + A(a) + " 公分，每一條都比前一條長 " + A(d) + " 公分，共排 " + n0 + " 條，全部木條的長度合計多少公分？", units: ["公分", "cm"],
      explain: "解析：最長一條 " + A(a) + " + " + (n0 - 1) + " × " + A(d) + " = " + A(last) + " 公分；合計 = (" + A(a) + " + " + A(last) + ") × " + n0 + " ÷ 2 = " + A(tot) + "（公分）。" }, ans(tot, fl));
  });

  ExamBank.register("solve-upper", "solve-upper-main", S);
})();
