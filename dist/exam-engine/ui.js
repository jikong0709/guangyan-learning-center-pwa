/* 考卷介面（跨科目共用）：設定頁、作答頁、結果頁、錯題檢討。純 DOM 建構，不使用 innerHTML 灌入題目文字。 */
(function (global) {
  "use strict";

  function h(tag, attrs, kids) {
    const el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      const v = attrs[k];
      if (v === false || v == null) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, v);
    });
    (kids || []).forEach(c => { if (c == null || c === false) return; el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }

  function start(env) {
    const engine = env.engine, cfg = env.config, root = env.root, bank = engine.bank;
    const verKey = cfg.versions[env.version] ? env.version : cfg.defaultVersion;
    const ver = cfg.versions[verKey];
    const storeKey = cfg.storagePrefix + verKey;
    const typeByKey = {}; cfg.types.forEach(t => { typeByKey[t.key] = t; });
    const LETTERS = "ABCDE";
    const state = { view: "setup", sel: null, exam: null, resp: {}, work: {}, checked: {}, submitted: false, warned: false };

    /* ----- 儲存（失敗不可壞掉） ----- */
    function loadSel() {
      const def = defaultSel();
      try {
        const raw = global.localStorage.getItem(storeKey);
        if (!raw) return def;
        const s = JSON.parse(raw);
        const okUnits = (s.unitIds || []).filter(id => ver.units.some(u => u.unitId === id) && unitAvailable(ver.units.find(u => u.unitId === id)));
        const okTypes = (s.types || []).filter(k => typeByKey[k]);
        return {
          unitIds: okUnits.length ? okUnits : def.unitIds,
          types: okTypes.length ? okTypes : def.types,
          level: cfg.levelRanges.some(l => l.key === s.level) ? s.level : "all",
          mode: s.mode === "practice" ? "practice" : "score"
        };
      } catch (e) { return def; }
    }
    function saveSel() {
      try { global.localStorage.setItem(storeKey, JSON.stringify(state.sel)); } catch (e) { /* storage 不可用時略過 */ }
    }
    function unitAvailable(u) { return u.topics.some(t => bank.specsOf(t).length > 0); }
    function defaultSel() {
      const first = ver.units.find(unitAvailable);
      return { unitIds: first ? [first.unitId] : [], types: cfg.types.map(t => t.key), level: "all", mode: "score" };
    }
    state.sel = loadSel();

    /* ----- 共用 ----- */
    function mount(node, title) {
      while (root.firstChild) root.removeChild(root.firstChild);
      root.appendChild(node);
      try { global.scrollTo(0, 0); } catch (e) { /* 忽略 */ }
      const hd = root.querySelector("[data-focus]");
      if (hd) { hd.setAttribute("tabindex", "-1"); try { hd.focus({ preventScroll: true }); } catch (e) { /* 忽略 */ } }
      if (title) document.title = title;
    }
    function unitsSelected() { return ver.units.filter(u => state.sel.unitIds.indexOf(u.unitId) >= 0); }
    function unitTitle(id) { const u = ver.units.find(x => x.unitId === id); return u ? u.semester + "第" + u.unitId.split("-")[1] + "單元 " + u.title : id; }
    function pageTitle() { return ver.name + cfg.title + "｜莓好學習區"; }

    /* ================= 設定頁 ================= */
    function renderSetup() {
      state.view = "setup";
      const sel = state.sel;
      const msg = h("p", { class: "ex-msg", role: "alert", "aria-live": "polite" });
      const startBtn = h("button", { type: "button", class: "ex-btn ex-btn-primary ex-btn-xl", id: "ex-start" }, ["開始出題"]);

      function refresh() {
        let err = "";
        if (!sel.unitIds.length) err = "請至少選 1 個單元。";
        else if (!sel.types.length) err = "請至少選 1 種題型。";
        else if (!engine.availableTypes(unitsSelected()).length) err = "所選單元的題庫還在準備中。";
        msg.textContent = err;
        startBtn.disabled = !!err;
        saveSel();
      }
      function checkbox(name, value, checked, label, extra, disabled) {
        const input = h("input", { type: "checkbox", name, value, checked: checked, disabled: disabled });
        input.addEventListener("change", () => {
          const list = name === "unit" ? sel.unitIds : sel.types;
          const i = list.indexOf(value);
          if (input.checked && i < 0) list.push(value);
          if (!input.checked && i >= 0) list.splice(i, 1);
          refresh();
        });
        return h("label", { class: "ex-check" + (disabled ? " is-disabled" : "") }, [input, h("span", { class: "ex-check-text" }, [label, extra ? h("small", { text: extra }) : null])]);
      }
      function setUnits(pred) {
        sel.unitIds = ver.units.filter(u => unitAvailable(u) && pred(u)).map(u => u.unitId);
        renderSetup();
      }

      const groups = ["六上", "六下"].map(sem => {
        const list = ver.units.filter(u => u.semester === sem);
        if (!list.length) return null;
        return h("fieldset", { class: "ex-group" }, [
          h("legend", { text: sem }),
          h("div", { class: "ex-checks" }, list.map(u => {
            const ok = unitAvailable(u);
            const n = u.topics.reduce((a, t) => a + bank.specsOf(t).length, 0);
            return checkbox("unit", u.unitId, sel.unitIds.indexOf(u.unitId) >= 0 && ok,
              "第" + u.unitId.split("-")[1] + "單元 " + u.title, ok ? n + " 種題型模板" : "題庫準備中", !ok);
          }))
        ]);
      });

      const typeChecks = cfg.types.map(t => checkbox("type", t.key, sel.types.indexOf(t.key) >= 0, t.name));

      const levelSel = h("select", { id: "ex-level", "aria-label": "難度範圍" }, cfg.levelRanges.map(l => h("option", { value: l.key, selected: l.key === sel.level, text: l.name })));
      levelSel.addEventListener("change", () => { sel.level = levelSel.value; saveSel(); });
      const levelNote = h("p", { class: "ex-note", id: "ex-level-note" });
      function syncLevel() {
        const p = sel.mode === "practice";
        levelSel.disabled = p;
        levelNote.textContent = p ? "二十題練習由簡入深，不受難度影響。" : "難度只套用在一百分計分卷。";
      }

      function modeCard(key, icon, title, desc) {
        const input = h("input", { type: "radio", name: "mode", value: key, checked: sel.mode === key });
        input.addEventListener("change", () => { if (input.checked) { sel.mode = key; saveSel(); syncLevel(); } });
        return h("label", { class: "ex-mode" }, [input, h("span", { class: "ex-mode-body" }, [h("strong", { text: icon + " " + title }), h("small", { text: desc })])]);
      }

      const verLinks = cfg.versionOrder.map(k => h("a", {
        class: "ex-ver" + (k === verKey ? " is-on" : ""), href: "?version=" + k, "aria-current": k === verKey ? "page" : false, text: cfg.versions[k].name
      }));

      startBtn.addEventListener("click", () => {
        refresh(); if (startBtn.disabled) return;
        launch(false);
      });

      const node = h("div", { class: "ex-view" }, [
        h("section", { class: "ex-card ex-hero" }, [
          h("p", { class: "ex-kicker", text: cfg.title }),
          h("h1", { "data-focus": true, text: ver.name + "・" + cfg.heading }),
          h("p", { class: "ex-sub", text: "自己選單元、題型和模式，每次出題的數字都不一樣。" }),
          h("div", { class: "ex-vers", role: "navigation", "aria-label": "切換教科書版本" }, [h("span", { class: "ex-vers-label", text: "教科書版本：" })].concat(verLinks))
        ]),
        h("section", { class: "ex-card" }, [
          h("h2", { text: "1. 選單元（可複選）" }),
          h("div", { class: "ex-quick" }, [
            h("button", { type: "button", class: "ex-btn ex-btn-small", onclick: () => setUnits(() => true), text: "全選" }),
            h("button", { type: "button", class: "ex-btn ex-btn-small", onclick: () => setUnits(() => false), text: "全不選" }),
            h("button", { type: "button", class: "ex-btn ex-btn-small", onclick: () => setUnits(u => u.semester === "六上"), text: "只選六上" }),
            h("button", { type: "button", class: "ex-btn ex-btn-small", onclick: () => setUnits(u => u.semester === "六下"), text: "只選六下" })
          ])
        ].concat(groups)),
        h("section", { class: "ex-card" }, [
          h("h2", { text: "2. 選題型（可複選）" }),
          h("div", { class: "ex-checks ex-checks-types" }, typeChecks)
        ]),
        h("section", { class: "ex-card" }, [
          h("h2", { text: "3. 難度範圍" }),
          h("label", { class: "ex-field", for: "ex-level" }, ["題目難度：", levelSel]),
          levelNote
        ]),
        h("section", { class: "ex-card" }, [
          h("h2", { text: "4. 考卷模式" }),
          h("div", { class: "ex-modes", role: "radiogroup", "aria-label": "考卷模式" }, [
            modeCard("score", "📄", "一百分計分卷", "整份寫完一次交卷，批改後顯示總分（滿分 100）。"),
            modeCard("practice", "✏️", "二十題逐題練習", "共 20 題，由簡入深；每題可立即檢查並看解析。")
          ])
        ]),
        h("div", { class: "ex-startbar" }, [msg, startBtn]),
        h("p", { class: "ex-note" }, [
          "題目為自編練習，非出版社課本原文。",
          h("a", { href: ver.sourceUrl, target: "_blank", rel: "noopener noreferrer", text: ver.sourceLabel })
        ])
      ]);
      mount(node, pageTitle());
      syncLevel();
      refresh();
    }

    /* ================= 出題與作答 ================= */
    function launch(redoWrongOnly) {
      try {
        const sel = state.sel;
        const lv = cfg.levelRanges.find(l => l.key === sel.level) || cfg.levelRanges[0];
        if (redoWrongOnly) {
          const sum = engine.summarize(state.exam, state.resp);
          state.exam = engine.rebuildFromItems(state.exam, sum.wrong);
        } else {
          state.exam = engine.buildExam({ mode: sel.mode, units: unitsSelected(), types: sel.types, levelMin: lv.min, levelMax: lv.max, mix: lv.mix });
        }
      } catch (e) {
        console.error(e);
        const m = document.querySelector(".ex-msg"); if (m) m.textContent = "出題失敗：" + (e && e.message ? e.message : e);
        return;
      }
      state.resp = {}; state.work = {}; state.checked = {}; state.submitted = false; state.warned = false;
      renderExam();
    }
    function redo() {
      /* 同設定重新出題：沿用考卷當初的設定（含只重做錯題前的原設定），重新抽 spec 並重新 gen */
      const o = state.exam.opts;
      state.sel.mode = o.mode; state.sel.types = o.types.slice();
      state.sel.unitIds = o.units.map(u => u.unitId);
      launch(false);
    }

    function answeredCount() { return state.exam.items.filter(it => engine.isAnswered(it, state.resp[it.no])).length; }

    function renderExam() {
      state.view = "exam";
      const ex = state.exam, practice = ex.mode === "practice";
      const progress = h("span", { class: "ex-progress", "aria-live": "polite" });
      function upd() { progress.textContent = "已作答 " + answeredCount() + " / " + ex.items.length + " 題"; }
      const warn = h("p", { class: "ex-msg", role: "alert", "aria-live": "polite" });
      const submitBtn = h("button", { type: "button", class: "ex-btn ex-btn-primary ex-btn-xl", id: "ex-submit", text: practice ? "完成，看統計" : "交卷批改" });
      submitBtn.addEventListener("click", () => {
        const left = ex.items.length - answeredCount();
        if (left > 0 && !state.warned) {
          state.warned = true;
          warn.textContent = "還有 " + left + " 題沒作答（沒作答算錯）。要交卷請再按一次「" + submitBtn.textContent + "」。";
          submitBtn.textContent = "仍要" + (practice ? "完成" : "交卷");
          return;
        }
        state.submitted = true; renderResult();
      });

      const body = [];
      if (practice) {
        body.push(h("div", { class: "ex-section" }, ex.items.map(it => itemCard(it, practice, upd))));
      } else {
        const nums = "一二三四五六";
        ex.sections.forEach((s, si) => {
          body.push(h("section", { class: "ex-section ex-bigsec", "data-type": s.type }, [
            h("h2", { class: "ex-sec-title", text: nums[si] + "、" + s.name + "（每題 " + s.each + " 分，共 " + s.points + " 分）" }),
            h("p", { class: "ex-sec-hint", text: s.intro + "（共 " + s.count + " 題）" })
          ].concat(s.items.map(it => itemCard(it, practice, upd)))));
        });
      }

      const keyEl = answerSheet(ex);
      const keyBtn = keyToggle(keyEl);
      const node = h("div", { class: "ex-view ex-examview" }, [
        h("section", { class: "ex-card ex-examhead" }, [
          h("h1", { "data-focus": true, text: ver.name + cfg.title + (practice ? "・二十題逐題練習" : "・一百分計分卷") }),
          h("p", { class: "ex-sub", text: practice ? "每題作答後按「檢查」立即看對錯與解析。" : "全部寫完再按「交卷批改」，滿分 " + ex.total + " 分。" }),
          h("div", { class: "ex-headbar no-print" }, [
            progress,
            keyBtn,
            h("button", { type: "button", class: "ex-btn ex-btn-small", id: "ex-print-exam", onclick: () => window.print(), text: "🖨️ 列印考卷" }),
            h("button", { type: "button", class: "ex-btn ex-btn-small", onclick: () => renderSetup(), text: "回設定頁" })
          ])
        ])
      ].concat([keyEl]).concat(body).concat([
        h("div", { class: "ex-startbar no-print" }, [warn, submitBtn])
      ]));
      mount(node, pageTitle());
      upd();
    }

    function badge(it) {
      return h("span", { class: "ex-badge ex-badge-" + it.tag }, [cfg.tagIcons[it.tag] + " " + cfg.tagNames[it.tag]]);
    }

    function itemCard(it, practice, onChange) {
      const id = "q" + it.no;
      const card = h("article", { class: "ex-q", id: id });
      const feedback = h("div", { class: "ex-feedback", "aria-live": "polite" });
      const head = h("div", { class: "ex-qhead" }, [
        h("span", { class: "ex-qno", text: it.no + "." }),
        practice ? h("span", { class: "ex-chip", text: typeByKey[it.type].short }) : null,
        practice ? badge(it) : null,
        h("span", { class: "ex-qpts", text: it.points + " 分" })
      ]);
      card.appendChild(head);
      card.appendChild(h("p", { class: "ex-stem", id: id + "-stem", text: it.stem }));
      const area = h("div", { class: "ex-ans" });
      const locks = [];

      function changed(v) { state.resp[it.no] = v; onChange(); }

      if (it.type === "single" || it.type === "multi") {
        const multi = it.type === "multi";
        const fs = h("fieldset", { class: "ex-opts" }, [h("legend", { class: "ex-sr", text: "第 " + it.no + " 題選項" + (multi ? "（可複選）" : "") })]);
        it.options.forEach((opt, i) => {
          const input = h("input", { type: multi ? "checkbox" : "radio", name: id, value: String(i), "aria-describedby": id + "-stem" });
          input.addEventListener("change", () => {
            if (multi) {
              const cur = Array.isArray(state.resp[it.no]) ? state.resp[it.no].slice() : [];
              const p = cur.indexOf(i);
              if (input.checked && p < 0) cur.push(i);
              if (!input.checked && p >= 0) cur.splice(p, 1);
              changed(cur.sort((a, b) => a - b));
            } else changed(i);
          });
          locks.push(input);
          fs.appendChild(h("label", { class: "ex-opt" }, [input, h("span", { class: "ex-opt-text" }, [h("b", { text: LETTERS[i] + "." }), " " + opt])]));
        });
        area.appendChild(fs);
      } else if (it.type === "tf") {
        const grp = h("div", { class: "ex-tfs", role: "radiogroup", "aria-labelledby": id + "-stem" });
        const btns = [[true, "○ 對"], [false, "✕ 錯"]].map(pair => {
          const b = h("button", { type: "button", class: "ex-tf", role: "radio", "aria-checked": "false", text: pair[1] });
          b.addEventListener("click", () => {
            btns.forEach(x => { x.el.setAttribute("aria-checked", "false"); x.el.classList.remove("is-on"); });
            b.setAttribute("aria-checked", "true"); b.classList.add("is-on");
            changed(pair[0]);
          });
          locks.push(b);
          grp.appendChild(b);
          return { el: b };
        });
        area.appendChild(grp);
      } else {
        const input = h("input", { type: "text", class: "ex-input", id: id + "-in", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: it.type === "word" ? "請寫出答案和單位" : "請輸入答案" });
        input.addEventListener("input", () => changed(input.value));
        locks.push(input);
        area.appendChild(h("label", { class: "ex-label", for: id + "-in" }, ["第 " + it.no + " 題答案" + (it.type === "word" ? "（請寫出答案和單位）" : "")]));
        area.appendChild(input);
        area.appendChild(h("span", { class: "ex-printline", "aria-hidden": "true" }));
      }
      if (typeByKey[it.type].showWork && !practice) {
        const wid = id + "-work";
        const work = h("textarea", { class: "ex-work", id: wid, rows: "2", placeholder: "列式（選填，不計分）", autocomplete: "off", spellcheck: "false" });
        work.addEventListener("input", () => { state.work[it.no] = work.value; });
        area.insertBefore(h("label", { class: "ex-label", for: wid }, ["第 " + it.no + " 題列式（選填，不計分）"]), area.firstChild);
        area.insertBefore(work, area.children[1]);
        area.appendChild(h("span", { class: "ex-printlines", "aria-hidden": "true" }));
      }
      card.appendChild(area);

      if (practice) {
        const btn = h("button", { type: "button", class: "ex-btn ex-btn-check no-print", text: "檢查" });
        btn.addEventListener("click", () => {
          const g = engine.gradeItem(it, state.resp[it.no]);
          if (!g.answered) {
            /* 還沒作答就按檢查：只提示，不鎖題 */
            while (feedback.firstChild) feedback.removeChild(feedback.firstChild);
            feedback.className = "ex-feedback is-show";
            feedback.appendChild(h("p", { class: "ex-verdict", text: "請先作答，再按「檢查」。" }));
            return;
          }
          state.checked[it.no] = true;
          locks.forEach(l => { l.disabled = true; });
          btn.disabled = true;
          showFeedback(feedback, it, state.resp[it.no], g);
          card.classList.add(g.correct ? "is-right" : "is-wrong");
        });
        card.appendChild(btn);
      }
      card.appendChild(feedback);
      return card;
    }

    function showFeedback(box, it, resp, g) {
      while (box.firstChild) box.removeChild(box.firstChild);
      box.className = "ex-feedback is-show " + (g.correct ? "is-right" : "is-wrong");
      const kids = [h("p", { class: "ex-verdict", text: g.correct ? "✔ 答對了！" : (g.answered ? "✘ 答錯了" : "✘ 還沒作答") })];
      if (!g.correct) kids.push(h("p", {}, [h("b", { text: "正確答案：" }), engine.describeAnswer(it)]));
      kids.push(h("p", { class: "ex-explain", text: "解法一：" + it.explain }));
      if (it.explain2) kids.push(h("p", { class: "ex-explain", text: "解法二：" + it.explain2 }));
      if (it.tag === "trap" && it.trapNote) kids.push(h("p", { class: "ex-trapnote", text: "⚠️ 易錯點：" + it.trapNote }));
      kids.forEach(k => box.appendChild(k));
    }

    /* ----- 答案卷（用考卷實際那份題目的 explain/explain2，不重新 gen） ----- */
    function keyCard(it) {
      const typeName = typeByKey[it.type] ? typeByKey[it.type].short : it.type;
      return h("article", { class: "ex-keycard" }, [
        h("div", { class: "ex-keyhead" }, [
          h("span", { class: "ex-qno", text: "第 " + it.no + " 題" }),
          h("span", { class: "ex-chip", text: typeName }),
          h("span", { class: "ex-qpts", text: it.points + " 分" })
        ]),
        h("p", { class: "ex-keyans" }, [h("b", { text: "正解：" }), h("span", { class: "ex-keyans-text", text: engine.describeAnswer(it) })]),
        h("p", { class: "ex-keystem", text: it.stem }),
        h("p", { class: "ex-keyexp" }, [h("b", { text: "解法一：" }), it.explain]),
        it.explain2 ? h("p", { class: "ex-keyexp ex-keyexp2" }, [h("b", { text: "解法二：" }), it.explain2]) : null,
        it.tag === "trap" && it.trapNote ? h("p", { class: "ex-trapnote", text: "⚠️ 易錯點：" + it.trapNote }) : null
      ]);
    }
    function answerSheet(ex) {
      const nums = "一二三四五六";
      const kids = [h("h2", { class: "ex-keytitle", text: "📖 答案卷（" + (ex.mode === "practice" ? "二十題練習" : "一百分計分卷") + "）" })];
      if (ex.mode === "practice") ex.items.forEach(it => kids.push(keyCard(it)));
      else ex.sections.forEach((s, si) => {
        kids.push(h("h3", { class: "ex-keysec", text: nums[si] + "、" + s.name + "（每題 " + s.each + " 分，共 " + s.points + " 分）" }));
        s.items.forEach(it => kids.push(keyCard(it)));
      });
      return h("section", { class: "ex-card ex-key is-collapsed", id: "ex-key", "aria-label": "答案卷" }, kids);
    }
    function printKeyOnly() {
      document.body.classList.add("ex-print-key");
      const done = () => { document.body.classList.remove("ex-print-key"); window.removeEventListener("afterprint", done); };
      window.addEventListener("afterprint", done);
      try { window.print(); } finally { setTimeout(done, 1500); }
    }
    function keyToggle(keyEl) {
      const btn = h("button", { type: "button", class: "ex-btn ex-btn-small", id: "ex-key-toggle", "aria-expanded": "false", "aria-controls": "ex-key", text: "📖 顯示答案卷" });
      btn.addEventListener("click", () => {
        const open = keyEl.classList.toggle("is-collapsed") === false;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "📖 收合答案卷" : "📖 顯示答案卷";
        if (open) { const pb = keyEl.querySelector("#ex-print-key"); if (!pb) { keyEl.insertBefore(h("button", { type: "button", class: "ex-btn ex-btn-small no-print", id: "ex-print-key", onclick: printKeyOnly, text: "🖨️ 列印答案卷" }), keyEl.children[1]); } }
      });
      return btn;
    }

    /* ================= 結果頁 ================= */
    function renderResult() {
      state.view = "result";
      const ex = state.exam;
      const sum = engine.summarize(ex, state.resp);
      const practice = ex.mode === "practice";

      function statRow(label, o) {
        const pct = o.total ? Math.round(o.right * 100 / o.total) : 0;
        return h("li", { class: "ex-stat" }, [
          h("span", { class: "ex-stat-label", text: label }),
          h("span", { class: "ex-stat-bar", "aria-hidden": "true" }, [h("i", { style: "width:" + pct + "%" })]),
          h("span", { class: "ex-stat-num", text: o.right + " / " + o.total + "（" + pct + "%）" })
        ]);
      }
      const tagRows = ["basic", "trap", "extend"].filter(t => sum.byTag[t].total).map(t => statRow(cfg.tagIcons[t] + " " + cfg.tagNames[t], sum.byTag[t]));
      const unitRows = Object.keys(sum.byUnit).map(id => statRow(unitTitle(id), sum.byUnit[id]));

      const reviews = sum.wrong.map(it => {
        const resp = state.resp[it.no];
        return h("article", { class: "ex-review" }, [
          h("div", { class: "ex-qhead" }, [h("span", { class: "ex-qno", text: "第 " + it.no + " 題" }), h("span", { class: "ex-chip", text: typeByKey[it.type].short }), badge(it), h("span", { class: "ex-qpts", text: "✘ 0 / " + it.points + " 分" })]),
          h("p", { class: "ex-stem", text: it.stem }),
          h("p", {}, [h("b", { text: "你的答案：" }), engine.describeResponse(it, resp)]),
          h("p", {}, [h("b", { text: "正確答案：" }), engine.describeAnswer(it)]),
          state.work[it.no] && state.work[it.no].trim() ? h("p", { class: "ex-yourwork", text: "你的列式：" + state.work[it.no].trim() }) : null,
          h("p", { class: "ex-explain", text: "解法一：" + it.explain }),
          it.explain2 ? h("p", { class: "ex-explain", text: "解法二：" + it.explain2 }) : null,
          it.tag === "trap" && it.trapNote ? h("p", { class: "ex-trapnote", text: "⚠️ 易錯點：" + it.trapNote }) : null
        ]);
      });
      const secRows = (sum.bySection || []).map((sc, i) => h("li", { class: "ex-stat ex-secscore" }, [
        h("span", { class: "ex-stat-label", text: "一二三四五六"[i] + "、" + sc.name }),
        h("span", { class: "ex-stat-bar", "aria-hidden": "true" }, [h("i", { style: "width:" + (sc.max ? Math.round(sc.earned * 100 / sc.max) : 0) + "%" })]),
        h("span", { class: "ex-stat-num", text: sc.earned + "／" + sc.max + "（答對 " + sc.right + "／" + sc.total + " 題）" })
      ]));

      const rKey = answerSheet(ex);
      const node = h("div", { class: "ex-view ex-resultview" }, [
        h("section", { class: "ex-card ex-scorecard" }, [
          h("h1", { "data-focus": true, text: practice ? "練習統計" : "批改結果" }),
          h("p", { class: "ex-bigscore", "aria-label": "得分" }, [h("strong", { id: "ex-score", text: String(sum.score) }), " / " + sum.total + " 分"]),
          h("p", { class: "ex-sub", id: "ex-correct", text: "答對 " + sum.correctCount + " / " + sum.count + " 題" }),
          h("div", { class: "ex-headbar no-print" }, [
            sum.wrong.length ? h("button", { type: "button", class: "ex-btn ex-btn-primary", id: "ex-redo-wrong", onclick: () => launch(true), text: "只重做錯題" }) : null,
            h("button", { type: "button", class: "ex-btn", id: "ex-regen", onclick: () => redo(), text: "重新出題（同設定）" }),
            h("button", { type: "button", class: "ex-btn", id: "ex-back", onclick: () => renderSetup(), text: "回設定頁" }),
            keyToggle(rKey),
            h("button", { type: "button", class: "ex-btn", onclick: () => window.print(), text: "🖨️ 列印／存成 PDF" })
          ])
        ]),
        rKey,
        secRows.length ? h("section", { class: "ex-card", id: "ex-secscores" }, [h("h2", { text: "各大題得分（總分 " + sum.score + "／" + sum.total + "）" }), h("ul", { class: "ex-stats" }, secRows)]) : null,
        h("section", { class: "ex-card" }, [h("h2", { text: "依標籤統計" }), h("ul", { class: "ex-stats" }, tagRows)]),
        h("section", { class: "ex-card" }, [h("h2", { text: "依單元統計" }), h("ul", { class: "ex-stats" }, unitRows)]),
        h("section", { class: "ex-card" }, [
          h("h2", { text: "錯題檢討（" + sum.wrong.length + " 題）" })
        ].concat(reviews.length ? reviews : [h("p", { class: "ex-allright", text: "🎉 全部答對，太棒了！" })]))
      ]);
      mount(node, pageTitle());
    }

    renderSetup();
  }

  global.ExamUI = { start: start };
})(window);
