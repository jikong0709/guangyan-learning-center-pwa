/* 引擎單元測試：node verify-engine.js
   使用內建「假題庫」（14 個 topic）測組卷／配分／排序／比例／均衡／批改，不依賴真題庫。 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

globalThis.window = globalThis;
const root = path.join(__dirname, "..", "..");
function load(rel) { const f = path.join(root, rel); vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
load("exam-engine/kit.js");
load("exam-engine/engine.js");
load("courses/grade6-math/config.js");

const cfg = globalThis.ExamConfig;
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name + (detail ? "  -> " + detail : "")); }
}
const origWarn = console.warn; let warnCount = 0;
console.warn = function () { warnCount++; };

/* ---------- 假題庫 ---------- */
const bank = ExamEngine.createBank();
const TAGS = ["basic", "basic", "trap", "basic", "extend"]; // 依 level 1..5
function makeSpec(topic, type, i) {
  const level = (i % 5) + 1;
  const tag = i < 5 ? TAGS[i] : (i % 3 === 0 ? "trap" : (i % 3 === 1 ? "extend" : "basic"));
  const id = topic + "-" + type + "-" + i;
  return {
    id, type, level, tag,
    gen(kit) {
      const n = kit.int(2, 9);
      const base = { stem: id + " 題幹 n=" + n, explain: "解析：" + n + "×2=" + (n * 2), trapNote: tag === "trap" ? "易錯：忘記乘 2" : undefined };
      if (i % 4 !== 3) base.explain2 = "解法二：換個角度 " + n + "+" + n + "=" + (n * 2); /* i%4==3 的 spec 刻意缺 explain2 */
      if (type === "single") {
        const ch = kit.choices(String(n * 2), [String(n * 2 + 1), String(n * 2 + 2), String(n * 2 + 3)]);
        return Object.assign(base, ch);
      }
      if (type === "multi") return Object.assign(base, { options: ["甲" + n, "乙" + n, "丙" + n, "丁" + n, "戊" + n], answer: [0, 2] });
      if (type === "tf") return Object.assign(base, { answer: n % 2 === 0 });
      return Object.assign(base, { answer: String(n * 2), accepted: [n * 2 + ".0"], units: ["公分"] });
    }
  };
}
cfg.allTopics.forEach(t => {
  ["single", "multi", "tf", "fill", "calc", "word"].forEach(type => {
    const specs = []; for (let i = 0; i < 8; i++) specs.push(makeSpec(t, type, i));
    bank.register(t, "fake", specs);
  });
});
const engine = ExamEngine.create(cfg, bank);
const unitsOf = ver => cfg.versions[ver].units;

