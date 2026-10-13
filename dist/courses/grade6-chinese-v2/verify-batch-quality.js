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
console.log("Scanned",scanned,"question units; repeated stems/option faults",errors.length);
errors.slice(0,60).forEach(x=>console.error("QA_FAIL",x));
console.log(errors.length?"QUALITY_BLOCKED":"QUALITY_PASS");
process.exit(errors.length?1:0);
