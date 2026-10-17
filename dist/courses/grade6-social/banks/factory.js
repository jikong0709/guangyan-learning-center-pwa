/* 科目內的小型規格工廠；避免改動共用引擎。 */
(function (global) {
  "use strict";
  function arr(v) { return Array.isArray(v) ? v : [v]; }
  function stem(kit, value, kind) {
    const choices = arr(value), base = kit.pick(choices);
    if (choices.length > 1) return base;
    if (kind === "fill") return kit.pick([base, "請完成下列敘述：" + base]);
    if (kind === "multi") return kit.pick([base, "根據所學，" + base]);
    if (kind === "single") return kit.pick([base, "想一想，" + base]);
    return base;
  }
  /* 未經逐題審核前，不可依陣列位置把題目任意標成陷阱／延伸或虛構難度。
     完成題目審核後，可在該 topic 資料加入 metadata: { single:[{level:1,tag:"basic"}, ...] }。 */
  function meta(topic, type, i, data) {
    const list = data.metadata && data.metadata[type];
    const declared = list && list[i] && typeof list[i] === "object" ? list[i] : null;
    const level = declared && Number.isInteger(declared.level) && declared.level >= 1 && declared.level <= 5 ? declared.level : 2;
    const tag = declared && ["basic", "trap", "extend"].includes(declared.tag) ? declared.tag : "basic";
    const topicSource = global.ExamConfig && global.ExamConfig.factSources && global.ExamConfig.factSources[topic] || {};
    return {
      level: level,
      tag: tag,
      trapNote: declared && typeof declared.trapNote === "string" ? declared.trapNote : "",
      sourceUrl: declared && typeof declared.sourceUrl === "string" ? declared.sourceUrl : (topicSource.url || ""),
      sourceLabel: declared && typeof declared.sourceLabel === "string" ? declared.sourceLabel : (topicSource.name || "")
    };
  }
  function trapNote(answer) { return "常見錯誤是只憑印象作答；應回到題目的關鍵線索，確認正確答案是「" + answer + "」。"; }
  function id(topic, type, level, i) { return topic + "-" + type + "-L" + level + "-" + String(i + 1).padStart(2, "0"); }
  function register(topic, data) {
    const specs = [];
    global.SocialBankAudit = global.SocialBankAudit || [];
    ["single", "multi", "tf", "fill"].forEach(function (type) {
      const rows = data[type] || [];
      const declared = data.metadata && data.metadata[type];
      if (!Array.isArray(declared) || declared.length !== rows.length) {
        global.SocialBankAudit.push(topic + " metadata " + type + " 數量不符：" + (Array.isArray(declared) ? declared.length : 0) + "/" + rows.length);
      }
      rows.forEach(function (row, index) {
        const m = Array.isArray(declared) ? declared[index] : null;
        if (!m || !Number.isInteger(m.level) || m.level < 1 || m.level > 5) {
          global.SocialBankAudit.push(topic + " " + type + " 第 " + (index + 1) + " 題缺少有效 level metadata");
        }
        if (!m || !["basic", "trap", "extend"].includes(m.tag)) {
          global.SocialBankAudit.push(topic + " " + type + " 第 " + (index + 1) + " 題缺少有效 tag metadata");
        }
        if (m && m.tag === "trap" && !(typeof m.trapNote === "string" && m.trapNote.trim())) {
          global.SocialBankAudit.push(topic + " " + type + " 第 " + (index + 1) + " 題 trap 缺少明確 trapNote");
        }
        if (!Array.isArray(row) || typeof row[row.length - 1] !== "string" || !row[row.length - 1].trim()) {
          global.SocialBankAudit.push(topic + " " + type + " 第 " + (index + 1) + " 題資料格式／解析依據可能缺漏");
        }
      });
    });
    (data.single || []).forEach(function (r, i) { const m = meta(topic, "single", i, data); specs.push({ id: id(topic,"single",m.level,i), type:"single", level:m.level, tag:m.tag, factKey:r[3], sourceUrl:m.sourceUrl, sourceLabel:m.sourceLabel, gen:function(kit){ const correct=String(r[1]); const wrongs=kit.shuffle(r[2].map(String)).filter(function(x){return x!==correct;}).slice(0,3); const c=kit.choices(correct,wrongs); return {stem:stem(kit,r[0],"single"),options:c.options,answer:c.answer,explain:r[3],trapNote:m.tag==="trap"?(m.trapNote||r[4]||trapNote(correct)):undefined}; }}); });
    (data.multi || []).forEach(function (r, i) { const m = meta(topic, "multi", i, data); specs.push({ id:id(topic,"multi",m.level,i), type:"multi", level:m.level, tag:m.tag, factKey:r[3], gen:function(kit){ const pool=kit.shuffle(r[1].map(String)); const n=pool.length>2&&Math.random()<0.4?3:2; const correct=pool.slice(0,n); const wrong=kit.shuffle(r[2].map(String)).filter(function(x){return correct.indexOf(x)<0;}).slice(0,Math.min(2,5-correct.length)); return {stem:stem(kit,r[0],"multi").replace(/[。？]?$/,"")+"，選出所有正確的（複選）。",options:correct.concat(wrong),answer:correct.map(function(_,j){return j;}),explain:r[3],trapNote:m.tag==="trap"?(m.trapNote||r[4]||trapNote(correct.join("、"))):undefined}; }}); });
    (data.tf || []).forEach(function (r, i) { const m=meta(topic, "tf",i,data); specs.push({id:id(topic,"tf",m.level,i),type:"tf",level:m.level,tag:m.tag,factKey:r[2],gen:function(kit){const truth=Math.random()<0.5;return {stem:truth?stem(kit,r[0],"tf"):stem(kit,r[1],"tf"),answer:truth,explain:r[2],trapNote:m.tag==="trap"?(m.trapNote||r[3]||trapNote(truth?"正確":"錯誤")):undefined};}}); });
    (data.fill || []).forEach(function (r, i) { const m=meta(topic, "fill",i,data); specs.push({id:id(topic,"fill",m.level,i),type:"fill",level:m.level,tag:m.tag,factKey:r[3],sourceUrl:m.sourceUrl,sourceLabel:m.sourceLabel,gen:function(kit){const answer=String(r[1]);return {stem:stem(kit,r[0],"fill"),answer:answer,accepted:(r[2]||[]).map(String),explain:r[3],trapNote:m.tag==="trap"?(m.trapNote||r[4]||trapNote(answer)):undefined};}}); });
    global.ExamBank.register(topic,topic+"-facts",specs);
  }
  global.ExamBankFactory={register:register};
})(typeof window!=="undefined"?window:globalThis);

