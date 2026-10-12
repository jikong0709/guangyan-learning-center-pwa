/* 康軒六上第1課樣板題庫驗證：node verify-banks.js [--write-audit] */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
globalThis.window=globalThis;
function load(file){vm.runInThisContext(fs.readFileSync(file,"utf8"),{filename:file});}
const root=path.join(__dirname,"..","..");
load(path.join(root,"exam-engine","kit.js"));load(path.join(root,"exam-engine","engine.js"));load(path.join(__dirname,"config.js"));load(path.join(__dirname,"banks","bank-kx-6a-01.js"));
const cfg=globalThis.ExamConfig,bank=globalThis.ExamBank,engine=globalThis.ExamEngine.create(cfg,bank);
const specs=bank.specsOf("kx-6a-01"),byId=new Map(specs.map(s=>[s.id,s]));
const dataFile=path.join(__dirname,"..","..","..","協作","國語樣板資料_第1課跑道.md");
const auditFile=path.join(__dirname,"..","..","..","協作","國語第1課跑道_逐題查證表.md");
const dataText=fs.readFileSync(dataFile,"utf8"),failures=[];
function fail(m){failures.push(m);} function assert(ok,m){if(!ok)fail(m);}
function withSeed(seed,fn){const old=Math.random;let x=seed>>>0;Math.random=()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};try{return fn();}finally{Math.random=old;}}
function rawOf(s,seed){return withSeed(seed||1,()=>s.gen(globalThis.ExamKit));}
function answerText(q){return Array.isArray(q.options)&&Number.isInteger(q.answer)?String(q.options[q.answer]):String(q.sample||q.answer);}
function esc(v){return String(v).replace(/\|/g,"\\|").replace(/\r?\n/g,"／");}
function compact(v){return String(v==null?"":v).normalize("NFKC").replace(/[\s　，、。．；：！？!?「」『』（）()：,.]/g,"");}

/* 1. schema、數量、難度與逐題查證。 */
const expectedCounts={charphonetic:27,charphonetic_mc:27,wrongchar:12,vocab:12,vocab_mc:12,lessonmc:30,pattern:10,homophone:10,sentence:8,reading:4};
const counts={},ids=new Set(),stems=new Map(),explains=new Map(),validTags=new Set(["basic","trap","extend"]);
function checkQuestion(s,q,where){
  assert(q&&typeof q.stem==="string"&&q.stem.trim(),where+" stem 空白");assert(q&&typeof q.explain==="string"&&q.explain.trim().length>=8,where+" explain 空白或過短");if(!q)return;
  if(stems.has(q.stem))fail("題幹重複："+where+" 與 "+stems.get(q.stem));else stems.set(q.stem,where);
  if(explains.has(q.explain))fail("explain 完全重複："+where+" 與 "+explains.get(q.explain));else explains.set(q.explain,where);
  const kind=cfg.types.find(t=>t.key===s.type).kind;
  if(kind==="single"){assert(Array.isArray(q.options)&&q.options.length===4,where+" 單選題需 4 選項");assert(q.options&&new Set(q.options.map(String)).size===q.options.length,where+" 選項重複");assert(q.options&&Number.isInteger(q.answer)&&q.options[q.answer]!==undefined,where+" answer 不在 options");}
  else if(kind==="selfcheck"){assert(Array.isArray(q.keywords)&&q.keywords.length>=1,where+" 造句缺 keywords");assert(typeof q.sample==="string"&&q.sample.length>=12,where+" 造句缺 sample");assert(Array.isArray(q.rubric)&&q.rubric.length>=3,where+" 造句缺 rubric");}
  else assert(typeof q.answer==="string"&&q.answer.trim(),where+" 文字答案空白");
}
specs.forEach((s,si)=>{
  counts[s.type]=(counts[s.type]||0)+1;assert(!ids.has(s.id),"spec id 重複："+s.id);ids.add(s.id);
  assert(/^kx-6a-01-[a-z_]+-L[1-5]-\d{2}$/.test(s.id),"spec id 格式錯誤："+s.id);assert(validTags.has(s.tag),"tag 不合法："+s.id);
  assert(s.audit&&(Array.isArray(s.audit)||typeof s.audit==="object"),"缺 audit："+s.id);
  let raw;try{raw=rawOf(s,1000+si);}catch(e){fail("gen 失敗："+s.id+"｜"+e.message);return;}
  if(s.type==="reading"){assert(typeof raw.passage==="string"&&raw.passage.length>=150&&raw.passage.length<=250,s.id+" 閱讀短文需 150～250 字，實際 "+(raw.passage||"").length);assert(Array.isArray(raw.questions)&&raw.questions.length===5,s.id+" 閱讀題組不是 5 題");assert(Array.isArray(s.audit)&&s.audit.length===5,s.id+" 查證列不是 5 列");(raw.questions||[]).forEach((q,qi)=>checkQuestion(s,q,s.id+"#Q"+(qi+1)));}
  else{checkQuestion(s,raw,s.id);assert(!Array.isArray(s.audit),s.id+" 非題組 audit 不應是陣列");assert(String(s.audit.answer)===answerText(raw),s.id+" audit 答案與 gen 不一致");}
});
Object.keys(expectedCounts).forEach(k=>assert(counts[k]===expectedCounts[k],k+" 數量 "+(counts[k]||0)+"，預期 "+expectedCounts[k]));
assert(new Set(specs.map(s=>s.level)).size===5,"全題庫未涵蓋 level 1～5");assert(new Set(specs.map(s=>s.tag)).size===3,"全題庫未涵蓋 basic/trap/extend");

