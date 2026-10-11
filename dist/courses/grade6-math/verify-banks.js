/* 題庫驗證：node verify-banks.js [topic ...]
   對每個 spec 呼叫 gen 200 次檢查契約與去重，並檢查每個 topic 的量化門檻，最後檢查「版本單元皆有題庫」。 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

globalThis.window = globalThis;
const root = path.join(__dirname, "..", "..");
function load(f) { vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
load(path.join(root, "exam-engine", "kit.js"));
load(path.join(root, "exam-engine", "engine.js"));
load(path.join(__dirname, "config.js"));
const cfg = globalThis.ExamConfig;
const kit = globalThis.ExamKit;
const selfEngine = ExamEngine.create(cfg, ExamBank);

const TYPES = ["single", "multi", "tf", "fill", "calc", "word"];
const TAGS = ["basic", "trap", "extend"];
const SIMPLIFIED = ["视频", "获取", "点击", "确认", "软件", "网络", "计算机", "优化", "质量", "数据", "信息", "这个", "这样", "没有", "时间段", "运算符", "计算结果", "圆周", "长度为", "个数"];
const GEN_RUNS = 200;

const only = process.argv.slice(2);
const topics = only.length ? only : cfg.allTopics;
let totalFail = 0;
const problems = [];
const globalIds = new Set();
const rows = [];
const missingBanks = [];

function fmtNum(s) {
  const m = /^-?\d+\.(\d+)$/.exec(String(s).replace(/[^\d.\-]/g, ""));
  return m ? m[1].length : 0;
}

topics.forEach(topic => {
  const file = path.join(__dirname, "banks", "bank-" + topic + ".js");
  if (!fs.existsSync(file)) { missingBanks.push(topic); rows.push({ topic, status: "FAIL", note: "檔案不存在" }); totalFail++; return; }
  const before = ExamBank.specsOf(topic).length;
  const errs = [], warns = [];
  try { load(file); } catch (e) { errs.push("載入失敗：" + e.message); }
  const specs = ExamBank.specsOf(topic).slice(before);
  if (!specs.length) errs.push("沒有註冊任何 spec（檔末需呼叫 ExamBank.register）");

  const perType = {}; TYPES.forEach(t => { perType[t] = { n: 0, levels: new Set() }; });
  let trap = 0, extend = 0; const trapTypes = new Set(); const levels = new Set();

  specs.forEach(s => {
    const where = s.id;
    if (typeof s.id !== "string" || !s.id) { errs.push("spec 缺 id"); return; }
    if (globalIds.has(s.id)) errs.push(where + ": id 全域重複"); globalIds.add(s.id);
    if (!TYPES.includes(s.type)) { errs.push(where + ": type 不合法 " + s.type); return; }
    if (!Number.isInteger(s.level) || s.level < 1 || s.level > 5) errs.push(where + ": level 不合法");
    if (!TAGS.includes(s.tag)) errs.push(where + ": tag 不合法");
    if (typeof s.gen !== "function") { errs.push(where + ": 缺 gen"); return; }
    perType[s.type].n++; perType[s.type].levels.add(s.level); levels.add(s.level);
    if (s.tag === "trap") { trap++; trapTypes.add(s.type); }
    if (s.tag === "extend") extend++;

    const stems = new Set(); let firstErr = null, zeroNeg = 0, longDec = 0, simp = null;
    for (let i = 0; i < GEN_RUNS && !firstErr; i++) {
      let r;
      try { r = s.gen(kit); } catch (e) { firstErr = "gen 第 " + (i + 1) + " 次丟錯：" + e.message; break; }
      if (!r || typeof r !== "object") { firstErr = "gen 沒回傳物件"; break; }
      if (typeof r.stem !== "string" || !r.stem.trim()) { firstErr = "stem 空白"; break; }
      if (typeof r.explain !== "string" || r.explain.trim().length < 4) { firstErr = "explain 空白或過短"; break; }
      if (s.tag === "trap" && (typeof r.trapNote !== "string" || !r.trapNote.trim())) { firstErr = "trap 題缺 trapNote"; break; }
      stems.add(r.stem);
      const texts = [r.stem, r.explain, r.trapNote || ""].concat(Array.isArray(r.options) ? r.options.map(String) : []);
      texts.forEach(t => SIMPLIFIED.forEach(w => { if (!simp && t.includes(w)) simp = w; }));
      if (s.type === "single" || s.type === "multi") {
        if (!Array.isArray(r.options)) { firstErr = "缺 options"; break; }
        const o = r.options.map(String);
        if (s.type === "single" && o.length !== 4) { firstErr = "single 需 4 個選項（目前 " + o.length + "）"; break; }
        if (s.type === "multi" && (o.length < 4 || o.length > 5)) { firstErr = "multi 需 4~5 個選項（目前 " + o.length + "）"; break; }
        if (new Set(o).size !== o.length) { firstErr = "options 有重複：" + o.join("|"); break; }
        if (o.some(x => !x.trim())) { firstErr = "options 有空字串"; break; }
        if (s.type === "single") {
          if (!Number.isInteger(r.answer) || r.answer < 0 || r.answer >= o.length) { firstErr = "single answer 不是合法索引"; break; }
        } else {
          const a = r.answer;
          if (!Array.isArray(a) || a.length < 2) { firstErr = "multi 至少 2 個正解"; break; }
          if (a.length >= o.length) { firstErr = "multi 至少 1 個錯項"; break; }
          if (!a.every((v, k) => Number.isInteger(v) && v >= 0 && v < o.length && (k === 0 || v > a[k - 1]))) { firstErr = "multi answer 需為升冪索引陣列"; break; }
          if (!/所有|全部/.test(r.stem)) { firstErr = "multi 題幹需明示「選出所有正確的」"; break; }
        }
      } else if (s.type === "tf") {
        if (typeof r.answer !== "boolean") { firstErr = "tf answer 必須是 true/false"; break; }
        if (r.options) { firstErr = "tf 不應有 options"; break; }
      } else {
        if (r.answer == null || typeof r.answer !== "string" || !r.answer.trim()) { firstErr = "answer 需為非空字串"; break; }
        if (r.accepted !== undefined && !(Array.isArray(r.accepted) && r.accepted.every(x => typeof x === "string"))) { firstErr = "accepted 需為字串陣列"; break; }
        if (r.units !== undefined && !(Array.isArray(r.units) && r.units.every(x => typeof x === "string"))) { firstErr = "units 需為字串陣列"; break; }
        if (s.type === "word" && !(r.units && r.units.length)) { firstErr = "word 題應列出 units"; break; }
        const selfItem = { type: s.type, answer: r.answer, accepted: r.accepted || [], units: r.units || [], points: 1 };
        if (!selfEngine.sameAnswer(r.answer, selfItem)) { firstErr = "標準答案無法被引擎批改為正確：" + r.answer; break; }
        if ((r.accepted || []).some(a => !selfEngine.sameAnswer(a, selfItem))) { firstErr = "accepted 內有無法通過批改的寫法"; break; }
        if ((r.units || []).length && !selfEngine.sameAnswer(r.answer + r.units[0], selfItem)) { firstErr = "答案加單位後無法通過批改：" + r.answer + r.units[0]; break; }
        const num = cfg.numberParser(r.answer.replace(/\s+/g, " ").trim());
        if (num !== null) {
          if (fmtNum(r.answer) > 4) longDec++;
          if (num <= 0) zeroNeg++;
        }
      }
    }
    if (firstErr) errs.push(where + ": " + firstErr);
    if (simp) errs.push(where + ": 含簡體詞「" + simp + "」");
    if (longDec) errs.push(where + ": 答案超過 4 位小數（" + longDec + " 次）");
    if (zeroNeg) warns.push(where + ": 答案為 0 或負數 " + zeroNeg + " 次（若非題意請修）");
    if (!firstErr && stems.size === 1) warns.push(where + ": 200 次題幹完全相同（變數未生效？）");
  });

  TYPES.forEach(t => {
    if (perType[t].n < 5) errs.push("題型 " + t + " 只有 " + perType[t].n + " 個 spec（需 >=5）");
    if (perType[t].levels.size < 3) errs.push("題型 " + t + " 只涵蓋 " + perType[t].levels.size + " 個 level（需 >=3）");
  });
  [1, 2, 3, 4, 5].forEach(l => { if (!levels.has(l)) errs.push("整個 topic 缺 level " + l); });
  if (trap < 8) errs.push("trap 只有 " + trap + " 個（需 >=8）");
  if (extend < 6) errs.push("extend 只有 " + extend + " 個（需 >=6）");
  if (trapTypes.size < 4) errs.push("trap 只分布在 " + trapTypes.size + " 種題型（需 >=4）");

  rows.push({
    topic, specs: specs.length, per: TYPES.map(t => perType[t].n).join("/"), trap, extend,
    status: errs.length ? "FAIL" : "PASS", errs, warns
  });
  if (errs.length) totalFail++;
});

/* AC1：每個版本的每個單元，至少對應 1 個「存在題庫」的 topic */
const topicsWithBank = new Set(ExamBank.topics().filter(t => ExamBank.specsOf(t).length));
const unitProblems = [];
if (!only.length) {
  Object.keys(cfg.versions).forEach(v => cfg.versions[v].units.forEach(u => {
    if (!u.topics.some(t => topicsWithBank.has(t))) unitProblems.push(v + " " + u.unitId + " " + u.title + " → 無題庫 (" + u.topics.join(",") + ")");
  }));
  if (unitProblems.length) totalFail++;
}

