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

  /* ---------- 經驗值與等級 ----------
     整個網站共用：上課、練習、遊戲都會加經驗值（XP）
     FUN.gain(n, "learn" | "game", "原因")、FUN.level() */
  const ROOT = (document.currentScript && document.currentScript.src || "").replace(/assets\/fun\.js.*$/, "");
  const XKEY = "mif-xp", GKEY = "mif-gifts";
  const loadX = () => { let x; try { x = JSON.parse(localStorage.getItem(XKEY)); } catch (e) {} return Object.assign({ xp: 0, learn: 0, game: 0, log: [], seen: 1 }, x || {}); };
  const saveX = x => { try { localStorage.setItem(XKEY, JSON.stringify(x)); } catch (e) {} };
  // 下一級要多少：40、60、80、100…
  const need = lv => 40 + 20 * (lv - 1);
  function levelOf(xp) {
    let lv = 1, rest = xp;
    while (rest >= need(lv)) { rest -= need(lv); lv++; }
    return { lv, into: rest, need: need(lv), xp };
  }
  const TITLES = [
    ["🥚", "數學蛋"], ["🐣", "破殼小雞"], ["🐥", "計算小雞"], ["🐢", "努力烏龜"], ["🐇", "心算兔"],
    ["🦊", "機靈狐狸"], ["🐼", "熊貓學者"], ["🦉", "智慧貓頭鷹"], ["🐬", "聰明海豚"], ["🦁", "數學獅王"],
    ["🐯", "勇敢老虎"], ["🦄", "神奇獨角獸"], ["🐉", "數學小龍"], ["🚀", "火箭腦袋"], ["🌟", "數學之星"],
    ["🧙", "數學魔法師"], ["🤖", "計算機器人"], ["🏆", "數學冠軍"], ["👑", "數學國王"], ["🌌", "宇宙數學家"],
  ];
  const title = lv => TITLES[Math.min(lv, TITLES.length) - 1];
  const DEFAULT_GIFTS = [
    { lv: 3, t: "🌟 一張貼紙" }, { lv: 5, t: "🍬 一個小點心" }, { lv: 8, t: "🎲 自己選一個小遊戲時間" },
    { lv: 10, t: "🎁 小禮物" }, { lv: 15, t: "🍦 冰淇淋" }, { lv: 20, t: "🏆 大禮物" },
  ];
  function gifts() { try { const g = JSON.parse(localStorage.getItem(GKEY)); if (Array.isArray(g)) return g; } catch (e) {} return DEFAULT_GIFTS.map(g => Object.assign({ claimed: false }, g)); }
  function saveGifts(g) { try { localStorage.setItem(GKEY, JSON.stringify(g)); } catch (e) {} }

  let chip, holding = false, pend = null;
  function flush() { if (!pend) return; const p = pend; pend = null; const old = document.querySelector(".lvup"); if (old) old.remove(); levelUp(p.from, p.to); }
  // 遊戲進行中：先不跳升級視窗，也把角落的按鈕藏起來（不要擋到按鍵）
  function hold(on) { holding = on; document.body.classList.toggle("fun-playing", on); if (!on) setTimeout(flush, 600); }
  function gain(n, src = "learn", why = "") {
    n = Math.round(n);
    if (!(n > 0)) return;
    const x = loadX(), before = levelOf(x.xp).lv;
    x.xp += n; x[src] = (x[src] || 0) + n;
    x.log.unshift([Date.now(), n, src, why]); x.log = x.log.slice(0, 60);
    saveX(x);
    floatXP(n);
    paintChip();
    const after = levelOf(x.xp).lv;
    if (after > before) {
      // 遊戲進行中先不跳視窗，等遊戲結束再一起顯示
      pend = { from: pend ? pend.from : before, to: after };
      if (!holding) setTimeout(flush, 500);
    }
  }
  function floatXP(n) {
    if (!chip) return;
    const f = document.createElement("div");
    f.className = "xp-float"; f.textContent = `+${n} XP`;
    const b = chip.getBoundingClientRect();
    f.style.left = b.left + 10 + "px"; f.style.top = b.top - 6 + "px";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }
  function paintChip() {
    if (!chip) return;
    const L = levelOf(loadX().xp), [e] = title(L.lv);
    chip.innerHTML = `<span class="av">${e}</span><span><b>Lv ${L.lv}</b><i><u style="width:${L.into / L.need * 100}%"></u></i></span>`;
    chip.title = `等級 ${L.lv}：再 ${L.need - L.into} XP 升級`;
  }
  function levelUp(from, to) {
    const [e, t] = title(to);
    const got = gifts().filter(g => g.lv > from && g.lv <= to);
    const m = document.createElement("div");
    m.className = "lvup";
    m.innerHTML = `<div class="card">
      <div class="big">${e}</div>
      <h2>升級了！Lv ${to}</h2>
      <p>你現在是「<b>${t}</b>」</p>
      ${got.map(g => `<div class="gift">🎁 <b>得到禮物：</b>${g.t}<small>拿給老師看這個畫面！</small></div>`).join("")}
      <div class="btns"><a href="${ROOT}level.html">看我的等級</a><button>繼續加油 💪</button></div></div>`;
    document.body.appendChild(m);
    play(got.length ? "done" : "streak"); setTimeout(() => play("done"), got.length ? 900 : 0);
    confetti(got.length ? 160 : 90);
    m.querySelector("button").addEventListener("click", () => m.remove());
  }

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
  .fun-panel small { color: var(--muted, #6b6878); font-size: .8rem; }
  body { padding-bottom: 70px; }
  body.fun-playing .xp-chip, body.fun-playing .fun-fab, body.fun-playing .fun-panel { display: none; }
  .xp-chip { position: fixed; left: 14px; bottom: 14px; z-index: 40; display: flex; align-items: center; gap: 6px; height: 48px; padding: 0 14px 0 6px; border-radius: 999px;
    border: 3px solid var(--line, #e8e1d3); background: var(--card, #fff); color: var(--ink, #2b2a33); text-decoration: none; box-shadow: 0 4px 14px rgba(0,0,0,.12); font-family: "Noto Sans TC", system-ui, sans-serif; }
  .xp-chip .av { font-size: 1.6rem; line-height: 1; }
  .xp-chip b { display: block; font-size: .85rem; line-height: 1.1; font-weight: 900; }
  .xp-chip i { display: block; width: 54px; height: 6px; border-radius: 3px; background: var(--line, #e8e1d3); overflow: hidden; margin-top: 3px; }
  .xp-chip u { display: block; height: 100%; background: #f2b632; }
  .xp-float { position: fixed; z-index: 60; font-weight: 900; color: #f08a24; font-size: 1.1rem; pointer-events: none; font-family: "Noto Sans TC", system-ui, sans-serif;
    text-shadow: 0 1px 0 #fff; animation: xpup 1.1s ease-out forwards; }
  @keyframes xpup { to { transform: translateY(-46px); opacity: 0; } }
  .lvup { position: fixed; inset: 0; z-index: 55; background: rgba(0,0,0,.45); display: grid; place-items: center; padding: 16px; font-family: "Noto Sans TC", system-ui, sans-serif; }
  .lvup .card { background: var(--card, #fff); color: var(--ink, #2b2a33); border-radius: 24px; padding: 22px; max-width: 360px; width: 100%; text-align: center; border: 4px solid #f2b632; animation: lvpop .4s; }
  @keyframes lvpop { from { transform: scale(.6); opacity: 0; } }
  .lvup .big { font-size: 4.5rem; line-height: 1.1; }
  .lvup h2 { margin: 6px 0 2px; font-size: 1.8rem; font-weight: 900; }
  .lvup p { margin: 0; font-weight: 700; }
  .lvup .gift { margin-top: 12px; background: #fff3d1; color: #2b2a33; border: 3px dashed #f08a24; border-radius: 16px; padding: 10px; font-size: 1.1rem; }
  .lvup .gift small { display: block; color: #8a5a10; font-weight: 700; margin-top: 2px; }
  .lvup .btns { display: flex; gap: 8px; margin-top: 16px; }
  .lvup .btns > * { flex: 1; border-radius: 999px; padding: 10px; font: inherit; font-weight: 900; cursor: pointer; text-decoration: none; }
  .lvup .btns a { border: 3px solid var(--line, #e8e1d3); color: inherit; }
  .lvup .btns button { border: 0; background: #3aa76d; color: #fff; }`;
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
    if (!document.body.dataset.noChip) {
      chip = document.createElement("a");
      chip.className = "xp-chip"; chip.href = ROOT + "level.html"; chip.setAttribute("aria-label", "我的等級");
      document.body.appendChild(chip); paintChip();
    }
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

  // 這一頁答對了幾題（「我學會了」要先答對才給 XP）
  let pageRight = 0;
  window.FUN = { play, confetti, gain, hold, levelOf, title, TITLES, need, gifts, saveGifts, loadX, saveX, ROOT,
    get cfg() { return cfg; }, get pageRight() { return pageRight; }, right() { pageRight++; } };
})();
