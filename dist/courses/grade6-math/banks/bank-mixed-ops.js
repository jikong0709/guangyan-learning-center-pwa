/* 題庫：mixed-ops 小數與分數四則混合運算、簡化計算（分配律等）。題庫工 B */
(function () {
  "use strict";
  const S = [];
  function add(id, type, level, tag, gen) { S.push({ id: "mixed-ops-" + id, type, level, tag, gen }); }
  function sc(k, correct, cands) {
    const w = k.distractors(correct, cands.filter(function (x) { return !/^-/.test(String(x)) && String(x) !== "0"; }), 3);
    if (w.length < 3) throw new Error("distractor shortage");
    return { options: [String(correct)].concat(w), answer: 0 };
  }
  function mu(k, goods, bads) {
    const g = k.shuffle(goods).slice(0, k.int(2, 3));
    const b = k.shuffle(bads).slice(0, 2);
    return { options: g.concat(b), answer: g.map(function (_, i) { return i; }) };
  }
  /* 精確分數運算（避免浮點誤差）：{n,d} */
  function G(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
  function Q(n, d) { if (d < 0) { n = -n; d = -d; } const g = G(n, d); return { n: n / g, d: d / g }; }
  function qa(x, y) { return Q(x.n * y.d + y.n * x.d, x.d * y.d); }
  function qs(x, y) { return Q(x.n * y.d - y.n * x.d, x.d * y.d); }
  function qm(x, y) { return Q(x.n * y.n, x.d * y.d); }
  function qd(x, y) { return Q(x.n * y.d, x.d * y.n); }
  function qD(v) { return Q(Math.round(v * 10000), 10000); }
  function qf(p, q) { return Q(p, q); }
  function qstr(x) { return x.d === 1 ? String(x.n) : x.n + "/" + x.d; }
  function qdec(x) {
    let d = x.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
    if (d !== 1) return null;
    const v = x.n / x.d;
    if (Math.abs(v * 10000 - Math.round(v * 10000)) > 1e-6) return null;
    return String(Number(v.toFixed(4)));
  }
  function qmixed(x) { if (x.d === 1 || x.n < x.d) return null; const w = Math.floor(x.n / x.d); return w + " " + (x.n - w * x.d) + "/" + x.d; }
  /* 產生答案與替代寫法 */
  function out(x) {
    const dec = qdec(x), acc = [];
    if (dec) { if (dec !== qstr(x)) acc.push(qstr(x)); } else { /* 分數為主 */ }
    const m = qmixed(x); if (m) acc.push(m);
    return { answer: dec || qstr(x), accepted: acc };
  }
  const PAIRS = [["1/2", "0.5"], ["1/4", "0.25"], ["3/4", "0.75"], ["1/5", "0.2"], ["2/5", "0.4"], ["3/5", "0.6"], ["1/8", "0.125"], ["3/8", "0.375"], ["7/20", "0.35"], ["9/25", "0.36"]];
  const DECS = [0.2, 0.4, 0.6, 0.8, 1.2, 1.5, 2.5, 0.25, 0.75, 3.5];
  const FR = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 10], [3, 10], [7, 10]];
  const FR3 = [[1, 2], [3, 4], [2, 3], [3, 5], [5, 6], [4, 5], [1, 3], [2, 5], [3, 8], [5, 8]];

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const a = k.pick(DECS), f = k.pick(FR), n = k.num;
    const res = qa(qD(a), qf(f[0], f[1])), v = Number(qdec(res));
    const c = sc(k, n(v), [n(v * 10), n(v / 10), n(a * f[0] / f[1]), n(Math.abs(a - f[0] / f[1])), n(a + f[0] + f[1])]);
    return Object.assign(c, { stem: "計算 " + n(a) + " + " + f[0] + "/" + f[1] + "，結果是多少？",
      explain: "解析：" + f[0] + "/" + f[1] + " = " + n(f[0] / f[1]) + "，" + n(a) + " + " + n(f[0] / f[1]) + " = " + n(v) + "。小數與分數相加，先化成同一種形式。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const a = k.int(11, 49) / 10, b = k.pick([0.5, 0.2, 0.4, 0.25, 0.3]), c0 = k.int(3, 12), n = k.num;
    const v = a + b * c0;
    const c = sc(k, n(v), [n((a + b) * c0), n(a * b * c0), n(a + b + c0), n(a * b + c0), n(a * b * c0 + c0)]);
    return Object.assign(c, { stem: "計算 " + n(a) + " + " + n(b) + " × " + c0 + "，結果是多少？",
      explain: "解析：先乘後加：" + n(b) + " × " + c0 + " = " + n(b * c0) + "，" + n(a) + " + " + n(b * c0) + " = " + n(v) + "。",
      trapNote: "由左到右先加（" + n(a) + " + " + n(b) + "）再乘 " + c0 + "，會得到 " + n((a + b) * c0) + "，是忽略「先乘除後加減」的錯誤。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    let A, B, C, i, j, l;
    do { i = k.int(0, 9); j = k.int(0, 9); l = k.int(0, 9); } while (i === j || j === l || i === l);
    A = qf(FR3[i][0], FR3[i][1]); B = qf(FR3[j][0], FR3[j][1]); C = qf(FR3[l][0], FR3[l][1]);
    const res = qm(qd(A, B), C);
    const c = sc(k, qstr(res), [qstr(qm(qm(A, B), C)), qstr(qd(qd(A, B), C)), qstr(qd(A, qm(B, C))), qstr(qm(qd(B, A), C)), qstr(qd(qm(A, B), C)), qstr(qd(qm(B, C), A))]);
    return Object.assign(c, { stem: "計算 " + qstr(A) + " ÷ " + qstr(B) + " × " + qstr(C) + "，結果是多少？",
      explain: "解析：乘除同級由左到右。" + qstr(A) + " ÷ " + qstr(B) + " = " + qstr(A) + " × " + qstr(qd(qf(1, 1), B)) + " = " + qstr(qd(A, B)) + "，再 × " + qstr(C) + " = " + qstr(res) + "。",
      trapNote: "除以分數要乘它的倒數；若把「÷」直接當成「×」會得到 " + qstr(qm(qm(A, B), C)) + "，先算後面的乘法則得到 " + qstr(qd(A, qm(B, C))) + "，都不對。" });
  });
  add("single-L3-02", "single", 3, "basic", function (k) {
    const x = k.pick([3.6, 7.5, 2.4, 4.8, 6.4, 1.5, 8.5, 2.5]), up = k.int(0, 1) === 1, n = k.num;
    const c = sc(k, n(100 * x), [n(99 * x), n(101 * x), n(10 * x), n(1000 * x)]);
    return Object.assign(c, { stem: up ? "用簡便方法計算 " + n(x) + " × 101 − " + n(x) + "，結果是多少？" : "用簡便方法計算 " + n(x) + " × 99 + " + n(x) + "，結果是多少？",
      explain: up ? "解析：" + n(x) + " × 101 − " + n(x) + " × 1 = " + n(x) + " × (101 − 1) = " + n(x) + " × 100 = " + n(100 * x) + "。"
        : "解析：" + n(x) + " × 99 + " + n(x) + " × 1 = " + n(x) + " × (99 + 1) = " + n(x) + " × 100 = " + n(100 * x) + "。" });
  });
  add("single-L3-03", "single", 3, "trap", function (k) {
    const f = k.pick([[3, 4], [2, 5], [3, 5], [3, 2], [5, 4], [1, 2]]), t = k.int(2, 20) / 2, x = f[0] * t, n = k.num;
    const c = sc(k, n(t * f[1]), [n(x * f[0] / f[1]), n(x / (f[0] * f[1])), n(x * f[0] * f[1]), n(t * f[0]), n(t), n(x * f[1]), n(x + f[1]), n(t * f[1] * f[1])]);
    return Object.assign(c, { stem: "計算 " + n(x) + " ÷ " + f[0] + "/" + f[1] + "，結果是多少？",
      explain: "解析：除以分數等於乘它的倒數：" + n(x) + " × " + f[1] + "/" + f[0] + " = " + n(x) + " ÷ " + f[0] + " × " + f[1] + " = " + n(t) + " × " + f[1] + " = " + n(t * f[1]) + "。",
      trapNote: "除以 " + f[0] + "/" + f[1] + " 時沒有倒過來，直接乘 " + f[0] + "/" + f[1] + "，會得到 " + n(x * f[0] / f[1]) + "。" });
  });
  add("single-L4-01", "single", 4, "extend", function (k) {
    const f = k.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5]]), d = k.pick([0.25, 0.5, 0.75, 0.2, 0.4]), m = k.pick([20, 40]), c0 = k.int(1, 5), n = k.num;
    const s = f[0] / f[1] + d, v = s * m - c0;
    const c = sc(k, n(v), [n(s * m + c0), n(s * (m - c0)), n(f[0] / f[1] + d * m - c0), n(s * m), n(s + m - c0)]);
    return Object.assign(c, { stem: "計算 (" + f[0] + "/" + f[1] + " + " + n(d) + ") × " + m + " − " + c0 + "，結果是多少？",
      explain: "解析：括號內 " + n(f[0] / f[1]) + " + " + n(d) + " = " + n(s) + "；" + n(s) + " × " + m + " = " + n(s * m) + "；再減 " + c0 + " 得 " + n(v) + "。" });
  });
  add("single-L4-02", "single", 4, "basic", function (k) {
    const p = k.pick([[0.8, 1.25], [0.25, 4], [0.5, 2], [2.5, 0.4]]), c0 = k.int(20, 95) / 10, n = k.num;
    const c = sc(k, n(c0), [n(c0 * 10), n(c0 / 10), n(c0 * p[0]), n(c0 * p[1]), n(c0 * 2)]);
    return Object.assign(c, { stem: "計算 " + n(p[0]) + " × " + n(p[1]) + " × " + n(c0) + "，用簡便方法最快，結果是多少？",
      explain: "解析：" + n(p[0]) + " × " + n(p[1]) + " = 1，所以 1 × " + n(c0) + " = " + n(c0) + "。先把乘起來剛好是 1 的兩個數結合。" });
  });
  add("single-L5-01", "single", 5, "extend", function (k) {
    const form = k.int(0, 1), n = k.num;
    if (form === 0) {
      const j = k.int(2, 12), x = 0.4 * j, v = j + 0.5;
      const c = sc(k, n(x), [n(v * 0.4), n((v + 0.5) * 0.4), n(v - 0.5), n(v / 0.4 - 0.5), n(v * 0.4 + 0.5)]);
      return Object.assign(c, { stem: "□ ÷ 0.4 + 1/2 = " + n(v) + "，□ 是多少？",
        explain: "解析：逆向推回去：先減 1/2：" + n(v) + " − 0.5 = " + n(j) + "，再乘 0.4：" + n(j) + " × 0.4 = " + n(x) + "。" });
    }
    const j = k.int(4, 14), x = j * 0.25, v = j - 3;
    const c = sc(k, n(x), [n(v / 4 - 0.75), n(v * 4 + 0.75), n(v / 4), n(v * 4 - 0.75), n(v - 0.75)]);
    return Object.assign(c, { stem: "(□ − 3/4) × 4 = " + v + "，□ 是多少？",
      explain: "解析：逆向推回去：先除以 4：" + v + " ÷ 4 = " + n(v / 4) + "，再加 3/4（0.75）：" + n(v / 4) + " + 0.75 = " + n(x) + "。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const a = k.int(2, 9), b = k.int(2, 9), c0 = k.int(2, 9);
    const c = mu(k,
      [a + " + " + b + " × " + c0 + " 要先算 " + b + " × " + c0, a + " × (" + b + " + " + c0 + ") 要先算括號裡的 " + b + " + " + c0, a + " − " + b + " ÷ " + c0 + " 要先算 " + b + " ÷ " + c0],
      [a + " + " + b + " × " + c0 + " 要先算 " + a + " + " + b, a + " − " + b + " + " + c0 + " 要先算 " + b + " + " + c0, a + " ÷ " + b + " × " + c0 + " 要先算 " + b + " × " + c0]);
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
    const a = k.int(12, 30), b = k.int(5, 11), c0 = k.int(2, 9);
    const c = mu(k,
      [a + " × " + c0 + " + " + b + " × " + c0 + " = (" + a + " + " + b + ") × " + c0, c0 + " × (" + a + " − " + b + ") = " + c0 + " × " + a + " − " + c0 + " × " + b, a + " × " + c0 + " − " + b + " × " + c0 + " = (" + a + " − " + b + ") × " + c0],
      [a + " × " + c0 + " + " + b + " × " + c0 + " = " + a + " × " + c0 + " + " + b, c0 + " × (" + a + " + " + b + ") = " + c0 + " × " + a + " + " + b, a + " ÷ (" + b + " + " + c0 + ") = " + a + " ÷ " + b + " + " + a + " ÷ " + c0]);
    return Object.assign(c, { stem: "關於分配律與簡便計算，選出所有正確的算式。",
      explain: "解析：乘法對加減有分配律：a × c + b × c = (a + b) × c；括號外的數要乘括號內每一項。但除法的分母部分不能這樣拆。" });
  });
  add("multi-L4-01", "multi", 4, "trap", function (k) {
    const a = k.int(30, 80), b = k.int(2, 9) * 2, c0 = k.int(2, 7) * 2;
    const c = mu(k,
      [a + " ÷ (" + b + " × " + c0 + ") = " + a + " ÷ " + b + " ÷ " + c0, a + " − (" + b + " + " + c0 + ") = " + a + " − " + b + " − " + c0, a + " − (" + b + " − " + c0 + ") = " + a + " − " + b + " + " + c0],
      [a + " ÷ (" + b + " × " + c0 + ") = " + a + " ÷ " + b + " × " + c0, a + " − (" + b + " + " + c0 + ") = " + a + " − " + b + " + " + c0, a + " − (" + b + " − " + c0 + ") = " + a + " − " + b + " − " + c0]);
    return Object.assign(c, { stem: "拆括號時要小心符號，選出所有正確的等式。",
      explain: "解析：括號前是「−」或「÷」時，拆括號後括號內的運算要變號：− (b + c) = − b − c；− (b − c) = − b + c；÷ (b × c) = ÷ b ÷ c。",
      trapNote: "括號前面是減號或除號，拆括號後裡面的「+/−」「×/÷」都要「變號」，直接照抄是最常見的錯誤。" });
  });
  add("multi-L4-02", "multi", 4, "extend", function (k) {
    const N = k.pick([8, 12, 16, 20, 40, 24]);
    const c = mu(k,
      [N + " × 0.25 = " + N + " ÷ 4", N + " × 0.5 = " + N + " ÷ 2", N + " ÷ 0.25 = " + N + " × 4", N + " ÷ 0.1 = " + N + " × 10", N + " × 1.25 = " + N + " + " + N + " ÷ 4"],
      [N + " × 0.25 = " + N + " ÷ 2", N + " ÷ 0.5 = " + N + " ÷ 2", N + " ÷ 0.1 = " + N + " ÷ 10", N + " × 0.2 = " + N + " ÷ 2", N + " × 1.5 = " + N + " + " + N + " ÷ 4"]);
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
    const a = k.int(5, 40) / 2, b = k.int(2, 9), c0 = k.int(2, 9), n = k.num, ok = k.int(0, 1) === 1, v = ok ? a + b * c0 : (a + b) * c0;
    return { stem: n(a) + " + " + b + " × " + c0 + " = " + n(v), answer: ok,
      explain: "解析：先乘後加：" + b + " × " + c0 + " = " + (b * c0) + "，" + n(a) + " + " + (b * c0) + " = " + n(a + b * c0) + "。",
      trapNote: "(" + n(a) + " + " + b + ") × " + c0 + " = " + n((a + b) * c0) + " 是「由左到右」算的結果，沒有先乘除後加減。" };
  });
  add("tf-L3-01", "tf", 3, "basic", function (k) {
    const x = k.int(2, 9), y = k.int(10, 30), z = k.int(5, 20), ok = k.int(0, 1) === 1;
    return { stem: x + " × " + y + " + " + x + " × " + z + " = " + x + " × " + (ok ? "(" + y + " + " + z + ")" : y + " + " + z), answer: ok,
      explain: "解析：分配律 " + x + " × " + y + " + " + x + " × " + z + " = " + x + " × (" + y + " + " + z + ")。" + (ok ? "" : "右邊沒有括號，只有 " + y + " 乘 " + x + "，" + z + " 沒有乘，所以錯誤。") };
  });
  add("tf-L3-02", "tf", 3, "trap", function (k) {
    const f = k.pick([[1, 2], [3, 4], [2, 5], [3, 5], [3, 2], [5, 4], [5, 3], [7, 4]]), x = k.int(2, 12), big = k.int(0, 1) === 1, less = f[0] < f[1];
    const truth = big ? less : !less;
    return { stem: x + " ÷ " + f[0] + "/" + f[1] + " 的商會比 " + x + " " + (big ? "大" : "小") + "。", answer: truth,
      explain: "解析：除以 " + f[0] + "/" + f[1] + " 就是乘 " + f[1] + "/" + f[0] + "；" + f[1] + "/" + f[0] + (less ? " 大於 1，所以商比原數大。" : " 小於 1，所以商比原數小。"),
      trapNote: "「除法一定越除越小」只在除以大於 1 的數時成立；除以小於 1 的數結果會變大。" + (less ? "本題的 " + f[0] + "/" + f[1] + " 小於 1，所以商比原數大。" : "本題的 " + f[0] + "/" + f[1] + " 大於 1，所以商比原數小。") };
  });
  add("tf-L4-01", "tf", 4, "trap", function (k) {
    const a = k.int(30, 60), b = k.int(10, 19), c0 = k.int(2, 7), ok = k.int(0, 1) === 1, v = ok ? a - b + c0 : a - b - c0;
    return { stem: a + " − (" + b + " − " + c0 + ") = " + v, answer: ok,
      explain: "解析：先算括號：" + b + " − " + c0 + " = " + (b - c0) + "，" + a + " − " + (b - c0) + " = " + (a - b + c0) + "。",
      trapNote: "拆括號時括號前是「−」，括號內的減號要變成加號：" + a + " − " + b + " + " + c0 + "；寫成 − " + c0 + " 就是 " + (a - b - c0) + "，錯。" };
  });
  add("tf-L5-01", "tf", 5, "extend", function (k) {
    const x = 5 * k.int(1, 12), n = k.num, v = Number(n(x * 1.2)), ok = k.int(0, 1) === 1, claim = ok ? x : Number(n(v * 1.2));
    return { stem: "某數乘 1.2 的積是 " + n(v) + "，所以這個數是 " + n(claim) + "。", answer: ok,
      explain: "解析：逆向用除法：" + n(v) + " ÷ 1.2 = " + n(x) + "。" + (ok ? "所以正確。" : "敘述中的 " + n(claim) + " 是把 " + n(v) + " 再乘 1.2 得到的，方向反了。") };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const a = k.int(12, 48) / 10, b = k.pick([0.5, 0.2, 0.4, 0.3]), n = k.num;
    return { stem: n(a) + " × " + n(b) + " = （　）", answer: n(a * b),
      explain: "解析：" + n(a) + " × " + n(b) + " = " + n(a * b) + "（小數點位數加起來）。" };
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const a = k.pick(DECS), f = k.pick(FR), res = qa(qD(a), qf(f[0], f[1])), o = out(res), n = k.num;
    return { stem: n(a) + " + " + f[0] + "/" + f[1] + " = （　）（可寫小數或分數）", answer: o.answer, accepted: o.accepted,
      explain: "解析：" + f[0] + "/" + f[1] + " = " + n(f[0] / f[1]) + "，" + n(a) + " + " + n(f[0] / f[1]) + " = " + o.answer + "。" };
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const a = k.int(10, 30), b = k.pick([0.5, 1.5, 2.5, 0.4]), c0 = k.int(2, 8) * 2, e = k.pick([0.5, 0.2, 0.4]), j = k.int(2, 9), d = e * j, n = k.num;
    return { stem: n(a) + " + " + n(b) + " × " + c0 + " − " + n(d) + " ÷ " + n(e) + " = （　）", answer: n(a + b * c0 - j),
      explain: "解析：先乘除：" + n(b) + " × " + c0 + " = " + n(b * c0) + "，" + n(d) + " ÷ " + n(e) + " = " + j + "；再由左到右：" + n(a) + " + " + n(b * c0) + " − " + j + " = " + n(a + b * c0 - j) + "。",
      trapNote: "先加減再乘除是最常見的錯誤，例如先算 " + n(a) + " + " + n(b) + "；要先把兩個乘除算完。" };
  });
  add("fill-L3-02", "fill", 3, "basic", function (k) {
    const p = k.pick([[12.5, 0.8, 10], [25, 0.4, 10], [0.125, 8, 1], [2.5, 4, 10], [1.25, 8, 10], [0.25, 4, 1], [0.5, 2, 1]]), x = k.int(3, 29), n = k.num;
    return { stem: "用簡便方法計算：" + x + " × " + n(p[0]) + " × " + n(p[1]) + " = （　）", answer: n(x * p[2]),
      explain: "解析：先算 " + n(p[0]) + " × " + n(p[1]) + " = " + n(p[2]) + "，再 " + x + " × " + n(p[2]) + " = " + n(x * p[2]) + "。（乘法交換、結合律）" };
  });
  add("fill-L4-01", "fill", 4, "trap", function (k) {
    const a = k.int(30, 60), b = k.int(2, 6), c0 = k.int(2, 6), d = k.pick([0.5, 2, 1.5]), n = k.num;
    return { stem: n(a) + " − (" + b + " + " + c0 + ") × " + n(d) + " = （　）", answer: n(a - (b + c0) * d),
      explain: "解析：先算括號 " + b + " + " + c0 + " = " + (b + c0) + "；再乘 " + n(d) + " 得 " + n((b + c0) * d) + "；最後 " + n(a) + " − " + n((b + c0) * d) + " = " + n(a - (b + c0) * d) + "。",
      trapNote: "括號算完還要先乘再減；若直接 " + n(a) + " − " + (b + c0) + "，再乘 " + n(d) + "，會得到 " + n((a - b - c0) * d) + "。" };
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const j = k.int(2, 12);
    return { stem: "□ × 3/4 + 0.5 = " + (3 * j + 0.5) + "，□ = （　）", answer: String(4 * j),
      explain: "解析：逆向：" + (3 * j + 0.5) + " − 0.5 = " + (3 * j) + "，再 ÷ 3/4（× 4/3）：" + (3 * j) + " × 4/3 = " + (4 * j) + "。" };
  });
  add("fill-L4-02", "fill", 4, "extend", function (k) {
    const cs = k.shuffle([["1/2", 1, 2], ["1/4", 1, 4], ["3/4", 3, 4], ["0.5", 1, 2], ["0.25", 1, 4], ["0.75", 3, 4]]).slice(0, 3), x = 4 * k.int(2, 15);
    const sum = cs.reduce(function (s, c) { return qa(s, qf(c[1], c[2])); }, qf(0, 1)), v = qm(sum, qf(x, 1)), o = out(v);
    return { stem: "用簡便方法計算：" + x + " × " + cs[0][0] + " + " + x + " × " + cs[1][0] + " + " + x + " × " + cs[2][0] + " = （　）", answer: o.answer, accepted: o.accepted,
      explain: "解析：提出 " + x + "：" + x + " × (" + cs[0][0] + " + " + cs[1][0] + " + " + cs[2][0] + ") = " + x + " × " + qstr(sum) + " = " + o.answer + "。" };
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const a = k.int(11, 49) / 10, b = k.int(2, 9), c0 = k.int(1, 9) / 2, n = k.num;
    return { stem: n(a) + " × " + b + " + " + n(c0), answer: n(a * b + c0),
      explain: "解析：先乘 " + n(a) + " × " + b + " = " + n(a * b) + "，再加 " + n(c0) + " = " + n(a * b + c0) + "。" };
  });
  add("calc-L2-01", "calc", 2, "trap", function (k) {
    const a = k.int(20, 40), b0 = k.pick([0.2, 0.4, 0.5, 0.25]), j = k.int(2, 9), b = b0 * j, d = k.pick([0.5, 1.5, 2.5, 4]), e = k.int(2, 8), n = k.num;
    return { stem: n(a) + " − " + n(b) + " ÷ " + n(b0) + " + " + n(d) + " × " + e, answer: n(a - j + d * e),
      explain: "解析：先乘除：" + n(b) + " ÷ " + n(b0) + " = " + j + "，" + n(d) + " × " + e + " = " + n(d * e) + "；再由左到右：" + n(a) + " − " + j + " + " + n(d * e) + " = " + n(a - j + d * e) + "。",
      trapNote: "若先算 " + n(a) + " − " + n(b) + "，會把運算順序弄錯；也要注意減號後面是「商」而不是「商 + 積」。" };
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const f = k.pick(FR3), d = k.pick([0.5, 0.25, 0.75, 0.2, 0.4]), g = k.pick(FR3);
    const v = qa(qf(f[0], f[1]), qm(qD(d), qf(g[0], g[1]))), o = out(v), n = k.num;
    return { stem: f[0] + "/" + f[1] + " + " + n(d) + " × " + g[0] + "/" + g[1] + "（答案可寫分數或小數）", answer: o.answer, accepted: o.accepted,
      explain: "解析：先乘：" + n(d) + " × " + g[0] + "/" + g[1] + " = " + qstr(qm(qD(d), qf(g[0], g[1]))) + "；再加 " + f[0] + "/" + f[1] + " = " + qstr(v) + "。" };
  });
  add("calc-L3-02", "calc", 3, "basic", function (k) {
    const a = k.int(11, 89) / 10, b = 10 - a, c0 = k.pick([2.5, 3.2, 0.4, 4.8, 1.25, 7.5]), n = k.num;
    return { stem: "用簡便方法計算：" + n(a) + " × " + n(c0) + " + " + n(b) + " × " + n(c0), answer: n(10 * c0),
      explain: "解析：提出 " + n(c0) + "：(" + n(a) + " + " + n(b) + ") × " + n(c0) + " = 10 × " + n(c0) + " = " + n(10 * c0) + "。" };
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const b = k.pick([0.2, 0.4, 0.5, 0.25, 0.8]), j = k.int(2, 12), a = b * j, c0 = k.pick([0.5, 1.5, 2, 2.5, 4]), n = k.num;
    return { stem: n(a) + " ÷ " + n(b) + " × " + n(c0), answer: n(j * c0),
      explain: "解析：乘除同級由左到右：" + n(a) + " ÷ " + n(b) + " = " + j + "，" + j + " × " + n(c0) + " = " + n(j * c0) + "。",
      trapNote: "若先算 " + n(b) + " × " + n(c0) + " = " + n(b * c0) + "，再用 " + n(a) + " 去除，會得到 " + n(a / (b * c0)) + "，是錯的；同級運算不能隨意調換順序。" };
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const cs = k.shuffle([["1/2", 1, 2], ["1/4", 1, 4], ["3/4", 3, 4], ["0.5", 1, 2], ["0.25", 1, 4], ["0.75", 3, 4]]).slice(0, 3), x = 4 * k.int(2, 15) + 0;
    const sum = cs.reduce(function (s, c) { return qa(s, qf(c[1], c[2])); }, qf(0, 1)), v = qm(sum, qf(x, 1)), o = out(v);
    return { stem: x + " × " + cs[0][0] + " + " + x + " × " + cs[1][0] + " + " + x + " × " + cs[2][0] + "（可用提出公因數簡化）", answer: o.answer, accepted: o.accepted,
      explain: "解析：" + x + " × (" + cs[0][0] + " + " + cs[1][0] + " + " + cs[2][0] + ") = " + x + " × " + qstr(sum) + " = " + o.answer + "。" };
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const kg = k.pick([1.5, 2.5, 3.5, 0.5, 4.5]), price = 2 * k.int(6, 24), n = k.num, total = kg * price, pay = Math.ceil(total / 50 + 0.01) * 50;
    return { stem: "蘋果每公斤 " + price + " 元，媽媽買了 " + n(kg) + " 公斤，付了 " + pay + " 元，應該找回多少元？", answer: n(pay - total), units: ["元"],
      explain: "解析：蘋果共 " + price + " × " + n(kg) + " = " + n(total) + " 元；找回 " + pay + " − " + n(total) + " = " + n(pay - total) + "（元）。" };
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const f = k.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5]]), d = k.pick([0.3, 0.6, 0.35, 0.45, 0.15]), v = qa(qf(f[0], f[1]), qD(d)), o = out(v), n = k.num;
    return { stem: "一條緞帶長 " + f[0] + "/" + f[1] + " 公尺，另一條長 " + n(d) + " 公尺，兩條接起來共幾公尺？", answer: o.answer, accepted: o.accepted, units: ["公尺", "m"],
      explain: "解析：" + f[0] + "/" + f[1] + " = " + n(f[0] / f[1]) + " 公尺，" + n(f[0] / f[1]) + " + " + n(d) + " = " + o.answer + "（公尺）。" };
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const f = k.pick([[1, 4], [3, 10], [3, 5], [3, 4], [2, 5]]), j = k.int(4, 12), tot = qdec(qm(qf(f[0], f[1]), qf(j, 1)));
    return { stem: "一瓶果汁有 " + tot + " 公升，每個杯子倒 " + f[0] + "/" + f[1] + " 公升，可以倒滿幾杯？", answer: String(j), units: ["杯"],
      explain: "解析：" + tot + " ÷ " + f[0] + "/" + f[1] + " = " + tot + " × " + f[1] + "/" + f[0] + " = " + j + "（杯）。",
      trapNote: "總量要「除以」每杯的量；若乘 " + f[0] + "/" + f[1] + " 會得到 " + qdec(qm(qD(Number(tot)), qf(f[0], f[1]))) + "，杯數不可能是這樣。" };
  });
  add("word-L4-01", "word", 4, "extend", function (k) {
    const f = k.pick([[2, 5], [1, 4], [3, 10], [1, 5]]), d = k.pick([0.5, 0.4, 0.2, 0.25]), x = 400 * k.int(1, 3);
    const rem = qm(qm(qf(x, 1), qs(qf(1, 1), qf(f[0], f[1]))), qs(qf(1, 1), qD(d))), o = out(rem);
    return { stem: "小芸有 " + x + " 元，先用 " + f[0] + "/" + f[1] + " 買書，再用剩下的錢的 " + k.num(d) + " 買文具，最後還剩多少元？", answer: o.answer, units: ["元"],
      explain: "解析：買書後剩 " + x + " × (1 − " + f[0] + "/" + f[1] + ") = " + qstr(qm(qf(x, 1), qs(qf(1, 1), qf(f[0], f[1])))) + " 元；再剩下的 (1 − " + k.num(d) + ") 倍：最後剩 " + o.answer + "（元）。" };
  });
  add("word-L4-02", "word", 4, "trap", function (k) {
    const x = k.pick([200, 300, 400, 500, 600]), b = k.pick([20, 30, 50]), n = k.num;
    return { stem: "一件外套標價 " + x + " 元，先打 8 折，結帳時再用一張 " + b + " 元的折價券折抵，要付多少元？", answer: n(0.8 * x - b), units: ["元"],
      explain: "解析：先打折：" + x + " × 0.8 = " + n(0.8 * x) + " 元；再折抵：" + n(0.8 * x) + " − " + b + " = " + n(0.8 * x - b) + "（元）。",
      trapNote: "若先扣折價券再打 8 折：(" + x + " − " + b + ") × 0.8 = " + n((x - b) * 0.8) + " 元，順序不同結果就不同；要照題目敘述的順序列式。" };
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const n = k.num;
    if (k.int(0, 1) === 0) {
      const x = k.int(2, 20), v = 0.6 * (x - 1);
      return { stem: "小明想了一個數，把它乘 0.6 以後再減去 3/5，得到 " + n(v) + "，這個數是多少？", answer: String(x), units: ["個"],
        explain: "解析：逆向：" + n(v) + " + 3/5 = " + n(v + 0.6) + "，再 ÷ 0.6 = " + x + "。" };
    }
    const j = k.int(1, 10), x = 2 * j, v = 0.75 * x - 0.5;
    return { stem: "老師想了一個數，把它乘 0.75 以後再減去 1/2，得到 " + n(v) + "，這個數是多少？", answer: String(x), units: ["個"],
      explain: "解析：逆向：" + n(v) + " + 1/2 = " + n(v + 0.5) + "，再 ÷ 0.75 = " + x + "。" };
  });

  ExamBank.register("mixed-ops", "mixed-ops-main", S);
})();
