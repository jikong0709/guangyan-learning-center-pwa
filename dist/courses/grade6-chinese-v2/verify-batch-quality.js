"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
globalThis.window=globalThis;
const base=path.join(__dirname,"..","..");
for(const f of ["exam-engine/kit.js","exam-engine/engine.js","courses/grade6-chinese-v2/config.js","courses/grade6-chinese-v2/config-batch-extension.js"]){const p=path.join(base,f);vm.runInThisContext(fs.readFileSync(p,"utf8"),{filename:p});}
for(let n=1;n<=12;n++){const nn=String(n).padStart(2,"0");for(const p of ["bank-kx-6a-"+nn+".js",...(n===1?[]:["bank-kx-6a-"+nn+"-skills.js"])]){const file=path.join(__dirname,"banks",p);vm.runInThisContext(fs.readFileSync(file,"utf8"),{filename:file});}}
let errors=[],scanned=0;
for(let n=2;n<=12;n++){
 const topic="kx-6a-"+String(n).padStart(2,"0"),seen=new Map(),counts={};
 for(const spec of globalThis.ExamBank.specsOf(topic)){
  counts[spec.type]=(counts[spec.type]||0)+1;
  const out=spec.gen(globalThis.ExamKit),questions=spec.type==="reading"?out.questions:[out];
  for(const [index,q] of questions.entries()){
   scanned++;
   const key=spec.type+"|"+String(q.stem||"");
   if(seen.has(key))errors.push(topic+" duplicate question wording "+key+" ("+seen.get(key)+" and "+spec.id+")");
   else seen.set(key,spec.id);
   if(spec.type==="wrongchar"&&q.answer&&String(q.stem).includes(String(q.answer)))errors.push(spec.id+" typo answer exposed in own prompt");
   if(q.options){if(new Set(q.options).size!==q.options.length)errors.push(spec.id+" repeated option");if(q.options.length!==4)errors.push(spec.id+" not four options");}
   if(spec.type==="reading"&&!out.passage)errors.push(spec.id+" missing original passage");
  }
 }
 for(const variant of ["wrongchar_mc","homophone_text"]){if((counts[variant]||0)<10)errors.push(topic+" missing "+variant+" alternative pool");}
}
/* Regression for directly exposed answer characters confirmed by prior sampled-paper evidence.
   This is additive: the original 4400-paper strict leakage gate remains unchanged. */
