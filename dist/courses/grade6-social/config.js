/* 國小六年級社會：四題型、版本單元對照與文字答案正規化。 */
(function(global){"use strict";
  const topicNames={"taiwan-geography":"臺灣地理","world-geography":"世界地理","taiwan-history-early":"臺灣早期歷史","taiwan-history-modern":"臺灣近現代史",democracy:"民主與政府","rights-duties":"權利與義務",economy:"經濟與生活",culture:"文化與多元",globalization:"全球連結",sustainability:"環境與永續"};
  const legacyUnits=[["六上",1,"臺灣的地理環境",["taiwan-geography"]],["六上",2,"臺灣早期發展",["taiwan-history-early"]],["六上",3,"臺灣近現代變遷",["taiwan-history-modern"]],["六上",4,"民主政府與公民",["democracy","rights-duties"]],["六上",5,"經濟生活",["economy"]],["六下",1,"世界地理概念",["world-geography"]],["六下",2,"文化多元與交流",["culture"]],["六下",3,"全球化與國際連結",["globalization"]],["六下",4,"環境問題與行動",["sustainability"]],["六下",5,"公民參與與永續未來",["rights-duties","sustainability"]]];
  const kanghsuanUnits=[["六上",1,"臺灣民主政治的發展",["democracy","rights-duties"]],["六上",2,"社會變遷中的個人發展與族群文化",["culture","globalization"]],["六上",3,"戰後經濟發展、轉型與生活",["taiwan-history-modern","economy"]],["六上",4,"都市、鄉村與永續發展",["taiwan-geography","sustainability"]]];
  function makeUnits(list){return list.map(function(x){return{unitId:x[0]+"-"+x[1],semester:x[0],title:x[2],topics:x[3],verified:false};});}
  const sourceUrl="https://ws-proj.moe.edu.tw/001/Upload/606/relfile/14821/1025/43440bfb-f51b-4bfd-8acb-30928c36e40f.pdf";
  const versions={hanlin:{name:"翰林版",sourceLabel:"舊版主題對照，出版社逐冊單元待核對",sourceUrl:sourceUrl,units:makeUnits(legacyUnits)},kanghsuan:{name:"康軒版",sourceLabel:"依康軒版六上社會公開課程計畫整理；仍待對照實際課本目錄驗收",sourceUrl:"https://www.cp.ptc.edu.tw/storage/134772/134772_112_B-1_6A.pdf",units:makeUnits(kanghsuanUnits)},nani:{name:"南一版",sourceLabel:"舊版主題對照，出版社逐冊單元待核對",sourceUrl:sourceUrl,units:makeUnits(legacyUnits)}};
  const types=[{key:"tf",name:"是非題",short:"是非",kind:"tf",stdCount:5,stdPts:2,minCount:2,maxCount:20,minPts:1,maxPts:4,hint:"對的打 ○，錯的打 ✕。"},{key:"single",name:"單選題",short:"單選",kind:"single",stdCount:20,stdPts:2,minCount:2,maxCount:25,minPts:2,maxPts:4,hint:"請選出一個正確的答案。"},{key:"multi",name:"複選題（全對才給分）",short:"複選",kind:"multi",stdCount:5,stdPts:4,minCount:2,maxCount:8,minPts:3,maxPts:6,hint:"選出所有正確的答案，全部答對才給分，不倒扣。"},{key:"fill",name:"填充題",short:"填充",kind:"text",stdCount:15,stdPts:2,minCount:2,maxCount:25,minPts:2,maxPts:5,hint:"請在（　）或 □ 內填入正確文字。"}];
  const factSources={
    "taiwan-geography":{name:"行政院國情簡介：地文；國家公園署臺灣河川",url:"https://www.ey.gov.tw/state/4447F4A951A1EC45/52515c49-bcc0-45f5-bd5f-78c22c9d3f45"},
    "world-geography":{name:"大英百科全書：洲與海洋基礎地理",url:"https://www.britannica.com/science/continent"},
    "taiwan-history-early":{name:"國立臺灣歷史博物館線上資源",url:"https://the.nmth.gov.tw/nmth/zh-TW/Home/Index"},
    "taiwan-history-modern":{name:"國家發展委員會檔案管理局教學資源",url:"https://art.archives.gov.tw/tw/art/422.html"},
    democracy:{name:"中央選舉委員會《公職人員選舉罷免法》",url:"https://law.cec.gov.tw/LawContentHistory.aspx?hid=104&id=GL000292"},
    "rights-duties":{name:"全國法規資料庫《中華民國憲法》",url:"https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=A0000001"},
    economy:{name:"中央銀行兒童金融教育與貨幣常識",url:"https://www.cbc.gov.tw/tw/mp-1.html"},
    culture:{name:"文化部國家文化記憶庫",url:"https://memory.culture.tw/"},
    globalization:{name:"聯合國：國際合作與全球議題",url:"https://www.un.org/zh/"},
    sustainability:{name:"環境部：永續發展與環境教育",url:"https://www.moenv.gov.tw/affairs/c48fa2b/international-affairs-and-cooperation/environmental-sustainability/765.html"}
  };
  function normalizeText(s){var t=String(s).normalize("NFKC").replace(/\s+/g,"");if(t.length<=1)return (t==="。"||t==="．")?".":t;return t.replace(/[，、。．；：！？「」『』（）()]/g,"");}
  global.ExamConfig={subject:"grade6-social",title:"國小六年級社會",heading:"題型多元・生活素養互動考卷",backUrl:"../../",storagePrefix:"meihao-exam:grade6-social:",defaultVersion:"kanghsuan",versions:versions,versionOrder:["hanlin","kanghsuan","nani"],topicNames:topicNames,allTopics:Object.keys(topicNames),types:types,score:{total:100,minPerType:2,maxScale:2},practice:{count:20,pointEach:5},mix:{trap:0.2,extend:0.2,minEach:2},levelRanges:[{key:"easy",name:"簡單（基礎暖身，1～2 級）",min:1,max:2,mix:{trap:0.2,extend:0}},{key:"mid",name:"中等（2～4 級）",min:2,max:4,mix:{trap:0.2,extend:0.2}},{key:"hard",name:"困難（挑戰深入，3～5 級）",min:3,max:5,mix:{trap:0.2,extend:0.3}},{key:"all",name:"綜合（簡單→深入，1～5 級）",min:1,max:5,mix:{trap:0.2,extend:0.2}}],tagNames:{basic:"基礎",trap:"易錯陷阱",extend:"延伸"},tagIcons:{basic:"🔰",trap:"⚠️",extend:"🚀"},labels:{yes:"○ 對",no:"✕ 錯",none:"（未作答）"},normalizeText:normalizeText,factSources:factSources};
})(typeof window!=="undefined"?window:globalThis);
