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
        /* 空白剝除比對只給由 config 正規化後的乘積式寫法；含空白的混合寫法與去空白後的數值不同，不可剝空白 */
        const mixedLike = s => /\d\s+\d+\/\d+/.test(s);
        if (u === p || (!mixedLike(u) && !mixedLike(p) && uc === p.replace(/ /g, ""))) return true;
        if (un !== null && typeof config.numberParser === "function") {
          const pn = config.numberParser(p);
          if (pn !== null && isFinite(un) && isFinite(pn) && Math.abs(un - pn) <= 1e-9 * Math.max(1, Math.abs(pn))) return true;
        }
      }
      return false;
    }

    /* ----- 題型 kind：config.types[].kind 為 single/multi/tf/selfcheck 時，題目以該 kind 行為；其餘（含舊科目 text 類）維持以 key 判斷 ----- */
    const SPECIAL_KINDS = { single: 1, multi: 1, tf: 1, selfcheck: 1 };
    function kindOfType(key) { const d = typeByKey[key]; const k = d && d.kind; return SPECIAL_KINDS[k] ? k : key; }
    function kindOf(it) { return it.kind || it.type; }
    function isSetType(key) { const d = typeByKey[key]; return !!(d && d.passageSet); }

    /* ----- 單題實體化（gen → 洗牌 → 重算答案） ----- */
    function validateRaw(spec, r) {
      if (!r || typeof r !== "object") throw new Error("gen 沒有回傳物件");
      if (typeof r.stem !== "string" || !r.stem.trim()) throw new Error("stem 空白");
      if (typeof r.explain !== "string" || !r.explain.trim()) throw new Error("explain 空白");
      const kind = kindOfType(spec.type);
      if (kind === "single" || kind === "multi") {
        if (!Array.isArray(r.options) || r.options.length < 2) throw new Error("options 不足");
        const strs = r.options.map(String);
        if (new Set(strs).size !== strs.length) throw new Error("options 重複");
        if (kind === "single" && !(Number.isInteger(r.answer) && r.answer >= 0 && r.answer < strs.length)) throw new Error("single answer 不合法");
        if (kind === "multi" && !(Array.isArray(r.answer) && r.answer.length >= 1 && r.answer.every(i => Number.isInteger(i) && i >= 0 && i < strs.length))) throw new Error("multi answer 不合法");
      } else if (kind === "tf") {
        if (typeof r.answer !== "boolean") throw new Error("tf answer 必須是布林");
      } else if (kind === "selfcheck") {
        if (!Array.isArray(r.keywords) || r.keywords.length < 1 || r.keywords.length > 2 || !r.keywords.every(w => typeof w === "string" && w.trim())) throw new Error("selfcheck keywords 必須是 1~2 個非空字串的陣列");
        if (typeof r.sample !== "string" || !r.sample.trim()) throw new Error("selfcheck sample 空白");
        const rub = selfRubric(spec, r);
        if (!(rub.length === 0 || (rub.length >= 3 && rub.length <= 5)) || !rub.every(w => typeof w === "string" && w.trim())) throw new Error("selfcheck rubric（自評對照用，選填）必須是 0 條或 3~5 條非空字串");
      } else {
        if (r.answer == null || !String(r.answer).trim()) throw new Error("answer 空白");
      }
    }
    function selfRubric(spec, r) {
      if (Array.isArray(r.rubric) && r.rubric.length) return r.rubric;
      const d = typeByKey[spec.type];
      return (d && Array.isArray(d.rubricDefault)) ? d.rubricDefault : [];
    }
    /* 依 kind 把 gen 回傳的答案相關欄位寫進 item（realize 與題組展開共用；亂數呼叫順序與原本一致） */
    function applyAnswer(item, kind, r, spec) {
      if (kind === "single" || kind === "multi") {
        const opts = r.options.map(String);
        const perm = shuffle(opts.map((_, i) => i));
        item.options = perm.map(i => opts[i]);
        if (kind === "single") item.answer = perm.indexOf(r.answer);
        else item.answer = Array.from(new Set(r.answer.map(i => perm.indexOf(i)))).sort((a, b) => a - b);
      } else if (kind === "tf") {
        item.answer = r.answer;
      } else if (kind === "selfcheck") {
        item.keywords = r.keywords.map(String);
        item.sample = String(r.sample);
        if (typeof r.sampleNote === "string" && r.sampleNote.trim()) item.sampleNote = r.sampleNote;
        item.rubric = selfRubric(spec, r).map(String); /* 自評對照用，不影響得分 */
        item.answer = item.sample;
        /* 自動批改規則（config.types[].rules 為預設，gen 可用 r.rules 覆寫）：必含指定語詞、句末標點、字數下限 */
        const rc = Object.assign({ minLen: 8, endPunct: true }, (typeByKey[spec.type] || {}).rules, r.rules);
        item.rules = item.keywords.map(w => ({ id: "kw", word: w, label: "用到指定語詞「" + w + "」" }));
        if (rc.endPunct !== false) item.rules.push({ id: "punct", label: "句末有標點符號（。！？）" });
        if (rc.minLen > 0) item.rules.push({ id: "len", min: rc.minLen, label: "句子至少 " + rc.minLen + " 個字" });
      } else {
        item.answer = String(r.answer);
        item.accepted = (r.accepted || []).map(String);
        item.units = (r.units || []).map(String);
        /* 選填：照樣寫短語等開放填空的規則批改（accepted 沒命中時，含全部 mustInclude 且夠長、且不是照抄例句也算對） */
        if (Array.isArray(r.mustInclude) && r.mustInclude.length) item.mustInclude = r.mustInclude.map(String);
        if (Number.isInteger(r.minLen) && r.minLen > 0) item.minLen = r.minLen;
        if (typeof r.example === "string" && r.example.trim()) item.example = r.example;
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
          /* 解法二可缺（向下相容）；缺就不放欄位，UI 不顯示 */
          if (typeof r.explain2 === "string" && r.explain2.trim()) item.explain2 = r.explain2;
          const kind = kindOfType(spec.type);
          if (kind !== spec.type && SPECIAL_KINDS[kind]) item.kind = kind;
          applyAnswer(item, kind, r, spec);
          return item;
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error("realize 失敗");
    }
    /* 題組（一篇短文多題）：gen 回傳 {passage, passageTitle?, questions:[{stem,options,answer,explain,...}×setSize]}，展開成 setSize 個 item，帶 setId/setIndex/passage */
    let setSeq = 0;
    function realizeSet(spec) {
      let lastErr = null;
      const def = typeByKey[spec.type];
      const size = def && def.setSize;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          if (!Number.isInteger(size) || size < 2) throw new Error("passageSet 題型必須設定 setSize（整數 >= 2）");
          const kind = kindOfType(spec.type);
          if (kind === "selfcheck") throw new Error("題組子題不支援 selfcheck");
          const r = spec.gen(kit);
          if (!r || typeof r !== "object") throw new Error("gen 沒有回傳物件");
          if (typeof r.passage !== "string" || !r.passage.trim()) throw new Error("passage 空白");
          if (!Array.isArray(r.questions) || r.questions.length !== size) throw new Error("questions 必須剛好 " + size + " 題");
          r.questions.forEach(q => validateRaw(spec, q));
          const setNo = ++setSeq;
          return r.questions.map((q, i) => {
            const item = {
              specId: spec.id, topic: spec.topic, type: spec.type, level: spec.level, tag: spec.tag,
              stem: q.stem, explain: q.explain, trapNote: q.trapNote || "",
              setId: spec.id + "#" + setNo, setIndex: i, setSize: size, passage: r.passage
            };
            if (typeof r.passageTitle === "string" && r.passageTitle.trim()) item.passageTitle = r.passageTitle;
            if (typeof q.explain2 === "string" && q.explain2.trim()) item.explain2 = q.explain2;
            if (kind !== spec.type && SPECIAL_KINDS[kind]) item.kind = kind;
            applyAnswer(item, kind, q, spec);
            return item;
          });
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error("realizeSet 失敗");
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
    function selectOnce(pools, counts, tagPlan, cover) {
      const topicUsed = {}; const levelUsed = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const used = new Set(); const usedKeys = new Set(); const out = {}; let repeated = false;
      const slots = []; let gk = Math.floor(Math.random() * 5);
      Object.keys(counts).forEach(k => {
        out[k] = [];
        const p = tagPlan[k] || { trap: 0, extend: 0 };
        for (let i = 0; i < counts[k]; i++) slots.push({ type: k, target: cover ? (gk++ % 5) + 1 : 0, tag: i < p.trap ? "trap" : (i < p.trap + p.extend ? "extend" : "basic") });
      });
      shuffle(slots).forEach(slot => {
        const all = pools[slot.type];
        let cands = all.filter(s => !used.has(s.id) && !(s.poolKey && usedKeys.has(s.poolKey)));
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
        const pref = slot.target ? list.filter(s => s.level === slot.target) : list.filter(s => LEVEL_PREF[slot.tag](s.level));
        if (pref.length) list = pref;
        let minL = Infinity; list.forEach(s => { minL = Math.min(minL, levelUsed[s.level]); });
        list = list.filter(s => levelUsed[s.level] === minL);
        const spec = pickOne(list);
        used.add(spec.id); if (spec.poolKey) usedKeys.add(spec.poolKey); topicUsed[topic] = (topicUsed[topic] || 0) + 1; levelUsed[spec.level]++;
        out[slot.type].push(spec);
      });
      return { out, topicUsed, repeated };
    }
    function missingLevels(out, pools, keys) {
      const have = {}, want = {};
      keys.forEach(k => { pools[k].forEach(s => { want[s.level] = true; }); out[k].forEach(s => { have[s.level] = true; }); });
      return Object.keys(want).filter(l => !have[l]).length;
    }
    function selectSpecs(pools, counts, mix, cover) {
      mix = Object.assign({}, mixCfg, mix || {});
      const keys = Object.keys(counts);
      const total = keys.reduce((a, k) => a + counts[k], 0);
      const poolTopics = {};
      keys.forEach(k => pools[k].forEach(s => { poolTopics[s.topic] = true; }));
      const trapCap = keys.map(k => pools[k].filter(s => s.tag === "trap").length);
      const extCap = keys.map(k => pools[k].filter(s => s.tag === "extend").length);
      const wantTrap = (mix.trap > 0 ? Math.max(mix.minEach, Math.round(total * mix.trap)) : 0);
      const wantExt = (mix.extend > 0 ? Math.max(mix.minEach, Math.round(total * mix.extend)) : 0);
      const nArr = keys.map(k => counts[k]);
      const trapAlloc = apportion(Math.min(wantTrap, total), nArr, keys.map((k, i) => Math.min(trapCap[i], counts[k])));
      const extAlloc = apportion(Math.min(wantExt, total), nArr, keys.map((k, i) => Math.min(extCap[i], counts[k] - trapAlloc[i])));
      const tagPlan = {};
      keys.forEach((k, i) => { tagPlan[k] = { trap: trapAlloc[i], extend: extAlloc[i] }; });
      const wantT = trapAlloc.reduce((a, b) => a + b, 0), wantE = extAlloc.reduce((a, b) => a + b, 0);
      let best = null, bestScore = Infinity;
      for (let attempt = 0; attempt < 60; attempt++) {
        const r = selectOnce(pools, counts, tagPlan, cover);
        let t = 0, e = 0;
        keys.forEach(k => r.out[k].forEach(s => { if (s.tag === "trap") t++; if (s.tag === "extend") e++; }));
        const vals = Object.keys(poolTopics).map(tp => r.topicUsed[tp] || 0);
        const spread = vals.length ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : 0;
        const score = 100 * Math.max(0, spread - 1) + Math.abs(t - wantT) + Math.abs(e - wantE) + (r.repeated ? 1000 : 0) + (cover ? 50 * missingLevels(r.out, pools, keys) : 0);
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
    /* 題組排序：整組一起移動，組內題序不動；組與組之間先洗牌再依 level 排序 */
    function orderSets(items) {
      const groups = [], idx = {};
      items.forEach(it => { if (idx[it.setId] == null) { idx[it.setId] = groups.length; groups.push([]); } groups[idx[it.setId]].push(it); });
      groups.forEach(g => g.sort((a, b) => a.setIndex - b.setIndex));
      const sorted = shuffle(groups).map((g, i) => ({ g, i })).sort((a, b) => (a.g[0].level - b.g[0].level) || (a.i - b.i)).map(x => x.g);
      return sorted.reduce((a, g) => a.concat(g), []);
    }
    function realizeAll(specs, pools, ctx) {
      const items = [];
      specs.forEach(spec => {
        let s = spec, item = null, tries = 0;
        const isSet = isSetType(spec.type);
        const alt = (pools && pools[spec.type]) ? shuffle(pools[spec.type]) : [];
        while (!item && tries < 12) {
          try { item = isSet ? realizeSet(s) : realize(s); } catch (e) { console.warn("ExamEngine: gen 失敗，改抽他題", s.id, e && e.message); s = alt[tries] || s; }
          tries++;
        }
        if (item) (isSet ? item : [item]).forEach(it => { it.unitIds = (ctx.topicUnits[it.topic] || []).slice(); items.push(it); });
      });
      return items;
    }
    /* ----- 計分卷版型規劃：整數題數 × 整數每題配分，總分剛好 total，偏差最小（範圍為硬限制，無解才逐級放寬） ----- */
    function stdFor(k, keys) {
      const t = typeByKey[k]; let c = t.stdCount || t.count || 4, p = t.stdPts || 2;
      if (t.stdWith) Object.keys(t.stdWith).forEach(o => { if (keys.indexOf(o) >= 0) { c = t.stdWith[o].count; p = t.stdWith[o].pts; } });
      return { count: c, pts: p };
    }
    function planScore(keys, fixed, caps) {
      const total = scoreCfg.total;
      const stds = keys.map(k => stdFor(k, keys));
      const wsum = stds.reduce((a, s) => a + s.count * s.pts, 0);
      for (let relax = 0; relax <= 6; relax++) {
        const INF = 1e15; let dp = new Array(total + 1).fill(INF); dp[0] = 0; const back = [];
        keys.forEach((k, i) => {
          const t = typeByKey[k];
          const T = total * (stds[i].count * stds[i].pts) / wsum;
          let cmin = fixed ? fixed[k] : (t.minCount || scoreCfg.minPerType); let cmax = fixed ? fixed[k] : (t.maxCount || 25) * (1 + relax);
          if (caps && caps[k] != null) cmax = Math.min(cmax, caps[k]);
          /* 題組型：題數只能是 setSize 的倍數（整篇一起算） */
          const step = t.passageSet ? Math.max(1, t.setSize || 1) : 1;
          if (step > 1) cmin = Math.max(1, Math.ceil(cmin / step)) * step;
          const pmin = t.minPts || 1, pmax = (t.maxPts || 12) * (1 + relax);
          const nd = new Array(total + 1).fill(INF); const bk = new Array(total + 1).fill(null);
          for (let n = cmin; n <= cmax; n += step) for (let p = pmin; p <= pmax; p++) {
            const pts = n * p; if (pts > total) continue;
            const cost = (pts - T) * (pts - T) + 25 * (p - stds[i].pts) * (p - stds[i].pts) + (n - stds[i].count) * (n - stds[i].count) * 0.01;
            for (let s = 0; s + pts <= total; s++) if (dp[s] < INF && dp[s] + cost < nd[s + pts]) { nd[s + pts] = dp[s] + cost; bk[s + pts] = { n, p, from: s }; }
          }
          dp = nd; back.push(bk);
        });
        if (dp[total] < INF) {
          const plan = {}; let s = total;
          for (let i = keys.length - 1; i >= 0; i--) { const b = back[i][s]; plan[keys[i]] = { n: b.n, p: b.p }; s = b.from; }
          Object.defineProperty(plan, "relaxed", { value: relax, enumerable: false });
          return plan;
        }
      }
      return null;
    }

    function assemble(selection, mode, ctx, pools, plan) {
      const keys = types.map(t => t.key).filter(k => selection[k] && selection[k].length);
      const sections = []; let flat = [];
      if (mode === "practice") {
        const items = [];
        keys.forEach(k => realizeAll(selection[k], pools, ctx).forEach(it => items.push(it)));
        flat = stableSortByLevel(items);
        flat.forEach(it => { it.points = practiceCfg.pointEach; });
        sections.push({ type: null, name: "", items: flat, count: flat.length, points: flat.length * practiceCfg.pointEach });
      } else {
        const weights = keys.map(k => typeByKey[k].weight || (typeByKey[k].stdCount * typeByKey[k].stdPts) || 1);
        const typePts = apportion(scoreCfg.total, weights);
        keys.forEach((k, ki) => {
          const raw = realizeAll(selection[k], pools, ctx);
          const items = isSetType(k) ? orderSets(raw) : stableSortByLevel(raw);
          const n = items.length; if (!n) return;
          let secPts;
          if (plan && plan[k]) { items.forEach(it => { it.points = plan[k].p; }); secPts = plan[k].p * n; }
          else {
            const base = Math.floor(typePts[ki] / n); let rem = typePts[ki] - base * n;
            items.forEach(it => { it.points = base + (rem > 0 ? 1 : 0); if (rem > 0) rem--; });
            secPts = typePts[ki];
          }
          const sec = { type: k, name: typeByKey[k].name, intro: typeByKey[k].hint || "", items, count: n, points: secPts, each: items[0].points };
          if (isSetType(k)) sec.sets = Math.round(n / (typeByKey[k].setSize || n));
          sections.push(sec);
          flat = flat.concat(items);
        });
      }
      flat.forEach((it, i) => { it.no = i + 1; });
      /* 造句依規則批改：題分依規則條數均分（前面的規則多拿餘數），部分規則達成給部分分 */
      flat.forEach(it => { if (kindOf(it) === "selfcheck") it.rulePts = apportion(it.points, it.rules.map(() => 1)); });
      return { mode, sections, items: flat, total: flat.reduce((a, it) => a + it.points, 0), ctx };
    }

    /* ----- 對外：出題 ----- */
    function buildExam(opts) {
      const mode = opts.mode === "practice" ? "practice" : "score";
      /* 二十題加強練習固定 level 1~5 全範圍，忽略難度設定；計分卷才依難度出題 */
      const lvMin = mode === "practice" ? 1 : (opts.levelMin || 1), lvMax = mode === "practice" ? 5 : (opts.levelMax || 5);
      const { topics, topicUnits } = topicsOfUnits(opts.units || []);
      const wantTypes = types.map(t => t.key).filter(k => (opts.types || []).indexOf(k) >= 0);
      /* 逐題練習不含題組（需整組作答） */
      const poolTypes = mode === "practice" ? wantTypes.filter(k => !isSetType(k)) : wantTypes;
      const pools = buildPools(topics, poolTypes, lvMin, lvMax);
      if (mode === "practice" && wantTypes.length && !poolTypes.length) throw new Error("閱讀題組不支援逐題練習，請改用一百分計分卷，或加選其他題型");
      const avail = poolTypes.filter(k => pools[k].length > 0);
      if (!avail.length) throw new Error("所選條件沒有可用題目（題庫可能尚未準備）");
      if (avail.length < wantTypes.length) console.warn("ExamEngine: 這些題型沒有可用題目，已略過：" + wantTypes.filter(k => avail.indexOf(k) < 0).join(","));
      const counts = {}; let scorePlan = null;
      if (mode === "practice") {
        const base = Math.floor(practiceCfg.count / avail.length); let rem = practiceCfg.count - base * avail.length;
        avail.forEach(k => { counts[k] = base + (rem > 0 ? 1 : 0); if (rem > 0) rem--; });
      } else {
        /* 題組：整篇不重複使用，題庫篇數不足時降低組數（planScore 以題數上限限制） */
        let caps = null;
        avail.forEach(k => { if (isSetType(k)) { caps = caps || {}; caps[k] = pools[k].length * (typeByKey[k].setSize || 1); } });
        scorePlan = caps ? planScore(avail, null, caps) : planScore(avail, null);
        if (!scorePlan) throw new Error("無法規劃計分卷版型");
        avail.forEach(k => { counts[k] = isSetType(k) ? scorePlan[k].n / (typeByKey[k].setSize || 1) : scorePlan[k].n; });
      }
      const selection = selectSpecs(pools, counts, mode === "score" ? opts.mix : null, mode === "practice");
      const exam = assemble(selection, mode, { topicUnits }, pools, scorePlan);
      if (scorePlan) exam.relaxed = scorePlan.relaxed;
      exam.opts = { mode, units: opts.units, types: wantTypes.slice(), levelMin: lvMin, levelMax: lvMax };
      return exam;
    }
    /* 只重做錯題：依 specId 重新 gen（變數會變） */
    function rebuildFromItems(exam, items) {
      const selection = {};
      items.forEach(it => {
        const s = bank.byId(it.specId); if (!s) return;
        const arr = selection[s.type] || (selection[s.type] = []);
        if (isSetType(s.type) && arr.indexOf(s) >= 0) return; /* 題組：同一篇有多題答錯也只放一次，整篇重做 */
        arr.push(s);
      });
      let plan = null;
      if (exam.mode === "score") {
        const keys = types.map(t => t.key).filter(k => selection[k] && selection[k].length);
        const fixed = {}; keys.forEach(k => { fixed[k] = selection[k].length * (isSetType(k) ? (typeByKey[k].setSize || 1) : 1); });
        plan = planScore(keys, fixed);
      }
      const out = assemble(selection, exam.mode, exam.ctx, null, plan);
      out.opts = exam.opts;
      return out;
    }

    /* ----- 批改 ----- */
    function isAnswered(item, resp) {
      const k = kindOf(item);
      if (k === "single") return Number.isInteger(resp);
      if (k === "multi") return Array.isArray(resp) && resp.length > 0;
      if (k === "tf") return typeof resp === "boolean";
      return typeof resp === "string" && resp.trim() !== "";
    }
    function isCorrect(item, resp) {
      if (!isAnswered(item, resp)) return false;
      const k = kindOf(item);
      if (k === "selfcheck") return checkRules(item, resp).every(p => p.ok);
      if (k === "single") return resp === item.answer;
      if (k === "multi") {
        const a = Array.from(new Set(resp)).sort((x, y) => x - y);
        return a.length === item.answer.length && a.every((v, i) => v === item.answer[i]);
      }
      if (k === "tf") return resp === item.answer;
      if (sameAnswer(resp, item)) return true;
      return !!(item.mustInclude && phraseRule(item, resp));
    }
    function plain(x) { return String(x == null ? "" : x).normalize("NFKC").replace(/[\s　]+/g, ""); }
    /* 造句規則批改：逐條回傳 {label, pts, ok}；沒寫句子全部 ok=false */
    function checkRules(item, resp) {
      const t = plain(resp), has = t !== "";
      return item.rules.map((r, i) => {
        let ok = false;
        if (has) {
          if (r.id === "kw") ok = t.indexOf(plain(r.word)) >= 0;
          else if (r.id === "punct") ok = /[。！？!?.…]$/.test(t.replace(/[」』”’）)]+$/, ""));
          else if (r.id === "len") ok = Array.from(t).length >= r.min;
        }
        return { label: r.label, pts: (item.rulePts || [])[i] || 0, ok };
      });
    }
    /* 照樣寫短語等：accepted 以外的規則判定（含全部指定結構詞、夠長、不是照抄例句） */
    function phraseRule(item, resp) {
      const t = plain(resp);
      if (!t) return false;
      if (item.example && t === plain(item.example)) return false;
      if (item.minLen && Array.from(t).length < item.minLen) return false;
      return item.mustInclude.every(w => t.indexOf(plain(w)) >= 0);
    }
    function gradeItem(item, resp) {
      if (kindOf(item) === "selfcheck") {
        const parts = checkRules(item, resp), earned = parts.reduce((a, p) => a + (p.ok ? p.pts : 0), 0);
        return { answered: isAnswered(item, resp), correct: earned === item.points, earned, parts };
      }
      const answered = isAnswered(item, resp), correct = isCorrect(item, resp);
      return { answered, correct, earned: correct ? item.points : 0 };
    }
    function optText(item, i) { return LETTERS[i] + ". " + item.options[i]; }
    function describeAnswer(item) {
      const k = kindOf(item);
      if (k === "single") return optText(item, item.answer);
      if (k === "multi") return item.answer.map(i => optText(item, i)).join("；");
      if (k === "tf") return item.answer ? labels.yes : labels.no;
      return item.answer;
    }
    function describeResponse(item, resp) {
      if (!isAnswered(item, resp)) return labels.none;
      const k = kindOf(item);
      if (k === "single") return optText(item, resp);
      if (k === "multi") return Array.from(new Set(resp)).sort((a, b) => a - b).map(i => optText(item, i)).join("；");
      if (k === "tf") return resp ? labels.yes : labels.no;
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
      res.bySection = exam.sections.filter(sc => sc.type).map(sc => {
        const set = new Set(sc.items); let earned = 0, right = 0;
        res.details.forEach(d => { if (set.has(d.item)) { earned += d.grade.earned; if (d.grade.correct) right++; } });
        return { type: sc.type, name: sc.name, earned, max: sc.points, right, total: sc.items.length };
      });
      return res;
    }

    return {
      config, bank, buildExam, rebuildFromItems, planScore, gradeItem, isAnswered, isCorrect, sameAnswer,
      describeAnswer, describeResponse, summarize, topicsOfUnits, buildPools, realize, realizeSet, apportion, kindOf, checkRules,
      availableTypes(units) { const tp = topicsOfUnits(units); return types.map(t => t.key).filter(k => tp.topics.some(tt => bank.specsOf(tt).some(s => s.type === k))); }
    };
  }

  const defaultBank = createBank();
  global.ExamBank = defaultBank;
  global.ExamEngine = { create: create, createBank: createBank, apportion: apportion };
})(typeof window !== "undefined" ? window : globalThis);
