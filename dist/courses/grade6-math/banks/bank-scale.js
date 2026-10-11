/* 題庫：scale 放大圖、縮小圖、比例尺、實際距離與圖上距離換算。題庫工 B */
(function () {
  "use strict";
  const S = [];
  function add(id, type, level, tag, gen) { S.push({ id: "scale-" + id, type, level, tag, gen }); }
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

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = k.int(2, 15), n = k.num, m = a * N / 100;
    const c = sc(k, n(m), [n(a * N), n(m / 10), n(m * 10), n(a * 100 / N), n(a + N)]);
    return Object.assign(c, { stem: "地圖的比例尺是 1:" + N + "，圖上兩地相距 " + a + " 公分，實際相距多少公尺？",
      explain: "解析：實際距離 = " + a + " × " + N + " = " + n(a * N) + " 公分 = " + n(m) + " 公尺（100 公分 = 1 公尺）。" });
  });
  add("single-L1-02", "single", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = k.int(2, 20), n = k.num, m = a * N / 100;
    const c = sc(k, a, [n(m * N), n(m / N), n(m * N / 100), n(a * 10)]);
    return Object.assign(c, { stem: "比例尺是 1:" + N + "，實際距離是 " + n(m) + " 公尺，圖上應該畫多少公分？",
      explain: "解析：" + n(m) + " 公尺 = " + n(m * 100) + " 公分，圖上 = " + n(m * 100) + " ÷ " + N + " = " + a + "（公分）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const N = k.pick([500, 1000, 2000, 5000, 10000]);
    const c = sc(k, "圖上 1 公分代表實際 " + N + " 公分", ["圖上 " + N + " 公分代表實際 1 公分", "實際 1 公分在圖上畫成 " + N + " 公分", "圖上 1 公分代表實際 " + N + " 公尺", "圖上 " + N + " 公分代表實際 " + N + " 公尺"]);
    return Object.assign(c, { stem: "比例尺 1:" + N + " 的意思是下列哪一個？",
      explain: "解析：比例尺 = 圖上距離 : 實際距離 = 1 : " + N + "，所以圖上 1 公分代表實際 " + N + " 公分（單位要相同）。",
      trapNote: "把前後項顛倒（變成圖上 " + N + " 公分代表實際 1 公分）是最常見的錯誤；前項是圖上、後項是實際。" });
  });
  add("single-L2-02", "single", 2, "basic", function (k) {
    const m = k.int(2, 8), a = k.int(1, 9), n = k.num;
    const c = sc(k, a * m, [n(a / m), a + m, a * m * m, a * m + m]);
    return Object.assign(c, { stem: "一個零件實際長 " + a + " 公分，用 " + m + ":1 的比例畫成放大圖，圖上的長度是多少公分？",
      explain: "解析：" + m + ":1 表示圖上是實際的 " + m + " 倍，" + a + " × " + m + " = " + (a * m) + "（公分）。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    const N = k.pick([200, 500, 1000, 2000, 5000]), a = k.int(2, 10), b = a * N / 100, n = k.num;
    const c = sc(k, "1:" + N, ["1:" + n(b / a), "1:" + (N * 100), N + ":1", "1:" + b]);
    return Object.assign(c, { stem: "地圖上 " + a + " 公分代表實際 " + b + " 公尺，這張地圖的比例尺是多少？",
      explain: "解析：實際 " + b + " 公尺 = " + (b * 100) + " 公分，比例尺 = " + a + " : " + (b * 100) + " = 1 : " + N + "。",
      trapNote: "沒有先把公尺換成公分就直接比（" + a + " : " + b + " = 1 : " + n(b / a) + "），單位不同比出來是錯的。" });
  });
  add("single-L4-01", "single", 4, "trap", function (k) {
    const N = k.pick([10000, 50000, 100000, 200000, 250000]), a = k.int(2, 16), n = k.num, km = a * N / 100000;
    const c = sc(k, n(km), [n(a * N / 1000), n(a * N / 100), n(a * N / 10000), n(a * N)]);
    return Object.assign(c, { stem: "地圖的比例尺是 1:" + N + "，圖上兩城市相距 " + a + " 公分，實際相距多少公里？",
      explain: "解析：" + a + " × " + N + " = " + n(a * N) + " 公分；100000 公分 = 1 公里，所以 " + n(a * N) + " ÷ 100000 = " + n(km) + " 公里。",
      trapNote: "公分換公里要除以 100000（先 ÷100 成公尺，再 ÷1000 成公里）；只除一次或少除一個 0 會差 10 倍以上。" });
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const N = k.pick([200, 500, 1000]), a = k.int(2, 8), n = k.num, side = a * N / 100;
    const c = sc(k, n(side * side), [n(a * a * N / 100), n(side * 4), n(a * a * N), n(side * 2), n(a * a * N / 10), n(side * side * 10000)]);
    return Object.assign(c, { stem: "地圖上有一塊正方形空地，邊長 " + a + " 公分，比例尺是 1:" + N + "，這塊空地實際面積是多少平方公尺？",
      explain: "解析：實際邊長 = " + a + " × " + N + " ÷ 100 = " + n(side) + " 公尺，面積 = " + n(side) + " × " + n(side) + " = " + n(side * side) + " 平方公尺。長度是 " + N + " 倍，但面積是 " + N + " × " + N + " 倍。" });
  });
  add("single-L5-01", "single", 5, "extend", function (k) {
    const m = k.pick([2, 4, 5, 10]), j = k.int(1, 6), a = m * j, N1 = k.pick([5000, 10000, 25000]), n = k.num;
    const c = sc(k, j, [a * m, a * N1 / 100, n(a / (m * m)), a + m, n(a / m * 2)]);
    return Object.assign(c, { stem: "同樣兩地，在比例尺 1:" + N1 + " 的地圖上相距 " + a + " 公分；若改看比例尺 1:" + (N1 * m) + " 的地圖，兩地圖上相距多少公分？",
      explain: "解析：比例尺分母變成 " + m + " 倍，圖更小，圖上距離變成 1/" + m + "：" + a + " ÷ " + m + " = " + j + "（公分）。也可先求實際再換算。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const N = k.pick([500, 1000, 2000, 5000]);
    const c = mu(k,
      ["圖上 1 公分代表實際 " + N + " 公分", "圖上 2 公分代表實際 " + (2 * N) + " 公分", "比例尺是「圖上距離 : 實際距離」", "這是一張縮小圖"],
      ["圖上 " + N + " 公分代表實際 1 公分", "這是一張放大圖", "比例尺是「實際距離 : 圖上距離」"]);
    return Object.assign(c, { stem: "比例尺是 1:" + N + " 的地圖，選出所有正確的敘述。",
      explain: "解析：比例尺 = 圖上 : 實際 = 1 : " + N + "，後項比前項大，是縮小圖；圖上距離乘以 " + N + " 就是實際距離。" });
  });
  add("multi-L2-01", "multi", 2, "trap", function (k) {
    const N = k.pick([1000, 2000, 5000, 10000, 20000, 50000]), a = k.int(2, 9), n = k.num;
    const c = mu(k,
      ["實際距離是 " + n(a * N) + " 公分", "實際距離是 " + n(a * N / 100) + " 公尺", "實際距離是 " + n(a * N / 100000) + " 公里"],
      ["實際距離是 " + n(a * N / 100) + " 公分", "實際距離是 " + n(a * N) + " 公尺", "實際距離是 " + n(a * N / 1000) + " 公里"]);
    return Object.assign(c, { stem: "地圖比例尺是 1:" + N + "，圖上兩地相距 " + a + " 公分，選出所有正確的敘述。",
      explain: "解析：" + a + " × " + N + " = " + n(a * N) + " 公分 = " + n(a * N / 100) + " 公尺 = " + n(a * N / 100000) + " 公里。",
      trapNote: "最容易錯在單位：算出的 " + n(a * N) + " 是「公分」，不能直接當成公尺；公分→公尺 ÷100，公分→公里 ÷100000。" });
  });
  add("multi-L3-01", "multi", 3, "basic", function (k) {
    const m = k.int(3, 6), a = k.int(2, 9), n = k.num;
    const c = mu(k,
      ["圖上的長度是 " + (a * m) + " 公分", "這是一張放大圖", "實際長度是圖上長度的 1/" + m],
      ["圖上的長度是 " + n(a / m) + " 公分", "這是一張縮小圖", "圖上的長度是 " + (a + m) + " 公分"]);
    return Object.assign(c, { stem: "一個物體實際長 " + a + " 公分，畫成 " + m + ":1 的圖，選出所有正確的敘述。",
      explain: "解析：" + m + ":1 表示圖上 : 實際 = " + m + " : 1，圖是實際的 " + m + " 倍（放大圖），圖上長 = " + a + " × " + m + " = " + (a * m) + " 公分。" });
  });
  add("multi-L4-01", "multi", 4, "trap", function (k) {
    const N = 2 * k.pick([500, 1000, 2500, 5000]);
    const c = mu(k,
      ["圖上的距離變成原來的 2 倍", "兩地實際距離不變", "新的比例尺是 1:" + (N / 2)],
      ["比例尺仍然是 1:" + N, "兩地實際距離也變成 2 倍", "新的比例尺是 1:" + (N * 2)]);
    return Object.assign(c, { stem: "把一張比例尺 1:" + N + " 的地圖，用影印機把長寬都放大 2 倍，選出所有正確的敘述。",
      explain: "解析：圖放大 2 倍，原本圖上 1 公分變成 2 公分，仍代表實際 " + N + " 公分，所以 1 公分只代表 " + (N / 2) + " 公分，新比例尺 1:" + (N / 2) + "；實際距離不會改變。",
      trapNote: "圖影印放大後，原來印在圖旁的比例尺 1:" + N + " 就不能再用了；只有附「線段比例尺」的圖才會跟著一起放大。" });
  });
  add("multi-L5-01", "multi", 5, "extend", function (k) {
    const N = k.pick([200, 500, 1000]), a = k.int(2, 8), n = k.num, side = a * N / 100;
    const c = mu(k,
      ["實際邊長是 " + n(side) + " 公尺", "實際周長是 " + n(side * 4) + " 公尺", "實際面積是 " + n(side * side) + " 平方公尺"],
      ["實際面積是 " + n(a * a * N / 100) + " 平方公尺", "實際面積是圖上面積的 " + N + " 倍", "實際周長是 " + n(side * 2) + " 公尺"]);
    return Object.assign(c, { stem: "地圖比例尺 1:" + N + "，圖上有一塊正方形，邊長 " + a + " 公分，選出所有正確的敘述。",
      explain: "解析：實際邊長 " + a + " × " + N + " ÷ 100 = " + n(side) + " 公尺；周長 = 4 × " + n(side) + "；面積 = " + n(side) + "² = " + n(side * side) + "。面積是圖上面積的 " + N + " × " + N + " 倍。" });
  });

  /* ---------- tf ---------- */
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const N = k.pick([500, 1000, 2000, 5000, 10000]);
    const p = k.pick([
      ["比例尺 1:" + N + " 表示圖上 1 公分代表實際 " + N + " 公分。", true, "解析：比例尺 1:" + N + " 就是圖上 1 公分對應實際 " + N + " 公分。"],
      ["比例尺 1:" + N + " 表示圖上 " + N + " 公分代表實際 1 公分。", false, "解析：前項是圖上、後項是實際，應是圖上 1 公分代表實際 " + N + " 公分。"],
      ["比例尺 1:" + N + " 的圖是縮小圖。", true, "解析：實際比圖上大，所以是縮小圖。"],
      ["比例尺 1:" + N + " 的圖是放大圖。", false, "解析：後項 " + N + " 比前項 1 大，實際較大，是縮小圖。"]]);
    return { stem: p[0], answer: p[1], explain: p[2] };
  });
  add("tf-L2-01", "tf", 2, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = k.int(2, 12), n = k.num, ok = k.int(0, 1) === 1, v = ok ? n(a * N) : n(a * N / 100);
    return { stem: "比例尺是 1:" + N + "，圖上 " + a + " 公分的線段，實際長度是 " + v + " 公分。", answer: ok,
      explain: "解析：實際 = " + a + " × " + N + " = " + n(a * N) + " 公分（等於 " + n(a * N / 100) + " 公尺），" + (ok ? "所以正確。" : "敘述把「公尺」的數字寫成了公分，所以錯誤。") };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const N = k.pick([200, 500, 1000, 2000]), a = k.int(2, 12), n = k.num, ok = k.int(0, 1) === 1, v = ok ? n(a * N / 100) : n(a * N);
    return { stem: "比例尺是 1:" + N + "，圖上 " + a + " 公分的線段，實際長度是 " + v + " 公尺。", answer: ok,
      explain: "解析：" + a + " × " + N + " = " + n(a * N) + " 公分 = " + n(a * N / 100) + " 公尺。",
      trapNote: "圖上用公分，乘比例尺後得到的仍是公分；沒有除以 100 就直接說成公尺會多出 100 倍。" };
  });
  add("tf-L3-02", "tf", 3, "trap", function (k) {
    const m = k.int(2, 5), ok = k.int(0, 1) === 1, v = ok ? m * m : m;
    return { stem: "把一個正方形圖案的每一邊都放大成 " + m + " 倍，它的面積會變成原來的 " + v + " 倍。", answer: ok,
      explain: "解析：邊長 × " + m + "，面積 = 邊長 × 邊長，所以變成 " + m + " × " + m + " = " + (m * m) + " 倍。",
      trapNote: "邊長放大 " + m + " 倍時，面積不是 " + m + " 倍，而是 " + (m * m) + " 倍（長、寬各乘一次）。" };
  });
  add("tf-L4-01", "tf", 4, "trap", function (k) {
    const arr = k.pick([[500, 5000], [1000, 10000], [1000, 50000], [2000, 20000], [5000, 50000]]), A = arr[0], B = arr[1], ok = k.int(0, 1) === 1;
    const x = ok ? A : B, y = ok ? B : A;
    return { stem: "同一個地方，用比例尺 1:" + x + " 的地圖畫出來的圖，比用比例尺 1:" + y + " 的地圖畫出來的圖大。", answer: ok,
      explain: "解析：1:" + A + " 的 1 公分只代表實際 " + A + " 公分，比 1:" + B + " 的 1 公分代表 " + B + " 公分小，所以 1:" + A + " 畫出的圖較大、較詳細。",
      trapNote: "比例尺後項（分母）越大，圖反而畫得越小；不要以為數字大就是圖大。" };
  });
  add("tf-L5-01", "tf", 5, "extend", function (k) {
    const N = k.pick([200, 500, 1000]), a = k.int(2, 8), n = k.num, side = a * N / 100, ok = k.int(0, 1) === 1, v = ok ? n(side * side) : n(a * a * N / 100);
    return { stem: "地圖比例尺 1:" + N + "，圖上正方形邊長 " + a + " 公分，它的實際面積是 " + v + " 平方公尺。", answer: ok,
      explain: "解析：實際邊長 " + n(side) + " 公尺，面積 " + n(side) + "² = " + n(side * side) + " 平方公尺。" + (ok ? "" : "敘述的 " + v + " 只把面積乘一次 " + N + "，不正確。") };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = k.int(2, 15), n = k.num;
    return { stem: "地圖的比例尺是 1:" + N + "，圖上 " + a + " 公分，實際距離是（　）公尺。", answer: n(a * N / 100), units: ["公尺", "m"],
      explain: "解析：" + a + " × " + N + " = " + n(a * N) + " 公分 = " + n(a * N / 100) + " 公尺。" };
  });
  add("fill-L1-02", "fill", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = k.int(2, 20), n = k.num, b = a * N / 100;
    return { stem: "實際距離 " + n(b) + " 公尺，比例尺 1:" + N + "，圖上應畫（　）公分。", answer: String(a), units: ["公分", "cm"],
      explain: "解析：" + n(b) + " 公尺 = " + n(b * 100) + " 公分，" + n(b * 100) + " ÷ " + N + " = " + a + "。" };
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const m = k.int(2, 8), a = k.int(2, 9);
    return { stem: "把實際長 " + a + " 公分的葉片畫成 " + m + ":1 的放大圖，圖上長（　）公分。", answer: String(a * m), units: ["公分", "cm"],
      explain: "解析：放大 " + m + " 倍：" + a + " × " + m + " = " + (a * m) + "。" };
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const N = k.pick([200, 500, 1000, 2000, 5000]), a = k.int(2, 10), b = a * N / 100;
    return { stem: "地圖上 " + a + " 公分代表實際 " + b + " 公尺，這張地圖的比例尺是 1:（　）。", answer: String(N),
      explain: "解析：" + b + " 公尺 = " + (b * 100) + " 公分，" + a + " : " + (b * 100) + " = 1 : " + N + "。",
      trapNote: "沒換成相同單位就比，會得到 1:" + (b / a) + "（錯）；要先把公尺換成公分。" };
  });
  add("fill-L4-01", "fill", 4, "trap", function (k) {
    const N = k.pick([10000, 50000, 100000, 200000, 250000]), a = k.int(2, 16), n = k.num;
    return { stem: "地圖的比例尺是 1:" + N + "，圖上兩地相距 " + a + " 公分，實際相距（　）公里。", answer: n(a * N / 100000), units: ["公里", "km"],
      explain: "解析：" + a + " × " + N + " = " + n(a * N) + " 公分，÷ 100000 = " + n(a * N / 100000) + " 公里。",
      trapNote: "公分換公里要 ÷ 100000；若只 ÷ 1000（當成公尺換公里）會多出 100 倍。" };
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const arr = k.pick([[50000, 2], [100000, 1], [200000, 0.5], [250000, 0.4]]), x = k.pick([10, 20, 30, 40, 50]), n = k.num;
    return { stem: "甲、乙兩地實際相距 " + x + " 公里，在比例尺 1:" + arr[0] + " 的地圖上，兩地相距（　）公分。", answer: n(x * arr[1]), units: ["公分", "cm"],
      explain: "解析：" + x + " 公里 = " + (x * 100000) + " 公分，" + (x * 100000) + " ÷ " + arr[0] + " = " + n(x * arr[1]) + "。" };
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = k.int(2, 15), n = k.num;
    return { stem: "比例尺 1:" + N + "，圖上 " + a + " 公分的實際距離（公尺）：" + a + " × " + N + " ÷ 100", answer: n(a * N / 100), units: ["公尺"],
      explain: "解析：列式 " + a + " × " + N + " ÷ 100 = " + n(a * N) + " ÷ 100 = " + n(a * N / 100) + "。" };
  });
  add("calc-L2-01", "calc", 2, "basic", function (k) {
    const arr = k.pick([[50000, 2], [100000, 1], [200000, 0.5], [250000, 0.4]]), x = k.pick([5, 10, 15, 20, 30, 40, 50]), n = k.num;
    return { stem: "實際距離 " + x + " 公里，比例尺 1:" + arr[0] + "，圖上距離（公分）：" + x + " × 100000 ÷ " + arr[0], answer: n(x * arr[1]), units: ["公分"],
      explain: "解析：" + x + " × 100000 = " + (x * 100000) + "，÷ " + arr[0] + " = " + n(x * arr[1]) + "。" };
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const N = k.pick([200, 500, 1000]), a = k.int(2, 8), n = k.num, s = a * N / 100;
    return { stem: "圖上正方形邊長 " + a + " 公分，比例尺 1:" + N + "，實際面積（平方公尺）：(" + a + " × " + N + " ÷ 100) × (" + a + " × " + N + " ÷ 100)", answer: n(s * s), units: ["平方公尺"],
      explain: "解析：括號內 " + a + " × " + N + " ÷ 100 = " + n(s) + "，面積 " + n(s) + " × " + n(s) + " = " + n(s * s) + "。" };
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const N = k.pick([10000, 20000, 25000, 50000]), x = k.int(1, 5), y = k.int(1, 9) * 100, n = k.num;
    return { stem: "實際距離 " + x + " 公里 " + y + " 公尺，比例尺 1:" + N + "，圖上距離（公分）：(" + x + " × 1000 + " + y + ") × 100 ÷ " + N, answer: n((x * 1000 + y) * 100 / N), units: ["公分"],
      explain: "解析：先換成公尺 " + x + " × 1000 + " + y + " = " + (x * 1000 + y) + "；再換公分 × 100 = " + ((x * 1000 + y) * 100) + "；÷ " + N + " = " + n((x * 1000 + y) * 100 / N) + "。",
      trapNote: "公里、公尺要先合併成同一單位再乘 100 換成公分；只換 " + y + " 公尺或漏掉 " + x + " 公里都會錯。" };
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const arr = k.pick([[50000, 20000, 2.5], [10000, 5000, 2], [20000, 50000, 0.4], [25000, 10000, 2.5], [100000, 25000, 4]]), a = k.pick([5, 10, 15, 20]), n = k.num;
    return { stem: "同樣兩地在比例尺 1:" + arr[0] + " 的地圖上相距 " + a + " 公分，在比例尺 1:" + arr[1] + " 的地圖上相距幾公分？算式：" + a + " × " + arr[0] + " ÷ " + arr[1], answer: n(a * arr[2]), units: ["公分"],
      explain: "解析：" + a + " × " + arr[0] + " = " + (a * arr[0]) + "（實際公分），÷ " + arr[1] + " = " + n(a * arr[2]) + "。" };
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const N = k.pick([500, 1000, 2000, 5000]), a = k.int(2, 14), n = k.num;
    return { stem: "校園平面圖的比例尺是 1:" + N + "，量得操場到校門口在圖上相距 " + a + " 公分，實際相距幾公尺？", answer: n(a * N / 100), units: ["公尺", "m"],
      explain: "解析：" + a + " × " + N + " = " + n(a * N) + " 公分 = " + n(a * N / 100) + " 公尺。" };
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const arr = k.pick([[50000, 2], [100000, 1], [200000, 0.5], [250000, 0.4]]), x = k.pick([10, 20, 30, 40, 50]), n = k.num;
    return { stem: "兩個車站實際相距 " + x + " 公里，要畫在比例尺 1:" + arr[0] + " 的地圖上，圖上應該畫幾公分？", answer: n(x * arr[1]), units: ["公分", "cm"],
      explain: "解析：" + x + " 公里 = " + (x * 100000) + " 公分，÷ " + arr[0] + " = " + n(x * arr[1]) + "（公分）。" };
  });
  add("word-L2-02", "word", 2, "basic", function (k) {
    const m = k.int(3, 10), a = k.int(2, 9);
    return { stem: "蝴蝶的翅膀實際長 " + a + " 公分，美勞課要做 " + m + ":1 的放大模型，模型翅膀要做幾公分？", answer: String(a * m), units: ["公分", "cm"],
      explain: "解析：放大 " + m + " 倍：" + a + " × " + m + " = " + (a * m) + "（公分）。" };
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const N = k.pick([200, 500, 1000, 2000]), a = k.int(2, 10), b = a * N / 100;
    return { stem: "操場的直線跑道實際長 " + b + " 公尺，在平面圖上畫了 " + a + " 公分，這張圖上 1 公分代表實際幾公分？", answer: String(N), units: ["公分", "cm"],
      explain: "解析：" + b + " 公尺 = " + (b * 100) + " 公分，" + (b * 100) + " ÷ " + a + " = " + N + "，也就是比例尺 1:" + N + "。",
      trapNote: "直接算 " + b + " ÷ " + a + " = " + (b / a) + " 會得到「公尺」的數字，題目問的是公分，要先換算單位。" };
  });
  add("word-L4-01", "word", 4, "extend", function (k) {
    const N = k.pick([50000, 100000]), a = 2 * k.int(2, 8), v = k.pick([15, 20, 30, 60]), n = k.num, km = a * N / 100000;
    return { stem: "地圖比例尺是 1:" + N + "，小明沿著地圖上長 " + a + " 公分的路線騎腳踏車，時速 " + v + " 公里，他要騎幾分鐘？", answer: n(km / v * 60), units: ["分鐘", "分"],
      explain: "解析：實際路程 " + a + " × " + N + " ÷ 100000 = " + n(km) + " 公里；時間 = " + n(km) + " ÷ " + v + " = " + n(km / v) + " 小時 = " + n(km / v * 60) + " 分鐘。" };
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const N = k.pick([500, 1000, 2000]), a = k.int(2, 6), b = k.int(2, 6), n = k.num, L = a * N / 100, W = b * N / 100;
    return { stem: "地圖比例尺 1:" + N + "，圖上有一塊長方形農地，長 " + a + " 公分、寬 " + b + " 公分，這塊農地實際面積是多少平方公尺？", answer: n(L * W), units: ["平方公尺", "m2", "m²"],
      explain: "解析：實際長 " + n(L) + " 公尺，實際寬 " + n(W) + " 公尺，面積 " + n(L) + " × " + n(W) + " = " + n(L * W) + " 平方公尺。" };
  });

  ExamBank.register("scale", "scale-main", S);
})();