const resolvedCrossQuestionCases={
  2:{"07":"樸","08":"樸"},
  4:{"03":"酥","04":"酥"},
  8:{"05":"辯","06":"辯"},
  9:{"01":"旗","02":"旗","09":"陣","10":"陣"},
  11:{"01":"歉","02":"歉"},
  5:{"07":"韻","08":"韻"},
  6:{"01":"萃","02":"萃"},
  7:{"01":"櫃","02":"櫃","03":"墊","04":"墊"},
  10:{"01":"緞","02":"緞"},
  12:{"01":"蒂","02":"蒂"}
};
for(const [lesson,expected] of Object.entries(resolvedCrossQuestionCases)){
  const topic="kx-6a-"+String(lesson).padStart(2,"0"),specs=globalThis.ExamBank.specsOf(topic);
  const readingText=specs.filter(x=>x.type==="reading").map(x=>{
    const sample=x.gen(globalThis.ExamKit);
    return [sample.passage,...(sample.questions||[]).flatMap(q=>[q.stem,...(q.options||[])])].join(" ");
  }).join(" ");
  for(const [suffix,answer] of Object.entries(expected)){
    const spec=specs.find(x=>x.type==="wrongchar"&&x.id.endsWith("-"+suffix));
    if(!spec){errors.push(topic+" missing targeted correction question "+suffix);continue;}
    if(String(spec.audit?.answer)!==answer)errors.push(spec.id+" expected corrected audit answer "+answer);
    const q=spec.gen(globalThis.ExamKit);
    if(String(q.answer)!==answer)errors.push(spec.id+" corrected written answer mismatch");
    if(readingText.includes(answer))errors.push(spec.id+" corrected answer still visible in original reading text");
  }
}
const resolvedHomophoneReadingCases={11:{"01":"餅","02":"餅"},12:{"07":"肥","08":"肥"}};
for(const [lesson,items] of Object.entries(resolvedHomophoneReadingCases)){
 const topic="kx-6a-"+String(lesson).padStart(2,"0"),specs=globalThis.ExamBank.specsOf(topic);
 const readingText=specs.filter(x=>x.type==="reading").map(x=>{const r=x.gen(globalThis.ExamKit);return [r.passage,...(r.questions||[]).flatMap(y=>[y.stem,...(y.options||[])])].join(" ");}).join(" ");
 for(const [suffix,answer] of Object.entries(items)){
  const spec=specs.find(x=>x.type==="homophone"&&x.id.endsWith("-"+suffix));
  if(!spec){errors.push(topic+" missing repaired homophone "+suffix);continue;}
  if(String(spec.audit?.answer)!==answer)errors.push(spec.id+" repaired answer mismatches audit");
  const q=spec.gen(globalThis.ExamKit);
  if(q.options?.[q.answer]!==answer)errors.push(spec.id+" repaired selected answer mismatch");
  if(readingText.includes(answer))errors.push(spec.id+" repaired homophone answer appears in reading");
 }
}
/* Fourth-wave specific direct-answer regression. Strict cross-item gate remains unchanged. */
const waveFourCases={
  4:{homophone:{"07":"糕","08":"糕"}},
  5:{wrongchar:{"01":"燉","02":"燉","09":"餚","10":"餚"}},
  6:{wrongchar:{"09":"壺","10":"壺"}},
  7:{wrongchar:{"07":"扣","08":"扣"}},
  8:{wrongchar:{"07":"穿","08":"穿"}},
  10:{wrongchar:{"07":"繩","08":"繩"}},
  11:{wrongchar:{"09":"釋","10":"釋"}},
  12:{wrongchar:{"07":"籽","08":"籽"}}
};
for(const [lesson,types] of Object.entries(waveFourCases)){
 const topic="kx-6a-"+String(lesson).padStart(2,"0"),specs=globalThis.ExamBank.specsOf(topic);
 const fullReading=specs.filter(x=>x.type==="reading").map(x=>{const z=x.gen(globalThis.ExamKit);return [z.passage,...(z.questions||[]).flatMap(q=>[q.stem,...(q.options||[])])].join(" ");}).join(" ");
 for(const [type,entries] of Object.entries(types))for(const [suffix,expected] of Object.entries(entries)){
  const sp=specs.find(x=>x.type===type&&x.id.endsWith("-"+suffix));
  if(!sp){errors.push(topic+" missing fourth-wave "+type+" "+suffix);continue;}
  if(String(sp.audit?.answer)!==expected)errors.push(sp.id+" audit inconsistent after fourth-wave fix");
  const q=sp.gen(globalThis.ExamKit);
  const actual=type==="homophone"?q.options?.[q.answer]:q.answer;
  if(actual!==expected)errors.push(sp.id+" generated answer inconsistent after fourth-wave fix");
  if(fullReading.includes(expected))errors.push(sp.id+" exposed in reading despite fourth-wave fix");
 }
}
console.log("Scanned",scanned,"question units; repeated stems/option faults",errors.length);
errors.slice(0,60).forEach(x=>console.error("QA_FAIL",x));

/* Regression: lesson 07 reading must not disclose these independently-tested answers. */
{
 const specs=globalThis.ExamBank.specsOf("kx-6a-07");
 const text=specs.filter(s=>s.type==="reading").map(s=>{const r=s.gen(globalThis.ExamKit);return [r.passage,...r.questions.flatMap(q=>[q.stem,...(q.options||[])])].join(" ");}).join(" ");
 for(const ch of ["滑","練","標"])if(text.includes(ch))errors.push("kx-6a-07 reading exposes target answer "+ch);
}
console.log(errors.length?"QUALITY_BLOCKED":"QUALITY_PASS");
process.exit(errors.length?1:0);

// WAVE5 Batch05: rerun original strict PR validation using refreshed lesson-source branch HEADs.

// WAVE5 Batch06: recheck unchanged strict gates using updated lesson 02, 03 and 06 sources.

// WAVE5 Batch07: retest original strict checks with the latest lesson 12 reading source.
