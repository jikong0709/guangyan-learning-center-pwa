/* 題庫：circle-area 圓面積、扇形面積、複合圖形面積（π 取 3.14）。題庫工 B */
(function () {
  "use strict";
  const S = [];
  function add(id, type, level, tag, gen) { S.push({ id: "circle-area-" + id, type, level, tag, gen }); }
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
  const PI = "（圓周率取 3.14）";
  const SQ = ["平方公分", "cm2", "cm²", "公分"];

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const r = k.int(2, 12), n = k.num;
    const c = sc(k, n(3.14 * r * r), [n(6.28 * r), n(3.14 * r), n(3.14 * 2 * r * 2 * r), n(6.28 * r * r)]);
    return Object.assign(c, { stem: "一個圓的半徑是 " + r + " 公分，圓周率取 3.14，這個圓的面積是多少平方公分？",
      explain: "解析：圓面積 = 3.14 × 半徑 × 半徑 = 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "（平方公分）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const d = 2 * k.int(2, 10), n = k.num, r = d / 2;
    const c = sc(k, n(3.14 * r * r), [n(3.14 * d * d), n(3.14 * d), n(3.14 * r), n(3.14 * d * r), n(6.28 * r * r)]);
    return Object.assign(c, { stem: "一個圓的直徑是 " + d + " 公分，圓周率取 3.14，這個圓的面積是多少平方公分？",
      explain: "解析：半徑 = " + d + " ÷ 2 = " + r + " 公分，面積 = 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "（平方公分）。",
      trapNote: "把直徑 " + d + " 直接當半徑代入，得到 3.14 × " + d + " × " + d + " = " + n(3.14 * d * d) + "，是正確答案的 4 倍。" });
  });
  add("single-L3-01", "single", 3, "extend", function (k) {
    const r = k.int(2, 10), n = k.num, C = n(6.28 * r);
    const c = sc(k, n(3.14 * r * r), [n(3.14 * 4 * r * r), n(6.28 * r * r), n(3.14 * r), n(3.14 * r * r / 2)]);
    return Object.assign(c, { stem: "一個圓的周長是 " + C + " 公分，圓周率取 3.14，這個圓的面積是多少平方公分？",
      explain: "解析：半徑 = " + C + " ÷ 3.14 ÷ 2 = " + r + " 公分；面積 = 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "（平方公分）。" });
  });
  add("single-L3-02", "single", 3, "trap", function (k) {
    const r = k.int(2, 10), n = k.num;
    const c = sc(k, n(3.14 * r * r / 2), [n(3.14 * r * r), n(3.14 * r * r / 2 + 2 * r), n(3.14 * r), n(3.14 * r * r / 4)]);
    return Object.assign(c, { stem: "半徑是 " + r + " 公分的半圓形，圓周率取 3.14，面積是多少平方公分？",
      explain: "解析：半圓面積是整圓的一半：3.14 × " + r + " × " + r + " ÷ 2 = " + n(3.14 * r * r / 2) + "（平方公分）。",
      trapNote: "直接用整圓面積 " + n(3.14 * r * r) + " 而忘記 ÷ 2；也不能把周長裡的直徑 " + (2 * r) + " 加進面積（面積與周長不能相加）。" });
  });
  add("single-L4-01", "single", 4, "trap", function (k) {
    const r = k.int(2, 8), R = r + k.int(1, 5), n = k.num;
    const c = sc(k, n(3.14 * (R * R - r * r)), [n(3.14 * (R - r) * (R - r)), n(3.14 * R * R - r * r), n(3.14 * R * R), n(3.14 * (R * R + r * r))]);
    return Object.assign(c, { stem: "圓環（像墊圈）的外圓半徑是 " + R + " 公分，內圓半徑是 " + r + " 公分，圓周率取 3.14，圓環的面積是多少平方公分？",
      explain: "解析：圓環面積 = 外圓面積 − 內圓面積 = 3.14 × " + R + " × " + R + " − 3.14 × " + r + " × " + r + " = 3.14 × (" + (R * R) + " − " + (r * r) + ") = " + n(3.14 * (R * R - r * r)) + "（平方公分）。",
      trapNote: "把半徑差 " + (R - r) + " 平方（3.14 × " + (R - r) + "² = " + n(3.14 * (R - r) * (R - r)) + "）是常見錯誤；要先算兩個圓各自的面積再相減。" });
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const a = 2 * k.int(2, 8), n = k.num, h = a / 2;
    const c = sc(k, n(a * a - 3.14 * h * h), [n(3.14 * h * h), n(a * a - 3.14 * a), n(a * a - 3.14 * h), n(a * a / 2)]);
    return Object.assign(c, { stem: "在邊長 " + a + " 公分的正方形裡畫一個最大的圓，圓周率取 3.14，正方形中圓以外的部分面積是多少平方公分？",
      explain: "解析：最大圓的直徑 = 邊長 " + a + "，半徑 " + h + "；圓面積 = 3.14 × " + h + " × " + h + " = " + n(3.14 * h * h) + "；正方形面積 " + (a * a) + "；相減 = " + n(a * a - 3.14 * h * h) + "（平方公分）。" });
  });
  add("single-L5-01", "single", 5, "extend", function (k) {
    const r = k.int(2, 12), n = k.num, A = n(3.14 * r * r);
    const c = sc(k, n(6.28 * r), [r * r, n(3.14 * r), n(6.28 * r * r), n(r * r / 2), n(12.56 * r)]);
    return Object.assign(c, { stem: "一個圓的面積是 " + A + " 平方公分，圓周率取 3.14，這個圓的周長是多少公分？",
      explain: "解析：半徑² = " + A + " ÷ 3.14 = " + (r * r) + "，所以半徑 = " + r + " 公分；周長 = 2 × 3.14 × " + r + " = " + n(6.28 * r) + "（公分）。" });
  });
  add("single-L5-02", "single", 5, "trap", function (k) {
    const r = k.int(2, 8), t = k.int(1, 4), n = k.num, inc = 3.14 * ((r + t) * (r + t) - r * r);
    const c = sc(k, n(inc), [n(3.14 * t * t), n(3.14 * (r + t) * (r + t)), n(6.28 * t), n(3.14 * r * t), n(3.14 * r * r), n(3.14 * (r + t) * t)]);
    return Object.assign(c, { stem: "一個圓的半徑從 " + r + " 公分增加到 " + (r + t) + " 公分，圓周率取 3.14，面積增加了多少平方公分？",
      explain: "解析：原面積 3.14 × " + r + "² = " + n(3.14 * r * r) + "；新面積 3.14 × " + (r + t) + "² = " + n(3.14 * (r + t) * (r + t)) + "；增加 " + n(inc) + "（平方公分）。",
      trapNote: "半徑增加 " + t + " 公分，面積並不是增加 3.14 × " + t + " × " + t + " = " + n(3.14 * t * t) + "；要用新面積減去舊面積。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const r = k.int(3, 10), n = k.num;
    const c = mu(k,
      ["圓面積是 " + n(3.14 * r * r) + " 平方公分", "直徑是 " + (2 * r) + " 公分", "面積的單位是平方公分"],
      ["圓面積是 " + n(6.28 * r) + " 平方公分", "圓面積是 " + n(3.14 * 2 * r * 2 * r) + " 平方公分", "面積的單位是公分"]);
    return Object.assign(c, { stem: "半徑是 " + r + " 公分的圓，選出所有正確的敘述。" + PI,
      explain: "解析：面積 = 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "；" + n(6.28 * r) + " 是周長的數值；直徑 = 2 × " + r + "。" });
  });
  add("multi-L2-01", "multi", 2, "trap", function (k) {
    const m = k.int(2, 5);
    const c = mu(k,
      ["圓的直徑變成 " + m + " 倍", "圓的周長變成 " + m + " 倍", "圓的面積變成 " + (m * m) + " 倍"],
      ["圓的面積變成 " + m + " 倍", "圓的面積變成 " + (m + 1) + " 倍", "圓的周長變成 " + (m * m) + " 倍"]);
    return Object.assign(c, { stem: "把一個圓的半徑變成原來的 " + m + " 倍，選出所有正確的敘述。",
      explain: "解析：直徑、周長是一次方，跟著變成 " + m + " 倍；面積含半徑 × 半徑，變成 " + m + " × " + m + " = " + (m * m) + " 倍。",
      trapNote: "半徑變 " + m + " 倍，面積不是 " + m + " 倍而是 " + (m * m) + " 倍（平方倍）；周長則只是 " + m + " 倍。" });
  });
  add("multi-L3-01", "multi", 3, "basic", function (k) {
    const r = 2 * k.int(2, 5), n = k.num;
    const c = mu(k,
      ["半圓面積是 " + n(3.14 * r * r / 2) + " 平方公分", "半圓面積是同半徑整圓面積的一半", "四分之一圓面積是 " + n(3.14 * r * r / 4) + " 平方公分"],
      ["半圓面積是 " + n(3.14 * r * r) + " 平方公分", "四分之一圓面積是整圓面積的一半", "半圓面積是 " + n(3.14 * r) + " 平方公分"]);
    return Object.assign(c, { stem: "半徑是 " + r + " 公分的圓，選出所有正確的敘述。" + PI,
      explain: "解析：整圓面積 3.14 × " + r + "² = " + n(3.14 * r * r) + "；半圓 ÷ 2 = " + n(3.14 * r * r / 2) + "；四分之一圓 ÷ 4 = " + n(3.14 * r * r / 4) + "。" });
  });
  add("multi-L4-01", "multi", 4, "trap", function (k) {
    const r = k.int(2, 6), R = 2 * r, n = k.num;
    const c = mu(k,
      ["大圓面積是小圓面積的 4 倍", "大圓周長是小圓周長的 2 倍", "大圓面積比小圓面積多 " + n(3.14 * (R * R - r * r)) + " 平方公分"],
      ["大圓面積比小圓面積多 " + n(3.14 * (R - r) * (R - r)) + " 平方公分", "大圓面積是小圓面積的 2 倍", "大圓面積比小圓面積多 " + n(3.14 * (R - r)) + " 平方公分"]);
    return Object.assign(c, { stem: "小圓半徑 " + r + " 公分，大圓半徑 " + R + " 公分，選出所有正確的敘述。" + PI,
      explain: "解析：半徑 2 倍，周長 2 倍、面積 4 倍；面積差 = 3.14 × (" + R + "² − " + r + "²) = " + n(3.14 * (R * R - r * r)) + "。",
      trapNote: "面積差要「各自平方後再減」，不是半徑差的平方（" + n(3.14 * (R - r) * (R - r)) + "）。" });
  });
  add("multi-L4-02", "multi", 4, "extend", function (k) {
    const a = 2 * k.int(3, 8), n = k.num, h = a / 2;
    const c = mu(k,
      ["最大圓的半徑是 " + h + " 公分", "最大圓的面積是 " + n(3.14 * h * h) + " 平方公分", "圓外的部分面積是 " + n(a * a - 3.14 * h * h) + " 平方公分", "正方形面積是 " + (a * a) + " 平方公分"],
      ["最大圓的半徑是 " + a + " 公分", "最大圓的面積是 " + n(3.14 * a * a) + " 平方公分", "圓外的部分面積是 " + n(a * a - 3.14 * a) + " 平方公分"]);
    return Object.assign(c, { stem: "在邊長 " + a + " 公分的正方形裡畫一個最大的圓，選出所有正確的敘述。" + PI,
      explain: "解析：最大圓直徑等於邊長 " + a + "，半徑 " + h + "；圓面積 " + n(3.14 * h * h) + "；圓外面積 = " + (a * a) + " − " + n(3.14 * h * h) + " = " + n(a * a - 3.14 * h * h) + "。" });
  });

  /* ---------- tf ---------- */
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const r = k.int(3, 12), n = k.num, ok = k.int(0, 1) === 1, v = ok ? n(3.14 * r * r) : n(k.pick([6.28 * r, 3.14 * r]));
    return { stem: "半徑 " + r + " 公分的圓，面積是 " + v + " 平方公分。" + PI, answer: ok,
      explain: "解析：面積 = 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + " 平方公分。" + (ok ? "" : v + " 是用周長或 3.14 × 半徑算出來的，不是面積。") };
  });
  add("tf-L2-01", "tf", 2, "trap", function (k) {
    const m = k.int(2, 5), ok = k.int(0, 1) === 1, v = ok ? m * m : m;
    return { stem: "圓的半徑變成原來的 " + m + " 倍，面積會變成原來的 " + v + " 倍。" + PI, answer: ok,
      explain: "解析：面積 = 3.14 × 半徑 × 半徑，半徑 " + m + " 倍，面積變成 " + m + " × " + m + " = " + (m * m) + " 倍。",
      trapNote: "周長是半徑 " + m + " 倍就跟著 " + m + " 倍，但面積要平方，所以是 " + (m * m) + " 倍。" };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const d = 2 * k.int(2, 10), n = k.num, ok = k.int(0, 1) === 1, v = ok ? n(3.14 * (d / 2) * (d / 2)) : n(3.14 * d * d);
    return { stem: "直徑 " + d + " 公分的圓，面積是 " + v + " 平方公分。" + PI, answer: ok,
      explain: "解析：半徑 " + (d / 2) + " 公分，面積 = 3.14 × " + (d / 2) + " × " + (d / 2) + " = " + n(3.14 * (d / 2) * (d / 2)) + " 平方公分。",
      trapNote: "把直徑 " + d + " 當半徑代入（3.14 × " + d + " × " + d + " = " + n(3.14 * d * d) + "）會多出 4 倍。" };
  });
  add("tf-L3-02", "tf", 3, "basic", function (k) {
    const r = k.int(2, 10), n = k.num, ok = k.int(0, 1) === 1, v = ok ? n(3.14 * r * r / 2) : n(3.14 * r * r);
    return { stem: "半徑 " + r + " 公分的半圓形，面積是 " + v + " 平方公分。" + PI, answer: ok,
      explain: "解析：半圓面積 = 3.14 × " + r + " × " + r + " ÷ 2 = " + n(3.14 * r * r / 2) + " 平方公分。" };
  });
  add("tf-L4-01", "tf", 4, "extend", function (k) {
    const a = 2 * k.int(2, 9), ok = k.int(0, 1) === 1, v = ok ? "0.785" : k.pick(["0.5", "0.628", "3.14"]);
    return { stem: "在邊長 " + a + " 公分的正方形裡畫最大的圓，圓面積是正方形面積的 " + v + " 倍。（圓周率取 3.14）", answer: ok,
      explain: "解析：圓面積 3.14 × (" + (a / 2) + ")² = " + (3.14 * (a / 2) * (a / 2)).toFixed(2) + "，正方形 " + (a * a) + "，比值 = 3.14 ÷ 4 = 0.785，與邊長多大無關。" };
  });
  add("tf-L5-01", "tf", 5, "trap", function (k) {
    const r = k.int(2, 8), R = r + k.int(2, 5), n = k.num, ok = k.int(0, 1) === 1, v = ok ? n(3.14 * (R * R - r * r)) : n(3.14 * (R - r) * (R - r));
    return { stem: "外圓半徑 " + R + " 公分、內圓半徑 " + r + " 公分的圓環，面積是 " + v + " 平方公分。" + PI, answer: ok,
      explain: "解析：圓環面積 = 3.14 × (" + R + "² − " + r + "²) = " + n(3.14 * (R * R - r * r)) + " 平方公分。",
      trapNote: "用半徑差的平方 3.14 × " + (R - r) + "² = " + n(3.14 * (R - r) * (R - r)) + " 是錯的；(R − r)² 不等於 R² − r²。" };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const r = k.int(2, 15), n = k.num;
    return { stem: "半徑 " + r + " 公分的圓，面積是（　）平方公分。" + PI, answer: n(3.14 * r * r), units: SQ,
      explain: "解析：3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "。" };
  });
  add("fill-L2-01", "fill", 2, "trap", function (k) {
    const d = 2 * k.int(2, 12), n = k.num, r = d / 2;
    return { stem: "直徑 " + d + " 公分的圓，面積是（　）平方公分。" + PI, answer: n(3.14 * r * r), units: SQ,
      explain: "解析：半徑 " + r + " 公分，面積 = 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "。",
      trapNote: "直接用直徑 " + d + " 計算（得 " + n(3.14 * d * d) + "）是錯的，要先除以 2 變成半徑。" };
  });
  add("fill-L2-02", "fill", 2, "basic", function (k) {
    const r = k.int(2, 15), n = k.num;
    return { stem: "圓的面積是 " + n(3.14 * r * r) + " 平方公分，半徑是（　）公分。" + PI, answer: String(r), units: ["公分", "cm"],
      explain: "解析：半徑 × 半徑 = " + n(3.14 * r * r) + " ÷ 3.14 = " + (r * r) + "，所以半徑 = " + r + "。" };
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const r = k.int(2, 12), n = k.num;
    return { stem: "半徑 " + r + " 公分的半圓形，面積是（　）平方公分。" + PI, answer: n(3.14 * r * r / 2), units: SQ,
      explain: "解析：3.14 × " + r + " × " + r + " ÷ 2 = " + n(3.14 * r * r) + " ÷ 2 = " + n(3.14 * r * r / 2) + "。",
      trapNote: "漏掉 ÷ 2 會答成整圓面積 " + n(3.14 * r * r) + "。" };
  });
  add("fill-L3-02", "fill", 3, "basic", function (k) {
    const r = 2 * k.int(1, 6), n = k.num;
    return { stem: "半徑 " + r + " 公分的四分之一圓（圓心角 90 度的扇形），面積是（　）平方公分。" + PI, answer: n(3.14 * r * r / 4), units: SQ,
      explain: "解析：整圓 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "，四分之一 = " + n(3.14 * r * r / 4) + "。" };
  });
  add("fill-L4-01", "fill", 4, "basic", function (k) {
    const r = k.int(2, 8), R = r + k.int(1, 5), n = k.num;
    return { stem: "外圓半徑 " + R + " 公分、內圓半徑 " + r + " 公分的圓環，面積是（　）平方公分。" + PI, answer: n(3.14 * (R * R - r * r)), units: SQ,
      explain: "解析：3.14 × (" + R + "² − " + r + "²) = 3.14 × " + (R * R - r * r) + " = " + n(3.14 * (R * R - r * r)) + "。" };
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const a = 2 * k.int(2, 10), n = k.num, h = a / 2;
    return { stem: "在邊長 " + a + " 公分的正方形裡畫最大的圓，圓以外（正方形四個角）的面積合計（　）平方公分。" + PI, answer: n(a * a - 3.14 * h * h), units: SQ,
      explain: "解析：正方形 " + (a * a) + "，圓 3.14 × " + h + " × " + h + " = " + n(3.14 * h * h) + "，相減 = " + n(a * a - 3.14 * h * h) + "。" };
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const r = k.int(2, 15), n = k.num;
    return { stem: "圓周率取 3.14，計算半徑 " + r + " 公分的圓面積：3.14 × " + r + " × " + r, answer: n(3.14 * r * r), units: SQ,
      explain: "解析：" + r + " × " + r + " = " + (r * r) + "，3.14 × " + (r * r) + " = " + n(3.14 * r * r) + "。" };
  });
  add("calc-L2-01", "calc", 2, "trap", function (k) {
    const d = 2 * k.int(2, 12), n = k.num, r = d / 2;
    return { stem: "圓周率取 3.14，計算直徑 " + d + " 公分的圓面積：3.14 × (" + d + " ÷ 2) × (" + d + " ÷ 2)", answer: n(3.14 * r * r), units: SQ,
      explain: "解析：" + d + " ÷ 2 = " + r + "，3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "。",
      trapNote: "括號 (" + d + " ÷ 2) 是半徑，兩個都要先除以 2；只除一個會得到 " + n(3.14 * d * r) + "。" };
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const r = k.int(3, 8), R = r + k.int(2, 6), n = k.num;
    return { stem: "圓周率取 3.14，用簡便方法計算：3.14 × " + R + " × " + R + " − 3.14 × " + r + " × " + r, answer: n(3.14 * (R * R - r * r)), units: SQ,
      explain: "解析：提出 3.14：3.14 × (" + (R * R) + " − " + (r * r) + ") = 3.14 × " + (R * R - r * r) + " = " + n(3.14 * (R * R - r * r)) + "。" };
  });
  add("calc-L3-02", "calc", 3, "basic", function (k) {
    const r = 2 * k.int(1, 8), n = k.num;
    return { stem: "圓周率取 3.14，計算半徑 " + r + " 公分的四分之一圓面積：3.14 × " + r + " × " + r + " ÷ 4", answer: n(3.14 * r * r / 4), units: SQ,
      explain: "解析：" + r + " × " + r + " = " + (r * r) + "，÷ 4 = " + (r * r / 4) + "，× 3.14 = " + n(3.14 * r * r / 4) + "。" };
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const r = k.int(2, 8), h = k.int(3, 10), n = k.num, v = 3.14 * r * r / 2 + 2 * r * h;
    return { stem: "圓周率取 3.14，長方形（長 " + (2 * r) + "、寬 " + h + "）上方接一個直徑 " + (2 * r) + " 的半圓，總面積：3.14 × " + r + " × " + r + " ÷ 2 + " + (2 * r) + " × " + h, answer: n(v), units: SQ,
      explain: "解析：半圓 3.14 × " + r + " × " + r + " ÷ 2 = " + n(3.14 * r * r / 2) + "；長方形 " + (2 * r) + " × " + h + " = " + (2 * r * h) + "；相加 = " + n(v) + "。",
      trapNote: "先乘除、後加法；若把 ÷ 2 放錯位置（如 (3.14 × " + r + " × " + r + " + " + (2 * r * h) + ") ÷ 2）就會得到 " + n((3.14 * r * r + 2 * r * h) / 2) + "。" };
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const a = 2 * k.int(2, 10), n = k.num, h = a / 2;
    return { stem: "圓周率取 3.14，計算：" + a + " × " + a + " − 3.14 × (" + a + " ÷ 2) × (" + a + " ÷ 2)", answer: n(a * a - 3.14 * h * h), units: SQ,
      explain: "解析：" + a + " × " + a + " = " + (a * a) + "；3.14 × " + h + " × " + h + " = " + n(3.14 * h * h) + "；相減 = " + n(a * a - 3.14 * h * h) + "。" };
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const r = k.pick([10, 20, 25, 30, 40, 50]), n = k.num;
    return { stem: "圓形桌面的半徑是 " + r + " 公分，桌面的面積是多少平方公分？" + PI, answer: n(3.14 * r * r), units: SQ,
      explain: "解析：3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "（平方公分）。" };
  });
  add("word-L2-01", "word", 2, "trap", function (k) {
    const d = 2 * k.int(2, 15), n = k.num, r = d / 2;
    return { stem: "學校有一座圓形花圃，直徑是 " + d + " 公尺，花圃的面積是多少平方公尺？" + PI, answer: n(3.14 * r * r), units: ["平方公尺", "m2", "m²", "公尺"],
      explain: "解析：半徑 " + r + " 公尺，面積 = 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "（平方公尺）。",
      trapNote: "題目給的是直徑，要先 ÷ 2 得半徑；直接用 " + d + " 代入會得到 " + n(3.14 * d * d) + "。" };
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const r = k.int(3, 12), n = k.num;
    return { stem: "半圓形的菜園，半徑是 " + r + " 公尺，菜園的面積是多少平方公尺？" + PI, answer: n(3.14 * r * r / 2), units: ["平方公尺", "m2", "m²", "公尺"],
      explain: "解析：整圓 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + "，半圓 ÷ 2 = " + n(3.14 * r * r / 2) + "（平方公尺）。",
      trapNote: "忘記 ÷ 2 會答成整圓 " + n(3.14 * r * r) + "；或把周長的直邊 " + (2 * r) + " 公尺加進來也是錯的。" };
  });
  add("word-L3-02", "word", 3, "basic", function (k) {
    const r = k.int(3, 12), n = k.num, p = 2 * k.int(1, 5);
    return { stem: "圓形披薩的半徑是 " + r + " 公分，每 1 平方公分的價錢約 " + p + " 元（只看數字，不計實際），這個披薩的價值是多少元？" + PI, answer: n(3.14 * r * r * p), units: ["元"],
      explain: "解析：面積 3.14 × " + r + " × " + r + " = " + n(3.14 * r * r) + " 平方公分；× " + p + " = " + n(3.14 * r * r * p) + "（元）。" };
  });
  add("word-L4-01", "word", 4, "extend", function (k) {
    const r = k.int(3, 12), w = k.int(1, 3), n = k.num;
    return { stem: "圓形水池的半徑是 " + r + " 公尺，池外圍鋪了一圈寬 " + w + " 公尺的步道，步道的面積是多少平方公尺？" + PI, answer: n(3.14 * ((r + w) * (r + w) - r * r)), units: ["平方公尺", "m2", "m²", "公尺"],
      explain: "解析：外圓半徑 " + r + " + " + w + " = " + (r + w) + "；步道面積 = 3.14 × (" + (r + w) + "² − " + r + "²) = 3.14 × " + ((r + w) * (r + w) - r * r) + " = " + n(3.14 * ((r + w) * (r + w) - r * r)) + "（平方公尺）。" };
  });
  add("word-L4-02", "word", 4, "extend", function (k) {
    const a = 2 * k.int(3, 12), n = k.num, h = a / 2;
    return { stem: "正方形草地的邊長是 " + a + " 公尺，中間要種一個最大的圓形花圃，其餘的部分都鋪草皮，草皮面積是多少平方公尺？" + PI, answer: n(a * a - 3.14 * h * h), units: ["平方公尺", "m2", "m²", "公尺"],
      explain: "解析：花圃半徑 " + h + " 公尺，面積 " + n(3.14 * h * h) + "；草地 " + (a * a) + " − " + n(3.14 * h * h) + " = " + n(a * a - 3.14 * h * h) + "（平方公尺）。" };
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const r = k.int(3, 12), n = k.num;
    return { stem: "圓形遊戲墊的面積是 " + n(3.14 * r * r) + " 平方公分，要在邊緣貼一圈彩帶，彩帶至少要幾公分？" + PI, answer: n(6.28 * r), units: ["公分", "cm"],
      explain: "解析：半徑² = " + n(3.14 * r * r) + " ÷ 3.14 = " + (r * r) + "，半徑 " + r + "；彩帶長 = 周長 = 2 × 3.14 × " + r + " = " + n(6.28 * r) + "（公分）。" };
  });
  add("word-L5-02", "word", 5, "trap", function (k) {
    const r = k.int(3, 10), t = k.int(1, 3), n = k.num, inc = 3.14 * ((r + t) * (r + t) - r * r);
    return { stem: "圓形池塘的半徑是 " + r + " 公尺，現在要向外擴大，半徑增加 " + t + " 公尺，池塘的面積增加了多少平方公尺？" + PI, answer: n(inc), units: ["平方公尺", "m2", "m²", "公尺"],
      explain: "解析：新面積 3.14 × " + (r + t) + "² = " + n(3.14 * (r + t) * (r + t)) + "，舊面積 3.14 × " + r + "² = " + n(3.14 * r * r) + "，增加 " + n(inc) + "（平方公尺）。",
      trapNote: "不能只算 3.14 × " + t + " × " + t + " = " + n(3.14 * t * t) + "；增加的是「新面積 − 舊面積」。" };
  });

  ExamBank.register("circle-area", "circle-area-main", S);
})();
