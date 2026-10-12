/* 康軒六上第1課〈跑道〉完整樣板設定。題幹、例句與閱讀短文皆為自編原創。 */
(function (global) {
  "use strict";
  const TOPIC = "kx-6a-01";
  const topicNames = {};
  topicNames[TOPIC] = "第一單元・第1課〈跑道〉";
  const versions = {
    kanghsuan: {
      name: "康軒版",
      sourceLabel: "教育部教育百科：115學年度 六年級 國語 康軒版 第1課 生字語詞",
      sourceUrl: "https://pedia.cloud.edu.tw/Bookmark/TCollection?TextNameId=0103061150101",
      units: [{ unitId: "六上-1", semester: "六上", title: "第一單元・第1課〈跑道〉", topics: [TOPIC], verified: false }]
    }
  };
  const types = [
    { key: "charphonetic", name: "國字注音（填寫）", short: "國字注音", kind: "text", stdCount: 15, stdPts: 2, minCount: 2, maxCount: 15, minPts: 1, maxPts: 3, hint: "共 15 格，混合國字寫注音與注音寫國字；請在（　）作答。" },
    { key: "charphonetic_mc", name: "國字注音（選擇版）", short: "國字注音選", kind: "single", stdCount: 15, stdPts: 2, minCount: 2, maxCount: 15, minPts: 1, maxPts: 3, hint: "混合國字寫注音與注音寫國字的選擇版；與填寫版共用題池。" },
    { key: "wrongchar", name: "找錯字", short: "找錯字", kind: "text", stdCount: 5, stdPts: 2, minCount: 2, maxCount: 10, minPts: 1, maxPts: 4, hint: "每句有一個錯字，請在（　）寫出正確的字。" },
    { key: "vocab", name: "語詞填空（填寫）", short: "語詞填空", kind: "text", stdCount: 5, stdPts: 2, minCount: 2, maxCount: 10, minPts: 1, maxPts: 4, hint: "依詞庫和前後文，在（　）填入最適當的本課語詞或常用成語。" },
    { key: "vocab_mc", name: "語詞填空（選擇版）", short: "語詞填空選", kind: "single", stdCount: 5, stdPts: 2, minCount: 2, maxCount: 10, minPts: 1, maxPts: 4, hint: "依前後文選出最適當的本課語詞或常用成語。" },
    { key: "lessonmc", name: "選擇題", short: "選擇題", kind: "single", stdCount: 10, stdPts: 2, minCount: 4, maxCount: 20, minPts: 1, maxPts: 4, hint: "包含字音字形、語詞釋義、自編句的修辭／句型與可查證的單元主題。" },
    { key: "pattern", name: "照樣寫短語", short: "照樣寫", kind: "text", stdCount: 5, stdPts: 2, minCount: 2, maxCount: 8, minPts: 1, maxPts: 4, hint: "觀察自編例句的結構，在（　）照樣寫完整短語或句子。" },
    { key: "homophone", name: "同音字／形近字選字", short: "選字", kind: "single", stdCount: 4, stdPts: 1, minCount: 2, maxCount: 8, minPts: 1, maxPts: 3, hint: "依語意選出能正確組成本課字詞或常用字詞的字。" },
    { key: "sentence", name: "造句", short: "造句", kind: "selfcheck", stdCount: 2, stdPts: 3, minCount: 1, maxCount: 4, minPts: 2, maxPts: 6, rules: { minLen: 12, endPunct: true }, hint: "用指定的本課語詞造句；程式依語詞、句末標點與字數規則給分，交卷後顯示自編參考例句。", rubricDefault: ["指定語詞的意思與用法正確", "句子完整通順，人物或事物與動作清楚", "句末使用正確標點", "內容具體，沒有照抄參考例句"] },
    { key: "reading", name: "閱讀測驗", short: "閱讀題組", kind: "single", passageSet: true, setSize: 5, stdCount: 5, stdPts: 2, minCount: 5, maxCount: 10, minPts: 1, maxPts: 4, hint: "閱讀一篇 150～250 字的自編原創短文，再回答同一題組的 5 題。" }
  ];
  function normalizeText(s) {
    const t = String(s).normalize("NFKC").replace(/\s+/g, "");
    return t.replace(/[，、。．；：！？「」『』（）()]/g, "");
  }
  global.ExamConfig = {
    subject: "grade6-chinese-v2",
    title: "國語（康軒版）六年級上冊",
    heading: "國語（康軒版）六年級上冊",
    texts: { intro: "樣板：目前只有第1課〈跑道〉。標準卷預設為填寫版；可在題型自選改選國字注音或語詞填空的選擇版。" },
    backUrl: "../../",
    storagePrefix: "meihao-exam:grade6-chinese-v2:",
    defaultVersion: "kanghsuan",
    versions: versions,
    versionOrder: ["kanghsuan"],
    topicNames: topicNames,
    allTopics: [TOPIC],
    types: types,
    defaultTypes: ["charphonetic", "wrongchar", "vocab", "lessonmc", "pattern", "homophone", "sentence", "reading"],
    score: { total: 100, minPerType: 1, maxScale: 2 },
    practice: { count: 20, pointEach: 5 },
    mix: { trap: 0.2, extend: 0.2, minEach: 2 },
    levelRanges: [{ key: "all", name: "綜合（1～5 級）", min: 1, max: 5, mix: { trap: 0.2, extend: 0.2 } }],
    tagNames: { basic: "基礎", trap: "易錯陷阱", extend: "延伸" },
    tagIcons: { basic: "基", trap: "辨", extend: "伸" },
    labels: { yes: "○ 對", no: "× 錯", none: "（未作答）" },
    normalizeText: normalizeText
  };
})(typeof window !== "undefined" ? window : globalThis);
