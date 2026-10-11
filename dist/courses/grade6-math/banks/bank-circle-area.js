/* 題庫：circle-area 圓面積、扇形面積、複合圖形面積（π 取 3.14，半徑為 7 的倍數時可取 22/7）。題庫工 B
   數字風格：半徑／直徑／邊長可為整數、小數、分數、帶分數；全部用 kit.Q 精確運算。 */
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
    S.push({ id: "circle-area-" + id, type, level, tag, gen: function (k) {
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
  function R(k, lo, hi, w) { const fl = k.flavor(["int", "dec", "mixed", "frac"], w || [5, 3, 5, 1]); return { q: k.randQ(fl, { min: lo, max: hi, dens: [2, 5], places: 1 }), fl: fl }; }
  function R22(k) { const q = Q(7 * k.int(1, 8), 4); return { q: q, fl: q.d === 1 ? "int" : k.pick(["dec", "mixed"]) }; }
  function RR(k, z, lo, hi, w) { return z ? R22(k) : R(k, lo, hi, w); }
  function sv(x) { return K.qShow(x.q, x.fl); }
  function PIx(k, ok22) { return ok22 && k.int(0, 3) === 0 ? { p: Q(22, 7), t: "22/7", z: true } : { p: Q(157, 50), t: "3.14", z: false }; }
  function A(p, r) { return qm(p, qm(r, r)); }
  const SQ = ["平方公分", "cm2", "cm²", "公分"];
  const SM = ["平方公尺", "m2", "m²", "公尺"];

  /* ---------- single ---------- */
  add("single-L1-01", "single", 1, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 2, 12), P = pi.p, q = r.q, ar = A(P, q);
    const c = sc(k, ar, [qm(qm(I(2), P), q), qm(P, q), qm(P, qm(qm(I(2), q), qm(I(2), q))), qm(qm(I(2), P), qm(q, q))], r.fl);
    return Object.assign(c, { stem: "一個圓的半徑是 " + sv(r) + " 公分，圓周率取 " + pi.t + "，這個圓的面積是多少平方公分？",
      explain: "解析：圓面積 = " + pi.t + " × 半徑 × 半徑 = " + pi.t + " × " + sv(r) + " × " + sv(r) + " = " + D(ar) + "（平方公分）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const d = R(k, 4, 20), P = Q(157, 50), q = d.q, r = qd(q, I(2)), ar = A(P, r);
    const c = sc(k, ar, [A(P, q), qm(P, q), qm(P, r), qm(P, qm(q, r)), qm(qm(I(2), P), qm(r, r))], d.fl);
    return Object.assign(c, { stem: "一個圓的直徑是 " + sv(d) + " 公分，圓周率取 3.14，這個圓的面積是多少平方公分？",
      explain: "解析：半徑 = " + sv(d) + " ÷ 2 = " + auto(r, d.fl) + " 公分，面積 = 3.14 × " + auto(r, d.fl) + " × " + auto(r, d.fl) + " = " + D(ar) + "（平方公分）。",
      trapNote: "把直徑 " + sv(d) + " 直接當半徑代入，得到 3.14 × " + sv(d) + " × " + sv(d) + " = " + D(A(P, q)) + "，是正確答案的 4 倍。" });
  });
  add("single-L3-01", "single", 3, "extend", function (k) {
    const r = R(k, 2, 10), P = Q(157, 50), C = qm(qm(I(2), P), r.q), ar = A(P, r.q); need(C);
    const c = sc(k, ar, [qm(I(4), ar), qm(I(2), ar), qm(P, r.q), qd(ar, I(2))], r.fl);
    return Object.assign(c, { stem: "一個圓的周長是 " + D(C) + " 公分，圓周率取 3.14，這個圓的面積是多少平方公分？",
      explain: "解析：半徑 = " + D(C) + " ÷ 3.14 ÷ 2 = " + sv(r) + " 公分；面積 = 3.14 × " + sv(r) + " × " + sv(r) + " = " + D(ar) + "（平方公分）。" });
  });
  add("single-L3-02", "single", 3, "trap", function (k) {
    const r = R(k, 2, 10), P = Q(157, 50), ar = A(P, r.q), half = qd(ar, I(2));
    const c = sc(k, half, [ar, qa(half, qm(I(2), r.q)), qm(P, r.q), qd(ar, I(4))], r.fl);
    return Object.assign(c, { stem: "半徑是 " + sv(r) + " 公分的半圓形，圓周率取 3.14，面積是多少平方公分？",
      explain: "解析：半圓面積是整圓的一半：3.14 × " + sv(r) + " × " + sv(r) + " ÷ 2 = " + D(half) + "（平方公分）。",
      trapNote: "直接用整圓面積 " + D(ar) + " 而忘記 ÷ 2；也不能把周長裡的直徑 " + auto(qm(I(2), r.q), r.fl) + " 加進面積（面積與周長不能相加）。" });
  });
  add("single-L4-01", "single", 4, "trap", function (k) {
    const r = R(k, 2, 8), P = Q(157, 50), diff = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 1, max: 5, dens: [2, 5], places: 1 }), Rr = qa(r.q, diff);
    const v = qm(P, qs(qm(Rr, Rr), qm(r.q, r.q)));
    const c = sc(k, v, [qm(P, qm(diff, diff)), qs(qm(P, qm(Rr, Rr)), qm(r.q, r.q)), qm(P, qm(Rr, Rr)), qm(P, qa(qm(Rr, Rr), qm(r.q, r.q)))], r.fl);
    return Object.assign(c, { stem: "圓環（像墊圈）的外圓半徑是 " + auto(Rr, r.fl) + " 公分，內圓半徑是 " + sv(r) + " 公分，圓周率取 3.14，圓環的面積是多少平方公分？",
      explain: "解析：圓環面積 = 外圓面積 − 內圓面積 = 3.14 × " + auto(Rr, r.fl) + " × " + auto(Rr, r.fl) + " − 3.14 × " + sv(r) + " × " + sv(r) + " = 3.14 × (" + D(qm(Rr, Rr)) + " − " + D(qm(r.q, r.q)) + ") = " + D(v) + "（平方公分）。",
      trapNote: "把半徑差 " + auto(diff, r.fl) + " 平方（3.14 × " + auto(diff, r.fl) + "² = " + D(qm(P, qm(diff, diff))) + "）是常見錯誤；要先算兩個圓各自的面積再相減。" });
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const a = R(k, 4, 16), P = Q(157, 50), h = qd(a.q, I(2)), circ = A(P, h), out = qs(qm(a.q, a.q), circ);
    const c = sc(k, out, [circ, qs(qm(a.q, a.q), qm(P, a.q)), qs(qm(a.q, a.q), qm(P, h)), qd(qm(a.q, a.q), I(2))], a.fl);
    return Object.assign(c, { stem: "在邊長 " + sv(a) + " 公分的正方形裡畫一個最大的圓，圓周率取 3.14，正方形中圓以外的部分面積是多少平方公分？",
      explain: "解析：最大圓的直徑 = 邊長 " + sv(a) + "，半徑 " + auto(h, a.fl) + "；圓面積 = 3.14 × " + auto(h, a.fl) + " × " + auto(h, a.fl) + " = " + D(circ) + "；正方形面積 " + D(qm(a.q, a.q)) + "；相減 = " + D(out) + "（平方公分）。" });
  });
  add("single-L5-01", "single", 5, "extend", function (k) {
    const r = R(k, 2, 12), P = Q(157, 50), ar = A(P, r.q), C = qm(qm(I(2), P), r.q);
    const c = sc(k, C, [qm(r.q, r.q), qm(P, r.q), qm(qm(I(2), P), qm(r.q, r.q)), qd(qm(r.q, r.q), I(2)), qm(qm(I(4), P), r.q)], r.fl);
    return Object.assign(c, { stem: "一個圓的面積是 " + D(ar) + " 平方公分，圓周率取 3.14，這個圓的周長是多少公分？",
      explain: "解析：半徑² = " + D(ar) + " ÷ 3.14 = " + D(qm(r.q, r.q)) + "，所以半徑 = " + sv(r) + " 公分；周長 = 2 × 3.14 × " + sv(r) + " = " + D(C) + "（公分）。" });
  });
  add("single-L5-02", "single", 5, "trap", function (k) {
    const r = R(k, 2, 8), P = Q(157, 50), t = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 1, max: 4, dens: [2, 5], places: 1 }), r2 = qa(r.q, t);
    const inc = qm(P, qs(qm(r2, r2), qm(r.q, r.q)));
    const c = sc(k, inc, [qm(P, qm(t, t)), A(P, r2), qm(qm(I(2), P), t), qm(P, qm(r.q, t)), A(P, r.q), qm(P, qm(r2, t))], r.fl);
    return Object.assign(c, { stem: "一個圓的半徑從 " + sv(r) + " 公分增加到 " + auto(r2, r.fl) + " 公分，圓周率取 3.14，面積增加了多少平方公分？",
      explain: "解析：原面積 3.14 × " + sv(r) + "² = " + D(A(P, r.q)) + "；新面積 3.14 × " + auto(r2, r.fl) + "² = " + D(A(P, r2)) + "；增加 " + D(inc) + "（平方公分）。",
      trapNote: "半徑增加 " + auto(t, r.fl) + " 公分，面積並不是增加 3.14 × " + auto(t, r.fl) + " × " + auto(t, r.fl) + " = " + D(qm(P, qm(t, t))) + "；要用新面積減去舊面積。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const r = R(k, 3, 10), P = Q(157, 50), ar = A(P, r.q), per = qm(qm(I(2), P), r.q), big = qm(P, qm(qm(I(2), r.q), qm(I(2), r.q))); need(ar, per, big);
    const c = mu(k,
      ["圓面積是 " + D(ar) + " 平方公分", "直徑是 " + auto(qm(I(2), r.q), r.fl) + " 公分", "面積的單位是平方公分"],
      ["圓面積是 " + D(per) + " 平方公分", "圓面積是 " + D(big) + " 平方公分", "面積的單位是公分"]);
    return Object.assign(c, { stem: "半徑是 " + sv(r) + " 公分的圓，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：面積 = 3.14 × " + sv(r) + " × " + sv(r) + " = " + D(ar) + "；" + D(per) + " 是周長的數值；直徑 = 2 × " + sv(r) + "。" });
  });
  add("multi-L2-01", "multi", 2, "trap", function (k) {
    const m = k.randQ(k.flavor(["int", "int", "dec", "mixed"]), { min: 2, max: 5, dens: [2, 4], places: 1 }), mm = qm(m, m), m1 = qa(m, I(1)); need(mm);
    const c = mu(k,
      ["圓的直徑變成 " + auto(m, "mixed") + " 倍", "圓的周長變成 " + auto(m, "mixed") + " 倍", "圓的面積變成 " + auto(mm, "mixed") + " 倍"],
      ["圓的面積變成 " + auto(m, "mixed") + " 倍", "圓的面積變成 " + auto(m1, "mixed") + " 倍", "圓的周長變成 " + auto(mm, "mixed") + " 倍"]);
    return Object.assign(c, { stem: "把一個圓的半徑變成原來的 " + auto(m, "mixed") + " 倍，選出所有正確的敘述。",
      explain: "解析：直徑、周長是一次方，跟著變成 " + auto(m, "mixed") + " 倍；面積含半徑 × 半徑，變成 " + auto(m, "mixed") + " × " + auto(m, "mixed") + " = " + auto(mm, "mixed") + " 倍。",
      trapNote: "半徑變 " + auto(m, "mixed") + " 倍，面積不是 " + auto(m, "mixed") + " 倍而是 " + auto(mm, "mixed") + " 倍（平方倍）；周長則只是 " + auto(m, "mixed") + " 倍。" });
  });
  add("multi-L3-01", "multi", 3, "basic", function (k) {
    const r = R(k, 4, 10), P = Q(157, 50), ar = A(P, r.q), h = qd(ar, I(2)), qt = qd(ar, I(4)); need(h, qt);
    const c = mu(k,
      ["半圓面積是 " + D(h) + " 平方公分", "半圓面積是同半徑整圓面積的一半", "四分之一圓面積是 " + D(qt) + " 平方公分"],
      ["半圓面積是 " + D(ar) + " 平方公分", "四分之一圓面積是整圓面積的一半", "半圓面積是 " + D(qm(P, r.q)) + " 平方公分"]);
    return Object.assign(c, { stem: "半徑是 " + sv(r) + " 公分的圓，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：整圓面積 3.14 × " + sv(r) + "² = " + D(ar) + "；半圓 ÷ 2 = " + D(h) + "；四分之一圓 ÷ 4 = " + D(qt) + "。" });
  });
  add("multi-L4-01", "multi", 4, "trap", function (k) {
    const r = R(k, 2, 6), P = Q(157, 50), Rr = qm(r.q, I(2)), dif = qm(P, qs(qm(Rr, Rr), qm(r.q, r.q))), w1 = qm(P, qm(qs(Rr, r.q), qs(Rr, r.q))), w2 = qm(P, qs(Rr, r.q)); need(dif, w1, w2);
    const c = mu(k,
      ["大圓面積是小圓面積的 4 倍", "大圓周長是小圓周長的 2 倍", "大圓面積比小圓面積多 " + D(dif) + " 平方公分"],
      ["大圓面積比小圓面積多 " + D(w1) + " 平方公分", "大圓面積是小圓面積的 2 倍", "大圓面積比小圓面積多 " + D(w2) + " 平方公分"]);
    return Object.assign(c, { stem: "小圓半徑 " + sv(r) + " 公分，大圓半徑 " + auto(Rr, r.fl) + " 公分，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：半徑 2 倍，周長 2 倍、面積 4 倍；面積差 = 3.14 × (" + auto(Rr, r.fl) + "² − " + sv(r) + "²) = " + D(dif) + "。",
      trapNote: "面積差要「各自平方後再減」，不是半徑差的平方（" + D(w1) + "）。" });
  });
  add("multi-L4-02", "multi", 4, "extend", function (k) {
    const a = R(k, 6, 16), P = Q(157, 50), h = qd(a.q, I(2)), circ = A(P, h), out = qs(qm(a.q, a.q), circ), aa = qm(a.q, a.q), big = qm(P, aa), w3 = qs(aa, qm(P, a.q)); need(circ, out, aa, big, w3);
    const c = mu(k,
      ["最大圓的半徑是 " + auto(h, a.fl) + " 公分", "最大圓的面積是 " + D(circ) + " 平方公分", "圓外的部分面積是 " + D(out) + " 平方公分", "正方形面積是 " + D(aa) + " 平方公分"],
      ["最大圓的半徑是 " + sv(a) + " 公分", "最大圓的面積是 " + D(big) + " 平方公分", "圓外的部分面積是 " + D(w3) + " 平方公分"]);
    return Object.assign(c, { stem: "在邊長 " + sv(a) + " 公分的正方形裡畫一個最大的圓，選出所有正確的敘述。（圓周率取 3.14）",
      explain: "解析：最大圓直徑等於邊長 " + sv(a) + "，半徑 " + auto(h, a.fl) + "；圓面積 " + D(circ) + "；圓外面積 = " + D(aa) + " − " + D(circ) + " = " + D(out) + "。" });
  });

  /* ---------- tf ---------- */
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const r = R(k, 3, 12), P = Q(157, 50), ok = k.int(0, 1) === 1, t = A(P, r.q), f = k.pick([qm(qm(I(2), P), r.q), qm(P, r.q)]); need(t, f);
    return { stem: "半徑 " + sv(r) + " 公分的圓，面積是 " + D(ok ? t : f) + " 平方公分。（圓周率取 3.14）", answer: ok,
      explain: "解析：面積 = 3.14 × " + sv(r) + " × " + sv(r) + " = " + D(t) + " 平方公分。" + (ok ? "" : D(f) + " 是用周長或 3.14 × 半徑算出來的，不是面積。") };
  });
  add("tf-L2-01", "tf", 2, "trap", function (k) {
    const m = k.randQ(k.flavor(["int", "int", "dec", "mixed"]), { min: 2, max: 5, dens: [2, 4], places: 1 }), ok = k.int(0, 1) === 1, v = ok ? qm(m, m) : m; need(v);
    return { stem: "圓的半徑變成原來的 " + auto(m, "mixed") + " 倍，面積會變成原來的 " + auto(v, "mixed") + " 倍。（圓周率取 3.14）", answer: ok,
      explain: "解析：面積 = 3.14 × 半徑 × 半徑，半徑 " + auto(m, "mixed") + " 倍，面積變成 " + auto(m, "mixed") + " × " + auto(m, "mixed") + " = " + auto(qm(m, m), "mixed") + " 倍。",
      trapNote: "周長是半徑 " + auto(m, "mixed") + " 倍就跟著 " + auto(m, "mixed") + " 倍，但面積要平方，所以是 " + auto(qm(m, m), "mixed") + " 倍。" };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const d = R(k, 4, 20), P = Q(157, 50), ok = k.int(0, 1) === 1, r = qd(d.q, I(2)), t = A(P, r), f = A(P, d.q); need(t, f);
    return { stem: "直徑 " + sv(d) + " 公分的圓，面積是 " + D(ok ? t : f) + " 平方公分。（圓周率取 3.14）", answer: ok,
      explain: "解析：半徑 " + auto(r, d.fl) + " 公分，面積 = 3.14 × " + auto(r, d.fl) + " × " + auto(r, d.fl) + " = " + D(t) + " 平方公分。",
      trapNote: "把直徑 " + sv(d) + " 當半徑代入（3.14 × " + sv(d) + " × " + sv(d) + " = " + D(f) + "）會多出 4 倍。" };
  });
  add("tf-L3-02", "tf", 3, "basic", function (k) {
    const r = R(k, 2, 10), P = Q(157, 50), ok = k.int(0, 1) === 1, h = qd(A(P, r.q), I(2)), f = A(P, r.q); need(h, f);
    return { stem: "半徑 " + sv(r) + " 公分的半圓形，面積是 " + D(ok ? h : f) + " 平方公分。（圓周率取 3.14）", answer: ok,
      explain: "解析：半圓面積 = 3.14 × " + sv(r) + " × " + sv(r) + " ÷ 2 = " + D(h) + " 平方公分。" };
  });
  add("tf-L4-01", "tf", 4, "extend", function (k) {
    const a = R(k, 4, 18), ok = k.int(0, 1) === 1, v = ok ? "0.785" : k.pick(["0.5", "0.628", "3.14"]), P = Q(157, 50), h = qd(a.q, I(2)), c1 = A(P, h); need(c1);
    return { stem: "在邊長 " + sv(a) + " 公分的正方形裡畫最大的圓，圓面積是正方形面積的 " + v + " 倍。（圓周率取 3.14）", answer: ok,
      explain: "解析：圓面積 3.14 × " + auto(h, a.fl) + "² = " + D(c1) + "，正方形 " + D(qm(a.q, a.q)) + "，比值 = 3.14 ÷ 4 = 0.785，與邊長多大無關。" };
  });
  add("tf-L5-01", "tf", 5, "trap", function (k) {
    const r = R(k, 2, 8), P = Q(157, 50), diff = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 2, max: 5, dens: [2, 5], places: 1 }), Rr = qa(r.q, diff), ok = k.int(0, 1) === 1;
    const t = qm(P, qs(qm(Rr, Rr), qm(r.q, r.q))), f = qm(P, qm(diff, diff)); need(t, f);
    return { stem: "外圓半徑 " + auto(Rr, r.fl) + " 公分、內圓半徑 " + sv(r) + " 公分的圓環，面積是 " + D(ok ? t : f) + " 平方公分。（圓周率取 3.14）", answer: ok,
      explain: "解析：圓環面積 = 3.14 × (" + auto(Rr, r.fl) + "² − " + sv(r) + "²) = " + D(t) + " 平方公分。",
      trapNote: "用半徑差的平方 3.14 × " + auto(diff, r.fl) + "² = " + D(f) + " 是錯的；(外圓半徑 − 內圓半徑)² 不等於 外圓半徑² − 內圓半徑²。" };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 2, 15), ar = A(pi.p, r.q); need(ar);
    return Object.assign({ stem: "半徑 " + sv(r) + " 公分的圓，面積是（　）平方公分。（圓周率取 " + pi.t + "）", units: SQ,
      explain: "解析：" + pi.t + " × " + sv(r) + " × " + sv(r) + " = " + D(ar) + "。" }, ans(ar, "dec"));
  });
  add("fill-L2-01", "fill", 2, "trap", function (k) {
    const d = R(k, 4, 24), P = Q(157, 50), r = qd(d.q, I(2)), ar = A(P, r); need(ar, A(P, d.q));
    return Object.assign({ stem: "直徑 " + sv(d) + " 公分的圓，面積是（　）平方公分。（圓周率取 3.14）", units: SQ,
      explain: "解析：半徑 " + auto(r, d.fl) + " 公分，面積 = 3.14 × " + auto(r, d.fl) + " × " + auto(r, d.fl) + " = " + D(ar) + "。",
      trapNote: "直接用直徑 " + sv(d) + " 計算（得 " + D(A(P, d.q)) + "）是錯的，要先除以 2 變成半徑。" }, ans(ar, "dec"));
  });
  add("fill-L2-02", "fill", 2, "basic", function (k) {
    const r = R(k, 2, 15), ar = A(Q(157, 50), r.q); need(ar);
    return Object.assign({ stem: "圓的面積是 " + D(ar) + " 平方公分，半徑是（　）公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：半徑 × 半徑 = " + D(ar) + " ÷ 3.14 = " + D(qm(r.q, r.q)) + "，所以半徑 = " + sv(r) + "。" }, ans(r.q, r.fl));
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const r = R(k, 2, 12), P = Q(157, 50), ar = A(P, r.q), h = qd(ar, I(2)); need(h);
    return Object.assign({ stem: "半徑 " + sv(r) + " 公分的半圓形，面積是（　）平方公分。（圓周率取 3.14）", units: SQ,
      explain: "解析：3.14 × " + sv(r) + " × " + sv(r) + " ÷ 2 = " + D(ar) + " ÷ 2 = " + D(h) + "。",
      trapNote: "漏掉 ÷ 2 會答成整圓面積 " + D(ar) + "。" }, ans(h, "dec"));
  });
  add("fill-L3-02", "fill", 3, "basic", function (k) {
    const r = R(k, 2, 12), P = Q(157, 50), ar = A(P, r.q), qt = qd(ar, I(4)); need(qt);
    return Object.assign({ stem: "半徑 " + sv(r) + " 公分的四分之一圓（圓心角 90 度的扇形），面積是（　）平方公分。（圓周率取 3.14）", units: SQ,
      explain: "解析：整圓 3.14 × " + sv(r) + " × " + sv(r) + " = " + D(ar) + "，四分之一 = " + D(qt) + "。" }, ans(qt, "dec"));
  });
  add("fill-L4-01", "fill", 4, "basic", function (k) {
    const r = R(k, 2, 8), P = Q(157, 50), diff = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 1, max: 5, dens: [2, 5], places: 1 }), Rr = qa(r.q, diff), v = qm(P, qs(qm(Rr, Rr), qm(r.q, r.q))); need(v);
    return Object.assign({ stem: "外圓半徑 " + auto(Rr, r.fl) + " 公分、內圓半徑 " + sv(r) + " 公分的圓環，面積是（　）平方公分。（圓周率取 3.14）", units: SQ,
      explain: "解析：3.14 × (" + auto(Rr, r.fl) + "² − " + sv(r) + "²) = 3.14 × " + D(qs(qm(Rr, Rr), qm(r.q, r.q))) + " = " + D(v) + "。" }, ans(v, "dec"));
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const a = R(k, 4, 20), P = Q(157, 50), h = qd(a.q, I(2)), circ = A(P, h), out = qs(qm(a.q, a.q), circ); need(out);
    return Object.assign({ stem: "在邊長 " + sv(a) + " 公分的正方形裡畫最大的圓，圓以外（正方形四個角）的面積合計（　）平方公分。（圓周率取 3.14）", units: SQ,
      explain: "解析：正方形 " + D(qm(a.q, a.q)) + "，圓 3.14 × " + auto(h, a.fl) + " × " + auto(h, a.fl) + " = " + D(circ) + "，相減 = " + D(out) + "。" }, ans(out, "dec"));
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 2, 15), ar = A(pi.p, r.q); need(ar);
    return Object.assign({ stem: "圓周率取 " + pi.t + "，計算半徑 " + sv(r) + " 公分的圓面積：" + pi.t + " × " + ex(r.q, r.fl) + " × " + ex(r.q, r.fl), units: SQ,
      explain: "解析：" + sv(r) + " × " + sv(r) + " = " + D(qm(r.q, r.q)) + "，" + pi.t + " × " + D(qm(r.q, r.q)) + " = " + D(ar) + "。" }, ans(ar, "dec"));
  });
  add("calc-L2-01", "calc", 2, "trap", function (k) {
    const d = R(k, 4, 24), P = Q(157, 50), r = qd(d.q, I(2)), ar = A(P, r); need(ar);
    return Object.assign({ stem: "圓周率取 3.14，計算直徑 " + sv(d) + " 公分的圓面積：3.14 × (" + ex(d.q, d.fl) + " ÷ 2) × (" + ex(d.q, d.fl) + " ÷ 2)", units: SQ,
      explain: "解析：" + sv(d) + " ÷ 2 = " + auto(r, d.fl) + "，3.14 × " + auto(r, d.fl) + " × " + auto(r, d.fl) + " = " + D(ar) + "。",
      trapNote: "括號 (" + sv(d) + " ÷ 2) 是半徑，兩個都要先除以 2；只除一個會得到 " + D(qm(P, qm(d.q, r))) + "。" }, ans(ar, "dec"));
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const r = R(k, 2, 8), P = Q(157, 50), diff = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 2, max: 6, dens: [2, 5], places: 1 }), Rr = qa(r.q, diff), v = qm(P, qs(qm(Rr, Rr), qm(r.q, r.q))); need(v);
    return Object.assign({ stem: "圓周率取 3.14，用簡便方法計算：3.14 × " + ex(Rr, r.fl) + " × " + ex(Rr, r.fl) + " − 3.14 × " + ex(r.q, r.fl) + " × " + ex(r.q, r.fl), units: SQ,
      explain: "解析：提出 3.14：3.14 × (" + D(qm(Rr, Rr)) + " − " + D(qm(r.q, r.q)) + ") = 3.14 × " + D(qs(qm(Rr, Rr), qm(r.q, r.q))) + " = " + D(v) + "。" }, ans(v, "dec"));
  });
  add("calc-L3-02", "calc", 3, "basic", function (k) {
    const r = R(k, 2, 16), P = Q(157, 50), qt = qd(A(P, r.q), I(4)); need(qt);
    return Object.assign({ stem: "圓周率取 3.14，計算半徑 " + sv(r) + " 公分的四分之一圓面積：3.14 × " + ex(r.q, r.fl) + " × " + ex(r.q, r.fl) + " ÷ 4", units: SQ,
      explain: "解析：" + sv(r) + " × " + sv(r) + " = " + D(qm(r.q, r.q)) + "，× 3.14 = " + D(A(P, r.q)) + "，÷ 4 = " + D(qt) + "。" }, ans(qt, "dec"));
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const r = R(k, 2, 8), h = R(k, 3, 10), P = Q(157, 50), semi = qd(A(P, r.q), I(2)), rect = qm(qm(I(2), r.q), h.q), v = qa(semi, rect); need(v, semi);
    const wrong = qd(qa(A(P, r.q), rect), I(2));
    return Object.assign({ stem: "圓周率取 3.14，長方形（長 " + auto(qm(I(2), r.q), r.fl) + "、寬 " + sv(h) + "）上方接一個直徑 " + auto(qm(I(2), r.q), r.fl) + " 的半圓，總面積：3.14 × " + ex(r.q, r.fl) + " × " + ex(r.q, r.fl) + " ÷ 2 + " + ex(qm(I(2), r.q), r.fl) + " × " + ex(h.q, h.fl), units: SQ,
      explain: "解析：半圓 3.14 × " + sv(r) + " × " + sv(r) + " ÷ 2 = " + D(semi) + "；長方形 " + auto(qm(I(2), r.q), r.fl) + " × " + sv(h) + " = " + D(rect) + "；相加 = " + D(v) + "。",
      trapNote: "先乘除、後加法；若把 ÷ 2 放錯位置（如 (3.14 × " + sv(r) + " × " + sv(r) + " + " + D(rect) + ") ÷ 2）就會得到 " + D(wrong) + "。" }, ans(v, "dec"));
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const a = R(k, 4, 20), P = Q(157, 50), h = qd(a.q, I(2)), out = qs(qm(a.q, a.q), A(P, h)); need(out);
    return Object.assign({ stem: "圓周率取 3.14，計算：" + ex(a.q, a.fl) + " × " + ex(a.q, a.fl) + " − 3.14 × (" + ex(a.q, a.fl) + " ÷ 2) × (" + ex(a.q, a.fl) + " ÷ 2)", units: SQ,
      explain: "解析：" + sv(a) + " × " + sv(a) + " = " + D(qm(a.q, a.q)) + "；3.14 × " + auto(h, a.fl) + " × " + auto(h, a.fl) + " = " + D(A(P, h)) + "；相減 = " + D(out) + "。" }, ans(out, "dec"));
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const pi = PIx(k, true), r = pi.z ? { q: I(k.pick([7, 14, 21, 28])), fl: "int" } : R(k, 10, 50, [3, 4, 1, 0.01]), ar = A(pi.p, r.q); need(ar);
    return Object.assign({ stem: "圓形桌面的半徑是 " + sv(r) + " 公分，桌面的面積是多少平方公分？（圓周率取 " + pi.t + "）", units: SQ,
      explain: "解析：" + pi.t + " × " + sv(r) + " × " + sv(r) + " = " + D(ar) + "（平方公分）。" }, ans(ar, "dec"));
  });
  add("word-L2-01", "word", 2, "trap", function (k) {
    const d = R(k, 4, 30), P = Q(157, 50), r = qd(d.q, I(2)), ar = A(P, r); need(ar, A(P, d.q));
    return Object.assign({ stem: "學校有一座圓形花圃，直徑是 " + sv(d) + " 公尺，花圃的面積是多少平方公尺？（圓周率取 3.14）", units: SM,
      explain: "解析：半徑 " + auto(r, d.fl) + " 公尺，面積 = 3.14 × " + auto(r, d.fl) + " × " + auto(r, d.fl) + " = " + D(ar) + "（平方公尺）。",
      trapNote: "題目給的是直徑，要先 ÷ 2 得半徑；直接用 " + sv(d) + " 代入會得到 " + D(A(P, d.q)) + "。" }, ans(ar, "dec"));
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const r = R(k, 3, 12), P = Q(157, 50), ar = A(P, r.q), h = qd(ar, I(2)); need(h);
    return Object.assign({ stem: "半圓形的菜園，半徑是 " + sv(r) + " 公尺，菜園的面積是多少平方公尺？（圓周率取 3.14）", units: SM,
      explain: "解析：整圓 3.14 × " + sv(r) + " × " + sv(r) + " = " + D(ar) + "，半圓 ÷ 2 = " + D(h) + "（平方公尺）。",
      trapNote: "忘記 ÷ 2 會答成整圓 " + D(ar) + "；或把周長的直邊 " + auto(qm(I(2), r.q), r.fl) + " 公尺加進來也是錯的。" }, ans(h, "dec"));
  });
  add("word-L3-02", "word", 3, "basic", function (k) {
    const r = R(k, 3, 12), p = k.randQ(k.flavor(["int", "dec"]), { min: 2, max: 10, places: 1 }), P = Q(157, 50), v = qm(A(P, r.q), p); need(v);
    return Object.assign({ stem: "圓形披薩的半徑是 " + sv(r) + " 公分，每 1 平方公分的價錢約 " + auto(p, "dec") + " 元（只看數字，不計實際），這個披薩的價值是多少元？（圓周率取 3.14）", units: ["元"],
      explain: "解析：面積 3.14 × " + sv(r) + " × " + sv(r) + " = " + D(A(P, r.q)) + " 平方公分；× " + auto(p, "dec") + " = " + D(v) + "（元）。" }, ans(v, "dec"));
  });
  add("word-L4-01", "word", 4, "extend", function (k) {
    const r = R(k, 3, 12), w = k.randQ(k.flavor(["int", "dec"]), { min: 1, max: 3, places: 1 }), P = Q(157, 50), Rr = qa(r.q, w), v = qm(P, qs(qm(Rr, Rr), qm(r.q, r.q))); need(v);
    return Object.assign({ stem: "圓形水池的半徑是 " + sv(r) + " 公尺，池外圍鋪了一圈寬 " + auto(w, "dec") + " 公尺的步道，步道的面積是多少平方公尺？（圓周率取 3.14）", units: SM,
      explain: "解析：外圓半徑 " + sv(r) + " + " + auto(w, "dec") + " = " + auto(Rr, r.fl) + "；步道面積 = 3.14 × (" + auto(Rr, r.fl) + "² − " + sv(r) + "²) = 3.14 × " + D(qs(qm(Rr, Rr), qm(r.q, r.q))) + " = " + D(v) + "（平方公尺）。" }, ans(v, "dec"));
  });
  add("word-L4-02", "word", 4, "extend", function (k) {
    const a = R(k, 6, 24), P = Q(157, 50), h = qd(a.q, I(2)), out = qs(qm(a.q, a.q), A(P, h)); need(out);
    return Object.assign({ stem: "正方形草地的邊長是 " + sv(a) + " 公尺，中間要種一個最大的圓形花圃，其餘的部分都鋪草皮，草皮面積是多少平方公尺？（圓周率取 3.14）", units: SM,
      explain: "解析：花圃半徑 " + auto(h, a.fl) + " 公尺，面積 " + D(A(P, h)) + "；草地 " + D(qm(a.q, a.q)) + " − " + D(A(P, h)) + " = " + D(out) + "（平方公尺）。" }, ans(out, "dec"));
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const r = R(k, 3, 12), P = Q(157, 50), ar = A(P, r.q), C = qm(qm(I(2), P), r.q); need(ar, C);
    return Object.assign({ stem: "圓形遊戲墊的面積是 " + D(ar) + " 平方公分，要在邊緣貼一圈彩帶，彩帶至少要幾公分？（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：半徑² = " + D(ar) + " ÷ 3.14 = " + D(qm(r.q, r.q)) + "，半徑 " + sv(r) + "；彩帶長 = 周長 = 2 × 3.14 × " + sv(r) + " = " + D(C) + "（公分）。" }, ans(C, "dec"));
  });
  add("word-L5-02", "word", 5, "trap", function (k) {
    const r = R(k, 3, 10), P = Q(157, 50), t = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 1, max: 3, dens: [2, 5], places: 1 }), r2 = qa(r.q, t), inc = qm(P, qs(qm(r2, r2), qm(r.q, r.q))); need(inc, qm(P, qm(t, t)));
    return Object.assign({ stem: "圓形池塘的半徑是 " + sv(r) + " 公尺，現在要向外擴大，半徑增加 " + auto(t, r.fl) + " 公尺，池塘的面積增加了多少平方公尺？（圓周率取 3.14）", units: SM,
      explain: "解析：新面積 3.14 × " + auto(r2, r.fl) + "² = " + D(A(P, r2)) + "，舊面積 3.14 × " + sv(r) + "² = " + D(A(P, r.q)) + "，增加 " + D(inc) + "（平方公尺）。",
      trapNote: "不能只算 3.14 × " + auto(t, r.fl) + " × " + auto(t, r.fl) + " = " + D(qm(P, qm(t, t))) + "；增加的是「新面積 − 舊面積」。" }, ans(inc, "dec"));
  });

  /* ---------- 教材 □ 未知數題（規格第 14 節） ---------- */
  add("word-L2-02", "word", 2, "basic", function (k) {
    const r = R(k, 3, 15), A0 = A(Q(157, 50), r.q); need(A0);
    return Object.assign({ stem: "圓形餐墊的面積是 " + D(A0) + " 平方公分，半徑是 □ 公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：半徑 × 半徑 = " + D(A0) + " ÷ 3.14 = " + D(qm(r.q, r.q)) + "，所以 □ = " + sv(r) + "（公分）。" }, ans(r.q, r.fl));
  });
  add("fill-L2-03", "fill", 2, "trap", function (k) {
    const r = R(k, 3, 15), A0 = A(Q(157, 50), r.q), d = qm(r.q, I(2)); need(A0, d);
    return Object.assign({ stem: "圓的面積是 " + D(A0) + " 平方公分，直徑是 □ 公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：半徑 × 半徑 = " + D(A0) + " ÷ 3.14 = " + D(qm(r.q, r.q)) + "，半徑 " + sv(r) + " 公分，直徑 □ = 2 × " + sv(r) + " = " + auto(d, r.fl) + "（公分）。",
      trapNote: "算到半徑 " + sv(r) + " 就停下來是常見錯誤；題目問的是直徑，要再乘 2。" }, ans(d, r.fl));
  });
  add("calc-L3-03", "calc", 3, "basic", function (k) {
    const r = R(k, 2, 12), A0 = A(Q(157, 50), r.q), rr = qm(r.q, r.q); need(A0, rr);
    return Object.assign({ stem: "圓周率取 3.14，3.14 × □ = " + D(A0) + "（□ 是半徑 × 半徑），求 □：" + D(A0) + " ÷ 3.14", units: SQ,
      explain: "解析：□ = " + D(A0) + " ÷ 3.14 = " + D(rr) + "，也就是半徑 " + sv(r) + " 公分的平方。" }, ans(rr, "dec"));
  });
  add("single-L3-03", "single", 3, "trap", function (k) {
    const r = R(k, 2, 12), P = Q(157, 50), A0 = A(P, r.q); need(A0, qm(r.q, r.q));
    const c = sc(k, r.q, [qm(r.q, r.q), qd(A0, qm(I(2), P)), qd(A0, P), qm(r.q, I(2))], r.fl);
    return Object.assign(c, { stem: "圓周率取 3.14，3.14 × □ × □ = " + D(A0) + "，□ 是多少公分？",
      explain: "解析：□ × □ = " + D(A0) + " ÷ 3.14 = " + D(qm(r.q, r.q)) + "，哪個數乘自己等於 " + D(qm(r.q, r.q)) + "？□ = " + sv(r) + "（公分）。",
      trapNote: "除以 3.14 之後得到的 " + D(qm(r.q, r.q)) + " 是「□ × □」，還要再找出乘自己的那個數；直接答 " + D(qm(r.q, r.q)) + " 是常見錯誤。" });
  });
  add("tf-L4-02", "tf", 4, "trap", function (k) {
    const r = R(k, 2, 10), P = Q(157, 50), H = qd(A(P, r.q), I(2)), ok = k.int(0, 1) === 1, f = qm(r.q, I(2)); need(H, f);
    return { stem: "半圓形的面積是 " + D(H) + " 平方公分，它的半徑 □ 是 " + auto(ok ? r.q : f, r.fl) + " 公分。（圓周率取 3.14）", answer: ok,
      explain: "解析：整圓面積 = " + D(H) + " × 2 = " + D(A(P, r.q)) + "，半徑 × 半徑 = " + D(A(P, r.q)) + " ÷ 3.14 = " + D(qm(r.q, r.q)) + "，□ = " + sv(r) + " 公分。",
      trapNote: "半圓面積只是整圓的一半，要先乘 2 還原成整圓再反推；" + auto(f, r.fl) + " 公分是直徑，不是半徑。" };
  });
  add("word-L4-03", "word", 4, "extend", function (k) {
    const r = R(k, 3, 15), A0 = A(Q(157, 50), r.q), d = qm(r.q, I(2)); need(A0, d);
    return Object.assign({ stem: "圓形水池的面積是 " + D(A0) + " 平方公尺，水池的直徑是 □ 公尺。（圓周率取 3.14）", units: ["公尺", "m"],
      explain: "解析：半徑 × 半徑 = " + D(A0) + " ÷ 3.14 = " + D(qm(r.q, r.q)) + "，半徑 " + sv(r) + " 公尺；直徑 □ = 2 × " + sv(r) + " = " + auto(d, r.fl) + "（公尺）。" }, ans(d, r.fl));
  });
  add("fill-L4-02", "fill", 4, "extend", function (k) {
    const r = R(k, 2, 10), A0 = A(Q(157, 50), r.q), a = qm(r.q, I(2)); need(A0, a);
    return Object.assign({ stem: "在正方形裡畫一個最大的圓，圓的面積是 " + D(A0) + " 平方公分，正方形的邊長是 □ 公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain: "解析：半徑 × 半徑 = " + D(A0) + " ÷ 3.14 = " + D(qm(r.q, r.q)) + "，半徑 " + sv(r) + " 公分；最大圓的直徑等於正方形邊長，□ = 2 × " + sv(r) + " = " + auto(a, r.fl) + "（公分）。" }, ans(a, r.fl));
  });
  add("single-L5-03", "single", 5, "extend", function (k) {
    const r = R(k, 2, 8), P = Q(157, 50), diff = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 1, max: 5, dens: [2, 5], places: 1 }), Rr = qa(r.q, diff), Ar = qm(P, qs(qm(Rr, Rr), qm(r.q, r.q))); need(Ar);
    const c = sc(k, Rr, [diff, qd(Ar, P), qa(Rr, r.q), qm(Rr, I(2)), qs(Rr, I(1))], r.fl);
    return Object.assign(c, { stem: "圓環的面積是 " + D(Ar) + " 平方公分，內圓半徑是 " + sv(r) + " 公分，外圓半徑 □ 是多少公分？（圓周率取 3.14）",
      explain: "解析：□ × □ − " + sv(r) + " × " + sv(r) + " = " + D(Ar) + " ÷ 3.14 = " + D(qd(Ar, P)) + "，所以 □ × □ = " + D(qd(Ar, P)) + " + " + D(qm(r.q, r.q)) + " = " + D(qm(Rr, Rr)) + "，□ = " + auto(Rr, r.fl) + "（公分）。" });
  });
  add("calc-L5-02", "calc", 5, "extend", function (k) {
    const r = R(k, 2, 8), P = Q(157, 50), diff = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 1, max: 5, dens: [2, 5], places: 1 }), Rr = qa(r.q, diff), Ar = qm(P, qs(qm(Rr, Rr), qm(r.q, r.q))), RR2 = qm(Rr, Rr); need(Ar, RR2);
    return Object.assign({ stem: "圓周率取 3.14，圓環的面積是 " + D(Ar) + " 平方公分，內圓半徑是 " + sv(r) + " 公分，外圓半徑 × 外圓半徑 = □，求 □：" + D(Ar) + " ÷ 3.14 + " + ex(r.q, r.fl) + " × " + ex(r.q, r.fl), units: SQ,
      explain: "解析：外圓面積 − 內圓面積 = " + D(Ar) + "，除以 3.14 得 " + D(qd(Ar, P)) + " = □ − " + D(qm(r.q, r.q)) + "，所以 □ = " + D(qd(Ar, P)) + " + " + D(qm(r.q, r.q)) + " = " + D(RR2) + "。" }, ans(RR2, "dec"));
  });

  ExamBank.register("circle-area", "circle-area-main", S);
})();
