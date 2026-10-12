/* 引擎層驗證：造句（selfcheck，規則批改）、照樣寫短語（規則批改）、閱讀題組、填寫/選擇雙形式。
   執行：node verify-selfcheck.js
   使用 grade6-chinese-lab 的 config 與假題庫，並加入幾個刻意壞掉的 spec 驗證 validateRaw。 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
globalThis.window = globalThis;
const dist = path.join(__dirname, "..");
function load(rel) { const f = path.join(dist, rel); vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
load("exam-engine/kit.js"); load("exam-engine/engine.js");
console.warn = function () {};

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log("PASS  " + name); } else { fail++; console.log("FAIL  " + name + (detail ? "  -> " + detail : "")); } }

globalThis.ExamBank = ExamEngine.createBank();
load("courses/grade6-chinese-lab/config.js");
load("courses/grade6-chinese-lab/banks/lab-bank.js");
const cfg = globalThis.ExamConfig, bank = globalThis.ExamBank;
const engine = ExamEngine.create(cfg, bank);
const units = cfg.versions.lab.units;
const allKeys = cfg.types.map(t => t.key);
const build = (extra) => engine.buildExam(Object.assign({ mode: "score", units: units.slice(0, 1), types: allKeys, levelMin: 1, levelMax: 5 }, extra || {}));
const mk = (kw, pts, rules) => engine.realize({ id: "t" + Math.random(), type: "sentence", level: 1, tag: "basic", topic: "x", gen: () => ({ stem: "s", explain: "e", keywords: kw, sample: "範例句子在這裡。", rules }) });
function graded(kw, pts, text, rules) { const it = mk(kw, pts, rules); it.points = pts; it.rulePts = engine.apportion(pts, it.rules.map(() => 1)); return { it, g: engine.gradeItem(it, text) }; }

/* ---- 1. 標準卷：造句與照樣寫都進 100 分 ---- */
const ex = build();
check("全選題型：總分剛好 100", ex.total === 100, "total=" + ex.total);
const std = { zhuyin: [4, 2], zhuyin_mc: [4, 2], hanzi: [4, 2], hanzi_mc: [4, 2], homophone: [3, 3], homophone_mc: [3, 3], wrongchar: [3, 3], wrongchar_mc: [3, 3], pattern: [2, 4], reading: [5, 4], sentence: [1, 4] };
check("標準版型題數×每題分 與 config 相同（造句 1×4=4 分、照樣寫 2×4=8 分）", Object.keys(std).every(k => { const s = ex.sections.find(x => x.type === k); return s && s.count === std[k][0] && s.each === std[k][1]; }), JSON.stringify(ex.sections.map(s => [s.type, s.count, s.each])));
check("大題順序同 config.types", JSON.stringify(ex.sections.map(s => s.type)) === JSON.stringify(allKeys));
const sc = ex.sections.find(s => s.type === "sentence");
check("每題 rulePts 長度＝規則條數、加總＝題分", sc.items.every(i => i.rulePts.length === i.rules.length && i.rulePts.reduce((a, b) => a + b, 0) === i.points));
check("造句 4 分、1 個語詞：規則＝語詞/標點/字數 → rulePts [2,1,1]；2 個語詞 → [1,1,1,1]", (() => { const one = graded(["甲"], 4, "").it, two = graded(["甲", "乙"], 4, "").it; return JSON.stringify(one.rulePts) === "[2,1,1]" && JSON.stringify(two.rulePts) === "[1,1,1,1]"; })());
check("造句有 keywords、sample；rubric 預設 3 條（自評對照用）", sc.items.every(i => i.keywords.length >= 1 && i.sample && i.rubric.length === 3));
check("題號連續 1..N", ex.items.every((i, k) => i.no === k + 1));

/* ---- 2. 題組不被拆散 ---- */
let setOK = true, totalOK = true;
for (let n = 0; n < 60; n++) {
  const e = build();
  if (e.total !== 100) totalOK = false;
  const rd = e.items.filter(i => i.type === "reading");
  if (rd.length !== 5) setOK = false;
  rd.forEach((i, k) => { if (i.setIndex !== k || i.setId !== rd[0].setId || i.passage !== rd[0].passage || i.no !== rd[0].no + k) setOK = false; });
}
check("60 次抽卷：閱讀 5 題同一篇、題序連續", setOK);
check("60 次抽卷：總分皆為 100", totalOK);

