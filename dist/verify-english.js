/* 英語單字學習系統 Node 檢查腳本：node verify-english.js（在 dist 目錄執行） */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const results = [];
function check(name, fn) {
  try { const msg = fn(); results.push([true, name, msg || ""]); }
  catch (e) { results.push([false, name, e.message]); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "vocabulary.js"), "utf8"), sandbox, { filename: "vocabulary.js" });
const WORDS = sandbox.window.CORE_WORDS;
const P = require("./english-plan.js");
let plan;

check("字庫 365 字且不重複", () => {
  assert(WORDS.length === 365, "字數 " + WORDS.length);
  assert(new Set(WORDS.map(w => w.word)).size === 365, "有重複");
  return "365";
});

check("建立排程成功", () => { plan = P.buildPlan(WORDS); return plan.totalDays + " 學習日 / " + plan.weekCount + " 週"; });

check("73 個學習日、每日剛好 5 字", () => {
  assert(plan.days.length === 73, "天數 " + plan.days.length);
  plan.days.forEach(d => assert(d.words.length === 5, "Day " + d.day + " 字數 " + d.words.length));
  assert(P.TOTAL_WORDS / P.WORDS_PER_DAY === 73, "參數化計算不是 73");
});

check("365 字每字剛好 1 次、無缺漏", () => {
  const count = {};
  plan.days.forEach(d => d.words.forEach(w => { count[w.word] = (count[w.word] || 0) + 1; }));
  WORDS.forEach(w => assert(count[w.word] === 1, w.word + " 出現 " + (count[w.word] || 0) + " 次"));
  assert(Object.keys(count).length === 365, "字數不符");
});

check("familyDays 的字不與他日重疊", () => {
  Object.keys(P.FAMILY_DAYS).forEach(k => {
    const day = plan.days[Number(k) - 1];
    assert(day.words.map(w => w.word).join() === P.FAMILY_DAYS[k].join(), "Day " + k + " 內容不符");
    P.FAMILY_DAYS[k].forEach(word => {
      const hits = plan.days.filter(d => d.words.some(w => w.word === word)).map(d => d.day);
      assert(hits.length === 1 && hits[0] === Number(k), word + " 出現於 " + hits.join(","));
    });
  });
});

check("週結構：15 次週考、第 6/12/…天為週考、最後一週 3 學習日", () => {
  assert(plan.weeks.length === 15, "週數 " + plan.weeks.length);
  assert(plan.tasks.length === 88, "任務數 " + plan.tasks.length);
  for (let w = 1; w <= 14; w++) {
    assert(plan.weeks[w - 1].days.length === 5, "第 " + w + " 週學習日不是 5");
    assert(plan.weeks[w - 1].taskNo === 6 * w, "第 " + w + " 週週考不在第 " + 6 * w + " 天");
    assert(plan.tasks[6 * w - 1].type === "week", "任務 " + 6 * w + " 不是週考");
  }
  const last = plan.weeks[14];
  assert(last.days.length === 3 && last.firstDay === 71 && last.lastDay === 73, "最後一週結構錯誤");
  assert(last.words.length === 15, "最後一週字數");
  assert(plan.tasks[87].type === "week" && plan.tasks[87].week === 15, "最後任務不是第 15 週週考");
  assert(plan.tasks.filter(t => t.type === "day").length === 73, "學習日任務數");
  assert(plan.tasks.filter(t => t.type === "week").length === 15, "週考任務數");
  for (let w = 0; w < 14; w++) assert(plan.weeks[w].words.length === 25, "週字數");
});

const ctxFor = (rng, extra) => Object.assign({ all: WORDS, rng, canSpeak: true }, extra || {});
function checkQuestions(qs, label) {
  qs.forEach(q => { const err = P.validateQuestion(q); assert(!err, label + "：" + q.word + " " + err); });
}

