/* 題庫：statistics（圓形圖、百分率、長條圖折線圖判讀、平均數；數據以文字敘述）｜題庫工 C
   數字風格（規格第 11 節）：整數／小數（含 12.5%、72.5 分）／分數（占 3/8）／帶分數，全部以 kit.Q 精確運算。 */
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
    for (const fl of [f0, "int"]) for (let i = 0; i < 600; i++) { const r = build(fl); if (r) return r; }
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
  /* 成績：整數／一位小數／帶分數（半、四分之一、五分之一） */
  function sc(kit, fl, lo, hi) {
    lo = lo || 60; hi = hi || 100;
    if (fl === "int") return I(kit.int(lo, hi));
    if (fl === "dec") return kit.randQ("dec", { min: lo, max: hi - 1, places: 1 });
    return kit.randQ("mixed", { min: lo, max: hi - 1, dens: [2, 4, 5] });
  }
  /* 小增量（平均提高多少分） */
  function kq(kit, fl) {
    if (fl === "int") return I(kit.pick([1, 2, 3]));
    if (fl === "dec") return Qn(kit.pick([5, 15, 25, 1, 2, 3]), kit.pick([10, 10, 10, 10, 10, 10]));
    return Qn(kit.pick([1, 3, 1, 3, 5]), kit.pick([2, 4, 2, 4, 2]));
  }
  const sumQ = a => a.reduce((x, y) => add(x, y), I(0));
  /* 占全體的比例（Q）：int/dec 以百分率顯示，frac/mixed 以分數顯示 */
  const SHARES = {
    int: [10, 15, 20, 25, 30, 35, 40, 45, 50, 60].map(p => Qn(p, 100)),
    dec: [75, 125, 175, 225, 275, 325, 375, 425, 475, 625].map(p => Qn(p, 1000)),
    frac: [[1, 8], [3, 8], [5, 8], [1, 5], [2, 5], [3, 5], [3, 10], [7, 10], [1, 4], [3, 4], [1, 2], [3, 20], [7, 20]].map(p => Qn(p[0], p[1]))
  };
  const shr = (kit, fl) => kit.pick(SHARES[isF(fl) ? "frac" : fl]);
  const showS = (s, fl) => isF(fl) ? ExamKit.qFrac(s) : ExamKit.qShow(mul(s, I(100)), "dec") + "%";
  const pct = s => mul(s, I(100));
  const SETS = {
    int: [[40, 30, 20, 10], [35, 30, 25, 10], [45, 25, 20, 10], [50, 25, 15, 10], [40, 25, 20, 15], [35, 30, 20, 15], [45, 30, 15, 10]].map(r => r.map(x => Qn(x, 100))),
    dec: [[375, 300, 225, 100], [425, 275, 200, 100], [325, 300, 250, 125], [375, 250, 225, 150], [400, 275, 200, 125], [350, 325, 225, 100]].map(r => r.map(x => Qn(x, 1000))),
    frac: [[8, 6, 4, 2], [7, 6, 5, 2], [9, 5, 4, 2], [10, 5, 3, 2], [8, 5, 4, 3], [7, 6, 4, 3], [9, 6, 3, 2]].map(r => r.map(x => Qn(x, 20)))
  };
  const SPORTS = ["籃球", "游泳", "跑步", "羽球", "桌球", "排球"];
  const NS = [40, 80, 120, 160, 200, 240];
  /* 兩組：n1≠n2（整數人數）、a1<a2，合併平均 T */
  function grpQ(kit, fl, small) {
    const ns = small ? [2, 3, 4, 5] : [10, 20, 30, 40];
    const n1 = kit.pick(ns), n2 = kit.pick(ns); if (n1 === n2) return null;
    let a1 = sc(kit, fl), a2 = sc(kit, fl); if (qv(a1) === qv(a2)) return null;
    if (qv(a1) > qv(a2)) { const t = a1; a1 = a2; a2 = t; }
    const tot = add(mul(I(n1), a1), mul(I(n2), a2)), T = dv(tot, I(n1 + n2)), mid = dv(add(a1, a2), I(2));
    if (!nice(T, fl) || !nice(tot, fl) || !nice(mid, fl)) return null;
    if (fl === "int" && T.d !== 1) return null;
    return { n1, n2, a1, a2, tot, T, mid };
  }

  reg("statistics", "single", [
    sp("statistics-single-L1-01", "single", 1, "basic", kit => retry(kit, fl => {
      const N = kit.pick(NS), s = shr(kit, fl), c = mul(I(N), s); if (c.d !== 1 || c.n <= 0) return null;
      const nm = kit.pick(SPORTS), f = a => sh(a, fl);
      const wr = [mul(I(N), pct(s)), sub(I(N), c), add(I(N), c), mul(c, I(2)), dv(c, I(2)), add(c, I(5))].filter(w => w.d === 1);
      const o = qopts(kit, c, wr, "int", " 人");
      return { stem: `全班有 ${N} 人，調查最喜歡的運動，圓形圖顯示喜歡${nm}的占全班的 ${showS(s, fl)}。喜歡${nm}的有多少人？`, options: o.options, answer: 0,
        explain: `解析：人數＝全班人數×所占比例＝${N}×${showS(s, fl)}＝${f(c)}（人）。` };
    })),
    sp("statistics-single-L2-01", "single", 2, "basic", kit => retry(kit, fl => {
      const a = []; for (let i = 0; i < 5; i++) a.push(sc(kit, fl));
      const S = sumQ(a), A = dv(S, I(5)); if (!nice(A, fl) || (fl === "int" && A.d !== 1)) return null;
      const f = x => sh(x, fl), vals = a.slice().sort((x, y) => qv(x) - qv(y));
      const mx = vals[4], mn = vals[0];
      const o = qopts(kit, A, [S, dv(S, I(6)), vals[2], mx, dv(add(mx, mn), I(2))], fl, " 分");
      return { stem: `小明五次數學考試的成績分別是 ${a.map(f).join("、")} 分，他的平均成績是多少分？`, options: o.options, answer: 0,
        explain: `解析：平均數＝總和÷個數＝(${a.map(f).join("＋")})÷5＝${f(S)}÷5＝${f(A)}（分）。` };
    })),
    sp("statistics-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const s = shr(kit, fl), d = mul(s, I(360)); if (!nice(d, "dec")) return null;
      const f = a => sh(a, "dec");
      const o = qopts(kit, d, [pct(s), mul(s, I(1000)), sub(I(360), d), dv(d, I(2)), mul(d, I(2)), mul(s, I(36))], "int", " 度");
      return { stem: `在圓形圖中，喜歡跑步的人數占全部的 ${showS(s, fl)}，這一塊扇形的圓心角是幾度？`, options: o.options, answer: 0,
        explain: `解析：整個圓是 360 度，圓心角＝360×${showS(s, fl)}＝${f(d)}（度）。（占比乘上 360）`,
        trapNote: `常見錯誤是把 ${showS(s, fl)} 直接當成角度（例如 ${f(pct(s))} 度）。整個圓代表整體＝360 度，所以要用 360 乘上所占的比例。` };
    })),
    sp("statistics-single-L4-01", "single", 4, "trap", kit => retry(kit, fl => {
      const g = grpQ(kit, fl); if (!g) return null;
      const f = a => sh(a, fl);
      const o = qopts(kit, g.T, [g.mid, g.a1, g.a2, add(g.a1, g.a2), add(g.T, I(2)), sub(g.T, I(2))], fl, " 分");
      return { stem: `甲班有 ${g.n1} 人，數學平均 ${f(g.a1)} 分；乙班有 ${g.n2} 人，數學平均 ${f(g.a2)} 分。兩班合起來的數學平均是多少分？`, options: o.options, answer: 0,
        explain: `解析：總分＝${g.n1}×${f(g.a1)}＋${g.n2}×${f(g.a2)}＝${f(g.tot)}，總人數＝${g.n1 + g.n2}，平均＝${f(g.tot)}÷${g.n1 + g.n2}＝${f(g.T)}（分）。`,
        trapNote: `把兩個班的平均 (${f(g.a1)}＋${f(g.a2)})÷2＝${f(g.mid)} 是錯的，因為兩班人數不同（${g.n1} 人與 ${g.n2} 人），人數多的班影響比較大。必須用「總分÷總人數」。` };
    })),
    sp("statistics-single-L5-01", "single", 5, "extend", kit => retry(kit, fl => {
      const n = kit.pick([3, 4, 5]), m = sc(kit, fl, 70, 88), k = kq(kit, fl), need = add(m, mul(I(n + 1), k));
      if (qv(need) > 100 || !nice(need, fl)) return null;
      const f = a => sh(a, fl);
      const o = qopts(kit, need, [add(m, k), add(m, mul(I(n), k)), m, add(m, mul(I(n + 2), k)), mul(I(n + 1), k)], fl, " 分");
      const newA = add(m, k);
      return { stem: `小莉前 ${n} 次測驗的平均是 ${f(m)} 分。第 ${n + 1} 次考完後，${n + 1} 次的平均比原來多了 ${f(k)} 分。她第 ${n + 1} 次考了幾分？`, options: o.options, answer: 0,
        explain: `解析：新平均＝${f(m)}＋${f(k)}＝${f(newA)}，${n + 1} 次總分＝${f(newA)}×${n + 1}＝${f(mul(newA, I(n + 1)))}；前 ${n} 次總分＝${f(m)}×${n}＝${f(mul(m, I(n)))}；第 ${n + 1} 次＝${f(mul(newA, I(n + 1)))}−${f(mul(m, I(n)))}＝${f(need)}（分）。` };
    }))
  ]);

  reg("statistics", "multi", [
    sp("statistics-multi-L2-01", "multi", 2, "basic", kit => retry(kit, fl => {
      const P = kit.pick(SETS[isF(fl) ? "frac" : fl]), N = kit.pick(NS), nm = kit.shuffle(SPORTS).slice(0, 4);
      const c = P.map(x => mul(I(N), x)); if (c.some(x => x.d !== 1)) return null;
      const ang = P.map(x => mul(x, I(360))); if (ang.some(x => !nice(x, "dec"))) return null;
      const T = x => showS(x, fl), f = x => sh(x, "dec");
      return multiQ(kit, `某班 ${N} 人，調查最喜歡的運動（每人只選一項），圓形圖的結果：${nm.map((n0, i) => n0 + " " + T(P[i])).join("、")}。`, [
        [`${nm[0]}是最多人喜歡的，有 ${f(c[0])} 人`, `${N}×${T(P[0])}＝${f(c[0])}，所占比例最大。`],
        [`${nm[1]}比${nm[2]}多 ${f(sub(c[1], c[2]))} 人`, `${f(c[1])}−${f(c[2])}＝${f(sub(c[1], c[2]))}。`],
        [`${nm[0]}的扇形圓心角是 ${f(ang[0])} 度`, `360×${T(P[0])}＝${f(ang[0])}。`],
        [`${nm[2]}和${nm[3]}合起來占全班的 ${T(add(P[2], P[3]))}`, `${T(P[2])}＋${T(P[3])}＝${T(add(P[2], P[3]))}。`]
      ], [
        [`${nm[0]}的扇形圓心角是 ${f(pct(P[0]))} 度`, `圓心角要用 360×${T(P[0])}＝${f(ang[0])} 度。`],
        [`${nm[1]}比${nm[2]}多 ${f(pct(sub(P[1], P[2])))} 人`, `${f(pct(sub(P[1], P[2])))} 是比例的差換成百分數，人數差是 ${f(sub(c[1], c[2]))} 人。`],
        [`${nm[3]}有 ${f(pct(P[3]))} 人`, `要乘全班 ${N} 人，是 ${f(c[3])} 人。`],
        [`${nm[0]}和${nm[1]}合起來占全班的 ${T(sub(add(P[0], P[1]), Qn(1, 20)))}`, `應是 ${T(P[0])}＋${T(P[1])}＝${T(add(P[0], P[1]))}。`],
        [`${nm[2]}是最少人喜歡的`, `最少的是${nm[3]}（${T(P[3])}）。`]
      ]);
    })),
    sp("statistics-multi-L3-01", "multi", 3, "trap", kit => retry(kit, fl => {
      const a = []; for (let i = 0; i < 5; i++) a.push(sc(kit, fl, 60, 98));
      const S = sumQ(a), A = dv(S, I(5)); if (!nice(A, fl) || (fl === "int" && A.d !== 1)) return null;
      const vs = a.map(qv); if (vs.indexOf(qv(A)) >= 0 || new Set(vs).size < 5) return null;
      const mx = a.reduce((p, c) => qv(c) > qv(p) ? c : p), mn = a.reduce((p, c) => qv(c) < qv(p) ? c : p);
      const mid = dv(add(mx, mn), I(2)); if (qv(mid) === qv(A) || !nice(mid, fl)) return null;
      const k = kq(kit, fl), k5 = dv(k, I(5)), A4 = mul(A, I(4)); if (!nice(A4, fl) || !nice(add(A, k), fl) || !nice(k5, fl)) return null;
      const f = x => sh(x, fl);
      const r = multiQ(kit, `五位同學的測驗成績是 ${a.map(f).join("、")} 分，平均數是 ${f(A)} 分。`, [
        [`這五個數的總和是 ${f(S)}`, `${f(A)}×5＝${f(S)}。`],
        [`每個人都多加 ${f(k)} 分，平均數會變成 ${f(add(A, k))} 分`, `每個數都加 ${f(k)}，平均也加 ${f(k)}。`],
        [`平均數 ${f(A)} 比最高分 ${f(mx)} 小`, "平均數一定介於最低與最高之間，這組資料不全相同，所以比最高分小。"],
        [`把總分平分給五個人，每人都是 ${f(A)} 分`, "平均數的意思就是「平分後每份的量」。"]
      ], [
        ["平均數一定是這組資料中的某一個數", `這組資料裡沒有 ${f(A)}，平均數不一定出現在資料中。`],
        ["平均數就是最高分與最低分的和的一半", `這組資料的最高、最低分和的一半是 ${f(mid)}，不是平均數 ${f(A)}。`],
        [`這五個數的總和是 ${f(A4)}`, `總和是 ${f(A)}×5＝${f(S)}，不是 ×4。`],
        [`只有最高分增加 ${f(k)} 分，平均數也增加 ${f(k)} 分`, `總和增加 ${f(k)}，要再 ÷5，平均只增加 ${f(k5)} 分。`]
      ]);
      r.trapNote = "平均數是「總和÷個數」，它不一定是資料裡的某個數，也不是最大與最小的中間值；只有一個數變動時，平均的變化要再除以個數。";
      return r;
    })),
    sp("statistics-multi-L3-02", "multi", 3, "trap", kit => retry(kit, fl => {
      const N1 = kit.pick([40, 80]), N2 = kit.pick([160, 200, 240, 320]);
      const p1 = shr(kit, fl), p2 = shr(kit, fl); if (qv(p1) <= qv(p2)) return null;
      const c1 = mul(I(N1), p1), c2 = mul(I(N2), p2); if (c1.d !== 1 || c2.d !== 1 || qv(c2) <= qv(c1)) return null;
      const T = x => showS(x, fl), f = x => sh(x, "dec");
      const r = multiQ(kit, `甲班有 ${N1} 人，喜歡閱讀的占 ${T(p1)}；乙班有 ${N2} 人，喜歡閱讀的占 ${T(p2)}。`, [
        ["甲班喜歡閱讀的「比例」比乙班高", `${T(p1)} > ${T(p2)}。`],
        [`乙班喜歡閱讀的有 ${f(c2)} 人`, `${N2}×${T(p2)}＝${f(c2)}。`],
        [`甲班喜歡閱讀的有 ${f(c1)} 人`, `${N1}×${T(p1)}＝${f(c1)}。`],
        ["乙班喜歡閱讀的「人數」比甲班多", `${f(c2)} > ${f(c1)}。`]
      ], [
        ["甲班的比例較高，所以甲班喜歡閱讀的人數較多", `比例高不代表人數多，還要看全班人數：甲 ${f(c1)} 人、乙 ${f(c2)} 人。`],
        [`甲班喜歡閱讀的有 ${f(pct(p1))} 人`, `${T(p1)} 要乘以 ${N1} 人，是 ${f(c1)} 人。`],
        [`乙班喜歡閱讀的有 ${f(pct(p2))} 人`, `${T(p2)} 要乘以 ${N2} 人，是 ${f(c2)} 人。`],
        ["兩班喜歡閱讀的人數一樣多", `甲 ${f(c1)} 人、乙 ${f(c2)} 人，不一樣多。`]
      ]);
      r.trapNote = "比較比例只能比「占全班的比例」，要比人數必須乘上各自的總人數。總人數不同時，比例高的人數不一定多。";
      return r;
    })),
    sp("statistics-multi-L4-01", "multi", 4, "basic", kit => retry(kit, fl => {
      const a = []; for (let i = 0; i < 5; i++) a.push(sc(kit, fl, 60, 100));
      const S = sumQ(a), A = dv(S, I(5)); if (!nice(A, fl) || (fl === "int" && A.d !== 1)) return null;
      const vs = a.map(qv); if (new Set(vs).size < 3) return null;
      const mx = a.reduce((p, c) => qv(c) > qv(p) ? c : p), mn = a.reduce((p, c) => qv(c) < qv(p) ? c : p);
      const mid = dv(add(mx, mn), I(2)), A4 = mul(A, I(4)), d1 = sub(mx, A), d2 = sub(A, mn), d3 = sub(mx, mn), d4 = add(A, I(3));
      if (qv(mid) === qv(A) || qv(d1) <= 0 || qv(d2) <= 0 || ![mid, A4, d1, d2, d3, add(mx, mn), add(d2, I(3))].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      return multiQ(kit, `小傑五次段考的成績是 ${a.map(f).join("、")} 分。`, [
        [`五次的總分是 ${f(S)} 分`, `${a.map(f).join("＋")}＝${f(S)}。`],
        [`五次的平均是 ${f(A)} 分`, `${f(S)}÷5＝${f(A)}。`],
        [`平均比最高分低 ${f(d1)} 分`, `${f(mx)}−${f(A)}＝${f(d1)}。`],
        [`最高分與最低分相差 ${f(d3)} 分`, `${f(mx)}−${f(mn)}＝${f(d3)}。`]
      ], [
        [`五次的平均是 ${f(mid)} 分`, `平均不是最高與最低的平均，應是 ${f(S)}÷5＝${f(A)}。`],
        [`五次的總分是 ${f(A4)} 分`, `總分是 ${f(A)}×5＝${f(S)}。`],
        [`平均比最低分高 ${f(add(d2, I(3)))} 分`, `${f(A)}−${f(mn)}＝${f(d2)}，不是 ${f(add(d2, I(3)))}。`],
        [`最高分與最低分相差 ${f(add(mx, mn))} 分`, `相差要相減：${f(mx)}−${f(mn)}＝${f(d3)}。`]
      ]);
    })),
    sp("statistics-multi-L5-01", "multi", 5, "extend", kit => retry(kit, fl => {
      const g = grpQ(kit, fl); if (!g) return null;
      const f = x => sh(x, fl), big = g.n1 > g.n2 ? "較多的甲組" : "較多的乙組", tw = mul(dv(add(g.a1, g.a2), I(2)), I(g.n1 + g.n2));
      if (!nice(tw, fl)) return null;
      return multiQ(kit, `甲組 ${g.n1} 人平均 ${f(g.a1)} 分，乙組 ${g.n2} 人平均 ${f(g.a2)} 分，兩組合成一個大組。`, [
        [`大組的總分是 ${f(g.tot)} 分`, `${g.n1}×${f(g.a1)}＋${g.n2}×${f(g.a2)}＝${f(g.tot)}。`],
        [`大組的平均是 ${f(g.T)} 分`, `${f(g.tot)}÷${g.n1 + g.n2}＝${f(g.T)}。`],
        [`大組的平均介於 ${f(g.a1)} 分與 ${f(g.a2)} 分之間`, "合併後的平均一定落在兩組平均之間。"],
        [`大組的平均比較接近人數${big}`, "人數多的一組占的比重大，把平均拉向自己。"]
      ], [
        [`大組的平均是 ${f(g.mid)} 分`, `兩組人數不同，不能直接平均，應是 ${f(g.T)} 分。`],
        [`大組的平均比 ${f(g.a1)} 分還低`, `平均會落在 ${f(g.a1)} 與 ${f(g.a2)} 之間，不可能比 ${f(g.a1)} 低。`],
        [`大組的平均比 ${f(g.a2)} 分還高`, `平均會落在 ${f(g.a1)} 與 ${f(g.a2)} 之間，不可能比 ${f(g.a2)} 高。`],
        [`大組的總分是 ${f(tw)} 分`, `總分應是 ${f(g.tot)} 分。`]
      ]);
    }))
  ]);

  reg("statistics", "tf", [
    sp("statistics-tf-L1-01", "tf", 1, "basic", kit => retry(kit, fl => {
      const N = kit.pick(NS), s = shr(kit, fl), c = mul(I(N), s); if (c.d !== 1 || c.n <= 0) return null;
      const nm = kit.pick(SPORTS), bad = kit.pick([mul(c, I(2)), add(c, I(5)), sub(I(N), c)]); if (qv(bad) === qv(c) || bad.n <= 0) return null;
      const f = a => sh(a, "dec"), head = `全班 ${N} 人，圓形圖顯示喜歡${nm}的占 ${showS(s, fl)}，所以喜歡${nm}的有`;
      return tfQ(kit,
        [`${head} ${f(c)} 人。`, `正確：${N}×${showS(s, fl)}＝${f(c)}（人）。`],
        [`${head} ${f(bad)} 人。`, `錯誤：人數＝${N}×${showS(s, fl)}＝${f(c)} 人，不是 ${f(bad)} 人。`]);
    })),
    sp("statistics-tf-L2-01", "tf", 2, "basic", kit => retry(kit, fl => {
      const a = []; for (let i = 0; i < 4; i++) a.push(sc(kit, fl));
      const S = sumQ(a), A = dv(S, I(4)); if (!nice(A, fl) || (fl === "int" && A.d !== 1)) return null;
      const dl = kit.pick([Qn(1, 2), Qn(1, 1), Qn(3, 2), Qn(2, 1)]), bad = kit.int(0, 1) ? add(A, dl) : sub(A, dl); if (!nice(bad, fl)) return null;
      const f = x => sh(x, fl), head = `${a.map(f).join("、")} 這四個數的平均數是`;
      return tfQ(kit,
        [`${head} ${f(A)}。`, `正確：(${a.map(f).join("＋")})÷4＝${f(S)}÷4＝${f(A)}。`],
        [`${head} ${f(bad)}。`, `錯誤：(${a.map(f).join("＋")})÷4＝${f(A)}。`]);
    })),
    sp("statistics-tf-L3-01", "tf", 3, "trap", kit => retry(kit, fl => {
      const s = shr(kit, fl), d = mul(s, I(360)); if (!nice(d, "dec")) return null;
      const bad = kit.int(0, 1) ? pct(s) : mul(pct(s), I(10)); if (qv(bad) === qv(d)) return null;
      const f = x => sh(x, "dec");
      const r = tfQ(kit,
        [`圓形圖中占 ${showS(s, fl)} 的扇形，圓心角是 ${f(d)} 度。`, `正確：360×${showS(s, fl)}＝${f(d)}（度）。`],
        [`圓形圖中占 ${showS(s, fl)} 的扇形，圓心角是 ${f(bad)} 度。`, `錯誤：圓心角＝360×${showS(s, fl)}＝${f(d)} 度，比例不能直接當度數。`]);
      r.trapNote = "整個圓＝整體＝360 度，圓心角要用 360 乘上所占的比例；把百分率（或分數的分子）直接當成角度是常見錯誤。";
      return r;
    })),
    sp("statistics-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const g = grpQ(kit, fl); if (!g) return null;
      const f = x => sh(x, fl), head = `甲班 ${g.n1} 人，平均 ${f(g.a1)} 分；乙班 ${g.n2} 人，平均 ${f(g.a2)} 分。兩班合起來的平均是`;
      const r = tfQ(kit,
        [`${head} ${f(g.T)} 分。`, `正確：總分 ${f(g.tot)} 分÷總人數 ${g.n1 + g.n2} 人＝${f(g.T)} 分。`],
        [`${head} ${f(g.mid)} 分。`, `錯誤：兩班人數不同，要用 (${g.n1}×${f(g.a1)}＋${g.n2}×${f(g.a2)})÷${g.n1 + g.n2}＝${f(g.T)} 分，不能把兩個平均再平均。`]);
      r.trapNote = "「平均的平均」只有在兩組人數相同時才成立；人數不同要先算各組總分。";
      return r;
    })),
    sp("statistics-tf-L5-01", "tf", 5, "extend", kit => retry(kit, fl => {
      const a = []; for (let i = 0; i < 5; i++) a.push(sc(kit, fl, 55, 100));
      const S = sumQ(a), A = dv(S, I(5)); if (!nice(A, fl) || (fl === "int" && A.d !== 1)) return null;
      const s4 = sumQ(a.slice(0, 4)), last = a[4], dl = kit.pick([Qn(3, 1), Qn(4, 1), Qn(6, 1), Qn(1, 2), Qn(3, 2)]);
      const bad = kit.int(0, 1) ? add(last, dl) : sub(last, dl); if (!nice(bad, fl)) return null;
      const f = x => sh(x, fl), head = `五個數的平均是 ${f(A)}，其中四個數是 ${a.slice(0, 4).map(f).join("、")}，則第五個數是`;
      return tfQ(kit,
        [`${head} ${f(last)}。`, `正確：總和＝${f(A)}×5＝${f(mul(A, I(5)))}，第五個數＝${f(mul(A, I(5)))}−${f(s4)}＝${f(last)}。`],
        [`${head} ${f(bad)}。`, `錯誤：總和＝${f(A)}×5＝${f(mul(A, I(5)))}，第五個數＝${f(mul(A, I(5)))}−${f(s4)}＝${f(last)}，不是 ${f(bad)}。`]);
    }))
  ]);

  reg("statistics", "fill", [
    sp("statistics-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const a = []; for (let i = 0; i < 5; i++) a.push(sc(kit, fl, 55, 100));
      const S = sumQ(a), A = dv(S, I(5)); if (!nice(A, fl) || (fl === "int" && A.d !== 1)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `某組五位同學的成績分別是 ${a.map(f).join("、")} 分，平均是 ____ 分。`, units: ["分"],
        explain: `解析：(${a.map(f).join("＋")})÷5＝${f(S)}÷5＝${f(A)}（分）。` }, ans(A, fl));
    })),
    sp("statistics-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const N = kit.pick([40, 80, 120, 160, 200, 240, 320, 400, 800, 1200]), s = shr(kit, fl), c = mul(I(N), s); if (c.d !== 1 || c.n <= 0) return null;
      return Object.assign({ stem: `全校有 ${N} 位學生，圓形圖顯示搭公車上學的占 ${showS(s, fl)}，搭公車的有 ____ 人。`, units: ["人", "位"],
        explain: `解析：${N}×${showS(s, fl)}＝${sh(c, "dec")}（人）。` }, ans(c, "int"));
    })),
    sp("statistics-fill-L3-01", "fill", 3, "basic", kit => retry(kit, fl => {
      const list = fl === "int" ? [10, 15, 20, 25, 30, 40, 50].map(p => Qn(p, 100)) : fl === "dec" ? [125, 625, 1875, 3125, 4375, 5625].map(p => Qn(p, 10000)) : [[1, 8], [3, 8], [5, 8], [1, 6], [5, 6], [1, 5], [2, 5], [3, 5], [1, 10], [3, 10]].map(p => Qn(p[0], p[1]));
      const s = kit.pick(list), d = mul(s, I(360)); if (!nice(d, "dec")) return null;
      const f = x => sh(x, "dec");
      if (isF(fl)) return Object.assign({ stem: `圓形圖中，某個扇形的圓心角是 ${f(d)} 度，它占全部的幾分之幾？（答案用最簡分數表示）`, units: [],
        explain: `解析：${f(d)}÷360＝${ExamKit.qFrac(s)}。` }, ans(s, fl));
      const p = pct(s);
      return Object.assign({ stem: `圓形圖中，某個扇形的圓心角是 ${f(d)} 度，它占全部的 ____ %。`, units: ["%", "％", "百分比"],
        explain: `解析：${f(d)}÷360＝${ExamKit.qFrac(s)}＝${f(p)}%。（每 3.6 度是 1%，${f(d)}÷3.6＝${f(p)}）` }, ans(p, "dec"));
    })),
    sp("statistics-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const r = isF(fl) ? kit.pick([Qn(1, 8), Qn(1, 5), Qn(1, 4), Qn(1, 2), Qn(3, 8), Qn(3, 4), Qn(2, 5)]) : fl === "dec" ? kit.pick([Qn(125, 1000), Qn(375, 1000), Qn(625, 1000), Qn(25, 1000), Qn(125, 1000)]) : kit.pick([Qn(1, 10), Qn(1, 5), Qn(1, 4), Qn(1, 2)]);
      const a = fl === "dec" || fl === "int" ? I(kit.pick([40, 80, 120, 200, 160])) : rq2(kit, fl), b = mul(a, add(I(1), r)); if (!nice(b, fl) || !nice(a, fl)) return null;
      const f = x => sh(x, fl), wrong = dv(sub(b, a), b);
      if (isF(fl)) return Object.assign({ stem: `小宇上個月的零用錢是 ${f(a)} 元，這個月是 ${f(b)} 元，這個月比上個月增加了上個月的幾分之幾？（用最簡分數表示）`, units: [],
        explain: `解析：增加量＝${f(b)}−${f(a)}＝${f(sub(b, a))} 元，以「上個月」為基準：${f(sub(b, a))}÷${f(a)}＝${ExamKit.qFrac(r)}。`,
        trapNote: `基準量是「上個月」的 ${f(a)} 元。若誤用這個月的 ${f(b)} 元當基準，會算成 ${ExamKit.qFrac(wrong)}。「比誰多」，誰就是基準量。` }, ans(r, "frac"));
      return Object.assign({ stem: `小宇上個月的零用錢是 ${f(a)} 元，這個月是 ${f(b)} 元，這個月比上個月增加了 ____ %。`, units: ["%", "％", "百分比"],
        explain: `解析：增加量＝${f(b)}−${f(a)}＝${f(sub(b, a))} 元，以「上個月」為基準：${f(sub(b, a))}÷${f(a)}＝${f(r)}＝${f(pct(r))}%。`,
        trapNote: `基準量是「上個月」的 ${f(a)} 元。若誤用這個月的 ${f(b)} 元當基準，會算成 ${kit.num(qv(wrong) * 100)}%。「比誰多」，誰就是基準量。` }, ans(pct(r), "dec"));
    })),
    sp("statistics-fill-L5-01", "fill", 5, "extend", kit => retry(kit, fl => {
      const N = kit.pick([40, 60, 80, 120, 160, 240, 320]), s = shr(kit, fl), k = mul(I(N), s), d = mul(s, I(360));
      if (k.d !== 1 || k.n <= 0 || !nice(d, "dec")) return null;
      const f = x => sh(x, "dec");
      return Object.assign({ stem: `圓形圖中，喜歡閱讀的扇形圓心角是 ${f(d)} 度，喜歡閱讀的有 ${f(k)} 人，全班共有 ____ 人。`, units: ["人", "位"],
        explain: `解析：圓心角 ${f(d)} 度占 ${f(d)}÷360＝${ExamKit.qFrac(s)}；${f(k)} 人是全班的 ${ExamKit.qFrac(s)}，全班＝${f(k)}÷${ExamKit.qFrac(s)}＝${N}（人）。` }, ans(I(N), "int"));
    }))
  ]);
  /* 帶分數風格的基準數量 */
  function rq2(kit, fl) { return kit.randQ("mixed", { min: 20, max: 80, dens: [2, 4] }); }

  reg("statistics", "calc", [
    sp("statistics-calc-L1-01", "calc", 1, "basic", kit => retry(kit, fl => {
      const a = []; for (let i = 0; i < 4; i++) a.push(sc(kit, fl, 55, 100));
      const S = sumQ(a), A = dv(S, I(4)); if (!nice(A, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `計算 ${a.map(f).join("、")} 這四個數的平均數。`, units: ["分"],
        explain: `解析：(${a.map(f).join("＋")})÷4＝${f(S)}÷4＝${f(A)}。` }, ans(A, fl));
    })),
    sp("statistics-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const N = kit.pick([40, 80, 120, 160, 240, 320, 400, 800]), s = shr(kit, fl), c = mul(I(N), s); if (c.d !== 1 || c.n <= 0) return null;
      return Object.assign({ stem: `某校 ${N} 位學生中有 ${showS(s, fl)} 參加社團，參加社團的有多少人？（列式：${N} × ${showS(s, fl)}）`, units: ["人", "位"],
        explain: `解析：${N}×${showS(s, fl)}＝${sh(c, "dec")}（人）。` }, ans(c, "int"));
    })),
    sp("statistics-calc-L3-01", "calc", 3, "basic", kit => retry(kit, fl => {
      const g = grpQ(kit, fl, true); if (!g) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `前 ${g.n1} 次測驗的平均是 ${f(g.a1)} 分，後 ${g.n2} 次測驗的平均是 ${f(g.a2)} 分。這 ${g.n1 + g.n2} 次測驗的總平均是多少分？`, units: ["分"],
        explain: `解析：總分＝${g.n1}×${f(g.a1)}＋${g.n2}×${f(g.a2)}＝${f(g.tot)}，平均＝${f(g.tot)}÷${g.n1 + g.n2}＝${f(g.T)}（分）。` }, ans(g.T, fl));
    })),
    sp("statistics-calc-L4-01", "calc", 4, "trap", kit => retry(kit, fl => {
      const r = isF(fl) ? kit.pick([Qn(1, 8), Qn(1, 5), Qn(1, 4), Qn(1, 2), Qn(3, 8), Qn(2, 5)]) : fl === "dec" ? kit.pick([Qn(125, 1000), Qn(375, 1000), Qn(25, 1000), Qn(625, 1000)]) : kit.pick([Qn(1, 10), Qn(1, 5), Qn(1, 4), Qn(1, 2)]);
      const a = fl === "dec" || fl === "int" ? I(kit.pick([40, 80, 120, 200, 160])) : rq2(kit, fl), b = mul(a, sub(I(1), r)); if (!nice(b, fl) || !nice(a, fl)) return null;
      const f = x => sh(x, fl), wrong = dv(sub(a, b), b);
      if (isF(fl)) return Object.assign({ stem: `某商品上個月賣出 ${f(a)} 公斤，這個月賣出 ${f(b)} 公斤，這個月比上個月減少了上個月的幾分之幾？`, units: [],
        explain: `解析：減少量＝${f(a)}−${f(b)}＝${f(sub(a, b))} 公斤，基準是上個月的 ${f(a)} 公斤：${f(sub(a, b))}÷${f(a)}＝${ExamKit.qFrac(r)}。`,
        trapNote: `「比上個月減少」的基準是上個月（${f(a)} 公斤）。若用這個月的 ${f(b)} 公斤當分母，會算出 ${ExamKit.qFrac(wrong)}，是錯的。` }, ans(r, "frac"));
      return Object.assign({ stem: `某商品上個月賣出 ${f(a)} 公斤，這個月賣出 ${f(b)} 公斤，這個月比上個月減少了百分之幾？`, units: ["%", "％", "百分比"],
        explain: `解析：減少量＝${f(a)}−${f(b)}＝${f(sub(a, b))} 公斤，基準是上個月的 ${f(a)} 公斤：${f(sub(a, b))}÷${f(a)}＝${f(r)}＝${f(pct(r))}%。`,
        trapNote: `「比上個月減少」的基準是上個月（${f(a)} 公斤）。若用這個月的 ${f(b)} 公斤當分母，會算出 ${kit.num(qv(wrong) * 100)}%，是錯的。` }, ans(pct(r), "dec"));
    })),
    sp("statistics-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const n = kit.pick([5, 6, 7, 9]), B = sc(kit, fl, 70, 85), d = kq(kit, fl), A = add(B, d), M = add(A, mul(I(n - 1), d));
      if (qv(M) > 100 || !nice(M, fl) || !nice(A, fl)) return null;
      const f = x => sh(x, fl), tot = mul(A, I(n));
      return Object.assign({ stem: `${n} 位同學的數學平均是 ${f(A)} 分，其中最高分是 ${f(M)} 分。去掉最高分後，其餘 ${n - 1} 位同學的平均是多少分？`, units: ["分"],
        explain: `解析：${n} 人總分＝${f(A)}×${n}＝${f(tot)}，去掉最高分後剩 ${f(tot)}−${f(M)}＝${f(sub(tot, M))}，平均＝${f(sub(tot, M))}÷${n - 1}＝${f(B)}（分）。` }, ans(B, fl));
    }))
  ]);

  reg("statistics", "word", [
    sp("statistics-word-L2-01", "word", 2, "basic", kit => retry(kit, fl => {
      const a = []; for (let i = 0; i < 4; i++) a.push(sc(kit, fl, 20, 90));
      const S = sumQ(a), A = dv(S, I(4)); if (!nice(A, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `小琪第一到第四週分別存了 ${a.map(f).join("、")} 元，她平均每週存多少元？`, units: ["元"],
        explain: `解析：總共存了 ${a.map(f).join("＋")}＝${f(S)} 元，平均＝${f(S)}÷4＝${f(A)}（元）。` }, ans(A, fl));
    })),
    sp("statistics-word-L3-01", "word", 3, "trap", kit => retry(kit, fl => {
      const v = []; for (let i = 0; i < 5; i++) v.push(sc(kit, fl, 40, 120));
      const vs = v.map(qv); if (new Set(vs).size < 5) return null;
      const diffs = [1, 2, 3, 4].map(i => { const d = sub(v[i], v[i - 1]); return d.n < 0 ? Qn(-d.n, d.d) : d; });
      const md = diffs.reduce((p, c) => qv(c) > qv(p) ? c : p), rg = qv(v.reduce((p, c) => qv(c) > qv(p) ? c : p)) - qv(v.reduce((p, c) => qv(c) < qv(p) ? c : p));
      if (Math.abs(qv(md) - rg) < 1e-9 || !nice(md, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `長條圖顯示資源回收場一月到五月回收的廢紙量依序是 ${v.map(f).join("、")} 公斤。相鄰兩個月的回收量相差最多是多少公斤？`, units: ["公斤", "kg"],
        explain: `解析：相鄰兩月的差依序是 ${diffs.map(f).join("、")}，最大的是 ${f(md)} 公斤。`,
        trapNote: `題目問「相鄰兩個月」的差。若直接用最高月減最低月 (差 ${kit.num(rg)})，兩個月不一定相鄰，會答錯。` }, ans(md, fl));
    })),
    sp("statistics-word-L3-02", "word", 3, "basic", kit => retry(kit, fl => {
      const N = kit.pick([40, 80, 120, 160, 240, 320]);
      const A = shr(kit, fl), B = shr(kit, fl), C = shr(kit, fl), left = sub(sub(sub(I(1), A), B), C); if (qv(left) <= 0.04) return null;
      const c = mul(I(N), left); if (c.d !== 1 || c.n <= 0) return null;
      const T = x => showS(x, fl);
      return Object.assign({ stem: `某班有 ${N} 人，圓形圖顯示最喜歡的休閒活動：看書占 ${T(A)}、運動占 ${T(B)}、聽音樂占 ${T(C)}，其餘的人最喜歡玩遊戲。最喜歡玩遊戲的有多少人？`, units: ["人", "位"],
        explain: `解析：玩遊戲占 1−${T(A)}−${T(B)}−${T(C)}＝${T(left)}，人數＝${N}×${T(left)}＝${sh(c, "dec")}（人）。` }, ans(c, "int"));
    })),
    sp("statistics-word-L4-01", "word", 4, "extend", kit => retry(kit, fl => {
      const N = kit.pick([30, 40, 50, 60]), m = kit.int(Math.floor(N / 3), Math.floor(N * 2 / 3)), am = sc(kit, fl, 65, 90), af = sc(kit, fl, 60, 95);
      if (qv(am) === qv(af)) return null;
      const T = dv(add(mul(I(m), am), mul(I(N - m), af)), I(N)); if (!nice(T, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `某班共有 ${N} 人，數學平均是 ${f(T)} 分，其中男生 ${m} 人，男生的平均是 ${f(am)} 分。女生的平均是多少分？`, units: ["分"],
        explain: `解析：全班總分＝${f(T)}×${N}＝${f(mul(T, I(N)))}，男生總分＝${f(am)}×${m}＝${f(mul(am, I(m)))}，女生總分＝${f(mul(T, I(N)))}−${f(mul(am, I(m)))}＝${f(sub(mul(T, I(N)), mul(am, I(m))))}，女生 ${N - m} 人，平均＝${f(sub(mul(T, I(N)), mul(am, I(m))))}÷${N - m}＝${f(af)}（分）。` }, ans(af, fl));
    })),
    sp("statistics-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const [N1, N2] = kit.pick([[200, 300], [300, 200], [100, 400], [400, 100], [200, 800], [600, 400]]);
      const s1 = shr(kit, fl), s2 = shr(kit, fl), c1 = mul(I(N1), s1), c2 = mul(I(N2), s2); if (c1.d !== 1 || c2.d !== 1) return null;
      const r = dv(add(c1, c2), I(N1 + N2)); if (!nice(r, fl)) return null;
      const T = x => showS(x, fl), f = x => sh(x, "dec");
      const base = { stem: `甲校有 ${N1} 位學生，騎腳踏車上學的占 ${T(s1)}；乙校有 ${N2} 位學生，騎腳踏車上學的占 ${T(s2)}。兩校合起來，騎腳踏車上學的占兩校學生總數的` + (isF(fl) ? "幾分之幾？（用最簡分數表示）" : "百分之幾？"),
        explain: `解析：甲校 ${N1}×${T(s1)}＝${f(c1)} 人，乙校 ${N2}×${T(s2)}＝${f(c2)} 人，合計 ${f(add(c1, c2))} 人；兩校共 ${N1 + N2} 人，${f(add(c1, c2))}÷${N1 + N2}＝${T(r)}。（不能把兩校的比例直接平均）` };
      return Object.assign(base, isF(fl) ? Object.assign({ units: ["的"] }, ans(r, "frac")) : Object.assign({ units: ["%", "％", "百分比"] }, ans(pct(r), "dec")));
    }))
  ]);
  /* 教材式 □ 未知數題（規格第 14 節） */
  reg("statistics", "box", [
    sp("statistics-box-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const a = []; for (let i = 0; i < 5; i++) a.push(sc(kit, fl, 55, 100));
      const S = sumQ(a), A = dv(S, I(5)); if (!nice(A, fl) || (fl === "int" && A.d !== 1)) return null;
      const f = x => sh(x, fl), four = a.slice(0, 4);
      return Object.assign({ stem: `五個數的平均是 ${f(A)}，其中四個是 ${four.map(f).join("、")}，第五個數是 □。□ ＝ ?`, units: [],
        explain: `解析：五個數的總和＝${f(A)}×5＝${f(mul(A, I(5)))}，□ ＝ ${f(mul(A, I(5)))} − (${four.map(f).join("＋")}) ＝ ${f(a[4])}。` }, ans(a[4], fl));
    })),
    sp("statistics-box-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const N = kit.pick([40, 80, 120, 160, 200, 240]), s = shr(kit, fl), c = mul(I(N), s); if (c.d !== 1 || c.n <= 0) return null;
      return Object.assign({ stem: `全班有 ${N} 人，喜歡籃球的有 □ 人，占全班的 ${showS(s, fl)}。□ ＝ ?`, units: ["人", "位"],
        explain: `解析：□ ＝ ${N} × ${showS(s, fl)} ＝ ${sh(c, "dec")}（人）。` }, ans(c, "int"));
    })),
    sp("statistics-box-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const N = kit.pick([40, 80, 120, 160, 200, 240]), s = shr(kit, fl), c = mul(I(N), s); if (c.d !== 1 || c.n <= 0) return null;
      if (isF(fl)) return Object.assign({ stem: `${N} × □ ＝ ${sh(c, "dec")}（全班 ${N} 人，其中 ${sh(c, "dec")} 人喜歡閱讀，□ 是所占的比例）。□ 用最簡分數表示是多少？`, units: [],
        explain: `解析：□ ＝ ${sh(c, "dec")} ÷ ${N} ＝ ${ExamKit.qFrac(s)}。` }, ans(s, "frac"));
      return Object.assign({ stem: `${N} × □% ＝ ${sh(c, "dec")}（全班 ${N} 人，其中 ${sh(c, "dec")} 人喜歡閱讀）。□ ＝ ?`, units: ["%", "％", "百分比"],
        explain: `解析：□% ＝ ${sh(c, "dec")} ÷ ${N} ＝ ${sh(s, "dec")} ＝ ${sh(pct(s), "dec")}%，所以 □ ＝ ${sh(pct(s), "dec")}。` }, ans(pct(s), "dec"));
    })),
    sp("statistics-box-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const s = shr(kit, fl), d = mul(s, I(360)); if (!nice(d, "dec")) return null;
      const o = qopts(kit, d, [dv(I(360), s), pct(s), sub(I(360), d), dv(d, I(2)), mul(s, I(36))], "int", " 度");
      return { stem: `圓形圖中某扇形的圓心角是 □ 度，已知 □ ÷ 360 ＝ ${showS(s, fl)}。□ 是多少度？`, options: o.options, answer: 0,
        explain: `解析：□ ＝ 360 × ${showS(s, fl)} ＝ ${sh(d, "dec")}（度）。`,
        trapNote: `□ 在被除數的位置，要用「商 × 除數」，也就是乘以 360；常見錯誤是用 360 ÷ ${showS(s, fl)}，或把比例直接當成度數。` };
    })),
    sp("statistics-box-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const b = sc(kit, fl, 60, 90), A = sc(kit, fl, 70, 95), x = sub(mul(I(2), A), b), bad = sub(A, b); if (!nice(x, fl) || !nice(bad, fl) || qv(bad) === qv(x)) return null;
      const f = y => sh(y, fl), head = `兩次成績 (□ ＋ ${f(b)}) ÷ 2 ＝ ${f(A)}，所以 □ ＝`;
      const r = tfQ(kit,
        [`${head} ${f(x)}。`, `正確：□ ＋ ${f(b)} ＝ ${f(A)}×2 ＝ ${f(mul(A, I(2)))}，□ ＝ ${f(mul(A, I(2)))} − ${f(b)} ＝ ${f(x)}。`],
        [`${head} ${f(bad)}。`, `錯誤：先還原 ÷2，□ ＋ ${f(b)} ＝ ${f(mul(A, I(2)))}，□ ＝ ${f(x)}，不是 ${f(bad)}。`]);
      r.trapNote = "(□＋某數)÷2 ＝ 平均，要先把 ÷2 還原成 ×2 得到「總和」，再減去已知的數；直接用平均減已知數會少算一半。";
      return r;
    })),
    sp("statistics-box-word-L3-01", "word", 3, "trap", kit => retry(kit, fl => {
      const a = sc(kit, fl, 70, 88), B = add(a, kq(kit, fl)), need = sub(mul(I(5), B), mul(I(4), a)); if (qv(need) > 100 || !nice(need, fl) || !nice(B, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `小琪前四次考試的平均是 ${f(a)} 分，她希望五次考完後的平均剛好是 ${f(B)} 分，第五次要考 □ 分。□ ＝ ?`, units: ["分"],
        explain: `解析：五次總分要 ${f(B)}×5＝${f(mul(B, I(5)))}，前四次總分 ${f(a)}×4＝${f(mul(a, I(4)))}，□ ＝ ${f(mul(B, I(5)))} − ${f(mul(a, I(4)))} ＝ ${f(need)}（分）。`,
        trapNote: `不能直接用 ${f(B)} 當第五次的分數，也不能只補平均的差。前四次本來就有的分數要用總分算：目標總分減已有總分。` }, ans(need, fl));
    })),
    sp("statistics-box-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const S = sc(kit, fl, 130, 190), D = sc(kit, fl, 2, 15), big = dv(add(S, D), I(2)); if (!nice(big, fl) || !nice(dv(sub(S, D), I(2)), fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `小傑兩次測驗，第一次考 □ 分、第二次考 △ 分。□ ＋ △ ＝ ${f(S)}，□ － △ ＝ ${f(D)}。□ ＝ ?`, units: ["分"],
        explain: `解析：和加差得 2 個 □＝${f(S)}＋${f(D)}＝${f(add(S, D))}，□ ＝ ${f(add(S, D))} ÷ 2 ＝ ${f(big)}（分）。（△ ＝ ${f(dv(sub(S, D), I(2)))}）` }, ans(big, fl));
    })),
    sp("statistics-box-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const n1 = kit.pick([2, 3, 4]), n2 = kit.pick([2, 3]), a1 = sc(kit, fl, 70, 90), a2 = sc(kit, fl, 70, 95), tot = add(mul(I(n1), a1), mul(I(n2), a2)), T = dv(tot, I(n1 + n2));
      if (!nice(T, fl) || !nice(tot, fl) || qv(a1) === qv(a2)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `前 ${n1} 次測驗的平均是 ${f(a1)} 分，後 ${n2} 次測驗的平均是 □ 分，這 ${n1 + n2} 次的總平均是 ${f(T)} 分。□ ＝ ?`, units: ["分"],
        explain: `解析：${n1 + n2} 次總分＝${f(T)}×${n1 + n2}＝${f(tot)}，前 ${n1} 次總分＝${f(a1)}×${n1}＝${f(mul(a1, I(n1)))}，後 ${n2} 次總分＝${f(tot)}−${f(mul(a1, I(n1)))}＝${f(mul(a2, I(n2)))}，□ ＝ ${f(mul(a2, I(n2)))} ÷ ${n2} ＝ ${f(a2)}（分）。` }, ans(a2, fl));
    })),
    sp("statistics-box-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const a = rq2b(kit, fl, 2, 9), b = rq2b(kit, fl, 2, 9), k = kit.int(2, 6), tot = add(mul(b, I(k)), a); if (!nice(tot, fl)) return null;
      const f = x => sh(x, fl);
      return Object.assign({ stem: `把 □ 公斤的米拿走 ${f(a)} 公斤後，剩下的平分給 ${k} 個人，每人分到 ${f(b)} 公斤，也就是 (□ － ${f(a)}) ÷ ${k} ＝ ${f(b)}。□ ＝ ?`, units: ["公斤"],
        explain: `解析：先還原 ÷${k}：□ － ${f(a)} ＝ ${f(b)}×${k} ＝ ${f(mul(b, I(k)))}，再還原 −${f(a)}：□ ＝ ${f(mul(b, I(k)))} ＋ ${f(a)} ＝ ${f(tot)}（公斤）。`,
        trapNote: `括號先做的是「減 ${f(a)}」，最後才 ÷${k}，還原時順序要倒過來：先 ×${k}，再 ＋${f(a)}。常見錯誤是 (${f(b)} − ${f(a)}) × ${k} 或 ${f(b)}×${k} − ${f(a)}。` }, ans(tot, fl));
    }))
  ]);
  function rq2b(kit, fl, lo, hi) { return fl === "int" ? I(kit.int(lo, hi)) : kit.randQ(fl === "dec" ? "dec" : "mixed", { min: lo, max: hi, dens: [2, 4], places: 1 }); }
})();
