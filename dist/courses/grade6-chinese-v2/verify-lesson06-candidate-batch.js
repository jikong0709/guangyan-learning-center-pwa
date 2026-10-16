"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
globalThis.window=globalThis;
const root=path.resolve(__dirname,"../..");
function load(file){vm.runInThisContext(fs.readFileSync(path.join(root,file),"utf8"),{filename:file});}
for(const file of ["exam-engine/kit.js","exam-engine/engine.js","courses/grade6-chinese-v2/config.js","courses/grade6-chinese-v2/config-batch-extension.js"])load(file);
for(let n=1;n<=12;n++){let id=String(n).padStart(2,"0");load("courses/grade6-chinese-v2/banks/bank-kx-6a-"+id+".js");if(n>1)load("courses/grade6-chinese-v2/banks/bank-kx-6a-"+id+"-skills.js");}
const {collisions,adaptiveGuardedBuildExam}=require("./candidate-cross-item-guard");
const bank=globalThis.ExamBank,cfg=globalThis.ExamConfig,unit=cfg.versions.kanghsuan.units.find(u=>u.unitId==="六上-6");
const opts={mode:"score",units:[unit],types:cfg.defaultTypes,levelMin:1,levelMax:5};
const samples=24;let passed=0;const failures=[];
for(let i=0;i<samples;i++){
 const res=adaptiveGuardedBuildExam(cfg,bank,opts,{maxPrunes:36});
 if(!res.ok){failures.push({sample:i,reason:res.reason,duplicatePoolKeys:res.duplicatePoolKeys||0,best:res.best});continue;}
 const paper=res.paper;
 assert.equal(paper.total,100);
 assert.equal(collisions(paper,bank).length,0);
 const used=new Set();
 for(const sec of paper.sections)for(const q of sec.items){const spec=bank.byId(q.specId);if(!spec?.poolKey)continue;
  const key=spec.poolKey+"::"+(q.setId||q.specId);
  if(used.has(key))continue;used.add(key);
 }
 passed++;
}
console.log("LESSON06_CANDIDATE_BATCH",JSON.stringify({samples,passed,blocked:failures.length,failures:failures.slice(0,12)}));
if(failures.length)process.exitCode=1;
