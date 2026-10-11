/* 國小六年級數學：考卷系統設定（題型、版本→單元→topics、答案數值解析）。
   單元 unitId 與 curriculum.js 一致：學期 + "-" + 序號（例 "六上-1"）。 */
(function (global) {
  "use strict";

  const topicNames = {
    "factor": "質數與因數倍數", "fraction-div": "分數除法", "decimal": "小數除法", "ratio": "比與比值",
    "quantity": "基準量與比較量", "circle-length": "圓周長與弧長", "scale": "比例尺與縮放", "solve-upper": "和差與雞兔",
    "mixed-ops": "四則混合運算", "circle-area": "圓與扇形面積", "speed": "速率", "statistics": "統計圖表",
    "solve-lower": "年齡平均追趕", "solids": "柱體體積與表面積"
  };

  const u = (semester, n, title, topics) => ({ unitId: semester + "-" + n, semester, title, topics });

  const versions = {
    hanlin: {
      name: "翰林版",
      sourceLabel: "使用者提供之翰林六上教材，全年章節依公開課程資料補齊",
      sourceUrl: "https://tten.tp.edu.tw/Login/Downment?grade=6&spid=7349b91b-c5d9-446a-9ab0-fe5586d968c7&subject=Mathematics",
      units: [
        u("六上", 1, "最大公因數和最小公倍數", ["factor"]),
        u("六上", 2, "分數除法", ["fraction-div"]),
        u("六上", 3, "小數除法", ["decimal"]),
        u("六上", 4, "比和比值", ["ratio"]),
        u("六上", 5, "兩量關係", ["quantity"]),
        u("六上", 6, "圓周長和扇形周長", ["circle-length"]),
        u("六上", 7, "放大、縮小和比例尺", ["scale"]),
        u("六上", 8, "怎樣解題", ["solve-upper"]),
        u("六下", 1, "小數與分數的四則運算", ["mixed-ops"]),
        u("六下", 2, "圓面積與扇形面積", ["circle-area"]),
        u("六下", 3, "速率", ["speed"]),
        u("六下", 4, "統計圖表", ["statistics"]),
        u("六下", 5, "怎樣解題", ["solve-lower"]),
        u("六下", 6, "角柱與圓柱", ["solids"])
      ]
    },
    kanghsuan: {
      name: "康軒版",
      sourceLabel: "章節參考：均一教育平台類康軒版（113 學年度架構）",
      sourceUrl: "https://www.junyiacademy.org/topics/k-m6a",
      units: [
        u("六上", 1, "最大公因數與最小公倍數", ["factor"]),
        u("六上", 2, "分數除法", ["fraction-div"]),
        u("六上", 3, "數量關係", ["quantity"]),
        u("六上", 4, "小數除法", ["decimal"]),
        u("六上", 5, "比與比值", ["ratio"]),
        u("六上", 6, "圓周長與扇形周長", ["circle-length"]),
        u("六上", 7, "圓面積與扇形面積", ["circle-area"]),
        u("六上", 8, "認識速率", ["speed"]),
        u("六上", 9, "放大圖、縮圖與比例尺", ["scale"]),
        u("六下", 1, "小數與分數的計算", ["mixed-ops"]),
        u("六下", 2, "速率的應用", ["speed"]),
        u("六下", 3, "柱體體積與表面積", ["solids"]),
        u("六下", 4, "基準量與比較量", ["quantity"]),
        // 康軒六下「怎樣解題」：年齡、平均、追趕與組合，貼近 solve-lower
        u("六下", 5, "怎樣解題", ["solve-lower"]),
        u("六下", 6, "圓形圖", ["statistics"])
      ]
    },
    nani: {
      name: "南一版",
      sourceLabel: "章節參考：均一教育平台類南一版（113 學年度架構）",
      sourceUrl: "https://www.junyiacademy.org/topics/math-6",
      units: [
        u("六上", 1, "質因數分解和短除法", ["factor"]),
        u("六上", 2, "分數的除法", ["fraction-div"]),
        u("六上", 3, "小數的除法", ["decimal"]),
        // 南一「圓周長與圓面積」同時涵蓋圓周長與圓面積兩個 topic
        u("六上", 4, "圓周長與圓面積", ["circle-length", "circle-area"]),
        u("六上", 5, "比和比值", ["ratio"]),
        // 「弧長與扇形面積」：弧長屬 circle-length，扇形面積屬 circle-area
        u("六上", 6, "弧長與扇形面積", ["circle-length", "circle-area"]),
        u("六上", 7, "速率", ["speed"]),
        u("六上", 8, "數量關係", ["quantity"]),
        u("六下", 1, "四則混合運算", ["mixed-ops"]),
        u("六下", 2, "柱體的體積和表面積", ["solids"]),
        u("六下", 3, "基準量和比較量", ["quantity"]),
        u("六下", 4, "放大圖、縮圖和比例尺", ["scale"]),
        u("六下", 5, "怎樣解題", ["solve-lower"]),
        u("六下", 6, "圓形圖", ["statistics"])
      ]
    }
  };

  /* 題型：count/weight 即規格第 7 節「一百分卷」預設題數與小計 */
  const types = [
    { key: "single", name: "單選題", short: "單選", kind: "single", count: 8, weight: 24, hint: "請選出一個正確的答案。" },
    { key: "multi", name: "複選題", short: "複選", kind: "multi", count: 3, weight: 15, hint: "選出所有正確的答案，全部答對才給分。" },
    { key: "tf", name: "是非題", short: "是非", kind: "tf", count: 5, weight: 10, hint: "判斷敘述對或錯。" },
    { key: "fill", name: "填空題", short: "填空", kind: "text", count: 6, weight: 18, hint: "請填入答案（分數可寫 3/4，帶分數可寫 1 1/2）。" },
    { key: "calc", name: "算式題", short: "算式", kind: "text", count: 4, weight: 16, hint: "請算出最後答案（分數可寫 3/4）。" },
    { key: "word", name: "應用題", short: "應用", kind: "text", count: 3, weight: 17, hint: "請寫出答案和單位。" }
  ];

  /* 數值解析：3/4、.75、0.75、1 1/2、1又1/2、25%（輸入已經過全形轉半形與空白整理） */
  function numberParser(s) {
    s = String(s).trim().replace(/[°度%]$/, "").trim();
    let m;
    if ((m = /^(-?)(\d+(?:\.\d+)?|\.\d+)$/.exec(s))) return Number(m[1] + m[2]);
    if ((m = /^(-?)(\d+)\s*\/\s*(\d+)$/.exec(s))) return Number(m[3]) === 0 ? null : (m[1] ? -1 : 1) * Number(m[2]) / Number(m[3]);
    if ((m = /^(-?)(\d+)(?:\s+|又)(\d+)\s*\/\s*(\d+)$/.exec(s))) return Number(m[4]) === 0 ? null : (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
    return null;
  }
  /* 乘積寫法：2x3x3、2*3*3 視同 2×3×3，且因數順序不拘 */
  function normalizeText(s) {
    s = s.replace(/(?<=\d)\s*[*xX·⋅∙]\s*(?=\d)/g, "×");
    if (/^\d+(×\d+)+$/.test(s)) s = s.split("×").map(Number).sort((a, b) => a - b).join("×");
    return s;
  }

  global.ExamConfig = {
    subject: "grade6-math",
    title: "國小六年級數學",
    heading: "題型多元・動態變數互動考卷",
    backUrl: "../../",
    storagePrefix: "meihao-exam:grade6-math:",
    defaultVersion: "hanlin",
    versions: versions,
    versionOrder: ["hanlin", "kanghsuan", "nani"],
    topicNames: topicNames,
    allTopics: Object.keys(topicNames),
    types: types,
    score: { total: 100, minPerType: 2, maxScale: 2 },
    practice: { count: 20, pointEach: 5 },
    mix: { trap: 0.2, extend: 0.2, minEach: 2 },
    levelRanges: [
      { key: "all", name: "簡單 → 深入（全部）", min: 1, max: 5 },
      { key: "easy", name: "基礎暖身（1～2 級）", min: 1, max: 2 },
      { key: "mid", name: "中等進階（2～4 級）", min: 2, max: 4 },
      { key: "hard", name: "挑戰深入（3～5 級）", min: 3, max: 5 }
    ],
    tagNames: { basic: "基礎", trap: "易錯陷阱", extend: "延伸" },
    tagIcons: { basic: "🔰", trap: "⚠️", extend: "🚀" },
    labels: { yes: "○ 對", no: "✕ 錯", none: "（未作答）" },
    numberParser: numberParser,
    normalizeText: normalizeText
  };
})(typeof window !== "undefined" ? window : globalThis);