/* 2. 第一大題的本課生字注音、方向與「愣／楞」雙字形。 */
const LESSON_CHARS=new Set(Array.from("軸奪屈偏搬芥蒂抑拒悔拱距默鬥扭猛愣"));
const WORDZ={爭:["爭奪",0],絕:["拒絕",1],運:["搬運",1],離:["距離",1],志:["鬥志",1],然:["猛然",1],後:["後悔",0]};
const ph=specs.filter(s=>s.type==="charphonetic"),phUnits=new Set(ph.map(s=>s.lessonUnit).filter(Boolean));
assert(ph.length>=22&&phUnits.size>=22,"國字注音池需至少 22 個詞單位，實際 "+phUnits.size);
ph.forEach(s=>{if(dataText.includes("| "+s.factChar+" | "+s.factZhuyin+" |"))return;const wz=WORDZ[s.factChar];const row=wz&&dataText.split(/\r?\n/).find(l=>l.startsWith("| "+wz[0]+" |"));const parts=row?row.split("|")[2].trim().split(/\s+/).map(x=>x.replace("˙","")):[];assert(wz&&parts[wz[1]]===s.factZhuyin,s.id+" 注音不在資料表（生字表或語詞表）："+s.factChar+" "+s.factZhuyin);});
assert(ph.some(s=>s.direction==="z")&&ph.some(s=>s.direction==="h"),"第一大題需同時有國字寫注音與注音寫國字");
const leng=ph.find(s=>(s.leakTerms||[]).includes("愣住")),lengRaw=leng&&rawOf(leng,3333);
assert(lengRaw&&lengRaw.answer==="愣"&&(lengRaw.accepted||[]).includes("楞"),"「愣住」填字題必須同時接受「愣」「楞」");
assert(lengRaw&&/教育百科課文用字為「愣」.*辭典詞條作「楞住」/.test(lengRaw.explain),"「愣／楞」解析未說明課文與辭典字形差異");

