"use strict";
const fs=require("fs");
const path=require("path");
const vm=require("vm");
globalThis.window=globalThis;
const root=path.join(__dirname,"..","..");
function load(p){vm.runInThisContext(fs.readFileSync(p,"utf8"));}
load(path.join(root,"exam-engine","kit.js"));
load(path.join(root,"exam-engine","engine.js"));
load(path.join(__dirname,"config.js"));
load(path.join(__dirname,"config-batch-extension.js"));
let issues=0;
for(let n=1;n<=12;n++){
const nn=String(n).padStart(2,"0");
load(path.join(__dirname,"banks","bank-kx-6a-"+nn+".js"));
if(n>1)load(path.join(__dirname,"banks","bank-kx-6a-"+nn+"-skills.js"));
}
for(let n=2;n<=12;n++){
const topic="kx-6a-"+String(n).padStart(2,"0");
const specs=globalThis.ExamBank.specsOf(topic);
const chars=specs.filter(s=>s.type==="charphonetic"&&s.lessonBased&&s.sourceChecks&&s.sourceChecks.edition==="115_1"&&s.sourceChecks.moeUrl&&s.sourceChecks.independentUrl);
if(new Set(chars.map(s=>s.factChar)).size<20){issues++;console.error(topic,"edition provenance incomplete");}
}
console.log("Edition problems:",issues);
process.exit(issues?1:0);
