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
const secExpect = { single: [8, 24], multi: [3, 15], tf: [5, 10], fill: [6, 18], calc: [4, 16], word: [3, 17] };
for (let r = 0; r < 60; r++) {
  const ver = ["hanlin", "kanghsuan", "nani"][r % 3];
  const units = pickUnits(ver, 2 + (r % 5));
  const ex = engine.buildExam({ mode: "score", units, types: ALL });
  if (ex.items.length !== 29) { okCount = false; detail = "題數 " + ex.items.length; }
  if (ex.total !== 100 || ex.items.reduce((a, i) => a + i.points, 0) !== 100) okSum = false;
  ex.sections.forEach(s => { const e = secExpect[s.type]; if (s.count !== e[0] || s.points !== e[1] || s.items.reduce((a, i) => a + i.points, 0) !== e[1]) okSec = false; });
  ex.sections.forEach(s => { for (let i = 1; i < s.items.length; i++) if (s.items[i].level < s.items[i - 1].level) okAsc = false; });
  const w = ex.sections.find(s => s.type === "word"); if (w.items.map(i => i.points).join() !== "6,6,5") okWord = false;
  if (new Set(ex.items.map(i => i.specId)).size !== ex.items.length) okUniq = false;
  const trap = ex.items.filter(i => i.tag === "trap").length, ext = ex.items.filter(i => i.tag === "extend").length;
  if (trap < 2 || ext < 2 || trap > 10 || ext > 10) { okTE = false; detail = "trap=" + trap + " ext=" + ext; }
  const tp = engine.topicsOfUnits(units).topics, cnt = {}; tp.forEach(t => { cnt[t] = 0; }); ex.items.forEach(i => { cnt[i.topic]++; });
  const vals = tp.map(t => cnt[t]); if (Math.max.apply(null, vals) - Math.min.apply(null, vals) > 1) { okBal = false; detail = JSON.stringify(cnt); }
  ex.items.forEach((it, idx) => { if (it.no !== idx + 1 || !it.stem || !it.explain || !it.unitIds.length) okFields = false; if (it.tag === "trap" && !it.trapNote) okFields = false; });
  ex.items.forEach(it => { if (it.type === "single" && !(it.options[it.answer] && /^\d+$/.test(it.options[it.answer]) && String(Number(it.stem.match(/n=(\d+)/)[1]) * 2) === it.options[it.answer])) okAnsw = false; });
}
check("100分卷: 預設共 29 題 (8/3/5/6/4/3)", okCount, detail);
check("100分卷: 總分剛好 100", okSum);
check("100分卷: 各大題題數與配分 24/15/10/18/16/17", okSec);
check("100分卷: 大題內由簡入深 (level 升冪)", okAsc);
check("100分卷: 應用題配分 6/6/5", okWord);
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
      if (ex.sections.map(s => s.type).join() !== sub.join()) { ok = false; d = "順序 " + ex.sections.map(s => s.type).join(); }
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
  check("統計: 得分／答對題數／錯題清單", sum.score === expectScore && sum.correctCount === 15 && sum.wrong.length === 14 && sum.total === 100);
  const tagTotal = Object.keys(sum.byTag).reduce((a, k) => a + sum.byTag[k].total, 0);
  check("統計: 依標籤／依單元合計一致", tagTotal === 29 && Object.keys(sum.byUnit).every(u => units.some(x => x.unitId === u)));
  const redo = engine.rebuildFromItems(ex, sum.wrong);
  check("只重做錯題: 題數等於錯題數、總分 100、題號重編", redo.items.length === 14 && redo.total === 100 && redo.items.every((it, i) => it.no === i + 1));
  check("describeAnswer/Response 不丟錯", ex.items.every(it => typeof engine.describeAnswer(it) === "string" && typeof engine.describeResponse(it, resp[it.no]) === "string"));
}

console.warn = origWarn;
console.log("\n" + (fail === 0 ? "ALL PASS" : "HAS FAIL") + "  (" + pass + " pass, " + fail + " fail)");
process.exit(fail === 0 ? 0 : 1);
