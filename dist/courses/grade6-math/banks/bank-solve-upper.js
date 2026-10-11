/* 題庫：solve-upper 和差問題、規律、雞兔同籠。題庫工 B
   數字風格：和差、規律、價錢型雞兔同籠的數量可為整數、小數、帶分數；全部用 kit.Q 精確運算。 */
(function () {
  "use strict";
  const K = window.ExamKit, Q = K.Q, qa = K.qAdd, qs = K.qSub, qm = K.qMul, qd = K.qDiv;
  const S = [];
  /* 複選：附每個選項的判斷理由，供解法二逐項檢驗 */
  let WHY = {};
  function muw(k, goods, bads) {
    WHY = {}; goods.concat(bads).forEach(function (p) { WHY[p[0]] = p[1]; });
    return mu(k, goods.map(function (p) { return p[0]; }), bads.map(function (p) { return p[0]; }));
  }
  function verdicts(c) { return c.options.map(function (o, i) { return "「" + o + "」" + (c.answer.indexOf(i) >= 0 ? "對" : "錯") + (WHY[o] ? "（" + WHY[o] + "）" : ""); }).join("；"); }
  /* 複選解法二：逐項檢驗，字數允許時再附上正確選項 */
  function mexp(c, lead) { const base = lead + verdicts(c) + "。", tail = "正確的是：" + goods(c) + "。"; return (base + tail).length <= 390 ? base + tail : base; }
  function wrapMixed(s) {
    return typeof s !== "string" ? s : s.replace(/\d+ \d+\/\d+/g, function (m, off, str) {
      const before = str.slice(Math.max(0, off - 4), off), after = str.slice(off + m.length, off + m.length + 4);
      const opB = /([×÷＋+−]|乘|加上|加|減去|減|除以)\s?$/.test(before), opA = /^\s?([×÷＋+−]|乘|加|減|除以)/.test(after);
      const inP = /\($/.test(before) && /^\)/.test(after);
      return (opB || opA) && !inP ? "(" + m + ")" : m;
    });
  }
  function yn(b) { return b ? "正確" : "錯誤"; }
  function goods(c) { return c.answer.map(function (i) { return c.options[i]; }).join("、"); }
  /* 解法二：反過來假設全是「單價高」的那一種（解法一假設全是單價低的） */
  function two_expl2(t) {
    const A = function (q) { return auto(q, t.fl); }, hiN = t.an ? "兔" : "乙種", loN = t.an ? "雞" : "甲種", ds = qs(qm(t.a2, t.h), t.T), gap = qs(t.a2, t.a1), what = t.an ? "腳" : "錢";
    return "解法二（反過來假設全是" + hiN + "）：全是" + hiN + "的話" + what + "共 " + A(t.a2) + " × " + t.h.n + " = " + A(qm(t.a2, t.h)) + "，比實際多了 " + A(ds) + "；每把 1 個" + hiN + "換成" + loN + "會少 " + A(gap) + "，所以" + loN + "有 " + A(ds) + " ÷ " + A(gap) + " = " + t.lo.n + "，" + hiN + "有 " + t.h.n + " − " + t.lo.n + " = " + t.hi.n + "。";
  }
  function two_expl3(t) { return two_expl(t, true).replace("解析：", "解法二（反過來假設全是" + (t.an ? "雞" : "甲種") + "）："); }
  /* 輸出後處理：分數平方一律加括號；分母 > 60 的分數或 9 位以上數字視為不乾淨，重抽 */
  function fixSq(s) { return typeof s === "string" ? s.replace(/(\d+ \d+\/\d+|\d+\/\d+)²/g, "($1)²") : s; }
  function post(o) {
    ["stem", "explain", "explain2", "trapNote"].forEach(function (f) { if (o[f] !== undefined) o[f] = fixSq(o[f]); });
    if (o.options) o.options = o.options.map(fixSq);
    o.explain = wrapMixed(o.explain); o.explain2 = wrapMixed(o.explain2);
    if (typeof o.answer === "string" && o.stem && !/分數/.test(o.stem)) {
      const hm = o.answer.match(/(\d+)\/(\d+)$/);
      if (hm) { let dn = +hm[2]; while (dn % 2 === 0) dn /= 2; while (dn % 5 === 0) dn /= 5; if (dn !== 1) o.stem += "（請以分數作答）"; }
    }
    if (o.accepted) o.accepted = o.accepted.filter(function (a) { const mm = /(\d+)\/(\d+)$/.exec(a); return !(mm && +mm[2] > 100); });
    const all = [o.stem, o.explain, o.explain2, o.trapNote, o.answer, o.options ? o.options.join(" ") : ""].join(" ");
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
    const fl = FL(k), z = RQ(k, fl, 5, 25), b = RQ(k, fl, 2, 8), a = RQ(k, fl, 2, 8), S2 = qa(qm(I(3), z), qa(qm(I(2), b), a)); need(S2, z, b, a); if (fl !== "mixed" && dg(qd(S2, I(3))) > 4) throw new Error("retry");
    return { fl: fl, z: z, b: b, a: a, S: S2, A: function (q) { return auto(q, fl); } };
  }

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const p = sd(k, 12, 60);
    const c = sc(k, p.x, [p.y, qa(p.S, p.D), qd(p.S, I(2)), qd(p.D, I(2))], p.fl);
    return Object.assign(c, { stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，其中較大的數是多少？",
      explain2: "解法二（畫線段圖）：兩個數的差是 " + p.A(p.D) + "，把大數多出的 " + p.A(p.D) + " 剪掉，兩個數就一樣大，和變成 " + p.A(qs(p.S, p.D)) + "，每個是 " + p.A(p.y) + "，大數 = " + p.A(p.y) + " + " + p.A(p.D) + " = " + p.A(p.x) + "，所以選 " + c.options[0] + "。",
      explain: "解析：和差問題：大的比小的多一個差，把差補到小的身上，兩個數就一樣大。大數 = (和 + 差) ÷ 2 = (" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "。" });
  });
  add("single-L1-02", "single", 1, "basic", function (k) {
    const p = sd(k, 15, 70);
    const c = sc(k, p.y, [p.x, qs(p.S, p.D), qd(p.S, I(2)), qd(p.D, I(2)), qa(p.S, p.D), p.D, p.S], p.fl);
    return Object.assign(c, { stem: "甲、乙兩袋米共 " + p.A(p.S) + " 公斤，甲袋比乙袋重 " + p.A(p.D) + " 公斤，乙袋重多少公斤？",
      explain2: "解法二（列方程式）：設乙袋 □ 公斤，甲袋就是 □ + " + p.A(p.D) + "，兩袋共 □ + □ + " + p.A(p.D) + " = " + p.A(p.S) + "，2 個 □ = " + p.A(qs(p.S, p.D)) + "，□ = " + p.A(p.y) + "，所以選 " + c.options[0] + "。",
      explain: "解析：小數 = (和 − 差) ÷ 2 = (" + p.A(p.S) + " − " + p.A(p.D) + ") ÷ 2 = " + p.A(p.y) + "（公斤）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const t = arith(k), v = t.nth(t.n), A = t.A;
    const c = sc(k, v, [qa(t.a, qm(t.d, I(t.n))), qm(t.d, I(t.n)), qa(t.a, qm(t.d, I(t.n + 1))), qm(t.a, I(t.n)), qa(t.a, qm(t.d, I(t.n - 2))), qm(t.d, I(t.n - 1))], t.fl);
    return Object.assign(c, { stem: "有一列數：" + t.head() + "照這個規律排下去，第 " + t.n + " 個數是多少？",
      explain2: "解法二（從第 2 個數算起）：第 2 個數是 " + A(qa(t.a, t.d)) + "，到第 " + t.n + " 個數還要加 " + (t.n - 2) + " 次 " + A(t.d) + "，共 " + A(qm(t.d, I(t.n - 2))) + "，" + A(qa(t.a, t.d)) + " + " + A(qm(t.d, I(t.n - 2))) + " = " + A(v) + "，所以選 " + c.options[0] + "。",
      explain: "解析：每次增加 " + A(t.d) + "，第 " + t.n + " 個數 = 第 1 個數 + (" + t.n + " − 1) × " + A(t.d) + " = " + A(t.a) + " + " + A(qm(t.d, I(t.n - 1))) + " = " + A(v) + "。",
      trapNote: "第 1 個數還沒有增加，到第 " + t.n + " 個數只增加了 " + (t.n - 1) + " 次；誤用 " + t.n + " 次會得到 " + A(qa(t.a, qm(t.d, I(t.n)))) + "。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    const t = two(k);
    const A = function (q) { return auto(q, t.fl); };
    const c = sc(k, t.hi, [t.lo, qd(t.h, I(2)), qs(t.T, t.h), qd(t.T, t.a2), qs(t.T, qm(t.a1, t.h))], "int");
    const ds = qs(qm(t.a2, t.h), t.T);
    return Object.assign(c, { stem: two_stem(t, true), explain2: two_expl2(t) + " 所以選 " + c.options[0] + "。",
      explain: two_expl(t, true),
      trapNote: "最後一步若用 " + A(ds) + " ÷ " + A(qs(t.a2, t.a1)) + " 算出的是" + (t.an ? "雞" : "甲種") + "（" + t.lo.n + (t.an ? " 隻" : " 支") + "）；要看清楚題目問的是哪一種。" });
  });
  add("single-L3-02", "single", 3, "basic", function (k) {
    const n0 = k.int(5, 15);
    const cs = [4 * n0, 3 * n0, 3 * n0 + 2, 3 * n0 - 1].map(String), w = k.distractors(String(3 * n0 + 1), cs, 3);
    return { stem: "用火柴棒排正方形：1 個正方形要 4 根，連排 2 個要 7 根，連排 3 個要 10 根……連排 " + n0 + " 個正方形需要幾根火柴棒？", options: [String(3 * n0 + 1)].concat(w), answer: 0,
      explain2: "解法二（畫圖數根數）：每個正方形有 3 根（上、下、右）是自己的，最左邊的豎線還要再加 1 根。連排 " + n0 + " 個，就是 3 × " + n0 + " = " + (3 * n0) + " 根再加 1 根，共 " + (3 * n0 + 1) + " 根，所以選 " + (3 * n0 + 1) + "。",
      explain: "解析：第 1 個用 4 根，之後每多 1 個正方形多 3 根，所以共 4 + 3 × (" + n0 + " − 1) = 3 × " + n0 + " + 1 = " + (3 * n0 + 1) + "（根）。" };
  });
  add("single-L4-01", "single", 4, "trap", function (k) {
    const m = k.int(8, 40);
    const cs = [m, m - 1, Math.round(3 * m / 2), m + 2].map(String), w = k.distractors(String(m + 1), cs, 3);
    return { stem: "三個連續整數的和是 " + (3 * m) + "，其中最大的數是多少？", options: [String(m + 1)].concat(w), answer: 0,
      explain2: "解法二（想中間的數）：三個連續整數，中間的數就是平均 " + m + "；比它小 1 的是 " + (m - 1) + "，比它大 1 的是 " + (m + 1) + "。最大的是 " + (m + 1) + "，所以選 " + (m + 1) + "。",
      explain: "解析：連續三個整數的中間數 = 和 ÷ 3 = " + (3 * m) + " ÷ 3 = " + m + "，最大的數 = " + m + " + 1 = " + (m + 1) + "。",
      trapNote: "和 ÷ 3 得到的 " + m + " 是中間那個數，不是最大的數；最大的要再加 1。" };
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const x = k.int(3, 12), y = k.int(3, 12), h = x + y, V = 10 * x + 5 * y;
    const cs = [y, V / 10, x / 2, V / 15, h, V - 5 * h].map(function (v) { return String(Number(v.toFixed(4))); }), w = k.distractors(String(x), cs, 3);
    return { stem: "存錢筒裡只有 10 元和 5 元的硬幣，共 " + h + " 個，總共 " + V + " 元，10 元硬幣有幾個？", options: [String(x)].concat(w), answer: 0,
      explain2: "解法二（反過來假設全是 10 元）：10 × " + h + " = " + (10 * h) + " 元，比實際多了 " + (10 * h - V) + " 元；每把 1 個 10 元換成 5 元少 5 元，所以 5 元有 " + ((10 * h - V) / 5) + " 個，10 元有 " + h + " − " + ((10 * h - V) / 5) + " = " + x + " 個，所以選 " + x + "。",
      explain: "解析：假設全是 5 元，共 5 × " + h + " = " + (5 * h) + " 元，少了 " + V + " − " + (5 * h) + " = " + (V - 5 * h) + " 元；每把 1 個 5 元換成 10 元多 5 元，所以 10 元有 " + (V - 5 * h) + " ÷ 5 = " + x + " 個。" };
  });
  add("single-L4-03", "single", 4, "extend", function (k) {
    let t, b;
    do { t = k.int(3, 15); b = k.int(3, 15); } while (t === b);
    const h = t + b, W = 3 * t + 2 * b;
    const cs = [b, Math.round(W / 3), 3 * h - W + 1, h - 1, W - h].map(String), w = k.distractors(String(t), cs, 3);
    return { stem: "遊樂場裡三輪車和腳踏車共 " + h + " 輛，輪子共 " + W + " 個（三輪車有 3 個輪子、腳踏車有 2 個輪子），三輪車有幾輛？", options: [String(t)].concat(w), answer: 0,
      explain2: "解法二（列方程式）：設三輪車有 □ 輛，腳踏車就有 " + h + " − □ 輛，輪子數：3 × □ + 2 × (" + h + " − □) = " + W + "，整理得 □ + " + (2 * h) + " = " + W + "，所以 □ = " + t + "，選 " + t + "。",
      explain: "解析：假設全是腳踏車，輪子有 2 × " + h + " = " + (2 * h) + " 個，少了 " + (W - 2 * h) + " 個；每把 1 輛腳踏車換成三輪車多 1 個輪子，所以三輪車有 " + (W - 2 * h) + " 輛。" };
  });
  add("single-L5-01", "single", 5, "extend", function (k) {
    const t = three(k), A = t.A, jia = qa(t.z, qa(t.a, t.b)), yi = qa(t.z, t.b);
    const c = sc(k, jia, [yi, qd(t.S, I(3)), qa(t.z, t.a), t.z, qa(t.z, qm(I(2), t.b)), qa(t.z, qa(t.a, qm(I(2), t.b))), qa(t.z, qm(I(2), t.a))], t.fl);
    return Object.assign(c, { stem: "甲、乙、丙三袋糖共 " + A(t.S) + " 公斤，乙袋比丙袋多 " + A(t.b) + " 公斤，甲袋又比乙袋多 " + A(t.a) + " 公斤，甲袋有幾公斤？",
      explain2: "解法二（平均數法）：三袋平均 " + A(t.S) + " ÷ 3 = " + A(qd(t.S, I(3))) + " 公斤；三袋比丙多的總共 " + A(qa(qm(I(2), t.b), t.a)) + "，平均每袋多 " + A(qd(qa(qm(I(2), t.b), t.a), I(3))) + "，丙 = " + A(t.z) + "，甲 = " + A(jia) + "，所以選 " + c.options[0] + "。",
      explain: "解析：把乙、甲都換成「丙的重量」：乙 = 丙 + " + A(t.b) + "，甲 = 丙 + " + A(qa(t.a, t.b)) + "。三袋共 3 個丙 + " + A(qa(qm(I(2), t.b), t.a)) + " = " + A(t.S) + "，丙 = (" + A(t.S) + " − " + A(qa(qm(I(2), t.b), t.a)) + ") ÷ 3 = " + A(t.z) + "，甲 = " + A(t.z) + " + " + A(qa(t.a, t.b)) + " = " + A(jia) + "（公斤）。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const p = sd(k, 12, 50);
    const c = muw(k,
      [["大數是 " + p.A(p.x), p.A(p.x) + " 比 " + p.A(p.y) + " 多 " + p.A(p.D)], ["小數是 " + p.A(p.y), "和 " + p.A(p.S) + " 減去大數剩小數"], ["大數 − 小數 = " + p.A(p.D), "題目說差是 " + p.A(p.D)], ["大數 + 小數 = " + p.A(p.S), "題目說和是 " + p.A(p.S)]],
      [["大數是 " + p.A(p.y), p.A(p.y) + " 是小的那一個"], ["小數是 " + p.A(p.x), p.A(p.x) + " 是大的那一個"], ["大數是 " + p.A(qd(p.S, I(2))), "和的一半是平均數，比大數小"]]);
    return Object.assign(c, { stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，選出所有正確的敘述。",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：大數 = (" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "，小數 = (" + p.A(p.S) + " − " + p.A(p.D) + ") ÷ 2 = " + p.A(p.y) + "。算出兩個數以後，再回頭對照題目的和與差，就能判斷每一句對不對。" });
  });
  add("multi-L2-01", "multi", 2, "basic", function (k) {
    const t = arith(k), A = t.A, n0 = Math.min(t.n, 15), v = t.nth(n0);
    if (t.a.n * t.d.d === t.d.n * t.a.d) throw new Error("retry");
    const c = muw(k,
      [["第 " + n0 + " 個數是 " + A(v), "第 1 個數加上 " + (n0 - 1) + " 次 " + A(t.d)], ["每一個數都比前一個數多 " + A(t.d), "第 2 個數 " + A(qa(t.a, t.d)) + " 減第 1 個數 " + A(t.a)], ["第 " + (n0 + 1) + " 個數是 " + A(qa(v, t.d)), "再往後加一次 " + A(t.d)]],
      [["第 " + n0 + " 個數是 " + A(qa(t.a, qm(t.d, I(n0)))), "多加了一次，應該只加 " + (n0 - 1) + " 次"], ["每一個數都比前一個數多 " + A(t.a), A(t.a) + " 是第 1 個數，不是相鄰兩數的差"], ["第 " + n0 + " 個數是 " + A(qm(t.d, I(n0))), "忘了第 1 個數"]]);
    return Object.assign(c, { stem: "數列：" + t.head() + "照規律排下去，選出所有正確的敘述。",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：公差是 " + A(t.d) + "，第 " + n0 + " 個數 = " + A(t.a) + " + " + (n0 - 1) + " × " + A(t.d) + " = " + A(v) + "，下一個再加 " + A(t.d) + "。第幾項就加幾減 1 次公差，因為第 1 項還沒有加過。" });
  });
  add("multi-L3-01", "multi", 3, "trap", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, gap = qs(t.a2, t.a1);
    const nl = t.an ? "雞" : "甲種筆", nh = t.an ? "兔" : "乙種筆", u = t.unit, what = t.an ? "腳" : "總價", un = t.an ? " 隻" : " 元";
    const swapTxt = "每把 1" + (t.an ? "隻雞換成 1 隻兔，腳" : "支甲換成 1 支乙，總價") + "會多 ";
    const c = muw(k,
      [[nl + "有 " + t.lo.n + " " + u, t.h.n + " 減去" + nh + " " + t.hi.n], [nh + "有 " + t.hi.n + " " + u, "多出的" + what + A(qs(t.T, qm(t.a1, t.h))) + " 除以每次多的 " + A(gap)], ["假設全是" + nl + "，" + what + "會是 " + A(qm(t.a1, t.h)) + un, A(t.a1) + " 乘 " + t.h.n], [swapTxt + A(gap) + un, A(t.a2) + " 減 " + A(t.a1)]],
      [[nl + "有 " + t.hi.n + " " + u, "數量說反了"], [nh + "有 " + t.lo.n + " " + u, "數量說反了"], [swapTxt + A(qa(gap, t.a1)) + un, "多的是兩者的差 " + A(gap) + "，不是把單價相加"]]);
    return Object.assign(c, { stem: t.an ? "雞和兔共 " + t.h.n + " 隻，腳共 " + t.T.n + " 隻，選出所有正確的敘述。" : "甲種筆每支 " + A(t.a1) + " 元、乙種筆每支 " + A(t.a2) + " 元，共買 " + t.h.n + " 支，付了 " + A(t.T) + " 元，選出所有正確的敘述。",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: two_expl(t, true) + "判斷時，先算出兩種各有幾個，再回頭對照每一句。",
      trapNote: t.an ? "雞 2 腳、兔 4 腳，換一隻只多 2 隻腳（4 − 2），不是多 4 隻；也容易把雞兔隻數說反。" : "換一支多的是兩種單價的「差」" + A(gap) + " 元，不是乙種的單價；也容易把甲乙支數說反。" });
  });
  add("multi-L4-01", "multi", 4, "trap", function (k) {
    const m = k.int(6, 30);
    const c = muw(k,
      [["中間的數是 " + m, (3 * m) + " ÷ 3 = " + m], ["最小的數是 " + (m - 1), "比中間的數少 1"], ["最大的數是 " + (m + 1), "比中間的數多 1"]],
      [["最小的數是 " + m, m + " 是中間的數"], ["最大的數是 " + (m + 2), "連續整數只差 1，不是差 2"], ["中間的數是 " + (3 * m / 2), "和要除以 3，不是除以 2"]]);
    return Object.assign(c, { stem: "三個連續整數的和是 " + (3 * m) + "，選出所有正確的敘述。",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：和 ÷ 3 = " + (3 * m) + " ÷ 3 = " + m + "，這是中間數；三數為 " + (m - 1) + "、" + m + "、" + (m + 1) + "。連續整數的平均數剛好就是最中間的那一個。",
      trapNote: "和 ÷ 3 得到的是平均數（中間數），不是最小或最大的數。" });
  });
  add("multi-L5-01", "multi", 5, "extend", function (k) {
    const t = three(k), A = t.A, jia = qa(t.z, qa(t.a, t.b)), yi = qa(t.z, t.b);
    const c = muw(k,
      [["丙有 " + A(t.z) + " 公斤", "三袋共 " + A(t.S) + "，扣掉多出的部分再平分"], ["乙有 " + A(yi) + " 公斤", A(t.z) + " 加上 " + A(t.b)], ["甲有 " + A(jia) + " 公斤", A(yi) + " 再加上 " + A(t.a)], ["甲比丙多 " + A(qa(t.a, t.b)) + " 公斤", A(t.a) + " 加 " + A(t.b)]],
      [["甲有 " + A(qa(t.z, t.a)) + " 公斤", "漏了乙比丙多的 " + A(t.b)], ["丙有 " + A(yi) + " 公斤", A(yi) + " 是乙的重量"], ["甲比丙多 " + A(t.a) + " 公斤", "還要加上乙比丙多的 " + A(t.b)]]);
    return Object.assign(c, { stem: "甲、乙、丙三袋糖共 " + A(t.S) + " 公斤，乙比丙多 " + A(t.b) + " 公斤，甲比乙多 " + A(t.a) + " 公斤，選出所有正確的敘述。",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：丙 = (" + A(t.S) + " − " + A(t.b) + " − " + A(qa(t.a, t.b)) + ") ÷ 3 = " + A(t.z) + "，乙 = " + A(yi) + "，甲 = " + A(jia) + "。先找到最小的丙，其他兩袋就是丙加上各自多出的部分。" });
  });
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const p = sd(k, 12, 50), ok = k.int(0, 1) === 1;
    return { stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，所以較大的數是 " + p.A(ok ? p.x : p.y) + "。", answer: ok,
      explain2: ok ? "解法二（代入檢查）：假設較大的數是 " + p.A(p.x) + "，那較小的數是 " + p.A(p.S) + " − " + p.A(p.x) + " = " + p.A(p.y) + "，差是 " + p.A(p.x) + " − " + p.A(p.y) + " = " + p.A(p.D) + "，和題目相符，所以這句話正確。" : "解法二（代入檢查）：假設較大的數是 " + p.A(p.y) + "，那另一個數是 " + p.A(p.S) + " − " + p.A(p.y) + " = " + p.A(p.x) + "，" + p.A(p.x) + " 比 " + p.A(p.y) + " 還大，互相矛盾，較大的數應該是 " + p.A(p.x) + "，所以這句話錯誤。",
      explain: "解析：先把兩個數都算出來再比對。大數 = (" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "，小數是 " + p.A(p.y) + "。" };
  });
  add("tf-L2-01", "tf", 2, "basic", function (k) {
    const t = arith(k), ok = k.int(0, 1) === 1, A = t.A, v = ok ? t.nth(t.n) : qa(t.a, qm(t.d, I(t.n)));
    return { stem: "數列 " + t.head() + "照規律排下去，第 " + t.n + " 個數是 " + A(v) + "。", answer: ok,
      explain2: "解法二（從第 2 個數算起）：第 2 個數是 " + A(qa(t.a, t.d)) + "，到第 " + t.n + " 個數還要加 " + (t.n - 2) + " 次 " + A(t.d) + "，共 " + A(qm(t.d, I(t.n - 2))) + "，得 " + A(t.nth(t.n)) + "。敘述寫 " + A(v) + "，所以這句話" + yn(ok) + "。",
      explain: "解析：第 " + t.n + " 個數 = " + A(t.a) + " + (" + t.n + " − 1) × " + A(t.d) + " = " + A(t.nth(t.n)) + "。" };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const t = two(k), ok = k.int(0, 1) === 1, v = ok ? t.hi : t.lo, A = function (q) { return auto(q, t.fl); };
    const nh = t.an ? "兔" : "乙種筆";
    return { stem: (t.an ? "雞和兔共 " + t.h.n + " 隻，腳共 " + t.T.n + " 隻，" : "甲種筆每支 " + A(t.a1) + " 元、乙種筆每支 " + A(t.a2) + " 元，共買 " + t.h.n + " 支，付了 " + A(t.T) + " 元，") + nh + (t.an ? "有 " + v.n + " 隻。" : "買了 " + v.n + " 支。"), answer: ok,
      explain2: two_expl2(t) + " 敘述說" + nh + (t.an ? "有 " + v.n + " 隻" : "買了 " + v.n + " 支") + "，所以這句話" + yn(ok) + "。",
      explain: two_expl(t, true),
      trapNote: "兩種數量容易說反；" + t.lo.n + " 是" + (t.an ? "雞" : "甲種筆") + "的數量，" + nh + "是 " + t.hi.n + "。" };
  });
  add("tf-L3-02", "tf", 3, "trap", function (k) {
    const x = k.int(10, 40), y = k.int(3, 9), ok = k.int(0, 1) === 1, S2 = x + y, D = ok ? x - y : x - y + 1;
    return { stem: "兩個整數的和是 " + S2 + "，差是 " + D + "，這樣的兩個整數存在。", answer: ok,
      explain2: "解法二（看奇偶）：兩個整數的和與差，奇偶一定相同（例如 7 和 3 的和是 10、差是 4，都是偶數；7 和 4 的和是 11、差是 3，都是奇數）。和 " + S2 + " 是" + (S2 % 2 ? "奇數" : "偶數") + "，差 " + D + " 是" + (D % 2 ? "奇數" : "偶數") + "，" + (ok ? "奇偶相同，" : "奇偶不同，") + "所以這句話" + yn(ok) + "。",
      explain: "解析：大數 = (和 + 差) ÷ 2 = (" + S2 + " + " + D + ") ÷ 2 = " + ((S2 + D) / 2) + "，" + (ok ? "是整數，存在。" : "不是整數，所以不存在這樣的兩個整數。"),
      trapNote: "和與差必須同為奇數或同為偶數，兩數才會是整數；一奇一偶時，(和 + 差) ÷ 2 會出現 .5。" };
  });
  add("tf-L4-01", "tf", 4, "trap", function (k) {
    const m = k.int(8, 40), ok = k.int(0, 1) === 1, v = ok ? m + 1 : m;
    return { stem: "三個連續整數的和是 " + (3 * m) + "，最大的數是 " + v + "。", answer: ok,
      explain2: "解法二（想中間的數）：三個連續整數，中間的數剛好是平均數；平均是和除以 3，最大的數要比平均多 1。敘述寫 " + v + "，" + (ok ? "正好是平均加 1" : "那只是平均數") + "，所以這句話" + yn(ok) + "。",
      explain: "解析：中間數 " + (3 * m) + " ÷ 3 = " + m + "，最大的數是 " + (m + 1) + "。",
      trapNote: "和 ÷ 3 只能得到中間那個數 " + m + "，不是最大的數。" };
  });
  add("tf-L5-01", "tf", 5, "extend", function (k) {
    const n0 = k.int(6, 20), ok = k.int(0, 1) === 1, v = ok ? 2 * n0 + 1 : 3 * n0;
    return { stem: "用火柴棒排連續的正三角形：1 個用 3 根，2 個用 5 根，3 個用 7 根……排 " + n0 + " 個要用 " + v + " 根。", answer: ok,
      explain2: "解法二（逐步試算）：1 個 3 根，2 個 5 根，3 個 7 根，每多 1 個多 2 根。排 " + n0 + " 個要 2 × " + n0 + " + 1 = " + (2 * n0 + 1) + " 根。敘述寫 " + v + " 根，所以這句話" + yn(ok) + "。",
      explain: "解析：規律是每多排 1 個三角形，就多用 2 根。第 1 個 3 根，之後每多 1 個多 2 根，共 3 + 2 × (" + n0 + " − 1) = " + (2 * n0 + 1) + " 根。" };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const p = sd(k, 12, 60);
    return Object.assign({ stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，大數是（　）。",
      explain2: "解法二（半和加半差）：和的一半是 " + p.A(qd(p.S, I(2))) + "，差的一半是 " + p.A(qd(p.D, I(2))) + "，大數等於這兩個一半加起來。答案：" + p.A(p.x) + "。",
      explain: "解析：(" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "。" }, ans(p.x, p.fl));
  });
  add("fill-L1-02", "fill", 1, "basic", function (k) {
    const p = sd(k, 15, 70);
    return Object.assign({ stem: "兩個數的和是 " + p.A(p.S) + "，差是 " + p.A(p.D) + "，小數是（　）。",
      explain2: "解法二（畫線段圖）：大數比小數多 " + p.A(p.D) + "，把多的部分從和裡拿掉，和變成 " + p.A(qs(p.S, p.D)) + "，剩下兩段一樣長的小數，每一段就是答案：" + p.A(p.y) + "。",
      explain: "解析：(" + p.A(p.S) + " − " + p.A(p.D) + ") ÷ 2 = " + p.A(p.y) + "。" }, ans(p.y, p.fl));
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const t = arith(k), v = t.nth(t.n);
    return Object.assign({ stem: "規律：" + t.head() + "第 " + t.n + " 個數是（　）。",
      explain2: "解法二（從第 2 個數算起）：第 2 個數是 " + t.A(qa(t.a, t.d)) + "，到第 " + t.n + " 個數還要加 " + (t.n - 2) + " 次 " + t.A(t.d) + "，共 " + t.A(qm(t.d, I(t.n - 2))) + "，" + t.A(qa(t.a, t.d)) + " + " + t.A(qm(t.d, I(t.n - 2))) + " = " + t.A(v) + "。答案：" + t.A(v) + "。",
      explain: "解析：每次都加同一個數，第幾個數就是第 1 個數加上（幾 − 1）次。" + t.A(t.a) + " + (" + t.n + " − 1) × " + t.A(t.d) + " = " + t.A(v) + "。" }, ans(v, t.fl));
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, ds = qs(qm(t.a2, t.h), t.T), gap = qs(t.a2, t.a1);
    const expl = t.an ? "解析：這是雞兔同籠，先假設全是兔，腳 4 × " + t.h.n + " = " + A(qm(t.a2, t.h)) + " 隻，多了 " + A(ds) + " 隻；每把 1 隻兔換成雞少 2 隻，雞 = " + A(ds) + " ÷ 2 = " + t.lo.n + "。"
      : "解析：這是兩種單價的問題，先假設全買乙種，共 " + A(qm(t.a2, t.h)) + " 元，多了 " + A(ds) + " 元；每把 1 支乙換成甲少 " + A(gap) + " 元，甲種 = " + A(ds) + " ÷ " + A(gap) + " = " + t.lo.n + "。";
    return { stem: (t.an ? "雞和兔共 " + t.h.n + " 隻，腳共 " + t.T.n + " 隻，雞有（　）隻。" : "甲種筆每支 " + A(t.a1) + " 元、乙種筆每支 " + A(t.a2) + " 元，共買 " + t.h.n + " 支，付了 " + A(t.T) + " 元，甲種筆買了（　）支。"),
      answer: String(t.lo.n), units: ["隻", "支"], explain2: two_expl3(t) + " 答案：" + t.lo.n + (t.an ? " 隻" : " 支") + "。",
      explain: expl,
      trapNote: "假設全是" + (t.an ? "兔" : "乙種") + "時，多出的" + (t.an ? "腳" : "錢") + "要除以「單價的差」" + A(gap) + "；除以其他數都會錯。" };
  });
  add("fill-L4-01", "fill", 4, "extend", function (k) {
    const fl = FL(k), a = RQ(k, fl, 2, 8), d = RQ(k, fl, 2, 5), n0 = 2 * k.int(2, 5), A = function (q) { return auto(q, fl); };
    const last = qa(a, qm(d, I(n0 - 1))), tot = qd(qm(qa(a, last), I(n0)), I(2)); need(tot, last);
    return Object.assign({ stem: "等差數列：" + A(a) + "、" + A(qa(a, d)) + "、" + A(qa(a, qm(d, I(2)))) + "……共 " + n0 + " 個數，全部加起來等於（　）。",
      explain2: "解法二（頭尾配對）：第 1 個和最後一個加起來 " + A(a) + " + " + A(last) + " = " + A(qa(a, last)) + "，第 2 個和倒數第 2 個也一樣，" + n0 + " 個數可以配成 " + (n0 / 2) + " 對，共 " + A(qa(a, last)) + " × " + (n0 / 2) + " = " + A(tot) + "。答案：" + A(tot) + "。",
      explain: "解析：最後一個數 = " + A(a) + " + " + (n0 - 1) + " × " + A(d) + " = " + A(last) + "；總和 = (首 + 尾) × 個數 ÷ 2 = (" + A(a) + " + " + A(last) + ") × " + n0 + " ÷ 2 = " + A(tot) + "。" }, ans(tot, fl));
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const t = three(k), A = t.A;
    return Object.assign({ stem: "甲、乙、丙三桶油共 " + A(t.S) + " 公升，乙比丙多 " + A(t.b) + " 公升，甲比乙多 " + A(t.a) + " 公升，丙桶有（　）公升。", units: ["公升"],
      explain2: "解法二（平均數法）：平均每桶 " + A(t.S) + " ÷ 3 = " + A(qd(t.S, I(3))) + " 公升；三桶比丙多的總共 " + A(qa(t.a, qm(I(2), t.b))) + "，平均多 " + A(qd(qa(t.a, qm(I(2), t.b)), I(3))) + "，丙 = " + A(t.z) + "。答案：" + A(t.z) + " 公升。",
      explain: "解析：甲 = 丙 + " + A(qa(t.a, t.b)) + "，乙 = 丙 + " + A(t.b) + "；三桶共 3 個丙 + " + A(qa(t.a, qm(I(2), t.b))) + " = " + A(t.S) + "，丙 = (" + A(t.S) + " − " + A(qa(t.a, qm(I(2), t.b))) + ") ÷ 3 = " + A(t.z) + "。" }, ans(t.z, t.fl));
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const p = sd(k, 12, 60);
    return Object.assign({ stem: "和是 " + p.A(p.S) + "、差是 " + p.A(p.D) + "，求大數：(" + ex(p.S, p.fl) + " + " + ex(p.D, p.fl) + ") ÷ 2",
      explain2: "解法二（半和加半差）：和的一半是 " + p.A(qd(p.S, I(2))) + "，差的一半是 " + p.A(qd(p.D, I(2))) + "，大數 = 和的一半 + 差的一半 = " + p.A(p.x) + "。答案：" + p.A(p.x) + "。",
      explain: "解析：先把差補到小數上，兩個數就一樣大。" + p.A(qa(p.S, p.D)) + " ÷ 2 = " + p.A(p.x) + "。" }, ans(p.x, p.fl));
  });
  add("calc-L2-01", "calc", 2, "basic", function (k) {
    const p = sd(k, 15, 70);
    return Object.assign({ stem: "和是 " + p.A(p.S) + "、差是 " + p.A(p.D) + "，求小數：(" + ex(p.S, p.fl) + " − " + ex(p.D, p.fl) + ") ÷ 2",
      explain2: "解法二（半和減半差）：和的一半是 " + p.A(qd(p.S, I(2))) + "，差的一半是 " + p.A(qd(p.D, I(2))) + "，小數 = " + p.A(qd(p.S, I(2))) + " − " + p.A(qd(p.D, I(2))) + " = " + p.A(p.y) + "。答案：" + p.A(p.y) + "。",
      explain: "解析：先把差從和裡拿掉，剩下的是兩個一樣大的小數。" + p.A(qs(p.S, p.D)) + " ÷ 2 = " + p.A(p.y) + "。" }, ans(p.y, p.fl));
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, ds = qs(t.T, qm(t.a1, t.h)), gap = qs(t.a2, t.a1);
    return Object.assign({ stem: t.an ? "雞兔同籠，共 " + t.h.n + " 隻、腳 " + t.T.n + " 隻，求兔數：(" + t.T.n + " − 2 × " + t.h.n + ") ÷ 2"
      : "兩種筆共 " + t.h.n + " 支，甲每支 " + A(t.a1) + " 元、乙每支 " + A(t.a2) + " 元，共 " + A(t.T) + " 元，求乙種的支數：(" + ex(t.T, t.fl) + " − " + ex(t.a1, t.fl) + " × " + t.h.n + ") ÷ (" + ex(t.a2, t.fl) + " − " + ex(t.a1, t.fl) + ")",
      explain2: two_expl2(t) + " 答案：" + t.hi.n + "。",
      explain: "解析：先假設全部都是單價低的那一種。" + (t.an ? "2 × " + t.h.n + " = " + A(qm(t.a1, t.h)) + "，" : A(t.a1) + " × " + t.h.n + " = " + A(qm(t.a1, t.h)) + "，") + A(t.T) + " − " + A(qm(t.a1, t.h)) + " = " + A(ds) + "，÷ " + A(gap) + " = " + t.hi.n + "。" }, ans(t.hi, "int"));
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, ds = qs(qm(t.a2, t.h), t.T), gap = qs(t.a2, t.a1);
    return Object.assign({ stem: t.an ? "雞兔同籠，共 " + t.h.n + " 隻、腳 " + t.T.n + " 隻，求雞數：(4 × " + t.h.n + " − " + t.T.n + ") ÷ 2"
      : "兩種筆共 " + t.h.n + " 支，甲每支 " + A(t.a1) + " 元、乙每支 " + A(t.a2) + " 元，共 " + A(t.T) + " 元，求甲種的支數：(" + ex(t.a2, t.fl) + " × " + t.h.n + " − " + ex(t.T, t.fl) + ") ÷ (" + ex(t.a2, t.fl) + " − " + ex(t.a1, t.fl) + ")",
      explain2: "解法二（先當成全部都是" + (t.an ? "雞" : "甲種") + "）：" + (t.an ? "腳" : "錢") + "共有 " + A(qm(t.a1, t.h)) + "，比實際少了 " + A(qs(t.T, qm(t.a1, t.h))) + "；每把 1 個換成" + (t.an ? "兔" : "乙種") + "就多 " + A(gap) + "，要換 " + t.hi.n + " 個，所以" + (t.an ? "雞" : "甲種") + "有 " + t.h.n + " − " + t.hi.n + " = " + t.lo.n + " 個。答案：" + t.lo.n + "。",
      explain: "解析：" + (t.an ? "4" : A(t.a2)) + " × " + t.h.n + " = " + A(qm(t.a2, t.h)) + "，" + A(qm(t.a2, t.h)) + " − " + A(t.T) + " = " + A(ds) + "，÷ " + A(gap) + " = " + t.lo.n + "。",
      trapNote: "先乘後減，括號內算完再除；若寫成沒有括號的 " + (t.an ? "4" : A(t.a2)) + " × " + t.h.n + " − " + A(t.T) + " ÷ " + A(gap) + "，就會先除，答案不同。" }, ans(t.lo, "int"));
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const fl = FL(k), a = RQ(k, fl, 2, 8), d = RQ(k, fl, 2, 5), n0 = 2 * k.int(2, 6), A = function (q) { return auto(q, fl); };
    const last = qa(a, qm(d, I(n0 - 1))), tot = qd(qm(qa(a, last), I(n0)), I(2)); need(tot, last);
    return Object.assign({ stem: "首項 " + A(a) + "、每項加 " + A(d) + "、共 " + n0 + " 項，求總和：(" + ex(a, fl) + " + (" + ex(a, fl) + " + (" + n0 + " − 1) × " + ex(d, fl) + ")) × " + n0 + " ÷ 2",
      explain2: "解法二（頭尾配對）：第 1 項和第 " + n0 + " 項相加：" + A(a) + " + " + A(last) + " = " + A(qa(a, last)) + "，" + n0 + " 項可以配成 " + (n0 / 2) + " 對，共 " + A(qa(a, last)) + " × " + (n0 / 2) + " = " + A(tot) + "。答案：" + A(tot) + "。",
      explain: "解析：等差數列的總和 = （首項 + 末項）× 項數 ÷ 2。末項 " + A(a) + " + " + (n0 - 1) + " × " + A(d) + " = " + A(last) + "；(" + A(a) + " + " + A(last) + ") × " + n0 + " ÷ 2 = " + A(tot) + "。" }, ans(tot, fl));
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const p = sd(k, 25, 45);
    return Object.assign({ stem: "兩條緞帶共長 " + p.A(p.S) + " 公尺，紅色的比藍色的長 " + p.A(p.D) + " 公尺，紅色緞帶長幾公尺？", units: ["公尺", "m"],
      explain2: "解法二（半和加半差）：兩條緞帶共長的一半是 " + p.A(qd(p.S, I(2))) + " 公尺，差的一半是 " + p.A(qd(p.D, I(2))) + " 公尺，紅色的是這兩個一半的和。答案：" + p.A(p.x) + " 公尺。",
      explain: "解析：(" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "（公尺）。" }, ans(p.x, p.fl));
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const fl = FL(k), a = RQ(k, fl, 10, 50), d = RQ(k, fl, 5, 20), n0 = k.int(6, 12), A = function (q) { return auto(q, fl); }, v = qa(a, qm(d, I(n0 - 1)));
    return Object.assign({ stem: "小樹苗第 1 週高 " + A(a) + " 公分，之後每一週都比前一週多長高 " + A(d) + " 公分，第 " + n0 + " 週它高多少公分？", units: ["公分", "cm"],
      explain2: "解法二（從第 2 週算起）：第 2 週高 " + A(qa(a, d)) + " 公分，之後還要再長 " + (n0 - 2) + " 週，每週多長高 " + A(d) + " 公分。答案：" + A(v) + " 公分。",
      explain: "解析：第 " + n0 + " 週 = " + A(a) + " + (" + n0 + " − 1) × " + A(d) + " = " + A(v) + "（公分）。" }, ans(v, fl));
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const t = two(k), A = function (q) { return auto(q, t.fl); }, ds = qs(qm(t.a2, t.h), t.T), gap = qs(t.a2, t.a1);
    return Object.assign({ stem: t.an ? "農場裡有雞和兔共 " + t.h.n + " 隻，數一數共有 " + t.T.n + " 隻腳，雞有幾隻？" : "文具店的甲種筆每支 " + A(t.a1) + " 元、乙種筆每支 " + A(t.a2) + " 元，小美共買了 " + t.h.n + " 支，付了 " + A(t.T) + " 元，甲種筆買了幾支？", answer: String(t.lo.n), units: ["隻", "支"],
      explain2: two_expl3(t) + " 答案：" + t.lo.n + (t.an ? " 隻" : " 支") + "。",
      explain: t.an ? "解析：這是雞兔同籠，先假設全是兔，腳 " + A(qm(t.a2, t.h)) + " 隻，多出 " + A(ds) + " 隻；每把 1 隻兔換成雞少 2 隻腳，雞 = " + A(ds) + " ÷ 2 = " + t.lo.n + "（隻）。" : "解析：這是兩種單價的問題，先假設全買乙種，共 " + A(qm(t.a2, t.h)) + " 元，多出 " + A(ds) + " 元；每換 1 支少 " + A(gap) + " 元，甲種 = " + A(ds) + " ÷ " + A(gap) + " = " + t.lo.n + "（支）。",
      trapNote: "題目問的是" + (t.an ? "雞" : "甲種筆") + "；先求" + (t.an ? "兔" : "乙種") + "再答" + (t.an ? "兔" : "乙種") + "是常見失誤。也別忘記要除以單價的差 " + A(gap) + "。" });
  });
  add("word-L4-01", "word", 4, "extend", function (k) {
    if (k.int(0, 1) === 0) {
      const x = k.int(3, 12), y = k.int(3, 12), h = x + y, V = 10 * x + 5 * y;
      return { stem: "撲滿裡只有 10 元和 5 元硬幣，共 " + h + " 個，合計 " + V + " 元，10 元硬幣有幾個？", answer: String(x), units: ["個"],
        explain2: "解法二（反過來假設全是 10 元）：10 × " + h + " = " + (10 * h) + " 元，比實際多了 " + (10 * h - V) + " 元；每把 1 個 10 元換成 5 元少 5 元，所以 5 元有 " + ((10 * h - V) / 5) + " 個，10 元有 " + h + " − " + ((10 * h - V) / 5) + " = " + x + " 個。答案：" + x + " 個。",
      explain: "解析：這是雞兔同籠的變化題。假設全是 5 元：" + (5 * h) + " 元，少 " + (V - 5 * h) + " 元；每換 1 個多 5 元，10 元硬幣 = " + (V - 5 * h) + " ÷ 5 = " + x + "（個）。" };
    }
    const fl = k.flavor(["dec", "mixed"]), A = function (q) { return auto(q, fl); }, kid = RQ(k, fl, 2, 9), adult = qa(kid, RQ(k, fl, 2, 8)), c1 = k.int(3, 15), c2 = k.int(3, 15);
    if (c1 === c2) throw new Error("retry");
    const T = qa(qm(kid, I(c1)), qm(adult, I(c2))); need(kid, adult, T);
    const base = qm(kid, I(c1 + c2)), gap = qs(adult, kid);
    return Object.assign({ explain2: "解法二（反過來假設全是成人票）：" + A(adult) + " × " + (c1 + c2) + " = " + A(qm(adult, I(c1 + c2))) + " 元，比實際多了 " + A(qs(qm(adult, I(c1 + c2)), T)) + " 元；每把 1 張成人票換成兒童票少 " + A(gap) + " 元，所以兒童票 " + c1 + " 張，成人票 " + (c1 + c2) + " − " + c1 + " = " + c2 + " 張。答案：" + c2 + " 張。", stem: "遊樂園兒童票每張 " + A(kid) + " 元、成人票每張 " + A(adult) + " 元，共賣出 " + (c1 + c2) + " 張，收入 " + A(T) + " 元，成人票賣出幾張？", answer: String(c2), units: ["張"],
      explain: "解析：這是雞兔同籠的變化題。假設全是兒童票：" + A(kid) + " × " + (c1 + c2) + " = " + A(base) + " 元，少 " + A(qs(T, base)) + " 元；每換 1 張多 " + A(gap) + " 元，成人票 = " + A(qs(T, base)) + " ÷ " + A(gap) + " = " + c2 + "（張）。" });
  });
  add("word-L4-02", "word", 4, "trap", function (k) {
    const m = k.int(8, 21);
    return { stem: "月曆上同一直行相鄰的三個日期（上下相差 7 天），三個日期的和是 " + (3 * m) + "，其中最大的日期是幾號？", answer: String(m + 7), units: ["號", "日"],
      explain2: "解法二（畫月曆）：同一直行的三個日期，中間的日期是平均 " + m + " 號，上面一個是 " + (m - 7) + " 號，下面一個是 " + (m + 7) + " 號。最大的日期是 " + (m + 7) + " 號。答案：" + (m + 7) + " 號。",
      explain: "解析：中間日期 = " + (3 * m) + " ÷ 3 = " + m + " 號，最大的 = " + m + " + 7 = " + (m + 7) + " 號。",
      trapNote: "月曆上下相鄰差 7，不是差 1；若誤當成連續整數會得到 " + (m + 1) + " 號。" };
  });
  add("word-L4-03", "word", 4, "extend", function (k) {
    let t, b;
    do { t = k.int(3, 15); b = k.int(3, 15); } while (t === b);
    const h = t + b, W = 3 * t + 2 * b;
    return { stem: "公園裡三輪車和腳踏車共 " + h + " 輛，輪子共 " + W + " 個（三輪車 3 個輪子、腳踏車 2 個輪子），三輪車有幾輛？", answer: String(t), units: ["輛"],
      explain2: "解法二（反過來假設全是三輪車）：輪子 3 × " + h + " = " + (3 * h) + " 個，比實際多了 " + (3 * h - W) + " 個；每把 1 輛三輪車換成腳踏車少 1 個輪子，所以腳踏車有 " + (3 * h - W) + " 輛，三輪車有 " + h + " − " + (3 * h - W) + " = " + t + " 輛。答案：" + t + " 輛。",
      explain: "解析：這是雞兔同籠的變化題。假設全是腳踏車，輪子 " + (2 * h) + " 個，少 " + (W - 2 * h) + " 個；每換 1 輛多 1 個輪子，三輪車 " + (W - 2 * h) + " 輛。" };
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const fl = FL(k), n0 = 2 * k.int(2, 5), a = RQ(k, fl, 2, 6), d = RQ(k, fl, 1, 3), A = function (q) { return auto(q, fl); };
    const last = qa(a, qm(d, I(n0 - 1))), tot = qd(qm(qa(a, last), I(n0)), I(2)); need(tot, last);
    return Object.assign({ stem: "把木條排成階梯：最短的一條長 " + A(a) + " 公分，每一條都比前一條長 " + A(d) + " 公分，共排 " + n0 + " 條，全部木條的長度合計多少公分？", units: ["公分", "cm"],
      explain2: "解法二（頭尾配對）：最短的和最長的相加：" + A(a) + " + " + A(last) + " = " + A(qa(a, last)) + "，" + n0 + " 條可以配成 " + (n0 / 2) + " 對，合計 " + A(qa(a, last)) + " × " + (n0 / 2) + " = " + A(tot) + " 公分。答案：" + A(tot) + " 公分。",
      explain: "解析：這是等差數列的總和：合計 = （最短 + 最長）× 條數 ÷ 2。最長一條 " + A(a) + " + " + (n0 - 1) + " × " + A(d) + " = " + A(last) + " 公分；合計 = (" + A(a) + " + " + A(last) + ") × " + n0 + " ÷ 2 = " + A(tot) + "（公分）。" }, ans(tot, fl));
  });

  /* ---------- 教材 □ 未知數題（規格第 14 節） ---------- */
  add("single-L1-03", "single", 1, "basic", function (k) {
    const p = sd(k, 12, 60);
    const c = sc(k, p.y, [p.x, qs(p.S, p.D), qd(p.S, I(2)), qd(p.D, I(2)), qa(p.S, p.D)], p.fl);
    return Object.assign(c, { stem: "□ + △ = " + p.A(p.S) + "，□ − △ = " + p.A(p.D) + "，△ 是多少？",
      explain2: "解法二（畫線段圖）：□ 比 △ 多 " + p.A(p.D) + "，從 □ 剪掉多出的部分，兩段就一樣長，每段是 " + p.A(p.y) + "，所以 △ 是 " + c.options[0] + "。",
      explain: "解析：△ = (和 − 差) ÷ 2 = (" + p.A(p.S) + " − " + p.A(p.D) + ") ÷ 2 = " + p.A(p.y) + "（□ = " + p.A(p.x) + "）。" });
  });
  add("fill-L1-03", "fill", 1, "basic", function (k) {
    const p = sd(k, 12, 60);
    return Object.assign({ stem: "□ + △ = " + p.A(p.S) + "，□ − △ = " + p.A(p.D) + "，□ 是多少？",
      explain2: "解法二（畫線段圖）：□ 比 △ 多 " + p.A(p.D) + "。給 △ 補上這個差，兩段就一樣長，總和變成 " + p.A(qa(p.S, p.D)) + "，一段就是 □，所以 □ = " + p.A(p.x) + "。",
      explain: "解析：□ = (和 + 差) ÷ 2 = (" + p.A(p.S) + " + " + p.A(p.D) + ") ÷ 2 = " + p.A(p.x) + "。" }, ans(p.x, p.fl));
  });
  add("calc-L2-02", "calc", 2, "basic", function (k) {
    const p = sd(k, 15, 70);
    return Object.assign({ stem: "□ + △ = " + p.A(p.S) + "，□ − △ = " + p.A(p.D) + "，求 △：(" + ex(p.S, p.fl) + " − " + ex(p.D, p.fl) + ") ÷ 2",
      explain2: "解法二（半和減半差）：和的一半是 " + p.A(qd(p.S, I(2))) + "，差的一半是 " + p.A(qd(p.D, I(2))) + "，△ 等於和的一半減差的一半，結果是 " + p.A(p.y) + "。答案：" + p.A(p.y) + "。",
      explain: "解析：" + p.A(qs(p.S, p.D)) + " ÷ 2 = " + p.A(p.y) + "。" }, ans(p.y, p.fl));
  });
  add("single-L3-04", "single", 3, "trap", function (k) {
    const fl = FL(k), small = RQ(k, fl, 3, 20), m = k.pick([2, 3, 4, 5, 1.5, 2.5]), mq = Q(Math.round(m * 2), 2), big = qm(small, mq), S2 = qa(small, big); need(S2, big, small);
    const c = sc(k, small, [big, qd(S2, mq), qd(S2, I(2)), qs(S2, small)], fl);
    return Object.assign(c, { stem: "△ + □ = " + auto(S2, fl) + "，□ 是 △ 的 " + auto(mq, "dec") + " 倍，△ 是多少？",
      explain2: "解法二（代入選項驗算）：假設 △ = " + c.options[0] + "，□ = " + auto(small, fl) + " × " + auto(mq, "dec") + " = " + auto(big, fl) + "，兩個加起來 " + auto(S2, fl) + "，和題目相符，所以選 " + c.options[0] + "。",
      explain: "解析：把 △ 當 1 份，□ 是 " + auto(mq, "dec") + " 份，共 " + auto(qa(I(1), mq), "dec") + " 份，△ = " + auto(S2, fl) + " ÷ " + auto(qa(I(1), mq), "dec") + " = " + auto(small, fl) + "（□ = " + auto(big, fl) + "）。",
      trapNote: "算出 " + auto(big, fl) + " 的是 □（大的那份），題目問的是 △；也不能直接把和 ÷ 2。" });
  });
  add("word-L3-03", "word", 3, "trap", function (k) {
    const fl = FL(k), a = RQ(k, fl, 10, 50), d = RQ(k, fl, 5, 20), n0 = k.int(5, 15), v = qa(a, qm(d, I(n0 - 1))), A = function (q) { return auto(q, fl); }; need(v);
    return { stem: "小明第 1 週存了 " + A(a) + " 元，之後每一週都比前一週多存 " + A(d) + " 元，第 □ 週他存了 " + A(v) + " 元。", answer: String(n0), units: ["週"],
      explain2: "解法二（逐週列出）：第 1 週 " + A(a) + " 元，第 2 週 " + A(qa(a, d)) + " 元，第 3 週 " + A(qa(a, qm(d, I(2)))) + " 元……每週加 " + A(d) + " 元，要從 " + A(a) + " 加到 " + A(v) + "，共加 " + A(qs(v, a)) + " 元，也就是加了 " + (n0 - 1) + " 次，所以是第 " + n0 + " 週。答案：" + n0 + " 週。",
      explain: "解析：從第 1 週到 □ 週共增加 (" + A(v) + " − " + A(a) + ") ÷ " + A(d) + " = " + (n0 - 1) + " 次，所以 □ = " + (n0 - 1) + " + 1 = " + n0 + "。",
      trapNote: "(" + A(v) + " − " + A(a) + ") ÷ " + A(d) + " = " + (n0 - 1) + " 只是增加的次數，第 1 週還沒有增加，要再加 1 才是第 " + n0 + " 週。" };
  });
  add("tf-L4-02", "tf", 4, "trap", function (k) {
    const t = arith(k), n0 = k.int(6, 15), v = t.nth(n0), ok = k.int(0, 1) === 1, A = t.A; need(v);
    return { stem: "數列 " + t.head() + "裡，" + A(v) + " 是第 □ 個數，□ = " + (ok ? n0 : n0 - 1) + "。", answer: ok,
      explain2: "解法二（逐項列出）：" + t.head() + "每次加 " + A(t.d) + "。第 " + n0 + " 個數 = 第 1 個數加 " + (n0 - 1) + " 次 = " + A(v) + "，所以 " + A(v) + " 是第 " + n0 + " 個數，不是第 " + (n0 - 1) + " 個。敘述寫 □ = " + (ok ? n0 : n0 - 1) + "，所以這句話" + yn(ok) + "。",
      explain: "解析：(" + A(v) + " − " + A(t.a) + ") ÷ " + A(t.d) + " = " + (n0 - 1) + " 次增加，所以是第 " + (n0 - 1) + " + 1 = " + n0 + " 個數。",
      trapNote: "(" + A(v) + " − " + A(t.a) + ") ÷ " + A(t.d) + " = " + (n0 - 1) + " 是增加的次數，項數要再加 1。" };
  });
  add("calc-L4-02", "calc", 4, "trap", function (k) {
    const t = arith(k), A = t.A, v = t.nth(t.n); need(v);
    return Object.assign({ stem: "數列每次增加 " + A(t.d) + "，第 " + t.n + " 個數是 " + A(v) + "，第 1 個數 □ 是多少？求 □：" + ex(v, t.fl) + " − (" + t.n + " − 1) × " + ex(t.d, t.fl),
      explain2: "解法二（倒著退回去）：從第 " + t.n + " 個數 " + A(v) + " 往前退，每退一個數就減 " + A(t.d) + "，退到第 1 個數要退 " + (t.n - 1) + " 次，退完就是首項 □ = " + A(t.a) + "。",
      explain: "解析：第 " + t.n + " 個數比第 1 個數多增加了 " + (t.n - 1) + " 次，□ = " + A(v) + " − " + (t.n - 1) + " × " + A(t.d) + " = " + A(t.a) + "。",
      trapNote: "從第 1 個到第 " + t.n + " 個只增加 " + (t.n - 1) + " 次；扣掉 " + t.n + " 次會得到 " + A(qs(v, qm(t.d, I(t.n)))) + "，是錯的。" }, ans(t.a, t.fl));
  });
  add("fill-L5-02", "fill", 5, "extend", function (k) {
    const t = three(k), A = t.A;
    return Object.assign({ stem: "□ + △ + ○ = " + A(t.S) + "，□ − △ = " + A(t.a) + "，△ − ○ = " + A(t.b) + "，○ 是多少？",
      explain2: "解法二（平均數法）：三數平均 " + A(t.S) + " ÷ 3 = " + A(qd(t.S, I(3))) + "；△ 比 ○ 多 " + A(t.b) + "，□ 比 ○ 多 " + A(qa(t.a, t.b)) + "，三數比 ○ 多的總共 " + A(qa(t.a, qm(I(2), t.b))) + "，平均多 " + A(qd(qa(t.a, qm(I(2), t.b)), I(3))) + "，○ = " + A(t.z) + "。答案：" + A(t.z) + "。",
      explain: "解析：△ = ○ + " + A(t.b) + "，□ = △ + " + A(t.a) + " = ○ + " + A(qa(t.a, t.b)) + "；三數和 = 3 個 ○ + " + A(qa(qm(I(2), t.b), t.a)) + " = " + A(t.S) + "，○ = (" + A(t.S) + " − " + A(qa(qm(I(2), t.b), t.a)) + ") ÷ 3 = " + A(t.z) + "。" }, ans(t.z, t.fl));
  });
  add("single-L5-03", "single", 5, "extend", function (k) {
    const fl = FL(k), z = RQ(k, fl, 5, 30), d = RQ(k, fl, 1, 6), S2 = qa(qm(I(3), z), qm(I(3), d)), d2 = qm(I(2), d); need(S2, z, d2);
    const c = sc(k, z, [qd(S2, I(3)), qa(z, d), qa(z, d2), qs(qd(S2, I(3)), d2), qs(S2, qm(I(3), d2))], fl);
    return Object.assign(c, { stem: "三個數依序相差 " + auto(d, fl) + "：□ + (□ + " + auto(d, fl) + ") + (□ + " + auto(d2, fl) + ") = " + auto(S2, fl) + "，□ 是多少？",
      explain2: "解法二（平均數法）：三個數依序相差 " + auto(d, fl) + "，中間那個數剛好是三個數的平均 " + auto(qd(S2, I(3)), fl) + "，最小的 □ 比平均少一個 " + auto(d, fl) + "，所以 □ 是 " + c.options[0] + "。",
      explain: "解析：三個 □ 再加上 " + auto(d, fl) + " 和 " + auto(d2, fl) + "，總共是 " + auto(S2, fl) + "，所以 3 個 □ = " + auto(S2, fl) + " − " + auto(qa(d, d2), fl) + " = " + auto(qm(I(3), z), fl) + "，□ = " + auto(z, fl) + "。" });
  });

  ExamBank.register("solve-upper", "solve-upper-main", S);
})();