/* 3. 禁止項與死碼掃描。 */
const forbidden=["陳肇宜","作者是","文體是","記敘文","資料檔","樣板","本樣板","S1","MOE","查證","又音","ㄐㄧㄢ ㄐㄧㄝˋ"];
const generated=[];
specs.forEach((s,i)=>{const r=rawOf(s,5000+i);if(s.type==="reading")generated.push(r.passage,r.passageTitle,...r.questions.flatMap(q=>[q.stem,q.explain,...(q.options||[])]));else generated.push(r.stem,r.explain,r.trapNote||"",r.sample||"",r.sampleNote||"",...(r.options||[]));const aa=Array.isArray(s.audit)?s.audit:[s.audit];aa.forEach((a,ai)=>{assert(a&&a.original===true,s.id+" audit 未標原創："+(ai+1));assert(a&&a.source,s.id+" audit 缺依據："+(ai+1));});});
const generatedBlob=generated.join("\n");forbidden.forEach(w=>assert(!generatedBlob.includes(w),"題庫出現禁止內容：「"+w+"」"));
assert(!generatedBlob.includes("拱手讓人 ㄍ")&&!generatedBlob.includes("拱手讓人（ㄍ"),"不得替「拱手讓人」標示未查得的注音");
const bankSource=fs.readFileSync(path.join(__dirname,"banks","bank-kx-6a-01.js"),"utf8");
assert(!/const\s+(WRONG|VOCAB|HOMO|SENTENCE|MC)\s*=/.test(bankSource),"仍有未註冊的舊 WRONG／VOCAB／HOMO／SENTENCE／MC 陣列");

/* 4. 400 份標準卷：版型、同 poolKey、洩題、內容占比與組合變化。 */
const unit=cfg.versions.kanghsuan.units[0],expectedOrder=["charphonetic","wrongchar","vocab","lessonmc","pattern","homophone","sentence","reading"];
const layout={charphonetic:[15,30],wrongchar:[5,10],vocab:[5,10],lessonmc:[10,20],pattern:[5,10],homophone:[4,4],sentence:[2,6],reading:[5,10]};
const minimumLesson={wrongchar:3,vocab:3,homophone:2,lessonmc:6};
let poolRepeats=0,leakCount=0,charLeakCount=0,charLeakPapers=new Set();const charLeakDetails=[];const leakDetails=[],phCombos=new Set(),sentenceCombos=new Set();
function visible(it){return compact([it.stem,...(it.options||[])].join("\n"));} // 閱讀 passage 依本輪定義不納入洩題掃描
for(let seed=1;seed<=400;seed++){
  let exam;try{exam=withSeed(seed,()=>engine.buildExam({mode:"score",units:[unit],types:cfg.defaultTypes,levelMin:1,levelMax:5}));}catch(e){fail("第 "+seed+" 份標準卷建卷失敗："+e.message);break;}
  assert(exam.total===100,"第 "+seed+" 份卷總分不是 100："+exam.total);assert(exam.sections.map(s=>s.type).join(",")===expectedOrder.join(","),"第 "+seed+" 份卷大題順序錯誤");
  exam.sections.forEach(sec=>{const want=layout[sec.type];assert(want&&sec.items.length===want[0]&&sec.points===want[1],"第 "+seed+" 份卷 "+sec.type+" 版型錯誤");if(minimumLesson[sec.type]){const n=sec.items.filter(it=>byId.get(it.specId).lessonBased).length;assert(n>=minimumLesson[sec.type],"第 "+seed+" 份卷 "+sec.type+" 本課題不足："+n+"/"+sec.items.length);}});
  const used=new Set();exam.items.forEach(it=>{const s=byId.get(it.specId),pk=s&&s.poolKey;if(pk){if(used.has(pk))poolRepeats++;else used.add(pk);}});
  const phSet=exam.sections.find(s=>s.type==="charphonetic").items.map(it=>(byId.get(it.specId).leakTerms||[])[0]).sort();phCombos.add(phSet.join("|"));
  const sentSet=exam.sections.find(s=>s.type==="sentence").items.map(it=>it.keywords[0]).sort();sentenceCombos.add(sentSet.join("|"));
  /* H4 單字層級洩題：目標字＝第一大題「注音寫國字」的答案字，以及答案字屬於本課生字的找錯字／選字題；
     目標字不得出現在同卷任何他題（造句除外、閱讀短文不計）的題幹或選項。 */
  exam.items.forEach((it,i)=>{const spec=byId.get(it.specId);let c=null;if(spec.type==="charphonetic"&&spec.direction==="h")c=spec.factChar;else if((spec.type==="wrongchar"||spec.type==="homophone")&&LESSON_CHARS.has(String(spec.audit.answer)))c=String(spec.audit.answer);if(!c)return;exam.items.forEach((other,j)=>{if(i===j)return;const os=byId.get(other.specId);if(os.type==="sentence")return;const hay=visible(other);if(hay.includes(c)){charLeakCount++;charLeakPapers.add(seed);if(charLeakDetails.length<60)charLeakDetails.push("第 "+seed+" 份卷：目標字「"+c+"」("+spec.id+") 出現在 "+os.id);}});});
  exam.items.forEach((it,i)=>{const spec=byId.get(it.specId),terms=(spec.leakTerms||[]).slice();if(spec.type==="charphonetic"&&spec.direction==="z")terms.push(spec.factZhuyin);const aliases=[...new Set(terms.map(compact).filter(Boolean))];exam.items.forEach((other,j)=>{if(i===j||byId.get(other.specId).type==="sentence")return;const hay=visible(other);aliases.forEach(a=>{if(hay.includes(a)){leakCount++;if(leakDetails.length<50)leakDetails.push("第 "+seed+" 份卷：第 "+(i+1)+" 題答案字詞「"+a+"」出現在第 "+(j+1)+" 題");}});});});
}
assert(charLeakCount===0,"400 份標準卷單字層級洩題 "+charLeakCount+" 次（"+charLeakPapers.size+" 份卷）");charLeakDetails.forEach(x=>fail("單字洩題："+x));assert(poolRepeats===0,"400 份標準卷發現同 poolKey 重複 "+poolRepeats+" 次");assert(leakCount===0,"400 份標準卷發現跨題洩題 "+leakCount+" 次");leakDetails.forEach(x=>fail("洩題："+x));
assert(phCombos.size>1,"第一大題 400 份卷的 15 格組合完全固定");assert(sentenceCombos.size>=5,"造句 400 份卷不同組合少於 5，實際 "+sentenceCombos.size);

