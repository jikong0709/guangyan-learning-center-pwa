"use strict";
/* 每課400份標準卷：嚴格檢查同卷洩題／poolKey及本課題比例。候選Gate不等於獨立驗收。 */
const fs=require("fs"),path=require("path"),vm=require("vm");
globalThis.window=globalThis;
function load(p){vm.runInThisContext(fs.readFileSync(p,"utf8"),{filename:p});}
const root=path.join(__dirname,"..","..");
for(const p of ["exam-engine/kit.js","exam-engine/engine.js","courses/grade6-chinese-v2/config.js","courses/grade6-chinese-v2/config-batch-extension.js"])load(path.join(root,p));
for(let n=1;n<=12;n++){let id=String(n).padStart(2,"0");load(path.join(__dirname,"banks/bank-kx-6a-"+id+".js"));if(n>1)load(path.join(__dirname,"banks/bank-kx-6a-"+id+"-skills.js"));}
const bank=globalThis.ExamBank,cfg=globalThis.ExamConfig,engine=globalThis.ExamEngine.create(cfg,bank);
const clean=s=>String(s==null?"":s).normalize("NFKC").replace(/[\s，、。．；：！？!?「」『』（）(),.]/g,"");
let leak=0,dup=0,short=0,papers=0;const examples=[];
for(let n=2;n<=12;n++){let topic="kx-6a-"+String(n).padStart(2,"0"),specs=new Map(bank.specsOf(topic).map(s=>[s.id,s])),unit=cfg.versions.kanghsuan.units.find(u=>u.unitId==="六上-"+n);
for(let seed=0;seed<400;seed++){let paper=engine.buildExam({mode:"score",units:[unit],types:cfg.defaultTypes,levelMin:1,levelMax:5});papers++;
let used=new Set();
paper.items.forEach((q,i)=>{let spec=specs.get(q.specId);if(!spec)return;
if(spec.poolKey){if(used.has(spec.poolKey))dup++;used.add(spec.poolKey);}
let terms=(spec.leakTerms||[]).slice();
if(spec.type==="charphonetic"&&spec.direction==="h")terms.push(spec.factChar);
if(spec.type==="wrongchar"||spec.type==="homophone")terms.push(spec.audit.answer);
for(let j=0;j<paper.items.length;j++){if(i===j)continue;let other=paper.items[j],os=specs.get(other.specId);if(!os||os.type==="sentence")continue;let text=clean([other.stem,...(other.options||[])].join(""));if(terms.some(t=>clean(t)&&text.includes(clean(t)))){leak++;if(examples.length<12)examples.push(topic+" 卷"+seed+" "+q.specId+" → "+other.specId);}}
});
for(const sec of paper.sections){let need={wrongchar:3,vocab:3,homophone:2,lessonmc:6}[sec.type];if(need&&sec.items.filter(x=>specs.get(x.specId)?.lessonBased).length<need)short++;}
}}
console.log({papers,leak,poolKeyDuplicates:dup,lessonRatioFailures:short});examples.forEach(x=>console.log("LEAK",x));console.log(leak===0&&dup===0&&short===0&&papers===4400?"ALL PASS":"FAIL");process.exit(leak||dup||short||papers!==4400?1:0);
