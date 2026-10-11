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
  function coprime(lo, hi) { let m, n; do { m = int(lo, hi); n = int(lo, hi); } while (m === n || gcd(m, n) !== 1); return [m, n]; }
  function decOK(q) { if (!K.qIsTerminating(q)) return false; const s = K.qDec(q); return s !== null && Math.abs(Number(s) - q.n / q.d) < 1e-12; }
  function dsh(q) { return decOK(q) ? K.qDec(q) : K.qMixed(q); }
  function shT(q, fl) { return fl === "dec" ? dsh(q) : (fl === "mixed" || fl === "frac") ? K.qMixed(q) : qFrac(q); }
  function qa(q, fl) { const o = K.qAnswer(q, (fl === "int" || fl === "frac") ? "mixed" : fl); const v = q.n / q.d; o.accepted = o.accepted.filter(function (x) { return !/^\d+\.\d+$/.test(x) || Math.abs(Number(x) - v) < 1e-12; }); return o; }
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
        "若 " + tr(tA) + " 與 " + tr(tB) + " 是相等的比,則外項的乘積等於內項的乘積"
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

  /* ===== 教材式 □ 未知數題（規格第 14 節）===== */
  function twoPairs() {
    const p = coprime(1, 9), m = p[0], n = p[1];
    for (let t = 0; t < 200; t++) {
      const t1 = trm(m, n, FL, FLW), t2 = trm(m, n, FL, FLW);
      if (qCmp(t1.s, t2.s) !== 0) return { m: m, n: n, t1: t1, t2: t2 };
    }
    throw new Error("重抽");
  }
  function fa(fl) { return fl === "int" ? "frac" : fl; }
  /* hide: 0=a1 1=b1 2=a2 3=b2 */
  function eqStr(P, hide) {
    const v = [P.t1.sa, P.t1.sb, P.t2.sa, P.t2.sb]; v[hide] = "□";
    return "「" + v[0] + ":" + v[1] + " = " + v[2] + ":" + v[3] + "」";
  }
  function hidden(P, hide) { return [P.t1.a, P.t1.b, P.t2.a, P.t2.b][hide]; }
  function hfl(P, hide) { return hide < 2 ? P.t1.fl : P.t2.fl; }
  function exBox(P, hide) {
    const pair = hide < 2 ? P.t1 : P.t2, comp = hide < 2 ? P.t2 : P.t1, fl = pair.fl;
    const hs = hide % 2 === 0 ? P.m : P.n, os = hide % 2 === 0 ? P.n : P.m, other = hide % 2 === 0 ? pair.b : pair.a;
    return "完整的比 " + tr(comp) + " 化簡是 " + P.m + ":" + P.n + ",所以含 □ 的比也是 " + P.m + ":" + P.n + "。\n另一項 " + shT(other, fl) + " 是 " + os + " 份,1 份 = " + shT(other, fl) + " ÷ " + os + " = " + shT(pair.s, fl) + ";□ 是 " + hs + " 份,□ = " + hs + " × " + shT(pair.s, fl) + " = " + shT(hidden(P, hide), fl) + "。\n(也可用外項乘積 = 內項乘積檢查。)";
  }

  const boxes = [
    mk("single", 1, "basic", function () {
      const P = twoPairs(), h = 3, X = hidden(P, h), fx = fa(hfl(P, h));
      const wr = [qMul(P.t2.a, P.t1.b), qAdd(P.t2.b, qSub(P.t1.a, P.t1.b).n < 0 ? Q(1) : Q(2)), qDiv(qMul(P.t1.a, P.t2.a), P.t1.b), P.t1.b, qAdd(X, Q(1, 2)), qMul(X, Q(2))].filter(function (x) { return x.n > 0 && qCmp(x, X) !== 0 && (fx !== "dec" || decOK(x)); }).map(function (x) { return shT(x, fx); });
      const r = S(shT(X, fx), wr);
      r.stem = eqStr(P, h) + ",□ 是多少?";
      r.explain = exBox(P, h);
      return r;
    }),
    mk("calc", 2, "basic", function () {
      const P = twoPairs(), h = 0, X = hidden(P, h), a = qa(X, fa(hfl(P, h)));
      return { stem: "求 □ 是多少:" + eqStr(P, h), answer: a.answer, accepted: a.accepted, explain: exBox(P, h) };
    }),
    mk("fill", 3, "basic", function () {
      const P = twoPairs(), h = 2, X = hidden(P, h), a = qa(X, fa(hfl(P, h)));
      return { stem: eqStr(P, h) + ",□ = ____", answer: a.answer, accepted: a.accepted, explain: exBox(P, h) };
    }),
    mk("single", 3, "trap", function () {
      const P = twoPairs(), h = 3, X = hidden(P, h), fx = fa(hfl(P, h));
      const add = qAdd(P.t2.a, qSub(P.t1.b, P.t1.a));
      const wr = [add, qMul(P.t2.a, P.t1.b), qDiv(P.t2.a, P.t1.b), qDiv(qMul(P.t1.a, P.t2.a), P.t1.b), qAdd(X, Q(1))].filter(function (x) { return x.n > 0 && qCmp(x, X) !== 0 && (fx !== "dec" || decOK(x)); }).map(function (x) { return shT(x, fx); });
      const r = S(shT(X, fx), wr);
      r.stem = eqStr(P, h) + ",□ 是多少?";
      r.explain = exBox(P, h);
      r.trapNote = "常見錯誤:前項從 " + P.t1.sa + " 變成 " + P.t2.sa + ",就把後項「加上同樣多」,得到 " + shT(add, fx) + "。比例是「同乘(同除)」同一個倍數,不是同加。";
      return r;
    }),
    mk("tf", 2, "trap", function () {
      const P = twoPairs(), h = 3, X = hidden(P, h), fx = fa(hfl(P, h));
      const add = qAdd(P.t2.a, qSub(P.t1.b, P.t1.a)); if (qCmp(add, X) === 0 || (fx === "dec" && !decOK(add)) || add.n <= 0) throw new Error("重抽");
      const right = Math.random() < 0.5, v = right ? X : add;
      return { stem: eqStr(P, h) + ",所以 □ = " + shT(v, fx) + "。", answer: right,
        explain: exBox(P, h) + (right ? "\n敘述正確。" : "\n正確的 □ 是 " + shT(X, fx) + ",不是 " + shT(v, fx) + "。"),
        trapNote: "易錯:以為前項增加多少,後項就跟著增加多少(同加)。比例要用同乘(同除)的倍數關係。" };
    }),
    mk("fill", 4, "trap", function () {
      const P = twoPairs(), h = 1, X = hidden(P, h), a = qa(X, fa(hfl(P, h)));
      return { stem: eqStr(P, h) + ",□ = ____", answer: a.answer, accepted: a.accepted, explain: exBox(P, h),
        trapNote: "常見錯誤:□ 在前一個比的後項,卻把它當成最後一項去乘,得到 " + shT(qMul(P.t2.b, P.t1.a), fa(hfl(P, h))) + "。先看清楚兩個比的前項、後項對應關係,再用倍數(或外項乘積 = 內項乘積)求。" };
    }),
    mk("calc", 5, "extend", function () {
      const p = coprime(1, 5), m = p[0], n = p[1], fl = K.flavor(["int", "dec", "frac"]);
      const s = fl === "int" ? Q(int(1, 4)) : fl === "dec" ? Q(pick([1, 2, 5, 25]), pick([10, 10, 100])) : Q(pick([1, 3]), pick([2, 4, 5]));
      const A = qMul(Q(m * m), s), C = qMul(Q(n * n), s), t = qMul(Q(m * n), s);
      if (fl === "dec" && !(decOK(A) && decOK(C) && decOK(t))) throw new Error("重抽");
      const sA = shT(A, fl), sC = shT(C, fl), a = qa(t, fa(fl));
      return { stem: "「" + sA + ":□ = □:" + sC + "」,兩個 □ 是同一個數。求 □ 是多少?", answer: a.answer, accepted: a.accepted,
        explain: "外項乘積 = 內項乘積:" + sA + " × " + sC + " = □ × □。\n" + sA + " × " + sC + " = " + shT(qMul(A, C), fl) + ",而 " + shT(t, fl) + " × " + shT(t, fl) + " = " + shT(qMul(t, t), fl) + ",所以 □ = " + shT(t, fl) + "。" };
    }),
    mk("word", 3, "basic", function () {
      const P = twoPairs(), h = 3, X = hidden(P, h), a = qa(X, fa(hfl(P, h)));
      return { stem: "調一種顏料,紅色 " + P.t1.sa + " 公升要配藍色 " + P.t1.sb + " 公升。如果紅色用了 " + P.t2.sa + " 公升,藍色要配 □ 公升才會一樣濃?可以列成" + eqStr(P, h) + "。", answer: a.answer, accepted: a.accepted, units: ["公升"],
        explain: exBox(P, h) + "\n答:藍色要配 " + shT(X, fa(hfl(P, h))) + " 公升。" };
    }),
    mk("word", 5, "extend", function () {
      const p = coprime(1, 7), m = p[0], n = p[1], u = int(2, 12), s = pick([Q(1), Q(1, 2), Q(1, 10), Q(5), Q(3, 2)]);
      const X = qMul(Q(m * u), s), Y = qMul(Q(n * u), s), S2 = qAdd(X, Y);
      if (!(decOK(X) && decOK(Y) && decOK(S2))) throw new Error("重抽");
      const a = qa(X, "dec");
      return { stem: "甲、乙兩人合買禮物共花 " + dsh(S2) + " 元,甲出的錢是 □ 元,乙出的錢是 △ 元,□:△ = " + m + ":" + n + "。可以列成「□ + △ = " + dsh(S2) + "」,甲出了 □ 是多少元?", answer: a.answer, accepted: a.accepted, units: ["元"],
        explain: "□:△ = " + m + ":" + n + ",總共 " + (m + n) + " 份,1 份 = " + dsh(S2) + " ÷ " + (m + n) + " = " + dsh(qMul(Q(u), s)) + " 元。\n□ 是 " + m + " 份,□ = " + m + " × " + dsh(qMul(Q(u), s)) + " = " + dsh(X) + " 元(△ = " + dsh(Y) + " 元)。" };
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
  function dq(q) { return decOK(q) ? K.qDec(q) : K.qMixed(q); }
  /* 依題幹用的寫法顯示數字：有小數點就用小數，有帶分數就用帶分數，否則用分數 */
  function dispFor(ctx) { const dec = /\d\.\d/.test(ctx), mixed = /\d \d+\/\d+/.test(ctx); return function (q) { return dec && decOK(q) ? K.qDec(q) : K.qMixed(q); }; }
  function ratioOf(s) { const p = String(s).split(":"); return [pq(p[0]), pq(p[1])]; }
  /* 比值法：先算比值 前項 ÷ 後項，寫成最簡分數 m/n，前項 m、後項 n */
  function valueAlt(a, b, fin, ctx) {
    const d = dispFor(ctx), v = qDiv(a, b);
    const k = qDiv(a, Q(v.n));
    if (String(fin) !== v.n + ":" + v.d) throw new Error("explain2 與答案不一致:" + fin);
    return "把兩項相除:" + d(a) + " ÷ " + d(b) + " = " + d(v) + (v.d === 1 ? " = " + v.n + "/1" : "") + "。" + "\n" + "分數 " + v.n + "/" + v.d + " 的分子當前項、分母當後項,寫成 " + v.n + ":" + v.d + "。" + "\n" + "倒過來檢查:" + v.n + ":" + v.d + " 的前後項同乘 " + dq(k) + ",就得到 " + d(a) + ":" + d(b) + "。" + "\n" + "答案是 " + fin + "。";
  }
  /* 令乙 = 1 的連比算法 */
  function chain3(t1, t2) {
    const u = qDiv(t1[0], t1[1]), w = qDiv(t2[1], t2[0]), L = lcm(u.d, w.d);
    let x = u.n * (L / u.d), y = L, z = w.n * (L / w.d); const g = gcd(gcd(x, y), z); x /= g; y /= g; z /= g;
    return { u: u, w: w, L: L, x: x, y: y, z: z };
  }
  function stmtParts(r) { return r.stem.match(/「[^」]*」/g) || []; }
  function boxEq(r) { const m = r.stem.match(/「([^」]*□[^」]*)」/); if (m) return m[1]; return r.stem.replace(/^解比例:/, "").replace(/,求 □。$/, ""); }
  /* 內項乘積 = 外項乘積：A:B = C:D → A × D = B × C */
  function crossAlt(eq, fin) {
    const sides = eq.split(" = "), L = sides[0].split(":"), R = sides[1].split(":"), s = [L[0], L[1], R[0], R[1]], h = s.indexOf("□"), d = dispFor(eq);
    const v = s.map(function (x) { return x === "□" ? null : pq(x); });
    let known, other, text;
    if (h === 0) { known = qMul(v[1], v[2]); other = v[3]; text = "□ × " + s[3] + " = " + s[1] + " × " + s[2]; }
    else if (h === 1) { known = qMul(v[0], v[3]); other = v[2]; text = s[0] + " × " + s[3] + " = □ × " + s[2]; }
    else if (h === 2) { known = qMul(v[0], v[3]); other = v[1]; text = s[0] + " × " + s[3] + " = " + s[1] + " × □"; }
    else { known = qMul(v[1], v[2]); other = v[0]; text = s[0] + " × □ = " + s[1] + " × " + s[2]; }
    ck(qDiv(known, other), fin);
    return "外項乘積 = 內項乘積:" + text + "。\n已知的那邊 = " + d(known) + ",所以 □ = " + d(known) + " ÷ " + d(other) + " = " + fin + "。";
  }
  /* 比值法：先算完整那一組比的比值，含 □ 的那一組比值要一樣 */
  function valBox(eq, fin) {
    const sides = eq.split(" = "), Lh = sides[0].split(":"), Rh = sides[1].split(":"), s4 = [Lh[0], Lh[1], Rh[0], Rh[1]], h = s4.indexOf("□"), v = s4.map(function (x) { return x === "□" ? null : pq(x); }), d = dispFor(eq);
    const comp = h < 2 ? [v[2], v[3]] : [v[0], v[1]], compS = h < 2 ? s4[2] + ":" + s4[3] : s4[0] + ":" + s4[1], val = qDiv(comp[0], comp[1]);
    let X, tail;
    if (h % 2 === 0) { const second = h < 2 ? v[1] : v[3]; X = qMul(second, val); tail = "含 □ 的這一組,前項 ÷ 後項 也是 " + d(val) + ",即 □ ÷ " + d(second) + " = " + d(val) + "。\n所以 □ = " + d(second) + " × " + d(val) + " = " + d(X) + "。"; }
    else { const first = h < 2 ? v[0] : v[2]; X = qDiv(first, val); tail = "含 □ 的這一組,前項 ÷ 後項 也是 " + d(val) + ",即 " + d(first) + " ÷ □ = " + d(val) + "。\n所以 □ = " + d(first) + " ÷ " + d(val) + " = " + d(X) + "。"; }
    ck(X, fin);
    return "比例式左右兩邊的比值一定相等,所以可以用比值來求 □。先算完整的那一組 " + compS + " 的比值:" + d(comp[0]) + " ÷ " + d(comp[1]) + " = " + d(val) + "。\n" + tail;
  }
  function boxVal(eq) { // 求 □ 的值（Q）
    const sides = eq.split(" = "), L = sides[0].split(":"), R = sides[1].split(":"), s = [L[0], L[1], R[0], R[1]], h = s.indexOf("□"), v = s.map(function (x) { return x === "□" ? null : pq(x); });
    if (h === 0) return qDiv(qMul(v[1], v[2]), v[3]); if (h === 1) return qDiv(qMul(v[0], v[3]), v[2]); if (h === 2) return qDiv(qMul(v[0], v[3]), v[1]); return qDiv(qMul(v[1], v[2]), v[0]);
  }
  function shareStmt(s, ctx) { return s; }

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
    "ratio-single-L1-01": function (r) { const t = tk(r.stem); return valueAlt(t[0], t[1], r.options[r.answer], r.stem); },
    "ratio-single-L3-03": function (r) { const t = tk(r.stem); return valueAlt(t[0], t[1], r.options[r.answer], r.stem); },
    "ratio-single-L2-02": function (r) { const t = tk(r.stem), v = qDiv(t[0], t[1]); ck(v, r.options[r.answer]); return "前後項同除以公因數,得 " + v.n + ":" + v.d + "。\n再算 " + v.n + " ÷ " + v.d + " = " + r.options[r.answer] + ",這個商就是比值。選 " + r.options[r.answer] + "。"; },
    "ratio-single-L4-04": function (r) {
      const t = tk(r.stem), c = chain3([t[0], t[1]], [t[2], t[3]]), rx = c.u.n * (c.L / c.u.d), rz = c.w.n * (c.L / c.w.d), final = c.x + ":" + c.y + ":" + c.z;
      if (final !== r.options[r.answer]) throw new Error("explain2 與答案不一致:" + final);
      return "令乙 = 1:甲 = 甲:乙 的比值 = " + K.qMixed(c.u) + ",丙 = 乙 × (乙:丙 的後項 ÷ 前項) = " + K.qMixed(c.w) + "。\n甲:乙:丙 = " + K.qMixed(c.u) + ":1:" + K.qMixed(c.w) + ",同乘 " + c.L + " 得 " + rx + ":" + c.L + ":" + rz + (rx + ":" + c.L + ":" + rz === final ? "(已最簡)" : ",約成 " + final) + "。\n答案是 " + r.options[r.answer] + "。";
    },
    "ratio-single-L5-05": function (r) {
      const t = tk(r.stem), a = t[0], b = t[1], c = t[2], dd = t[3], d = dispFor(r.stem), all = qAdd(qAdd(a, b), c), share = qDiv(qSub(b, a), all), tot = qDiv(dd, share);
      ck(tot, r.options[r.answer]);
      return "乙比甲多的部分占全部的幾分之幾?多 " + d(qSub(b, a)) + " 份、全部 " + d(all) + " 份,所以占 " + K.qMixed(share) + "。\n這個部分是 " + d(dd) + " 元,全部 = " + d(dd) + " ÷ " + K.qMixed(share) + " = " + d(tot) + " 元。\n答案是 " + r.options[r.answer] + "。";
    },
    "ratio-single-L1-06": function (r) { return valBox(boxEq(r), r.options[r.answer]) + "\n所以選 " + r.options[r.answer] + "。"; },
    "ratio-single-L3-07": function (r) { return valBox(boxEq(r), r.options[r.answer]) + "\n所以選 " + r.options[r.answer] + "。"; },
    "ratio-multi-L2-01": function (r) { const b = ratioOf(r.stem.match(/和 (.+?) 相等/)[1]), v = qDiv(b[0], b[1]), flags = [], wh = r.options.map(function (o) { const p = ratioOf(o), w = qDiv(p[0], p[1]); flags.push(qCmp(w, v) === 0); return "比值 " + dq(w) + (qCmp(w, v) === 0 ? ",和 " + dq(v) + " 相同" : ",和 " + dq(v) + " 不同"); }); ckMulti(r, flags); return "比值相同的比才相等。題目的比值是 " + dq(v) + ":\n" + rows(r, flags, wh) + "。\n所以相等的是第 " + pickIdx(r) + " 個。"; },
    "ratio-multi-L3-02": function (r) { const P = tk(r.stem)[0], flags = [], wh = r.options.map(function (o) { const p = ratioOf(o), w = qDiv(p[0], p[1]); flags.push(qCmp(w, P) === 0); return "比值 " + dq(w) + (qCmp(w, P) === 0 ? ",等於 " + dq(P) : ",不等於 " + dq(P)); }); ckMulti(r, flags); return "要比值是 " + dq(P) + ",逐一算出每個比的比值:\n" + rows(r, flags, wh) + "。\n所以選第 " + pickIdx(r) + " 個。"; },
    "ratio-multi-L3-03": function (r) {
      const flags = [], wh = r.options.map(function (o) {
        let m, ok, why;
        if (o === "比的前項和後項同時乘以(或除以)同一個不是 0 的數,比值不變") { ok = true; why = "例:2:3 同乘 4 得 8:12,比值都是 2/3"; }
        else if (o === "比的前項和後項同時加上同一個數,比值不變") { ok = false; why = "例:2:3 同加 1 得 3:4,2/3 不等於 3/4"; }
        else if ((m = o.match(/^若 (.+) 與 (.+) 是相等的比,則外項/))) { const x = ratioOf(m[1]), y = ratioOf(m[2]); ok = qCmp(qMul(x[0], y[1]), qMul(x[1], y[0])) === 0; why = "外項積 " + dq(qMul(x[0], y[1])) + ",內項積 " + dq(qMul(x[1], y[0])); }
        else if ((m = o.match(/^(.+) 與 (.+) 是相等的比$/))) { const x = ratioOf(m[1]), y = ratioOf(m[2]), e = qCmp(qDiv(x[0], x[1]), qDiv(y[0], y[1])) === 0; ok = e; why = "比值 " + dq(qDiv(x[0], x[1])) + (e ? " 和 " : " 與 ") + dq(qDiv(y[0], y[1])) + (e ? " 一樣" : " 不一樣"); }
        else if ((m = o.match(/^(.+) 的比值是 (.+)$/))) { const x = ratioOf(m[1]), v = qDiv(x[0], x[1]); ok = qCmp(v, pq(m[2])) === 0; why = "實際比值是 " + dq(v); }
        else if ((m = o.match(/^在比例 (.+) 等於 (.+) 中/))) { const x = ratioOf(m[1]), y = ratioOf(m[2]); ok = qCmp(qMul(x[0], y[1]), qMul(x[1], y[0])) === 0; why = "外項積 " + dq(qMul(x[0], y[1])) + ",內項積 " + dq(qMul(x[1], y[0])); }
        else throw new Error("explain2 找不到對應的敘述:" + o);
        flags.push(ok); return why;
      });
      ckMulti(r, flags);
      return "舉例或計算每一句:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。";
    },
    "ratio-multi-L4-04": function (r) {
      const t = tk(r.stem), v = qDiv(t[0], t[1]), m = v.n, n = v.d, flags = [];
      const wh = r.options.map(function (o) {
        let k, ok, why;
        if ((k = o.match(/^甲是乙的 (.+) 倍$/))) { ok = qCmp(pq(k[1]), Q(m, n)) === 0; why = "甲 " + m + " 份 ÷ 乙 " + n + " 份 = " + K.qMixed(Q(m, n)); }
        else if ((k = o.match(/^乙是甲的 (.+) 倍$/))) { ok = qCmp(pq(k[1]), Q(n, m)) === 0; why = "乙 " + n + " 份 ÷ 甲 " + m + " 份 = " + K.qMixed(Q(n, m)); }
        else if ((k = o.match(/^甲占兩人總和的 (.+)$/))) { ok = qCmp(pq(k[1]), Q(m, m + n)) === 0; why = "甲 " + m + " 份 ÷ 總共 " + (m + n) + " 份 = " + K.qMixed(Q(m, m + n)); }
        else if ((k = o.match(/^乙占兩人總和的 (.+)$/))) { ok = qCmp(pq(k[1]), Q(n, m + n)) === 0; why = "乙 " + n + " 份 ÷ 總共 " + (m + n) + " 份 = " + K.qMixed(Q(n, m + n)); }
        else if ((k = o.match(/^乙比甲多的部分,是甲的 (.+) 倍$/))) { ok = qCmp(pq(k[1]), Q(n - m, m)) === 0; why = "多的 " + (n - m) + " 份 ÷ 甲 " + m + " 份 = " + K.qMixed(Q(n - m, m)); }
        else throw new Error("explain2 找不到對應的敘述:" + o);
        flags.push(ok); return why;
      });
      ckMulti(r, flags);
      return "先把甲看成 " + m + " 份、乙看成 " + n + " 份,逐句算算看:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。";
    },
    "ratio-multi-L5-05": function (r) {
      const t = tk(r.stem), N = t[0], a = t[1], b = t[2], c = t[3], all = qAdd(qAdd(a, b), c), d = dispFor(r.stem), flags = [];
      const sh = { 甲: qMul(N, qDiv(a, all)), 乙: qMul(N, qDiv(b, all)), 丙: qMul(N, qDiv(c, all)) };
      const wh = r.options.map(function (o) {
        let m, ok, why;
        if ((m = o.match(/^(甲|乙|丙)分得 (.+) 元$/))) { ok = qCmp(sh[m[1]], pq(m[2])) === 0; why = m[1] + "實際分得 " + d(sh[m[1]]) + " 元"; }
        else if ((m = o.match(/^(甲|乙|丙)比(甲|乙|丙)(多|少)分得 (.+) 元$/))) { const df = m[3] === "多" ? qSub(sh[m[1]], sh[m[2]]) : qSub(sh[m[2]], sh[m[1]]); ok = qCmp(df, pq(m[4])) === 0; why = "實際相差 " + d(df) + " 元"; }
        else throw new Error("explain2 找不到對應的敘述:" + o);
        flags.push(ok); return why;
      });
      ckMulti(r, flags);
      return "用分數想:甲占 " + K.qMixed(qDiv(a, all)) + "、乙占 " + K.qMixed(qDiv(b, all)) + "、丙占 " + K.qMixed(qDiv(c, all)) + "。\n甲 = " + d(sh["甲"]) + " 元,乙 = " + d(sh["乙"]) + " 元,丙 = " + d(sh["丙"]) + " 元。\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。";
    },
    "ratio-tf-L1-01": function (r) { const m = r.stem.match(/^(.+) 的比值是 (.+)。$/), p = ratioOf(m[1]), v = qDiv(p[0], p[1]); ckTf(r, qCmp(v, pq(m[2])) === 0); return "前後項同除以公因數,得 " + v.n + ":" + v.d + ",再算 " + v.n + " ÷ " + v.d + " = " + dq(v) + ",這個商才是比值" + (qCmp(v, pq(m[2])) === 0 ? ",和 " + m[2] + " 一樣。" : ",不是 " + m[2] + "。") + verdict(r); },
    "ratio-tf-L2-02": function (r) { const m = r.stem.match(/^(.+) 與 (.+) 是相等的比。$/), x = ratioOf(m[1]), y = ratioOf(m[2]), d = dispFor(r.stem), p1 = qMul(x[0], y[1]), p2 = qMul(x[1], y[0]); ckTf(r, qCmp(p1, p2) === 0); return "交叉相乘檢查(每個比的前項乘對方的後項),兩個乘積一樣大,這兩個比才相等:" + m[1].split(":")[0] + " × " + m[2].split(":")[1] + " = " + d(p1) + ",\n" + m[1].split(":")[1] + " × " + m[2].split(":")[0] + " = " + d(p2) + (qCmp(p1, p2) === 0 ? ",兩個乘積相等。" : ",兩個乘積不相等。") + verdict(r); },
    "ratio-tf-L3-03": function (r) { const t = tk(r.stem), a = t[0], b = t[1], x = t[2], y = t[3], p1 = qMul(b, y), p2 = qMul(a, x); ckTf(r, qCmp(p1, p2) === 0); return "題目要的是 乙:甲 = " + dq(b) + ":" + dq(a) + "。代入敘述的 " + dq(x) + ":" + dq(y) + ",交叉相乘檢查:" + dq(b) + " × " + dq(y) + " = " + dq(p1) + ",\n" + dq(a) + " × " + dq(x) + " = " + dq(p2) + (qCmp(p1, p2) === 0 ? ",相等。" : ",不相等。") + verdict(r); },
    "ratio-tf-L4-04": function (r) { const t = tk(r.stem), N = t[0], a = t[1], b = t[2], x = t[3], my = qMul(N, qDiv(a, qAdd(a, b))); ckTf(r, qCmp(my, x) === 0); return "用分數想:甲占全部的 " + K.qMixed(qDiv(a, qAdd(a, b))) + ",甲分得 " + dq(N) + " × " + K.qMixed(qDiv(a, qAdd(a, b))) + " = " + dq(my) + " 元" + (qCmp(my, x) === 0 ? ",和敘述的 " + dq(x) + " 一樣。" : ",不是 " + dq(x) + "。") + verdict(r); },
    "ratio-tf-L5-05": function (r) { const t = tk(r.stem), c = chain3([t[0], t[1]], [t[2], t[3]]), claim = r.stem.match(/= ([^,。]+)。$/)[1], mine = c.x + ":" + c.y + ":" + c.z; ckTf(r, claim === mine); return "令乙 = 1:甲 = " + K.qMixed(c.u) + ",丙 = " + K.qMixed(c.w) + ",同乘 " + c.L + " 得 甲:乙:丙 = " + mine + "。\n敘述寫的是 " + claim + (claim === mine ? ",和算出來的一樣。" : ",和算出來的不一樣。") + verdict(r); },
    "ratio-tf-L2-06": function (r) {
      const eq = boxEq(r), s = eq.split(" = ").join(":").split(":"), x = r.stem.match(/所以 □ = (.+)。$/)[1], v = s.map(function (z) { return z === "□" ? pq(x) : pq(z); }), p1 = qMul(v[0], v[3]), p2 = qMul(v[1], v[2]), d = dispFor(eq);
      ckTf(r, qCmp(p1, p2) === 0);
      return "代入檢查:把 □ 換成 " + x + ",外項乘積 " + d(p1) + ",內項乘積 " + d(p2) + (qCmp(p1, p2) === 0 ? ",兩個相等,比例成立。" : ",兩個不相等,比例不成立。") + verdict(r);
    },
    "ratio-fill-L1-01": function (r) { const t = tk(r.stem), v = qDiv(t[0], t[1]); ck(v, r.answer); return "前後項同除以公因數,得 " + v.n + ":" + v.d + "。\n再算 " + v.n + " ÷ " + v.d + " = " + r.answer + ",這個商就是比值。"; },
    "ratio-fill-L2-02": function (r) { const t = tk(r.stem); return valueAlt(t[0], t[1], r.answer, r.stem); },
    "ratio-fill-L3-03": function (r) { const t = tk(r.stem), A = t[0], B = t[1], C = t[2], k = qDiv(C, A), d = dispFor(r.stem); ck(qMul(B, k), r.answer); return "看前項變成幾倍:" + d(C) + " ÷ " + d(A) + " = " + d(k) + " 倍。\n後項也要變成 " + d(k) + " 倍:" + d(B) + " × " + d(k) + " = " + d(qMul(B, k)) + "。答案是 " + r.answer + "。"; },
    "ratio-fill-L4-04": function (r) { const t = tk(r.stem); return valueAlt(t[0], t[1], r.answer, r.stem); },
    "ratio-fill-L5-05": function (r) {
      const t = tk(r.stem), c = chain3([t[0], t[1]], [t[2], t[3]]), Z = t[4], d = dispFor(r.stem), u1 = qDiv(t[0], t[1]), w1 = qDiv(t[2], t[3]), rx = c.u.n * (c.L / c.u.d), rz = c.w.n * (c.L / c.w.d);
      ck(qMul(Z, Q(c.x, c.z)), r.answer);
      return "先把兩個比各自化簡:甲:乙 = " + u1.n + ":" + u1.d + ",乙:丙 = " + w1.n + ":" + w1.d + "。\n令乙 = 1:甲 = " + K.qMixed(c.u) + ",丙 = " + K.qMixed(c.w) + ",同乘 " + c.L + " 得 甲:乙:丙 = " + rx + ":" + c.L + ":" + rz + (rx + ":" + c.L + ":" + rz === c.x + ":" + c.y + ":" + c.z ? "(已最簡)" : ",約成 " + c.x + ":" + c.y + ":" + c.z) + "。\n所以甲是丙的 " + c.x + "/" + c.z + ",甲 = " + d(Z) + " × " + c.x + "/" + c.z + " = " + r.answer + "。";
    },
    "ratio-fill-L3-06": function (r) { return valBox(boxEq(r), r.answer); },
    "ratio-fill-L4-07": function (r) { return valBox(boxEq(r), r.answer); },
    "ratio-calc-L1-01": function (r) { const t = tk(r.stem), v = qDiv(t[0], t[1]); ck(v, r.answer); return "前後項同除以公因數,得 " + v.n + ":" + v.d + "。\n再算 " + v.n + " ÷ " + v.d + " = " + r.answer + ",這個商就是比值。"; },
    "ratio-calc-L2-02": function (r) { const t = tk(r.stem); return valueAlt(t[0], t[1], r.answer, r.stem); },
    "ratio-calc-L3-03": function (r) { return valBox(boxEq(r), r.answer); },
    "ratio-calc-L4-04": function (r) { const t = tk(r.stem), N = t[0], a = t[1], b = t[2], all = qAdd(a, b), d = dispFor(r.stem), my = qMul(N, qDiv(a, all)), you = qMul(N, qDiv(b, all)); ck(qSub(you, my), r.answer); return "用分數想:甲占 " + K.qMixed(qDiv(a, all)) + ",乙占 " + K.qMixed(qDiv(b, all)) + "。\n甲 = " + d(my) + " 元,乙 = " + d(you) + " 元,乙比甲多 " + d(you) + " - " + d(my) + " = " + r.answer + " 元。"; },
    "ratio-calc-L5-05": function (r) { const t = tk(r.stem), a = t[0], b = t[1], c = t[2], S = t[3], d = dispFor(r.stem); ck(qDiv(qMul(S, c), qAdd(a, b)), r.answer); return "丙和(甲 + 乙)的比是 " + d(c) + ":" + d(qAdd(a, b)) + "。\n丙 ÷ " + d(S) + " = " + d(c) + " ÷ " + d(qAdd(a, b)) + ",所以丙 = " + d(S) + " × " + d(c) + " ÷ " + d(qAdd(a, b)) + " = " + r.answer + "。"; },
    "ratio-calc-L2-06": function (r) { return valBox(boxEq(r), r.answer); },
    "ratio-calc-L5-07": function (r) {
      const t = tk(r.stem), A0 = t[0], C0 = t[1], x = pq(r.answer), q = qDiv(C0, A0), kn = Math.round(Math.sqrt(q.n)), kd = Math.round(Math.sqrt(q.d)), d = dispFor(r.stem);
      if (kn * kn !== q.n || kd * kd !== q.d) throw new Error("explain2 與答案不一致");
      const m = Q(kn, kd); ckEq(qMul(A0, m), x);
      return "兩個比相等,表示每一步都乘同一個倍數(先叫它 ○):" + d(A0) + " 乘 ○ 得 □,□ 再乘 ○ 得 " + d(C0) + "。\n所以 " + d(C0) + " 是 " + d(A0) + " 的「○ × ○」倍:" + d(C0) + " ÷ " + d(A0) + " = " + d(q) + "。\n" + (kd === 1 ? d(q) + " = " + kn + " × " + kn + ",所以 ○ = " + kn : d(q) + " = (" + kn + " × " + kn + ") ÷ (" + kd + " × " + kd + "),所以 ○ = " + kn + "/" + kd) + "。\n□ = " + d(A0) + " × " + d(m) + " = " + r.answer + "。";
    },
    "ratio-word-L2-01": function (r) { const t = tk(r.stem); return valueAlt(t[0], t[1], r.answer, r.stem); },
    "ratio-word-L3-02": function (r) { const t = tk(r.stem), N = t[0], a = t[1], b = t[2], d = dispFor(r.stem); ck(qMul(N, qDiv(b, qAdd(a, b))), r.answer); return "用分數想:妹妹占全部的 " + b.n + "/" + (a.n + b.n) + "。\n" + d(N) + " × " + b.n + "/" + (a.n + b.n) + " = " + r.answer + unitOf(r) + "。"; },
    "ratio-word-L4-03": function (r) { const t = tk(r.stem), a = t[0], b = t[1], M = t[2], d = dispFor(r.stem); ck(qDiv(qMul(M, qAdd(a, b)), a), r.answer); return "紅色占全長的 " + a.n + "/" + (a.n + b.n) + "。\n全長 = " + d(M) + " ÷ " + a.n + "/" + (a.n + b.n) + " = " + d(M) + " × " + (a.n + b.n) + "/" + a.n + " = " + r.answer + unitOf(r) + "。"; },
    "ratio-word-L4-04": function (r) {
      const t = tk(r.stem), a = t[0], b = t[1], X = t[2], Y = t[3], tot = qAdd(a, b), d = dispFor(r.stem), fromX = qMul(X, qDiv(tot, a)), fromY = qMul(Y, qDiv(tot, b));
      ck(qCmp(fromX, fromY) < 0 ? fromX : fromY, r.answer);
      return "分別看兩種材料最多能調多少:\n紅茶 " + d(X) + " 毫升占飲料的 " + a.n + "/" + tot.n + ",最多 " + d(fromX) + " 毫升;\n牛奶 " + d(Y) + " 毫升占飲料的 " + b.n + "/" + tot.n + ",最多 " + d(fromY) + " 毫升。\n兩個都要夠,取小的:" + r.answer + unitOf(r) + "。";
    },
    "ratio-word-L5-05": function (r) {
      const t = tk(r.stem), a = t[0], b = t[1], k = t[2], c = t[3], dd = t[4], d = dispFor(r.stem);
      const same = qCmp(b, a) > 0 ? qSub(b, a) : qSub(a, b), newShare = qCmp(dd, c) > 0 ? qSub(dd, c) : qSub(c, dd), perNew = qDiv(same, newShare), jiaLeft = qMul(c, perNew), kShare = qSub(a, jiaLeft), one = qDiv(k, kShare);
      ck(qMul(a, one), r.answer);
      return "兩人花掉一樣多的錢,差不變。原來差 " + d(same) + " 份,後來差 " + d(newShare) + " 份,所以後來 1 份 = 原來的 " + d(perNew) + " 份。\n甲後來有 " + d(c) + " × " + d(perNew) + " = " + d(jiaLeft) + " 份,花掉 " + d(k) + " 元就是 " + d(a) + " - " + d(jiaLeft) + " = " + d(kShare) + " 份,1 份 = " + d(one) + " 元。\n甲原來 " + d(a) + " × " + d(one) + " = " + r.answer + unitOf(r) + "。";
    },
    "ratio-word-L3-06": function (r) { return valBox(boxEq(r), r.answer) + "\n所以藍色要配 " + r.answer + unitOf(r) + "。"; },
    "ratio-word-L5-07": function (r) { const S = tk(r.stem)[0], m = r.stem.match(/□:△ = (\d+):(\d+)/), a = Number(m[1]), b = Number(m[2]), d = dispFor(r.stem); ck(qMul(S, Q(a, a + b)), r.answer); return "用分數想:□ 占全部的 " + a + "/" + (a + b) + "。\n□ = " + d(S) + " × " + a + "/" + (a + b) + " = " + r.answer + unitOf(r) + "。"; }
  };


  /* PRE（解法一的方法說明） */
PRE["ratio-single-L5-05"] = function () { return "方法:前項、後項同乘或同除一個不是 0 的數,比不會改變。\n"; };
PRE["ratio-tf-L1-01"] = function () { return "方法:前項、後項同乘或同除一個不是 0 的數,比不會改變。\n"; };
PRE["ratio-fill-L1-01"] = function () { return "方法:前項、後項同乘或同除一個不是 0 的數,比不會改變。\n"; };
PRE["ratio-single-L1-06"] = function () { return "方法:比例式的左右兩邊比值相同,先找出已知的那一組比,再看含 □ 的那一組是它的幾倍。\n"; };
PRE["ratio-fill-L3-06"] = function () { return "方法:比例式的左右兩邊比值相同,先找出已知的那一組比,再看含 □ 的那一組是它的幾倍。\n"; };
PRE["ratio-word-L3-06"] = function () { return "方法:比例式的左右兩邊比值相同,先找出已知的那一組比,再看含 □ 的那一組是它的幾倍。\n"; };
PRE["ratio-calc-L1-01"] = function () { return "想法:比的前項除以後項,得到的數就是比值。\n"; };
PRE["ratio-calc-L3-03"] = function () { return "想法:比例式左右兩邊的比值相同,先找出已知的那一組比。\n"; };
PRE["ratio-multi-L4-04"] = function () { return "想法:把甲、乙各看成幾份,倍數和占總和的幾分之幾都從份數來。\n"; };
PRE["ratio-single-L2-02"] = function () { return "想法:比值就是前項除以後項。" + String.fromCharCode(10); };
PRE["ratio-multi-L3-03"] = function () { return "想法:比的前後項要「同乘、同除」才不變。" + String.fromCharCode(10); };
PRE["ratio-fill-L5-05"] = function () { return "想法:先把甲、乙、丙連成一個比,再看甲和丙的關係。" + String.fromCharCode(10); };
PRE["ratio-tf-L2-02"] = function () { return "想法:兩個比相不相等,要看前後項是不是同乘(或同除)同一個數,不能用同加或同減。" + String.fromCharCode(10); };
PRE["ratio-fill-L5-05"] = function () { return "想法:甲和丙都跟乙有關,先把乙的份數統一,再比較甲和丙。" + String.fromCharCode(10); };
PRE["ratio-word-L3-06"] = function () { return "想法:顏料的紅色和藍色要照同樣的比調,比例式的左右兩邊比值一樣。" + String.fromCharCode(10) + "先把題目裡寫好的那一組比,看成幾份對幾份。" + String.fromCharCode(10); };
  ExamBank.register(T, "ratio-basic", single.concat(multi, tf, fill, calc, word, boxes));
})();