/* ---- 3. planScore 全部子集 ---- */
let planOK = true, multOK = true, n = 0;
for (let m = 1; m < (1 << allKeys.length); m++) {
  const sub = allKeys.filter((k, i) => m & (1 << i));
  const p = engine.planScore(sub, null); n++;
  if (!p || sub.reduce((a, k) => a + p[k].n * p[k].p, 0) !== 100) planOK = false;
  if (p && p.reading && p.reading.n % 5 !== 0) multOK = false;
}
check("planScore 全部 " + n + " 個題型子集：總分 100", planOK);
check("planScore：reading 題數皆為 5 的倍數", multOK);

/* ---- 4. 造句規則批改 ---- */
let r = graded(["專心"], 4, "上課時我很專心聽老師說話。");
check("規則全中 → 滿分、correct", r.g.earned === 4 && r.g.correct && r.g.parts.every(p => p.ok));
r = graded(["專心"], 4, "我很專心聽老師說話");
check("缺句末標點 → 扣標點那條（4 分剩 3）", r.g.earned === 3 && !r.g.correct && r.g.parts.find(p => /標點/.test(p.label)).ok === false);
r = graded(["專心"], 4, "我很認真聽老師說話。");
check("沒用到指定語詞 → 語詞條不給分（4 分剩 2）", r.g.earned === 2 && !r.g.parts[0].ok, "earned=" + r.g.earned);
r = graded(["專心"], 4, "專心。");
check("太短（<8 字）→ 扣字數條（剩 3）", r.g.parts.find(p => /至少/.test(p.label)).ok === false && r.g.earned === 3);
r = graded(["專心"], 4, "");
check("沒作答 → 0 分、answered=false", r.g.earned === 0 && !r.g.answered);
r = graded(["發現", "書包"], 4, "我 發現　書包的拉鍊壞了！");
check("兩個語詞＋空白容忍：全中 4 分", r.g.earned === 4 && r.g.correct);
r = graded(["發現", "書包"], 4, "我發現抽屜壞了。");
check("兩語詞只中一個：扣 1 條（3 分）", r.g.earned === 3 && r.g.parts.filter(p => !p.ok).length === 1);
r = graded(["專心"], 4, "專心做事。", { minLen: 4, endPunct: true });
check("rules.minLen 可由 spec 覆寫（4 字即過）", r.g.earned === 4);
r = graded(["專心"], 4, "專心做這件事", { endPunct: false, minLen: 0 });
check("rules.endPunct:false、minLen:0 → 只剩語詞一條規則", r.it.rules.length === 1 && r.g.earned === 4);
r = graded(["專心"], 4, "他說：「我很專心。」");
check("句末標點：『。」』結尾算有標點", r.g.parts.find(p => /標點/.test(p.label)).ok === true && r.g.earned === 4);
const sm = engine.summarize(ex, (() => { const o = {}; ex.items.forEach(i => { const k = i.kind || i.type; o[i.no] = k === "selfcheck" ? i.keywords.join("") + "是我們六年級常用的語詞，今天也用上了。" : (k === "single" ? i.answer : String(i.answer)); }); return o; })());
check("全部作答正確（造句滿足規則）→ score=100 / total=100，造句計入 count 與 correctCount", sm.score === 100 && sm.total === 100 && sm.count === ex.items.length && sm.correctCount === sm.count && sm.wrong.length === 0, JSON.stringify([sm.score, sm.count, sm.correctCount]));
check("byType 含 sentence 與 pattern", sm.byType.sentence && sm.byType.pattern);
const partial = (() => { const o = {}; ex.items.forEach(i => { const k = i.kind || i.type; o[i.no] = k === "selfcheck" ? i.keywords.join("") : (k === "single" ? i.answer : String(i.answer)); }); return o; })();
const sp = engine.summarize(ex, partial);
const kwPts = sc.items.reduce((a, i) => a + i.rules.reduce((b, r, k) => b + (r.id === "kw" ? i.rulePts[k] : 0), 0), 0), sentPts = sc.items.reduce((a, i) => a + i.points, 0);
check("造句只寫語詞（無標點、太短）→ 其餘全對時只拿語詞條分數，sentence 進 wrong", sp.score === 100 - sentPts + kwPts && sp.wrong.length === sc.items.length && sp.wrong.every(i => i.type === "sentence"), "score=" + sp.score + " kwPts=" + kwPts);
const spSec = sp.bySection.find(s => s.type === "sentence");
check("bySection：造句 earned 為部分分、max=4", spSec.max === 4 && spSec.earned === kwPts && kwPts > 0 && kwPts < 4);
check("沒寫造句 → 0 分", engine.summarize(ex, {}).score === 0);

