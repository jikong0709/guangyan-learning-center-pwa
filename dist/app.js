(function(){
  "use strict";
  var P=window.EnglishPlan;
  var KEY="guangyan-word-vault-v1",BACKUP_KEY=KEY+"-backup-v1",SCHEMA=2;
  var plan=P.buildPlan(CORE_WORDS);
  var TOTAL_DAYS=plan.totalDays,TOTAL_WEEKS=plan.weekCount,TOTAL_WORDS=plan.totalWords;
  var LABELS={en2zh:"英翻中",zh2en:"中翻英",spell:"拼字",listen:"聽音選字"};
  var state=load(),mode="day",currentDay=1,currentWeek=1,currentStep=0,spellIndex=0,deferredInstall=null,session=null,lastWeeklyWords=null,lastSampleWords=null;
  function el(q){return document.querySelector(q)}
  function blankState(){return {schemaVersion:SCHEMA,completed:{},weekPassed:{},scores:{},weekScores:{},started:{},activityDates:[],wrong:{},sampleBest:0,samplePassed:false,migrationNotice:false}}
  function isObj(x){return x&&typeof x==="object"&&!Array.isArray(x)}
  function cleanFlags(src,max){var out={};if(isObj(src))Object.keys(src).forEach(function(k){var n=Number(k);if(src[k]&&n>=1&&n<=max&&Math.floor(n)===n)out[n]=true});return out}
  function cleanNumbers(src,max){var out={};if(isObj(src))Object.keys(src).forEach(function(k){var n=Number(k),v=Number(src[k]);if(n>=1&&n<=max&&Math.floor(n)===n&&isFinite(v))out[n]=v});return out}
  function normalize(x){
    var s=blankState();
    s.completed=cleanFlags(x.completed,TOTAL_DAYS);s.weekPassed=cleanFlags(x.weekPassed,TOTAL_WEEKS);s.started=cleanFlags(x.started,TOTAL_DAYS);
    s.scores=cleanNumbers(x.scores,TOTAL_DAYS);s.weekScores=cleanNumbers(x.weekScores,TOTAL_WEEKS);
    if(Array.isArray(x.activityDates))s.activityDates=x.activityDates.filter(function(d){return /^\d{4}-\d{2}-\d{2}$/.test(String(d))});
    if(isObj(x.wrong))Object.keys(x.wrong).forEach(function(w){var n=Number(x.wrong[w]);if(n>0&&isFinite(n))s.wrong[w]=Math.floor(n)});
    var sb=Number(x.sampleBest);s.sampleBest=isFinite(sb)?Math.max(0,Math.min(100,Math.round(sb))):0;s.samplePassed=x.samplePassed===true;
    s.migrationNotice=!!x.migrationNotice;
    return s;
  }
  function storeGet(k){try{return localStorage.getItem(k)}catch(e){console.warn("localStorage 讀取失敗",e);return null}}
  function storeSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){console.warn("localStorage 寫入失敗",e);return false}}
  function backupOld(raw,suffixKey){
    var k=suffixKey||BACKUP_KEY;
    if(storeGet(k)!==null)k=k+"-"+Date.now();
    storeSet(k,raw);
  }
  function load(){
    var raw=storeGet(KEY);if(raw===null)return blankState();
    var x=null;
    try{x=JSON.parse(raw)}catch(e){console.warn("進度資料無法解析，已備份原始內容",e);backupOld(raw,KEY+"-backup-corrupt");return blankState()}
    if(isObj(x)&&x.schemaVersion===SCHEMA&&isObj(x.completed))return normalize(x);
    if(!isObj(x))return blankState();
    // 舊版（舊的天數編號）：備份後重新開始
    backupOld(raw);
    var hadProgress=(isObj(x.completed)&&Object.keys(x.completed).length>0)||(isObj(x.started)&&Object.keys(x.started).length>0);
    var s=blankState();s.migrationNotice=hadProgress;
    storeSet(KEY,JSON.stringify(s));
    return s;
  }
  function save(){
    var ok=storeSet(KEY,JSON.stringify(state));
    if(ok)document.dispatchEvent(new CustomEvent("meihao:progress-changed",{detail:{state:JSON.parse(JSON.stringify(state)),schemaVersion:SCHEMA}}));
    return ok;
  }
  function esc(v){return String(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]})}
  function toast(m){var b=el("#toast");b.textContent=m;b.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(function(){b.classList.remove("show")},2500)}
  function canSpeak(){return "speechSynthesis" in window&&typeof SpeechSynthesisUtterance!=="undefined"}
