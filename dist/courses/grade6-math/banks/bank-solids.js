/* 題庫：solids（角柱與圓柱的體積、表面積、展開圖；圓柱 π 取 3.14）｜題庫工 C */
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
  const PI = 3.14;
  const cm3 = (kit) => x => kit.num(x) + " 立方公分";
  const cm2 = (kit) => x => kit.num(x) + " 平方公分";
  /* 圓柱的 r（≠2）、H（≠r 且 (r−2)(H−2)≠4）組合 */
  function cyl(kit) { return { r: kit.pick([3, 4, 5, 6, 7, 8]), H: kit.pick([9, 10, 12, 15]) }; }

  ExamBank.register("solids", "single", [
    sp("solids-single-L1-01", "single", 1, "basic", kit => {
      const A = kit.pick([12, 15, 18, 20, 24, 25, 30]), H = kit.int(4, 12), V = A * H;
      const o = nopts(kit, V, [A + H, V * 2, V / 2, 2 * (A + H), V / 3, A * H + A], cm3(kit));
      return { stem: `一個直立柱體的底面積是 ${A} 平方公分，高是 ${H} 公分，它的體積是多少立方公分？`, options: o.options, answer: 0,
        explain: `解析：柱體體積＝底面積×高＝${A}×${H}＝${V}（立方公分）。` };
    }),
    sp("solids-single-L2-01", "single", 2, "basic", kit => {
      const r = kit.int(3, 10), H = kit.int(4, 12), V = PI * r * r * H;
      const o = nopts(kit, V, [PI * 4 * r * r * H, PI * r * H, PI * r * r * H / 3, 2 * PI * r * H, PI * r * r], cm3(kit));
      return { stem: `一個圓柱的底面半徑是 ${r} 公分，高是 ${H} 公分，體積是多少立方公分？（π 取 3.14）`, options: o.options, answer: 0,
        explain: `解析：底面積＝3.14×${r}×${r}＝${kit.num(PI * r * r)}（平方公分），體積＝底面積×高＝${kit.num(PI * r * r)}×${H}＝${kit.num(V)}（立方公分）。` };
    }),
    sp("solids-single-L3-01", "single", 3, "trap", kit => {
      const r = kit.int(2, 8), H = kit.int(4, 12), B = PI * r * r, lat = 2 * PI * r * H, S = 2 * B + lat, V = B * H;
      const o = nopts(kit, S, [V, lat, 2 * B, B + lat, lat + 2 * PI * r, 2 * PI * r * (r + H) / 2], cm2(kit));
      return { stem: `一個圓柱的底面半徑是 ${r} 公分，高是 ${H} 公分，它的表面積（含上、下兩個底面）是多少平方公分？（π 取 3.14）`, options: o.options, answer: 0,
        explain: `解析：兩個底面積＝2×3.14×${r}×${r}＝${kit.num(2 * B)}；側面積＝底面周長×高＝2×3.14×${r}×${H}＝${kit.num(lat)}；表面積＝${kit.num(2 * B)}＋${kit.num(lat)}＝${kit.num(S)}（平方公分）。`,
        trapNote: `體積（${kit.num(V)} 立方公分）和表面積是不同的量。常見錯誤：把體積當表面積、只算側面積 (${kit.num(lat)})、或只算一個底面 (${kit.num(B + lat)})。表面積＝兩個底面＋側面。` };
    }),
    sp("solids-single-L4-01", "single", 4, "trap", kit => {
      const k = kit.int(1, 3), H = kit.int(5, 12), a = 3 * k, b = 4 * k, c = 5 * k, B = a * b / 2, P = a + b + c, S = 2 * B + P * H, V = B * H;
      const o = nopts(kit, S, [V, B + P * H, 2 * a * b + P * H, 2 * B + (a + b) * H, P * H, B * 2 + P * H + V], cm2(kit));
      return { stem: `直立三角柱的底面是直角三角形，三邊長分別是 ${a}、${b}、${c} 公分，柱高是 ${H} 公分，它的表面積是多少平方公分？`, options: o.options, answer: 0,
        explain: `解析：底面積＝${a}×${b}÷2＝${B}，兩個底面＝${2 * B}；底面周長＝${a}＋${b}＋${c}＝${P}，側面積＝${P}×${H}＝${P * H}；表面積＝${2 * B}＋${P * H}＝${S}（平方公分）。`,
        trapNote: `三個側面都要算（寬分別是 ${a}、${b}、${c}），不能漏掉斜邊那一面；也別忘了三角形面積要 ÷2，且有上、下兩個底面。把體積 ${V} 當成表面積更是錯的。` };
    }),
    sp("solids-single-L5-01", "single", 5, "extend", kit => {
      const a = kit.pick([2, 3]), b = kit.pick([2, 3, 4]), ans = a * a * b;
      const o = nopts(kit, ans, [a * b, a + b, a * a + b, a * b * b, a * a * a, a * a + a * b], x => kit.num(x) + " 倍");
      return { stem: `一個圓柱，如果底面半徑變成原來的 ${a} 倍，高變成原來的 ${b} 倍，體積會變成原來的幾倍？`, options: o.options, answer: 0,
        explain: `解析：體積＝3.14×半徑×半徑×高。半徑變 ${a} 倍，半徑²變 ${a}×${a}＝${a * a} 倍；高變 ${b} 倍；體積變 ${a * a}×${b}＝${ans} 倍。` };
    })
  ]);

  ExamBank.register("solids", "multi", [
    sp("solids-multi-L2-01", "multi", 2, "basic", kit => {
      const r = kit.int(3, 9); /* r≠2：r=2 時 2πr 與 πr² 數值相同，真假選項會撞 */
      return multiQ(kit, "關於柱體與圓柱：", [
        ["柱體的體積＝底面積×高", "這是所有直立柱體共同的公式。"],
        ["圓柱的側面展開後是長方形", "長方形的長是底面周長，寬是圓柱的高。"],
        ["圓柱的上、下兩個底面是全等的圓", "兩個底面形狀、大小都相同。"],
        [`半徑 ${r} 公分的圓柱，底面周長是 ${kit.num(2 * PI * r)} 公分`, `2×3.14×${r}＝${kit.num(2 * PI * r)}。`]
      ], [
        ["圓柱的體積＝底面積×高÷3", "÷3 是錐體的公式，柱體不用除以 3。"],
        ["圓柱的側面展開後是三角形", "側面展開是長方形。"],
        ["圓柱的上底面比下底面小", "兩個底面全等。"],
        [`半徑 ${r} 公分的圓柱，底面周長是 ${kit.num(PI * r * r)} 公分`, `${kit.num(PI * r * r)} 是底面積；周長是 2×3.14×${r}＝${kit.num(2 * PI * r)}。`]
      ]);
    }),
    sp("solids-multi-L3-01", "multi", 3, "trap", kit => {
      const c = cyl(kit), r = c.r, H = c.H, B = PI * r * r, lat = 2 * PI * r * H, S = 2 * B + lat, V = B * H;
      const f = kit.num;
      const q = multiQ(kit, `圓柱的底面半徑是 ${r} 公分，高是 ${H} 公分（π 取 3.14）。`, [
        [`一個底面的面積是 ${f(B)} 平方公分`, `3.14×${r}×${r}＝${f(B)}。`],
        [`側面積是 ${f(lat)} 平方公分`, `底面周長×高＝2×3.14×${r}×${H}＝${f(lat)}。`],
        [`表面積是 ${f(S)} 平方公分`, `兩個底面＋側面＝${f(2 * B)}＋${f(lat)}＝${f(S)}。`],
        [`體積是 ${f(V)} 立方公分`, `底面積×高＝${f(B)}×${H}＝${f(V)}。`]
      ], [
        [`體積是 ${f(PI * r * H)} 立方公分`, `漏乘了一次半徑，體積應是 ${f(V)}。`],
        [`側面積是 ${f(V)} 平方公分`, `${f(V)} 是體積；側面積是 ${f(lat)}。`],
        [`表面積是 ${f(lat + B)} 平方公分`, `只算了一個底面，上、下兩個底面都要算，是 ${f(S)}。`],
        [`表面積是 ${f(2 * lat)} 平方公分`, `表面積是兩個底面＋側面＝${f(S)}。`]
      ]);
      q.trapNote = "體積（立方公分）、側面積、表面積（平方公分）是三個不同的量：側面積＝底面周長×高，表面積＝側面積＋兩個底面積，體積＝底面積×高。";
      return q;
    }),
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
      q.trapNote = "n 角柱：面 n+2、邊 3n、頂點 2n。面數與頂點數很容易搞混，可用長方體（n＝4：6 面、12 邊、8 頂點）檢查。";
      return q;
    }),
    sp("solids-multi-L4-01", "multi", 4, "basic", kit => {
      const a = kit.pick([20, 25, 40, 50]), b = kit.pick([20, 25, 40, 50]), h = kit.pick([20, 30, 40, 50]), V = a * b * h, L = V / 1000, f = kit.num;
      return multiQ(kit, `一個長方體水槽，內部長 ${a} 公分、寬 ${b} 公分、高 ${h} 公分。`, [
        [`它的容積是 ${f(V)} 立方公分`, `${a}×${b}×${h}＝${f(V)}。`],
        [`它的容積是 ${f(L)} 公升`, `${f(V)}÷1000＝${f(L)}（1 公升＝1000 立方公分）。`],
        [`底面積是 ${a * b} 平方公分`, `${a}×${b}＝${a * b}。`],
        ["1 公升等於 1000 立方公分", "這是容量與體積的換算關係。"]
      ], [
        [`它的容積是 ${f(L * 10)} 公升`, `${f(V)}÷1000＝${f(L)}，不是 ${f(L * 10)}。`],
        [`它的容積是 ${a + b + h} 立方公分`, "體積要用長×寬×高，不能相加。"],
        [`底面積是 ${a * b * 2} 平方公分`, `底面積是 ${a}×${b}＝${a * b}。`],
        ["1 公升等於 100 立方公分", "1 公升＝1000 立方公分。"]
      ]);
    }),
    sp("solids-multi-L5-01", "multi", 5, "extend", kit => {
      const k = kit.pick([2, 3]);
      return multiQ(kit, `把一個圓柱的尺寸放大（π 取 3.14，比較放大前後）。`, [
        [`半徑變成 ${k} 倍、高不變，體積變成 ${k * k} 倍`, `半徑平方：${k}×${k}＝${k * k} 倍。`],
        [`高變成 ${k} 倍、半徑不變，體積變成 ${k} 倍`, "體積與高成正比。"],
        [`半徑和高都變成 ${k} 倍，體積變成 ${k * k * k} 倍`, `${k * k}×${k}＝${k * k * k} 倍。`],
        [`半徑變成 ${k} 倍，底面周長也變成 ${k} 倍`, "周長＝2×3.14×半徑，和半徑成正比。"],
        [`半徑和高都變成 ${k} 倍，表面積變成 ${k * k} 倍`, "每個面的長、寬都放大 " + k + " 倍，面積放大 " + k * k + " 倍。"]
      ], [
        [`半徑變成 ${k} 倍、高不變，體積變成 ${k} 倍`, `底面積與半徑平方成正比，應是 ${k * k} 倍。`],
        [`半徑和高都變成 ${k} 倍，體積變成 ${k * k} 倍`, `應是 ${k * k * k} 倍。`],
        [`半徑變成 ${k} 倍，底面積也變成 ${k} 倍`, `底面積應變成 ${k * k} 倍。`],
        [`半徑和高都變成 ${k} 倍，表面積變成 ${k * k * k} 倍`, `表面積是面積，放大 ${k * k} 倍。`]
      ]);
    })
  ]);

  ExamBank.register("solids", "tf", [
    sp("solids-tf-L1-01", "tf", 1, "basic", kit => {
      const A = kit.pick([12, 15, 18, 20, 24]), H = kit.int(4, 12);
      return tfQ(kit,
        [`底面積 ${A} 平方公分、高 ${H} 公分的直立柱體，體積是 ${A * H} 立方公分。`, `正確：${A}×${H}＝${A * H}。`],
        [`底面積 ${A} 平方公分、高 ${H} 公分的直立柱體，體積是 ${A + H} 立方公分。`, `錯誤：體積＝底面積×高＝${A}×${H}＝${A * H}，不是相加。`]);
    }),
    sp("solids-tf-L2-01", "tf", 2, "basic", kit => {
      const r = kit.int(3, 10), H = kit.int(4, 12), V = PI * r * r * H, bad = kit.pick([PI * r * H, PI * 4 * r * r * H, V * 2]);
      return tfQ(kit,
        [`圓柱的底面半徑 ${r} 公分、高 ${H} 公分（π 取 3.14），體積是 ${kit.num(V)} 立方公分。`, `正確：3.14×${r}×${r}×${H}＝${kit.num(V)}。`],
        [`圓柱的底面半徑 ${r} 公分、高 ${H} 公分（π 取 3.14），體積是 ${kit.num(bad)} 立方公分。`, `錯誤：體積＝3.14×${r}×${r}×${H}＝${kit.num(V)} 立方公分。`]);
    }),
    sp("solids-tf-L3-01", "tf", 3, "trap", kit => {
      const r = kit.pick([3, 4, 5, 6, 7, 8]), H = kit.int(4, 12), lat = 2 * PI * r * H, V = PI * r * r * H;
      const q = tfQ(kit,
        [`圓柱的底面半徑 ${r} 公分、高 ${H} 公分（π 取 3.14），側面積是 ${kit.num(lat)} 平方公分。`, `正確：側面積＝底面周長×高＝2×3.14×${r}×${H}＝${kit.num(lat)}。`],
        [`圓柱的底面半徑 ${r} 公分、高 ${H} 公分（π 取 3.14），側面積是 ${kit.num(V)} 平方公分。`, `錯誤：${kit.num(V)} 是體積（底面積×高）；側面積＝底面周長×高＝${kit.num(lat)} 平方公分。`]);
      q.trapNote = "側面積＝底面「周長」×高；體積＝底面「面積」×高。周長與面積、平方公分與立方公分都要分清楚。";
      return q;
    }),
    sp("solids-tf-L4-01", "tf", 4, "trap", kit => {
      const b = kit.pick([6, 8, 10, 12]), h = kit.pick([4, 5, 6, 8]), H = kit.int(5, 12), V = b * h * H / 2;
      const q = tfQ(kit,
        [`直立三角柱的底面三角形底 ${b} 公分、高 ${h} 公分，柱高 ${H} 公分，體積是 ${V} 立方公分。`, `正確：底面積＝${b}×${h}÷2＝${b * h / 2}，體積＝${b * h / 2}×${H}＝${V}。`],
        [`直立三角柱的底面三角形底 ${b} 公分、高 ${h} 公分，柱高 ${H} 公分，體積是 ${b * h * H} 立方公分。`, `錯誤：三角形底面積要 ÷2，體積＝${b}×${h}÷2×${H}＝${V} 立方公分，${b * h * H} 漏除了 2。`]);
      q.trapNote = "三角柱的底面積是三角形面積（底×高÷2）；如果直接把底、高、柱高三個數相乘，會漏掉 ÷2 而多算一倍。注意三角形的「高」與柱子的「高」是不同的兩個量。";
      return q;
    }),
    sp("solids-tf-L5-01", "tf", 5, "extend", kit => {
      const same = kit.int(0, 1) === 1;
      const [k, m] = same ? kit.pick([[2, 4], [3, 9]]) : kit.pick([[2, 2], [2, 3], [3, 3], [3, 6], [2, 8]]);
      const ok = k * k === m;
      return { stem: `判斷下列敘述是否正確：\n圓柱的底面半徑變成原來的 ${k} 倍，同時高變成原來的 ${m} 分之 1，體積和原來一樣大。`, answer: ok,
        explain: `解析：半徑變 ${k} 倍，底面積變 ${k * k} 倍；高變 1/${m}；體積變成 ${k * k}×(1/${m})＝${k * k}/${m} 倍，${ok ? "剛好是 1 倍，體積不變，所以正確" : "不等於 1 倍，體積會改變，所以錯誤"}。` };
    })
  ]);

  ExamBank.register("solids", "fill", [
    sp("solids-fill-L1-01", "fill", 1, "basic", kit => {
      const a = kit.int(3, 10), b = kit.int(3, 10), c = kit.int(2, 9);
      return { stem: `長方體的長 ${a} 公分、寬 ${b} 公分、高 ${c} 公分，體積是 ____ 立方公分。`, answer: String(a * b * c), units: ["立方公分", "cm³", "cm3"],
        explain: `解析：${a}×${b}×${c}＝${a * b * c}（立方公分）。` };
    }),
    sp("solids-fill-L2-01", "fill", 2, "basic", kit => {
      const b = kit.pick([6, 8, 10, 12]), h = kit.pick([4, 5, 6, 8]), H = kit.int(5, 12);
      return { stem: `直立三角柱的底面三角形底 ${b} 公分、高 ${h} 公分，柱高 ${H} 公分，體積是 ____ 立方公分。`, answer: String(b * h * H / 2), units: ["立方公分", "cm³"],
        explain: `解析：底面積＝${b}×${h}÷2＝${b * h / 2}，體積＝${b * h / 2}×${H}＝${b * h * H / 2}（立方公分）。` };
    }),
    sp("solids-fill-L3-01", "fill", 3, "basic", kit => {
      const r = kit.int(2, 10), H = kit.int(3, 12);
      return { stem: `圓柱的底面半徑是 ${r} 公分，高是 ${H} 公分，體積是 ____ 立方公分。（π 取 3.14）`, answer: kit.num(PI * r * r * H), units: ["立方公分", "cm³"],
        explain: `解析：3.14×${r}×${r}×${H}＝${kit.num(PI * r * r * H)}（立方公分）。` };
    }),
    sp("solids-fill-L4-01", "fill", 4, "trap", kit => {
      const d = kit.pick([4, 6, 8, 10, 12]), H = kit.int(3, 12), r = d / 2;
      return { stem: `圓柱的底面「直徑」是 ${d} 公分，高是 ${H} 公分，體積是 ____ 立方公分。（π 取 3.14）`, answer: kit.num(PI * r * r * H), units: ["立方公分", "cm³"],
        explain: `解析：半徑＝${d}÷2＝${r} 公分，體積＝3.14×${r}×${r}×${H}＝${kit.num(PI * r * r * H)}（立方公分）。`,
        trapNote: `題目給的是直徑 ${d}，公式要用半徑。若直接把 ${d} 當半徑代入，算出 ${kit.num(PI * d * d * H)}，會多 4 倍。` };
    }),
    sp("solids-fill-L5-01", "fill", 5, "extend", kit => {
      const r = kit.pick([3, 4, 5, 6, 10]), H = kit.int(3, 15), V = PI * r * r * H;
      return { stem: `一個圓柱的體積是 ${kit.num(V)} 立方公分，底面半徑是 ${r} 公分，它的高是 ____ 公分。（π 取 3.14）`, answer: String(H), units: ["公分", "cm"],
        explain: `解析：底面積＝3.14×${r}×${r}＝${kit.num(PI * r * r)}，高＝體積÷底面積＝${kit.num(V)}÷${kit.num(PI * r * r)}＝${H}（公分）。` };
    })
  ]);

  ExamBank.register("solids", "calc", [
    sp("solids-calc-L1-01", "calc", 1, "basic", kit => {
      const r = kit.int(2, 10);
      return { stem: `圓柱的底面半徑是 ${r} 公分，它的底面積是多少平方公分？（π 取 3.14）`, answer: kit.num(PI * r * r), units: ["平方公分", "cm²"],
        explain: `解析：底面積＝3.14×${r}×${r}＝${kit.num(PI * r * r)}（平方公分）。` };
    }),
    sp("solids-calc-L2-01", "calc", 2, "basic", kit => {
      const r = kit.int(2, 9), H = kit.int(3, 12), lat = 2 * PI * r * H;
      return { stem: `圓柱的底面半徑是 ${r} 公分，高是 ${H} 公分，它的側面積是多少平方公分？（π 取 3.14）`, answer: kit.num(lat), units: ["平方公分", "cm²"],
        explain: `解析：底面周長＝2×3.14×${r}＝${kit.num(2 * PI * r)}，側面積＝周長×高＝${kit.num(2 * PI * r)}×${H}＝${kit.num(lat)}（平方公分）。` };
    }),
    sp("solids-calc-L3-01", "calc", 3, "basic", kit => {
      const r = kit.int(2, 8), H = kit.int(3, 12), S = 2 * PI * r * r + 2 * PI * r * H;
      return { stem: `圓柱的底面半徑是 ${r} 公分，高是 ${H} 公分，它的表面積（含上、下底面）是多少平方公分？（π 取 3.14）`, answer: kit.num(S), units: ["平方公分", "cm²"],
        explain: `解析：兩個底面＝2×3.14×${r}×${r}＝${kit.num(2 * PI * r * r)}，側面＝2×3.14×${r}×${H}＝${kit.num(2 * PI * r * H)}，合計 ${kit.num(S)}（平方公分）。` };
    }),
    sp("solids-calc-L4-01", "calc", 4, "trap", kit => {
      const A = kit.pick([250, 400, 500, 600, 800, 1000]), H = kit.pick([20, 25, 30, 40, 50]), V = A * H;
      return { stem: `一個柱形水箱的底面積是 ${A} 平方公分，高是 ${H} 公分，裝滿水可以裝幾公升的水？（1 公升＝1000 立方公分）`, answer: kit.num(V / 1000), units: ["公升", "L", "l"],
        explain: `解析：容積＝${A}×${H}＝${V} 立方公分，${V}÷1000＝${kit.num(V / 1000)}（公升）。`,
        trapNote: `算出 ${V} 是「立方公分」，不是公升。1 公升＝1000 立方公分，一定要再 ÷1000 才是公升。` };
    }),
    sp("solids-calc-L5-01", "calc", 5, "extend", kit => {
      const R = kit.int(6, 10), r = kit.int(2, R - 3), H = kit.int(4, 12), V = PI * (R * R - r * r) * H;
      return { stem: `一根空心圓柱形鋼管，外圍半徑 ${R} 公分，中空部分的半徑 ${r} 公分，長 ${H} 公分。鋼管本身（不含中空）的體積是多少立方公分？（π 取 3.14）`, answer: kit.num(V), units: ["立方公分", "cm³"],
        explain: `解析：大圓柱 3.14×${R}×${R}×${H}＝${kit.num(PI * R * R * H)}，中空小圓柱 3.14×${r}×${r}×${H}＝${kit.num(PI * r * r * H)}，相減＝${kit.num(V)}（立方公分）。` };
    })
  ]);

  ExamBank.register("solids", "word", [
    sp("solids-word-L2-01", "word", 2, "basic", kit => {
      const a = kit.pick([20, 25, 40, 50]), b = kit.pick([20, 25, 40, 50]), h = kit.pick([20, 30, 40, 50]), L = a * b * h / 1000;
      return { stem: `一個長方體魚缸，內部長 ${a} 公分、寬 ${b} 公分、高 ${h} 公分。裝滿水可以裝幾公升？（1 公升＝1000 立方公分）`, answer: kit.num(L), units: ["公升", "L"],
        explain: `解析：容積＝${a}×${b}×${h}＝${a * b * h} 立方公分，${a * b * h}÷1000＝${kit.num(L)}（公升）。` };
    }),
    sp("solids-word-L3-01", "word", 3, "trap", kit => {
      const r = kit.int(3, 10), H = kit.int(10, 30), S = PI * r * r + 2 * PI * r * H;
      return { stem: `一個無蓋的圓柱形鐵桶，底面半徑 ${r} 公分、高 ${H} 公分。要在桶子的外面（含桶底、不含上蓋）漆上油漆，需要漆多少平方公分？（π 取 3.14）`, answer: kit.num(S), units: ["平方公分", "cm²"],
        explain: `解析：只有一個底面：3.14×${r}×${r}＝${kit.num(PI * r * r)}；側面：2×3.14×${r}×${H}＝${kit.num(2 * PI * r * H)}；合計 ${kit.num(S)}（平方公分）。`,
        trapNote: `題目說「無蓋」，所以只有一個底面。若照表面積公式算兩個底面，會多算一個圓 (${kit.num(PI * r * r)})，得到 ${kit.num(S + PI * r * r)}。` };
    }),
    sp("solids-word-L3-02", "word", 3, "basic", kit => {
      const r = kit.pick([5, 10]), H = kit.pick([20, 40, 50]), V = PI * r * r * H;
      return { stem: `一個圓柱形水桶，底面半徑 ${r} 公分、高 ${H} 公分，裝滿水可以裝幾公升？（π 取 3.14，1 公升＝1000 立方公分）`, answer: kit.num(V / 1000), units: ["公升", "L"],
        explain: `解析：容積＝3.14×${r}×${r}×${H}＝${kit.num(V)} 立方公分，${kit.num(V)}÷1000＝${kit.num(V / 1000)}（公升）。` };
    }),
    sp("solids-word-L4-01", "word", 4, "extend", kit => {
      const r = kit.pick([5, 10, 20]), h1 = kit.int(8, 20), d = kit.int(2, 6), V = PI * r * r * d;
      return { stem: `圓柱形水桶的底面半徑是 ${r} 公分，裡面原有 ${h1} 公分深的水。把一塊石頭完全放入水中後（水沒有溢出），水深變成 ${h1 + d} 公分。這塊石頭的體積是多少立方公分？（π 取 3.14）`, answer: kit.num(V), units: ["立方公分", "cm³"],
        explain: `解析：水位上升 ${h1 + d}−${h1}＝${d} 公分，石頭體積＝上升的那一段水的體積＝3.14×${r}×${r}×${d}＝${kit.num(V)}（立方公分）。` };
    }),
    sp("solids-word-L5-01", "word", 5, "extend", kit => {
      let r, H, n, ab, a, b, ans, t = 0;
      do {
        r = kit.pick([5, 10]); H = kit.pick([10, 20]); n = kit.int(3, 8);
        [a, b] = kit.pick([[10, 10], [20, 10], [25, 10], [20, 20], [25, 20], [50, 20]]); ab = a * b;
        ans = PI * r * r * H * n / ab; t++;
      } while ((Math.abs(Number(ans.toFixed(4)) - ans) > 1e-9) && t < 500);
      return { stem: `圓柱形杯子的底面半徑 ${r} 公分、高 ${H} 公分，用它裝滿水後，倒進一個空的長方體水槽（內底長 ${a} 公分、寬 ${b} 公分），共倒了 ${n} 杯。水槽裡的水深是多少公分？（π 取 3.14，水不溢出）`, answer: kit.num(ans), units: ["公分", "cm"],
        explain: `解析：一杯水＝3.14×${r}×${r}×${H}＝${kit.num(PI * r * r * H)} 立方公分，${n} 杯＝${kit.num(PI * r * r * H * n)}；水槽底面積＝${a}×${b}＝${ab}；水深＝${kit.num(PI * r * r * H * n)}÷${ab}＝${kit.num(ans)}（公分）。` };
    })
  ]);
})();
