/* 題庫：circle-length 圓周率、圓周長、半圓／扇形弧長與周長（π 取 3.14）。題庫工 B */
(function () {
  "use strict";
  const S = [];
  function add(id, type, level, tag, gen) { S.push({ id: "circle-length-" + id, type, level, tag, gen }); }
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
  function tfq(k, pool) { const p = k.pick(pool); return { stem: p[0] + PI, answer: p[1], explain: p[2] }; }
  const PI = "（圓周率取 3.14）";

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const r = k.int(3, 15), n = k.num;
    const c = sc(k, n(6.28 * r), [n(3.14 * r), n(3.14 * r * r), n(6.28 * r * r), n(12.56 * r)]);
    return Object.assign(c, { stem: "一個圓的半徑是 " + r + " 公分，圓周率取 3.14，這個圓的周長是多少公分？",
      explain: "解析：圓周長 = 2 × 3.14 × 半徑 = 2 × 3.14 × " + r + " = " + n(6.28 * r) + "（公分）。" });
  });
  add("single-L1-02", "single", 1, "basic", function (k) {
    const d = k.int(4, 30), n = k.num;
    const c = sc(k, n(3.14 * d), [n(6.28 * d), n(3.14 * d * d), n(1.57 * d), n(3.14 * d + d)]);
    return Object.assign(c, { stem: "一個圓的直徑是 " + d + " 公分，圓周率取 3.14，這個圓的周長是多少公分？",
      explain: "解析：圓周長 = 3.14 × 直徑 = 3.14 × " + d + " = " + n(3.14 * d) + "（公分）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const d = 2 * k.int(2, 10), n = k.num, C = n(3.14 * d);
    const c = sc(k, d, [d / 2, 2 * d, n(C / 2), n(C * 3.14)]);
    return Object.assign(c, { stem: "一個圓的周長是 " + C + " 公分，圓周率取 3.14，這個圓的直徑是多少公分？",
      explain: "解析：周長 = 3.14 × 直徑，所以直徑 = " + C + " ÷ 3.14 = " + d + "（公分）。",
      trapNote: "把 " + C + " ÷ 3.14 的結果 " + d + " 當成半徑是常見錯誤；周長 ÷ 3.14 得到的是直徑，要再 ÷ 2 才是半徑 " + (d / 2) + "。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    const d = 2 * k.int(2, 12), n = k.num;
    const c = sc(k, n(2.57 * d), [n(1.57 * d), n(3.14 * d), n(3.14 * d + d), n(1.57 * d + d / 2)]);
    return Object.assign(c, { stem: "半圓形的直徑是 " + d + " 公分，圓周率取 3.14，這個半圓形的周長是多少公分？",
      explain: "解析：弧長 = 3.14 × " + d + " ÷ 2 = " + n(1.57 * d) + "；半圓周長還要加上直徑 " + d + "，共 " + n(1.57 * d) + " + " + d + " = " + n(2.57 * d) + "（公分）。",
      trapNote: "只算弧長 " + n(1.57 * d) + " 而忘記加直邊（直徑）" + d + " 公分，會少算；半圓的「周長」是封閉圖形的整圈邊長。" });
  });
  add("single-L4-01", "single", 4, "extend", function (k) {
    const r = k.pick([20, 25, 40, 50]), m = k.pick([10, 20, 50, 100]), n = k.num, D = 6.28 * r * m;
    const c = sc(k, n(D / 100), [n(D), n(3.14 * r * m / 100), n(D / 10), n(3.14 * r * r * m / 100)]);
    return Object.assign(c, { stem: "一個輪子的半徑是 " + r + " 公分，在地面上直線滾動 " + m + " 圈（圓周率取 3.14），輪子前進了幾公尺？",
      explain: "解析：滾一圈前進一個周長 2 × 3.14 × " + r + " = " + n(6.28 * r) + " 公分；" + m + " 圈 = " + n(D) + " 公分 = " + n(D / 100) + " 公尺。" });
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const a = k.int(3, 10), b = a + k.int(2, 8), n = k.num;
    const c = sc(k, n(6.28 * (b - a)), [n(3.14 * (b - a)), n(6.28 * (b + a)), n(3.14 * (b * b - a * a)), n(6.28 * b)]);
    return Object.assign(c, { stem: "小圓的半徑是 " + a + " 公分，大圓的半徑是 " + b + " 公分，圓周率取 3.14，大圓的周長比小圓的周長多幾公分？",
      explain: "解析：周長差 = 2 × 3.14 × " + b + " − 2 × 3.14 × " + a + " = 6.28 × (" + b + " − " + a + ") = " + n(6.28 * (b - a)) + "（公分）。" });
  });
  add("single-L5-01", "single", 5, "trap", function (k) {
    const t = k.int(2, 9), n = k.num, inc = n(6.28 * t);
    const c = sc(k, t, [2 * t, n(t / 2), inc, n(3.14 * t)]);
    return Object.assign(c, { stem: "一個圓的周長增加了 " + inc + " 公分，圓周率取 3.14，它的半徑增加了幾公分？",
      explain: "解析：周長 = 2 × 3.14 × 半徑，所以半徑增加量 = " + inc + " ÷ 6.28 = " + t + "（公分）。",
      trapNote: "用 " + inc + " ÷ 3.14 會得到 " + (2 * t) + "，那是「直徑」增加的量；題目問半徑，要再 ÷ 2 （即 ÷ 6.28）。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const c = mu(k,
      ["圓周率是圓周長除以直徑的結果", "不論圓大圓小，圓周率都是同一個固定的數", "圓周率除不盡，計算時常取 3.14 當近似值", "圓的周長大約是直徑的 3.14 倍"],
      ["圓越大，圓周率就越大", "圓周率等於圓周長除以半徑", "圓周率剛好等於 3.14，不是近似值", "圓的周長大約是半徑的 3.14 倍"]);
    return Object.assign(c, { stem: "關於圓周率，選出所有正確的敘述。" + PI,
      explain: "解析：圓周率 = 圓周長 ÷ 直徑，是固定的值（約 3.14159…，除不盡），所以周長約為直徑的 3.14 倍、半徑的 6.28 倍。" });
  });
  add("multi-L2-01", "multi", 2, "trap", function (k) {
    const r = k.int(3, 10), n = k.num;
    const c = mu(k,
      ["求圓周長要用 2 × 3.14 × 半徑", "半徑 " + r + " 公分的圓，周長是 " + n(6.28 * r) + " 公分", "周長的單位是公分，不是平方公分"],
      ["半徑 " + r + " 公分的圓，周長是 " + n(3.14 * r * r) + " 公分", "求圓周長要用 3.14 × 半徑 × 半徑", "周長的單位是平方公分"]);
    return Object.assign(c, { stem: "半徑是 " + r + " 公分的圓，選出所有正確的敘述。" + PI,
      explain: "解析：周長 = 2 × 3.14 × " + r + " = " + n(6.28 * r) + " 公分；3.14 × 半徑 × 半徑 是面積，單位為平方公分。",
      trapNote: "把周長和面積公式混用：3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + " 是面積，不是周長。" });
  });
  add("multi-L2-02", "multi", 2, "basic", function (k) {
    const d = k.int(5, 20), n = k.num;
    const c = mu(k,
      ["直徑 " + d + " 公分的圓，周長是 " + n(3.14 * d) + " 公分", "直徑 " + d + " 公分的圓，半徑是 " + n(d / 2) + " 公分", "周長 ÷ 直徑 = 圓周率"],
      ["直徑 " + d + " 公分的圓，周長是 " + n(6.28 * d) + " 公分", "直徑 " + d + " 公分的圓，半徑是 " + (2 * d) + " 公分", "周長 ÷ 半徑 = 圓周率"]);
    return Object.assign(c, { stem: "直徑是 " + d + " 公分的圓，選出所有正確的敘述。" + PI,
      explain: "解析：周長 = 3.14 × " + d + " = " + n(3.14 * d) + "；半徑 = " + d + " ÷ 2 = " + n(d / 2) + "；圓周率 = 周長 ÷ 直徑。" });
  });
  add("multi-L3-01", "multi", 3, "trap", function (k) {
    const d = 2 * k.int(3, 12), n = k.num;
    const c = mu(k,
      ["半圓的弧長是 " + n(1.57 * d) + " 公分", "半圓的周長是 " + n(2.57 * d) + " 公分", "半圓的周長比它的弧長多 " + d + " 公分", "半圓的周長 = 整圓周長的一半 + 直徑"],
      ["半圓的周長就是整圓周長的一半，也就是 " + n(1.57 * d) + " 公分", "半圓的周長是 " + n(3.14 * d + d) + " 公分", "半圓的周長是 " + n(1.57 * d + d / 2) + " 公分"]);
    return Object.assign(c, { stem: "直徑是 " + d + " 公分的半圓，選出所有正確的敘述。" + PI,
      explain: "解析：弧長 = 3.14 × " + d + " ÷ 2 = " + n(1.57 * d) + "；周長 = 弧長 + 直徑 = " + n(1.57 * d) + " + " + d + " = " + n(2.57 * d) + "。",
      trapNote: "「半圓的周長是圓周長的一半」是錯的：還要加上直徑那條直邊；也不能加上半徑。" });
  });
  add("multi-L4-01", "multi", 4, "extend", function (k) {
    const r1 = k.int(2, 6), m = k.int(2, 4), r2 = r1 * m, n = k.num;
    const c = mu(k,
      ["大圓的直徑是小圓的 " + m + " 倍", "大圓的周長是小圓的 " + m + " 倍", "大圓的周長比小圓多 " + n(6.28 * (r2 - r1)) + " 公分"],
      ["大圓的周長是小圓的 " + (m * m) + " 倍", "大圓的周長比小圓多 " + n(3.14 * (r2 - r1)) + " 公分", "大圓周長與小圓周長相差 " + n(6.28 * (r2 + r1)) + " 公分"]);
    return Object.assign(c, { stem: "小圓半徑 " + r1 + " 公分，大圓半徑 " + r2 + " 公分，選出所有正確的敘述。" + PI,
      explain: "解析：半徑、直徑、周長都成同倍數（" + m + " 倍）；周長差 = 6.28 × (" + r2 + " − " + r1 + ") = " + n(6.28 * (r2 - r1)) + "。面積才會是平方倍。" });
  });
  add("multi-L5-01", "multi", 5, "extend", function (k) {
    const r = k.pick([10, 20, 25, 50]), t = k.int(5, 30), n = k.num;
    const c = mu(k,
      ["輪子轉一圈前進 " + n(6.28 * r) + " 公分", "轉 " + t + " 圈共前進 " + n(6.28 * r * t) + " 公分", "轉 " + (2 * t) + " 圈前進的距離是轉 " + t + " 圈的 2 倍"],
      ["轉 " + t + " 圈共前進 " + n(3.14 * r * t) + " 公分", "輪子轉一圈前進 " + n(3.14 * r * r) + " 公分", "轉的圈數越多，輪子的周長就越長"]);
    return Object.assign(c, { stem: "一個輪子的半徑是 " + r + " 公分，在平地上直線滾動 " + t + " 圈，選出所有正確的敘述。" + PI,
      explain: "解析：轉一圈走一個周長 2 × 3.14 × " + r + " = " + n(6.28 * r) + "；" + t + " 圈 = " + n(6.28 * r) + " × " + t + " = " + n(6.28 * r * t) + "。圈數與距離成正比，輪子大小不變。" });
  });

  /* ---------- tf ---------- */
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    return tfq(k, [
      ["圓周率是圓周長除以直徑得到的固定數值。", true, "解析：圓周率 = 圓周長 ÷ 直徑，任何圓都一樣。"],
      ["圓周率等於圓周長除以半徑。", false, "解析：圓周率是周長 ÷ 直徑；周長 ÷ 半徑 約等於 6.28。"],
      ["大圓的圓周率比小圓的圓周率大。", false, "解析：所有圓的圓周率都相同。"],
      ["圓周率取 3.14 只是近似值，它其實除不盡。", true, "解析：圓周率是除不盡的數，3.14 是常用近似值。"],
      ["圓的周長一定比它的直徑長。", true, "解析：周長約是直徑的 3.14 倍，比直徑長。"]]);
  });
  add("tf-L2-01", "tf", 2, "basic", function (k) {
    const r = k.int(3, 12), n = k.num, ok = k.int(0, 1) === 1, v = ok ? n(6.28 * r) : n(3.14 * r);
    return { stem: "半徑 " + r + " 公分的圓，周長是 " + v + " 公分。" + PI, answer: ok,
      explain: "解析：周長 = 2 × 3.14 × " + r + " = " + n(6.28 * r) + " 公分，" + (ok ? "所以敘述正確。" : "敘述中的 " + v + " 少乘了 2，所以錯誤。") };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const m = k.int(2, 4), ok = k.int(0, 1) === 1, v = ok ? m : m * m;
    return { stem: "把圓的直徑變成原來的 " + m + " 倍，圓的周長會變成原來的 " + v + " 倍。" + PI, answer: ok,
      explain: "解析：周長 = 3.14 × 直徑，周長與直徑成正比，直徑 " + m + " 倍則周長也是 " + m + " 倍。",
      trapNote: "把「面積」的平方倍關係（" + m + "×" + m + " = " + (m * m) + " 倍）拿來套在周長上是常見錯誤；周長只是同倍數變化。" };
  });
  add("tf-L3-02", "tf", 3, "trap", function (k) {
    const d = 2 * k.int(2, 10), n = k.num, ok = k.int(0, 1) === 1, v = ok ? n(2.57 * d) : n(1.57 * d);
    return { stem: "直徑 " + d + " 公分的半圓形，周長是 " + v + " 公分。" + PI, answer: ok,
      explain: "解析：半圓周長 = 弧長 " + n(1.57 * d) + " + 直徑 " + d + " = " + n(2.57 * d) + " 公分。",
      trapNote: "只算弧長 " + n(1.57 * d) + " 公分就當作周長，漏掉直邊 " + d + " 公分。" };
  });
  add("tf-L4-01", "tf", 4, "extend", function (k) {
    const r = k.int(2, 8), m = k.int(2, 4), n = k.num, a = 6.28 * r, ok = k.int(0, 1) === 1, v = ok ? a * m : a * m * m;
    return { stem: "小圓周長是 " + n(a) + " 公分，大圓的半徑是小圓半徑的 " + m + " 倍，所以大圓周長是 " + n(v) + " 公分。" + PI, answer: ok,
      explain: "解析：半徑 " + m + " 倍，周長也是 " + m + " 倍：" + n(a) + " × " + m + " = " + n(a * m) + " 公分。" };
  });
  add("tf-L5-01", "tf", 5, "extend", function (k) {
    const a = k.int(2, 12), n = k.num, ok = k.int(0, 1) === 1, v = ok ? n(6.28 * a) : n(3.14 * a);
    return { stem: "操場的外圈跑道半徑比內圈多 " + a + " 公尺，外圈跑一圈會比內圈多 " + v + " 公尺。" + PI, answer: ok,
      explain: "解析：周長差 = 2 × 3.14 × " + a + " = " + n(6.28 * a) + " 公尺，與內圈原本多大無關。" };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const r = k.int(2, 20), n = k.num;
    return { stem: "半徑 " + r + " 公分的圓，周長是（　）公分。" + PI, answer: n(6.28 * r), units: ["公分", "cm"],
      explain: "解析：2 × 3.14 × " + r + " = " + n(6.28 * r) + "。" };
  });
  add("fill-L1-02", "fill", 1, "basic", function (k) {
    const d = k.int(3, 30), n = k.num;
    return { stem: "直徑 " + d + " 公分的圓，周長是（　）公分。" + PI, answer: n(3.14 * d), units: ["公分", "cm"],
      explain: "解析：3.14 × " + d + " = " + n(3.14 * d) + "。" };
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const r = k.int(3, 15), n = k.num, C = n(6.28 * r);
    return { stem: "圓的周長是 " + C + " 公分，半徑是（　）公分。" + PI, answer: String(r), units: ["公分", "cm"],
      explain: "解析：半徑 = 周長 ÷ 3.14 ÷ 2 = " + C + " ÷ 6.28 = " + r + "。" };
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const d = 2 * k.int(2, 12), n = k.num;
    return { stem: "直徑 " + d + " 公分的半圓形，周長是（　）公分。" + PI, answer: n(2.57 * d), units: ["公分", "cm"],
      explain: "解析：弧長 3.14 × " + d + " ÷ 2 = " + n(1.57 * d) + "，加直徑 " + d + "，得 " + n(2.57 * d) + "。",
      trapNote: "只寫 " + n(1.57 * d) + "（弧長）會漏掉直邊 " + d + " 公分。" };
  });
  add("fill-L3-02", "fill", 3, "basic", function (k) {
    const r = k.pick([10, 12, 15, 20, 25]), n = k.num;
    return { stem: "時鐘的分針長 " + r + " 公分，分針針尖轉一圈（走 1 小時）走過（　）公分。" + PI, answer: n(6.28 * r), units: ["公分", "cm"],
      explain: "解析：針尖轉一圈走的是半徑 " + r + " 公分的圓周：2 × 3.14 × " + r + " = " + n(6.28 * r) + "。" };
  });
  add("fill-L4-01", "fill", 4, "basic", function (k) {
    const d = k.pick([40, 50, 60, 80]), t = k.pick([10, 20, 25, 50]), n = k.num;
    return { stem: "車輪的直徑是 " + d + " 公分，滾動 " + t + " 圈前進（　）公尺。" + PI, answer: n(3.14 * d * t / 100), units: ["公尺", "m"],
      explain: "解析：一圈 3.14 × " + d + " = " + n(3.14 * d) + " 公分；" + t + " 圈 = " + n(3.14 * d * t) + " 公分 = " + n(3.14 * d * t / 100) + " 公尺。" };
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const d = k.int(4, 20), t = k.int(3, 8), n = k.num, L = n(3.14 * d * t);
    return { stem: "一條繩子剛好繞圓柱形水桶 " + t + " 圈，繩長 " + L + " 公分（不計接頭），水桶的直徑是（　）公分。" + PI, answer: String(d), units: ["公分", "cm"],
      explain: "解析：繞一圈 = " + L + " ÷ " + t + " = " + n(3.14 * d) + " 公分，直徑 = " + n(3.14 * d) + " ÷ 3.14 = " + d + "。" };
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const d = k.int(2, 25), n = k.num;
    return { stem: "圓周率取 3.14，計算直徑 " + d + " 公分的圓周長：3.14 × " + d, answer: n(3.14 * d), units: ["公分"],
      explain: "解析：列式 3.14 × " + d + " = " + n(3.14 * d) + "。" };
  });
  add("calc-L2-01", "calc", 2, "basic", function (k) {
    const r = k.int(3, 20), n = k.num;
    return { stem: "圓周率取 3.14，計算半徑 " + r + " 公分的圓周長：2 × 3.14 × " + r, answer: n(6.28 * r), units: ["公分"],
      explain: "解析：2 × 3.14 = 6.28，6.28 × " + r + " = " + n(6.28 * r) + "。" };
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const a = k.int(11, 38), b = k.pick([50, 100]) - a, n = k.num;
    return { stem: "圓周率取 3.14，用簡便方法計算：3.14 × " + a + " + 3.14 × " + b, answer: n(3.14 * (a + b)),
      explain: "解析：提出 3.14：3.14 × (" + a + " + " + b + ") = 3.14 × " + (a + b) + " = " + n(3.14 * (a + b)) + "。" };
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const d = 2 * k.int(3, 15), n = k.num;
    return { stem: "圓周率取 3.14，計算直徑 " + d + " 公分的半圓形周長：3.14 × " + d + " ÷ 2 + " + d, answer: n(2.57 * d), units: ["公分"],
      explain: "解析：弧長 3.14 × " + d + " ÷ 2 = " + n(1.57 * d) + "，再加直徑 " + d + "，得 " + n(2.57 * d) + "。",
      trapNote: "最後的「+ " + d + "」是直邊，漏掉就只剩弧長 " + n(1.57 * d) + "。" };
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const r = k.int(10, 40), w = k.int(1, 5), n = k.num;
    return { stem: "圓周率取 3.14，計算：2 × 3.14 × " + (r + w) + " − 2 × 3.14 × " + r, answer: n(6.28 * w), units: ["公尺", "公分"],
      explain: "解析：提出 6.28：6.28 × (" + (r + w) + " − " + r + ") = 6.28 × " + w + " = " + n(6.28 * w) + "。差只跟半徑差有關。" };
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const d = k.pick([40, 50, 60, 80, 100]), n = k.num;
    return { stem: "圓形桌面的直徑是 " + d + " 公分，要在桌子邊緣圍一圈花邊，花邊至少要多長？" + PI, answer: n(3.14 * d), units: ["公分", "cm"],
      explain: "解析：花邊長 = 圓周長 = 3.14 × " + d + " = " + n(3.14 * d) + "（公分）。" };
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const r = k.int(3, 15), n = k.num;
    return { stem: "公園有一座圓形花圃，半徑是 " + r + " 公尺，沿著花圃邊緣圍一圈籬笆，籬笆長幾公尺？" + PI, answer: n(6.28 * r), units: ["公尺", "m"],
      explain: "解析：2 × 3.14 × " + r + " = " + n(6.28 * r) + "（公尺）。" };
  });
  add("word-L2-02", "word", 2, "basic", function (k) {
    const r = k.int(4, 20), n = k.num, L = n(6.28 * r);
    return { stem: "小華把一條長 " + L + " 公分的鐵絲彎成一個圓（接頭不計），這個圓的半徑是幾公分？" + PI, answer: String(r), units: ["公分", "cm"],
      explain: "解析：半徑 = " + L + " ÷ 3.14 ÷ 2 = " + r + "（公分）。" };
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const d = 2 * k.int(3, 15), n = k.num;
    return { stem: "半圓形花圃的直徑是 " + d + " 公尺，花圃四周（包括直的那一邊）都要圍上籬笆，籬笆至少要多長？" + PI, answer: n(2.57 * d), units: ["公尺", "m"],
      explain: "解析：弧線 3.14 × " + d + " ÷ 2 = " + n(1.57 * d) + "，直邊 " + d + "，合計 " + n(2.57 * d) + "（公尺）。",
      trapNote: "只算弧線 " + n(1.57 * d) + " 公尺會漏掉直邊；題目寫「包括直的那一邊」就要加直徑。" };
  });
  add("word-L4-01", "word", 4, "basic", function (k) {
    const d = k.pick([40, 50, 60, 80]), t = k.pick([10, 20, 25, 50]), n = k.num;
    return { stem: "腳踏車輪的直徑是 " + d + " 公分，車輪在平地上轉 " + t + " 圈，車子前進幾公尺？" + PI, answer: n(3.14 * d * t / 100), units: ["公尺", "m"],
      explain: "解析：一圈 3.14 × " + d + " = " + n(3.14 * d) + " 公分，" + t + " 圈 = " + n(3.14 * d * t) + " 公分 = " + n(3.14 * d * t / 100) + " 公尺。" };
  });
  add("word-L4-02", "word", 4, "extend", function (k) {
    const d = k.int(6, 20), t = k.int(3, 6), n = k.num;
    return { stem: "用繩子把 " + t + " 個同樣大小的圓形水桶，各繞一圈（每桶直徑 " + d + " 公分）後綁緊，每個結要多用 10 公分繩子，共需多少公分繩子？" + PI, answer: n(3.14 * d * t + 10 * t), units: ["公分", "cm"],
      explain: "解析：每桶繩長 3.14 × " + d + " + 10 = " + n(3.14 * d + 10) + "，共 " + t + " 桶：" + n(3.14 * d + 10) + " × " + t + " = " + n(3.14 * d * t + 10 * t) + "（公分）。" };
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const r = k.int(20, 40), w = k.int(1, 2), n = k.num;
    return { stem: "圓形跑道每一道寬 " + w + " 公尺。第 1 道的跑步路線半徑是 " + r + " 公尺，比賽時第 3 道的選手沿著半徑更大的圓跑一圈，他比第 1 道的選手多跑幾公尺？（兩道圓心相同）" + PI, answer: n(6.28 * 2 * w), units: ["公尺", "m"],
      explain: "解析：第 3 道半徑比第 1 道多 2 × " + w + " = " + (2 * w) + " 公尺；多跑 2 × 3.14 × " + (2 * w) + " = " + n(6.28 * 2 * w) + "（公尺），與 " + r + " 公尺無關。" };
  });

  ExamBank.register("circle-length", "circle-length-main", S);
})();
