/* 每一課共用的程式：上方列、上一課/下一課、一步一步、練習題 */
(function () {
  // 學習順序（路徑相對於網站根目錄）
  const SEQUENCES = {
    "6a-u7": {
      name: "六上 第 7 單元・圓周長與扇形周長",
      pages: [
        { path: "review/circle-parts", t: "圓心、半徑、直徑", pre: true },
        { path: "review/angles", t: "角度與量角器", pre: true },
        { path: "review/decimal-multiply", t: "小數乘法", pre: true },
        { path: "6a-u7/01", t: "圓周長" },
        { path: "6a-u7/02", t: "圓周率 π 怎麼來" },
        { path: "6a-u7/03", t: "圓周長公式" },
        { path: "6a-u7/04", t: "扇形、圓心角、弧" },
        { path: "6a-u7/05", t: "弧長怎麼算" },
        { path: "6a-u7/06", t: "扇形周長" },
        { path: "6a-u7/07", t: "組合圖形的周長" },
      ],
    },
  };

  const body = document.body;
  const seqId = body.dataset.seq;
  const page = body.dataset.page;
  const root = "../";
  const seq = SEQUENCES[seqId];

  if (seq) {
    const idx = seq.pages.findIndex(p => p.path === page);
    const top = document.getElementById("topbar");
    if (top) {
      top.innerHTML = `
        <a class="back" href="${root}index.html#${seqId}">← 目錄</a>
        <span class="crumb">${seq.name}</span>
        <span class="seq">${seq.pages.map((p, i) =>
          `<a href="${root}${p.path}.html" title="${p.t}" class="${p.pre ? "pre" : ""} ${i === idx ? "on" : ""}"></a>`).join("")}</span>`;
    }
    const pager = document.getElementById("pager");
    if (pager) {
      const prev = seq.pages[idx - 1], next = seq.pages[idx + 1];
      pager.innerHTML = `
        ${prev ? `<a href="${root}${prev.path}.html"><small>← 上一課</small><b>${prev.t}</b></a>` : `<a href="${root}index.html#${seqId}"><small>← 回到</small><b>目錄</b></a>`}
        ${next ? `<a class="next" href="${root}${next.path}.html"><small>下一課 →</small><b>${next.t}</b></a>` : `<a class="next" href="${root}index.html#${seqId}"><small>這個單元完成了！</small><b>回到目錄 →</b></a>`}`;
    }
  }

  /* ---------- 一步一步 ---------- */
  document.querySelectorAll("[data-steps]").forEach(box => {
    const steps = [...box.querySelectorAll(".step")];
    const btn = box.querySelector("[data-next-step]");
    let shown = 1;
    steps.forEach((s, i) => s.classList.toggle("hidden-step", i >= shown));
    const update = () => {
      if (!btn) return;
      btn.textContent = shown < steps.length ? `下一步（${shown}/${steps.length}）` : "看完了 👍";
      btn.disabled = shown >= steps.length;
    };
    if (btn) btn.addEventListener("click", () => {
      if (shown >= steps.length) return;
      const s = steps[shown++];
      s.classList.remove("hidden-step");
      s.classList.add("show");
      s.scrollIntoView({ behavior: "smooth", block: "nearest" });
      update();
    });
    update();
  });

  /* ---------- 練習題 ---------- */
  const quizzes = [...document.querySelectorAll(".quiz")];
  quizzes.forEach(quiz => {
    const qs = [...quiz.querySelectorAll(".q")];
    const score = document.createElement("div");
    score.className = "score";
    quiz.after(score);
    const updateScore = () => {
      const done = qs.filter(q => q.classList.contains("done")).length;
      score.textContent = done === qs.length ? `🎉 全部答對了！(${done}/${qs.length})` : `答對 ${done} / ${qs.length} 題`;
    };

    qs.forEach(q => {
      const fb = document.createElement("div");
      fb.className = "fb";
      q.appendChild(fb);
      const ok = () => { q.classList.add("done"); fb.className = "fb ok"; fb.textContent = q.dataset.ok || "答對了！👏"; updateScore(); };
      const no = () => { fb.className = "fb no"; fb.textContent = "再想想 🤔 " + (q.dataset.hint || ""); };

      if (q.dataset.answer !== undefined) {
        const input = q.querySelector("input");
        const btn = q.querySelector("button");
        const check = () => {
          const v = parseFloat(String(input.value).replace(/[^\d.\-]/g, ""));
          const ans = parseFloat(q.dataset.answer);
          if (!isNaN(v) && Math.abs(v - ans) < 0.005) ok(); else no();
        };
        btn.addEventListener("click", check);
        input.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
      } else {
        q.querySelectorAll(".choice").forEach(c => c.addEventListener("click", () => {
          if (q.classList.contains("done")) return;
          if (c.hasAttribute("data-right")) { c.classList.add("right"); ok(); }
          else { c.classList.add("wrong"); no(); }
        }));
      }
    });
    updateScore();
  });

  /* ---------- 小工具 ---------- */
  window.L = {
    // 把滑鼠/手指位置換成 SVG 座標
    svgPoint(svg, evt) {
      const pt = svg.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    },
    // 讓 SVG 裡的元素可以拖拉
    drag(svg, target, onMove) {
      let on = false;
      target.addEventListener("pointerdown", e => { on = true; target.setPointerCapture(e.pointerId); e.preventDefault(); });
      target.addEventListener("pointermove", e => { if (on) onMove(L.svgPoint(svg, e)); });
      const stop = () => { on = false; };
      target.addEventListener("pointerup", stop);
      target.addEventListener("pointercancel", stop);
    },
    // 數字：最多兩位小數，去掉多餘的 0
    fmt(n, d = 2) { return String(Math.round(n * 10 ** d) / 10 ** d); },
    // 圓上一點
    pol(cx, cy, r, deg) {
      const a = (deg - 90) * Math.PI / 180; // 0° 在正上方，順時針
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    },
    // 扇形路徑（從正上方順時針）
    sectorPath(cx, cy, r, deg) {
      if (deg >= 359.999) return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
      const [x, y] = L.pol(cx, cy, r, deg);
      return `M${cx} ${cy} L${cx} ${cy - r} A${r} ${r} 0 ${deg > 180 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
    },
    arcPath(cx, cy, r, deg) {
      if (deg >= 359.999) return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
      const [x, y] = L.pol(cx, cy, r, deg);
      return `M${cx} ${cy - r} A${r} ${r} 0 ${deg > 180 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
    },
  };
})();
