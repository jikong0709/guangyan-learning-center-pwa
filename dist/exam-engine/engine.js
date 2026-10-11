/* 考卷引擎（跨科目共用）：題庫註冊、組卷、洗牌、批改、計分。
   本檔不含任何科目專屬邏輯；科目差異（題型清單、配分、答案數值解析等）全由 config 注入。 */
(function (global) {
  "use strict";

  /* ---------- 小工具 ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  /* 最大餘數法：把 total 依 weights 分配成整數，總和剛好 total；caps 為各項上限（選填） */
  function apportion(total, weights, caps) {
    const sum = weights.reduce((a, b) => a + b, 0);
    const n = weights.length;
    const out = new Array(n).fill(0);
    if (!n || sum <= 0 || total <= 0) return out;
    const exact = weights.map(w => total * w / sum);
    for (let i = 0; i < n; i++) { out[i] = Math.floor(exact[i]); if (caps && out[i] > caps[i]) out[i] = caps[i]; }
    let left = total - out.reduce((a, b) => a + b, 0);
    let guard = 0;
    while (left > 0 && guard++ < 10000) {
      let best = -1, bestR = -1;
      for (let i = 0; i < n; i++) {
        if (caps && out[i] >= caps[i]) continue;
        const r = exact[i] - out[i];
        if (r > bestR) { bestR = r; best = i; }
      }
      if (best < 0) break;
      out[best]++; left--;
    }
    return out;
  }

  /* ---------- 題庫註冊表 ---------- */
  function createBank() {
    const byTopic = {};
    const byIdMap = {};
    return {
      register(topic, group, specs) {
        if (typeof topic !== "string" || !topic) throw new Error("ExamBank.register: topic 必須是字串");
        if (!Array.isArray(specs)) throw new Error("ExamBank.register: specs 必須是陣列 (" + topic + ")");
        const list = byTopic[topic] || (byTopic[topic] = []);
        specs.forEach(function (s) {
          if (!s || typeof s.gen !== "function" || !s.id) { console.warn("ExamBank: 略過無效 spec", topic, s && s.id); return; }
          if (byIdMap[s.id]) { console.warn("ExamBank: 重複 id，略過", s.id); return; }
          s.topic = topic; s.group = group;
          byIdMap[s.id] = s; list.push(s);
        });
      },
      specsOf(topic) { return byTopic[topic] || []; },
      topics() { return Object.keys(byTopic); },
      byId(id) { return byIdMap[id] || null; },
      all() { return Object.keys(byTopic).reduce((a, t) => a.concat(byTopic[t]), []); },
      create: createBank
    };
  }

  /* ---------- 引擎 ---------- */
  function create(config, bank) {
    config = config || {};
    const kit = global.ExamKit || {};
    const types = config.types || [];
    const typeByKey = {};
    types.forEach(t => { typeByKey[t.key] = t; });
    const scoreCfg = Object.assign({ total: 100, minPerType: 2, maxScale: 2 }, config.score || {});
    const practiceCfg = Object.assign({ count: 20, pointEach: 5 }, config.practice || {});
    const mixCfg = Object.assign({ trap: 0.2, extend: 0.2, minEach: 2 }, config.mix || {});
    const labels = Object.assign({ yes: "對", no: "錯", none: "（未作答）" }, config.labels || {});
    const LETTERS = "ABCDE";

    /* ----- 答案規範化與比對 ----- */
    function basic(s) {
      s = String(s == null ? "" : s).replace(/²/g, "^2").replace(/³/g, "^3").normalize("NFKC");
      s = s.replace(/[　\s]+/g, " ").trim();
      let prev;
      do { prev = s; s = s.replace(/(\d),(?=\d{3}(?!\d))/g, "$1"); } while (s !== prev);
      s = s.replace(/[。]+$/, "").toLowerCase();
      return s;
    }
    function stripUnits(s, units) {
      if (!units || !units.length) return s;
      const list = units.map(basic).filter(Boolean).sort((a, b) => b.length - a.length);
      for (const u of list) {
        if (s.length > u.length && s.endsWith(u)) return s.slice(0, s.length - u.length).trim();
      }
      return s;
    }
    function prep(s, units) {
      let t = stripUnits(basic(s), units);
      if (typeof config.normalizeText === "function") t = config.normalizeText(t);
      return t;
    }
    function sameAnswer(user, item) {
      const u = prep(user, item.units);
      if (!u) return false;
      const cands = [item.answer].concat(item.accepted || []);
      const uc = u.replace(/ /g, "");
      const un = typeof config.numberParser === "function" ? config.numberParser(u) : null;
      for (const c of cands) {
        const p = prep(c, item.units);
        if (!p) continue;
        /* 空白剝除比對只給乘積寫法（2 × 3）；帶分數 "1 1/2" 與 "11/2" 數值不同，不可剝空白 */
        const mixedLike = s => /\d\s+\d+\/\d+/.test(s);
        if (u === p || (!mixedLike(u) && !mixedLike(p) && uc === p.replace(/ /g, ""))) return true;
        if (un !== null && typeof config.numberParser === "function") {
          const pn = config.numberParser(p);
          if (pn !== null && isFinite(un) && isFinite(pn) && Math.abs(un - pn) <= 1e-9 * Math.max(1, Math.abs(pn))) return true;
        }
      }
      return false;
    }

    /* ----- 單題實體化（gen → 洗牌 → 重算答案） ----- */
    function validateRaw(spec, r) {
      if (!r || typeof r !== "object") throw new Error("gen 沒有回傳物件");
      if (typeof r.stem !== "string" || !r.stem.trim()) throw new Error("stem 空白");
      if (typeof r.explain !== "string" || !r.explain.trim()) throw new Error("explain 空白");
      if (spec.type === "single" || spec.type === "multi") {
        if (!Array.isArray(r.options) || r.options.length < 2) throw new Error("options 不足");
        const strs = r.options.map(String);
        if (new Set(strs).size !== strs.length) throw new Error("options 重複");
        if (spec.type === "single" && !(Number.isInteger(r.answer) && r.answer >= 0 && r.answer < strs.length)) throw new Error("single answer 不合法");
        if (spec.type === "multi" && !(Array.isArray(r.answer) && r.answer.length >= 1 && r.answer.every(i => Number.isInteger(i) && i >= 0 && i < strs.length))) throw new Error("multi answer 不合法");
      } else if (spec.type === "tf") {
        if (typeof r.answer !== "boolean") throw new Error("tf answer 必須是布林");
      } else {
        if (r.answer == null || !String(r.answer).trim()) throw new Error("answer 空白");
      }
    }
    function realize(spec) {
      let lastErr = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const r = spec.gen(kit);
          validateRaw(spec, r);
          const item = {
            specId: spec.id, topic: spec.topic, type: spec.type, level: spec.level, tag: spec.tag,
            stem: r.stem, explain: r.explain, trapNote: r.trapNote || ""
          };
          if (spec.type === "single" || spec.type === "multi") {
            const opts = r.options.map(String);
            const perm = shuffle(opts.map((_, i) => i));
            item.options = perm.map(i => opts[i]);
            if (spec.type === "single") item.answer = perm.indexOf(r.answer);
            else item.answer = Array.from(new Set(r.answer.map(i => perm.indexOf(i)))).sort((a, b) => a - b);
          } else if (spec.type === "tf") {
            item.answer = r.answer;
          } else {
            item.answer = String(r.answer);
            item.accepted = (r.accepted || []).map(String);
            item.units = (r.units || []).map(String);
          }
          return item;
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error("realize 失敗");
    }

    /* ----- 候選池 ----- */
    function topicsOfUnits(units) {
      const topics = []; const topicUnits = {};
      units.forEach(u => (u.topics || []).forEach(t => {
        if (!bank.specsOf(t).length) return;
        if (!topicUnits[t]) { topicUnits[t] = []; topics.push(t); }
        if (topicUnits[t].indexOf(u.unitId) < 0) topicUnits[t].push(u.unitId);
      }));
      return { topics, topicUnits };
    }
    function buildPools(topics, typeKeys, lvMin, lvMax) {
      const pools = {};
      typeKeys.forEach(k => {
        pools[k] = [];
        topics.forEach(t => bank.specsOf(t).forEach(s => {
          if (s.type === k && s.level >= lvMin && s.level <= lvMax) pools[k].push(s);
        }));
      });
      return pools;
    }

    /* ----- 選題（單元均衡 + 標籤比例 + 難度涵蓋） ----- */
    const LEVEL_PREF = { extend: l => l >= 4, trap: l => l >= 2 && l <= 4, basic: l => l <= 3 };
    function selectOnce(pools, counts, tagPlan) {
      const topicUsed = {}; const levelUsed = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const used = new Set(); const out = {}; let repeated = false;
      const slots = [];
      Object.keys(counts).forEach(k => {
        out[k] = [];
        const p = tagPlan[k] || { trap: 0, extend: 0 };
        for (let i = 0; i < counts[k]; i++) slots.push({ type: k, tag: i < p.trap ? "trap" : (i < p.trap + p.extend ? "extend" : "basic") });
      });
      shuffle(slots).forEach(slot => {
        const all = pools[slot.type];
        let cands = all.filter(s => !used.has(s.id));
        if (!cands.length) { cands = all; repeated = true; }
        const topicSet = {}; cands.forEach(s => { topicSet[s.topic] = true; });
        const tl = Object.keys(topicSet);
        let min = Infinity; tl.forEach(t => { min = Math.min(min, topicUsed[t] || 0); });
        let tie = tl.filter(t => (topicUsed[t] || 0) === min);
        const withTag = tie.filter(t => cands.some(s => s.topic === t && s.tag === slot.tag));
        if (withTag.length) tie = withTag;
        const topic = pickOne(tie);
        let list = cands.filter(s => s.topic === topic);
        const tagged = list.filter(s => s.tag === slot.tag);
        if (tagged.length) list = tagged;
        const pref = list.filter(s => LEVEL_PREF[slot.tag](s.level));
        if (pref.length) list = pref;
        let minL = Infinity; list.forEach(s => { minL = Math.min(minL, levelUsed[s.level]); });
        list = list.filter(s => levelUsed[s.level] === minL);
        const spec = pickOne(list);
        used.add(spec.id); topicUsed[topic] = (topicUsed[topic] || 0) + 1; levelUsed[spec.level]++;
        out[slot.type].push(spec);
      });
      return { out, topicUsed, repeated };
    }
    function selectSpecs(pools, counts) {
      const keys = Object.keys(counts);
      const total = keys.reduce((a, k) => a + counts[k], 0);
      const poolTopics = {};
      keys.forEach(k => pools[k].forEach(s => { poolTopics[s.topic] = true; }));
      const trapCap = keys.map(k => pools[k].filter(s => s.tag === "trap").length);
      const extCap = keys.map(k => pools[k].filter(s => s.tag === "extend").length);
      const wantTrap = Math.max(mixCfg.minEach, Math.round(total * mixCfg.trap));
      const wantExt = Math.max(mixCfg.minEach, Math.round(total * mixCfg.extend));
      const nArr = keys.map(k => counts[k]);
      const trapAlloc = apportion(Math.min(wantTrap, total), nArr, keys.map((k, i) => Math.min(trapCap[i], counts[k])));
      const extAlloc = apportion(Math.min(wantExt, total), nArr, keys.map((k, i) => Math.min(extCap[i], counts[k] - trapAlloc[i])));
      const tagPlan = {};
      keys.forEach((k, i) => { tagPlan[k] = { trap: trapAlloc[i], extend: extAlloc[i] }; });
      const wantT = trapAlloc.reduce((a, b) => a + b, 0), wantE = extAlloc.reduce((a, b) => a + b, 0);
      let best = null, bestScore = Infinity;
      for (let attempt = 0; attempt < 60; attempt++) {
        const r = selectOnce(pools, counts, tagPlan);
        let t = 0, e = 0;
        keys.forEach(k => r.out[k].forEach(s => { if (s.tag === "trap") t++; if (s.tag === "extend") e++; }));
        const vals = Object.keys(poolTopics).map(tp => r.topicUsed[tp] || 0);
        const spread = vals.length ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : 0;
        const score = 100 * Math.max(0, spread - 1) + Math.abs(t - wantT) + Math.abs(e - wantE) + (r.repeated ? 1000 : 0);
        if (score < bestScore) { best = r; bestScore = score; }
        if (score === 0) break;
      }
      if (best.repeated) console.warn("ExamEngine: 題庫池不足，部分題目以同 spec 重新 gen（變數不同）");
      return best.out;
    }

    /* ----- 組裝成考卷 ----- */
    function stableSortByLevel(items) {
      return shuffle(items).map((it, i) => ({ it, i })).sort((a, b) => (a.it.level - b.it.level) || (a.i - b.i)).map(x => x.it);
    }
    function realizeAll(specs, pools, ctx) {
      const items = [];
      specs.forEach(spec => {
        let s = spec, item = null, tries = 0;
        const alt = (pools && pools[spec.type]) ? shuffle(pools[spec.type]) : [];
        while (!item && tries < 12) {
          try { item = realize(s); } catch (e) { console.warn("ExamEngine: gen 失敗，改抽他題", s.id, e && e.message); s = alt[tries] || s; }
          tries++;
        }
        if (item) { item.unitIds = (ctx.topicUnits[item.topic] || []).slice(); items.push(item); }
      });
      return items;
    }
    function assemble(selection, mode, ctx, pools) {
      const keys = types.map(t => t.key).filter(k => selection[k] && selection[k].length);
      const sections = []; let flat = [];
      if (mode === "practice") {
        const items = [];
        keys.forEach(k => realizeAll(selection[k], pools, ctx).forEach(it => items.push(it)));
        flat = stableSortByLevel(items);
        flat.forEach(it => { it.points = practiceCfg.pointEach; });
        sections.push({ type: null, name: "", items: flat, count: flat.length, points: flat.length * practiceCfg.pointEach });
      } else {
        const weights = keys.map(k => typeByKey[k].weight || 1);
        const typePts = apportion(scoreCfg.total, weights);
        keys.forEach((k, ki) => {
          const items = stableSortByLevel(realizeAll(selection[k], pools, ctx));
          const n = items.length; if (!n) return;
          const base = Math.floor(typePts[ki] / n); let rem = typePts[ki] - base * n;
          items.forEach(it => { it.points = base + (rem > 0 ? 1 : 0); if (rem > 0) rem--; });
          sections.push({ type: k, name: typeByKey[k].name, items, count: n, points: typePts[ki] });
          flat = flat.concat(items);
        });
      }
      flat.forEach((it, i) => { it.no = i + 1; });
      return { mode, sections, items: flat, total: flat.reduce((a, it) => a + it.points, 0), ctx };
    }

    /* ----- 對外：出題 ----- */
    function buildExam(opts) {
      const mode = opts.mode === "practice" ? "practice" : "score";
      const lvMin = opts.levelMin || 1, lvMax = opts.levelMax || 5;
      const { topics, topicUnits } = topicsOfUnits(opts.units || []);
      const wantTypes = types.map(t => t.key).filter(k => (opts.types || []).indexOf(k) >= 0);
      const pools = buildPools(topics, wantTypes, lvMin, lvMax);
      const avail = wantTypes.filter(k => pools[k].length > 0);
      if (!avail.length) throw new Error("所選條件沒有可用題目（題庫可能尚未準備）");
      if (avail.length < wantTypes.length) console.warn("ExamEngine: 這些題型沒有可用題目，已略過：" + wantTypes.filter(k => avail.indexOf(k) < 0).join(","));
      const counts = {};
      if (mode === "practice") {
        const base = Math.floor(practiceCfg.count / avail.length); let rem = practiceCfg.count - base * avail.length;
        avail.forEach(k => { counts[k] = base + (rem > 0 ? 1 : 0); if (rem > 0) rem--; });
      } else {
        const sumAll = types.reduce((a, t) => a + (t.count || 0), 0);
        const sumSel = avail.reduce((a, k) => a + typeByKey[k].count, 0);
        const scale = Math.min(scoreCfg.maxScale, sumAll / sumSel);
        avail.forEach(k => { counts[k] = Math.max(scoreCfg.minPerType, Math.round(typeByKey[k].count * scale)); });
      }
      const selection = selectSpecs(pools, counts);
      const exam = assemble(selection, mode, { topicUnits }, pools);
      exam.opts = { mode, units: opts.units, types: wantTypes.slice(), levelMin: lvMin, levelMax: lvMax };
      return exam;
    }
    /* 只重做錯題：依 specId 重新 gen（變數會變） */
    function rebuildFromItems(exam, items) {
      const selection = {};
      items.forEach(it => { const s = bank.byId(it.specId); if (!s) return; (selection[s.type] = selection[s.type] || []).push(s); });
      const out = assemble(selection, exam.mode, exam.ctx, null);
      out.opts = exam.opts;
      return out;
    }

    /* ----- 批改 ----- */
    function isAnswered(item, resp) {
      if (item.type === "single") return Number.isInteger(resp);
      if (item.type === "multi") return Array.isArray(resp) && resp.length > 0;
      if (item.type === "tf") return typeof resp === "boolean";
      return typeof resp === "string" && resp.trim() !== "";
    }
    function isCorrect(item, resp) {
      if (!isAnswered(item, resp)) return false;
      if (item.type === "single") return resp === item.answer;
      if (item.type === "multi") {
        const a = Array.from(new Set(resp)).sort((x, y) => x - y);
        return a.length === item.answer.length && a.every((v, i) => v === item.answer[i]);
      }
      if (item.type === "tf") return resp === item.answer;
      return sameAnswer(resp, item);
    }
    function gradeItem(item, resp) {
      const answered = isAnswered(item, resp), correct = isCorrect(item, resp);
      return { answered, correct, earned: correct ? item.points : 0 };
    }
    function optText(item, i) { return LETTERS[i] + ". " + item.options[i]; }
    function describeAnswer(item) {
      if (item.type === "single") return optText(item, item.answer);
      if (item.type === "multi") return item.answer.map(i => optText(item, i)).join("；");
      if (item.type === "tf") return item.answer ? labels.yes : labels.no;
      return item.answer;
    }
    function describeResponse(item, resp) {
      if (!isAnswered(item, resp)) return labels.none;
      if (item.type === "single") return optText(item, resp);
      if (item.type === "multi") return Array.from(new Set(resp)).sort((a, b) => a - b).map(i => optText(item, i)).join("；");
      if (item.type === "tf") return resp ? labels.yes : labels.no;
      return String(resp).trim();
    }
    function summarize(exam, responses) {
      const res = { score: 0, total: exam.total, count: exam.items.length, correctCount: 0, byTag: {}, byUnit: {}, byType: {}, wrong: [], details: [] };
      ["basic", "trap", "extend"].forEach(t => { res.byTag[t] = { right: 0, total: 0 }; });
      exam.items.forEach(it => {
        const g = gradeItem(it, responses[it.no]);
        res.details.push({ item: it, grade: g });
        res.score += g.earned;
        if (g.correct) res.correctCount++; else res.wrong.push(it);
        const tg = res.byTag[it.tag] || (res.byTag[it.tag] = { right: 0, total: 0 });
        tg.total++; if (g.correct) tg.right++;
        const ty = res.byType[it.type] || (res.byType[it.type] = { right: 0, total: 0 });
        ty.total++; if (g.correct) ty.right++;
        (it.unitIds || []).forEach(uid => {
          const u = res.byUnit[uid] || (res.byUnit[uid] = { right: 0, total: 0 });
          u.total++; if (g.correct) u.right++;
        });
      });
      return res;
    }

    return {
      config, bank, buildExam, rebuildFromItems, gradeItem, isAnswered, isCorrect, sameAnswer,
      describeAnswer, describeResponse, summarize, topicsOfUnits, buildPools, realize, apportion,
      availableTypes(units) { const tp = topicsOfUnits(units); return types.map(t => t.key).filter(k => tp.topics.some(tt => bank.specsOf(tt).some(s => s.type === k))); }
    };
  }

  const defaultBank = createBank();
  global.ExamBank = defaultBank;
  global.ExamEngine = { create: create, createBank: createBank, apportion: apportion };
})(typeof window !== "undefined" ? window : globalThis);
