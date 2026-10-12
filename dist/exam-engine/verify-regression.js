/* 引擎回歸快照：node verify-regression.js [--write]
   對 數學／國語／社會／自然 四份 config 的真實題庫：
   (1) planScore 全部題型子集（含 fixed 情境）；
   (2) 固定亂數種子的 buildExam（計分卷、練習卷）整份輸出；
   (3) summarize 對固定考卷＋固定作答的 golden。
   --write 寫入 regression-snapshot.json（只在改引擎前執行一次）；不帶參數＝與快照逐筆比對。 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
globalThis.window = globalThis;
const dist = path.join(__dirname, "..");
function load(rel) { const f = path.join(dist, rel); vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
const SNAP = path.join(__dirname, "regression-snapshot.json");
console.warn = function () {};

/* 種子亂數（mulberry32）：取代 Math.random 讓 buildExam 可重現 */
function seed(s) { let a = s >>> 0; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const COURSES = ["grade6-math", "grade6-chinese", "grade6-social", "grade6-science"];
const out = {};
load("exam-engine/kit.js");
load("exam-engine/engine.js");
const realRandom = Math.random;

COURSES.forEach(function (c) {
  globalThis.ExamConfig = undefined;
  const bank = ExamEngine.createBank();
  globalThis.ExamBank = bank; /* 題庫檔用 global.ExamBank.register */
  load("courses/" + c + "/config.js");
  const cfg = globalThis.ExamConfig;
  const bdir = path.join(dist, "courses", c, "banks");
  if (c === "grade6-chinese" || c === "grade6-social" || c === "grade6-science") { try { load("courses/" + c + "/banks/factory.js"); } catch (e) { /* 無 factory 略過 */ } }
  cfg.allTopics.forEach(function (t) { const f = path.join(bdir, "bank-" + t + ".js"); if (fs.existsSync(f)) vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); });
  const engine = ExamEngine.create(cfg, bank);
  const keys = cfg.types.map(t => t.key);
  const rec = { plan: {}, plan_fixed: {}, exams: {}, summarize: null };
  for (let m = 1; m < (1 << keys.length); m++) {
    const sub = keys.filter((k, i) => m & (1 << i));
    const p = engine.planScore(sub, null);
    rec.plan[sub.join(",")] = p ? { plan: p, relaxed: p.relaxed } : null;
    const fixed = {}; sub.forEach((k, i) => { fixed[k] = 2 + (i % 3); });
    const pf = engine.planScore(sub, fixed);
    rec.plan_fixed[sub.join(",")] = pf ? { plan: pf, relaxed: pf.relaxed } : null;
  }
  const units = cfg.versions[cfg.defaultVersion].units.filter(u => u.topics.some(t => bank.specsOf(t).length));
  [["score_all", { mode: "score", types: keys, units }], ["practice_all", { mode: "practice", types: keys, units }],
   ["score_part", { mode: "score", types: keys.slice(0, 2), units: units.slice(0, 2) }]].forEach(function (cs, i) {
    seed(1000 + i * 17 + c.length);
    try { const ex = engine.buildExam(Object.assign({ levelMin: 1, levelMax: 5 }, cs[1])); rec.exams[cs[0]] = JSON.parse(JSON.stringify(ex)); }
    catch (e) { rec.exams[cs[0]] = "ERR:" + e.message; }
  });
  /* summarize golden：用上面 score_all 考卷＋固定作答（偶數題答對、其餘空白／答錯） */
  const ex = rec.exams.score_all;
  if (ex && typeof ex === "object") {
    const resp = {};
    ex.items.forEach(function (it) {
      if (it.no % 3 === 0) return;
      if (it.no % 3 === 1) { resp[it.no] = engine.describeAnswer ? (it.type === "single" || it.type === "multi" || it.type === "tf" ? it.answer : String(it.answer)) : it.answer; }
      else { resp[it.no] = it.type === "single" ? (it.answer + 1) % 2 : (it.type === "multi" ? [0] : (it.type === "tf" ? !it.answer : "錯誤答案")); }
    });
    rec.summarize = JSON.parse(JSON.stringify(engine.summarize(ex, resp)));
    rec.summarize_empty = JSON.parse(JSON.stringify(engine.summarize(ex, {})));
  }
  out[c] = rec;
  Math.random = realRandom;
});

const text = JSON.stringify(out, null, 1);
if (process.argv.includes("--write")) { fs.writeFileSync(SNAP, text); console.log("snapshot written: " + text.length + " bytes"); process.exit(0); }
const snap = fs.readFileSync(SNAP, "utf8");
let bad = 0;
const a = JSON.parse(snap);
COURSES.forEach(function (c) {
  ["plan", "plan_fixed", "exams", "summarize", "summarize_empty"].forEach(function (part) {
    const same = JSON.stringify(a[c][part]) === JSON.stringify(out[c][part]);
    if (!same) bad++;
    const n = part === "plan" || part === "plan_fixed" ? Object.keys(out[c][part]).length + " 子集" : (part === "exams" ? Object.keys(out[c][part]).length + " 份考卷" : "golden");
    console.log((same ? "PASS  " : "FAIL  ") + c + " / " + part + " (" + n + ")");
  });
});
console.log(bad ? "\nREGRESSION FAIL (" + bad + ")" : "\nALL PASS (與改動前快照逐筆全等)");
process.exit(bad ? 1 : 0);
