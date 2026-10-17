/* 康軒版六上社會學習導覽：學習重點 → 重點複習 → 單元測驗。 */
(function (global) {
  "use strict";
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      const value = attrs[key];
      if (key === "className") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.indexOf("on") === 0 && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value != null) node.setAttribute(key, value);
    });
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }
  function start(opts) {
    const root = opts.root, cfg = opts.config, version = opts.version;
    const data = global.SocialLearningContent;
    const ver = cfg.versions[version];
    if (!data || version !== "kanghsuan") {
      root.replaceChildren(el("section", { className: "social-learning sl-card" }, [
        el("h1", { text: "社會科學習內容準備中" }),
        el("p", { text: "目前先開放康軒版六上社會學習導覽。其他版本的單元對照尚未完成核對。" }),
        el("a", { href: "?version=kanghsuan", className: "sl-btn sl-btn-primary" }, ["前往康軒版六上"])
      ]));
      return;
    }
    let selectedId = null;
    let step = "home";
    function mount(node) {
      root.replaceChildren(node);
      try { global.scrollTo(0, 0); } catch (_) {}
      const h = root.querySelector("[data-focus]");
      if (h) { h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (_) {} }
    }
    function button(label, fn, primary) {
      return el("button", { type: "button", className: "sl-btn" + (primary ? " sl-btn-primary" : ""), onClick: fn }, [label]);
    }
    function unitData(id) { return data.units[id]; }
    function header(eyebrow, title, desc) {
      return el("section", { className: "sl-hero" }, [
        el("div", { className: "sl-eyebrow", text: eyebrow }),
        el("h1", { text: title, "data-focus": "true" }),
        el("p", { text: desc })
      ]);
    }
    function renderHome() {
      step = "home";
      const grid = el("div", { className: "sl-unit-grid" }, ver.units.map(function (unit, index) {
        const d = unitData(unit.unitId);
        const available = unit.topics.some(function (topic) { return global.ExamBank.specsOf(topic).length > 0; });
        return el("button", { type: "button", className: "sl-unit", onClick: function () { selectedId = unit.unitId; renderLearning(); } }, [
          el("span", { className: "sl-eyebrow", text: "六上・第 " + (index + 1) + " 單元" }),
          el("strong", { text: unit.title }),
          el("span", { text: d.summary }),
          el("span", { text: available ? "學習重點 → 複習 → 單元測驗" : "題庫準備中" })
        ]);
      }));
      mount(el("div", { className: "social-learning" }, [
        header("莓好學習區 / 社會科", "康軒版六上社會", "依單元學習，再進行複習與 100 分單元測驗。教材單元名稱仍需與實際課本目錄核對。"),
        el("div", { className: "sl-progress" }, [
          el("span", { text: "① 學習重點" }), el("span", { text: "② 重點複習" }), el("span", { text: "③ 單元測驗" })
        ]),
        el("section", { className: "sl-card" }, [el("h2", { text: "選擇單元" }), grid]),
        el("p", { className: "sl-note", text: "題目為自編練習，不複製出版社課文。正式題庫仍須逐題查證；未核實的版本單元不視為已驗收。" })
      ]));
    }
    function renderLearning() {
      step = "learning";
      const d = unitData(selectedId), unit = ver.units.find(function (u) { return u.unitId === selectedId; });
      const sections = d.sections.map(function (s, i) {
        const blocks = [
          el("p", { className: "sl-lesson-intro", text: s.introduction || "" }),
          el("h3", { text: "學習重點" }),
          el("ul", { className: "sl-points" }, (s.points || []).map(function (p) { return el("li", { text: p }); }))
        ];
        if (s.keyTerms && s.keyTerms.length) {
          blocks.push(el("h3", { text: "關鍵詞理解" }));
          blocks.push(el("dl", { className: "sl-key-terms" }, s.keyTerms.map(function (item) {
            return el("div", { className: "sl-key-term" }, [
              el("dt", { text: item.term }),
              el("dd", { text: item.definition })
            ]);
          })));
        }
        if (s.example) {
          blocks.push(el("div", { className: "sl-example" }, [
            el("strong", { text: "生活情境" }),
            el("p", { text: s.example })
          ]));
        }
        if (s.recap) {
          blocks.push(el("div", { className: "sl-recap" }, [
            el("strong", { text: "本節小結" }),
            el("p", { text: s.recap })
          ]));
        }
        return el("section", { className: "sl-card sl-lesson-card" }, [
          el("div", { className: "sl-eyebrow", text: "第 " + (i + 1) + " 節" }),
          el("h2", {}, [el("span", { className: "sl-step", text: String(i + 1) }), s.title]),
          ...blocks
        ]);
      });
      const goals = el("section", { className: "sl-card sl-goals" }, [
        el("h2", { text: "🎯 本單元學習目標" }),
        el("p", { text: "完成本單元後，試著確認自己能做到以下幾件事：" }),
        el("ul", { className: "sl-points" }, (d.goals || []).map(function (goal) { return el("li", { text: goal }); }))
      ]);
      mount(el("div", { className: "social-learning" }, [
        header("完整學習內容", unit.title, d.summary),
        el("div", { className: "sl-progress" }, [el("span", { text: "① 學習內容・目前" }), el("span", { text: "② 單元複習" }), el("span", { text: "③ 單元測驗" })]),
        goals,
        ...sections,
        el("section", { className: "sl-card" }, [
          el("h2", { text: "📌 全單元重點整理" }),
          el("ul", { className: "sl-points" }, d.misconceptions.map(function (p) { return el("li", { text: p }); })),
          el("div", { className: "sl-actions" }, [
            button("回單元列表", renderHome, false),
            button("進入單元複習 →", renderReview, true)
          ])
        ]),
        el("p", { className: "sl-note", text: "教材為原創自學內容，依公開課程計畫整理；出版社實際課本目錄與逐課範圍仍待核對。涉及具體史實或制度細節的正式題目須另行查證。" })
      ]));
    }
    function renderReview() {
      step = "review";
      const d = unitData(selectedId), unit = ver.units.find(function (u) { return u.unitId === selectedId; });
      const items = d.review.map(function (item, i) {
        return el("details", { className: "sl-review" }, [
          el("summary", { text: "自我檢核 " + (i + 1) + "｜" + item.q }),
          el("p", { text: item.a })
        ]);
      });
      mount(el("div", { className: "social-learning" }, [
        header("重點複習", unit.title, "先試著自己回答，再展開查看參考答案。"),
        el("div", { className: "sl-progress" }, [el("span", { text: "① 學習重點・完成" }), el("span", { text: "② 重點複習・目前" }), el("span", { text: "③ 單元測驗" })]),
        el("section", { className: "sl-card" }, [el("h2", { text: "自我檢核" }), ...items]),
        el("section", { className: "sl-card" }, [
          el("h2", { text: "常見迷思再確認" }),
          el("ul", { className: "sl-points" }, d.misconceptions.map(function (p) { return el("li", { text: p }); })),
          el("p", { className: "sl-note", text: "測驗會依此單元對應的知識主題抽題；題庫逐題審核與事實查核仍在進行中。" }),
          el("div", { className: "sl-actions" }, [
            button("← 回學習重點", renderLearning, false),
            button("開始本單元 100 分測驗 →", function () { beginExam(selectedId); }, true)
          ])
        ])
      ]));
    }
    function beginExam(unitId) {
      const unit = ver.units.find(function (u) { return u.unitId === unitId; });
      const available = unit && unit.topics.some(function (topic) { return global.ExamBank.specsOf(topic).length > 0; });
      if (!available) {
        mount(el("div", { className: "social-learning" }, [
          header("題庫準備中", unit ? unit.title : "單元", "此單元尚無可用題目，避免進入空白考卷。"),
          button("回單元列表", renderHome, true)
        ]));
        return;
      }
      try {
        global.localStorage.setItem(cfg.storagePrefix + version, JSON.stringify({
          unitIds: [unitId], types: cfg.types.map(function (t) { return t.key; }), level: "all", mode: "score"
        }));
      } catch (_) {
        /* storage unavailable: engine falls back to its safe default selection */
      }
      opts.onStartExam(unitId);
    }
    renderHome();
  }
  global.SocialLearningUI = { start: start };
})(typeof window !== "undefined" ? window : globalThis);
