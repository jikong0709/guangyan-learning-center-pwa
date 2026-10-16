"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
globalThis.window=globalThis;
const root=path.resolve(__dirname,"../..");
function load(file){vm.runInThisContext(fs.readFileSync(path.join(root,file),"utf8"),{filename:file});}
for(const file of ["exam-engine/kit.js","exam-engine/engine.js","courses/grade6-chinese-v2/config.js","courses/grade6-chinese-v2/config-batch-extension.js"])load(file);
for(let n=1;n<=12;n++){const id=String(n).padStart(2,"0");load("courses/grade6-chinese-v2/banks/bank-kx-6a-"+id+".js");if(n>1)load("courses/grade6-chinese-v2/banks/bank-kx-6a-"+id+"-skills.js");}
const config=globalThis.ExamConfig,bank=globalThis.ExamBank;
const all=[];
for(let lesson=2;lesson<=12;lesson++){
 const topic="kx-6a-"+String(lesson).padStart(2,"0");
 const rows=[];
 for(const type of config.defaultTypes){
  const specs=bank.specsOf(topic).filter(s=>s.type===type),unique=new Set(specs.map(s=>s.poolKey||s.id));
  const typeConfig=config.types.find(t=>t.key===type);
  rows.push({type,specs:specs.length,uniqueKeys:unique.size,duplicateDefinitions:specs.length-unique.size,standardCount:typeConfig?.stdCount||0,lessonBased:specs.filter(s=>s.lessonBased).length});
 }
 all.push({lesson,types:rows});
}
const target=all.find(x=>x.lesson===6);
const errors=[];
if(!target)errors.push("lesson 6 missing");
for(const row of target?.types||[]){
 if(row.uniqueKeys<Math.min(row.standardCount,config.types.find(t=>t.key===row.type)?.maxCount||row.standardCount))errors.push("lesson 6 "+row.type+" insufficient unique pool keys "+row.uniqueKeys+"/"+row.standardCount);
}
const output={status:errors.length?"SOURCE_POOL_SHORTAGE":"NO_STATIC_SHORTAGE",issues:errors,lessons:all};
fs.mkdirSync(path.join(__dirname,"qa-reports"),{recursive:true});
fs.writeFileSync(path.join(__dirname,"qa-reports","poolkey-capacity.json"),JSON.stringify(output,null,2)+"\n");
console.log("POOLKEY_CAPACITY",JSON.stringify({status:output.status,issues:errors,lesson6:target}));
