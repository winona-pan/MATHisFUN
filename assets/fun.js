/* 音效 + 彩帶 + 音效設定（每一頁共用）
   不用音檔：聲音都是用 Web Audio 即時合成的。
   FUN.play(name)：tap / slide / pop / ok / no / done / streak / flip / pop2 / lose
   FUN.confetti()：灑彩帶
   設定存在這台裝置：localStorage "mif-sound" */
(function () {
  if (window.FUN) return;
  const KEY = "mif-sound";
  const DEF = { on: true, vol: 0.6, answer: true, ui: true };
  let cfg = Object.assign({}, DEF);
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };

  // 哪一類：answer 答題、ui 按鈕和拉桿
  const KIND = { tap: "ui", slide: "ui", pop: "ui", flip: "ui", ok: "answer", no: "answer", done: "answer", streak: "answer", pop2: "answer", lose: "answer" };

  let ctx = null, master = null;
  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    master.gain.value = cfg.vol * 0.5;
    return ctx;
  }
  // 一個音：頻率、開始時間、長度、波形、音量、滑到的頻率
  function tone(f, t0, dur, type = "sine", g = 0.5, f2) {
    const c = ctx, o = c.createOscillator(), v = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(g, t + 0.012);
    v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v); v.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093 };
  const SOUNDS = {
    tap() { tone(900, 0, 0.05, "triangle", 0.25); },
    slide(p = 0.5) { tone(380 + p * 700, 0, 0.045, "triangle", 0.18); },
    pop() { tone(500, 0, 0.09, "sine", 0.4, 950); },
    flip() { tone(700, 0, 0.06, "triangle", 0.25, 400); },
    ok() { tone(N.E6, 0, 0.12, "sine", 0.45); tone(N.G6, 0.09, 0.12, "sine", 0.45); tone(N.C7, 0.18, 0.3, "sine", 0.4); },
    no() { tone(260, 0, 0.16, "square", 0.12, 220); tone(200, 0.15, 0.26, "square", 0.12, 160); },
    done() { [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(f, i * 0.11, 0.22, "triangle", 0.4)); tone(N.E6, 0.46, 0.5, "sine", 0.35); tone(N.G6, 0.46, 0.5, "sine", 0.25); },
    streak() { [N.C6, N.E6, N.G6, N.C7, N.G6, N.C7].forEach((f, i) => tone(f, i * 0.06, 0.12, "sine", 0.3)); },
    pop2() { tone(1200, 0, 0.08, "square", 0.15, 300); tone(N.G6, 0.06, 0.15, "sine", 0.35); },
    lose() { [N.G5, N.E5, N.C5].forEach((f, i) => tone(f, i * 0.16, 0.25, "triangle", 0.35)); tone(130, 0.48, 0.5, "triangle", 0.35, 100); },
  };

  let lastResult = 0;
  function play(name, arg) {
    if (!cfg.on || !SOUNDS[name] || !cfg[KIND[name]]) return;
    if (KIND[name] === "answer") lastResult = performance.now();
    if (!ac()) return;
    try { SOUNDS[name](arg); } catch (e) {}
  }

  /* ---------- 彩帶 ---------- */
  function confetti(n = 70) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = document.createElement("canvas");
    cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50";
    document.body.appendChild(cv);
    const W = cv.width = innerWidth, H = cv.height = innerHeight, g = cv.getContext("2d");
    const C = ["#e4572e", "#2e86de", "#3aa76d", "#f2b632", "#8e6bd8", "#f08a24"];
    const ps = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .45, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6, c: C[Math.random() * 6 | 0], s: 5 + Math.random() * 6 }));
    let f = 0;
    (function step() {
      g.clearRect(0, 0, W, H);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.vx *= 0.99; p.r += 0.2; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      if (++f < 110) requestAnimationFrame(step); else cv.remove();
    })();
  }

  /* ---------- 自動加上互動音效 ---------- */
  // 按鈕：等一下下，如果同時有答對/答錯的聲音就不響
  document.addEventListener("click", e => {
    const b = e.target.closest("button, .btn, .choice, a.tile, .tick, [role=tab]");
    if (!b || b.closest(".fun-panel, .fun-fab") || b.disabled) return;
    const step = b.matches("[data-next-step]");
    setTimeout(() => { if (performance.now() - lastResult > 60) play(step ? "pop" : "tap"); }, 0);
  }, true);
  // 拉桿：音高跟著數值走
  let lastSlide = 0;
  document.addEventListener("input", e => {
    const r = e.target;
    if (r.type !== "range") return;
    const now = performance.now();
    if (now - lastSlide < 45) return;
    lastSlide = now;
    const p = (r.value - r.min) / ((r.max - r.min) || 1);
    play("slide", p);
  }, true);
  // 拖曳圖上的點：音高跟著位置走
  let dragging = null, lastDrag = 0;
  document.addEventListener("pointerdown", e => { const s = e.target.closest(".stage svg"); dragging = s && e.target !== s ? s : null; }, true);
  document.addEventListener("pointerup", () => { dragging = null; }, true);
  document.addEventListener("pointercancel", () => { dragging = null; }, true);
  document.addEventListener("pointermove", e => {
    if (!dragging) return;
    const now = performance.now();
    if (now - lastDrag < 70) return;
    lastDrag = now;
    const b = dragging.getBoundingClientRect();
    play("slide", Math.min(1, Math.max(0, 1 - (e.clientY - b.top) / b.height * 0.5 - (b.right - e.clientX) / b.width * 0.5)));
  }, true);

  /* ---------- 設定按鈕 ---------- */
  const css = `
  .fun-fab { position: fixed; right: 14px; bottom: 14px; z-index: 40; width: 48px; height: 48px; border-radius: 50%;
    border: 3px solid var(--line, #e8e1d3); background: var(--card, #fff); font-size: 1.4rem; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.12); padding: 0; }
  .fun-panel { position: fixed; right: 14px; bottom: 72px; z-index: 41; width: min(300px, calc(100vw - 28px)); background: var(--card, #fff); color: var(--ink, #2b2a33);
    border: 3px solid var(--ink, #2b2a33); border-radius: 18px; padding: 14px 16px; box-shadow: 0 10px 30px rgba(0,0,0,.18); font-family: "Noto Sans TC", system-ui, sans-serif; }
  .fun-panel[hidden] { display: none; }
  .fun-panel h3 { margin: 0 0 8px; font-size: 1.1rem; font-weight: 900; }
  .fun-panel label { display: flex; align-items: center; gap: 10px; font-weight: 700; margin: 8px 0; font-size: 1rem; cursor: pointer; }
  .fun-panel input[type=checkbox] { width: 22px; height: 22px; accent-color: #3aa76d; }
  .fun-panel input[type=range] { flex: 1; accent-color: #3aa76d; }
  .fun-panel .sub { padding-left: 32px; }
  .fun-panel .sub.off { opacity: .4; pointer-events: none; }
  .fun-panel .row { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .fun-panel .row button { flex: 1; border: 2px solid var(--line, #e8e1d3); background: var(--bg, #fdf8ef); color: inherit; border-radius: 999px; padding: 6px 8px; font: inherit; font-weight: 700; cursor: pointer; font-size: .9rem; }
  .fun-panel small { color: var(--muted, #6b6878); font-size: .8rem; }`;
  function ui() {
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const fab = document.createElement("button");
    fab.className = "fun-fab"; fab.setAttribute("aria-label", "音效設定");
    const pan = document.createElement("div");
    pan.className = "fun-panel"; pan.hidden = true;
    pan.innerHTML = `
      <h3>🔊 音效設定</h3>
      <label><input type="checkbox" data-c="on"> 開啟音效</label>
      <div class="sub">
        <label>🔉 <input type="range" min="0" max="1" step="0.05" data-c="vol"> 🔊</label>
        <label><input type="checkbox" data-c="answer"> 答對・答錯的聲音</label>
        <label><input type="checkbox" data-c="ui"> 按鈕・拉桿的聲音</label>
      </div>
      <div class="row"><button data-try="ok">試聽 答對</button><button data-try="no">試聽 答錯</button><button data-try="slide">試聽 拉桿</button></div>
      <small>設定會記在這台裝置上</small>`;
    document.body.append(pan, fab);
    const paint = () => {
      fab.textContent = cfg.on ? "🔊" : "🔇";
      pan.querySelectorAll("[data-c]").forEach(i => { if (i.type === "checkbox") i.checked = cfg[i.dataset.c]; else i.value = cfg[i.dataset.c]; });
      pan.querySelector(".sub").classList.toggle("off", !cfg.on);
    };
    fab.addEventListener("click", () => { pan.hidden = !pan.hidden; });
    pan.addEventListener("input", e => {
      const i = e.target.closest("[data-c]"); if (!i) return;
      cfg[i.dataset.c] = i.type === "checkbox" ? i.checked : +i.value;
      save(); paint();
      if (i.type === "range" || i.checked) play(i.dataset.c === "answer" ? "ok" : "tap");
    });
    pan.addEventListener("click", e => { const b = e.target.closest("[data-try]"); if (b) play(b.dataset.try, 0.7); });
    document.addEventListener("click", e => { if (!pan.hidden && !e.target.closest(".fun-panel, .fun-fab")) pan.hidden = true; });
    paint();
  }
  if (document.body) ui(); else document.addEventListener("DOMContentLoaded", ui);

  window.FUN = { play, confetti, get cfg() { return cfg; } };
})();
