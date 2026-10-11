/* 英語單字學習系統：排程與出題邏輯（瀏覽器與 Node 皆可載入）。
   瀏覽器：window.EnglishPlan；Node：require("./english-plan.js")。
   之後擴充字庫（國中 2000 字）只需調整 TOTAL_WORDS / WORDS_PER_DAY 並提供字庫。 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EnglishPlan = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TOTAL_WORDS = 365;
  var WORDS_PER_DAY = 5;
  var LEARN_DAYS_PER_WEEK = 5; // 每週 5 個學習日 + 第 6 天週考
  var QUIZ_SIZE = 10;
  var WEEKLY_SIZE = 10;
  var PASS_RATE = 1; // 小考／週考：全對才通過；之後要改 80% 只需改成 0.8
  var SAMPLE_PASS_SCORE = 80; // 進度抽考：滿分 100，80 分以上通過（與 PASS_RATE 獨立）
  var SAMPLE_SIZE = 10;
  var FAMILY_DAYS = {
    1: ["bug", "hug", "mug", "rug", "jug"],
    2: ["cake", "lake", "make", "take", "wake"],
    3: ["ball", "call", "fall", "tall", "wall"]
  };
  var TYPES = ["en2zh", "zh2en", "spell", "listen"];

  function shuffle(a, rng) {
    rng = rng || Math.random;
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function makeRng(seed) { // mulberry32，測試用可重現亂數
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- 排程 ---------- */
  function buildPlan(words, opts) {
    opts = opts || {};
    var total = opts.totalWords || TOTAL_WORDS;
    var per = opts.wordsPerDay || WORDS_PER_DAY;
    var perWeek = opts.learnDaysPerWeek || LEARN_DAYS_PER_WEEK;
    var fam = opts.familyDays || FAMILY_DAYS;
    if (!words || words.length !== total) throw new Error("字庫數量應為 " + total + "，目前為 " + (words ? words.length : 0));
    if (total % per !== 0) throw new Error("TOTAL_WORDS 必須能被 WORDS_PER_DAY 整除");
    var totalDays = total / per;
    var byWord = {};
    words.forEach(function (w) {
      if (byWord[w.word]) throw new Error("字庫含重複單字：" + w.word);
      byWord[w.word] = w;
    });
    var dayWords = {}, famUsed = {};
    Object.keys(fam).forEach(function (k) {
      var d = Number(k), list = fam[k];
      if (!(d >= 1 && d <= totalDays)) throw new Error("familyDays 日期超出範圍：" + k);
      if (list.length !== per) throw new Error("familyDays 第 " + d + " 天字數不是 " + per);
      dayWords[d] = list.map(function (word) {
        if (!byWord[word]) throw new Error("familyDays 的字不在字庫：" + word);
        if (famUsed[word]) throw new Error("familyDays 字重複：" + word);
        famUsed[word] = true;
        return byWord[word];
      });
    });
    var rest = words.filter(function (w) { return !famUsed[w.word]; });
    var cursor = 0;
    var days = [];
    for (var d = 1; d <= totalDays; d++) {
      var list = dayWords[d];
      if (!list) { list = rest.slice(cursor, cursor + per); cursor += per; }
      days.push({ day: d, words: list, topic: list[0].topic, week: Math.ceil(d / perWeek), family: !!fam[d] });
    }
    if (cursor !== rest.length) throw new Error("排程後仍有字未分配");
    var weekCount = Math.ceil(totalDays / perWeek);
    var weeks = [], tasks = [], no = 0;
    for (var w = 1; w <= weekCount; w++) {
      var first = (w - 1) * perWeek + 1, last = Math.min(w * perWeek, totalDays);
      var wDays = [], wWords = [];
      for (var x = first; x <= last; x++) {
        wDays.push(x);
        days[x - 1].words.forEach(function (it) { wWords.push(it); });
        no++;
        var t = { no: no, type: "day", day: x, week: w };
        tasks.push(t); days[x - 1].taskNo = no;
      }
      no++;
      var wt = { no: no, type: "week", week: w };
      tasks.push(wt);
      weeks.push({ week: w, firstDay: first, lastDay: last, days: wDays, words: wWords, taskNo: no });
    }
    return { totalWords: total, wordsPerDay: per, totalDays: totalDays, weekCount: weekCount, days: days, weeks: weeks, tasks: tasks };
  }

  function isTaskPassed(state, task) {
    return task.type === "day" ? !!(state.completed && state.completed[task.day]) : !!(state.weekPassed && state.weekPassed[task.week]);
  }
  function isUnlocked(plan, state, taskNo) {
    for (var i = 0; i < taskNo - 1; i++) if (!isTaskPassed(state, plan.tasks[i])) return false;
    return true;
  }
  function nextTask(plan, state) {
    for (var i = 0; i < plan.tasks.length; i++) if (!isTaskPassed(state, plan.tasks[i])) return plan.tasks[i];
    return plan.tasks[plan.tasks.length - 1];
  }
  function allDone(plan, state) {
    return plan.tasks.every(function (t) { return isTaskPassed(state, t); });
  }
  function learnedWords(plan, state) {
    var out = [];
    plan.days.forEach(function (d) { if (state.completed && state.completed[d.day]) d.words.forEach(function (w) { out.push(w); }); });
    return out;
  }

  /* ---------- 判定 ---------- */
  function isPass(correct, total, rate) {
    rate = rate == null ? PASS_RATE : rate;
    if (!total) return false;
    return correct >= Math.ceil(total * rate - 1e-9);
  }

  /* ---------- 出題 ---------- */
  function segs(zh) {
    return String(zh).split(/[；;、，,]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function zhOverlap(a, b) {
    var sa = segs(a), sb = segs(b);
    return sa.some(function (s) { return sb.indexOf(s) >= 0; });
  }
  function synonymsOf(target, all) { // 與 target 共用任一中文片段的所有字（含自己）
    var out = [target.word];
    (all || []).forEach(function (w) { if (w.word !== target.word && zhOverlap(w.zh, target.zh)) out.push(w.word); });
    return out;
  }
  function isSpellCorrect(q, input) {
    var v = String(input == null ? "" : input).trim().toLowerCase();
    if (!v) return false;
    var list = q.accept && q.accept.length ? q.accept : [q.answer];
    return list.some(function (w) { return w.toLowerCase() === v; });
  }
  function hasSynonymIn(word, setWords, all) { // 同一組題目裡是否還有它的同義字
    var byName = {};
    (all || []).forEach(function (w) { byName[w.word] = w; });
    var me = byName[word];
    if (!me) return false;
    return setWords.some(function (o) { return o !== word && byName[o] && zhOverlap(byName[o].zh, me.zh); });
  }
  function availableTypes(ctx) {
    return ctx.canSpeak === false ? TYPES.filter(function (t) { return t !== "listen"; }) : TYPES.slice();
  }
  function ctxOf(ctx) {
    ctx = ctx || {};
    return { all: ctx.all || [], primary: ctx.primary || null, rng: ctx.rng || Math.random, canSpeak: ctx.canSpeak !== false };
  }

  function pickDistractors(target, field, ctx, count) {
    var rng = ctx.rng;
    function valid(w) { return w.word !== target.word && !zhOverlap(w.zh, target.zh); }
    var cands = ctx.primary ? ctx.primary.filter(valid) : [];
    if (cands.length < 12) cands = ctx.all.filter(valid);
    function score(w) {
      return (w.topic === target.topic ? 2 : 0) + (/的$/.test(w.zh) === /的$/.test(target.zh) ? 1 : 0);
    }
    var ranked = shuffle(cands, rng).sort(function (a, b) { return score(b) - score(a); }).slice(0, 10);
    ranked = shuffle(ranked, rng);
    var out = [], seen = {};
    seen[target[field]] = true;
    for (var i = 0; i < ranked.length && out.length < count; i++) {
      var text = ranked[i][field];
      if (seen[text]) continue;
      seen[text] = true; out.push(text);
    }
    if (out.length < count) { // 保底：從全字庫補
      var more = shuffle(ctx.all.filter(valid), rng);
      for (var j = 0; j < more.length && out.length < count; j++) {
        var t2 = more[j][field];
        if (seen[t2]) continue;
        seen[t2] = true; out.push(t2);
      }
    }
    return out;
  }

  function makeQuestion(type, target, ctx) {
    var q = { type: type, word: target.word, zh: target.zh };
    if (type === "spell") { q.answer = target.word; q.accept = synonymsOf(target, ctx.all); return q; }
    var field = type === "en2zh" ? "zh" : "word";
    var answer = target[field];
    var wrongs = pickDistractors(target, field, ctx, 3);
    q.answer = answer;
    q.choices = shuffle([answer].concat(wrongs), ctx.rng);
    return q;
  }

  /* 小考：當天 5 字 × 每字 2 題（題型不同）= 10 題，順序隨機 */
  function makeDailyQuiz(dayWords, ctx) {
    ctx = ctxOf(ctx);
    var types = availableTypes(ctx), out = [];
    var names = dayWords.map(function (w) { return w.word; });
    dayWords.forEach(function (w) {
      var mine = hasSynonymIn(w.word, names, ctx.all) ? types.filter(function (t) { return t !== "spell"; }) : types;
      shuffle(mine, ctx.rng).slice(0, 2).forEach(function (t) { out.push(makeQuestion(t, w, ctx)); });
    });
    return shuffle(out, ctx.rng);
  }

  /* 依序輪流分配題型，確保題型混合 */
  function mixedQuestions(list, ctx) {
    var types = shuffle(availableTypes(ctx), ctx.rng);
    var names = list.map(function (w) { return w.word; });
    return shuffle(list, ctx.rng).map(function (w, i) {
      var t = types[i % types.length];
      if (t === "spell" && hasSynonymIn(w.word, names, ctx.all)) { // 同組有同義字：拼字題會讓答案互相重疊，改用選擇題
        var alt = types.filter(function (x) { return x !== "spell"; });
        t = alt[i % alt.length];
      }
      return makeQuestion(t, w, ctx);
    });
  }

  /* 週考：本週不同字抽 10 個，每字 1 題；prevWords 為上一組的字，盡量避開 */
  function makeWeeklyQuiz(weekWords, ctx, prevWords) {
    ctx = ctxOf(ctx);
    var prev = {};
    (prevWords || []).forEach(function (w) { prev[w] = true; });
    var fresh = shuffle(weekWords.filter(function (w) { return !prev[w.word]; }), ctx.rng);
    var old = shuffle(weekWords.filter(function (w) { return prev[w.word]; }), ctx.rng);
    var picked = fresh.concat(old).slice(0, Math.min(WEEKLY_SIZE, weekWords.length));
    return mixedQuestions(picked, ctx);
  }

  /* 聽不到聲音時：把聽音題換成同一個字的英翻中或中翻英（不計對錯） */
  function replaceListen(questions, i, ctx) {
    ctx = ctxOf(ctx);
    var q = questions[i], target = ctx.all.filter(function (w) { return w.word === q.word; })[0];
    var used = questions.filter(function (x, j) { return j !== i && x.word === q.word; }).map(function (x) { return x.type; });
    var opts = ["en2zh", "zh2en"].filter(function (t) { return used.indexOf(t) < 0; });
    if (!opts.length) opts = ["en2zh", "zh2en"];
    return makeQuestion(shuffle(opts, ctx.rng)[0], target, ctx);
  }

  /* 進度抽考（複習）：已學字隨機抽 10 個（不足抽全部）。
     曾答錯的字優先（錯越多越優先），其餘隨機並盡量避開上一次用過的字 */
  function makeSampleExam(learned, wrong, ctx, prevWords) {
    ctx = ctxOf(ctx);
    wrong = wrong || {};
    var prev = {};
    (prevWords || []).forEach(function (w) { prev[w] = true; });
    var size = Math.min(SAMPLE_SIZE, learned.length);
    var pool = shuffle(learned, ctx.rng);
    var wrongList = pool.filter(function (w) { return wrong[w.word] > 0; });
    var picked = [];
    if (wrongList.length <= size) picked = wrongList.slice();
    else {
      var bag = wrongList.slice();
      while (picked.length < size) {
        var sum = 0; bag.forEach(function (w) { sum += wrong[w.word]; });
        var r = ctx.rng() * sum, idx = 0;
        for (; idx < bag.length - 1; idx++) { r -= wrong[bag[idx].word]; if (r < 0) break; }
        picked.push(bag.splice(idx, 1)[0]);
      }
    }
    var others = pool.filter(function (w) { return !(wrong[w.word] > 0); });
    var fresh = others.filter(function (w) { return !prev[w.word]; });
    var old = others.filter(function (w) { return prev[w.word]; });
    picked = picked.concat(fresh.concat(old).slice(0, size - picked.length));
    return mixedQuestions(picked, ctx);
  }
  function sampleScore(correct, total) { return total ? Math.round(correct * 100 / total) : 0; }
  function isSamplePass(score) { return score >= SAMPLE_PASS_SCORE; }

  /* 單題合法性檢查（選擇題 4 個不重複選項且恰好一個正解） */
  function validateQuestion(q) {
    if (TYPES.indexOf(q.type) < 0) return "未知題型 " + q.type;
    if (!q.word || !q.answer) return "缺少 word/answer";
    if (q.type === "spell") return q.answer === q.word ? "" : "拼字題答案不是該字";
    if (!q.choices || q.choices.length !== 4) return "選項不是 4 個";
    if (new Set(q.choices).size !== 4) return "選項重複";
    if (q.choices.filter(function (c) { return c === q.answer; }).length !== 1) return "正解數量不是 1";
    return "";
  }

  return {
    TOTAL_WORDS: TOTAL_WORDS, WORDS_PER_DAY: WORDS_PER_DAY, LEARN_DAYS_PER_WEEK: LEARN_DAYS_PER_WEEK,
    QUIZ_SIZE: QUIZ_SIZE, WEEKLY_SIZE: WEEKLY_SIZE, PASS_RATE: PASS_RATE,
    FAMILY_DAYS: FAMILY_DAYS, TYPES: TYPES,
    shuffle: shuffle, makeRng: makeRng, buildPlan: buildPlan,
    isTaskPassed: isTaskPassed, isUnlocked: isUnlocked, nextTask: nextTask, allDone: allDone, learnedWords: learnedWords,
    SAMPLE_PASS_SCORE: SAMPLE_PASS_SCORE, SAMPLE_SIZE: SAMPLE_SIZE, makeSampleExam: makeSampleExam, sampleScore: sampleScore, isSamplePass: isSamplePass,
    isPass: isPass, zhOverlap: zhOverlap, synonymsOf: synonymsOf, isSpellCorrect: isSpellCorrect, replaceListen: replaceListen,
    makeDailyQuiz: makeDailyQuiz, makeWeeklyQuiz: makeWeeklyQuiz, validateQuestion: validateQuestion
  };
});
