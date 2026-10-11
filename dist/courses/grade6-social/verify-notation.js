/* 畫面文字檢查：繁體中文與有效字串；本批三科不檢查英文字母。 */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");global.window=global;
function load(f){vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}
load(path.join(__dirname,"../../exam-engine/kit.js"));load(path.join(__dirname,"../../exam-engine/engine.js"));load(path.join(__dirname,"config.js"));load(path.join(__dirname,"banks/factory.js"));ExamConfig.allTopics.forEach(t=>load(path.join(__dirname,"banks/bank-"+t+".js")));
const badWords=["视频","获取","点击","确认","软件","网络","计算机","优化","质量","数据","信息","这个","这样","没有","通过","打印","链接","默认","创建"],bad=[];
function check(where,text){const s=String(text);if(/undefined|NaN/.test(s))bad.push(where+"：含 undefined/NaN");badWords.forEach(w=>{if(s.includes(w))bad.push(where+"：含簡體詞「"+w+"」");});}
check("config",[ExamConfig.title,ExamConfig.heading].concat(ExamConfig.types.flatMap(t=>[t.name,t.short,t.hint])).concat(Object.values(ExamConfig.versions).flatMap(v=>[v.name,v.sourceLabel].concat(v.units.map(u=>u.title)))).join(" "));
ExamConfig.allTopics.forEach(t=>ExamBank.specsOf(t).forEach(s=>{for(let i=0;i<100;i++){let r;try{r=s.gen(ExamKit);}catch(e){bad.push(s.id+"：gen 丟錯 "+e.message);break;}check(s.id,[r.stem,r.explain,r.trapNote||""].concat(r.options||[]).concat(typeof r.answer==="string"?[r.answer]:[]).concat(r.accepted||[]).join(" "));}}));
[...new Set(bad)].slice(0,100).forEach(x=>console.log("FAIL "+x));console.log(bad.length?"HAS FAIL ("+bad.length+")":"ALL PASS");process.exit(bad.length?1:0);

