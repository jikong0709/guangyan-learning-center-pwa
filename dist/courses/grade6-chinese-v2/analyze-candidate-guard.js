"use strict";
/* Candidate-only feasibility diagnostic; NEVER enables a production guard. */
const fs=require("fs"),path=require("path"),vm=require("vm");
globalThis.window=globalThis;
const base=__dirname,root=path.join(base,"../..");
function load(file){vm.runInThisContext(fs.readFileSync(path.join(root,file),"utf8"),{filename:file});}
for(const file of ["exam-engine/kit.js","exam-engine/engine.js","courses/grade6-chinese-v2/config.js","courses/grade6-chinese-v2/config-batch-extension.js"])load(file);
for(let n=1;n<=12;n++){const nn=String(n).padStart(2,"0");load("courses/grade6-chinese-v2/banks/bank-kx-6a-"+nn+".js");if(n>1)load("courses/grade6-chinese-v2/banks/bank-kx-6a-"+nn+"-skills.js");}
const {collisions,guardedBuildExam,adaptiveGuardedBuildExam}=require("./candidate-cross-item-guard");
const bank=globalThis.ExamBank,cfg=globalThis.ExamConfig,engine=globalThis.ExamEngine.create(cfg,bank);
const findings=[],adaptiveFindings=[];let safeCount=0;
for(let n=2;n<=12;n++){
 const unit=cfg.versions.kanghsuan.units.find(u=>u.unitId==="六上-"+n);
 const opts={mode:"score",units:[unit],types:cfg.defaultTypes,levelMin:1,levelMax:5};
 let best=Infinity,safe=0,blocked=0;
 for(let sample=0;sample<3;sample++){
  try{
   const result=guardedBuildExam(engine,bank,opts,4);
   safe++;safeCount++;best=0;
   if(collisions(result.paper,bank).length!==0)throw new Error("guard returned leaky paper");
  }catch(err){
   if(!String(err.message).startsWith("CANDIDATE_LEAK_GUARD_BLOCKED"))throw err;
   blocked++;best=Math.min(best,err.best);
  }
 }
 findings.push({lesson:n,safe,blocked,bestUnresolvedLeakCount:best});
 const adaptive=adaptiveGuardedBuildExam(cfg,bank,opts,{maxPrunes:36});
 adaptiveFindings.push({lesson:n,ok:adaptive.ok,reason:adaptive.reason||null,bestUnresolvedLeakCount:adaptive.best??0,prunes:adaptive.prunes,attempts:adaptive.attempts});
}
const report={guardMode:"isolated-nonproduction-feasibility",attemptsPerPaper:4,samplesPerLesson:3,safeCount,findings,adaptiveFindings};
fs.mkdirSync(path.join(base,"qa-reports"),{recursive:true});
fs.writeFileSync(path.join(base,"qa-reports","candidate-guard-feasibility.json"),JSON.stringify(report,null,2)+"\n");
console.log("CANDIDATE_GUARD_FEASIBILITY",JSON.stringify(report));
// This diagnostic does not override the original strict leakage gate.
