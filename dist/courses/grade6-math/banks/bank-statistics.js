/* 題庫：statistics（圓形圖、百分率、長條圖折線圖判讀、平均數；數據以文字敘述）｜題庫工 C */
(function () {
  "use strict";
  const sp = (id, type, level, tag, gen) => ({ id, type, level, tag, gen });
  function nopts(kit, correct, wrongs, fmt) {
    const seen = new Set([fmt(correct)]); const out = [];
    wrongs.forEach(w => { if (!isFinite(w) || w <= 0) return; const s = fmt(w); if (!seen.has(s)) { seen.add(s); out.push(s); } });
    const step = Math.max(1, Math.round(correct / 10));
    for (let k = 1; out.length < 3 && k < 30; k++) {
      [correct + step * k, correct - step * k].forEach(w => { if (w > 0 && out.length < 3) { const s = fmt(w); if (!seen.has(s)) { seen.add(s); out.push(s); } } });
    }
    return { options: [fmt(correct)].concat(kit.shuffle(out).slice(0, 3)), answer: 0 };
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
  /* n 個整數，總和可被 n 整除（平均為整數）；cond 可加額外條件 */
  function dataInt(kit, n, lo, hi, cond) {
    for (let t = 0; t < 5000; t++) {
      const a = []; for (let i = 0; i < n; i++) a.push(kit.int(lo, hi));
      const s = a.reduce((x, y) => x + y, 0);
      if (s % n === 0 && new Set(a).size > 1 && (!cond || cond(a, s / n, s))) return a;
    }
    return n === 5 ? [72, 85, 90, 78, 95] : [72, 85, 90, 93];
  }
  const sum = a => a.reduce((x, y) => x + y, 0);
  /* 兩組平均：回傳 {n1,a1,n2,a2,T}，T 為整數，且 T 不等於兩組平均的中間值、n1≠n2 */
  function grp(kit, small) {
    const ns = small ? [2, 3, 4, 5] : [10, 20, 30, 40];
    for (let t = 0; t < 5000; t++) {
      const n1 = kit.pick(ns), n2 = kit.pick(ns); if (n1 === n2) continue;
      const a1 = kit.int(60, 90), a2 = a1 + kit.int(3, 12);
      const tot = n1 * a1 + n2 * a2; if (tot % (n1 + n2)) continue;
      const T = tot / (n1 + n2); if (T * 2 === a1 + a2) continue;
      return { n1, a1, n2, a2, T, tot };
    }
    return { n1: 20, a1: 70, n2: 30, a2: 80, T: 76, tot: 3800 };
  }
  const SPORTS = ["籃球", "游泳", "跑步", "羽球", "桌球", "排球"];
  const PSETS = [[40, 30, 20, 10], [35, 30, 25, 10], [45, 25, 20, 10], [50, 25, 15, 10], [40, 25, 20, 15], [35, 30, 20, 15], [45, 30, 15, 10]];
  const NS = [40, 60, 80, 120, 200];

  ExamBank.register("statistics", "single", [
    sp("statistics-single-L1-01", "single", 1, "basic", kit => {
      let N, p; do { N = kit.pick([20, 25, 40, 50, 60, 80, 120, 200]); p = kit.pick([10, 15, 20, 25, 30, 40, 50, 60]); } while ((N * p) % 100 !== 0);
      const c = N * p / 100, nm = kit.pick(SPORTS);
      const o = nopts(kit, c, [N * p, N - c, p, N / p, N + c, c * 2], x => kit.num(x) + " 人");
      return { stem: `全班有 ${N} 人，調查最喜歡的運動，圓形圖顯示喜歡${nm}的占全班的 ${p}%。喜歡${nm}的有多少人？`, options: o.options, answer: 0,
        explain: `解析：人數＝全班人數×百分率＝${N}×${p}%＝${N}×${p}÷100＝${kit.num(c)}（人）。` };
    }),
    sp("statistics-single-L2-01", "single", 2, "basic", kit => {
      const a = dataInt(kit, 5, 60, 100), s = sum(a), A = s / 5, mid = a.slice().sort((x, y) => x - y)[2];
      const o = nopts(kit, A, [s, s / 6, mid, Math.max.apply(null, a), (Math.max.apply(null, a) + Math.min.apply(null, a)) / 2], x => kit.num(x) + " 分");
      return { stem: `小明五次數學考試的成績分別是 ${a.join("、")} 分，他的平均成績是多少分？`, options: o.options, answer: 0,
        explain: `解析：平均數＝總和÷個數＝(${a.join("＋")})÷5＝${s}÷5＝${A}（分）。` };
    }),
    sp("statistics-single-L3-01", "single", 3, "trap", kit => {
      const p = kit.pick([5, 10, 15, 20, 25, 30, 35, 40, 50, 60]), d = p * 3.6;
      const o = nopts(kit, d, [p, p * 3, p * 6, p * 36, 360 - d, p * 10], x => kit.num(x) + " 度");
      return { stem: `在圓形圖中，喜歡跑步的人數占全部的 ${p}%，這一塊扇形的圓心角是幾度？`, options: o.options, answer: 0,
        explain: `解析：整個圓是 360 度，圓心角＝360×${p}%＝360×${p}÷100＝${kit.num(d)}（度）。（每 1% 對應 3.6 度）`,
        trapNote: `常見錯誤是把 ${p}% 直接當成 ${p} 度。整個圓代表 100%＝360 度，所以 1% 是 3.6 度，要乘 3.6。` };
    }),
    sp("statistics-single-L4-01", "single", 4, "trap", kit => {
      const g = grp(kit);
      const o = nopts(kit, g.T, [(g.a1 + g.a2) / 2, g.a1, g.a2, g.a1 + g.a2, g.T + 2, g.T - 2], x => kit.num(x) + " 分");
      return { stem: `甲班有 ${g.n1} 人，數學平均 ${g.a1} 分；乙班有 ${g.n2} 人，數學平均 ${g.a2} 分。兩班合起來的數學平均是多少分？`, options: o.options, answer: 0,
        explain: `解析：總分＝${g.n1}×${g.a1}＋${g.n2}×${g.a2}＝${g.tot}，總人數＝${g.n1 + g.n2}，平均＝${g.tot}÷${g.n1 + g.n2}＝${g.T}（分）。`,
        trapNote: `把兩個班的平均 (${g.a1}＋${g.a2})÷2＝${kit.num((g.a1 + g.a2) / 2)} 是錯的，因為兩班人數不同（${g.n1} 人與 ${g.n2} 人），人數多的班影響比較大。必須用「總分÷總人數」。` };
    }),
    sp("statistics-single-L5-01", "single", 5, "extend", kit => {
      let n, m, k, need, t = 0;
      do { n = kit.pick([3, 4, 5]); m = kit.int(70, 88); k = kit.pick([1, 2, 3]); need = m + (n + 1) * k; t++; } while (need > 100 && t < 200);
      const o = nopts(kit, need, [m + k, m + n * k, m, m + (n + 2) * k, (n + 1) * k], x => kit.num(x) + " 分");
      return { stem: `小莉前 ${n} 次測驗的平均是 ${m} 分。第 ${n + 1} 次考完後，${n + 1} 次的平均比原來多了 ${k} 分。她第 ${n + 1} 次考了幾分？`, options: o.options, answer: 0,
        explain: `解析：新平均＝${m}＋${k}＝${m + k}，${n + 1} 次總分＝${m + k}×${n + 1}＝${(m + k) * (n + 1)}；前 ${n} 次總分＝${m}×${n}＝${m * n}；第 ${n + 1} 次＝${(m + k) * (n + 1)}−${m * n}＝${need}（分）。` };
    })
  ]);

  ExamBank.register("statistics", "multi", [
    sp("statistics-multi-L2-01", "multi", 2, "basic", kit => {
      const p = kit.pick(PSETS), N = kit.pick(NS), nm = kit.shuffle(SPORTS).slice(0, 4), c = p.map(x => N * x / 100);
      return multiQ(kit, `某班 ${N} 人，調查最喜歡的運動（每人只選一項），圓形圖的結果：${nm[0]} ${p[0]}%、${nm[1]} ${p[1]}%、${nm[2]} ${p[2]}%、${nm[3]} ${p[3]}%。`, [
        [`${nm[0]}是最多人喜歡的，有 ${c[0]} 人`, `${N}×${p[0]}%＝${c[0]}，百分率最大。`],
        [`${nm[1]}比${nm[2]}多 ${c[1] - c[2]} 人`, `${c[1]}−${c[2]}＝${c[1] - c[2]}。`],
        [`${nm[0]}的扇形圓心角是 ${kit.num(p[0] * 3.6)} 度`, `360×${p[0]}%＝${kit.num(p[0] * 3.6)}。`],
        [`${nm[2]}和${nm[3]}合起來占全班的 ${p[2] + p[3]}%`, `${p[2]}%＋${p[3]}%＝${p[2] + p[3]}%。`]
      ], [
        [`${nm[0]}的扇形圓心角是 ${p[0]} 度`, `圓心角要用 360×${p[0]}%＝${kit.num(p[0] * 3.6)} 度。`],
        [`${nm[1]}比${nm[2]}多 ${p[1] - p[2]} 人`, `${p[1] - p[2]} 是百分率的差，人數差是 ${c[1] - c[2]} 人。`],
        [`${nm[3]}有 ${p[3]} 人`, `${p[3]}% 要乘全班 ${N} 人，是 ${c[3]} 人。`],
        [`${nm[0]}和${nm[1]}合起來占全班的 ${p[0] + p[1] - 5}%`, `應是 ${p[0]}%＋${p[1]}%＝${p[0] + p[1]}%。`],
        [`${nm[2]}是最少人喜歡的`, `最少的是${nm[3]}（${p[3]}%）。`]
      ]);
    }),
    sp("statistics-multi-L3-01", "multi", 3, "trap", kit => {
      const k = kit.pick([5, 10]);
      const a = dataInt(kit, 5, 60, 98, (arr, A) => arr.indexOf(A) < 0 && (Math.max.apply(null, arr) + Math.min.apply(null, arr)) / 2 !== A);
      const S = sum(a), A = S / 5, mx = Math.max.apply(null, a);
      const r = multiQ(kit, `五位同學的測驗成績是 ${a.join("、")} 分，平均數是 ${A} 分。`, [
        [`這五個數的總和是 ${S}`, `${A}×5＝${S}。`],
        [`每個人都多加 ${k} 分，平均數會變成 ${A + k} 分`, `每個數都加 ${k}，平均也加 ${k}。`],
        [`平均數 ${A} 比最高分 ${mx} 小`, "平均數一定介於最低與最高之間，這組資料不全相同，所以比最高分小。"],
        [`把總分平分給五個人，每人都是 ${A} 分`, "平均數的意思就是「平分後每份的量」。"]
      ], [
        ["平均數一定是這組資料中的某一個數", `這組資料裡沒有 ${A}，平均數不一定出現在資料中。`],
        ["平均數就是最高分與最低分的和的一半", `這組資料算出來不是 ${A}，平均要用「總和÷個數」。`],
        [`這五個數的總和是 ${A * 4}`, `總和是 ${A}×5＝${S}，不是 ×4。`],
        [`只有最高分增加 ${k} 分，平均數也增加 ${k} 分`, `總和增加 ${k}，要再 ÷5，平均只增加 ${kit.num(k / 5)} 分。`]
      ]);
      r.trapNote = "平均數是「總和÷個數」，它不一定是資料裡的某個數，也不是最大與最小的中間值；只有一個數變動時，平均的變化要再除以個數。";
      return r;
    }),
    sp("statistics-multi-L3-02", "multi", 3, "trap", kit => {
      const N1 = kit.pick([20, 30]), p1 = kit.pick([40, 50, 60]), N2 = kit.pick([120, 160, 200]), p2 = kit.pick([20, 25, 30]);
      const c1 = N1 * p1 / 100, c2 = N2 * p2 / 100;
      const r = multiQ(kit, `甲班有 ${N1} 人，喜歡閱讀的占 ${p1}%；乙班有 ${N2} 人，喜歡閱讀的占 ${p2}%。`, [
        ["甲班喜歡閱讀的「百分率」比乙班高", `${p1}% > ${p2}%。`],
        [`乙班喜歡閱讀的有 ${c2} 人`, `${N2}×${p2}%＝${c2}。`],
        [`甲班喜歡閱讀的有 ${c1} 人`, `${N1}×${p1}%＝${c1}。`],
        ["乙班喜歡閱讀的「人數」比甲班多", `${c2} > ${c1}。`]
      ], [
        ["甲班的百分率較高，所以甲班喜歡閱讀的人數較多", `百分率高不代表人數多，還要看全班人數：甲 ${c1} 人、乙 ${c2} 人。`],
        [`甲班喜歡閱讀的有 ${p1} 人`, `${p1}% 要乘以 ${N1} 人，是 ${c1} 人。`],
        [`乙班喜歡閱讀的有 ${p2} 人`, `${p2}% 要乘以 ${N2} 人，是 ${c2} 人。`],
        ["兩班喜歡閱讀的人數一樣多", `甲 ${c1} 人、乙 ${c2} 人，不一樣多。`]
      ]);
      r.trapNote = "比較百分率只能比「占全班的比例」，要比人數必須乘上各自的總人數。總人數不同時，百分率高的人數不一定多。";
      return r;
    }),
    sp("statistics-multi-L4-01", "multi", 4, "basic", kit => {
      const a = dataInt(kit, 5, 60, 100, (arr, A) => (Math.max.apply(null, arr) + Math.min.apply(null, arr)) / 2 !== A);
      const S = sum(a), A = S / 5, mx = Math.max.apply(null, a), mn = Math.min.apply(null, a);
      return multiQ(kit, `小傑五次段考的成績是 ${a.join("、")} 分。`, [
        [`五次的總分是 ${S} 分`, `${a.join("＋")}＝${S}。`],
        [`五次的平均是 ${A} 分`, `${S}÷5＝${A}。`],
        [`平均比最高分低 ${mx - A} 分`, `${mx}−${A}＝${mx - A}。`],
        [`最高分與最低分相差 ${mx - mn} 分`, `${mx}−${mn}＝${mx - mn}。`]
      ], [
        [`五次的平均是 ${kit.num((mx + mn) / 2)} 分`, `平均不是最高與最低的平均，應是 ${S}÷5＝${A}。`],
        [`五次的總分是 ${A * 4} 分`, `總分是 ${A}×5＝${S}。`],
        [`平均比最低分高 ${A - mn + 3} 分`, `${A}−${mn}＝${A - mn}，不是 ${A - mn + 3}。`],
        [`最高分與最低分相差 ${mx + mn} 分`, `相差要相減：${mx}−${mn}＝${mx - mn}。`]
      ]);
    }),
    sp("statistics-multi-L5-01", "multi", 5, "extend", kit => {
      const g = grp(kit);
      return multiQ(kit, `甲組 ${g.n1} 人平均 ${g.a1} 分，乙組 ${g.n2} 人平均 ${g.a2} 分，兩組合成一個大組。`, [
        [`大組的總分是 ${g.tot} 分`, `${g.n1}×${g.a1}＋${g.n2}×${g.a2}＝${g.tot}。`],
        [`大組的平均是 ${g.T} 分`, `${g.tot}÷${g.n1 + g.n2}＝${g.T}。`],
        [`大組的平均介於 ${g.a1} 分與 ${g.a2} 分之間`, "合併後的平均一定落在兩組平均之間。"],
        [`大組的平均比較接近人數${g.n1 > g.n2 ? "較多的甲組" : "較多的乙組"}`, "人數多的一組占的比重大，把平均拉向自己。"]
      ], [
        [`大組的平均是 ${kit.num((g.a1 + g.a2) / 2)} 分`, `兩組人數不同，不能直接平均，應是 ${g.T} 分。`],
        [`大組的平均比 ${g.a1} 分還低`, `平均會落在 ${g.a1} 與 ${g.a2} 之間，不可能比 ${g.a1} 低。`],
        [`大組的平均比 ${g.a2} 分還高`, `平均會落在 ${g.a1} 與 ${g.a2} 之間，不可能比 ${g.a2} 高。`],
        [`大組的總分是 ${(g.a1 + g.a2) * (g.n1 + g.n2) / 2} 分`, `總分應是 ${g.tot} 分。`]
      ]);
    })
  ]);

  ExamBank.register("statistics", "tf", [
    sp("statistics-tf-L1-01", "tf", 1, "basic", kit => {
      let N, p; do { N = kit.pick([20, 40, 50, 60, 80, 120, 200]); p = kit.pick([10, 20, 25, 30, 40, 50]); } while ((N * p) % 100 !== 0);
      const c = N * p / 100, nm = kit.pick(SPORTS), bad = kit.pick([p, c * 2, c + 5]);
      return tfQ(kit,
        [`全班 ${N} 人，圓形圖顯示喜歡${nm}的占 ${p}%，所以喜歡${nm}的有 ${c} 人。`, `正確：${N}×${p}%＝${c}（人）。`],
        [`全班 ${N} 人，圓形圖顯示喜歡${nm}的占 ${p}%，所以喜歡${nm}的有 ${bad} 人。`, `錯誤：人數＝${N}×${p}%＝${c} 人，不是 ${bad} 人。`]);
    }),
    sp("statistics-tf-L2-01", "tf", 2, "basic", kit => {
      const a = dataInt(kit, 4, 60, 100), A = sum(a) / 4;
      return tfQ(kit,
        [`${a.join("、")} 這四個數的平均數是 ${A}。`, `正確：(${a.join("＋")})÷4＝${sum(a)}÷4＝${A}。`],
        [`${a.join("、")} 這四個數的平均數是 ${A + kit.pick([-3, -2, 2, 3])}。`, `錯誤：(${a.join("＋")})÷4＝${A}。`]);
    }),
    sp("statistics-tf-L3-01", "tf", 3, "trap", kit => {
      const p = kit.pick([5, 10, 15, 20, 25, 30, 40]), d = p * 3.6;
      const r = tfQ(kit,
        [`圓形圖中占 ${p}% 的扇形，圓心角是 ${kit.num(d)} 度。`, `正確：360×${p}%＝${kit.num(d)}（度）。`],
        [`圓形圖中占 ${p}% 的扇形，圓心角是 ${kit.pick([p, p * 10])} 度。`, `錯誤：圓心角＝360×${p}%＝${kit.num(d)} 度，百分率不能直接當度數。`]);
      r.trapNote = "整個圓＝100%＝360 度，1% 對應 3.6 度；把百分率直接當成角度是常見錯誤。";
      return r;
    }),
    sp("statistics-tf-L4-01", "tf", 4, "trap", kit => {
      const g = grp(kit), head = `甲班 ${g.n1} 人，平均 ${g.a1} 分；乙班 ${g.n2} 人，平均 ${g.a2} 分。兩班合起來的平均是`;
      const r = tfQ(kit,
        [`${head} ${g.T} 分。`, `正確：總分 ${g.tot} 分÷總人數 ${g.n1 + g.n2} 人＝${g.T} 分。`],
        [`${head} ${kit.num((g.a1 + g.a2) / 2)} 分。`, `錯誤：兩班人數不同，要用 (${g.n1}×${g.a1}＋${g.n2}×${g.a2})÷${g.n1 + g.n2}＝${g.T} 分，不能把兩個平均再平均。`]);
      r.trapNote = "「平均的平均」只有在兩組人數相同時才成立；人數不同要先算各組總分。";
      return r;
    }),
    sp("statistics-tf-L5-01", "tf", 5, "extend", kit => {
      const a = dataInt(kit, 5, 55, 100), A = sum(a) / 5, last = a[4], s4 = sum(a.slice(0, 4));
      const bad = last + kit.pick([-6, -4, -3, 3, 4, 6]);
      return tfQ(kit,
        [`五個數的平均是 ${A}，其中四個數是 ${a.slice(0, 4).join("、")}，則第五個數是 ${last}。`, `正確：總和＝${A}×5＝${A * 5}，第五個數＝${A * 5}−${s4}＝${last}。`],
        [`五個數的平均是 ${A}，其中四個數是 ${a.slice(0, 4).join("、")}，則第五個數是 ${bad}。`, `錯誤：總和＝${A}×5＝${A * 5}，第五個數＝${A * 5}−${s4}＝${last}，不是 ${bad}。`]);
    })
  ]);

  ExamBank.register("statistics", "fill", [
    sp("statistics-fill-L1-01", "fill", 1, "basic", kit => {
      const a = dataInt(kit, 5, 55, 100), A = sum(a) / 5;
      return { stem: `某組五位同學的成績分別是 ${a.join("、")} 分，平均是 ____ 分。`, answer: String(A), units: ["分"],
        explain: `解析：(${a.join("＋")})÷5＝${sum(a)}÷5＝${A}（分）。` };
    }),
    sp("statistics-fill-L2-01", "fill", 2, "basic", kit => {
      let N, p; do { N = kit.pick([40, 60, 80, 120, 200, 240]); p = kit.pick([5, 10, 15, 20, 25, 30, 35, 40]); } while ((N * p) % 100 !== 0);
      const c = N * p / 100;
      return { stem: `全校有 ${N} 位學生，圓形圖顯示搭公車上學的占 ${p}%，搭公車的有 ____ 人。`, answer: kit.num(c), units: ["人", "位"],
        explain: `解析：${N}×${p}%＝${N}×${p}÷100＝${kit.num(c)}（人）。` };
    }),
    sp("statistics-fill-L3-01", "fill", 3, "basic", kit => {
      const d = kit.pick([36, 54, 72, 90, 108, 144, 180]), p = d / 3.6;
      return { stem: `圓形圖中，某個扇形的圓心角是 ${d} 度，它占全部的 ____ %。`, answer: kit.num(p), units: ["%", "％", "百分比"],
        explain: `解析：${d}÷360＝${kit.num(d / 360)}＝${kit.num(p)}%。（每 3.6 度是 1%，${d}÷3.6＝${kit.num(p)}）` };
    }),
    sp("statistics-fill-L4-01", "fill", 4, "trap", kit => {
      const a = kit.pick([40, 80, 120, 200]), p = kit.pick([10, 20, 25, 50]), b = a * (100 + p) / 100;
      return { stem: `小宇上個月的零用錢是 ${a} 元，這個月是 ${b} 元，這個月比上個月增加了 ____ %。`, answer: String(p), units: ["%", "％", "百分比"],
        explain: `解析：增加量＝${b}−${a}＝${b - a} 元，以「上個月」為基準：${b - a}÷${a}＝${kit.num((b - a) / a)}＝${p}%。`,
        trapNote: `基準量是「上個月」的 ${a} 元。若誤用這個月的 ${b} 元當基準，會算成 ${kit.num((b - a) / b * 100)}%。「比誰多」，誰就是基準量。` };
    }),
    sp("statistics-fill-L5-01", "fill", 5, "extend", kit => {
      const N = kit.pick([40, 60, 80, 100, 120, 200]), p = kit.pick([10, 15, 20, 25, 30, 40, 50]), k = N * p / 100, d = p * 3.6;
      return { stem: `圓形圖中，喜歡閱讀的扇形圓心角是 ${kit.num(d)} 度，喜歡閱讀的有 ${kit.num(k)} 人，全班共有 ____ 人。`, answer: String(N), units: ["人", "位"],
        explain: `解析：圓心角 ${kit.num(d)} 度占 ${kit.num(d)}÷360＝${p}%；${kit.num(k)} 人是全班的 ${p}%，全班＝${kit.num(k)}÷${p}%＝${N}（人）。` };
    })
  ]);

  ExamBank.register("statistics", "calc", [
    sp("statistics-calc-L1-01", "calc", 1, "basic", kit => {
      const a = []; for (let i = 0; i < 4; i++) a.push(kit.int(60, 100));
      const A = sum(a) / 4;
      return { stem: `計算 ${a.join("、")} 這四個數的平均數。`, answer: kit.num(A), units: ["分"],
        explain: `解析：(${a.join("＋")})÷4＝${sum(a)}÷4＝${kit.num(A)}。` };
    }),
    sp("statistics-calc-L2-01", "calc", 2, "basic", kit => {
      let N, p; do { N = kit.pick([40, 60, 80, 120, 160, 200, 240]); p = kit.pick([5, 15, 20, 25, 35, 45, 55]); } while ((N * p) % 100 !== 0);
      return { stem: `某校 ${N} 位學生中有 ${p}% 參加社團，參加社團的有多少人？（列式：${N} × ${p} ÷ 100）`, answer: kit.num(N * p / 100), units: ["人", "位"],
        explain: `解析：${N}×${p}÷100＝${kit.num(N * p / 100)}（人）。` };
    }),
    sp("statistics-calc-L3-01", "calc", 3, "basic", kit => {
      const g = grp(kit, true);
      return { stem: `前 ${g.n1} 次測驗的平均是 ${g.a1} 分，後 ${g.n2} 次測驗的平均是 ${g.a2} 分。這 ${g.n1 + g.n2} 次測驗的總平均是多少分？`, answer: String(g.T), units: ["分"],
        explain: `解析：總分＝${g.n1}×${g.a1}＋${g.n2}×${g.a2}＝${g.tot}，平均＝${g.tot}÷${g.n1 + g.n2}＝${g.T}（分）。` };
    }),
    sp("statistics-calc-L4-01", "calc", 4, "trap", kit => {
      const a = kit.pick([40, 80, 120, 200]), p = kit.pick([10, 20, 25, 50]), b = a * (100 - p) / 100;
      return { stem: `某商品上個月賣出 ${a} 件，這個月賣出 ${b} 件，這個月比上個月減少了百分之幾？`, answer: String(p), units: ["%", "％", "百分比"],
        explain: `解析：減少量＝${a}−${b}＝${a - b} 件，基準是上個月的 ${a} 件：${a - b}÷${a}＝${kit.num((a - b) / a)}＝${p}%。`,
        trapNote: `「比上個月減少」的基準是上個月（${a} 件）。若用這個月的 ${b} 件當分母，會算出 ${kit.num((a - b) / b * 100)}%，是錯的。` };
    }),
    sp("statistics-calc-L5-01", "calc", 5, "extend", kit => {
      let n, A, d, B, M, t = 0;
      do { n = kit.pick([5, 6, 7, 9]); B = kit.int(70, 85); d = kit.pick([1, 2, 3]); A = B + d; M = A + (n - 1) * d; t++; } while (M > 100 && t < 500);
      return { stem: `${n} 位同學的數學平均是 ${A} 分，其中最高分是 ${M} 分。去掉最高分後，其餘 ${n - 1} 位同學的平均是多少分？`, answer: String(B), units: ["分"],
        explain: `解析：${n} 人總分＝${A}×${n}＝${A * n}，去掉最高分後剩 ${A * n}−${M}＝${A * n - M}，平均＝${A * n - M}÷${n - 1}＝${B}（分）。` };
    })
  ]);

  ExamBank.register("statistics", "word", [
    sp("statistics-word-L2-01", "word", 2, "basic", kit => {
      const a = dataInt(kit, 4, 20, 90);
      return { stem: `小琪第一到第四週分別存了 ${a.join("、")} 元，她平均每週存多少元？`, answer: String(sum(a) / 4), units: ["元"],
        explain: `解析：總共存了 ${a.join("＋")}＝${sum(a)} 元，平均＝${sum(a)}÷4＝${sum(a) / 4}（元）。` };
    }),
    sp("statistics-word-L3-01", "word", 3, "trap", kit => {
      let v, md, rg, t = 0;
      do {
        v = []; for (let i = 0; i < 5; i++) v.push(kit.int(40, 120));
        md = 0; for (let i = 1; i < 5; i++) md = Math.max(md, Math.abs(v[i] - v[i - 1]));
        rg = Math.max.apply(null, v) - Math.min.apply(null, v); t++;
      } while ((md === rg || new Set(v).size < 5) && t < 1000);
      return { stem: `長條圖顯示圖書館一月到五月的借書量依序是 ${v.join("、")} 本。相鄰兩個月的借書量相差最多是多少本？`, answer: String(md), units: ["本"],
        explain: `解析：相鄰兩月的差依序是 ${[1, 2, 3, 4].map(i => Math.abs(v[i] - v[i - 1])).join("、")}，最大的是 ${md} 本。`,
        trapNote: `題目問「相鄰兩個月」的差。若直接用最高月減最低月 (${Math.max.apply(null, v)}−${Math.min.apply(null, v)}＝${rg})，兩個月不一定相鄰，會答錯。` };
    }),
    sp("statistics-word-L3-02", "word", 3, "basic", kit => {
      let N, p1, p2, p3, p4, t = 0;
      do { N = kit.pick([40, 60, 80, 100, 120, 200]); p1 = kit.pick([20, 25, 30, 35]); p2 = kit.pick([15, 20, 25, 30]); p3 = kit.pick([10, 15, 20]); p4 = 100 - p1 - p2 - p3; t++; } while (p4 < 5 && t < 200);
      const c = N * p4 / 100;
      return { stem: `某班有 ${N} 人，圓形圖顯示最喜歡的休閒活動：看書占 ${p1}%、運動占 ${p2}%、聽音樂占 ${p3}%，其餘的人最喜歡玩遊戲。最喜歡玩遊戲的有多少人？`, answer: kit.num(c), units: ["人", "位"],
        explain: `解析：玩遊戲占 100%−${p1}%−${p2}%−${p3}%＝${p4}%，人數＝${N}×${p4}%＝${kit.num(c)}（人）。` };
    }),
    sp("statistics-word-L4-01", "word", 4, "extend", kit => {
      let N, m, am, af, T, t = 0;
      do { N = kit.pick([30, 35, 40, 50]); m = kit.int(Math.floor(N / 3), Math.floor(N * 2 / 3)); am = kit.int(65, 90); af = am + kit.pick([-8, -5, 5, 8, 10]);
        T = (m * am + (N - m) * af) / N; t++; } while (((T * 10) % 1 !== 0 || af === am || af > 100) && t < 5000);
      return { stem: `某班共有 ${N} 人，數學平均是 ${kit.num(T)} 分，其中男生 ${m} 人，男生的平均是 ${am} 分。女生的平均是多少分？`, answer: String(af), units: ["分"],
        explain: `解析：全班總分＝${kit.num(T)}×${N}＝${kit.num(T * N)}，男生總分＝${am}×${m}＝${am * m}，女生總分＝${kit.num(T * N)}−${am * m}＝${kit.num(T * N - am * m)}，女生 ${N - m} 人，平均＝${kit.num(T * N - am * m)}÷${N - m}＝${af}（分）。` };
    }),
    sp("statistics-word-L5-01", "word", 5, "extend", kit => {
      const [N1, N2] = kit.pick([[200, 300], [300, 200], [100, 400], [400, 100]]), p1 = kit.pick([10, 20, 30, 40, 50]), p2 = kit.pick([15, 25, 35, 45, 55]);
      const c1 = N1 * p1 / 100, c2 = N2 * p2 / 100, r = (c1 + c2) / (N1 + N2) * 100;
      return { stem: `甲校有 ${N1} 位學生，騎腳踏車上學的占 ${p1}%；乙校有 ${N2} 位學生，騎腳踏車上學的占 ${p2}%。兩校合起來，騎腳踏車上學的占兩校學生總數的百分之幾？`, answer: kit.num(r), units: ["%", "％", "百分比"],
        explain: `解析：甲校 ${N1}×${p1}%＝${c1} 人，乙校 ${N2}×${p2}%＝${c2} 人，合計 ${c1 + c2} 人；兩校共 ${N1 + N2} 人，${c1 + c2}÷${N1 + N2}＝${kit.num(r)}%。（不能把 ${p1}% 與 ${p2}% 直接平均）` };
    })
  ]);
})();
