/* 題庫：speed（距離＝速率×時間、秒速分速時速換算、相遇與追趕入門）｜題庫工 C
   數字風格（規格第 11 節）：整數／小數／分數／帶分數，全部以 kit.Q 精確運算。 */
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
    for (const fl of [f0, "int"]) for (let i = 0; i < 400; i++) { curFl = fl; const r = build(fl); if (r) return r; }
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
  function multiQ(kit, note, head, trues, falses) {
    const nt = kit.int(2, Math.min(3, trues.length));
    const nf = nt === 2 ? kit.int(2, 3) : 2;
    const all = kit.shuffle(kit.shuffle(trues).slice(0, nt).map(x => ({ x, ok: 1 })).concat(kit.shuffle(falses).slice(0, nf).map(x => ({ x, ok: 0 }))));
    return {
      stem: head + "\n請選出所有正確的敘述（複選）。",
      options: all.map(o => o.x[0]),
      answer: all.map((o, i) => o.ok ? i : -1).filter(i => i >= 0),
      explain: "解析：\n" + all.map(o => (o.ok ? "【正確】" : "【錯誤】") + o.x[0] + "：" + o.x[1]).join("\n") + "\n解題重點：" + note,
      explain2: "解法二（逐項代入檢驗）：" + all.map(o => "．" + o.x[0] + "（" + (o.x[2] || o.x[1]).replace(/[＝=]/g, "等於") + "）→" + (o.ok ? "成立" : "不成立")).join("；") + "。答案是標示成立的選項。"
    };
  }
  function tfQ(kit, alt, okItem, badItem) {
    const ok = kit.int(0, 1) === 1; const it = ok ? okItem : badItem;
    return { stem: "判斷下列敘述是否正確：\n" + it[0], answer: ok, explain: "解析：" + it[1], explain2: alt(ok) };
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
      const fz = x => sw(x, fl);
      const o = qopts(kit, d, [add(v, t), add(d, v), sub(d, v), mul(d, I(2)), dv(d, I(2)), dv(v, t)], fl, " 公里");
      return { explain2: `解法二（分成兩段時間算）：${fz(t)} 小時分成兩段，每段 ${fz(dv(t, I(2)))} 小時，每段走 ${fz(mul(v, dv(t, I(2))))} 公里，兩段合起來是 ${f(d)} 公里。`,
        stem: `一輛汽車的時速是 ${f(v)} 公里，連續行駛 ${f(t)} 小時，共行駛多少公里？`, options: o.options, answer: 0,
        explain: `解析：距離＝速率×時間＝${f(v)}×${f(t)}＝${f(d)}（公里）。` };
    })),
    sp("speed-single-L2-01", "single", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 20, 80), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      const o = qopts(kit, v, [add(d, t), mul(d, t), sub(d, t), t, add(v, t), d], fl, " 公里/時");
      return { explain2: `解法二（兩邊一起減半）：${fz(t)} 小時走 ${fz(d)} 公里，兩邊都減半，變成 ${fz(dv(t, I(2)))} 小時走 ${fz(dv(d, I(2)))} 公里，快慢不變。再把 ${fz(dv(d, I(2)))} 公里除以 ${fz(dv(t, I(2)))} 小時，得 ${f(v)} 公里/時。`,
        stem: `小美騎機車 ${f(t)} 小時，共行駛 ${f(d)} 公里，她的平均時速是多少？`, options: o.options, answer: 0,
        explain: `解析：速率＝距離÷時間＝${f(d)}÷${f(t)}＝${f(v)}（公里/時）。` };
    })),
    sp("speed-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const x = rq(kit, fl, 2, 30, { dens: [2, 4, 5] }), c = mul(x, Qn(18, 5)); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      const o = qopts(kit, c, [mul(x, I(60)), mul(x, I(3600)), mul(x, I(36)), dv(x, Qn(18, 5)), mul(x, I(6))], fl, " 公里/時");
      return { explain2: `解法二（分兩步換）：先換成每分鐘：${fz(x)} × 60 ＝ ${fz(mul(x, I(60)))} 公尺/分。再算 1 小時（60 分鐘）：${fz(mul(x, I(60)))} × 60 ＝ ${fz(mul(x, I(3600)))} 公尺，把公尺換成公里（÷1000）是 ${fz(c)} 公里。所以時速是 ${f(c)} 公里/時。`,
        stem: `一位選手跑步的速率是每秒 ${f(x)} 公尺，換成時速是多少公里？`, options: o.options, answer: 0,
        explain: `解析：1 小時＝3600 秒，所以每小時跑 ${f(x)}×3600＝${f(mul(x, I(3600)))} 公尺；1 公里＝1000 公尺，所以是 ${f(mul(x, I(3600)))}÷1000＝${f(c)} 公里/時（也就是 ×3.6）。`,
        trapNote: `×60 只換成「分速」（${f(mul(x, I(60)))} 公尺/分），不是時速；×3600 忘了把公尺換成公里（${f(mul(x, I(3600)))} 是公尺/時）。秒速換時速要「×3600 再 ÷1000」。` };
    })),
    sp("speed-single-L4-01", "single", 4, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 24, 108), m = kit.pick([10, 15, 20, 30, 40, 45, 50]), d = mul(v, Qn(m, 60)); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      const o = qopts(kit, d, [mul(v, I(m)), mul(v, Qn(m, 6)), dv(v, I(m)), add(v, I(m)), mul(d, I(2)), dv(d, I(2))], fl, " 公里");
      return { explain2: `解法二（看占 1 小時的幾分之幾）：${m} 分鐘只占 1 小時的 ${ExamKit.qFrac(Qn(m, 60))}，所以只走 ${fz(v)} 公里的 ${ExamKit.qFrac(Qn(m, 60))}，也就是 ${f(d)} 公里。`,
        stem: `一輛火車的時速是 ${f(v)} 公里，行駛 ${m} 分鐘，共行駛多少公里？`, options: o.options, answer: 0,
        explain: `解析：${m} 分鐘＝${m}/60 小時，距離＝${f(v)}×${m}/60＝${f(d)}（公里）。`,
        trapNote: `時速的單位是「小時」，時間給的是「分鐘」，直接 ${f(v)}×${m}＝${f(mul(v, I(m)))} 會多算 60 倍。必須先把 ${m} 分鐘換成 ${m}/60 小時再乘。` };
    })),
    sp("speed-single-L5-01", "single", 5, "extend", kit => retry(kit, fl => {
      const p = pairQ(kit, fl); if (!p.ok) return null;
      const c = avgQ(p.A, p.B); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      const half = dv(add(p.A, p.B), I(2)), diff = sub(p.A, p.B);
      const o = qopts(kit, c, [half, dv(mul(p.A, p.B), add(p.A, p.B)), add(p.A, p.B), diff.n < 0 ? sub(p.B, p.A) : diff, qv(p.A) < qv(p.B) ? p.A : p.B], fl, " 公里/時");
      const tsum = add(dv(I(1), p.A), dv(I(1), p.B));
      return { explain2: `解法二（假設路程）：假設單程是 ${fz(mul(p.A, p.B))} 公里。去程每小時 ${fz(p.A)} 公里，要 ${fz(p.B)} 小時；回程每小時 ${fz(p.B)} 公里，要 ${fz(p.A)} 小時；共 ${fz(add(p.A, p.B))} 小時。往返 ${fz(mul(I(2), mul(p.A, p.B)))} 公里，${fz(mul(I(2), mul(p.A, p.B)))} ÷ ${fz(add(p.A, p.B))} ＝ ${fz(c)}。所以平均時速是 ${f(c)} 公里/時。`,
        stem: `甲、乙兩地的路程固定。小凱去程的時速是 ${f(p.A)} 公里，回程的時速是 ${f(p.B)} 公里。他往返一趟的平均時速是多少？`, options: o.options, answer: 0,
        explain: `解析：設單程為 1（單位路程），往返總路程 2；去程時間 1÷${f(p.A)}＝${ExamKit.qFrac(dv(I(1), p.A))}，回程時間 1÷${f(p.B)}＝${ExamKit.qFrac(dv(I(1), p.B))}，總時間 ${ExamKit.qFrac(tsum)}。平均時速＝總路程÷總時間＝2÷${ExamKit.qFrac(tsum)}＝${f(c)} 公里/時。平均速率要用「總距離÷總時間」，不能把兩個速率直接平均。` };
    }))
  ]);

  reg("speed", "multi", [
    sp("speed-multi-L2-01", "multi", 2, "basic", kit => {
      const v = kit.pick([40, 50, 60, 70, 80]);
      return multiQ(kit, "距離、速率、時間三者互相推得出來：速率＝距離÷時間，時間＝距離÷速率，距離＝速率×時間。可以用簡單的數字（例如走 2 小時）來檢查每一句有沒有道理。", "關於距離、速率與時間的關係：", [
        ["距離 ÷ 時間 ＝ 速率", "速率是單位時間內走的距離。", `舉例：2 小時走 ${2 * v} 公里，${2 * v} 除以 2 得每小時 ${v} 公里`],
        ["距離 ÷ 速率 ＝ 時間", "由 距離＝速率×時間 倒推。", `舉例：走 ${2 * v} 公里、每小時 ${v} 公里，要 ${2 * v} 除以 ${v} ＝ 2 小時`],
        ["速率 × 時間 ＝ 距離", "這是最基本的關係式。", `舉例：每小時 ${v} 公里走 2 小時，共 ${2 * v} 公里`],
        [`每小時走 ${v} 公里，就是時速 ${v} 公里`, "時速就是每小時走的距離。", `時速就是 1 小時走的路，1 小時走 ${v} 公里就是 ${v}`]
      ], [
        ["速率 ÷ 時間 ＝ 距離", "距離應是速率×時間，不是相除。", `舉例：速率 ${v}、時間 2，相除得 ${kit.num(v / 2)}，但實際走了 ${2 * v}，對不上`],
        ["距離 × 速率 ＝ 時間", "時間應是距離÷速率。", `舉例：${2 * v} 乘 ${v} 得 ${2 * v * v}，時間不可能這麼大（實際是 2 小時）`],
        ["距離 ＝ 速率 + 時間", "速率與時間要相乘，不能相加。", `舉例：${v} 加 2 得 ${v + 2}，但實際走了 ${2 * v}，對不上`],
        ["時間 ÷ 距離 ＝ 速率", "速率應是距離÷時間，除數與被除數反了。", `舉例：2 除以 ${2 * v} 約是 ${kit.num(1 / v)}，不是速率 ${v}`]
      ]);
    }),
    sp("speed-multi-L3-01", "multi", 3, "trap", kit => {
      const x = kit.pick([5, 10, 15, 20, 25]);
      const r = multiQ(kit, "換算單位時，先想單位變大還是變小：秒換成分要乘 60，分換成時再乘 60，公尺換成公里要除以 1000，所以公尺/秒換成公里/時總共是乘 3.6。", "關於速率單位的換算：", [
        [`${x} 公尺/秒 ＝ ${60 * x} 公尺/分`, "1 分鐘＝60 秒，每分鐘走的距離是每秒的 60 倍。", `1 分鐘走 60 個 ${x} 公尺：${x} 乘 60 得 ${60 * x}`],
        [`${x} 公尺/秒 ＝ ${kit.num(3.6 * x)} 公里/時`, `×3600 秒再 ÷1000：${x}×3.6＝${kit.num(3.6 * x)}。`, `每小時走 ${x} 乘 3600 ＝ ${3600 * x} 公尺，再換成 ${kit.num(3.6 * x)} 公里`],
        [`${60 * x} 公里/時 ＝ ${x} 公里/分`, "1 小時＝60 分鐘，所以分速是時速的 1/60。", `1 小時是 60 分鐘，${60 * x} 除以 60 得 ${x}`],
        [`${60 * x} 公尺/分 ＝ ${x} 公尺/秒`, "每分鐘走的距離除以 60 就是每秒走的距離。", `1 分鐘是 60 秒，${60 * x} 除以 60 得 ${x}`]
      ], [
        [`${x} 公尺/秒 ＝ ${3600 * x} 公里/時`, `${3600 * x} 是公尺/時，還要 ÷1000 才是公里/時。`, `${3600 * x} 是公尺數，換成公里還要除以 1000，得 ${kit.num(3.6 * x)}`],
        [`${x} 公里/時 ＝ ${60 * x} 公里/分`, "分速應是時速的 1/60，不是 60 倍。", `1 小時有 60 個 1 分鐘，分速應是 ${x} 除以 60，約 ${kit.num(x / 60)}，不是 ${60 * x}`],
        [`${x} 公尺/分 ＝ ${60 * x} 公尺/秒`, "每秒走的比每分鐘少，應該 ÷60。", `每秒走的比每分鐘少，${x} 除以 60 約是 ${kit.num(x / 60)}`],
        [`${x} 公尺/秒 ＝ ${kit.num(x * 6)} 公里/時`, `應是 ×3.6，得 ${kit.num(x * 3.6)}。`, `${x} 乘 3.6 ＝ ${kit.num(3.6 * x)}，不是乘 6`]
      ]);
      r.trapNote = "換算時要想「單位變大還是變小」：秒→時要 ×3600，公尺→公里要 ÷1000；常見錯誤是漏掉 ÷1000，或把 60 與 3600 搞混。";
      return r;
    }),
    sp("speed-multi-L3-02", "multi", 3, "trap", kit => retry(kit, fl => {
      const b = rq(kit, fl, 40, 60), a = add(b, rq(kit, fl, 5, 20)), t = tq(kit, fl);
      const s = add(a, b), df = sub(a, b), ds = mul(s, t), dd = mul(df, t), t1 = add(t, I(1));
      if (![s, df, ds, dd, t1].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      const r = multiQ(kit, "兩車面對面走（相向）時，每小時縮短的距離是兩個速率加起來；兩車同方向追趕時，每小時追近的距離是兩個速率的差。再用距離除以每小時縮短（追近）的量，就是需要的時間。", `甲車時速 ${f(a)} 公里，乙車時速 ${f(b)} 公里。`, [
        [`兩車從兩地同時相向出發，每小時共同縮短 ${f(s)} 公里`, "相向是「速率相加」。", `1 小時一起靠近 ${fz(s)} 公里`],
        [`甲在乙後方、同向追趕，每小時追近 ${f(df)} 公里`, "同向追趕是「速率相減」。", `1 小時甲多走 ${fz(df)} 公里`],
        [`兩車相向，相距 ${f(ds)} 公里，${f(t)} 小時後相遇`, `${f(ds)}÷${f(s)}＝${f(t)}（小時）。`, `${fz(s)} 乘 ${fz(t)} ＝ ${fz(ds)}，剛好走完`],
        [`甲在乙後方 ${f(dd)} 公里同向追趕，${f(t)} 小時追上`, `${f(dd)}÷${f(df)}＝${f(t)}（小時）。`, `${fz(df)} 乘 ${fz(t)} ＝ ${fz(dd)}，剛好追上`]
      ], [
        [`兩車相向，每小時共同縮短 ${f(df)} 公里`, "相向要相加，不是相減。", `相向要加：${fz(s)}，不是 ${fz(df)}`],
        [`甲在乙後方同向追趕，每小時追近 ${f(s)} 公里`, "同向追趕要相減，不是相加。", `同向要減：${fz(df)}，不是 ${fz(s)}`],
        [`兩車相向，相距 ${f(ds)} 公里，${f(t1)} 小時後相遇`, `應是 ${f(ds)}÷${f(s)}＝${f(t)} 小時。`, `${fz(t1)} 小時縮短 ${fz(mul(s, t1))}，比全程 ${fz(ds)} 多`],
        [`甲在乙後方 ${f(dd)} 公里同向追趕，${f(t1)} 小時追上`, `應是 ${f(dd)}÷${f(df)}＝${f(t)} 小時。`, `${fz(t1)} 小時追近 ${fz(mul(df, t1))}，比 ${fz(dd)} 多`]
      ]);
      r.trapNote = "相向（面對面）時兩者的路程加在一起，速率用「和」；同向追趕時是快的比慢的多走，速率用「差」。兩種情況加減弄反，時間就會算錯。";
      return r;
    })),
    sp("speed-multi-L4-01", "multi", 4, "basic", kit => {
      const v = kit.pick([36, 72, 108]), m = kit.pick([10, 20, 30, 40, 50]), t = kit.int(2, 4);
      return multiQ(kit, "時速是 1 小時走的距離：想知道 1 分鐘走多少就除以 60，想知道 1 秒鐘走多少，要先換成公尺再除以 3600；想知道幾分鐘走多少，就乘上（分鐘數 ÷ 60）小時。", `一列火車以時速 ${v} 公里等速前進。`, [
        [`每分鐘行 ${kit.num(v / 60)} 公里`, `${v}÷60＝${kit.num(v / 60)}。`, `1 小時 60 分鐘，${v} 公里平分成 60 份，每份 ${kit.num(v / 60)}`],
        [`每秒行 ${kit.num(v / 3.6)} 公尺`, `${v}×1000÷3600＝${kit.num(v / 3.6)}。`, `${v} 公里/時 要除以 3.6 才是公尺/秒，得 ${kit.num(v / 3.6)}`],
        [`行駛 ${t} 小時共 ${v * t} 公里`, `${v}×${t}＝${v * t}。`, `1 小時走 ${v} 公里，${t} 小時就是 ${t} 個 ${v}，共 ${v * t}`],
        [`行駛 ${m} 分鐘共 ${kit.num(v * m / 60)} 公里`, `${v}×${m}/60＝${kit.num(v * m / 60)}。`, `${m} 分鐘只占 1 小時的 ${m}/60，${v} 的 ${m}/60 是 ${kit.num(v * m / 60)}`]
      ], [
        [`每分鐘行 ${v} 公里`, `${v} 是每小時的距離，每分鐘要 ÷60。`, `${v} 是 1 小時走的路，1 分鐘不可能一樣多`],
        [`每秒行 ${kit.num(v * 3.6)} 公尺`, `應是 ÷3.6，得 ${kit.num(v / 3.6)} 公尺。`, `公里/時換成公尺/秒要除以 3.6，不是乘，應是 ${kit.num(v / 3.6)}`],
        [`行駛 ${m} 分鐘共 ${v * m} 公里`, `${m} 分鐘要先換成 ${m}/60 小時，答案是 ${kit.num(v * m / 60)} 公里。`, `${m} 分鐘還不到 1 小時，路程不會超過 ${v} 公里的 ${m} 倍那麼多`],
        [`每分鐘行 ${kit.num(v / 60 * 100)} 公尺`, `${kit.num(v / 60)} 公里＝${kit.num(v / 60 * 1000)} 公尺，不是 ×100。`, `每分鐘 ${kit.num(v / 60)} 公里 ＝ ${kit.num(v / 60 * 1000)} 公尺，1 公里是 1000 公尺，不是乘 100`]
      ]);
    }),
    sp("speed-multi-L5-01", "multi", 5, "extend", kit => retry(kit, fl => {
      const vb = rq(kit, fl, 40, 55), va = add(vb, rq(kit, fl, 5, 20)), t = tq(kit, fl), sm = add(va, vb), D = mul(sm, t);
      const A = mul(va, t), B = mul(vb, t), C = mul(sub(va, vb), t), H = dv(D, I(2)), T2 = mul(t, I(2)), df = sub(va, vb);
      if (![D, A, B, C, H, T2, df].every(x => nice(x, fl))) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return multiQ(kit, "先求兩車每小時共同縮短的距離（速率相加），再用全程除以它得到相遇時間；各車走的路是自己的速率乘上相遇時間；兩車走的路加起來要等於全程。", `甲、乙兩地相距 ${f(D)} 公里。甲車時速 ${f(va)} 公里、乙車時速 ${f(vb)} 公里，兩車同時由兩地相向而行。`, [
        [`${f(t)} 小時後兩車相遇`, `${f(D)}÷(${f(va)}+${f(vb)})＝${f(t)}。`, `每小時共縮短 ${fz(sm)} 公里，走完 ${fz(D)} 公里要 ${fz(t)} 小時`],
        [`相遇時甲車行了 ${f(A)} 公里`, `${f(va)}×${f(t)}＝${f(A)}。`, `甲 1 小時走 ${fz(va)} 公里，${fz(t)} 小時是 ${fz(A)} 公里`],
        [`相遇時甲車比乙車多行 ${f(C)} 公里`, `${f(A)}−${f(B)}＝${f(C)}。`, `兩車每小時差 ${fz(df)} 公里，${fz(t)} 小時差 ${fz(C)} 公里`],
        [`相遇時乙車行了 ${f(B)} 公里`, `${f(vb)}×${f(t)}＝${f(B)}。`, `乙 1 小時走 ${fz(vb)} 公里，${fz(t)} 小時是 ${fz(B)} 公里`]
      ], [
        [`${f(T2)} 小時後兩車相遇`, `相遇時間是 ${f(t)} 小時。`, `${fz(T2)} 小時共縮短 ${fz(mul(sm, T2))} 公里，比全程 ${fz(D)} 公里還多`],
        [`相遇時甲車行了 ${f(H)} 公里`, `兩車速率不同，不會各走一半；甲走 ${f(A)} 公里。`, `甲較快，應該比全程的一半 ${fz(H)} 公里走得更遠，實際是 ${fz(A)}`],
        [`相遇時乙車行了 ${f(A)} 公里`, `乙車只走 ${f(B)} 公里；${f(A)} 是甲車走的。`, `乙較慢，走的路應比甲少，乙只走了 ${fz(B)} 公里`],
        [`兩車每小時共同縮短 ${f(df)} 公里`, `相向要用速率和 ${f(sm)}，不是差。`, `相向要把兩車的路加起來：${fz(va)} 加 ${fz(vb)} 得 ${fz(sm)}，不是差`]
      ]);
    }))
  ]);

  reg("speed", "tf", [
    sp("speed-tf-L1-01", "tf", 1, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 30, 90), t = tq(kit, fl), d = mul(v, t), bad = add(v, t); if (!nice(d, fl) || !nice(bad, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return tfQ(kit, ok => `解法二（分成兩段時間算）：${fz(t)} 小時的一半是 ${fz(dv(t, I(2)))} 小時，走 ${fz(mul(v, dv(t, I(2))))} 公里；兩個一半合起來是 ${fz(d)} 公里。敘述寫 ${fz(ok ? d : bad)} 公里，${ok ? "一樣" : "不一樣"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`時速 ${f(v)} 公里的汽車，行駛 ${f(t)} 小時，共行駛 ${f(d)} 公里。`, `正確：行駛的距離要用速率乘上時間來算，${f(v)}×${f(t)}＝${f(d)}（公里），和敘述寫的一樣。`],
        [`時速 ${f(v)} 公里的汽車，行駛 ${f(t)} 小時，共行駛 ${f(bad)} 公里。`, `錯誤：距離＝速率×時間＝${f(v)}×${f(t)}＝${f(d)} 公里，不是相加。`]);
    })),
    sp("speed-tf-L2-01", "tf", 2, "basic", kit => retry(kit, fl => {
      const x = rq(kit, fl, 3, 15), c = mul(x, I(60)), bad = mul(x, I(kit.pick([6, 100]))); if (!nice(c, fl) || !nice(bad, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return tfQ(kit, ok => `解法二（倒回去算）：把敘述裡的每分鐘 ${fz(ok ? c : bad)} 公尺除以 60，得到每秒 ${fz(dv(ok ? c : bad, I(60)))} 公尺，${ok ? "剛好是" : "不是"}題目的 ${fz(x)} 公尺，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`每秒 ${f(x)} 公尺的速率，等於每分鐘 ${f(c)} 公尺。`, `正確：1 分鐘＝60 秒，${f(x)}×60＝${f(c)}。`],
        [`每秒 ${f(x)} 公尺的速率，等於每分鐘 ${f(bad)} 公尺。`, `錯誤：1 分鐘＝60 秒，應是 ${f(x)}×60＝${f(c)} 公尺/分。`]);
    })),
    sp("speed-tf-L3-01", "tf", 3, "trap", kit => retry(kit, fl => {
      const B = rq(kit, fl, 10, 30, { dens: [5, 10] }), conv = mul(B, Qn(18, 5)), delta = I(kit.pick([-18, -9, 9, 18]));
      const A = add(conv, delta); if (!nice(A, fl) || !nice(conv, fl)) return null;
      const ok = delta.n > 0, f = a => sh(a, fl);
      return { explain2: `解法二（都換成公尺/秒）：列車時速 ${f(A)} 公里，除以 3.6 換成 ${f(dv(A, Qn(18, 5)))} 公尺/秒，再和汽車的 ${f(B)} 公尺/秒比：列車${ok ? "比較快" : "比較慢"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        stem: `判斷下列敘述是否正確：\n時速 ${f(A)} 公里的列車，比秒速 ${f(B)} 公尺的汽車快。`, answer: ok,
        explain: `解析：秒速 ${f(B)} 公尺＝${f(B)}×3.6＝${f(conv)} 公里/時。${f(A)} ${ok ? ">" : "<"} ${f(conv)}，所以列車${ok ? "比較快" : "比較慢"}，此敘述${ok ? "正確" : "錯誤"}。`,
        trapNote: `${f(A)} 與 ${f(B)} 單位不同（公里/時 與 公尺/秒），不能直接比數字大小；${f(A)}>${f(B)} 看起來列車快，但要先把單位統一。` };
    })),
    sp("speed-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const b = rq(kit, fl, 40, 60), a = add(b, rq(kit, fl, 5, 20)), df = sub(a, b), sm = add(a, b); if (!nice(df, fl) || !nice(sm, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      const r = tfQ(kit, ok => `解法二（舉例想像）：甲每小時走 ${fz(a)} 公里，乙每小時走 ${fz(b)} 公里，1 小時後甲只比乙多走 ${fz(df)} 公里，也就是兩人距離每小時只縮短 ${fz(df)} 公里，不是 ${fz(sm)} 公里。所以敘述${ok ? "正確" : "錯誤"}。`,
        [`甲車（時速 ${f(a)} 公里）在乙車（時速 ${f(b)} 公里）後方同向追趕，每小時追近 ${f(df)} 公里。`, `正確：同向追趕用速率差 ${f(a)}−${f(b)}＝${f(df)}。`],
        [`甲車（時速 ${f(a)} 公里）在乙車（時速 ${f(b)} 公里）後方同向追趕，每小時追近 ${f(sm)} 公里。`, `錯誤：同向追趕是快的追慢的，用速率差 ${f(a)}−${f(b)}＝${f(df)}，不是相加。`]);
      r.trapNote = "相加是「相向」才用的；同向追趕只有「多出來的速度」在縮短距離，要相減。";
      return r;
    })),
    sp("speed-tf-L5-01", "tf", 5, "extend", kit => retry(kit, fl => {
      const p = pairQ(kit, fl); if (!p.ok) return null;
      const c = avgQ(p.A, p.B), h = dv(add(p.A, p.B), I(2)); if (!nice(c, fl) || !nice(h, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return tfQ(kit, ok => `解法二（假設路程）：假設單程是 ${fz(mul(p.A, p.B))} 公里，去程要 ${fz(p.B)} 小時，回程要 ${fz(p.A)} 小時，共 ${fz(add(p.A, p.B))} 小時，往返 ${fz(mul(I(2), mul(p.A, p.B)))} 公里，平均每小時 ${fz(c)} 公里。敘述寫的是 ${fz(ok ? c : h)} 公里，${ok ? "相同" : "不同"}，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`同一段路，去程時速 ${f(p.A)} 公里、回程時速 ${f(p.B)} 公里，往返的平均時速是 ${f(c)} 公里。`, `正確：平均速率＝往返總距離÷（去程時間＋回程時間）＝${f(c)}。`],
        [`同一段路，去程時速 ${f(p.A)} 公里、回程時速 ${f(p.B)} 公里，往返的平均時速是 ${f(h)} 公里。`, `錯誤：不能直接平均兩個速率。總距離÷總時間＝${f(c)} 公里/時。`]);
    }))
  ]);

  reg("speed", "fill", [
    sp("speed-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 30, 90), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（畫線段圖）：畫一條線段代表 ${fz(t)} 小時所走的路，把它分成兩段，每段是 ${fz(dv(t, I(2)))} 小時，長 ${fz(mul(v, dv(t, I(2))))} 公里；兩段接起來，全長 ${fz(d)} 公里。`,
        stem: `時速 ${f(v)} 公里的火車，行駛 ${f(t)} 小時，共行駛 ____ 公里。`, units: ["公里", "km"],
        explain: `解析：距離＝速率×時間＝${f(v)}×${f(t)}＝${f(d)}（公里）。` }, ans(d, fl));
    })),
    sp("speed-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 40, 80), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（先找 1 小時）：${fz(t)} 小時走了 ${fz(d)} 公里。1 小時是 ${fz(t)} 小時的 ${ExamKit.qFrac(dv(I(1), t))} 倍，所以 1 小時走的路是 ${fz(d)} 公里的 ${ExamKit.qFrac(dv(I(1), t))} 倍，也就是 ${fz(v)} 公里。所以每小時走 ${fz(v)} 公里。`,
        stem: `客運車 ${f(t)} 小時行駛 ${f(d)} 公里，平均時速是 ____ 公里。`, units: ["公里/時", "公里/小時", "公里", "公里每小時"],
        explain: `解析：速率＝距離÷時間＝${f(d)}÷${f(t)}＝${f(v)}（公里/時）。` }, ans(v, fl));
    })),
    sp("speed-fill-L3-01", "fill", 3, "basic", kit => retry(kit, fl => {
      const x = rq(kit, fl, 3, 15), c = mul(x, I(60)); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（先算 10 秒）：每秒走 ${fz(x)} 公尺，10 秒走 ${fz(mul(x, I(10)))} 公尺；1 分鐘有 6 個 10 秒，所以 1 分鐘走 6 個 ${fz(mul(x, I(10)))} 公尺，答案是 ${fz(c)} 公尺。`,
        stem: `小翔跑步每秒 ${f(x)} 公尺，他的分速是 ____ 公尺/分。`, units: ["公尺/分", "公尺/分鐘", "公尺"],
        explain: `解析：1 分鐘＝60 秒，${f(x)}×60＝${f(c)}（公尺/分）。` }, ans(c, fl));
    })),
    sp("speed-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 18, 150), c = dv(mul(v, I(1000)), I(3600)); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（用 3.6 倍）：1 公尺/秒 ＝ 3.6 公里/時，所以公里/時要除以 3.6：${fz(v)} ÷ 3.6 ＝ ${fz(c)}。驗算：${fz(c)} × 3.6 ＝ ${fz(v)}。答案是每秒 ${fz(c)} 公尺。`,
        stem: `某腳踏車的時速是 ${f(v)} 公里，換成秒速是每秒 ____ 公尺。`, units: ["公尺/秒", "公尺/秒鐘", "公尺"],
        explain: `解析：${f(v)} 公里＝${f(mul(v, I(1000)))} 公尺，1 小時＝3600 秒，${f(mul(v, I(1000)))}÷3600＝${f(c)}（公尺/秒）。（也就是 ÷3.6）`,
        trapNote: `常見錯誤是把 ${f(v)} 直接 ÷60 得到 ${f(dv(v, I(60)))}（那只是公里/分），或忘了公里要換成公尺。公里/時 → 公尺/秒 要「×1000 ÷3600」＝÷3.6。` }, ans(c, fl));
    })),
    sp("speed-fill-L5-01", "fill", 5, "extend", kit => retry(kit, fl => {
      const b = rq(kit, fl, 30, 65), a = rq(kit, fl, 30, 65), t = tq(kit, fl), D = mul(add(a, b), t); if (!nice(D, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（列方程式）：設乙車時速是 □ 公里。兩車合走全程：(${sw(a, fl)} ＋ □) × ${sw(t, fl)} ＝ ${sw(D, fl)}，括號裡的數是 ${sw(add(a, b), fl)}，所以 □ ＝ ${sw(add(a, b), fl)} 減 ${sw(a, fl)}，是 ${sw(b, fl)} 公里。`,
        stem: `甲、乙兩地相距 ${f(D)} 公里。兩車同時由兩地出發相向而行，甲車時速 ${f(a)} 公里，${f(t)} 小時後相遇，則乙車的時速是 ____ 公里。`, units: ["公里/時", "公里/小時", "公里"],
        explain: `解析：兩車速率和＝${f(D)}÷${f(t)}＝${f(add(a, b))}（公里/時），乙車時速＝${f(add(a, b))}−${f(a)}＝${f(b)}（公里/時）。` }, ans(b, fl));
    }))
  ]);

  reg("speed", "calc", [
    sp("speed-calc-L1-01", "calc", 1, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 30, 90), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `${qv(t) >= 1 && sub(t, I(Math.floor(qv(t)))).n > 0 ? `解法二（把時間拆開）：${fz(t)} 小時 ＝ ${Math.floor(qv(t))} 小時加 ${fz(sub(t, I(Math.floor(qv(t)))))} 小時。整小時走 ${fz(mul(v, I(Math.floor(qv(t)))))} 公里，零頭走 ${fz(mul(v, sub(t, I(Math.floor(qv(t))))))} 公里，合起來是 ${fz(d)} 公里。` : `解法二（把時間分成兩半）：${fz(t)} 小時分成兩段，每段 ${fz(dv(t, I(2)))} 小時。每段走 ${fz(mul(v, dv(t, I(2))))} 公里，兩段合起來是 ${fz(d)} 公里。`}`,
        stem: `火車時速 ${f(v)} 公里，行駛 ${f(t)} 小時，距離是多少公里？（列式：${f(v)} × ${f(t)}）`, units: ["公里", "km"],
        explain: `解析：距離＝速率×時間，所以 ${f(v)}×${f(t)}＝${f(d)}（公里）。` }, ans(d, fl));
    })),
    sp("speed-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 30, 90), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（兩個數同時減半）：除法中被除數和除數同時除以 2，商不變。${fz(d)} 和 ${fz(v)} 各減半是 ${fz(dv(d, I(2)))} 和 ${fz(dv(v, I(2)))}，${fz(dv(d, I(2)))} 除以 ${fz(dv(v, I(2)))} 得 ${fz(t)}，所以需要 ${fz(t)} 小時。`,
        stem: `汽車以時速 ${f(v)} 公里行駛 ${f(d)} 公里，需要幾小時？（列式：${f(d)} ÷ ${f(v)}）`, units: ["小時", "時"],
        explain: `解析：時間＝距離÷速率＝${f(d)}÷${f(v)}＝${f(t)}（小時）。` }, ans(t, fl));
    })),
    sp("speed-calc-L3-01", "calc", 3, "basic", kit => retry(kit, fl => {
      const m = rq(kit, fl, 50, 500), c = dv(mul(m, I(60)), I(1000)); if (!nice(c, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（乘 6 再往左移）：分速換時速要乘 60 再除以 1000，等於乘 6 再除以 100。${fz(m)} 乘 6 得 ${fz(mul(m, I(6)))}，除以 100 得 ${fz(c)}，時速是 ${fz(c)} 公里。`,
        stem: `把分速 ${f(m)} 公尺換成時速，是多少公里/時？`, units: ["公里/時", "公里/小時", "公里"],
        explain: `解析：1 小時＝60 分鐘，每小時走 ${f(m)}×60＝${f(mul(m, I(60)))} 公尺＝${f(c)} 公里，所以是 ${f(c)} 公里/時。` }, ans(c, fl));
    })),
    sp("speed-calc-L4-01", "calc", 4, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 24, 108), m = kit.pick([10, 15, 20, 30, 40, 45, 50]), d = mul(v, Qn(m, 60)); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `${(g => `解法二（分成相同長度的小段）：60 分鐘分成 ${60 / g} 段，每段 ${g} 分鐘，每段走 ${fz(v)} 除以 ${60 / g}，是 ${fz(dv(v, I(60 / g)))} 公里。${m} 分鐘有 ${m / g} 段，共走 ${fz(dv(v, I(60 / g)))} 乘 ${m / g}，得 ${fz(d)} 公里。`)(ExamKit.gcd(m, 60))}`,
        stem: `時速 ${f(v)} 公里的列車行駛 ${m} 分鐘，共行駛多少公里？`, units: ["公里", "km"],
        explain: `解析：時速的時間單位是「小時」，所以先把 ${m} 分鐘換成 ${m}/60 小時，${f(v)}×${m}/60＝${f(d)}（公里）。`,
        trapNote: `直接算 ${f(v)}×${m}＝${f(mul(v, I(m)))} 是錯的，因為時速的時間單位是「小時」，${m} 分鐘要先換成 ${m}/60 小時。` }, ans(d, fl));
    })),
    sp("speed-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const b = rq(kit, fl, 40, 60), df = rq(kit, fl, 5, 20), a = add(b, df), t = tq(kit, fl), g = mul(df, t); if (!nice(g, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（列方程式）：設追了 □ 小時，甲走 ${fz(a)} 乘 □，乙走 ${fz(b)} 乘 □，甲要多走 ${fz(g)} 公里。(${fz(a)} 減 ${fz(b)}) 乘 □ 等於 ${fz(g)}，${fz(a)} 減 ${fz(b)} 是 ${fz(df)}，所以 □ 等於 ${fz(g)} 除以 ${fz(df)}，得 ${fz(t)}（小時）。`,
        stem: `乙騎車在前，甲騎車在後，兩人相距 ${f(g)} 公里，同向前進。甲時速 ${f(a)} 公里，乙時速 ${f(b)} 公里，甲要經過幾小時才追上乙？`, units: ["小時", "時"],
        explain: `解析：同向追趕，每小時追近 ${f(a)}−${f(b)}＝${f(df)} 公里，時間＝${f(g)}÷${f(df)}＝${f(t)}（小時）。` }, ans(t, fl));
    }))
  ]);

  reg("speed", "word", [
    sp("speed-word-L2-01", "word", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 60, 250), t = kit.pick([10, 20, 30, 40]), d = mul(mul(v, I(t)), Qn(1, 1000)); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（先算騎 1 公里要多久）：1 公里是 1000 公尺，每分鐘騎 ${fz(v)} 公尺，騎 1 公里要 ${fz(dv(I(1000), v))} 分鐘。${t} 分鐘裡包含幾個這樣的 1 公里？答案是 ${fz(d)}，他一共騎了 ${fz(d)} 公里。`,
        stem: `小宇騎腳踏車，每分鐘騎 ${f(v)} 公尺，騎了 ${t} 分鐘。他一共騎了多少公里？`, units: ["公里", "km"],
        explain: `解析：距離＝${f(v)}×${t}＝${f(mul(v, I(t)))} 公尺，${f(mul(v, I(t)))}÷1000＝${f(d)} 公里。` }, ans(d, fl));
    })),
    sp("speed-word-L3-01", "word", 3, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 50, 120), m = kit.pick([10, 15, 20, 25, 30, 40]), d = mul(mul(v, I(m)), Qn(1, 1000)); if (!nice(d, fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（改用公里來算）：每分鐘走 ${sw(v, fl)} 公尺，也就是每分鐘走 ${sw(dv(v, I(1000)), fl)} 公里。${sw(d, fl)} 公里裡包含幾個 ${sw(dv(v, I(1000)), fl)} 公里，就要幾分鐘，所以要 ${m} 分鐘。`,
        stem: `小芸家離學校 ${f(d)} 公里，她步行的速率是每分鐘 ${f(v)} 公尺，她從家走到學校要幾分鐘？`, answer: String(m), accepted: [], units: ["分鐘", "分"],
        explain: `解析：距離用公里、速率用公尺/分，要先統一單位：${f(d)} 公里＝${f(mul(v, I(m)))} 公尺，時間＝距離÷速率＝${f(mul(v, I(m)))}÷${f(v)}＝${m}（分鐘）。`,
        trapNote: `題目距離用「公里」、速率用「公尺/分」，單位不同不能直接除；直接算 ${f(d)}÷${f(v)} 會得到很小的錯誤答案。先把公里換成公尺（×1000）。` });
    })),
    sp("speed-word-L3-02", "word", 3, "basic", kit => retry(kit, fl => {
      const a = rq(kit, fl, 50, 70), b = rq(kit, fl, 40, 60), t = tq(kit, fl), D = mul(add(a, b), t); if (!nice(D, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（列方程式）：設 □ 小時後相遇，甲走 ${fz(a)} 乘 □，乙走 ${fz(b)} 乘 □，合起來是全部距離：${fz(a)} 乘 □ 加 ${fz(b)} 乘 □ 等於 ${fz(D)}。也就是 (${fz(a)} 加 ${fz(b)}) 乘 □ 等於 ${fz(D)}，${fz(a)} 加 ${fz(b)} 是 ${fz(add(a, b))}，所以 □ 等於 ${fz(D)} 除以 ${fz(add(a, b))}，得 ${fz(t)} 小時。`,
        stem: `甲、乙兩城相距 ${f(D)} 公里。一輛車從甲城出發，時速 ${f(a)} 公里；另一輛車同時從乙城出發，時速 ${f(b)} 公里，兩車相向而行。幾小時後兩車相遇？`, units: ["小時", "時"],
        explain: `解析：兩車每小時共同縮短 ${f(a)}+${f(b)}＝${f(add(a, b))} 公里，相遇時間＝${f(D)}÷${f(add(a, b))}＝${f(t)}（小時）。` }, ans(t, fl));
    })),
    sp("speed-word-L4-01", "word", 4, "extend", kit => retry(kit, fl => {
      const b = rq(kit, fl, 50, 100), k = rq(kit, fl, 10, 40), s = rq(kit, fl, 3, 12), a = add(b, k), t = dv(mul(b, s), k); if (!nice(t, fl) || !nice(mul(b, s), fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（用時間比）：追上時兩人走的路一樣長，哥哥花的時間比弟弟多 ${fz(s)} 分鐘。哥哥和弟弟的時間比等於速度比反過來，是 ${fz(a)} 比 ${fz(b)}，兩者相差 ${fz(k)} 份，1 份是 ${fz(dv(s, k))} 分鐘，弟弟占 ${fz(b)} 份，所以是 ${fz(t)} 分鐘。`,
        stem: `哥哥從家出發，每分鐘走 ${f(b)} 公尺。哥哥走了 ${f(s)} 分鐘後，弟弟才從家出發，騎車每分鐘行 ${f(a)} 公尺去追哥哥。弟弟出發後幾分鐘可以追上哥哥？`, units: ["分鐘", "分"],
        explain: `解析：弟弟出發時，哥哥已走 ${f(b)}×${f(s)}＝${f(mul(b, s))} 公尺。弟弟每分鐘追近 ${f(a)}−${f(b)}＝${f(k)} 公尺，追上要 ${f(mul(b, s))}÷${f(k)}＝${f(t)}（分鐘）。` }, ans(t, fl));
    })),
    sp("speed-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const vk = rq(kit, fl, 40, 120), s = rq(kit, fl, 15, 40), L = rq(kit, fl, 80, 250), x = dv(mul(vk, I(5)), I(18)), T = sub(mul(x, s), L);
      if (!nice(T, fl) || !nice(x, fl) || !nice(mul(x, s), fl)) return null;
      const f = a => sh(a, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（列方程式）：設隧道長 □ 公尺。火車每秒走 ${fz(x)} 公尺，${fz(s)} 秒走 ${fz(mul(x, s))} 公尺，這段路等於隧道長加車長：□ ＋ ${fz(L)} ＝ ${fz(mul(x, s))}，□ ＝ ${fz(T)}。答案是 ${fz(T)} 公尺。`,
        stem: `一列長 ${f(L)} 公尺的火車，時速 ${f(vk)} 公里，從車頭進入隧道到車尾完全離開隧道共花 ${f(s)} 秒。這條隧道長多少公尺？`, units: ["公尺", "公尺長", "m"],
        explain: `解析：時速 ${f(vk)} 公里＝每秒 ${f(x)} 公尺。${f(s)} 秒共行駛 ${f(x)}×${f(s)}＝${f(mul(x, s))} 公尺，這段距離＝隧道長＋車長，所以隧道長＝${f(mul(x, s))}−${f(L)}＝${f(T)}（公尺）。` }, ans(T, fl));
    }))
  ]);
  /* 教材式 □ 未知數題（規格第 14 節） */
  reg("speed", "box", [
    sp("speed-box-fill-L1-01", "fill", 1, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 3, 9), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（分成兩半）：把 □ 小時分成兩半，每一半走的路是 ${fz(dv(d, I(2)))} 公里，每一半要 ${fz(dv(dv(d, I(2)), v))} 小時，兩半合起來 □ 是 ${fz(t)} 小時。`,
        stem: `時速 ${f(v)} 公里的人走 □ 小時，可以走 ${f(d)} 公里。□ ＝ ?`, units: ["小時", "時"],
        explain: `解析：${f(v)} × □ ＝ ${f(d)}，□ ＝ ${f(d)} ÷ ${f(v)} ＝ ${f(t)}（小時）。` }, ans(t, fl));
    })),
    sp("speed-box-fill-L2-01", "fill", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 18, 150), c = dv(mul(v, I(5)), I(18)); if (!nice(c, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（用 3.6）：公里/時換成公尺/秒，要除以 3.6：${fz(v)} ÷ 3.6 ＝ ${fz(c)}。所以 □ ＝ ${fz(c)} 公尺/秒。`,
        stem: `${f(v)} 公里/時 ＝ □ 公尺/秒。□ ＝ ?`, units: ["公尺/秒", "公尺"],
        explain: `解析：${f(v)} 公里＝${f(mul(v, I(1000)))} 公尺，1 小時＝3600 秒，□ ＝ ${f(mul(v, I(1000)))} ÷ 3600 ＝ ${f(c)}。` }, ans(c, fl));
    })),
    sp("speed-box-calc-L2-01", "calc", 2, "basic", kit => retry(kit, fl => {
      const v = rq(kit, fl, 20, 90), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `${t.d === 1 ? `解法二（先找 1 份）：□ 的 ${fz(t)} 倍是 ${fz(d)}。把 ${fz(d)} 平分成 ${fz(t)} 份，每一份就是 □，所以 □ 是 ${fz(v)} 公里/時。` : `解法二（先找 1 份）：${fz(t)} 就是 ${t.n}/${t.d}，也就是 □ 的 ${t.n}/${t.d} 是 ${fz(d)}。先把 ${fz(d)} 平分成 ${t.n} 份，每份 ${fz(dv(d, I(t.n)))}（這是 □ 的 1/${t.d}），□ 有 ${t.d} 份，所以 □ 是 ${fz(dv(d, I(t.n)))} 乘 ${t.d}，得 ${fz(v)} 公里/時。`}`,
        stem: `${f(t)} × □ ＝ ${f(d)}。（□ 是時速，單位公里/時）□ 是多少？`, units: ["公里/時", "公里"],
        explain: `解析：乘法裡不知道的因數，要用積去除以另一個因數，所以 □ ＝ ${f(d)} ÷ ${f(t)} ＝ ${f(v)}（公里/時）。` }, ans(v, fl));
    })),
    sp("speed-box-single-L3-01", "single", 3, "trap", kit => retry(kit, fl => {
      const v = rq(kit, fl, 20, 80), t = tq(kit, fl), d = mul(v, t); if (!nice(d, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      const o = qopts(kit, t, [mul(d, v), dv(v, d), sub(d, v), add(d, v), mul(t, I(2))], fl, " 小時");
      return { explain2: `解法二（改寫成乘法）：被除數除以除數得到商，可以改寫成除數乘商得到被除數，所以 □ 乘 ${fz(v)} 要得到 ${fz(d)}。把 ${fz(d)} 和 ${fz(v)} 同時減半，變成 ${fz(dv(d, I(2)))} 和 ${fz(dv(v, I(2)))}，商不變，${fz(dv(d, I(2)))} 除以 ${fz(dv(v, I(2)))} 得 ${f(t)} 小時。`,
        stem: `${f(d)} ÷ □ ＝ ${f(v)}（距離 ÷ 時間 ＝ 速率，□ 是時間，單位小時）。□ 是多少小時？`, options: o.options, answer: 0,
        explain: `解析：除數 □ ＝ 被除數 ÷ 商 ＝ ${f(d)} ÷ ${f(v)} ＝ ${f(t)}（小時）。`,
        trapNote: `□ 在除數的位置，要用「被除數 ÷ 商」。常見錯誤是把 ${f(d)} 和 ${f(v)} 相乘，或反過來算 ${f(v)} ÷ ${f(d)}。` };
    })),
    sp("speed-box-tf-L4-01", "tf", 4, "trap", kit => retry(kit, fl => {
      const x = rq(kit, fl, 5, 30, { dens: [2, 5] }), c = mul(x, Qn(18, 5)), bad = mul(x, I(kit.pick([6, 60]))); if (!nice(c, fl) || !nice(bad, fl) || qv(bad) === qv(c)) return null;
      const f = y => sh(y, fl);
      const fz = x => sw(x, fl);
      const r = tfQ(kit, ok => `解法二（倒回去驗算）：把敘述裡的 □ ＝ ${fz(ok ? c : bad)} 公里/時除以 3.6，得到 ${fz(dv(ok ? c : bad, Qn(18, 5)))} 公尺/秒，${ok ? "剛好是" : "不是"}題目的 ${fz(x)} 公尺/秒，所以這句話${ok ? "正確" : "錯誤"}。`,
        [`${f(x)} 公尺/秒 ＝ □ 公里/時，□ ＝ ${f(c)}。`, `正確：${f(x)} × 3600 ÷ 1000 ＝ ${f(c)}。`],
        [`${f(x)} 公尺/秒 ＝ □ 公里/時，□ ＝ ${f(bad)}。`, `錯誤：${f(x)} 公尺/秒 ×3600 秒 ÷1000 ＝ ${f(c)} 公里/時，不是 ${f(bad)}。`]);
      r.trapNote = "秒速換時速要 ×3600（秒→時）再 ÷1000（公尺→公里），也就是 ×3.6；只 ×60 或 ×6 都是換算漏步驟。";
      return r;
    })),
    sp("speed-box-word-L4-01", "word", 4, "trap", kit => retry(kit, fl => {
      const b = rq(kit, fl, 40, 60), df = rq(kit, fl, 5, 20), a = add(b, df), t = tq(kit, fl), g = mul(df, t); if (!nice(g, fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（列方程式）：設 □ 小時後相距 ${fz(g)} 公里，哥哥走 ${fz(a)} 乘 □，弟弟走 ${fz(b)} 乘 □，差就是 ${fz(g)} 公里：(${fz(a)} 減 ${fz(b)}) 乘 □ 等於 ${fz(g)}，${fz(a)} 減 ${fz(b)} 是 ${fz(df)}，□ 等於 ${fz(g)} 除以 ${fz(df)}，得 ${fz(t)} 小時。`,
        stem: `哥哥時速 ${f(a)} 公里，弟弟時速 ${f(b)} 公里，兩人同時從同一地點、往同一方向出發，□ 小時後兩人相距 ${f(g)} 公里。□ ＝ ?`, units: ["小時", "時"],
        explain: `解析：同向出發，每小時拉開 ${f(a)}−${f(b)}＝${f(df)} 公里，□ ＝ ${f(g)} ÷ ${f(df)} ＝ ${f(t)}（小時）。`,
        trapNote: `同向出發，拉開的距離看速率「差」，不是速率和 ${f(add(a, b))}。用和去除會算出 ${f(dv(g, add(a, b)))}，是錯的。` }, ans(t, fl));
    })),
    sp("speed-box-calc-L5-01", "calc", 5, "extend", kit => retry(kit, fl => {
      const s = rq(kit, fl, 80, 140), df = rq(kit, fl, 5, 30), big = dv(add(s, df), I(2)); if (!nice(big, fl) || !nice(dv(sub(s, df), I(2)), fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（先平分再調整）：假設兩車一樣快，各是 ${fz(s)} ÷ 2 ＝ ${fz(dv(s, I(2)))}；□ 比較快，要多出差的一半 ${fz(df)} ÷ 2 ＝ ${fz(dv(df, I(2)))}，所以 □ ＝ ${fz(dv(s, I(2)))} ＋ ${fz(dv(df, I(2)))} ＝ ${fz(big)} 公里/時。`,
        stem: `甲、乙兩車的時速（單位：公里/時）分別是 □ 和 △（□ 比較大）。□ ＋ △ ＝ ${f(s)}，□ － △ ＝ ${f(df)}。□ ＝ ?`, units: ["公里/時", "公里"],
        explain: `解析：和加差：(□＋△)＋(□－△)＝2 個 □＝${f(s)}＋${f(df)}＝${f(add(s, df))}，□ ＝ ${f(add(s, df))} ÷ 2 ＝ ${f(big)}（公里/時）。（△ ＝ ${f(dv(sub(s, df), I(2)))}）` }, ans(big, fl));
    })),
    sp("speed-box-word-L5-01", "word", 5, "extend", kit => retry(kit, fl => {
      const L = rq(kit, fl, 100, 250), T = rq(kit, fl, 200, 600), vk = rq(kit, fl, 36, 108), x = dv(mul(vk, I(5)), I(18)), tm = dv(add(L, T), x);
      if (![x, tm, add(L, T)].every(y => nice(y, fl))) return null;
      const f = y => sh(y, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（列方程式）：火車每秒走 ${fz(x)} 公尺，設要 □ 秒，${fz(x)} × □ ＝ 車長加橋長 ＝ ${fz(add(L, T))}，□ ＝ ${fz(add(L, T))} ÷ ${fz(x)} ＝ ${fz(tm)}。答案是 ${fz(tm)} 秒。`,
        stem: `一列長 ${f(L)} 公尺的火車，時速 ${f(vk)} 公里，要通過一座長 ${f(T)} 公尺的橋（從車頭上橋到車尾離橋），需要 □ 秒。□ ＝ ?`, units: ["秒", "秒鐘"],
        explain: `解析：時速 ${f(vk)} 公里＝每秒 ${f(x)} 公尺；車頭到車尾離橋共走 ${f(L)}＋${f(T)}＝${f(add(L, T))} 公尺，□ ＝ ${f(add(L, T))} ÷ ${f(x)} ＝ ${f(tm)}（秒）。` }, ans(tm, fl));
    })),
    sp("speed-box-fill-L4-01", "fill", 4, "trap", kit => retry(kit, fl => {
      const a = rq(kit, fl, 2, 8), t = tq(kit, fl), v0 = rq(kit, fl, 15, 40), d = mul(sub(v0, a), t); if (!nice(d, fl) || !nice(sub(v0, a), fl)) return null;
      const f = x => sh(x, fl);
      const fz = x => sw(x, fl);
      return Object.assign({ explain2: `解法二（先拆括號）：把括號拆開，□ 乘 ${fz(t)} 之後要減去 ${fz(mul(a, t))}，剩下 ${fz(d)}。所以 □ 乘 ${fz(t)} 是 ${fz(d)} 加 ${fz(mul(a, t))}，得 ${fz(add(d, mul(a, t)))}；再除以 ${fz(t)}，答案是 ${fz(v0)} 公里/時。`,
        stem: `一艘船在靜水中每小時行 □ 公里，水流每小時 ${f(a)} 公里，逆流行駛 ${f(t)} 小時共 ${f(d)} 公里，也就是 (□ － ${f(a)}) × ${f(t)} ＝ ${f(d)}。□ ＝ ?`, units: ["公里/時", "公里"],
        explain: `解析：(□ － ${f(a)}) ＝ ${f(d)} ÷ ${f(t)} ＝ ${f(sub(v0, a))}，□ ＝ ${f(sub(v0, a))} ＋ ${f(a)} ＝ ${f(v0)}（公里/時）。`,
        trapNote: `括號裡是「減 ${f(a)}」，還原時要「加回 ${f(a)}」。常見錯誤是算出 ${f(sub(v0, a))} 就停下，或再減一次 ${f(a)}。` }, ans(v0, fl));
    }))
  ]);
})();