var SYN_HINT="<small class=\"hint\">（有多個英文字都能表示這個意思時，答對任何一個都算對）</small>";
  function dayObj(day){return plan.days[day-1]}
  function weekObj(w){return plan.weeks[w-1]}
  function taskOf(kind,n){return kind==="d"?plan.tasks[dayObj(n).taskNo-1]:plan.tasks[weekObj(n).taskNo-1]}
  function passed(t){return P.isTaskPassed(state,t)}
  function unlocked(t){return P.isUnlocked(plan,state,t.no)}
  function nextTask(){return P.nextTask(plan,state)}
  function completedCount(){return Object.keys(state.completed).filter(function(d){return state.completed[d]}).length}
  function weekPassedCount(){return Object.keys(state.weekPassed).filter(function(d){return state.weekPassed[d]}).length}
  function learnedList(){return P.learnedWords(plan,state)}
  function streak(){var n=0;for(var d=1;d<=TOTAL_DAYS;d++){if(state.completed[d])n++;else break}return n}
  function poolUpTo(day){var out=[];for(var d=1;d<=day;d++)dayObj(d).words.forEach(function(w){out.push(w)});return out}
  function ctx(primary){return {all:CORE_WORDS,primary:primary,rng:Math.random,canSpeak:canSpeak()}}

  /* ---------- 儀表板 ---------- */
  function renderDashboard(){
    var nt=nextTask(),done=P.allDone(plan,state);
    el("#completedStat").textContent=completedCount();el("#wordsStat").textContent=learnedList().length;el("#weekStat").textContent=weekPassedCount();el("#streakStat").textContent=streak();
    el("#nextTaskText").textContent=done?"全部任務都亮燈了，太棒了！可以用「進度抽考」繼續練習。":"下一個任務："+(nt.type==="day"?"Day "+nt.day+"（"+dayObj(nt.day).topic+"）":"第 "+nt.week+" 週 週考");
    el("#dayJump").value=nt.type==="day"?nt.day:weekObj(nt.week).lastDay;
    el("#sampleStatus").textContent=state.sampleBest>0||state.samplePassed?"最高分 "+state.sampleBest+"／100｜"+(state.samplePassed?"已通過 ✅":"尚未通過"):"尚未考過";
    el("#migrateNotice").hidden=!state.migrationNotice;
    renderWeeks();
  }
  function lamp(t,nextNo){
    var isPassed=passed(t),isLocked=!isPassed&&!unlocked(t),isCurrent=!isPassed&&!isLocked&&t.no===nextNo,exam=t.type==="week";
    var cls="lamp-cell "+(exam?"exam ":"")+(isPassed?"passed":isLocked?"locked":isCurrent?"current":"open");
    var label=exam?"週考":"D"+t.day,full=exam?"第 "+t.week+" 週週考":"Day "+t.day;
    var status=isPassed?"已亮燈":isLocked?"尚未解鎖":isCurrent?"進行中":"未通過";
    return '<button class="'+cls+'" data-task="'+(exam?"w:"+t.week:"d:"+t.day)+'" aria-label="'+full+"，"+status+'"'+(isLocked?' aria-disabled="true"':"")+'><span class="lamp" aria-hidden="true">'+(isLocked?"🔒":isPassed?"✓":"")+"</span><b>"+label+"</b></button>";
  }
  function renderWeeks(){
    var nextNo=nextTask().no,html="";
    plan.weeks.forEach(function(w){
      var tasks=w.days.map(function(d){return plan.tasks[dayObj(d).taskNo-1]}).concat([plan.tasks[w.taskNo-1]]),done=tasks.filter(passed).length;
      html+='<article class="week-row card"><header><div><b>第 '+w.week+' 週</b><small>Day '+w.firstDay+"–"+w.lastDay+"＋週考</small></div><span>"+done+"／"+tasks.length+'</span></header><div class="lamp-grid" style="--cells:'+tasks.length+'">'+tasks.map(function(t){return lamp(t,nextNo)}).join("")+"</div></article>";
    });
    el("#weekList").innerHTML=html;
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
  function renderCourseVersions(){
    ["math","chinese","social","science"].forEach(function(key){
      var target=el("#"+key+"VersionList"),catalog=window.MEIHAO_COURSE_CATALOG&&window.MEIHAO_COURSE_CATALOG[key];
      if(!target||!catalog)return;
      target.innerHTML=catalog.versions.map(function(version){
        var ready=version.status==="ready";
        return '<div class="version-item '+(ready?'is-ready':'is-planned')+'"><div><strong>'+esc(version.name)+'</strong><small>'+esc(version.note)+'</small></div>'+(ready?'<a class="version-action" href="'+esc(version.href)+'">開始學習</a>':'<span class="version-status">待加入教材</span>')+'</div>';
      }).join("");
    });
  }
  function setAffiliateTheme(theme){
    var root=el("[data-affiliate-carousel]");if(!root)return;root.dataset.theme=theme;
    if(window.AffiliateCarousel&&typeof window.AffiliateCarousel.setTheme==="function")window.AffiliateCarousel.setTheme(root,theme);
  }
  function selectLevel(level){
    document.querySelectorAll(".level-tab").forEach(function(tab){var on=tab.dataset.level===level;tab.classList.toggle("active",on);tab.setAttribute("aria-selected",String(on))});
    el("#elementaryPanel").hidden=level!=="elementary";el("#juniorPanel").hidden=level!=="junior";if(level==="junior")renderJunior(Number(el(".grade-tab.active").dataset.grade));
    if(!el("#dashboardView").hidden)setAffiliateTheme(level==="junior"?"english-junior":"english-elementary");
  }

  /* ---------- 進入任務 ---------- */
  function showLesson(){el("#libraryView").hidden=true;el("#dashboardView").hidden=true;el("#lessonView").hidden=false;setAffiliateTheme("english-elementary")}
  function resetPanels(){["learnPanel","spellPanel","quizPanel","resultPanel"].forEach(function(id){el("#"+id).hidden=true})}
  function updateNav(){
    var nav=el(".lesson-nav");nav.hidden=mode==="sample";if(mode==="sample")return;
    var t=mode==="day"?taskOf("d",currentDay):taskOf("w",currentWeek),prev=plan.tasks[t.no-2],next=plan.tasks[t.no];
    el('[data-action="prev"]').disabled=!prev;el('[data-action="next"]').disabled=!next||!passed(t)&&!unlocked(next);
  }
  function openDay(day){
    day=Math.max(1,Math.min(TOTAL_DAYS,Number(day)||1));
    var t=taskOf("d",day);if(!unlocked(t)){toast("尚未解鎖：請先通過前面的任務");return}
    mode="day";currentDay=day;currentStep=0;spellIndex=0;session=null;state.started[day]=true;save();document.title="Day "+day+"｜英語單字儲備庫";
    showLesson();var d=dayObj(day);
    el("#lessonTitle").textContent="Day "+day;el("#lessonTheme").textContent=(d.family?"特別入門組｜":"")+d.topic+(passed(t)?"｜已亮燈":"");
    el("#lessonSubtitle").textContent="本日 5 個新字："+d.words.map(function(x){return x.word}).join(" · ")+"｜學完小考 10 題，全對才亮燈";
    updateNav();renderStep();window.scrollTo({top:0,behavior:"smooth"});
  }
  function openWeek(w){
    w=Math.max(1,Math.min(TOTAL_WEEKS,Number(w)||1));
    var t=taskOf("w",w);if(!unlocked(t)){toast("尚未解鎖：請先通過前面的任務");return}
    mode="week";currentWeek=w;session=null;lastWeeklyWords=null;document.title="第 "+w+" 週週考｜英語單字儲備庫";
    showLesson();var wk=weekObj(w);
    el("#lessonTitle").textContent="第 "+w+" 週 週考";el("#lessonTheme").textContent="週考日｜Day "+wk.firstDay+"–"+wk.lastDay+(passed(t)?"｜已亮燈":"");
    el("#lessonSubtitle").textContent="從本週學過的 "+wk.words.length+" 個字抽 10 個不同的字各考 1 題，全對才通過。";
    el("#stepper").innerHTML='<div class="step active" style="grid-column:1/-1">週考</div>';
    resetPanels();var p=el("#learnPanel");p.hidden=false;
    p.innerHTML="<h2>先快速看一遍本週單字</h2><p>點一下喇叭可以聽發音，準備好了再開始週考。</p><div class=\"chip-list\">"+wk.words.map(function(x){return '<button class="chip" data-speak="'+esc(x.word)+'">🔊 '+esc(x.word)+"<small>"+esc(x.zh)+"</small></button>"}).join("")+'</div><div class="panel-actions"><span></span><button class="btn btn-primary" data-action="start-session">開始週考</button></div>';
    updateNav();window.scrollTo({top:0,behavior:"smooth"});
  }
  function openSample(){
    var learned=learnedList();
    if(!learned.length){toast("還沒有學過的字：先完成 Day 1 小考亮燈吧");return}
    mode="sample";session=null;lastSampleWords=null;document.title="進度抽考｜英語單字儲備庫";showLesson();
    el("#lessonTitle").textContent="📝 進度抽考";el("#lessonTheme").textContent="已學過的 "+learned.length+" 個字";
    el("#lessonSubtitle").textContent="依目前進度隨機抽 10 題，滿分 100 分，80 分以上通過；不影響學習日與週考的亮燈。";
    el("#stepper").innerHTML="";updateNav();startSession();window.scrollTo({top:0,behavior:"smooth"});
  }
  function openTask(spec){var p=String(spec).split(":");if(p[0]==="w")openWeek(p[1]);else openDay(p[1])}
  function openNextTask(){var t=nextTask();if(t.type==="week")openWeek(t.week);else openDay(t.day)}

  /* ---------- 每日學習步驟 ---------- */
  function renderStep(){
    var labels=["① 看單字","② 聽發音","③ 跟讀","④ 拼字","⑤ 小考"],html="";
    labels.forEach(function(label,i){html+='<div class="step '+(i===currentStep?"active":i<currentStep?"done":"")+'">'+label+"</div>"});el("#stepper").innerHTML=html;
    resetPanels();
    if(currentStep<=2)renderLearn();else if(currentStep===3)renderSpell();else startSession();
  }
  function cards(){
    return dayObj(currentDay).words.map(function(item,i){return '<article class="word-card '+(i===0?"focus-word":"")+'">'+(i===0?'<span class="new">今日焦點</span>':"")+"<h3>"+esc(item.word)+"</h3><p>"+esc(item.zh)+"</p><small>"+esc(item.ipa||item.hint)+'</small><button class="btn speak" data-speak="'+esc(item.word)+'">🔊 聽發音</button></article>'}).join("");
  }
  function renderLearn(){
    var p=el("#learnPanel"),copy=currentStep===0?["先看英文與中文","記住五個字的外型與意思。","已看完，下一步"]:currentStep===1?["逐字聽發音","每個單字至少按一次播放鍵。","已聽完，下一步"]:["大聲跟讀","聽一次、跟著說一次，再進入拼字。","完成跟讀，開始拼字"];
    p.hidden=false;p.innerHTML="<h2>"+copy[0]+"</h2><p>"+copy[1]+'</p><div class="word-grid">'+cards()+'</div><div class="panel-actions"><span></span><button class="btn btn-primary" data-action="step-next">'+copy[2]+"</button></div>";
  }
  function renderSpell(){
    var p=el("#spellPanel"),w=dayObj(currentDay).words[spellIndex];p.hidden=false;
    p.innerHTML='<div class="practice"><h2>拼字練習 '+(spellIndex+1)+'／5</h2><div class="question"><p>請輸入「<strong>'+esc(w.zh)+'</strong>」的英文：</p><button class="btn" data-speak="'+esc(w.word)+'">🔊 再聽一次</button><label for="spellAnswer">英文答案</label>'+(P.synonymsOf(w,CORE_WORDS).length>1?SYN_HINT:"")+'<input id="spellAnswer" autocomplete="off" autocapitalize="none" spellcheck="false"><div id="spellFeedback" class="feedback"></div><button class="btn btn-primary" data-action="check-spell">確認拼字</button></div></div>';
    setTimeout(function(){if(el("#spellAnswer"))el("#spellAnswer").focus()},0);
  }
  function checkSpell(){
    var input=el("#spellAnswer"),w=dayObj(currentDay).words[spellIndex],f=el("#spellFeedback");
    if(!input)return;
    if(P.isSpellCorrect({answer:w.word,accept:P.synonymsOf(w,CORE_WORDS)},input.value)){f.textContent="答對了！";f.className="feedback ok";input.disabled=true;setTimeout(function(){spellIndex++;if(spellIndex>=5){currentStep=4;renderStep()}else renderSpell()},400)}
    else{f.textContent="還差一點，再聽一次並重新輸入。";f.className="feedback bad";input.select()}
  }

  /* ---------- 小考／週考／進度抽考（共用作答流程） ---------- */
  function startSession(){
    var qs;
    if(mode==="day")qs=P.makeDailyQuiz(dayObj(currentDay).words,ctx(poolUpTo(currentDay)));
    else if(mode==="week"){qs=P.makeWeeklyQuiz(weekObj(currentWeek).words,ctx(poolUpTo(weekObj(currentWeek).lastDay)),lastWeeklyWords);lastWeeklyWords=qs.map(function(q){return q.word})}
    else if(mode==="sample"){qs=P.makeSampleExam(learnedList(),state.wrong,ctx(learnedList()),lastSampleWords);lastSampleWords=qs.map(function(q){return q.word})}
    session={ctx:sessionCtx(),questions:qs,i:0,correct:0,answered:false,mistakes:[]};
    resetPanels();renderQuestion();
  }
  function sessionCtx(){return mode==="day"?ctx(poolUpTo(currentDay)):mode==="week"?ctx(poolUpTo(weekObj(currentWeek).lastDay)):ctx(learnedList())}
  function skipListen(){
    if(!session||session.answered)return;var q=session.questions[session.i];if(!q||q.type!=="listen")return;
    session.questions[session.i]=P.replaceListen(session.questions,session.i,session.ctx);renderQuestion();
  }
  function sessionTitle(){return mode==="day"?"Day "+currentDay+" 小考":mode==="week"?"第 "+currentWeek+" 週 週考":"進度抽考"}
  function renderQuestion(){
    var p=el("#quizPanel"),q=session.questions[session.i],n=session.questions.length;p.hidden=false;session.answered=false;
    if(session.i>=n){finishSession();return}
    var body="";
    if(q.type==="en2zh")body='<p>「<strong>'+esc(q.word)+'</strong>」是哪一個意思？</p><button class="btn" data-speak="'+esc(q.word)+'">🔊 聽發音</button>';
    else if(q.type==="zh2en")body='<p>「<strong>'+esc(q.zh)+'</strong>」的英文是哪一個？</p>';
    else if(q.type==="listen")body='<p>按下喇叭，選出你聽到的單字：</p><button class="btn btn-primary" data-speak="'+esc(q.word)+'">🔊 播放發音</button> <button class="btn btn-ghost" data-action="skip-listen">🔇 聽不到？換一題</button>';
    else body='<p>請輸入「<strong>'+esc(q.zh)+'</strong>」的英文：</p><button class="btn" data-speak="'+esc(q.word)+'">🔊 聽發音</button>';
    var input=q.type==="spell"?'<label for="quizAnswer">英文答案</label>'+(q.accept&&q.accept.length>1?SYN_HINT:"")+'<input id="quizAnswer" autocomplete="off" autocapitalize="none" spellcheck="false"><button class="btn btn-primary" data-action="check-quiz-spell">確認拼字</button>':'<div class="choices">'+q.choices.map(function(c,i){return '<button class="choice" data-pick="'+i+'">'+esc(c)+"</button>"}).join("")+"</div>";
    p.innerHTML='<div class="practice"><h2>'+esc(sessionTitle())+" "+(session.i+1)+"／"+n+'</h2><div class="quiz-bar" aria-hidden="true"><i style="width:'+Math.round(session.i/n*100)+'%"></i></div><div class="question"><span class="qtype">'+LABELS[q.type]+"</span>"+body+input+'<div id="quizFeedback" class="feedback" aria-live="polite"></div><button id="quizNext" class="btn btn-primary" data-action="q-next" hidden>'+(session.i+1>=n?"看結果":"下一題")+"</button></div></div>";
    if(q.type==="spell")setTimeout(function(){if(el("#quizAnswer"))el("#quizAnswer").focus()},0);
  }
  function recordAnswer(q,ok){
    if(ok){session.correct++;if(mode==="sample"&&state.wrong[q.word]>0){state.wrong[q.word]--;if(state.wrong[q.word]<=0)delete state.wrong[q.word]}}
    else{session.mistakes.push({word:q.word,zh:q.zh});state.wrong[q.word]=(state.wrong[q.word]||0)+1}
    save();
  }
  function showFeedback(q,ok){
    var f=el("#quizFeedback");f.textContent=ok?"答對了！":"答錯了，正確答案是：「"+q.answer+"」";
    f.className="feedback "+(ok?"ok":"bad");el("#quizNext").hidden=false;el("#quizNext").focus();
  }
  function pickChoice(idx){
    if(!session||session.answered)return;var q=session.questions[session.i],text=q.choices[idx],ok=text===q.answer;session.answered=true;
    document.querySelectorAll("#quizPanel .choice").forEach(function(b,i){b.disabled=true;if(q.choices[i]===q.answer)b.classList.add("right");else if(i===idx)b.classList.add("wrong")});
    recordAnswer(q,ok);showFeedback(q,ok);
  }
  function checkQuizSpell(){
    if(!session||session.answered)return;var q=session.questions[session.i],input=el("#quizAnswer");if(!input)return;
    var ok=P.isSpellCorrect(q,input.value);session.answered=true;input.disabled=true;
    var b=el('[data-action="check-quiz-spell"]');if(b)b.hidden=true;
    recordAnswer(q,ok);showFeedback(q,ok);
  }
  function finishSession(){
    var n=session.questions.length,c=session.correct,ok=P.isPass(c,n),html="";
    el("#quizPanel").hidden=true;var r=el("#resultPanel");r.hidden=false;
    var wrongText=session.mistakes.length?"<p>這次答錯的字："+session.mistakes.map(function(m){return "<strong>"+esc(m.word)+"</strong>"}).join("、")+"</p>":"";
    if(mode==="sample"){
      var score=P.sampleScore(c,n),sp=P.isSamplePass(score);
      state.sampleBest=Math.max(state.sampleBest||0,score);if(sp)state.samplePassed=true;save();
      var det=session.mistakes.length?'<p>答錯的字與正確答案：</p><ul class="wrong-list">'+session.mistakes.map(function(m){return "<li><strong>"+esc(m.word)+"</strong>："+esc(m.zh)+"</li>"}).join("")+"</ul>":"";
      el("#resultPanel").innerHTML='<div class="result"><span class="kicker">進度抽考結果</span><div class="score">'+score+"／100</div><h2>"+(sp?"通過（≥"+P.SAMPLE_PASS_SCORE+"）":"未通過（需 "+P.SAMPLE_PASS_SCORE+" 分以上）")+"</h2><p>答對 "+c+"／"+n+" 題，最高分 "+state.sampleBest+"／100。抽考不影響學習日與週考的亮燈。</p>"+det+'<div class="panel-actions"><button class="btn" data-action="english">返回儀表板</button><button class="btn btn-primary" data-action="retry-session">再抽一組</button></div></div>';
      return;
    }
    {
      if(ok){
        if(mode==="day"){state.completed[currentDay]=true;state.scores[currentDay]=Math.max(Number(state.scores[currentDay]||0),Math.round(c/n*100))}
        else{state.weekPassed[currentWeek]=true;state.weekScores[currentWeek]=Math.max(Number(state.weekScores[currentWeek]||0),Math.round(c/n*100))}
        var date=new Date().toISOString().slice(0,10);if(state.activityDates.indexOf(date)<0)state.activityDates.push(date);
      }else if(mode==="day"){state.scores[currentDay]=Math.max(Number(state.scores[currentDay]||0),Math.round(c/n*100))}
      save();
      var t=mode==="day"?taskOf("d",currentDay):taskOf("w",currentWeek),next=plan.tasks[t.no],finalDone=ok&&!next;
      var msg=ok?(finalDone?"全部任務完成！":"全對！已亮燈，"+(next.type==="week"?"本週週考已解鎖":"下一個任務已解鎖")):"沒有全對，需要 "+n+"／"+n+" 才通過";
      var sub=ok?"繼續保持。想加強記憶可以用儀表板的「進度抽考」。":"錯的題目已記下來。按「再測一次」會換一組新題目，直到全對為止。";
      html='<div class="result"><span class="kicker">'+esc(sessionTitle())+' 結果</span><div class="score">'+c+"／"+n+"</div><h2>"+msg+"</h2><p>"+sub+"</p>"+wrongText+'<div class="panel-actions">'+(ok?'<button class="btn" data-action="retry-session">再練一次</button>'+(next?'<button class="btn btn-primary" data-action="next">前往下一個任務</button>':'<button class="btn btn-primary" data-action="english">返回儀表板</button>'):(mode==="day"?'<button class="btn" data-action="restudy">回到單字卡</button>':'<button class="btn" data-action="english">返回儀表板</button>')+'<button class="btn btn-primary" data-action="retry-session">再測一次</button>')+"</div></div>";
      updateNav();
    }
    r.innerHTML=html;
  }
  function speak(word){if(!canSpeak()){toast("此瀏覽器不支援語音播放");return}speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(word);u.lang="en-US";u.rate=.82;speechSynthesis.speak(u)}
  function home(){if(canSpeak())speechSynthesis.cancel();document.title="莓好學習區｜教材中心";el("#lessonView").hidden=true;el("#dashboardView").hidden=true;el("#libraryView").hidden=false;setAffiliateTheme("learning-center");window.scrollTo({top:0,behavior:"smooth"})}
  function showEnglish(){if(canSpeak())speechSynthesis.cancel();document.title="英語｜單字儲備庫";el("#libraryView").hidden=true;el("#lessonView").hidden=true;el("#dashboardView").hidden=false;setAffiliateTheme(el(".level-tab.active").dataset.level==="junior"?"english-junior":"english-elementary");renderDashboard();window.scrollTo({top:0,behavior:"smooth"})}
  function exportData(){var blob=new Blob([JSON.stringify({app:"guangyan-word-vault",schemaVersion:SCHEMA,exportedAt:new Date().toISOString(),state:state},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="英語單字儲備庫_學習進度.json";a.click();URL.revokeObjectURL(url);toast("進度已匯出")}
  function importData(file){
    file.text().then(function(text){
      var data=JSON.parse(text);
      if(!data||data.app!=="guangyan-word-vault"||!isObj(data.state)||data.state.schemaVersion!==SCHEMA||!isObj(data.state.completed)||!isObj(data.state.weekPassed))throw new Error("format");
      var next=normalize(data.state);next.migrationNotice=false;state=next;
      if(!save())toast("進度已匯入，但此瀏覽器無法儲存（關閉頁面後會消失）");else toast("進度匯入成功");
      renderDashboard();
    }).catch(function(e){console.warn("匯入失敗",e);toast("匯入失敗：檔案格式不符（舊版進度無法匯入）")});
  }
  document.addEventListener("click",function(event){
    var x=event.target.closest("[data-speak]");if(x){speak(x.dataset.speak);return}x=event.target.closest("[data-task]");if(x){openTask(x.dataset.task);return}x=event.target.closest("[data-level]");if(x){selectLevel(x.dataset.level);return}x=event.target.closest("[data-grade]");if(x){document.querySelectorAll(".grade-tab").forEach(function(t){t.classList.toggle("active",t===x)});renderJunior(Number(x.dataset.grade));return}x=event.target.closest("[data-pick]");if(x){pickChoice(Number(x.dataset.pick));return}
    var action=event.target.closest("[data-action]");action=action&&action.dataset.action;if(!action)return;
    if(action==="home")home();else if(action==="english")showEnglish();else if(action==="continue"||action==="today")openNextTask();else if(action==="sample")openSample();else if(action==="jump"){var n=Math.floor(Number(el("#dayJump").value));if(!(n>=1&&n<=TOTAL_DAYS))toast("請輸入 1–"+TOTAL_DAYS+" 之間的學習日");else openDay(n)}
    else if(action==="prev"||action==="next"){var cur=mode==="day"?taskOf("d",currentDay):taskOf("w",currentWeek),tt=plan.tasks[cur.no-1+(action==="next"?1:-1)];if(tt){if(tt.type==="week")openWeek(tt.week);else openDay(tt.day)}}
    else if(action==="step-next"){currentStep++;renderStep()}else if(action==="check-spell")checkSpell();else if(action==="check-quiz-spell")checkQuizSpell();else if(action==="skip-listen")skipListen();else if(action==="q-next"){session.i++;renderQuestion()}
    else if(action==="start-session"||action==="retry-session"){if(mode==="day"){currentStep=4;renderStep()}else startSession()}
    else if(action==="restudy"){currentStep=0;spellIndex=0;renderStep()}
    else if(action==="export")exportData();else if(action==="dismiss-notice"){state.migrationNotice=false;save();el("#migrateNotice").hidden=true}
  });
  el("#importFile").addEventListener("change",function(e){if(e.target.files[0])importData(e.target.files[0]);e.target.value=""});
  document.addEventListener("keydown",function(e){if(e.key!=="Enter")return;if(e.target.id==="spellAnswer")checkSpell();else if(e.target.id==="quizAnswer")checkQuizSpell()});
  window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredInstall=e;el("#installBtn").hidden=false});
  el("#installBtn").addEventListener("click",function(){if(!deferredInstall)return;deferredInstall.prompt();deferredInstall.userChoice.then(function(){deferredInstall=null;el("#installBtn").hidden=true})});
  function network(){el("#networkBadge").textContent=navigator.onLine?"線上模式":"離線模式"}window.addEventListener("online",network);window.addEventListener("offline",network);network();
  if("serviceWorker" in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("./sw.js").catch(console.warn)});
  window.MeihaoLearningProgress={
    schemaVersion:SCHEMA,
    read:function(){return JSON.parse(JSON.stringify(state))},
    apply:function(next){state=normalize(next||{});storeSet(KEY,JSON.stringify(state));renderDashboard()}
  };
  renderCourseVersions();renderJunior(7);renderDashboard();
})();