/* ---- 5. 照樣寫短語 ---- */
function pi(example) { const spec = bank.all().find(s => s.type === "pattern" && engine.realize(s).example === example); return engine.realize(spec); }
const a = pi("又高又大");
check("照樣寫：accepted 命中 → 對", engine.isCorrect(a, "又圓又胖") && engine.isCorrect(a, a.answer));
check("照樣寫：不在 accepted 但含結構詞且夠長 → 對", engine.isCorrect(a, "又吃又喝") && engine.isCorrect(a, "又 快 又 準"));
check("照樣寫：照抄例句 → 錯", !engine.isCorrect(a, "又高又大"));
check("照樣寫：缺結構詞 → 錯；太短 → 錯；空白 → 錯", !engine.isCorrect(a, "很大很高") && !engine.isCorrect(a, "又大") && !engine.isCorrect(a, ""));
const b = pi("不但聰明，而且努力");
check("照樣寫：需同時含『不但』『而且』", engine.isCorrect(b, "不但會唱歌，而且會跳舞") && !engine.isCorrect(b, "不但會唱歌") && !engine.isCorrect(b, "而且會跳舞"));
check("照樣寫：describeAnswer 顯示參考答案", engine.describeAnswer(a) === a.answer);
const plain = engine.realize({ id: "pl", type: "zhuyin", level: 1, tag: "basic", topic: "x", gen: () => ({ stem: "s", explain: "e", answer: "ㄕㄢ" }) });
check("一般填空題不帶 mustInclude 等欄位、行為不變", !("mustInclude" in plain) && !("minLen" in plain) && !("example" in plain) && engine.isCorrect(plain, "ㄕㄢ") && !engine.isCorrect(plain, "ㄕㄢㄕ"));

/* ---- 6. 填寫／選擇雙形式 ---- */
const pair = ["zhuyin", "hanzi", "homophone", "wrongchar"];
let dualOK = true; const dualInfo = [];
pair.forEach(bk => {
  const f = bank.all().filter(s => s.type === bk), m = bank.all().filter(s => s.type === bk + "_mc");
  const fi = engine.realize(f[0]), mi = engine.realize(m[0]);
  const okFill = typeof fi.answer === "string" && !fi.options && engine.isCorrect(fi, fi.answer) && !engine.isCorrect(fi, "ㄅㄅ");
  const okMc = Array.isArray(mi.options) && mi.options.length === 4 && Number.isInteger(mi.answer) && engine.isCorrect(mi, mi.answer) && !engine.isCorrect(mi, (mi.answer + 1) % 4) && mi.kind === "single";
  if (!okFill || !okMc || f.length !== m.length) dualOK = false;
  dualInfo.push(bk + ":" + f.length + "/" + m.length);
});
check("四種字詞題型都同時有 fill 與 single 形式（同資料、同題數）", dualOK, dualInfo.join(" "));
check("只勾 fill 形式＋照樣寫＋閱讀：可組卷、總分 100、無 _mc 題", (() => { const e = build({ types: ["zhuyin", "hanzi", "pattern", "reading"] }); return e.total === 100 && !e.items.some(i => /_mc$/.test(i.type)); })());
check("只勾 single 形式＋造句：可組卷、總分 100", (() => { const e = build({ types: ["zhuyin_mc", "hanzi_mc", "sentence"] }); return e.total === 100 && e.items.some(i => i.type === "sentence"); })());

/* ---- 7. 練習模式：造句可出、題組不出 ---- */
const pr = engine.buildExam({ mode: "practice", units, types: allKeys });
check("20 題練習：共 20 題、不含 reading", pr.items.length === 20 && !pr.items.some(i => i.type === "reading"));
const prS = engine.buildExam({ mode: "practice", units, types: ["sentence", "zhuyin"] });
check("20 題練習可含造句（逐題規則批改）", prS.items.some(i => i.type === "sentence") && prS.items.filter(i => i.type === "sentence").every(i => i.rulePts.length === i.rules.length));

