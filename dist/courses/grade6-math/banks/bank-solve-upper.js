/* 題庫：solve-upper 和差問題、規律、雞兔同籠。題庫工 B */
(function () {
  "use strict";
  const S = [];
  function add(id, type, level, tag, gen) { S.push({ id: "solve-upper-" + id, type, level, tag, gen }); }
  function sc(k, correct, cands) {
    const w = k.distractors(correct, cands, 3);
    if (w.length < 3) throw new Error("distractor shortage");
    return { options: [String(correct)].concat(w), answer: 0 };
  }
  function mu(k, goods, bads) {
    const g = k.shuffle(goods).slice(0, k.int(2, 3));
    const b = k.shuffle(bads).slice(0, 2);
    return { options: g.concat(b), answer: g.map(function (_, i) { return i; }) };
  }
  /* 雞兔同籠：回傳雞、兔數（不同）與頭、腳 */
  function cr(k, lo, hi) {
    let c, r;
    do { c = k.int(lo, hi); r = k.int(lo, hi); } while (c === r);
    return { c: c, r: r, h: c + r, L: 2 * c + 4 * r };
  }
  /* 和差：大數 x、小數 y */
  function sd(k, lo, hi) {
    const x = k.int(lo, hi), y = k.int(3, x - 3);
    return { x: x, y: y, S: x + y, D: x - y };
  }

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const p = sd(k, 12, 60), n = k.num;
    const c = sc(k, p.x, [p.y, p.S + p.D, n(p.S / 2), n(p.D / 2)]);
    return Object.assign(c, { stem: "兩個數的和是 " + p.S + "，差是 " + p.D + "，其中較大的數是多少？",
      explain: "解析：大數 = (和 + 差) ÷ 2 = (" + p.S + " + " + p.D + ") ÷ 2 = " + p.x + "。" });
  });
  add("single-L1-02", "single", 1, "basic", function (k) {
    const p = sd(k, 15, 70), n = k.num;
    const c = sc(k, p.y, [p.x, n(p.S - p.D), n(p.S / 2), n(p.D / 2), p.S + p.D, p.D, p.S]);
    return Object.assign(c, { stem: "甲、乙兩袋米共 " + p.S + " 公斤，甲袋比乙袋重 " + p.D + " 公斤，乙袋重多少公斤？",
      explain: "解析：小數 = (和 − 差) ÷ 2 = (" + p.S + " − " + p.D + ") ÷ 2 = " + p.y + "（公斤）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const a = k.int(2, 9), d = k.int(2, 6), n0 = k.int(8, 20);
    const c = sc(k, a + (n0 - 1) * d, [a + n0 * d, n0 * d, a + (n0 + 1) * d, a * n0, a + (n0 - 2) * d, d * (n0 - 1)]);
    return Object.assign(c, { stem: "有一列數：" + a + "、" + (a + d) + "、" + (a + 2 * d) + "、" + (a + 3 * d) + "……照這個規律排下去，第 " + n0 + " 個數是多少？",
      explain: "解析：每次增加 " + d + "，第 " + n0 + " 個數 = 第 1 個數 + (" + n0 + " − 1) × " + d + " = " + a + " + " + ((n0 - 1) * d) + " = " + (a + (n0 - 1) * d) + "。",
      trapNote: "第 1 個數還沒有增加，到第 " + n0 + " 個數只增加了 " + (n0 - 1) + " 次；誤用 " + n0 + " 次會得到 " + (a + n0 * d) + "。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    const p = cr(k, 3, 20);
    const c = sc(k, p.r, [p.c, p.h / 2 | 0, p.L / 4 | 0, p.L - p.h]);
    return Object.assign(c, { stem: "籠子裡有雞和兔共 " + p.h + " 隻，數一數腳共有 " + p.L + " 隻，兔有幾隻？",
      explain: "解析：假設全是雞，腳有 2 × " + p.h + " = " + (2 * p.h) + " 隻，少了 " + p.L + " − " + (2 * p.h) + " = " + (p.L - 2 * p.h) + " 隻；每把 1 隻雞換成兔多 2 隻腳，所以兔有 " + (p.L - 2 * p.h) + " ÷ 2 = " + p.r + " 隻。",
      trapNote: "最後一步若用 " + (4 * p.h - p.L) + " ÷ 2 算出的是雞（" + p.c + " 隻）；要看清楚題目問的是雞還是兔。" });
  });
  add("single-L3-02", "single", 3, "basic", function (k) {
    const n0 = k.int(5, 15);
    const c = sc(k, 3 * n0 + 1, [4 * n0, 3 * n0, 3 * n0 + 2, 3 * n0 - 1]);
    return Object.assign(c, { stem: "用火柴棒排正方形：1 個正方形要 4 根，連排 2 個要 7 根，連排 3 個要 10 根……連排 " + n0 + " 個正方形需要幾根火柴棒？",
      explain: "解析：第 1 個用 4 根，之後每多 1 個正方形多 3 根，所以共 4 + 3 × (" + n0 + " − 1) = 3 × " + n0 + " + 1 = " + (3 * n0 + 1) + "（根）。" });
  });
  add("single-L4-01", "single", 4, "trap", function (k) {
    const m = k.int(8, 40), n = k.num;
    const c = sc(k, m + 1, [m, m - 1, n(3 * m / 2), m + 2]);
    return Object.assign(c, { stem: "三個連續整數的和是 " + (3 * m) + "，其中最大的數是多少？",
      explain: "解析：連續三個整數的中間數 = 和 ÷ 3 = " + (3 * m) + " ÷ 3 = " + m + "，最大的數 = " + m + " + 1 = " + (m + 1) + "。",
      trapNote: "和 ÷ 3 得到的 " + m + " 是中間那個數，不是最大的數；最大的要再加 1。" });
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const x = k.int(3, 12), y = k.int(3, 12), n = k.num, h = x + y, V = 10 * x + 5 * y;
    const c = sc(k, x, [y, n(V / 10), n(x / 2), n(V / 15), h, V - 5 * h]);
    return Object.assign(c, { stem: "存錢筒裡只有 10 元和 5 元的硬幣，共 " + h + " 個，總共 " + V + " 元，10 元硬幣有幾個？",
      explain: "解析：假設全是 5 元，共 5 × " + h + " = " + (5 * h) + " 元，少了 " + V + " − " + (5 * h) + " = " + (V - 5 * h) + " 元；每把 1 個 5 元換成 10 元多 5 元，所以 10 元有 " + (V - 5 * h) + " ÷ 5 = " + x + " 個。" });
  });
  add("single-L4-03", "single", 4, "extend", function (k) {
    let t, b;
    do { t = k.int(3, 15); b = k.int(3, 15); } while (t === b);
    const h = t + b, W = 3 * t + 2 * b;
    const c = sc(k, t, [b, Math.round(W / 3), 3 * h - W + 1, h - 1, W - h]);
    return Object.assign(c, { stem: "遊樂場裡三輪車和腳踏車共 " + h + " 輛，輪子共 " + W + " 個（三輪車有 3 個輪子、腳踏車有 2 個輪子），三輪車有幾輛？",
      explain: "解析：假設全是腳踏車，輪子有 2 × " + h + " = " + (2 * h) + " 個，少了 " + (W - 2 * h) + " 個；每把 1 輛腳踏車換成三輪車多 1 個輪子，所以三輪車有 " + (W - 2 * h) + " 輛。" });
  });
  add("single-L5-01", "single", 5, "extend", function (k) {
    const z = k.int(5, 25), b = k.int(2, 8), a = k.int(2, 8), S2 = 3 * z + 2 * b + a;
    const c = sc(k, z + a + b, [z + b, Math.round(S2 / 3), z + a, z, z + 2 * b, z + a + 2 * b, z + 2 * a]);
    return Object.assign(c, { stem: "甲、乙、丙三人共有 " + S2 + " 張貼紙，乙比丙多 " + b + " 張，甲又比乙多 " + a + " 張，甲有幾張？",
      explain: "解析：把乙、甲都換成「丙的張數」：乙 = 丙 + " + b + "，甲 = 丙 + " + (a + b) + "。三人共 3 個丙 + " + (2 * b + a) + " 張 = " + S2 + "，丙 = (" + S2 + " − " + (2 * b + a) + ") ÷ 3 = " + z + "，甲 = " + z + " + " + (a + b) + " = " + (z + a + b) + "（張）。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const p = sd(k, 12, 50), n = k.num;
    const c = mu(k,
      ["大數是 " + p.x, "小數是 " + p.y, "大數 − 小數 = " + p.D, "大數 + 小數 = " + p.S],
      ["大數是 " + p.y, "小數是 " + p.x, "大數是 " + n(p.S / 2)]);
    return Object.assign(c, { stem: "兩個數的和是 " + p.S + "，差是 " + p.D + "，選出所有正確的敘述。",
      explain: "解析：大數 = (" + p.S + " + " + p.D + ") ÷ 2 = " + p.x + "，小數 = (" + p.S + " − " + p.D + ") ÷ 2 = " + p.y + "。" });
  });
  add("multi-L2-01", "multi", 2, "basic", function (k) {
    let a, d;
    do { a = k.int(2, 9); d = k.int(2, 7); } while (a === d);
    const n0 = k.int(6, 15), t = a + (n0 - 1) * d;
    const c = mu(k,
      ["第 " + n0 + " 個數是 " + t, "每一個數都比前一個數多 " + d, "第 " + (n0 + 1) + " 個數是 " + (t + d)],
      ["第 " + n0 + " 個數是 " + (a + n0 * d), "每一個數都比前一個數多 " + a, "第 " + n0 + " 個數是 " + (n0 * d)]);
    return Object.assign(c, { stem: "數列：" + a + "、" + (a + d) + "、" + (a + 2 * d) + "、" + (a + 3 * d) + "……照規律排下去，選出所有正確的敘述。",
      explain: "解析：公差是 " + d + "，第 " + n0 + " 個數 = " + a + " + " + (n0 - 1) + " × " + d + " = " + t + "，下一個再加 " + d + "。" });
  });
  add("multi-L3-01", "multi", 3, "trap", function (k) {
    const p = cr(k, 3, 18);
    const c = mu(k,
      ["雞有 " + p.c + " 隻", "兔有 " + p.r + " 隻", "假設全是雞，腳會有 " + (2 * p.h) + " 隻", "每把 1 隻雞換成 1 隻兔，腳會多 2 隻"],
      ["雞有 " + p.r + " 隻", "兔有 " + p.c + " 隻", "每把 1 隻雞換成 1 隻兔，腳會多 4 隻"]);
    return Object.assign(c, { stem: "雞和兔共 " + p.h + " 隻，腳共 " + p.L + " 隻，選出所有正確的敘述。",
      explain: "解析：全雞腳 " + (2 * p.h) + "，少 " + (p.L - 2 * p.h) + "，換 1 隻多 2 腳，兔 = " + (p.L - 2 * p.h) + " ÷ 2 = " + p.r + "，雞 = " + p.h + " − " + p.r + " = " + p.c + "。",
      trapNote: "雞 2 腳、兔 4 腳，換一隻只多 2 隻腳（4 − 2），不是多 4 隻；也容易把雞兔隻數說反。" });
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
    const z = k.int(5, 25), b = k.int(2, 8), a = k.int(2, 8), S2 = 3 * z + 2 * b + a;
    const c = mu(k,
      ["丙有 " + z + " 張", "乙有 " + (z + b) + " 張", "甲有 " + (z + a + b) + " 張", "甲比丙多 " + (a + b) + " 張"],
      ["甲有 " + (z + a) + " 張", "丙有 " + (z + b) + " 張", "甲比丙多 " + a + " 張"]);
    return Object.assign(c, { stem: "甲、乙、丙三人共有 " + S2 + " 張貼紙，乙比丙多 " + b + " 張，甲比乙多 " + a + " 張，選出所有正確的敘述。",
      explain: "解析：丙 = (" + S2 + " − " + b + " − " + (a + b) + ") ÷ 3 = " + z + "，乙 = " + (z + b) + "，甲 = " + (z + a + b) + "。" });
  });

  /* ---------- tf ---------- */
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const p = sd(k, 12, 50), ok = k.int(0, 1) === 1, v = ok ? p.x : p.y;
    return { stem: "兩個數的和是 " + p.S + "，差是 " + p.D + "，所以較大的數是 " + v + "。", answer: ok,
      explain: "解析：大數 = (" + p.S + " + " + p.D + ") ÷ 2 = " + p.x + "，小數是 " + p.y + "。" };
  });
  add("tf-L2-01", "tf", 2, "basic", function (k) {
    const a = k.int(2, 9), d = k.int(2, 6), n0 = k.int(8, 20), ok = k.int(0, 1) === 1, v = ok ? a + (n0 - 1) * d : a + n0 * d;
    return { stem: "數列 " + a + "、" + (a + d) + "、" + (a + 2 * d) + "、" + (a + 3 * d) + "……照規律排下去，第 " + n0 + " 個數是 " + v + "。", answer: ok,
      explain: "解析：第 " + n0 + " 個數 = " + a + " + (" + n0 + " − 1) × " + d + " = " + (a + (n0 - 1) * d) + "。" };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const p = cr(k, 3, 18), ok = k.int(0, 1) === 1, v = ok ? p.r : p.c;
    return { stem: "雞和兔共 " + p.h + " 隻，腳共 " + p.L + " 隻，兔有 " + v + " 隻。", answer: ok,
      explain: "解析：假設全是雞，腳 " + (2 * p.h) + " 隻，少 " + (p.L - 2 * p.h) + " 隻，兔 = " + (p.L - 2 * p.h) + " ÷ 2 = " + p.r + "，雞 " + p.c + " 隻。",
      trapNote: "雞和兔的數量容易說反；" + p.c + " 是雞的隻數，兔是 " + p.r + " 隻。" };
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
    return { stem: "兩個數的和是 " + p.S + "，差是 " + p.D + "，大數是（　）。", answer: String(p.x),
      explain: "解析：(" + p.S + " + " + p.D + ") ÷ 2 = " + p.x + "。" };
  });
  add("fill-L1-02", "fill", 1, "basic", function (k) {
    const p = sd(k, 15, 70);
    return { stem: "兩個數的和是 " + p.S + "，差是 " + p.D + "，小數是（　）。", answer: String(p.y),
      explain: "解析：(" + p.S + " − " + p.D + ") ÷ 2 = " + p.y + "。" };
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const a = k.int(2, 9), d = k.int(2, 6), n0 = k.int(8, 20);
    return { stem: "規律：" + a + "、" + (a + d) + "、" + (a + 2 * d) + "、" + (a + 3 * d) + "……第 " + n0 + " 個數是（　）。", answer: String(a + (n0 - 1) * d),
      explain: "解析：" + a + " + (" + n0 + " − 1) × " + d + " = " + (a + (n0 - 1) * d) + "。" };
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const p = cr(k, 3, 20);
    return { stem: "雞和兔共 " + p.h + " 隻，腳共 " + p.L + " 隻，雞有（　）隻。", answer: String(p.c), units: ["隻"],
      explain: "解析：假設全是兔，腳 4 × " + p.h + " = " + (4 * p.h) + " 隻，多了 " + (4 * p.h - p.L) + " 隻；每把 1 隻兔換成雞少 2 隻，雞 = " + (4 * p.h - p.L) + " ÷ 2 = " + p.c + "。",
      trapNote: "假設全是兔時，多出的腳除以 2 才是雞的數量；除以 4 或不除都會錯。" };
  });
  add("fill-L4-01", "fill", 4, "extend", function (k) {
    const a = k.int(2, 8), d = k.int(2, 5), n0 = 2 * k.int(2, 5), tot = n0 * (2 * a + (n0 - 1) * d) / 2;
    return { stem: "等差數列：" + a + "、" + (a + d) + "、" + (a + 2 * d) + "……共 " + n0 + " 個數，全部加起來等於（　）。", answer: String(tot),
      explain: "解析：最後一個數 = " + a + " + " + (n0 - 1) + " × " + d + " = " + (a + (n0 - 1) * d) + "；總和 = (首 + 尾) × 個數 ÷ 2 = (" + a + " + " + (a + (n0 - 1) * d) + ") × " + n0 + " ÷ 2 = " + tot + "。" };
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const z = k.int(5, 25), b = k.int(2, 8), a = k.int(2, 8), S2 = 3 * z + 2 * b + a;
    return { stem: "甲、乙、丙三桶油共 " + S2 + " 公升，乙比丙多 " + b + " 公升，甲比乙多 " + a + " 公升，丙桶有（　）公升。", answer: String(z), units: ["公升"],
      explain: "解析：甲 = 丙 + " + (a + b) + "，乙 = 丙 + " + b + "；三桶共 3 個丙 + " + (a + 2 * b) + " = " + S2 + "，丙 = (" + S2 + " − " + (a + 2 * b) + ") ÷ 3 = " + z + "。" };
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const p = sd(k, 12, 60);
    return { stem: "和是 " + p.S + "、差是 " + p.D + "，求大數：(" + p.S + " + " + p.D + ") ÷ 2", answer: String(p.x),
      explain: "解析：" + (p.S + p.D) + " ÷ 2 = " + p.x + "。" };
  });
  add("calc-L2-01", "calc", 2, "basic", function (k) {
    const p = sd(k, 15, 70);
    return { stem: "和是 " + p.S + "、差是 " + p.D + "，求小數：(" + p.S + " − " + p.D + ") ÷ 2", answer: String(p.y),
      explain: "解析：" + (p.S - p.D) + " ÷ 2 = " + p.y + "。" };
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const p = cr(k, 3, 20);
    return { stem: "雞兔同籠，共 " + p.h + " 隻、腳 " + p.L + " 隻，求兔數：(" + p.L + " − 2 × " + p.h + ") ÷ 2", answer: String(p.r),
      explain: "解析：2 × " + p.h + " = " + (2 * p.h) + "，" + p.L + " − " + (2 * p.h) + " = " + (p.L - 2 * p.h) + "，÷ 2 = " + p.r + "。" };
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const p = cr(k, 3, 20);
    return { stem: "雞兔同籠，共 " + p.h + " 隻、腳 " + p.L + " 隻，求雞數：(4 × " + p.h + " − " + p.L + ") ÷ 2", answer: String(p.c),
      explain: "解析：4 × " + p.h + " = " + (4 * p.h) + "，" + (4 * p.h) + " − " + p.L + " = " + (4 * p.h - p.L) + "，÷ 2 = " + p.c + "。",
      trapNote: "先乘後減，括號內算完再 ÷ 2；若寫成 4 × " + p.h + " − " + p.L + " ÷ 2 就變成先除，答案不同。" };
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const a = k.int(2, 8), d = k.int(2, 5), n0 = 2 * k.int(2, 6), last = a + (n0 - 1) * d, tot = (a + last) * n0 / 2;
    return { stem: "首項 " + a + "、每項加 " + d + "、共 " + n0 + " 項，求總和：(" + a + " + (" + a + " + (" + n0 + " − 1) × " + d + ")) × " + n0 + " ÷ 2", answer: String(tot),
      explain: "解析：末項 " + a + " + " + (n0 - 1) + " × " + d + " = " + last + "；(" + a + " + " + last + ") × " + n0 + " ÷ 2 = " + tot + "。" };
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const p = sd(k, 25, 45);
    return { stem: "六年一班和六年二班共有 " + p.S + " 人，一班比二班多 " + p.D + " 人，一班有幾人？", answer: String(p.x), units: ["人", "位"],
      explain: "解析：(" + p.S + " + " + p.D + ") ÷ 2 = " + p.x + "（人）。" };
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const a = k.int(10, 50), d = k.int(5, 20), n0 = k.int(6, 12);
    return { stem: "小美第 1 週存了 " + a + " 元，之後每一週都比前一週多存 " + d + " 元，第 " + n0 + " 週她存了多少元？", answer: String(a + (n0 - 1) * d), units: ["元"],
      explain: "解析：第 " + n0 + " 週 = " + a + " + (" + n0 + " − 1) × " + d + " = " + (a + (n0 - 1) * d) + "（元）。" };
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const p = cr(k, 4, 20);
    return { stem: "農場裡有雞和兔共 " + p.h + " 隻，數一數共有 " + p.L + " 隻腳，雞有幾隻？", answer: String(p.c), units: ["隻"],
      explain: "解析：假設全是兔，腳 " + (4 * p.h) + " 隻，多出 " + (4 * p.h - p.L) + " 隻；每把 1 隻兔換成雞少 2 隻腳，雞 = " + (4 * p.h - p.L) + " ÷ 2 = " + p.c + "（隻）。",
      trapNote: "題目問的是雞；先求兔再答兔是常見失誤。也別忘記每次只差 2 隻腳，要 ÷ 2。" };
  });
  add("word-L4-01", "word", 4, "extend", function (k) {
    const x = k.int(3, 12), y = k.int(3, 12), h = x + y, V = 10 * x + 5 * y;
    return { stem: "撲滿裡只有 10 元和 5 元硬幣，共 " + h + " 個，合計 " + V + " 元，10 元硬幣有幾個？", answer: String(x), units: ["個"],
      explain: "解析：假設全是 5 元：" + (5 * h) + " 元，少 " + (V - 5 * h) + " 元；每換 1 個多 5 元，10 元硬幣 = " + (V - 5 * h) + " ÷ 5 = " + x + "（個）。" };
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
    const n0 = 2 * k.int(2, 5), a = k.int(2, 5), d = k.int(1, 3), tot = n0 * (2 * a + (n0 - 1) * d) / 2;
    return { stem: "把積木堆成階梯：最上面一層 " + a + " 塊，往下每一層都比上一層多 " + d + " 塊，共堆 " + n0 + " 層，一共用了多少塊積木？", answer: String(tot), units: ["塊", "個"],
      explain: "解析：最下層 " + a + " + " + (n0 - 1) + " × " + d + " = " + (a + (n0 - 1) * d) + " 塊；總數 = (" + a + " + " + (a + (n0 - 1) * d) + ") × " + n0 + " ÷ 2 = " + tot + "（塊）。" };
  });

  ExamBank.register("solve-upper", "solve-upper-main", S);
})();
