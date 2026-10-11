/* 國小六年級國語：四題型、版本單元對照與文字答案正規化。 */
(function (global) {
  "use strict";
  const topicNames = {
    phonetics: "字音與注音", characters: "字形與正字", words: "字詞辨析", idioms: "成語與詞語運用",
    punctuation: "標點符號", rhetoric: "修辭辨識", sentences: "句型與語法", "reading-narrative": "記敘文閱讀",
    "reading-informative": "說明與議論閱讀", "practical-writing": "實用寫作與摘要"
  };
  const units = [
    ["六上",1,"字音與注音",["phonetics"]],["六上",2,"字形與正字",["characters"]],["六上",3,"字詞與成語",["words","idioms"]],
    ["六上",4,"標點與修辭",["punctuation","rhetoric"]],["六上",5,"句型與語法",["sentences"]],
    ["六下",1,"記敘文閱讀",["reading-narrative"]],["六下",2,"說明文閱讀",["reading-informative"]],
    ["六下",3,"議論與推論",["reading-informative"]],["六下",4,"書信與公告",["practical-writing"]],["六下",5,"摘要與語文表達",["practical-writing","sentences"]]
  ];
  function makeUnits(){return units.map(function(x){return {unitId:x[0]+"-"+x[1],semester:x[0],title:x[2],topics:x[3],verified:false};});}
  const sourceUrl = "https://language.moe.gov.tw/sitemap";
  const versions = {
    hanlin:{name:"翰林版",sourceLabel:"教育部國語文課綱與語文成果資源；出版社逐冊單元待核對",sourceUrl:sourceUrl,units:makeUnits()},
    kanghsuan:{name:"康軒版",sourceLabel:"教育部國語文課綱與語文成果資源；出版社逐冊單元待核對",sourceUrl:sourceUrl,units:makeUnits()},
    nani:{name:"南一版",sourceLabel:"教育部國語文課綱與語文成果資源；出版社逐冊單元待核對",sourceUrl:sourceUrl,units:makeUnits()}
  };
  const types = [
    {key:"tf",name:"是非題",short:"是非",kind:"tf",stdCount:5,stdPts:2,minCount:2,maxCount:20,minPts:1,maxPts:4,hint:"對的打 ○，錯的打 ✕。"},
    {key:"single",name:"單選題",short:"單選",kind:"single",stdCount:20,stdPts:2,minCount:2,maxCount:25,minPts:2,maxPts:4,hint:"請選出一個正確的答案。"},
    {key:"multi",name:"複選題（全對才給分）",short:"複選",kind:"multi",stdCount:5,stdPts:4,minCount:2,maxCount:8,minPts:3,maxPts:6,hint:"選出所有正確的答案，全部答對才給分，不倒扣。"},
    {key:"fill",name:"填充題",short:"填充",kind:"text",stdCount:15,stdPts:2,minCount:2,maxCount:25,minPts:2,maxPts:5,hint:"請在（　）或 □ 內填入正確文字。"}
  ];
  const factSources = {
    phonetics:{name:"教育部《國語一字多音審訂表》與國語辭典",url:"https://language.moe.gov.tw/sitemap"},
    characters:{name:"教育部常用國字標準字體與國語辭典",url:"https://language.moe.gov.tw/material/list?page=2&u=9fd3b76d-d663-4508-bad1-a61d34e68850"},
    words:{name:"教育部《重編國語辭典修訂本》",url:"https://dict.revised.moe.edu.tw/search.jsp?la=0"},
    idioms:{name:"教育部成語典與《重編國語辭典修訂本》",url:"https://dict.revised.moe.edu.tw/page.jsp?ID=20&la=0&powerMode=0"},
    punctuation:{name:"教育部《重訂標點符號手冊》修訂版",url:"https://language.moe.gov.tw/001/Upload/FILES/SITE_CONTENT/M0001/HAU/haushou.htm"},
    rhetoric:{name:"教育部國語文課綱（第三學習階段）",url:"https://language.moe.gov.tw/sitemap"},
    sentences:{name:"教育部國語文課綱（第三學習階段）",url:"https://language.moe.gov.tw/sitemap"},
    "reading-narrative":{name:"教育部國語文課綱：篇章主旨、結構與推論",url:"https://language.moe.gov.tw/sitemap"},
    "reading-informative":{name:"教育部國語文課綱：說明與議論文本閱讀",url:"https://language.moe.gov.tw/sitemap"},
    "practical-writing":{name:"教育部國語文課綱：實用文本與寫作",url:"https://language.moe.gov.tw/sitemap"}
  };
  function normalizeText(s){var t=String(s).normalize("NFKC").replace(/\s+/g,"");if(t.length<=1)return (t==="。"||t==="．")?".":t;return t.replace(/[，、。．；：！？「」『』（）()]/g,"");}
  global.ExamConfig={subject:"grade6-chinese",title:"國小六年級國語",heading:"題型多元・素養閱讀互動考卷",backUrl:"../../",storagePrefix:"meihao-exam:grade6-chinese:",defaultVersion:"hanlin",versions:versions,versionOrder:["hanlin","kanghsuan","nani"],topicNames:topicNames,allTopics:Object.keys(topicNames),types:types,score:{total:100,minPerType:2,maxScale:2},practice:{count:20,pointEach:5},mix:{trap:0.2,extend:0.2,minEach:2},levelRanges:[{key:"easy",name:"簡單（基礎暖身，1～2 級）",min:1,max:2,mix:{trap:0.2,extend:0}},{key:"mid",name:"中等（2～4 級）",min:2,max:4,mix:{trap:0.2,extend:0.2}},{key:"hard",name:"困難（挑戰深入，3～5 級）",min:3,max:5,mix:{trap:0.2,extend:0.3}},{key:"all",name:"綜合（簡單→深入，1～5 級）",min:1,max:5,mix:{trap:0.2,extend:0.2}}],tagNames:{basic:"基礎",trap:"易錯陷阱",extend:"延伸"},tagIcons:{basic:"🔰",trap:"⚠️",extend:"🚀"},labels:{yes:"○ 對",no:"✕ 錯",none:"（未作答）"},normalizeText:normalizeText,factSources:factSources};
})(typeof window!=="undefined"?window:globalThis);
