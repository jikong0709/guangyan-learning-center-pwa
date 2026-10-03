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
    }
  };
})();

