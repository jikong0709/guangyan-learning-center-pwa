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
  function pc(x) { return K.num(x) + "%"; }
  const PCT = ["%", "％"];
  const DP = [60, 70, 75, 80, 85, 90];
  function zhe(dp) { return K.num(dp / 10); }
  function decOK(q) { if (!K.qIsTerminating(q)) return false; const s = K.qDec(q); return s !== null && Math.abs(Number(s) - q.n / q.d) < 1e-12; }
  function places(q) { const s = K.qDec(q); const i = s === null ? -1 : s.indexOf("."); return i < 0 ? 0 : s.length - i - 1; }
  function ok2(q) { return decOK(q) && places(q) <= 2; }
  function dsh(q) { return decOK(q) ? K.qDec(q) : K.qMixed(q); }
  function shT(q, fl) { return fl === "dec" ? dsh(q) : fl === "mixed" ? K.qMixed(q) : qFrac(q); }
  function qa(q, fl) { const o = K.qAnswer(q, fl === "int" ? "frac" : fl); const v = q.n / q.d; o.accepted = o.accepted.filter(function (x) { return !/^\d+\.\d+$/.test(x) || Math.abs(Number(x) - v) < 1e-12; }); return o; }
  const FLQ = ["int", "dec", "frac", "mixed"], FQW = [0.5, 3, 4, 4];
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
      const bads = shuffle([P + " × " + dp + "%", P + " ÷ (100% - " + dp + "%)", P + " + " + P + " × (100% - " + dp + "%)"]).slice(0, 2);
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

  ExamBank.register(T, "quantity-basic", single.concat(multi, tf, fill, calc, word));
})();
