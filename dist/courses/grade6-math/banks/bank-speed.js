/* 題庫：speed（距離＝速率×時間、秒速分速時速換算、相遇與追趕入門）｜題庫工 C
   數字風格（規格第 11 節）：整數／小數／分數／帶分數，全部以 kit.Q 精確運算。 */
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
  const FLS = ["int", "dec", "frac", "mixed"], FW = [2, 4, 2, 2];
  const Qn = (n, d) => ExamKit.Q(n, d);
  const add = (a, b) => ExamKit.qAdd(a, b), sub = (a, b) => ExamKit.qSub(a, b), mul = (a, b) => ExamKit.qMul(a, b), dv = (a, b) => ExamKit.qDiv(a, b);
  const qv = a => a.n / a.d;
  const isF = fl => fl === "frac" || fl === "mixed";
  const I = n => Qn(n, 1);
  function nice(a, fl) {
    if (!a || !(a.n > 0)) return false;
    if (isF(fl)) return a.d <= 24 && a.n < 3000;
    const v = qv(a); return ExamKit.qIsTerminating(a) && Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-7 && a.n < 1e7;
  }
  const sh = (a, fl) => isF(fl) ? ExamKit.qMixed(a) : ExamKit.qShow(a, "dec");
  const ans = (a, fl) => ExamKit.qAnswer(a, isF(fl) ? "mixed" : "dec");
  function retry(kit, build) {
    const f0 = kit.flavor(FLS, FW);
    for (const fl of [f0, "int"]) for (let i = 0; i < 400; i++) { const r = build(fl); if (r) return r; }
    throw new Error("gen failed");
  }
  /* 依風格取數；lo>=1 時 frac 改用帶分數（避免「時速 3/4 公里」之類不合理的數） */
  function rq(kit, fl, lo, hi, opts) {
    const o = Object.assign({ dens: [2, 4], places: 1 }, opts || {});
    const f = (fl === "frac" && lo >= 1) ? "mixed" : fl;
    return kit.randQ(f, { min: lo, max: hi, dens: o.dens, places: o.places });
  }
  /* 時間（小時） */
  function tq(kit, fl) {
    if (fl === "int") return I(kit.int(2, 6));
    if (fl === "dec") return (p => Qn(p[0], p[1]))(kit.pick([[3, 2], [5, 2], [7, 2], [1, 2], [3, 4], [5, 4], [9, 4], [9, 2]]));
    if (fl === "frac") return (p => Qn(p[0], p[1]))(kit.pick([[1, 2], [1, 4], [3, 4], [1, 3], [2, 3], [1, 5], [2, 5], [3, 5]]));
    return (p => Qn(p[0], p[1]))(kit.pick([[3, 2], [5, 2], [5, 4], [7, 4], [9, 4], [7, 2], [11, 4], [4, 3], [5, 3]]));
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
  const PAIRS = [[60, 40], [30, 60], [20, 30], [60, 90], [30, 45], [40, 120], [50, 75], [30, 90], [45, 90], [20, 60], [40, 60], [24, 40]];
  const SCALES = { int: [[1, 1]], dec: [[1, 2], [1, 4], [3, 2], [5, 2], [1, 8], [3, 4]], frac: [[1, 2], [1, 4], [3, 2], [5, 2], [3, 4]], mixed: [[1, 2], [1, 4], [3, 2], [5, 2], [3, 4]] };
  /* 往返平均速率用：取整數對再乘上風格縮放，保證算得乾淨 */
  function pairQ(kit, fl) {
    let [a, b] = kit.pick(PAIRS); if (kit.int(0, 1)) { const t = a; a = b; b = t; }
    const s = kit.pick(SCALES[fl]); const A = mul(I(a), Qn(s[0], s[1])), B = mul(I(b), Qn(s[0], s[1]));
    return { A, B, ok: fl === "int" || A.d !== 1 || B.d !== 1 };
  }
  const avgQ = (A, B) => dv(mul(I(2), mul(A, B)), add(A, B));

  reg("speed", "single", [
    sp("speed-single-L1-01", "single", 1, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 20, 90), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const o = qopts(kit, d, [add(v, t), add(d, v), sub(d, v), mul(d, I(2)), dv(d, I(2)), dv(v, t)], fl, " 公里");
      return { stem: `一輛汽車的時速是 ${f(v)} 公里，連續行駛 ${f(t)} 小時，共行駛多少公里？`, options: o.options, answer: 0,
        explain: `解析：距離＝速率×時間＝${f(v)}×${f(t)}＝${f(d)}（公里）。` };
    })),
    sp("speed-single-L2-01", "single", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 20, 80), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const o = qopts(kit, v, [add(d, t), mul(d, t), sub(d, t), t, add(v, t), d], fl, " 公里/時");
      return { stem: `小美騎機車 ${f(t)} 小時，共行駛 ${f(d)} 公里，她的平均時速是多少？`, options: o.options, answer: 0,
        explain: `解析：速率＝距離÷時間＝${f(d)}÷${f(t)}＝${f(v)}（公里/時）。` };
    })),
    sp("speed-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const x = rq(kit, fl, 2, 30, { dens: [2, 4, 5] }), c = mul(x, Qn(18, 5)); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      const o = qopts(kit, c, [mul(x, I(60)), mul(x, I(3600)), mul(x, I(36)), dv(x, Qn(18, 5)), mul(x, I(6))], fl, " 公里/時");
      return { stem: `一位選手跑步的速率是每秒 ${f(x)} 公尺，換成時速是多少公里？`, options: o.options, answer: 0,
        explain: `解析：1 小時＝3600 秒，所以每小時跑 ${f(x)}×3600＝${f(mul(x, I(3600)))} 公尺；1 公里＝1000 公尺，所以是 ${f(mul(x, I(3600)))}÷1000＝${f(c)} 公里/時（也就是 ×3.6）。`,
        trapNote: `×60 只換成「分速」（${f(mul(x, I(60)))} 公尺/分），不是時速；×3600 忘了把公尺換成公里（${f(mul(x, I(3600)))} 是公尺/時）。秒速換時速要「×3600 再 ÷1000」。` };
    })),
    sp("speed-single-L4-01", "single", 4, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 24, 108), m = kit.pick([10, 15, 20, 30, 40, 45, 50]), d = mul(v, Qn(m, 60)); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const o = qopts(kit, d, [mul(v, I(m)), mul(v, Qn(m, 6)), dv(v, I(m)), add(v, I(m)), mul(d, I(2)), dv(d, I(2))], fl, " 公里");
      return { stem: `一輛火車的時速是 ${f(v)} 公里，行駛 ${m} 分鐘，共行駛多少公里？`, options: o.options, answer: 0,
        explain: `解析：${m} 分鐘＝${m}/60 小時，距離＝${f(v)}×${m}/60＝${f(d)}（公里）。`,
        trapNote: `時速的單位是「小時」，時間給的是「分鐘」，直接 ${f(v)}×${m}＝${f(mul(v, I(m)))} 會多算 60 倍。必須先把 ${m} 分鐘換成 ${m}/60 小時再乘。` };
    })),
    sp("speed-single-L5-01", "single", 5, "extend", kit => retry(kit, fl => {
      const p = pairQ(kit, fl); if (!p.ok) return null;
      const c = avgQ(p.A, p.B); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      const half = dv(add(p.A, p.B), I(2)), diff = sub(p.A, p.B);
      const o = qopts(kit, c, [half, dv(mul(p.A, p.B), add(p.A, p.B)), add(p.A, p.B), diff.n < 0 ? sub(p.B, p.A) : diff, qv(p.A) < qv(p.B) ? p.A : p.B], fl, " 公里/時");
      const tsum = add(dv(I(1), p.A), dv(I(1), p.B));
      return { stem: `甲、乙兩地的路程固定。小凱去程的時速是 ${f(p.A)} 公里，回程的時速是 ${f(p.B)} 公里。他往返一趟的平均時速是多少？`, options: o.options, answer: 0,
        explain: `解析：設單程為 1（單位路程），往返總路程 2；去程時間 1÷${f(p.A)}＝${ExamKit.qFrac(dv(I(1), p.A))}，回程時間 1÷${f(p.B)}＝${ExamKit.qFrac(dv(I(1), p.B))}，總時間 ${ExamKit.qFrac(tsum)}。平均時速＝總路程÷總時間＝2÷${ExamKit.qFrac(tsum)}＝${f(c)} 公里/時。平均速率要用「總距離÷總時間」，不能把兩個速率直接平均。` };
    }))
  ]);

  reg("speed", "multi", [
    sp("speed-multi-L2-01", "multi", 2, "basic", kit => {
      const v = kit.pick([40, 50, 60, 70, 80]);
      return multiQ(kit, "關於距離、速率與時間的關係：", [
        ["距離 ÷ 時間 ＝ 速率", "速率是單位時間內走的距離。"],
        ["距離 ÷ 速率 ＝ 時間", "由 距離＝速率×時間 倒推。"],
        ["速率 × 時間 ＝ 距離", "這是最基本的關係式。"],
        [`每小時走 ${v} 公里，就是時速 ${v} 公里`, "時速就是每小時走的距離。"]
      ], [
        ["速率 ÷ 時間 ＝ 距離", "距離應是速率×時間，不是相除。"],
        ["距離 × 速率 ＝ 時間", "時間應是距離÷速率。"],
        ["距離 ＝ 速率 + 時間", "速率與時間要相乘，不能相加。"],
        ["時間 ÷ 距離 ＝ 速率", "速率應是距離÷時間，除數與被除數反了。"]
      ]);
    }),
    sp("speed-multi-L3-01", "multi", 3, "trap", kit => {
      const x = kit.pick([5, 10, 15, 20, 25]);
      const r = multiQ(kit, "關於速率單位的換算：", [
        [`${x} 公尺/秒 ＝ ${60 * x} 公尺/分`, "1 分鐘＝60 秒，每分鐘走的距離是每秒的 60 倍。"],
        [`${x} 公尺/秒 ＝ ${kit.num(3.6 * x)} 公里/時`, `×3600 秒再 ÷1000：${x}×3.6＝${kit.num(3.6 * x)}。`],
        [`${60 * x} 公里/時 ＝ ${x} 公里/分`, "1 小時＝60 分鐘，所以分速是時速的 1/60。"],
        [`${60 * x} 公尺/分 ＝ ${x} 公尺/秒`, "每分鐘走的距離除以 60 就是每秒走的距離。"]
      ], [
        [`${x} 公尺/秒 ＝ ${3600 * x} 公里/時`, `${3600 * x} 是公尺/時，還要 ÷1000 才是公里/時。`],
        [`${x} 公里/時 ＝ ${60 * x} 公里/分`, "分速應是時速的 1/60，不是 60 倍。"],
        [`${x} 公尺/分 ＝ ${60 * x} 公尺/秒`, "每秒走的比每分鐘少，應該 ÷60。"],
        [`${x} 公尺/秒 ＝ ${kit.num(x * 6)} 公里/時`, `應是 ×3.6，得 ${kit.num(x * 3.6)}。`]
      ]);
      r.trapNote = "換算時要想「單位變大還是變小」：秒→時要 ×3600，公尺→公里要 ÷1000；常見錯誤是漏掉 ÷1000，或把 60 與 3600 搞混。";
      return r;
    }),
    sp("speed-multi-L3-02", "multi", 3, "trap", kit => retry(kit, fl => {
      const b = rq(kit, fl, 40, 60), a = add(b, rq(kit, fl, 5, 20)), t = tq(kit, fl);
      const s = add(a, b), df = sub(a, b), ds = mul(s, t), dd = mul(df, t), t1 = add(t, I(1));
      if (![s, df, ds, dd, t1].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      const r = multiQ(kit, `甲車時速 ${f(a)} 公里，乙車時速 ${f(b)} 公里。`, [
        [`兩車從兩地同時相向出發，每小時共同縮短 ${f(s)} 公里`, "相向是「速率相加」。"],
        [`甲在乙後方、同向追趕，每小時追近 ${f(df)} 公里`, "同向追趕是「速率相減」。"],
        [`兩車相向，相距 ${f(ds)} 公里，${f(t)} 小時後相遇`, `${f(ds)}÷${f(s)}＝${f(t)}（小時）。`],
        [`甲在乙後方 ${f(dd)} 公里同向追趕，${f(t)} 小時追上`, `${f(dd)}÷${f(df)}＝${f(t)}（小時）。`]
      ], [
        [`兩車相向，每小時共同縮短 ${f(df)} 公里`, "相向要相加，不是相減。"],
        [`甲在乙後方同向追趕，每小時追近 ${f(s)} 公里`, "同向追趕要相減，不是相加。"],
        [`兩車相向，相距 ${f(ds)} 公里，${f(t1)} 小時後相遇`, `應是 ${f(ds)}÷${f(s)}＝${f(t)} 小時。`],
        [`甲在乙後方 ${f(dd)} 公里同向追趕，${f(t1)} 小時追上`, `應是 ${f(dd)}÷${f(df)}＝${f(t)} 小時。`]
      ]);
      r.trapNote = "相向（面對面）時兩者的路程加在一起，速率用「和」；同向追趕時是快的比慢的多走，速率用「差」。兩種情況加減弄反，時間就會算錯。";
      return r;
    })),
    sp("speed-multi-L4-01", "multi", 4, "basic", kit => {
      const v = kit.pick([36, 72, 108]), m = kit.pick([10, 20, 30, 40, 50]), t = kit.int(2, 4);
      return multiQ(kit, `一列火車以時速 ${v} 公里等速前進。`, [
        [`每分鐘行 ${kit.num(v / 60)} 公里`, `${v}÷60＝${kit.num(v / 60)}。`],
        [`每秒行 ${kit.num(v / 3.6)} 公尺`, `${v}×1000÷3600＝${kit.num(v / 3.6)}。`],
        [`行駛 ${t} 小時共 ${v * t} 公里`, `${v}×${t}＝${v * t}。`],
        [`行駛 ${m} 分鐘共 ${kit.num(v * m / 60)} 公里`, `${v}×${m}/60＝${kit.num(v * m / 60)}。`]
      ], [
        [`每分鐘行 ${v} 公里`, `${v} 是每小時的距離，每分鐘要 ÷60。`],
        [`每秒行 ${kit.num(v * 3.6)} 公尺`, `應是 ÷3.6，得 ${kit.num(v / 3.6)} 公尺。`],
        [`行駛 ${m} 分鐘共 ${v * m} 公里`, `${m} 分鐘要先換成 ${m}/60 小時，答案是 ${kit.num(v * m / 60)} 公里。`],
        [`每分鐘行 ${kit.num(v / 60 * 100)} 公尺`, `${kit.num(v / 60)} 公里＝${kit.num(v / 60 * 1000)} 公尺，不是 ×100。`]
      ]);
    }),
    sp("speed-multi-L5-01", "multi", 5, "extend", kit => retry(kit, fl => {
      const vb = rq(kit, fl, 40, 55), va = add(vb, rq(kit, fl, 5, 20)), t = tq(kit, fl), sm = add(va, vb), D = mul(sm, t);
      const A = mul(va, t), B = mul(vb, t), C = mul(sub(va, vb), t), H = dv(D, I(2)), T2 = mul(t, I(2)), df = sub(va, vb);
      if (![D, A, B, C, H, T2, df].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return multiQ(kit, `甲、乙兩地相距 ${f(D)} 公里。甲車時速 ${f(va)} 公里、乙車時速 ${f(vb)} 公里，兩車同時由兩地相向而行。`, [
        [`${f(t)} 小時後兩車相遇`, `${f(D)}÷(${f(va)}+${f(vb)})＝${f(t)}。`],
        [`相遇時甲車行了 ${f(A)} 公里`, `${f(va)}×${f(t)}＝${f(A)}。`],
        [`相遇時甲車比乙車多行 ${f(C)} 公里`, `${f(A)}−${f(B)}＝${f(C)}。`],
        [`相遇時乙車行了 ${f(B)} 公里`, `${f(vb)}×${f(t)}＝${f(B)}。`]
      ], [
        [`${f(T2)} 小時後兩車相遇`, `相遇時間是 ${f(t)} 小時。`],
        [`相遇時甲車行了 ${f(H)} 公里`, `兩車速率不同，不會各走一半；甲走 ${f(A)} 公里。`],
        [`相遇時乙車行了 ${f(A)} 公里`, `乙車只走 ${f(B)} 公里；${f(A)} 是甲車走的。`],
        [`兩車每小時共同縮短 ${f(df)} 公里`, `相向要用速率和 ${f(sm)}，不是差。`]
      ]);
    }))
  ]);

  reg("speed", "tf", [
    sp("speed-tf-L1-01", "tf", 1, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 30, 90), t = tq(kit, fl), d = mul(v, t), bad = add(v, t); if (!nice(d, fl) || !nice(bad, fl)) return null;
      const f = x => sh(x, fl);
      return tfQ(kit,
        [`時速 ${f(v)} 公里的汽車，行駛 ${f(t)} 小時，共行駛 ${f(d)} 公里。`, `正確：${f(v)}×${f(t)}＝${f(d)}（公里）。`],
        [`時速 ${f(v)} 公里的汽車，行駛 ${f(t)} 小時，共行駛 ${f(bad)} 公里。`, `錯誤：距離＝速率×時間＝${f(v)}×${f(t)}＝${f(d)} 公里，不是相加。`]);
    })),
    sp("speed-tf-L2-01", "tf", 2, "basic", kit => retry(kit, fl => {
      const x = rq(kit, fl, 3, 15), c = mul(x, I(60)), bad = mul(x, I(kit.pick([6, 100]))); if (!nice(c, fl) || !nice(bad, fl)) return null;
      const f = a => sh(a, fl);
      return tfQ(kit,
        [`每秒 ${f(x)} 公尺的速率，等於每分鐘 ${f(c)} 公尺。`, `正確：1 分鐘＝60 秒，${f(x)}×60＝${f(c)}。`],
        [`每秒 ${f(x)} 公尺的速率，等於每分鐘 ${f(bad)} 公尺。`, `錯誤：1 分鐘＝60 秒，應是 ${f(x)}×60＝${f(c)} 公尺/分。`]);
    })),
    sp("speed-tf-L3-01", "tf", 3, "trap", kit => retry(kit, fl => {
      const B = rq(kit, fl, 10, 30, { dens: [5, 10] }), conv = mul(B, Qn(18, 5)), delta = I(kit.pick([-18, -9, 9, 18]));
      const A = add(conv, delta); if (!nice(A, fl) || !nice(conv, fl)) return null;
      const ok = delta.n > 0, f = a => sh(a, fl);
      return { stem: `判斷下列敘述是否正確：\n時速 ${f(A)} 公里的列車，比秒速 ${f(B)} 公尺的汽車快。`, answer: ok,
        explain: `解析：秒速 ${f(B)} 公尺＝${f(B)}×3.6＝${f(conv)} 公里/時。${f(A)} ${ok ? ">" : "<"} ${f(conv)}，所以列車${ok ? "比較快" : "比較慢"}，此敘述${ok ? "正確" : "錯誤"}。`,
        trapNote: `${f(A)} 與 ${f(B)} 單位不同（公里/時 與 公尺/秒），不能直接比數字大小；${f(A)}>${f(B)} 看起來列車快，但要先把單位統一。` };
    })),
    sp("speed-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const b = rq(kit, fl, 40, 60), a = add(b, rq(kit, fl, 5, 20)), df = sub(a, b), sm = add(a, b); if (!nice(df, fl) || !nice(sm, fl)) return null;
      const f = x => sh(x, fl);
      const r = tfQ(kit,
        [`甲車（時速 ${f(a)} 公里）在乙車（時速 ${f(b)} 公里）後方同向追趕，每小時追近 ${f(df)} 公里。`, `正確：同向追趕用速率差 ${f(a)}−${f(b)}＝${f(df)}。`],
        [`甲車（時速 ${f(a)} 公里）在乙車（時速 ${f(b)} 公里）後方同向追趕，每小時追近 ${f(sm)} 公里。`, `錯誤：同向追趕是快的追慢的，用速率差 ${f(a)}−${f(b)}＝${f(df)}，不是相加。`]);
      r.trapNote = "相加是「相向」才用的；同向追趕只有「多出來的速度」在縮短距離，要相減。";
      return r;
    })),
    sp("speed-tf-L5-01", "tf", 5, "extend", kit => retry(kit, fl => {
      const p = pairQ(kit, fl); if (!p.ok) return null;
      const c = avgQ(p.A, p.B), h = dv(add(p.A, p.B), I(2)); if (!nice(c, fl) || !nice(h, fl)) return null;
      const f = x => sh(x, fl);
      return tfQ(kit,
        [`同一段路，去程時速 ${f(p.A)} 公里、回程時速 ${f(p.B)} 公里，往返的平均時速是 ${f(c)} 公里。`, `正確：平均速率＝往返總距離÷（去程時間＋回程時間）＝${f(c)}。`],
        [`同一段路，去程時速 ${f(p.A)} 公里、回程時速 ${f(p.B)} 公里，往返的平均時速是 ${f(h)} 公里。`, `錯誤：不能直接平均兩個速率。總距離÷總時間＝${f(c)} 公里/時。`]);
    }))
  ]);

  reg("speed", "fill", [
    sp("speed-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 30, 90), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `時速 ${f(v)} 公里的火車，行駛 ${f(t)} 小時，共行駛 ____ 公里。`, units: ["公里", "km"],
        explain: `解析：距離＝速率×時間＝${f(v)}×${f(t)}＝${f(d)}（公里）。` }, ans(d, fl));
    })),
    sp("speed-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 40, 80), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `客運車 ${f(t)} 小時行駛 ${f(d)} 公里，平均時速是 ____ 公里。`, units: ["公里/時", "公里/小時", "公里", "公里每小時"],
        explain: `解析：速率＝距離÷時間＝${f(d)}÷${f(t)}＝${f(v)}（公里/時）。` }, ans(v, fl));
    })),
    sp("speed-fill-L3-01", "fill", 3, "basic", kit => retry(kit, fl => {
      const x = rq(kit, fl, 3, 15), c = mul(x, I(60)); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `小翔跑步每秒 ${f(x)} 公尺，他的分速是 ____ 公尺/分。`, units: ["公尺/分", "公尺/分鐘", "公尺"],
        explain: `解析：1 分鐘＝60 秒，${f(x)}×60＝${f(c)}（公尺/分）。` }, ans(c, fl));
    })),
    sp("speed-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 18, 150), c = dv(mul(v, I(1000)), I(3600)); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `某腳踏車的時速是 ${f(v)} 公里，換成秒速是每秒 ____ 公尺。`, units: ["公尺/秒", "公尺/秒鐘", "公尺"],
        explain: `解析：${f(v)} 公里＝${f(mul(v, I(1000)))} 公尺，1 小時＝3600 秒，${f(mul(v, I(1000)))}÷3600＝${f(c)}（公尺/秒）。（也就是 ÷3.6）`,
        trapNote: `常見錯誤是把 ${f(v)} 直接 ÷60 得到 ${f(dv(v, I(60)))}（那只是公里/分），或忘了公里要換成公尺。公里/時 → 公尺/秒 要「×1000 ÷3600」＝÷3.6。` }, ans(c, fl));
    })),
    sp("speed-fill-L5-01", "fill", 5, "extend", kit => retry(kit, fl => {
      const b = rq(kit, fl, 30, 65), a = rq(kit, fl, 30, 65), t = tq(kit, fl), D = mul(add(a, b), t); if (!nice(D, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `甲、乙兩地相距 ${f(D)} 公里。兩車同時由兩地出發相向而行，甲車時速 ${f(a)} 公里，${f(t)} 小時後相遇，則乙車的時速是 ____ 公里。`, units: ["公里/時", "公里/小時", "公里"],
        explain: `解析：兩車速率和＝${f(D)}÷${f(t)}＝${f(add(a, b))}（公里/時），乙車時速＝${f(add(a, b))}−${f(a)}＝${f(b)}（公里/時）。` }, ans(b, fl));
    }))
  ]);

  reg("speed", "calc", [
    sp("speed-calc-L1-01", "calc", 1, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 30, 90), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `火車時速 ${f(v)} 公里，行駛 ${f(t)} 小時，距離是多少公里？（列式：${f(v)} × ${f(t)}）`, units: ["公里", "km"],
        explain: `解析：${f(v)}×${f(t)}＝${f(d)}（公里）。` }, ans(d, fl));
    })),
    sp("speed-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 30, 90), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `汽車以時速 ${f(v)} 公里行駛 ${f(d)} 公里，需要幾小時？（列式：${f(d)} ÷ ${f(v)}）`, units: ["小時", "時"],
        explain: `解析：時間＝距離÷速率＝${f(d)}÷${f(v)}＝${f(t)}（小時）。` }, ans(t, fl));
    })),
    sp("speed-calc-L3-01", "calc", 3, "basic", kit => retry(kit, fl => {
      const m = rq(kit, fl, 50, 500), c = dv(mul(m, I(60)), I(1000)); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `把分速 ${f(m)} 公尺換成時速，是多少公里/時？`, units: ["公里/時", "公里/小時", "公里"],
        explain: `解析：1 小時＝60 分鐘，每小時走 ${f(m)}×60＝${f(mul(m, I(60)))} 公尺＝${f(c)} 公里，所以是 ${f(c)} 公里/時。` }, ans(c, fl));
    })),
    sp("speed-calc-L4-01", "calc", 4, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 24, 108), m = kit.pick([10, 15, 20, 30, 40, 45, 50]), d = mul(v, Qn(m, 60)); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `時速 ${f(v)} 公里的列車行駛 ${m} 分鐘，共行駛多少公里？`, units: ["公里", "km"],
        explain: `解析：${m} 分鐘＝${m}/60 小時，${f(v)}×${m}/60＝${f(d)}（公里）。`,
        trapNote: `直接算 ${f(v)}×${m}＝${f(mul(v, I(m)))} 是錯的，因為時速的時間單位是「小時」，${m} 分鐘要先換成 ${m}/60 小時。` }, ans(d, fl));
    })),
    sp("speed-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const b = rq(kit, fl, 40, 60), df = rq(kit, fl, 5, 20), a = add(b, df), t = tq(kit, fl), g = mul(df, t); if (!nice(g, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `乙騎車在前，甲騎車在後，兩人相距 ${f(g)} 公里，同向前進。甲時速 ${f(a)} 公里，乙時速 ${f(b)} 公里，甲要經過幾小時才追上乙？`, units: ["小時", "時"],
        explain: `解析：同向追趕，每小時追近 ${f(a)}−${f(b)}＝${f(df)} 公里，時間＝${f(g)}÷${f(df)}＝${f(t)}（小時）。` }, ans(t, fl));
    }))
  ]);

  reg("speed", "word", [
    sp("speed-word-L2-01", "word", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 60, 250), t = kit.pick([10, 20, 30, 40]), d = mul(mul(v, I(t)), Qn(1, 1000)); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `小宇騎腳踏車，每分鐘騎 ${f(v)} 公尺，騎了 ${t} 分鐘。他一共騎了多少公里？`, units: ["公里", "km"],
        explain: `解析：距離＝${f(v)}×${t}＝${f(mul(v, I(t)))} 公尺，${f(mul(v, I(t)))}÷1000＝${f(d)} 公里。` }, ans(d, fl));
    })),
    sp("speed-word-L3-01", "word", 3, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 50, 120), m = kit.pick([10, 15, 20, 25, 30, 40]), d = mul(mul(v, I(m)), Qn(1, 1000)); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `小芸家離學校 ${f(d)} 公里，她步行的速率是每分鐘 ${f(v)} 公尺，她從家走到學校要幾分鐘？`, answer: String(m), accepted: [], units: ["分鐘", "分"],
        explain: `解析：${f(d)} 公里＝${f(mul(v, I(m)))} 公尺，時間＝${f(mul(v, I(m)))}÷${f(v)}＝${m}（分鐘）。`,
        trapNote: `題目距離用「公里」、速率用「公尺/分」，單位不同不能直接除；直接算 ${f(d)}÷${f(v)} 會得到很小的錯誤答案。先把公里換成公尺（×1000）。` });
    })),
    sp("speed-word-L3-02", "word", 3, "basic", kit => retry(kit, fl => {
      const a = rq(kit, fl, 50, 70), b = rq(kit, fl, 40, 60), t = tq(kit, fl), D = mul(add(a, b), t); if (!nice(D, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `甲、乙兩城相距 ${f(D)} 公里。一輛車從甲城出發，時速 ${f(a)} 公里；另一輛車同時從乙城出發，時速 ${f(b)} 公里，兩車相向而行。幾小時後兩車相遇？`, units: ["小時", "時"],
        explain: `解析：兩車每小時共同縮短 ${f(a)}+${f(b)}＝${f(add(a, b))} 公里，相遇時間＝${f(D)}÷${f(add(a, b))}＝${f(t)}（小時）。` }, ans(t, fl));
    })),
    sp("speed-word-L4-01", "word", 4, "extend", kit => retry(kit, fl => {
      const b = rq(kit, fl, 50, 100), k = rq(kit, fl, 10, 40), s = rq(kit, fl, 3, 12), a = add(b, k), t = dv(mul(b, s), k); if (!nice(t, fl) || !nice(mul(b, s), fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `哥哥從家出發，每分鐘走 ${f(b)} 公尺。哥哥走了 ${f(s)} 分鐘後，弟弟才從家出發，騎車每分鐘行 ${f(a)} 公尺去追哥哥。弟弟出發後幾分鐘可以追上哥哥？`, units: ["分鐘", "分"],
        explain: `解析：弟弟出發時，哥哥已走 ${f(b)}×${f(s)}＝${f(mul(b, s))} 公尺。弟弟每分鐘追近 ${f(a)}−${f(b)}＝${f(k)} 公尺，追上要 ${f(mul(b, s))}÷${f(k)}＝${f(t)}（分鐘）。` }, ans(t, fl));
    })),
    sp("speed-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const vk = rq(kit, fl, 40, 120), s = rq(kit, fl, 15, 40), L = rq(kit, fl, 80, 250), x = dv(mul(vk, I(5)), I(18)), T = sub(mul(x, s), L);
      if (!nice(T, fl) || !nice(x, fl) || !nice(mul(x, s), fl)) return null;
      const f = a => sh(a, fl);
      return Object.assign({ stem: `一列長 ${f(L)} 公尺的火車，時速 ${f(vk)} 公里，從車頭進入隧道到車尾完全離開隧道共花 ${f(s)} 秒。這條隧道長多少公尺？`, units: ["公尺", "公尺長", "m"],
        explain: `解析：時速 ${f(vk)} 公里＝每秒 ${f(x)} 公尺。${f(s)} 秒共行駛 ${f(x)}×${f(s)}＝${f(mul(x, s))} 公尺，這段距離＝隧道長＋車長，所以隧道長＝${f(mul(x, s))}−${f(L)}＝${f(T)}（公尺）。` }, ans(T, fl));
    }))
  ]);
  /* 教材式 □ 未知數題（規格第 14 節） */
  reg("speed", "box", [
    sp("speed-box-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 3, 9), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `時速 ${f(v)} 公里的人走 □ 小時，可以走 ${f(d)} 公里。□ ＝ ?`, units: ["小時", "時"],
        explain: `解析：${f(v)} × □ ＝ ${f(d)}，□ ＝ ${f(d)} ÷ ${f(v)} ＝ ${f(t)}（小時）。` }, ans(t, fl));
    })),
    sp("speed-box-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 18, 150), c = dv(mul(v, I(5)), I(18)); if (!nice(c, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `${f(v)} 公里/時 ＝ □ 公尺/秒。□ ＝ ?`, units: ["公尺/秒", "公尺"],
        explain: `解析：${f(v)} 公里＝${f(mul(v, I(1000)))} 公尺，1 小時＝3600 秒，□ ＝ ${f(mul(v, I(1000)))} ÷ 3600 ＝ ${f(c)}。` }, ans(c, fl));
    })),
    sp("speed-box-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 20, 90), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `${f(t)} × □ ＝ ${f(d)}。（□ 是時速，單位公里/時）□ 是多少？`, units: ["公里/時", "公里"],
        explain: `解析：□ ＝ ${f(d)} ÷ ${f(t)} ＝ ${f(v)}（公里/時）。` }, ans(v, fl));
    })),
    sp("speed-box-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 20, 80), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = x => sh(x, fl);
      const o = qopts(kit, t, [mul(d, v), dv(v, d), sub(d, v), add(d, v), mul(t, I(2))], fl, " 小時");
      return { stem: `${f(d)} ÷ □ ＝ ${f(v)}（距離 ÷ 時間 ＝ 速率，□ 是時間，單位小時）。□ 是多少小時？`, options: o.options, answer: 0,
        explain: `解析：除數 □ ＝ 被除數 ÷ 商 ＝ ${f(d)} ÷ ${f(v)} ＝ ${f(t)}（小時）。`,
        trapNote: `□ 在除數的位置，要用「被除數 ÷ 商」。常見錯誤是把 ${f(d)} 和 ${f(v)} 相乘，或反過來算 ${f(v)} ÷ ${f(d)}。` };
    })),
    sp("speed-box-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const x = rq(kit, fl, 5, 30, { dens: [2, 5] }), c = mul(x, Qn(18, 5)), bad = mul(x, I(kit.pick([6, 60]))); if (!nice(c, fl) || !nice(bad, fl) || qv(bad) === qv(c)) return null;
      const f = y => sh(y, fl);
      const r = tfQ(kit,
        [`${f(x)} 公尺/秒 ＝ □ 公里/時，□ ＝ ${f(c)}。`, `正確：${f(x)} × 3600 ÷ 1000 ＝ ${f(c)}。`],
        [`${f(x)} 公尺/秒 ＝ □ 公里/時，□ ＝ ${f(bad)}。`, `錯誤：${f(x)} 公尺/秒 ×3600 秒 ÷1000 ＝ ${f(c)} 公里/時，不是 ${f(bad)}。`]);
      r.trapNote = "秒速換時速要 ×3600（秒→時）再 ÷1000（公尺→公里），也就是 ×3.6；只 ×60 或 ×6 都是換算漏步驟。";
      return r;
    })),
    sp("speed-box-word-L4-01", "word", 4, "trap", kit => retry(kit, fl => {
      const b = rq(kit, fl, 40, 60), df = rq(kit, fl, 5, 20), a = add(b, df), t = tq(kit, fl), g = mul(df, t); if (!nice(g, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `哥哥時速 ${f(a)} 公里，弟弟時速 ${f(b)} 公里，兩人同時從同一地點、往同一方向出發，□ 小時後兩人相距 ${f(g)} 公里。□ ＝ ?`, units: ["小時", "時"],
        explain: `解析：同向出發，每小時拉開 ${f(a)}−${f(b)}＝${f(df)} 公里，□ ＝ ${f(g)} ÷ ${f(df)} ＝ ${f(t)}（小時）。`,
        trapNote: `同向出發，拉開的距離看速率「差」，不是速率和 ${f(add(a, b))}。用和去除會算出 ${f(dv(g, add(a, b)))}，是錯的。` }, ans(t, fl));
    })),
    sp("speed-box-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const s = rq(kit, fl, 80, 140), df = rq(kit, fl, 5, 30), big = dv(add(s, df), I(2)); if (!nice(big, fl) || !nice(dv(sub(s, df), I(2)), fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `甲、乙兩車的時速（單位：公里/時）分別是 □ 和 △（□ 比較大）。□ ＋ △ ＝ ${f(s)}，□ － △ ＝ ${f(df)}。□ ＝ ?`, units: ["公里/時", "公里"],
        explain: `解析：和加差：(□＋△)＋(□－△)＝2 個 □＝${f(s)}＋${f(df)}＝${f(add(s, df))}，□ ＝ ${f(add(s, df))} ÷ 2 ＝ ${f(big)}（公里/時）。（△ ＝ ${f(dv(sub(s, df), I(2)))}）` }, ans(big, fl));
    })),
    sp("speed-box-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const L = rq(kit, fl, 100, 250), T = rq(kit, fl, 200, 600), vk = rq(kit, fl, 36, 108), x = dv(mul(vk, I(5)), I(18)), tm = dv(add(L, T), x);
      if (![x, tm, add(L, T)].every(y => nice(y, fl))) return null;
      const f = y => sh(y, fl);
      return Object.assign({ stem: `一列長 ${f(L)} 公尺的火車，時速 ${f(vk)} 公里，要通過一座長 ${f(T)} 公尺的橋（從車頭上橋到車尾離橋），需要 □ 秒。□ ＝ ?`, units: ["秒", "秒鐘"],
        explain: `解析：時速 ${f(vk)} 公里＝每秒 ${f(x)} 公尺；車頭到車尾離橋共走 ${f(L)}＋${f(T)}＝${f(add(L, T))} 公尺，□ ＝ ${f(add(L, T))} ÷ ${f(x)} ＝ ${f(tm)}（秒）。` }, ans(tm, fl));
    })),
    sp("speed-box-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const a = rq(kit, fl, 2, 8), t = tq(kit, fl), v0 = rq(kit, fl, 15, 40), d = mul(sub(v0, a), t); if (!nice(d, fl) || !nice(sub(v0, a), fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `一艘船在靜水中每小時行 □ 公里，水流每小時 ${f(a)} 公里，逆流行駛 ${f(t)} 小時共 ${f(d)} 公里，也就是 (□ － ${f(a)}) × ${f(t)} ＝ ${f(d)}。□ ＝ ?`, units: ["公里/時", "公里"],
        explain: `解析：(□ － ${f(a)}) ＝ ${f(d)} ÷ ${f(t)} ＝ ${f(sub(v0, a))}，□ ＝ ${f(sub(v0, a))} ＋ ${f(a)} ＝ ${f(v0)}（公里/時）。`,
        trapNote: `括號裡是「減 ${f(a)}」，還原時要「加回 ${f(a)}」。常見錯誤是算出 ${f(sub(v0, a))} 就停下，或再減一次 ${f(a)}。` }, ans(v0, fl));
    }))
  ]);
})();