check("小考 200 組：10 題、只含當天 5 字、每字 2 題且題型不同、選項合法、彼此有變化", () => {
  const sigs = new Set();
  for (let n = 0; n < 200; n++) {
    const d = plan.days[n % 73];
    const rng = P.makeRng(1000 + n);
    const qs = P.makeDailyQuiz(d.words, ctxFor(rng, { primary: WORDS.slice(0, 80) }));
    assert(qs.length === 10, "題數 " + qs.length);
    checkQuestions(qs, "Day " + d.day);
    const dayWords = new Set(d.words.map(w => w.word));
    const per = {};
    qs.forEach(q => { assert(dayWords.has(q.word), q.word + " 不屬於 Day " + d.day); (per[q.word] = per[q.word] || []).push(q.type); });
    d.words.forEach(w => { const t = per[w.word]; assert(t && t.length === 2 && t[0] !== t[1], w.word + " 題型 " + JSON.stringify(t)); });
    sigs.add(qs.map(q => q.type + ":" + q.word + ":" + (q.choices || []).join("/")).join("|"));
  }
  assert(sigs.size >= 190, "變化不足，只有 " + sigs.size + " 種");
  // 同一天連續 50 組也要有變化
  const same = new Set();
  for (let n = 0; n < 50; n++) same.add(JSON.stringify(P.makeDailyQuiz(plan.days[0].words, ctxFor(P.makeRng(5000 + n)))));
  assert(same.size >= 45, "同一天連出 50 組只有 " + same.size + " 種");
  return "200 組合法，" + sigs.size + " 種相異";
});

check("沒有語音時小考不出現聽音題", () => {
  for (let n = 0; n < 50; n++) {
    const qs = P.makeDailyQuiz(plan.days[n].words, { all: WORDS, rng: P.makeRng(n), canSpeak: false });
    assert(qs.length === 10, "題數");
    qs.forEach(q => assert(q.type !== "listen", "出現 listen"));
    checkQuestions(qs, "nospeech");
  }
});

check("干擾項不與正解同義（中文片段不重疊）", () => {
  for (let n = 0; n < 100; n++) {
    const d = plan.days[n % 73];
    const qs = P.makeDailyQuiz(d.words, ctxFor(P.makeRng(n)));
    qs.forEach(q => {
      if (!q.choices) return;
      const target = WORDS.find(w => w.word === q.word);
      q.choices.forEach(c => {
        if (c === q.answer) return;
        const other = q.type === "en2zh" ? WORDS.find(w => w.zh === c) : WORDS.find(w => w.word === c);
        assert(other && other.word !== target.word && !P.zhOverlap(other.zh, target.zh), q.word + " 的干擾項 " + c + " 與正解同義");
      });
    });
  }
});

check("週考 200 組：10 題為本週不同字、選項合法、有變化、可無限重生", () => {
  const sigs = new Set();
  for (let n = 0; n < 200; n++) {
    const w = plan.weeks[n % 15];
    const qs = P.makeWeeklyQuiz(w.words, ctxFor(P.makeRng(9000 + n)), null);
    assert(qs.length === 10, "題數 " + qs.length);
    checkQuestions(qs, "Week " + w.week);
    const set = new Set(qs.map(q => q.word));
    assert(set.size === 10, "有重複的字");
    const weekSet = new Set(w.words.map(x => x.word));
    qs.forEach(q => assert(weekSet.has(q.word), q.word + " 不屬於第 " + w.week + " 週"));
    assert(new Set(qs.map(q => q.type)).size >= 2, "題型未混合");
    sigs.add(w.week + JSON.stringify(qs));
  }
  assert(sigs.size >= 190, "變化不足 " + sigs.size);
  // 連續重生，與前一組盡量不同
  const lastWeek = plan.weeks[14];
  let prev = null;
  for (let n = 0; n < 30; n++) {
    const qs = P.makeWeeklyQuiz(lastWeek.words, ctxFor(P.makeRng(n)), prev);
    assert(qs.length === 10 && new Set(qs.map(q => q.word)).size === 10, "最後一週題數");
    if (prev) assert(qs.filter(q => prev.indexOf(q.word) >= 0).length <= 5, "");
    if (prev) assert(qs.map(q => q.word).sort().join() !== prev.slice().sort().join(), "與上一組抽字完全相同");
    prev = qs.map(q => q.word);
  }
  return sigs.size + " 種相異";
});

