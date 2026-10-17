/* 社會科入口與題庫靜態驗證：node verify-social.js
   本腳本不取代逐題事實查核或真實瀏覽器驗收。 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
globalThis.window = globalThis;
const root = path.join(__dirname, "..", "..");
function load(file) { vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file }); }
load(path.join(root, "exam-engine", "kit.js"));
load(path.join(root, "exam-engine", "engine.js"));
load(path.join(__dirname, "config.js"));
load(path.join(__dirname, "banks", "factory.js"));
load(path.join(__dirname, "learning-content.js"));
const cfg = globalThis.ExamConfig;
const data = globalThis.SocialLearningContent;
const bankDir = path.join(__dirname, "banks");
let failures = 0;
const issues = [];
function check(ok, message) { if (!ok) { failures++; issues.push(message); } }
for (const topic of cfg.allTopics) {
  const file = path.join(bankDir, "bank-" + topic + ".js");
  check(fs.existsSync(file), "缺少題庫檔：" + topic);
  if (fs.existsSync(file)) load(file);
}
check(cfg.defaultVersion === "kanghsuan", "預設版本不是康軒版");
check(cfg.types.map(t => t.key).join(",") === "tf,single,fill", "題型應為是非、單選、填空，且順序固定");
check(cfg.types.reduce((sum, t) => sum + t.stdCount * t.stdPts, 0) === 100, "config 標準題數配分合計不是 100");
const ver = cfg.versions.kanghsuan;
check(!!ver && ver.units.length === 4, "康軒版六上應有四個單元");
for (const u of (ver ? ver.units : [])) {
  check(u.verified === false, "未經課本目錄核對的單元不得標 verified=true：" + u.unitId);
  check(!!data.units[u.unitId], "缺少單元學習內容：" + u.unitId);
  for (const topic of u.topics) check(cfg.allTopics.includes(topic), "單元引用未知 topic：" + u.unitId + " → " + topic);
}
const auditIssues = globalThis.SocialBankAudit || [];
auditIssues.forEach(issue => check(false, issue));
const specsByTopic = {};
for (const topic of cfg.allTopics) specsByTopic[topic] = ExamBank.specsOf(topic);
function unitSpecs(unit) {
  const ids = new Set(unit.topics);
  return unit.topics.flatMap(t => specsByTopic[t] || []);
}
const first = ver.units[0];
const firstSpecs = unitSpecs(first);
const counts = { tf: 0, single: 0, fill: 0 };
firstSpecs.forEach(s => { if (Object.prototype.hasOwnProperty.call(counts, s.type)) counts[s.type]++; });
check(counts.tf >= 10, "第一單元是非題 spec 不足：" + counts.tf + "/10");
check(counts.single >= 20, "第一單元單選題 spec 不足：" + counts.single + "/20");
check(counts.fill >= 5, "第一單元填空題 spec 不足：" + counts.fill + "/5");
const allIds = new Set();
const sourceCoverage = { item: 0, topic: 0 };
for (const topic of cfg.allTopics) {
  const topicSpecs = specsByTopic[topic];
  const perType = { single: [], multi: [], tf: [], fill: [] };
  topicSpecs.forEach(s => {
    if (perType[s.type]) perType[s.type].push(s);
  });
  for (const [type, min] of Object.entries({ single: 12, multi: 6, tf: 12, fill: 10 })) {
    check(perType[type].length >= min, topic + " 題型 " + type + " 數量不足：" + perType[type].length + "/" + min);
  }
  /* 本驗證器只檢查 metadata 結構是否合法，不強迫各題型分布難度／trap／extend 配額。
     未經逐題審核的舊標籤會由 factory 降級為 level 2 / basic，避免把任意分布當成教學品質。 */
  for (const s of topicSpecs) {
    check(Number.isInteger(s.level) && s.level >= 1 && s.level <= 5, topic + " 難度標籤無效：" + s.id + " level=" + s.level);
    check(["basic", "trap", "extend"].includes(s.tag), topic + " 分類標籤無效：" + s.id + " tag=" + s.tag);
    check(typeof s.factKey === "string" && s.factKey.trim().length > 0, topic + " 缺少答案／解析依據欄位：" + s.id);
    check(typeof s.sourceUrl === "string" && (s.sourceUrl.startsWith("https://") || s.sourceUrl.startsWith("http://")), topic + " 缺少有效來源 URL：" + s.id);
    check(typeof s.sourceLabel === "string" && s.sourceLabel.trim().length > 0, topic + " 缺少來源標籤：" + s.id);
    check(["item", "topic"].includes(s.sourceScope), topic + " 來源層級欄位無效：" + s.id);
    if (sourceCoverage[s.sourceScope] !== undefined) sourceCoverage[s.sourceScope]++;
    check(!allIds.has(s.id), "spec id 重複：" + s.id);
    allIds.add(s.id);
    check(["tf", "single", "fill", "multi"].includes(s.type), "不支援題型：" + s.id + " " + s.type);
    for (let i = 0; i < 100; i++) {
      let q;
      try { q = s.gen(ExamKit); } catch (e) { check(false, s.id + " 第 " + (i + 1) + " 次 gen 丟錯：" + e.message); break; }
      check(!!q && typeof q.stem === "string" && q.stem.trim().length > 0, s.id + " 題幹為空");
      check(!!q && typeof q.explain === "string" && q.explain.trim().length > 0, s.id + " 解析為空");
      if (s.type === "single") {
        check(Array.isArray(q.options) && q.options.length === 4, s.id + " 單選題不是四個選項");
        check(Array.isArray(q.options) && new Set(q.options).size === q.options.length, s.id + " 單選選項重複");
        check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, s.id + " 單選答案索引無效");
      } else if (s.type === "tf") check(typeof q.answer === "boolean", s.id + " 是非題答案不是布林值");
      else if (s.type === "multi") {
        check(Array.isArray(q.options) && q.options.length >= 4 && q.options.length <= 5, s.id + " 複選題選項數應為 4～5 個");
        check(Array.isArray(q.options) && new Set(q.options).size === q.options.length, s.id + " 複選題選項重複");
        check(Array.isArray(q.answer) && q.answer.length >= 2 && q.answer.length <= 3, s.id + " 複選題正確答案數應為 2～3 個");
        check(Array.isArray(q.answer) && q.answer.every(i => Number.isInteger(i) && i >= 0 && i < q.options.length), s.id + " 複選題答案索引無效");
        check(Array.isArray(q.answer) && new Set(q.answer).size === q.answer.length, s.id + " 複選題答案索引重複");
      } else if (s.type === "fill") {
        check(typeof q.answer === "string" && q.answer.trim().length > 0, s.id + " 填空答案為空");
        check(Array.isArray(q.accepted) && q.accepted.every(a => typeof a === "string" && a.trim().length > 0), s.id + " 填空接受答案格式無效");
      }
      if (s.tag === "trap") check(typeof q.trapNote === "string" && q.trapNote.trim().length > 0, s.id + " 易錯題缺 trapNote");
    }
  }
}
/* 實際批改回歸：用引擎 realize() 洗牌後的 item 測試答案索引與填空 accepted。
   只驗證生成／批改一致性，不替代題目內容與史實審核。 */
