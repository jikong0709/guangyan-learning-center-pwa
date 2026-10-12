(function () {
  "use strict";

  window.MEIHAO_COURSE_CATALOG = {
    math: {
      subject: "數學",
      stage: "國小區",
      grade: "六年級",
      versions: [
        {
          id: "hanlin",
          name: "翰林版",
          status: "ready",
          note: "六上＋六下，共 14 單元、32 小節",
          href: "./courses/grade6-math/?version=hanlin"
        },
        {
          id: "kanghsuan",
          name: "康軒版",
          status: "ready",
          note: "六上 9 單元＋六下 6 單元",
          href: "./courses/grade6-math/?version=kanghsuan"
        },
        {
          id: "nani",
          name: "南一版",
          status: "ready",
          note: "六上 8 單元＋六下 6 單元",
          href: "./courses/grade6-math/?version=nani"
        }
      ]
    },
    chinese: {
      subject: "國語",
      stage: "國小區",
      grade: "六年級",
      beta: true,
      versions: [
        { id: "kanghsuan", name: "康軒版（一課一課）", status: "ready", note: "六上第1課〈跑道〉已上線，其餘課次陸續開放", href: "./courses/grade6-chinese-v2/index.html" },
        { id: "hanlin", name: "翰林版", status: "ready", note: "六上＋六下，各 10 個主題", href: "./courses/grade6-chinese/index.html?version=hanlin" },
        { id: "nani", name: "南一版", status: "ready", note: "六上＋六下，各 10 個主題", href: "./courses/grade6-chinese/index.html?version=nani" }
      ]
    },
    social: {
      subject: "社會",
      stage: "國小區",
      grade: "六年級",
      beta: true,
      versions: [
        { id: "hanlin", name: "翰林版", status: "ready", note: "六上＋六下，各 10 個主題", href: "./courses/grade6-social/index.html?version=hanlin" },
        { id: "kanghsuan", name: "康軒版", status: "ready", note: "六上＋六下，各 10 個主題", href: "./courses/grade6-social/index.html?version=kanghsuan" },
        { id: "nani", name: "南一版", status: "ready", note: "六上＋六下，各 10 個主題", href: "./courses/grade6-social/index.html?version=nani" }
      ]
    },
    science: {
      subject: "自然",
      stage: "國小區",
      grade: "六年級",
      beta: true,
      versions: [
        { id: "hanlin", name: "翰林版", status: "ready", note: "六上＋六下，各 10 個主題", href: "./courses/grade6-science/index.html?version=hanlin" },
        { id: "kanghsuan", name: "康軒版", status: "ready", note: "六上＋六下，各 10 個主題", href: "./courses/grade6-science/index.html?version=kanghsuan" },
        { id: "nani", name: "南一版", status: "ready", note: "六上＋六下，各 10 個主題", href: "./courses/grade6-science/index.html?version=nani" }
      ]
    }
  };
})();

