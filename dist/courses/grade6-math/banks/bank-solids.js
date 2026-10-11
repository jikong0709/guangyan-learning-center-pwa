/* 題庫：solids（角柱與圓柱的體積、表面積、展開圖；圓柱 π 取 3.14，半徑為 7 的倍數時可取 22/7）｜題庫工 C
   數字風格（規格第 11 節）：邊長／半徑用整數、小數（3.5 公分）、分數、帶分數，全部以 kit.Q 精確運算。 */
(function () {
  "use strict";
  /* 共用後處理：(1) 答案為無限小數時題幹加「請以分數作答」(2) 可見文字不得出現分母>60 的分數或 9 位以上數字（重抽） */
  function visOK(r) {
    const t = [r.stem, r.explain, r.trapNote || "", String(r.answer), (r.accepted || []).join(" "), (r.options || []).join(" ")].join(" ");
    if (/\d{9,}/.test(t)) return false;
    const re = /(\d+)\/(\d+)/g; let m; while ((m = re.exec(t))) if (+m[2] > 60) return false;
    return true;
  }
  function needFrac(r) {
    const m = /(\d+)\/(\d+)/.exec(String(r.answer)); if (!m) return false;
    let d = +m[2]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d > 1;
  }
  function wrapSpec(s) {
    return Object.assign({}, s, { gen(kit) {
      let r;
      for (let i = 0; i < 300; i++) { r = s.gen(kit); if (visOK(r)) break; }
      if ((s.type === "fill" || s.type === "calc" || s.type === "word") && needFrac(r) && r.stem.indexOf("分數作答") < 0) r.stem += "（請以分數作答）";
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
  function nice(a, fl) {
    if (!a || !(a.n > 0)) return false;
    if (isF(fl)) return a.d <= 24 && a.n < 5000;
    const v = qv(a); return ExamKit.qIsTerminating(a) && Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-7 && a.n < 1e8;
  }
  const sh = (a, fl) => isF(fl) ? ExamKit.qMixed(a) : ExamKit.qShow(a, "dec");
  const ans = (a, fl) => ExamKit.qAnswer(a, isF(fl) ? "mixed" : "dec");
  function retry(kit, build) {
    const f0 = kit.flavor(FLS, FW);
    for (const fl of [f0, "int"]) for (let i = 0; i < 800; i++) { const r = build(fl); if (r) return r; }
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
  function multiQ(kit, head, trues, falses) {
    const nt = kit.int(2, Math.min(3, trues.length));
    const nf = nt === 2 ? kit.int(2, 3) : 2;
    const all = kit.shuffle(kit.shuffle(trues).slice(0, nt).map(x => ({ x, ok: 1 })).concat(kit.shuffle(falses).slice(0, nf).map(x => ({ x, ok: 0 }))));
    return {
      stem: head + "\n請選出所有正確的敘述（複選）。",
      options: all.map(o => o.x[0]),
      answer: all.map((o, i) => o.ok ? i : -1).filter(i => i >= 0),
      explain: "解析：\n" + all.map(o => (o.ok ? "【正確】" : "【錯誤】") + o.x[0] + "：" + o.x[1]).join("\n")
    };
  }
  function tfQ(kit, okItem, badItem) {
    const ok = kit.int(0, 1) === 1; const it = ok ? okItem : badItem;
    return { stem: "判斷下列敘述是否正確：\n" + it[0], answer: ok, explain: "解析：" + it[1] };
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
      return { stem: `一個直立柱體的底面積是 ${f(A)} 平方公分，高是 ${f(H)} 公分，它的體積是多少立方公分？`, options: o.options, answer: 0,
        explain: `解析：柱體體積＝底面積×高＝${f(A)}×${f(H)}＝${f(V)}（立方公分）。` };
    })),
    sp("solids-single-L2-01", "single", 2, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 4, 12), B = mul(c.pi, sq(c.r)), V = mul(B, H); if (!nice(V, fl) || !nice(B, fl)) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, V, [mul(V, I(4)), mul(mul(c.pi, c.r), H), dv(V, I(3)), mul(mul(I(2), mul(c.pi, c.r)), H), B], fl, " 立方公分");
      return { stem: `一個圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，體積是多少立方公分？（${c.pt}）`, options: o.options, answer: 0,
        explain: `解析：底面積＝π×${f(c.r)}×${f(c.r)}＝${f(B)}（平方公分），體積＝底面積×高＝${f(B)}×${f(H)}＝${f(V)}（立方公分）。` };
    })),
    sp("solids-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 8); if (!c) return null;
      const H = lq(kit, fl, 4, 12), B = mul(c.pi, sq(c.r)), lat = mul(mul(I(2), mul(c.pi, c.r)), H), S = add(mul(I(2), B), lat), V = mul(B, H);
      if (![B, lat, S, V].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, S, [V, lat, mul(I(2), B), add(B, lat), add(lat, mul(I(2), mul(c.pi, c.r))), dv(S, I(2))], fl, " 平方公分");
      return { stem: `一個圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，它的表面積（含上、下兩個底面）是多少平方公分？（${c.pt}）`, options: o.options, answer: 0,
        explain: `解析：兩個底面積＝2×π×${f(c.r)}×${f(c.r)}＝${f(mul(I(2), B))}；側面積＝底面周長×高＝2×π×${f(c.r)}×${f(H)}＝${f(lat)}；表面積＝${f(mul(I(2), B))}＋${f(lat)}＝${f(S)}（平方公分）。`,
        trapNote: `體積（${f(V)} 立方公分）和表面積是不同的量。常見錯誤：把體積當表面積、只算側面積 (${f(lat)})、或只算一個底面 (${f(add(B, lat))})。表面積＝兩個底面＋側面。` };
    })),
    sp("solids-single-L4-01", "single", 4, "trap", kit => retry(kit, fl => {
      const k = fl === "int" ? I(kit.int(1, 3)) : fl === "dec" ? Qn(kit.pick([1, 3, 5]), 2) : Qn(kit.pick([1, 3, 5, 3]), kit.pick([2, 2, 4])), H = lq(kit, fl, 5, 12);
      const a = mul(I(3), k), b = mul(I(4), k), c = mul(I(5), k), B = dv(mul(a, b), I(2)), P = add(add(a, b), c), S = add(mul(I(2), B), mul(P, H)), V = mul(B, H);
      if (![a, b, c, B, P, S, V].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, S, [V, add(B, mul(P, H)), add(mul(I(2), mul(a, b)), mul(P, H)), add(mul(I(2), B), mul(add(a, b), H)), mul(P, H), add(add(mul(I(2), B), mul(P, H)), V)], fl, " 平方公分");
      return { stem: `直立三角柱的底面是直角三角形，三邊長分別是 ${f(a)}、${f(b)}、${f(c)} 公分，柱高是 ${f(H)} 公分，它的表面積是多少平方公分？`, options: o.options, answer: 0,
        explain: `解析：底面積＝${f(a)}×${f(b)}÷2＝${f(B)}，兩個底面＝${f(mul(I(2), B))}；底面周長＝${f(a)}＋${f(b)}＋${f(c)}＝${f(P)}，側面積＝${f(P)}×${f(H)}＝${f(mul(P, H))}；表面積＝${f(mul(I(2), B))}＋${f(mul(P, H))}＝${f(S)}（平方公分）。`,
        trapNote: `三個側面都要算（寬分別是 ${f(a)}、${f(b)}、${f(c)}），不能漏掉斜邊那一面；也別忘了三角形面積要 ÷2，且有上、下兩個底面。把體積 ${f(V)} 當成表面積更是錯的。` };
    })),
    sp("solids-single-L5-01", "single", 5, "extend", kit => retry(kit, fl => {
      const a = fl === "int" ? I(kit.pick([2, 3])) : fl === "dec" ? Qn(kit.pick([3, 5, 1]), 2) : Qn(kit.pick([1, 3, 2]), kit.pick([2, 3])),
        b = fl === "int" ? I(kit.pick([2, 3, 4])) : fl === "dec" ? Qn(kit.pick([3, 5, 1, 2]), kit.pick([2, 2, 1])) : Qn(kit.pick([1, 3, 3]), kit.pick([2, 4, 2]));
      if (a.n === 0 || b.n === 0) return null;
      const ans0 = mul(sq(a), b); if (!nice(ans0, fl)) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, ans0, [mul(a, b), add(a, b), add(sq(a), b), mul(a, sq(b)), mul(sq(a), a), add(sq(a), mul(a, b))], fl, " 倍");
      return { stem: `一個圓柱，如果底面半徑變成原來的 ${f(a)} 倍，高變成原來的 ${f(b)} 倍，體積會變成原來的幾倍？`, options: o.options, answer: 0,
        explain: `解析：體積＝π×半徑×半徑×高。半徑變 ${f(a)} 倍，半徑²變 ${f(a)}×${f(a)}＝${f(sq(a))} 倍；高變 ${f(b)} 倍；體積變 ${f(sq(a))}×${f(b)}＝${f(ans0)} 倍。` };
    }))
  ]);

  reg("solids", "multi", [
    sp("solids-multi-L2-01", "multi", 2, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 9); if (!c) return null;
      const C = mul(mul(I(2), c.pi), c.r), B = mul(c.pi, sq(c.r)); if (!nice(C, fl) || !nice(B, fl) || qv(C) === qv(B)) return null;
      const f = x => sh(x, fl);
      return multiQ(kit, `關於柱體與圓柱（${c.pt}）：`, [
        ["柱體的體積＝底面積×高", "這是所有直立柱體共同的公式。"],
        ["圓柱的側面展開後是長方形", "長方形的長是底面周長，寬是圓柱的高。"],
        ["圓柱的上、下兩個底面是全等的圓", "兩個底面形狀、大小都相同。"],
        [`半徑 ${f(c.r)} 公分的圓柱，底面周長是 ${f(C)} 公分`, `2×π×${f(c.r)}＝${f(C)}。`]
      ], [
        ["圓柱的體積＝底面積×高÷3", "÷3 是錐體的公式，柱體不用除以 3。"],
        ["圓柱的側面展開後是三角形", "側面展開是長方形。"],
        ["圓柱的上底面比下底面小", "兩個底面全等。"],
        [`半徑 ${f(c.r)} 公分的圓柱，底面周長是 ${f(B)} 公分`, `${f(B)} 是底面積；周長是 2×π×${f(c.r)}＝${f(C)}。`]
      ]);
    })),
    sp("solids-multi-L3-01", "multi", 3, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 8); if (!c) return null;
      const H = lq(kit, fl, 9, 15), r = c.r, B = mul(c.pi, sq(r)), lat = mul(mul(I(2), mul(c.pi, r)), H), S = add(mul(I(2), B), lat), V = mul(B, H), v2 = mul(mul(c.pi, r), H), t1 = add(lat, B), t2 = mul(I(2), lat);
      if (![B, lat, S, V, v2, t1, t2].every(x => nice(x, fl))) return null;
      if (qv(V) === qv(lat) || qv(lat) === qv(mul(I(2), B)) || qv(V) === qv(v2) || qv(S) === qv(V)) return null;
      const f = x => sh(x, fl);
      const q = multiQ(kit, `圓柱的底面半徑是 ${f(r)} 公分，高是 ${f(H)} 公分（${c.pt}）。`, [
        [`一個底面的面積是 ${f(B)} 平方公分`, `π×${f(r)}×${f(r)}＝${f(B)}。`],
        [`側面積是 ${f(lat)} 平方公分`, `底面周長×高＝2×π×${f(r)}×${f(H)}＝${f(lat)}。`],
        [`表面積是 ${f(S)} 平方公分`, `兩個底面＋側面＝${f(mul(I(2), B))}＋${f(lat)}＝${f(S)}。`],
        [`體積是 ${f(V)} 立方公分`, `底面積×高＝${f(B)}×${f(H)}＝${f(V)}。`]
      ], [
        [`體積是 ${f(v2)} 立方公分`, `漏乘了一次半徑，體積應是 ${f(V)}。`],
        [`側面積是 ${f(V)} 平方公分`, `${f(V)} 是體積；側面積是 ${f(lat)}。`],
        [`表面積是 ${f(t1)} 平方公分`, `只算了一個底面，上、下兩個底面都要算，是 ${f(S)}。`],
        [`表面積是 ${f(t2)} 平方公分`, `表面積是兩個底面＋側面＝${f(S)}。`]
      ]);
      q.trapNote = "體積（立方公分）、側面積、表面積（平方公分）是三個不同的量：側面積＝底面周長×高，表面積＝側面積＋兩個底面積，體積＝底面積×高。";
      return q;
    })),
    sp("solids-multi-L3-02", "multi", 3, "trap", kit => {
      const n = kit.pick([3, 4, 5, 6]);
      const q = multiQ(kit, `有一個直立 ${n} 角柱。`, [
        [`它有 ${n + 2} 個面`, `${n} 個側面＋上、下 2 個底面＝${n + 2}。`],
        [`它有 ${3 * n} 條邊`, `上底 ${n} 條＋下底 ${n} 條＋${n} 條側稜＝${3 * n}。`],
        [`它有 ${2 * n} 個頂點`, `上、下底面各有 ${n} 個頂點。`],
        [`它的展開圖有 2 個 ${n} 邊形和 ${n} 個長方形`, `兩個底面是 ${n} 邊形，${n} 個側面是長方形。`]
      ], [
        [`它有 ${n + 1} 個面`, `別忘了上、下兩個底面，共 ${n + 2} 個面。`],
        [`它有 ${2 * n} 條邊`, `共 ${3 * n} 條邊（上底 ${n}＋下底 ${n}＋側稜 ${n}）。`],
        [`它有 ${n + 2} 個頂點`, `頂點數是 ${2 * n}，${n + 2} 是面數。`],
        [`它的展開圖有 2 個 ${n} 邊形和 ${n + 1} 個長方形`, `側面有 ${n} 個長方形。`]
      ]);
      q.trapNote = "角柱的面數＝底面邊數＋2，邊數＝底面邊數×3，頂點數＝底面邊數×2。面數與頂點數很容易搞混，可用長方體（4 角柱：6 面、12 邊、8 頂點）檢查。";
      return q;
    }),
    sp("solids-multi-L4-01", "multi", 4, "basic", kit => retry(kit, fl => {
      const a = lq(kit, fl, 20, 50), b = lq(kit, fl, 20, 50), h = lq(kit, fl, 20, 50), V = mul(mul(a, b), h), L = dv(V, I(1000)), L10 = mul(L, I(10)), ab = mul(a, b), s3 = add(add(a, b), h), ab2 = mul(ab, I(2));
      if (![V, L, L10, ab, s3, ab2].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return multiQ(kit, `一個長方體水槽，內部長 ${f(a)} 公分、寬 ${f(b)} 公分、高 ${f(h)} 公分。`, [
        [`它的容積是 ${f(V)} 立方公分`, `${f(a)}×${f(b)}×${f(h)}＝${f(V)}。`],
        [`它的容積是 ${f(L)} 公升`, `${f(V)}÷1000＝${f(L)}（1 公升＝1000 立方公分）。`],
        [`底面積是 ${f(ab)} 平方公分`, `${f(a)}×${f(b)}＝${f(ab)}。`],
        ["1 公升等於 1000 立方公分", "這是容量與體積的換算關係。"]
      ], [
        [`它的容積是 ${f(L10)} 公升`, `${f(V)}÷1000＝${f(L)}，不是 ${f(L10)}。`],
        [`它的容積是 ${f(s3)} 立方公分`, "體積要用長×寬×高，不能相加。"],
        [`底面積是 ${f(ab2)} 平方公分`, `底面積是 ${f(a)}×${f(b)}＝${f(ab)}。`],
        ["1 公升等於 100 立方公分", "1 公升＝1000 立方公分。"]
      ]);
    })),
    sp("solids-multi-L5-01", "multi", 5, "extend", kit => retry(kit, fl => {
      const k = fl === "int" ? I(kit.pick([2, 3])) : fl === "dec" ? Qn(kit.pick([3, 5]), 2) : Qn(kit.pick([1, 3, 2]), kit.pick([2, 3]));
      const k2 = sq(k), k3 = mul(k2, k); if (![k, k2, k3].every(x => nice(x, fl)) || qv(k) === 1 || qv(k2) === qv(k) || qv(k3) === qv(k2)) return null;
      const f = x => sh(x, fl), c = kit.pick([[2, 3]]);
      return multiQ(kit, `把一個圓柱的尺寸變動後，比較變動前後（只看比例，不需代入 π）。`, [
        [`半徑變成 ${f(k)} 倍、高不變，體積變成 ${f(k2)} 倍`, `半徑平方：${f(k)}×${f(k)}＝${f(k2)} 倍。`],
        [`高變成 ${f(k)} 倍、半徑不變，體積變成 ${f(k)} 倍`, "體積與高成正比。"],
        [`半徑和高都變成 ${f(k)} 倍，體積變成 ${f(k3)} 倍`, `${f(k2)}×${f(k)}＝${f(k3)} 倍。`],
        [`半徑變成 ${f(k)} 倍，底面周長也變成 ${f(k)} 倍`, "周長＝2×π×半徑，和半徑成正比。"],
        [`半徑和高都變成 ${f(k)} 倍，表面積變成 ${f(k2)} 倍`, `每個面的長、寬都變成 ${f(k)} 倍，面積變成 ${f(k2)} 倍。`]
      ], [
        [`半徑變成 ${f(k)} 倍、高不變，體積變成 ${f(k)} 倍`, `底面積與半徑平方成正比，應是 ${f(k2)} 倍。`],
        [`半徑和高都變成 ${f(k)} 倍，體積變成 ${f(k2)} 倍`, `應是 ${f(k3)} 倍。`],
        [`半徑變成 ${f(k)} 倍，底面積也變成 ${f(k)} 倍`, `底面積應變成 ${f(k2)} 倍。`],
        [`半徑和高都變成 ${f(k)} 倍，表面積變成 ${f(k3)} 倍`, `表面積是面積，變成 ${f(k2)} 倍。`]
      ]);
    }))
  ]);

  reg("solids", "tf", [
    sp("solids-tf-L1-01", "tf", 1, "basic", kit => retry(kit, fl => {
      const A = lq(kit, fl, 12, 30), H = lq(kit, fl, 4, 12), V = mul(A, H), bad = add(A, H); if (!nice(V, fl) || !nice(bad, fl)) return null;
      const f = x => sh(x, fl), head = `底面積 ${f(A)} 平方公分、高 ${f(H)} 公分的直立柱體，體積是`;
      return tfQ(kit,
        [`${head} ${f(V)} 立方公分。`, `正確：${f(A)}×${f(H)}＝${f(V)}。`],
        [`${head} ${f(bad)} 立方公分。`, `錯誤：體積＝底面積×高＝${f(A)}×${f(H)}＝${f(V)}，不是相加。`]);
    })),
    sp("solids-tf-L2-01", "tf", 2, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 4, 12), B = mul(c.pi, sq(c.r)), V = mul(B, H), bad = kit.pick([mul(mul(c.pi, c.r), H), mul(V, I(4)), mul(V, I(2))]);
      if (![V, bad].every(x => nice(x, fl)) || qv(bad) === qv(V)) return null;
      const f = x => sh(x, fl), head = `圓柱的底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分（${c.pt}），體積是`;
      return tfQ(kit,
        [`${head} ${f(V)} 立方公分。`, `正確：π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(V)}。`],
        [`${head} ${f(bad)} 立方公分。`, `錯誤：體積＝π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(V)} 立方公分。`]);
    })),
    sp("solids-tf-L3-01", "tf", 3, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 8); if (!c) return null;
      const H = lq(kit, fl, 4, 12), lat = mul(mul(I(2), mul(c.pi, c.r)), H), V = mul(mul(c.pi, sq(c.r)), H);
      if (![lat, V].every(x => nice(x, fl)) || qv(lat) === qv(V)) return null;
      const f = x => sh(x, fl), head = `圓柱的底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分（${c.pt}），側面積是`;
      const q = tfQ(kit,
        [`${head} ${f(lat)} 平方公分。`, `正確：側面積＝底面周長×高＝2×π×${f(c.r)}×${f(H)}＝${f(lat)}。`],
        [`${head} ${f(V)} 平方公分。`, `錯誤：${f(V)} 是體積（底面積×高）；側面積＝底面周長×高＝${f(lat)} 平方公分。`]);
      q.trapNote = "側面積＝底面「周長」×高；體積＝底面「面積」×高。周長與面積、平方公分與立方公分都要分清楚。";
      return q;
    })),
    sp("solids-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const b = lq(kit, fl, 6, 12), h = lq(kit, fl, 4, 8), H = lq(kit, fl, 5, 12), V = dv(mul(mul(b, h), H), I(2)), bad = mul(mul(b, h), H); if (![V, bad].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl), head = `直立三角柱的底面三角形底 ${f(b)} 公分、高 ${f(h)} 公分，柱高 ${f(H)} 公分，體積是`;
      const q = tfQ(kit,
        [`${head} ${f(V)} 立方公分。`, `正確：底面積＝${f(b)}×${f(h)}÷2＝${f(dv(mul(b, h), I(2)))}，體積＝${f(dv(mul(b, h), I(2)))}×${f(H)}＝${f(V)}。`],
        [`${head} ${f(bad)} 立方公分。`, `錯誤：三角形底面積要 ÷2，體積＝${f(b)}×${f(h)}÷2×${f(H)}＝${f(V)} 立方公分，${f(bad)} 漏除了 2。`]);
      q.trapNote = "三角柱的底面積是三角形面積（底×高÷2）；如果直接把底、高、柱高三個數相乘，會漏掉 ÷2 而多算一倍。注意三角形的「高」與柱子的「高」是不同的兩個量。";
      return q;
    })),
    sp("solids-tf-L5-01", "tf", 5, "extend", kit => retry(kit, fl => {
      const k = fl === "int" ? I(kit.pick([2, 3])) : fl === "dec" ? Qn(kit.pick([3, 5, 1]), 2) : Qn(kit.pick([1, 3, 2]), kit.pick([2, 3, 4]));
      const same = kit.int(0, 1) === 1, w = same ? dv(I(1), sq(k)) : kit.pick([dv(I(1), k), dv(I(1), mul(I(2), k)), dv(I(1), add(sq(k), I(1)))]);
      if (!nice(k, fl) || !nice(w, fl)) return null;
      const ok = qv(mul(sq(k), w)) === 1, f = x => sh(x, fl);
      return { stem: `判斷下列敘述是否正確：\n圓柱的底面半徑變成原來的 ${f(k)} 倍，同時高變成原來的 ${f(w)} 倍，體積和原來一樣大。`, answer: ok,
        explain: `解析：半徑變 ${f(k)} 倍，底面積變 ${f(sq(k))} 倍；高變 ${f(w)} 倍；體積變成 ${f(sq(k))}×${f(w)}＝${f(mul(sq(k), w))} 倍，${ok ? "剛好是 1 倍，體積不變，所以正確" : "不等於 1 倍，體積會改變，所以錯誤"}。` };
    }))
  ]);

  reg("solids", "fill", [
    sp("solids-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const a = lq(kit, fl, 3, 10), b = lq(kit, fl, 3, 10), c = lq(kit, fl, 2, 9), V = mul(mul(a, b), c); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `長方體的長 ${f(a)} 公分、寬 ${f(b)} 公分、高 ${f(c)} 公分，體積是 ____ 立方公分。`, units: ["立方公分", "cm³", "cm3"],
        explain: `解析：${f(a)}×${f(b)}×${f(c)}＝${f(V)}（立方公分）。` }, ans(V, fl));
    })),
    sp("solids-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const b = lq(kit, fl, 6, 12), h = lq(kit, fl, 4, 8), H = lq(kit, fl, 5, 12), B = dv(mul(b, h), I(2)), V = mul(B, H); if (!nice(V, fl) || !nice(B, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `直立三角柱的底面三角形底 ${f(b)} 公分、高 ${f(h)} 公分，柱高 ${f(H)} 公分，體積是 ____ 立方公分。`, units: ["立方公分", "cm³"],
        explain: `解析：底面積＝${f(b)}×${f(h)}÷2＝${f(B)}，體積＝${f(B)}×${f(H)}＝${f(V)}（立方公分）。` }, ans(V, fl));
    })),
    sp("solids-fill-L3-01", "fill", 3, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 10); if (!c) return null;
      const H = lq(kit, fl, 3, 12), V = mul(mul(c.pi, sq(c.r)), H); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，體積是 ____ 立方公分。（${c.pt}）`, units: ["立方公分", "cm³"],
        explain: `解析：π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(V)}（立方公分）。` }, ans(V, fl));
    })),
    sp("solids-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const d = mul(I(2), rr(kit, fl, 2, 6)), r = dv(d, I(2)), p = piFor(kit, fl, r); if (!p) return null;
      const H = lq(kit, fl, 3, 12), V = mul(mul(p.pi, sq(r)), H), wrong = mul(mul(p.pi, sq(d)), H); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `圓柱的底面「直徑」是 ${f(d)} 公分，高是 ${f(H)} 公分，體積是 ____ 立方公分。（${p.pt}）`, units: ["立方公分", "cm³"],
        explain: `解析：半徑＝${f(d)}÷2＝${f(r)} 公分，體積＝π×${f(r)}×${f(r)}×${f(H)}＝${f(V)}（立方公分）。`,
        trapNote: `題目給的是直徑 ${f(d)}，公式要用半徑。若直接把 ${f(d)} 當半徑代入，算出 ${sh(wrong, fl)}，會多 4 倍。` }, ans(V, fl));
    })),
    sp("solids-fill-L5-01", "fill", 5, "extend", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 3, 15), B = mul(c.pi, sq(c.r)), V = mul(B, H); if (!nice(V, fl) || !nice(B, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `一個圓柱的體積是 ${f(V)} 立方公分，底面半徑是 ${f(c.r)} 公分，它的高是 ____ 公分。（${c.pt}）`, units: ["公分", "cm"],
        explain: `解析：底面積＝π×${f(c.r)}×${f(c.r)}＝${f(B)}，高＝體積÷底面積＝${f(V)}÷${f(B)}＝${f(H)}（公分）。` }, ans(H, fl));
    }))
  ]);

  reg("solids", "calc", [
    sp("solids-calc-L1-01", "calc", 1, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 10); if (!c) return null;
      const B = mul(c.pi, sq(c.r)); if (!nice(B, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `圓柱的底面半徑是 ${f(c.r)} 公分，它的底面積是多少平方公分？（${c.pt}）`, units: ["平方公分", "cm²"],
        explain: `解析：底面積＝π×${f(c.r)}×${f(c.r)}＝${f(B)}（平方公分）。` }, ans(B, fl));
    })),
    sp("solids-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 9); if (!c) return null;
      const H = lq(kit, fl, 3, 12), C = mul(mul(I(2), c.pi), c.r), lat = mul(C, H); if (!nice(lat, fl) || !nice(C, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，它的側面積是多少平方公分？（${c.pt}）`, units: ["平方公分", "cm²"],
        explain: `解析：底面周長＝2×π×${f(c.r)}＝${f(C)}，側面積＝周長×高＝${f(C)}×${f(H)}＝${f(lat)}（平方公分）。` }, ans(lat, fl));
    })),
    sp("solids-calc-L3-01", "calc", 3, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 2, 8); if (!c) return null;
      const H = lq(kit, fl, 3, 12), B2 = mul(I(2), mul(c.pi, sq(c.r))), lat = mul(mul(I(2), mul(c.pi, c.r)), H), S = add(B2, lat); if (![B2, lat, S].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `圓柱的底面半徑是 ${f(c.r)} 公分，高是 ${f(H)} 公分，它的表面積（含上、下底面）是多少平方公分？（${c.pt}）`, units: ["平方公分", "cm²"],
        explain: `解析：兩個底面＝2×π×${f(c.r)}×${f(c.r)}＝${f(B2)}，側面＝2×π×${f(c.r)}×${f(H)}＝${f(lat)}，合計 ${f(S)}（平方公分）。` }, ans(S, fl));
    })),
    sp("solids-calc-L4-01", "calc", 4, "trap", kit => retry(kit, fl => {
      const A = lq(kit, fl, 250, 1000), H = lq(kit, fl, 20, 50), V = mul(A, H), L = dv(V, I(1000)); if (![V, L].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `一個柱形水箱的底面積是 ${f(A)} 平方公分，高是 ${f(H)} 公分，裝滿水可以裝幾公升的水？（1 公升＝1000 立方公分）`, units: ["公升", "L", "l"],
        explain: `解析：容積＝${f(A)}×${f(H)}＝${f(V)} 立方公分，${f(V)}÷1000＝${f(L)}（公升）。`,
        trapNote: `算出 ${f(V)} 是「立方公分」，不是公升。1 公升＝1000 立方公分，一定要再 ÷1000 才是公升。` }, ans(L, fl));
    })),
    sp("solids-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const c = circ(kit, fl, 5, 10); if (!c) return null;
      const r = sub(c.r, I(kit.int(2, 3))); if (!(r.n > 0)) return null;
      const H = lq(kit, fl, 4, 12), V = mul(mul(c.pi, sub(sq(c.r), sq(r))), H); if (!nice(V, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `一根空心圓柱形鋼管，外圍半徑 ${f(c.r)} 公分，中空部分的半徑 ${f(r)} 公分，長 ${f(H)} 公分。鋼管本身（不含中空）的體積是多少立方公分？（${c.pt}）`, units: ["立方公分", "cm³"],
        explain: `解析：大圓柱 π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(mul(mul(c.pi, sq(c.r)), H))}，中空小圓柱 π×${f(r)}×${f(r)}×${f(H)}＝${f(mul(mul(c.pi, sq(r)), H))}，相減＝${f(V)}（立方公分）。` }, ans(V, fl));
    }))
  ]);

  reg("solids", "word", [
    sp("solids-word-L2-01", "word", 2, "basic", kit => retry(kit, fl => {
      const a = lq(kit, fl, 20, 50), b = lq(kit, fl, 20, 50), h = lq(kit, fl, 20, 50), V = mul(mul(a, b), h), L = dv(V, I(1000)); if (![V, L].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `一個長方體魚缸，內部長 ${f(a)} 公分、寬 ${f(b)} 公分、高 ${f(h)} 公分。裝滿水可以裝幾公升？（1 公升＝1000 立方公分）`, units: ["公升", "L"],
        explain: `解析：容積＝${f(a)}×${f(b)}×${f(h)}＝${f(V)} 立方公分，${f(V)}÷1000＝${f(L)}（公升）。` }, ans(L, fl));
    })),
    sp("solids-word-L3-01", "word", 3, "trap", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 10, 30), B = mul(c.pi, sq(c.r)), lat = mul(mul(I(2), mul(c.pi, c.r)), H), S = add(B, lat); if (![B, lat, S, add(S, B)].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `一個無蓋的圓柱形鐵桶，底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分。要在桶子的外面（含桶底、不含上蓋）漆上油漆，需要漆多少平方公分？（${c.pt}）`, units: ["平方公分", "cm²"],
        explain: `解析：只有一個底面：π×${f(c.r)}×${f(c.r)}＝${f(B)}；側面：2×π×${f(c.r)}×${f(H)}＝${f(lat)}；合計 ${f(S)}（平方公分）。`,
        trapNote: `題目說「無蓋」，所以只有一個底面。若照表面積公式算兩個底面，會多算一個圓 (${f(B)})，得到 ${f(add(S, B))}。` }, ans(S, fl));
    })),
    sp("solids-word-L3-02", "word", 3, "basic", kit => retry(kit, fl => {
      const c = circ(kit, fl, 5, 10), H = lq(kit, fl, 20, 50); if (!c) return null;
      const V = mul(mul(c.pi, sq(c.r)), H), L = dv(V, I(1000)); if (![V, L].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `一個圓柱形水桶，底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分，裝滿水可以裝幾公升？（${c.pt}，1 公升＝1000 立方公分）`, units: ["公升", "L"],
        explain: `解析：容積＝π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(V)} 立方公分，${f(V)}÷1000＝${f(L)}（公升）。` }, ans(L, fl));
    })),
    sp("solids-word-L4-01", "word", 4, "extend", kit => retry(kit, fl => {
      const c = circ(kit, fl, 5, 10); if (!c) return null;
      const h1 = lq(kit, fl, 8, 20), d = lq(kit, fl, 2, 6), V = mul(mul(c.pi, sq(c.r)), d), h2 = add(h1, d); if (![V, h2].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `圓柱形水桶的底面半徑是 ${f(c.r)} 公分，裡面原有 ${f(h1)} 公分深的水。把一塊石頭完全放入水中後（水沒有溢出），水深變成 ${f(h2)} 公分。這塊石頭的體積是多少立方公分？（${c.pt}）`, units: ["立方公分", "cm³"],
        explain: `解析：水位上升 ${f(h2)}−${f(h1)}＝${f(d)} 公分，石頭體積＝上升的那一段水的體積＝π×${f(c.r)}×${f(c.r)}×${f(d)}＝${f(V)}（立方公分）。` }, ans(V, fl));
    })),
    sp("solids-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const c = circ(kit, fl, 3, 10); if (!c) return null;
      const H = lq(kit, fl, 8, 20), n = kit.int(3, 8), a = lq(kit, fl, 10, 50), b = lq(kit, fl, 10, 25), cup = mul(mul(c.pi, sq(c.r)), H), tot = mul(cup, I(n)), ab = mul(a, b), dep = dv(tot, ab);
      if (![cup, tot, ab, dep].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `圓柱形杯子的底面半徑 ${f(c.r)} 公分、高 ${f(H)} 公分，用它裝滿水後，倒進一個空的長方體水槽（內底長 ${f(a)} 公分、寬 ${f(b)} 公分），共倒了 ${n} 杯。水槽裡的水深是多少公分？（${c.pt}，水不溢出）`, units: ["公分", "cm"],
        explain: `解析：一杯水＝π×${f(c.r)}×${f(c.r)}×${f(H)}＝${f(cup)} 立方公分，${n} 杯＝${f(tot)}；水槽底面積＝${f(a)}×${f(b)}＝${f(ab)}；水深＝${f(tot)}÷${f(ab)}＝${f(dep)}（公分）。` }, ans(dep, fl));
    }))
  ]);
})();
