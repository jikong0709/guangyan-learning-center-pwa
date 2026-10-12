/* 引擎層驗證：selfcheck 自評題、閱讀題組、scoring none/self、填寫/選擇雙形式。
   執行：node verify-selfcheck.js
   使用 grade6-chinese-lab 的 config 與假題庫，並加入幾個刻意壞掉的 spec 驗證 validateRaw。 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
globalThis.window = globalThis;
const dist = path.join(__dirname, "..");
function load(rel) { const f = path.join(dist, rel); vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
load("exam-engine/kit.js"); load("exam-engine/engine.js");
const warns = []; console.warn = function (m) { warns.push(String(m)); };

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log("PASS  " + name); } else { fail++; console.log("FAIL  " + name + (detail ? "  -> " + detail : "")); } }

/* ---- 載入 lab config + 題庫 ---- */
globalThis.ExamBank = ExamEngine.createBank();
load("courses/grade6-chinese-lab/config.js");
load("courses/grade6-chinese-lab/banks/lab-bank.js");
const cfg = globalThis.ExamConfig, bank = globalThis.ExamBank;
const engine = ExamEngine.create(cfg, bank);
const units = cfg.versions.lab.units;
const allKeys = cfg.types.map(t => t.key);
const build = (extra) => engine.buildExam(Object.assign({ mode: "score", units: units.slice(0, 1), types: allKeys, levelMin: 1, levelMax: 5 }, extra || {}));
const autoKeys = allKeys.filter(k => k !== "sentence");

/* ---- 1. 標準卷 ---- */
const ex = build();
check("全選題型：總分剛好 100（自評附加題不計入）", ex.total === 100, "total=" + ex.total);
const autoPts = ex.items.filter(i => !i.noCount).reduce((a, i) => a + i.points, 0);
check("100 分全部由自動批改題組成", autoPts === 100 && ex.items.filter(i => i.noCount).every(i => (i.kind || i.type) === "selfcheck"));
const secs = ex.sections.map(s => s.type);
check("大題順序同 config.types（造句最後）", JSON.stringify(secs) === JSON.stringify(allKeys.filter(k => secs.indexOf(k) >= 0)) && secs[secs.length - 1] === "sentence", secs.join(","));
const std = { zhuyin: [4, 2], zhuyin_mc: [4, 2], hanzi: [4, 2], hanzi_mc: [4, 2], homophone: [3, 4], homophone_mc: [3, 4], wrongchar: [3, 4], wrongchar_mc: [3, 4], reading: [5, 4] };
check("標準版型題數×每題分 與 config 相同", Object.keys(std).every(k => { const s = ex.sections.find(x => x.type === k); return s && s.count === std[k][0] && s.each === std[k][1]; }));
const sc = ex.sections.find(s => s.type === "sentence");
check("造句大題：self=true、counted=false、2 題、每題 5 分", sc && sc.self === true && sc.counted === false && sc.count === 2 && sc.each === 5);
check("每題 rubricPts 長度＝rubric 且加總＝題分", sc.items.every(i => i.rubricPts.length === i.rubric.length && i.rubricPts.reduce((a, b) => a + b, 0) === i.points));
check("rubricPts 5 分/4 條 = [2,1,1,1]", JSON.stringify(sc.items[0].rubricPts) === "[2,1,1,1]", JSON.stringify(sc.items[0].rubricPts));
check("造句有 keywords、sample、rubric（預設 4 條）", sc.items.every(i => i.keywords.length >= 1 && i.sample && i.rubric.length === 4));
check("題號連續 1..N", ex.items.every((i, k) => i.no === k + 1));

/* ---- 2. 題組不被拆散（多次重抽） ---- */
let setOK = true, totalOK = true;
for (let n = 0; n < 60; n++) {
  const e = build();
  if (e.total !== 100) totalOK = false;
  const rd = e.items.filter(i => i.type === "reading");
  if (rd.length !== 5) setOK = false;
  rd.forEach((i, k) => { if (i.setIndex !== k || i.setId !== rd[0].setId || i.passage !== rd[0].passage || i.no !== rd[0].no + k) setOK = false; });
}
check("60 次抽卷：閱讀 5 題同一篇、題序連續、setIndex 0..4", setOK);
check("60 次抽卷：總分皆為 100", totalOK);

