/* 題庫：ratio 比與比值、化簡比、連比、等比例、按比分配（對應舊單元 上4）
   題庫工 A 自編。比一律以半形冒號「:」書寫。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, shuffle = K.shuffle, gcd = K.gcd, lcm = K.lcm, F = K.frac;
  const T = "ratio";
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
  function rs(a, b) { const g = gcd(a, b); return (a / g) + ":" + (b / g); }
  function r2(a, b) { return a + ":" + b; }
  function coprime(lo, hi) { let m, n; do { m = int(lo, hi); n = int(lo, hi); } while (m === n || gcd(m, n) !== 1); return [m, n]; }
  function dec(n, d) { let g = gcd(n, d); let q = d / g, a = 0, b = 0; while (q % 2 === 0) { q /= 2; a++; } while (q % 5 === 0) { q /= 5; b++; } if (q !== 1 || Math.max(a, b) > 4) return null; return K.num(n / d); }
  function acc(n, d) { const x = dec(n, d); return x ? [x] : []; }
  function fs(n, d) { return n + "/" + d; }
  function pickOther(arr, bad) { return pick(arr.filter(function (x) { return x !== bad; })); }

  const single = [
    mk("single", 1, "basic", function () {
      const g = int(2, 9), p = coprime(1, 9), m = p[0], n = p[1], a = g * m, b = g * n;
      let sp = 0; for (let q = 2; q <= g; q++) if (g % q === 0) { sp = q; break; }
      const r = S(r2(m, n), [r2(n, m), r2(a, b), r2(a / sp, b / sp), r2(m, n + 1), r2(m + 1, n)]);
      r.stem = "化簡比 " + a + ":" + b + ",結果是?";
      r.explain = "前項、後項同除以最大公因數 " + g + ":" + a + "÷" + g + " = " + m + ",\n" + b + "÷" + g + " = " + n + "。\n最簡整數比是 " + m + ":" + n + "。";
      return r;
    }),
    mk("single", 2, "basic", function () {
      let a, b; do { a = int(2, 12); b = int(2, 12); } while (a === b);
      const r = S(F(a, b), [F(b, a), F(a, a + b), F(b, a + b), F(a + b, b), F(a, b + 1)]);
      r.stem = a + ":" + b + " 的比值是多少?";
      r.explain = "比值 = 前項 ÷ 後項 = " + a + " ÷ " + b + " = " + F(a, b) + "。";
      return r;
    }),
    mk("single", 3, "trap", function () {
      let p1, q1, p2, q2, x, y;
      do { p1 = int(1, 4); q1 = int(2, 6); p2 = int(1, 4); q2 = int(2, 6); x = p1 * q2; y = p2 * q1; } while (p1 * q1 === p2 * q2 || x === y || gcd(p1, q1) !== 1 || gcd(p2, q2) !== 1);
      const g = gcd(x, y);
      const r = S(rs(x, y), [rs(p1 * q1, p2 * q2), r2(p1, p2), r2(q1, q2), rs(y, x), rs(q1, q2), rs(x + 1, y), rs(x, y + 1), rs(p1 + q2, p2 + q1)]);
      r.stem = "化簡比 " + fs(p1, q1) + " : " + fs(p2, q2) + ",結果是?";
      r.explain = "兩個分數同乘分母的最小公倍數 " + lcm(q1, q2) + ":\n" + fs(p1, q1) + "×" + lcm(q1, q2) + " = " + (p1 * lcm(q1, q2) / q1) + ",\n" + fs(p2, q2) + "×" + lcm(q1, q2) + " = " + (p2 * lcm(q1, q2) / q2) + "。\n再約分,得 " + (x / g) + ":" + (y / g) + "。";
      r.trapNote = "常見錯誤:只看分母,把 " + fs(p1, q1) + " : " + fs(p2, q2) + " 當成 " + rs(q1, q2) + ";或把分子分母相乘的方向弄反,得到 " + rs(p1 * q1, p2 * q2) + "。分數比要同乘分母的最小公倍數,化成整數比。";
      return r;
    }),
    mk("single", 4, "trap", function () {
      let a, b, c, d, L;
      do { const p = coprime(1, 7), q = coprime(2, 9); a = p[0]; b = p[1]; c = q[0]; d = q[1]; L = lcm(b, c); } while (b === c);
      let x = a * L / b, y = L, z = d * L / c; const g = gcd(gcd(x, y), z); x /= g; y /= g; z /= g;
      const correct = x + ":" + y + ":" + z;
      const r = S(correct, [r2(a, b) + ":" + d, a + ":" + c + ":" + d, x + ":" + z + ":" + y, (x + 1) + ":" + y + ":" + z, a + ":" + b + ":" + c]);
      r.stem = "甲:乙 = " + a + ":" + b + ",乙:丙 = " + c + ":" + d + ",則 甲:乙:丙 = ?";
      r.explain = "乙同時出現在兩個比裡,要先把乙的份數變成一樣:" + b + " 和 " + c + " 的最小公倍數是 " + L + "。\n甲:乙 = " + (a * L / b) + ":" + L + ",乙:丙 = " + L + ":" + (d * L / c) + "。\n所以 甲:乙:丙 = " + correct + "(已是最簡)。";
      r.trapNote = "常見錯誤:不管乙是否一樣多,直接把 " + a + ":" + b + " 和 " + c + ":" + d + " 接起來。連比必須先把共同的那一項(乙)化成相同的數,才能合併。";
      return r;
    }),
    mk("single", 5, "extend", function () {
      let a, b, c; do { a = int(1, 6); b = int(2, 8); c = int(3, 9); } while (!(a < b && b < c));
      const u = int(2, 15), d = (b - a) * u, tot = (a + b + c) * u;
      const r = S(String(tot), [d * (a + b + c), tot + u, tot - u, u * (b + c), u * c * 2 + u, tot + 2 * u, tot - 2 * u]);
      r.stem = "甲、乙、丙三人合買一份禮物,出錢的比是 " + a + ":" + b + ":" + c + ",已知乙比甲多出 " + d + " 元。這份禮物共多少元?";
      r.explain = "乙比甲多 " + (b - a) + " 份,是 " + d + " 元,所以 1 份 = " + d + " ÷ " + (b - a) + " = " + u + " 元。\n全部有 " + a + "+" + b + "+" + c + " = " + (a + b + c) + " 份,共 " + (a + b + c) + " × " + u + " = " + tot + " 元。";
      return r;
    })
  ];

  const multi = [
    mk("multi", 2, "basic", function () {
      const p = coprime(1, 9), m = p[0], n = p[1], k0 = int(2, 4);
      const ks = shuffle([2, 3, 4, 5, 6, 7, 8, 9].filter(function (k) { return k !== k0; }));
      const ng = int(2, 3), goods = [], bads = [];
      for (let i = 0; i < ng; i++) goods.push(r2(m * ks[i], n * ks[i]));
      const wrongs = [r2(m + ks[3], n + ks[3]), r2(n * ks[4], m * ks[4]), r2(m * ks[5], n * ks[5] + 1), r2(m * ks[6] + 1, n * ks[6])];
      shuffle(wrongs).slice(0, 5 - ng).forEach(function (w) { bads.push(w); });
      return M("下列哪些比,和 " + (m * k0) + ":" + (n * k0) + " 相等?選出所有正確的。", goods, bads,
        (m * k0) + ":" + (n * k0) + " 化簡後是 " + m + ":" + n + "。前後項同乘一個數才會相等:" + goods.join("、") + " 都可化簡成 " + m + ":" + n + "。\n其他選項是前後項加了同一個數、前後項顛倒,或兩項倍數不同,都不相等。");
    }),
    mk("multi", 3, "basic", function () {
      const p = coprime(1, 9), pp = p[0], qq = p[1];
      const ks = shuffle([2, 3, 4, 5, 6, 7, 8]);
      const ng = int(2, 3), goods = [], bads = [];
      for (let i = 0; i < ng; i++) goods.push(r2(pp * ks[i], qq * ks[i]));
      const wrongs = [r2(qq * ks[3], pp * ks[3]), r2(pp * ks[4] + ks[4], qq * ks[4]), r2(pp + ks[5], qq + ks[5]), r2(pp * ks[6], qq * ks[6] + ks[6])];
      shuffle(wrongs).slice(0, 5 - ng).forEach(function (w) { bads.push(w); });
      return M("下列哪些比的比值是 " + fs(pp, qq) + "?選出所有正確的。", goods, bads,
        "比值 = 前項 ÷ 後項。" + goods.join("、") + " 的比值都是 " + fs(pp, qq) + "。\n其他選項的比值是 " + bads.map(function (b) { const t = b.split(":"); return F(Number(t[0]), Number(t[1])); }).join("、") + ",不等於 " + fs(pp, qq) + "。");
    }),
    mk("multi", 3, "trap", function () {
      const p = coprime(2, 9), a = p[0], b = p[1], k = int(2, 5);
      const trues = [
        a + ":" + b + " 的比值是 " + F(a, b),
        "比的前項和後項同時乘以(或除以)同一個不是 0 的數,比值不變",
        a + ":" + b + " 與 " + (a * k) + ":" + (b * k) + " 是相等的比",
        "在比例 " + a + ":" + b + " = " + (a * k) + ":" + (b * k) + " 中,外項的乘積等於內項的乘積"
      ];
      const falses = [
        a + ":" + b + " 與 " + b + ":" + a + " 是相等的比",
        "比的前項和後項同時加上同一個數,比值不變",
        a + ":" + b + " 的比值是 " + F(b, a),
        a + ":" + b + " 與 " + (a + k) + ":" + (b + k) + " 是相等的比"
      ];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "比值是前項除以後項;前後項同乘或同除一個不為 0 的數,比不變;但同時加上同一個數,比就會改變。比的前後項顛倒,是不同的比。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:把「同時加上同一個數」當成「同乘」;或以為 " + a + ":" + b + " 與 " + b + ":" + a + " 一樣(前後項順序不能換)。");
    }),
    mk("multi", 4, "trap", function () {
      let a, b; do { const p = coprime(1, 7); a = p[0]; b = p[1]; } while (a >= b);
      const trues = [
        "甲是乙的 " + F(a, b) + " 倍",
        "乙是甲的 " + F(b, a) + " 倍",
        "甲占兩人總和的 " + F(a, a + b),
        "乙比甲多的部分,是甲的 " + F(b - a, a) + " 倍"
      ];
      const falses = [
        "甲占兩人總和的 " + F(a, b),
        "乙占兩人總和的 " + F(b, a),
        "甲是乙的 " + F(b, a) + " 倍",
        "乙占兩人總和的 " + F(b, a + b + 1)
      ];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("已知 甲:乙 = " + a + ":" + b + "。下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "把甲看成 " + a + " 份、乙看成 " + b + " 份,總共 " + (a + b) + " 份。\n甲是乙的 " + F(a, b) + " 倍,乙是甲的 " + F(b, a) + " 倍,甲占總和 " + F(a, a + b) + ",乙比甲多 " + (b - a) + " 份,是甲的 " + F(b - a, a) + " 倍。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:把「占總和」誤用成 " + F(a, b) + "(忘了分母是總份數 " + (a + b) + ");或把「甲是乙的幾倍」和「乙是甲的幾倍」弄反。");
    }),
    mk("multi", 5, "extend", function () {
      let a, b, c; do { a = int(1, 6); b = int(2, 8); c = int(3, 9); } while (!(a < b && b < c));
      const u = int(2, 15), N = (a + b + c) * u;
      const trues = [
        "甲分得 " + (a * u) + " 元",
        "乙分得 " + (b * u) + " 元",
        "丙分得 " + (c * u) + " 元",
        "丙比甲多分得 " + ((c - a) * u) + " 元"
      ];
      const falses = [
        "甲分得 " + (b * u) + " 元",
        "乙分得 " + (c * u) + " 元",
        "丙比甲多分得 " + ((c + a) * u) + " 元",
        "乙比丙少分得 " + ((c - a) * u) + " 元"
      ];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M(N + " 元按 甲:乙:丙 = " + a + ":" + b + ":" + c + " 分配。下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "總份數 " + (a + b + c) + ",1 份 = " + N + " ÷ " + (a + b + c) + " = " + u + " 元。\n甲 " + (a * u) + " 元、乙 " + (b * u) + " 元、丙 " + (c * u) + " 元;丙比甲多 " + (c - a) + " 份 = " + ((c - a) * u) + " 元;乙比丙少 " + (c - b) + " 份 = " + ((c - b) * u) + " 元。\n正確的敘述是:" + goods.join(";") + "。");
    })
  ];

  const tf = [
    mk("tf", 1, "basic", function () {
      let a, b; do { a = int(2, 12); b = int(2, 12); } while (a === b);
      const right = Math.random() < 0.5;
      const x = right ? F(a, b) : pickOther([F(b, a), F(a, a + b)], F(a, b));
      return { stem: a + ":" + b + " 的比值是 " + x + "。", answer: right,
        explain: "比值 = " + a + " ÷ " + b + " = " + F(a, b) + (right ? ",敘述正確。" : ",不是 " + x + "。") };
    }),
    mk("tf", 2, "trap", function () {
      const p = coprime(1, 9), a = p[0], b = p[1], k = int(2, 5), right = Math.random() < 0.5;
      const other = right ? r2(a * k, b * k) : r2(a + k, b + k);
      return { stem: a + ":" + b + " 與 " + other + " 是相等的比。", answer: right,
        explain: right ? "前後項同乘 " + k + ":" + a + "×" + k + " = " + (a * k) + "," + b + "×" + k + " = " + (b * k) + ",兩個比相等。" : "前後項是「加上」" + k + ",不是同乘。交叉相乘:" + a + "×" + (b + k) + " = " + (a * (b + k)) + "," + b + "×" + (a + k) + " = " + (b * (a + k)) + ",不相等,所以兩個比不相等。",
        trapNote: "易錯觀念:前項、後項「同時加上」同一個數,比值不會維持;只有「同乘」或「同除」同一個不為 0 的數,比才不變。" };
    }),
    mk("tf", 3, "trap", function () {
      let a, b; do { a = int(4, 24); b = int(4, 24); } while (a === b);
      const g = gcd(a, b), right = Math.random() < 0.5;
      const x = right ? b / g : a / g, y = right ? a / g : b / g;
      return { stem: "甲有 " + a + " 個彈珠,乙有 " + b + " 個彈珠,乙與甲的彈珠數量比,化簡後是 " + x + ":" + y + "。", answer: right,
        explain: "「乙與甲」的比,乙在前、甲在後:" + b + ":" + a + " = " + (b / g) + ":" + (a / g) + (right ? ",敘述正確。" : "。敘述寫成 " + x + ":" + y + ",前後顛倒了,不正確。"),
        trapNote: "易錯:比的前後項順序要照題目的順序。「乙與甲」是 乙:甲,不是 甲:乙。" };
    }),
    mk("tf", 4, "basic", function () {
      const p = coprime(1, 7), a = p[0], b = p[1], u = int(2, 20), N = (a + b) * u, right = Math.random() < 0.5;
      const x = right ? a * u : pick([b * u, (a + 1) * u]);
      return { stem: "把 " + N + " 元按 " + a + ":" + b + " 分給甲、乙兩人,甲分得 " + x + " 元。", answer: right,
        explain: "總共 " + a + "+" + b + " = " + (a + b) + " 份,1 份 = " + N + " ÷ " + (a + b) + " = " + u + " 元。甲分得 " + a + " 份 = " + (a * u) + " 元" + (right ? ",敘述正確。" : ",不是 " + x + " 元。") };
    }),
    mk("tf", 5, "extend", function () {
      let a, b, c, d, L;
      do { const p = coprime(1, 7), q = coprime(2, 9); a = p[0]; b = p[1]; c = q[0]; d = q[1]; L = lcm(b, c); } while (b === c);
      let x = a * L / b, y = L, z = d * L / c; const g = gcd(gcd(x, y), z); x /= g; y /= g; z /= g;
      const right = Math.random() < 0.5;
      const claim = right ? x + ":" + y + ":" + z : a + ":" + b + ":" + d;
      return { stem: "甲:乙 = " + a + ":" + b + ",乙:丙 = " + c + ":" + d + ",所以 甲:乙:丙 = " + claim + "。", answer: right || claim === (x + ":" + y + ":" + z),
        explain: "先把乙化成相同份數(" + b + " 和 " + c + " 的最小公倍數 " + L + "):甲:乙:丙 = " + x + ":" + y + ":" + z + "。" + (right ? "敘述正確。" : "敘述中的 " + claim + " 沒有統一乙的份數,不正確。") };
    })
  ];

  const fill = [
    mk("fill", 1, "basic", function () {
      let a, b; do { a = int(2, 15); b = int(2, 15); } while (a === b);
      return { stem: a + ":" + b + " 的比值是 ____(請以最簡分數或整數作答)", answer: F(a, b), accepted: acc(a, b),
        explain: "比值 = 前項 ÷ 後項 = " + a + " ÷ " + b + " = " + F(a, b) + "。" };
    }),
    mk("fill", 2, "basic", function () {
      const g = int(2, 12), p = coprime(1, 9), a = g * p[0], b = g * p[1];
      return { stem: "化簡比 " + a + ":" + b + " = ____(請寫成最簡整數比,例如 3:5)", answer: p[0] + ":" + p[1], accepted: [p[0] + "比" + p[1]],
        explain: "前後項同除以最大公因數 " + g + ":" + a + "÷" + g + " = " + p[0] + "," + b + "÷" + g + " = " + p[1] + "。\n最簡整數比是 " + p[0] + ":" + p[1] + "。" };
    }),
    mk("fill", 3, "basic", function () {
      const g = int(2, 6), p = coprime(1, 8), m = p[0], n = p[1], a = g * m, b = g * n, k = int(2, 9), c = m * k;
      return { stem: a + ":" + b + " = " + c + ":____", answer: String(n * k),
        explain: a + ":" + b + " 化簡是 " + m + ":" + n + "。" + c + " = " + m + "×" + k + ",所以後項 = " + n + "×" + k + " = " + (n * k) + "。" };
    }),
    mk("fill", 4, "trap", function () {
      const g = pick([2, 3, 4, 5]), p = coprime(1, 5), m = p[0], n = p[1], X = g * m, Y = g * n;
      return { stem: "化簡比 " + K.num(X / 10) + ":" + K.num(Y / 10) + " = ____(請寫成最簡整數比,例如 3:5)", answer: m + ":" + n, accepted: [m + "比" + n],
        explain: "前後項同乘 10,化成整數比:" + K.num(X / 10) + ":" + K.num(Y / 10) + " = " + X + ":" + Y + "。\n再同除以最大公因數 " + g + ",得 " + m + ":" + n + "。",
        trapNote: "常見錯誤:小數比化成整數後(" + X + ":" + Y + ")就停下來,沒有再約分。化簡比要的是「最簡」整數比,要約到前後項互質為止。" };
    }),
    mk("fill", 5, "extend", function () {
      let a, b, c, d;
      do { const p = coprime(1, 7), q = coprime(2, 9); a = p[0]; b = p[1]; c = q[0]; d = q[1]; } while (b === c);
      const L = lcm(b, c), w = int(1, 4), s = L / b * w, t = L / c * w, Z = d * t, ans = a * s;
      return { stem: "甲:乙 = " + a + ":" + b + ",乙:丙 = " + c + ":" + d + "。已知丙是 " + Z + ",則甲是 ____。", answer: String(ans),
        explain: "先統一乙的份數(" + b + " 和 " + c + " 的最小公倍數 " + L + "):甲:乙 = " + (a * L / b) + ":" + L + ",乙:丙 = " + L + ":" + (d * L / c) + "。\n丙 " + (d * L / c) + " 份 = " + Z + ",1 份 = " + (Z / (d * L / c)) + ",甲 " + (a * L / b) + " 份 = " + ans + "。" };
    })
  ];

  const calc = [
    mk("calc", 1, "basic", function () {
      let a, b; do { a = int(3, 20); b = int(3, 20); } while (a === b);
      return { stem: "求比 " + a + ":" + b + " 的比值。", answer: F(a, b), accepted: acc(a, b), explain: "比值 = " + a + " ÷ " + b + " = " + F(a, b) + "。" };
    }),
    mk("calc", 2, "basic", function () {
      const g = int(2, 15), p = coprime(1, 12), a = g * p[0], b = g * p[1];
      return { stem: "化簡下列的比:" + a + ":" + b, answer: p[0] + ":" + p[1], accepted: [p[0] + "比" + p[1]],
        explain: "列式:" + a + " 和 " + b + " 的最大公因數是 " + g + "。\n" + a + ":" + b + " = (" + a + "÷" + g + "):(" + b + "÷" + g + ") = " + p[0] + ":" + p[1] + "。" };
    }),
    mk("calc", 3, "basic", function () {
      let u, v, s, t;
      do { const p = coprime(1, 9); u = p[0]; v = p[1]; s = int(2, 9); t = int(2, 9); } while (s === t);
      const a = u * s, x = v * s, c = u * t, d = v * t;
      return { stem: "解比例:" + a + ":x = " + c + ":" + d + ",求 x。", answer: String(x),
        explain: "外項乘積 = 內項乘積:" + a + " × " + d + " = x × " + c + "。\nx = " + (a * d) + " ÷ " + c + " = " + x + "。" };
    }),
    mk("calc", 4, "trap", function () {
      const p = coprime(1, 8); let a = p[0], b = p[1]; if (a > b) { const t = a; a = b; b = t; }
      const u = int(3, 20), N = (a + b) * u;
      return { stem: N + " 元按 " + a + ":" + b + " 分給甲、乙兩人(甲得較少)。乙比甲多得幾元?", answer: String((b - a) * u), units: ["元"],
        explain: "總份數 " + a + "+" + b + " = " + (a + b) + ",1 份 = " + N + " ÷ " + (a + b) + " = " + u + " 元。\n乙比甲多 " + b + " - " + a + " = " + (b - a) + " 份,多得 " + (b - a) + " × " + u + " = " + ((b - a) * u) + " 元。",
        trapNote: "常見錯誤:只算出 " + (b - a) + "(份數的差)就當答案,或用 " + N + " 除以 " + b + "。要先求 1 份是多少元(總數 ÷ 總份數 " + (a + b) + "),再乘上份數的差。" };
    }),
    mk("calc", 5, "extend", function () {
      let a, b, c; do { a = int(1, 6); b = int(1, 7); c = int(2, 9); } while (a === b || c === a || c === b);
      const u = int(2, 15), S2 = (a + b) * u;
      return { stem: "甲:乙:丙 = " + a + ":" + b + ":" + c + ",已知甲、乙兩數的和是 " + S2 + ",求丙數。", answer: String(c * u),
        explain: "甲乙共 " + a + "+" + b + " = " + (a + b) + " 份,1 份 = " + S2 + " ÷ " + (a + b) + " = " + u + "。\n丙 " + c + " 份 = " + c + " × " + u + " = " + (c * u) + "。" };
    })
  ];

  const word = [
    mk("word", 2, "basic", function () {
      const g = int(2, 6), p = coprime(2, 9), x = g * p[0], y = g * p[1];
      return { stem: "六年一班有男生 " + x + " 人、女生 " + y + " 人。男生人數和女生人數的最簡整數比是多少?(請寫成 3:5 的形式)", answer: p[0] + ":" + p[1], accepted: [p[0] + "比" + p[1]], units: ["人"],
        explain: "男生:女生 = " + x + ":" + y + ",同除以最大公因數 " + g + ",得 " + p[0] + ":" + p[1] + "。" };
    }),
    mk("word", 3, "basic", function () {
      const p = coprime(1, 8), a = p[0], b = p[1], u = int(5, 40), N = (a + b) * u;
      return { stem: "姐姐和妹妹把 " + N + " 元按 " + a + ":" + b + " 分配,妹妹分到多少元?", answer: String(b * u), units: ["元"],
        explain: "總份數 " + a + "+" + b + " = " + (a + b) + ",1 份 = " + N + " ÷ " + (a + b) + " = " + u + " 元。\n妹妹 " + b + " 份 = " + b + " × " + u + " = " + (b * u) + " 元。" };
    }),
    mk("word", 4, "trap", function () {
      const p = coprime(2, 7), a = p[0], b = p[1], u = int(3, 12), M2 = a * u;
      return { stem: "某班男生與女生的人數比是 " + a + ":" + b + ",男生有 " + M2 + " 人。全班共有幾人?", answer: String((a + b) * u), units: ["人"],
        explain: "男生 " + a + " 份 = " + M2 + " 人,1 份 = " + u + " 人。\n全班 " + a + "+" + b + " = " + (a + b) + " 份,共 " + (a + b) + " × " + u + " = " + ((a + b) * u) + " 人。",
        trapNote: "常見錯誤:把 " + M2 + " 當成總份數去分,或直接算 " + M2 + "+" + (b * u) + " 以外的東西。已知的 " + M2 + " 只對應「男生那 " + a + " 份」,全班是 " + (a + b) + " 份,要先求 1 份。" };
    }),
    mk("word", 4, "extend", function () {
      let a, b, s1, s2;
      do { const p = coprime(1, 5); a = p[0]; b = p[1]; s1 = int(10, 40); s2 = int(10, 40); } while (s1 === s2);
      const X = a * s1 * 10, Y = b * s2 * 10, u = Math.min(X / a, Y / b);
      return { stem: "調一種飲料,紅茶和牛奶要按 " + a + ":" + b + " 的比混合。現有紅茶 " + X + " 毫升、牛奶 " + Y + " 毫升,最多可以調出多少毫升的飲料?(材料不能超出,可以有剩)", answer: String((a + b) * u), units: ["毫升", "ml", "mL"],
        explain: "紅茶最多可配 " + X + " ÷ " + a + " = " + (X / a) + " 份,牛奶最多可配 " + Y + " ÷ " + b + " = " + (Y / b) + " 份。\n受限於較少的那一邊,只能配 " + u + " 組(每組紅茶 " + a + " 毫升、牛奶 " + b + " 毫升)。\n共 (" + a + "+" + b + ") × " + u + " = " + ((a + b) * u) + " 毫升。" };
    }),
    mk("word", 5, "extend", function () {
      let a, b, u, k, A, B, g, c, d;
      do {
        const p = coprime(2, 6); a = p[0]; b = p[1]; u = int(4, 12); k = int(2, 6);
        A = a * u - k; B = b * u - k;
        g = A > 0 && B > 0 ? gcd(A, B) : 1; c = A / g; d = B / g;
      } while (A <= 0 || B <= 0 || A === B || c > 12 || d > 12 || (a === c && b === d));
      return { stem: "甲、乙兩人錢數的比是 " + a + ":" + b + ",兩人各花掉 " + k + " 元之後,錢數的比變成 " + c + ":" + d + "。甲原來有多少元?", answer: String(a * u), units: ["元"],
        explain: "設 1 份是 u 元,甲原有 " + a + "u、乙原有 " + b + "u。花掉 " + k + " 元後:(" + a + "u - " + k + "):(" + b + "u - " + k + ") = " + c + ":" + d + "。\n交叉相乘:" + d + "(" + a + "u - " + k + ") = " + c + "(" + b + "u - " + k + "),解得 u = " + u + "。\n甲原有 " + a + " × " + u + " = " + (a * u) + " 元(驗算:花掉後 " + A + ":" + B + " = " + c + ":" + d + ")。" };
    })
  ];

  ExamBank.register(T, "ratio-basic", single.concat(multi, tf, fill, calc, word));
})();
