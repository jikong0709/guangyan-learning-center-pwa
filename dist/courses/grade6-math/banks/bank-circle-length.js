/* 題庫：circle-length 圓周率、圓周長、半圓／扇形弧長與周長（π 取 3.14，半徑為 7 的倍數時可取 22/7）。題庫工 B
   數字風格：半徑／直徑可為整數、小數、分數、帶分數；全部用 kit.Q 精確運算。 */
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
    const all = [o.stem, o.explain, o.trapNote, o.answer, o.options ? o.options.join(" ") : ""].join(" ");
    const re = /(\d+)\/(\d+)/g; let m;
    while ((m = re.exec(all))) { if (+m[2] > 60) throw new Error("retry"); }
    if (/\d{9,}/.test(all)) throw new Error("retry");
    return o;
  }
  /* gen 包一層重試：數字不乾淨（小數超過 4 位、干擾項不足、選項重複）就重抽 */
  function add(id, type, level, tag, gen) {
    S.push({ id: "circle-length-" + id, type, level, tag, gen: function (k) {
      let e; for (let i = 0; i < 60; i++) { try { return post(gen(k)); } catch (x) { e = x; } } throw e;
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
  function ex(q, fl) { const s = K.qShow(q, fl); return /[ \/]/.test(s) ? "(" + s + ")" : s; } /* 算式中的分數／帶分數加括號 */
  function R(k, lo, hi, w, dens) { const fl = k.flavor(["int", "dec", "mixed", "frac"], w || [3, 3, 5, 1]); return { q: k.randQ(fl, { min: lo, max: hi, dens: dens || [2, 4, 5, 10] }), fl: fl }; }
  function R22(k) { const q = Q(7 * k.int(2, 12), 4); return { q: q, fl: q.d === 1 ? "int" : k.pick(["dec", "mixed"]) }; }
  function RR(k, z, lo, hi, w) { return z ? R22(k) : R(k, lo, hi, w); }
  function sv(x) { return K.qShow(x.q, x.fl); }
  function PIx(k, ok22) { return ok22 && k.int(0, 3) === 0 ? { p: Q(22, 7), t: "22/7", z: true } : { p: Q(157, 50), t: "3.14", z: false }; }
  function pp(pi) { return pi.t; }

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 3, 15), P = pi.p, q = r.q;
    const C = qm(qm(I(2), P), q);
    const c = sc(k, C, [qm(P, q), qm(P, qm(q, q)), qm(qm(I(2), P), qm(q, q)), qm(qm(I(4), P), q)], r.fl);
    return Object.assign(c, { stem: "一個圓的半徑是 " + sv(r) + " 公分，圓周率取 " + pp(pi) + "，這個圓的周長是多少公分？",
      explain: "解析：圓周長 = 2 × " + pp(pi) + " × 半徑 = 2 × " + pp(pi) + " × " + sv(r) + " = " + D(C) + "（公分）。" });
  });
  add("single-L1-02", "single", 1, "basic", function (k) {
    const d = R(k, 4, 30), P = Q(157, 50), q = d.q, C = qm(P, q);
    const c = sc(k, C, [qm(qm(I(2), P), q), qm(P, qm(q, q)), qd(C, I(2)), qa(C, q)], d.fl);
    return Object.assign(c, { stem: "一個圓的直徑是 " + sv(d) + " 公分，圓周率取 3.14，這個圓的周長是多少公分？",
      explain: "解析：圓周長 = 3.14 × 直徑 = 3.14 × " + sv(d) + " = " + D(C) + "（公分）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const d = R(k, 2, 20), P = Q(157, 50), q = d.q, C = qm(P, q); need(C);
    const c = sc(k, q, [qd(q, I(2)), qm(q, I(2)), qd(C, I(2)), qm(C, P)], d.fl);
    return Object.assign(c, { stem: "一個圓的周長是 " + D(C) + " 公分，圓周率取 3.14，這個圓的直徑是多少公分？",
      explain: "解析：周長 = 3.14 × 直徑，所以直徑 = " + D(C) + " ÷ 3.14 = " + auto(q, d.fl) + "（公分）。",
      trapNote: "把 " + D(C) + " ÷ 3.14 的結果 " + auto(q, d.fl) + " 當成半徑是常見錯誤；周長 ÷ 3.14 得到的是直徑，要再 ÷ 2 才是半徑 " + auto(qd(q, I(2)), d.fl) + "。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    const d = R(k, 2, 24), P = Q(157, 50), q = d.q, arc = qd(qm(P, q), I(2)), per = qa(arc, q);
    const c = sc(k, per, [arc, qm(P, q), qa(qm(P, q), q), qa(arc, qd(q, I(2)))], d.fl);
    return Object.assign(c, { stem: "半圓形的直徑是 " + sv(d) + " 公分，圓周率取 3.14，這個半圓形的周長是多少公分？",
      explain: "解析：弧長 = 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "；半圓周長還要加上直徑 " + sv(d) + "，共 " + D(arc) + " + " + sv(d) + " = " + D(per) + "（公分）。",
      trapNote: "只算弧長 " + D(arc) + " 而忘記加直邊（直徑）" + sv(d) + " 公分，會少算；半圓的「周長」是封閉圖形的整圈邊長。" });
  });
  add("single-L4-01", "single", 4, "extend", function (k) {
    const pi = PIx(k, true), P = pi.p;
    const r = pi.z ? { q: I(k.pick([7, 14, 21])), fl: "int" } : R(k, 10, 50, [2, 4, 2, 0.01]);
    const m = I(k.pick([10, 20, 50, 100])), Dd = qm(qm(qm(I(2), P), r.q), m), mm = qd(Dd, I(100));
    const c = sc(k, mm, [Dd, qd(qm(qm(P, r.q), m), I(100)), qd(Dd, I(10)), qd(qm(qm(P, qm(r.q, r.q)), m), I(100))], "dec");
    return Object.assign(c, { stem: "一個輪子的半徑是 " + sv(r) + " 公分，在地面上直線滾動 " + m.n + " 圈（圓周率取 " + pp(pi) + "），輪子前進了幾公尺？",
      explain: "解析：滾一圈前進一個周長 2 × " + pp(pi) + " × " + sv(r) + " = " + D(qm(qm(I(2), P), r.q)) + " 公分；" + m.n + " 圈 = " + D(Dd) + " 公分 = " + D(mm) + " 公尺。" });
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const a = R(k, 3, 10), P = Q(157, 50), diff = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 2, max: 8, dens: [2, 4, 5] }), b = qa(a.q, diff);
    const dl = qm(qm(I(2), P), diff);
    const c = sc(k, dl, [qm(P, diff), qm(qm(I(2), P), qa(b, a.q)), qm(P, qs(qm(b, b), qm(a.q, a.q))), qm(qm(I(2), P), b)], a.fl);
    return Object.assign(c, { stem: "小圓的半徑是 " + sv(a) + " 公分，大圓的半徑是 " + auto(b, a.fl) + " 公分，圓周率取 3.14，大圓的周長比小圓的周長多幾公分？",
      explain: "解析：周長差 = 2 × 3.14 × " + auto(b, a.fl) + " − 2 × 3.14 × " + sv(a) + " = 6.28 × (" + auto(b, a.fl) + " − " + sv(a) + ") = " + D(dl) + "（公分）。" });
  });
  add("single-L5-01", "single", 5, "trap", function (k) {
    const t = R(k, 2, 9), P = Q(157, 50), inc = qm(qm(I(2), P), t.q); need(inc);
    const c = sc(k, t.q, [qm(t.q, I(2)), qd(t.q, I(2)), inc, qm(P, t.q)], t.fl);
    return Object.assign(c, { stem: "一個圓的周長增加了 " + D(inc) + " 公分，圓周率取 3.14，它的半徑增加了幾公分？",
      explain: "解析：周長 = 2 × 3.14 × 半徑，所以半徑增加量 = " + D(inc) + " ÷ 6.28 = " + sv(t) + "（公分）。",
      trapNote: "用 " + D(inc) + " ÷ 3.14 會得到 " + auto(qm(t.q, I(2)), t.fl) + "，那是「直徑」增加的量；題目問半徑，要再 ÷ 2 （即 ÷ 6.28）。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const c = mu(k,
      ["圓周率是圓周長除以直徑的結果", "不論圓大圓小，圓周率都是同一個固定的數", "圓周率除不盡，計算時常取 3.14 當近似值", "圓的周長大約是直徑的 3.14 倍"],
      ["圓越大，圓周率就越大", "圓周率等於圓周長除以半徑", "圓周率剛好等於 3.14，不是近似值", "圓的周長大約是半徑的 3.14 倍"]);
    return Object.assign(c, { stem: "關於圓周率，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：圓周率 = 圓周長 ÷ 直徑，是固定的值（約 3.14159…，除不盡），所以周長約為直徑的 3.14 倍、半徑的 6.28 倍。" });
  });
  add("multi-L2-01", "multi", 2, "trap", function (k) {
    const r = R(k, 3, 10), P = Q(157, 50), q = r.q, C = qm(qm(I(2), P), q), A = qm(P, qm(q, q)); need(C, A);
    const c = mu(k,
      ["求圓周長要用 2 × 3.14 × 半徑", "半徑 " + sv(r) + " 公分的圓，周長是 " + D(C) + " 公分", "周長的單位是公分，不是平方公分"],
      ["半徑 " + sv(r) + " 公分的圓，周長是 " + D(A) + " 公分", "求圓周長要用 3.14 × 半徑 × 半徑", "周長的單位是平方公分"]);
    return Object.assign(c, { stem: "半徑是 " + sv(r) + " 公分的圓，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：周長 = 2 × 3.14 × " + sv(r) + " = " + D(C) + " 公分；3.14 × 半徑 × 半徑 是面積，單位為平方公分。",
      trapNote: "把周長和面積公式混用：3.14 × " + sv(r) + " × " + sv(r) + " = " + D(A) + " 是面積，不是周長。" });
  });
  add("multi-L2-02", "multi", 2, "basic", function (k) {
    const d = R(k, 5, 20), P = Q(157, 50), q = d.q, C = qm(P, q), C2 = qm(C, I(2)), h = qd(q, I(2)); need(C, C2, h);
    const c = mu(k,
      ["直徑 " + sv(d) + " 公分的圓，周長是 " + D(C) + " 公分", "直徑 " + sv(d) + " 公分的圓，半徑是 " + auto(h, d.fl) + " 公分", "周長 ÷ 直徑 = 圓周率"],
      ["直徑 " + sv(d) + " 公分的圓，周長是 " + D(C2) + " 公分", "直徑 " + sv(d) + " 公分的圓，半徑是 " + auto(qm(q, I(2)), d.fl) + " 公分", "周長 ÷ 半徑 = 圓周率"]);
    return Object.assign(c, { stem: "直徑是 " + sv(d) + " 公分的圓，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：周長 = 3.14 × " + sv(d) + " = " + D(C) + "；半徑 = " + sv(d) + " ÷ 2 = " + auto(h, d.fl) + "；圓周率 = 周長 ÷ 直徑。" });
  });
  add("multi-L3-01", "multi", 3, "trap", function (k) {
    const d = R(k, 3, 12), P = Q(157, 50), q = d.q, arc = qd(qm(P, q), I(2)), per = qa(arc, q); need(arc, per);
    const c = mu(k,
      ["半圓的弧長是 " + D(arc) + " 公分", "半圓的周長是 " + D(per) + " 公分", "半圓的周長比它的弧長多 " + sv(d) + " 公分", "半圓的周長 = 整圓周長的一半 + 直徑"],
      ["半圓的周長就是整圓周長的一半，也就是 " + D(arc) + " 公分", "半圓的周長是 " + D(qa(qm(P, q), q)) + " 公分", "半圓的周長是 " + D(qa(arc, qd(q, I(2)))) + " 公分"]);
    return Object.assign(c, { stem: "直徑是 " + sv(d) + " 公分的半圓，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：弧長 = 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "；周長 = 弧長 + 直徑 = " + D(arc) + " + " + sv(d) + " = " + D(per) + "。",
      trapNote: "「半圓的周長是圓周長的一半」是錯的：還要加上直徑那條直邊；也不能加上半徑。" });
  });
  add("multi-L4-01", "multi", 4, "extend", function (k) {
    const r1 = R(k, 2, 6), m = k.randQ(k.flavor(["int", "int", "dec", "mixed"]), { min: 2, max: 4, dens: [2, 4] }), P = Q(157, 50), r2 = qm(r1.q, m);
    const df = qm(qm(I(2), P), qs(r2, r1.q)), wrong1 = qm(P, qs(r2, r1.q)), wrong2 = qm(qm(I(2), P), qa(r2, r1.q)); need(df, wrong1, wrong2, r2);
    const c = mu(k,
      ["大圓的直徑是小圓的 " + auto(m, "mixed") + " 倍", "大圓的周長是小圓的 " + auto(m, "mixed") + " 倍", "大圓的周長比小圓多 " + D(df) + " 公分"],
      ["大圓的周長是小圓的 " + auto(qm(m, m), "mixed") + " 倍", "大圓的周長比小圓多 " + D(wrong1) + " 公分", "大圓周長與小圓周長相差 " + D(wrong2) + " 公分"]);
    return Object.assign(c, { stem: "小圓半徑 " + sv(r1) + " 公分，大圓半徑 " + auto(r2, r1.fl) + " 公分，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：半徑、直徑、周長都成同倍數（" + auto(m, "mixed") + " 倍）；周長差 = 6.28 × (" + auto(r2, r1.fl) + " − " + sv(r1) + ") = " + D(df) + "。面積才會是平方倍。" });
  });
  add("multi-L5-01", "multi", 5, "extend", function (k) {
    const r = R(k, 10, 50, [2, 4, 2, 0.01]), t = I(k.int(5, 30)), P = Q(157, 50), one = qm(qm(I(2), P), r.q), tot = qm(one, t), w1 = qm(qm(P, r.q), t), w2 = qm(P, qm(r.q, r.q)); need(one, tot, w1, w2);
    const c = mu(k,
      ["輪子轉一圈前進 " + D(one) + " 公分", "轉 " + t.n + " 圈共前進 " + D(tot) + " 公分", "轉 " + (2 * t.n) + " 圈前進的距離是轉 " + t.n + " 圈的 2 倍"],
      ["轉 " + t.n + " 圈共前進 " + D(w1) + " 公分", "輪子轉一圈前進 " + D(w2) + " 公分", "轉的圈數越多，輪子的周長就越長"]);
    return Object.assign(c, { stem: "一個輪子的半徑是 " + sv(r) + " 公分，在平地上直線滾動 " + t.n + " 圈，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：轉一圈走一個周長 2 × 3.14 × " + sv(r) + " = " + D(one) + "；" + t.n + " 圈 = " + D(one) + " × " + t.n + " = " + D(tot) + "。圈數與距離成正比，輪子大小不變。" });
  });

  /* ---------- tf ---------- */
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const p = k.pick([
      ["圓周率是圓周長除以直徑得到的固定數值。", true, "解析：圓周率 = 圓周長 ÷ 直徑，任何圓都一樣。"],
      ["圓周率等於圓周長除以半徑。", false, "解析：圓周率是周長 ÷ 直徑；周長 ÷ 半徑 約等於 6.28。"],
      ["大圓的圓周率比小圓的圓周率大。", false, "解析：所有圓的圓周率都相同。"],
      ["圓周率取 3.14 只是近似值，它其實除不盡。", true, "解析：圓周率是除不盡的數，3.14 是常用近似值。"],
      ["圓的周長一定比它的直徑長。", true, "解析：周長約是直徑的 3.14 倍，比直徑長。"]]);
    return { stem: p[0] + "（圓周率取 3.14）", answer: p[1], explain: p[2] };
  });
  add("tf-L2-01", "tf", 2, "basic", function (k) {
    const r = R(k, 3, 12), P = Q(157, 50), ok = k.int(0, 1) === 1, t = qm(qm(I(2), P), r.q), f = qm(P, r.q); need(t, f);
    return { stem: "半徑 " + sv(r) + " 公分的圓，周長是 " + D(ok ? t : f) + " 公分。（圓周率取 3.14）", answer: ok,
      explain: "解析：周長 = 2 × 3.14 × " + sv(r) + " = " + D(t) + " 公分，" + (ok ? "所以敘述正確。" : "敘述中的 " + D(f) + " 少乘了 2，所以錯誤。") };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const m = k.randQ(k.flavor(["int", "int", "dec", "mixed"]), { min: 2, max: 4, dens: [2, 4] }), ok = k.int(0, 1) === 1, v = ok ? m : qm(m, m); need(m, v);
    return { stem: "把圓的直徑變成原來的 " + auto(m, "mixed") + " 倍，圓的周長會變成原來的 " + auto(v, "mixed") + " 倍。（圓周率取 3.14）", answer: ok,
      explain: "解析：周長 = 3.14 × 直徑，周長與直徑成正比，直徑 " + auto(m, "mixed") + " 倍則周長也是 " + auto(m, "mixed") + " 倍。",
      trapNote: "把「面積」的平方倍關係（" + auto(m, "mixed") + "×" + auto(m, "mixed") + " = " + auto(qm(m, m), "mixed") + " 倍）拿來套在周長上是常見錯誤；周長只是同倍數變化。" };
  });
  add("tf-L3-02", "tf", 3, "trap", function (k) {
    const d = R(k, 2, 20), P = Q(157, 50), ok = k.int(0, 1) === 1, arc = qd(qm(P, d.q), I(2)), per = qa(arc, d.q); need(arc, per);
    return { stem: "直徑 " + sv(d) + " 公分的半圓形，周長是 " + D(ok ? per : arc) + " 公分。（圓周率取 3.14）", answer: ok,
      explain: "解析：半圓周長 = 弧長 " + D(arc) + " + 直徑 " + sv(d) + " = " + D(per) + " 公分。",
      trapNote: "只算弧長 " + D(arc) + " 公分就當作周長，漏掉直邊 " + sv(d) + " 公分。" };
  });
  add("tf-L4-01", "tf", 4, "extend", function (k) {
    const r = R(k, 2, 8), m = k.randQ(k.flavor(["int", "int", "dec"]), { min: 2, max: 4 }), P = Q(157, 50), a = qm(qm(I(2), P), r.q), ok = k.int(0, 1) === 1, v = ok ? qm(a, m) : qm(a, qm(m, m)); need(a, v, qm(a, m));
    return { stem: "小圓周長是 " + D(a) + " 公分，大圓的半徑是小圓半徑的 " + auto(m, "mixed") + " 倍，所以大圓周長是 " + D(v) + " 公分。（圓周率取 3.14）", answer: ok,
      explain: "解析：半徑 " + auto(m, "mixed") + " 倍，周長也是 " + auto(m, "mixed") + " 倍：" + D(a) + " × " + auto(m, "mixed") + " = " + D(qm(a, m)) + " 公分。" };
  });
  add("tf-L5-01", "tf", 5, "extend", function (k) {
    const a = R(k, 2, 12), P = Q(157, 50), ok = k.int(0, 1) === 1, t = qm(qm(I(2), P), a.q), f = qm(P, a.q); need(t, f);
    return { stem: "操場的外圈跑道半徑比內圈多 " + sv(a) + " 公尺，外圈跑一圈會比內圈多 " + D(ok ? t : f) + " 公尺。（圓周率取 3.14）", answer: ok,
      explain: "解析：周長差 = 2 × 3.14 × " + sv(a) + " = " + D(t) + " 公尺，與內圈原本多大無關。" };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 2, 20), C = qm(qm(I(2), pi.p), r.q); need(C);
    return Object.assign({ stem: "半徑 " + sv(r) + " 公分的圓，周長是（　）公分。（圓周率取 " + pp(pi) + "）", units: ["公分", "cm"],
      explain: "解析：2 × " + pp(pi) + " × " + sv(r) + " = " + D(C) + "。" }, ans(C, "dec"));
  });
  add("fill-L1-02", "fill", 1, "basic", function (k) {
    const d = R(k, 3, 30), C = qm(Q(157, 50), d.q); need(C);
    return Object.assign({ stem: "直徑 " + sv(d) + " 公分的圓，周長是（　）公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：3.14 × " + sv(d) + " = " + D(C) + "。" }, ans(C, "dec"));
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const r = R(k, 3, 15), C = qm(qm(I(2), Q(157, 50)), r.q); need(C);
    return Object.assign({ stem: "圓的周長是 " + D(C) + " 公分，半徑是（　）公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：半徑 = 周長 ÷ 3.14 ÷ 2 = " + D(C) + " ÷ 6.28 = " + sv(r) + "。" }, ans(r.q, r.fl));
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const d = R(k, 2, 24), P = Q(157, 50), arc = qd(qm(P, d.q), I(2)), per = qa(arc, d.q); need(arc, per);
    return Object.assign({ stem: "直徑 " + sv(d) + " 公分的半圓形，周長是（　）公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：弧長 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "，加直徑 " + sv(d) + "，得 " + D(per) + "。",
      trapNote: "只寫 " + D(arc) + "（弧長）會漏掉直邊 " + sv(d) + " 公分。" }, ans(per, "dec"));
  });
  add("fill-L3-02", "fill", 3, "basic", function (k) {
    const pi = PIx(k, true), r = pi.z ? { q: I(k.pick([7, 14, 21])), fl: "int" } : R(k, 8, 30, [2, 4, 2, 0.01]), C = qm(qm(I(2), pi.p), r.q); need(C);
    return Object.assign({ stem: "時鐘的分針長 " + sv(r) + " 公分，分針針尖轉一圈（走 1 小時）走過（　）公分。（圓周率取 " + pp(pi) + "）", units: ["公分", "cm"],
      explain: "解析：針尖轉一圈走的是半徑 " + sv(r) + " 公分的圓周：2 × " + pp(pi) + " × " + sv(r) + " = " + D(C) + "。" }, ans(C, "dec"));
  });
  add("fill-L4-01", "fill", 4, "basic", function (k) {
    const d = R(k, 30, 80, [3, 4, 1, 0.01]), t = I(k.pick([10, 20, 25, 50])), P = Q(157, 50), one = qm(P, d.q), tot = qd(qm(one, t), I(100)); need(one, tot);
    return Object.assign({ stem: "車輪的直徑是 " + sv(d) + " 公分，滾動 " + t.n + " 圈前進（　）公尺。（圓周率取 3.14）", units: ["公尺", "m"],
      explain: "解析：一圈 3.14 × " + sv(d) + " = " + D(one) + " 公分；" + t.n + " 圈 = " + D(qm(one, t)) + " 公分 = " + D(tot) + " 公尺。" }, ans(tot, "dec"));
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const d = R(k, 4, 20), t = I(k.int(3, 8)), P = Q(157, 50), one = qm(P, d.q), L = qm(one, t); need(L, one);
    return Object.assign({ stem: "一條繩子剛好繞圓柱形水桶 " + t.n + " 圈，繩長 " + D(L) + " 公分（不計接頭），水桶的直徑是（　）公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：繞一圈 = " + D(L) + " ÷ " + t.n + " = " + D(one) + " 公分，直徑 = " + D(one) + " ÷ 3.14 = " + sv(d) + "。" }, ans(d.q, d.fl));
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const d = R(k, 2, 25), C = qm(Q(157, 50), d.q); need(C);
    return Object.assign({ stem: "圓周率取 3.14，計算直徑 " + sv(d) + " 公分的圓周長：3.14 × " + ex(d.q, d.fl), units: ["公分"],
      explain: "解析：列式 3.14 × " + sv(d) + " = " + D(C) + "。" }, ans(C, "dec"));
  });
  add("calc-L2-01", "calc", 2, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 3, 20), C = qm(qm(I(2), pi.p), r.q); need(C);
    return Object.assign({ stem: "圓周率取 " + pp(pi) + "，計算半徑 " + sv(r) + " 公分的圓周長：2 × " + pp(pi) + " × " + ex(r.q, r.fl), units: ["公分"],
      explain: "解析：2 × " + pp(pi) + " = " + D(qm(I(2), pi.p)) + (pi.z ? "" : "") + "，再乘 " + sv(r) + " 得 " + D(C) + "。" }, ans(C, "dec"));
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const fl = k.flavor(["int", "dec", "mixed"], [1, 3, 2]), a = k.randQ(fl, { min: 11, max: 38, dens: [2, 4, 5] }), b = qs(I(k.pick([50, 100])), a), P = Q(157, 50), tot = qm(P, qa(a, b)); need(tot, b);
    return Object.assign({ stem: "圓周率取 3.14，用簡便方法計算：3.14 × " + ex(a, fl) + " + 3.14 × " + ex(b, fl),
      explain: "解析：提出 3.14：3.14 × (" + auto(a, fl) + " + " + auto(b, fl) + ") = 3.14 × " + auto(qa(a, b), fl) + " = " + D(tot) + "。" }, ans(tot, "dec"));
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const d = R(k, 3, 30), P = Q(157, 50), arc = qd(qm(P, d.q), I(2)), per = qa(arc, d.q); need(arc, per);
    return Object.assign({ stem: "圓周率取 3.14，計算直徑 " + sv(d) + " 公分的半圓形周長：3.14 × " + ex(d.q, d.fl) + " ÷ 2 + " + ex(d.q, d.fl), units: ["公分"],
      explain: "解析：弧長 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "，再加直徑 " + sv(d) + "，得 " + D(per) + "。",
      trapNote: "最後的「+ " + sv(d) + "」是直邊，漏掉就只剩弧長 " + D(arc) + "。" }, ans(per, "dec"));
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const r = R(k, 10, 40, [3, 4, 1, 0.01]), w = R(k, 1, 5, [2, 4, 3, 0.01]), P = Q(157, 50), rw = qa(r.q, w.q), v = qm(qm(I(2), P), w.q); need(v);
    return Object.assign({ stem: "圓周率取 3.14，計算：2 × 3.14 × " + ex(rw, r.fl) + " − 2 × 3.14 × " + ex(r.q, r.fl), units: ["公尺", "公分"],
      explain: "解析：提出 6.28：6.28 × (" + auto(rw, r.fl) + " − " + sv(r) + ") = 6.28 × " + sv(w) + " = " + D(v) + "。差只跟半徑差有關。" }, ans(v, "dec"));
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const d = R(k, 40, 100, [3, 4, 1, 0.01]), C = qm(Q(157, 50), d.q); need(C);
    return Object.assign({ stem: "圓形桌面的直徑是 " + sv(d) + " 公分，要在桌子邊緣圍一圈花邊，花邊至少要多長？（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：花邊長 = 圓周長 = 3.14 × " + sv(d) + " = " + D(C) + "（公分）。" }, ans(C, "dec"));
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 3, 15), C = qm(qm(I(2), pi.p), r.q); need(C);
    return Object.assign({ stem: "公園有一座圓形花圃，半徑是 " + sv(r) + " 公尺，沿著花圃邊緣圍一圈籬笆，籬笆長幾公尺？（圓周率取 " + pp(pi) + "）", units: ["公尺", "m"],
      explain: "解析：2 × " + pp(pi) + " × " + sv(r) + " = " + D(C) + "（公尺）。" }, ans(C, "dec"));
  });
  add("word-L2-02", "word", 2, "basic", function (k) {
    const r = R(k, 4, 20), L = qm(qm(I(2), Q(157, 50)), r.q); need(L);
    return Object.assign({ stem: "小華把一條長 " + D(L) + " 公分的鐵絲彎成一個圓（接頭不計），這個圓的半徑是幾公分？（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：半徑 = " + D(L) + " ÷ 3.14 ÷ 2 = " + sv(r) + "（公分）。" }, ans(r.q, r.fl));
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const d = R(k, 3, 30), P = Q(157, 50), arc = qd(qm(P, d.q), I(2)), per = qa(arc, d.q); need(arc, per);
    return Object.assign({ stem: "半圓形花圃的直徑是 " + sv(d) + " 公尺，花圃四周（包括直的那一邊）都要圍上籬笆，籬笆至少要多長？（圓周率取 3.14）", units: ["公尺", "m"],
      explain: "解析：弧線 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "，直邊 " + sv(d) + "，合計 " + D(per) + "（公尺）。",
      trapNote: "只算弧線 " + D(arc) + " 公尺會漏掉直邊；題目寫「包括直的那一邊」就要加直徑。" }, ans(per, "dec"));
  });
  add("word-L4-01", "word", 4, "basic", function (k) {
    const d = R(k, 40, 80, [3, 4, 1, 0.01]), t = I(k.pick([10, 20, 25, 50])), P = Q(157, 50), one = qm(P, d.q), tot = qd(qm(one, t), I(100)); need(one, tot);
    return Object.assign({ stem: "腳踏車輪的直徑是 " + sv(d) + " 公分，車輪在平地上轉 " + t.n + " 圈，車子前進幾公尺？（圓周率取 3.14）", units: ["公尺", "m"],
      explain: "解析：一圈 3.14 × " + sv(d) + " = " + D(one) + " 公分，" + t.n + " 圈 = " + D(qm(one, t)) + " 公分 = " + D(tot) + " 公尺。" }, ans(tot, "dec"));
  });
  add("word-L4-02", "word", 4, "extend", function (k) {
    const d = R(k, 6, 20), t = I(k.int(3, 6)), knot = k.randQ(k.flavor(["int", "dec"]), { min: 5, max: 15 }), P = Q(157, 50), one = qa(qm(P, d.q), knot), tot = qm(one, t); need(one, tot);
    return Object.assign({ stem: "用繩子把 " + t.n + " 個同樣大小的圓形水桶，各繞一圈（每桶直徑 " + sv(d) + " 公分）後綁緊，每個結要多用 " + auto(knot, "dec") + " 公分繩子，共需多少公分繩子？（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：每桶繩長 3.14 × " + sv(d) + " + " + auto(knot, "dec") + " = " + D(one) + "，共 " + t.n + " 桶：" + D(one) + " × " + t.n + " = " + D(tot) + "（公分）。" }, ans(tot, "dec"));
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const r = I(k.int(20, 40)), w = R(k, 1, 2, [2, 4, 3, 0.01]), P = Q(157, 50), v = qm(qm(I(2), P), qm(I(2), w.q)); need(v);
    return Object.assign({ stem: "圓形跑道每一道寬 " + sv(w) + " 公尺。第 1 道的跑步路線半徑是 " + r.n + " 公尺，比賽時第 3 道的選手沿著半徑更大的圓跑一圈，他比第 1 道的選手多跑幾公尺？（兩道圓心相同）（圓周率取 3.14）", units: ["公尺", "m"],
      explain: "解析：第 3 道半徑比第 1 道多 2 × " + sv(w) + " = " + auto(qm(I(2), w.q), w.fl) + " 公尺；多跑 2 × 3.14 × " + auto(qm(I(2), w.q), w.fl) + " = " + D(v) + "（公尺），與 " + r.n + " 公尺無關。" }, ans(v, "dec"));
  });

  ExamBank.register("circle-length", "circle-length-main", S);
})();
