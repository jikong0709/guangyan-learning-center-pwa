/* 題庫：solve-lower（年齡問題、平均問題、追趕與組合問題）｜題庫工 C
   數字風格（規格第 11 節）：整數／小數（8.5 歲、72.5 分）／分數／帶分數，全部以 kit.Q 精確運算。 */
(function () {
  "use strict";
  /* 共用後處理：(1) 答案為無限小數時題幹加「請以分數作答」(2) 可見文字不得出現分母>60 的分數或 9 位以上數字（重抽） */
  function visOK(r) {
    const t = [r.stem, r.explain, r.explain2 || "", r.trapNote || "", String(r.answer), (r.accepted || []).join(" "), (r.options || []).join(" ")].join(" ");
    if (/\d{9,}/.test(t)) return false;
    const re = /(\d+)\/(\d+)/g; let m; while ((m = re.exec(t))) if (+m[2] > 60) return false;
    return true;
  }
  function needFrac(r) {
    const m = /(\d+)\/(\d+)/.exec(String(r.answer)); if (!m) return false;
    let d = +m[2]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d > 1;
  }
  function paren(t) {
    return String(t).replace(/(?<![\d\/.])(\d+ \d+\/\d+)(?![\d\/])/g, (m, tok, off, all) => {
      const bef = all.slice(0, off).replace(/\s+$/, ""), aft = all.slice(off + m.length).replace(/^\s+/, "");
      const opB = /[×÷＋－−]$|(乘|加|減|除以)$/.test(bef), opA = /^[×÷＋－−]|^(乘|加|減|除以)/.test(aft);
      if (bef.slice(-1) === "(" && aft.slice(0, 1) === ")") return m;
      return (opA || opB) ? "(" + m + ")" : m;
    });
  }
  function words(t) {
    return String(t).replace(/\s*＝\s*/g, " 等於 ").replace(/\s*×\s*/g, " 乘 ").replace(/\s*÷\s*/g, " 除以 ").replace(/\s*＋\s*/g, " 加 ").replace(/\s*[－−]\s*/g, " 減 ");
  }
  function wrapSpec(s) {
    return Object.assign({}, s, { gen(kit) {
      let r;
      for (let i = 0; i < 300; i++) { r = s.gen(kit); if (visOK(r)) break; }
      if ((s.type === "fill" || s.type === "calc" || s.type === "word") && needFrac(r) && r.stem.indexOf("分數作答") < 0) r.stem += "（請以分數作答）";
      if (typeof r.explain2 === "string") r.explain2 = r.explain2.indexOf("逐項代入檢驗") >= 0 ? r.explain2.replace(/（([^）]*)）→/g, (m0, inner) => "（" + paren(inner) + "）→") : words(paren(r.explain2));
      return r;
    } });
  }
  const reg = (t, g, specs) => ExamBank.register(t, g, specs.map(wrapSpec));
  const sp = (id, type, level, tag, gen) => ({ id, type, level, tag, gen });
  const FLS = ["int", "dec", "frac", "mixed"], FW = [2, 4, 2, 2];
  const Qn = (n, d) => ExamKit.Q(n, d);
  const add = (a, b) => ExamKit.qAdd(a, b), sub = (a, b) => ExamKit.qSub(a, b), mul = (a, b) => ExamKit.qMul(a, b), dv = (a, b) => ExamKit.qDiv(a, b);
  const qv = a => a.n / a.d;
  const isF = fl => fl === "frac" || fl === "mixed";
  const I = n => Qn(n, 1);
  const sw = (x, fl) => (isF(fl) ? ExamKit.qMixed(x) : (x.d === 1 ? String(x.n) : (ExamKit.qDec(x) || ExamKit.qMixed(x))));
  let curFl = "int";
  const fz = x => sw(x, curFl);
  const rd = x => Math.max(1, Math.round(qv(x)));
  function nice(a, fl) {
    if (!a || !(a.n > 0)) return false;
    if (isF(fl)) return a.d <= 24 && a.n < 3000;
    const v = qv(a); return ExamKit.qIsTerminating(a) && Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-7 && a.n < 1e7;
  }
  const sh = (a, fl) => isF(fl) ? ExamKit.qMixed(a) : ExamKit.qShow(a, "dec");
  const ans = (a, fl) => ExamKit.qAnswer(a, isF(fl) ? "mixed" : "dec");
  function retry(kit, build) {
    const f0 = kit.flavor(FLS, FW);
    for (const fl of [f0, "int"]) for (let i = 0; i < 800; i++) { curFl = fl; const r = build(fl); if (r) return r; }
    throw new Error("gen failed");
  }
  function qopts(kit, c, wrongs, fl, unit) {
    const f = a => sh(a, fl) + (unit || "");
    const seen = new Set([f(c)]); const out = [];
    wrongs.forEach(w => { if (!w || !(w.n > 0) || !nice(w, fl)) return; const s = f(w); if (!seen.has(s)) { seen.add(s); out.push(s); } });
    const st = Qn(1, c.d);
    for (let k = 1; out.length < 3 && k < 40; k++) {
      [add(c, mul(st, I(k))), sub(c, mul(st, I(k)))].forEach(w => { if (w.n > 0 && out.length < 3 && nice(w, fl)) { const s = f(w); if (!seen.has(s)) { seen.add(s); out.push(s); } } });
    }
    return { options: [f(c)].concat(kit.shuffle(out).slice(0, 3)), answer: 0 };
  }
  function multiQ(kit, note, head, trues, falses) {
    const nt = kit.int(2, Math.min(3, trues.length));
    const nf = nt === 2 ? kit.int(2, 3) : 2;
    const all = kit.shuffle(kit.shuffle(trues).slice(0, nt).map(x => ({ x, ok: 1 })).concat(kit.shuffle(falses).slice(0, nf).map(x => ({ x, ok: 0 }))));
    return {
      stem: head + "\n請選出所有正確的敘述（複選）。",
      options: all.map(o => o.x[0]),
      answer: all.map((o, i) => o.ok ? i : -1).filter(i => i >= 0),
      explain: "解析：\n" + all.map(o => (o.ok ? "【正確】" : "【錯誤】") + o.x[0] + "：" + o.x[1]).join("\n") + "\n解題重點：" + note,
      explain2: "解法二（逐項代入檢驗）：" + all.map(o => "．" + o.x[0] + "（" + (o.x[2] || o.x[1]) + "）→" + (o.ok ? "成立" : "不成立")).join("；") + "。答案是標示成立的選項。"
    };
  }
  function tfQ(kit, alt, okItem, badItem) {
    const ok = kit.int(0, 1) === 1; const it = ok ? okItem : badItem;
    return { stem: "判斷下列敘述是否正確：\n" + it[0], answer: ok, explain: "解析：" + it[1], explain2: alt(ok) };
  }
  /* 年齡／歲數：整數、x.5、x又1/2 或 x又1/4 */
  function ageQ(kit, fl, lo, hi) {
    if (fl === "int") return I(kit.int(lo, hi));
    if (fl === "dec") return Qn(2 * kit.int(lo, hi - 1) + 1, 2);
    return Qn(4 * kit.int(lo, hi - 1) + kit.pick([1, 2, 3]), 4);
  }
  /* 成績或一般量 */
  function rq(kit, fl, lo, hi, dens) {
    return kit.randQ((fl === "frac" && lo >= 1) ? "mixed" : fl, { min: lo, max: hi, dens: dens || [2, 4], places: 1 });
  }
  function kq(kit, fl) {
    if (fl === "int") return I(kit.pick([1, 2, 3]));
    if (fl === "dec") return Qn(kit.pick([5, 15, 25, 1, 2, 3]), 10);
    return Qn(kit.pick([1, 3, 1, 3, 5]), kit.pick([2, 4, 2, 4, 2]));
  }
  const sumQ = a => a.reduce((x, y) => add(x, y), I(0));
  function grpQ(kit, fl) {
    const ns = [10, 20, 30, 40];
    const n1 = kit.pick(ns), n2 = kit.pick(ns); if (n1 === n2) return null;
    let a1 = rq(kit, fl, 60, 90), a2 = rq(kit, fl, 60, 95); if (qv(a1) === qv(a2)) return null;
    if (qv(a1) > qv(a2)) { const t = a1; a1 = a2; a2 = t; }
    if (qv(a2) - qv(a1) < 2) return null;
    const tot = add(mul(I(n1), a1), mul(I(n2), a2)), T = dv(tot, I(n1 + n2)), mid = dv(add(a1, a2), I(2)), tw = mul(mid, I(n1 + n2));
    if (![T, tot, mid, tw].every(x => nice(x, fl)) || (fl === "int" && T.d !== 1)) return null;
    return { n1, n2, a1, a2, tot, T, mid, tw };
  }
  /* 「幾年後爸爸是兒子的 k 倍」：c0 = 那時兒子年齡，t 年後，C 兒子今年，B 爸爸今年 */
  function ageSet(kit, fl, k) {
    const c0 = ageQ(kit, fl, 10, 26), t = ageQ(kit, fl, 1, 12), C = sub(c0, t); if (!(C.n > 0) || qv(C) < 4) return null;
    const B = add(C, mul(I(k - 1), c0)); if (qv(B) < 28 || qv(B) > 50) return null;
    if (![c0, t, C, B].every(x => nice(x, fl))) return null;
    return { c0, t, C, B };
  }
  /* 追趕：哥哥每分鐘 b 公尺先走 s 分鐘，弟弟每分鐘 a 公尺追，t 分鐘追上 */
  function chaseQ(kit, fl) {
    const b = rq(kit, fl, 50, 100), k = rq(kit, fl, 10, 40), s = rq(kit, fl, 3, 12), a = add(b, k), D = mul(b, s), t = dv(D, k);
    if (![b, k, s, a, D, t].every(x => nice(x, fl))) return null;
    return { a, b, k, s, D, t };
  }
  /* 組合：甲單價 p1、乙單價 p2，共 n 個，乙 y 個 */
  function comboQ(kit, fl) {
    const p1 = fl === "int" ? I(kit.pick([5, 8, 10, 12, 15])) : fl === "dec" ? Qn(kit.pick([25, 45, 75, 125]), 10) : Qn(kit.pick([5, 7, 9, 11, 13]), 2);
    const gap = fl === "int" ? I(kit.pick([10, 20, 30, 40])) : fl === "dec" ? Qn(kit.pick([25, 75, 125, 150]), 10) : Qn(kit.pick([5, 15, 25, 7]), 2);
    const x = kit.int(6, 14), y = kit.int(2, 8); if (x === y) return null;
    const n = x + y, p2 = add(p1, gap), T = add(mul(p1, I(n)), mul(gap, I(y)));
    if (![p1, gap, p2, T].every(v => nice(v, fl))) return null;
    return { p1, p2, gap, x, y, n, T };
  }

  reg("solve-lower", "single", [
    sp("solve-lower-single-L1-01", "single", 1, "basic", kit => retry(kit, fl => {
      const c = ageQ(kit, fl, 6, 12), g = ageQ(kit, fl, 24, 32), t = ageQ(kit, fl, 2, 9), a = add(add(c, g), t); if (!nice(a, fl)) return null;
      const f = x => sh(x, fl), now = add(c, g);
      const o = qopts(kit, a, [now, add(c, t), add(g, t), add(now, mul(I(2), t)), sub(now, t), add(a, I(5))], fl, " 歲");
      return { explain2: `解法二（兩人一起長歲數）：爸爸比兒子大 ${fz(g)} 歲，這個差一直不變。${fz(t)} 年後兒子是 ${fz(add(c, t))} 歲，爸爸永遠比他多 ${fz(g)} 歲，所以爸爸是 ${f(a)} 歲。`,
        stem: `兒子今年 ${f(c)} 歲，爸爸比兒子大 ${f(g)} 歲。${f(t)} 年後爸爸幾歲？`, options: o.options, answer: 0,
        explain: `解析：爸爸今年 ${f(c)}＋${f(g)}＝${f(now)} 歲，${f(t)} 年後 ${f(now)}＋${f(t)}＝${f(a)} 歲。` };
    })),
    sp("solve-lower-single-L2-01", "single", 2, "basic", kit => retry(kit, fl => {
      const n = kit.pick([3, 4, 5]), a = rq(kit, fl, 70, 88), d = kq(kit, fl), sgn = kit.int(0, 1) ? 1 : -1, dd = sgn > 0 ? d : sub(I(0), d);
      const x = add(a, mul(I(n + 1), dd)), r = add(a, dd); if (!(qv(x) >= 40 && qv(x) <= 100) || !nice(x, fl) || !nice(r, fl)) return null;
      const f = y => sh(y, fl);
      const o = qopts(kit, r, [dv(add(a, x), I(2)), x, a, add(a, x), add(a, mul(I(2), dd)), sub(a, dd)], fl, " 分");
      return { explain2: `解法二（用差來調整）：第 ${n + 1} 科的 ${fz(x)} 分和原來的平均 ${fz(a)} 分相差 ${fz(mul(I(n + 1), d))} 分，這個差分給 ${n + 1} 科，每科的平均就${sgn > 0 ? "多" : "少"} ${fz(d)} 分，所以新平均是 ${fz(a)} ${sgn > 0 ? "＋" : "－"} ${fz(d)} ＝ ${f(r)} 分。`,
        stem: `小翊前 ${n} 科的平均是 ${f(a)} 分，第 ${n + 1} 科考了 ${f(x)} 分，這 ${n + 1} 科的平均是多少分？`, options: o.options, answer: 0,
        explain: `解析：前 ${n} 科總分＝${f(a)}×${n}＝${f(mul(a, I(n)))}，加第 ${n + 1} 科後總分＝${f(mul(a, I(n)))}＋${f(x)}＝${f(add(mul(a, I(n)), x))}，平均＝${f(add(mul(a, I(n)), x))}÷${n + 1}＝${f(r)}（分）。` };
    })),
    sp("solve-lower-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const b = ageQ(kit, fl, 8, 14), a = add(b, ageQ(kit, fl, 24, 32)), t = ageQ(kit, fl, 3, 12), diff = sub(a, b); if (!nice(diff, fl) || !nice(a, fl)) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, diff, [add(diff, t), add(diff, mul(I(2), t)), sub(diff, t), add(a, t), add(b, t), mul(diff, I(2))], fl, " 歲");
      return { explain2: `解法二（舉例）：${fz(t)} 年後爸爸 ${fz(add(a, t))} 歲、兒子 ${fz(add(b, t))} 歲，相差 ${fz(add(a, t))} − ${fz(add(b, t))} ＝ ${fz(diff)} 歲，和現在一樣。所以年齡差是 ${f(diff)} 歲。`,
        stem: `爸爸今年 ${f(a)} 歲，兒子今年 ${f(b)} 歲。${f(t)} 年後，爸爸和兒子的年齡差是多少歲？`, options: o.options, answer: 0,
        explain: `解析：每過一年，兩人都長 1 歲，年齡差永遠不變：${f(a)}−${f(b)}＝${f(diff)}（歲）。${f(t)} 年後爸爸 ${f(add(a, t))} 歲、兒子 ${f(add(b, t))} 歲，差還是 ${f(diff)}。`,
        trapNote: `年齡差是不會改變的！常見錯誤是以為爸爸多長 ${f(t)} 歲所以差變大（${f(add(diff, t))}），忘了兒子同樣也長了 ${f(t)} 歲。` };
    })),
    sp("solve-lower-single-L4-01", "single", 4, "trap", kit => retry(kit, fl => {
      const k = kit.pick([2, 3, 4]), s = ageSet(kit, fl, k); if (!s) return null;
      const f = x => sh(x, fl), diff = sub(s.B, s.C);
      const o = qopts(kit, s.t, [mul(I(k - 1), s.t), s.c0, diff, add(s.t, I(1)), add(s.t, I(2)), sub(s.B, mul(I(k), s.C))], fl, " 年");
      return { explain2: `解法二（代入檢查）：把選項的年數代進去，看爸爸是不是兒子的 ${k} 倍。代入 ${fz(s.t)}：爸爸 ${fz(s.B)} ＋ ${fz(s.t)} ＝ ${fz(add(s.B, s.t))} 歲，兒子 ${fz(s.C)} ＋ ${fz(s.t)} ＝ ${fz(add(s.C, s.t))} 歲，${fz(add(s.B, s.t))} ÷ ${fz(add(s.C, s.t))} ＝ ${k}，成立，所以是 ${f(s.t)} 年。`,
        stem: `今年爸爸 ${f(s.B)} 歲，兒子 ${f(s.C)} 歲。幾年後爸爸的年齡剛好是兒子的 ${k} 倍？`, options: o.options, answer: 0,
        explain: `解析：年齡差永遠是 ${f(s.B)}−${f(s.C)}＝${f(diff)} 歲。爸爸是兒子的 ${k} 倍時，差就是兒子年齡的 ${k - 1} 倍，所以兒子那時 ${f(diff)}÷${k - 1}＝${f(s.c0)} 歲。${f(s.c0)}−${f(s.C)}＝${f(s.t)}（年）。`,
        trapNote: `解題關鍵是「年齡差不變」。兒子那時的年齡要用差 ÷ (倍數−1) 求出（${f(diff)}÷${k - 1}＝${f(s.c0)} 歲），不是直接把 ${f(s.c0)} 當成答案，也不是 ${f(diff)} 或 (倍數−1)×某數；最後還要減去兒子現在的歲數才是「幾年後」。` };
    })),
    sp("solve-lower-single-L5-01", "single", 5, "extend", kit => retry(kit, fl => {
      const n = kit.pick([5, 6, 8, 10]), A = rq(kit, fl, 72, 90), d = kq(kit, fl), B = kit.int(0, 1) ? add(A, d) : sub(A, d);
      const x = sub(mul(I(n), A), mul(I(n - 1), B)); if (!(qv(x) >= 40 && qv(x) <= 100) || !nice(x, fl) || !nice(B, fl)) return null;
      const f = y => sh(y, fl);
      const o = qopts(kit, x, [A, B, d, mul(I(n), A), mul(I(n - 1), B), add(x, I(10)), sub(x, I(10))], fl, " 分");
      return { explain2: `解法二（用差來算）：剩下的 ${n - 1} 人平均${qv(B) > qv(A) ? "升高" : "降低"}了 ${fz(d)} 分，共${qv(B) > qv(A) ? "多" : "少"}了 ${fz(mul(I(n - 1), d))} 分，這是因為轉學的同學${qv(B) > qv(A) ? "低於" : "高於"}原平均 ${fz(A)} 分 ${fz(mul(I(n - 1), d))} 分，所以他考 ${fz(A)} ${qv(B) > qv(A) ? "−" : "＋"} ${fz(mul(I(n - 1), d))} ＝ ${f(x)} 分。`,
        stem: `某小組 ${n} 人的數學平均是 ${f(A)} 分。其中一位同學轉學後，剩下 ${n - 1} 人的平均變成 ${f(B)} 分。轉學的同學原本考了幾分？`, options: o.options, answer: 0,
        explain: `解析：原總分＝${f(A)}×${n}＝${f(mul(A, I(n)))}；剩下 ${n - 1} 人總分＝${f(B)}×${n - 1}＝${f(mul(B, I(n - 1)))}；轉學同學＝${f(mul(A, I(n)))}−${f(mul(B, I(n - 1)))}＝${f(x)}（分）。` };
    }))
  ]);

  reg("solve-lower", "multi", [
    sp("solve-lower-multi-L2-01", "multi", 2, "basic", kit => retry(kit, fl => {
      const b = ageQ(kit, fl, 8, 14), a = add(b, ageQ(kit, fl, 24, 32)), t = ageQ(kit, fl, 2, 6);
      const vals = [add(a, t), sub(b, t), add(sub(a, b), t), add(b, mul(I(2), t)), sub(a, t), sub(a, b)];
      if (!vals.every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl), d = sub(a, b);
      return multiQ(kit, "年齡差永遠不變，每過一年兩個人都長 1 歲；往後推要用加，往前推要用減。遇到「年後」就把歲數加上去，遇到「年前」就把歲數減掉，兩個人加減的數量一樣多，所以兩個人的年齡差不會因為時間而改變。", `爸爸今年 ${f(a)} 歲，兒子今年 ${f(b)} 歲。`, [
        [`${f(t)} 年後，爸爸 ${f(add(a, t))} 歲`, `${f(a)}＋${f(t)}＝${f(add(a, t))}。`, `爸爸現在 ${fz(a)} 歲，過 ${fz(t)} 年多 ${fz(t)} 歲，是 ${fz(add(a, t))} 歲`],
        [`${f(t)} 年後，兩人的年齡差仍是 ${f(d)} 歲`, "兩人同時變老，差不變。", `${fz(t)} 年後爸爸 ${fz(add(a, t))}、兒子 ${fz(add(b, t))}，相減還是 ${fz(d)}`],
        [`${f(t)} 年前，兒子 ${f(sub(b, t))} 歲`, `${f(b)}−${f(t)}＝${f(sub(b, t))}。`, `兒子現在 ${fz(b)} 歲，往回數 ${fz(t)} 年是 ${fz(sub(b, t))} 歲`],
        [`兩人的年齡差永遠是 ${f(d)} 歲`, "年齡差不會隨時間改變。", `每個人每年都長 1 歲，差永遠是 ${fz(a)} 減 ${fz(b)} 得 ${fz(d)}`]
      ], [
        [`${f(t)} 年後，兩人的年齡差是 ${f(add(d, t))} 歲`, `差不變，仍是 ${f(d)} 歲。`, `兒子也長了 ${fz(t)} 歲，差仍是 ${fz(d)}，不會變成 ${fz(add(d, t))}`],
        [`${f(t)} 年後，兒子 ${f(add(b, mul(I(2), t)))} 歲`, `兒子只長 ${f(t)} 歲，是 ${f(add(b, t))} 歲。`, `兒子只長 ${fz(t)} 歲，是 ${fz(add(b, t))} 歲，不是 ${fz(add(b, mul(I(2), t)))}`],
        [`${f(t)} 年前，爸爸 ${f(add(a, t))} 歲`, `${f(t)} 年前應是 ${f(a)}−${f(t)}＝${f(sub(a, t))} 歲。`, `往前是減：${fz(a)} 減 ${fz(t)} 得 ${fz(sub(a, t))}，不是加`],
        ["年齡差每過一年就增加 1 歲", "兩人一樣每年長 1 歲，差不變。", `兩人一樣每年長 1 歲，差不變`]
      ]);
    })),
    sp("solve-lower-multi-L3-01", "multi", 3, "trap", kit => retry(kit, fl => {
      const k = kit.pick([2, 3, 4]), C = ageQ(kit, fl, 6, 12), B = mul(I(k), C), t = ageQ(kit, fl, 2, 5), d = sub(B, C);
      if (qv(t) >= qv(C) || ![B, d, add(B, t), add(C, t), add(d, t), mul(I(k), add(C, t))].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      const r = multiQ(kit, "年齡的差不會改變，但倍數會隨年份改變（年紀越大，倍數越小），不能把今年的倍數關係直接套用到別的年份。", `爸爸今年 ${f(B)} 歲，兒子今年 ${f(C)} 歲（爸爸正好是兒子的 ${k} 倍）。`, [
        [`${f(t)} 年後，爸爸 ${f(add(B, t))} 歲、兒子 ${f(add(C, t))} 歲`, "兩人各加 " + f(t) + " 歲。", `各加 ${fz(t)} 歲，爸爸 ${fz(add(B, t))}、兒子 ${fz(add(C, t))}`],
        [`兩人的年齡差 ${f(d)} 歲不會隨年份改變`, "差永遠不變。", `例：${fz(t)} 年後 ${fz(add(B, t))} 減 ${fz(add(C, t))} 仍是 ${fz(d)}`],
        [`${f(t)} 年前，兩人的年齡差也是 ${f(d)} 歲`, "不論過去或未來，差都不變。", `例：${fz(t)} 年前 ${fz(sub(B, t))} 減 ${fz(sub(C, t))} 還是 ${fz(d)}`]
      ], [
        [`${f(t)} 年後，爸爸仍然是兒子的 ${k} 倍`, `${f(add(B, t))}÷${f(add(C, t))} 不等於 ${k}，倍數會隨年份改變。`, `${fz(add(B, t))} 除以 ${fz(add(C, t))} 得 ${fz(dv(add(B, t), add(C, t)))}，不是 ${k}`],
        [`${f(t)} 年後，兩人的年齡差是 ${f(add(d, t))} 歲`, `差不變，仍是 ${f(d)} 歲。`, `兩個人都長了 ${fz(t)} 歲，差仍是 ${fz(d)}，不是 ${fz(add(d, t))}`],
        [`倍數永遠不變，所以 ${f(t)} 年後爸爸是 ${f(mul(I(k), add(C, t)))} 歲`, `倍數會變。爸爸 ${f(t)} 年後是 ${f(add(B, t))} 歲。`, `爸爸其實是 ${fz(add(B, t))} 歲，不是 ${fz(mul(I(k), add(C, t)))}`]
      ]);
      r.trapNote = "年齡的「差」永遠不變，但「倍數」會隨時間改變（年紀越大，倍數越小）。不能把今年的倍數關係套到別的年份。";
      return r;
    })),
    sp("solve-lower-multi-L3-02", "multi", 3, "trap", kit => retry(kit, fl => {
      const g = grpQ(kit, fl); if (!g) return null;
      const f = x => sh(x, fl), s12 = add(g.a1, g.a2); if (!nice(s12, fl)) return null;
      const r = multiQ(kit, "兩組合起來的平均，要先算出兩組的總分（人數×平均），再除以總人數；只有人數一樣多時，才能把兩個平均直接取中間。合併後的平均一定落在最低的平均與最高的平均之間，並且比較靠近人數多的那一組，所以不能憑感覺猜平均，一定要算出總分來檢查；如果兩組人數不一樣，人數多的那一組對平均的影響比較大，所以人數不同的兩組不能直接把兩個平均加起來除以 2。", `男生 ${g.n1} 人，平均 ${f(g.a1)} 分；女生 ${g.n2} 人，平均 ${f(g.a2)} 分。`, [
        [`全班總分是 ${f(g.tot)} 分`, `${g.n1}×${f(g.a1)}＋${g.n2}×${f(g.a2)}＝${f(g.tot)}。`, `男生 ${g.n1} 乘 ${fz(g.a1)}，加女生 ${g.n2} 乘 ${fz(g.a2)}，共 ${fz(g.tot)}`],
        [`全班平均是 ${f(g.T)} 分`, `${f(g.tot)}÷${g.n1 + g.n2}＝${f(g.T)}。`, `總分 ${fz(g.tot)} 平分給 ${g.n1 + g.n2} 人，每人 ${fz(g.T)}`],
        [`全班平均一定介於 ${f(g.a1)} 與 ${f(g.a2)} 之間`, "合併平均介於兩組平均之間。", `平均不會比最低的 ${fz(g.a1)} 低，也不會比最高的 ${fz(g.a2)} 高`],
        ["只有兩組人數相同時，全班平均才剛好是兩個平均的中間值", "人數不同時，人數多的一組比重較大。", `例：兩組各 10 人、平均 60 與 80，合起來平均才是中間的 70`]
      ], [
        [`全班平均是 ${f(g.mid)} 分`, `人數不同，不能直接平均，應是 ${f(g.T)} 分。`, `男女人數 ${g.n1}、${g.n2} 不同，實際平均是 ${fz(g.T)}，不是中間的 ${fz(g.mid)}`],
        [`全班總分是 ${f(s12)} 分`, `總分要把「人數×平均」加起來，是 ${f(g.tot)} 分。`, `總分要乘人數，是 ${fz(g.tot)}，不是 ${fz(s12)}`],
        [`全班平均比 ${f(g.a2)} 分還高`, `全班平均不會超過最高的那組平均 ${f(g.a2)} 分。`, `最高的一組平均是 ${fz(g.a2)}，全班平均不可能超過它`],
        [`全班總分是 ${f(g.tw)} 分`, `這是假設平均為中間值的算法，正確總分是 ${f(g.tot)} 分。`, `${fz(g.tw)} 是假設平均在中間算的，實際總分是 ${fz(g.tot)}`]
      ]);
      r.trapNote = "兩組的平均不能直接再平均；要先各自「平均×人數」算出總分，再除以總人數。";
      return r;
    })),
    sp("solve-lower-multi-L4-01", "multi", 4, "basic", kit => retry(kit, fl => {
      const n = kit.pick([4, 5, 6, 8]), A = rq(kit, fl, 70, 88), d = kq(kit, fl), x = add(A, mul(I(n + 1), d)), nw = add(A, d);
      if (qv(x) > 100 || ![x, nw, mul(A, I(n)), add(mul(A, I(n)), x), dv(add(A, x), I(2)), mul(A, I(n + 1))].every(y => nice(y, fl))) return null;
      const f = y => sh(y, fl);
      return multiQ(kit, "加入一個人以後，新總分＝原來的總分＋新加入的分數，新平均＝新總分÷新的人數；新加入的分數比平均高，平均就會變大。", `某組 ${n} 人的平均是 ${f(A)} 分，現在新加入一位同學，成績是 ${f(x)} 分。`, [
        [`原本 ${n} 人的總分是 ${f(mul(A, I(n)))} 分`, `${f(A)}×${n}＝${f(mul(A, I(n)))}。`, `${fz(A)} 乘 ${n} 得 ${fz(mul(A, I(n)))}`],
        [`加入後總分是 ${f(add(mul(A, I(n)), x))} 分`, `${f(mul(A, I(n)))}＋${f(x)}＝${f(add(mul(A, I(n)), x))}。`, `${fz(mul(A, I(n)))} 加 ${fz(x)} 得 ${fz(add(mul(A, I(n)), x))}`],
        [`加入後 ${n + 1} 人的平均是 ${f(nw)} 分`, `${f(add(mul(A, I(n)), x))}÷${n + 1}＝${f(nw)}。`, `新總分 ${fz(add(mul(A, I(n)), x))} 平分給 ${n + 1} 人，每人 ${fz(nw)}`],
        [`加入後平均比原來高 ${f(d)} 分`, `${f(nw)}−${f(A)}＝${f(d)}。`, `新平均 ${fz(nw)} 比原來的 ${fz(A)} 多 ${fz(d)}`]
      ], [
        [`加入後的平均是 ${f(dv(add(A, x), I(2)))} 分`, `不能把兩個數直接平均，要用總分÷${n + 1}＝${f(nw)} 分。`, `${fz(x)} 比平均高很多，平均不是兩數的中點 ${fz(dv(add(A, x), I(2)))}`],
        [`加入後的平均仍是 ${f(A)} 分`, `新加入的分數 ${f(x)} 比平均高，平均會變大。`, `新加入的 ${fz(x)} 比 ${fz(A)} 高，平均一定變大`],
        [`加入後的總分是 ${f(mul(A, I(n + 1)))} 分`, `新總分是 ${f(mul(A, I(n)))}＋${f(x)}＝${f(add(mul(A, I(n)), x))}，不是 ${n + 1}×${f(A)}。`, `新總分要加 ${fz(x)}，不是再加一個 ${fz(A)}，所以不是 ${fz(mul(A, I(n + 1)))}`],
        [`加入後的平均是 ${f(x)} 分`, `平均不會變成新加入同學的分數。`, `${fz(x)} 只是一個人的分數，不是全部人的平均`]
      ]);
    })),
    sp("solve-lower-multi-L5-01", "multi", 5, "extend", kit => retry(kit, fl => {
      const c = chaseQ(kit, fl); if (!c) return null;
      const f = x => sh(x, fl), at = mul(c.a, c.t), ap = add(c.a, c.b), ts = add(c.t, c.s), bt = mul(c.b, c.t), as = mul(c.a, c.s);
      if (![at, ap, ts, bt, as, c.D, c.t].every(x => nice(x, fl) && (isF(fl) || Math.abs(qv(x) * 100 - Math.round(qv(x) * 100)) < 1e-9)) || qv(at) === qv(bt)) return null;
      return multiQ(kit, "追趕問題：弟弟每分鐘追近的距離是兩人速率的差；追上的時間＝先走的距離÷每分鐘追近的距離；追上時兩人離家一樣遠，用弟弟的速率×追的時間來算，也可以用哥哥的速率×（先走的時間＋追的時間）來檢查，兩種算法的答案應該一樣。追趕不是相遇，兩個人往同一個方向走，所以速率要相減，不是相加。", `哥哥從家出發，每分鐘走 ${f(c.b)} 公尺。哥哥走了 ${f(c.s)} 分鐘後，弟弟從家出發，每分鐘騎 ${f(c.a)} 公尺去追哥哥。`, [
        [`弟弟出發時，哥哥已走了 ${f(c.D)} 公尺`, `${f(c.b)}×${f(c.s)}＝${f(c.D)}。`, `哥哥每分鐘 ${fz(c.b)} 公尺，走 ${fz(c.s)} 分鐘是 ${fz(c.D)} 公尺`],
        [`弟弟每分鐘追近哥哥 ${f(c.k)} 公尺`, `同向追趕用速率差 ${f(c.a)}−${f(c.b)}。`, `弟弟 ${fz(c.a)} 公尺減哥哥 ${fz(c.b)} 公尺，每分鐘追近 ${fz(c.k)}`],
        [`弟弟出發後 ${f(c.t)} 分鐘追上哥哥`, `${f(c.D)}÷${f(c.k)}＝${f(c.t)}。`, `先走的 ${fz(c.D)} 公尺，每分鐘追近 ${fz(c.k)}，要 ${fz(c.t)} 分鐘`],
        [`追上時，兩人離家 ${f(at)} 公尺`, `弟弟騎了 ${f(c.a)}×${f(c.t)}＝${f(at)} 公尺。`, `弟弟追上時騎了 ${fz(c.a)} 乘 ${fz(c.t)} 得 ${fz(at)} 公尺`]
      ], [
        [`弟弟每分鐘追近哥哥 ${f(ap)} 公尺`, "同向追趕要相減，不是相加。", `兩人同方向走，追近的是速度的差；加起來的 ${fz(ap)} 沒有意義`],
        [`弟弟出發後 ${f(ts)} 分鐘追上哥哥`, `追上要 ${f(c.t)} 分鐘；${f(ts)} 把哥哥先走的時間又加了一次。`, `${fz(c.s)} 是先走的時間，不要再加到追的時間，追的時間是 ${fz(c.t)}`],
        [`追上時，兩人離家 ${f(bt)} 公尺`, `哥哥一共走了 ${f(ts)} 分鐘，離家 ${f(at)} 公尺。`, `${fz(bt)} 沒有算哥哥先走的 ${fz(c.s)} 分鐘，離家是 ${fz(at)}`],
        [`弟弟出發時，哥哥已走了 ${f(as)} 公尺`, `哥哥的速率是 ${f(c.b)}，先走了 ${f(c.D)} 公尺。`, `先走的路要用哥哥的速率算，不能用弟弟的速率`]
      ]);
    }))
  ]);

  reg("solve-lower", "tf", [
    sp("solve-lower-tf-L1-01", "tf", 1, "basic", kit => retry(kit, fl => {
      const c = ageQ(kit, fl, 6, 12), m = ageQ(kit, fl, 34, 42), t = ageQ(kit, fl, 2, 9), good = add(m, t), bad = add(m, mul(I(2), t)); if (!nice(good, fl) || !nice(bad, fl)) return null;
      const f = x => sh(x, fl), head = `小華今年 ${f(c)} 歲，媽媽今年 ${f(m)} 歲，${f(t)} 年後媽媽`;
      return tfQ(kit, ok => `解法二（用年齡差）：媽媽比小華大 ${fz(sub(m, c))} 歲，這個差不會變。${fz(t)} 年後小華 ${fz(add(c, t))} 歲，媽媽就是 ${fz(add(c, t))} ＋ ${fz(sub(m, c))} ＝ ${fz(good)} 歲。敘述寫 ${fz(ok ? good : bad)} 歲，${ok ? "相同" : "不同"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${f(good)} 歲。`, `正確：媽媽每年長 1 歲，${f(t)} 年後是 ${f(m)}＋${f(t)}＝${f(good)}（歲），和敘述寫的一樣。`],
        [`${head} ${f(bad)} 歲。`, `錯誤：媽媽每年長 1 歲，${f(t)} 年後是 ${f(m)}＋${f(t)}＝${f(good)} 歲。`]);
    })),
    sp("solve-lower-tf-L2-01", "tf", 2, "basic", kit => retry(kit, fl => {
      const A = rq(kit, fl, 70, 90), tot = mul(A, I(5)), bad = kit.pick([add(A, I(5)), mul(A, I(4)), mul(A, I(6))]); if (!nice(tot, fl) || !nice(bad, fl)) return null;
      const f = x => sh(x, fl), head = `五次考試的平均是 ${f(A)} 分，所以五次的總分是`;
      return tfQ(kit, ok => `解法二（倒回去算）：如果總分是 ${fz(ok ? tot : bad)} 分，除以 5 次得 ${fz(dv(ok ? tot : bad, I(5)))} 分，${ok ? "剛好是" : "不是"}平均 ${fz(A)} 分，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${f(tot)} 分。`, `正確：總分＝平均×次數＝${f(A)}×5＝${f(tot)}。`],
        [`${head} ${f(bad)} 分。`, `錯誤：總分＝平均×次數＝${f(A)}×5＝${f(tot)}。`]);
    })),
    sp("solve-lower-tf-L3-01", "tf", 3, "trap", kit => retry(kit, fl => {
      const k = kit.pick([2, 3, 4]), b = ageQ(kit, fl, 6, 12), a = mul(I(k), b), t = ageQ(kit, fl, 2, 6), d = sub(a, b); if (![a, d, add(a, t), add(b, t)].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      const r = tfQ(kit, ok => (ok ? `解法二（舉例）：${fz(t)} 年後爸爸 ${fz(add(a, t))} 歲、兒子 ${fz(add(b, t))} 歲，相差 ${fz(sub(add(a, t), add(b, t)))} 歲，和現在的 ${fz(d)} 歲一樣，所以這句話正確。` : `解法二（舉例）：${fz(t)} 年後爸爸 ${fz(add(a, t))} 歲、兒子 ${fz(add(b, t))} 歲，${fz(add(a, t))} ÷ ${fz(add(b, t))} ＝ ${fz(dv(add(a, t), add(b, t)))}，不是 ${k} 倍，所以這句話錯誤。`),
        [`爸爸今年 ${f(a)} 歲，兒子今年 ${f(b)} 歲，${f(t)} 年後兩人的年齡差仍是 ${f(d)} 歲。`, `正確：年齡差永遠不變，${f(a)}−${f(b)}＝${f(d)}。`],
        [`爸爸今年 ${f(a)} 歲，兒子今年 ${f(b)} 歲（${k} 倍），${f(t)} 年後爸爸仍是兒子的 ${k} 倍。`, `錯誤：${f(t)} 年後爸爸 ${f(add(a, t))} 歲、兒子 ${f(add(b, t))} 歲，倍數已經不是 ${k} 倍。年齡「差」不變，但「倍數」會變。`]);
      r.trapNote = "年齡差不變、倍數會變。不要把今年的倍數關係套用到未來或過去。";
      return r;
    })),
    sp("solve-lower-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const n = kit.pick([4, 5, 6, 8]), A = rq(kit, fl, 70, 88), d = kq(kit, fl), x = add(A, mul(I(n + 1), d)), nw = add(A, d), mid = dv(add(A, x), I(2));
      if (qv(x) > 100 || ![x, nw, mid].every(y => nice(y, fl))) return null;
      const f = y => sh(y, fl), head = `某班 ${n} 人的平均是 ${f(A)} 分，新來一位同學考了 ${f(x)} 分，全班 ${n + 1} 人的新平均是`;
      const r = tfQ(kit, ok => `解法二（用差來調整）：新來的 ${fz(x)} 分比原來的平均 ${fz(A)} 分高出 ${fz(sub(x, A))} 分，這個多出的分數平分給 ${n + 1} 人，每人的平均多 ${fz(dv(sub(x, A), I(n + 1)))} 分，所以新平均是 ${fz(nw)} 分。敘述寫的是 ${fz(ok ? nw : mid)} 分，${ok ? "一樣" : "不一樣"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${f(nw)} 分。`, `正確：(${f(A)}×${n}＋${f(x)})÷${n + 1}＝${f(add(mul(A, I(n)), x))}÷${n + 1}＝${f(nw)}。`],
        [`${head} ${f(mid)} 分。`, `錯誤：不能把 ${f(A)} 與 ${f(x)} 直接平均。新平均＝(${f(A)}×${n}＋${f(x)})÷${n + 1}＝${f(nw)} 分。`]);
      r.trapNote = "原本的平均代表 " + n + " 個人，新的分數只有 1 個人，兩者的「份量」不同，不能直接取中間值。";
      return r;
    })),
    sp("solve-lower-tf-L5-01", "tf", 5, "extend", kit => retry(kit, fl => {
      const c = comboQ(kit, fl); if (!c) return null;
      const bad = kit.pick([c.x, c.y + 1, c.y - 1].filter(v => v > 0 && v !== c.y)), f = v => sh(v, fl);
      const head = `文具店的橡皮擦每個 ${f(c.p1)} 元，鉛筆每個 ${f(c.p2)} 元。小傑共買了 ${c.n} 個，付了 ${f(c.T)} 元，其中鉛筆買了`;
      return tfQ(kit, ok => `解法二（代入檢查）：如果鉛筆買了 ${ok ? c.y : bad} 個，橡皮擦就有 ${c.n} − ${ok ? c.y : bad} ＝ ${c.n - (ok ? c.y : bad)} 個，要付 ${f(c.p1)} × ${c.n - (ok ? c.y : bad)} ＋ ${f(c.p2)} × ${ok ? c.y : bad} ＝ ${f(add(mul(c.p1, I(c.n - (ok ? c.y : bad))), mul(c.p2, I(ok ? c.y : bad))))} 元，${ok ? "剛好等於" : "不等於"}題目的 ${f(c.T)} 元，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${c.y} 個。`, `正確：假設全買橡皮擦，共 ${f(mul(c.p1, I(c.n)))} 元，差 ${f(sub(c.T, mul(c.p1, I(c.n))))} 元；每換 1 個成鉛筆多 ${f(c.gap)} 元，${f(sub(c.T, mul(c.p1, I(c.n))))}÷${f(c.gap)}＝${c.y} 個。`],
        [`${head} ${bad} 個。`, `錯誤：假設全買橡皮擦共 ${f(mul(c.p1, I(c.n)))} 元，差 ${f(sub(c.T, mul(c.p1, I(c.n))))} 元，每換 1 個多 ${f(c.gap)} 元，鉛筆有 ${c.y} 個，不是 ${bad} 個。`]);
    }))
  ]);

  reg("solve-lower", "fill", [
    sp("solve-lower-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const c = ageQ(kit, fl, 6, 12), m = ageQ(kit, fl, 34, 42), t = ageQ(kit, fl, 2, 9), r = add(m, t); if (!nice(r, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（先算小華）：媽媽比小華大 ${fz(sub(m, c))} 歲，這個差一直不變。${fz(t)} 年後小華是 ${fz(add(c, t))} 歲，媽媽永遠比他大 ${fz(sub(m, c))} 歲，所以媽媽是 ${fz(r)} 歲。`,
        stem: `小華今年 ${f(c)} 歲，媽媽今年 ${f(m)} 歲，${f(t)} 年後媽媽 ____ 歲。`, units: ["歲"],
        explain: `解析：每過一年就長 1 歲，所以 ${f(t)} 年後的歲數是 ${f(m)}＋${f(t)}＝${f(r)}（歲）。` }, ans(r, fl));
    })),
    sp("solve-lower-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const a = rq(kit, fl, 70, 90), r = mul(a, I(4)); if (!nice(r, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（先算兩次）：兩次共 ${fz(a)} 加 ${fz(a)} 等於 ${fz(mul(a, I(2)))}，另外兩次也是 ${fz(mul(a, I(2)))}，四次合起來 ${fz(mul(a, I(2)))} 加 ${fz(mul(a, I(2)))} 等於 ${fz(r)} 分。`,
        stem: `小美四次考試的平均是 ${f(a)} 分，她四次的總分是 ____ 分。`, units: ["分"],
        explain: `解析：總分＝平均×次數＝${f(a)}×4＝${f(r)}（分）。` }, ans(r, fl));
    })),
    sp("solve-lower-fill-L3-01", "fill", 3, "basic", kit => retry(kit, fl => {
      const C = ageQ(kit, fl, 6, 12), t = ageQ(kit, fl, 4, 20), B = add(mul(I(2), C), t); if (qv(B) < 30 || qv(B) > 45 || ![B, t, C].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl), d = sub(B, C);
      return Object.assign({ explain2: `解法二（列方程式）：設 □ 年後，爸爸 ${fz(B)} ＋ □ 歲，兒子 ${fz(C)} ＋ □ 歲，爸爸是兒子的 2 倍：${fz(B)} ＋ □ ＝ 2 × (${fz(C)} ＋ □) ＝ ${fz(mul(I(2), C))} ＋ 2 × □，所以 □ ＝ ${fz(B)} − ${fz(mul(I(2), C))} ＝ ${fz(t)}（年）。`,
        stem: `今年爸爸 ${f(B)} 歲，兒子 ${f(C)} 歲，____ 年後爸爸的年齡剛好是兒子的 2 倍。`, units: ["年"],
        explain: `解析：年齡差 ${f(B)}−${f(C)}＝${f(d)} 歲不變。爸爸是兒子 2 倍時，差就等於兒子的年齡，所以兒子那時 ${f(d)} 歲，${f(d)}−${f(C)}＝${f(t)}（年）。` }, ans(t, fl));
    })),
    sp("solve-lower-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const c = comboQ(kit, fl); if (!c) return null;
      const f = v => sh(v, fl), base = mul(c.p1, I(c.n)), diff = sub(c.T, base);
      return { explain2: `解法二（列方程式）：設鉛筆買了 □ 個，橡皮擦就是 ${c.n} − □ 個：${fz(c.p1)} × (${c.n} − □) ＋ ${fz(c.p2)} × □ ＝ ${fz(c.T)}，整理得 ${fz(c.gap)} × □ ＝ ${fz(c.T)} − ${fz(base)} ＝ ${fz(diff)}，□ ＝ ${c.y}。所以鉛筆買了 ${c.y} 個。`,
        stem: `文具店的橡皮擦每個 ${f(c.p1)} 元，鉛筆每個 ${f(c.p2)} 元。小傑共買了 ${c.n} 個，付了 ${f(c.T)} 元，其中鉛筆買了 ____ 個。`, answer: String(c.y), accepted: [], units: ["個", "枝", "支"],
        explain: `解析：假設 ${c.n} 個全是橡皮擦，共 ${f(base)} 元，比實際少 ${f(c.T)}−${f(base)}＝${f(diff)} 元；每把 1 個橡皮擦換成鉛筆多 ${f(c.gap)} 元，${f(diff)}÷${f(c.gap)}＝${c.y}（個）。`,
        trapNote: `不能用總金額 ${f(c.T)}÷${f(add(c.p1, c.p2))} 或把個數平分。兩種東西單價不同，要用「假設全是同一種，再看差多少」來調整。` };
    })),
    sp("solve-lower-fill-L5-01", "fill", 5, "extend", kit => retry(kit, fl => {
      const a = rq(kit, fl, 70, 85), d = kq(kit, fl), b = add(a, d), need = sub(mul(I(6), b), mul(I(5), a)); if (qv(need) > 100 || !nice(need, fl) || !nice(b, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（補平法）：六次的目標平均是 ${fz(b)} 分，前五次平均少了 ${fz(d)} 分，五次共少 ${fz(mul(I(5), d))} 分，要由第六次補回，再加上第六次自己的 ${fz(b)} 分，所以要考 ${fz(b)} ＋ ${fz(mul(I(5), d))} ＝ ${fz(need)} 分。`,
        stem: `小宇前五次數學測驗的平均是 ${f(a)} 分，第六次至少要考 ____ 分，才能使六次的平均剛好是 ${f(b)} 分。`, units: ["分"],
        explain: `解析：六次總分要 ${f(b)}×6＝${f(mul(b, I(6)))}，前五次總分 ${f(a)}×5＝${f(mul(a, I(5)))}，第六次＝${f(mul(b, I(6)))}−${f(mul(a, I(5)))}＝${f(need)}（分）。` }, ans(need, fl));
    }))
  ]);

  reg("solve-lower", "calc", [
    sp("solve-lower-calc-L1-01", "calc", 1, "basic", kit => retry(kit, fl => {
      const c = ageQ(kit, fl, 8, 14), m = add(c, ageQ(kit, fl, 24, 32)), t = ageQ(kit, fl, 2, 6), r = sub(m, c); if (!nice(r, fl) || !nice(m, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（舉例）：${fz(t)} 年前媽媽 ${fz(sub(m, t))} 歲、女兒 ${fz(sub(c, t))} 歲，相差 ${fz(sub(m, t))} − ${fz(sub(c, t))} ＝ ${fz(r)} 歲，和現在的差一樣。答案是 ${fz(r)} 歲。`,
        stem: `媽媽今年 ${f(m)} 歲，女兒今年 ${f(c)} 歲，${f(t)} 年前兩人的年齡差是幾歲？`, units: ["歲"],
        explain: `解析：年齡差永遠不變，${f(m)}−${f(c)}＝${f(r)}（歲）。` }, ans(r, fl));
    })),
    sp("solve-lower-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const a = [rq(kit, fl, 60, 100), rq(kit, fl, 60, 100), rq(kit, fl, 60, 100)], S = sumQ(a), A = dv(S, I(3)); if (!nice(A, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（從最小的數往上加）：最小的是 ${fz(a.reduce((x, y) => qv(y) < qv(x) ? y : x))}，其餘的數各比它多出一些，多出來的部分合計 ${fz(sub(S, mul(I(3), a.reduce((x, y) => qv(y) < qv(x) ? y : x))))}。把這些多出來的平分給 3 個，每個多 ${fz(dv(sub(S, mul(I(3), a.reduce((x, y) => qv(y) < qv(x) ? y : x))), I(3)))}，所以平均是最小的數加上這一份，答案是 ${fz(A)}。`,
        stem: `小傑三次的測驗成績分別是 ${a.map(f).join("、")} 分，他的平均成績是多少分？`, units: ["分"],
        explain: `解析：(${a.map(f).join("＋")})÷3＝${f(S)}÷3＝${f(A)}（分）。` }, ans(A, fl));
    })),
    sp("solve-lower-calc-L3-01", "calc", 3, "basic", kit => retry(kit, fl => {
      const c = chaseQ(kit, fl); if (!c) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（列方程式）：設弟弟 □ 分鐘追上。弟弟走 ${fz(c.a)} 乘 □ 公尺，哥哥共走 ${fz(c.b)} 乘 (${fz(c.s)} 加 □) 公尺，兩個一樣長。拆開後，(${fz(c.a)} 減 ${fz(c.b)}) 乘 □ 等於 ${fz(c.b)} 乘 ${fz(c.s)}，也就是 ${fz(c.k)} 乘 □ 等於 ${fz(c.D)}，所以 □ 等於 ${fz(c.D)} 除以 ${fz(c.k)}，得 ${fz(c.t)} 分鐘。`,
        stem: `哥哥先走了 ${f(c.s)} 分鐘，每分鐘走 ${f(c.b)} 公尺；弟弟接著出發，每分鐘走 ${f(c.a)} 公尺，沿同一條路追哥哥。弟弟出發後幾分鐘追上哥哥？`, units: ["分鐘", "分"],
        explain: `解析：哥哥先走 ${f(c.b)}×${f(c.s)}＝${f(c.D)} 公尺，每分鐘追近 ${f(c.a)}−${f(c.b)}＝${f(c.k)} 公尺，${f(c.D)}÷${f(c.k)}＝${f(c.t)}（分鐘）。` }, ans(c.t, fl));
    })),
    sp("solve-lower-calc-L4-01", "calc", 4, "trap", kit => retry(kit, fl => {
      const s = ageSet(kit, fl, 3); if (!s) return null;
      const f = x => sh(x, fl), d = sub(s.B, s.C);
      return Object.assign({ explain2: `解法二（列方程式）：設 □ 年後，${fz(s.B)} ＋ □ ＝ 3 × (${fz(s.C)} ＋ □) ＝ ${fz(mul(I(3), s.C))} ＋ 3 × □，移項得 ${fz(s.B)} − ${fz(mul(I(3), s.C))} ＝ 2 × □，所以 □ ＝ ${fz(sub(s.B, mul(I(3), s.C)))} ÷ 2 ＝ ${fz(s.t)}（年）。`,
        stem: `今年爸爸 ${f(s.B)} 歲，兒子 ${f(s.C)} 歲，幾年後爸爸的年齡剛好是兒子的 3 倍？`, units: ["年"],
        explain: `解析：年齡差 ${f(s.B)}−${f(s.C)}＝${f(d)} 歲不變。爸爸是兒子 3 倍時，差＝兒子年齡的 2 倍，兒子那時 ${f(d)}÷2＝${f(s.c0)} 歲，${f(s.c0)}−${f(s.C)}＝${f(s.t)}（年）。`,
        trapNote: `有人直接用 ${f(s.B)}÷3 或 ${f(d)}÷3 算兒子年齡。3 倍時，差是兒子的「3−1＝2 倍」，要除以 2，不是除以 3。` }, ans(s.t, fl));
    })),
    sp("solve-lower-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const b = rq(kit, fl, 100, 160), diff = rq(kit, fl, 20, 50), a = add(b, diff), t = kit.pick([Qn(5, 1), Qn(8, 1), Qn(10, 1), Qn(25, 2), Qn(15, 2), Qn(12, 1)]);
      const Ln = mul(diff, t); if (![a, Ln, b].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（看差距累積）：每過 1 分鐘，甲就比乙多跑 ${fz(diff)} 公尺，差距一點一點累積。要累積到剛好一圈 ${fz(Ln)} 公尺，需要累積 ${fz(t)} 次，所以是 ${fz(t)} 分鐘。`,
        stem: `操場跑道一圈 ${f(Ln)} 公尺。甲、乙兩人從同一地點同時、同方向出發，甲每分鐘跑 ${f(a)} 公尺，乙每分鐘跑 ${f(b)} 公尺。甲第一次追上乙（多跑一圈）需要幾分鐘？`, units: ["分鐘", "分"],
        explain: `解析：甲每分鐘比乙多跑 ${f(a)}−${f(b)}＝${f(diff)} 公尺，要多跑一圈 ${f(Ln)} 公尺，時間＝${f(Ln)}÷${f(diff)}＝${f(t)}（分鐘）。` }, ans(t, fl));
    }))
  ]);

  reg("solve-lower", "word", [
    sp("solve-lower-word-L2-01", "word", 2, "basic", kit => retry(kit, fl => {
      const a = [rq(kit, fl, 65, 98), rq(kit, fl, 65, 98), rq(kit, fl, 65, 98), rq(kit, fl, 65, 98)], S = sumQ(a), A = dv(S, I(4)); if (!nice(A, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（從最小的數往上加）：最小的是 ${fz(a.reduce((x, y) => qv(y) < qv(x) ? y : x))}，其餘的數各比它多出一些，多出來的部分合計 ${fz(sub(S, mul(I(4), a.reduce((x, y) => qv(y) < qv(x) ? y : x))))}。把這些多出來的平分給 4 個，每個多 ${fz(dv(sub(S, mul(I(4), a.reduce((x, y) => qv(y) < qv(x) ? y : x))), I(4)))}，所以平均是最小的數加上這一份，答案是 ${fz(A)} 分。`,
        stem: `小凱前三次英語測驗分別考了 ${f(a[0])}、${f(a[1])}、${f(a[2])} 分，第四次考了 ${f(a[3])} 分。四次的平均是多少分？`, units: ["分"],
        explain: `解析：四次總分＝${a.map(f).join("＋")}＝${f(S)}，平均＝${f(S)}÷4＝${f(A)}（分）。` }, ans(A, fl));
    })),
    sp("solve-lower-word-L3-01", "word", 3, "trap", kit => retry(kit, fl => {
      const g = grpQ(kit, fl); if (!g) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（從較低的平均往上補）：女生平均比男生高 ${fz(sub(g.a2, g.a1))} 分，女生占全班的 ${ExamKit.qFrac(Qn(g.n2, g.n1 + g.n2))}，所以全班平均比男生的 ${fz(g.a1)} 分多 ${fz(sub(g.T, g.a1))} 分，${fz(g.a1)} ＋ ${fz(sub(g.T, g.a1))} ＝ ${fz(g.T)} 分。`,
        stem: `全班男生有 ${g.n1} 人，數學平均 ${f(g.a1)} 分；女生有 ${g.n2} 人，數學平均 ${f(g.a2)} 分。全班的數學平均是多少分？`, units: ["分"],
        explain: `解析：全班總分＝${g.n1}×${f(g.a1)}＋${g.n2}×${f(g.a2)}＝${f(g.tot)}，人數 ${g.n1 + g.n2}，平均＝${f(g.tot)}÷${g.n1 + g.n2}＝${f(g.T)}（分）。`,
        trapNote: `把男、女平均直接平均 (${f(g.a1)}＋${f(g.a2)})÷2＝${f(g.mid)} 是錯的，因為男女人數不同（${g.n1} 與 ${g.n2}）。要用總分除以總人數。` }, ans(g.T, fl));
    })),
    sp("solve-lower-word-L3-02", "word", 3, "basic", kit => retry(kit, fl => {
      const k = kit.pick([2, 3, 4]), c0 = ageQ(kit, fl, 5, 14), t = ageQ(kit, fl, 2, 8), M = add(mul(I(k), c0), t), C = add(c0, t);
      if (qv(M) < 30 || qv(M) > 50 || ![M, C, c0, t].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（列方程式）：設 □ 年前，媽媽 ${fz(M)} − □ 歲，女兒 ${fz(C)} − □ 歲，媽媽是女兒的 ${k} 倍：${fz(M)} − □ ＝ ${k} × (${fz(C)} − □)，整理得 ${k - 1} × □ ＝ ${k} × ${fz(C)} − ${fz(M)} ＝ ${fz(sub(mul(I(k), C), M))}，□ ＝ ${fz(t)}（年前）。`,
        stem: `今年媽媽 ${f(M)} 歲，女兒 ${f(C)} 歲。幾年前媽媽的年齡是女兒的 ${k} 倍？`, units: ["年", "年前"],
        explain: `解析：年齡差 ${f(M)}−${f(C)}＝${f(sub(M, C))} 歲不變。媽媽是女兒 ${k} 倍時，差＝女兒年齡的 ${k - 1} 倍，女兒那時 ${f(sub(M, C))}÷${k - 1}＝${f(c0)} 歲，${f(C)}−${f(c0)}＝${f(t)}（年前）。` }, ans(t, fl));
    })),
    sp("solve-lower-word-L4-01", "word", 4, "extend", kit => retry(kit, fl => {
      const c = chaseQ(kit, fl); if (!c) return null;
      const f = x => sh(x, fl), r = mul(c.a, c.t); if (!nice(r, fl)) return null;
      return Object.assign({ explain2: `解法二（用姊姊算）：妹妹追上時，姊姊一共走了 ${fz(c.s)} ＋ ${fz(c.t)} ＝ ${fz(add(c.s, c.t))} 分鐘，每分鐘 ${fz(c.b)} 公尺，離家 ${fz(c.b)} × ${fz(add(c.s, c.t))} ＝ ${fz(r)} 公尺。`,
        stem: `姊姊從家出發，每分鐘走 ${f(c.b)} 公尺。姊姊走了 ${f(c.s)} 分鐘後，妹妹騎腳踏車從家出發，每分鐘騎 ${f(c.a)} 公尺去追姊姊。妹妹追上姊姊時，兩人離家多少公尺？`, units: ["公尺"],
        explain: `解析：姊姊先走 ${f(c.b)}×${f(c.s)}＝${f(c.D)} 公尺，妹妹每分鐘追近 ${f(c.a)}−${f(c.b)}＝${f(c.k)} 公尺，追上要 ${f(c.D)}÷${f(c.k)}＝${f(c.t)} 分鐘；追上時離家 ${f(c.a)}×${f(c.t)}＝${f(r)}（公尺）。` }, ans(r, fl));
    })),
    sp("solve-lower-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const set = kit.pick([[4, 3, 2], [5, 3, 1], [5, 4, 3], [6, 5, 4]]), t = ageQ(kit, fl, 2, 10), c = mul(I(set[2]), t), F = mul(I(set[0]), c);
      if (qv(F) < 28 || qv(F) > 52 || ![F, c, add(F, t), add(c, t)].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（用年齡差）：年齡差不變。現在差是兒子的 ${set[0] - 1} 倍，${fz(t)} 年後差是兒子（那時的年齡）的 ${set[1] - 1} 倍。設兒子今年 □ 歲：${set[0] - 1} × □ ＝ ${set[1] - 1} × (□ ＋ ${fz(t)})，所以 ${set[0] - set[1]} × □ ＝ ${set[1] - 1} × ${fz(t)}，□ ＝ ${fz(c)}，爸爸是 ${set[0]} × ${fz(c)} ＝ ${fz(F)} 歲。`,
        stem: `今年爸爸的年齡是兒子的 ${set[0]} 倍，${f(t)} 年後爸爸的年齡變成兒子的 ${set[1]} 倍。爸爸今年幾歲？`, units: ["歲"],
        explain: `解析：設兒子今年 □ 歲，爸爸就是 ${set[0]} 個 □ 歲；${f(t)} 年後：${set[0]} 個 □＋${f(t)}＝${set[1]}×(□＋${f(t)})，整理得 ${set[0] - set[1]} 個 □＝${set[1] - 1}×${f(t)}，□＝${f(c)}，爸爸＝${set[0]}×${f(c)}＝${f(F)}（歲）。（檢驗：${f(t)} 年後爸爸 ${f(add(F, t))}、兒子 ${f(add(c, t))}，${f(add(F, t))}÷${f(add(c, t))}＝${set[1]} 倍。）` }, ans(F, fl));
    }))
  ]);
  /* 教材式 □ 未知數題（規格第 14 節） */
  reg("solve-lower", "box", [
    sp("solve-lower-box-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const B = ageQ(kit, fl, 34, 45), t = ageQ(kit, fl, 2, 9), C = add(B, t); if (!nice(C, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（走到一半再走另一半）：爸爸從 ${fz(B)} 歲走到 ${fz(C)} 歲，先走一半到 ${fz(dv(add(B, C), I(2)))} 歲，再走另一半到 ${fz(C)} 歲。兩半一樣長，各 ${fz(dv(t, I(2)))} 年，所以 □ 是 ${fz(t)} 年。`,
        stem: `今年爸爸 ${f(B)} 歲，□ 年後爸爸 ${f(C)} 歲。□ ＝ ?`, units: ["年"],
        explain: `解析：${f(B)} ＋ □ ＝ ${f(C)}，□ ＝ ${f(C)} − ${f(B)} ＝ ${f(t)}（年）。` }, ans(t, fl));
    })),
    sp("solve-lower-box-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const C = ageQ(kit, fl, 6, 12), g = ageQ(kit, fl, 24, 32), B = add(C, g); if (!nice(B, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（分兩次往上加）：兒子 ${fz(C)} 歲，爸爸比他大 ${fz(g)} 歲。先加上 ${fz(g)} 的一半 ${fz(dv(g, I(2)))}，到 ${fz(add(C, dv(g, I(2))))} 歲，再加上另一半 ${fz(dv(g, I(2)))}，就是爸爸的年齡，得 ${fz(B)} 歲。`,
        stem: `爸爸今年 □ 歲，兒子今年 ${f(C)} 歲，爸爸比兒子大 ${f(g)} 歲。□ ＝ ?`, units: ["歲"],
        explain: `解析：□ − ${f(C)} ＝ ${f(g)}，□ ＝ ${f(C)} ＋ ${f(g)} ＝ ${f(B)}（歲）。` }, ans(B, fl));
    })),
    sp("solve-lower-box-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const n = kit.pick([4, 5, 6]), A = rq(kit, fl, 70, 90), T = mul(A, I(n)); if (!nice(T, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（總分和次數同時減半）：總分 ${fz(T)} 和次數 ${n} 同時除以 2，變成 ${fz(dv(T, I(2)))} 和 ${fz(dv(I(n), I(2)))}，平均不變。${fz(dv(T, I(2)))} 除以 ${fz(dv(I(n), I(2)))} 得 ${fz(A)}，所以 □ 是 ${fz(A)} 分。`,
        stem: `${n} × □ ＝ ${f(T)}。（${n} 次考試的總分是 ${f(T)} 分，□ 是平均）□ 是多少分？`, units: ["分"],
        explain: `解析：□ ＝ ${f(T)} ÷ ${n} ＝ ${f(A)}（分）。` }, ans(A, fl));
    })),
    sp("solve-lower-box-single-L4-01", "single", 4, "trap", kit => retry(kit, fl => {
      const k = kit.pick([2, 3, 4]), s = ageSet(kit, fl, k); if (!s) return null;
      const f = x => sh(x, fl), diff = sub(s.B, s.C);
      const o = qopts(kit, s.t, [s.c0, diff, mul(I(k - 1), s.t), sub(s.B, mul(I(k), s.C)), add(s.t, I(1))], fl, " 年");
      return { explain2: `解法二（代入檢查）：把選項的年數代進 □，看等號兩邊是否相等。代入 ${fz(s.t)}：左邊 ${fz(s.B)} ＋ ${fz(s.t)} ＝ ${fz(add(s.B, s.t))}，右邊 ${k} × (${fz(s.C)} ＋ ${fz(s.t)}) ＝ ${fz(mul(I(k), add(s.C, s.t)))}，兩邊相等，所以 □ 是 ${f(s.t)} 年。`,
        stem: `(${f(s.B)} ＋ □) ＝ ${k} × (${f(s.C)} ＋ □)（爸爸 ${f(s.B)} 歲、兒子 ${f(s.C)} 歲，□ 年後爸爸是兒子的 ${k} 倍）。□ 是多少年？`, options: o.options, answer: 0,
        explain: `解析：${f(s.B)} ＋ □ ＝ ${k}×${f(s.C)} ＋ ${k}×□，整理得 ${k - 1} 個 □ ＝ ${f(s.B)} − ${k}×${f(s.C)}＝${f(sub(s.B, mul(I(k), s.C)))}，□ ＝ ${f(s.t)}（年）。`,
        trapNote: `等號兩邊的 □ 要先合併：${k} 個 □ 移到左邊後只剩 ${k - 1} 個 □。常見錯誤是直接算 ${f(sub(s.B, mul(I(k), s.C)))}（忘了除以 ${k - 1}），或把兒子 ${k} 倍時的年齡 ${f(s.c0)} 當成年數。` };
    })),
    sp("solve-lower-box-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const k = kit.pick([2, 3, 4]), c0 = ageQ(kit, fl, 5, 14), t = ageQ(kit, fl, 2, 8), M = add(mul(I(k), c0), t), C = add(c0, t);
      if (qv(M) < 30 || qv(M) > 50 || ![M, C, c0, t].every(x => nice(x, fl))) return null;
      const bad = kit.pick([c0, add(t, I(1)), mul(I(k - 1), t)].filter(x => qv(x) !== qv(t)));
      if (!bad || !nice(bad, fl)) return null;
      const f = x => sh(x, fl), head = `(${f(M)} － □) ＝ ${k} × (${f(C)} － □)（媽媽 ${f(M)} 歲、女兒 ${f(C)} 歲，□ 年前媽媽是女兒的 ${k} 倍），所以 □ ＝`;
      const r = tfQ(kit, ok => `解法二（代入檢查）：把 □ ＝ ${fz(ok ? t : bad)} 代進去，媽媽 ${fz(M)} − ${fz(ok ? t : bad)} ＝ ${fz(sub(M, ok ? t : bad))} 歲，${qv(C) > qv(ok ? t : bad) ? "女兒 " + fz(C) + " − " + fz(ok ? t : bad) + " ＝ " + fz(sub(C, ok ? t : bad)) + " 歲，" + fz(sub(M, ok ? t : bad)) + " ÷ " + fz(sub(C, ok ? t : bad)) + " ＝ " + fz(dv(sub(M, ok ? t : bad), sub(C, ok ? t : bad))) + "，" + (ok ? "剛好是" : "不是") + " " + k + " 倍" : "女兒的年齡會變成 0 歲或更小，不合理"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${f(t)}。`, `正確：年齡差 ${f(sub(M, C))} 不變，女兒那時 ${f(sub(M, C))}÷${k - 1}＝${f(c0)} 歲，${f(C)}−${f(c0)}＝${f(t)}（年）。`],
        [`${head} ${f(bad)}。`, `錯誤：女兒那時是 ${f(c0)} 歲，要用 ${f(C)}−${f(c0)}＝${f(t)} 才是「幾年前」，不是 ${f(bad)}。`]);
      r.trapNote = "往回推時，□ 是「過了幾年」，不是當時的年齡；先用年齡差求出當時的年齡，再用現在的年齡減掉它。";
      return r;
    })),
    sp("solve-lower-box-word-L3-01", "word", 3, "basic", kit => retry(kit, fl => {
      const c = chaseQ(kit, fl); if (!c) return null;
      const f = x => sh(x, fl), dist = mul(c.a, c.t); if (!nice(dist, fl)) return null;
      return Object.assign({ explain2: `解法二（用哥哥算）：弟弟追上時，哥哥一共走了 ${fz(c.s)} ＋ ${fz(c.t)} ＝ ${fz(add(c.s, c.t))} 分鐘，每分鐘 ${fz(c.b)} 公尺，所以哥哥走了 ${fz(c.b)} × ${fz(add(c.s, c.t))} ＝ ${fz(dist)} 公尺。`,
        stem: `哥哥先走了 ${f(c.s)} 分鐘，每分鐘走 ${f(c.b)} 公尺；弟弟再出發，每分鐘走 ${f(c.a)} 公尺去追哥哥。弟弟追上哥哥時，哥哥一共走了 □ 公尺。□ ＝ ?`, units: ["公尺"],
        explain: `解析：弟弟追上要 ${f(c.D)}÷${f(c.k)}＝${f(c.t)} 分鐘，追上時兩人走的路程一樣，□ ＝ ${f(c.a)}×${f(c.t)} ＝ ${f(dist)}（公尺）。` }, ans(dist, fl));
    })),
    sp("solve-lower-box-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const S = ageQ(kit, fl, 40, 55), D = ageQ(kit, fl, 24, 32), big = dv(add(S, D), I(2)); if (!nice(big, fl) || !nice(dv(sub(S, D), I(2)), fl) || qv(dv(sub(S, D), I(2))) < 5) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（先平分再調整）：假設兩人一樣大，各是 ${fz(S)} ÷ 2 ＝ ${fz(dv(S, I(2)))} 歲；爸爸要多出差的一半 ${fz(D)} ÷ 2 ＝ ${fz(dv(D, I(2)))} 歲，所以 □ ＝ ${fz(dv(S, I(2)))} ＋ ${fz(dv(D, I(2)))} ＝ ${fz(big)} 歲。`,
        stem: `爸爸今年 □ 歲，兒子今年 △ 歲。□ ＋ △ ＝ ${f(S)}，□ － △ ＝ ${f(D)}。□ ＝ ?`, units: ["歲"],
        explain: `解析：和加差得 2 個 □＝${f(S)}＋${f(D)}＝${f(add(S, D))}，□ ＝ ${f(add(S, D))} ÷ 2 ＝ ${f(big)}（歲）。（△ ＝ ${f(dv(sub(S, D), I(2)))}）` }, ans(big, fl));
    })),
    sp("solve-lower-box-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const n = kit.pick([3, 4, 5]), a = rq(kit, fl, 70, 85), b = add(a, kq(kit, fl)), need = sub(mul(I(n + 2), b), mul(I(n), a));
      if (qv(need) > 190 || !nice(need, fl) || !nice(b, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（補平法）：後 2 次各要達到新平均 ${fz(b)} 分，共 ${fz(mul(I(2), b))} 分；前 ${n} 次每次還要補 ${fz(sub(b, a))} 分才升到新平均，共補 ${fz(mul(I(n), sub(b, a)))} 分。所以 □ ＝ ${fz(mul(I(2), b))} ＋ ${fz(mul(I(n), sub(b, a)))} ＝ ${fz(need)} 分。`,
        stem: `前 ${n} 次測驗的平均是 ${f(a)} 分，再考 2 次後，${n + 2} 次的平均變成 ${f(b)} 分。後面這 2 次共考了 □ 分。□ ＝ ?`, units: ["分"],
        explain: `解析：${n + 2} 次總分＝${f(b)}×${n + 2}＝${f(mul(b, I(n + 2)))}，前 ${n} 次總分＝${f(a)}×${n}＝${f(mul(a, I(n)))}，□ ＝ ${f(mul(b, I(n + 2)))} − ${f(mul(a, I(n)))} ＝ ${f(need)}（分）。` }, ans(need, fl));
    })),
    sp("solve-lower-box-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const x = ageQ(kit, fl, 8, 14), t = ageQ(kit, fl, 1, 6), k = kit.pick([3, 4, 5]), B = mul(add(x, t), I(k)); if (!nice(B, fl)) return null;
      const f = y => sh(y, fl);
      return Object.assign({ explain2: `解法二（代入驗算）：假設 □ ＝ ${fz(x)}，再過 ${fz(t)} 年是 ${fz(add(x, t))} 歲，乘 ${k} 倍是 ${fz(B)} 歲，和題目相同，所以 □ ＝ ${fz(x)} 歲。`,
        stem: `小明今年 □ 歲，再過 ${f(t)} 年，他的年齡的 ${k} 倍剛好是 ${f(B)} 歲，也就是 (□ ＋ ${f(t)}) × ${k} ＝ ${f(B)}。□ ＝ ?`, units: ["歲"],
        explain: `解析：□ ＋ ${f(t)} ＝ ${f(B)} ÷ ${k} ＝ ${f(add(x, t))}，□ ＝ ${f(add(x, t))} − ${f(t)} ＝ ${f(x)}（歲）。`,
        trapNote: `括號先「加 ${f(t)}」，最後才「×${k}」，還原要倒過來：先 ÷${k}，再 −${f(t)}。常見錯誤是 ${f(B)} ÷ ${k} 就當作答案，或 ${f(B)} − ${f(t)} 再 ÷${k}。` }, ans(x, fl));
    }))
  ]);
})();
