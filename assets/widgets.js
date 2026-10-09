/* 共用小工具：隨機出題、公式三角形、換算機
   需要先載入 lesson.js（用到 window.L） */
(function () {
  const W = {};
  W.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  W.pick = arr => arr[W.rand(0, arr.length - 1)];
  W.gcd = (x, y) => (y ? W.gcd(y, x % y) : Math.abs(x));
  // 數字顯示：最多 4 位小數、千分位
  W.num = n => Number(Number(n).toFixed(4)).toLocaleString("en-US", { maximumFractionDigits: 4 });
  // 分數字串
  W.frac = (a, b) => { const g = W.gcd(a, b); a /= g; b /= g; return b === 1 ? String(a) : `${a}/${b}`; };
  // 解析答案：可以是 3.14、1,000、3/4、1又1/2
  W.parse = s => {
    s = String(s).replace(/,/g, "").replace(/\s+/g, "");
    let m = s.match(/^(-?\d+)又(\d+)\/(\d+)$/);
    if (m) return +m[1] + +m[2] / +m[3];
    m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (m) return +m[1] / +m[2];
    return parseFloat(s);
  };

  /* ---------- 分數計算 ---------- */
  W.F = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = W.gcd(n, d) || 1; return { n: n / g, d: d / g }; };
  W.Fadd = (a, b) => W.F(a.n * b.d + b.n * a.d, a.d * b.d);
  W.Fsub = (a, b) => W.F(a.n * b.d - b.n * a.d, a.d * b.d);
  W.Fmul = (a, b) => W.F(a.n * b.n, a.d * b.d);
  W.Fdiv = (a, b) => W.F(a.n * b.d, a.d * b.n);
  W.Fval = a => a.n / a.d;
  W.Fstr = a => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
  // 漂亮的分數（HTML 上下排）
  W.Fhtml = a => (a.d === 1 ? String(a.n) : `<span class="fr"><span>${a.n}</span><span>${a.d}</span></span>`);
  // 小數 → 分數
  W.Fdec = x => { const s = String(x), k = s.includes(".") ? s.split(".")[1].length : 0; return W.F(Math.round(x * 10 ** k), 10 ** k); };

  /* ---------- 圓形圖 ----------
     W.pie(cx, cy, r, [{ v: 百分率, c: 顏色, t: 名字 }], { labels: true }) → SVG 字串 */
  W.slice = (cx, cy, r, a0, a1) => {
    if (a1 - a0 >= 359.999) return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
    const [x0, y0] = L.pol(cx, cy, r, a0), [x1, y1] = L.pol(cx, cy, r, a1);
    return `M${cx} ${cy} L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  };
  W.pie = (cx, cy, r, parts, opt = {}) => {
    let a = 0, s = "";
    parts.forEach(p => {
      const a1 = a + p.v * 3.6;
      if (p.v > 0) s += `<path d="${W.slice(cx, cy, r, a, a1)}" fill="${p.c}" stroke="var(--ink)" stroke-width="1.5"/>`;
      if (opt.labels !== false && p.v >= 6) {
        const [tx, ty] = L.pol(cx, cy, r * 0.62, (a + a1) / 2);
        s += `<text x="${tx}" y="${ty + 4}" text-anchor="middle" font-size="${opt.fs || 12}" style="fill:#2b2a33">${opt.text ? opt.text(p) : p.v + "%"}</text>`;
      }
      a = a1;
    });
    return s;
  };
  W.COLORS = ["#7cb8f0", "#f6cd6a", "#8fd4ab", "#f5a3a3", "#c3b1ee", "#f7b98a"];

  /* ---------- 立體圖（角柱、圓柱）----------
     W.solid({ cx, cy, n, r, h, ry, rx, hl, layers, cyl }) → SVG 字串
     n 邊形的柱（cyl: true 時是圓柱），ry 左右轉、rx 往下看的角度（度） */
  W.solid = function (o) {
    const n = o.cyl ? 48 : o.n, r = o.r, h = o.h, ry = (o.ry || 0) * Math.PI / 180, rx = (o.rx == null ? 22 : o.rx) * Math.PI / 180;
    const off = o.cyl ? 0 : Math.PI / n + Math.PI / 2;
    const P = (x, y, z) => {
      const x1 = x * Math.cos(ry) + z * Math.sin(ry), z1 = -x * Math.sin(ry) + z * Math.cos(ry);
      const y2 = y * Math.cos(rx) - z1 * Math.sin(rx), z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
      return { X: o.cx + x1, Y: o.cy - y2, d: z2 };
    };
    const ring = y => Array.from({ length: n }, (_, k) => { const t = off + 2 * Math.PI * k / n; return P(r * Math.cos(t), y, r * Math.sin(t)); });
    const B = ring(-h / 2), T = ring(h / 2);
    const faces = [];
    const base = o.hl === "base" ? "var(--red)" : "var(--yellow)";
    const side = o.hl === "side" ? "var(--orange)" : "var(--blue)";
    for (let k = 0; k < n; k++) {
      const q = [B[k], B[(k + 1) % n], T[(k + 1) % n], T[k]];
      faces.push({ pts: q, fill: side, op: o.cyl ? 1 : 1, shade: k % 2, stroke: o.cyl ? "none" : "var(--ink)" });
    }
    faces.push({ pts: B, fill: base, op: 1, stroke: "var(--ink)" }, { pts: T, fill: base, op: 1, stroke: "var(--ink)" });
    faces.forEach(f => f.depth = f.pts.reduce((a, p) => a + p.d, 0) / f.pts.length);
    faces.sort((a, b) => a.depth - b.depth);
    // 側面依照朝向畫深淺，看起來比較立體
    let s = faces.map(f => {
      const pts = f.pts.map(p => `${p.X.toFixed(1)},${p.Y.toFixed(1)}`).join(" ");
      const tint = f.pts.length === 4 ? `<polygon points="${pts}" fill="#000" fill-opacity="${o.cyl ? 0 : (f.shade ? 0.12 : 0)}" stroke="none"/>` : "";
      return `<polygon points="${pts}" fill="${f.fill}" fill-opacity="${f.op}" stroke="${f.stroke === "none" ? f.fill : f.stroke}" stroke-width="${f.stroke === "none" ? 0.6 : 1.5}" stroke-linejoin="round"/>${tint}`;
    }).join("");
    if (o.cyl) { // 圓柱的左右輪廓線
      const xs = B.map((p, i) => [p, T[i]]);
      const L0 = xs.reduce((a, b) => (b[0].X < a[0].X ? b : a)), R0 = xs.reduce((a, b) => (b[0].X > a[0].X ? b : a));
      [L0, R0].forEach(([p, q]) => s += `<line x1="${p.X}" y1="${p.Y}" x2="${q.X}" y2="${q.Y}" stroke="var(--ink)" stroke-width="1.5"/>`);
      const cB = P(0, -h / 2, 0).d; // 底面前半圈的輪廓
      for (let k = 0; k < n; k++) { const a = B[k], b = B[(k + 1) % n]; if ((a.d + b.d) / 2 >= cB) s += `<line x1="${a.X.toFixed(1)}" y1="${a.Y.toFixed(1)}" x2="${b.X.toFixed(1)}" y2="${b.Y.toFixed(1)}" stroke="var(--ink)" stroke-width="1.5"/>`; }
    }
    if (o.layers) for (let i = 1; i < o.layers; i++) {
      const L1 = ring(-h / 2 + h * i / o.layers), y0 = -h / 2 + h * i / o.layers, cD = P(0, y0, 0).d;
      for (let k = 0; k < n; k++) { // 只畫看得到的前面那一半
        const a = L1[k], b = L1[(k + 1) % n];
        if ((a.d + b.d) / 2 >= cD) s += `<line x1="${a.X.toFixed(1)}" y1="${a.Y.toFixed(1)}" x2="${b.X.toFixed(1)}" y2="${b.Y.toFixed(1)}" stroke="var(--ink)" stroke-width="1" stroke-dasharray="4 3"/>`;
      }
    }
    if (o.hl === "height") {
      const a = P(r * 1.15, -h / 2, 0), b = P(r * 1.15, h / 2, 0);
      s += `<line x1="${a.X}" y1="${a.Y}" x2="${b.X}" y2="${b.Y}" stroke="var(--red)" stroke-width="4"/><text x="${a.X + 8}" y="${(a.Y + b.Y) / 2}" font-size="14" style="fill:var(--red)">高</text>`;
    }
    return s;
  };

  /* ---------- 隨機出題 ----------
     W.practice(el, { gens: [fn...] } 或 { groups: [{ label, gens, on }] })
     每個 fn() 回傳 { q, ans, unit, hint, pic, pre, choices } */
  W.practice = function (el, cfg) {
    const groups = cfg.groups || [{ gens: cfg.gens, on: true }];
    el.innerHTML = `
      ${groups.length > 1 ? `<div class="controls" style="margin-top:0">${groups.map((g, i) =>
        `<label><input type="checkbox" data-g="${i}" ${g.on === false ? "" : "checked"}> ${g.label}</label>`).join("")}</div>` : ""}
      <div class="gen" style="margin-top:12px">
        <div class="qpic"><svg viewBox="0 0 220 150"></svg></div>
        <div><p class="qt"></p><div class="gin"></div><div class="fb"></div></div>
      </div>
      <div class="score"></div>`;
    const $ = s => el.querySelector(s);
    let cur, right = 0, tried = 0, wrongOnce = false;
    function next() {
      const pool = [];
      groups.forEach((g, i) => {
        const box = el.querySelector(`[data-g="${i}"]`);
        if (!box || box.checked) pool.push(...g.gens);
      });
      if (!pool.length) pool.push(...groups[0].gens);
      cur = W.pick(pool)();
      wrongOnce = false;
      $(".qt").innerHTML = cur.q;
      $(".qpic svg").setAttribute("viewBox", cur.viewBox || "0 0 220 150");
      $(".qpic svg").innerHTML = cur.pic || "";
      $(".qpic").style.display = cur.pic ? "" : "none";
      if (cur.choices) {
        $(".gin").innerHTML = `<div class="choices">${cur.choices.map((c, i) => `<button class="choice" data-i="${i}">${c}</button>`).join("")}</div>
          <div style="margin-top:8px"><button class="btn" data-next>下一題 →</button></div>`;
        el.querySelectorAll(".gin .choice").forEach(b => b.addEventListener("click", () => check(+b.dataset.i, b)));
      } else {
        $(".gin").innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${cur.pre || ""}<input type="text" inputmode="decimal"> ${cur.unit || ""}
          <button class="btn primary" data-check>對答案</button><button class="btn" data-next>下一題 →</button></div>`;
        const inp = $(".gin input");
        $("[data-check]").addEventListener("click", () => check(W.parse(inp.value)));
        inp.addEventListener("keydown", e => { if (e.key === "Enter") check(W.parse(inp.value)); });
      }
      $("[data-next]").addEventListener("click", next);
      $(".fb").className = "fb"; $(".fb").textContent = "";
    }
    function check(v, btn) {
      const fb = $(".fb");
      const ok = cur.choices ? v === cur.ans : (!isNaN(v) && Math.abs(v - cur.ans) < 0.0005 + Math.abs(cur.ans) * 1e-9);
      if (ok) {
        if (!wrongOnce) { right++; tried++; }
        if (btn) btn.classList.add("right");
        fb.className = "fb ok";
        fb.textContent = "答對了！👏" + (cur.choices ? "" : ` ${cur.show || W.num(cur.ans)} ${cur.unit || ""}`);
        if (!window.__noAuto) setTimeout(next, 1300);
      } else {
        if (!wrongOnce) tried++;
        wrongOnce = true;
        if (btn) btn.classList.add("wrong");
        fb.className = "fb no";
        fb.textContent = "再想想 🤔 " + (cur.hint || "");
      }
      $(".score").textContent = `一次就答對：${right} / ${tried} 題`;
    }
    el.querySelectorAll("[data-g]").forEach(b => b.addEventListener("change", next));
    next();
    const api = { next, get cur() { return cur; } };
    (window.__prac = window.__prac || []).push(api);
    return api;
  };

  /* ---------- 公式三角形 ----------
     W.tri(el, { top, l, r, colors: {top,l,r}, out: {top,l,r} }) */
  W.tri = function (el, cfg) {
    el.innerHTML = `<div class="tri-wrap"><svg viewBox="0 0 300 240"></svg><div class="tri-out"></div></div>
      <p class="hint">👉 <b>點一下你要求的那一格</b>，把它遮住，剩下的就是算法：上下 → 用<b>除的</b>（上面 ÷ 下面）；左右並排 → 用<b>乘的</b>。</p>`;
    const svg = el.querySelector("svg"), out = el.querySelector(".tri-out");
    const col = Object.assign({ top: "var(--ink)", l: "var(--red)", r: "var(--blue)" }, cfg.colors || {});
    let hide = cfg.start || "l";
    const fs = t => (t.length > 4 ? 17 : t.length > 3 ? 19 : 22);
    function draw() {
      const cell = (key, d, tx, ty) => {
        const h = hide === key, label = cfg[key];
        return `<g class="tri-cell" data-cell="${key}"><path d="${d}" fill="${h ? "var(--muted)" : "var(--card)"}" fill-opacity="${h ? 0.35 : 1}" stroke="var(--ink)" stroke-width="3"/>
          <text x="${tx}" y="${ty}" text-anchor="middle" font-size="${h ? 40 : fs(label)}" style="fill:${h ? "var(--ink)" : col[key]}">${h ? "?" : label}</text></g>`;
      };
      svg.innerHTML = cell("top", "M150 10 L230 130 L70 130 Z", 150, 105) +
        cell("l", "M70 130 L150 130 L150 230 L10 230 Z", 92, 192) +
        cell("r", "M150 130 L230 130 L290 230 L150 230 Z", 212, 192) +
        `<circle cx="150" cy="182" r="14" fill="var(--yellow)" stroke="var(--ink)" stroke-width="2"/><text x="150" y="189" text-anchor="middle" font-size="18" style="fill:#2b2a33">×</text>
         <line x1="50" y1="130" x2="250" y2="130" stroke="var(--ink)" stroke-width="5"/>`;
      svg.querySelectorAll("[data-cell]").forEach(g => g.addEventListener("click", () => { hide = g.dataset.cell; draw(); }));
      const dflt = {
        top: `要求 <b>${cfg.top}</b>：<br>${cfg.l} × ${cfg.r}<small>左右並排 → 乘起來</small>`,
        l: `要求 <b style="color:${col.l}">${cfg.l}</b>：<br>${cfg.top} ÷ ${cfg.r}<small>上下 → 上面 ÷ 下面</small>`,
        r: `要求 <b style="color:${col.r}">${cfg.r}</b>：<br>${cfg.top} ÷ ${cfg.l}<small>上下 → 上面 ÷ 下面</small>`,
      };
      out.innerHTML = (cfg.out && cfg.out[hide]) || dflt[hide];
    }
    draw();
  };

  /* ---------- 換算機 ----------
     W.chain(el, { nodes: [{ k, label, color }], links: [{ f: "×2", b: "÷2", go: v => v * 2, back: v => v / 2 }], start: { k, v } }) */
  W.chain = function (el, cfg) {
    const n = cfg.nodes, lk = cfg.links;
    el.innerHTML = `<div class="chain">${n.map((nd, i) => `
      ${i ? `<div class="link"><span data-f="${i - 1}">${lk[i - 1].f} →</span><span data-b="${i - 1}">← ${lk[i - 1].b}</span></div>` : ""}
      <div class="node" data-n="${i}"><b style="color:${nd.color || "var(--ink)"}">${nd.label}</b><input type="text" inputmode="decimal" placeholder="?"></div>`).join("")}</div>
      <div class="work"></div>`;
    const inputs = [...el.querySelectorAll(".node input")];
    function set(i, v) {
      const val = []; val[i] = v;
      for (let j = i + 1; j < n.length; j++) val[j] = lk[j - 1].go(val[j - 1]);
      for (let j = i - 1; j >= 0; j--) val[j] = lk[j].back(val[j + 1]);
      inputs.forEach((inp, j) => { if (j !== i) inp.value = W.num(val[j]); });
      el.querySelectorAll(".node").forEach((nd, j) => nd.className = "node " + (j === i ? "src" : "got"));
      lk.forEach((_, j) => {
        el.querySelector(`[data-f="${j}"]`).classList.toggle("on", j >= i);
        el.querySelector(`[data-b="${j}"]`).classList.toggle("on", j < i);
      });
      const parts = [];
      let s = `${n[i].label} ${W.num(val[i])}`;
      for (let j = i + 1; j < n.length; j++) s += ` <b>${lk[j - 1].f}</b> = ${W.num(val[j])}（${n[j].label}）`;
      parts.push(s);
      if (i > 0) {
        let t = `${n[i].label} ${W.num(val[i])}`;
        for (let j = i - 1; j >= 0; j--) t += ` <b>${lk[j].b}</b> = ${W.num(val[j])}（${n[j].label}）`;
        parts.push(t);
      }
      el.querySelector(".work").innerHTML = parts.filter(p => p.includes("<b>")).join("<br>");
    }
    inputs.forEach((inp, i) => inp.addEventListener("input", () => {
      const v = W.parse(inp.value);
      if (!isNaN(v) && v >= 0) set(i, v);
    }));
    if (cfg.start) {
      const i = n.findIndex(x => x.k === cfg.start.k);
      inputs[i].value = cfg.start.v; set(i, cfg.start.v);
    }
    return { set: (k, v) => { const i = n.findIndex(x => x.k === k); inputs[i].value = v; set(i, v); } };
  };

  /* ---------- 名詞卡 ----------
     W.cards(el, [{ t, pic(160x100 SVG 內容), def, how, link }]) */
  W.cards = function (el, list) {
    el.innerHTML = `<div class="controls" style="margin-top:0"><button class="btn" data-mode aria-pressed="false">🙈 遮住答案考自己</button>
      <span class="hint" style="margin:0">打開後，點模糊的地方就會出現答案。</span></div>
      <div class="cards">${list.map(c => `<div class="card"><div class="pic"><svg viewBox="0 0 160 100">${c.pic}</svg></div><h3>${c.t}</h3>
        <p class="def ans">${c.def}</p>${c.how ? `<div class="how ans"><small>怎麼求</small>${c.how}</div>` : ""}
        ${c.link ? `<a href="${c.link}">看這一課 →</a>` : ""}</div>`).join("")}</div>`;
    el.querySelector("[data-mode]").addEventListener("click", e => {
      const on = el.classList.toggle("quizmode");
      e.currentTarget.setAttribute("aria-pressed", on);
      el.querySelectorAll(".ans").forEach(a => a.classList.remove("peek"));
    });
    el.addEventListener("click", e => { const a = e.target.closest(".ans"); if (a && el.classList.contains("quizmode")) a.classList.toggle("peek"); });
  };

  window.W = W;
})();