/* ---- 3. planScore：所有自動題型子集，閱讀題數為 setSize 倍數 ---- */
let planOK = true, multOK = true, n = 0;
for (let m = 1; m < (1 << autoKeys.length); m++) {
  const sub = autoKeys.filter((k, i) => m & (1 << i));
  const p = engine.planScore(sub, null); n++;
  if (!p) { planOK = false; continue; }
  const tot = sub.reduce((a, k) => a + p[k].n * p[k].p, 0);
  if (tot !== 100) planOK = false;
  if (p.reading && p.reading.n % 5 !== 0) multOK = false;
}
check("planScore 全部 " + n + " 個子集：總分 100", planOK);
check("planScore：reading 題數皆為 5 的倍數", multOK);

/* ---- 4. 批改與 summarize ---- */
function perfect(e) { const r = {}; e.items.forEach(i => { const k = i.kind || i.type; if (k === "selfcheck") r[i.no] = i.keywords.join("") + "，這是我寫的句子。"; else if (k === "single") r[i.no] = i.answer; else r[i.no] = String(i.answer); }); return r; }
const resp = perfect(ex);
let sm = engine.summarize(ex, resp);
check("全對、造句未自評：score=100 / total=100", sm.score === 100 && sm.total === 100, sm.score + "/" + sm.total);
check("附加自評：hasSelf、extraTotal=10、extraScore=0、selfTotal=0", sm.hasSelf === true && sm.extraTotal === 10 && sm.extraScore === 0 && sm.selfTotal === 0);
check("count 不含自評題；wrong 為空", sm.count === ex.items.length - 2 && sm.wrong.length === 0 && sm.correctCount === sm.count);
check("byType/byTag/byUnit 不含 sentence", !sm.byType.sentence && Object.keys(sm.byUnit).every(u => sm.byUnit[u].total === sm.count));
const marks = {}; ex.sections.find(s => s.type === "sentence").items.forEach(i => { marks[i.no] = i.rubric.map(() => true); });
sm = engine.summarize(ex, resp, marks);
check("造句全勾：extraScore=10，但 score 仍為 100（不併入合計）", sm.extraScore === 10 && sm.score === 100 && sm.total === 100);
const sentSec = sm.bySection.find(s => s.type === "sentence");
check("bySection 造句：self、counted=false、earned=10", sentSec && sentSec.self === true && sentSec.counted === false && sentSec.earned === 10);
const half = {}; Object.keys(marks).forEach(k => { half[k] = marks[k].map((v, i) => i === 0); });
sm = engine.summarize(ex, resp, half);
check("只勾第 1 條：每題得 rubricPts[0]=2 分，共 4", sm.extraScore === 4, "extra=" + sm.extraScore);
const noWrite = Object.assign({}, resp); sc.items.forEach(i => { delete noWrite[i.no]; });
sm = engine.summarize(ex, noWrite, marks);
check("沒寫句子即使勾選也不給分", sm.extraScore === 0);
sm = engine.summarize(ex, {});
check("全未作答：score=0、wrong 數＝自動題數", sm.score === 0 && sm.wrong.length === ex.items.length - 2);

/* ---- 5. 語詞檢查 ---- */
const kwItem = sc.items.find(i => i.keywords.length === 2) || sc.items[0];
const ck = engine.checkKeywords({ keywords: ["發現", "書包"] }, "我 發現　書包壞了");
check("checkKeywords：兩詞都有 → found 皆 true（容忍空白）", ck.length === 2 && ck.every(x => x.found));
const ck2 = engine.checkKeywords({ keywords: ["發現", "書包"] }, "我看到鉛筆盒");
check("checkKeywords：缺詞 → found 皆 false；空字串全 false", ck2.every(x => !x.found) && engine.checkKeywords({ keywords: ["專心"] }, "").every(x => !x.found));
check("checkKeywords：無 keywords → 空陣列", engine.checkKeywords({}, "abc").length === 0);

