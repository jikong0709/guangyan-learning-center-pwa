/* 題庫：circle-length 圓周率、圓周長、半圓／扇形弧長與周長（π 取 3.14，半徑為 7 的倍數時可取 22/7）。題庫工 B
   數字風格：半徑／直徑可為整數、小數、分數、帶分數；全部用 kit.Q 精確運算。 */
(function () {
  "use strict";
  const K = window.ExamKit, Q = K.Q, qa = K.qAdd, qs = K.qSub, qm = K.qMul, qd = K.qDiv;
  const S = [];
  /* 複選：附每個選項的判斷理由，供解法二逐項檢驗 */
  let WHY = {};
  function muw(k, goods, bads) {
    WHY = {}; goods.concat(bads).forEach(function (p) { WHY[p[0]] = p[1]; });
    return mu(k, goods.map(function (p) { return p[0]; }), bads.map(function (p) { return p[0]; }));
  }
  function verdicts(c) { return c.options.map(function (o, i) { return "「" + o + "」" + (c.answer.indexOf(i) >= 0 ? "對" : "錯") + (WHY[o] ? "（" + WHY[o] + "）" : ""); }).join("；"); }
  /* 複選解法二：逐項檢驗，字數允許時再附上正確選項 */
  function mexp(c, lead) { const base = lead + verdicts(c) + "。", tail = "正確的是：" + goods(c) + "。"; return (base + tail).length <= 390 ? base + tail : base; }
  function wrapMixed(s) {
    return typeof s !== "string" ? s : s.replace(/\d+ \d+\/\d+/g, function (m, off, str) {
      const before = str.slice(Math.max(0, off - 4), off), after = str.slice(off + m.length, off + m.length + 4);
      const opB = /([×÷＋+−]|乘|加上|加|減去|減|除以)\s?$/.test(before), opA = /^\s?([×÷＋+−]|乘|加|減|除以)/.test(after);
      const inP = /\($/.test(before) && /^\)/.test(after);
      return (opB || opA) && !inP ? "(" + m + ")" : m;
    });
  }
  function yn(b) { return b ? "正確" : "錯誤"; }
  function goods(c) { return c.answer.map(function (i) { return c.options[i]; }).join("、"); }
  /* 輸出後處理：分數平方一律加括號；分母 > 60 的分數或 9 位以上數字視為不乾淨，重抽 */
  function fixSq(s) { return typeof s === "string" ? s.replace(/(\d+ \d+\/\d+|\d+\/\d+)²/g, "($1)²") : s; }
  /* 解法二：把「× 3.14」「乘 3.14」這類算式裡的圓周率換成文字；題目量值是 3.14 時絕不替換 */
  function piWords(o) {
    if (typeof o.explain2 !== "string") return;
    const stemClean = String(o.stem || "").replace(/圓周率取\s*(3\.14|22\/7)/g, "");
    if (/(?<![\d.])3\.14(?![\d])|(?<![\d])22\/7(?![\d])/.test(stemClean + " " + String(o.answer) + " " + (o.options || []).join(" "))) return;
    o.explain2 = o.explain2.replace(/(?<![\d.])(?:3\.14|22\/7)(?![\d])(?=\s?[×÷])|(?<=[×÷乘]\s?)(?:3\.14|22\/7)(?![\d])/g, "圓周率").replace(/圓周率\s*圓周率/g, "圓周率");
  }
  function post(o) {
    ["stem", "explain", "explain2", "trapNote"].forEach(function (f) { if (o[f] !== undefined) o[f] = fixSq(o[f]); });
    if (o.options) o.options = o.options.map(fixSq);
    o.explain = wrapMixed(o.explain); o.explain2 = wrapMixed(o.explain2); piWords(o);
    if (typeof o.answer === "string" && o.stem && !/分數/.test(o.stem)) {
      const hm = o.answer.match(/(\d+)\/(\d+)$/);
      if (hm) { let dn = +hm[2]; while (dn % 2 === 0) dn /= 2; while (dn % 5 === 0) dn /= 5; if (dn !== 1) o.stem += "（請以分數作答）"; }
    }
    if (o.accepted) o.accepted = o.accepted.filter(function (a) { const mm = /(\d+)\/(\d+)$/.exec(a); return !(mm && +mm[2] > 100); });
    const all = [o.stem, o.explain, o.explain2, o.trapNote, o.answer, o.options ? o.options.join(" ") : ""].join(" ");
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
  function R(k, lo, hi, w, dens) { const fl = k.flavor(["int", "dec", "mixed", "frac"], w || [5, 2, 7, 1]); return { q: k.randQ(fl, { min: lo, max: hi, dens: dens || [2, 4, 5, 10] }), fl: fl }; }
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
      explain2: "解法二（半徑換直徑）：半徑的兩倍是直徑，直徑是 " + auto(qm(I(2), q), r.fl) + " 公分；圓周是直徑的 " + pp(pi) + " 倍，乘起來得到 " + D(C) + " 公分，所以選 " + c.options[0] + "。",
      explain: "解析：圓周長 = 2 × " + pp(pi) + " × 半徑 = 2 × " + pp(pi) + " × " + sv(r) + " = " + D(C) + "（公分）。" });
  });
  add("single-L1-02", "single", 1, "basic", function (k) {
    const d = R(k, 4, 30), P = Q(157, 50), q = d.q, C = qm(P, q);
    const c = sc(k, C, [qm(qm(I(2), P), q), qm(P, qm(q, q)), qd(C, I(2)), qa(C, q)], d.fl);
    return Object.assign(c, { stem: "一個圓的直徑是 " + sv(d) + " 公分，圓周率取 3.14，這個圓的周長是多少公分？",
      explain2: "解法二（改用半徑算）：直徑的一半是半徑，半徑是 " + auto(qd(q, I(2)), d.fl) + " 公分；周長等於半徑的 2 倍再乘圓周率，結果是 " + D(C) + " 公分，所以選 " + c.options[0] + "。",
      explain: "解析：圓周長 = 3.14 × 直徑 = 3.14 × " + sv(d) + " = " + D(C) + "（公分）。" });
  });
  add("single-L2-01", "single", 2, "trap", function (k) {
    const d = R(k, 2, 20), P = Q(157, 50), q = d.q, C = qm(P, q); need(C);
    const c = sc(k, q, [qd(q, I(2)), qm(q, I(2)), qd(C, I(2)), qm(C, P)], d.fl);
    return Object.assign(c, { stem: "一個圓的周長是 " + D(C) + " 公分，圓周率取 3.14，這個圓的直徑是多少公分？",
      explain2: "解法二（估算排除）：周長是直徑的 3 倍多一點，所以直徑比周長的三分之一稍小一些。拿選項 " + c.options[0] + " 去乘圓周率，剛好湊出題目的周長，所以直徑就是 " + c.options[0] + " 公分。",
      explain: "解析：周長 = 3.14 × 直徑，所以直徑 = " + D(C) + " ÷ 3.14 = " + auto(q, d.fl) + "（公分）。",
      trapNote: "把 " + D(C) + " ÷ 3.14 的結果 " + auto(q, d.fl) + " 當成半徑是常見錯誤；周長 ÷ 3.14 得到的是直徑，要再 ÷ 2 才是半徑 " + auto(qd(q, I(2)), d.fl) + "。" });
  });
  add("single-L3-01", "single", 3, "trap", function (k) {
    const d = R(k, 2, 24), P = Q(157, 50), q = d.q, arc = qd(qm(P, q), I(2)), per = qa(arc, q);
    const c = sc(k, per, [arc, qm(P, q), qa(qm(P, q), q), qa(arc, qd(q, I(2)))], d.fl);
    return Object.assign(c, { stem: "半圓形的直徑是 " + sv(d) + " 公分，圓周率取 3.14，這個半圓形的周長是多少公分？",
      explain2: "解法二（合併成一個倍數）：弧線是直徑的 1.57 倍，再加上直邊是直徑的 1 倍，所以整個周長是直徑的 2.57 倍。" + sv(d) + " 的 2.57 倍是 " + D(per) + " 公分，所以選 " + c.options[0] + "。",
      explain: "解析：弧長 = 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "；半圓周長還要加上直徑 " + sv(d) + "，共 " + D(arc) + " + " + sv(d) + " = " + D(per) + "（公分）。",
      trapNote: "只算弧長 " + D(arc) + " 而忘記加直邊（直徑）" + sv(d) + " 公分，會少算；半圓的「周長」是封閉圖形的整圈邊長。" });
  });
  add("single-L4-01", "single", 4, "extend", function (k) {
    const pi = PIx(k, true), P = pi.p;
    const r = pi.z ? { q: I(k.pick([7, 14, 21])), fl: "int" } : R(k, 10, 50, [2, 4, 2, 0.01]);
    const m = I(k.pick([10, 20, 50, 100])), Dd = qm(qm(qm(I(2), P), r.q), m), mm = qd(Dd, I(100));
    const c = sc(k, mm, [Dd, qd(qm(qm(P, r.q), m), I(100)), qd(Dd, I(10)), qd(qm(qm(P, qm(r.q, r.q)), m), I(100))], "dec");
    return Object.assign(c, { stem: "一個輪子的半徑是 " + sv(r) + " 公分，在地面上直線滾動 " + m.n + " 圈（圓周率取 " + pp(pi) + "），輪子前進了幾公尺？",
      explain2: "解法二（先把半徑加起來）：轉 " + m.n + " 圈，半徑要用 " + m.n + " × 2 = " + (2 * m.n) + " 次，共 " + D(qm(r.q, I(2 * m.n))) + " 公分，再乘圓周率 " + pp(pi) + " 得 " + D(Dd) + " 公分，也就是 " + D(mm) + " 公尺，所以選 " + c.options[0] + "。",
      explain: "解析：滾一圈前進一個周長 2 × " + pp(pi) + " × " + sv(r) + " = " + D(qm(qm(I(2), P), r.q)) + " 公分；" + m.n + " 圈 = " + D(Dd) + " 公分 = " + D(mm) + " 公尺。" });
  });
  add("single-L4-02", "single", 4, "extend", function (k) {
    const a = R(k, 3, 10), P = Q(157, 50), diff = k.randQ(k.flavor(["int", "dec", "mixed"]), { min: 2, max: 8, dens: [2, 4, 5] }), b = qa(a.q, diff);
    const dl = qm(qm(I(2), P), diff);
    const c = sc(k, dl, [qm(P, diff), qm(qm(I(2), P), qa(b, a.q)), qm(P, qs(qm(b, b), qm(a.q, a.q))), qm(qm(I(2), P), b)], a.fl);
    return Object.assign(c, { stem: "小圓的半徑是 " + sv(a) + " 公分，大圓的半徑是 " + auto(b, a.fl) + " 公分，圓周率取 3.14，大圓的周長比小圓的周長多幾公分？",
      explain2: "解法二（各算各的）：小圓一圈 " + D(qm(qm(I(2), P), a.q)) + " 公分，大圓一圈 " + D(qm(qm(I(2), P), b)) + " 公分，大的減小的剩 " + D(dl) + " 公分，所以選 " + c.options[0] + "。",
      explain: "解析：周長差 = 2 × 3.14 × " + auto(b, a.fl) + " − 2 × 3.14 × " + sv(a) + " = 6.28 × (" + auto(b, a.fl) + " − " + sv(a) + ") = " + D(dl) + "（公分）。" });
  });
  add("single-L5-01", "single", 5, "trap", function (k) {
    const t = R(k, 2, 9), P = Q(157, 50), inc = qm(qm(I(2), P), t.q); need(inc);
    const c = sc(k, t.q, [qm(t.q, I(2)), qd(t.q, I(2)), inc, qm(P, t.q)], t.fl);
    return Object.assign(c, { stem: "一個圓的周長增加了 " + D(inc) + " 公分，圓周率取 3.14，它的半徑增加了幾公分？",
      explain2: "解法二（周長和半徑成正比）：半徑多 1 公分，周長就多 6.28 公分。周長多了 " + D(inc) + " 公分，是 6.28 的 " + sv(t) + " 倍，所以半徑多了 " + c.options[0] + " 公分。",
      explain: "解析：周長 = 2 × 3.14 × 半徑，所以半徑增加量 = " + D(inc) + " ÷ 6.28 = " + sv(t) + "（公分）。",
      trapNote: "用 " + D(inc) + " ÷ 3.14 會得到 " + auto(qm(t.q, I(2)), t.fl) + "，那是「直徑」增加的量；題目問半徑，要再 ÷ 2 （即 ÷ 6.28）。" });
  });

  /* ---------- multi ---------- */
  add("multi-L1-01", "multi", 1, "basic", function (k) {
    const c = muw(k,
      [["圓周率是圓周長除以直徑的結果", "這就是圓周率的意思"], ["不論圓大圓小，圓周率都是同一個固定的數", "直徑 10 的圓周長約 31.4，直徑 20 的圓周長約 62.8，比值都是 3.14"], ["圓周率除不盡，計算時常取 3.14 當近似值", "它是除不盡的數"], ["圓的周長大約是直徑的 3.14 倍", "周長 ÷ 直徑 約是 3.14"]],
      [["圓越大，圓周率就越大", "大圓小圓的比值一樣"], ["圓周率等於圓周長除以半徑", "周長 ÷ 半徑 約是 6.28"], ["圓周率剛好等於 3.14，不是近似值", "3.14 只是取近似"], ["圓的周長大約是半徑的 3.14 倍", "應該是半徑的 6.28 倍"]]);
    return Object.assign(c, { stem: "關於圓周率，選出所有正確的敘述。（圓周率取 3.14）",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：圓周率 = 圓周長 ÷ 直徑，是固定的值（約 3.14159…，除不盡），所以周長約為直徑的 3.14 倍、半徑的 6.28 倍。" });
  });
  add("multi-L2-01", "multi", 2, "trap", function (k) {
    const r = R(k, 3, 10), P = Q(157, 50), q = r.q, C = qm(qm(I(2), P), q), A = qm(P, qm(q, q)); need(C, A);
    const c = muw(k,
      [["求圓周長要用 2 × 3.14 × 半徑", "圓周 = 直徑 × 3.14，直徑是半徑的 2 倍"], ["半徑 " + sv(r) + " 公分的圓，周長是 " + D(C) + " 公分", "直徑 " + auto(qm(q, I(2)), r.fl) + " 乘 3.14 得 " + D(C)], ["周長的單位是公分，不是平方公分", "周長是一條線的長度"]],
      [["半徑 " + sv(r) + " 公分的圓，周長是 " + D(A) + " 公分", D(A) + " 是半徑自乘再乘 3.14，那是面積"], ["求圓周長要用 3.14 × 半徑 × 半徑", "這是面積的算法"], ["周長的單位是平方公分", "平方公分是量面積用的"]]);
    return Object.assign(c, { stem: "半徑是 " + sv(r) + " 公分的圓，選出所有正確的敘述。（圓周率取 3.14）",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：周長 = 2 × 3.14 × " + sv(r) + " = " + D(C) + " 公分；3.14 × 半徑 × 半徑 是面積，單位為平方公分。判斷時先分清楚：量一圈的長度是周長，量裡面的大小是面積；公式裡出現兩個半徑相乘的，一定是面積。",
      trapNote: "把周長和面積公式混用：3.14 × " + sv(r) + " × " + sv(r) + " = " + D(A) + " 是面積，不是周長。" });
  });
  add("multi-L2-02", "multi", 2, "basic", function (k) {
    const d = R(k, 5, 20), P = Q(157, 50), q = d.q, C = qm(P, q), C2 = qm(C, I(2)), h = qd(q, I(2)); need(C, C2, h);
    const c = muw(k,
      [["直徑 " + sv(d) + " 公分的圓，周長是 " + D(C) + " 公分", "直徑乘 3.14 就是周長"], ["直徑 " + sv(d) + " 公分的圓，半徑是 " + auto(h, d.fl) + " 公分", "半徑是直徑的一半"], ["周長 ÷ 直徑 = 圓周率", "圓周率的定義"]],
      [["直徑 " + sv(d) + " 公分的圓，周長是 " + D(C2) + " 公分", D(C2) + " 是正確周長的 2 倍，多乘了 2"], ["直徑 " + sv(d) + " 公分的圓，半徑是 " + auto(qm(q, I(2)), d.fl) + " 公分", "這是直徑的 2 倍，半徑應是一半"], ["周長 ÷ 半徑 = 圓周率", "周長 ÷ 半徑 約是 6.28"]]);
    return Object.assign(c, { stem: "直徑是 " + sv(d) + " 公分的圓，選出所有正確的敘述。（圓周率取 3.14）",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：周長 = 3.14 × " + sv(d) + " = " + D(C) + "；半徑 = " + sv(d) + " ÷ 2 = " + auto(h, d.fl) + "；圓周率 = 周長 ÷ 直徑。要記得半徑只有直徑的一半，所以拿周長去除半徑，得到的是兩倍的圓周率，不是圓周率本身。" });
  });
  add("multi-L3-01", "multi", 3, "trap", function (k) {
    const d = R(k, 3, 12), P = Q(157, 50), q = d.q, arc = qd(qm(P, q), I(2)), per = qa(arc, q); need(arc, per);
    const c = muw(k,
      [["半圓的弧長是 " + D(arc) + " 公分", "整圓周長的一半"], ["半圓的周長是 " + D(per) + " 公分", "弧長加直邊 " + sv(d)], ["半圓的周長比它的弧長多 " + sv(d) + " 公分", "多出來的就是那條直邊"], ["半圓的周長 = 整圓周長的一半 + 直徑", "弧線加直邊"]],
      [["半圓的周長就是整圓周長的一半，也就是 " + D(arc) + " 公分", "漏掉了直邊"], ["半圓的周長是 " + D(qa(qm(P, q), q)) + " 公分", "這是整圓周長加直徑"], ["半圓的周長是 " + D(qa(arc, qd(q, I(2)))) + " 公分", "加的是半徑，應該加直徑"]]);
    return Object.assign(c, { stem: "直徑是 " + sv(d) + " 公分的半圓，選出所有正確的敘述。（圓周率取 3.14）",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：弧長 = 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "；周長 = 弧長 + 直徑 = " + D(arc) + " + " + sv(d) + " = " + D(per) + "。",
      trapNote: "「半圓的周長是圓周長的一半」是錯的：還要加上直徑那條直邊；也不能加上半徑。" });
  });
  add("multi-L4-01", "multi", 4, "extend", function (k) {
    const r1 = R(k, 2, 6), m = k.randQ(k.flavor(["int", "int", "dec", "mixed"]), { min: 2, max: 4, dens: [2, 4], places: 1 }), P = Q(157, 50), r2 = qm(r1.q, m);
    const df = qm(qm(I(2), P), qs(r2, r1.q)), wrong1 = qm(P, qs(r2, r1.q)), wrong2 = qm(qm(I(2), P), qa(r2, r1.q)); need(df, wrong1, wrong2, r2);
    const c = muw(k,
      [["大圓的直徑是小圓的 " + auto(m, "mixed") + " 倍", "半徑 " + sv(r1) + " 變成 " + auto(r2, r1.fl) + "，直徑跟著變"], ["大圓的周長是小圓的 " + auto(m, "mixed") + " 倍", "周長和半徑成正比"], ["大圓的周長比小圓多 " + D(df) + " 公分", "小圓周長 " + D(qm(qm(I(2), P), r1.q)) + "，大圓周長 " + D(qm(qm(I(2), P), r2)) + "，相差 " + D(df)]],
      [["大圓的周長是小圓的 " + auto(qm(m, m), "mixed") + " 倍", "平方倍是面積才會有"], ["大圓的周長比小圓多 " + D(wrong1) + " 公分", "少乘了 2"], ["大圓周長與小圓周長相差 " + D(wrong2) + " 公分", "把半徑相加了，應該相減"]]);
    return Object.assign(c, { stem: "小圓半徑 " + sv(r1) + " 公分，大圓半徑 " + auto(r2, r1.fl) + " 公分，選出所有正確的敘述。（圓周率取 3.14）",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：半徑、直徑、周長都成同倍數（" + auto(m, "mixed") + " 倍）；周長差 = 6.28 × (" + auto(r2, r1.fl) + " − " + sv(r1) + ") = " + D(df) + "。面積才會是平方倍。" });
  });
  add("multi-L5-01", "multi", 5, "extend", function (k) {
    const r = R(k, 10, 50, [2, 4, 2, 0.01]), t = I(k.int(5, 30)), P = Q(157, 50), one = qm(qm(I(2), P), r.q), tot = qm(one, t), w1 = qm(qm(P, r.q), t), w2 = qm(P, qm(r.q, r.q)); need(one, tot, w1, w2);
    const c = muw(k,
      [["輪子轉一圈前進 " + D(one) + " 公分", "轉一圈走一個周長"], ["轉 " + t.n + " 圈共前進 " + D(tot) + " 公分", D(one) + " 的 " + t.n + " 倍"], ["轉 " + (2 * t.n) + " 圈前進的距離是轉 " + t.n + " 圈的 2 倍", "圈數加倍，距離也加倍"]],
      [["轉 " + t.n + " 圈共前進 " + D(w1) + " 公分", "少乘了 2，變成只有一半"], ["輪子轉一圈前進 " + D(w2) + " 公分", D(w2) + " 是面積的算法"], ["轉的圈數越多，輪子的周長就越長", "周長只和輪子大小有關"]]);
    return Object.assign(c, { stem: "一個輪子的半徑是 " + sv(r) + " 公分，在平地上直線滾動 " + t.n + " 圈，選出所有正確的敘述。（圓周率取 3.14）",
      explain2: mexp(c, "解法二（逐項檢驗）："),
      explain: "解析：轉一圈走一個周長 2 × 3.14 × " + sv(r) + " = " + D(one) + "；" + t.n + " 圈 = " + D(one) + " × " + t.n + " = " + D(tot) + "。圈數與距離成正比，輪子大小不變。" });
  });
  add("tf-L1-01", "tf", 1, "basic", function (k) {
    const p = k.pick([
      ["圓周率是圓周長除以直徑得到的固定數值。", true, "解析：圓周率 = 圓周長 ÷ 直徑，任何圓都一樣。"],
      ["圓周率等於圓周長除以半徑。", false, "解析：圓周率是周長 ÷ 直徑；周長 ÷ 半徑 約等於 6.28。"],
      ["大圓的圓周率比小圓的圓周率大。", false, "解析：所有圓的圓周率都相同。"],
      ["圓周率取 3.14 只是近似值，它其實除不盡。", true, "解析：圓周率是除不盡的數，3.14 是常用近似值。"],
      ["圓的周長一定比它的直徑長。", true, "解析：周長約是直徑的 3.14 倍，比直徑長。"]]);
    return { stem: p[0] + "（圓周率取 3.14）", answer: p[1], explain2: "解法二（舉例驗證）：量一個直徑 10 公分的圓，周長約 31.4 公分、半徑 5 公分。周長 ÷ 直徑 = 3.14，周長 ÷ 半徑 = 6.28，換大一點的圓比值也一樣，而且周長 31.4 比直徑 10 長。用這個例子檢查，這句話" + yn(p[1]) + "。",
      explain: p[2] };
  });
  add("tf-L2-01", "tf", 2, "basic", function (k) {
    const r = R(k, 3, 12), P = Q(157, 50), ok = k.int(0, 1) === 1, t = qm(qm(I(2), P), r.q), f = qm(P, r.q); need(t, f);
    return { stem: "半徑 " + sv(r) + " 公分的圓，周長是 " + D(ok ? t : f) + " 公分。（圓周率取 3.14）", answer: ok,
      explain2: "解法二（用直徑檢查）：半徑加倍就是直徑，直徑是 " + auto(qm(r.q, I(2)), r.fl) + " 公分，圓周是直徑的 3.14 倍。把敘述的數字和算出來的結果比一比：" + (ok ? "兩個相同" : "不一樣，敘述的數字是 " + D(f) + "，算出來的是 " + D(t)) + "，所以這句話" + yn(ok) + "。",
      explain: "解析：周長 = 2 × 3.14 × " + sv(r) + " = " + D(t) + " 公分，" + (ok ? "所以敘述正確。" : "敘述中的 " + D(f) + " 少乘了 2，所以錯誤。") };
  });
  add("tf-L3-01", "tf", 3, "trap", function (k) {
    const m = k.randQ(k.flavor(["int", "int", "dec", "mixed"]), { min: 2, max: 4, dens: [2, 4], places: 1 }), ok = k.int(0, 1) === 1, v = ok ? m : qm(m, m); need(m, v);
    return { stem: "把圓的直徑變成原來的 " + auto(m, "mixed") + " 倍，圓的周長會變成原來的 " + auto(v, "mixed") + " 倍。（圓周率取 3.14）", answer: ok,
      explain2: "解法二（舉例驗證）：假設原來直徑 10 公分，周長 31.4 公分。直徑變成 " + auto(m, "mixed") + " 倍就是 " + D(qm(I(10), m)) + " 公分，周長變成 3.14 × " + D(qm(I(10), m)) + " = " + D(qm(Q(157, 5), m)) + " 公分，是原來的 " + auto(m, "mixed") + " 倍。敘述說 " + auto(v, "mixed") + " 倍，所以這句話" + yn(ok) + "。",
      explain: "解析：周長 = 3.14 × 直徑，周長與直徑成正比，直徑 " + auto(m, "mixed") + " 倍則周長也是 " + auto(m, "mixed") + " 倍。",
      trapNote: "把「面積」的平方倍關係（" + auto(m, "mixed") + "×" + auto(m, "mixed") + " = " + auto(qm(m, m), "mixed") + " 倍）拿來套在周長上是常見錯誤；周長只是同倍數變化。" };
  });
  add("tf-L3-02", "tf", 3, "trap", function (k) {
    const d = R(k, 2, 20), P = Q(157, 50), ok = k.int(0, 1) === 1, arc = qd(qm(P, d.q), I(2)), per = qa(arc, d.q); need(arc, per);
    return { stem: "直徑 " + sv(d) + " 公分的半圓形，周長是 " + D(ok ? per : arc) + " 公分。（圓周率取 3.14）", answer: ok,
      explain2: "解法二（用 2.57 倍檢查）：半圓周長是直徑的 2.57 倍，所以一定比直徑的 2 倍還長。敘述寫 " + D(ok ? per : arc) + " 公分，" + (ok ? "它剛好是直徑的 2.57 倍" : "它只有直徑的 1.57 倍，漏了直邊") + "，所以這句話" + yn(ok) + "。",
      explain: "解析：半圓周長 = 弧長 " + D(arc) + " + 直徑 " + sv(d) + " = " + D(per) + " 公分。",
      trapNote: "只算弧長 " + D(arc) + " 公分就當作周長，漏掉直邊 " + sv(d) + " 公分。" };
  });
  add("tf-L4-01", "tf", 4, "extend", function (k) {
    const r = R(k, 2, 8), m = k.randQ(k.flavor(["int", "int", "dec"]), { min: 2, max: 4, places: 1 }), P = Q(157, 50), a = qm(qm(I(2), P), r.q), ok = k.int(0, 1) === 1, v = ok ? qm(a, m) : qm(a, qm(m, m)); need(a, v, qm(a, m));
    return { stem: "小圓周長是 " + D(a) + " 公分，大圓的半徑是小圓半徑的 " + auto(m, "mixed") + " 倍，所以大圓周長是 " + D(v) + " 公分。（圓周率取 3.14）", answer: ok,
      explain2: "解法二（比較兩圓的周長比）：兩圓的周長比等於半徑比，半徑是 " + auto(m, "mixed") + " 倍，周長也該是這個倍數。敘述裡的大圓周長是小圓的 " + auto(qd(v, a), "mixed") + " 倍，" + (ok ? "兩個倍數相同" : "兩個倍數不同") + "，所以這句話" + yn(ok) + "。",
      explain: "解析：半徑 " + auto(m, "mixed") + " 倍，周長也是 " + auto(m, "mixed") + " 倍：" + D(a) + " × " + auto(m, "mixed") + " = " + D(qm(a, m)) + " 公分。" };
  });
  add("tf-L5-01", "tf", 5, "extend", function (k) {
    const a = R(k, 2, 12), P = Q(157, 50), ok = k.int(0, 1) === 1, t = qm(qm(I(2), P), a.q), f = qm(P, a.q); need(t, f);
    return { stem: "操場的外圈跑道半徑比內圈多 " + sv(a) + " 公尺，外圈跑一圈會比內圈多 " + D(ok ? t : f) + " 公尺。（圓周率取 3.14）", answer: ok,
      explain2: "解法二（舉例驗證）：假設內圈半徑 10 公尺，內圈周長 62.8 公尺；外圈半徑 " + D(qa(I(10), a.q)) + " 公尺，周長 " + D(qm(qm(I(2), P), qa(I(10), a.q))) + " 公尺；相差 " + D(t) + " 公尺，換別的內圈半徑結果也一樣。敘述寫 " + D(ok ? t : f) + " 公尺，所以這句話" + yn(ok) + "。",
      explain: "解析：周長差 = 2 × 3.14 × " + sv(a) + " = " + D(t) + " 公尺，與內圈原本多大無關。" };
  });

  /* ---------- fill ---------- */
  add("fill-L1-01", "fill", 1, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 2, 20), C = qm(qm(I(2), pi.p), r.q); need(C);
    return Object.assign({ stem: "半徑 " + sv(r) + " 公分的圓，周長是（　）公分。（圓周率取 " + pp(pi) + "）", units: ["公分", "cm"],
      explain2: "解法二（半徑換直徑）：半徑的兩倍是直徑，直徑是 " + auto(qm(I(2), r.q), r.fl) + " 公分；圓周是直徑的 " + pp(pi) + " 倍，乘起來就是答案。答案：" + D(C) + " 公分。",
      explain: "解析：2 × " + pp(pi) + " × " + sv(r) + " = " + D(C) + "。" }, ans(C, "dec"));
  });
  add("fill-L1-02", "fill", 1, "basic", function (k) {
    const d = R(k, 3, 30), C = qm(Q(157, 50), d.q); need(C);
    return Object.assign({ stem: "直徑 " + sv(d) + " 公分的圓，周長是（　）公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（拆開來算）：圓周率可以拆成 3 和 0.14 兩部分。直徑的 3 倍是 " + D(qm(I(3), d.q)) + "，直徑的 0.14 倍加上去，就得到周長。答案：" + D(C) + " 公分。",
      explain: "解析：3.14 × " + sv(d) + " = " + D(C) + "。" }, ans(C, "dec"));
  });
  add("fill-L2-01", "fill", 2, "basic", function (k) {
    const r = R(k, 3, 15), C = qm(qm(I(2), Q(157, 50)), r.q); need(C);
    return Object.assign({ stem: "圓的周長是 " + D(C) + " 公分，半徑是（　）公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（先求直徑）：周長 " + D(C) + " 除以圓周率 3.14 得直徑 " + auto(qm(r.q, I(2)), r.fl) + " 公分，半徑是直徑的一半。答案：" + sv(r) + " 公分。",
      explain: "解析：半徑 = 周長 ÷ 3.14 ÷ 2 = " + D(C) + " ÷ 6.28 = " + sv(r) + "。" }, ans(r.q, r.fl));
  });
  add("fill-L3-01", "fill", 3, "trap", function (k) {
    const d = R(k, 2, 24), P = Q(157, 50), arc = qd(qm(P, d.q), I(2)), per = qa(arc, d.q); need(arc, per);
    return Object.assign({ stem: "直徑 " + sv(d) + " 公分的半圓形，周長是（　）公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（一次算完）：半圓周長 = (3.14 ÷ 2 + 1) × 直徑 = 2.57 × " + sv(d) + " = " + D(per) + "。答案：" + D(per) + " 公分。",
      explain: "解析：弧長 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "，加直徑 " + sv(d) + "，得 " + D(per) + "。",
      trapNote: "只寫 " + D(arc) + "（弧長）會漏掉直邊 " + sv(d) + " 公分。" }, ans(per, "dec"));
  });
  add("fill-L3-02", "fill", 3, "basic", function (k) {
    const pi = PIx(k, true), r = pi.z ? { q: I(k.pick([7, 14, 21])), fl: "int" } : R(k, 8, 30, [2, 4, 2, 0.01]), C = qm(qm(I(2), pi.p), r.q); need(C);
    return Object.assign({ stem: "時鐘的分針長 " + sv(r) + " 公分，分針針尖轉一圈（走 1 小時）走過（　）公分。（圓周率取 " + pp(pi) + "）", units: ["公分", "cm"],
      explain2: "解法二（用直徑想）：針尖走過的是一個圓的周長，這個圓的直徑是分針長的 2 倍，也就是 " + auto(qm(I(2), r.q), r.fl) + " 公分；圓周是直徑的 " + pp(pi) + " 倍，結果是 " + D(C) + " 公分。答案：" + D(C) + " 公分。",
      explain: "解析：針尖轉一圈走的是半徑 " + sv(r) + " 公分的圓周：2 × " + pp(pi) + " × " + sv(r) + " = " + D(C) + "。" }, ans(C, "dec"));
  });
  add("fill-L4-01", "fill", 4, "basic", function (k) {
    const d = R(k, 30, 80, [3, 4, 1, 0.01]), t = I(k.pick([10, 20, 25, 50])), P = Q(157, 50), one = qm(P, d.q), tot = qd(qm(one, t), I(100)); need(one, tot);
    return Object.assign({ stem: "車輪的直徑是 " + sv(d) + " 公分，滾動 " + t.n + " 圈前進（　）公尺。（圓周率取 3.14）", units: ["公尺", "m"],
      explain2: "解法二（先把直徑加起來）：轉 " + t.n + " 圈，等於把直徑 " + sv(d) + " 公分連續量 " + t.n + " 次，共 " + D(qm(d.q, t)) + " 公分；再乘圓周率，換成公尺就是答案。答案：" + D(tot) + " 公尺。",
      explain: "解析：一圈 3.14 × " + sv(d) + " = " + D(one) + " 公分；" + t.n + " 圈 = " + D(qm(one, t)) + " 公分 = " + D(tot) + " 公尺。" }, ans(tot, "dec"));
  });
  add("fill-L5-01", "fill", 5, "extend", function (k) {
    const d = R(k, 4, 20), t = I(k.int(3, 8)), P = Q(157, 50), one = qm(P, d.q), L = qm(one, t); need(L, one);
    return Object.assign({ stem: "一條繩子剛好繞圓柱形水桶 " + t.n + " 圈，繩長 " + D(L) + " 公分（不計接頭），水桶的直徑是（　）公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（先合併圈數和圓周率）：繞 " + t.n + " 圈，繩長是直徑的 3.14 × " + t.n + " = " + D(qm(P, t)) + " 倍。繩長 " + D(L) + " 公分除以這個倍數，得到直徑 " + sv(d) + " 公分。答案：" + sv(d) + " 公分。",
      explain: "解析：繞一圈 = " + D(L) + " ÷ " + t.n + " = " + D(one) + " 公分，直徑 = " + D(one) + " ÷ 3.14 = " + sv(d) + "。" }, ans(d.q, d.fl));
  });

  /* ---------- calc ---------- */
  add("calc-L1-01", "calc", 1, "basic", function (k) {
    const d = R(k, 2, 25), C = qm(Q(157, 50), d.q); need(C);
    return Object.assign({ stem: "圓周率取 3.14，計算直徑 " + sv(d) + " 公分的圓周長：3.14 × " + ex(d.q, d.fl), units: ["公分"],
      explain2: "解法二（拆開來算）：把 3.14 拆成 3 加 0.14，3 乘直徑得 " + D(qm(I(3), d.q)) + "，0.14 乘直徑得 " + D(qm(Q(14, 100), d.q)) + "，兩個加起來 " + D(C) + "。答案：" + D(C) + " 公分。",
      explain: "解析：列式 3.14 × " + sv(d) + " = " + D(C) + "。" }, ans(C, "dec"));
  });
  add("calc-L2-01", "calc", 2, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 3, 20), C = qm(qm(I(2), pi.p), r.q); need(C);
    return Object.assign({ stem: "圓周率取 " + pp(pi) + "，計算半徑 " + sv(r) + " 公分的圓周長：2 × " + pp(pi) + " × " + ex(r.q, r.fl), units: ["公分"],
      explain2: "解法二（比例想法）：圓周是直徑的 " + pp(pi) + " 倍。半徑 " + sv(r) + " 公分，兩個半徑合成直徑 " + auto(qm(I(2), r.q), r.fl) + " 公分，所以圓周長是 " + D(C) + " 公分。答案：" + D(C) + " 公分。",
      explain: "解析：2 × " + pp(pi) + " = " + D(qm(I(2), pi.p)) + (pi.z ? "" : "") + "，再乘 " + sv(r) + " 得 " + D(C) + "。" }, ans(C, "dec"));
  });
  add("calc-L3-01", "calc", 3, "basic", function (k) {
    const fl = k.flavor(["int", "dec", "mixed"], [1, 3, 2]), a = k.randQ(fl, { min: 11, max: 38, dens: [2, 4, 5] }), b = qs(I(k.pick([50, 100])), a), P = Q(157, 50), tot = qm(P, qa(a, b)); need(tot, b);
    return Object.assign({ stem: "圓周率取 3.14，用簡便方法計算：3.14 × " + ex(a, fl) + " + 3.14 × " + ex(b, fl),
      explain2: "解法二（各算各的）：" + auto(a, fl) + " 個 3.14 是 " + D(qm(P, a)) + "，" + auto(b, fl) + " 個 3.14 是 " + D(qm(P, b)) + "，兩堆合起來是 " + D(tot) + "。答案：" + D(tot) + "。",
      explain: "解析：提出 3.14：3.14 × (" + auto(a, fl) + " + " + auto(b, fl) + ") = 3.14 × " + auto(qa(a, b), fl) + " = " + D(tot) + "。" }, ans(tot, "dec"));
  });
  add("calc-L4-01", "calc", 4, "trap", function (k) {
    const d = R(k, 3, 30), P = Q(157, 50), arc = qd(qm(P, d.q), I(2)), per = qa(arc, d.q); need(arc, per);
    return Object.assign({ stem: "圓周率取 3.14，計算直徑 " + sv(d) + " 公分的半圓形周長：3.14 × " + ex(d.q, d.fl) + " ÷ 2 + " + ex(d.q, d.fl), units: ["公分"],
      explain2: "解法二（一次算完）：半圓周長 = 2.57 × 直徑 = 2.57 × " + sv(d) + " = " + D(per) + "。答案：" + D(per) + " 公分。",
      explain: "解析：弧長 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "，再加直徑 " + sv(d) + "，得 " + D(per) + "。",
      trapNote: "最後的「+ " + sv(d) + "」是直邊，漏掉就只剩弧長 " + D(arc) + "。" }, ans(per, "dec"));
  });
  add("calc-L5-01", "calc", 5, "extend", function (k) {
    const r = R(k, 10, 40, [3, 4, 1, 0.01]), w = R(k, 1, 5, [2, 4, 3, 0.01]), P = Q(157, 50), rw = qa(r.q, w.q), v = qm(qm(I(2), P), w.q); need(v);
    return Object.assign({ stem: "圓周率取 3.14，計算：2 × 3.14 × " + ex(rw, r.fl) + " − 2 × 3.14 × " + ex(r.q, r.fl), units: ["公尺", "公分"],
      explain2: "解法二（分別算再相減）：外圈 2 × 3.14 × " + auto(rw, r.fl) + " = " + D(qm(qm(I(2), P), rw)) + "，內圈 2 × 3.14 × " + sv(r) + " = " + D(qm(qm(I(2), P), r.q)) + "，相減 = " + D(v) + "。答案：" + D(v) + "。",
      explain: "解析：提出 6.28：6.28 × (" + auto(rw, r.fl) + " − " + sv(r) + ") = 6.28 × " + sv(w) + " = " + D(v) + "。差只跟半徑差有關。" }, ans(v, "dec"));
  });

  /* ---------- word ---------- */
  add("word-L1-01", "word", 1, "basic", function (k) {
    const d = R(k, 40, 100, [3, 4, 1, 0.01]), C = qm(Q(157, 50), d.q); need(C);
    return Object.assign({ stem: "圓形桌面的直徑是 " + sv(d) + " 公分，要在桌子邊緣圍一圈花邊，花邊至少要多長？（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（用半徑算）：半徑是直徑的一半，等於 " + auto(qd(d.q, I(2)), d.fl) + " 公分；花邊長是半徑的 2 倍再乘 3.14，結果 " + D(C) + " 公分。答案：" + D(C) + " 公分。",
      explain: "解析：花邊長 = 圓周長 = 3.14 × " + sv(d) + " = " + D(C) + "（公分）。" }, ans(C, "dec"));
  });
  add("word-L2-01", "word", 2, "basic", function (k) {
    const pi = PIx(k, true), r = RR(k, pi.z, 3, 15), C = qm(qm(I(2), pi.p), r.q); need(C);
    return Object.assign({ stem: "公園有一座圓形花圃，半徑是 " + sv(r) + " 公尺，沿著花圃邊緣圍一圈籬笆，籬笆長幾公尺？（圓周率取 " + pp(pi) + "）", units: ["公尺", "m"],
      explain2: "解法二（半徑換直徑）：半徑的兩倍是直徑，直徑是 " + auto(qm(I(2), r.q), r.fl) + " 公尺；圓周是直徑的 " + pp(pi) + " 倍，乘起來得籬笆長。答案：" + D(C) + " 公尺。",
      explain: "解析：2 × " + pp(pi) + " × " + sv(r) + " = " + D(C) + "（公尺）。" }, ans(C, "dec"));
  });
  add("word-L2-02", "word", 2, "basic", function (k) {
    const r = R(k, 4, 20), L = qm(qm(I(2), Q(157, 50)), r.q); need(L);
    return Object.assign({ stem: "小華把一條長 " + D(L) + " 公分的鐵絲彎成一個圓（接頭不計），這個圓的半徑是幾公分？（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（先求直徑）：鐵絲長就是圓周長，除以 3.14 先得到直徑 " + auto(qm(r.q, I(2)), r.fl) + " 公分，半徑是直徑的一半。答案：" + sv(r) + " 公分。",
      explain: "解析：半徑 = " + D(L) + " ÷ 3.14 ÷ 2 = " + sv(r) + "（公分）。" }, ans(r.q, r.fl));
  });
  add("word-L3-01", "word", 3, "trap", function (k) {
    const d = R(k, 3, 30), P = Q(157, 50), arc = qd(qm(P, d.q), I(2)), per = qa(arc, d.q); need(arc, per);
    return Object.assign({ stem: "半圓形花圃的直徑是 " + sv(d) + " 公尺，花圃四周（包括直的那一邊）都要圍上籬笆，籬笆至少要多長？（圓周率取 3.14）", units: ["公尺", "m"],
      explain2: "解法二（一次算完）：半圓花圃一圈 = 2.57 × 直徑 = 2.57 × " + sv(d) + " = " + D(per) + " 公尺。答案：" + D(per) + " 公尺。",
      explain: "解析：弧線 3.14 × " + sv(d) + " ÷ 2 = " + D(arc) + "，直邊 " + sv(d) + "，合計 " + D(per) + "（公尺）。",
      trapNote: "只算弧線 " + D(arc) + " 公尺會漏掉直邊；題目寫「包括直的那一邊」就要加直徑。" }, ans(per, "dec"));
  });
  add("word-L4-01", "word", 4, "basic", function (k) {
    const d = R(k, 40, 80, [3, 4, 1, 0.01]), t = I(k.pick([10, 20, 25, 50])), P = Q(157, 50), one = qm(P, d.q), tot = qd(qm(one, t), I(100)); need(one, tot);
    return Object.assign({ stem: "腳踏車輪的直徑是 " + sv(d) + " 公分，車輪在平地上轉 " + t.n + " 圈，車子前進幾公尺？（圓周率取 3.14）", units: ["公尺", "m"],
      explain2: "解法二（先把直徑加起來）：轉 " + t.n + " 圈，等於把直徑 " + sv(d) + " 公分連續量 " + t.n + " 次，共 " + D(qm(d.q, t)) + " 公分；再乘圓周率，換成公尺就是答案。答案：" + D(tot) + " 公尺。",
      explain: "解析：一圈 3.14 × " + sv(d) + " = " + D(one) + " 公分，" + t.n + " 圈 = " + D(qm(one, t)) + " 公分 = " + D(tot) + " 公尺。" }, ans(tot, "dec"));
  });
  add("word-L4-02", "word", 4, "extend", function (k) {
    const d = R(k, 6, 20), t = I(k.int(3, 6)), knot = k.randQ(k.flavor(["int", "dec"]), { min: 5, max: 15 }), P = Q(157, 50), one = qa(qm(P, d.q), knot), tot = qm(one, t); need(one, tot);
    return Object.assign({ stem: "用繩子把 " + t.n + " 個同樣大小的圓形水桶，各繞一圈（每桶直徑 " + sv(d) + " 公分）後綁緊，每個結要多用 " + auto(knot, "dec") + " 公分繩子，共需多少公分繩子？（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（圓周和結分開算）：" + t.n + " 桶的直徑加起來是 " + D(qm(d.q, t)) + " 公分，乘 3.14 得圓周總長 " + D(qm(qm(P, d.q), t)) + " 公分；" + t.n + " 個結共用 " + D(qm(knot, t)) + " 公分；繩子總共 " + D(tot) + " 公分。答案：" + D(tot) + " 公分。",
      explain: "解析：每桶繩長 3.14 × " + sv(d) + " + " + auto(knot, "dec") + " = " + D(one) + "，共 " + t.n + " 桶：" + D(one) + " × " + t.n + " = " + D(tot) + "（公分）。" }, ans(tot, "dec"));
  });
  add("word-L5-01", "word", 5, "extend", function (k) {
    const r = I(k.int(20, 40)), w = R(k, 1, 2, [2, 4, 3, 0.01]), P = Q(157, 50), v = qm(qm(I(2), P), qm(I(2), w.q)); need(v);
    return Object.assign({ stem: "圓形跑道每一道寬 " + sv(w) + " 公尺。第 1 道的跑步路線半徑是 " + r.n + " 公尺，比賽時第 3 道的選手沿著半徑更大的圓跑一圈，他比第 1 道的選手多跑幾公尺？（兩道圓心相同）（圓周率取 3.14）", units: ["公尺", "m"],
      explain2: "解法二（只看差）：第 3 道的半徑比第 1 道多 " + auto(qm(I(2), w.q), w.fl) + " 公尺，周長就多半徑差的 6.28 倍，不管第 1 道多大，都是 " + D(v) + " 公尺。答案：" + D(v) + " 公尺。",
      explain: "解析：第 3 道半徑比第 1 道多 2 × " + sv(w) + " = " + auto(qm(I(2), w.q), w.fl) + " 公尺；多跑 2 × 3.14 × " + auto(qm(I(2), w.q), w.fl) + " = " + D(v) + "（公尺），與 " + r.n + " 公尺無關。" }, ans(v, "dec"));
  });

  /* ---------- 教材 □ 未知數題（規格第 14 節） ---------- */
  add("single-L1-03", "single", 1, "basic", function (k) {
    const d = R(k, 3, 24), P = Q(157, 50), C = qm(P, d.q); need(C);
    const c = sc(k, d.q, [qm(d.q, I(2)), qd(d.q, I(2)), C, qm(d.q, P)], d.fl);
    return Object.assign(c, { stem: "圓周率取 3.14，3.14 × □ = " + D(C) + "（□ 是圓的直徑），□ 是多少公分？",
      explain2: "解法二（用除法想）：周長除以直徑，一定會得到圓周率，所以要找的直徑，要讓題目的周長除以它剛好是 3.14，只有選項 " + c.options[0] + " 公分符合。",
      explain: "解析：□ = " + D(C) + " ÷ 3.14 = " + sv(d) + "（公分）。" });
  });
  add("fill-L1-03", "fill", 1, "basic", function (k) {
    const d = R(k, 3, 30), C = qm(Q(157, 50), d.q); need(C);
    return Object.assign({ stem: "圓的周長是 " + D(C) + " 公分，直徑是 □ 公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（化成整數除法）：周長和圓周率同時乘 100，變成 " + D(qm(C, I(100))) + " ÷ 314 的整數除法，商就是直徑。答案：" + sv(d) + " 公分。",
      explain: "解析：周長 = 3.14 × 直徑，□ = " + D(C) + " ÷ 3.14 = " + sv(d) + "。" }, ans(d.q, d.fl));
  });
  add("calc-L2-02", "calc", 2, "basic", function (k) {
    const d = R(k, 3, 30), C = qm(Q(157, 50), d.q); need(C);
    return Object.assign({ stem: "圓周率取 3.14，圓的周長是 " + D(C) + " 公分，直徑是 □ 公分，求 □：" + D(C) + " ÷ 3.14", units: ["公分"],
      explain2: "解法二（化成整數除法）：周長和圓周率同時乘 100，變成 " + D(qm(C, I(100))) + " ÷ 314，商就是直徑。答案：□ = " + sv(d) + "。",
      explain: "解析：周長 = 直徑 × 圓周率，所以要用除法找出直徑。□ = " + D(C) + " ÷ 3.14 = " + sv(d) + "。" }, ans(d.q, d.fl));
  });
  add("single-L3-02", "single", 3, "trap", function (k) {
    const r = R(k, 2, 16), P = Q(157, 50), C = qm(qm(I(2), P), r.q); need(C);
    const c = sc(k, r.q, [qm(r.q, I(2)), qd(r.q, I(2)), qd(C, I(2)), qm(r.q, P)], r.fl);
    return Object.assign(c, { stem: "圓周率取 3.14，2 × 3.14 × □ = " + D(C) + "（□ 是圓的半徑），□ 是多少公分？",
      explain2: "解法二（分兩步想）：第一步，周長除以圓周率得直徑 " + auto(qm(r.q, I(2)), r.fl) + " 公分；第二步，半徑是直徑的一半，所以 □ 是 " + c.options[0] + " 公分。",
      explain: "解析：□ = " + D(C) + " ÷ (2 × 3.14) = " + D(C) + " ÷ 6.28 = " + sv(r) + "（公分）。",
      trapNote: "只用 " + D(C) + " ÷ 3.14 會得到 " + auto(qm(r.q, I(2)), r.fl) + "，那是直徑；算式裡已經有「2 ×」，□ 是半徑，要連 2 一起除。" });
  });
  add("word-L3-02", "word", 3, "basic", function (k) {
    const d = R(k, 4, 24), L = qm(Q(157, 50), d.q); need(L);
    return Object.assign({ stem: "園藝社用一條長 " + D(L) + " 公尺的籬笆圍成圓形花圃（接頭不計），花圃的直徑是 □ 公尺。（圓周率取 3.14）", units: ["公尺", "m"],
      explain2: "解法二（化成整數除法）：籬笆長和圓周率同時乘 100，變成 " + D(qm(L, I(100))) + " ÷ 314，商就是直徑。答案：" + sv(d) + " 公尺。",
      explain: "解析：籬笆長 = 圓周長 = 3.14 × 直徑，□ = " + D(L) + " ÷ 3.14 = " + sv(d) + "（公尺）。" }, ans(d.q, d.fl));
  });
  add("tf-L4-02", "tf", 4, "trap", function (k) {
    const d = R(k, 4, 20), P = Q(157, 50), arc = qd(qm(P, d.q), I(2)), per = qa(arc, d.q), ok = k.int(0, 1) === 1, f = qd(d.q, I(2)); need(per, f);
    return { stem: "半圓形的周長是 " + D(per) + " 公分，它的直徑 □ 是 " + D(ok ? d.q : f) + " 公分。（圓周率取 3.14）", answer: ok,
      explain2: "解法二（代入檢查）：把敘述的直徑代回去算半圓周長，得到約 " + K.qVal(qm(Q(257, 100), ok ? d.q : f)).toFixed(2) + " 公分，" + (ok ? "剛好和題目給的一樣" : "和題目給的周長不一樣") + "，所以這句話" + yn(ok) + "。",
      explain: "解析：半圓周長 = 3.14 × 直徑 ÷ 2 + 直徑 = 2.57 × 直徑，□ = " + D(per) + " ÷ 2.57 = " + sv(d) + "（公分）。",
      trapNote: "周長是半圓弧加直徑；若把 " + D(f) + " 當成直徑，其實那只是半徑（直徑的一半）。" };
  });
  add("word-L4-03", "word", 4, "extend", function (k) {
    const d = R(k, 30, 80, [3, 4, 1, 0.01]), t = I(k.pick([10, 20, 25, 50])), P = Q(157, 50), L = qd(qm(qm(P, d.q), t), I(100)); need(L);
    return Object.assign({ stem: "腳踏車的車輪在平地上轉了 " + t.n + " 圈，共前進 " + D(L) + " 公尺，車輪的直徑是 □ 公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（先算圈數乘圓周率）：" + t.n + " 圈 × 3.14 = " + D(qm(P, t)) + "，表示走的距離是直徑的這麼多倍。距離換成公分是 " + D(qm(L, I(100))) + "，除以 " + D(qm(P, t)) + " 得直徑 " + sv(d) + " 公分。答案：" + sv(d) + " 公分。",
      explain: "解析：" + D(L) + " 公尺 = " + D(qm(L, I(100))) + " 公分；轉一圈 " + D(qm(L, I(100))) + " ÷ " + t.n + " = " + D(qm(P, d.q)) + " 公分，直徑 □ = " + D(qm(P, d.q)) + " ÷ 3.14 = " + sv(d) + "（公分）。" }, ans(d.q, d.fl));
  });
  add("calc-L4-02", "calc", 4, "trap", function (k) {
    const r = R(k, 3, 12), w = R(k, 1, 4, [3, 4, 2, 0.01]), P = Q(157, 50), C = qm(qm(I(2), P), qa(r.q, w.q)); need(C);
    return Object.assign({ stem: "圓周率取 3.14，把一個圓的半徑 □ 公分增加 " + sv(w) + " 公分後，周長變成 " + D(C) + " 公分，求 □：" + D(C) + " ÷ (2 × 3.14) − " + ex(w.q, w.fl), units: ["公分"],
      explain2: "解法二（先扣掉增加的周長）：半徑增加 " + sv(w) + " 公分，周長就多了 6.28 乘 " + sv(w) + "，等於 " + D(qm(Q(157, 25), w.q)) + " 公分；扣掉之後剩下的周長是 " + D(qs(C, qm(Q(157, 25), w.q))) + " 公分，它對應原來的半徑，所以原來的半徑 □ 是 " + sv(r) + " 公分。",
      explain: "解析：新半徑 = " + D(C) + " ÷ 6.28 = " + auto(qa(r.q, w.q), r.fl) + " 公分，原半徑 □ = " + auto(qa(r.q, w.q), r.fl) + " − " + sv(w) + " = " + sv(r) + "。",
      trapNote: "算出的 " + auto(qa(r.q, w.q), r.fl) + " 是「增加後」的半徑，還要減掉增加的 " + sv(w) + " 才是原來的半徑。" }, ans(r.q, r.fl));
  });
  add("fill-L5-02", "fill", 5, "extend", function (k) {
    const w = R(k, 1, 12), X = qm(qm(I(2), Q(157, 50)), w.q); need(X);
    return Object.assign({ stem: "大圓的周長比小圓的周長多 " + D(X) + " 公分，大圓的半徑比小圓的半徑多 □ 公分。（圓周率取 3.14）", units: ["公分", "cm"],
      explain2: "解法二（先求直徑差）：周長差是直徑差的 3.14 倍，所以直徑差是 " + D(X) + " ÷ 3.14 = " + auto(qm(w.q, I(2)), w.fl) + " 公分；半徑差是直徑差的一半，□ 是 " + sv(w) + " 公分。",
      explain: "解析：周長差只和半徑差有關，和兩個圓本來多大無關。周長差 = 2 × 3.14 × 半徑差，□ = " + D(X) + " ÷ 6.28 = " + sv(w) + "（公分）。" }, ans(w.q, w.fl));
  });

  ExamBank.register("circle-length", "circle-length-main", S);
})();
