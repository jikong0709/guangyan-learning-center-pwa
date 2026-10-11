/* 題庫：speed（距離＝速率×時間、秒速分速時速換算、相遇與追趕入門）｜題庫工 C */
(function () {
  "use strict";
  const sp = (id, type, level, tag, gen) => ({ id, type, level, tag, gen });
  /* 數值單選：correct 為數字，wrongs 為候選干擾（數字），fmt 轉成選項文字 */
  function nopts(kit, correct, wrongs, fmt) {
    const seen = new Set([fmt(correct)]); const out = [];
    wrongs.forEach(w => { if (!isFinite(w) || w <= 0) return; const s = fmt(w); if (!seen.has(s)) { seen.add(s); out.push(s); } });
    const step = Math.max(1, Math.round(correct / 10));
    for (let k = 1; out.length < 3 && k < 30; k++) {
      [correct + step * k, correct - step * k].forEach(w => { if (w > 0 && out.length < 3) { const s = fmt(w); if (!seen.has(s)) { seen.add(s); out.push(s); } } });
    }
    return { options: [fmt(correct)].concat(kit.shuffle(out).slice(0, 3)), answer: 0 };
  }
  /* 複選：trues/falses 為 [敘述, 理由]；隨機抽 2~3 個正確、2~3 個錯誤（總數 4~5） */
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
  const avgSp = (a, b) => 2 * a * b / (a + b);

  ExamBank.register("speed", "single", [
    sp("speed-single-L1-01", "single", 1, "basic", kit => {
      const v = kit.pick([40, 45, 50, 60, 72, 80, 90]), t = kit.int(2, 6), d = v * t;
      const o = nopts(kit, d, [v + t, d + v, d - v, d * 2, Math.round(d / 2), v * t + t * 10], x => kit.num(x) + " 公里");
      return { stem: `一輛汽車的時速是 ${v} 公里，連續行駛 ${t} 小時，共行駛多少公里？`, options: o.options, answer: 0,
        explain: `解析：距離＝速率×時間＝${v}×${t}＝${d}（公里）。` };
    }),
    sp("speed-single-L2-01", "single", 2, "basic", kit => {
      const v = kit.pick([30, 40, 45, 50, 60, 75]), t = kit.int(2, 5), d = v * t;
      const o = nopts(kit, v, [d + t, d * t, d - t, t, v + t, d], x => kit.num(x) + " 公里/時");
      return { stem: `小美騎機車 ${t} 小時，共行駛 ${d} 公里，她的平均時速是多少？`, options: o.options, answer: 0,
        explain: `解析：速率＝距離÷時間＝${d}÷${t}＝${v}（公里/時）。` };
    }),
    sp("speed-single-L3-01", "single", 3, "trap", kit => {
      const x = kit.pick([5, 10, 15, 20, 25, 30]), c = x * 3.6;
      const o = nopts(kit, c, [x * 60, x * 3600, x * 36, x / 3.6, x * 6], v => kit.num(v) + " 公里/時");
      return { stem: `一位選手跑步的速率是每秒 ${x} 公尺，換成時速是多少公里？`, options: o.options, answer: 0,
        explain: `解析：1 小時＝3600 秒，所以每小時跑 ${x}×3600＝${x * 3600} 公尺；1 公里＝1000 公尺，所以是 ${x * 3600}÷1000＝${kit.num(c)} 公里/時（也就是 ×3.6）。`,
        trapNote: `×60 只換成「分速」（${x * 60} 公尺/分），不是時速；×3600 忘了把公尺換成公里（${x * 3600} 是公尺/時）。秒速換時速要「×3600 再 ÷1000」。` };
    }),
    sp("speed-single-L4-01", "single", 4, "trap", kit => {
      const a = kit.int(5, 9), v = 12 * a, m = kit.pick([10, 15, 20, 25, 30, 40, 45, 50]), d = a * m / 5;
      const o = nopts(kit, d, [v * m, v * m / 6, v / m, v + m, d * 2, d / 2], x => kit.num(x) + " 公里");
      return { stem: `一輛火車的時速是 ${v} 公里，行駛 ${m} 分鐘，共行駛多少公里？`, options: o.options, answer: 0,
        explain: `解析：${m} 分鐘＝${m}/60 小時，距離＝${v}×${m}/60＝${kit.num(d)}（公里）。`,
        trapNote: `時速的單位是「小時」，時間給的是「分鐘」，直接 ${v}×${m}＝${v * m} 會多算 60 倍。必須先把 ${m} 分鐘換成 ${m}/60 小時再乘。` };
    }),
    sp("speed-single-L5-01", "single", 5, "extend", kit => {
      let [a, b] = kit.pick(PAIRS); if (kit.int(0, 1)) { const t = a; a = b; b = t; }
      const c = avgSp(a, b), L = kit.lcm(a, b);
      const o = nopts(kit, c, [(a + b) / 2, a * b / (a + b), a + b, Math.abs(a - b), Math.min(a, b)], x => kit.num(x) + " 公里/時");
      return { stem: `甲、乙兩地的路程固定。小凱去程的時速是 ${a} 公里，回程的時速是 ${b} 公里。他往返一趟的平均時速是多少？`, options: o.options, answer: 0,
        explain: `解析：設單程 ${L} 公里（取 ${a} 與 ${b} 的最小公倍數）。去程 ${L}÷${a}＝${kit.num(L / a)} 小時，回程 ${L}÷${b}＝${kit.num(L / b)} 小時；總路程 ${2 * L} 公里，總時間 ${kit.num(L / a + L / b)} 小時，平均時速＝${2 * L}÷${kit.num(L / a + L / b)}＝${kit.num(c)} 公里/時。平均速率要用「總距離÷總時間」，不能把兩個速率直接平均。` };
    })
  ]);

  ExamBank.register("speed", "multi", [
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
    sp("speed-multi-L3-02", "multi", 3, "trap", kit => {
      const b = kit.int(40, 60), a = b + kit.pick([10, 20]), t = kit.int(2, 4);
      const r = multiQ(kit, `甲車時速 ${a} 公里，乙車時速 ${b} 公里。`, [
        [`兩車從兩地同時相向出發，每小時共同縮短 ${a + b} 公里`, "相向是「速率相加」。"],
        [`甲在乙後方、同向追趕，每小時追近 ${a - b} 公里`, "同向追趕是「速率相減」。"],
        [`兩車相向，相距 ${(a + b) * t} 公里，${t} 小時後相遇`, `${(a + b) * t}÷${a + b}＝${t}（小時）。`],
        [`甲在乙後方 ${(a - b) * t} 公里同向追趕，${t} 小時追上`, `${(a - b) * t}÷${a - b}＝${t}（小時）。`]
      ], [
        [`兩車相向，每小時共同縮短 ${a - b} 公里`, "相向要相加，不是相減。"],
        [`甲在乙後方同向追趕，每小時追近 ${a + b} 公里`, "同向追趕要相減，不是相加。"],
        [`兩車相向，相距 ${(a + b) * t} 公里，${t + 1} 小時後相遇`, `應是 ${(a + b) * t}÷${a + b}＝${t} 小時。`],
        [`甲在乙後方 ${(a - b) * t} 公里同向追趕，${t + 1} 小時追上`, `應是 ${(a - b) * t}÷${a - b}＝${t} 小時。`]
      ]);
      r.trapNote = "相向（面對面）時兩者的路程加在一起，速率用「和」；同向追趕時是快的比慢的多走，速率用「差」。兩種情況加減弄反，時間就會算錯。";
      return r;
    }),
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
    sp("speed-multi-L5-01", "multi", 5, "extend", kit => {
      const vb = kit.pick([40, 45, 50, 55]), va = vb + kit.pick([10, 15, 20]), t = kit.int(2, 4), D = (va + vb) * t;
      return multiQ(kit, `甲、乙兩地相距 ${D} 公里。甲車時速 ${va} 公里、乙車時速 ${vb} 公里，兩車同時由兩地相向而行。`, [
        [`${t} 小時後兩車相遇`, `${D}÷(${va}+${vb})＝${t}。`],
        [`相遇時甲車行了 ${va * t} 公里`, `${va}×${t}＝${va * t}。`],
        [`相遇時甲車比乙車多行 ${(va - vb) * t} 公里`, `${va * t}−${vb * t}＝${(va - vb) * t}。`],
        [`相遇時乙車行了 ${vb * t} 公里`, `${vb}×${t}＝${vb * t}。`]
      ], [
        [`${t * 2} 小時後兩車相遇`, `相遇時間是 ${t} 小時。`],
        [`相遇時甲車行了 ${D / 2} 公里`, `兩車速率不同，不會各走一半；甲走 ${va * t} 公里。`],
        [`相遇時乙車行了 ${va * t} 公里`, `乙車只走 ${vb * t} 公里；${va * t} 是甲車走的。`],
        [`兩車每小時共同縮短 ${va - vb} 公里`, `相向要用速率和 ${va + vb}，不是差。`]
      ]);
    })
  ]);

  ExamBank.register("speed", "tf", [
    sp("speed-tf-L1-01", "tf", 1, "basic", kit => {
      const v = kit.pick([40, 50, 60, 80]), t = kit.int(2, 6);
      return tfQ(kit,
        [`時速 ${v} 公里的汽車，行駛 ${t} 小時，共行駛 ${v * t} 公里。`, `正確：${v}×${t}＝${v * t}（公里）。`],
        [`時速 ${v} 公里的汽車，行駛 ${t} 小時，共行駛 ${v + t} 公里。`, `錯誤：距離＝速率×時間＝${v}×${t}＝${v * t} 公里，不是相加。`]);
    }),
    sp("speed-tf-L2-01", "tf", 2, "basic", kit => {
      const x = kit.int(3, 15);
      return tfQ(kit,
        [`每秒 ${x} 公尺的速率，等於每分鐘 ${60 * x} 公尺。`, `正確：1 分鐘＝60 秒，${x}×60＝${60 * x}。`],
        [`每秒 ${x} 公尺的速率，等於每分鐘 ${kit.pick([x * 6, x * 100])} 公尺。`, `錯誤：1 分鐘＝60 秒，應是 ${x}×60＝${60 * x} 公尺/分。`]);
    }),
    sp("speed-tf-L3-01", "tf", 3, "trap", kit => {
      const B = kit.pick([15, 20, 25, 30]), delta = kit.pick([-18, -9, 9, 18]), A = Math.round(3.6 * B) + delta, ok = delta > 0;
      return { stem: `判斷下列敘述是否正確：\n時速 ${A} 公里的列車，比秒速 ${B} 公尺的汽車快。`, answer: ok,
        explain: `解析：秒速 ${B} 公尺＝${B}×3.6＝${Math.round(3.6 * B)} 公里/時。${A} ${ok ? ">" : "<"} ${Math.round(3.6 * B)}，所以列車${ok ? "比較快" : "比較慢"}，此敘述${ok ? "正確" : "錯誤"}。`,
        trapNote: `${A} 與 ${B} 單位不同（公里/時 與 公尺/秒），不能直接比數字大小；${A}>${B} 看起來列車快，但要先把單位統一。` };
    }),
    sp("speed-tf-L4-01", "tf", 4, "trap", kit => {
      const b = kit.int(40, 60), a = b + kit.pick([10, 15, 20]);
      const r = tfQ(kit,
        [`甲車（時速 ${a} 公里）在乙車（時速 ${b} 公里）後方同向追趕，每小時追近 ${a - b} 公里。`, `正確：同向追趕用速率差 ${a}−${b}＝${a - b}。`],
        [`甲車（時速 ${a} 公里）在乙車（時速 ${b} 公里）後方同向追趕，每小時追近 ${a + b} 公里。`, `錯誤：同向追趕是快的追慢的，用速率差 ${a}−${b}＝${a - b}，不是相加。`]);
      r.trapNote = "相加是「相向」才用的；同向追趕只有「多出來的速度」在縮短距離，要相減。";
      return r;
    }),
    sp("speed-tf-L5-01", "tf", 5, "extend", kit => {
      const [a, b] = kit.pick(PAIRS), c = avgSp(a, b);
      return tfQ(kit,
        [`同一段路，去程時速 ${a} 公里、回程時速 ${b} 公里，往返的平均時速是 ${kit.num(c)} 公里。`, `正確：平均速率＝總距離÷總時間＝2ab/(a+b)＝${kit.num(c)}。`],
        [`同一段路，去程時速 ${a} 公里、回程時速 ${b} 公里，往返的平均時速是 ${kit.num((a + b) / 2)} 公里。`, `錯誤：不能直接平均兩個速率。總距離÷總時間＝${kit.num(c)} 公里/時。`]);
    })
  ]);

  ExamBank.register("speed", "fill", [
    sp("speed-fill-L1-01", "fill", 1, "basic", kit => {
      const v = kit.pick([40, 45, 60, 72, 80]), t = kit.int(2, 6);
      return { stem: `時速 ${v} 公里的火車，行駛 ${t} 小時，共行駛 ____ 公里。`, answer: String(v * t), units: ["公里", "km"],
        explain: `解析：距離＝速率×時間＝${v}×${t}＝${v * t}（公里）。` };
    }),
    sp("speed-fill-L2-01", "fill", 2, "basic", kit => {
      const v = kit.pick([45, 54, 60, 72, 75]), t = kit.int(2, 4), d = v * t;
      return { stem: `客運車 ${t} 小時行駛 ${d} 公里，平均時速是 ____ 公里。`, answer: String(v), units: ["公里/時", "公里/小時", "公里", "公里每小時"],
        explain: `解析：速率＝距離÷時間＝${d}÷${t}＝${v}（公里/時）。` };
    }),
    sp("speed-fill-L3-01", "fill", 3, "basic", kit => {
      const x = kit.int(3, 15);
      return { stem: `小翔跑步每秒 ${x} 公尺，他的分速是 ____ 公尺/分。`, answer: String(60 * x), units: ["公尺/分", "公尺/分鐘", "公尺"],
        explain: `解析：1 分鐘＝60 秒，${x}×60＝${60 * x}（公尺/分）。` };
    }),
    sp("speed-fill-L4-01", "fill", 4, "trap", kit => {
      const k = kit.int(1, 4), v = 36 * k;
      return { stem: `某腳踏車的時速是 ${v} 公里，換成秒速是每秒 ____ 公尺。`, answer: String(10 * k), units: ["公尺/秒", "公尺/秒鐘", "公尺"],
        explain: `解析：${v} 公里＝${v * 1000} 公尺，1 小時＝3600 秒，${v * 1000}÷3600＝${10 * k}（公尺/秒）。（也就是 ÷3.6）`,
        trapNote: `常見錯誤是把 ${v} 直接 ÷60 得到 ${kit.num(v / 60)}（那只是公里/分），或忘了公里要換成公尺。公里/時 → 公尺/秒 要「×1000 ÷3600」＝÷3.6。` };
    }),
    sp("speed-fill-L5-01", "fill", 5, "extend", kit => {
      const b = kit.int(40, 65), a = b + kit.pick([-10, 10, 15, -5]), t = kit.int(2, 4), D = (a + b) * t;
      return { stem: `甲、乙兩地相距 ${D} 公里。兩車同時由兩地出發相向而行，甲車時速 ${a} 公里，${t} 小時後相遇，則乙車的時速是 ____ 公里。`, answer: String(b), units: ["公里/時", "公里/小時", "公里"],
        explain: `解析：兩車速率和＝${D}÷${t}＝${D / t}（公里/時），乙車時速＝${D / t}−${a}＝${b}（公里/時）。` };
    })
  ]);

  ExamBank.register("speed", "calc", [
    sp("speed-calc-L1-01", "calc", 1, "basic", kit => {
      const v = kit.pick([40, 60, 80, 90]), t = kit.pick([1.5, 2.5, 3.5, 4.5]);
      return { stem: `火車時速 ${v} 公里，行駛 ${t} 小時，距離是多少公里？（列式：${v} × ${t}）`, answer: kit.num(v * t), units: ["公里", "km"],
        explain: `解析：${v}×${t}＝${kit.num(v * t)}（公里）。` };
    }),
    sp("speed-calc-L2-01", "calc", 2, "basic", kit => {
      const v = kit.pick([40, 60, 80, 90]), t = kit.pick([1.5, 2.5, 3.5, 4.5]), d = v * t;
      return { stem: `汽車以時速 ${v} 公里行駛 ${kit.num(d)} 公里，需要幾小時？（列式：${kit.num(d)} ÷ ${v}）`, answer: kit.num(t), units: ["小時", "時"],
        explain: `解析：時間＝距離÷速率＝${kit.num(d)}÷${v}＝${kit.num(t)}（小時）。` };
    }),
    sp("speed-calc-L3-01", "calc", 3, "basic", kit => {
      const m = kit.pick([50, 100, 150, 200, 250, 300, 350, 400, 450, 500]), c = m * 60 / 1000;
      return { stem: `把分速 ${m} 公尺換成時速，是多少公里/時？`, answer: kit.num(c), units: ["公里/時", "公里/小時", "公里"],
        explain: `解析：1 小時＝60 分鐘，每小時走 ${m}×60＝${m * 60} 公尺＝${kit.num(c)} 公里，所以是 ${kit.num(c)} 公里/時。` };
    }),
    sp("speed-calc-L4-01", "calc", 4, "trap", kit => {
      const a = kit.int(5, 9), v = 12 * a, m = kit.pick([10, 15, 20, 25, 30, 40, 45, 50]), d = a * m / 5;
      return { stem: `時速 ${v} 公里的列車行駛 ${m} 分鐘，共行駛多少公里？`, answer: kit.num(d), units: ["公里", "km"],
        explain: `解析：${m} 分鐘＝${m}/60 小時，${v}×${m}/60＝${kit.num(d)}（公里）。`,
        trapNote: `直接算 ${v}×${m}＝${v * m} 是錯的，因為時速的時間單位是「小時」，${m} 分鐘要先換成 ${m}/60 小時。` };
    }),
    sp("speed-calc-L5-01", "calc", 5, "extend", kit => {
      const b = kit.int(40, 60), diff = kit.pick([10, 20]), a = b + diff, t = kit.pick([2, 2.5, 3, 4, 5]), g = diff * t;
      return { stem: `乙騎車在前，甲騎車在後，兩人相距 ${kit.num(g)} 公里，同向前進。甲時速 ${a} 公里，乙時速 ${b} 公里，甲要經過幾小時才追上乙？`, answer: kit.num(t), units: ["小時", "時"],
        explain: `解析：同向追趕，每小時追近 ${a}−${b}＝${diff} 公里，時間＝${kit.num(g)}÷${diff}＝${kit.num(t)}（小時）。` };
    })
  ]);

  ExamBank.register("speed", "word", [
    sp("speed-word-L2-01", "word", 2, "basic", kit => {
      const v = kit.pick([100, 150, 200, 250]), t = kit.pick([10, 20, 30, 40]), m = v * t;
      return { stem: `小宇騎腳踏車，每分鐘騎 ${v} 公尺，騎了 ${t} 分鐘。他一共騎了多少公里？`, answer: kit.num(m / 1000), units: ["公里", "km"],
        explain: `解析：距離＝${v}×${t}＝${m} 公尺，${m}÷1000＝${kit.num(m / 1000)} 公里。` };
    }),
    sp("speed-word-L3-01", "word", 3, "trap", kit => {
      const v = kit.pick([50, 60, 80, 100, 120]), m = kit.pick([10, 15, 20, 25, 30, 40]), d = v * m / 1000;
      return { stem: `小芸家離學校 ${kit.num(d)} 公里，她步行的速率是每分鐘 ${v} 公尺，她從家走到學校要幾分鐘？`, answer: String(m), units: ["分鐘", "分"],
        explain: `解析：${kit.num(d)} 公里＝${v * m} 公尺，時間＝${v * m}÷${v}＝${m}（分鐘）。`,
        trapNote: `題目距離用「公里」、速率用「公尺/分」，單位不同不能直接除；直接算 ${kit.num(d)}÷${v} 會得到很小的錯誤答案。先把公里換成公尺（×1000）。` };
    }),
    sp("speed-word-L3-02", "word", 3, "basic", kit => {
      const a = kit.int(50, 70), b = kit.int(40, 60), t = kit.int(2, 5), D = (a + b) * t;
      return { stem: `甲、乙兩城相距 ${D} 公里。一輛車從甲城出發，時速 ${a} 公里；另一輛車同時從乙城出發，時速 ${b} 公里，兩車相向而行。幾小時後兩車相遇？`, answer: String(t), units: ["小時", "時"],
        explain: `解析：兩車每小時共同縮短 ${a}+${b}＝${a + b} 公里，相遇時間＝${D}÷${a + b}＝${t}（小時）。` };
    }),
    sp("speed-word-L4-01", "word", 4, "extend", kit => {
      let b, k, s, t, tries = 0;
      do { b = kit.pick([60, 80, 90, 100]); k = kit.pick([20, 30, 40]); s = kit.int(4, 12); t = b * s / k; tries++; } while ((t !== Math.floor(t) || t > 60) && tries < 200);
      if (t !== Math.floor(t)) { b = 60; k = 20; s = 5; t = 15; }
      const a = b + k;
      return { stem: `哥哥從家出發，每分鐘走 ${b} 公尺。哥哥走了 ${s} 分鐘後，弟弟才從家出發，騎車每分鐘行 ${a} 公尺去追哥哥。弟弟出發後幾分鐘可以追上哥哥？`, answer: String(t), units: ["分鐘", "分"],
        explain: `解析：弟弟出發時，哥哥已走 ${b}×${s}＝${b * s} 公尺。弟弟每分鐘追近 ${a}−${b}＝${k} 公尺，追上要 ${b * s}÷${k}＝${t}（分鐘）。` };
    }),
    sp("speed-word-L5-01", "word", 5, "extend", kit => {
      const vk = kit.pick([54, 72, 90, 108]), x = vk / 3.6, s = kit.int(20, 40), L = kit.pick([100, 150, 200, 250]), T = x * s - L;
      return { stem: `一列長 ${L} 公尺的火車，時速 ${vk} 公里，從車頭進入隧道到車尾完全離開隧道共花 ${s} 秒。這條隧道長多少公尺？`, answer: String(T), units: ["公尺", "公尺長", "m"],
        explain: `解析：時速 ${vk} 公里＝每秒 ${x} 公尺。${s} 秒共行駛 ${x}×${s}＝${x * s} 公尺，這段距離＝隧道長＋車長，所以隧道長＝${x * s}−${L}＝${T}（公尺）。` };
    })
  ]);
})();