/* ---- 6. 填寫／選擇雙形式 ---- */
const pair = ["zhuyin", "hanzi", "homophone", "wrongchar"];
let dualOK = true; const dualInfo = [];
pair.forEach(b => {
  const f = bank.all().filter(s => s.type === b), m = bank.all().filter(s => s.type === b + "_mc");
  const fi = engine.realize(f[0]), mi = engine.realize(m[0]);
  const okFill = typeof fi.answer === "string" && !fi.options && engine.isCorrect(fi, fi.answer) && !engine.isCorrect(fi, "ㄅㄅ");
  const okMc = Array.isArray(mi.options) && mi.options.length === 4 && Number.isInteger(mi.answer) && engine.isCorrect(mi, mi.answer) && !engine.isCorrect(mi, (mi.answer + 1) % 4) && (mi.kind === "single");
  if (!okFill || !okMc || f.length !== m.length) dualOK = false;
  dualInfo.push(b + ":" + f.length + "/" + m.length);
});
check("四種字詞題型都同時有 fill 與 single 形式（同資料、同題數）", dualOK, dualInfo.join(" "));
const onlyFill = build({ types: ["zhuyin", "hanzi", "reading"] });
check("只勾 fill 形式＋閱讀：可組卷、總分 100、無 single 形式的字詞題", onlyFill.total === 100 && !onlyFill.items.some(i => /_mc$/.test(i.type)));
const onlyMc = build({ types: ["zhuyin_mc", "hanzi_mc", "sentence"] });
check("只勾 single 形式＋造句：可組卷、總分 100", onlyMc.total === 100 && onlyMc.items.some(i => i.type === "sentence") && onlyMc.items.filter(i => !i.noCount).every(i => /_mc$/.test(i.type)));
let threw = false; try { build({ types: ["sentence"] }); } catch (e) { threw = /至少一種計分題型/.test(e.message); }
check("只勾造句（無計分題型）→ 明確錯誤訊息", threw);

/* ---- 7. 練習模式不含自評與題組 ---- */
const pr = engine.buildExam({ mode: "practice", units, types: allKeys });
check("20 題練習：不含 reading / sentence，共 20 題", pr.items.length === 20 && !pr.items.some(i => i.type === "reading" || i.type === "sentence"));

/* ---- 8. 只重做錯題：題組整篇重做 ---- */
const wrongResp = Object.assign({}, resp); const rd = ex.items.filter(i => i.type === "reading");
wrongResp[rd[1].no] = (rd[1].answer + 1) % 4; wrongResp[rd[3].no] = (rd[3].answer + 1) % 4;
sm = engine.summarize(ex, wrongResp);
check("題組內兩題答錯 → wrong 兩題", sm.wrong.length === 2 && sm.wrong.every(i => i.type === "reading"));
const redo = engine.rebuildFromItems(ex, sm.wrong);
const rr = redo.items;
check("重做錯題：整篇 5 題一起重出、題序連續、總分 100", rr.length === 5 && rr.every((i, k) => i.setIndex === k && i.setId === rr[0].setId) && redo.total === 100, "len=" + rr.length + " total=" + redo.total);

