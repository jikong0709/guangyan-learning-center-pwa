/* 國小六年級自然：四題型、版本單元對照與文字答案正規化。 */
(function(global){"use strict";
  const topicNames={light:"光與影像",sound:"聲音與波動",electricity:"電與電路",heat:"熱與能量","force-motion":"力與運動","weather-water":"天氣與水循環","earth-space":"地球與宇宙",ecosystems:"生物與環境","matter-changes":"物質與變化","inquiry-sustainability":"科學探究與永續"};
  const units=[["六上",1,"光與影像",["light"]],["六上",2,"聲音與波動",["sound"]],["六上",3,"電與電路",["electricity"]],["六上",4,"熱與能量",["heat"]],["六上",5,"力與運動",["force-motion"]],["六下",1,"天氣與水循環",["weather-water"]],["六下",2,"地球與宇宙",["earth-space"]],["六下",3,"生物與環境",["ecosystems"]],["六下",4,"物質與變化",["matter-changes"]],["六下",5,"科學探究與永續",["inquiry-sustainability"]]];
  function makeUnits(){return units.map(function(x){return{unitId:x[0]+"-"+x[1],semester:x[0],title:x[2],topics:x[3],verified:false};});}
  const sourceUrl="https://edu.law.moe.gov.tw/LawContent.aspx?id=GL001823&media=print";
  const versions={hanlin:{name:"翰林版",sourceLabel:"教育部自然科學領域課綱；出版社逐冊單元待核對",sourceUrl:sourceUrl,units:makeUnits()},kanghsuan:{name:"康軒版",sourceLabel:"教育部自然科學領域課綱；出版社逐冊單元待核對",sourceUrl:sourceUrl,units:makeUnits()},nani:{name:"南一版",sourceLabel:"教育部自然科學領域課綱；出版社逐冊單元待核對",sourceUrl:sourceUrl,units:makeUnits()}};
  const types=[{key:"tf",name:"是非題",short:"是非",kind:"tf",stdCount:5,stdPts:2,minCount:2,maxCount:20,minPts:1,maxPts:4,hint:"對的打 ○，錯的打 ✕。"},{key:"single",name:"單選題",short:"單選",kind:"single",stdCount:20,stdPts:2,minCount:2,maxCount:25,minPts:2,maxPts:4,hint:"請選出一個正確的答案。"},{key:"multi",name:"複選題（全對才給分）",short:"複選",kind:"multi",stdCount:5,stdPts:4,minCount:2,maxCount:8,minPts:3,maxPts:6,hint:"選出所有正確的答案，全部答對才給分，不倒扣。"},{key:"fill",name:"填充題",short:"填充",kind:"text",stdCount:15,stdPts:2,minCount:2,maxCount:25,minPts:2,maxPts:5,hint:"請在（　）或 □ 內填入正確文字。"}];
  const factSources={
    light:{name:"美國太空總署：光與電磁能量科普",url:"https://science.nasa.gov/mission/webb/science-overview/science-explainers/spectroscopy-101-light-and-matter/"},
    sound:{name:"美國太空總署教材：聲音需介質、音調與頻率",url:"https://assets.science.nasa.gov/content/dam/science/missions/aura/education/SCS-Lesson-2_energy-meter.pdf"},
    electricity:{name:"教育部自然科學領域課綱：能量與電路",url:"https://edu.law.moe.gov.tw/LawContent.aspx?id=GL001823&media=print"},
    heat:{name:"美國太空總署：光、聲、熱與電流傳遞能量",url:"https://science.nasa.gov/learn/heat/big-ideas/big-idea-2-3/"},
    "force-motion":{name:"教育部自然科學領域課綱：力與運動",url:"https://edu.law.moe.gov.tw/LawContent.aspx?id=GL001823&media=print"},
    "weather-water":{name:"中央氣象署數位科普網：地球氣候系統與水循環",url:"https://pweb.cwa.gov.tw/PopularScience/wt/wt_5.html"},
    "earth-space":{name:"美國太空總署太陽系探索",url:"https://science.nasa.gov/solar-system/"},
    ecosystems:{name:"環境部環境教育與生態資料",url:"https://ecocampus.moenv.gov.tw/share_resources/file_dl_list/1/4"},
    "matter-changes":{name:"教育部自然科學領域課綱：物質特性與變化",url:"https://edu.law.moe.gov.tw/LawContent.aspx?id=GL001823&media=print"},
    "inquiry-sustainability":{name:"環境部：永續發展與環境保護",url:"https://www.moenv.gov.tw/affairs/c48fa2b/international-affairs-and-cooperation/environmental-sustainability/765.html"}
  };
  function normalizeText(s){var t=String(s).normalize("NFKC").replace(/\s+/g,"");if(t.length<=1)return (t==="。"||t==="．")?".":t;return t.replace(/[，、。．；：！？「」『』（）()]/g,"");}
  global.ExamConfig={subject:"grade6-science",title:"國小六年級自然",heading:"題型多元・科學探究互動考卷",backUrl:"../../",storagePrefix:"meihao-exam:grade6-science:",defaultVersion:"hanlin",versions:versions,versionOrder:["hanlin","kanghsuan","nani"],topicNames:topicNames,allTopics:Object.keys(topicNames),types:types,score:{total:100,minPerType:2,maxScale:2},practice:{count:20,pointEach:5},mix:{trap:0.2,extend:0.2,minEach:2},levelRanges:[{key:"easy",name:"簡單（基礎暖身，1～2 級）",min:1,max:2,mix:{trap:0.2,extend:0}},{key:"mid",name:"中等（2～4 級）",min:2,max:4,mix:{trap:0.2,extend:0.2}},{key:"hard",name:"困難（挑戰深入，3～5 級）",min:3,max:5,mix:{trap:0.2,extend:0.3}},{key:"all",name:"綜合（簡單→深入，1～5 級）",min:1,max:5,mix:{trap:0.2,extend:0.2}}],tagNames:{basic:"基礎",trap:"易錯陷阱",extend:"延伸"},tagIcons:{basic:"🔰",trap:"⚠️",extend:"🚀"},labels:{yes:"○ 對",no:"✕ 錯",none:"（未作答）"},normalizeText:normalizeText,factSources:factSources};
})(typeof window!=="undefined"?window:globalThis);
