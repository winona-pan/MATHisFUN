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

  window.W = W;
})();