check("同義字：程式化找出所有共用中文的字組，拼字題接受組內任一字、拒絕不相干字", () => {
  const groups = new Set();
  WORDS.forEach(w => { const g = P.synonymsOf(w, WORDS); if (g.length > 1) groups.add(g.slice().sort().join("/")); });
  assert(groups.size >= 4, "只找到 " + groups.size + " 組");
  WORDS.forEach(w => {
    const q = P.makeDailyQuiz([w, WORDS[300], WORDS[301], WORDS[302], WORDS[303]], ctxFor(P.makeRng(1)));
    const sp = { type: "spell", word: w.word, zh: w.zh, answer: w.word, accept: P.synonymsOf(w, WORDS) };
    P.synonymsOf(w, WORDS).forEach(x => assert(P.isSpellCorrect(sp, x) && P.isSpellCorrect(sp, "  " + x.toUpperCase() + " "), w.word + " 應接受 " + x));
    assert(!P.isSpellCorrect(sp, "zzqx") && !P.isSpellCorrect(sp, ""), "不相干字被判對");
  });
  const unrelated = WORDS.find(x => x.word === "apple");
  assert(!P.isSpellCorrect({ answer: "tall", accept: P.synonymsOf(WORDS.find(x => x.word === "tall"), WORDS) }, "apple"), "tall 題輸入 apple 應錯");
  // 任何一組題目中，有同義字共存時不得出現兩個互相重疊的拼字題（避免同一答案重複計分）
  const byName = {}; WORDS.forEach(w => { byName[w.word] = w; });
  const overlapFree = (qs) => { const sp = qs.filter(q => q.type === "spell"); for (let i = 0; i < sp.length; i++) for (let j = i + 1; j < sp.length; j++) if (P.zhOverlap(byName[sp[i].word].zh, byName[sp[j].word].zh)) return false; return true; };
  const syn = ["tall", "high", "question", "problem", "work", "job", "road", "way"].map(n => byName[n]);
  for (let n = 0; n < 300; n++) {
    const rng = P.makeRng(n);
    const qd = P.makeDailyQuiz(syn.slice(0, 5), ctxFor(rng)); assert(qd.length === 10 && overlapFree(qd), "daily 同義重疊");
    const qw = P.makeWeeklyQuiz(syn.concat(WORDS.slice(20, 30)), ctxFor(rng)); assert(qw.length === 10 && overlapFree(qw), "weekly 同義重疊");
    const qr = P.makeReview(syn.concat(WORDS.slice(20, 30)), {}, ctxFor(rng)); assert(qr.length === 10 && overlapFree(qr), "review 同義重疊");
    [qd, qw, qr].forEach(qs => checkQuestions(qs, "syn"));
  }
  return Array.from(groups).join("  ");
});

check("聽音題換題：同一字改英翻中/中翻英、題數與選項合法、不改其他題", () => {
  for (let n = 0; n < 300; n++) {
    const d = plan.days[n % 73];
    const qs = P.makeDailyQuiz(d.words, ctxFor(P.makeRng(n)));
    qs.forEach((q, i) => {
      if (q.type !== "listen") return;
      const r = P.replaceListen(qs, i, ctxFor(P.makeRng(n + 7)));
      assert(r.word === q.word && (r.type === "en2zh" || r.type === "zh2en"), "換題結果錯誤 " + r.type);
      assert(!P.validateQuestion(r), "換題後不合法");
      const copy = qs.slice(); copy[i] = r;
      assert(copy.length === 10, "題數改變");
      const types = copy.filter(x => x.word === q.word).map(x => x.type);
      assert(types.length === 2 && types[0] !== types[1], "換題後同字題型相同 " + types);
    });
  }
});

check("通過判定：全對才通過（PASS_RATE=1），可改 0.8", () => {
  assert(P.PASS_RATE === 1, "PASS_RATE 不是 1");
  assert(P.isPass(10, 10) === true, "10/10 應通過");
  assert(P.isPass(9, 10) === false, "9/10 不應通過");
  assert(P.isPass(0, 10) === false, "0/10");
  assert(P.isPass(8, 10, 0.8) === true && P.isPass(7, 10, 0.8) === false, "0.8 門檻");
  assert(P.isPass(0, 0) === false, "0 題不得通過");
});

