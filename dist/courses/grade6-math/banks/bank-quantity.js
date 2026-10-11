/* 題庫：quantity 基準量、比較量、倍數關係、百分率、折扣、反求基準量（對應舊單元 上5）
   題庫工 A 自編。「打 N 折」= 原價的 N0%（例：8 折＝80%，85 折＝85%）。
   數字風格：量（公斤、公升、元…）可以是整數／小數／分數／帶分數；做法是先用整數設計題目，再乘上縮放量，
   百分率不變、所有量同比例縮放，全部用 kit.Q 精確運算（規格第 11 節）。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, shuffle = K.shuffle, gcd = K.gcd;
  const Q = K.Q, qAdd = K.qAdd, qSub = K.qSub, qMul = K.qMul, qDiv = K.qDiv, qCmp = K.qCmp, qFrac = K.qFrac;
  const T = "quantity";
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
  function pc(x) { return K.num(x) + "%"; }
  const PCT = ["%", "％"];
  const DP = [60, 70, 75, 80, 85, 90];
  function zhe(dp) { return K.num(dp / 10); }
  function decOK(q) { if (!K.qIsTerminating(q)) return false; const s = K.qDec(q); return s !== null && Math.abs(Number(s) - q.n / q.d) < 1e-12; }
  function places(q) { const s = K.qDec(q); const i = s === null ? -1 : s.indexOf("."); return i < 0 ? 0 : s.length - i - 1; }
  function ok2(q) { return decOK(q) && places(q) <= 2; }
  function dsh(q) { return decOK(q) ? K.qDec(q) : K.qMixed(q); }
  function shT(q, fl) { return fl === "dec" ? dsh(q) : (fl === "mixed" || fl === "frac") ? K.qMixed(q) : qFrac(q); }
  function qa(q, fl) { const o = K.qAnswer(q, (fl === "int" || fl === "frac") ? "mixed" : fl); const v = q.n / q.d; o.accepted = o.accepted.filter(function (x) { return !/^\d+\.\d+$/.test(x) || Math.abs(Number(x) - v) < 1e-12; }); return o; }
  const FLQ = ["int", "dec", "frac", "mixed"], FQW = [0.5, 4.5, 3.5, 3.5];
  const MONEY = ["int", "dec"], MW = [0.5, 5.5];
  function scaleOf(fl) {
    if (fl === "int") return Q(pick([1, 1, 2, 3, 5]));
    if (fl === "dec") return pick([Q(1, 8), Q(3, 8), Q(1, 16), Q(3, 40), Q(1, 8), Q(3, 8), Q(1, 2), Q(1, 4), Q(3, 2), Q(5, 2), Q(1, 5), Q(3, 10), Q(3, 4), Q(1, 10), Q(7, 10), Q(9, 10), Q(6, 5)]);
    if (fl === "frac") return pick([Q(1, 2), Q(1, 3), Q(1, 4), Q(3, 4), Q(2, 3), Q(1, 5), Q(1, 6), Q(5, 6), Q(3, 8)]);
    return pick([Q(3, 2), Q(5, 2), Q(5, 4), Q(7, 4), Q(7, 2), Q(4, 3), Q(5, 3), Q(9, 4)]);
  }
  /* 把整數量們（vals）乘上同一個縮放量，回傳風格與縮放後的有理數 */
  function sc(vals, flavors, weights) {
    for (let r = 0; r < 20; r++) {
      const fl = K.flavor(flavors, weights);
      for (let t = 0; t < 60; t++) {
        const s = scaleOf(fl);
        const qs = vals.map(function (v) { return qMul(typeof v === "number" ? Q(v) : v, s); });
        if (qs.some(function (x) { return x.n === 1 && x.d === 1; })) continue;
        if (fl === "dec" && !qs.every(ok2)) continue;
        if (fl !== "int" && qs[0].d === 1) continue;
        if (fl === "int" && !qs.every(function (x) { return x.d === 1; })) continue;
        if (qs.some(function (x) { return x.n > 999 || x.d > 99; })) continue;
        return { fl: fl, s: s, qs: qs, sh: qs.map(function (x) { return shT(x, fl); }) };
      }
    }
    throw new Error("重抽");
  }
  /* 金錢：整數或小數（最多兩位） */
  function scMoney(vals) { return sc(vals, MONEY, MW); }
  function toQ(x) { if (Number.isInteger(x)) return Q(x); for (let k = 1; k <= 4; k++) { const m = Math.pow(10, k), y = Math.round(x * m); if (Math.abs(y - x * m) < 1e-6) return Q(y, m); } throw new Error("重抽"); }
  function mv(x, s) { return qMul(toQ(x), s); }

  const single = [
    mk("single", 1, "basic", function () {
      const B = pick([20, 25, 40, 50, 80, 200]);
      let p, c; do { p = int(1, 19) * 5; c = B * p / 100; } while (!Number.isInteger(c) || p >= 100);
      const v = sc([B, c], FLQ, FQW);
      const r = S(pc(p), [pc(p / 10), pc(100 - p), pc(p * 10), pc(p + 10), pc(Math.max(5, p - 5))]);
      r.stem = "一袋米重 " + v.sh[0] + " 公斤,吃掉了 " + v.sh[1] + " 公斤。吃掉的米占全部的百分之幾?";
      r.explain = "基準量是全部的米重 " + v.sh[0] + ",比較量是吃掉的 " + v.sh[1] + "。\n百分率 = 比較量 ÷ 基準量 = " + v.sh[1] + " ÷ " + v.sh[0] + " = " + K.num(c / B) + " = " + pc(p) + "。";
      return r;
    }),
    mk("single", 2, "basic", function () {
      let B, dp, price;
      do { B = 20 * int(10, 60); dp = pick(DP); price = B * dp / 100; } while (!Number.isInteger(price));
      const v = scMoney([B, price]), s = v.s;
      const cands = [mv(B * (100 - dp) / 100, s), mv(B * dp / 10, s), qMul(Q(B * 10 - dp, 10), s), mv(B * dp / 1000, s)].filter(function (x) { return ok2(x) && qCmp(x, v.qs[1]) !== 0; }).map(dsh);
      const r = S(dsh(v.qs[1]), cands);
      r.stem = "一件外套原價 " + dsh(v.qs[0]) + " 元,打 " + zhe(dp) + " 折出售,售價是多少元?";
      r.explain = "打 " + zhe(dp) + " 折 = 原價的 " + dp + "%。\n售價 = " + dsh(v.qs[0]) + " × " + dp + "% = " + dsh(v.qs[0]) + " × " + K.num(dp / 100) + " = " + dsh(v.qs[1]) + " 元。";
      return r;
    }),
    mk("single", 3, "trap", function () {
      const p = pick([20, 25, 40, 50, 60, 75, 80]);
      let B, c; do { B = 20 * int(3, 25); c = B * p / 100; } while (!Number.isInteger(c));
      const v = sc([B, c], FLQ, FQW), s = v.s, fl = v.fl;
      const cands = [mv(c * p / 100, s), mv(c * p, s), mv(c * (100 - p) / 100, s), mv(c + p, s), mv(c * 2, s), mv(c * (100 + p) / 100, s)].filter(function (x) { return qCmp(x, v.qs[0]) !== 0 && (fl !== "dec" || ok2(x)); }).map(function (x) { return shT(x, fl); });
      const r = S(v.sh[0], cands);
      r.stem = "水壺裡的果汁已經喝掉了 " + v.sh[1] + " 公升,喝掉的占全部果汁的 " + p + "%。全部果汁有幾公升?";
      r.explain = "全部果汁是基準量(未知),喝掉的 " + v.sh[1] + " 公升是比較量。\n基準量 = 比較量 ÷ 百分率 = " + v.sh[1] + " ÷ " + p + "% = " + v.sh[1] + " ÷ " + K.num(p / 100) + " = " + v.sh[0] + " 公升。\n驗算:" + v.sh[0] + " × " + p + "% = " + v.sh[1] + "。";
      r.trapNote = "常見錯誤:看到「占 " + p + "%」就把 " + v.sh[1] + " × " + p + "%,得到 " + shT(mv(c * p / 100, s), fl) + "。" + v.sh[1] + " 是「比較量」,全部果汁才是基準量,要用除法反求。";
      return r;
    }),
    mk("single", 4, "trap", function () {
      const p = pick([10, 20, 25, 30, 40]), B = 400 * int(1, 5);
      const cur0 = B * (10000 - p * p) / 10000;
      const v = scMoney([B, cur0]), s = v.s;
      const cands = [v.qs[0], mv(B * (100 - p) / 100, s), mv(B * (100 + p) / 100, s), mv(B * (100 - 2 * p) / 100, s)].filter(function (x) { return ok2(x) && qCmp(x, v.qs[1]) !== 0; }).map(dsh);
      const r = S(dsh(v.qs[1]), cands);
      r.stem = "某商品原價 " + dsh(v.qs[0]) + " 元,先漲價 " + p + "%,後來又降價 " + p + "%,現在的價錢是多少元?";
      r.explain = "漲價後:" + dsh(v.qs[0]) + " × (1+" + p + "%) = " + dsh(mv(B * (100 + p) / 100, s)) + " 元。\n再降 " + p + "%(基準量變成漲價後的價錢):" + dsh(mv(B * (100 + p) / 100, s)) + " × (1-" + p + "%) = " + dsh(v.qs[1]) + " 元。";
      r.trapNote = "常見錯誤:認為漲 " + p + "% 再降 " + p + "% 就會回到原價 " + dsh(v.qs[0]) + " 元。兩次的基準量不同(第二次是以漲價後的價錢為基準),所以現價是 " + dsh(v.qs[1]) + " 元,比原價少。";
      return r;
    }),
    mk("single", 5, "extend", function () {
      let C, x, dp, price, profit;
      do { C = 20 * int(10, 50); x = pick([20, 25, 40, 50]); dp = pick([75, 80, 85, 90]); price = C * (100 + x) * dp / 10000; profit = price - C; } while (!Number.isInteger(price) || profit <= 0);
      const v = scMoney([C, price, profit]), s = v.s;
      const cands = [mv(C * x / 100, s), v.qs[1], mv(C * (100 - dp) / 100, s), mv(C * (100 + x) / 100 - C * dp / 100, s)].filter(function (q) { return ok2(q) && qCmp(q, v.qs[2]) !== 0; }).map(dsh);
      const r = S(dsh(v.qs[2]), cands);
      r.stem = "百貨店進貨價每件 " + dsh(v.qs[0]) + " 元,定價比進貨價多 " + x + "%,後來打 " + zhe(dp) + " 折出售。賣出一件賺多少元?";
      r.explain = "定價 = " + dsh(v.qs[0]) + " × (1+" + x + "%) = " + dsh(mv(C * (100 + x) / 100, s)) + " 元。\n打 " + zhe(dp) + " 折的售價 = " + dsh(mv(C * (100 + x) / 100, s)) + " × " + dp + "% = " + dsh(v.qs[1]) + " 元。\n賺 " + dsh(v.qs[1]) + " - " + dsh(v.qs[0]) + " = " + dsh(v.qs[2]) + " 元。";
      return r;
    })
  ];

  const multi = [
    mk("multi", 2, "basic", function () {
      const B = pick([20, 25, 40, 50, 80]);
      let p, c; do { p = int(2, 18) * 5; c = B * p / 100; } while (!Number.isInteger(c) || p === 50);
      const v = sc([B, c], FLQ, FQW);
      const trues = ["基準量是全部的米重 " + v.sh[0] + " 公斤", "比較量是吃掉的米重 " + v.sh[1] + " 公斤", "吃掉的米占全部的 " + pc(p), "剩下的米占全部的 " + pc(100 - p)];
      const falses = ["基準量是吃掉的米重 " + v.sh[1] + " 公斤", "比較量是全部的米重 " + v.sh[0] + " 公斤", "吃掉的米占全部的 " + pc(p / 10), "剩下的米占全部的 " + pc(p)];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("一袋米重 " + v.sh[0] + " 公斤,吃掉了 " + v.sh[1] + " 公斤。下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "全部的米重是整體,是基準量;吃掉的是部分,是比較量。吃掉的占 " + v.sh[1] + " ÷ " + v.sh[0] + " = " + pc(p) + ",剩下的占 100% - " + pc(p) + " = " + pc(100 - p) + "。\n正確的敘述是:" + goods.join(";") + "。");
    }),
    mk("multi", 3, "basic", function () {
      const p = pick([20, 25, 50]);
      const v = sc([20 * int(3, 40)], FLQ, FQW), Bs = v.sh[0], Bq = v.qs[0];
      const ans = qMul(Bq, Q(p, 100));
      if (v.fl === "dec" && !decOK(ans)) throw new Error("重抽");
      const trues = [Bs + " × " + p + "%", Bs + " × " + K.num(p / 100), Bs + " × " + p + " ÷ 100", Bs + " ÷ " + (100 / p)];
      const falses = [Bs + " ÷ " + p + "%", Bs + " × " + p, Bs + " ÷ " + p, Bs + " + " + p + "%"];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("要求 " + Bs + " 的 " + p + "%,下列哪些算式可以求出答案?選出所有正確的。", goods, bads,
        Bs + " 的 " + p + "% = " + Bs + " × " + K.num(p / 100) + " = " + shT(ans, v.fl) + "。" + goods.join("、") + " 的結果都是 " + shT(ans, v.fl) + "。\n其他選項是用除法、或沒有把百分率換成小數(分數),結果不是 " + shT(ans, v.fl) + "。");
    }),
    mk("multi", 3, "trap", function () {
      const d1 = int(6, 9), d2 = pick([6, 7, 7.5, 8, 8.5, 9]), p = pick([10, 20, 25, 30, 12.5]);
      const trues = [
        "原價先打 " + d1 + " 折,再打 " + d2 + " 折,等於打 " + K.num(d1 * d2 / 10) + " 折",
        "基準量 = 比較量 ÷ 百分率",
        "增加 " + p + "% 後,新的量是原來的 " + (100 + p) + "%",
        "比較量有可能比基準量大"
      ];
      const falses = [
        "原價先打 " + d1 + " 折,再打 " + d2 + " 折,等於打 " + (d1 + d2 - 10) + " 折",
        "基準量 = 比較量 × 百分率",
        "百分率最大只能是 100%",
        "減少 " + p + "% 之後,再增加 " + p + "%,會回到原來的量"
      ];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "連續打折要把折數的百分率相乘:" + d1 + "折×" + d2 + "折 = " + (d1 * 10) + "% × " + (d2 * 10) + "% = " + K.num(d1 * d2) + "%,即 " + K.num(d1 * d2 / 10) + " 折。比較量 = 基準量 × 百分率,所以基準量 = 比較量 ÷ 百分率;百分率可以超過 100%;先減再加同樣的百分率,因為基準量變了,不會回到原來的量。\n正確的敘述是:" + goods.join(";") + "。",
        "常見錯誤:把連續折扣用「加減」湊成 " + (d1 + d2 - 10) + " 折;以為百分率不能超過 100%;以為先減少 " + p + "% 再增加 " + p + "% 會回到原點(基準量不同)。");
    }),
    mk("multi", 4, "trap", function () {
      const d = pick([6, 7, 8, 9]), dp = d * 10, orig = 100 * int(2, 12), P0 = orig * dp / 100;
      const v = scMoney([orig, P0]), P = dsh(v.qs[1]);
      const goods = shuffle([P + " ÷ " + dp + "%", P + " ÷ " + K.num(dp / 100), P + " × 100 ÷ " + dp]).slice(0, int(2, 3));
      const bads = shuffle([P + " × " + dp + "%", P + " ÷ (100% 減 " + dp + "%)", P + " + " + P + " × (100% 減 " + dp + "%)"]).slice(0, 2);
      return M("某商品打 " + d + " 折之後,售價是 " + P + " 元。下列哪些算式可以求出原價?選出所有正確的。", goods, bads,
        "打 " + d + " 折 = 原價的 " + dp + "%,售價 " + P + " 元是比較量,原價是基準量。\n原價 = " + P + " ÷ " + dp + "% = " + dsh(v.qs[0]) + " 元。" + goods.join("、") + " 的結果都是 " + dsh(v.qs[0]) + "。",
        "常見錯誤:用 " + P + " × " + dp + "%(乘),或用「100% - " + dp + "%」去除。打折後的價錢是原價的 " + dp + "%,所以要「除以 " + dp + "%」才能還原。");
    }),
    mk("multi", 5, "extend", function () {
      let p, q, B, r, cur;
      do { p = pick([10, 20, 30, 40]); q = pick([10, 20, 25, 30]); B = 400 * int(1, 5); r = (100 + p) * (100 - q) / 100; cur = B * r / 100; } while (!Number.isInteger(cur) || r === 100);
      const diff = Math.abs(cur - B), v = scMoney([B, cur, diff, B * (100 + p - q) / 100]), s = v.s;
      const trues = ["現價是 " + dsh(v.qs[1]) + " 元", "現價是原價的 " + pc(r), "現價比原價" + (r < 100 ? "低" : "高"), "現價和原價相差 " + dsh(v.qs[2]) + " 元"];
      const falses = ["現價是 " + dsh(v.qs[3]) + " 元", "現價和原價相同", "現價是原價的 " + pc(100 + p - q), "現價比原價" + (r < 100 ? "高" : "低")];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("某商品原價 " + dsh(v.qs[0]) + " 元,先漲價 " + p + "%,再降價 " + q + "%。下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "漲價後是原價的 " + (100 + p) + "%,再降 " + q + "% 是以漲價後為基準:(" + (100 + p) + "%) × (" + (100 - q) + "%) = " + pc(r) + "。\n現價 = " + dsh(v.qs[0]) + " × " + pc(r) + " = " + dsh(v.qs[1]) + " 元,和原價相差 " + dsh(v.qs[2]) + " 元,現價比原價" + (r < 100 ? "低" : "高") + "。\n正確的敘述是:" + goods.join(";") + "。");
    })
  ];

  const tf = [
    mk("tf", 1, "basic", function () {
      const B0 = 20 * int(2, 40), p = pick([10, 20, 25, 30, 40, 50, 60, 75]);
      const v = sc([B0], FLQ, FQW), fl = v.fl, B = v.qs[0], c = qMul(B, Q(p, 100));
      const right = Math.random() < 0.5, x = right ? c : pick([qMul(c, Q(10)), qDiv(c, Q(10))]);
      if (fl === "dec" && !decOK(x)) throw new Error("重抽");
      return { stem: v.sh[0] + " 的 " + p + "% 是 " + shT(x, fl) + "。", answer: right,
        explain: v.sh[0] + " × " + p + "% = " + v.sh[0] + " × " + K.num(p / 100) + " = " + shT(c, fl) + (right ? ",敘述正確。" : ",不是 " + shT(x, fl) + "(位數差了 10 倍)。") };
    }),
    mk("tf", 2, "trap", function () {
      const names = shuffle(["小華", "小美", "小明", "小芳"]), n1 = names[0], n2 = names[1], p = pick([20, 25, 40, 60, 75, 120, 150, 12.5, 37.5, 62.5, 87.5, 112.5]);
      const right = Math.random() < 0.5;
      return { stem: "「" + n1 + "的存款是" + n2 + "的 " + p + "%」,這句話裡的基準量是" + (right ? n2 : n1) + "的存款。", answer: right,
        explain: "在「" + n1 + "的存款是" + n2 + "的 " + p + "%」中,「的」字後面的才是基準量,前面的是比較量。這裡「" + n1 + "的存款」是比較量,「" + n2 + "的存款」是基準量。" + (right ? "敘述正確。" : "敘述把基準量說成" + n1 + ",不正確。"),
        trapNote: "易錯:誤把題目先出現的那個量當成基準量。「甲是乙的百分之幾」這類句子中,「的」後面那個量才是基準量(當作 100% 的那個)。" };
    }),
    mk("tf", 3, "trap", function () {
      const d = pick([6, 7, 8, 9, 7.5, 8.5, 6.5]), right = Math.random() < 0.5;
      return { stem: right ? "打 " + d + " 折,就是只收原價的 " + (d * 10) + "%。" : "打 " + d + " 折,就是原價減少 " + d + "%。", answer: right,
        explain: right ? "打 " + d + " 折表示賣原價的 " + d + "/10 = " + (d * 10) + "%,敘述正確。" : "打 " + d + " 折是賣原價的 " + (d * 10) + "%,也就是減少 " + (100 - d * 10) + "%,不是減少 " + d + "%。",
        trapNote: "易錯:把「折」和「%」弄混。1 折 = 10%,打 " + d + " 折是原價的 " + (d * 10) + "%,減少的是 " + (100 - d * 10) + "%。" };
    }),
    mk("tf", 4, "basic", function () {
      let B, dp, price; do { B = 20 * int(5, 50); dp = pick(DP); price = B * dp / 100; } while (!Number.isInteger(price));
      const v = scMoney([B, price]), s = v.s;
      const right = Math.random() < 0.5, x = right ? v.qs[1] : pick([mv(B * (100 - dp) / 100, s), mv(B * dp / 10, s)]);
      if (!ok2(x)) throw new Error("重抽");
      return { stem: "原價 " + dsh(v.qs[0]) + " 元的商品打 " + zhe(dp) + " 折,售價是 " + dsh(x) + " 元。", answer: right,
        explain: "售價 = " + dsh(v.qs[0]) + " × " + dp + "% = " + dsh(v.qs[1]) + " 元" + (right ? ",敘述正確。" : ",不是 " + dsh(x) + " 元。") };
    }),
    mk("tf", 5, "extend", function () {
      let p, q, B, r, cur;
      do { p = pick([10, 20, 30, 40]); q = pick([10, 20, 25, 30]); B = 400 * int(1, 5); r = (100 + p) * (100 - q) / 100; cur = B * r / 100; } while (!Number.isInteger(cur) || r === 100);
      const v = scMoney([B, cur, B * (100 + p - q) / 100, B * (100 + p) / 100]);
      const right = Math.random() < 0.5, X = right ? v.qs[1] : v.qs[2];
      return { stem: "某商品原價 " + dsh(v.qs[0]) + " 元,先漲價 " + p + "%,再降價 " + q + "%,現價是 " + dsh(X) + " 元。", answer: right,
        explain: "漲價後 " + dsh(v.qs[3]) + " 元,再降 " + q + "%:" + dsh(v.qs[3]) + " × " + (100 - q) + "% = " + dsh(v.qs[1]) + " 元" + (right ? ",敘述正確。" : ",不是 " + dsh(X) + " 元(不能直接用 " + (100 + p - q) + "% 計算)。") };
    })
  ];

  const fill = [
    mk("fill", 1, "basic", function () {
      const B = pick([20, 25, 40, 50, 80, 200]);
      let p, c; do { p = int(1, 19) * 5; c = B * p / 100; } while (!Number.isInteger(c));
      const v = sc([B, c], FLQ, FQW);
      return { stem: v.sh[0] + " 公斤的米,吃掉了 " + v.sh[1] + " 公斤。吃掉的米占全部的 ____%。", answer: String(p), accepted: [p + "%"], units: PCT,
        explain: "百分率 = 比較量 ÷ 基準量 = " + v.sh[1] + " ÷ " + v.sh[0] + " = " + K.num(c / B) + " = " + p + "%。" };
    }),
    mk("fill", 2, "basic", function () {
      const p = pick([5, 10, 15, 20, 25, 30, 40, 60, 75, 80]);
      const B0 = 20 * int(2, 40), v = sc([B0], FLQ, FQW), ans = qMul(v.qs[0], Q(p, 100));
      if (v.fl === "dec" && !decOK(ans)) throw new Error("重抽");
      const a = qa(ans, v.fl);
      return { stem: v.sh[0] + " 的 " + p + "% 是 ____。", answer: a.answer, accepted: a.accepted, explain: v.sh[0] + " × " + p + "% = " + v.sh[0] + " × " + K.num(p / 100) + " = " + shT(ans, v.fl) + "。" };
    }),
    mk("fill", 3, "basic", function () {
      let B, dp, price; do { B = 20 * int(5, 50); dp = pick(DP); price = B * dp / 100; } while (!Number.isInteger(price));
      const v = scMoney([B, price]);
      return { stem: "一雙球鞋原價 " + dsh(v.qs[0]) + " 元,打 " + zhe(dp) + " 折後賣 ____ 元。", answer: dsh(v.qs[1]), accepted: qa(v.qs[1], "dec").accepted, units: ["元"], explain: "打 " + zhe(dp) + " 折 = " + dp + "%。售價 = " + dsh(v.qs[0]) + " × " + dp + "% = " + dsh(v.qs[1]) + " 元。" };
    }),
    mk("fill", 4, "trap", function () {
      const p = pick([20, 25, 40, 50, 60, 75, 80]);
      let B, c; do { B = 20 * int(3, 30); c = B * p / 100; } while (!Number.isInteger(c));
      const v = sc([B, c], FLQ, FQW), a = qa(v.qs[0], v.fl);
      return { stem: "某數的 " + p + "% 是 " + v.sh[1] + ",某數是 ____。", answer: a.answer, accepted: a.accepted,
        explain: "某數是基準量," + v.sh[1] + " 是比較量。基準量 = " + v.sh[1] + " ÷ " + p + "% = " + v.sh[1] + " ÷ " + K.num(p / 100) + " = " + v.sh[0] + "。",
        trapNote: "常見錯誤:把 " + v.sh[1] + " × " + p + "%,得到 " + shT(qMul(v.qs[1], Q(p, 100)), v.fl) + "。已知的是「某數的 " + p + "%」的結果,要求某數,必須用除法。" };
    }),
    mk("fill", 5, "extend", function () {
      const p = pick([10, 20, 25, 30, 40, 50]);
      let B, c; do { B = 20 * int(3, 40); c = B * (100 + p) / 100; } while (!Number.isInteger(c));
      const v = sc([B, c], FLQ, FQW), a = qa(v.qs[0], v.fl);
      return { stem: "某數增加 " + p + "% 之後是 " + v.sh[1] + ",某數是 ____。", answer: a.answer, accepted: a.accepted,
        explain: "增加 " + p + "% 後是原來的 " + (100 + p) + "%。基準量 = " + v.sh[1] + " ÷ " + (100 + p) + "% = " + v.sh[1] + " ÷ " + K.num((100 + p) / 100) + " = " + v.sh[0] + "。" };
    })
  ];

  const calc = [
    mk("calc", 1, "basic", function () {
      const B = pick([20, 25, 40, 50, 80, 200]);
      let p, c; do { p = int(1, 19) * 5; c = B * p / 100; } while (!Number.isInteger(c));
      const v = sc([B, c], FLQ, FQW);
      return { stem: "求 " + v.sh[1] + " 是 " + v.sh[0] + " 的百分之幾?", answer: String(p), accepted: [p + "%"], units: PCT, explain: "列式:" + v.sh[1] + " ÷ " + v.sh[0] + " = " + K.num(c / B) + " = " + p + "%。" };
    }),
    mk("calc", 2, "basic", function () {
      const p = pick([15, 35, 45, 12, 24, 36, 65, 85]), B0 = 10 * int(5, 80), v = sc([B0], FLQ, FQW), ans = qMul(v.qs[0], Q(p, 100));
      if (v.fl === "dec" && !decOK(ans)) throw new Error("重抽");
      const a = qa(ans, v.fl);
      return { stem: "求 " + v.sh[0] + " 的 " + p + "% 是多少?", answer: a.answer, accepted: a.accepted, explain: "列式:" + v.sh[0] + " × " + p + "% = " + v.sh[0] + " × " + K.num(p / 100) + " = " + shT(ans, v.fl) + "。" };
    }),
    mk("calc", 3, "basic", function () {
      const B0 = pick([4, 5, 8, 10, 12, 20, 25]), f = pick([Q(3, 2), Q(5, 2), Q(7, 2), Q(9, 2), Q(1, 2), Q(3, 4), Q(5, 4), Q(2, 5), Q(13, 2), Q(7, 4), Q(3, 5)]);
      const c0 = qMul(Q(B0), f);
      const v = sc([B0, c0], FLQ, FQW), fl = v.fl === "int" ? "frac" : v.fl;
      const ff = fl === "dec" && !decOK(f) ? "frac" : fl;
      const a = qa(f, ff);
      return { stem: "求 " + v.sh[1] + " 是 " + v.sh[0] + " 的幾倍?", answer: a.answer, accepted: a.accepted, units: ["倍"], explain: "倍數 = 比較量 ÷ 基準量 = " + v.sh[1] + " ÷ " + v.sh[0] + " = " + shT(f, ff) + "。" };
    }),
    mk("calc", 4, "trap", function () {
      const p = pick([25, 60, 100, 150, 300, 400]);
      const ans = p * 100 / (100 + p), v = sc([20 * int(1, 10)], FLQ, FQW);
      return { stem: "乙重 " + v.sh[0] + " 公斤,甲比乙重 " + p + "%,則乙比甲輕百分之幾?", answer: K.num(ans), accepted: [K.num(ans) + "%"], units: PCT,
        explain: "把乙看成 100%,甲就是 100% × (1+" + p + "%) = " + (100 + p) + "%。\n乙比甲輕 " + (100 + p) + " - 100 = " + p + ",要以甲(" + (100 + p) + ")為基準:" + p + " ÷ " + (100 + p) + " = " + K.num(ans / 100) + " = " + K.num(ans) + "%。(百分率與重量多少無關)",
        trapNote: "常見錯誤:認為「甲比乙重 " + p + "%,乙就比甲輕 " + p + "%」。兩句話的基準量不同(前一句以乙為基準,後一句以甲為基準),所以百分率不一樣。" };
    }),
    mk("calc", 5, "extend", function () {
      const p = pick([20, 25, 30, 40, 60]), q = pick([20, 25, 40, 50]);
      let N, left; do { N = 20 * int(5, 40); left = N * (100 - p) * (100 - q) / 10000; } while (!Number.isInteger(left));
      const v = sc([N, left], FLQ, FQW), a = qa(v.qs[1], v.fl);
      return { stem: "一桶油共 " + v.sh[0] + " 公升,第一天用了全部的 " + p + "%,第二天用了剩下的 " + q + "%。還剩幾公升?", answer: a.answer, accepted: a.accepted, units: ["公升", "L", "l"],
        explain: "第一天後剩 " + v.sh[0] + " × " + (100 - p) + "% = " + shT(mv(N * (100 - p) / 100, v.s), v.fl) + " 公升。\n第二天用了剩下的 " + q + "%,還剩 " + (100 - q) + "%:" + shT(mv(N * (100 - p) / 100, v.s), v.fl) + " × " + (100 - q) + "% = " + v.sh[1] + " 公升。" };
    })
  ];

  const word = [
    mk("word", 2, "basic", function () {
      let B, dp, c; do { B = 20 * int(5, 50); dp = pick([60, 65, 70, 75, 80, 85, 90]); c = B * dp / 100; } while (!Number.isInteger(c));
      const v = scMoney([B, c]);
      return { stem: "一個書包原價 " + dsh(v.qs[0]) + " 元,特價 " + dsh(v.qs[1]) + " 元。特價是原價的幾折?", answer: zhe(dp), units: ["折"],
        explain: "特價 ÷ 原價 = " + dsh(v.qs[1]) + " ÷ " + dsh(v.qs[0]) + " = " + K.num(dp / 100) + " = " + dp + "%,即 " + zhe(dp) + " 折。" };
    }),
    mk("word", 3, "basic", function () {
      const p = pick([20, 25, 30, 40, 45, 60]);
      const v = sc([20 * int(2, 30)], FLQ, FQW), ans = qMul(v.qs[0], Q(p, 100));
      if (v.fl === "dec" && !decOK(ans)) throw new Error("重抽");
      const a = qa(ans, v.fl);
      return { stem: "水桶裡有 " + v.sh[0] + " 公升的水,用掉了 " + p + "%。用掉了多少公升?", answer: a.answer, accepted: a.accepted, units: ["公升", "L", "l"],
        explain: "用掉的水 = 總水量 × " + p + "% = " + v.sh[0] + " × " + K.num(p / 100) + " = " + shT(ans, v.fl) + " 公升。" };
    }),
    mk("word", 4, "trap", function () {
      const p = pick([10, 20, 25, 40, 50]);
      let L, c; do { L = 20 * int(4, 40); c = L * (100 - p) / 100; } while (!Number.isInteger(c));
      const v = sc([L, c], FLQ, FQW), a = qa(v.qs[0], v.fl);
      return { stem: "今年的稻米收成比去年減少 " + p + "%,今年收成 " + v.sh[1] + " 公噸。去年收成幾公噸?", answer: a.answer, accepted: a.accepted, units: ["公噸", "噸"],
        explain: "去年是基準量(100%),今年是去年的 100% - " + p + "% = " + (100 - p) + "%。\n去年 = " + v.sh[1] + " ÷ " + (100 - p) + "% = " + v.sh[1] + " ÷ " + K.num((100 - p) / 100) + " = " + v.sh[0] + " 公噸。",
        trapNote: "常見錯誤:把今年收成 " + v.sh[1] + " 加上它的 " + p + "%,得到 " + shT(qMul(v.qs[1], Q(100 + p, 100)), v.fl) + "。" + p + "% 是「去年」的 " + p + "%,不是今年的 " + p + "%,要用 " + v.sh[1] + " ÷ " + (100 - p) + "% 還原。" };
    }),
    mk("word", 4, "extend", function () {
      let B, d, m, a, b;
      do { B = 100 * int(4, 20); d = pick([75, 80, 85, 90]); m = 20 * int(3, 40); a = B * d / 100; b = B - m; } while (!Number.isInteger(a) || a === b || m >= B);
      const v = scMoney([B, m, Math.abs(a - b)]);
      const x = qa(v.qs[2], "dec");
      return { stem: "同一件外套原價 " + dsh(v.qs[0]) + " 元。甲店打 " + zhe(d) + " 折;乙店直接折價 " + dsh(v.qs[1]) + " 元。兩家店的售價相差多少元?", answer: x.answer, accepted: x.accepted, units: ["元"],
        explain: "甲店售價 = " + dsh(v.qs[0]) + " × " + d + "% = " + dsh(mv(a, v.s)) + " 元。\n乙店售價 = " + dsh(v.qs[0]) + " - " + dsh(v.qs[1]) + " = " + dsh(mv(b, v.s)) + " 元。\n相差 " + dsh(v.qs[2]) + " 元。" };
    }),
    mk("word", 5, "extend", function () {
      const p = pick([30, 35, 40, 45]), Tt = 20 * int(2, 12), d = Tt * (100 - 2 * p) / 100;
      const v = sc([Tt, d], FLQ, FQW), a = qa(v.qs[0], v.fl);
      return { stem: "果園裡採收的蘋果,大蘋果占全部重量的 " + p + "%,小蘋果比大蘋果重 " + v.sh[1] + " 公斤。蘋果一共重幾公斤?", answer: a.answer, accepted: a.accepted, units: ["公斤"],
        explain: "大蘋果占 " + p + "%,小蘋果占 100% - " + p + "% = " + (100 - p) + "%,小蘋果比大蘋果多 " + (100 - p) + "% - " + p + "% = " + (100 - 2 * p) + "%。\n這 " + (100 - 2 * p) + "% 就是 " + v.sh[1] + " 公斤,全部重量 = " + v.sh[1] + " ÷ " + (100 - 2 * p) + "% = " + v.sh[1] + " ÷ " + K.num((100 - 2 * p) / 100) + " = " + v.sh[0] + " 公斤。" };
    })
  ];

  /* ===== 教材式 □ 未知數題（規格第 14 節）===== */
  const PL = [20, 25, 40, 50, 60, 75, 80];
  function basePair(p) { let B, c; do { B = 20 * int(3, 30); c = B * p / 100; } while (!Number.isInteger(c)); return [B, c]; }

  const boxes = [
    mk("fill", 2, "basic", function () {
      const p = pick(PL), bc = basePair(p), v = sc(bc, FLQ, FQW), a = qa(v.qs[0], v.fl);
      return { stem: "「□ 的 " + p + "% 是 " + v.sh[1] + "」,□ = ____", answer: a.answer, accepted: a.accepted,
        explain: "□ × " + p + "% = " + v.sh[1] + ",所以 □ = " + v.sh[1] + " ÷ " + p + "% = " + v.sh[1] + " ÷ " + K.num(p / 100) + " = " + v.sh[0] + "。\n驗算:" + v.sh[0] + " × " + p + "% = " + v.sh[1] + "。" };
    }),
    mk("calc", 1, "basic", function () {
      const p = int(1, 19) * 5, B = pick([20, 25, 40, 50, 80, 200]); if (!Number.isInteger(B * p / 100)) throw new Error("重抽");
      const v = sc([B, B * p / 100], FLQ, FQW);
      return { stem: "求 □ 是多少:「" + v.sh[0] + " 的 □% 是 " + v.sh[1] + "」", answer: String(p), accepted: [p + "%"], units: PCT,
        explain: "□% = 比較量 ÷ 基準量 = " + v.sh[1] + " ÷ " + v.sh[0] + " = " + K.num(p / 100) + " = " + p + "%,所以 □ = " + p + "。" };
    }),
    mk("calc", 3, "basic", function () {
      const B0 = pick([4, 5, 8, 10, 12, 20, 25]), f = pick([Q(3, 2), Q(5, 2), Q(7, 2), Q(9, 2), Q(1, 2), Q(3, 4), Q(5, 4), Q(2, 5), Q(7, 4), Q(3, 5)]);
      const v = sc([B0, qMul(Q(B0), f)], FLQ, FQW), fl = v.fl === "int" ? "frac" : v.fl, ff = fl === "dec" && !decOK(f) ? "frac" : fl;
      const a = qa(f, ff);
      return { stem: "求 □ 是多少:「" + v.sh[0] + " × □ = " + v.sh[1] + "」", answer: a.answer, accepted: a.accepted,
        explain: "□ = 比較量 ÷ 基準量 = " + v.sh[1] + " ÷ " + v.sh[0] + " = " + shT(f, ff) + "。" };
    }),
    mk("single", 3, "trap", function () {
      const p = pick(PL), bc = basePair(p), v = sc(bc, FLQ, FQW), s = v.s, fl = v.fl;
      const cands = [mv(bc[1] * p / 100, s), mv(bc[1] * p, s), mv(bc[1] * (100 - p) / 100, s), mv(bc[1] + p, s), mv(bc[1] * (100 + p) / 100, s)].filter(function (x) { return qCmp(x, v.qs[0]) !== 0 && (fl !== "dec" || ok2(x)); }).map(function (x) { return shT(x, fl); });
      const r = S(v.sh[0], cands);
      r.stem = "「□ 的 " + p + "% 是 " + v.sh[1] + "」,□ 是多少?";
      r.explain = "□ 是基準量," + v.sh[1] + " 是比較量。□ = " + v.sh[1] + " ÷ " + p + "% = " + v.sh[0] + "。";
      r.trapNote = "常見錯誤:看到「" + p + "%」就用乘法,算成 " + v.sh[1] + " × " + p + "% = " + shT(mv(bc[1] * p / 100, s), fl) + "。未知的是基準量(□ 的 " + p + "% 是已知的結果),要用除法反求。";
      return r;
    }),
    mk("tf", 2, "trap", function () {
      const p = int(1, 19) * 5, B = pick([20, 25, 40, 50, 80, 200]); if (!Number.isInteger(B * p / 100) || p === 50) throw new Error("重抽");
      const v = sc([B, B * p / 100], FLQ, FQW), right = Math.random() < 0.5, x = right ? p : pick([100 - p, p * 10, K.num(p / 10)]);
      return { stem: "「" + v.sh[0] + " 的 □% 是 " + v.sh[1] + "」,所以 □ = " + x + "。", answer: right,
        explain: "□% = " + v.sh[1] + " ÷ " + v.sh[0] + " = " + K.num(p / 100) + " = " + p + "%,所以 □ = " + p + (right ? ",敘述正確。" : ",不是 " + x + "。"),
        trapNote: "易錯:把比較量當成「剩下的」而算成 100 - " + p + ",或百分率的位數搞錯。□% 是比較量除以基準量。" };
    }),
    mk("fill", 4, "trap", function () {
      const p = pick([10, 20, 25, 30, 40, 50]);
      let B, c; do { B = 20 * int(3, 40); c = B * (100 + p) / 100; } while (!Number.isInteger(c));
      const v = sc([B, c], FLQ, FQW), a = qa(v.qs[0], v.fl);
      return { stem: "「□ × (1 + " + p + "%) = " + v.sh[1] + "」,□ = ____", answer: a.answer, accepted: a.accepted,
        explain: "1 + " + p + "% = " + K.num((100 + p) / 100) + ",□ = " + v.sh[1] + " ÷ " + K.num((100 + p) / 100) + " = " + v.sh[0] + "。",
        trapNote: "常見錯誤:把 " + v.sh[1] + " 減去它的 " + p + "%,得到 " + shT(qMul(v.qs[1], Q(100 - p, 100)), v.fl) + "。" + p + "% 是 □ 的 " + p + "%,不是 " + v.sh[1] + " 的 " + p + "%,要用除法還原。" };
    }),
    mk("word", 4, "extend", function () {
      let B, dp, c; do { B = 20 * int(5, 50); dp = pick([60, 70, 75, 80, 85, 90]); c = B * dp / 100; } while (!Number.isInteger(c));
      const v = scMoney([B, c]), a = qa(v.qs[0], "dec");
      return { stem: "一件商品打 " + zhe(dp) + " 折之後賣 " + dsh(v.qs[1]) + " 元。設原價是 □ 元,可以列成「□ × " + dp + "% = " + dsh(v.qs[1]) + "」,原價 □ 是多少元?", answer: a.answer, accepted: a.accepted, units: ["元"],
        explain: "打 " + zhe(dp) + " 折 = 原價的 " + dp + "%。□ = " + dsh(v.qs[1]) + " ÷ " + dp + "% = " + dsh(v.qs[1]) + " ÷ " + K.num(dp / 100) + " = " + dsh(v.qs[0]) + " 元。" };
    }),
    mk("calc", 5, "extend", function () {
      let p, q, B, c; do { p = pick([10, 20, 25, 30, 40]); q = pick([10, 20, 25, 30]); B = 400 * int(1, 5); c = B * (100 + p) * (100 - q) / 10000; } while (!Number.isInteger(c) || (100 + p) * (100 - q) === 10000);
      const v = sc([B, c], FLQ, FQW), a = qa(v.qs[0], v.fl);
      return { stem: "求 □ 是多少:「□ × (1 + " + p + "%) × (1 - " + q + "%) = " + v.sh[1] + "」", answer: a.answer, accepted: a.accepted,
        explain: "(1 + " + p + "%) × (1 - " + q + "%) = " + K.num((100 + p) / 100) + " × " + K.num((100 - q) / 100) + " = " + K.num((100 + p) * (100 - q) / 10000) + "。\n□ = " + v.sh[1] + " ÷ " + K.num((100 + p) * (100 - q) / 10000) + " = " + v.sh[0] + "。" };
    }),
    mk("word", 5, "extend", function () {
      const p = pick([25, 50, 100, 150]), X0 = 20 * int(2, 15), Y0 = X0 * (100 + p) / 100;
      const v = sc([X0, X0 + Y0], FLQ, FQW), a = qa(v.qs[0], v.fl);
      return { stem: "甲有 □ 公斤的米,乙有 △ 公斤的米,乙比甲多 " + p + "%,兩人一共有 " + v.sh[1] + " 公斤。可以列成「△ = □ × (1 + " + p + "%)」、「□ + △ = " + v.sh[1] + "」,□ 是多少公斤?", answer: a.answer, accepted: a.accepted, units: ["公斤"],
        explain: "△ = □ × " + K.num((100 + p) / 100) + ",所以 □ + △ = □ × (1 + " + K.num((100 + p) / 100) + ") = □ × " + K.num((200 + p) / 100) + " = " + v.sh[1] + "。\n□ = " + v.sh[1] + " ÷ " + K.num((200 + p) / 100) + " = " + v.sh[0] + " 公斤。" };
    })
  ];

  /* ===== 解法二（規格第 16 節）：與解法一不同的思路，用這一題實際的數字動態產生 ===== */
  function Qn(a, b) { if (b !== undefined) return Q(a, b); if (Number.isInteger(a)) return Q(a); for (let k = 1; k <= 6; k++) { const m = Math.pow(10, k), y = Math.round(a * m); if (Math.abs(y - a * m) < 1e-6) return Q(y, m); } throw new Error("重抽"); }
  const NUMRE_SRC = "\\d+ \\d+/\\d+|\\d+/\\d+|\\d+\\.\\d+%?|\\d+%?";
  function pq(t) {
    t = String(t).trim(); let m;
    if ((m = t.match(/^(\d+) (\d+)\/(\d+)$/))) return Qn(Number(m[1]) * Number(m[3]) + Number(m[2]), Number(m[3]));
    if ((m = t.match(/^(\d+)\/(\d+)$/))) return Qn(Number(m[1]), Number(m[2]));
    if ((m = t.match(/^(\d+)\.(\d+)(%?)$/))) { const base = Qn(Number(m[1] + m[2]), Math.pow(10, m[2].length)); return m[3] ? qMul(base, Qn(1, 100)) : base; }
    if ((m = t.match(/^(\d+)(%?)$/))) return m[2] ? Qn(Number(m[1]), 100) : Qn(Number(m[1]));
    throw new Error("重抽");
  }
  function tk(s) { return (String(s).match(new RegExp(NUMRE_SRC, "g")) || []).map(pq); }
  function qeval(str) {
    str = String(str).replace(/減/g, "-");
    const re = new RegExp("\\s*(" + NUMRE_SRC + "|[()+\\-×÷])", "g"), toks = []; let m;
    while ((m = re.exec(str))) toks.push(m[1]);
    let i = 0;
    function expr() { let v = term(); while (toks[i] === "+" || toks[i] === "-") { const op = toks[i++], w = term(); v = op === "+" ? qAdd(v, w) : qSub(v, w); } return v; }
    function term() { let v = fac(); while (toks[i] === "×" || toks[i] === "÷") { const op = toks[i++], w = fac(); v = op === "×" ? qMul(v, w) : qDiv(v, w); } return v; }
    function fac() { const t = toks[i++]; if (t === "(") { const v = expr(); i++; return v; } return pq(t); }
    return expr();
  }
  /* 自我核對：解法二算出來的值必須和標準答案一致，否則丟錯（不讓錯的解法二出貨） */
  function numOf(s) { return pq(String(s).replace(/%$/, "").trim()); }
  function ck(q, s) { let a; try { a = numOf(s); } catch (e) { return q; } if (qCmp(q, a) !== 0) throw new Error("explain2 與答案不一致:" + String(s)); return q; }
  function ckTf(r, truth) { if (!!truth !== !!r.answer) throw new Error("explain2 與答案不一致(是非)"); }
  function ckMulti(r, flags) { const want = flags.map(function (f, i) { return f ? i : -1; }).filter(function (i) { return i >= 0; }).join(","); if (r.answer.join(",") !== want) throw new Error("explain2 與答案不一致(複選)"); }
  function ckEq(a, b) { if (qCmp(a, b) !== 0) throw new Error("explain2 內部算式不一致"); }
  function unitOf(r) { return r.units && r.units[0] ? " " + r.units[0] : ""; }
  function goodsOf(r) { return r.answer.map(function (i) { return r.options[i]; }).join("、"); }
  function verdict(r) { return "所以敘述" + (r.answer ? "正確" : "錯誤") + "。"; }
  function dispFor(ctx) { const dec = /\d\.\d/.test(ctx), mixed = /\d \d+\/\d+/.test(ctx); return function (q) { return dec && decOK(q) ? K.qDec(q) : K.qMixed(q); }; }
  function pn(x) { return K.num(x); }
  function pctOf(q) { return q.n * 100 / q.d; }
  function boxEq(r) { return r.stem.match(/「([^」]*[□△][^」]*)」/)[1]; }
  function normEq(e) { return e.replace(" 的 ", " × ").replace(" 是 ", " = "); }
  function subst(eq, xs) { return qeval(normEq(eq).split(" = ")[0].replace(/□/g, "(" + xs + ")")); }
  function eqRight(eq) { return qeval(normEq(eq).split(" = ")[1]); }
  /* 分數化百分率：c ÷ B 約分後，把分母變成 100 */
  function pctFrac(c, B, d, fin) {
    const v = qDiv(c, B), p = qMul(v, Qn(100));
    ck(p, fin);
    return "用分數想:" + d(c) + " ÷ " + d(B) + " 寫成分數 " + K.qMixed(v) + "(約分後)。\n把分母變成 100,就是百分之 " + pn(p.n / p.d) + ",所以是 " + fin + "。";
  }
  /* 百分率化成最簡分數：先除以分母，再乘分子 */
  function fracPct(B, pq1, d, fin, label) {
    const fr = Qn(Math.round(pctOf(pq1) * 1000), 100000), x = fr.n, y = fr.d, one = qDiv(B, Qn(y)), res = qMul(one, Qn(x));
    ck(res, fin);
    return "把 " + pn(pctOf(pq1)) + "% 化成最簡分數:百分之 " + pn(pctOf(pq1)) + " = " + x + "/" + y + "。\n" + d(B) + " 的 " + x + "/" + y + ":先除以 " + y + "," + d(B) + " ÷ " + y + " = " + d(one) + ";再乘 " + x + ",得 " + d(one) + " × " + x + " = " + d(res) + "。";
  }
  /* 設原來是 100 份：parts 份是 c，原來 100 份 = 答案 */
  function share100(d, c, partsText, parts, fin, finLabel) {
    const one = qDiv(c, Qn(parts)), whole = qMul(one, Qn(100));
    ck(whole, finLabel);
    return "設原來是 100 份。" + partsText + "\n這 " + pn(parts) + " 份是 " + d(c) + ",1 份 = " + d(c) + " ÷ " + pn(parts) + " = " + d(one) + ",原來 100 份 = " + fin + "。";
  }
  function stmtV(s) {
    let m;
    if ((m = s.match(/^原價先打 ([\d.]+) 折,再打 ([\d.]+) 折,等於打 ([\d.]+) 折$/))) { const a = Number(m[1]) * 10, b = Number(m[2]) * 10, c = a * b / 100; return [Math.abs(c / 10 - Number(m[3])) < 1e-9, m[1] + " 折是 " + pn(a) + "%," + m[2] + " 折是 " + pn(b) + "%," + pn(a) + "% × " + pn(b) + "% = " + pn(c) + "%,即 " + pn(c / 10) + " 折"]; }
    if (s === "基準量 = 比較量 ÷ 百分率") return [true, "舉例:20 的 50% 是 10,10 ÷ 50% = 20"];
    if (s === "基準量 = 比較量 × 百分率") return [false, "舉例:20 的 50% 是 10,10 × 50% = 5,不是 20"];
    if (s === "比較量有可能比基準量大") return [true, "舉例:20 的 150% 是 30,比 20 大"];
    if (s === "百分率最大只能是 100%") return [false, "舉例:150% 也可以,例如增加一半"];
    if ((m = s.match(/^增加 ([\d.]+)% 後,新的量是原來的 ([\d.]+)%$/))) return [Math.abs(100 + Number(m[1]) - Number(m[2])) < 1e-9, "原來 100%,增加 " + m[1] + "% 變成 " + pn(100 + Number(m[1])) + "%"];
    if ((m = s.match(/^減少 ([\d.]+)% 之後,再增加 \1%,會回到原來的量$/))) { const p = Number(m[1]), back = (100 - p) * (100 + p) / 100; return [Math.abs(back - 100) < 1e-9, "設原來 100:減少後 " + pn(100 - p) + ",再增加 " + m[1] + "% 得 " + pn(back) + ",不是 100"]; }
    throw new Error("explain2 找不到對應的敘述:" + s);
  }
  function priceStmt(s, B, cur) {
    let m;
    if ((m = s.match(/^現價是 (.+) 元$/))) return [qCmp(pq(m[1]), cur) === 0, "算出現價 " + K.qDec(cur)];
    if ((m = s.match(/^現價是原價的 ([\d.]+)%$/))) { const r = qMul(qDiv(cur, B), Qn(100)); return [Math.abs(Number(m[1]) - r.n / r.d) < 1e-9, "現價是原價的 " + pn(r.n / r.d) + "%"]; }
    if (s === "現價比原價低") return [qCmp(cur, B) < 0, "現價 " + K.qDec(cur) + (qCmp(cur, B) < 0 ? " 比原價低" : " 沒有比原價低")];
    if (s === "現價比原價高") return [qCmp(cur, B) > 0, "現價 " + K.qDec(cur) + (qCmp(cur, B) > 0 ? " 比原價高" : " 沒有比原價高")];
    if ((m = s.match(/^現價和原價相差 (.+) 元$/))) { const df = qCmp(cur, B) > 0 ? qSub(cur, B) : qSub(B, cur); return [qCmp(pq(m[1]), df) === 0, "相差 " + K.qDec(df)]; }
    if (s === "現價和原價相同") return [qCmp(cur, B) === 0, "現價和原價" + (qCmp(cur, B) === 0 ? "相同" : "不同")];
    throw new Error("explain2 找不到對應的敘述:" + s);
  }
  function tfNameStmt(r) { return r.stem.match(/「(.+?)的存款是(.+?)的 ([\d.]+)%」.*基準量是(.+?)的存款/); }
  /* 折扣：打 z 折 → 折掉的百分率 */
  function offOf(B, z) { const dp = z.n * 10 / z.d; return { dp: dp, off: qMul(B, Qn(Math.round(100 - dp), 100)), cut: 100 - dp }; }
  function incEq(eq) { const m = eq.match(/\(1 \+ ([\d.]+)%\)/); return Number(m[1]); }

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
    "quantity-single-L1-01": function (r) { const t = tk(r.stem), d = dispFor(r.stem); return pctFrac(t[1], t[0], d, r.options[r.answer]); },
    "quantity-single-L2-02": function (r) { const t = tk(r.stem), d = dispFor(r.stem), B = t[0], z = t[1], o = offOf(B, z); ck(qSub(B, o.off), r.options[r.answer]); return "先算折掉的錢:打 " + pn(z.n / z.d) + " 折是少 " + pn(o.cut) + "%,折掉 " + d(B) + " × " + pn(o.cut) + "% = " + d(o.off) + " 元。\n售價 = " + d(B) + " - " + d(o.off) + " = " + d(qSub(B, o.off)) + " 元。選 " + r.options[r.answer] + "。"; },
    "quantity-single-L3-03": function (r) { const t = tk(r.stem), d = dispFor(r.stem), c = t[0], p = pctOf(t[1]), one = qDiv(c, Qn(p)); ck(qMul(one, Qn(100)), r.options[r.answer]); return "用 1% 想:" + pn(p) + "% 是 " + d(c) + ",1% = " + d(c) + " ÷ " + pn(p) + " = " + d(one) + "。\n100% = " + d(one) + " × 100 = " + r.options[r.answer] + "。\n所以答案是 " + r.options[r.answer] + "。"; },
    "quantity-single-L4-04": function (r) {
      const t = tk(r.stem), d = dispFor(r.stem), B = t[0], p = pctOf(t[1]), up = 100 + p, down = up * (100 - p) / 100, cur = qMul(B, Qn(Math.round(down * 100), 10000));
      ck(cur, r.options[r.answer]);
      return "設原價是 100:漲 " + pn(p) + "% 變成 " + pn(up) + ",再降 " + pn(p) + "% 是 " + pn(up) + " × " + pn(100 - p) + "% = " + pn(down) + "。\n現價是原價的 " + pn(down) + "%:" + d(B) + " × " + pn(down) + "% = " + r.options[r.answer] + "。";
    },
    "quantity-single-L5-05": function (r) {
      const t = tk(r.stem), d = dispFor(r.stem), C = t[0], x = pctOf(t[1]), zr = t[2].n * 10 / t[2].d, price100 = (100 + x) * zr / 100, profit = qMul(C, Qn(Math.round((price100 - 100) * 100), 10000));
      ck(profit, r.options[r.answer]);
      return "設進貨價是 100:定價 " + pn(100 + x) + ",打折後 " + pn(100 + x) + " × " + pn(zr) + "% = " + pn(price100) + ",賺 " + pn(price100 - 100) + "(也就是進貨價的 " + pn(price100 - 100) + "%)。\n賺 " + d(C) + " × " + pn(price100 - 100) + "% = " + r.options[r.answer] + "。";
    },
    "quantity-single-L3-06": function (r) {
      const eq = boxEq(r), c = eqRight(eq), d = dispFor(r.stem), p = pctOf(tk(eq)[0]), one = qDiv(c, Qn(p)), X = qMul(one, Qn(100));
      ck(X, r.options[r.answer]);
      return "用 1% 想:" + pn(p) + "% 是 " + d(c) + ",1% = " + d(c) + " ÷ " + pn(p) + " = " + d(one) + "。\n□ 是 100%,□ = " + d(one) + " × 100 = " + d(X) + ",所以選 " + r.options[r.answer] + "。";
    },
    "quantity-multi-L2-01": function (r) {
      const t = tk(r.stem), B = t[0], c = t[1], d = dispFor(r.stem), pv = pctOf(qDiv(c, B)), flags = [];
      const wh = r.options.map(function (o) {
        let m, ok, why;
        if ((m = o.match(/^基準量是(全部|吃掉)的米重/))) { ok = m[1] === "全部"; why = "整體才是基準量,整體是 " + d(B) + " 公斤"; }
        else if ((m = o.match(/^比較量是(吃掉|全部)的米重/))) { ok = m[1] === "吃掉"; why = "部分才是比較量,部分是 " + d(c) + " 公斤"; }
        else if ((m = o.match(/^吃掉的米占全部的 ([\d.]+)%$/))) { ok = Math.abs(Number(m[1]) - pv) < 1e-9; why = d(c) + " ÷ " + d(B) + " = " + pn(pv) + "%"; }
        else if ((m = o.match(/^剩下的米占全部的 ([\d.]+)%$/))) { ok = Math.abs(Number(m[1]) - (100 - pv)) < 1e-9; why = "剩下 " + d(qSub(B, c)) + " 公斤,占 " + pn(100 - pv) + "%"; }
        else throw new Error("explain2 找不到對應的敘述:" + o);
        flags.push(ok); return why;
      });
      ckMulti(r, flags);
      return "先分清楚整體和部分,再逐句檢查:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。";
    },
    "quantity-multi-L3-02": function (r) { const t = tk(r.stem), B = t[0], p = t[1], d = dispFor(r.stem), want = qMul(B, p), flags = [], wh = r.options.map(function (o) { const v = qeval(o); flags.push(qCmp(v, want) === 0); return "算出 " + d(v) + (qCmp(v, want) === 0 ? ",等於 " + d(want) : ",不等於 " + d(want)); }); ckMulti(r, flags); return "要求的答案是 " + d(want) + ",逐一算出每個算式:\n" + rows(r, flags, wh) + "。\n所以選第 " + pickIdx(r) + " 個。"; },
    "quantity-multi-L3-03": function (r) { const flags = [], wh = r.options.map(function (o) { const v = stmtV(o); flags.push(v[0]); return v[1]; }); ckMulti(r, flags); return "舉具體的例子檢查每一句:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。"; },
    "quantity-multi-L4-04": function (r) { const t = tk(r.stem), d = dispFor(r.stem), orig = qDiv(t[1], qMul(t[0], Qn(1, 10))), flags = [], wh = r.options.map(function (o) { const v = qeval(o); flags.push(qCmp(v, orig) === 0); return "算出 " + d(v) + (qCmp(v, orig) === 0 ? ",等於原價" : ",不是原價"); }); ckMulti(r, flags); return "原價應該是 " + d(orig) + " 元(打折後的錢 ÷ 折扣的百分率)。逐一算出:\n" + rows(r, flags, wh) + "。\n所以選第 " + pickIdx(r) + " 個。"; },
    "quantity-multi-L5-05": function (r) {
      const t = tk(r.stem), B = t[0], p = t[1], q = t[2], rr = qMul(qAdd(Qn(1), p), qSub(Qn(1), q)), cur = qMul(B, rr), flags = [];
      const wh = r.options.map(function (o) { const v = priceStmt(o, B, cur); flags.push(v[0]); return v[1]; });
      ckMulti(r, flags);
      return "設原價是 100:漲 " + pn(pctOf(p)) + "% 變 " + pn(100 + pctOf(p)) + ",再降 " + pn(pctOf(q)) + "% 變 " + pn(pctOf(rr)) + ",現價是原價的 " + pn(pctOf(rr)) + "%。\n逐句檢查:\n" + rows(r, flags, wh) + "。\n所以正確的是第 " + pickIdx(r) + " 個。";
    },
    "quantity-tf-L1-01": function (r) {
      const t = tk(r.stem), B = t[0], p = t[1], x = t[2], d = dispFor(r.stem), fr = Qn(Math.round(pctOf(p) * 1000), 100000), v = qMul(qDiv(B, Qn(fr.d)), Qn(fr.n));
      ckTf(r, qCmp(v, x) === 0);
      return "把 " + pn(pctOf(p)) + "% 化成最簡分數 " + fr.n + "/" + fr.d + ",算 " + d(B) + " 的 " + fr.n + "/" + fr.d + ":" + d(B) + " ÷ " + fr.d + " × " + fr.n + " = " + d(v) + (qCmp(v, x) === 0 ? ",和 " + d(x) + " 一樣。" : ",不是 " + d(x) + "。") + verdict(r);
    },
    "quantity-tf-L2-02": function (r) { const m = tfNameStmt(r); ckTf(r, m[4] === m[2]); return "舉例子:設" + m[2] + "的存款是 100 元(當 100%),那" + m[1] + "的存款就是 " + m[3] + " 元。\n可見「" + m[2] + "的存款」才是當 100% 的基準量。敘述說基準量是" + m[4] + "的存款," + (m[4] === m[2] ? "和例子一樣。" : "和例子不一樣。") + verdict(r); },
    "quantity-tf-L3-03": function (r) { let m; const d = Number(r.stem.match(/打 ([\d.]+) 折/)[1]); if ((m = r.stem.match(/只收原價的 ([\d.]+)%/))) { const ok = Math.abs(Number(m[1]) - d * 10) < 1e-9; ckTf(r, ok); return "舉例:原價 100 元,打 " + pn(d) + " 折就是 100 × " + pn(d * 10) + "% = " + pn(d * 10) + " 元。敘述說只收原價的 " + m[1] + "%," + (ok ? "和例子一樣。" : "和例子不一樣。") + verdict(r); } ckTf(r, false); return "舉例:原價 100 元,打 " + pn(d) + " 折賣 " + pn(d * 10) + " 元,少付 " + pn(100 - d * 10) + " 元,也就是減少 " + pn(100 - d * 10) + "%,不是減少 " + pn(d) + "%。" + verdict(r); },
    "quantity-tf-L4-04": function (r) { const t = tk(r.stem), d = dispFor(r.stem), B = t[0], z = t[1], x = t[2], o = offOf(B, z), price = qSub(B, o.off); ckTf(r, qCmp(price, x) === 0); return "先算折掉的錢:折掉 " + d(B) + " × " + pn(o.cut) + "% = " + d(o.off) + " 元,售價 = " + d(B) + " - " + d(o.off) + " = " + d(price) + " 元" + (qCmp(price, x) === 0 ? ",和敘述的 " + d(x) + " 一樣。" : ",不是敘述的 " + d(x) + "。") + verdict(r); },
    "quantity-tf-L5-05": function (r) { const t = tk(r.stem), d = dispFor(r.stem), B = t[0], p = t[1], q = t[2], X = t[3], rr = qMul(qAdd(Qn(1), p), qSub(Qn(1), q)), cur = qMul(B, rr); ckTf(r, qCmp(cur, X) === 0); return "設原價是 100:漲 " + pn(pctOf(p)) + "% 變 " + pn(100 + pctOf(p)) + ",再降 " + pn(pctOf(q)) + "% 變 " + pn(pctOf(rr)) + ",現價是原價的 " + pn(pctOf(rr)) + "%。\n" + d(B) + " × " + pn(pctOf(rr)) + "% = " + d(cur) + (qCmp(cur, X) === 0 ? ",和敘述的 " + d(X) + " 一樣。" : ",不是敘述的 " + d(X) + "。") + verdict(r); },
    "quantity-tf-L2-06": function (r) { const eq = boxEq(r), c = qeval(eq.split(" 是 ")[1]), B = tk(eq)[0], x = r.stem.match(/所以 □ = (.+)。$/)[1], d = dispFor(r.stem), v = qMul(B, qMul(pq(x), Qn(1, 100))); ckTf(r, qCmp(v, c) === 0); return "代入檢查:□ = " + x + ",那 " + d(B) + " 的 " + x + "% = " + d(v) + (qCmp(v, c) === 0 ? ",正好是 " + d(c) + "。" : ",不是 " + d(c) + "。") + verdict(r); },
    "quantity-fill-L1-01": function (r) { const t = tk(r.stem), d = dispFor(r.stem); return pctFrac(t[1], t[0], d, r.answer + "%"); },
    "quantity-fill-L2-02": function (r) { const t = tk(r.stem), d = dispFor(r.stem); return fracPct(t[0], t[1], d, r.answer) + "\n答案是 " + r.answer + "。"; },
    "quantity-fill-L3-03": function (r) { const t = tk(r.stem), d = dispFor(r.stem), B = t[0], z = t[1], o = offOf(B, z); ck(qSub(B, o.off), r.answer); return "先算折掉的錢:打 " + pn(z.n / z.d) + " 折是少 " + pn(o.cut) + "%,折掉 " + d(B) + " × " + pn(o.cut) + "% = " + d(o.off) + " 元。\n售價 = " + d(B) + " - " + d(o.off) + " = " + r.answer + " 元。"; },
    "quantity-fill-L4-04": function (r) { const t = tk(r.stem), p = pctOf(t[0]), c = t[1], d = dispFor(r.stem), one = qDiv(c, Qn(p)); ck(qMul(one, Qn(100)), r.answer); return "用 1% 想:" + pn(p) + "% 是 " + d(c) + ",1% = " + d(c) + " ÷ " + pn(p) + " = " + d(one) + "。\n100% = " + d(one) + " × 100 = " + r.answer + "。"; },
    "quantity-fill-L5-05": function (r) { const t = tk(r.stem), p = pctOf(t[0]), c = t[1], d = dispFor(r.stem); return share100(d, c, "增加 " + pn(p) + "%,就是多了 " + pn(p) + " 份,現在共 " + pn(100 + p) + " 份。", 100 + p, r.answer, r.answer); },
    "quantity-fill-L2-06": function (r) { const eq = boxEq(r), c = eqRight(eq), d = dispFor(r.stem), v = subst(eq, r.answer), p = pctOf(tk(eq)[0]), one = qDiv(c, Qn(p)); ckEq(v, c); ck(qMul(one, Qn(100)), r.answer); return "用 1% 想:" + pn(p) + "% 是 " + d(c) + ",1% = " + d(one) + ",100% = " + d(one) + " × 100 = " + r.answer + "。\n代入檢查:" + r.answer + " 的 " + pn(p) + "% = " + d(v) + "。"; },
    "quantity-fill-L4-07": function (r) { const eq = boxEq(r), p = incEq(eq), c = eqRight(eq), d = dispFor(r.stem); return share100(d, c, "增加 " + pn(p) + "%,現在是 " + pn(100 + p) + " 份。", 100 + p, r.answer, r.answer); },
    "quantity-calc-L1-01": function (r) { const t = tk(r.stem), d = dispFor(r.stem); return pctFrac(t[0], t[1], d, r.answer + "%"); },
    "quantity-calc-L2-02": function (r) { const t = tk(r.stem), d = dispFor(r.stem); return fracPct(t[0], t[1], d, r.answer) + "\n答案是 " + r.answer + "。"; },
    "quantity-calc-L3-03": function (r) { const t = tk(r.stem), d = dispFor(r.stem), c = t[0], B = t[1], f = qDiv(c, B), w = Math.floor(f.n / f.d), rest = qSub(c, qMul(B, Qn(w))); ck(qAdd(Qn(w), qDiv(rest, B)), r.answer); return "把倍數拆開:" + d(B) + " 的 " + w + " 倍是 " + d(qMul(B, Qn(w))) + ",還差 " + d(c) + " - " + d(qMul(B, Qn(w))) + " = " + d(rest) + "。\n" + d(rest) + " 是 " + d(B) + " 的 " + d(qDiv(rest, B)) + " 倍,合起來 " + w + " + " + d(qDiv(rest, B)) + " = " + r.answer + " 倍。"; },
    "quantity-calc-L3-07": function (r) { const t = tk(boxEq(r)), d = dispFor(r.stem), B = t[0], c = t[1], f = qDiv(c, B), w = Math.floor(f.n / f.d), rest = qSub(c, qMul(B, Qn(w))); ck(qAdd(Qn(w), qDiv(rest, B)), r.answer); return "把倍數拆開:" + d(B) + " 的 " + w + " 倍是 " + d(qMul(B, Qn(w))) + ",還差 " + d(rest) + ",而 " + d(rest) + " 是 " + d(B) + " 的 " + d(qDiv(rest, B)) + " 倍。\n合起來 □ = " + w + " + " + d(qDiv(rest, B)) + " = " + r.answer + "。"; },
    "quantity-calc-L1-06": function (r) { const t = tk(boxEq(r)), d = dispFor(r.stem); return pctFrac(t[1], t[0], d, r.answer + "%").replace("所以是", "所以 □ 是"); },
    "quantity-calc-L4-04": function (r) { const t = tk(r.stem), p = pctOf(t[1]), ans = 100 * p / (100 + p); ck(Qn(Math.round(ans * 1000), 1000), r.answer); return "用分數想:甲 = 乙 × " + pn((100 + p) / 100) + ",所以乙 = 甲 ÷ " + pn((100 + p) / 100) + ",乙是甲的 " + pn(100 / (100 + p)) + "(即 " + pn(100 * 100 / (100 + p)) + "%)。\n乙比甲輕 1 - " + pn(100 / (100 + p)) + " = " + pn(1 - 100 / (100 + p)) + ",也就是 " + r.answer + "%。"; },
    "quantity-calc-L5-05": function (r) { const t = tk(r.stem), d = dispFor(r.stem), N = t[0], p = t[1], q = t[2], rr = qMul(qSub(Qn(1), p), qSub(Qn(1), q)); ck(qMul(N, rr), r.answer); return "合併成一次:第一次用掉後剩全部的 " + pn(100 - pctOf(p)) + "%,第二次再剩那些的 " + pn(100 - pctOf(q)) + "%,把兩個百分率相乘,最後剩全部的 " + pn(pctOf(rr)) + "%。\n" + d(N) + " × " + pn(pctOf(rr)) + "% = " + r.answer + " 公升。"; },
    "quantity-calc-L5-08": function (r) {
      const eq = boxEq(r), m = eq.match(/\(1 \+ ([\d.]+)%\) × \(1 - ([\d.]+)%\) = (.+)$/), pp = Number(m[1]), qq = Number(m[2]), c = pq(m[3]), d = dispFor(r.stem), parts = (100 + pp) * (100 - qq) / 100;
      return share100(d, c, "漲 " + pn(pp) + "% 變成 " + pn(100 + pp) + " 份,再降 " + pn(qq) + "% 變成 " + pn(100 + pp) + " × " + pn(100 - qq) + "% = " + pn(parts) + " 份。", parts, r.answer, r.answer);
    },
    "quantity-word-L2-01": function (r) { const t = tk(r.stem), d = dispFor(r.stem), B = t[0], c = t[1], one = qDiv(B, Qn(10)); ck(qDiv(c, one), r.answer); return "用每 1 折想:1 折 = 原價的十分之一 = " + d(B) + " ÷ 10 = " + d(one) + " 元。\n" + d(c) + " ÷ " + d(one) + " = " + r.answer + ",所以是 " + r.answer + " 折。"; },
    "quantity-word-L3-02": function (r) { const t = tk(r.stem), d = dispFor(r.stem); return fracPct(t[0], t[1], d, r.answer) + "\n所以用掉 " + r.answer + unitOf(r) + "。"; },
    "quantity-word-L4-03": function (r) { const t = tk(r.stem), p = pctOf(t[0]), c = t[1], d = dispFor(r.stem); return share100(d, c, "今年少了 " + pn(p) + " 份,只剩 " + pn(100 - p) + " 份。", 100 - p, r.answer + unitOf(r), r.answer); },
    "quantity-word-L4-04": function (r) { const t = tk(r.stem), d = dispFor(r.stem), B = t[0], z = t[1], m = t[2], o = offOf(B, z), diff = qCmp(o.off, m) > 0 ? qSub(o.off, m) : qSub(m, o.off); ck(diff, r.answer); return "比較少付的錢:甲店折掉 " + d(B) + " × " + pn(o.cut) + "% = " + d(o.off) + " 元,乙店折掉 " + d(m) + " 元。\n少付的差 = " + d(diff) + " 元,所以兩家店售價相差 " + r.answer + unitOf(r) + "。"; },
    "quantity-word-L5-05": function (r) {
      const t = tk(r.stem), p = pctOf(t[0]), dd = t[1], d = dispFor(r.stem), g = gcd(p, 100 - p), m = p / g, n = (100 - p) / g, one = qDiv(dd, Qn(n - m));
      ck(qMul(one, Qn(m + n)), r.answer);
      return "大蘋果和小蘋果的重量比是 " + pn(p) + ":" + pn(100 - p) + ",化簡成 " + m + ":" + n + "。\n小蘋果比大蘋果多 " + (n - m) + " 份,是 " + d(dd) + " 公斤,1 份 = " + d(dd) + " ÷ " + (n - m) + " = " + d(one) + " 公斤。\n全部 " + (m + n) + " 份 = " + d(one) + " × " + (m + n) + " = " + r.answer + unitOf(r) + "。";
    },
    "quantity-word-L4-06": function (r) { const t = tk(r.stem), c = t[1], p = pctOf(t[2]), d = dispFor(r.stem), one = qDiv(c, Qn(p)); ck(qMul(one, Qn(100)), r.answer); return "用 1% 想:" + pn(p) + "% 是 " + d(c) + " 元,1% = " + d(c) + " ÷ " + pn(p) + " = " + d(one) + " 元。\n100% = " + d(one) + " × 100 = " + r.answer + unitOf(r) + "。"; },
    "quantity-word-L5-07": function (r) { const t = tk(r.stem), p = pctOf(t[0]), S = t[1], d = dispFor(r.stem), one = qDiv(S, Qn(200 + p)); ck(qMul(one, Qn(100)), r.answer); return "設甲是 100 份,乙多 " + pn(p) + "% 就是 " + pn(100 + p) + " 份,兩人共 " + pn(200 + p) + " 份。\n" + pn(200 + p) + " 份是 " + d(S) + " 公斤,1 份 = " + d(one) + " 公斤,甲(100 份)= " + r.answer + unitOf(r) + "。"; }
  };


  /* PRE（解法一的方法說明） */
