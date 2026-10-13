"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
globalThis.window=globalThis;
function load(p){vm.runInThisContext(fs.readFileSync(p,"utf8"),{filename:p});}
const base=path.join(__dirname,"..","..");
load(path.join(base,"exam-engine/kit.js"));load(path.join(base,"exam-engine/engine.js"));
load(path.join(__dirname,"config.js"));load(path.join(__dirname,"config-batch-extension.js"));
const expected={charphonetic:40,charphonetic_mc:40,wrongchar:12,vocab:12,vocab_mc:12,lessonmc:30,pattern:10,homophone:10,sentence:8,reading:4};
for(let n=1;n<=12;n++){let nn=String(n).padStart(2,"0");load(path.join(__dirname,"banks/bank-kx-6a-"+nn+".js"));if(n>1)load(path.join(__dirname,"banks/bank-kx-6a-"+nn+"-skills.js"));}
const bank=globalThis.ExamBank,cfg=globalThis.ExamConfig,engine=globalThis.ExamEngine.create(cfg,bank),errors=[];
let built=0;
for(let n=2;n<=12;n++){
let id="kx-6a-"+String(n).padStart(2,"0"),specs=bank.specsOf(id),counts={};
for(const s of specs){counts[s.type]=(counts[s.type]||0)+1;let q=s.gen(globalThis.ExamKit);
if(s.type==="reading"&&(!(q.passage.length>=150&&q.passage.length<=250)||q.questions.length!==5))errors.push(s.id+" reading invalid");
if(!s.audit)errors.push(s.id+" audit missing");
}
for(const [k,min] of Object.entries(expected)){if((counts[k]||0)<min)errors.push(id+" "+k+" count invalid");}
let unit=cfg.versions.kanghsuan.units.find(x=>x.unitId==="六上-"+n);
for(let i=0;i<400;i++){try{let p=engine.buildExam({mode:"score",units:[unit],types:cfg.defaultTypes,levelMin:1,levelMax:5});if(p.total!==100)errors.push(id+" score invalid");built++;}catch(e){errors.push(id+" build "+e.message);break;}}
console.log(id,JSON.stringify(counts));
}
console.log("Candidate papers:",built,"Failures:",errors.length);
errors.slice(0,60).forEach(e=>console.error("FAIL",e));
console.log(errors.length?"SHAPE FAIL":"SHAPE PASS / NOT_FACT_VERIFIED / NOT_ANTI_LEAK_PASSED");process.exit(errors.length?1:0);