console.log("topic".padEnd(15) + "specs  single/multi/tf/fill/calc/word  trap extend  結果");
rows.forEach(r => {
  if (r.note) console.log(r.topic.padEnd(15) + r.note.padEnd(46) + r.status);
  else console.log(r.topic.padEnd(15) + String(r.specs).padEnd(7) + r.per.padEnd(31) + String(r.trap).padEnd(5) + String(r.extend).padEnd(7) + r.status);
});
rows.forEach(r => { (r.errs || []).slice(0, 40).forEach(e => console.log("  FAIL " + r.topic + " | " + e)); if ((r.errs || []).length > 40) console.log("  ... " + r.topic + " 另有 " + (r.errs.length - 40) + " 項錯誤"); (r.warns || []).slice(0, 10).forEach(w => console.log("  warn " + r.topic + " | " + w)); });
if (!only.length) {
  console.log("\n版本單元 → 題庫對應: " + (unitProblems.length ? "FAIL" : "PASS"));
  unitProblems.forEach(p => console.log("  FAIL " + p));
}
console.log("\n" + (totalFail === 0 ? "ALL PASS" : "HAS FAIL") + "  (" + rows.filter(r => r.status === "PASS").length + "/" + rows.length + " topics pass)");
process.exit(totalFail === 0 ? 0 : 1);
