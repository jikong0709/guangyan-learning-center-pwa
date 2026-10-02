(function () {
    "use strict";

    const gcd = (a, b) => b === 0 ? Math.abs(a) : gcd(b, a % b);
    const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
    const tidy = value => Number.isInteger(Number(value)) ? String(Number(value)) : String(Number(Number(value).toFixed(2)));
    const frac = (n, d) => {
        const g = gcd(n, d);
        return d / g === 1 ? String(n / g) : (n / g) + "/" + (d / g);
    };
    const q = (id, kind, text, answer, hint, units, extras) => {
        const canonical = String(answer);
        const accepted = [canonical];
        (units || []).forEach(unit => accepted.push(canonical + unit));
        (extras || []).forEach(value => accepted.push(String(value)));
        return {
            id: id + "-" + Math.random().toString(36).slice(2),
            type: kind,
            text,
            answer: canonical,
            hint,
            acceptedAnswers: Array.from(new Set(accepted))
        };
    };

    function problem(topic, variant, application, i) {
        const id = topic + "-" + variant + "-" + (application ? "a" : "c") + i;
        const kind = application ? "應用題型" : "計算題";

        if (topic === "factor") {
            if (variant === 0) {
                const nums = [29, 39, 47, 51, 61];
                const answers = ["質數", "合數", "質數", "合數", "質數"];
                if (!application) return q(id, kind, "判斷 " + nums[i] + " 是質數或合數。", answers[i], "只有 1 和本身兩個因數的是質數。");
                const source = [36, 60, 72, 84, 90][i];
                const answer = ["2×2×3×3", "2×2×3×5", "2×2×2×3×3", "2×2×3×7", "2×3×3×5"][i];
                return q(id, kind, "把 " + source + " 做質因數分解。", answer, "用短除法持續除以質數直到商為 1。", [], [answer.replaceAll("×", "*")]);
            }
            const pairs = [[12,18],[15,25],[16,24],[21,35],[32,40]][i];
            const useLcm = i % 2 === 1;
            const answer = useLcm ? lcm(pairs[0], pairs[1]) : gcd(pairs[0], pairs[1]);
            const label = useLcm ? "最小公倍數" : "最大公因數";
            if (!application) return q(id, kind, "求 " + pairs[0] + " 和 " + pairs[1] + " 的" + label + "。", answer, "用短除法或列舉法可得 " + answer + "。");
            const text = useLcm
                ? "兩盞燈每 " + pairs[0] + " 秒與 " + pairs[1] + " 秒閃一次，至少幾秒後再次同時閃亮？"
                : pairs[0] + " 枝紅筆與 " + pairs[1] + " 枝藍筆平均分成最多組，每組相同，最多幾組？";
            return q(id, kind, text, answer, useLcm ? "求兩數的最小公倍數。" : "求兩數的最大公因數。", useLcm ? ["秒"] : ["組"]);
        }

        if (topic === "decimal") {
            if (variant === 0) {
                const divisor = [0.2,0.4,0.5,0.8,1.25][i];
                const answer = i + 3;
                const dividend = tidy(divisor * answer);
                if (!application) return q(id, kind, "計算 " + dividend + "÷" + divisor + "。", answer, "被除數與除數同時擴大相同倍數，再做整數除法。");
                return q(id, kind, dividend + " 公升飲料，每瓶裝 " + divisor + " 公升，可裝幾瓶？", answer, "總量÷每瓶容量=" + answer + "。", ["瓶"]);
            }
            const dividend = [17.8,23.5,31.6,42.7,58.9][i];
            const divisor = [3,4,6,7,9][i];
            const answer = tidy(dividend / divisor);
            const text = application
                ? dividend + " 公尺緞帶平均剪成 " + divisor + " 段，每段約幾公尺？取到小數點後第二位。"
                : "計算 " + dividend + "÷" + divisor + "，商取到小數點後第二位。";
            return q(id, kind, text, answer, "計算後依小數點後第三位四捨五入。", application ? ["公尺"] : []);
        }

        if (topic === "quantity") {
            if (variant === 0) {
                const base = [80,120,150,200,240][i];
                const rate = [1.25,0.75,1.4,0.6,1.5][i];
                const answer = tidy(base * rate);
                const text = application
                    ? "商品原價 " + base + " 元，售價是原價的 " + rate + " 倍，售價多少元？"
                    : "基準量 " + base + " 的 " + rate + " 倍是多少？";
                return q(id, kind, text, answer, "比較量=基準量×倍數。", application ? ["元"] : []);
            }
            const comparison = [120,180,210,240,300][i];
            const rate = [1.5,1.2,1.4,0.8,1.25][i];
            const answer = tidy(comparison / rate);
            const text = application
                ? "甲數是 " + comparison + "，是乙數的 " + rate + " 倍，乙數是多少？"
                : "比較量是 " + comparison + "，它是基準量的 " + rate + " 倍，求基準量。";
            return q(id, kind, text, answer, "基準量=比較量÷倍數。");
        }

        if (topic === "sector-length") {
            const radius = [6,8,10,12,15][i];
            const angle = [60,90,120,180,72][i];
            const arc = radius * 2 * 3.14 * angle / 360;
            const answer = tidy(variant === 0 ? arc : arc + radius * 2);
            const text = variant === 0
                ? "半徑 " + radius + " 公分、圓心角 " + angle + "° 的扇形弧長約多少公分？"
                : "半徑 " + radius + " 公分、圓心角 " + angle + "° 的扇形周長約多少公分？";
            const appText = "同規格扇形花圃，" + (variant === 0 ? "弧形邊界" : "完整邊界") + "約長多少公尺？";
            return q(id, kind, application ? appText + "（半徑 " + radius + " 公尺、圓心角 " + angle + "°）" : text,
                answer, variant === 0 ? "弧長=圓周長×圓心角/360。" : "扇形周長=弧長+兩條半徑。", [application ? "公尺" : "公分"]);
        }

        if (topic === "scale") {
            if (variant === 0) {
                const original = [3,4,5,6,8][i];
                const rate = [2,3,4,0.5,1.5][i];
                const answer = tidy(original * rate);
                const text = application
                    ? "照片中的線段長 " + original + " 公分，調整為 " + rate + " 倍後長多少公分？"
                    : "原圖一邊長 " + original + " 公分，畫成 " + rate + " 倍圖後邊長多少？";
                return q(id, kind, text, answer, "對應邊長=原長×倍率。", ["公分"]);
            }
            const mapCm = [2,3,4,5,8][i];
            const scales = [10000,20000,25000,50000,100000][i];
            const answer = tidy(mapCm * scales / 100);
            const text = application
                ? "地圖比例尺 1:" + scales + "，兩地圖上相距 " + mapCm + " 公分，實際相距多少公尺？"
                : "比例尺 1:" + scales + "，圖上 " + mapCm + " 公分代表實際多少公尺？";
            return q(id, kind, text, answer, "圖上距離×比例尺，再將公分換成公尺。", ["公尺"]);
        }

        if (topic === "upper-solve") {
            if (variant === 0) {
                const sum = [56,72,84,96,120][i];
                const diff = [8,12,16,20,30][i];
                const answer = application ? (sum - diff) / 2 : (sum + diff) / 2;
                const text = application
                    ? "哥哥和弟弟共有 " + sum + " 元，哥哥比弟弟多 " + diff + " 元，弟弟有多少元？"
                    : "兩數和是 " + sum + "、差是 " + diff + "，較大數是多少？";
                return q(id, kind, text, answer, application ? "較小數=(和-差)÷2。" : "較大數=(和+差)÷2。", application ? ["元"] : []);
            }
            const heads = [10,12,15,18,20][i];
            const chickens = [4,5,7,8,9][i];
            const rabbits = heads - chickens;
            const legs = chickens * 2 + rabbits * 4;
            if (application) return q(id, kind, "雞兔同籠有 " + heads + " 個頭、" + legs + " 隻腳，兔有幾隻？", rabbits,
                "假設全是雞，多出的腳數÷2就是兔數。", ["隻"]);
            const start = i + 2;
            const step = i + 1;
            const answer = start + 4 * step;
            return q(id, kind, "數列首項 " + start + "，每次增加 " + step + "，第 5 項是多少？", answer, "首項+4×公差。");
        }

        if (topic === "mixed-ops") {
            if (variant === 0) {
                const a = [12.5,18.4,25.6,32.8,45.5][i];
                const b = [2.5,4.6,3.2,8.2,5.5][i];
                const answer = tidy((a + b) * 2);
                const text = application
                    ? "甲繩長 " + a + " 公尺、乙繩長 " + b + " 公尺，各 2 條，共長多少公尺？"
                    : "計算 (" + a + "+" + b + ")×2。";
                return q(id, kind, text, answer, "先算括號，再乘以 2。", application ? ["公尺"] : []);
            }
            if (variant === 1) {
                const n = i + 1;
                const answer = frac(n + 2, 3);
                const text = application
                    ? "水桶有 " + n + "/3 公升，加 4/3 公升再倒出 2/3 公升，剩多少？"
                    : "計算 " + n + "/3+4/3-2/3。";
                return q(id, kind, text, answer, "同分母分數直接處理分子。", application ? ["公升"] : []);
            }
            const base = [25,40,50,64,80][i];
            const text = application
                ? "一批 " + base + " 件物品的 0.75 與 0.25 分別裝箱，兩箱合計多少件？"
                : "用簡便方法計算 " + base + "×0.75+" + base + "×0.25。";
            return q(id, kind, text, base, "提取共同因數：" + base + "×(0.75+0.25)。", application ? ["件"] : []);
        }

        if (topic === "sector-area") {
            const radius = [6,8,10,12,15][i];
            const angle = [60,90,120,180,72][i];
            const sector = radius * radius * 3.14 * angle / 360;
            const answer = tidy(variant === 0 ? sector : radius * radius * 3.14 - sector);
            const text = variant === 0
                ? "半徑 " + radius + " 公分、圓心角 " + angle + "° 的扇形面積約多少？"
                : "半徑 " + radius + " 公分的圓扣除圓心角 " + angle + "° 扇形後，剩餘面積約多少？";
            return q(id, kind, application ? text.replace("公分", "公尺") : text, answer,
                variant === 0 ? "扇形面積=圓面積×圓心角/360。" : "剩餘面積=圓面積-扇形面積。",
                [application ? "平方公尺" : "平方公分"]);
        }

        if (topic === "speed") {
            if (variant === 0) {
                const speed = [40,50,60,72,80][i];
                const time = [2,3,4,5,6][i];
                const answer = speed * time;
                const text = application
                    ? "汽車時速 " + speed + " 公里，行駛 " + time + " 小時，共走多遠？"
                    : "速率 " + speed + " 公里/時，時間 " + time + " 小時，距離是多少？";
                return q(id, kind, text, answer, "距離=速率×時間。", ["公里"]);
            }
            const mps = [2,3,4,5,6][i];
            const answer = mps * 60;
            const text = application
                ? "跑者每秒跑 " + mps + " 公尺，1 分鐘可跑多少公尺？"
                : "秒速 " + mps + " 公尺等於分速多少公尺？";
            return q(id, kind, text, answer, "1 分鐘=60 秒，所以乘以 60。", ["公尺", "公尺/分"]);
        }

        if (topic === "statistics") {
            if (variant === 0) {
                const percent = [10,20,25,30,40][i];
                const angle = percent * 3.6;
                if (!application) return q(id, kind, "圓形圖某類占 " + percent + "%，圓心角是多少度？", angle, "360×百分率。", ["度", "°"]);
                const answer = 200 * percent / 100;
                return q(id, kind, "調查 200 人，圓形圖顯示 " + percent + "% 喜歡閱讀，共有幾人？", answer, "總人數×百分率。", ["人"]);
            }
            const values = [[20,30],[35,50],[40,65],[55,80],[70,95]][i];
            const answer = values[1] - values[0];
            const text = application
                ? "統計表顯示去年 " + values[0] + " 人、今年 " + values[1] + " 人，增加幾人？"
                : "長條圖中甲項 " + values[0] + "、乙項 " + values[1] + "，乙比甲多多少？";
            return q(id, kind, text, answer, "較大值-較小值。", application ? ["人"] : []);
        }

        if (topic === "lower-solve") {
            if (variant === 0) {
                const ages = [[10,14],[12,18],[20,30],[25,35],[32,48]][i];
                const answer = application ? ages[1] + i + 2 : (ages[0] + ages[1]) / 2;
                const text = application
                    ? "哥哥今年 " + ages[1] + " 歲，" + (i + 2) + " 年後幾歲？"
                    : ages[0] + " 和 " + ages[1] + " 的平均數是多少？";
                return q(id, kind, text, answer, application ? "現在年齡+經過年數。" : "總和÷個數。", application ? ["歲"] : []);
            }
            const fast = [8,10,12,15,18][i];
            const slow = [4,5,6,9,12][i];
            const gap = (fast - slow) * (i + 2);
            const answer = application ? gap / (fast - slow) : fast - slow;
            const text = application
                ? "甲每分鐘 " + fast + " 公尺追趕乙每分鐘 " + slow + " 公尺，距離 " + gap + " 公尺，幾分鐘追上？"
                : "甲每分鐘 " + fast + " 公尺，乙每分鐘 " + slow + " 公尺，速率差多少？";
            return q(id, kind, text, answer, application ? "追趕時間=距離差÷速率差。" : "兩速率相減。", application ? ["分鐘"] : ["公尺/分"]);
        }

        if (topic === "solids") {
            if (variant === 0) {
                const a = [3,4,5,6,8][i], b = [4,5,6,7,9][i], h = [5,6,7,8,10][i];
                if (!application) return q(id, kind, "長方體長 " + a + "、寬 " + b + "、高 " + h + " 公分，體積多少？", a*b*h,
                    "體積=長×寬×高。", ["立方公分"]);
                const answer = tidy(a*a*3.14*h);
                return q(id, kind, "圓柱底面半徑 " + a + " 公分、高 " + h + " 公分，體積約多少？", answer,
                    "圓柱體積=底面積×高。", ["立方公分"]);
            }
            const side = [3,4,5,6,8][i];
            if (!application) return q(id, kind, "邊長 " + side + " 公分的正方體，表面積多少？", 6*side*side,
                "6 個面，每面面積為邊長×邊長。", ["平方公分"]);
            const height = side + 3;
            const answer = tidy(2*3.14*side*side + 2*3.14*side*height);
            return q(id, kind, "有蓋圓柱罐半徑 " + side + " 公分、高 " + height + " 公分，表面積約多少？", answer,
                "表面積=兩底面+側面。", ["平方公分"]);
        }

        return q(id, kind, "題目載入失敗。", "0", "請重新整理。");
    }

    const section = (id, title, topic, variant) => ({
        sectionId: id,
        title,
        generators: Array.from({length: 10}, (_, index) =>
            () => problem(topic, variant, index >= 5, index % 5)
        )
    });
    const unit = (semester, number, title, sections) => ({
        semester,
        number,
        unitId: semester + "-" + number,
        unitTitle: semester + "第" + number + "單元：" + title,
        sections,
        reviewTitle: semester + "第" + number + "單元總評量：" + title
    });

    window.buildFullCurriculum = function (legacy) {
        const fractionSections = legacy[0].sections;
        const ratioSections = legacy[1].sections;
        const circumferenceSection = legacy[2].sections[0];
        const circleAreaSection = legacy[2].sections[1];
        circumferenceSection.sectionId = "上6-1";
        circumferenceSection.title = "6-1 圓周率與圓周長";
        circleAreaSection.sectionId = "下2-1";
        circleAreaSection.title = "2-1 圓面積";

        return [
            unit("六上", 1, "最大公因數和最小公倍數", [
                section("上1-1", "1-1 質數、合數與質因數分解", "factor", 0),
                section("上1-2", "1-2 最大公因數與最小公倍數", "factor", 1)
            ]),
            unit("六上", 2, "分數除法", fractionSections),
            unit("六上", 3, "小數除法", [
                section("上3-1", "3-1 小數除法", "decimal", 0),
                section("上3-2", "3-2 商的概數與生活應用", "decimal", 1)
            ]),
            unit("六上", 4, "比和比值", ratioSections),
            unit("六上", 5, "兩量關係", [
                section("上5-1", "5-1 基準量與比較量", "quantity", 0),
                section("上5-2", "5-2 倍的關係與反求基準量", "quantity", 1)
            ]),
            unit("六上", 6, "圓周長和扇形周長", [
                circumferenceSection,
                section("上6-2", "6-2 扇形弧長", "sector-length", 0),
                section("上6-3", "6-3 扇形周長", "sector-length", 1)
            ]),
            unit("六上", 7, "放大、縮小和比例尺", [
                section("上7-1", "7-1 放大圖與縮小圖", "scale", 0),
                section("上7-2", "7-2 比例尺", "scale", 1)
            ]),
            unit("六上", 8, "怎樣解題", [
                section("上8-1", "8-1 和差問題", "upper-solve", 0),
                section("上8-2", "8-2 規律與雞兔問題", "upper-solve", 1)
            ]),
            unit("六下", 1, "小數與分數的四則運算", [
                section("下1-1", "1-1 小數四則運算", "mixed-ops", 0),
                section("下1-2", "1-2 分數四則運算", "mixed-ops", 1),
                section("下1-3", "1-3 混合運算與簡化計算", "mixed-ops", 2)
            ]),
            unit("六下", 2, "圓面積與扇形面積", [
                circleAreaSection,
                section("下2-2", "2-2 扇形面積", "sector-area", 0),
                section("下2-3", "2-3 複合圖形面積", "sector-area", 1)
            ]),
            unit("六下", 3, "速率", [
                section("下3-1", "3-1 距離、時間與速率", "speed", 0),
                section("下3-2", "3-2 秒速、分速與時速", "speed", 1)
            ]),
            unit("六下", 4, "統計圖表", [
                section("下4-1", "4-1 圓形圖與百分率", "statistics", 0),
                section("下4-2", "4-2 統計圖表判讀", "statistics", 1)
            ]),
            unit("六下", 5, "怎樣解題", [
                section("下5-1", "5-1 年齡與平均問題", "lower-solve", 0),
                section("下5-2", "5-2 追趕與組合問題", "lower-solve", 1)
            ]),
            unit("六下", 6, "角柱與圓柱", [
                section("下6-1", "6-1 角柱與圓柱的體積", "solids", 0),
                section("下6-2", "6-2 角柱與圓柱的表面積", "solids", 1)
            ])
        ];
    };
})();