check("複習：只抽已亮燈學習日的字、優先抽答錯字、不足 10 字抽全部、不改動進度", () => {
  const state = { completed: { 1: true, 2: true, 4: true, 5: true }, weekPassed: {} };
  const snapshot = JSON.stringify(state);
  const learned = P.learnedWords(plan, state);
  assert(learned.length === 20, "已學字數 " + learned.length);
  const learnedSet = new Set(learned.map(w => w.word));
  const wrong = { [learned[3].word]: 3, [learned[7].word]: 1 };
  for (let n = 0; n < 200; n++) {
    const qs = P.makeReview(learned, wrong, ctxFor(P.makeRng(n), { primary: learned }));
    assert(qs.length === 10, "題數 " + qs.length);
    checkQuestions(qs, "review");
    assert(new Set(qs.map(q => q.word)).size === 10, "有重複字");
    qs.forEach(q => assert(learnedSet.has(q.word), "未學過的字出現：" + q.word));
    assert(qs.some(q => q.word === learned[3].word) && qs.some(q => q.word === learned[7].word), "答錯字沒有優先");
  }
  const few = P.makeReview(learned.slice(0, 5), {}, ctxFor(P.makeRng(1)));
  assert(few.length === 5, "不足 10 字應抽全部，實際 " + few.length);
  const manyWrong = {};
  learned.forEach(w => { manyWrong[w.word] = 1; });
  const qs2 = P.makeReview(learned, manyWrong, ctxFor(P.makeRng(2)));
  assert(qs2.length === 10 && new Set(qs2.map(q => q.word)).size === 10, "全部都錯過時題數");
  assert(JSON.stringify(state) === snapshot, "複習改動了進度資料");
});

check("解鎖規則：依序通過才解鎖下一個", () => {
  const state = { completed: {}, weekPassed: {} };
  assert(P.isUnlocked(plan, state, 1) && !P.isUnlocked(plan, state, 2), "初始");
  assert(P.nextTask(plan, state).no === 1, "next 應為第 1 任務");
  for (let d = 1; d <= 5; d++) state.completed[d] = true;
  assert(P.isUnlocked(plan, state, 6) && !P.isUnlocked(plan, state, 7), "第 5 天後週考解鎖但第 7 不解鎖");
  assert(P.nextTask(plan, state).type === "week", "next 應為週考");
  state.weekPassed[1] = true;
  assert(P.nextTask(plan, state).day === 6, "週考後應為 Day 6");
});

check("app.js 與 index.html 的接線與版本字串", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  ["styles.css", "vocabulary.js", "english-plan.js", "app.js"].forEach(f => {
    assert(new RegExp(f.replace(".", "\\.") + "\\?v=\\d+").test(html), "index.html 的 " + f + " 缺版本查詢字串");
  });
  assert(html.indexOf("english-plan.js") < html.indexOf("app.js?v"), "english-plan.js 必須在 app.js 之前載入");
  assert(!/365\s*天/.test(html), "index.html 仍有「365 天」字樣");
  const app = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
  assert(!/Day 365/.test(app) && !/週複習題庫|每 7 天|7 天複習/.test(app), "app.js 仍有舊流程字樣");
  assert(/schemaVersion/.test(app) && /backup-v1/.test(app), "app.js 缺 schemaVersion / 備份");
});

check("sw.js：CACHE 升版且 ASSETS 檔案皆存在", () => {
  const sw = fs.readFileSync(path.join(__dirname, "sw.js"), "utf8");
  const m = /CACHE="meihao-learning-center-v(\d+)"/.exec(sw);
  assert(m && Number(m[1]) >= 19, "CACHE 版本 " + (m && m[1]));
  const assets = JSON.parse(/ASSETS=(\[[^\]]*\])/.exec(sw)[1]);
  assert(assets.indexOf("./english-plan.js") >= 0, "ASSETS 缺 english-plan.js");
  const missing = assets.filter(a => {
    if (a === "./") return false;
    const p = path.join(__dirname, a);
    return !fs.existsSync(p);
  });
  assert(missing.length === 0, "不存在的檔案：" + missing.join(","));
  return assets.length + " 項皆存在，v" + m[1];
});

let failed = 0;
results.forEach(([ok, name, msg]) => {
  if (!ok) failed++;
  console.log((ok ? "PASS" : "FAIL") + "  " + name + (msg ? "  -> " + msg : ""));
});
console.log(failed ? "\n" + failed + " 項失敗" : "\n全部 PASS（" + results.length + " 項）");
process.exit(failed ? 1 : 0);
