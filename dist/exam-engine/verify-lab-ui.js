/* 瀏覽器層驗證（LAB 頁）：node verify-lab-ui.js
   需要 playwright-core 與 Edge。環境變數：PW_PATH（playwright-core 資料夾）、EDGE_PATH（msedge.exe）、SHOT_DIR（截圖輸出資料夾）。
   會起一個本機靜態伺服器（只綁 127.0.0.1）服務 dist/，跑完自動關閉。 */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
const PW = process.env.PW_PATH || "C:\\Users\\User\\AppData\\Local\\Temp\\codex-collshp-pw-cache\\_npx\\31e32ef8478fbf80\\node_modules\\playwright-core";
const EDGE = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SHOT = process.env.SHOT_DIR || path.join(require("os").tmpdir(), "lab-shots");
fs.mkdirSync(SHOT, { recursive: true });
const { chromium } = require(PW);
const DIST = path.join(__dirname, "..");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json" };

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log("PASS  " + name); } else { fail++; console.log("FAIL  " + name + (detail ? "  -> " + detail : "")); } }

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]); let f = path.join(DIST, u);
  if (!f.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end("404"); } res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(d); });
});

async function answerAll(page, opts) {
  /* 從答案卷讀正解並作答：fill 類打字、single 類點選對應字母 */
  await page.click("#ex-key-toggle");
  const cards = await page.$$eval(".ex-keycard", els => els.map(el => ({
    no: Number((el.querySelector(".ex-qno").textContent.match(/\d+/) || [0])[0]),
    ans: el.querySelector(".ex-keyans-text").textContent, self: /參考例句/.test(el.querySelector(".ex-keyans").textContent)
  })));
  await page.click("#ex-key-toggle");
  let n = 0;
  for (const c of cards) {
    if (c.self) continue; /* 造句由呼叫端自己寫 */
    const q = "#q" + c.no;
    const m = /^([A-E])\. /.exec(c.ans);
    if (m) { const idx = "ABCDE".indexOf(m[1]); await page.locator(q + " input[type=radio]").nth(idx).check(); }
    else if (await page.locator(q + "-in").count()) { await page.fill(q + "-in", c.ans); }
    else throw new Error("找不到作答元件 q" + c.no);
    n++;
  }
  return { cards, answered: n };
}

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  try {
    for (const vp of [{ name: "desktop", w: 1280, h: 900 }, { name: "mobile390", w: 390, h: 844 }]) {
      console.log("\n===== " + vp.name + " " + vp.w + "x" + vp.h + " =====");
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", e => errs.push("pageerror: " + e.message));
      page.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
      page.on("dialog", d => d.dismiss());
      const noOverflow = async (label) => {
        const w = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        check(vp.name + " " + label + "：頁面無橫向溢位（scrollWidth " + w + " <= " + vp.w + "）", w <= vp.w);
      };

      await page.goto(base + "/courses/grade6-chinese-lab/index.html");
      await page.waitForSelector("#ex-start");
      await noOverflow("設定頁");
      check(vp.name + " 設定頁：標示 LAB、含 11 種題型勾選", /LAB/.test(await page.textContent("h1")) && (await page.locator("input[name=type]").count()) === 11);
      await page.screenshot({ path: path.join(SHOT, vp.name + "-1-setup.png"), fullPage: true });

      /* --- 未作答直接交卷：警告文字、造句不算未作答 --- */
      await page.click("#ex-start");
      await page.waitForSelector("#ex-submit");
      const prog = await page.textContent(".ex-progress");
      const mm = /已作答 0 \/ (\d+) 題/.exec(prog);
      const nAuto = mm ? Number(mm[1]) : -1;
      const nAll = await page.locator("article.ex-q").count();
      check(vp.name + " 進度列題數＝全卷題數（" + prog + "；全卷 " + nAll + " 題）", nAuto === nAll);
      await page.click("#ex-submit");
      const warn = await page.textContent(".ex-msg");
      check(vp.name + " 空白交卷警告：提到未作答題數（含造句）", new RegExp("還有 " + nAuto + " 題沒作答").test(warn), warn);

      /* --- 版面結構 --- */
      const titles = await page.$$eval(".ex-sec-title", els => els.map(e => e.textContent));
      check(vp.name + " 大題標題連續編號、含「照樣寫短語」「造句」，且都有配分", /^一、/.test(titles[0]) && titles.some(t => /照樣寫短語.*共 8 分/.test(t)) && /造句.*共 4 分/.test(titles[titles.length - 1]) && titles.every((t, i) => t.startsWith(["一","二","三","四","五","六","七","八","九","十","十一","十二"][i] + "、")) && !titles.some(t => /undefined/.test(t)), titles.join(" | "));
      check(vp.name + " 大題總分合計 100", titles.reduce((a, t) => a + Number((/共 (\d+) 分/.exec(t) || [0, 0])[1]), 0) === 100);
      check(vp.name + " 短文區塊只出現 1 次，且位於閱讀第一題之前", (await page.locator(".ex-examview .ex-passage:not(.ex-keypassage)").count()) === 1 && await page.evaluate(() => { const p = document.querySelector(".ex-examview .ex-passage:not(.ex-keypassage)"); const nx = p.nextElementSibling; return nx && nx.classList.contains("ex-q"); }));
      const rdNos = await page.$$eval("[data-type=reading] article.ex-q .ex-qno", els => els.map(e => Number(e.textContent)));
      check(vp.name + " 閱讀 5 題連續編號", rdNos.length === 5 && rdNos.every((x, i) => x === rdNos[0] + i), rdNos.join(","));
      check(vp.name + " 單選形式有 radio、填寫形式有文字框（國字注音選擇題不再被畫成文字框）", (await page.locator("[data-type=zhuyin_mc] input[type=radio]").count()) === 16 && (await page.locator("[data-type=zhuyin_mc] input.ex-input").count()) === 0 && (await page.locator("[data-type=zhuyin] input.ex-input").count()) === 4 && (await page.locator("[data-type=zhuyin] input[type=radio]").count()) === 0);
      check(vp.name + " 照樣寫短語：題幹含例句、文字作答", (await page.locator("[data-type=pattern] input.ex-input").count()) === 2 && /例：/.test(await page.textContent("[data-type=pattern] .ex-stem")));
      check(vp.name + " 造句區：1 題、輸入框、指定語詞 chip、參考例句預設收合", (await page.locator(".ex-selfwrite").count()) === 1 && (await page.locator("[data-type=sentence] .ex-kw").count()) >= 1 && (await page.locator(".ex-sample.is-collapsed").count()) === 1);
      await page.locator("[data-type=sentence] .ex-btn-small").first().click();
      check(vp.name + " 點「看參考例句」可展開", (await page.locator(".ex-sample:not(.is-collapsed)").count()) === 1);
      await page.locator("[data-type=sentence] .ex-btn-small").first().click();
      await noOverflow("考卷頁");
      await page.screenshot({ path: path.join(SHOT, vp.name + "-2-exam.png"), fullPage: true });

      /* --- 列印版面（考卷）--- */
      await page.emulateMedia({ media: "print" });
      const pr = await page.evaluate(() => {
        const d = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : "missing"; };
        return { selfwrite: d(".ex-selfwrite"), lines: d("[data-type=sentence] .ex-printlines"), sample: d(".ex-sample"), passage: d(".ex-examview .ex-passage:not(.ex-keypassage)"), fillIn: d(".ex-input"), line: d("[data-type=pattern] .ex-printline") };
      });
      check(vp.name + " 列印考卷：造句輸入框隱藏、橫線顯示、參考例句不外洩、短文顯示、填寫橫線顯示", pr.selfwrite === "none" && pr.lines === "block" && pr.sample === "none" && pr.passage !== "none" && pr.fillIn === "none" && pr.line === "block", JSON.stringify(pr));
      await page.emulateMedia({ media: "screen" });

      /* --- 作答（造句：含指定語詞、句末標點、夠長 → 規則全中）--- */
      const { answered } = await answerAll(page);
      check(vp.name + " 讀答案卷後完成自動批改題作答（" + answered + " 題）", answered === nAuto - 1);
      const keyTxt = await page.textContent("#ex-key");
      check(vp.name + " 答案卷：造句顯示參考例句、批改規則（含配分）與自評對照；短文只出現一次", /參考例句：/.test(keyTxt) && /批改規則（程式自動批改）/.test(keyTxt) && /・用到指定語詞「.+」（2 分）/.test(keyTxt) && /☐ /.test(keyTxt) && (await page.locator("#ex-key .ex-keypassage").count()) === 1);
      check(vp.name + " 答案卷：照樣寫短語顯示參考答案與規則說明", /批改規則：與正解相同，或含「/.test(keyTxt));
      const kws = await page.$$eval("[data-type=sentence] article.ex-q .ex-kw", els => els.map(k => k.textContent));
      await page.locator(".ex-selfwrite").fill("今天" + kws.join("和") + "都用在這個句子裡，我覺得很開心。");
      const prog2 = await page.textContent(".ex-progress");
      check(vp.name + " 作答後進度 " + nAuto + "/" + nAuto, prog2.indexOf("已作答 " + nAuto + " / " + nAuto) >= 0, prog2);
      await page.click("#ex-submit");
      await page.waitForSelector("#ex-score");

      /* --- 結果頁 --- */
      check(vp.name + " 結果：全對（含造句規則全中）→ 100 / 100", (await page.textContent("#ex-score")) === "100" && /100 分/.test(await page.textContent(".ex-bigscore")));
      check(vp.name + " 結果：答對題數含造句與照樣寫（" + nAuto + " / " + nAuto + "）", (await page.textContent("#ex-correct")).indexOf("答對 " + nAuto + " / " + nAuto) >= 0);
      const secScore = (await page.textContent("#ex-secscores")).replace(/\s/g, "");
      check(vp.name + " 各大題得分含造句 4／4、照樣寫短語 8／8", /造句4／4/.test(secScore) && /照樣寫短語8／8/.test(secScore), secScore.slice(0, 300));
      const ruleOk = await page.locator(".ex-selfcard .ex-rule.is-ok").count(), ruleNo = await page.locator(".ex-selfcard .ex-rule.is-no").count();
      check(vp.name + " 造句批改明細：規則全為 ✔（" + ruleOk + " 條）、無 ✘", ruleOk >= 3 && ruleNo === 0);
      const cardTxt = await page.textContent(".ex-selfcard");
      check(vp.name + " 造句卡：你寫的句子、參考例句、自評對照、寫作提醒、得分 4 / 4", /你寫的句子：今天/.test(cardTxt) && /參考例句：/.test(cardTxt) && /自評對照（只是幫你檢查，不影響得分）/.test(cardTxt) && /寫作提醒/.test(cardTxt) && /4 \/ 4 分/.test(cardTxt));
      const boxes = page.locator(".ex-selfcard input[type=checkbox]");
      check(vp.name + " 自評對照有 3 個可勾選框", (await boxes.count()) === 3 && !(await boxes.first().isDisabled()));
      await boxes.nth(0).check(); await boxes.nth(1).check();
      check(vp.name + " 勾自評不影響得分（仍 100）", (await page.textContent("#ex-score")) === "100");
      await noOverflow("結果頁");
      await page.screenshot({ path: path.join(SHOT, vp.name + "-3-result.png"), fullPage: true });
      await page.emulateMedia({ media: "print" });
      const rp = await page.evaluate(() => {
        const row = document.querySelector(".ex-selfcard .ex-rub-row");
        return { input: getComputedStyle(row.querySelector("input")).display, box: getComputedStyle(row.querySelector(".ex-rub-box")).display, boxText: row.querySelector(".ex-rub-box").textContent };
      });
      check(vp.name + " 列印結果頁：自評勾選框以文字 ☑/☐ 呈現", rp.input === "none" && rp.box !== "none" && rp.boxText === "☑", JSON.stringify(rp));
      await page.emulateMedia({ media: "screen" });
      await page.click("#ex-key-toggle");
      await page.evaluate(() => document.body.classList.add("ex-print-key"));
      await page.emulateMedia({ media: "print" });
      const kp = await page.evaluate(() => ({ key: getComputedStyle(document.querySelector("#ex-key")).display, score: getComputedStyle(document.querySelector(".ex-scorecard")).display }));
      check(vp.name + " 列印答案卷：只顯示答案卷（成績區隱藏）", kp.key !== "none" && kp.score === "none", JSON.stringify(kp));
      await page.evaluate(() => document.body.classList.remove("ex-print-key"));
      await page.emulateMedia({ media: "screen" });

      /* --- 第二輪：造句只寫語詞（缺標點、太短）→ 部分分；其餘全對 --- */
      await page.click("#ex-back"); await page.waitForSelector("#ex-start");
      await page.click("#ex-start"); await page.waitForSelector("#ex-submit");
      await answerAll(page);
      const kw2 = await page.$$eval("[data-type=sentence] article.ex-q .ex-kw", els => els.map(k => k.textContent));
      await page.locator(".ex-selfwrite").fill(kw2.join(""));
      await page.click("#ex-submit"); await page.waitForSelector("#ex-score");
      const sc2 = Number(await page.textContent("#ex-score"));
      check(vp.name + " 造句只寫語詞 → 部分分（總分 " + sc2 + "，介於 96~99）", sc2 >= 96 && sc2 <= 99, String(sc2));
      check(vp.name + " 批改明細同時有 ✔ 與 ✘；錯題檢討含造句並顯示參考例句", (await page.locator(".ex-selfcard .ex-rule.is-ok").count()) >= 1 && (await page.locator(".ex-selfcard .ex-rule.is-no").count()) >= 1 && /參考例句：/.test(await page.textContent(".ex-review:not(.ex-selfcard)")));

      /* --- 第三輪：全空白交卷 --- */
      await page.click("#ex-back");
      await page.waitForSelector("#ex-start");
      await page.click("#ex-start"); await page.waitForSelector("#ex-submit");
      await page.click("#ex-submit"); await page.click("#ex-submit");
      await page.waitForSelector("#ex-score");
      check(vp.name + " 全空白交卷 → 0 分；未寫句子的自評勾選框 disabled", (await page.textContent("#ex-score")) === "0" && (await page.locator(".ex-selfcard input[type=checkbox]:not([disabled])").count()) === 0);
      check(vp.name + " 錯題檢討：全部 " + nAuto + " 題皆列出，閱讀題附可展開短文", (await page.locator(".ex-review:not(.ex-selfcard)").count()) === nAuto && (await page.locator(".ex-review-passage").count()) === 5);

      /* --- 練習模式：不含造句／題組 --- */
      await page.click("#ex-back"); await page.waitForSelector("#ex-start");
      await page.locator("input[name=mode][value=practice]").check();
      await page.click("#ex-start"); await page.waitForSelector("#ex-submit");
      check(vp.name + " 20 題練習：20 題、無短文題組", (await page.locator("article.ex-q").count()) === 20 && (await page.locator(".ex-passage").count()) === 0);

      check(vp.name + " 全程 console / page error 為 0", errs.length === 0, errs.join(" ; "));
      await ctx.close();
    }

    /* --- 填寫／選擇雙形式可單獨出題 --- */
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      await page.goto(base + "/courses/grade6-chinese-lab/index.html"); await page.waitForSelector("#ex-start");
      /* 全不選再只勾 國字注音（填寫）＋閱讀 */
      const boxes = page.locator("input[name=type]");
      for (let i = 0; i < await boxes.count(); i++) if (await boxes.nth(i).isChecked()) await boxes.nth(i).uncheck();
      await page.locator("input[name=type][value=zhuyin]").check();
      await page.locator("input[name=type][value=hanzi_mc]").check();
      await page.click("#ex-start"); await page.waitForSelector("#ex-submit");
      const kinds = await page.evaluate(() => ({ text: document.querySelectorAll(".ex-input").length, radio: document.querySelectorAll("input[type=radio]").length, secs: Array.from(document.querySelectorAll(".ex-sec-title")).map(e => e.textContent) }));
      check("390px 只勾『國字注音（填寫）＋注音寫國字（選擇）』：兩種作答形式各自出現", kinds.text > 0 && kinds.radio > 0 && kinds.secs.length === 2 && /填寫/.test(kinds.secs[0]) && /選擇/.test(kinds.secs[1]), JSON.stringify(kinds.secs));
      await ctx.close();
    }

    /* --- 數學頁與原國語頁不壞 --- */
    for (const url of ["/courses/grade6-math/index.html", "/courses/grade6-chinese/index.html"]) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage(); const errs = [];
      page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
      await page.goto(base + url); await page.waitForSelector("#ex-start");
      await page.click("#ex-start"); await page.waitForSelector("#ex-submit");
      const titles = await page.$$eval(".ex-sec-title", els => els.map(e => e.textContent));
      const total = titles.reduce((a, t) => a + Number((/共 (\d+) 分/.exec(t) || [0, 0])[1]), 0);
      check(url + " 390px：一百分卷可出題、大題標題格式「一、…（每題 X 分，共 Y 分）」、合計 100", total === 100 && /^一、.+（每題 \d+ 分，共 \d+ 分）$/.test(titles[0]) && titles.every(t => !/附加|自評/.test(t)), titles.join(" | "));
      check(url + " 無 selfcheck/passage 元素、無 console error", (await page.locator(".ex-selfwrite, .ex-passage").count()) === 0 && errs.length === 0, errs.join(";"));
      await page.click("#ex-submit"); await page.click("#ex-submit"); await page.waitForSelector("#ex-score");
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      check(url + " 結果頁無橫向溢位、無造句批改區", w <= 390 && (await page.locator("#ex-selfsec").count()) === 0, "scrollWidth=" + w);
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log("\n截圖輸出：" + SHOT);
  console.log(fail ? "FAIL (" + fail + " failed, " + pass + " passed)" : "ALL PASS  (" + pass + " pass, 0 fail)");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("腳本例外：", e); server.close(); process.exit(2); });