PRE["quantity-single-L2-02"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-multi-L2-01"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-tf-L1-01"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-tf-L3-03"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-tf-L4-04"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-tf-L5-05"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-fill-L2-02"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-fill-L3-03"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-fill-L5-05"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-calc-L1-01"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-calc-L2-02"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-word-L3-02"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-word-L4-04"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-word-L5-05"] = function () { return "方法:比較量 = 基準量 × 百分率;百分率 = 比較量 ÷ 基準量;基準量 = 比較量 ÷ 百分率。\n"; };
PRE["quantity-tf-L2-06"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["quantity-fill-L4-07"] = function () { return "方法:先看 □ 站在算式的哪個位置,再用逆運算(加減互逆、乘除互逆)把 □ 單獨留在一邊。\n"; };
PRE["quantity-single-L3-06"] = function () { return "想法:已知的是「□ 的幾% 是多少」,□ 本身是基準量,要用除法反求。\n"; };
PRE["quantity-word-L4-06"] = function () { return "想法:打折後的錢是原價的幾%,它就是比較量,原價是基準量。\n"; };
PRE["quantity-single-L3-03"] = function () { return "想法:已知的是比較量,要求的是基準量。" + String.fromCharCode(10); };
PRE["quantity-multi-L3-03"] = function () { return "想法:折扣和百分率的說法,都可以用具體例子檢查。" + String.fromCharCode(10); };
PRE["quantity-calc-L3-03"] = function () { return "想法:倍數 = 比較量 ÷ 基準量。" + String.fromCharCode(10); };
PRE["quantity-calc-L5-05"] = function () { return "想法:兩次減少都是以剩下的量為基準。" + String.fromCharCode(10); };
PRE["quantity-word-L2-01"] = function () { return "想法:幾折就是十分之幾,把原價平分成 10 份來看。" + String.fromCharCode(10); };
PRE["quantity-calc-L5-05"] = function () { return "想法:第二次是拿「剩下的」來算百分率,不是拿原來全部的量來算。" + String.fromCharCode(10); };
  ExamBank.register(T, "quantity-basic", single.concat(multi, tf, fill, calc, word, boxes));
})();
