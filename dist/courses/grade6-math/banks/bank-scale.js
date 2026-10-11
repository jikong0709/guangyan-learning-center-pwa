/* 題庫：scale 放大圖、縮小圖、比例尺、實際距離與圖上距離換算。題庫工 B
   數字風格：圖上距離、實際距離、放大倍率可為整數、小數、分數、帶分數；全部用 kit.Q 精確運算。 */
(function () {
  "use strict";
  const K = window.ExamKit, Q = K.Q, qa = K.qAdd, qs = K.qSub, qm = K.qMul, qd = K.qDiv;
  const S = [];
  /* 輸出後處理：分數平方一律加括號；分母 > 60 的分數或 9 位以上數字視為不乾淨，重抽 */
  function fixSq(s) { return typeof s === "string" ? s.replace(/(\d+ \d+\/\d+|\d+\/\d+)²/g, "($1)²") : s; }
  function post(o) {
    ["stem", "explain", "trapNote"].forEach(function (f) { if (o[f] !== undefined) o[f] = fixSq(o[f]); });
    if (o.options) o.options = o.options.map(fixSq);
    if (typeof o.answer === "string" && o.stem && !/分數/.test(o.stem)) {
      const hm = o.answer.match(/(\d+)\/(\d+)$/);
      if (hm) { let dn = +hm[2]; while (dn % 2 === 0) dn /= 2; while (dn % 5 === 0) dn /= 5; if (dn !== 1) o.stem += "（請以分數作答）"; }
    }
    if (o.accepted) o.accepted = o.accepted.filter(function (a) { const mm = /(\d+)\/(\d+)$/.exec(a); return !(mm && +mm[2] > 100); });
    const all = [o.stem, o.explain, o.trapNote, o.answer, o.options ? o.options.join(" ") : ""].join(" ");
    const re = /(\d+)\/(\d+)/g; let m;
    while ((m = re.exec(all))) { if (+m[2] > 60) throw new Error("retry"); }
    if (/\d{9,}/.test(all)) throw new Error("retry");
    return o;
  }
  function add(id, type, level, tag, gen) {
    S.push({ id: "scale-" + id, type, level, tag, gen: function (k) {
      let e; for (let i = 0; i < 80; i++) { try { return post(gen(k)); } catch (x) { e = x; } } throw e;
    } });
  }
  function dg(q) { let d = q.d, a = 0, b = 0; while (d % 2 === 0) { d /= 2; a++; } while (d % 5 === 0) { d /= 5; b++; } return d === 1 ? Math.max(a, b) : 99; }
  function need() { for (let i = 0; i < arguments.length; i++) { const q = arguments[i]; if (q.n <= 0 || dg(q) > 4) throw new Error("retry"); } }
  function I(n) { return Q(n, 1); }
  function D(q) { return K.qShow(q, "dec"); }
  function auto(q, fl) { if (q.d === 1) return String(q.n); if ((fl === "frac" || fl === "mixed") && q.d <= 20) return K.qMixed(q); return dg(q) <= 4 ? K.qDec(q) : K.qMixed(q); }
  function os(q, fl) { if (q.n <= 0) return null; if ((fl === "frac" || fl === "mixed") && q.d <= 20) return K.qMixed(q); return dg(q) <= 4 ? K.qDec(q) : null; }
  function sc(k, correct, cands, fl) {
    const c = os(correct, fl); if (c === null) throw new Error("retry");
    const w = k.distractors(c, cands.map(function (q) { return os(q, fl); }).filter(function (x) { return x !== null; }), 3);
    if (w.length < 3) throw new Error("retry");
    return { options: [c].concat(w), answer: 0 };
  }
  function mu(k, goods, bads) {
    const g = k.shuffle(goods).slice(0, k.int(2, 3)), b = k.shuffle(bads).slice(0, 2), all = g.concat(b);
    if (new Set(all).size !== all.length) throw new Error("retry");
    return { options: all, answer: g.map(function (_, i) { return i; }) };
  }
  function ans(q, fl) { return K.qAnswer(q, fl === "frac" || fl === "mixed" ? fl : "dec"); }
  function ex(q, fl) { const s = K.qShow(q, fl); return /[ \/]/.test(s) ? "(" + s + ")" : s; }
  function R(k, lo, hi, w) { const fl = k.flavor(["int", "dec", "mixed", "frac"], w || [3, 3, 3.5, 1]); return { q: k.randQ(fl, { min: lo, max: hi, dens: [2, 4, 5] }), fl: fl }; }
  function sv(x) { return K.qShow(x.q, x.fl); }
  /* 放大倍率：整數或小數（不用帶分數寫在 m:1 裡） */
  function Mq(k, lo, hi) { const fl = k.flavor(["int", "dec", "dec"]); return { q: k.randQ(fl, { min: lo, max: hi, places: 1 }), fl: fl }; }
  /* 倍率敘述：整數／小數用 m:1，其餘用「放大成 m 倍」 */
  const C100 = I(100), C1e5 = I(100000);

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = R(k, 2, 15), m = qd(qm(a.q, I(N)), C100); need(m);
    const c = sc(k, m, [qm(a.q, I(N)), qd(m, I(10)), qm(m, I(10)), qd(qm(a.q, C100), I(N)), qa(a.q, I(N))], a.fl);
    return Object.assign(c, { stem: "地圖的比例尺是 1:" + N + "，圖上兩地相距 " + sv(a) + " 公分，實際相距多少公尺？",
      explain: "解析：實際距離 = " + sv(a) + " × " + N + " = " + D(qm(a.q, I(N))) + " 公分 = " + D(m) + " 公尺（100 公分 = 1 公尺）。" });
  });
  add("single-L1-02", "single", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = R(k, 2, 20), m = qd(qm(a.q, I(N)), C100); need(m);
    const c = sc(k, a.q, [qm(m, I(N)), qd(m, I(N)), qd(qm(m, I(N)), C100), qm(a.q, I(10))], a.fl);
    return Object.assign(c, { stem: "比例尺是 1:" + N + "，實際距離是 " + D(m) + " 公尺，圖上應該畫多少公分？",
      explain: "解析：" + D(m) + " 公尺 = " + D(qm(m, C100)) + " 公分，圖上 = " + D(qm(m, C100)) + " ÷ " + N + " = " + sv(a) + "（公分）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const N = k.pick([500, 1000, 2000, 5000, 10000]);
    const cs = ["圖上 " + N + " 公分代表實際 1 公分", "實際 1 公分在圖上畫成 " + N + " 公分", "圖上 1 公分代表實際 " + N + " 公尺", "圖上 " + N + " 公分代表實際 " + N + " 公尺"];
    const w = k.distractors("圖上 1 公分代表實際 " + N + " 公分", cs, 3);
    return { stem: "比例尺 1:" + N + " 的意思是下列哪一個？", options: ["圖上 1 公分代表實際 " + N + " 公分"].concat(w), answer: 0,
      explain: "解析：比例尺 = 圖上距離 : 實際距離 = 1 : " + N + "，所以圖上 1 公分代表實際 " + N + " 公分（單位要相同）。",
      trapNote: "把前後項顛倒（變成圖上 " + N + " 公分代表實際 1 公分）是最常見的錯誤；前項是圖上、後項是實際。" };
  });
  add("single-L2-02", "single", 2, "basic", function (k) {
    const m = Mq(k, 2, 8), a = R(k, 1, 9), v = qm(a.q, m.q); need(v);
    const c = sc(k, v, [qd(a.q, m.q), qa(a.q, m.q), qm(v, m.q), qa(v, m.q)], a.fl);
    return Object.assign(c, { stem: "一個零件實際長 " + sv(a) + " 公分，用 " + sv(m) + ":1 的比例畫成放大圖，圖上的長度是多少公分？",
      explain: "解析：" + sv(m) + ":1 表示圖上是實際的 " + sv(m) + " 倍，" + sv(a) + " × " + sv(m) + " = " + D(v) + "（公分）。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    const N = k.pick([200, 500, 1000, 2000, 5000]), a = R(k, 2, 10), b = qd(qm(a.q, I(N)), C100); need(b);
    const cs = ["1:" + D(qd(b, a.q)), "1:" + (N * 100), N + ":1", "1:" + D(b)];
    const w = k.distractors("1:" + N, cs, 3); if (w.length < 3) throw new Error("retry");
    return { stem: "地圖上 " + sv(a) + " 公分代表實際 " + D(b) + " 公尺，這張地圖的比例尺是多少？", options: ["1:" + N].concat(w), answer: 0,
      explain: "解析：實際 " + D(b) + " 公尺 = " + D(qm(b, C100)) + " 公分，比例尺 = " + sv(a) + " : " + D(qm(b, C100)) + " = 1 : " + N + "。",
      trapNote: "沒有先把公尺換成公分就直接比（" + sv(a) + " : " + D(b) + " = 1 : " + D(qd(b, a.q)) + "），單位不同比出來是錯的。" };
  });
  add("single-L4-01", "single", 4, "trap", function (k) {
    const N = k.pick([10000, 50000, 100000, 200000, 250000]), a = R(k, 2, 16), km = qd(qm(a.q, I(N)), C1e5); need(km);
    const c = sc(k, km, [qd(qm(a.q, I(N)), I(1000)), qd(qm(a.q, I(N)), C100), qd(qm(a.q, I(N)), I(10000)), qm(a.q, I(N))], a.fl);
    return Object.assign(c, { stem: "地圖的比例尺是 1:" + N + "，圖上兩城市相距 " + sv(a) + " 公分，實際相距多少公里？",
      explain: "解析：" + sv(a) + " × " + N + " = " + D(qm(a.q, I(N))) + " 公分；100000 公分 = 1 公里，所以 " + D(qm(a.q, I(N))) + " ÷ 100000 = " + D(km) + " 公里。",
      trapNote: "公分換公里要除以 100000（先 ÷100 成公尺，再 ÷1000 成公里）；只除一次或少除一個 0 會差 10 倍以上。" });
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const N = k.pick([200, 500, 1000]), a = R(k, 2, 8), side = qd(qm(a.q, I(N)), C100), ar = qm(side, side); need(side, ar);
    const c = sc(k, ar, [qd(qm(qm(a.q, a.q), I(N)), C100), qm(side, I(4)), qm(qm(a.q, a.q), I(N)), qm(side, I(2)), qd(qm(qm(a.q, a.q), I(N)), I(10)), qm(ar, I(10000))], a.fl);
    return Object.assign(c, { stem: "地圖上有一塊正方形空地，邊長 " + sv(a) + " 公分，比例尺是 1:" + N + "，這塊空地實際面積是多少平方公尺？",
      explain: "解析：實際邊長 = " + sv(a) + " × " + N + " ÷ 100 = " + D(side) + " 公尺，面積 = " + D(side) + " × " + D(side) + " = " + D(ar) + " 平方公尺。長度是 " + N + " 倍，但面積是 " + N + " × " + N + " 倍。" });
  });
  add("single-L5-01", "single", 5, "extend", function (k) {
    const m = k.pick([2, 4, 5, 10]), a = R(k, 3, 24), N1 = k.pick([5000, 10000, 25000]), j = qd(a.q, I(m)); need(j);
    const c = sc(k, j, [qm(a.q, I(m)), qd(qm(a.q, I(N1)), C100), qd(a.q, I(m * m)), qa(a.q, I(m)), qm(qd(a.q, I(m)), I(2))], a.fl);
    return Object.assign(c, { stem: "同樣兩地，在比例尺 1:" + N1 + " 的地圖上相距 " + sv(a) + " 公分；若改看比例尺 1:" + (N1 * m) + " 的地圖，兩地圖上相距多少公分？",
      explain: "解析：比例尺分母變成 " + m + " 倍，圖更小，圖上距離變成 1/" + m + "：" + sv(a) + " ÷ " + m + " = " + D(j) + "（公分）。也可先求實際再換算。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const N = k.pick([500, 1000, 2000, 5000]), a = R(k, 2, 9), aN = qm(a.q, I(N)); need(aN);
    const c = mu(k,
      ["圖上 1 公分代表實際 " + N + " 公分", "圖上 " + sv(a) + " 公分代表實際 " + D(aN) + " 公分", "比例尺是「圖上距離 : 實際距離」", "這是一張縮小圖"],
      ["圖上 " + N + " 公分代表實際 1 公分", "這是一張放大圖", "比例尺是「實際距離 : 圖上距離」"]);
    return Object.assign(c, { stem: "比例尺是 1:" + N + " 的地圖，選出所有正確的敘述。",
      explain: "解析：比例尺 = 圖上 : 實際 = 1 : " + N + "，後項比前項大，是縮小圖；圖上距離乘以 " + N + " 就是實際距離。" });
  });
  add("multi-L2-01", "multi", 2, "trap", function (k) {
    const N = k.pick([1000, 2000, 5000, 10000, 20000, 50000]), a = R(k, 2, 9), cm = qm(a.q, I(N)), m = qd(cm, C100), km = qd(cm, C1e5); need(cm, m, km, qd(cm, I(1000)));
    const c = mu(k,
      ["實際距離是 " + D(cm) + " 公分", "實際距離是 " + D(m) + " 公尺", "實際距離是 " + D(km) + " 公里"],
      ["實際距離是 " + D(m) + " 公分", "實際距離是 " + D(cm) + " 公尺", "實際距離是 " + D(qd(cm, I(1000))) + " 公里"]);
    return Object.assign(c, { stem: "地圖比例尺是 1:" + N + "，圖上兩地相距 " + sv(a) + " 公分，選出所有正確的敘述。",
      explain: "解析：" + sv(a) + " × " + N + " = " + D(cm) + " 公分 = " + D(m) + " 公尺 = " + D(km) + " 公里。",
      trapNote: "最容易錯在單位：算出的 " + D(cm) + " 是「公分」，不能直接當成公尺；公分→公尺 ÷100，公分→公里 ÷100000。" });
  });
  add("multi-L3-01", "multi", 3, "basic", function (k) {
    const m = Mq(k, 3, 6), a = R(k, 2, 9), v = qm(a.q, m.q), lo = qd(a.q, m.q), sm = qa(a.q, m.q); need(v, lo, sm);
    const c = mu(k,
      ["圖上的長度是 " + D(v) + " 公分", "這是一張放大圖", "圖上的長度是實際長度的 " + sv(m) + " 倍"],
      ["圖上的長度是 " + D(lo) + " 公分", "這是一張縮小圖", "圖上的長度是 " + D(sm) + " 公分"]);
    return Object.assign(c, { stem: "一個物體實際長 " + sv(a) + " 公分，畫成 " + sv(m) + ":1 的圖，選出所有正確的敘述。",
      explain: "解析：" + sv(m) + ":1 表示圖上 : 實際 = " + sv(m) + " : 1，圖是實際的 " + sv(m) + " 倍（放大圖），圖上長 = " + sv(a) + " × " + sv(m) + " = " + D(v) + " 公分。" });
  });
  add("multi-L4-01", "multi", 4, "trap", function (k) {
    const m = k.pick([2, 2.5, 4, 5]), N = k.pick([1000, 2000, 5000, 10000]), n2 = N / m;
    if (!Number.isInteger(n2)) throw new Error("retry");
    const ms = String(m);
    const c = mu(k,
      ["圖上的距離變成原來的 " + ms + " 倍", "兩地實際距離不變", "新的比例尺是 1:" + n2],
      ["比例尺仍然是 1:" + N, "兩地實際距離也變成 " + ms + " 倍", "新的比例尺是 1:" + (N * m)]);
    return Object.assign(c, { stem: "把一張比例尺 1:" + N + " 的地圖，用影印機把長寬都放大 " + ms + " 倍，選出所有正確的敘述。",
      explain: "解析：圖放大 " + ms + " 倍，原本圖上 1 公分變成 " + ms + " 公分，仍代表實際 " + N + " 公分，所以 1 公分只代表 " + n2 + " 公分，新比例尺 1:" + n2 + "；實際距離不會改變。",
      trapNote: "圖影印放大後，原來印在圖旁的比例尺 1:" + N + " 就不能再用了；只有附「線段比例尺」的圖才會跟著一起放大。" });
  });
  add("multi-L5-01", "multi", 5, "extend", function (k) {
    const N = k.pick([200, 500, 1000]), a = R(k, 2, 8), side = qd(qm(a.q, I(N)), C100), ar = qm(side, side); need(side, ar, qd(qm(qm(a.q, a.q), I(N)), C100), qm(side, I(4)));
    const c = mu(k,
      ["實際邊長是 " + D(side) + " 公尺", "實際周長是 " + D(qm(side, I(4))) + " 公尺", "實際面積是 " + D(ar) + " 平方公尺"],
      ["實際面積是 " + D(qd(qm(qm(a.q, a.q), I(N)), C100)) + " 平方公尺", "實際面積是圖上面積的 " + N + " 倍", "實際周長是 " + D(qm(side, I(2))) + " 公尺"]);
    return Object.assign(c, { stem: "地圖比例尺 1:" + N + "，圖上有一塊正方形，邊長 " + sv(a) + " 公分，選出所有正確的敘述。",
      explain: "解析：實際邊長 " + sv(a) + " × " + N + " ÷ 100 = " + D(side) + " 公尺；周長 = 4 × " + D(side) + "；面積 = " + D(side) + "² = " + D(ar) + "。面積是圖上面積的 " + N + " × " + N + " 倍。" });
  });

  /* ---------- tf ---------- */
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const N = k.pick([500, 1000, 2000, 5000, 10000]), a = R(k, 2, 9), aN = qm(a.q, I(N)); need(aN);
    const p = k.pick([
      ["比例尺 1:" + N + " 表示圖上 1 公分代表實際 " + N + " 公分。", true, "解析：比例尺 1:" + N + " 就是圖上 1 公分對應實際 " + N + " 公分。"],
      ["比例尺 1:" + N + " 表示圖上 " + N + " 公分代表實際 1 公分。", false, "解析：前項是圖上、後項是實際，應是圖上 1 公分代表實際 " + N + " 公分。"],
      ["比例尺 1:" + N + " 的圖是縮小圖。", true, "解析：實際比圖上大，所以是縮小圖。"],
      ["比例尺 1:" + N + " 的圖是放大圖。", false, "解析：後項 " + N + " 比前項 1 大，實際較大，是縮小圖。"],
      ["比例尺 1:" + N + " 時，圖上 " + sv(a) + " 公分代表實際 " + D(aN) + " 公分。", true, "解析：" + sv(a) + " × " + N + " = " + D(aN) + "。"]]);
    return { stem: p[0], answer: p[1], explain: p[2] };
  });
  add("tf-L2-01", "tf", 2, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = R(k, 2, 12), ok = k.int(0, 1) === 1, t = qm(a.q, I(N)), f = qd(t, C100); need(t, f);
    return { stem: "比例尺是 1:" + N + "，圖上 " + sv(a) + " 公分的線段，實際長度是 " + D(ok ? t : f) + " 公分。", answer: ok,
      explain: "解析：實際 = " + sv(a) + " × " + N + " = " + D(t) + " 公分（等於 " + D(f) + " 公尺），" + (ok ? "所以正確。" : "敘述把「公尺」的數字寫成了公分，所以錯誤。") };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const N = k.pick([200, 500, 1000, 2000]), a = R(k, 2, 12), ok = k.int(0, 1) === 1, t = qd(qm(a.q, I(N)), C100), f = qm(a.q, I(N)); need(t, f);
    return { stem: "比例尺是 1:" + N + "，圖上 " + sv(a) + " 公分的線段，實際長度是 " + D(ok ? t : f) + " 公尺。", answer: ok,
      explain: "解析：" + sv(a) + " × " + N + " = " + D(f) + " 公分 = " + D(t) + " 公尺。",
      trapNote: "圖上用公分，乘比例尺後得到的仍是公分；沒有除以 100 就直接說成公尺會多出 100 倍。" };
  });
  add("tf-L3-02", "tf", 3, "trap", function (k) {
    const m = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 2, max: 5, dens: [2, 4], places: 1 }), ok = k.int(0, 1) === 1, v = ok ? qm(m, m) : m; need(v);
    return { stem: "把一個正方形圖案的每一邊都放大成 " + auto(m, "mixed") + " 倍，它的面積會變成原來的 " + auto(v, "mixed") + " 倍。", answer: ok,
      explain: "解析：邊長 × " + auto(m, "mixed") + "，面積 = 邊長 × 邊長，所以變成 " + auto(m, "mixed") + " × " + auto(m, "mixed") + " = " + auto(qm(m, m), "mixed") + " 倍。",
      trapNote: "邊長放大 " + auto(m, "mixed") + " 倍時，面積不是 " + auto(m, "mixed") + " 倍，而是 " + auto(qm(m, m), "mixed") + " 倍（長、寬各乘一次）。" };
  });
  add("tf-L4-01", "tf", 4, "trap", function (k) {
    const arr = k.pick([[500, 5000], [1000, 10000], [1000, 50000], [2000, 20000], [5000, 50000]]), A = arr[0], B = arr[1], ok = k.int(0, 1) === 1;
    const x = ok ? A : B, y = ok ? B : A;
    return { stem: "同一個地方，用比例尺 1:" + x + " 的地圖畫出來的圖，比用比例尺 1:" + y + " 的地圖畫出來的圖大。", answer: ok,
      explain: "解析：1:" + A + " 的 1 公分只代表實際 " + A + " 公分，比 1:" + B + " 的 1 公分代表 " + B + " 公分小，所以 1:" + A + " 畫出的圖較大、較詳細。",
      trapNote: "比例尺後項（分母）越大，圖反而畫得越小；不要以為數字大就是圖大。" };
  });
  add("tf-L5-01", "tf", 5, "extend", function (k) {
    const N = k.pick([200, 500, 1000]), a = R(k, 2, 8), side = qd(qm(a.q, I(N)), C100), ok = k.int(0, 1) === 1, t = qm(side, side), f = qd(qm(qm(a.q, a.q), I(N)), C100); need(t, f);
    return { stem: "地圖比例尺 1:" + N + "，圖上正方形邊長 " + sv(a) + " 公分，它的實際面積是 " + D(ok ? t : f) + " 平方公尺。", answer: ok,
      explain: "解析：實際邊長 " + D(side) + " 公尺，面積 " + D(side) + "² = " + D(t) + " 平方公尺。" + (ok ? "" : "敘述的 " + D(f) + " 只把面積乘一次 " + N + "，不正確。") };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = R(k, 2, 15), m = qd(qm(a.q, I(N)), C100); need(m);
    return Object.assign({ stem: "地圖的比例尺是 1:" + N + "，圖上 " + sv(a) + " 公分，實際距離是（　）公尺。", units: ["公尺", "m"],
      explain: "解析：" + sv(a) + " × " + N + " = " + D(qm(a.q, I(N))) + " 公分 = " + D(m) + " 公尺。" }, ans(m, "dec"));
  });
  add("fill-L1-02", "fill", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = R(k, 2, 20), b = qd(qm(a.q, I(N)), C100); need(b);
    return Object.assign({ stem: "實際距離 " + D(b) + " 公尺，比例尺 1:" + N + "，圖上應畫（　）公分。", units: ["公分", "cm"],
      explain: "解析：" + D(b) + " 公尺 = " + D(qm(b, C100)) + " 公分，" + D(qm(b, C100)) + " ÷ " + N + " = " + sv(a) + "。" }, ans(a.q, a.fl));
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const m = Mq(k, 2, 8), a = R(k, 2, 9), v = qm(a.q, m.q); need(v);
    return Object.assign({ stem: "把實際長 " + sv(a) + " 公分的葉片畫成 " + sv(m) + ":1 的放大圖，圖上長（　）公分。", units: ["公分", "cm"],
      explain: "解析：放大 " + sv(m) + " 倍：" + sv(a) + " × " + sv(m) + " = " + D(v) + "。" }, ans(v, "dec"));
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const N = k.pick([200, 500, 1000, 2000, 5000]), a = R(k, 2, 10), b = qd(qm(a.q, I(N)), C100); need(b);
    return Object.assign({ stem: "地圖上 " + sv(a) + " 公分代表實際 " + D(b) + " 公尺，這張地圖的比例尺是 1:（　）。", answer: String(N),
      explain: "解析：" + D(b) + " 公尺 = " + D(qm(b, C100)) + " 公分，" + sv(a) + " : " + D(qm(b, C100)) + " = 1 : " + N + "。",
      trapNote: "沒換成相同單位就比，會得到 1:" + D(qd(b, a.q)) + "（錯）；要先把公尺換成公分。" });
  });
  add("fill-L4-01", "fill", 4, "trap", function (k) {
    const N = k.pick([10000, 50000, 100000, 200000, 250000]), a = R(k, 2, 16), km = qd(qm(a.q, I(N)), C1e5); need(km);
    return Object.assign({ stem: "地圖的比例尺是 1:" + N + "，圖上兩地相距 " + sv(a) + " 公分，實際相距（　）公里。", units: ["公里", "km"],
      explain: "解析：" + sv(a) + " × " + N + " = " + D(qm(a.q, I(N))) + " 公分，÷ 100000 = " + D(km) + " 公里。",
      trapNote: "公分換公里要 ÷ 100000；若只 ÷ 1000（當成公尺換公里）會多出 100 倍。" }, ans(km, "dec"));
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const N = k.pick([50000, 100000, 200000, 250000]), x = R(k, 5, 50), cm = qd(qm(x.q, C1e5), I(N)); need(cm);
    return Object.assign({ stem: "甲、乙兩地實際相距 " + sv(x) + " 公里，在比例尺 1:" + N + " 的地圖上，兩地相距（　）公分。", units: ["公分", "cm"],
      explain: "解析：" + sv(x) + " 公里 = " + D(qm(x.q, C1e5)) + " 公分，" + D(qm(x.q, C1e5)) + " ÷ " + N + " = " + D(cm) + "。" }, ans(cm, "dec"));
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = R(k, 2, 15), m = qd(qm(a.q, I(N)), C100); need(m);
    return Object.assign({ stem: "比例尺 1:" + N + "，圖上 " + sv(a) + " 公分的實際距離（公尺）：" + ex(a.q, a.fl) + " × " + N + " ÷ 100", units: ["公尺"],
      explain: "解析：列式 " + sv(a) + " × " + N + " ÷ 100 = " + D(qm(a.q, I(N))) + " ÷ 100 = " + D(m) + "。" }, ans(m, "dec"));
  });
  add("calc-L2-01", "calc", 2, "basic", function (k) {
    const N = k.pick([50000, 100000, 200000, 250000]), x = R(k, 5, 50), cm = qd(qm(x.q, C1e5), I(N)); need(cm);
    return Object.assign({ stem: "實際距離 " + sv(x) + " 公里，比例尺 1:" + N + "，圖上距離（公分）：" + ex(x.q, x.fl) + " × 100000 ÷ " + N, units: ["公分"],
      explain: "解析：" + sv(x) + " × 100000 = " + D(qm(x.q, C1e5)) + "，÷ " + N + " = " + D(cm) + "。" }, ans(cm, "dec"));
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const N = k.pick([200, 500, 1000]), a = R(k, 2, 8), s = qd(qm(a.q, I(N)), C100), ar = qm(s, s); need(s, ar);
    return Object.assign({ stem: "圖上正方形邊長 " + sv(a) + " 公分，比例尺 1:" + N + "，實際面積（平方公尺）：(" + ex(a.q, a.fl) + " × " + N + " ÷ 100) × (" + ex(a.q, a.fl) + " × " + N + " ÷ 100)", units: ["平方公尺"],
      explain: "解析：括號內 " + sv(a) + " × " + N + " ÷ 100 = " + D(s) + "，面積 " + D(s) + " × " + D(s) + " = " + D(ar) + "。" }, ans(ar, "dec"));
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const N = k.pick([10000, 20000, 25000, 50000]), x = k.randQ(k.flavor(["int", "dec"]), { min: 1, max: 5, places: 1 }), y = I(k.int(1, 9) * 100);
    const tot = qa(qm(x, I(1000)), y), cm = qd(qm(tot, C100), I(N)); need(cm);
    return Object.assign({ stem: "實際距離 " + D(x) + " 公里 " + y.n + " 公尺，比例尺 1:" + N + "，圖上距離（公分）：(" + D(x) + " × 1000 + " + y.n + ") × 100 ÷ " + N, units: ["公分"],
      explain: "解析：先換成公尺 " + D(x) + " × 1000 + " + y.n + " = " + D(tot) + "；再換公分 × 100 = " + D(qm(tot, C100)) + "；÷ " + N + " = " + D(cm) + "。",
      trapNote: "公里、公尺要先合併成同一單位再乘 100 換成公分；只換 " + y.n + " 公尺或漏掉 " + D(x) + " 公里都會錯。" }, ans(cm, "dec"));
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const arr = k.pick([[50000, 20000], [10000, 5000], [20000, 50000], [25000, 10000], [100000, 25000]]), a = R(k, 4, 20), v = qd(qm(a.q, I(arr[0])), I(arr[1])); need(v);
    return Object.assign({ stem: "同樣兩地在比例尺 1:" + arr[0] + " 的地圖上相距 " + sv(a) + " 公分，在比例尺 1:" + arr[1] + " 的地圖上相距幾公分？算式：" + ex(a.q, a.fl) + " × " + arr[0] + " ÷ " + arr[1], units: ["公分"],
      explain: "解析：" + sv(a) + " × " + arr[0] + " = " + D(qm(a.q, I(arr[0]))) + "（實際公分），÷ " + arr[1] + " = " + D(v) + "。" }, ans(v, "dec"));
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const N = k.pick([500, 1000, 2000, 5000]), a = R(k, 2, 14), m = qd(qm(a.q, I(N)), C100); need(m);
    return Object.assign({ stem: "校園平面圖的比例尺是 1:" + N + "，量得操場到校門口在圖上相距 " + sv(a) + " 公分，實際相距幾公尺？", units: ["公尺", "m"],
      explain: "解析：" + sv(a) + " × " + N + " = " + D(qm(a.q, I(N))) + " 公分 = " + D(m) + " 公尺。" }, ans(m, "dec"));
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const N = k.pick([50000, 100000, 200000, 250000]), x = R(k, 5, 50), cm = qd(qm(x.q, C1e5), I(N)); need(cm);
    return Object.assign({ stem: "兩個車站實際相距 " + sv(x) + " 公里，要畫在比例尺 1:" + N + " 的地圖上，圖上應該畫幾公分？", units: ["公分", "cm"],
      explain: "解析：" + sv(x) + " 公里 = " + D(qm(x.q, C1e5)) + " 公分，÷ " + N + " = " + D(cm) + "（公分）。" }, ans(cm, "dec"));
  });
  add("word-L2-02", "word", 2, "basic", function (k) {
    const m = Mq(k, 3, 10), a = R(k, 2, 9), v = qm(a.q, m.q); need(v);
    return Object.assign({ stem: "蝴蝶的翅膀實際長 " + sv(a) + " 公分，美勞課要做 " + sv(m) + ":1 的放大模型，模型翅膀要做幾公分？", units: ["公分", "cm"],
      explain: "解析：放大 " + sv(m) + " 倍：" + sv(a) + " × " + sv(m) + " = " + D(v) + "（公分）。" }, ans(v, "dec"));
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const N = k.pick([200, 500, 1000, 2000]), a = R(k, 2, 10), b = qd(qm(a.q, I(N)), C100); need(b);
    return Object.assign({ stem: "操場的直線跑道實際長 " + D(b) + " 公尺，在平面圖上畫了 " + sv(a) + " 公分，這張圖上 1 公分代表實際幾公分？", answer: String(N), units: ["公分", "cm"],
      explain: "解析：" + D(b) + " 公尺 = " + D(qm(b, C100)) + " 公分，" + D(qm(b, C100)) + " ÷ " + sv(a) + " = " + N + "，也就是比例尺 1:" + N + "。",
      trapNote: "直接算 " + D(b) + " ÷ " + sv(a) + " = " + D(qd(b, a.q)) + " 會得到「公尺」的數字，題目問的是公分，要先換算單位。" });
  });
  add("word-L4-01", "word", 4, "extend", function (k) {
    const N = k.pick([50000, 100000]), a = R(k, 3, 16), v = k.pick([15, 20, 30, 60]), km = qd(qm(a.q, I(N)), C1e5), t = qm(qd(km, I(v)), I(60)); need(km, t);
    return Object.assign({ stem: "地圖比例尺是 1:" + N + "，小明沿著地圖上長 " + sv(a) + " 公分的路線騎腳踏車，時速 " + v + " 公里，他要騎幾分鐘？", units: ["分鐘", "分"],
      explain: "解析：實際路程 " + sv(a) + " × " + N + " ÷ 100000 = " + D(km) + " 公里；時間 = " + D(km) + " ÷ " + v + " = " + D(qd(km, I(v))) + " 小時 = " + D(t) + " 分鐘。" }, ans(t, "dec"));
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const N = k.pick([500, 1000, 2000]), a = R(k, 2, 6), b = R(k, 2, 6), L = qd(qm(a.q, I(N)), C100), W = qd(qm(b.q, I(N)), C100), ar = qm(L, W); need(L, W, ar);
    return Object.assign({ stem: "地圖比例尺 1:" + N + "，圖上有一塊長方形農地，長 " + sv(a) + " 公分、寬 " + sv(b) + " 公分，這塊農地實際面積是多少平方公尺？", units: ["平方公尺", "m2", "m²", "公尺"],
      explain: "解析：實際長 " + D(L) + " 公尺，實際寬 " + D(W) + " 公尺，面積 " + D(L) + " × " + D(W) + " = " + D(ar) + " 平方公尺。" }, ans(ar, "dec"));
  });

  /* ---------- 教材 □ 未知數題（規格第 14 節） ---------- */
  add("single-L1-03", "single", 1, "basic", function (k) {
    const N = k.pick([100, 200, 500, 1000]), a = R(k, 2, 15), m = qd(qm(a.q, I(N)), C100); need(m);
    const c = sc(k, m, [qm(a.q, I(N)), qd(m, I(10)), qm(m, I(10)), qd(qm(a.q, C100), I(N))], a.fl);
    return Object.assign(c, { stem: "比例尺是 1:" + N + "，圖上 " + sv(a) + " 公分代表實際 □ 公尺，□ 是多少？",
      explain: "解析：□ = " + sv(a) + " × " + N + " ÷ 100 = " + D(m) + "（公尺）。" });
  });
  add("fill-L1-03", "fill", 1, "basic", function (k) {
    const N = k.pick([10000, 50000, 100000, 200000, 250000]), a = R(k, 2, 16), km = qd(qm(a.q, I(N)), C1e5); need(km);
    return Object.assign({ stem: "圖上 " + sv(a) + " 公分代表實際 □ 公里，這張地圖的比例尺是 1:" + N + "。", units: ["公里", "km"],
      explain: "解析：□ = " + sv(a) + " × " + N + " ÷ 100000 = " + D(km) + "（公里）。" }, ans(km, "dec"));
  });
  add("calc-L2-02", "calc", 2, "basic", function (k) {
    const N = k.pick([50000, 100000, 200000, 250000]), x = R(k, 5, 50), cm = qd(qm(x.q, C1e5), I(N)); need(cm);
    return Object.assign({ stem: "比例尺是 1:" + N + "，實際距離 " + sv(x) + " 公里，圖上距離是 □ 公分，求 □：" + ex(x.q, x.fl) + " × 100000 ÷ " + N, units: ["公分"],
      explain: "解析：" + sv(x) + " 公里 = " + D(qm(x.q, C1e5)) + " 公分，□ = " + D(qm(x.q, C1e5)) + " ÷ " + N + " = " + D(cm) + "。" }, ans(cm, "dec"));
  });
  add("fill-L2-03", "fill", 2, "basic", function (k) {
    const a = R(k, 2, 9), b = R(k, 2, 12), t = k.randQ(k.flavor(["int", "int", "dec"]), { min: 2, max: 5, places: 1 }), c0 = qm(a.q, t), v = qm(b.q, t); need(c0, v);
    return Object.assign({ stem: "放大圖和原圖的對應邊長成比例：" + sv(a) + ":" + sv(b) + " = " + D(c0) + ":□，□ 是多少？",
      explain: "解析：" + sv(a) + " 變成 " + D(c0) + "，放大 " + D(t) + " 倍，所以 □ = " + sv(b) + " × " + D(t) + " = " + D(v) + "。" }, ans(v, b.fl));
  });
  add("single-L3-04", "single", 3, "trap", function (k) {
    const N = k.pick([10000, 50000, 100000, 200000, 250000]), a = R(k, 2, 10), b = qd(qm(a.q, I(N)), C1e5); need(b);
    const cs = ["1:" + D(qd(qm(b, I(1000)), a.q)), "1:" + D(qd(qm(b, C100), a.q)), "1:" + D(qd(b, a.q)), N + ":1"];
    const w = k.distractors("1:" + N, cs, 3); if (w.length < 3) throw new Error("retry");
    return { stem: "地圖上 " + sv(a) + " 公分代表實際 " + D(b) + " 公里，這張地圖的比例尺是 1:□，□ 是多少？", options: ["1:" + N].concat(w), answer: 0,
      explain: "解析：" + D(b) + " 公里 = " + D(qm(b, C1e5)) + " 公分，□ = " + D(qm(b, C1e5)) + " ÷ " + sv(a) + " = " + N + "，比例尺是 1:" + N + "。",
      trapNote: "公里要換成公分（× 100000）才能和圖上的公分相比；只乘 1000（當成公尺）或不換算，比例尺會差很多倍。" };
  });
  add("word-L3-02", "word", 3, "basic", function (k) {
    const N = k.pick([50000, 100000, 200000, 250000]), a = R(k, 2, 16), km = qd(qm(a.q, I(N)), C1e5); need(km);
    return Object.assign({ stem: "地圖比例尺是 1:" + N + "，量得兩個景點在圖上相距 " + sv(a) + " 公分，實際相距 □ 公里。", units: ["公里", "km"],
      explain: "解析：□ = " + sv(a) + " × " + N + " ÷ 100000 = " + D(km) + "（公里）。" }, ans(km, "dec"));
  });
  add("tf-L4-02", "tf", 4, "trap", function (k) {
    const N = k.pick([10000, 50000, 100000, 200000, 250000]), a = R(k, 2, 16), ok = k.int(0, 1) === 1, t = qd(qm(a.q, I(N)), C1e5), f = qd(qm(a.q, I(N)), I(1000)); need(t, f);
    return { stem: "比例尺是 1:" + N + "，圖上 " + sv(a) + " 公分代表實際 □ 公里，□ = " + D(ok ? t : f) + "。", answer: ok,
      explain: "解析：" + sv(a) + " × " + N + " = " + D(qm(a.q, I(N))) + " 公分 = " + D(t) + " 公里。",
      trapNote: "公分換公里要 ÷ 100000；" + D(f) + " 是只 ÷ 1000 的結果，單位換算少除了 100。" };
  });
  add("word-L4-04", "word", 4, "extend", function (k) {
    const a = R(k, 1, 9), m = Mq(k, 2, 9), b = qm(a.q, m.q); need(b);
    return Object.assign({ stem: "螞蟻的身體實際長 " + sv(a) + " 公分，畫成放大圖後長 " + D(b) + " 公分，這張放大圖的比例尺是 □:1，□ 是多少？", units: ["倍"],
      explain: "解析：放大倍率 = 圖上長度 ÷ 實際長度 = " + D(b) + " ÷ " + sv(a) + " = " + sv(m) + "，比例尺是 " + sv(m) + ":1。" }, ans(m.q, m.fl));
  });
  add("fill-L5-02", "fill", 5, "extend", function (k) {
    const N1 = k.pick([5000, 10000, 25000]), mult = k.pick([2, 4, 5, 10]), a = R(k, 4, 20), b = qd(a.q, I(mult)); need(b);
    return Object.assign({ stem: "同樣兩地，在比例尺 1:" + N1 + " 的地圖上相距 " + sv(a) + " 公分，在另一張地圖上相距 " + D(b) + " 公分，另一張地圖的比例尺是 1:□。", answer: String(N1 * mult),
      explain: "解析：兩地實際距離 = " + sv(a) + " × " + N1 + " = " + D(qm(a.q, I(N1))) + " 公分；□ = " + D(qm(a.q, I(N1))) + " ÷ " + D(b) + " = " + (N1 * mult) + "。" });
  });

  ExamBank.register("scale", "scale-main", S);
})();
