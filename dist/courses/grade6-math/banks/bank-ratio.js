/* 題庫：ratio 比與比值、化簡比、連比、等比例、按比分配（對應舊單元 上4）
   題庫工 A 自編。比的前後項可以是整數／小數／分數／帶分數（例 0.6:0.9、2/3:1/2、1 1/2:2 1/2），
   做法：先決定最簡整數比 m:n，再乘上一個「縮放量」得到題幹的項，全部用 kit.Q 精確運算（規格第 11 節）。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, shuffle = K.shuffle, gcd = K.gcd, lcm = K.lcm;
  const Q = K.Q, qAdd = K.qAdd, qSub = K.qSub, qMul = K.qMul, qDiv = K.qDiv, qCmp = K.qCmp, qFrac = K.qFrac;
  const T = "ratio";
  const cnt = {};
  /* 學生看得到的字串：分母不得超過 100、不得有 9 位以上數字，否則重抽（accepted 內的則直接剔除；accepted 可含精確的長小數） */
  function badStr(x) {
    x = String(x);
    let m; const re = /(\d+)\/(\d+)/g;
    while ((m = re.exec(x))) if (Number(m[2]) > 100) return true;
    return /\d{9,}|\d+\.\d{5,}/.test(x);
  }
  function badAcc(x) {
    x = String(x);
    let m; const re = /(\d+)\/(\d+)/g;
    while ((m = re.exec(x))) if (Number(m[2]) > 100) return true;
    return /\d{9,}/.test(x.replace(/\.\d+/, ""));
  }
  /* fill／calc／word 的答案若是分數（含無限小數的情形），題幹補「（請以分數作答）」，已提到分數就不重複 */
  function addHint(r, type) {
    if ((type === "fill" || type === "calc" || type === "word") && typeof r.answer === "string" && /\//.test(r.answer) && !/分數/.test(r.stem)) {
      r.stem = r.stem + (/____/.test(r.stem) && /____[。]?$/.test(r.stem) ? "" : "") + "(請以分數作答)";
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
    return { id: T + "-" + type + "-L" + level + "-" + (n < 10 ? "0" : "") + n, type: type, level: level, tag: tag, gen: retry(gen, type) };
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
  function coprime(lo, hi) { let m, n; do { m = int(lo, hi); n = int(lo, hi); } while (m === n || gcd(m, n) !== 1); return [m, n]; }
  function decOK(q) { if (!K.qIsTerminating(q)) return false; const s = K.qDec(q); return s !== null && Math.abs(Number(s) - q.n / q.d) < 1e-12; }
  function dsh(q) { return decOK(q) ? K.qDec(q) : K.qMixed(q); }
  function shT(q, fl) { return fl === "dec" ? dsh(q) : fl === "mixed" ? K.qMixed(q) : qFrac(q); }
  function qa(q, fl) { const o = K.qAnswer(q, fl); const v = q.n / q.d; o.accepted = o.accepted.filter(function (x) { return !/^\d+\.\d+$/.test(x) || Math.abs(Number(x) - v) < 1e-12; }); return o; }
  const FL = ["int", "dec", "frac", "mixed"], FLW = [1.5, 3, 3, 1.5];
  function scaleOf(fl) {
    if (fl === "int") return Q(pick([1, 2, 3, 4, 5, 10, 12, 15]));
    if (fl === "dec") return pick([Q(1, 10), Q(2, 10), Q(3, 10), Q(4, 10), Q(5, 10), Q(6, 10), Q(8, 10), Q(25, 100), Q(15, 100), Q(5, 100), Q(12, 10), Q(15, 10), Q(25, 10)]);
    if (fl === "frac") return Q(pick([1, 1, 2, 3]), pick([2, 3, 4, 5, 6, 8]));
    return Q(pick([3, 5, 7, 9, 11]), pick([2, 3, 4]));
  }
  /* 把最簡整數比 m:n 乘上縮放量，得到指定風格的兩項 */
  function trm(m, n, flavors, weights, needC) {
    for (let t = 0; t < 500; t++) {
      const fl = K.flavor(flavors || FL, weights);
      const s = scaleOf(fl), a = qMul(Q(m), s), b = qMul(Q(n), s);
      if (fl === "dec" && !(decOK(a) && decOK(b) && (a.d > 1 || b.d > 1))) continue;
      if (fl === "frac" && a.d === 1 && b.d === 1) continue;
      if (fl === "mixed" && !(a.d > 1 || b.d > 1)) continue;
      if (a.n > 99 || a.d > 99 || b.n > 99 || b.d > 99) continue;
      const o = { a: a, b: b, s: s, fl: fl, sa: shT(a, fl), sb: shT(b, fl), m: m, n: n };
      if (needC && clearG(o) < 2) continue;
      return o;
    }
    throw new Error("重抽");
  }
  function clearX(t) { const L = lcm(t.a.d, t.b.d); return [L, t.a.n * (L / t.a.d), t.b.n * (L / t.b.d)]; }
  function clearG(t) { const c = clearX(t); return gcd(c[1], c[2]); }
  function exR(t) {
    const c = clearX(t), L = c[0], X = c[1], Y = c[2], g = gcd(X, Y);
    let s = t.sa + ":" + t.sb;
    if (L > 1) s += "\n同乘 " + L + ",化成整數比 " + X + ":" + Y;
    if (g > 1) s += "\n再同除以最大公因數 " + g + ",得 " + (X / g) + ":" + (Y / g);
    return s + "\n最簡整數比是 " + t.m + ":" + t.n + "。";
  }
  function tr(t) { return t.sa + ":" + t.sb; }
  function rs(m, n) { return m + ":" + n; }
  /* 比值顯示：dec 風格且為有限小數則用小數，其餘用分數 */
  function valShow(q, fl) { return fl === "dec" ? dsh(q) : fl === "mixed" ? K.qMixed(q) : qFrac(q); }
  /* 金額／量的縮放（把整數題等比例縮成小數、倍數） */
  function msc() { return pick([Q(1), Q(1), Q(10), Q(1, 10), Q(1, 2), Q(1, 4), Q(3, 2)]); }
  function mq(x, s) { return qMul(Q(x), s); }
  function vm(x, s) { return dsh(mq(x, s)); }
  function simplestOf(m, n) { return gcd(m, n) === 1; }

  const single = [
    mk("single", 1, "basic", function () {
      const p = coprime(1, 9), m = p[0], n = p[1], t = trm(m, n, ["int", "dec", "frac", "mixed"], [3, 3, 1, 1], false);
      const r = S(rs(m, n), [rs(n, m), rs(2 * m, 2 * n), rs(3 * m, 3 * n), rs(10 * m, 10 * n), rs(m + 1, n), rs(m, n + 1)]);
      r.stem = "化簡比 " + tr(t) + ",結果是最簡整數比?";
      r.explain = exR(t);
      return r;
    }),
    mk("single", 2, "basic", function () {
      let m, n; do { m = int(2, 9); n = int(2, 9); } while (m === n);
      const t = trm(m, n, FL, FLW), v = Q(m, n), fl = t.fl;
      const cands = [Q(n, m), Q(m, m + n), Q(n, m + n), Q(m + n, n), Q(m, n + 1)].filter(function (x) { return qCmp(x, v) !== 0 && (fl !== "dec" || decOK(x)); }).map(function (x) { return valShow(x, fl); });
      const r = S(valShow(v, fl), cands);
      r.stem = tr(t) + " 的比值是多少?";
      r.explain = "比值 = 前項 ÷ 後項 = " + t.sa + " ÷ " + t.sb + " = " + qFrac(t.a) + " ÷ " + qFrac(t.b) + " = " + valShow(v, fl) + "。";
      return r;
    }),
    mk("single", 3, "trap", function () {
      const p = coprime(1, 9), m = p[0], n = p[1], t = trm(m, n, ["frac", "mixed", "dec"], [3, 2, 2], true);
      const c = clearX(t), X = c[1], Y = c[2];
      const cands = [rs(n, m), rs(X, Y), rs(t.a.n, t.b.n), rs(t.a.d, t.b.d), rs(m + 1, n), rs(m, n + 1)].filter(function (x) { return x !== rs(m, n); });
      const r = S(rs(m, n), cands);
      r.stem = "化簡比 " + tr(t) + ",結果是最簡整數比?";
      r.explain = exR(t);
      r.trapNote = "常見錯誤:把小數、分數化成整數比後(" + X + ":" + Y + ")就停下來,沒有再約分;或只看分子(分母)、顛倒前後項。分數比要同乘分母的最小公倍數、小數比要同乘 10 的倍數,化成整數後還要約成最簡。";
      return r;
    }),
    mk("single", 4, "trap", function () {
      let a0, b0, c0, d0, L;
      do { const p = coprime(1, 7), q = coprime(2, 9); a0 = p[0]; b0 = p[1]; c0 = q[0]; d0 = q[1]; L = lcm(b0, c0); } while (b0 === c0);
      let x = a0 * L / b0, y = L, z = d0 * L / c0; const g = gcd(gcd(x, y), z); x /= g; y /= g; z /= g;
      const t1 = trm(a0, b0, FL, FLW), t2 = trm(c0, d0, FL, FLW);
      const correct = x + ":" + y + ":" + z;
      const r = S(correct, [rs(a0, b0) + ":" + d0, a0 + ":" + c0 + ":" + d0, x + ":" + z + ":" + y, (x + 1) + ":" + y + ":" + z, a0 + ":" + b0 + ":" + c0]);
      r.stem = "甲:乙 = " + tr(t1) + ",乙:丙 = " + tr(t2) + ",則 甲:乙:丙 = ?(請選最簡整數連比)";
      r.explain = "先化簡:甲:乙 = " + a0 + ":" + b0 + ",乙:丙 = " + c0 + ":" + d0 + "。\n乙同時出現在兩個比裡,要先把乙的份數變成一樣:" + b0 + " 和 " + c0 + " 的最小公倍數是 " + L + "。\n甲:乙 = " + (a0 * L / b0) + ":" + L + ",乙:丙 = " + L + ":" + (d0 * L / c0) + "。\n所以 甲:乙:丙 = " + correct + "(已是最簡)。";
      r.trapNote = "常見錯誤:不管乙是否一樣多,直接把兩個比接起來。連比必須先把共同的那一項(乙)化成相同的數,才能合併;小數、分數要先化簡成整數比。";
      return r;
    }),
    mk("single", 5, "extend", function () {
      let a, b, c; do { a = int(1, 6); b = int(2, 8); c = int(3, 9); } while (!(a < b && b < c));
      const s = msc(), u = int(2, 15), d = mq((b - a) * u, s), tot = mq((a + b + c) * u, s);
      if (!decOK(d) || !decOK(tot)) throw new Error("重抽");
      const wr = [qMul(d, Q(a + b + c)), qAdd(tot, mq(u, s)), qSub(tot, mq(u, s)), mq(u * (b + c), s), qAdd(tot, mq(2 * u, s)), qSub(tot, mq(2 * u, s))].filter(function (x) { return x.n > 0 && qCmp(x, tot) !== 0 && decOK(x); }).map(dsh);
      const r = S(dsh(tot), wr);
      r.stem = "甲、乙、丙三人合買一份禮物,出錢的比是 " + a + ":" + b + ":" + c + ",已知乙比甲多出 " + dsh(d) + " 元。這份禮物共多少元?";
      r.explain = "乙比甲多 " + (b - a) + " 份,是 " + dsh(d) + " 元,所以 1 份 = " + dsh(d) + " ÷ " + (b - a) + " = " + dsh(mq(u, s)) + " 元。\n全部有 " + a + "+" + b + "+" + c + " = " + (a + b + c) + " 份,共 " + (a + b + c) + " × " + dsh(mq(u, s)) + " = " + dsh(tot) + " 元。";
      return r;
    })
  ];

  function evR(s) { return s.split(":").map(function (x) { return Number(x); }); }

  const multi = [
    mk("multi", 2, "basic", function () {
      const p = coprime(1, 9), m = p[0], n = p[1], t0 = trm(m, n, FL, FLW);
      const ng = int(2, 3), goods = [], bads = [];
      for (let i = 0; i < ng; i++) goods.push(tr(trm(m, n, FL, FLW)));
      const ws = [function () { return tr(trm(n, m, FL, FLW)); }, function () { const j = int(1, 3); return tr(trm(m + j, n + j, FL, FLW)); }, function () { return tr(trm(m, n + 1, FL, FLW)); }, function () { return tr(trm(m + 1, n, FL, FLW)); }];
      shuffle(ws).slice(0, 5 - ng).forEach(function (f) { bads.push(f()); });
      return M("下列哪些比,和 " + tr(t0) + " 相等?選出所有正確的。", goods, bads,
        tr(t0) + " 化簡後是 " + m + ":" + n + "。前後項同乘(或同除)一個不是 0 的數才會相等:" + goods.join("、") + " 都可化簡成 " + m + ":" + n + "。\n其他選項是前後項顛倒、加了同一個數,或兩項倍數不同,都不相等。");
    }),
    mk("multi", 3, "basic", function () {
      const p = coprime(1, 9), pp = p[0], qq = p[1], P = Q(pp, qq), fl = decOK(P) && Math.random() < 0.5 ? "dec" : "frac";
      const ng = int(2, 3), goods = [], bads = [];
      for (let i = 0; i < ng; i++) goods.push(tr(trm(pp, qq, FL, FLW)));
      const ws = [function () { return tr(trm(qq, pp, FL, FLW)); }, function () { return tr(trm(pp + 1, qq, FL, FLW)); }, function () { const j = int(1, 3); return tr(trm(pp + j, qq + j, FL, FLW)); }, function () { return tr(trm(pp, qq + 1, FL, FLW)); }];
      shuffle(ws).slice(0, 5 - ng).forEach(function (f) { bads.push(f()); });
      return M("下列哪些比的比值是 " + valShow(P, fl) + "?選出所有正確的。", goods, bads,
        "比值 = 前項 ÷ 後項。" + goods.join("、") + " 的比值都是 " + valShow(P, fl) + "。\n其他選項的比值不是 " + valShow(P, fl) + "(前後項顛倒、或加了同一個數)。");
    }),
    mk("multi", 3, "trap", function () {
      const p = coprime(2, 9), m = p[0], n = p[1];
      const tA = trm(m, n, FL, FLW), tB = trm(m, n, FL, FLW), j = int(1, 3), tC = trm(m + j, n + j, FL, FLW);
      const v = Q(m, n), vw = Q(n, m), fl = tA.fl;
      const trues = [
        tr(tA) + " 的比值是 " + valShow(v, fl),
        "比的前項和後項同時乘以(或除以)同一個不是 0 的數,比值不變",
        tr(tA) + " 與 " + tr(tB) + " 是相等的比",
        "在比例 " + tr(tA) + " = " + tr(tB) + " 中,外項的乘積等於內項的乘積"
      ];
      const falses = [
        tr(tA) + " 與 " + tA.sb + ":" + tA.sa + " 是相等的比",
        "比的前項和後項同時加上同一個數,比值不變",
        tr(tA) + " 的比值是 " + valShow(vw, fl),
        tr(tA) + " 與 " + tr(tC) + " 是相等的比"
      ];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "比值是前項除以後項;前後項同乘或同除一個不為 0 的數,比不變;同時加上同一個數,比就會改變。比的前後項顛倒,是不同的比。小數、分數的比,先化成最簡整數比(" + m + ":" + n + ")再比較。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:把「同時加上同一個數」當成「同乘」;或以為前後項顛倒的比相等。");
    }),
    mk("multi", 4, "trap", function () {
      let m, n; do { const p = coprime(1, 7); m = p[0]; n = p[1]; } while (m >= n);
      const t = trm(m, n, FL, FLW), f = function (q) { return valShow(q, pick(["frac", "dec"])); };
      const sh2 = function (q) { return decOK(q) && Math.random() < 0.5 ? dsh(q) : qFrac(q); };
      const trues = [
        "甲是乙的 " + sh2(Q(m, n)) + " 倍",
        "乙是甲的 " + sh2(Q(n, m)) + " 倍",
        "甲占兩人總和的 " + sh2(Q(m, m + n)),
        "乙比甲多的部分,是甲的 " + sh2(Q(n - m, m)) + " 倍"
      ];
      const falses = [
        "甲占兩人總和的 " + sh2(Q(m, n)),
        "乙占兩人總和的 " + sh2(Q(n, m)),
        "甲是乙的 " + sh2(Q(n, m)) + " 倍",
        "乙占兩人總和的 " + sh2(Q(n, m + n + 1))
      ];
      void f;
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("已知 甲:乙 = " + tr(t) + "。下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "先化簡:甲:乙 = " + m + ":" + n + ",把甲看成 " + m + " 份、乙看成 " + n + " 份,總共 " + (m + n) + " 份。\n甲是乙的 " + qFrac(Q(m, n)) + " 倍,乙是甲的 " + qFrac(Q(n, m)) + " 倍,甲占總和 " + qFrac(Q(m, m + n)) + ",乙比甲多 " + (n - m) + " 份,是甲的 " + qFrac(Q(n - m, m)) + " 倍。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:把「占總和」誤用成 " + qFrac(Q(m, n)) + "(忘了分母是總份數 " + (m + n) + ");或把「甲是乙的幾倍」和「乙是甲的幾倍」弄反。");
    }),
    mk("multi", 5, "extend", function () {
      let a, b, c; do { a = int(1, 6); b = int(2, 8); c = int(3, 9); } while (!(a < b && b < c));
      const s = msc(), u = int(2, 15), N = mq((a + b + c) * u, s);
      if (!decOK(N)) throw new Error("重抽");
      const v = function (x) { return vm(x * u, s); };
      const trues = ["甲分得 " + v(a) + " 元", "乙分得 " + v(b) + " 元", "丙分得 " + v(c) + " 元", "丙比甲多分得 " + v(c - a) + " 元"];
      const falses = ["甲分得 " + v(b) + " 元", "乙分得 " + v(c) + " 元", "丙比甲多分得 " + v(c + a) + " 元", "乙比丙少分得 " + v(c - a) + " 元"];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M(dsh(N) + " 元按 甲:乙:丙 = " + a + ":" + b + ":" + c + " 分配。下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "總份數 " + (a + b + c) + ",1 份 = " + dsh(N) + " ÷ " + (a + b + c) + " = " + vm(u, s) + " 元。\n甲 " + v(a) + " 元、乙 " + v(b) + " 元、丙 " + v(c) + " 元;丙比甲多 " + (c - a) + " 份 = " + v(c - a) + " 元;乙比丙少 " + (c - b) + " 份 = " + v(c - b) + " 元。\n正確的敘述是:" + goods.join(";") + "。");
    })
  ];

  const tf = [
    mk("tf", 1, "basic", function () {
      let m, n; do { m = int(2, 9); n = int(2, 9); } while (m === n);
      const t = trm(m, n, FL, FLW), v = Q(m, n), fl = t.fl, right = Math.random() < 0.5;
      const wr = [Q(n, m), Q(m, m + n)].filter(function (x) { return qCmp(x, v) !== 0 && (fl !== "dec" || decOK(x)); });
      if (!right && !wr.length) throw new Error("重抽");
      const x = right ? v : pick(wr);
      return { stem: tr(t) + " 的比值是 " + valShow(x, fl) + "。", answer: right,
        explain: "比值 = " + t.sa + " ÷ " + t.sb + " = " + qFrac(t.a) + " ÷ " + qFrac(t.b) + " = " + valShow(v, fl) + (right ? ",敘述正確。" : ",不是 " + valShow(x, fl) + "。") };
    }),
    mk("tf", 2, "trap", function () {
      const p = coprime(1, 9), m = p[0], n = p[1], right = Math.random() < 0.5, j = int(1, 3);
      const t1 = trm(m, n, FL, FLW), t2 = right ? trm(m, n, FL, FLW) : trm(m + j, n + j, FL, FLW);
      return { stem: tr(t1) + " 與 " + tr(t2) + " 是相等的比。", answer: right,
        explain: "先化成最簡整數比:" + tr(t1) + " = " + m + ":" + n + ";" + tr(t2) + " = " + (right ? m + ":" + n : (m + j) + ":" + (n + j)) + "。" + (right ? "兩個比相等。" : "前後項是「加上」" + j + ",不是同乘,交叉相乘 " + m + "×" + (n + j) + " ≠ " + n + "×" + (m + j) + ",所以兩個比不相等。"),
        trapNote: "易錯觀念:前項、後項「同時加上」同一個數,比值不會維持;只有「同乘」或「同除」同一個不為 0 的數,比才不變。小數、分數的比要先化成最簡整數比再比較。" };
    }),
    mk("tf", 3, "trap", function () {
      const p = coprime(2, 9), m = p[0], n = p[1], t = trm(m, n, ["int", "dec", "frac"], [2, 4, 2]);
      const right = Math.random() < 0.5, x = right ? n : m, y = right ? m : n;
      return { stem: "甲有 " + t.sa + " 公斤的糖,乙有 " + t.sb + " 公斤的糖,乙與甲的重量比,化簡後是 " + x + ":" + y + "。", answer: right,
        explain: "「乙與甲」的比,乙在前、甲在後:乙:甲 = " + t.sb + ":" + t.sa + " = " + n + ":" + m + (right ? ",敘述正確。" : "。敘述寫成 " + x + ":" + y + ",前後顛倒了,不正確。"),
        trapNote: "易錯:比的前後項順序要照題目的順序。「乙與甲」是 乙:甲,不是 甲:乙。" };
    }),
    mk("tf", 4, "basic", function () {
      const p = coprime(1, 7), a = p[0], b = p[1], u = int(2, 20), s = msc(), N = mq((a + b) * u, s), right = Math.random() < 0.5;
      const x = right ? mq(a * u, s) : pick([mq(b * u, s), mq((a + 1) * u, s)]);
      if (!decOK(N) || !decOK(x)) throw new Error("重抽");
      return { stem: "把 " + dsh(N) + " 元按 " + a + ":" + b + " 分給甲、乙兩人,甲分得 " + dsh(x) + " 元。", answer: right,
        explain: "總共 " + a + "+" + b + " = " + (a + b) + " 份,1 份 = " + dsh(N) + " ÷ " + (a + b) + " = " + vm(u, s) + " 元。甲分得 " + a + " 份 = " + vm(a * u, s) + " 元" + (right ? ",敘述正確。" : ",不是 " + dsh(x) + " 元。") };
    }),
    mk("tf", 5, "extend", function () {
      let a0, b0, c0, d0, L;
      do { const p = coprime(1, 7), q = coprime(2, 9); a0 = p[0]; b0 = p[1]; c0 = q[0]; d0 = q[1]; L = lcm(b0, c0); } while (b0 === c0);
      let x = a0 * L / b0, y = L, z = d0 * L / c0; const g = gcd(gcd(x, y), z); x /= g; y /= g; z /= g;
      const t1 = trm(a0, b0, FL, FLW), t2 = trm(c0, d0, FL, FLW);
      const right = Math.random() < 0.5, claim = right ? x + ":" + y + ":" + z : a0 + ":" + b0 + ":" + d0;
      return { stem: "甲:乙 = " + tr(t1) + ",乙:丙 = " + tr(t2) + ",所以 甲:乙:丙 = " + claim + "。", answer: right || claim === (x + ":" + y + ":" + z),
        explain: "先化簡:甲:乙 = " + a0 + ":" + b0 + ",乙:丙 = " + c0 + ":" + d0 + "。把乙化成相同份數(" + b0 + " 和 " + c0 + " 的最小公倍數 " + L + "):甲:乙:丙 = " + x + ":" + y + ":" + z + "。" + (right ? "敘述正確。" : "敘述中的 " + claim + " 沒有統一乙的份數,不正確。") };
    })
  ];

  const HINT = "(請寫成最簡整數比)";
  const fill = [
    mk("fill", 1, "basic", function () {
      let m, n; do { m = int(2, 12); n = int(2, 12); } while (m === n);
      const t = trm(m, n, FL, FLW), v = Q(m, n), a = qa(v, t.fl === "mixed" ? "mixed" : t.fl);
      return { stem: tr(t) + " 的比值是 ____(請以最簡分數、帶分數或小數作答)", answer: a.answer, accepted: a.accepted,
        explain: "比值 = 前項 ÷ 後項 = " + t.sa + " ÷ " + t.sb + " = " + qFrac(t.a) + " ÷ " + qFrac(t.b) + " = " + qFrac(v) + "。" };
    }),
    mk("fill", 2, "basic", function () {
      const p = coprime(1, 12), t = trm(p[0], p[1], FL, FLW);
      return { stem: "化簡比 " + tr(t) + " = ____" + HINT, answer: rs(p[0], p[1]), accepted: [p[0] + "比" + p[1]], explain: exR(t) };
    }),
    mk("fill", 3, "basic", function () {
      const p = coprime(1, 8), m = p[0], n = p[1];
      let t1, t2; do { t1 = trm(m, n, FL, FLW); t2 = trm(m, n, FL, FLW); } while (qCmp(t1.s, t2.s) === 0);
      const a = qa(t2.b, t2.fl === "int" ? "frac" : t2.fl);
      return { stem: tr(t1) + " = " + t2.sa + ":____", answer: a.answer, accepted: a.accepted,
        explain: tr(t1) + " 化簡是 " + m + ":" + n + "。" + t2.sa + " 是 " + m + " 的 " + qFrac(t2.s) + " 倍,所以後項 = " + n + " × " + qFrac(t2.s) + " = " + shT(t2.b, t2.fl) + "。" };
    }),
    mk("fill", 4, "trap", function () {
      const p = coprime(1, 5), m = p[0], n = p[1], t = trm(m, n, ["dec", "frac", "mixed"], [3, 2, 1], true), c = clearX(t);
      return { stem: "化簡比 " + tr(t) + " = ____" + HINT, answer: rs(m, n), accepted: [m + "比" + n], explain: exR(t),
        trapNote: "常見錯誤:小數(分數)比化成整數比後(" + c[1] + ":" + c[2] + ")就停下來,沒有再約分。化簡比要的是「最簡」整數比,要約到前後項互質為止。" };
    }),
    mk("fill", 5, "extend", function () {
      let a0, b0, c0, d0, L;
      do { const p = coprime(1, 7), q = coprime(2, 9); a0 = p[0]; b0 = p[1]; c0 = q[0]; d0 = q[1]; L = lcm(b0, c0); } while (b0 === c0);
      let x = a0 * L / b0, y = L, z = d0 * L / c0; const g = gcd(gcd(x, y), z); x /= g; y /= g; z /= g;
      const t1 = trm(a0, b0, FL, FLW), t2 = trm(c0, d0, FL, FLW);
      const fu = K.flavor(["int", "dec", "frac"]), u = fu === "int" ? Q(int(2, 9)) : fu === "dec" ? Q(pick([5, 15, 25, 35]), 10) : Q(pick([1, 3, 5]), pick([2, 4]));
      const Z = qMul(Q(z), u), ans = qMul(Q(x), u);
      if (fu === "dec" && !(decOK(Z) && decOK(ans))) throw new Error("重抽");
      const a = qa(ans, fu === "dec" ? "dec" : "frac");
      return { stem: "甲:乙 = " + tr(t1) + ",乙:丙 = " + tr(t2) + "。已知丙是 " + shT(Z, fu === "dec" ? "dec" : "frac") + ",則甲是 ____。", answer: a.answer, accepted: a.accepted,
        explain: "先化簡:甲:乙 = " + a0 + ":" + b0 + ",乙:丙 = " + c0 + ":" + d0 + "。統一乙的份數(" + b0 + " 和 " + c0 + " 的最小公倍數 " + L + "):甲:乙:丙 = " + x + ":" + y + ":" + z + "。\n丙 " + z + " 份 = " + shT(Z, fu === "dec" ? "dec" : "frac") + ",1 份 = " + shT(u, fu === "dec" ? "dec" : "frac") + ",甲 " + x + " 份 = " + shT(ans, fu === "dec" ? "dec" : "frac") + "。" };
    })
  ];

  const calc = [
    mk("calc", 1, "basic", function () {
      let m, n; do { m = int(3, 20); n = int(3, 20); } while (m === n);
      const t = trm(m, n, FL, FLW), v = Q(m, n), a = qa(v, t.fl === "mixed" ? "mixed" : t.fl);
      return { stem: "求比 " + tr(t) + " 的比值。", answer: a.answer, accepted: a.accepted, explain: "比值 = " + t.sa + " ÷ " + t.sb + " = " + qFrac(t.a) + " ÷ " + qFrac(t.b) + " = " + qFrac(v) + "。" };
    }),
    mk("calc", 2, "basic", function () {
      const p = coprime(1, 12), t = trm(p[0], p[1], FL, FLW);
      return { stem: "化簡下列的比:" + tr(t) + HINT, answer: rs(p[0], p[1]), accepted: [p[0] + "比" + p[1]], explain: exR(t) };
    }),
    mk("calc", 3, "basic", function () {
      const p = coprime(1, 9), m = p[0], n = p[1];
      let t1, t2; do { t1 = trm(m, n, FL, FLW); t2 = trm(m, n, FL, FLW); } while (qCmp(t1.s, t2.s) === 0);
      const a = qa(t1.b, t1.fl === "int" ? "frac" : t1.fl);
      return { stem: "解比例:" + t1.sa + ":□ = " + t2.sa + ":" + t2.sb + ",求 □。", answer: a.answer, accepted: a.accepted,
        explain: "右邊 " + tr(t2) + " 化簡是 " + m + ":" + n + "。左邊前項 " + t1.sa + " 是 " + m + " 的 " + qFrac(t1.s) + " 倍,所以 □ = " + n + " × " + qFrac(t1.s) + " = " + shT(t1.b, t1.fl) + "。\n(也可用外項乘積 = 內項乘積檢查。)" };
    }),
    mk("calc", 4, "trap", function () {
      const p = coprime(1, 8); let a = p[0], b = p[1]; if (a > b) { const t = a; a = b; b = t; }
      const s = msc(), u = int(3, 20), N = mq((a + b) * u, s), ans = mq((b - a) * u, s);
      if (!decOK(N) || !decOK(ans)) throw new Error("重抽");
      const x = qa(ans, "dec");
      return { stem: dsh(N) + " 元按 " + a + ":" + b + " 分給甲、乙兩人(甲得較少)。乙比甲多得幾元?", answer: x.answer, accepted: x.accepted, units: ["元"],
        explain: "總份數 " + a + "+" + b + " = " + (a + b) + ",1 份 = " + dsh(N) + " ÷ " + (a + b) + " = " + vm(u, s) + " 元。\n乙比甲多 " + b + " - " + a + " = " + (b - a) + " 份,多得 " + (b - a) + " × " + vm(u, s) + " = " + dsh(ans) + " 元。",
        trapNote: "常見錯誤:只算出 " + (b - a) + "(份數的差)就當答案,或用 " + dsh(N) + " 除以 " + b + "。要先求 1 份是多少元(總數 ÷ 總份數 " + (a + b) + "),再乘上份數的差。" };
    }),
    mk("calc", 5, "extend", function () {
      let a, b, c; do { a = int(1, 6); b = int(1, 7); c = int(2, 9); } while (a === b || c === a || c === b);
      const s = msc(), u = int(2, 15), S2 = mq((a + b) * u, s), ans = mq(c * u, s);
      if (!decOK(S2) || !decOK(ans)) throw new Error("重抽");
      const x = qa(ans, "dec");
      return { stem: "甲:乙:丙 = " + a + ":" + b + ":" + c + ",已知甲、乙兩數的和是 " + dsh(S2) + ",求丙數。", answer: x.answer, accepted: x.accepted,
        explain: "甲乙共 " + a + "+" + b + " = " + (a + b) + " 份,1 份 = " + dsh(S2) + " ÷ " + (a + b) + " = " + vm(u, s) + "。\n丙 " + c + " 份 = " + c + " × " + vm(u, s) + " = " + dsh(ans) + "。" };
    })
  ];

  const word = [
    mk("word", 2, "basic", function () {
      const p = coprime(2, 9), t = trm(p[0], p[1], ["int", "dec", "dec", "frac"], [2, 4, 4, 2]);
      return { stem: "調一杯飲料,用了牛奶 " + t.sa + " 公升、咖啡 " + t.sb + " 公升。牛奶和咖啡的用量比,化成最簡整數比是多少?(請寫成 □:□ 的形式)", answer: rs(p[0], p[1]), accepted: [p[0] + "比" + p[1]], units: ["公升"],
        explain: "牛奶:咖啡 = " + tr(t) + "。\n" + exR(t).split("\n").slice(1).join("\n") };
    }),
    mk("word", 3, "basic", function () {
      const p = coprime(1, 8), a = p[0], b = p[1], u = int(5, 40), s = msc(), N = mq((a + b) * u, s), ans = mq(b * u, s);
      if (!decOK(N) || !decOK(ans)) throw new Error("重抽");
      const x = qa(ans, "dec");
      return { stem: "姐姐和妹妹把 " + dsh(N) + " 元按 " + a + ":" + b + " 分配,妹妹分到多少元?", answer: x.answer, accepted: x.accepted, units: ["元"],
        explain: "總份數 " + a + "+" + b + " = " + (a + b) + ",1 份 = " + dsh(N) + " ÷ " + (a + b) + " = " + vm(u, s) + " 元。\n妹妹 " + b + " 份 = " + b + " × " + vm(u, s) + " = " + dsh(ans) + " 元。" };
    }),
    mk("word", 4, "trap", function () {
      const p = coprime(2, 7), a = p[0], b = p[1], u = int(3, 12), s = msc(), M2 = mq(a * u, s), tot = mq((a + b) * u, s);
      if (!decOK(M2) || !decOK(tot)) throw new Error("重抽");
      const x = qa(tot, "dec");
      return { stem: "一捆彩帶剪成紅、藍兩種顏色,紅色與藍色的長度比是 " + a + ":" + b + ",紅色彩帶長 " + dsh(M2) + " 公尺。這捆彩帶全長幾公尺?", answer: x.answer, accepted: x.accepted, units: ["公尺", "m"],
        explain: "紅色 " + a + " 份 = " + dsh(M2) + " 公尺,1 份 = " + vm(u, s) + " 公尺。\n全長 " + a + "+" + b + " = " + (a + b) + " 份,共 " + (a + b) + " × " + vm(u, s) + " = " + dsh(tot) + " 公尺。",
        trapNote: "常見錯誤:把 " + dsh(M2) + " 當成總量去分,或只算紅色加藍色以外的東西。已知的 " + dsh(M2) + " 只對應「紅色那 " + a + " 份」,全長是 " + (a + b) + " 份,要先求 1 份。" };
    }),
    mk("word", 4, "extend", function () {
      let a, b, p1, p2;
      do { const p = coprime(1, 5); a = p[0]; b = p[1]; p1 = int(10, 40); p2 = int(10, 40); } while (p1 === p2);
      const fu = K.flavor(["int", "dec"]), u = fu === "int" ? Q(pick([10, 5, 20])) : Q(pick([5, 25, 15]), 10);
      const X = qMul(Q(a * p1), u), Y = qMul(Q(b * p2), u), ans = qMul(Q((a + b) * Math.min(p1, p2)), u);
      if (!decOK(X) || !decOK(Y) || !decOK(ans)) throw new Error("重抽");
      const x = qa(ans, "dec");
      return { stem: "調一種飲料,紅茶和牛奶要按 " + a + ":" + b + " 的比混合。現有紅茶 " + dsh(X) + " 毫升、牛奶 " + dsh(Y) + " 毫升,最多可以調出多少毫升的飲料?(材料不能超出,可以有剩)", answer: x.answer, accepted: x.accepted, units: ["毫升", "ml", "mL"],
        explain: "紅茶最多可配 " + dsh(X) + " ÷ " + a + " = " + dsh(qDiv(X, Q(a))) + " 組,牛奶最多可配 " + dsh(Y) + " ÷ " + b + " = " + dsh(qDiv(Y, Q(b))) + " 組。\n受限於較少的那一邊,只能配 " + dsh(qMul(Q(Math.min(p1, p2)), u)) + " 組(每組紅茶 " + a + " 毫升、牛奶 " + b + " 毫升)。\n共 (" + a + "+" + b + ") × " + dsh(qMul(Q(Math.min(p1, p2)), u)) + " = " + dsh(ans) + " 毫升。" };
    }),
    mk("word", 5, "extend", function () {
      let a, b, u, k, A, B, g, c, d;
      do {
        const p = coprime(2, 6); a = p[0]; b = p[1]; u = int(4, 12); k = int(2, 6);
        A = a * u - k; B = b * u - k;
        g = A > 0 && B > 0 ? gcd(A, B) : 1; c = A / g; d = B / g;
      } while (A <= 0 || B <= 0 || A === B || c > 12 || d > 12 || (a === c && b === d));
      const s = pick([Q(1), Q(1, 10), Q(1, 2), Q(5)]), kq = mq(k, s), ans = mq(a * u, s);
      if (!decOK(kq) || !decOK(ans)) throw new Error("重抽");
      const x = qa(ans, "dec");
      return { stem: "甲、乙兩人錢數的比是 " + a + ":" + b + ",兩人各花掉 " + dsh(kq) + " 元之後,錢數的比變成 " + c + ":" + d + "。甲原來有多少元?", answer: x.answer, accepted: x.accepted, units: ["元"],
        explain: "設 1 份是 □ 元,甲原有 " + a + " × □、乙原有 " + b + " × □。花掉 " + dsh(kq) + " 元後:(" + a + " × □ - " + dsh(kq) + "):(" + b + " × □ - " + dsh(kq) + ") = " + c + ":" + d + "。\n交叉相乘 " + d + " × (" + a + " × □ - " + dsh(kq) + ") = " + c + " × (" + b + " × □ - " + dsh(kq) + "),解得 □ = " + vm(u, s) + "。\n甲原有 " + a + " × " + vm(u, s) + " = " + dsh(ans) + " 元。" };
    })
  ];

  ExamBank.register(T, "ratio-basic", single.concat(multi, tf, fill, calc, word));
})();
