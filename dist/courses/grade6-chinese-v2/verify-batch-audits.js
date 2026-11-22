"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
globalThis.window=globalThis;
const root=path.join(__dirname,"..","..");
function load(p){vm.runInThisContext(fs.readFileSync(p,"utf8"),{filename:p});}
for(const name of ["exam-engine/kit.js","exam-engine/engine.js","courses/grade6-chinese-v2/config.js","courses/grade6-chinese-v2/config-batch-extension.js"])load(path.join(root,name));
for(let n=1;n<=12;n++){const k=String(n).padStart(2,"0");load(path.join(__dirname,"banks/bank-kx-6a-"+k+".js"));if(n>1)load(path.join(__dirname,"banks/bank-kx-6a-"+k+"-skills.js"));}
const target=path.join(__dirname,"qa-reports");fs.mkdirSync(target,{recursive:true});
const escaped=s=>String(s==null?"":s).replaceAll("|","／").replace(/\r?\n/g,"／");
let failed=0;
for(let n=2;n<=12;n++){
 const id="kx-6a-"+String(n).padStart(2,"0"),rows=[];
 for(const spec of globalThis.ExamBank.specsOf(id)){
   const data=spec.gen(globalThis.ExamKit),questions=spec.type==="reading"?data.questions:[data],audit=Array.isArray(spec.audit)?spec.audit:[spec.audit];
   if(questions.length!==audit.length)failed++;
   questions.forEach((q,i)=>{
     const actual=q.options?q.options[q.answer]:(q.sample||q.answer),a=audit[i]||{};
     if(!a.source||!a.original||String(actual)!==String(a.answer))failed++;
     rows.push([spec.id+(spec.type==="reading"?"#"+(i+1):""),spec.type,q.stem,actual,a.source||"UNVERIFIED"].map(escaped));
   });
 }
 let lines=["# "+id+" candidate audit","Status: candidate; not verified against the 115 edition.","","| ID | Type | Question | Answer | Source |","|---|---|---|---|---|",...rows.map(r=>"| "+r.join(" | ")+" |")];
 fs.writeFileSync(path.join(target,id+"-audit.md"),lines.join("\n")+"\n","utf8");
 console.log(id,"audits",rows.length);
}
console.log("Audit failures",failed);process.exit(failed?1:0);