/* 5. 照樣寫規則反例與 accepted 優先。 */
function pattern(fragment){const s=specs.find(x=>x.type==="pattern"&&rawOf(x,7400).stem.includes(fragment));return s&&engine.realize(s);}
const pAgain=pattern("又＿＿又＿＿"),pMore=pattern("越＿＿越＿＿"),pNotOnly=pattern("不但＿＿，而且＿＿"),pBecause=pattern("因為＿＿，所以＿＿"),pOne=pattern("一＿＿，就＿＿");
assert(pAgain&&pMore&&pNotOnly&&pBecause&&pOne,"缺少指定的照樣寫題型");
if(pAgain&&pMore&&pNotOnly&&pBecause&&pOne){[[pAgain,"又又又又"],[pMore,"越越越越"],[pNotOnly,"不但而且不但而且"],[pBecause,"因為所以因為所以"],[pOne,"一二三，就四五"],[pOne,"今天我就一個人去玩"]].forEach(x=>assert(!engine.isCorrect(x[0],x[1]),"照樣寫反例不應通過：『"+x[1]+"』"));assert(engine.isCorrect(pAgain,"又香又甜"),"accepted 命中應優先算對");}

/* H1：用題庫實際 10 個照樣寫題驗證 phraseRule 的正例（含 9 個曾被誤殺的正解）與反例。 */
const H1=[
["又明亮又寬敞",["又酸又甜","又大又圓","又高又壯"],["又又又又","又好好又棒棒","又一二又三四"]],
["越討論越清楚",["越跑越快","越寫越多","越想越生氣","越來越好"],["越越越越"]],
["有的搬桌子，有的排列椅子",["有的看書，有的畫畫"],[]],
["先確認數量，再貼上標籤",["先打掃再拖地","先洗手，再吃飯"],[]],
["一邊核對清單，一邊整理材料",["一邊寫作業，一邊聽廣播"],["一邊一二，一邊三四"]],
["不但準時完成，而且主動檢查",["不但認真，而且細心"],["不但而且不但而且","而且會游泳，不但會潛水"]],
["因為先分配工作，所以進度很順利",["因為下大雨，所以取消比賽"],["因為所以因為所以"]],
["一聽見鈴聲，就回到座位",["一下課，就衝出教室"],["一二三，就四五","今天我就一個人去玩","一一一就就就"]],
["雖然時間不多，但是大家仍仔細核對",["雖然很累，但是不放棄"],[]],
["如果每個人都盡責，就能準時完成",["如果下雨，就改期舉行"],[]]];
let h1Pass=0,h1Fail=0;
H1.forEach(c=>{const sp=specs.find(x=>x.type==="pattern"&&rawOf(x,7400).stem.includes("「"+c[0]+"」"));assert(sp,"H1 找不到照樣寫題："+c[0]);if(!sp)return;const it=engine.realize(sp);c[1].forEach(r=>{h1Pass++;assert(engine.isCorrect(it,r),"H1 正解被誤殺：『"+r+"』("+c[0]+")");});c[2].forEach(r=>{h1Fail++;assert(!engine.isCorrect(it,r),"H1 反例不應通過：『"+r+"』("+c[0]+")");});});

