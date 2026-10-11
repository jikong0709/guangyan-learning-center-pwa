/* 第二批科目題庫契約與量化驗證：node verify-banks.js */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
globalThis.window=globalThis;
function load(f){vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});}
const root=path.join(__dirname,"..","..");
load(path.join(root,"exam-engine","kit.js"));load(path.join(root,"exam-engine","engine.js"));load(path.join(__dirname,"config.js"));load(path.join(__dirname,"banks","factory.js"));
const cfg=globalThis.ExamConfig,kit=globalThis.ExamKit;
cfg.allTopics.forEach(t=>load(path.join(__dirname,"banks","bank-"+t+".js")));
const TYPES=["single","multi","tf","fill"],TAGS=["basic","trap","extend"],RUNS=100;
const SIMPLIFIED=["视频","获取","点击","确认","软件","网络","计算机","优化","质量","数据","信息","这个","这样","没有","通过","使用者们","支持度","打印","链接","默认","创建"];
const ids=new Set(),rows=[];let failures=0;
function badText(text){const s=String(text);if(/undefined|NaN/.test(s))return "含 undefined/NaN";const w=SIMPLIFIED.find(x=>s.includes(x));return w?"含簡體詞「"+w+"」":"";}
cfg.allTopics.forEach(topic=>{
  const specs=ExamBank.specsOf(topic),errs=[],per={},levels=new Set(),trapTypes=new Set(),facts=new Set();let trap=0,extend=0;
  TYPES.forEach(t=>per[t]={n:0,levels:new Set()});
  specs.forEach(s=>{
    const where=s.id||"（缺 id）";
    if(!new RegExp("^"+topic.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"-"+s.type+"-L[1-5]-\\d{2}$").test(where))errs.push(where+": id 格式錯誤");
    if(ids.has(where))errs.push(where+": id 全域重複");ids.add(where);
    if(!TYPES.includes(s.type)){errs.push(where+": type 不合法");return;}
    if(!Number.isInteger(s.level)||s.level<1||s.level>5)errs.push(where+": level 不合法");
    if(!TAGS.includes(s.tag))errs.push(where+": tag 不合法");
    if(typeof s.gen!=="function"){errs.push(where+": 缺 gen");return;}
    if(!s.factKey||facts.has(s.factKey))errs.push(where+": 同 topic 事實鍵缺漏或重複");facts.add(s.factKey);
    per[s.type].n++;per[s.type].levels.add(s.level);levels.add(s.level);if(s.tag==="trap"){trap++;trapTypes.add(s.type);}if(s.tag==="extend")extend++;
    const variants=new Set();let first="";
    for(let i=0;i<RUNS&&!first;i++){
      let r;try{r=s.gen(kit);}catch(e){first="gen 第 "+(i+1)+" 次丟錯："+e.message;break;}
      if(!r||typeof r!=="object"){first="gen 未回傳物件";break;}
      if(typeof r.stem!=="string"||!r.stem.trim()){first="stem 空白";break;}
      if(typeof r.explain!=="string"||r.explain.trim().length<8){first="explain 空白或過短";break;}
      if(r.explain2!==undefined){first="不應提供 explain2";break;}
      if(s.tag==="trap"&&(!r.trapNote||!String(r.trapNote).trim())){first="trap 題缺 trapNote";break;}
      const txt=[r.stem,r.explain,r.trapNote||""].concat(r.options||[]).concat(typeof r.answer==="string"?[r.answer]:[]).concat(r.accepted||[]).join(" ");const bt=badText(txt);if(bt){first=bt;break;}
      variants.add(r.stem+"|"+(r.options||[]).join("|"));
      if(s.type==="single"){
        if(!Array.isArray(r.options)||r.options.length!==4){first="single 需 4 個選項";break;}
        if(new Set(r.options.map(String)).size!==4){first="single 選項重複";break;}
        if(!Number.isInteger(r.answer)||r.answer<0||r.answer>=4){first="single answer 不合法";break;}
      }else if(s.type==="multi"){
        if(!Array.isArray(r.options)||r.options.length<4||r.options.length>5){first="multi 需 4～5 個選項";break;}
        if(new Set(r.options.map(String)).size!==r.options.length){first="multi 選項重複";break;}
        if(!Array.isArray(r.answer)||r.answer.length<2||r.answer.length>=r.options.length){first="multi 正解數或錯項不合法";break;}
        if(!r.answer.every((v,j)=>Number.isInteger(v)&&v>=0&&v<r.options.length&&(j===0||v>r.answer[j-1]))){first="multi answer 非升冪合法索引";break;}
        if(!r.stem.includes("選出所有正確的（複選）")){first="multi 題幹未明示複選";break;}
      }else if(s.type==="tf"){
        if(typeof r.answer!=="boolean"){first="tf answer 非布林";break;}
      }else{
        if(typeof r.answer!=="string"||!r.answer.trim()){first="fill answer 非空字串";break;}
        if(r.accepted!==undefined&&(!Array.isArray(r.accepted)||!r.accepted.every(x=>typeof x==="string"))){first="accepted 非字串陣列";break;}
      }
    }
    if(first)errs.push(where+": "+first);else if(variants.size<2)errs.push(where+": 100 次生成沒有文字或干擾項變化");
  });
  const need={single:12,multi:6,tf:12,fill:10};
  TYPES.forEach(t=>{if(per[t].n<need[t])errs.push(t+" 只有 "+per[t].n+"（需 ≥"+need[t]+"）");if(per[t].levels.size<3)errs.push(t+" level 涵蓋不足 3 級");});
  [1,2,3,4,5].forEach(l=>{if(!levels.has(l))errs.push("缺 level "+l);});if(trap<10)errs.push("trap 只有 "+trap);if(extend<8)errs.push("extend 只有 "+extend);if(trapTypes.size<3)errs.push("trap 未分布至少 3 種題型");
  rows.push({topic,specs:specs.length,per:TYPES.map(t=>per[t].n).join("/"),trap,extend,errs});if(errs.length)failures++;
});
const unitErr=[];Object.keys(cfg.versions).forEach(v=>cfg.versions[v].units.forEach(u=>{if(!u.topics.some(t=>ExamBank.specsOf(t).length))unitErr.push(v+" "+u.unitId+" "+u.title);if(u.verified!==false)unitErr.push(v+" "+u.unitId+" 未保守標示 verified:false");}));if(unitErr.length)failures++;
console.log(cfg.title+"｜topic".padEnd(18)+"specs  single/multi/tf/fill  trap extend  結果");rows.forEach(r=>console.log(r.topic.padEnd(22)+String(r.specs).padEnd(7)+r.per.padEnd(23)+String(r.trap).padEnd(5)+String(r.extend).padEnd(7)+(r.errs.length?"FAIL":"PASS")));rows.forEach(r=>r.errs.slice(0,30).forEach(e=>console.log("  FAIL "+r.topic+" | "+e)));console.log("版本單元 → 題庫對照: "+(unitErr.length?"FAIL":"PASS"));unitErr.forEach(e=>console.log("  FAIL "+e));console.log(failures?"HAS FAIL":"ALL PASS");process.exit(failures?1:0);
