/* LAB 測試用：國語樣板設定（selfcheck 造句自評＋閱讀題組＋填空/選擇雙形式）。
   不連首頁、不進 sw.js、不含任何課文內容；題目全是標示【LAB】的假資料，只用來驗證引擎。 */
(function (global) {
  "use strict";
  const topicNames = { "lab-a": "LAB 字詞與造句（假資料）", "lab-b": "LAB 閱讀題組（假資料）" };
  const unitList = [["六上", 1, "LAB 字詞＋閱讀＋造句", ["lab-a", "lab-b"]], ["六上", 2, "LAB 只有閱讀題組", ["lab-b"]]];
  const makeUnits = () => unitList.map(x => ({ unitId: x[0] + "-" + x[1], semester: x[0], title: x[2], topics: x[3], verified: false }));
  const versions = {
    lab: { name: "LAB測試", sourceLabel: "LAB 測試資料（非課文、非任何出版社內容）", sourceUrl: "./", units: makeUnits() }
  };
  const FILL = "text";
  const types = [
    { key: "zhuyin", name: "國字注音（填寫）", short: "國字注音", kind: FILL, stdCount: 4, stdPts: 2, minCount: 2, maxCount: 12, minPts: 1, maxPts: 3, hint: "看國字，寫出注音符號（第一聲不用標記）。" },
    { key: "zhuyin_mc", name: "國字注音（選擇）", short: "國字注音選", kind: "single", stdCount: 4, stdPts: 2, minCount: 2, maxCount: 12, minPts: 1, maxPts: 3, hint: "看國字，選出正確的注音。" },
    { key: "hanzi", name: "注音寫國字（填寫）", short: "注音寫國字", kind: FILL, stdCount: 4, stdPts: 2, minCount: 2, maxCount: 12, minPts: 1, maxPts: 3, hint: "依注音與前後文，寫出正確的國字。" },
    { key: "hanzi_mc", name: "注音寫國字（選擇）", short: "注音寫國字選", kind: "single", stdCount: 4, stdPts: 2, minCount: 2, maxCount: 12, minPts: 1, maxPts: 3, hint: "依注音與前後文，選出正確的國字。" },
    { key: "homophone", name: "同音字（填寫）", short: "同音字", kind: FILL, stdCount: 3, stdPts: 4, minCount: 2, maxCount: 10, minPts: 2, maxPts: 6, hint: "在（　）填入讀音相同、意思正確的字。" },
    { key: "homophone_mc", name: "同音字（選擇）", short: "同音字選", kind: "single", stdCount: 3, stdPts: 4, minCount: 2, maxCount: 10, minPts: 2, maxPts: 6, hint: "選出填入（　）最適當的字。" },
    { key: "wrongchar", name: "找錯字（填寫）", short: "找錯字", kind: FILL, stdCount: 3, stdPts: 4, minCount: 2, maxCount: 10, minPts: 2, maxPts: 6, hint: "句中有一個錯字，請寫出正確的字。" },
    { key: "wrongchar_mc", name: "找錯字（選擇）", short: "找錯字選", kind: "single", stdCount: 3, stdPts: 4, minCount: 2, maxCount: 10, minPts: 2, maxPts: 6, hint: "句中有一個錯字，選出應該改成的正確字。" },
    { key: "reading", name: "閱讀短文選擇題（題組）", short: "閱讀題組", kind: "single", passageSet: true, setSize: 5, stdCount: 5, stdPts: 4, minCount: 5, maxCount: 10, minPts: 3, maxPts: 6, hint: "請先閱讀短文，再回答同一組的問題。" },
    { key: "sentence", name: "造句（自評練習）", short: "造句", kind: "selfcheck", scoring: "none", stdCount: 2, stdPts: 5, hint: "用指定語詞各造一個句子。交卷後自己對照標準打勾，不計入 100 分。",
      rubricDefault: ["用到指定語詞，而且用法正確", "句子完整通順（有主詞和動作，意思清楚）", "標點符號正確", "內容具體，不是只抄參考句換一兩個字"] }
  ];
  function normalizeText(s) { var t = String(s).normalize("NFKC").replace(/\s+/g, ""); if (t.length <= 1) return (t === "。" || t === "．") ? "." : t; return t.replace(/[，、。．；：！？「」『』（）()]/g, ""); }
  global.ExamConfig = {
    subject: "grade6-chinese-lab", title: "國語樣板 LAB 測試", heading: "LAB 測試頁・非正式內容",
    texts: { intro: "這是引擎測試頁（LAB）：題目全是假資料，只用來測試造句自評、閱讀題組與填寫／選擇兩種形式。" },
    backUrl: "../../", storagePrefix: "meihao-exam:grade6-chinese-lab:", defaultVersion: "lab",
    versions: versions, versionOrder: ["lab"], topicNames: topicNames, allTopics: Object.keys(topicNames), types: types,
    score: { total: 100, minPerType: 2, maxScale: 2 }, practice: { count: 20, pointEach: 5 }, mix: { trap: 0.2, extend: 0.2, minEach: 2 },
    levelRanges: [{ key: "all", name: "綜合（1～5 級）", min: 1, max: 5, mix: { trap: 0.2, extend: 0.2 } }],
    tagNames: { basic: "基礎", trap: "易錯陷阱", extend: "延伸" }, tagIcons: { basic: "🔰", trap: "⚠️", extend: "🚀" },
    labels: { yes: "○ 對", no: "✕ 錯", none: "（未作答）" }, normalizeText: normalizeText
  };
})(typeof window !== "undefined" ? window : globalThis);
