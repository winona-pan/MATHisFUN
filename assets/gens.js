/* 題目產生器庫：給「綜合練習」和「總複習」共用
   每個函式回傳 { q, ans, unit, hint, pic, choices? }，需要 widgets.js（W） */
(function () {
  const R = W.rand, P = W.pick, r2 = x => Math.round(x * 100) / 100;
  const txt = (...lines) => lines.map((l, i) => `<text x="10" y="${40 + i * 34}" font-size="14" ${i === lines.length - 1 ? 'style="fill:var(--red)"' : ""}>${l}</text>`).join("");
  const G = {};

  /* ---------- 解題 ---------- */
  G.solve = {
    hecha() { const s = R(5, 40), d = R(2, 20), big = Math.random() < 0.5; const tot = 2 * s + d;
      return { q: `哥哥和弟弟共有 ${tot} 張卡片，哥哥比弟弟多 ${d} 張。<b>${big ? "哥哥" : "弟弟"}</b>有幾張？`, ans: big ? s + d : s, unit: "張",
        hint: big ? `(和 + 差) ÷ 2 = (${tot} + ${d}) ÷ 2` : `(和 − 差) ÷ 2 = (${tot} − ${d}) ÷ 2`, pic: txt("畫線段圖", "大 = (和 + 差) ÷ 2", "小 = (和 − 差) ÷ 2") }; },
    jitu() { const n = R(6, 20), b = R(1, n - 1), legs = 2 * (n - b) + 4 * b;
      return { q: `雞和兔共 ${n} 隻，腳共 ${legs} 隻。<b>兔子</b>有幾隻？`, ans: b, unit: "隻", hint: `假設全是雞：${n * 2} 隻腳，少 ${legs - 2 * n}，÷ 2`, pic: txt("假設全部是雞", "差的腳 ÷ 2 = 兔") }; },
    age() { const kid = R(5, 12), diff = R(22, 34), k = P([2, 3]);
      // 幾年後爸爸是孩子的 k 倍：孩子那時 = diff ÷ (k − 1)
      if (diff % (k - 1)) return G.solve.age();
      const kidThen = diff / (k - 1), yrs = kidThen - kid;
      if (yrs <= 0) return { q: `今年小明 ${kid} 歲，爸爸 ${kid + diff} 歲。<b>5 年後</b>爸爸比小明大幾歲？`, ans: diff, unit: "歲", hint: "年齡差永遠不變！", pic: txt("年齡差", "永遠不變") };
      return { q: `今年小明 ${kid} 歲，爸爸 ${kid + diff} 歲。<b>幾年後</b>爸爸的年齡是小明的 ${k} 倍？`, ans: yrs, unit: "年", hint: `年齡差 ${diff} 不變；那時小明 = ${diff} ÷ (${k} − 1) = ${kidThen} 歲`, pic: txt(`差 ${diff} 歲不變`, `${k} 倍時：小明 = 差 ÷ ${k - 1}`) }; },
    queue() { const f = R(2, 15), b = R(2, 15), t = Math.random() < 0.5;
      return t ? { q: `排隊時，小美前面有 ${f} 人，後面有 ${b} 人。這一排共有幾人？`, ans: f + b + 1, unit: "人", hint: "別忘了小美自己：前面 + 後面 + 1", pic: txt("前面 + 後面 + 自己") }
               : { q: `小美從前面數是第 ${f} 個，從後面數是第 ${b} 個。這一排共有幾人？`, ans: f + b - 1, unit: "人", hint: "小美被數了兩次：第幾 + 第幾 − 1", pic: txt("自己被數了 2 次", "所以要 − 1") }; },
    backward() { const left = R(2, 10) * 10, spent = R(1, 6) * 10;
      return { q: `小美有一些錢，先花掉一半，又花了 ${spent} 元，最後剩 ${left} 元。原來有多少錢？`, ans: (left + spent) * 2, unit: "元", hint: `倒推：${left} + ${spent}，再 × 2`, pic: txt("倒推：+ 變 −、× 變 ÷", `${left} → +${spent} → ×2`) }; },
    trees() { const len = R(2, 12) * 10, gap = P([5, 10]), ring = Math.random() < 0.4;
      return ring ? { q: `一個圓形水池一圈 ${len} 公尺，每隔 ${gap} 公尺種一棵樹，共種幾棵？`, ans: len / gap, unit: "棵", hint: "圍成一圈：棵數 = 間隔數", pic: txt("圍成一圈", "棵數 = 間隔數") }
                  : { q: `一條路長 ${len} 公尺，從頭到尾每隔 ${gap} 公尺種一棵樹（兩端都種），共種幾棵？`, ans: len / gap + 1, unit: "棵", hint: `間隔數 ${len / gap}，兩端都種 → + 1`, pic: txt("一條直線兩端都種", "棵數 = 間隔數 + 1") }; },
  };

  /* ---------- 圓（六上 7、六下 2）---------- */
  const ANG = [{ a: 90, rs: [2, 4, 6, 8, 10] }, { a: 180, rs: [1, 2, 3, 4, 5, 6] }, { a: 60, rs: [3, 6] }, { a: 120, rs: [3, 6] }];
  const circ = t => `<circle cx="70" cy="75" r="55" fill="var(--yellow)" fill-opacity=".45" stroke="var(--ink)" stroke-width="2"/><text x="135" y="80" font-size="14">${t}</text>`;
  G.circle = {
    perimeter() { const r = R(1, 10); return { q: `半徑 ${r} 公分的圓，圓周長？`, ans: r2(r * 6.28), unit: "公分", hint: "半徑 × 2 × 3.14", pic: circ(`r = ${r}`) }; },
    diameterFromC() { const d = R(2, 20); return { q: `圓周長 ${r2(d * 3.14)} 公分，直徑？`, ans: d, unit: "公分", hint: "圓周長 ÷ 3.14", pic: circ("d = ?") }; },
    area() { const r = R(1, 10); return { q: `半徑 ${r} 公分的圓，面積？`, ans: r2(r * r * 3.14), unit: "平方公分", hint: "半徑 × 半徑 × 3.14", pic: circ(`r = ${r}`) }; },
    arc() { const A = P(ANG), r = P(A.rs); return { q: `半徑 ${r}、圓心角 ${A.a}° 的扇形，弧長？`, ans: r2(r * 6.28 * A.a / 360), unit: "公分", hint: `圓周長 × ${W.frac(A.a, 360)}`, pic: `<path d="${W.slice(70, 75, 55, 0, A.a)}" fill="var(--red)" fill-opacity=".5" stroke="var(--ink)" stroke-width="2"/>` }; },
    sectorArea() { const A = P(ANG), r = P(A.rs); return { q: `半徑 ${r}、圓心角 ${A.a}° 的扇形，面積？`, ans: r2(r * r * 3.14 * A.a / 360), unit: "平方公分", hint: `圓面積 × ${W.frac(A.a, 360)}`, pic: `<path d="${W.slice(70, 75, 55, 0, A.a)}" fill="var(--red)" fill-opacity=".5" stroke="var(--ink)" stroke-width="2"/>` }; },
    sectorPerimeter() { const A = P(ANG), r = P(A.rs); return { q: `半徑 ${r}、圓心角 ${A.a}° 的扇形，周長？`, ans: r2(r * 6.28 * A.a / 360 + 2 * r), unit: "公分", hint: "弧長 + 兩條半徑", pic: `<path d="${W.slice(70, 75, 55, 0, A.a)}" fill="none" stroke="var(--blue)" stroke-width="4"/>` }; },
  };

  /* ---------- 放大縮小、比例尺（六上 8）---------- */
  G.scale = {
    side() { const k = R(2, 4), a = R(2, 9); return { q: `原圖邊長 ${a} 公分，${k} 倍放大圖的對應邊？`, ans: a * k, unit: "公分", hint: "× 倍數", pic: txt("對應邊 × 倍數") }; },
    area() { const k = R(2, 4); return { q: `${k} 倍放大圖，面積是原圖的幾倍？`, ans: k * k, unit: "倍", hint: `${k} × ${k}`, pic: txt("面積 × 倍數 × 倍數") }; },
    real() { const sc = P([1000, 2000, 5000]), cm = R(1, 12); return { q: `比例尺 1 : ${sc}，圖上 ${cm} 公分 = 實際幾公尺？`, ans: cm * sc / 100, unit: "公尺", hint: `${cm} × ${sc} 公分，再 ÷ 100`, pic: txt(`1 : ${sc}`, "× 分母，再換單位") }; },
    map() { const sc = P([1000, 2000, 5000]), cm = R(1, 12); return { q: `比例尺 1 : ${sc}，實際 ${cm * sc / 100} 公尺，圖上要畫幾公分？`, ans: cm, unit: "公分", hint: "先換成公分，再 ÷ 分母", pic: txt(`1 : ${sc}`, "公尺 → 公分 → ÷ 分母") }; },
  };

  /* ---------- 速率（六下 3）---------- */
  G.speed = {
    dist() { const v = R(4, 18) * 5, t = R(2, 6); return { q: `時速 ${v} 公里，${t} 小時走幾公里？`, ans: v * t, unit: "公里", hint: "速率 × 時間", pic: txt("距離 = 速率 × 時間") }; },
    speed() { const v = R(50, 90), t = R(5, 20); return { q: `${t} 分鐘走 ${v * t} 公尺，分速？`, ans: v, unit: "公尺", hint: "距離 ÷ 時間", pic: txt("速率 = 距離 ÷ 時間") }; },
    time() { const v = R(4, 18) * 5, t = R(2, 6); return { q: `時速 ${v} 公里，${v * t} 公里要幾小時？`, ans: t, unit: "小時", hint: "距離 ÷ 速率", pic: txt("時間 = 距離 ÷ 速率") }; },
    convert() { const s = R(1, 6) * 5; return { q: `時速 ${s * 3.6} 公里 = 秒速幾公尺？`, ans: s, unit: "公尺", hint: "×1000 ÷60 ÷60", pic: txt("時速 → 分速 → 秒速", "÷60 ÷60") }; },
  };

  /* ---------- 統計（六下 4）---------- */
  G.stats = {
    part() { const p = P([10, 20, 25, 40, 15, 35]), tot = P([200, 400, 1000]); return { q: `全部 ${tot} 人，${p}% 是幾人？`, ans: tot * p / 100, unit: "人", hint: `${tot} × ${p / 100}`, pic: W.pie(70, 75, 55, [{ v: p, c: W.COLORS[3] }, { v: 100 - p, c: W.COLORS[0] }]) }; },
    whole() { const p = P([10, 20, 25, 40, 50]), tot = P([200, 400, 600]); return { q: `${tot * p / 100} 人佔全部的 ${p}%，全部幾人？`, ans: tot, unit: "人", hint: "部分 ÷ 百分率", pic: W.pie(70, 75, 55, [{ v: p, c: W.COLORS[3] }, { v: 100 - p, c: W.COLORS[0] }]) }; },
    angle() { const p = R(1, 19) * 5; return { q: `${p}% 的扇形，圓心角幾度？`, ans: p * 3.6, unit: "度", hint: "× 3.6", pic: W.pie(70, 75, 55, [{ v: p, c: W.COLORS[3] }, { v: 100 - p, c: W.COLORS[0] }]) }; },
  };

  window.G = G;
})();
