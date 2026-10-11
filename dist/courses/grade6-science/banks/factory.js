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
  function meta(type, i) {
    const level = i % 5 + 1; let tag = "basic";
    if ((type === "single" && i < 4) || (type === "multi" && i < 2) || (type === "tf" && i < 3) || (type === "fill" && i < 2)) tag = "trap";
    else if ((type === "single" && i < 7) || (type === "multi" && i < 4) || (type === "tf" && i < 5) || (type === "fill" && i < 3)) tag = "extend";
    return { level: level, tag: tag };
  }
  function trapNote(answer) { return "常見錯誤是只憑印象作答；應回到題目的關鍵線索，確認正確答案是「" + answer + "」。"; }
  function id(topic, type, level, i) { return topic + "-" + type + "-L" + level + "-" + String(i + 1).padStart(2, "0"); }
  function register(topic, data) {
    const specs = [];
    (data.single || []).forEach(function (r, i) { const m = meta("single", i); specs.push({ id: id(topic,"single",m.level,i), type:"single", level:m.level, tag:m.tag, factKey:r[3], gen:function(kit){ const correct=String(r[1]); const wrongs=kit.shuffle(r[2].map(String)).filter(function(x){return x!==correct;}).slice(0,3); const c=kit.choices(correct,wrongs); return {stem:stem(kit,r[0],"single"),options:c.options,answer:c.answer,explain:r[3],trapNote:m.tag==="trap"?(r[4]||trapNote(correct)):undefined}; }}); });
    (data.multi || []).forEach(function (r, i) { const m = meta("multi", i); specs.push({ id:id(topic,"multi",m.level,i), type:"multi", level:m.level, tag:m.tag, factKey:r[3], gen:function(kit){ const pool=kit.shuffle(r[1].map(String)); const n=pool.length>2&&Math.random()<0.4?3:2; const correct=pool.slice(0,n); const wrong=kit.shuffle(r[2].map(String)).filter(function(x){return correct.indexOf(x)<0;}).slice(0,Math.min(2,5-correct.length)); return {stem:stem(kit,r[0],"multi").replace(/[。？]?$/,"")+"，選出所有正確的（複選）。",options:correct.concat(wrong),answer:correct.map(function(_,j){return j;}),explain:r[3],trapNote:m.tag==="trap"?(r[4]||trapNote(correct.join("、"))):undefined}; }}); });
    (data.tf || []).forEach(function (r, i) { const m=meta("tf",i); specs.push({id:id(topic,"tf",m.level,i),type:"tf",level:m.level,tag:m.tag,factKey:r[2],gen:function(kit){const truth=Math.random()<0.5;return {stem:truth?stem(kit,r[0],"tf"):stem(kit,r[1],"tf"),answer:truth,explain:r[2],trapNote:m.tag==="trap"?(r[3]||trapNote(truth?"正確":"錯誤")):undefined};}}); });
    (data.fill || []).forEach(function (r, i) { const m=meta("fill",i); specs.push({id:id(topic,"fill",m.level,i),type:"fill",level:m.level,tag:m.tag,factKey:r[3],gen:function(kit){const answer=String(r[1]);return {stem:stem(kit,r[0],"fill"),answer:answer,accepted:(r[2]||[]).map(String),explain:r[3],trapNote:m.tag==="trap"?(r[4]||trapNote(answer)):undefined};}}); });
    global.ExamBank.register(topic,topic+"-facts",specs);
  }
  global.ExamBankFactory={register:register};
})(typeof window!=="undefined"?window:globalThis);