/* ---- 8. 只重做錯題：題組整篇 ---- */
const resp = {}; ex.items.forEach(i => { const k = i.kind || i.type; resp[i.no] = k === "selfcheck" ? i.keywords.join("") + "是我們六年級常用的語詞。" : (k === "single" ? i.answer : String(i.answer)); });
const rd = ex.items.filter(i => i.type === "reading");
resp[rd[1].no] = (rd[1].answer + 1) % 4; resp[rd[3].no] = (rd[3].answer + 1) % 4;
const s8 = engine.summarize(ex, resp);
check("題組內兩題答錯 → wrong 兩題", s8.wrong.filter(i => i.type === "reading").length === 2);
const redo = engine.rebuildFromItems(ex, s8.wrong);
const rr = redo.items.filter(i => i.type === "reading");
check("重做錯題：整篇 5 題一起重出、題序連續、總分 100", rr.length === 5 && rr.every((i, k) => i.setIndex === k && i.setId === rr[0].setId) && redo.total === 100, "len=" + rr.length + " total=" + redo.total);

/* ---- 9. validateRaw 拒收 ---- */
const badBank = ExamEngine.createBank();
const mkSpec = (id, type, gen) => ({ id, type, level: 1, tag: "basic", gen });
const base = { stem: "s", explain: "e", keywords: ["甲"], sample: "範例句子在這裡。" };
const bad = [
  ["造句缺 sample", Object.assign({}, base, { sample: "" })],
  ["造句缺 keywords（0 個）", Object.assign({}, base, { keywords: [] })],
  ["造句 keywords 3 個", Object.assign({}, base, { keywords: ["a", "b", "c"] })],
  ["造句 keywords 非陣列", Object.assign({}, base, { keywords: "甲" })],
  ["造句 rubric 只有 2 條", Object.assign({}, base, { rubric: ["a", "b"] })],
  ["造句 rubric 6 條", Object.assign({}, base, { rubric: ["a", "b", "c", "d", "e", "f"] })],
  ["造句缺 explain", Object.assign({}, base, { explain: "" })]
].map((c, i) => mkSpec("bad-" + i, "sentence", () => c[1]));
const badSets = [
  mkSpec("bad-set-4q", "reading", () => ({ passage: "p", questions: [1, 2, 3, 4].map(() => ({ stem: "q", explain: "e", options: ["a", "b"], answer: 0 })) })),
  mkSpec("bad-set-nopassage", "reading", () => ({ passage: "", questions: [1, 2, 3, 4, 5].map(() => ({ stem: "q", explain: "e", options: ["a", "b"], answer: 0 })) })),
  mkSpec("bad-set-badanswer", "reading", () => ({ passage: "p", questions: [1, 2, 3, 4, 5].map(() => ({ stem: "q", explain: "e", options: ["a", "b"], answer: 9 })) }))
];
badBank.register("bad", "g", bad.concat(badSets));
const be = ExamEngine.create(cfg, badBank);
let rejected = 0;
bad.forEach(s => { try { be.realize(s); } catch (e) { rejected++; } });
badSets.forEach(s => { try { be.realizeSet(s); } catch (e) { rejected++; } });
check("壞 spec 全被拒收（" + (bad.length + badSets.length) + " 個）", rejected === bad.length + badSets.length, rejected + "/" + (bad.length + badSets.length));
const okSelf = be.realize(mkSpec("ok", "sentence", () => ({ stem: "s", explain: "e", keywords: ["甲"], sample: "範例句子在這裡。" })));
check("rubric 缺省 → 用 config.rubricDefault", okSelf.rubric.length === 3 && okSelf.answer === "範例句子在這裡。");
const noRub = ExamEngine.create(Object.assign({}, cfg, { types: cfg.types.map(t => t.key === "sentence" ? Object.assign({}, t, { rubricDefault: [] }) : t) }), badBank).realize(mkSpec("ok2", "sentence", () => ({ stem: "s", explain: "e", keywords: ["甲"], sample: "範例句子在這裡。" })));
check("rubric 可為 0 條（不顯示自評對照）", noRub.rubric.length === 0);

/* ---- 10. 舊行為：不含造句/題組/規則欄位的考卷 summarize 無新欄位 ---- */
const exOld = build({ types: ["zhuyin", "hanzi"] });
const sOld = engine.summarize(exOld, {});
check("不含造句的考卷：summarize 欄位與舊版相同（無新欄位）", Object.keys(sOld).sort().join() === "bySection,byTag,byType,byUnit,correctCount,count,details,score,total,wrong" && sOld.bySection.every(s => Object.keys(s).sort().join() === "earned,max,name,right,total,type"));

console.log("\n" + (fail ? "FAIL (" + fail + " failed, " + pass + " passed)" : "ALL PASS  (" + pass + " pass, 0 fail)"));
process.exit(fail ? 1 : 0);