const gradingEngine = ExamEngine.create(cfg, ExamBank);
for (const topic of cfg.allTopics) {
  for (const spec of specsByTopic[topic]) {
    if (spec.type !== "multi" && spec.type !== "fill") continue;
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        const item = gradingEngine.realize(spec);
        const grade = gradingEngine.gradeItem(item, item.type === "multi" ? item.answer.slice() : item.answer);
        check(grade.correct === true, spec.id + " 洗牌／填空正解批改不一致（第 " + (attempt + 1) + " 次）");
        if (item.type === "fill") {
          for (const accepted of (item.accepted || [])) {
            check(gradingEngine.gradeItem(item, accepted).correct === true, spec.id + " accepted 答案無法通過批改：" + accepted);
          }
        }
      } catch (e) { check(false, spec.id + " 實際批改回歸丟錯：" + e.message); break; }
    }
  }
}

let exam = null;
try {
  const engine = ExamEngine.create(cfg, ExamBank);
  exam = engine.buildExam({ mode: "score", units: [first], types: ["tf", "single", "fill"], levelMin: 1, levelMax: 5, mix: cfg.mix });
  check(exam.total === 100, "實際組卷滿分不是 100：" + exam.total);
  check(exam.items.length === 35, "實際組卷不是 35 題：" + exam.items.length);
  const actual = { tf: 0, single: 0, fill: 0 }, points = { tf: [], single: [], fill: [] };
  exam.items.forEach(it => { actual[it.type] = (actual[it.type] || 0) + 1; (points[it.type] || (points[it.type] = [])).push(it.points); });
  check(actual.tf === 10 && actual.single === 20 && actual.fill === 5, "實際題型題數不符：" + JSON.stringify(actual));
  check(exam.items.reduce((n, it) => n + it.points, 0) === 100, "實際題目配分合計不是 100");
} catch (e) { check(false, "實際組卷丟錯：" + e.stack); }
console.log("第一單元題庫量：", JSON.stringify(counts));
console.log("來源追溯層級（item=題目個別來源，topic=沿用主題來源；不代表已完成內容查核）：", JSON.stringify(sourceCoverage));
console.log("組卷實測：", exam ? JSON.stringify({ count: exam.items.length, total: exam.total, types: exam.items.reduce((a, it) => (a[it.type] = (a[it.type] || 0) + 1, a), {}) }) : "FAIL");
issues.slice(0, 100).forEach(x => console.log("FAIL", x));
if (issues.length > 100) console.log("…另有 " + (issues.length - 100) + " 項失敗");
console.log(failures ? "HAS FAIL (" + failures + ")" : "ALL PASS");
process.exit(failures ? 1 : 0);
