"use strict";
/* Candidate integration smoke: runs against real lesson banks, not mocked specs.
   It does not change the shared engine or relax strict 4400-paper QA. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
globalThis.window=globalThis;
const root=path.resolve(__dirname,"../..");
function load(rel){vm.runInThisContext(fs.readFileSync(path.join(root,rel),"utf8"),{filename:rel});}
for(const rel of ["exam-engine/kit.js","exam-engine/engine.js","courses/grade6-chinese-v2/config.js","courses/grade6-chinese-v2/config-batch-extension.js"])load(rel);
for(let n=1;n<=12;n++){let num=String(n).padStart(2,"0");load("courses/grade6-chinese-v2/banks/bank-kx-6a-"+num+".js");if(n>1)load("courses/grade6-chinese-v2/banks/bank-kx-6a-"+num+"-skills.js");}
const {adaptiveGuardedBuildExam,collisions}=require("./candidate-cross-item-guard");
const bank=globalThis.ExamBank,config=globalThis.ExamConfig;
let passed=0,blocked=0;const evidence=[];
for(let n=2;n<=12;n++){
 const unit=config.versions.kanghsuan.units.find(u=>u.unitId==="六上-"+n);
 assert.ok(unit,"lesson unit exists");
 const opts={mode:"score",units:[unit],types:config.defaultTypes,levelMin:1,levelMax:5};
 const result=adaptiveGuardedBuildExam(config,bank,opts,{maxPrunes:36});
 if(result.ok){
  assert.equal(result.paper.total,100,"full score preserved");
  assert.equal(collisions(result.paper,bank).length,0,"zero cross-item leakage");
  assert.equal(result.paper.items.length,result.paper.sections.reduce((n,s)=>n+s.items.length,0),"sections intact");
  passed++;
 }else{
  assert.ok(["ORIGINAL_EXAM_CONSTRAINT_FAILED","NO_SAFE_PRUNE","PRUNE_BUDGET_EXHAUSTED","POOL_OR_PLAN_BLOCKED"].includes(result.reason),"known fail-closed reason");
  blocked++;
 }
 evidence.push({lesson:n,ok:result.ok,reason:result.reason||null,prunes:result.prunes,attempts:result.attempts,best:result.best??0});
}
assert.equal(passed+blocked,11,"all eleven lessons checked");
console.log("CANDIDATE_INTEGRATION_PASS",JSON.stringify({passed,blocked,evidence}));
