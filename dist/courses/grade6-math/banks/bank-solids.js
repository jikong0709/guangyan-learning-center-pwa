/* 題庫：solids（角柱與圓柱的體積、表面積、展開圖；圓柱 π 取 3.14，半徑為 7 的倍數時可取 22/7）｜題庫工 C
   數字風格（規格第 11 節）：邊長／半徑用整數、小數（3.5 公分）、分數、帶分數，全部以 kit.Q 精確運算。 */
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
  const FLS = ["int", "dec", "frac", "mixed"], FW = [1, 7, 2, 2];
  const Qn = (n, d) => ExamKit.Q(n, d);
  const add = (a, b) => ExamKit.qAdd(a, b), sub = (a, b) => ExamKit.qSub(a, b), mul = (a, b) => ExamKit.qMul(a, b), dv = (a, b) => ExamKit.qDiv(a, b);
  const qv = a => a.n / a.d;
  const isF = fl => fl === "frac" || fl === "mixed";
  const I = n => Qn(n, 1);
  const sw = (x, fl) => (isF(fl) ? ExamKit.qMixed(x) : (x.d === 1 ? String(x.n) : (ExamKit.qDec(x) || ExamKit.qMixed(x))));
  let curFl = "int";
  const fz = x => sw(x, curFl);
  const rd = x => Math.max(1, Math.round(qv(x)));
  const pis = pt => (pt.indexOf("22/7") >= 0 ? "22/7" : "3.14");
  function nice(a, fl) {
    if (!a || !(a.n > 0)) return false;
    if (isF(fl)) return a.d <= 24 && a.n < 5000;
    const v = qv(a); return ExamKit.qIsTerminating(a) && Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-7 && a.n < 1e8;
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
  /* 一般長度：整數／一位小數／帶分數 */
  function lq(kit, fl, lo, hi) {
    if (fl === "int") return I(kit.int(lo, hi));
    if (fl === "dec") return kit.randQ("dec", { min: lo, max: hi, places: 1 });
    return kit.randQ("mixed", { min: lo, max: hi, dens: [2, 4] });
  }
  /* 半徑：整數／x.5／7 的倍數的分數（配合 π 取 22/7） */
  function rr(kit, fl, lo, hi) {
    if (fl === "int") return I(kit.int(lo, hi));
    if (fl === "dec") return Qn(2 * kit.int(lo, hi - 1) + 1, 2);
    for (let i = 0; i < 60; i++) { const q = Qn(7 * kit.int(1, 4), kit.pick([1, 2, 4])); if (qv(q) >= lo - 1 && qv(q) <= hi + 4) return q; }
    return Qn(7, 2);
  }
  /* 依半徑決定 π：frac/mixed 一律 22/7（半徑為 7 的倍數）；int/dec 在半徑為 3.5 的倍數時一半機率取 22/7 */
  function piFor(kit, fl, r) {
    const ok = mul(r, Qn(2, 7)).d === 1;
    const use = isF(fl) ? true : (ok && kit.int(0, 1) === 1);
    if (isF(fl) && !ok && mul(r, Qn(1, 7)).d > 4) return null;
    return use ? { pi: Qn(22, 7), pt: "π 取 22/7" } : { pi: Qn(157, 50), pt: "π 取 3.14" };
  }
  function circ(kit, fl, lo, hi) {
    const r = rr(kit, fl, lo, hi), p = piFor(kit, fl, r); if (!p) return null;
    return { r, pi: p.pi, pt: p.pt };
  }
  const sq = a => mul(a, a);

  reg("solids", "single", [
    sp("solids-single-L1-01", "single", 1, "basic", kit => retry(kit, fl => {
      const A = lq(kit, fl, 12, 40), H = lq(kit, fl, 3, 12), V = mul(A, H); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, V, [add(A, H), mul(V, I(2)), dv(V, I(2)), mul(I(2), add(A, H)), dv(V, I(3)), add(V, A)], fl, " 立方公分");
      return { explain2: `解法二（把高分成兩半）：高 ${fz(H)} 公分分成兩半，每半 ${fz(dv(H, I(2)))} 公分，每半的體積是 ${fz(A)} 乘 ${fz(dv(H, I(2)))}，得 ${fz(mul(A, dv(H, I(2))))} 立方公分。兩半合起來是 ${f(V)} 立方公分。`,
        stem: `一個直立柱體的底面積是 ${f(A)} 平方公分，高是 ${f(H)} 公分，它的體積是多少立方公分？`, options: o.options, answer: 0,
        explain: `解析：柱體體積＝底面積×高＝${f(A)}×${f(H)}＝${f(V)}（立方公分）。` };
    })),
    sp("solids-single-L2-01", "single", 2, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 4, 12), B = mul(c.pi, sq(c.r)), V = mul(B, H); if (!nice(V, fl) || !nice(B, fl)) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, V, [mul(V, I(4)), mul(mul(c.pi, c.r), H), dv(V, I(3)), mul(mul(I(2), mul(c.pi, c.r)), H), B], fl, " 立方公分");
      return { explain2: `解法二（換個順序乘）：先算圓周率乘高：${pis(c.pt)} × ${fz(H)} ＝ ${fz(mul(c.pi, H))}，再乘半徑兩次：${fz(mul(c.pi, H))} × ${fz(c.r)} × ${fz(c.r)} ＝ ${fz(V)}。所以體積是 ${f(V)} 立方公分。`,
        stem: `一個圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，體積是多少立方公分？（${c.pt}）`, options: o.options, answer: 0,
        explain: `解析：底面積＝π×${f(c.r)}×${f(c.r)}＝${f(B)}（平方公分），體積＝底面積×高＝${f(B)}×${f(H)}＝${f(V)}（立方公分）。` };
    })),
    sp("solids-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 8); if (!c) return null;
      const H = lq(kit, fl, 4, 12), B = mul(c.pi, sq(c.r)), lat = mul(mul(I(2), mul(c.pi, c.r)), H), S = add(mul(I(2), B), lat), V = mul(B, H);
      if (![B, lat, S, V].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, S, [V, lat, mul(I(2), B), add(B, lat), add(lat, mul(I(2), mul(c.pi, c.r))), dv(S, I(2))], fl, " 平方公分");
      return { explain2: `解法二（合併成一個算式）：兩個底面和側面都有「2 乘圓周率乘半徑」這個因數，可以合併成「2 乘圓周率乘半徑，再乘（半徑加高）」。半徑加高是 ${fz(add(c.r, H))}，2 乘圓周率乘半徑是 ${fz(mul(mul(I(2), c.pi), c.r))}，兩個相乘，得 ${f(S)} 平方公分。`,
        stem: `一個圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，它的表面積（含上、下兩個底面）是多少平方公分？（${c.pt}）`, options: o.options, answer: 0,
        explain: `解析：兩個底面積＝2×π×${f(c.r)}×${f(c.r)}＝${f(mul(I(2), B))}；側面積＝底面周長×高＝2×π×${f(c.r)}×${f(H)}＝${f(lat)}；表面積＝${f(mul(I(2), B))}＋${f(lat)}＝${f(S)}（平方公分）。`,
        trapNote: `體積（${f(V)} 立方公分）和表面積是不同的量。常見錯誤：把體積當表面積、只算側面積 (${f(lat)})、或只算一個底面 (${f(add(B, lat))})。表面積＝兩個底面＋側面。` };
    })),
    sp("solids-single-L4-01", "single", 4, "trap", kit => retry(kit, fl => {
      const k = fl === "int" ? I(kit.int(1, 3)) : fl === "dec" ? Qn(kit.pick([1, 3, 5]), 2) : Qn(kit.pick([1, 3, 5, 3]), kit.pick([2, 2, 4])), H = lq(kit, fl, 5, 12);
      const a = mul(I(3), k), b = mul(I(4), k), c = mul(I(5), k), B = dv(mul(a, b), I(2)), P = add(add(a, b), c), S = add(mul(I(2), B), mul(P, H)), V = mul(B, H);
      if (![a, b, c, B, P, S, V].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, S, [V, add(B, mul(P, H)), add(mul(I(2), mul(a, b)), mul(P, H)), add(mul(I(2), B), mul(add(a, b), H)), mul(P, H), add(add(mul(I(2), B), mul(P, H)), V)], fl, " 平方公分");
      return { explain2: `解法二（用展開圖）：三角柱展開是 2 個三角形和 3 個長方形。2 個三角形共 ${fz(mul(I(2), B))}；3 個長方形的寬都是柱高 ${fz(H)}，長分別是 ${fz(a)}、${fz(b)}、${fz(c)}，面積是 ${fz(mul(a, H))}、${fz(mul(b, H))}、${fz(mul(c, H))}。全部加起來是 ${f(S)} 平方公分。`,
        stem: `直立三角柱的底面是直角三角形，三邊長分別是 ${f(a)}、${f(b)}、${f(c)} 公分，柱高是 ${f(H)} 公分，它的表面積是多少平方公分？`, options: o.options, answer: 0,
        explain: `解析：底面積＝${f(a)}×${f(b)}÷2＝${f(B)}，兩個底面＝${f(mul(I(2), B))}；底面周長＝${f(a)}＋${f(b)}＋${f(c)}＝${f(P)}，側面積＝${f(P)}×${f(H)}＝${f(mul(P, H))}；表面積＝${f(mul(I(2), B))}＋${f(mul(P, H))}＝${f(S)}（平方公分）。`,
        trapNote: `三個側面都要算（寬分別是 ${f(a)}、${f(b)}、${f(c)}），不能漏掉斜邊那一面；也別忘了三角形面積要 ÷2，且有上、下兩個底面。把體積 ${f(V)} 當成表面積更是錯的。` };
    })),
    sp("solids-single-L5-01", "single", 5, "extend", kit => retry(kit, fl => {
      const a = fl === "int" ? I(kit.pick([2, 3])) : fl === "dec" ? Qn(kit.pick([3, 5, 1]), 2) : Qn(kit.pick([1, 3, 2]), kit.pick([2, 3])),
        b = fl === "int" ? I(kit.pick([2, 3, 4])) : fl === "dec" ? Qn(kit.pick([3, 5, 1, 2]), kit.pick([2, 2, 1])) : Qn(kit.pick([1, 3, 3]), kit.pick([2, 4, 2]));
      if (a.n === 0 || b.n === 0 || qv(a) === 1 || qv(b) === 1) return null;
      const ans0 = mul(sq(a), b); if (!nice(ans0, fl)) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, ans0, [mul(a, b), add(a, b), add(sq(a), b), mul(a, sq(b)), mul(sq(a), a), add(sq(a), mul(a, b))], fl, " 倍");
      return { explain2: `解法二（舉例）：假設原來半徑 1、高 1，體積算成 1 份。半徑變成 ${fz(a)} 倍，半徑乘半徑是 ${fz(sq(a))}；高是 ${fz(b)} 倍。新的體積是 ${fz(sq(a))} × ${fz(b)} ＝ ${fz(ans0)} 份，所以是原來的 ${f(ans0)} 倍。`,
        stem: `一個圓柱，如果底面半徑變成原來的 ${f(a)} 倍，高變成原來的 ${f(b)} 倍，體積會變成原來的幾倍？`, options: o.options, answer: 0,
        explain: `解析：體積＝π×半徑×半徑×高。半徑變 ${f(a)} 倍，半徑²變 ${f(a)}×${f(a)}＝${f(sq(a))} 倍；高變 ${f(b)} 倍；體積變 ${f(sq(a))}×${f(b)}＝${f(ans0)} 倍。` };
    }))
  ]);

  reg("solids", "multi", [
    sp("solids-multi-L2-01", "multi", 2, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 9); if (!c) return null;
      const C = mul(mul(I(2), c.pi), c.r), B = mul(c.pi, sq(c.r)); if (!nice(C, fl) || !nice(B, fl) || qv(C) === qv(B)) return null;
      const f = x => sh(x, fl);
      return multiQ(kit, "柱體的體積＝底面積×高；圓柱的底面周長＝直徑×圓周率；側面展開是長方形，長是底面周長，寬是高；上、下兩個底面是一樣大的圓。", `關於柱體與圓柱（${c.pt}）：`, [
        ["柱體的體積＝底面積×高", "這是所有直立柱體共同的公式。", `例：底面積 10、高 3，疊成 3 層，每層 10，共 30`],
        ["圓柱的側面展開後是長方形", "長方形的長是底面周長，寬是圓柱的高。", `把圓柱的側面剪開攤平，會得到 1 個長方形`],
        ["圓柱的上、下兩個底面是全等的圓", "兩個底面形狀、大小都相同。", `圓柱上、下 2 個圓一樣粗，所以一樣大`],
        [`半徑 ${f(c.r)} 公分的圓柱，底面周長是 ${f(C)} 公分`, `2×π×${f(c.r)}＝${f(C)}。`, `直徑 ${fz(mul(I(2), c.r))} 乘圓周率，得 ${fz(C)}`]
      ], [
        ["圓柱的體積＝底面積×高÷3", "÷3 是錐體的公式，柱體不用除以 3。", `例：底面積 10、高 3 疊成 30，除以 3 變 10，對不上`],
        ["圓柱的側面展開後是三角形", "側面展開是長方形。", `攤平的側面有 4 個直角，不是三角形`],
        ["圓柱的上底面比下底面小", "兩個底面全等。", `圓柱上、下 2 個圓一樣粗，不會一大一小`],
        [`半徑 ${f(c.r)} 公分的圓柱，底面周長是 ${f(B)} 公分`, `${f(B)} 是底面積；周長是 2×π×${f(c.r)}＝${f(C)}。`, `${fz(B)} 是面積，周長是長度，要 ${fz(C)}`]
      ]);
    })),
    sp("solids-multi-L3-01", "multi", 3, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 8); if (!c) return null;
      const H = lq(kit, fl, 9, 15), r = c.r, B = mul(c.pi, sq(r)), lat = mul(mul(I(2), mul(c.pi, r)), H), S = add(mul(I(2), B), lat), V = mul(B, H), v2 = mul(mul(c.pi, r), H), t1 = add(lat, B), t2 = mul(I(2), lat);
      if (![B, lat, S, V, v2, t1, t2].every(x => nice(x, fl))) return null;
      if (qv(V) === qv(lat) || qv(lat) === qv(mul(I(2), B)) || qv(V) === qv(v2) || qv(S) === qv(V)) return null;
      const f = x => sh(x, fl);
      const q = multiQ(kit, "圓柱：底面積＝半徑×半徑×圓周率；側面積＝底面周長×高；表面積＝兩個底面積＋側面積；體積＝底面積×高。面積用平方公分，體積用立方公分。", `圓柱的底面半徑是 ${f(r)} 公分，高是 ${f(H)} 公分（${c.pt}）。`, [
        [`一個底面的面積是 ${f(B)} 平方公分`, `π×${f(r)}×${f(r)}＝${f(B)}。`, `半徑乘半徑得 ${fz(sq(r))}，再乘圓周率，得 ${fz(B)}`],
        [`側面積是 ${f(lat)} 平方公分`, `底面周長×高＝2×π×${f(r)}×${f(H)}＝${f(lat)}。`, `側面攤平是長方形：長 ${fz(mul(mul(I(2), c.pi), r))}、寬 ${fz(H)}，面積 ${fz(lat)}`],
        [`表面積是 ${f(S)} 平方公分`, `兩個底面＋側面＝${f(mul(I(2), B))}＋${f(lat)}＝${f(S)}。`, `展開圖：兩個圓 ${fz(mul(I(2), B))} 加長方形 ${fz(lat)}，共 ${fz(S)}`],
        [`體積是 ${f(V)} 立方公分`, `底面積×高＝${f(B)}×${f(H)}＝${f(V)}。`, `${fz(B)} 平方公分疊 ${fz(H)} 公分高，得 ${fz(V)}`]
      ], [
        [`體積是 ${f(v2)} 立方公分`, `漏乘了一次半徑，體積應是 ${f(V)}。`, `半徑要乘兩次，少乘一次會變成 ${fz(v2)}`],
        [`側面積是 ${f(V)} 平方公分`, `${f(V)} 是體積；側面積是 ${f(lat)}。`, `${fz(V)} 的單位是立方公分，側面積是平方公分，不能混用`],
        [`表面積是 ${f(t1)} 平方公分`, `只算了一個底面，上、下兩個底面都要算，是 ${f(S)}。`, `漏掉一個底面 ${fz(B)}，表面積應是 ${fz(S)}`],
        [`表面積是 ${f(t2)} 平方公分`, `表面積是兩個底面＋側面＝${f(S)}。`, `${fz(t2)} 只是把側面積加倍，表面積是 ${fz(S)}`]
      ]);
      q.trapNote = "體積（立方公分）、側面積、表面積（平方公分）是三個不同的量：側面積＝底面周長×高，表面積＝側面積＋兩個底面積，體積＝底面積×高。";
      return q;
    })),
    sp("solids-multi-L3-02", "multi", 3, "trap", kit => {
      const n = kit.pick([3, 4, 5, 6]);
      const q = multiQ(kit, "角柱的面、邊、頂點個數都可以用底面的邊數算出來：面＝邊數＋2，邊＝邊數×3，頂點＝邊數×2；拿長方體（4 角柱：6 面、12 邊、8 頂點）檢查一下最清楚。", `有一個直立 ${n} 角柱。`, [
        [`它有 ${n + 2} 個面`, `${n} 個側面＋上、下 2 個底面＝${n + 2}。`, `${n} 個側面加上、下 2 個底面，共 ${n + 2} 個`],
        [`它有 ${3 * n} 條邊`, `上底 ${n} 條＋下底 ${n} 條＋${n} 條側稜＝${3 * n}。`, `上底 ${n} 條、下底 ${n} 條、側稜 ${n} 條，共 ${3 * n} 條`],
        [`它有 ${2 * n} 個頂點`, `上、下底面各有 ${n} 個頂點。`, `上、下底面各有 ${n} 個頂點，共 ${2 * n} 個`],
        [`它的展開圖有 2 個 ${n} 邊形和 ${n} 個長方形`, `兩個底面是 ${n} 邊形，${n} 個側面是長方形。`, `兩個底面是 ${n} 邊形，側面有 ${n} 個長方形`]
      ], [
        [`它有 ${n + 1} 個面`, `別忘了上、下兩個底面，共 ${n + 2} 個面。`, `上、下底面別忘了，面有 ${n + 2} 個，${n + 1} 少算了`],
        [`它有 ${2 * n} 條邊`, `共 ${3 * n} 條邊（上底 ${n}＋下底 ${n}＋側稜 ${n}）。`, `${2 * n} 只算了上下底面的邊，沒算側稜，共 ${3 * n} 條`],
        [`它有 ${n + 2} 個頂點`, `頂點數是 ${2 * n}，${n + 2} 是面數。`, `${n + 2} 是面的個數，頂點是 ${2 * n}`],
        [`它的展開圖有 2 個 ${n} 邊形和 ${n + 1} 個長方形`, `側面有 ${n} 個長方形。`, `側面有 ${n} 個長方形，不是 ${n + 1} 個`]
      ]);
      q.trapNote = "角柱的面數＝底面邊數＋2，邊數＝底面邊數×3，頂點數＝底面邊數×2。面數與頂點數很容易搞混，可用長方體（4 角柱：6 面、12 邊、8 頂點）檢查。";
      return q;
    }),
    sp("solids-multi-L4-01", "multi", 4, "basic", kit => retry(kit, fl => {
      const a = lq(kit, fl, 20, 50), b = lq(kit, fl, 20, 50), h = lq(kit, fl, 20, 50), V = mul(mul(a, b), h), L = dv(V, I(1000)), L10 = mul(L, I(10)), ab = mul(a, b), s3 = add(add(a, b), h), ab2 = mul(ab, I(2));
      if (![V, L, L10, ab, s3, ab2].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return multiQ(kit, "長方體的容積＝長×寬×高（立方公分）；1 公升＝1000 立方公分，所以立方公分的數字要除以 1000 才是公升；底面積是長×寬，單位是平方公分。", `一個長方體水槽，內部長 ${f(a)} 公分、寬 ${f(b)} 公分、高 ${f(h)} 公分。`, [
        [`它的容積是 ${f(V)} 立方公分`, `${f(a)}×${f(b)}×${f(h)}＝${f(V)}。`, `長乘寬乘高：${fz(a)} 乘 ${fz(b)} 乘 ${fz(h)} 得 ${fz(V)}`],
        [`它的容積是 ${f(L)} 公升`, `${f(V)}÷1000＝${f(L)}（1 公升＝1000 立方公分）。`, `${fz(V)} 除以 1000 得 ${fz(L)} 公升`],
        [`底面積是 ${f(ab)} 平方公分`, `${f(a)}×${f(b)}＝${f(ab)}。`, `長 ${fz(a)}、寬 ${fz(b)} 的長方形，面積 ${fz(ab)}`],
        ["1 公升等於 1000 立方公分", "這是容量與體積的換算關係。", `邊長 10 公分的正方體，10 乘 10 乘 10 得 1000 立方公分，剛好裝 1 公升`]
      ], [
        [`它的容積是 ${f(L10)} 公升`, `${f(V)}÷1000＝${f(L)}，不是 ${f(L10)}。`, `${fz(V)} 裡面只有 ${fz(L)} 個 1000，不是 ${fz(L10)}`],
        [`它的容積是 ${f(s3)} 立方公分`, "體積要用長×寬×高，不能相加。", `相加得到的是長度，體積要相乘`],
        [`底面積是 ${f(ab2)} 平方公分`, `底面積是 ${f(a)}×${f(b)}＝${f(ab)}。`, `長乘寬是 ${fz(ab)}，不用再乘 2，不是 ${fz(ab2)}`],
        ["1 公升等於 100 立方公分", "1 公升＝1000 立方公分。", `10 乘 10 乘 10 是 1000，不是 100`]
      ]);
    })),
    sp("solids-multi-L5-01", "multi", 5, "extend", kit => retry(kit, fl => {
      const k = fl === "int" ? I(kit.pick([2, 3])) : fl === "dec" ? Qn(kit.pick([3, 5]), 2) : Qn(kit.pick([1, 3, 2]), kit.pick([2, 3]));
      const k2 = sq(k), k3 = mul(k2, k); if (![k, k2, k3].every(x => nice(x, fl)) || qv(k) === 1 || qv(k2) === qv(k) || qv(k3) === qv(k2)) return null;
      const f = x => sh(x, fl), c = kit.pick([[2, 3]]);
      return multiQ(kit, "尺寸變動時看三件事：長度（半徑、周長）跟著變同樣的倍數；面積（底面積、表面積）變倍數的平方；體積變倍數的三次方（只有高變，體積就只變同樣的倍數）。", `把一個圓柱的尺寸變動後，比較變動前後（只看比例，不需代入 π）。`, [
        [`半徑變成 ${f(k)} 倍、高不變，體積變成 ${f(k2)} 倍`, `半徑平方：${f(k)}×${f(k)}＝${f(k2)} 倍。`, `半徑 1 變 ${fz(k)}，半徑乘半徑從 1 變成 ${fz(k2)}，體積變 ${fz(k2)} 倍`],
        [`高變成 ${f(k)} 倍、半徑不變，體積變成 ${f(k)} 倍`, "體積與高成正比。", `高從 1 變 ${fz(k)}，體積也變 ${fz(k)} 倍`],
        [`半徑和高都變成 ${f(k)} 倍，體積變成 ${f(k3)} 倍`, `${f(k2)}×${f(k)}＝${f(k3)} 倍。`, `半徑乘半徑變 ${fz(k2)} 倍，高再變 ${fz(k)} 倍，共 ${fz(k3)} 倍`],
        [`半徑變成 ${f(k)} 倍，底面周長也變成 ${f(k)} 倍`, "周長＝2×π×半徑，和半徑成正比。", `周長是 2 乘圓周率乘半徑，半徑變 ${fz(k)} 倍，周長也變 ${fz(k)} 倍`],
        [`半徑和高都變成 ${f(k)} 倍，表面積變成 ${f(k2)} 倍`, `每個面的長、寬都變成 ${f(k)} 倍，面積變成 ${f(k2)} 倍。`, `每個面的長和寬都變 ${fz(k)} 倍，面積變 ${fz(k2)} 倍`]
      ], [
        [`半徑變成 ${f(k)} 倍、高不變，體積變成 ${f(k)} 倍`, `底面積與半徑平方成正比，應是 ${f(k2)} 倍。`, `底面積變 ${fz(k2)} 倍，高沒變，不是 ${fz(k)} 倍`],
        [`半徑和高都變成 ${f(k)} 倍，體積變成 ${f(k2)} 倍`, `應是 ${f(k3)} 倍。`, `半徑和高各變 ${fz(k)} 倍，要乘三次，是 ${fz(k3)} 倍，不是 ${fz(k2)}`],
        [`半徑變成 ${f(k)} 倍，底面積也變成 ${f(k)} 倍`, `底面積應變成 ${f(k2)} 倍。`, `底面積是半徑乘半徑，變 ${fz(k2)} 倍，不是 ${fz(k)} 倍`],
        [`半徑和高都變成 ${f(k)} 倍，表面積變成 ${f(k3)} 倍`, `表面積是面積，變成 ${f(k2)} 倍。`, `表面積是面積，變 ${fz(k2)} 倍，體積才是 ${fz(k3)} 倍`]
      ]);
    }))
  ]);

  reg("solids", "tf", [
    sp("solids-tf-L1-01", "tf", 1, "basic", kit => retry(kit, fl => {
      const A = lq(kit, fl, 12, 30), H = lq(kit, fl, 4, 12), V = mul(A, H), bad = add(A, H); if (!nice(V, fl) || !nice(bad, fl)) return null;
      const f = x => sh(x, fl), head = `底面積 ${f(A)} 平方公分、高 ${f(H)} 公分的直立柱體，體積是`;
      return tfQ(kit, ok => `解法二（把高分成兩半）：高 ${fz(H)} 公分的一半是 ${fz(dv(H, I(2)))} 公分，一半的體積是 ${fz(A)} 乘 ${fz(dv(H, I(2)))}，得 ${fz(mul(A, dv(H, I(2))))} 立方公分；兩半合起來是 ${fz(V)} 立方公分。敘述寫的是 ${fz(ok ? V : bad)} 立方公分，${ok ? "一樣" : "不一樣"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${f(V)} 立方公分。`, `正確：柱體的體積＝底面積×高，${f(A)}×${f(H)}＝${f(V)}，和敘述寫的一樣。`],
        [`${head} ${f(bad)} 立方公分。`, `錯誤：體積＝底面積×高＝${f(A)}×${f(H)}＝${f(V)}，不是相加。`]);
    })),
    sp("solids-tf-L2-01", "tf", 2, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 4, 12), B = mul(c.pi, sq(c.r)), V = mul(B, H), bad = kit.pick([mul(mul(c.pi, c.r), H), mul(V, I(4)), mul(V, I(2))]);
      if (![V, bad].every(x => nice(x, fl)) || qv(bad) === qv(V)) return null;
      const f = x => sh(x, fl), head = `圓柱的底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分（${c.pt}），體積是`;
      return tfQ(kit, ok => `解法二（先估一估）：圓周率約是 3，所以體積大約是 3 乘 ${fz(c.r)} 乘 ${fz(c.r)} 乘 ${fz(H)}，約 ${fz(mul(mul(I(3), sq(c.r)), H))} 立方公分。敘述寫的是 ${fz(ok ? V : bad)} 立方公分，和估計${ok ? "很接近" : "差很多"}，精算的體積是 ${fz(V)} 立方公分，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${f(V)} 立方公分。`, `正確：圓柱的體積＝底面積×高，底面積＝π×半徑×半徑，π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(V)}，和敘述寫的一樣。`],
        [`${head} ${f(bad)} 立方公分。`, `錯誤：圓柱的體積＝底面積×高＝π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(V)} 立方公分，不是敘述寫的那個數。`]);
    })),
    sp("solids-tf-L3-01", "tf", 3, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 8); if (!c) return null;
      const H = lq(kit, fl, 4, 12), lat = mul(mul(I(2), mul(c.pi, c.r)), H), V = mul(mul(c.pi, sq(c.r)), H);
      if (![lat, V].every(x => nice(x, fl)) || qv(lat) === qv(V)) return null;
      const f = x => sh(x, fl), head = `圓柱的底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分（${c.pt}），側面積是`;
      const q = tfQ(kit, ok => `解法二（改用直徑算側面積）：側面積也等於圓周率乘直徑再乘高。直徑是 ${fz(mul(I(2), c.r))}，圓周率乘直徑是 ${fz(mul(c.pi, mul(I(2), c.r)))}，再乘高 ${fz(H)}，得 ${fz(lat)}。敘述寫的是 ${fz(ok ? lat : V)}，${ok ? "一樣" : "不一樣"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${f(lat)} 平方公分。`, `正確：側面積＝底面周長×高＝2×π×${f(c.r)}×${f(H)}＝${f(lat)}。`],
        [`${head} ${f(V)} 平方公分。`, `錯誤：${f(V)} 是體積（底面積×高）；側面積＝底面周長×高＝${f(lat)} 平方公分。`]);
      q.trapNote = "側面積＝底面「周長」×高；體積＝底面「面積」×高。周長與面積、平方公分與立方公分都要分清楚。";
      return q;
    })),
    sp("solids-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const b = lq(kit, fl, 6, 12), h = lq(kit, fl, 4, 8), H = lq(kit, fl, 5, 12), V = dv(mul(mul(b, h), H), I(2)), bad = mul(mul(b, h), H); if (![V, bad].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl), head = `直立三角柱的底面三角形底 ${f(b)} 公分、高 ${f(h)} 公分，柱高 ${f(H)} 公分，體積是`;
      const q = tfQ(kit, ok => `解法二（拼成長方體）：兩個一樣的三角柱可以拼成一個長方體，底面是長 ${fz(b)}、寬 ${fz(h)} 的長方形，高 ${fz(H)}，體積 ${fz(bad)} 立方公分；一個三角柱是它的一半，也就是 ${fz(V)} 立方公分。敘述寫的是 ${fz(ok ? V : bad)}，${ok ? "相同" : "不同"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${f(V)} 立方公分。`, `正確：底面積＝${f(b)}×${f(h)}÷2＝${f(dv(mul(b, h), I(2)))}，體積＝${f(dv(mul(b, h), I(2)))}×${f(H)}＝${f(V)}。`],
        [`${head} ${f(bad)} 立方公分。`, `錯誤：三角形底面積要 ÷2，體積＝${f(b)}×${f(h)}÷2×${f(H)}＝${f(V)} 立方公分，${f(bad)} 漏除了 2。`]);
      q.trapNote = "三角柱的底面積是三角形面積（底×高÷2）；如果直接把底、高、柱高三個數相乘，會漏掉 ÷2 而多算一倍。注意三角形的「高」與柱子的「高」是不同的兩個量。";
      return q;
    })),
    sp("solids-tf-L5-01", "tf", 5, "extend", kit => retry(kit, fl => {
      const k = fl === "int" ? I(kit.pick([2, 3])) : fl === "dec" ? Qn(kit.pick([3, 5, 1]), 2) : Qn(kit.pick([1, 3, 2]), kit.pick([2, 3, 4]));
      const same = kit.int(0, 1) === 1, w = same ? dv(I(1), sq(k)) : kit.pick([dv(I(1), k), dv(I(1), mul(I(2), k)), dv(I(1), add(sq(k), I(1)))]);
      if (!nice(k, fl) || !nice(w, fl) || qv(k) === 1) return null;
      const ok = qv(mul(sq(k), w)) === 1, f = x => sh(x, fl);
      return { explain2: `解法二（舉例）：假設原來半徑 1、高 1，體積算成 1 份。半徑變成 ${f(k)} 倍，半徑乘半徑是 ${f(sq(k))}，高變成 ${f(w)} 倍，新體積是 ${f(sq(k))} × ${f(w)} ＝ ${f(mul(sq(k), w))} 份，${ok ? "剛好是 1 份，體積一樣大" : "不是 1 份，體積不一樣"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        stem: `判斷下列敘述是否正確：\n圓柱的底面半徑變成原來的 ${f(k)} 倍，同時高變成原來的 ${f(w)} 倍，體積和原來一樣大。`, answer: ok,
        explain: `解析：半徑變 ${f(k)} 倍，底面積變 ${f(sq(k))} 倍；高變 ${f(w)} 倍；體積變成 ${f(sq(k))}×${f(w)}＝${f(mul(sq(k), w))} 倍，${ok ? "剛好是 1 倍，體積不變，所以正確" : "不等於 1 倍，體積會改變，所以錯誤"}。` };
    }))
  ]);

  reg("solids", "fill", [
    sp("solids-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const a = lq(kit, fl, 3, 10), b = lq(kit, fl, 3, 10), c = lq(kit, fl, 2, 9), V = mul(mul(a, b), c); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（想成積木）：用 1 立方公分的小積木鋪滿底面，長 ${fz(a)} 公分、寬 ${fz(b)} 公分，一層有 ${fz(mul(a, b))} 塊；高 ${fz(c)} 公分就疊 ${fz(c)} 層，總共 ${fz(V)} 塊，所以體積是 ${fz(V)} 立方公分。`,
        stem: `長方體的長 ${f(a)} 公分、寬 ${f(b)} 公分、高 ${f(c)} 公分，體積是 ____ 立方公分。`, units: ["立方公分", "cm³", "cm3"],
        explain: `解析：長方體的體積＝長×寬×高＝${f(a)}×${f(b)}×${f(c)}＝${f(V)}（立方公分）。` }, ans(V, fl));
    })),
    sp("solids-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const b = lq(kit, fl, 6, 12), h = lq(kit, fl, 4, 8), H = lq(kit, fl, 5, 12), B = dv(mul(b, h), I(2)), V = mul(B, H); if (!nice(V, fl) || !nice(B, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（拼成長方體）：兩個一樣的三角柱可以拼成長方體，體積是 ${fz(b)} × ${fz(h)} × ${fz(H)} ＝ ${fz(mul(mul(b, h), H))} 立方公分；一個三角柱是一半，${fz(mul(mul(b, h), H))} ÷ 2 ＝ ${fz(V)} 立方公分。`,
        stem: `直立三角柱的底面三角形底 ${f(b)} 公分、高 ${f(h)} 公分，柱高 ${f(H)} 公分，體積是 ____ 立方公分。`, units: ["立方公分", "cm³"],
        explain: `解析：底面積＝${f(b)}×${f(h)}÷2＝${f(B)}，體積＝${f(B)}×${f(H)}＝${f(V)}（立方公分）。` }, ans(V, fl));
    })),
    sp("solids-fill-L3-01", "fill", 3, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 10); if (!c) return null;
      const H = lq(kit, fl, 3, 12), V = mul(mul(c.pi, sq(c.r)), H); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（用直徑算）：直徑是 ${fz(mul(I(2), c.r))} 公分，底面積要用圓周率 ${pis(c.pt)} 乘直徑、再乘直徑、最後除以 4，算出底面積是 ${fz(mul(c.pi, sq(c.r)))} 平方公分；高是 ${fz(H)} 公分，一層一層疊上去，得到體積 ${fz(V)} 立方公分。`,
        stem: `圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，體積是 ____ 立方公分。（${c.pt}）`, units: ["立方公分", "cm³"],
        explain: `解析：圓柱的體積＝底面積×高，底面積＝π×半徑×半徑，所以體積＝π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(V)}（立方公分）。` }, ans(V, fl));
    })),
    sp("solids-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const d = mul(I(2), rr(kit, fl, 2, 6)), r = dv(d, I(2)), p = piFor(kit, fl, r); if (!p) return null;
      const H = lq(kit, fl, 3, 12), V = mul(mul(p.pi, sq(r)), H), wrong = mul(mul(p.pi, sq(d)), H); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（用直徑算）：底面積 ＝ 圓周率 × 直徑 × 直徑 ÷ 4 ＝ ${pis(p.pt)} × ${fz(d)} × ${fz(d)} ÷ 4 ＝ ${fz(dv(mul(p.pi, sq(d)), I(4)))}，再乘高 ${fz(H)}，得 ${fz(V)} 立方公分。`,
        stem: `圓柱的底面「直徑」是 ${f(d)} 公分，高是 ${f(H)} 公分，體積是 ____ 立方公分。（${p.pt}）`, units: ["立方公分", "cm³"],
        explain: `解析：半徑＝${f(d)}÷2＝${f(r)} 公分，體積＝π×${f(r)}×${f(r)}×${f(H)}＝${f(V)}（立方公分）。`,
        trapNote: `題目給的是直徑 ${f(d)}，公式要用半徑。若直接把 ${f(d)} 當半徑代入，算出 ${sh(wrong, fl)}，會多 4 倍。` }, ans(V, fl));
    })),
    sp("solids-fill-L5-01", "fill", 5, "extend", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 3, 15), B = mul(c.pi, sq(c.r)), V = mul(B, H); if (!nice(V, fl) || !nice(B, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（一步一步除回去）：體積 ${fz(V)} 先除以半徑 ${fz(c.r)}，得 ${fz(dv(V, c.r))}；再除以半徑 ${fz(c.r)}，得 ${fz(dv(dv(V, c.r), c.r))}；最後除以圓周率 ${pis(c.pt)}，得 ${fz(H)}。高是 ${fz(H)} 公分。`,
        stem: `一個圓柱的體積是 ${f(V)} 立方公分，底面半徑是 ${f(c.r)} 公分，它的高是 ____ 公分。（${c.pt}）`, units: ["公分", "cm"],
        explain: `解析：底面積＝π×${f(c.r)}×${f(c.r)}＝${f(B)}，高＝體積÷底面積＝${f(V)}÷${f(B)}＝${f(H)}（公分）。` }, ans(H, fl));
    }))
  ]);

  reg("solids", "calc", [
    sp("solids-calc-L1-01", "calc", 1, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 10); if (!c) return null;
      const B = mul(c.pi, sq(c.r)); if (!nice(B, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（先算半徑乘半徑）：${fz(c.r)} × ${fz(c.r)} ＝ ${fz(sq(c.r))}，再乘圓周率 ${pis(c.pt)}，得 ${fz(B)} 平方公分。`,
        stem: `圓柱的底面半徑是 ${f(c.r)} 公分，它的底面積是多少平方公分？（${c.pt}）`, units: ["平方公分", "cm²"],
        explain: `解析：底面積＝π×${f(c.r)}×${f(c.r)}＝${f(B)}（平方公分）。` }, ans(B, fl));
    })),
    sp("solids-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 9); if (!c) return null;
      const H = lq(kit, fl, 3, 12), C = mul(mul(I(2), c.pi), c.r), lat = mul(C, H); if (!nice(lat, fl) || !nice(C, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（用展開圖）：圓柱側面展開是長方形，寬是高 ${fz(H)}，長是底面周長（直徑 ${fz(mul(I(2), c.r))} 乘圓周率 ${pis(c.pt)}）＝ ${fz(C)}，面積 ${fz(C)} × ${fz(H)} ＝ ${fz(lat)} 平方公分。`,
        stem: `圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，它的側面積是多少平方公分？（${c.pt}）`, units: ["平方公分", "cm²"],
        explain: `解析：底面周長＝2×π×${f(c.r)}＝${f(C)}，側面積＝周長×高＝${f(C)}×${f(H)}＝${f(lat)}（平方公分）。` }, ans(lat, fl));
    })),
    sp("solids-calc-L3-01", "calc", 3, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 8); if (!c) return null;
      const H = lq(kit, fl, 3, 12), B2 = mul(I(2), mul(c.pi, sq(c.r))), lat = mul(mul(I(2), mul(c.pi, c.r)), H), S = add(B2, lat); if (![B2, lat, S].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（用展開圖）：展開後是一個長方形和兩個圓。長方形的長是底面周長 ${fz(mul(mul(I(2), c.pi), c.r))}，寬是高 ${fz(H)}，面積 ${fz(lat)}；兩個圓共 ${fz(B2)}。合起來 ${fz(lat)} ＋ ${fz(B2)} ＝ ${fz(S)} 平方公分。`,
        stem: `圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，它的表面積（含上、下底面）是多少平方公分？（${c.pt}）`, units: ["平方公分", "cm²"],
        explain: `解析：兩個底面＝2×π×${f(c.r)}×${f(c.r)}＝${f(B2)}，側面＝2×π×${f(c.r)}×${f(H)}＝${f(lat)}，合計 ${f(S)}（平方公分）。` }, ans(S, fl));
    })),
    sp("solids-calc-L4-01", "calc", 4, "trap", kit => retry(kit, fl => {
      const A = lq(kit, fl, 250, 1000), H = lq(kit, fl, 20, 50), V = mul(A, H), L = dv(V, I(1000)); if (![V, L].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（用 10 公分當一個單位）：1 公升正好是邊長 10 公分的正方體。底面積 ${fz(A)} 平方公分是 ${fz(dv(A, I(100)))} 個「10 公分乘 10 公分」的方塊，高 ${fz(H)} 公分是 ${fz(dv(H, I(10)))} 個 10 公分。體積是 ${fz(dv(A, I(100)))} 乘 ${fz(dv(H, I(10)))}，得 ${fz(L)}，所以可以裝 ${fz(L)} 公升。`,
        stem: `一個柱形水箱的底面積是 ${f(A)} 平方公分，高是 ${f(H)} 公分，裝滿水可以裝幾公升的水？（1 公升＝1000 立方公分）`, units: ["公升", "L", "l"],
        explain: `解析：容積＝${f(A)}×${f(H)}＝${f(V)} 立方公分，${f(V)}÷1000＝${f(L)}（公升）。`,
        trapNote: `算出 ${f(V)} 是「立方公分」，不是公升。1 公升＝1000 立方公分，一定要再 ÷1000 才是公升。` }, ans(L, fl));
    })),
    sp("solids-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const c = circ(kit, fl, 5, 10); if (!c) return null;
      const r = sub(c.r, I(kit.int(2, 3))); if (!(r.n > 0)) return null;
      const H = lq(kit, fl, 4, 12), V = mul(mul(c.pi, sub(sq(c.r), sq(r))), H); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（先算圓環的面積）：外圓與內圓的面積差是 圓周率 ${pis(c.pt)} × (${fz(sq(c.r))} − ${fz(sq(r))}) ＝ ${fz(mul(c.pi, sub(sq(c.r), sq(r))))} 平方公分，再乘長 ${fz(H)}，得 ${fz(V)} 立方公分。`,
        stem: `一根空心圓柱形鋼管，外圍半徑 ${f(c.r)} 公分，中空部分的半徑 ${f(r)} 公分，長 ${f(H)} 公分。鋼管本身（不含中空）的體積是多少立方公分？（${c.pt}）`, units: ["立方公分", "cm³"],
        explain: `解析：大圓柱 π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(mul(mul(c.pi, sq(c.r)), H))}，中空小圓柱 π×${f(r)}×${f(r)}×${f(H)}＝${f(mul(mul(c.pi, sq(r)), H))}，相減＝${f(V)}（立方公分）。` }, ans(V, fl));
    }))
  ]);

  reg("solids", "word", [
    sp("solids-word-L2-01", "word", 2, "basic", kit => retry(kit, fl => {
      const a = lq(kit, fl, 20, 50), b = lq(kit, fl, 20, 50), h = lq(kit, fl, 20, 50), V = mul(mul(a, b), h), L = dv(V, I(1000)); if (![V, L].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（用 10 公分當一個單位）：1 公升正好是邊長 10 公分的正方體。魚缸長 ${fz(a)} 公分是 ${fz(dv(a, I(10)))} 個 10 公分，寬 ${fz(b)} 公分是 ${fz(dv(b, I(10)))} 個 10 公分，高 ${fz(h)} 公分是 ${fz(dv(h, I(10)))} 個 10 公分。體積是 ${fz(dv(a, I(10)))} 乘 ${fz(dv(b, I(10)))} 乘 ${fz(dv(h, I(10)))}，得 ${fz(L)}，所以可以裝 ${fz(L)} 公升。`,
        stem: `一個長方體魚缸，內部長 ${f(a)} 公分、寬 ${f(b)} 公分、高 ${f(h)} 公分。裝滿水可以裝幾公升？（1 公升＝1000 立方公分）`, units: ["公升", "L"],
        explain: `解析：容積＝${f(a)}×${f(b)}×${f(h)}＝${f(V)} 立方公分，${f(V)}÷1000＝${f(L)}（公升）。` }, ans(L, fl));
    })),
    sp("solids-word-L3-01", "word", 3, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 10, 30), B = mul(c.pi, sq(c.r)), lat = mul(mul(I(2), mul(c.pi, c.r)), H), S = add(B, lat); if (![B, lat, S, add(S, B)].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（先當成有蓋再減掉）：先算有蓋的表面積，兩個底 ${fz(mul(I(2), B))} ＋ 側面 ${fz(lat)} ＝ ${fz(add(S, B))} 平方公分，再減去不用漆的蓋子 ${fz(B)} 平方公分，得 ${fz(S)} 平方公分。`,
        stem: `一個無蓋的圓柱形鐵桶，底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分。要在桶子的外面（含桶底、不含上蓋）漆上油漆，需要漆多少平方公分？（${c.pt}）`, units: ["平方公分", "cm²"],
        explain: `解析：只有一個底面：π×${f(c.r)}×${f(c.r)}＝${f(B)}；側面：2×π×${f(c.r)}×${f(H)}＝${f(lat)}；合計 ${f(S)}（平方公分）。`,
        trapNote: `題目說「無蓋」，所以只有一個底面。若照表面積公式算兩個底面，會多算一個圓 (${f(B)})，得到 ${f(add(S, B))}。` }, ans(S, fl));
    })),
    sp("solids-word-L3-02", "word", 3, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 5, 10), H = lq(kit, fl, 20, 50); if (!c) return null;
      const V = mul(mul(c.pi, sq(c.r)), H), L = dv(V, I(1000)); if (![V, L].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（用 10 公分當一個單位）：1 公升正好是邊長 10 公分的正方體。半徑 ${fz(c.r)} 公分是 ${fz(dv(c.r, I(10)))} 個 10 公分，高 ${fz(H)} 公分是 ${fz(dv(H, I(10)))} 個 10 公分。體積是 ${pis(c.pt)} 乘 ${fz(dv(c.r, I(10)))} 乘 ${fz(dv(c.r, I(10)))} 乘 ${fz(dv(H, I(10)))}，得 ${fz(L)}，所以可以裝 ${fz(L)} 公升。`,
        stem: `一個圓柱形水桶，底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分，裝滿水可以裝幾公升？（${c.pt}，1 公升＝1000 立方公分）`, units: ["公升", "L"],
        explain: `解析：容積＝π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(V)} 立方公分，${f(V)}÷1000＝${f(L)}（公升）。` }, ans(L, fl));
    })),
    sp("solids-word-L4-01", "word", 4, "extend", kit => retry(kit, fl => {
      const c = circ(kit, fl, 5, 10); if (!c) return null;
      const h1 = lq(kit, fl, 8, 20), d = lq(kit, fl, 2, 6), V = mul(mul(c.pi, sq(c.r)), d), h2 = add(h1, d); if (![V, h2].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（換個順序乘）：先算圓周率乘上升的高度：${pis(c.pt)} × ${fz(d)} ＝ ${fz(mul(c.pi, d))}，再乘半徑兩次：${fz(mul(c.pi, d))} × ${fz(c.r)} × ${fz(c.r)} ＝ ${fz(V)}。石頭體積是 ${fz(V)} 立方公分。`,
        stem: `圓柱形水桶的底面半徑是 ${f(c.r)} 公分，裡面原有 ${f(h1)} 公分深的水。把一塊石頭完全放入水中後（水沒有溢出），水深變成 ${f(h2)} 公分。這塊石頭的體積是多少立方公分？（${c.pt}）`, units: ["立方公分", "cm³"],
        explain: `解析：水位上升 ${f(h2)}−${f(h1)}＝${f(d)} 公分，石頭體積＝上升的那一段水的體積＝π×${f(c.r)}×${f(c.r)}×${f(d)}＝${f(V)}（立方公分）。` }, ans(V, fl));
    })),
    sp("solids-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 8, 20), n = kit.int(3, 8), a = lq(kit, fl, 10, 50), b = lq(kit, fl, 10, 25), cup = mul(mul(c.pi, sq(c.r)), H), tot = mul(cup, I(n)), ab = mul(a, b), dep = dv(tot, ab);
      if (![cup, tot, ab, dep].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（先算一杯升多高）：一杯水是 ${fz(cup)} 立方公分，倒進底面積 ${fz(ab)} 平方公分的水槽，水深升 ${fz(cup)} ÷ ${fz(ab)} ＝ ${fz(dv(cup, ab))} 公分；倒了 ${n} 杯，共升 ${fz(dv(cup, ab))} × ${n} ＝ ${fz(dep)} 公分。`,
        stem: `圓柱形杯子的底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分，用它裝滿水後，倒進一個空的長方體水槽（內底長 ${f(a)} 公分、寬 ${f(b)} 公分），共倒了 ${n} 杯。水槽裡的水深是多少公分？（${c.pt}，水不溢出）`, units: ["公分", "cm"],
        explain: `解析：一杯水＝π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(cup)} 立方公分，${n} 杯＝${f(tot)}；水槽底面積＝${f(a)}×${f(b)}＝${f(ab)}；水深＝${f(tot)}÷${f(ab)}＝${f(dep)}（公分）。` }, ans(dep, fl));
    }))
  ]);
  /* 教材式 □ 未知數題（規格第 14 節） */
  reg("solids", "box", [
    sp("solids-box-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const a = lq(kit, fl, 3, 10), b = lq(kit, fl, 3, 10), h = lq(kit, fl, 2, 9), V = mul(mul(a, b), h); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（依序除回去）：體積 ${fz(V)} 先除以長 ${fz(a)}，得 ${fz(dv(V, a))}；再除以寬 ${fz(b)}，得 ${fz(h)}。所以高 □ 是 ${fz(h)} 公分。`,
        stem: `體積 ${f(V)} 立方公分的長方體，長 ${f(a)} 公分、寬 ${f(b)} 公分，高 □ 公分。□ ＝ ?`, units: ["公分", "cm"],
        explain: `解析：長方體的體積＝長×寬×高，所以 ${f(a)} × ${f(b)} × □ ＝ ${f(V)}，□ ＝ ${f(V)} ÷ ${f(mul(a, b))} ＝ ${f(h)}（公分）。` }, ans(h, fl));
    })),
    sp("solids-box-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const A = lq(kit, fl, 12, 30), h = lq(kit, fl, 3, 12), V = mul(A, h); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（先看一半）：體積的一半是 ${fz(dv(V, I(2)))} 立方公分，每升高 1 公分多 ${fz(A)} 立方公分，一半的體積需要升高 ${fz(dv(dv(V, I(2)), A))} 公分，另一半也一樣，合起來高 □ 是 ${fz(h)} 公分。`,
        stem: `底面積 ${f(A)} 平方公分、高 □ 公分的直立柱體，體積是 ${f(V)} 立方公分。□ ＝ ?`, units: ["公分", "cm"],
        explain: `解析：柱體的體積＝底面積×高，所以 ${f(A)} × □ ＝ ${f(V)}，□ ＝ ${f(V)} ÷ ${f(A)} ＝ ${f(h)}（公分）。` }, ans(h, fl));
    })),
    sp("solids-box-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const b = lq(kit, fl, 6, 12), h = lq(kit, fl, 4, 8), H = lq(kit, fl, 5, 12), B = dv(mul(b, h), I(2)), V = mul(B, H); if (!nice(V, fl) || !nice(B, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（依序除回去）：體積 ${fz(V)} 先除以底 ${fz(b)}，得 ${fz(dv(V, b))}；再除以三角形的高 ${fz(h)}，得 ${fz(dv(dv(V, b), h))}；最後乘 2，得 ${fz(H)}。所以柱高 □ 是 ${fz(H)} 公分。`,
        stem: `直立三角柱的底面三角形底 ${f(b)} 公分、高 ${f(h)} 公分，柱高 □ 公分，體積是 ${f(V)} 立方公分。□ ＝ ?`, units: ["公分", "cm"],
        explain: `解析：三角柱的底面積＝${f(b)}×${f(h)}÷2＝${f(B)}，體積＝底面積×柱高，所以 ${f(B)} × □ ＝ ${f(V)}，□ ＝ ${f(V)} ÷ ${f(B)} ＝ ${f(H)}（公分）。` }, ans(H, fl));
    })),
    sp("solids-box-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 4, 12), B = mul(c.pi, sq(c.r)), V = mul(B, H); if (!nice(V, fl) || !nice(B, fl)) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, c.r, [sq(c.r), mul(c.r, I(2)), dv(c.r, I(2)), B, add(c.r, I(1))], fl, " 公分");
      return { explain2: `解法二（代入檢查）：把選項的半徑代進體積公式。代入 ${f(c.r)}：半徑乘半徑得 ${fz(sq(c.r))}，乘圓周率 ${pis(c.pt)} 得 ${fz(B)}，再乘高 ${fz(H)} 得 ${fz(V)}，和題目的體積相同，所以半徑是 ${f(c.r)} 公分。`,
        stem: `圓柱的高是 ${f(H)} 公分，體積是 ${f(V)} 立方公分，底面半徑是 □ 公分。□ 是多少？（${c.pt}）`, options: o.options, answer: 0,
        explain: `解析：圓柱的體積＝底面積×高，所以底面積＝${f(V)} ÷ ${f(H)} ＝ ${f(B)}；底面積＝π × □ × □，所以 □ × □ ＝ ${f(sq(c.r))}，自己乘自己等於它的數是 □ ＝ ${f(c.r)}（公分）。`,
        trapNote: `算到 □ × □ ＝ ${f(sq(c.r))} 就要停下來想：什麼數自己乘自己得到它？答案是 ${f(c.r)}。常見錯誤是把 ${f(sq(c.r))} 當半徑，或把半徑和直徑 (${f(mul(c.r, I(2)))}) 弄混。` };
    })),
    sp("solids-box-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 4, 12), B = mul(c.pi, sq(c.r)), V = mul(B, H), bad = kit.pick([mul(c.r, I(2)), sq(c.r)]); if (!nice(V, fl) || !nice(bad, fl) || qv(bad) === qv(c.r)) return null;
      const f = x => sh(x, fl), head = `圓柱的高是 ${f(H)} 公分，體積是 ${f(V)} 立方公分（${c.pt}），則底面半徑 □ ＝`;
      const r = tfQ(kit, ok => `解法二（代入檢查）：把 □ ＝ ${fz(ok ? c.r : bad)} 代進體積公式，${fz(ok ? c.r : bad)} 乘 ${fz(ok ? c.r : bad)} 得 ${fz(sq(ok ? c.r : bad))}，乘圓周率 ${pis(c.pt)} 得 ${fz(mul(c.pi, sq(ok ? c.r : bad)))}，再乘高 ${fz(H)} 得 ${fz(mul(mul(c.pi, sq(ok ? c.r : bad)), H))}，${ok ? "剛好等於" : "不等於"}題目的 ${fz(V)} 立方公分，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${head} ${f(c.r)} 公分。`, `正確：體積÷高＝底面積，${f(V)}÷${f(H)}＝${f(B)}，底面積÷圓周率＝半徑×半徑，所以 □×□＝${f(sq(c.r))}，□＝${f(c.r)}。`],
        [`${head} ${f(bad)} 公分。`, `錯誤：由體積和高可以算出 □×□＝${f(sq(c.r))}，所以半徑是 ${f(c.r)}；敘述的 ${f(bad)} 其實是${qv(bad) === qv(sq(c.r)) ? "半徑的平方" : "直徑"}。`]);
      r.trapNote = "由底面積求半徑時，要找「自己乘自己等於它」的數；不要把半徑的平方、直徑當成半徑。";
      return r;
    })),
    sp("solids-box-word-L3-01", "word", 3, "basic", kit => retry(kit, fl => {
      const a = lq(kit, fl, 20, 50), b = lq(kit, fl, 20, 50), L = lq(kit, fl, 5, 30), dep = dv(mul(L, I(1000)), mul(a, b)); if (!nice(dep, fl) || !nice(mul(a, b), fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（用 10 公分當一個單位）：1 公升正好是邊長 10 公分的正方體。水槽底面積 ${fz(mul(a, b))} 平方公分是 ${fz(dv(mul(a, b), I(100)))} 個「10 公分乘 10 公分」的方塊，倒入 ${fz(L)} 公升就是 ${fz(L)} 個 10 公分的正方體，水深是 ${fz(L)} 除以 ${fz(dv(mul(a, b), I(100)))}，得 ${fz(dv(dep, I(10)))} 個 10 公分，也就是 ${fz(dep)} 公分。`,
        stem: `長方體水槽的內底長 ${f(a)} 公分、寬 ${f(b)} 公分，倒入 ${f(L)} 公升的水（1 公升＝1000 立方公分），水深 □ 公分。□ ＝ ?`, units: ["公分", "cm"],
        explain: `解析：水量＝${f(L)}×1000＝${f(mul(L, I(1000)))} 立方公分，${f(a)} × ${f(b)} × □ ＝ ${f(mul(L, I(1000)))}，□ ＝ ${f(mul(L, I(1000)))} ÷ ${f(mul(a, b))} ＝ ${f(dep)}（公分）。` }, ans(dep, fl));
    })),
    sp("solids-box-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const S = lq(kit, fl, 20, 40), D = lq(kit, fl, 2, 10), big = dv(add(S, D), I(2)), sm = dv(sub(S, D), I(2)); if (!nice(big, fl) || !nice(sm, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（先平分再調整）：假設長和寬一樣，各是 ${fz(S)} ÷ 2 ＝ ${fz(dv(S, I(2)))} 公分；長要多出差的一半 ${fz(D)} ÷ 2 ＝ ${fz(dv(D, I(2)))} 公分，所以 □ ＝ ${fz(dv(S, I(2)))} ＋ ${fz(dv(D, I(2)))} ＝ ${fz(big)} 公分。`,
        stem: `長方體底面的長是 □ 公分、寬是 △ 公分。□ ＋ △ ＝ ${f(S)}，□ － △ ＝ ${f(D)}。□ ＝ ?`, units: ["公分", "cm"],
        explain: `解析：和加差得 2 個 □＝${f(S)}＋${f(D)}＝${f(add(S, D))}，□ ＝ ${f(add(S, D))} ÷ 2 ＝ ${f(big)}（公分）。（△ ＝ ${f(sm)}）` }, ans(big, fl));
    })),
    sp("solids-box-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const c = circ(kit, fl, 5, 10); if (!c) return null;
      const d = lq(kit, fl, 2, 6), V = mul(mul(c.pi, sq(c.r)), d); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ explain2: `解法二（依序除回去）：體積 ${fz(V)} 先除以半徑 ${fz(c.r)}，得 ${fz(dv(V, c.r))}；再除以半徑 ${fz(c.r)}，得 ${fz(dv(dv(V, c.r), c.r))}；最後除以圓周率 ${pis(c.pt)}，得 ${fz(d)}。水位上升了 ${fz(d)} 公分。`,
        stem: `圓柱形水桶的底面半徑是 ${f(c.r)} 公分，把一塊體積 ${f(V)} 立方公分的石頭完全放入水中（水沒有溢出），水位上升了 □ 公分。□ ＝ ?（${c.pt}）`, units: ["公分", "cm"],
        explain: `解析：桶底面積＝π×${f(c.r)}×${f(c.r)}＝${f(mul(c.pi, sq(c.r)))}，${f(mul(c.pi, sq(c.r)))} × □ ＝ ${f(V)}，□ ＝ ${f(d)}（公分）。` }, ans(d, fl));
    })),
    sp("solids-box-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const a = lq(kit, fl, 3, 9), b = lq(kit, fl, 3, 9), h = lq(kit, fl, 2, 8), S = mul(I(2), add(add(mul(a, b), mul(a, h)), mul(b, h)));
      if (![S, mul(a, b), add(a, b)].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl), wrong = dv(S, mul(a, b));
      return Object.assign({ explain2: `解法二（上下兩面和側面分開算）：上下兩面共 2 乘 ${fz(a)} 乘 ${fz(b)} ＝ ${fz(mul(I(2), mul(a, b)))}，剩下的 ${fz(sub(S, mul(I(2), mul(a, b))))} 是四個側面。四個側面合起來是底面周長 ${fz(mul(I(2), add(a, b)))} 乘高，所以高 □ 是 ${fz(sub(S, mul(I(2), mul(a, b))))} 除以 ${fz(mul(I(2), add(a, b)))}，得 ${fz(h)} 公分。`,
        stem: `長 ${f(a)} 公分、寬 ${f(b)} 公分、高 □ 公分的長方體，表面積是 ${f(S)} 平方公分。□ ＝ ?`, units: ["公分", "cm"],
        explain: `解析：表面積＝2×(長×寬＋長×高＋寬×高)，所以 ${f(a)}×${f(b)}＋(${f(a)}＋${f(b)})×□ ＝ ${f(S)}÷2 ＝ ${f(dv(S, I(2)))}；(${f(a)}＋${f(b)})×□ ＝ ${f(sub(dv(S, I(2)), mul(a, b)))}，□ ＝ ${f(h)}（公分）。`,
        trapNote: `表面積有六個面，要用 2×(長×寬＋長×高＋寬×高)。不能用體積的算法（把 ${f(S)} 除以底面積 ${f(mul(a, b))}，會得到 ${sh(wrong, fl)}）。` }, ans(h, fl));
    }))
  ]);
})();
