/* 小遊戲共用：主題、選項產生、最佳紀錄 */
(function () {
  const TOPICS = [
    { id: "circle", t: "圓周長・扇形", g: "六上 7", gens: [G.circle.perimeter, G.circle.diameterFromC, G.circle.arc, G.circle.sectorPerimeter] },
    { id: "scale", t: "放大縮小・比例尺", g: "六上 8", gens: Object.values(G.scale) },
    { id: "area", t: "圓面積・扇形面積", g: "六下 2", gens: [G.circle.area, G.circle.sectorArea] },
    { id: "speed", t: "速率", g: "六下 3", gens: Object.values(G.speed) },
    { id: "stats", t: "百分率・圓形圖", g: "六下 4", gens: Object.values(G.stats) },
    { id: "ratio", t: "比與比值", g: "六上 4、6", gens: Object.values(G.ratio) },
    { id: "number", t: "分數・小數計算", g: "六上 2、5", gens: [G.number.fracDiv, G.number.decDiv, G.number.mixed, G.number.order, G.number.distrib] },
    { id: "factor", t: "因數・倍數", g: "六上 1", gens: [G.number.gcd, G.number.lcm] },
    { id: "solid", t: "角柱・圓柱", g: "六下 6", gens: Object.values(G.solid) },
    { id: "plane", t: "平面圖形面積", g: "五年級", gens: Object.values(G.area) },
    { id: "solve", t: "怎樣解題", g: "六上 9", gens: Object.values(G.solve) },
  ];

  const r2 = x => Math.round(x * 100) / 100;
  // 錯的選項：常見的算錯方式（多乘 2、少除 2、差一點、小數點跑掉）
  function wrongs(ans) {
    const step = ans >= 20 ? Math.max(1, Math.round(ans / 10)) : 1;
    const c = [ans * 2, ans / 2, ans + step, ans - step, ans * 10, ans / 10, ans + 2 * step, ans * 3.14, ans / 3.14, ans - 2 * step, ans + 0.5, ans * 4];
    const out = [];
    for (const x of c.map(r2)) if (x > 0 && Math.abs(x - ans) > 1e-9 && !out.some(y => Math.abs(y - x) < 1e-9) && String(x).length <= 9) out.push(x);
    return out;
  }
  // 分數答案的錯選項
  function fracWrongs(show) {
    const [n, d] = show.split("/").map(Number);
    if (!d) return null;
    const c = [[d, n], [n + 1, d], [n, d + 1], [n * 2, d], [Math.max(1, n - 1), d], [n + d, d]];
    const out = [];
    c.forEach(([a, b]) => { const f = W.Fstr(W.F(a, b)); if (f !== show && !out.includes(f)) out.push(f); });
    return out;
  }
  // 一題 → { q, pic, viewBox, opts: [字串...], ans: 正確的索引, show, hint }
  function question(topicIds, nOpts = 4) {
    const pool = TOPICS.filter(t => topicIds.includes(t.id)).flatMap(t => t.gens);
    const g = W.pick(pool)();
    let opts, ans;
    if (g.choices) { opts = g.choices.slice(); ans = g.ans; }
    else {
      const right = g.show || W.num(g.ans);
      const ws = (g.show && g.show.includes("/") ? fracWrongs(g.show) : null) || wrongs(g.ans).map(W.num);
      const pickW = [];
      while (pickW.length < nOpts - 1 && ws.length) pickW.push(ws.splice(Math.floor(Math.random() * Math.min(ws.length, 6)), 1)[0]);
      opts = [right, ...pickW.filter(w => w !== right)];
      for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
      ans = opts.indexOf(right);
    }
    return { q: g.q, pic: g.pic, viewBox: g.viewBox, opts, ans, unit: g.choices ? "" : (g.unit || ""), hint: g.hint || "" };
  }

  /* ---------- 最佳紀錄 ---------- */
  const KEY = "mif-games";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  function best(game, key) { return (load()[game] || {})[key]; }
  // better(新, 舊) 回傳 true 代表新紀錄
  function record(game, key, val, better = (a, b) => a > b) {
    const d = load(); d[game] = d[game] || {};
    const old = d[game][key];
    const isNew = old === undefined || better(val, old);
    if (isNew) { d[game][key] = val; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
    return { isNew, old };
  }

  /* ---------- 主題選擇 ---------- */
  const TKEY = "mif-game-topics";
  function topicPicker(el, onChange) {
    let on;
    try { on = JSON.parse(localStorage.getItem(TKEY)); } catch (e) {}
    if (!Array.isArray(on) || !on.length) on = ["circle"];
    const paint = () => {
      el.innerHTML = `<div class="topics">${TOPICS.map(t => `<button class="topic" data-t="${t.id}" aria-pressed="${on.includes(t.id)}">${t.t}<small>${t.g}</small></button>`).join("")}</div>`;
      onChange && onChange(on.slice());
    };
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-t]"); if (!b) return;
      const id = b.dataset.t;
      if (on.includes(id)) { if (on.length > 1) on = on.filter(x => x !== id); } else on.push(id);
      try { localStorage.setItem(TKEY, JSON.stringify(on)); } catch (e) {}
      paint();
    });
    paint();
    return { get: () => on.slice() };
  }
  const topicKey = ids => ids.slice().sort().join("+");
  const topicName = ids => TOPICS.filter(t => ids.includes(t.id)).map(t => t.t).join("、");

  // 錯題回顧（看圖再想一次）
  function review(list) {
    if (!list.length) return `<p class="perfect">🌟 全部答對，太厲害了！</p>`;
    return `<h3>再看一次答錯的題目</h3>${list.map(m => `
      <div class="miss">
        ${m.pic ? `<svg viewBox="${m.viewBox || "0 0 220 150"}">${m.pic}</svg>` : ""}
        <div><p>${m.q}</p><p class="ans">答案：<b>${m.opts[m.ans]}</b> ${m.unit}</p>${m.hint ? `<p class="hint">💡 ${m.hint}</p>` : ""}</div>
      </div>`).join("")}`;
  }

  window.GAME = { TOPICS, question, best, record, topicPicker, topicKey, topicName, review, fun: (n, a) => window.FUN && FUN.play(n, a) };
})();
