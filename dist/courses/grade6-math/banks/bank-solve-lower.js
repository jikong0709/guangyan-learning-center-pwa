/* 題庫：solve-lower（年齡問題、平均問題、追趕與組合問題）｜題庫工 C */
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
  const sum = a => a.reduce((x, y) => x + y, 0);
  function dataInt(kit, n, lo, hi) {
    for (let t = 0; t < 5000; t++) {
      const a = []; for (let i = 0; i < n; i++) a.push(kit.int(lo, hi));
      if (sum(a) % n === 0 && new Set(a).size > 1) return a;
    }
    return n === 4 ? [72, 85, 90, 93] : [72, 85, 95];
  }
  /* 兩組平均（a1<a2、n1≠n2，合併平均 T 為整數且不等於兩平均的中點） */
  function grp(kit) {
    const ns = [10, 20, 30, 40];
    for (let t = 0; t < 5000; t++) {
      const n1 = kit.pick(ns), n2 = kit.pick(ns); if (n1 === n2) continue;
      const a1 = kit.int(60, 90), a2 = a1 + kit.int(3, 12);
      const tot = n1 * a1 + n2 * a2; if (tot % (n1 + n2)) continue;
      const T = tot / (n1 + n2); if (T * 2 === a1 + a2) continue;
      return { n1, a1, n2, a2, T, tot };
    }
    return { n1: 20, a1: 70, n2: 30, a2: 80, T: 76, tot: 3800 };
  }
  /* 「幾年後爸爸是兒子的 k 倍」：回傳 {B 爸爸今年, C 兒子今年, t 幾年後, c0 當時兒子年齡} */
  function ageSet(kit, k) {
    for (let i = 0; i < 5000; i++) {
      const c0 = kit.int(10, 26), t = kit.int(1, 12), C = c0 - t, B = C + (k - 1) * c0;
      if (C >= 4 && B >= 28 && B <= 50) return { B, C, t, c0 };
    }
    return k === 2 ? { B: 34, C: 8, t: 18, c0: 26 } : { B: 41, C: 11, t: 4, c0: 15 };
  }
  /* 追趕：哥哥每分鐘 b 公尺先走 s 分鐘，弟弟每分鐘 a 公尺追，t 分鐘追上（整數） */
  function chase(kit) {
    for (let i = 0; i < 5000; i++) {
      const b = kit.pick([60, 70, 80, 90]), k = kit.pick([20, 30, 40]), s = kit.int(4, 12), t = b * s / k;
      if (t === Math.floor(t) && t <= 40) return { a: b + k, b, s, t, k };
    }
    return { a: 80, b: 60, s: 4, t: 12, k: 20 };
  }

  ExamBank.register("solve-lower", "single", [
    sp("solve-lower-single-L1-01", "single", 1, "basic", kit => {
      const c = kit.int(6, 12), g = kit.int(24, 32), t = kit.int(2, 9), ans = c + g + t;
      const o = nopts(kit, ans, [c + g, c + t, g + t, c + g + 2 * t, c + g - t, ans + 5], x => kit.num(x) + " 歲");
      return { stem: `兒子今年 ${c} 歲，爸爸比兒子大 ${g} 歲。${t} 年後爸爸幾歲？`, options: o.options, answer: 0,
        explain: `解析：爸爸今年 ${c}＋${g}＝${c + g} 歲，${t} 年後 ${c + g}＋${t}＝${ans} 歲。` };
    }),
    sp("solve-lower-single-L2-01", "single", 2, "basic", kit => {
      let n, a, d, x, t = 0;
      do { n = kit.pick([3, 4, 5]); a = kit.int(70, 88); d = kit.pick([-3, -2, -1, 1, 2, 3, 4]); x = a + (n + 1) * d; t++; } while ((x < 40 || x > 100) && t < 500);
      const ans = a + d;
      const o = nopts(kit, ans, [(a + x) / 2, x, a, a + x, a + 2 * d, a - d], v => kit.num(v) + " 分");
      return { stem: `小翊前 ${n} 科的平均是 ${a} 分，第 ${n + 1} 科考了 ${x} 分，這 ${n + 1} 科的平均是多少分？`, options: o.options, answer: 0,
        explain: `解析：前 ${n} 科總分＝${a}×${n}＝${a * n}，加第 ${n + 1} 科後總分＝${a * n}＋${x}＝${a * n + x}，平均＝${a * n + x}÷${n + 1}＝${ans}（分）。` };
    }),
    sp("solve-lower-single-L3-01", "single", 3, "trap", kit => {
      const b = kit.int(8, 14), a = b + kit.int(24, 32), t = kit.int(3, 12), diff = a - b;
      const o = nopts(kit, diff, [diff + t, diff + 2 * t, diff - t, a + t, b + t, diff * 2], v => kit.num(v) + " 歲");
      return { stem: `爸爸今年 ${a} 歲，兒子今年 ${b} 歲。${t} 年後，爸爸和兒子的年齡差是多少歲？`, options: o.options, answer: 0,
        explain: `解析：每過一年，兩人都長 1 歲，年齡差永遠不變：${a}−${b}＝${diff}（歲）。${t} 年後爸爸 ${a + t} 歲、兒子 ${b + t} 歲，差還是 ${(a + t) - (b + t)}。`,
        trapNote: `年齡差是不會改變的！常見錯誤是以為爸爸多長 ${t} 歲所以差變大（${diff + t}），忘了兒子同樣也長了 ${t} 歲。` };
    }),
    sp("solve-lower-single-L4-01", "single", 4, "trap", kit => {
      const k = kit.pick([2, 3, 4]), s = ageSet(kit, k), g = (k - 1) * s.c0 - 0 * 1; const diff = s.B - s.C;
      const o = nopts(kit, s.t, [(k - 1) * s.t, s.c0, diff, s.t + 1, s.t + 2, s.B - k * s.C], v => kit.num(v) + " 年");
      return { stem: `今年爸爸 ${s.B} 歲，兒子 ${s.C} 歲。幾年後爸爸的年齡剛好是兒子的 ${k} 倍？`, options: o.options, answer: 0,
        explain: `解析：年齡差永遠是 ${s.B}−${s.C}＝${diff} 歲。爸爸是兒子的 ${k} 倍時，差就是兒子年齡的 ${k - 1} 倍，所以兒子那時 ${diff}÷${k - 1}＝${s.c0} 歲。${s.c0}−${s.C}＝${s.t}（年）。`,
        trapNote: `解題關鍵是「年齡差不變」。兒子那時的年齡要用差 ÷ (倍數−1) 求出（${diff}÷${k - 1}＝${s.c0} 歲），不是直接把 ${s.c0} 當成答案，也不是 ${diff} 或 (倍數−1)×某數；最後還要減去兒子現在的歲數才是「幾年後」。` };
    }),
    sp("solve-lower-single-L5-01", "single", 5, "extend", kit => {
      let n, A, d, B, x, t = 0;
      do { n = kit.pick([5, 6, 8, 10]); A = kit.int(72, 90); d = kit.pick([-3, -2, -1, 1, 2, 3]); B = A + d; x = n * A - (n - 1) * B; t++; } while ((x < 40 || x > 100) && t < 800);
      const o = nopts(kit, x, [A, B, Math.abs(A - B), n * A, (n - 1) * B, x + 10, x - 10], v => kit.num(v) + " 分");
      return { stem: `某小組 ${n} 人的數學平均是 ${A} 分。其中一位同學轉學後，剩下 ${n - 1} 人的平均變成 ${B} 分。轉學的同學原本考了幾分？`, options: o.options, answer: 0,
        explain: `解析：原總分＝${A}×${n}＝${A * n}；剩下 ${n - 1} 人總分＝${B}×${n - 1}＝${B * (n - 1)}；轉學同學＝${A * n}−${B * (n - 1)}＝${x}（分）。` };
    })
  ]);

  ExamBank.register("solve-lower", "multi", [
    sp("solve-lower-multi-L2-01", "multi", 2, "basic", kit => {
      const b = kit.int(8, 14), a = b + kit.int(24, 32), t = kit.int(2, 6);
      return multiQ(kit, `爸爸今年 ${a} 歲，兒子今年 ${b} 歲。`, [
        [`${t} 年後，爸爸 ${a + t} 歲`, `${a}＋${t}＝${a + t}。`],
        [`${t} 年後，兩人的年齡差仍是 ${a - b} 歲`, "兩人同時變老，差不變。"],
        [`${t} 年前，兒子 ${b - t} 歲`, `${b}−${t}＝${b - t}。`],
        [`兩人的年齡差永遠是 ${a - b} 歲`, "年齡差不會隨時間改變。"]
      ], [
        [`${t} 年後，兩人的年齡差是 ${a - b + t} 歲`, `差不變，仍是 ${a - b} 歲。`],
        [`${t} 年後，兒子 ${b + 2 * t} 歲`, `兒子只長 ${t} 歲，是 ${b + t} 歲。`],
        [`${t} 年前，爸爸 ${a + t} 歲`, `${t} 年前應是 ${a}−${t}＝${a - t} 歲。`],
        ["年齡差每過一年就增加 1 歲", "兩人一樣每年長 1 歲，差不變。"]
      ]);
    }),
    sp("solve-lower-multi-L3-01", "multi", 3, "trap", kit => {
      const k = kit.pick([2, 3, 4]), C = kit.int(6, 12), B = k * C, t = kit.int(2, 5), d = B - C;
      const r = multiQ(kit, `爸爸今年 ${B} 歲，兒子今年 ${C} 歲（爸爸正好是兒子的 ${k} 倍）。`, [
        [`${t} 年後，爸爸 ${B + t} 歲、兒子 ${C + t} 歲`, "兩人各加 " + t + " 歲。"],
        [`兩人的年齡差 ${d} 歲不會隨年份改變`, "差永遠不變。"],
        [`${t} 年前，兩人的年齡差也是 ${d} 歲`, "不論過去或未來，差都不變。"]
      ], [
        [`${t} 年後，爸爸仍然是兒子的 ${k} 倍`, `${B + t}÷${C + t} 不等於 ${k}，倍數會隨年份改變。`],
        [`${t} 年後，兩人的年齡差是 ${d + t} 歲`, `差不變，仍是 ${d} 歲。`],
        [`倍數永遠不變，所以 ${t} 年後爸爸是 ${(C + t) * k} 歲`, `倍數會變。爸爸 ${t} 年後是 ${B + t} 歲。`]
      ]);
      r.trapNote = "年齡的「差」永遠不變，但「倍數」會隨時間改變（年紀越大，倍數越小）。不能把今年的倍數關係套到別的年份。";
      return r;
    }),
    sp("solve-lower-multi-L3-02", "multi", 3, "trap", kit => {
      const g = grp(kit);
      const r = multiQ(kit, `男生 ${g.n1} 人，平均 ${g.a1} 分；女生 ${g.n2} 人，平均 ${g.a2} 分。`, [
        [`全班總分是 ${g.tot} 分`, `${g.n1}×${g.a1}＋${g.n2}×${g.a2}＝${g.tot}。`],
        [`全班平均是 ${g.T} 分`, `${g.tot}÷${g.n1 + g.n2}＝${g.T}。`],
        [`全班平均一定介於 ${g.a1} 與 ${g.a2} 之間`, "合併平均介於兩組平均之間。"],
        ["只有兩組人數相同時，全班平均才剛好是兩個平均的中間值", "人數不同時，人數多的一組比重較大。"]
      ], [
        [`全班平均是 ${(g.a1 + g.a2) / 2} 分`, `人數不同，不能直接平均，應是 ${g.T} 分。`],
        [`全班總分是 ${g.a1 + g.a2} 分`, `總分要把「人數×平均」加起來，是 ${g.tot} 分。`],
        [`全班平均比 ${g.a2} 分還高`, `全班平均不會超過最高的那組平均 ${g.a2} 分。`],
        [`全班總分是 ${(g.a1 + g.a2) * (g.n1 + g.n2) / 2} 分`, `這是假設平均為中間值的算法，正確總分是 ${g.tot} 分。`]
      ]);
      r.trapNote = "兩組的平均不能直接再平均；要先各自「平均×人數」算出總分，再除以總人數。";
      return r;
    }),
    sp("solve-lower-multi-L4-01", "multi", 4, "basic", kit => {
      let n, A, d, x, t = 0;
      do { n = kit.pick([4, 5, 6, 8]); A = kit.int(70, 88); d = kit.int(1, 4); x = A + (n + 1) * d; t++; } while (x > 100 && t < 500);
      return multiQ(kit, `某組 ${n} 人的平均是 ${A} 分，現在新加入一位同學，成績是 ${x} 分。`, [
        [`原本 ${n} 人的總分是 ${A * n} 分`, `${A}×${n}＝${A * n}。`],
        [`加入後總分是 ${A * n + x} 分`, `${A * n}＋${x}＝${A * n + x}。`],
        [`加入後 ${n + 1} 人的平均是 ${A + d} 分`, `${A * n + x}÷${n + 1}＝${A + d}。`],
        [`加入後平均比原來高 ${d} 分`, `${A + d}−${A}＝${d}。`]
      ], [
        [`加入後的平均是 ${(A + x) / 2} 分`, `不能把兩個數直接平均，要用總分÷${n + 1}＝${A + d} 分。`],
        [`加入後的平均仍是 ${A} 分`, `新加入的分數 ${x} 比平均高，平均會變大。`],
        [`加入後的總分是 ${A * (n + 1)} 分`, `新總分是 ${A * n}＋${x}＝${A * n + x}，不是 ${n + 1}×${A}。`],
        [`加入後的平均是 ${x} 分`, `平均不會變成新加入同學的分數。`]
      ]);
    }),
    sp("solve-lower-multi-L5-01", "multi", 5, "extend", kit => {
      const c = chase(kit), D = c.b * c.s;
      return multiQ(kit, `哥哥從家出發，每分鐘走 ${c.b} 公尺。哥哥走了 ${c.s} 分鐘後，弟弟從家出發，每分鐘騎 ${c.a} 公尺去追哥哥。`, [
        [`弟弟出發時，哥哥已走了 ${D} 公尺`, `${c.b}×${c.s}＝${D}。`],
        [`弟弟每分鐘追近哥哥 ${c.a - c.b} 公尺`, `同向追趕用速率差 ${c.a}−${c.b}。`],
        [`弟弟出發後 ${c.t} 分鐘追上哥哥`, `${D}÷${c.a - c.b}＝${c.t}。`],
        [`追上時，兩人離家 ${c.a * c.t} 公尺`, `弟弟騎了 ${c.a}×${c.t}＝${c.a * c.t} 公尺。`]
      ], [
        [`弟弟每分鐘追近哥哥 ${c.a + c.b} 公尺`, "同向追趕要相減，不是相加。"],
        [`弟弟出發後 ${c.t + c.s} 分鐘追上哥哥`, `追上要 ${c.t} 分鐘；${c.t + c.s} 把哥哥先走的時間又加了一次。`],
        [`追上時，兩人離家 ${c.b * c.t} 公尺`, `哥哥一共走了 ${c.s + c.t} 分鐘，離家 ${c.a * c.t} 公尺。`],
        [`弟弟出發時，哥哥已走了 ${c.a * c.s} 公尺`, `哥哥的速率是 ${c.b}，先走了 ${D} 公尺。`]
      ]);
    })
  ]);

  ExamBank.register("solve-lower", "tf", [
    sp("solve-lower-tf-L1-01", "tf", 1, "basic", kit => {
      const c = kit.int(6, 12), m = kit.int(34, 42), t = kit.int(2, 9);
      return tfQ(kit,
        [`小華今年 ${c} 歲，媽媽今年 ${m} 歲，${t} 年後媽媽 ${m + t} 歲。`, `正確：${m}＋${t}＝${m + t}（歲）。`],
        [`小華今年 ${c} 歲，媽媽今年 ${m} 歲，${t} 年後媽媽 ${m + 2 * t} 歲。`, `錯誤：媽媽每年長 1 歲，${t} 年後是 ${m}＋${t}＝${m + t} 歲。`]);
    }),
    sp("solve-lower-tf-L2-01", "tf", 2, "basic", kit => {
      const A = kit.int(70, 90);
      return tfQ(kit,
        [`五次考試的平均是 ${A} 分，所以五次的總分是 ${A * 5} 分。`, `正確：總分＝平均×次數＝${A}×5＝${A * 5}。`],
        [`五次考試的平均是 ${A} 分，所以五次的總分是 ${kit.pick([A + 5, A * 4, A * 6])} 分。`, `錯誤：總分＝平均×次數＝${A}×5＝${A * 5}。`]);
    }),
    sp("solve-lower-tf-L3-01", "tf", 3, "trap", kit => {
      const k = kit.pick([2, 3, 4]), b = kit.int(6, 12), a = k * b, t = kit.int(2, 6);
      const r = tfQ(kit,
        [`爸爸今年 ${a} 歲，兒子今年 ${b} 歲，${t} 年後兩人的年齡差仍是 ${a - b} 歲。`, `正確：年齡差永遠不變，${a}−${b}＝${a - b}。`],
        [`爸爸今年 ${a} 歲，兒子今年 ${b} 歲（${k} 倍），${t} 年後爸爸仍是兒子的 ${k} 倍。`, `錯誤：${t} 年後爸爸 ${a + t} 歲、兒子 ${b + t} 歲，倍數已經不是 ${k} 倍。年齡「差」不變，但「倍數」會變。`]);
      r.trapNote = "年齡差不變、倍數會變。不要把今年的倍數關係套用到未來或過去。";
      return r;
    }),
    sp("solve-lower-tf-L4-01", "tf", 4, "trap", kit => {
      let n, A, d, x, t = 0;
      do { n = kit.pick([4, 5, 6, 8]); A = kit.int(70, 88); d = kit.int(1, 4); x = A + (n + 1) * d; t++; } while (x > 100 && t < 500);
      const head = `某班 ${n} 人的平均是 ${A} 分，新來一位同學考了 ${x} 分，全班 ${n + 1} 人的新平均是`;
      const r = tfQ(kit,
        [`${head} ${A + d} 分。`, `正確：(${A}×${n}＋${x})÷${n + 1}＝${A * n + x}÷${n + 1}＝${A + d}。`],
        [`${head} ${(A + x) / 2} 分。`, `錯誤：不能把 ${A} 與 ${x} 直接平均。新平均＝(${A}×${n}＋${x})÷${n + 1}＝${A + d} 分。`]);
      r.trapNote = "原本的平均代表 " + n + " 個人，新的分數只有 1 個人，兩者的「份量」不同，不能直接取中間值。";
      return r;
    }),
    sp("solve-lower-tf-L5-01", "tf", 5, "extend", kit => {
      let x, y; do { x = kit.int(6, 14); y = kit.int(2, 8); } while (x === y);
      const n = x + y, T = 10 * x + 50 * y, bad = kit.pick([x, y + 1, y - 1].filter(v => v > 0 && v !== y));
      const head = `撲滿裡只有 10 元和 50 元的硬幣，共 ${n} 枚，合計 ${T} 元，其中 50 元的硬幣有`;
      return tfQ(kit,
        [`${head} ${y} 枚。`, `正確：假設全是 10 元，共 ${10 * n} 元，差 ${T - 10 * n} 元；每換 1 枚 10 元成 50 元多 40 元，${T - 10 * n}÷40＝${y} 枚。`],
        [`${head} ${bad} 枚。`, `錯誤：假設全是 10 元共 ${10 * n} 元，差 ${T - 10 * n} 元，每換 1 枚多 40 元，50 元硬幣有 ${(T - 10 * n)}÷40＝${y} 枚。`]);
    })
  ]);

  ExamBank.register("solve-lower", "fill", [
    sp("solve-lower-fill-L1-01", "fill", 1, "basic", kit => {
      const c = kit.int(6, 12), m = kit.int(34, 42), t = kit.int(2, 9);
      return { stem: `小華今年 ${c} 歲，媽媽今年 ${m} 歲，${t} 年後媽媽 ____ 歲。`, answer: String(m + t), units: ["歲"],
        explain: `解析：${m}＋${t}＝${m + t}（歲）。` };
    }),
    sp("solve-lower-fill-L2-01", "fill", 2, "basic", kit => {
      const a = kit.int(70, 90);
      return { stem: `小美四次考試的平均是 ${a} 分，她四次的總分是 ____ 分。`, answer: String(a * 4), units: ["分"],
        explain: `解析：總分＝平均×次數＝${a}×4＝${a * 4}（分）。` };
    }),
    sp("solve-lower-fill-L3-01", "fill", 3, "basic", kit => {
      const s = ageSet(kit, 2);
      return { stem: `今年爸爸 ${s.B} 歲，兒子 ${s.C} 歲，____ 年後爸爸的年齡剛好是兒子的 2 倍。`, answer: String(s.t), units: ["年"],
        explain: `解析：年齡差 ${s.B}−${s.C}＝${s.B - s.C} 歲不變。爸爸是兒子 2 倍時，差就等於兒子的年齡，所以兒子那時 ${s.B - s.C} 歲，${s.B - s.C}−${s.C}＝${s.t}（年）。` };
    }),
    sp("solve-lower-fill-L4-01", "fill", 4, "trap", kit => {
      let x, y; do { x = kit.int(6, 14); y = kit.int(2, 8); } while (x === y);
      const n = x + y, T = 10 * x + 50 * y;
      return { stem: `撲滿裡只有 10 元和 50 元的硬幣，共 ${n} 枚，合計 ${T} 元，其中 50 元的硬幣有 ____ 枚。`, answer: String(y), units: ["枚", "個"],
        explain: `解析：假設 ${n} 枚全是 10 元，共 ${10 * n} 元，比實際少 ${T}−${10 * n}＝${T - 10 * n} 元；每把 1 枚 10 元換成 50 元多 40 元，${T - 10 * n}÷40＝${y}（枚）。`,
        trapNote: `不能用總金額 ${T}÷60 或把枚數平分。每種硬幣面額不同，要用「假設全是同一種，再看差多少」來調整。` };
    }),
    sp("solve-lower-fill-L5-01", "fill", 5, "extend", kit => {
      const a = kit.int(70, 85), d = kit.int(1, 3), b = a + d;
      return { stem: `小宇前五次數學測驗的平均是 ${a} 分，第六次至少要考 ____ 分，才能使六次的平均剛好是 ${b} 分。`, answer: String(6 * b - 5 * a), units: ["分"],
        explain: `解析：六次總分要 ${b}×6＝${6 * b}，前五次總分 ${a}×5＝${5 * a}，第六次＝${6 * b}−${5 * a}＝${6 * b - 5 * a}（分）。` };
    })
  ]);

  ExamBank.register("solve-lower", "calc", [
    sp("solve-lower-calc-L1-01", "calc", 1, "basic", kit => {
      const c = kit.int(8, 14), m = c + kit.int(24, 32), t = kit.int(2, 6);
      return { stem: `媽媽今年 ${m} 歲，女兒今年 ${c} 歲，${t} 年前兩人的年齡差是幾歲？`, answer: String(m - c), units: ["歲"],
        explain: `解析：年齡差永遠不變，${m}−${c}＝${m - c}（歲）。` };
    }),
    sp("solve-lower-calc-L2-01", "calc", 2, "basic", kit => {
      const a = dataInt(kit, 3, 60, 100);
      return { stem: `小傑三次的測驗成績分別是 ${a.join("、")} 分，他的平均成績是多少分？`, answer: String(sum(a) / 3), units: ["分"],
        explain: `解析：(${a.join("＋")})÷3＝${sum(a)}÷3＝${sum(a) / 3}（分）。` };
    }),
    sp("solve-lower-calc-L3-01", "calc", 3, "basic", kit => {
      const c = chase(kit);
      return { stem: `哥哥先走了 ${c.s} 分鐘，每分鐘走 ${c.b} 公尺；弟弟接著出發，每分鐘走 ${c.a} 公尺，沿同一條路追哥哥。弟弟出發後幾分鐘追上哥哥？`, answer: String(c.t), units: ["分鐘", "分"],
        explain: `解析：哥哥先走 ${c.b}×${c.s}＝${c.b * c.s} 公尺，每分鐘追近 ${c.a}−${c.b}＝${c.k} 公尺，${c.b * c.s}÷${c.k}＝${c.t}（分鐘）。` };
    }),
    sp("solve-lower-calc-L4-01", "calc", 4, "trap", kit => {
      const s = ageSet(kit, 3), d = s.B - s.C;
      return { stem: `今年爸爸 ${s.B} 歲，兒子 ${s.C} 歲，幾年後爸爸的年齡剛好是兒子的 3 倍？`, answer: String(s.t), units: ["年"],
        explain: `解析：年齡差 ${s.B}−${s.C}＝${d} 歲不變。爸爸是兒子 3 倍時，差＝兒子年齡的 2 倍，兒子那時 ${d}÷2＝${d / 2} 歲，${d / 2}−${s.C}＝${s.t}（年）。`,
        trapNote: `有人直接用 ${s.B}÷3 或 ${d}÷3 算兒子年齡。3 倍時，差是兒子的「3−1＝2 倍」，要除以 2，不是除以 3。` };
    }),
    sp("solve-lower-calc-L5-01", "calc", 5, "extend", kit => {
      const [L, diff] = kit.pick([[200, 20], [200, 40], [200, 25], [300, 20], [300, 25], [300, 50], [400, 25], [400, 40], [400, 50]]);
      const b = kit.int(100, 160), a = b + diff;
      return { stem: `操場跑道一圈 ${L} 公尺。甲、乙兩人從同一地點同時、同方向出發，甲每分鐘跑 ${a} 公尺，乙每分鐘跑 ${b} 公尺。甲第一次追上乙（多跑一圈）需要幾分鐘？`, answer: kit.num(L / diff), units: ["分鐘", "分"],
        explain: `解析：甲每分鐘比乙多跑 ${a}−${b}＝${diff} 公尺，要多跑一圈 ${L} 公尺，時間＝${L}÷${diff}＝${kit.num(L / diff)}（分鐘）。` };
    })
  ]);

  ExamBank.register("solve-lower", "word", [
    sp("solve-lower-word-L2-01", "word", 2, "basic", kit => {
      const a = dataInt(kit, 4, 65, 98);
      return { stem: `小凱前三次英語測驗分別考了 ${a[0]}、${a[1]}、${a[2]} 分，第四次考了 ${a[3]} 分。四次的平均是多少分？`, answer: String(sum(a) / 4), units: ["分"],
        explain: `解析：四次總分＝${a.join("＋")}＝${sum(a)}，平均＝${sum(a)}÷4＝${sum(a) / 4}（分）。` };
    }),
    sp("solve-lower-word-L3-01", "word", 3, "trap", kit => {
      const g = grp(kit);
      return { stem: `全班男生有 ${g.n1} 人，數學平均 ${g.a1} 分；女生有 ${g.n2} 人，數學平均 ${g.a2} 分。全班的數學平均是多少分？`, answer: String(g.T), units: ["分"],
        explain: `解析：全班總分＝${g.n1}×${g.a1}＋${g.n2}×${g.a2}＝${g.tot}，人數 ${g.n1 + g.n2}，平均＝${g.tot}÷${g.n1 + g.n2}＝${g.T}（分）。`,
        trapNote: `把男、女平均直接平均 (${g.a1}＋${g.a2})÷2＝${(g.a1 + g.a2) / 2} 是錯的，因為男女人數不同（${g.n1} 與 ${g.n2}）。要用總分除以總人數。` };
    }),
    sp("solve-lower-word-L3-02", "word", 3, "basic", kit => {
      let k, c0, t, M, C, n = 0;
      do { k = kit.pick([2, 3, 4]); c0 = kit.int(5, 14); t = kit.int(2, 8); M = k * c0 + t; C = c0 + t; n++; } while ((M < 30 || M > 50) && n < 1000);
      return { stem: `今年媽媽 ${M} 歲，女兒 ${C} 歲。幾年前媽媽的年齡是女兒的 ${k} 倍？`, answer: String(t), units: ["年", "年前"],
        explain: `解析：年齡差 ${M}−${C}＝${M - C} 歲不變。媽媽是女兒 ${k} 倍時，差＝女兒年齡的 ${k - 1} 倍，女兒那時 ${(M - C)}÷${k - 1}＝${c0} 歲，${C}−${c0}＝${t}（年前）。` };
    }),
    sp("solve-lower-word-L4-01", "word", 4, "extend", kit => {
      const c = chase(kit);
      return { stem: `姊姊從家出發，每分鐘走 ${c.b} 公尺。姊姊走了 ${c.s} 分鐘後，妹妹騎腳踏車從家出發，每分鐘騎 ${c.a} 公尺去追姊姊。妹妹追上姊姊時，兩人離家多少公尺？`, answer: String(c.a * c.t), units: ["公尺"],
        explain: `解析：姊姊先走 ${c.b}×${c.s}＝${c.b * c.s} 公尺，妹妹每分鐘追近 ${c.a}−${c.b}＝${c.k} 公尺，追上要 ${c.b * c.s}÷${c.k}＝${c.t} 分鐘；追上時離家 ${c.a}×${c.t}＝${c.a * c.t}（公尺）。` };
    }),
    sp("solve-lower-word-L5-01", "word", 5, "extend", kit => {
      let set, t, F, n = 0;
      do { set = kit.pick([[4, 3, 2], [5, 3, 1], [5, 4, 3], [6, 5, 4]]); t = kit.int(2, 10); F = set[0] * set[2] * t; n++; } while ((F < 28 || F > 52) && n < 1000);
      const c = set[2] * t;
      return { stem: `今年爸爸的年齡是兒子的 ${set[0]} 倍，${t} 年後爸爸的年齡變成兒子的 ${set[1]} 倍。爸爸今年幾歲？`, answer: String(F), units: ["歲"],
        explain: `解析：設兒子今年 c 歲，爸爸 ${set[0]}c 歲；${t} 年後 ${set[0]}c＋${t}＝${set[1]}(c＋${t})，整理得 ${set[0] - set[1]}c＝${(set[1] - 1) * t}，c＝${c}，爸爸＝${set[0]}×${c}＝${F}（歲）。（檢驗：${t} 年後爸爸 ${F + t}、兒子 ${c + t}，${F + t}÷${c + t}＝${set[1]} 倍。）` };
    })
  ]);
})();