/* ---- 9. validateRaw 拒收（刻意壞掉的 spec） ---- */
const badBank = ExamEngine.createBank();
const bad = [];
const mk = (id, type, gen) => ({ id, type, level: 1, tag: "basic", gen });
const baseSelf = { stem: "s", explain: "e", keywords: ["甲"], sample: "範例", rubric: ["a", "b", "c"] };
const cases = [
  ["selfcheck 缺 sample", "sentence", Object.assign({}, baseSelf, { sample: "" })],
  ["selfcheck rubric 只有 2 條", "sentence", Object.assign({}, baseSelf, { rubric: ["a", "b"] })],
  ["selfcheck rubric 6 條", "sentence", Object.assign({}, baseSelf, { rubric: ["a", "b", "c", "d", "e", "f"] })],
  ["selfcheck keywords 3 個", "sentence", Object.assign({}, baseSelf, { keywords: ["a", "b", "c"] })],
  ["selfcheck keywords 非陣列", "sentence", Object.assign({}, baseSelf, { keywords: "甲" })],
  ["selfcheck 缺 explain", "sentence", Object.assign({}, baseSelf, { explain: "" })]
];
cases.forEach((c, i) => { bad.push(mk("bad-" + i, c[1], () => c[2])); });
bad.push(mk("bad-set-4q", "reading", () => ({ passage: "p", questions: [1, 2, 3, 4].map(() => ({ stem: "q", explain: "e", options: ["a", "b"], answer: 0 })) })));
bad.push(mk("bad-set-nopassage", "reading", () => ({ passage: "", questions: [1, 2, 3, 4, 5].map(() => ({ stem: "q", explain: "e", options: ["a", "b"], answer: 0 })) })));
bad.push(mk("bad-set-q-noanswer", "reading", () => ({ passage: "p", questions: [1, 2, 3, 4, 5].map(() => ({ stem: "q", explain: "e", options: ["a", "b"], answer: 9 })) })));
badBank.register("bad", "g", bad);
const badEngine = ExamEngine.create(cfg, badBank);
let rejected = 0;
bad.forEach(s => { try { if (s.type === "reading") badEngine.realizeSet(s); else badEngine.realize(s); } catch (e) { rejected++; } });
check("壞 spec 全被拒收（" + bad.length + " 個）", rejected === bad.length, rejected + "/" + bad.length);
const okSelf = badEngine.realize(mk("ok-self", "sentence", () => ({ stem: "s", explain: "e", keywords: [], sample: "範例", rubric: undefined })));
check("rubric 缺省 → 用 config.rubricDefault；keywords 可為空陣列", okSelf.rubric.length === 4 && okSelf.keywords.length === 0 && okSelf.answer === "範例");

/* ---- 10. scoring:"self"（甲案）仍可由 config 切換 ---- */
const cfgSelf = JSON.parse(JSON.stringify(cfg, (k, v) => (typeof v === "function" ? undefined : v)));
cfgSelf.normalizeText = cfg.normalizeText;
cfgSelf.types.find(t => t.key === "sentence").scoring = "self";
cfgSelf.types.find(t => t.key === "reading").stdPts = 2; /* 讓 90 自動 + 10 自評剛好湊滿 */
const engSelf = ExamEngine.create(cfgSelf, bank);
const exS = engSelf.buildExam({ mode: "score", units: units.slice(0, 1), types: allKeys, levelMin: 1, levelMax: 5 });
check("scoring:self：total=100，其中造句 counted=true", exS.total === 100 && exS.sections.find(s => s.type === "sentence").counted === true);
const rS = perfect(exS);
let sS = engSelf.summarize(exS, rS);
check("scoring:self 未自評：autoScore 90、selfScore 0、score 90、autoTotal 90、selfTotal 10", sS.autoScore === 90 && sS.selfScore === 0 && sS.score === 90 && sS.autoTotal === 90 && sS.selfTotal === 10, JSON.stringify([sS.autoScore, sS.selfScore, sS.score, sS.autoTotal, sS.selfTotal]));
const mS = {}; exS.items.filter(i => i.type === "sentence").forEach(i => { mS[i.no] = i.rubric.map(() => true); });
sS = engSelf.summarize(exS, rS, mS);
check("scoring:self 全勾：selfScore 10、score 100、自動與自評小計分開", sS.selfScore === 10 && sS.score === 100 && sS.autoScore === 90);

/* ---- 11. 舊行為：不含自評的考卷 summarize 不出現新欄位 ---- */
const exOld = build({ types: ["zhuyin", "hanzi"] });
const sOld = engine.summarize(exOld, {});
check("不含自評的考卷：summarize 無 hasSelf/autoScore 等新欄位", !("hasSelf" in sOld) && !("autoScore" in sOld) && sOld.bySection.every(s => !("self" in s) && !("counted" in s)));

console.log("\n" + (fail ? "FAIL (" + fail + " failed, " + pass + " passed)" : "ALL PASS  (" + pass + " pass, 0 fail)"));
process.exit(fail ? 1 : 0);