/* ---------- 0. 設定結構 ---------- */
check("config: 三版本單元數 14/15/14", unitsOf("hanlin").length === 14 && unitsOf("kanghsuan").length === 15 && unitsOf("nani").length === 14);
check("config: 每單元 1~3 個合法 topic", ["hanlin", "kanghsuan", "nani"].every(v => unitsOf(v).every(u => u.topics.length >= 1 && u.topics.length <= 3 && u.topics.every(t => cfg.allTopics.indexOf(t) >= 0))));
check("config: 14 個 topic 都被至少一個版本使用", cfg.allTopics.every(t => ["hanlin", "kanghsuan", "nani"].some(v => unitsOf(v).some(u => u.topics.indexOf(t) >= 0))));
const curSrc = fs.readFileSync(path.join(__dirname, "curriculum.js"), "utf8");
check("config: unitId 與 curriculum.js 單元數相符", /unit\("六上", 8,/.test(curSrc) && unitsOf("hanlin").filter(u => u.semester === "六上").length === 8);

/* ---------- 1. 一百分卷 ---------- */
const ALL = cfg.types.map(t => t.key);
function pickUnits(ver, n) { return require("crypto") && unitsOf(ver).slice().sort(() => Math.random() - 0.5).slice(0, n); }
let okCount = true, okSum = true, okSec = true, okAsc = true, okWord = true, okUniq = true, okTE = true, okBal = true, okFields = true, okAnsw = true;
let detail = "";
const secExpect = { tf: [5, 10], single: [7, 14], multi: [2, 6], fill: [12, 24], calc: [3, 18], word: [4, 28] };
const secEach = { tf: 2, single: 2, multi: 3, fill: 2, calc: 6, word: 7 };
for (let r = 0; r < 60; r++) {
  const ver = ["hanlin", "kanghsuan", "nani"][r % 3];
  const units = pickUnits(ver, 2 + (r % 5));
  const ex = engine.buildExam({ mode: "score", units, types: ALL });
  if (ex.items.length !== 33) { okCount = false; detail = "題數 " + ex.items.length; }
  if (ex.total !== 100 || ex.items.reduce((a, i) => a + i.points, 0) !== 100) okSum = false;
  ex.sections.forEach(s => { const e = secExpect[s.type]; if (s.count !== e[0] || s.each !== secEach[s.type] || s.items.some(i => i.points !== secEach[s.type]) || s.points !== e[1] || s.items.reduce((a, i) => a + i.points, 0) !== e[1]) okSec = false; });
  ex.sections.forEach(s => { for (let i = 1; i < s.items.length; i++) if (s.items[i].level < s.items[i - 1].level) okAsc = false; });
  if (ex.sections.map(s => s.type).join() !== "tf,single,multi,fill,calc,word") okWord = false;
  { const tpp = engine.topicsOfUnits(units).topics; ex.sections.forEach(sc => { const pool = engine.buildPools(tpp, [sc.type], 1, 5)[sc.type].length; const ids = sc.items.map(i => i.specId); if (sc.count <= pool && new Set(ids).size !== ids.length) okUniq = false; }); }
  const trap = ex.items.filter(i => i.tag === "trap").length, ext = ex.items.filter(i => i.tag === "extend").length;
  if (trap < 2 || ext < 2 || trap > 10 || ext > 10) { okTE = false; detail = "trap=" + trap + " ext=" + ext; }
  const tp = engine.topicsOfUnits(units).topics, cnt = {}; tp.forEach(t => { cnt[t] = 0; }); ex.items.forEach(i => { cnt[i.topic]++; });
  const vals = tp.map(t => cnt[t]); if (Math.max.apply(null, vals) - Math.min.apply(null, vals) > 1) { okBal = false; detail = JSON.stringify(cnt); }
  ex.items.forEach((it, idx) => { if (it.no !== idx + 1 || !it.stem || !it.explain || !it.unitIds.length) okFields = false; if (it.tag === "trap" && !it.trapNote) okFields = false; });
  ex.items.forEach(it => { if (it.type === "single" && !(it.options[it.answer] && /^\d+$/.test(it.options[it.answer]) && String(Number(it.stem.match(/n=(\d+)/)[1]) * 2) === it.options[it.answer])) okAnsw = false; });
}
check("100分卷: 六型全選=標準段考版型共 33 題 (是非5/單選7/複選2/填充12/計算3/應用4)", okCount, detail);
check("100分卷: 總分剛好 100", okSum);
check("100分卷: 各大題題數×每題＝5×2,7×2,2×3,12×2,3×6,4×7 (10/14/6/24/18/28)", okSec);
check("100分卷: 大題內由簡入深 (level 升冪)", okAsc);
check("100分卷: 大題順序 是非→單選→複選→填充→計算→應用", okWord);
check("100分卷: 同卷 spec 不重複", okUniq);
check("100分卷: trap 與 extend 各 >=2 且約 20%", okTE, detail);
check("100分卷: 多單元 topic 題數差距 <=1", okBal, detail);
check("100分卷: 題號連續、解析/易錯點齊全、unitIds 非空", okFields);
check("洗牌後單選答案索引仍指向正解文字", okAnsw);

/* 子集題型配分 */
{
  let ok = true, d = "";
  [["single", "word"], ["multi"], ["tf", "fill", "calc"], ["word"]].forEach(sub => {
    for (let r = 0; r < 10; r++) {
      const ex = engine.buildExam({ mode: "score", units: pickUnits("hanlin", 3), types: sub });
      const tot = ex.items.reduce((a, i) => a + i.points, 0);
      if (tot !== 100 || ex.total !== 100) { ok = false; d = sub.join() + " total=" + tot; }
      if (ex.sections.some(s => s.count < 2)) { ok = false; d = sub.join() + " 題數<2"; }
      if (ex.sections.map(s => s.type).join() !== ALL.filter(k => sub.indexOf(k) >= 0).join()) { ok = false; d = "順序 " + ex.sections.map(s => s.type).join(); }
    }
  });
  check("子集題型: 等比例配分且總分剛好 100、每型>=2 題", ok, d);
}

/* 題型子集 × 兩種模式：嚴格只出已勾選題型 */
{
  let ok = true, d = "", combos = 0;
  const subsets = [["single"], ["multi"], ["tf"], ["fill"], ["calc"], ["word"], ["single", "multi"], ["tf", "word"], ["fill", "calc", "word"], ["multi", "tf", "calc"], ALL];
  subsets.forEach(sub => ["score", "practice"].forEach(mode => {
    for (let r = 0; r < 8; r++) {
      combos++;
      const ex = engine.buildExam({ mode, units: pickUnits("nani", 1 + (r % 4)), types: sub });
      const tot = ex.items.reduce((a, i) => a + i.points, 0);
      if (!ex.items.every(i => sub.indexOf(i.type) >= 0)) { ok = false; d = mode + " " + sub.join() + " 出現未勾選題型"; }
      if (ex.total !== 100 || tot !== 100) { ok = false; d = mode + " " + sub.join() + " 總分=" + tot; }
      if (mode === "practice") {
        if (ex.items.length !== 20) { ok = false; d = sub.join() + " 題數=" + ex.items.length; }
        const c = {}; ex.items.forEach(i => { c[i.type] = (c[i.type] || 0) + 1; });
        const v = sub.map(t => c[t] || 0);
        if (Math.max.apply(null, v) - Math.min.apply(null, v) > 1) { ok = false; d = sub.join() + " 分配 " + JSON.stringify(c); }
      }
    }
  }));
  check("題型子集(單一/兩型/三型/全選)×兩模式: 題型必屬子集、總分100、20題模式恰20題且平均 (" + combos + " 組)", ok, d);
}

/* 第 13 節：四檔難度 × 一百分卷；二十題不受難度影響 */
{
  check("config.levelRanges 四檔且範圍正確", cfg.levelRanges.length === 4 && ["easy:1-2", "mid:2-4", "hard:3-5", "all:1-5"].every(x => cfg.levelRanges.some(l => l.key + ":" + l.min + "-" + l.max === x)));
  const subsets = [ALL, ["single", "word"], ["tf"]];
  cfg.levelRanges.forEach(lv => {
    let ok = true, d = "", sumT = 0, sumE = 0, n = 0;
    subsets.forEach(sub => {
      for (let r = 0; r < 20; r++) {
        let ex; const units = pickUnits("hanlin", 1 + (r % 4));
        try { ex = engine.buildExam({ mode: "score", units, types: sub, levelMin: lv.min, levelMax: lv.max, mix: lv.mix }); }
        catch (e) { ok = false; d = lv.key + " 丟錯 " + e.message; continue; }
        const tot = ex.items.reduce((a, i) => a + i.points, 0);
        if (!ex.items.every(i => i.level >= lv.min && i.level <= lv.max)) { ok = false; d = lv.key + " level 超出範圍"; }
        if (!ex.items.every(i => sub.indexOf(i.type) >= 0)) { ok = false; d = lv.key + " 題型越界"; }
        if (tot !== 100 || ex.total !== 100) { ok = false; d = lv.key + " 總分 " + tot; }
        ex.sections.forEach(sc => { for (let i = 1; i < sc.items.length; i++) if (sc.items[i].level < sc.items[i - 1].level) { ok = false; d = lv.key + " 未由簡入深"; } });
        { const tp = engine.topicsOfUnits(units).topics; ex.sections.forEach(sc => { const pool = engine.buildPools(tp, [sc.type], lv.min, lv.max)[sc.type].length; const ids = sc.items.map(i => i.specId); if (sc.count <= pool && new Set(ids).size !== ids.length) { ok = false; d = lv.key + " " + sc.type + " spec 重複(池 " + pool + ")"; } }); }
        const t = ex.items.filter(i => i.tag === "trap").length, e = ex.items.filter(i => i.tag === "extend").length;
        if (sub === ALL) { sumT += t; sumE += e; n++; if (lv.key === "easy" && e !== 0) { ok = false; d = "簡單檔不應強求延伸 e=" + e; } if (lv.key !== "easy" && e < 2) { ok = false; d = lv.key + " 延伸<2 e=" + e; } if (t < 2) { ok = false; d = lv.key + " 易錯<2"; } }
      }
    });
    check("一百分卷難度檔 " + lv.key + "(" + lv.min + "~" + lv.max + "): level 在範圍、題型屬勾選、總分100、由簡入深、無重複、trap/extend 配額 (平均 trap=" + (sumT / n).toFixed(1) + " extend=" + (sumE / n).toFixed(1) + ")", ok, d);
  });
  let okP = true, dP = "";
  cfg.levelRanges.forEach(lv => [ALL, ["single", "fill"], ["word"]].forEach(sub => {
    const ex = engine.buildExam({ mode: "practice", units: pickUnits("nani", 2), types: sub, levelMin: lv.min, levelMax: lv.max, mix: lv.mix });
    const lvs = new Set(ex.items.map(i => i.level));
    if (lvs.size !== 5) { okP = false; dP = lv.key + " 涵蓋 level " + Array.from(lvs).join(); }
    for (let i = 1; i < ex.items.length; i++) if (ex.items[i].level < ex.items[i - 1].level) { okP = false; dP = "未由簡入深"; }
    if (ex.items.length !== 20 || !ex.items.every(i => sub.indexOf(i.type) >= 0)) { okP = false; dP = "題數/題型"; }
  }));
  check("二十題模式: 不論難度設定 level 皆涵蓋 1~5、由簡入深、只出勾選題型、20 題", okP, dP);
  const avgLv = key => { const lv = cfg.levelRanges.find(l => l.key === key); let a = 0; for (let r = 0; r < 20; r++) { const ex = engine.buildExam({ mode: "score", units: pickUnits("hanlin", 3), types: ALL, levelMin: lv.min, levelMax: lv.max, mix: lv.mix }); a += ex.items.reduce((x, i) => x + i.level, 0) / ex.items.length; } return a / 20; };
  const ae = avgLv("easy"), ah = avgLv("hard");
  check("難度分布: 簡單檔平均 level < 困難檔 (" + ae.toFixed(2) + " < " + ah.toFixed(2) + ")", ae < ah);
}

/* 第 15 節：段考版型 */
{
  const subsets = [["tf"], ["single"], ["multi"], ["fill"], ["calc"], ["word"], ["single", "calc"], ["tf", "word"], ["multi", "fill"], ["tf", "single"], ["single", "multi"], ["calc", "word"],
    ["tf", "single", "fill"], ["single", "multi", "calc"], ["fill", "calc", "word"], ["tf", "multi", "word"], ["tf", "single", "fill", "calc"], ["single", "multi", "fill", "word"], ["tf", "single", "multi", "calc"], ["tf", "single", "fill", "calc", "word"], ALL];
  const names = { tf: "是非題", single: "單選題", multi: "複選題（全對才給分）", fill: "填充題", calc: "計算題", word: "應用題" };
  const infeasible = k => k.length === 1 && (k[0] === "tf" || k[0] === "multi");
  let ok = true, d = "", n = 0, relaxedSeen = [];
  subsets.forEach(sub => cfg.levelRanges.forEach(lv => {
    n++;
    const ex = engine.buildExam({ mode: "score", units: pickUnits("hanlin", 3), types: sub, levelMin: lv.min, levelMax: lv.max, mix: lv.mix });
    const want = ALL.filter(k => sub.indexOf(k) >= 0);
    const tot = ex.items.reduce((a, i) => a + i.points, 0);
    if (ex.sections.map(x => x.type).join() !== want.join()) { ok = false; d = sub + " 大題順序 " + ex.sections.map(x => x.type); }
    if (tot !== 100 || ex.total !== 100) { ok = false; d = sub + " 總分 " + tot; }
    if (!ex.items.every(i => sub.indexOf(i.type) >= 0 && i.level >= lv.min && i.level <= lv.max)) { ok = false; d = sub + " 題型/level 越界"; }
    if (!ex.items.every((i, k) => i.no === k + 1)) { ok = false; d = sub + " 題號不連續"; }
    ex.sections.forEach(sc => {
      const t = cfg.types.find(x => x.key === sc.type);
      const uniform = sc.items.every(i => i.points === sc.items[0].points && Number.isInteger(i.points));
      if (!uniform) { ok = false; d = sub + " " + sc.type + " 大題內配分不一致"; }
      if (sc.name !== names[sc.type] || !sc.intro) { ok = false; d = sub + " 大題名稱/說明句"; }
      const p = sc.items[0].points, c = sc.items.length;
      if (infeasible(sub)) { relaxedSeen.push(sub[0]); return; }
      if (p < t.minPts || p > t.maxPts || c < t.minCount || c > t.maxCount) { ok = false; d = sub + " " + sc.type + " 超出硬限制 c=" + c + " p=" + p; }
    });
    if (sub.length === ALL.length) { /* 全選＝標準版型，由前面的測試驗證 */ }
  }));
  check("段考版型: 21 組題型子集(單/兩/三/四/五/六型,含複選)×四檔難度=" + n + " 組: 大題內每題配分相同且整數、在硬限制範圍、總分100、題型屬勾選、大題順序、題號連續、有大題說明句", ok, d);
  const ex2 = engine.buildExam({ mode: "score", units: pickUnits("hanlin", 2), types: ["single", "calc"] });
  check("只勾單選＋計算: " + ex2.sections.map(x => x.name + x.count + "題×" + x.items[0].points).join("、"), ex2.total === 100);
  const noMulti = engine.buildExam({ mode: "score", units: pickUnits("hanlin", 2), types: ["tf", "single", "fill", "calc", "word"] });
  check("未勾複選: 單選回到標準 10×2、整份 5/10/12/3/4 題 100 分", noMulti.sections.map(x => x.count + "x" + x.each).join() === "5x2,10x2,12x2,3x6,4x7");
  check("無解子集(是非單型/複選單型)放寬範圍後仍總分100且整數 (已放寬: " + relaxedSeen.join(",") + ")", relaxedSeen.length > 0);
  const m = engine.buildExam({ mode: "practice", units: pickUnits("hanlin", 2), types: ALL });
  check("二十題模式不受影響: 20 題×5 分、單一大題無名稱", m.items.length === 20 && m.items.every(i => i.points === 5) && m.sections.length === 1 && m.sections[0].type === null);
  const sm = engine.summarize(ex2, {});
  check("結果統計含各大題得分 bySection (名稱/得分/滿分)", sm.bySection.length === 2 && sm.bySection.reduce((a, x) => a + x.max, 0) === 100);
}

/* 第 16 節：explain2 傳遞與答案卷正解顯示 */
{
  let okPass = true, okMissing = 0, okShow = true, d = "", cnt = { single: 0, multi: 0, tf: 0, text: 0 };
  for (let r = 0; r < 30; r++) {
    const ex = engine.buildExam({ mode: r % 2 ? "score" : "practice", units: pickUnits("hanlin", 3), types: ALL });
    ex.items.forEach(it => {
      const n = Number(it.stem.match(/n=([0-9]+)/)[1]);
      const idx = Number(it.specId.split("-").pop());
      if (idx % 4 === 3) { if (it.explain2 !== undefined) { okPass = false; d = "缺 explain2 的題不應有欄位"; } else okMissing++; }
      else if (it.explain2 !== "解法二：換個角度 " + n + "+" + n + "=" + (n * 2)) { okPass = false; d = it.specId + " explain2 不一致: " + it.explain2; }
      const a = engine.describeAnswer(it);
      if (it.type === "single") { cnt.single++; if (a !== "ABCD"[it.answer] + ". " + n * 2 || it.options[it.answer] !== String(n * 2)) { okShow = false; d = "單選正解顯示 " + a; } }
      else if (it.type === "multi") { cnt.multi++; const want = ["甲" + n, "丙" + n], bad = ["乙" + n, "丁" + n, "戊" + n]; if (!want.every(w => a.includes(w)) || bad.some(w => a.includes(w)) || it.answer.length !== 2) { okShow = false; d = "複選正解顯示 " + a; } }
      else if (it.type === "tf") { cnt.tf++; if (a !== (n % 2 === 0 ? cfg.labels.yes : cfg.labels.no) || !/[○✕]/.test(a)) { okShow = false; d = "是非正解顯示 " + a; } }
      else { cnt.text++; if (a !== String(n * 2)) { okShow = false; d = "填空正解顯示 " + a; } }
    });
  }
  check("explain2 原樣傳遞到考卷題目 (有 explain2 的題相同、缺的題不帶欄位且不報錯, 缺 " + okMissing + " 題)", okPass && okMissing > 0, d);
  check("洗牌後答案卷正解顯示正確 (單選 " + cnt.single + "/複選 " + cnt.multi + "/是非 " + cnt.tf + "/文字 " + cnt.text + " 題)", okShow && cnt.single && cnt.multi && cnt.tf && cnt.text, d);
}

/* 列印考卷不得洩漏答案：靜態檢查 UI 原始碼與列印 CSS 的切換邏輯 */
{
  const ui = fs.readFileSync(path.join(root, "exam-engine", "ui.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "exam-engine", "exam.css"), "utf8");
  const pr = css.slice(css.lastIndexOf("@media print"));
  check("列印考卷: UI 不再輸出「解答與解析」區塊 (無 printKey / ex-printkey)", !/printKey\(|ex-printkey|解答與解析/.test(ui) && !/ex-printkey/.test(css));
  check("列印考卷: 列印 CSS 預設隱藏答案卷 (.ex-key none)，只有 body.ex-print-key 才顯示", /\n\s*\.ex-key \{ display: none !important; \}/.test(pr) && /body\.ex-print-key \.ex-key \{ display: grid !important/.test(pr));
  check("列印考卷: 「列印考卷」鈕直接 window.print()（不加 ex-print-key）；只有「列印答案卷」會加", /id: "ex-print-exam", onclick: \(\) => window\.print\(\)/.test(ui) && (ui.match(/classList\.add\("ex-print-key"\)/g) || []).length === 1);
  check("列印答案卷: ex-print-key 時隱藏考卷／結果頁其他區塊", /body\.ex-print-key \.ex-examview > \*:not\(\.ex-key\)/.test(pr));
  check("列印考卷: 作答頁題目卡不含解析欄位 (feedback 在列印隱藏)", /\.ex-feedback \{ display: none !important; \}/.test(pr));
}

/* 難度範圍 */
{
  const ex = engine.buildExam({ mode: "score", units: pickUnits("hanlin", 3), types: ALL, levelMin: 3, levelMax: 5 });
  check("難度範圍 3~5 只出 level 3~5", ex.items.every(i => i.level >= 3 && i.level <= 5));
}

/* ---------- 2. 二十題逐題 ---------- */
{
  let ok20 = true, okAsc20 = true, okPts = true, okEven = true, okTE20 = true, okBal20 = true, d = "";
  for (let r = 0; r < 40; r++) {
    const types = r % 2 ? ALL : ["single", "tf", "fill", "word"].slice(0, 2 + (r % 3));
    const units = pickUnits("kanghsuan", 2 + (r % 4));
    const ex = engine.buildExam({ mode: "practice", units, types });
    if (ex.items.length !== 20) ok20 = false;
    for (let i = 1; i < ex.items.length; i++) if (ex.items[i].level < ex.items[i - 1].level) okAsc20 = false;
    if (ex.items.some(i => i.points !== 5) || ex.total !== 100) okPts = false;
    const c = {}; ex.items.forEach(i => { c[i.type] = (c[i.type] || 0) + 1; });
    const v = types.map(t => c[t] || 0); if (Math.max.apply(null, v) - Math.min.apply(null, v) > 1) { okEven = false; d = JSON.stringify(c); }
    const trap = ex.items.filter(i => i.tag === "trap").length, ext = ex.items.filter(i => i.tag === "extend").length;
    if (trap < 2 || ext < 2) { okTE20 = false; d = "trap=" + trap + " ext=" + ext; }
    const tp = engine.topicsOfUnits(units).topics, cnt = {}; tp.forEach(t => { cnt[t] = 0; }); ex.items.forEach(i => { cnt[i.topic]++; });
    const vals = tp.map(t => cnt[t]); if (Math.max.apply(null, vals) - Math.min.apply(null, vals) > 1) { okBal20 = false; d = JSON.stringify(cnt); }
  }
  check("20題: 恰 20 題", ok20);
  check("20題: 整體由簡入深 (第1題最易、第20題最深)", okAsc20);
  check("20題: 每題 5 分、合計 100", okPts);
  check("20題: 所選題型平均分配 (差距<=1)", okEven, d);
  check("20題: trap/extend 各 >=2", okTE20, d);
  check("20題: 多單元 topic 題數差距 <=1", okBal20, d);
}

/* ---------- 3. 池不足 ---------- */
{
  const tiny = ExamEngine.createBank();
  tiny.register("factor", "t", [makeSpec("factor", "single", 0), makeSpec("factor", "single", 1)]);
  const e2 = ExamEngine.create(cfg, tiny);
  warnCount = 0;
  const ex = e2.buildExam({ mode: "practice", units: [unitsOf("hanlin")[0]], types: ["single"] });
  check("池不足: 仍湊滿 20 題並 console.warn", ex.items.length === 20 && warnCount > 0);
  let threw = false; try { e2.buildExam({ mode: "score", units: [unitsOf("hanlin")[1]], types: ["single"] }); } catch (e) { threw = true; }
  check("無題庫的單元: 明確丟錯而非產生空卷", threw);
}

/* ---------- 4. 批改 ---------- */
function T(answer, extra) { return Object.assign({ type: "fill", answer, accepted: [], units: [], points: 3 }, extra || {}); }
const eq = (item, input) => engine.sameAnswer(input, item);
check("批改: 3/4 = 0.75 = .75", eq(T("3/4"), "0.75") && eq(T("3/4"), ".75") && eq(T("0.75"), "3/4"));
check("批改: 帶分數 1 1/2 = 3/2 = 1.5", eq(T("3/2"), "1 1/2") && eq(T("1 1/2"), "1.5") && eq(T("1.5"), "1又1/2"));
check("批改: 全形轉半形與空白、千分位", eq(T("1200"), "１，２００") && eq(T("12"), " １２ ") && eq(T("3/4"), "３／４"));
check("批改: 去除單位 (units)", eq(T("12", { units: ["公分"] }), "12公分") && eq(T("12", { units: ["公分", "平方公分"] }), "12 平方公分") && eq(T("12公分", { units: ["公分"] }), "12"));
check("批改: 未列於 units 的單位視為錯", !eq(T("12", { units: ["公分"] }), "12公尺"));
check("批改: 錯誤答案與空白為錯", !eq(T("3/4"), "0.7") && !eq(T("3/4"), "") && !eq(T("3/4"), "   ") && !eq(T("5"), "5.01"));
check("批改: accepted 替代寫法與乘積順序/符號", eq(T("2×3×3", { accepted: [] }), "2*3*3") && eq(T("2×3×3"), "3x2x3") && !eq(T("2×3×3"), "2×2×3"));
check("批改: 百分率 25% = 25", eq(T("25%"), "25") && eq(T("25"), "25%"));
const M = { type: "multi", options: ["a", "b", "c", "d"], answer: [0, 2], points: 5 };
check("批改: 複選全對才給分 (不倒扣、少選多選皆 0)", engine.gradeItem(M, [2, 0]).earned === 5 && engine.gradeItem(M, [0]).earned === 0 && engine.gradeItem(M, [0, 2, 3]).earned === 0 && engine.gradeItem(M, []).earned === 0 && engine.gradeItem(M, undefined).earned === 0);
const S = { type: "single", options: ["a", "b"], answer: 1, points: 3 }, F = { type: "tf", answer: false, points: 2 };
check("批改: 單選／是非", engine.gradeItem(S, 1).earned === 3 && engine.gradeItem(S, 0).earned === 0 && engine.gradeItem(F, false).earned === 2 && engine.gradeItem(F, true).earned === 0 && !engine.gradeItem(F, undefined).answered);

/* ---------- 5. 統計與重做錯題 ---------- */
{
  const units = unitsOf("hanlin").slice(0, 3);
  const ex = engine.buildExam({ mode: "score", units, types: ALL });
  const resp = {}; ex.items.forEach((it, i) => {
    if (i % 2 === 0) { // 答對
      resp[it.no] = it.type === "tf" ? it.answer : (it.type === "single" || it.type === "multi" ? it.answer : it.answer);
    } else resp[it.no] = it.type === "tf" ? !it.answer : (it.type === "single" ? (it.answer + 1) % 4 : (it.type === "multi" ? [] : "999999"));
  });
  const sum = engine.summarize(ex, resp);
  const expectScore = ex.items.filter((_, i) => i % 2 === 0).reduce((a, i) => a + i.points, 0);
  check("統計: 得分／答對題數／錯題清單", sum.score === expectScore && sum.correctCount === 17 && sum.wrong.length === 16 && sum.total === 100);
  const tagTotal = Object.keys(sum.byTag).reduce((a, k) => a + sum.byTag[k].total, 0);
  check("統計: 依標籤／依單元合計一致", tagTotal === 33 && Object.keys(sum.byUnit).every(u => units.some(x => x.unitId === u)));
  const redo = engine.rebuildFromItems(ex, sum.wrong);
  check("只重做錯題: 題數等於錯題數、總分 100、題號重編", redo.items.length === 16 && redo.total === 100 && redo.items.every((it, i) => it.no === i + 1));
  check("describeAnswer/Response 不丟錯", ex.items.every(it => typeof engine.describeAnswer(it) === "string" && typeof engine.describeResponse(it, resp[it.no]) === "string"));
}

console.warn = origWarn;
console.log("\n" + (fail === 0 ? "ALL PASS" : "HAS FAIL") + "  (" + pass + " pass, " + fail + " fail)");
process.exit(fail === 0 ? 0 : 1);
