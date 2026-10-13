"use strict";
/* Diagnostic only. DOES NOT replace strict gate or redefine accepted leakage. */
const fs=require("fs"),path=require("path"),vm=require("vm");
globalThis.window=globalThis;
function load(file){vm.runInThisContext(fs.readFileSync(file,"utf8"),{filename:file});}
const root=path.join(__dirname,"..","..");
for(const rel of ["exam-engine/kit.js","exam-engine/engine.js","courses/grade6-chinese-v2/config.js","courses/grade6-chinese-v2/config-batch-extension.js"])load(path.join(root,rel));
for(let n=1;n<=12;n++){let nn=String(n).padStart(2,"0");load(path.join(__dirname,"banks","bank-kx-6a-"+nn+".js"));if(n>1)load(path.join(__dirname,"banks","bank-kx-6a-"+nn+"-skills.js"));}
const bank=globalThis.ExamBank,cfg=globalThis.ExamConfig,engine=globalThis.ExamEngine.create(cfg,bank);
const clean=s=>String(s??"").normalize("NFKC").replace(/[\s，、。．；：！？!?「」『』（）(),.]/g,"");
const categories={},examples=[],lesson={};
function rng(seed,fn){let old=Math.random,x=seed>>>0;Math.random=()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};try{return fn();}finally{Math.random=old;}}
for(let n=2;n<=12;n++){
 const topic="kx-6a-"+String(n).padStart(2,"0"),specs=new Map(bank.specsOf(topic).map(s=>[s.id,s])),unit=cfg.versions.kanghsuan.units.find(u=>u.unitId==="六上-"+n);
 lesson[topic]={hits:0,singleCharacter:0,multipleCharacter:0,stem:0,option:0,ownStem:0,examples:0};
 for(let seed=0;seed<400;seed++){
  const paper=rng(n*100000+seed+1,()=>engine.buildExam({mode:"score",units:[unit],types:cfg.defaultTypes,levelMin:1,levelMax:5}));
  paper.items.forEach((q,i)=>{
   let spec=specs.get(q.specId);if(!spec)return;
   const terms=[...(spec.leakTerms||[])];if(spec.type==="charphonetic"&&spec.direction==="h")terms.push(spec.factChar);
   if(spec.type==="wrongchar"||spec.type==="homophone")terms.push(spec.audit.answer);
   const unique=[...new Set(terms.map(clean).filter(Boolean))];
   for(const term of unique){
    if(clean(q.stem).includes(term))lesson[topic].ownStem++;
    paper.items.forEach((other,j)=>{
     if(i===j||specs.get(other.specId)?.type==="sentence")return;
     const locations=[];
     if(clean(other.stem).includes(term))locations.push("stem");
     if((other.options||[]).some(opt=>clean(opt).includes(term)))locations.push("option");
     for(const location of locations){
      let group=(term.length===1?"SINGLE":"MULTI")+"_"+location;
      categories[group]=(categories[group]||0)+1;lesson[topic].hits++;lesson[topic][term.length===1?"singleCharacter":"multipleCharacter"]++;lesson[topic][location]++;
      if(examples.length<550&&lesson[topic].examples<50){
       examples.push({lesson:n,seed,source:q.specId,destination:other.specId,term,group,sourceStem:String(q.stem||"").slice(0,180),destinationStem:String(other.stem||"").slice(0,180),destinationOptions:(other.options||[]).map(x=>String(x).slice(0,65))});
       lesson[topic].examples++;
      }
     }
    });
   }
  });
 }
}
const target=path.join(__dirname,"qa-reports");fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,"leak-collision-diagnostic.json"),JSON.stringify({notice:"DIAGNOSTIC_ONLY; all collisions remain failures under original strict gate; human review needed to distinguish actual leaks.",categories,lesson,examples},null,2),"utf8");
console.log("Collision classification",JSON.stringify(categories));
Object.entries(lesson).forEach(([key,value])=>console.log("DIAGNOSTIC",key,JSON.stringify(value)));
console.log("Diagnostic exported; original strict gate remains authoritative.");
