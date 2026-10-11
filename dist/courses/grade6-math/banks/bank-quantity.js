/* 題庫：quantity 基準量、比較量、倍數關係、百分率、折扣、反求基準量（對應舊單元 上5）
   題庫工 A 自編。「打 N 折」= 原價的 N0%（例：8 折＝80%，85 折＝85%）。 */
(function () {
  "use strict";
  const K = ExamKit;
  const int = K.int, pick = K.pick, shuffle = K.shuffle, gcd = K.gcd;
  const T = "quantity";
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
  function pc(x) { return K.num(x) + "%"; }
  const PCT = ["%", "％"];
  /* 折扣：dp 為百分率，zhe 為「幾折」的說法 */
  const DP = [60, 70, 75, 80, 85, 90];
  function zhe(dp) { return K.num(dp / 10); }

  const single = [
    mk("single", 1, "basic", function () {
      const B = pick([20, 25, 40, 50, 80, 200]);
      let p, c; do { p = int(1, 19) * 5; c = B * p / 100; } while (!Number.isInteger(c) || p >= 100);
      const r = S(pc(p), [pc(p / 10), pc(100 - p), pc(p * 10), pc(p + 10), pc(Math.max(5, p - 5))]);
      r.stem = "六年級某班有 " + B + " 人,其中女生有 " + c + " 人。女生占全班人數的百分之幾?";
      r.explain = "基準量是全班人數 " + B + ",比較量是女生人數 " + c + "。\n百分率 = 比較量 ÷ 基準量 = " + c + " ÷ " + B + " = " + K.num(c / B) + " = " + pc(p) + "。";
      return r;
    }),
    mk("single", 2, "basic", function () {
      let B, dp, price;
      do { B = 20 * int(10, 60); dp = pick(DP); price = B * dp / 100; } while (!Number.isInteger(price));
      const r = S(String(price), [K.num(B * (100 - dp) / 100), K.num(B * dp / 10), K.num(B - dp / 10), K.num(B * dp / 1000)]);
      r.stem = "一件外套原價 " + B + " 元,打 " + zhe(dp) + " 折出售,售價是多少元?";
      r.explain = "打 " + zhe(dp) + " 折 = 原價的 " + dp + "%。\n售價 = " + B + " × " + dp + "% = " + B + " × " + K.num(dp / 100) + " = " + price + " 元。";
      return r;
    }),
    mk("single", 3, "trap", function () {
      const p = pick([20, 25, 40, 50, 60, 75, 80]);
      let B, c; do { B = 20 * int(3, 25); c = B * p / 100; } while (!Number.isInteger(c));
      const r = S(String(B), [K.num(c * p / 100), String(c * p), K.num(c * (100 - p) / 100), String(c + p), String(c * 2), K.num(c * (100 + p) / 100), String(c * 10), K.num(c + c * p / 100 + p)]);
      r.stem = "某班近視的同學有 " + c + " 人,占全班人數的 " + p + "%。全班有幾人?";
      r.explain = "全班人數是基準量(未知),近視人數 " + c + " 是比較量。\n基準量 = 比較量 ÷ 百分率 = " + c + " ÷ " + p + "% = " + c + " ÷ " + K.num(p / 100) + " = " + B + " 人。\n驗算:" + B + " × " + p + "% = " + c + "。";
      r.trapNote = "常見錯誤:看到「占 " + p + "%」就把 " + c + " × " + p + "%,得到 " + K.num(c * p / 100) + "。" + c + " 是「比較量」,全班人數才是基準量,要用除法反求。";
      return r;
    }),
    mk("single", 4, "trap", function () {
      const p = pick([10, 20, 25, 30, 40]), B = 400 * int(1, 5);
      const cur = B * (10000 - p * p) / 10000;
      const r = S(K.num(cur), [String(B), K.num(B * (100 - p) / 100), K.num(B * (100 + p) / 100), K.num(B * (100 - 2 * p) / 100)]);
      r.stem = "某商品原價 " + B + " 元,先漲價 " + p + "%,後來又降價 " + p + "%,現在的價錢是多少元?";
      r.explain = "漲價後:" + B + " × (1+" + p + "%) = " + K.num(B * (100 + p) / 100) + " 元。\n再降 " + p + "%(基準量變成漲價後的價錢):" + K.num(B * (100 + p) / 100) + " × (1-" + p + "%) = " + K.num(cur) + " 元。";
      r.trapNote = "常見錯誤:認為漲 " + p + "% 再降 " + p + "% 就會回到原價 " + B + " 元。兩次的基準量不同(第二次是以漲價後的價錢為基準),所以現價是 " + K.num(cur) + " 元,比原價少。";
      return r;
    }),
    mk("single", 5, "extend", function () {
      let C, x, dp, price, profit;
      do { C = 20 * int(10, 50); x = pick([20, 25, 40, 50]); dp = pick([75, 80, 85, 90]); price = C * (100 + x) * dp / 10000; profit = price - C; } while (!Number.isInteger(price) || profit <= 0);
      const r = S(String(profit), [K.num(C * x / 100), String(price), K.num(C * (100 - dp) / 100), K.num(C * (100 + x) / 100 - C * dp / 100)]);
      r.stem = "百貨店進貨價每件 " + C + " 元,定價比進貨價多 " + x + "%,後來打 " + zhe(dp) + " 折出售。賣出一件賺多少元?";
      r.explain = "定價 = " + C + " × (1+" + x + "%) = " + K.num(C * (100 + x) / 100) + " 元。\n打 " + zhe(dp) + " 折的售價 = " + K.num(C * (100 + x) / 100) + " × " + dp + "% = " + price + " 元。\n賺 " + price + " - " + C + " = " + profit + " 元。";
      return r;
    })
  ];

  function ev(e) { return Function("return (" + e.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)").replace(/÷/g, "/").replace(/×/g, "*") + ")")(); }

  const multi = [
    mk("multi", 2, "basic", function () {
      const B = pick([20, 25, 40, 50, 80]);
      let p, c; do { p = int(2, 18) * 5; c = B * p / 100; } while (!Number.isInteger(c) || p === 50);
      const trues = ["基準量是全班人數 " + B + " 人", "比較量是女生人數 " + c + " 人", "女生占全班的 " + pc(p), "男生占全班的 " + pc(100 - p)];
      const falses = ["基準量是女生人數 " + c + " 人", "比較量是全班人數 " + B + " 人", "女生占全班的 " + pc(p / 10), "男生占全班的 " + pc(p)];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("某班有 " + B + " 人,其中女生 " + c + " 人。下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "全班人數是整體,是基準量;女生人數是部分,是比較量。女生占 " + c + " ÷ " + B + " = " + pc(p) + ",男生占 100% - " + pc(p) + " = " + pc(100 - p) + "。\n正確的敘述是:" + goods.join(";") + "。");
    }),
    mk("multi", 3, "basic", function () {
      const p = pick([20, 25, 50]), B = 20 * int(3, 40);
      const trues = [B + " × " + p + "%", B + " × " + K.num(p / 100), B + " × " + p + " ÷ 100", B + " ÷ " + (100 / p)];
      const falses = [B + " ÷ " + p + "%", B + " × " + p, B + " ÷ " + p, B + " + " + p + "%"];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("要求 " + B + " 的 " + p + "%,下列哪些算式可以求出答案?選出所有正確的。", goods, bads,
        B + " 的 " + p + "% = " + B + " × " + K.num(p / 100) + " = " + K.num(B * p / 100) + "。" + goods.join("、") + " 的結果都是 " + K.num(B * p / 100) + "。\n其他選項是用除法、或沒有把百分率換成小數(分數),結果不是 " + K.num(B * p / 100) + "。");
    }),
    mk("multi", 3, "trap", function () {
      const d1 = int(6, 9), d2 = int(6, 9), p = pick([10, 20, 25, 30]);
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
      const d = pick([6, 7, 8, 9]), dp = d * 10, orig = 100 * int(2, 12), P = orig * dp / 100;
      const goods = shuffle([P + " ÷ " + dp + "%", P + " ÷ " + K.num(dp / 100), P + " × 100 ÷ " + dp]).slice(0, int(2, 3));
      const bads = shuffle([P + " × " + dp + "%", P + " ÷ (100% - " + dp + "%)", P + " + " + P + " × (100% - " + dp + "%)"]).slice(0, 2);
      return M("某商品打 " + d + " 折之後,售價是 " + P + " 元。下列哪些算式可以求出原價?選出所有正確的。", goods, bads,
        "打 " + d + " 折 = 原價的 " + dp + "%,售價 " + P + " 元是比較量,原價是基準量。\n原價 = " + P + " ÷ " + dp + "% = " + orig + " 元。" + goods.join("、") + " 的結果都是 " + orig + "。",
        "常見錯誤:用 " + P + " × " + dp + "%(乘),或用「100% - " + dp + "%」去除。打折後的價錢是原價的 " + dp + "%,所以要「除以 " + dp + "%」才能還原。");
    }),
    mk("multi", 5, "extend", function () {
      let p, q, B, r, cur;
      do { p = pick([10, 20, 30, 40]); q = pick([10, 20, 25, 30]); B = 400 * int(1, 5); r = (100 + p) * (100 - q) / 100; cur = B * r / 100; } while (!Number.isInteger(cur) || r === 100);
      const diff = Math.abs(cur - B);
      const trues = ["現價是 " + K.num(cur) + " 元", "現價是原價的 " + pc(r), "現價比原價" + (r < 100 ? "低" : "高"), "現價和原價相差 " + K.num(diff) + " 元"];
      const falses = ["現價是 " + K.num(B * (100 + p - q) / 100) + " 元", "現價和原價相同", "現價是原價的 " + pc(100 + p - q), "現價比原價" + (r < 100 ? "高" : "低")];
      const goods = shuffle(trues).slice(0, int(2, 3)), bads = shuffle(falses).slice(0, 2);
      return M("某商品原價 " + B + " 元,先漲價 " + p + "%,再降價 " + q + "%。下列敘述,哪些是正確的?選出所有正確的。", goods, bads,
        "漲價後是原價的 " + (100 + p) + "%,再降 " + q + "% 是以漲價後為基準:(" + (100 + p) + "%) × (" + (100 - q) + "%) = " + pc(r) + "。\n現價 = " + B + " × " + pc(r) + " = " + K.num(cur) + " 元,和原價相差 " + K.num(diff) + " 元,現價比原價" + (r < 100 ? "低" : "高") + "。\n正確的敘述是:" + goods.join(";") + "。");
    })
  ];

  const tf = [
    mk("tf", 1, "basic", function () {
      const B = 20 * int(2, 40), p = pick([10, 20, 25, 30, 40, 50, 60, 75]);
      const c = B * p / 100;
      const right = Math.random() < 0.5, x = right ? c : pick([c * 10, c / 10]);
      return { stem: B + " 的 " + p + "% 是 " + K.num(x) + "。", answer: right,
        explain: B + " × " + p + "% = " + B + " × " + K.num(p / 100) + " = " + K.num(c) + (right ? ",敘述正確。" : ",不是 " + K.num(x) + "(小數點位置差了 10 倍)。") };
    }),
    mk("tf", 2, "trap", function () {
      const names = shuffle(["小華", "小美", "小明", "小芳"]), n1 = names[0], n2 = names[1], p = pick([20, 25, 40, 60, 75, 120, 150]);
      const right = Math.random() < 0.5;
      return { stem: "「" + n1 + "的存款是" + n2 + "的 " + p + "%」,這句話裡的基準量是" + (right ? n2 : n1) + "的存款。", answer: right,
        explain: "「A 是 B 的 p%」中,「的」字後面的 B 是基準量,A 是比較量。這裡「" + n1 + "的存款」是比較量,「" + n2 + "的存款」是基準量。" + (right ? "敘述正確。" : "敘述把基準量說成" + n1 + ",不正確。"),
        trapNote: "易錯:誤把題目先出現的那個量當成基準量。「是……的 p%」中,「的」後面那個量才是基準量(當作 100% 的那個)。" };
    }),
    mk("tf", 3, "trap", function () {
      const d = int(6, 9), right = Math.random() < 0.5;
      return { stem: right ? "打 " + d + " 折,就是只收原價的 " + (d * 10) + "%。" : "打 " + d + " 折,就是原價減少 " + d + "%。", answer: right,
        explain: right ? "打 " + d + " 折表示賣原價的 " + d + "/10 = " + (d * 10) + "%,敘述正確。" : "打 " + d + " 折是賣原價的 " + (d * 10) + "%,也就是減少 " + (100 - d * 10) + "%,不是減少 " + d + "%。",
        trapNote: "易錯:把「折」和「%」弄混。1 折 = 10%,打 " + d + " 折是原價的 " + (d * 10) + "%,減少的是 " + (100 - d * 10) + "%。" };
    }),
    mk("tf", 4, "basic", function () {
      let B, dp, price; do { B = 20 * int(5, 50); dp = pick(DP); price = B * dp / 100; } while (!Number.isInteger(price));
      const right = Math.random() < 0.5, x = right ? price : pick([K.num(B * (100 - dp) / 100), K.num(B * dp / 10)]);
      return { stem: "原價 " + B + " 元的商品打 " + zhe(dp) + " 折,售價是 " + x + " 元。", answer: right,
        explain: "售價 = " + B + " × " + dp + "% = " + price + " 元" + (right ? ",敘述正確。" : ",不是 " + x + " 元。") };
    }),
    mk("tf", 5, "extend", function () {
      let p, q, B, r, cur;
      do { p = pick([10, 20, 30, 40]); q = pick([10, 20, 25, 30]); B = 400 * int(1, 5); r = (100 + p) * (100 - q) / 100; cur = B * r / 100; } while (!Number.isInteger(cur) || r === 100);
      const right = Math.random() < 0.5, X = right ? cur : B * (100 + p - q) / 100;
      return { stem: "某商品原價 " + B + " 元,先漲價 " + p + "%,再降價 " + q + "%,現價是 " + K.num(X) + " 元。", answer: right,
        explain: "漲價後 " + K.num(B * (100 + p) / 100) + " 元,再降 " + q + "%:" + K.num(B * (100 + p) / 100) + " × " + (100 - q) + "% = " + K.num(cur) + " 元" + (right ? ",敘述正確。" : ",不是 " + K.num(X) + " 元(不能直接用 " + (100 + p - q) + "% 計算)。") };
    })
  ];

  const fill = [
    mk("fill", 1, "basic", function () {
      const B = pick([20, 25, 40, 50, 80, 200]);
      let p, c; do { p = int(1, 19) * 5; c = B * p / 100; } while (!Number.isInteger(c));
      return { stem: B + " 公斤的米,吃掉了 " + c + " 公斤。吃掉的米占全部的 ____%。", answer: String(p), accepted: [p + "%"], units: PCT,
        explain: "百分率 = 比較量 ÷ 基準量 = " + c + " ÷ " + B + " = " + K.num(c / B) + " = " + p + "%。" };
    }),
    mk("fill", 2, "basic", function () {
      const p = pick([5, 10, 15, 20, 25, 30, 40, 60, 75, 80]);
      let B; do { B = 20 * int(2, 40); } while (!Number.isInteger(B * p / 100));
      return { stem: B + " 的 " + p + "% 是 ____。", answer: K.num(B * p / 100), explain: B + " × " + p + "% = " + B + " × " + K.num(p / 100) + " = " + K.num(B * p / 100) + "。" };
    }),
    mk("fill", 3, "basic", function () {
      let B, dp, price; do { B = 20 * int(5, 50); dp = pick(DP); price = B * dp / 100; } while (!Number.isInteger(price));
      return { stem: "一雙球鞋原價 " + B + " 元,打 " + zhe(dp) + " 折後賣 ____ 元。", answer: K.num(price), units: ["元"], explain: "打 " + zhe(dp) + " 折 = " + dp + "%。售價 = " + B + " × " + dp + "% = " + price + " 元。" };
    }),
    mk("fill", 4, "trap", function () {
      const p = pick([20, 25, 40, 50, 60, 75, 80]);
      let B, c; do { B = 20 * int(3, 30); c = B * p / 100; } while (!Number.isInteger(c));
      return { stem: "某數的 " + p + "% 是 " + c + ",某數是 ____。", answer: String(B),
        explain: "某數是基準量," + c + " 是比較量。基準量 = " + c + " ÷ " + p + "% = " + c + " ÷ " + K.num(p / 100) + " = " + B + "。",
        trapNote: "常見錯誤:把 " + c + " × " + p + "%,得到 " + K.num(c * p / 100) + "。已知的是「某數的 " + p + "%」的結果,要求某數,必須用除法。" };
    }),
    mk("fill", 5, "extend", function () {
      const p = pick([10, 20, 25, 30, 40, 50]);
      let B, c; do { B = 20 * int(3, 40); c = B * (100 + p) / 100; } while (!Number.isInteger(c));
      return { stem: "某數增加 " + p + "% 之後是 " + c + ",某數是 ____。", answer: String(B),
        explain: "增加 " + p + "% 後是原來的 " + (100 + p) + "%。基準量 = " + c + " ÷ " + (100 + p) + "% = " + c + " ÷ " + K.num((100 + p) / 100) + " = " + B + "。" };
    })
  ];

  const calc = [
    mk("calc", 1, "basic", function () {
      const B = pick([20, 25, 40, 50, 80, 200]);
      let p, c; do { p = int(1, 19) * 5; c = B * p / 100; } while (!Number.isInteger(c));
      return { stem: "求 " + c + " 是 " + B + " 的百分之幾?", answer: String(p), accepted: [p + "%"], units: PCT, explain: "列式:" + c + " ÷ " + B + " = " + K.num(c / B) + " = " + p + "%。" };
    }),
    mk("calc", 2, "basic", function () {
      const p = pick([15, 35, 45, 12, 24, 36, 65, 85]), B = 10 * int(5, 80);
      return { stem: "求 " + B + " 的 " + p + "% 是多少?", answer: K.num(B * p / 100), explain: "列式:" + B + " × " + p + "% = " + B + " × " + K.num(p / 100) + " = " + K.num(B * p / 100) + "。" };
    }),
    mk("calc", 3, "basic", function () {
      const B = pick([4, 5, 8, 10, 12, 20, 25]), f = pick([1.5, 2.5, 3.5, 4.5, 0.5, 6.5]);
      const c = B * f;
      return { stem: "求 " + K.num(c) + " 是 " + B + " 的幾倍?", answer: K.num(f), accepted: acc2(f), units: ["倍"], explain: "倍數 = 比較量 ÷ 基準量 = " + K.num(c) + " ÷ " + B + " = " + K.num(f) + "。" };
    }),
    mk("calc", 4, "trap", function () {
      const p = pick([25, 60, 100, 150, 300, 400]);
      const ans = p * 100 / (100 + p);
      return { stem: "甲比乙多 " + p + "%,則乙比甲少百分之幾?", answer: K.num(ans), accepted: [K.num(ans) + "%"], units: PCT,
        explain: "設乙為 100,甲就是 100 × (1+" + p + "%) = " + (100 + p) + "。\n乙比甲少 " + (100 + p) + " - 100 = " + p + ",要以甲(" + (100 + p) + ")為基準:" + p + " ÷ " + (100 + p) + " = " + K.num(ans / 100) + " = " + K.num(ans) + "%。",
        trapNote: "常見錯誤:認為「甲比乙多 " + p + "%,乙就比甲少 " + p + "%」。兩句話的基準量不同(前一句以乙為基準,後一句以甲為基準),所以百分率不一樣。" };
    }),
    mk("calc", 5, "extend", function () {
      const p = pick([20, 25, 30, 40, 60]), q = pick([20, 25, 40, 50]);
      let N, left; do { N = 20 * int(5, 40); left = N * (100 - p) * (100 - q) / 10000; } while (!Number.isInteger(left));
      return { stem: "一本書共 " + N + " 頁,第一天看了全書的 " + p + "%,第二天看了剩下頁數的 " + q + "%。還剩幾頁沒看?", answer: String(left), units: ["頁"],
        explain: "第一天後剩 " + N + " × " + (100 - p) + "% = " + K.num(N * (100 - p) / 100) + " 頁。\n第二天看了剩下的 " + q + "%,還剩 " + (100 - q) + "%:" + K.num(N * (100 - p) / 100) + " × " + (100 - q) + "% = " + left + " 頁。" };
    })
  ];
  function acc2(f) { return Number.isInteger(f) ? [] : [K.num(f) + "倍"]; }

  const word = [
    mk("word", 2, "basic", function () {
      let B, dp, c; do { B = 20 * int(5, 50); dp = pick([60, 65, 70, 75, 80, 85, 90]); c = B * dp / 100; } while (!Number.isInteger(c));
      return { stem: "一個書包原價 " + B + " 元,特價 " + c + " 元。特價是原價的幾折?", answer: zhe(dp), units: ["折"],
        explain: "特價 ÷ 原價 = " + c + " ÷ " + B + " = " + K.num(dp / 100) + " = " + dp + "%,即 " + zhe(dp) + " 折。" };
    }),
    mk("word", 3, "basic", function () {
      const p = pick([20, 25, 30, 40, 45, 60]);
      let B; do { B = 100 * int(3, 30); } while (!Number.isInteger(B * p / 100));
      return { stem: "小明有零用錢 " + B + " 元,買文具用掉了 " + p + "%。他買文具用了多少元?", answer: K.num(B * p / 100), units: ["元"],
        explain: "用掉的錢 = 零用錢 × " + p + "% = " + B + " × " + K.num(p / 100) + " = " + K.num(B * p / 100) + " 元。" };
    }),
    mk("word", 4, "trap", function () {
      const p = pick([10, 20, 25, 40, 50]);
      let L, c; do { L = 20 * int(4, 40); c = L * (100 - p) / 100; } while (!Number.isInteger(c));
      return { stem: "某校今年的學生人數比去年減少 " + p + "%,今年有 " + c + " 人。去年有幾人?", answer: String(L), units: ["人"],
        explain: "去年是基準量(100%),今年是去年的 100% - " + p + "% = " + (100 - p) + "%。\n去年 = " + c + " ÷ " + (100 - p) + "% = " + c + " ÷ " + K.num((100 - p) / 100) + " = " + L + " 人。",
        trapNote: "常見錯誤:把今年人數 " + c + " 加上它的 " + p + "%,得到 " + K.num(c * (100 + p) / 100) + " 人。" + p + "% 是「去年」的 " + p + "%,不是今年的 " + p + "%,要用 " + c + " ÷ " + (100 - p) + "% 還原。" };
    }),
    mk("word", 4, "extend", function () {
      let B, d, m, a, b;
      do { B = 100 * int(4, 20); d = pick([75, 80, 85, 90]); m = 20 * int(3, 40); a = B * d / 100; b = B - m; } while (!Number.isInteger(a) || a === b || m >= B);
      return { stem: "同一件外套原價 " + B + " 元。甲店打 " + zhe(d) + " 折;乙店直接折價 " + m + " 元。兩家店的售價相差多少元?", answer: String(Math.abs(a - b)), units: ["元"],
        explain: "甲店售價 = " + B + " × " + d + "% = " + a + " 元。\n乙店售價 = " + B + " - " + m + " = " + b + " 元。\n相差 " + Math.max(a, b) + " - " + Math.min(a, b) + " = " + Math.abs(a - b) + " 元。" };
    }),
    mk("word", 5, "extend", function () {
      const p = pick([30, 35, 40, 45]), Tt = 20 * int(2, 12), d = Tt * (100 - 2 * p) / 100;
      return { stem: "某社團的男生占全部人數的 " + p + "%,女生比男生多 " + d + " 人。這個社團共有幾人?", answer: String(Tt), units: ["人"],
        explain: "男生占 " + p + "%,女生占 100% - " + p + "% = " + (100 - p) + "%,女生比男生多 " + (100 - p) + "% - " + p + "% = " + (100 - 2 * p) + "%。\n這 " + (100 - 2 * p) + "% 就是 " + d + " 人,全部人數 = " + d + " ÷ " + (100 - 2 * p) + "% = " + d + " ÷ " + K.num((100 - 2 * p) / 100) + " = " + Tt + " 人。" };
    })
  ];

  ExamBank.register(T, "quantity-basic", single.concat(multi, tf, fill, calc, word));
})();
