/* LAB 測試題庫（假資料，僅供引擎驗證；不是任何課次的題目）。
   同一份字詞資料同時產出「填寫」與「選擇」兩種形式（type 分別為 xxx 與 xxx_mc），由 config 的題型勾選決定出哪一種。 */
(function (global) {
  "use strict";
  const LAB = "【LAB】";
  const A = "lab-a", B = "lab-b";
  const levelOf = i => (i % 5) + 1;
  const tagOf = i => (i < 2 ? "trap" : (i < 4 ? "extend" : "basic"));
  const specsA = [];
  /* poolKey：同一份底層字詞資料產生的 xxx 與 xxx_mc 共用同一個 poolKey，組卷時同卷只取一次（避免填寫題洩選擇題的答案） */
  function add(type, i, gen, poolKey) {
    const level = levelOf(i);
    specsA.push({ id: "lab-" + type + "-L" + level + "-" + String(i + 1).padStart(2, "0"), type: type, level: level, tag: tagOf(i), poolKey: poolKey, gen: gen });
  }
  function pickOthers(kit, all, self, key, n) { return kit.shuffle(all.filter(x => x !== self)).slice(0, n).map(x => x[key]); }

  /* 字與注音（皆為極基本字音） */
  const ZYA = [
    { c: "山", z: "ㄕㄢ" }, { c: "水", z: "ㄕㄨㄟˇ" }, { c: "日", z: "ㄖˋ" }, { c: "月", z: "ㄩㄝˋ" },
    { c: "口", z: "ㄎㄡˇ" }, { c: "木", z: "ㄇㄨˋ" }, { c: "火", z: "ㄏㄨㄛˇ" }, { c: "田", z: "ㄊㄧㄢˊ" }
  ];
  const ZYH = [
    { c: "手", z: "ㄕㄡˇ", ctx: "（　）機" }, { c: "人", z: "ㄖㄣˊ", ctx: "客（　）" }, { c: "土", z: "ㄊㄨˇ", ctx: "（　）壤" }, { c: "雨", z: "ㄩˇ", ctx: "（　）傘" },
    { c: "天", z: "ㄊㄧㄢ", ctx: "（　）空" }, { c: "花", z: "ㄏㄨㄚ", ctx: "（　）朵" }, { c: "草", z: "ㄘㄠˇ", ctx: "（　）原" }, { c: "魚", z: "ㄩˊ", ctx: "（　）刺" }
  ];
  ZYA.forEach((r, i) => {
    const pk = "lab-zy-" + r.c;
    add("zhuyin", i, () => ({ stem: LAB + "請寫出「" + r.c + "」的注音。", answer: r.z, accepted: [], explain: "「" + r.c + "」讀作" + r.z + "。（LAB 假資料）", trapNote: tagOf(i) === "trap" ? "注意聲調符號不要漏寫。" : undefined }), pk);
    add("zhuyin_mc", i, kit => ({ stem: LAB + "「" + r.c + "」的注音是哪一個？", options: [r.z].concat(pickOthers(kit, ZYA, r, "z", 3)), answer: 0, explain: "「" + r.c + "」讀作" + r.z + "。（LAB 假資料）", trapNote: tagOf(i) === "trap" ? "注意聲調符號。" : undefined }), pk);
  });
  ZYH.forEach((r, i) => {
    const pk = "lab-hz-" + r.c;
    add("hanzi", i, () => ({ stem: LAB + "依注音寫出國字：" + r.ctx + "（" + r.z + "）", answer: r.c, accepted: [], explain: r.ctx.replace("（　）", r.c) + "。（LAB 假資料）", trapNote: tagOf(i) === "trap" ? "注意字形，不要寫成形近字。" : undefined }), pk);
    add("hanzi_mc", i, kit => ({ stem: LAB + "依注音選出正確國字：" + r.ctx + "（" + r.z + "）", options: [r.c].concat(pickOthers(kit, ZYH, r, "c", 3)), answer: 0, explain: r.ctx.replace("（　）", r.c) + "。（LAB 假資料）", trapNote: tagOf(i) === "trap" ? "注意字形。" : undefined }), pk);
  });

  /* 同音字：句子、正確字、同音錯誤字、注音 */
  const HP = [
    { s: "媽媽（　）廚房做菜。", ok: "在", bad: "再", z: "ㄗㄞˋ" }, { s: "請你（　）說一次。", ok: "再", bad: "在", z: "ㄗㄞˋ" },
    { s: "他（　）經回家了。", ok: "已", bad: "以", z: "ㄧˇ" }, { s: "這個（　）位很舒服。", ok: "座", bad: "坐", z: "ㄗㄨㄛˋ" },
    { s: "他跑（　）很快。", ok: "得", bad: "的", z: "ㄉㄜ˙" }, { s: "這是我（　）書包。", ok: "的", bad: "得", z: "ㄉㄜ˙" },
    { s: "媽媽在廚房（　）飯。", ok: "做", bad: "作", z: "ㄗㄨㄛˋ" }, { s: "我在寫（　）業。", ok: "作", bad: "做", z: "ㄗㄨㄛˋ" }
  ];
  const POOL = ["山", "水", "日", "月", "火", "田"];
  HP.forEach((r, i) => {
    add("homophone", i, () => ({ stem: LAB + "同音字，（　）內填入正確的字（" + r.z + "）：" + r.s, answer: r.ok, accepted: [], explain: "依句意應填「" + r.ok + "」，不是「" + r.bad + "」。（LAB 假資料）", trapNote: tagOf(i) === "trap" ? "「" + r.ok + "」和「" + r.bad + "」讀音相同、意思不同。" : undefined }), "lab-hp-" + i);
    add("homophone_mc", i, kit => ({ stem: LAB + "同音字，選出填入（　）最適當的字（" + r.z + "）：" + r.s, options: [r.ok, r.bad].concat(kit.shuffle(POOL).slice(0, 2)), answer: 0, explain: "依句意應填「" + r.ok + "」，不是「" + r.bad + "」。（LAB 假資料）", trapNote: tagOf(i) === "trap" ? "「" + r.ok + "」和「" + r.bad + "」讀音相同、意思不同。" : undefined }), "lab-hp-" + i);
  });

  /* 找錯字：含錯字的句子、錯字、正確字 */
  const WC = [
    { s: "我們再公園裡玩耍。", bad: "再", ok: "在" }, { s: "明天請你在來一次。", bad: "在", ok: "再" },
    { s: "弟弟以經睡著了。", bad: "以", ok: "已" }, { s: "我喜歡吃蘋果和香焦。", bad: "焦", ok: "蕉" },
    { s: "他跑的很快。", bad: "的", ok: "得" }, { s: "媽媽在廚房作飯。", bad: "作", ok: "做" }
  ];
  WC.forEach((r, i) => {
    add("wrongchar", i, () => ({ stem: LAB + "句中有一個錯字，請寫出正確的字：" + r.s, answer: r.ok, accepted: [], explain: "錯字是「" + r.bad + "」，應改成「" + r.ok + "」。（LAB 假資料）", trapNote: tagOf(i) === "trap" ? "錯字常是讀音相同或字形相近的字。" : undefined }), "lab-wc-" + i);
    add("wrongchar_mc", i, kit => ({ stem: LAB + "句中有一個錯字，選出應該改成的正確字：" + r.s, options: [r.ok, r.bad].concat(kit.shuffle(POOL).slice(0, 2)), answer: 0, explain: "錯字是「" + r.bad + "」，應改成「" + r.ok + "」。（LAB 假資料）", trapNote: tagOf(i) === "trap" ? "錯字常是讀音相同或字形相近的字。" : undefined }), "lab-wc-" + i);
  });

  /* 照樣寫短語：題幹放例句示範結構；accepted 列常見寫法，其餘符合 mustInclude 結構詞且夠長、非照抄例句也算對 */
  const PT = [
    { ex: "又高又大", ask: "又＿＿又＿＿", ans: "又圓又胖", acc: ["又圓又胖", "又小又軟", "又香又甜"], must: ["又"], min: 4 },
    { ex: "一邊吃飯，一邊看電視", ask: "一邊＿＿，一邊＿＿", ans: "一邊寫字，一邊聽音樂", acc: ["一邊寫字，一邊聽音樂", "一邊走路，一邊聊天"], must: ["一邊"], min: 6 },
    { ex: "越跑越快", ask: "越＿越＿", ans: "越讀越懂", acc: ["越讀越懂", "越長越高", "越吃越多"], must: ["越"], min: 3 },
    { ex: "不但聰明，而且努力", ask: "不但＿＿，而且＿＿", ans: "不但勤勞，而且善良", acc: ["不但勤勞，而且善良", "不但好看，而且好吃"], must: ["不但", "而且"], min: 7 }
  ];
  PT.forEach((r, i) => add("pattern", i, () => ({
    stem: LAB + "照樣寫短語。\n例：" + r.ex + "\n請照樣寫出完整的短語：" + r.ask, answer: r.ans, accepted: r.acc.slice(), mustInclude: r.must.slice(), minLen: r.min, example: r.ex,
    explain: "先看例句的結構（「" + r.must.join("」「") + "」），再換成自己的詞語；參考答案：" + r.ans + "。（LAB 假資料）", trapNote: tagOf(i) === "trap" ? "不能只抄例句，要換成不同的詞語。" : undefined
  })));

  /* 造句（依規則批改：必含指定語詞、句末標點、字數下限；交卷後顯示參考例句）：原創 */
  const SC = [
    { k: ["專心"], s: "上課的時候，小華專心聽老師講解，所以很快就學會了新的算法。" },
    { k: ["努力"], s: "姊姊每天努力練習游泳，終於能夠游完一百公尺。" },
    { k: ["整理"], s: "放學回家後，我先把書桌整理乾淨，再開始寫功課。" },
    { k: ["發現", "書包"], s: "我發現書包的拉鍊壞了，於是請媽媽幫我修理。" }
  ];
  SC.forEach((r, i) => add("sentence", i, () => ({
    stem: LAB + "請用指定語詞造一個句子。", keywords: r.k.slice(), sample: r.s, sampleNote: "（LAB 假資料）句子裡有清楚的人物、動作與結果。",
    explain: "造句時先想一個情境，再把指定語詞放進去，最後檢查句子是否完整、標點是否正確。", trapNote: tagOf(i) === "trap" ? "不要只把語詞單獨列出，要放進完整的句子裡。" : undefined
  })));
  global.ExamBank.register(A, "lab-facts", specsA);

  /* 閱讀題組：一篇短文五題（原創假短文） */
  const specsB = [];
  const SETS = [
    {
      title: "LAB 測試短文一", passage: "小安每天早上先把書包整理好，再到公園跑步十分鐘。今天下雨，公園的路很滑，他決定改在家裡的陽台做體操。做完以後，他覺得身體暖暖的，心情也很好。",
      qs: [
        ["小安每天早上先做什麼事？", "把書包整理好", ["到公園跑步", "吃早餐", "在陽台做體操"], "短文說「先把書包整理好，再到公園跑步」。"],
        ["今天小安為什麼沒有去公園？", "因為下雨、路很滑", ["因為書包還沒整理好", "因為身體不舒服", "因為公園關門了"], "短文說今天下雨，公園的路很滑。"],
        ["小安改在哪裡做體操？", "家裡的陽台", ["學校操場", "公園門口", "房間的床上"], "短文說他改在家裡的陽台做體操。"],
        ["做完體操後，小安的感覺是什麼？", "身體暖暖的，心情很好", ["覺得很累很想睡", "覺得很冷", "覺得很無聊"], "短文最後說他身體暖暖的，心情也很好。"],
        ["短文中的「決定」意思最接近哪一個？", "打定主意", ["臨時忘記", "非常生氣", "慢慢等待"], "「決定」是指打定主意要做某件事。"]
      ]
    },
    {
      title: "LAB 測試短文二", passage: "班上的植物角養了三盆小植物。值日生每天輪流澆水，並把葉子上的灰塵擦乾淨。上星期小美發現其中一盆長出了新芽，大家都很開心，還為它取了名字叫「小綠」。",
      qs: [
        ["植物角養了幾盆小植物？", "三盆", ["兩盆", "四盆", "五盆"], "短文開頭說養了三盆小植物。"],
        ["誰負責每天澆水？", "值日生輪流", ["老師一個人", "小美一個人", "全班同時"], "短文說值日生每天輪流澆水。"],
        ["上星期是誰發現新芽？", "小美", ["小安", "值日生", "老師"], "短文說上星期小美發現其中一盆長出了新芽。"],
        ["大家為新芽的那盆植物取了什麼名字？", "小綠", ["小美", "新芽", "小花"], "短文說大家為它取名叫「小綠」。"],
        ["值日生除了澆水，還做了什麼事？", "把葉子上的灰塵擦乾淨", ["幫植物換盆", "替植物拍照", "把植物搬到教室外"], "短文說值日生還把葉子上的灰塵擦乾淨。"]
      ]
    }
  ];
  SETS.forEach((st, i) => {
    const level = levelOf(i + 1);
    specsB.push({
      id: "lab-reading-L" + level + "-" + String(i + 1).padStart(2, "0"), type: "reading", level: level, tag: i === 0 ? "basic" : "trap",
      gen: kit => ({
        passage: LAB + "\n" + st.passage, passageTitle: st.title,
        questions: st.qs.map((q, j) => ({ stem: LAB + q[0], options: [q[1]].concat(q[2]), answer: 0, explain: q[3], trapNote: j === 1 ? "先回到短文找到原因，再選答案。" : undefined }))
      })
    });
  });
  global.ExamBank.register(B, "lab-facts", specsB);
})(typeof window !== "undefined" ? window : globalThis);