/* 6. 逐題查證表。 */
function buildAudit(){const rows=[];specs.forEach(s=>(Array.isArray(s.audit)?s.audit:[s.audit]).forEach((a,i)=>rows.push([s.id+(Array.isArray(s.audit)?"#Q"+(i+1):""),s.type,a.answer,a.source,a.original?"是（題幹／句子自編）":"否"])));const out=["# 國語第1課〈跑道〉逐題查證表","","> 由 `dist/courses/grade6-chinese-v2/verify-banks.js --write-audit` 依題庫內 `audit` 欄位產生。事實來源限 `國語樣板資料_第1課跑道.md`；閱讀短文、例句與題幹均為自編原創。","","| 題號 | 題型 | 答案 | 依據（資料檔第幾節／MOE 詞條） | 是否自編 |","|---|---|---|---|---|"];rows.forEach(r=>out.push("| "+r.map(esc).join(" | ")+" |"));out.push("","共 "+rows.length+" 列。","");return out.join("\n");}
const auditMarkdown=buildAudit();if(process.argv.includes("--write-audit"))fs.writeFileSync(auditFile,auditMarkdown,"utf8");assert(fs.existsSync(auditFile),"逐題查證表不存在；先執行 --write-audit");if(fs.existsSync(auditFile))assert(fs.readFileSync(auditFile,"utf8")===auditMarkdown,"逐題查證表與題庫 audit 欄位不同步");

console.log("grade6-chinese-v2 題庫規格："+(failures.length?"FAIL":"PASS"));
console.log("spec 數量："+specs.length+"｜"+Object.keys(expectedCounts).map(k=>k+"="+(counts[k]||0)).join("、"));
console.log("第一大題題池：詞單位="+phUnits.size+"；400 份不同組合="+phCombos.size);
console.log("標準卷 400 份：每份 100 分；同 poolKey 重複="+poolRepeats+"；違規洩題="+leakCount);
console.log("單字層級洩題掃描（生字不得出現在他題題幹／選項，造句與短文不計）：違規="+charLeakCount+"，涉及卷數="+charLeakPapers.size+"/400");
console.log("本課題最低占比：找錯字 3/5、語詞填空 3/5、選字 2/4、選擇題 6/10");
console.log("造句池：8 題；400 份不同組合="+sentenceCombos.size);
console.log("照樣寫反例：6 個指定反例均不得過關；accepted 命中仍算對");
console.log("H1 phraseRule：正例 "+h1Pass+" 句全過、反例 "+h1Fail+" 句全擋（題庫 10 題實測）");
console.log("逐題查證表："+(fs.existsSync(auditFile)?"PASS":"FAIL")+"（"+specs.reduce((n,s)=>n+(Array.isArray(s.audit)?s.audit.length:1),0)+" 列）");
failures.slice(0,100).forEach(x=>console.log("FAIL "+x));console.log(failures.length?"HAS FAIL ("+failures.length+")":"ALL PASS");process.exit(failures.length?1:0);
