(function(){
  "use strict";
  var KEY="guangyan-word-vault-v1";
  var familyDays={1:["bug","hug","mug","rug","jug"],2:["cake","lake","make","take","wake"],3:["ball","call","fall","tall","wall"]};
  var byWord=new Map(CORE_WORDS.map(function(x){return [x.word,x]}));
  var blank={version:1,completed:{},scores:{},started:{},activityDates:[]};
  var state=load(),rangeIndex=0,currentDay=1,currentStep=0,spellIndex=0,quizIndex=0,quizScore=0,deferredInstall=null,currentQuiz=null,quizWords=[];
  function el(q){return document.querySelector(q)}
  function cloneBlank(){return JSON.parse(JSON.stringify(blank))}
  function load(){try{var x=JSON.parse(localStorage.getItem(KEY)||"null");if(x&&x.version===1&&x.completed&&x.scores&&x.started)return Object.assign(cloneBlank(),x)}catch(e){console.warn(e)}return cloneBlank()}
  function save(){localStorage.setItem(KEY,JSON.stringify(state))}
  function esc(v){return String(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]})}
  function toast(m){var b=el("#toast");b.textContent=m;b.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(function(){b.classList.remove("show")},2500)}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function wordsFor(day){
    if(familyDays[day])return familyDays[day].map(function(w){return byWord.get(w)});
    var focus=day-1,indices=[focus,focus-1,focus-3,focus-7,focus-14],used={},out=[];
    indices.forEach(function(index){index=(index+365)%365;while(used[index])index=(index-1+365)%365;used[index]=true;out.push(CORE_WORDS[index])});
    if(out.length!==5||new Set(out.map(function(x){return x.word})).size!==5)throw new Error("Day "+day+" 資料不完整");
    return out;
  }
  for(var checkDay=1;checkDay<=365;checkDay++)wordsFor(checkDay);
  function firstIncomplete(){for(var d=1;d<=365;d++)if(!state.completed[d])return d;return 365}
  function completedCount(){return Object.keys(state.completed).filter(function(d){return state.completed[d]}).length}
  function learnedCount(){var learned=new Set();Object.keys(state.completed).forEach(function(day){if(state.completed[day])wordsFor(Number(day)).forEach(function(word){learned.add(word.word)})});return learned.size}
  function streak(){var n=0;for(var d=1;d<=365;d++){if(state.completed[d])n++;else break}return n}
  function renderDashboard(){
    el("#completedStat").textContent=completedCount();el("#streakStat").textContent=streak();el("#wordsStat").textContent=learnedCount();
    el("#todayStat").textContent="Day "+firstIncomplete();el("#dayJump").value=firstIncomplete();renderRanges();renderDays();
  }
  function renderRanges(){
    var html="";for(var s=1,i=0;s<=365;s+=30,i++){var e=Math.min(s+29,365);html+='<button class="'+(i===rangeIndex?"active":"")+'" data-range="'+i+'">Day '+s+"–"+e+"</button>"}
    el("#rangeRow").innerHTML=html;
  }
  function renderDays(){
    var start=rangeIndex*30+1,end=Math.min(start+29,365),html="";el("#rangeLabel").textContent="Day "+start+"–"+end;
    for(var d=start;d<=end;d++){var status=state.completed[d]?"completed":state.started[d]?"in-progress":"",symbol=status==="completed"?"●":status==="in-progress"?"◐":"○",review=d%7===0?"週複習":"每日 5 字";html+='<button class="day-btn '+status+'" data-day="'+d+'" aria-label="Day '+d+"，"+review+'"><b>'+symbol+" Day "+d+"</b><span>"+review+"</span></button>"}
    el("#dayGrid").innerHTML=html;
  }
  function renderJunior(grade){
    var names={7:"七年級",8:"八年級",9:"九年級"},mods=[
      ["🗂️","每日單字","依課本單元建立每日任務，支援詞性、音標與間隔複習。"],
      ["🧩","片語與句型","把片語、文法句型與替換練習分開管理。"],
      ["📖","例句與閱讀","單字連結例句、短文理解與朗讀任務。"],
      ["✅","複習與測驗","每週複習、拼字、聽寫與成績紀錄獨立保存。"]
    ],html="";
    mods.forEach(function(m){html+='<article class="module-card card"><div class="icon">'+m[0]+"</div><h3>"+names[grade]+"｜"+m[1]+"</h3><p>"+m[2]+"</p><footer>資料模組已預留 · 等待正式教材</footer></article>"});
    el("#juniorRoadmap").innerHTML=html;
  }
  function selectLevel(level){
    document.querySelectorAll(".level-tab").forEach(function(tab){var on=tab.dataset.level===level;tab.classList.toggle("active",on);tab.setAttribute("aria-selected",String(on))});
    el("#elementaryPanel").hidden=level!=="elementary";el("#juniorPanel").hidden=level!=="junior";if(level==="junior")renderJunior(Number(el(".grade-tab.active").dataset.grade));
  }
  function openDay(day){
    currentDay=Math.max(1,Math.min(365,Number(day)||1));currentStep=0;spellIndex=0;quizIndex=0;quizScore=0;state.started[currentDay]=true;save();document.title="Day "+currentDay+"｜英語單字儲備庫";
    el("#libraryView").hidden=true;el("#dashboardView").hidden=true;el("#lessonView").hidden=false;var words=wordsFor(currentDay);
    el("#lessonTitle").textContent="Day "+currentDay;el("#lessonTheme").textContent=(familyDays[currentDay]?"特別入門組｜":"")+words[0].topic;
    el("#lessonSubtitle").textContent="本日 5 字："+words.map(function(x){return x.word}).join(" · ")+(currentDay%7===0?"｜小測驗使用最近 7 天的複習題庫":"");
    if(currentDay%7===0){var map=new Map();for(var reviewDay=Math.max(1,currentDay-6);reviewDay<=currentDay;reviewDay++)wordsFor(reviewDay).forEach(function(word){map.set(word.word,word)});quizWords=shuffle(Array.from(map.values())).slice(0,5)}else quizWords=words.slice();
    el('[data-action="prev"]').disabled=currentDay===1;el('[data-action="next"]').disabled=currentDay===365;renderStep();window.scrollTo({top:0,behavior:"smooth"});
  }
  function renderStep(){
    var labels=["① 看單字","② 聽發音","③ 跟讀","④ 拼字","⑤ 小測驗"],html="";
    labels.forEach(function(label,i){html+='<div class="step '+(i===currentStep?"active":i<currentStep?"done":"")+'">'+label+"</div>"});el("#stepper").innerHTML=html;
    ["learnPanel","spellPanel","quizPanel","resultPanel"].forEach(function(id){el("#"+id).hidden=true});
    if(currentStep<=2)renderLearn();else if(currentStep===3)renderSpell();else renderQuiz();
  }
  function cards(){
    return wordsFor(currentDay).map(function(item,i){return '<article class="word-card '+(i===0?"focus-word":"")+'">'+(i===0?'<span class="new">今日焦點</span>':"")+"<h3>"+esc(item.word)+"</h3><p>"+esc(item.zh)+"</p><small>"+esc(item.ipa||item.hint)+'</small><button class="btn speak" data-speak="'+esc(item.word)+'">🔊 聽發音</button></article>'}).join("");
  }
  function renderLearn(){
    var p=el("#learnPanel"),copy=currentStep===0?["先看英文與中文","記住五個字的外型與意思。","已看完，下一步"]:currentStep===1?["逐字聽發音","每個單字至少按一次播放鍵。","已聽完，下一步"]:["大聲跟讀","聽一次、跟著說一次，再進入拼字。","完成跟讀，開始拼字"];
    p.hidden=false;p.innerHTML="<h2>"+copy[0]+"</h2><p>"+copy[1]+'</p><div class="word-grid">'+cards()+'</div><div class="panel-actions"><span></span><button class="btn btn-primary" data-action="step-next">'+copy[2]+"</button></div>";
  }
  function renderSpell(){
    var p=el("#spellPanel"),w=wordsFor(currentDay)[spellIndex];p.hidden=false;
    p.innerHTML='<div class="practice"><h2>拼字練習 '+(spellIndex+1)+'／5</h2><div class="question"><p>請輸入「<strong>'+esc(w.zh)+'</strong>」的英文：</p><button class="btn" data-speak="'+esc(w.word)+'">🔊 再聽一次</button><label for="spellAnswer">英文答案</label><input id="spellAnswer" autocomplete="off" autocapitalize="none" spellcheck="false"><div id="spellFeedback" class="feedback"></div><button class="btn btn-primary" data-action="check-spell">確認拼字</button></div></div>';
    setTimeout(function(){if(el("#spellAnswer"))el("#spellAnswer").focus()},0);
  }
  function checkSpell(){
    var input=el("#spellAnswer"),w=wordsFor(currentDay)[spellIndex],f=el("#spellFeedback");
    if(input.value.trim().toLowerCase()===w.word.toLowerCase()){f.textContent="答對了！";f.className="feedback ok";setTimeout(function(){spellIndex++;if(spellIndex>=5){currentStep=4;quizIndex=0;quizScore=0;renderStep()}else renderSpell()},400)}
    else{f.textContent="還差一點，再聽一次並重新輸入。";f.className="feedback bad";input.select()}
  }
  function makeQuestion(){var answer=quizWords[quizIndex],others=shuffle(CORE_WORDS.filter(function(x){return x.word!==answer.word})).slice(0,3);return {answer:answer,choices:shuffle([answer].concat(others))}}
  function renderQuiz(){
    var p=el("#quizPanel");p.hidden=false;if(quizIndex>=5){finishQuiz();return}currentQuiz=makeQuestion();
    p.innerHTML='<div class="practice"><h2>五題小測驗 '+(quizIndex+1)+'／5</h2><div class="question"><p>「<strong>'+esc(currentQuiz.answer.word)+'</strong>」是哪一個意思？</p><div class="choices">'+currentQuiz.choices.map(function(x){return '<button class="choice" data-answer="'+esc(x.word)+'">'+esc(x.zh)+"</button>"}).join("")+"</div></div></div>";
  }
  function chooseAnswer(word){if(word===currentQuiz.answer.word)quizScore++;quizIndex++;renderQuiz()}
  function finishQuiz(){
    var score=quizScore*20,pass=score>=90;el("#quizPanel").hidden=true;el("#resultPanel").hidden=false;state.scores[currentDay]=Math.max(Number(state.scores[currentDay]||0),score);
    if(pass){state.completed[currentDay]=true;var date=new Date().toISOString().slice(0,10);if(state.activityDates.indexOf(date)<0)state.activityDates.push(date)}save();
    el("#resultPanel").innerHTML='<div class="result"><span class="kicker">Day '+currentDay+' 測驗結果</span><div class="score">'+score+" 分</div><h2>"+(pass?"通過，已記錄完成":"未達 90 分，請再複習")+"</h2><p>"+(pass?"可以前往下一天。":"拼字或意思還不熟，重考會重新排列選項。")+'</p><div class="panel-actions"><button class="btn" data-action="retry">'+(pass?"再練一次":"重新測驗")+'</button><button class="btn btn-primary" data-action="'+(currentDay===365?"english":"next")+'">'+(currentDay===365?"返回英語儲備庫":"前往下一天")+"</button></div></div>";
  }
  function speak(word){if(!("speechSynthesis" in window)){toast("此瀏覽器不支援語音播放");return}speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(word);u.lang="en-US";u.rate=.82;speechSynthesis.speak(u)}
  function home(){if("speechSynthesis" in window)speechSynthesis.cancel();document.title="光言學習區｜教材中心";el("#lessonView").hidden=true;el("#dashboardView").hidden=true;el("#libraryView").hidden=false;window.scrollTo({top:0,behavior:"smooth"})}
  function showEnglish(){if("speechSynthesis" in window)speechSynthesis.cancel();document.title="英語｜單字儲備庫";el("#libraryView").hidden=true;el("#lessonView").hidden=true;el("#dashboardView").hidden=false;renderDashboard();window.scrollTo({top:0,behavior:"smooth"})}
  function exportData(){var blob=new Blob([JSON.stringify({app:"guangyan-word-vault",exportedAt:new Date().toISOString(),state:state},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="英語單字儲備庫_學習進度.json";a.click();URL.revokeObjectURL(url);toast("進度已匯出")}
  function importData(file){file.text().then(function(text){var data=JSON.parse(text);if(!data||data.app!=="guangyan-word-vault"||!data.state||data.state.version!==1||typeof data.state.completed!=="object")throw new Error("bad");state=Object.assign(cloneBlank(),data.state);save();renderDashboard();toast("進度匯入成功")}).catch(function(){toast("匯入失敗：檔案格式不正確")})}
  document.addEventListener("click",function(event){
    var x=event.target.closest("[data-speak]");if(x){speak(x.dataset.speak);return}x=event.target.closest("[data-day]");if(x){openDay(x.dataset.day);return}x=event.target.closest("[data-range]");if(x){rangeIndex=Number(x.dataset.range);renderRanges();renderDays();return}x=event.target.closest("[data-level]");if(x){selectLevel(x.dataset.level);return}x=event.target.closest("[data-grade]");if(x){document.querySelectorAll(".grade-tab").forEach(function(t){t.classList.toggle("active",t===x)});renderJunior(Number(x.dataset.grade));return}x=event.target.closest("[data-answer]");if(x){chooseAnswer(x.dataset.answer);return}
    var action=event.target.closest("[data-action]");action=action&&action.dataset.action;if(!action)return;
    if(action==="home")home();else if(action==="english")showEnglish();else if(action==="continue"||action==="today")openDay(firstIncomplete());else if(action==="jump")openDay(el("#dayJump").value);else if(action==="prev")openDay(currentDay-1);else if(action==="next")openDay(currentDay+1);else if(action==="step-next"){currentStep++;renderStep()}else if(action==="check-spell")checkSpell();else if(action==="retry"){currentStep=3;spellIndex=0;quizIndex=0;quizScore=0;renderStep()}else if(action==="export")exportData();
  });
  el("#importFile").addEventListener("change",function(e){if(e.target.files[0])importData(e.target.files[0]);e.target.value=""});
  document.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.id==="spellAnswer")checkSpell()});
  window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredInstall=e;el("#installBtn").hidden=false});
  el("#installBtn").addEventListener("click",function(){if(!deferredInstall)return;deferredInstall.prompt();deferredInstall.userChoice.then(function(){deferredInstall=null;el("#installBtn").hidden=true})});
  function network(){el("#networkBadge").textContent=navigator.onLine?"線上模式":"離線模式"}window.addEventListener("online",network);window.addEventListener("offline",network);network();
  if("serviceWorker" in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("./sw.js").catch(console.warn)});
  renderJunior(7);renderDashboard();
})();

