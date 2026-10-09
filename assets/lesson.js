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
        { path: "6a-u7/08", t: "公式翻過來用" },
        { path: "6a-u7/09", t: "名詞公式總整理" },
      ],
    },
    "6a-u8": {
      name: "六上 第 8 單元・放大、縮小與比例尺",
      pages: [
        { path: "review/length-units", t: "長度單位換算", pre: true },
        { path: "review/rect-area", t: "長方形面積", pre: true },
        { path: "review/ratio", t: "比與比值", pre: true },
        { path: "6a-u8/01", t: "放大圖與縮小圖" },
        { path: "6a-u8/02", t: "對應點、對應邊、對應角" },
        { path: "6a-u8/03", t: "畫放大圖、縮小圖" },
        { path: "6a-u8/04", t: "面積變幾倍" },
        { path: "6a-u8/05", t: "比例尺" },
        { path: "6a-u8/06", t: "圖上距離 ↔ 實際距離" },
        { path: "6a-u8/07", t: "名詞公式總整理" },
      ],
    },
    "6a-u9": {
      name: "六上 第 9 單元・怎樣解題",
      pages: [
        { path: "review/order-of-operations", t: "四則運算的順序", pre: true },
        { path: "6a-u9/01", t: "畫線段圖：和差問題" },
        { path: "6a-u9/02", t: "列表找答案：雞兔同籠" },
        { path: "6a-u9/03", t: "假設法" },
        { path: "6a-u9/04", t: "倒推法" },
      ],
    },
    "6b-u1": {
      name: "六下 第 1 單元・小數與分數的四則運算",
      pages: [
        { path: "review/order-of-operations", t: "四則運算的順序", pre: true },
        { path: "review/fraction-decimal", t: "分數和小數互換", pre: true },
        { path: "6b-u1/01", t: "分數、小數混合計算" },
        { path: "6b-u1/02", t: "交換律、結合律" },
        { path: "6b-u1/03", t: "分配律" },
        { path: "6b-u1/04", t: "簡便計算" },
      ],
    },
    "6b-u2": {
      name: "六下 第 2 單元・圓面積與扇形面積",
      pages: [
        { path: "review/area-shapes", t: "長方形、平行四邊形、三角形面積", pre: true },
        { path: "review/area-units", t: "面積單位", pre: true },
        { path: "6a-u7/03", t: "圓周長公式（六上）", pre: true },
        { path: "6b-u2/01", t: "圓面積公式" },
        { path: "6b-u2/02", t: "扇形面積" },
        { path: "6b-u2/03", t: "陰影面積" },
        { path: "6b-u2/04", t: "半徑變 2 倍，面積變幾倍" },
        { path: "6b-u2/05", t: "知道面積，求半徑" },
        { path: "6b-u2/06", t: "名詞公式總整理" },
      ],
    },
    "6b-u3": {
      name: "六下 第 3 單元・速率",
      pages: [
        { path: "review/time-units", t: "時間單位換算", pre: true },
        { path: "review/length-units", t: "長度單位換算", pre: true },
        { path: "6b-u3/01", t: "速率是什麼" },
        { path: "6b-u3/02", t: "秒速、分速、時速" },
        { path: "6b-u3/03", t: "速率 = 距離 ÷ 時間" },
        { path: "6b-u3/04", t: "距離、時間怎麼求" },
        { path: "6b-u3/05", t: "速率單位換算" },
        { path: "6b-u3/06", t: "名詞公式總整理" },
      ],
    },
    "6b-u4": {
      name: "六下 第 4 單元・統計圖表",
      pages: [
        { path: "review/bar-line-chart", t: "長條圖、折線圖", pre: true },
        { path: "review/percent", t: "百分率", pre: true },
        { path: "review/angles", t: "角度與量角器", pre: true },
        { path: "6b-u4/01", t: "圓形百分圖" },
        { path: "6b-u4/02", t: "圓心角 = 百分率 × 360°" },
        { path: "6b-u4/03", t: "讀懂圓形圖" },
        { path: "6b-u4/04", t: "選哪一種圖" },
      ],
    },
    "6b-u5": {
      name: "六下 第 5 單元・怎樣解題",
      pages: [
        { path: "6a-u9/01", t: "畫線段圖（六上）", pre: true },
        { path: "6b-u5/01", t: "用圖解題：排隊與種樹" },
        { path: "6b-u5/02", t: "找出不變的量：年齡問題" },
        { path: "6b-u5/03", t: "倒推法：故事題" },
        { path: "6b-u5/04", t: "解題綜合練習" },
      ],
    },
  };

  const body = document.body;
  // 從目錄點進來時會帶 ?u=單元（先備知識頁可能屬於好幾個單元）
  const urlSeq = new URLSearchParams(location.search).get("u");
  const page = body.dataset.page;
  const root = "../";
  const seqId = SEQUENCES[urlSeq] ? urlSeq : body.dataset.seq;
  const seq = SEQUENCES[seqId];
  const q = SEQUENCES[urlSeq] ? `?u=${seqId}` : "";

  if (seq) {
    const idx = seq.pages.findIndex(p => p.path === page);
    const top = document.getElementById("topbar");
    if (top) {
      top.innerHTML = `
        <a class="back" href="${root}index.html#${seqId}">← 目錄</a>
        <span class="crumb">${seq.name}</span>
        <span class="seq">${seq.pages.map((p, i) =>
          `<a href="${root}${p.path}.html${q}" title="${p.t}" class="${p.pre ? "pre" : ""} ${i === idx ? "on" : ""}"></a>`).join("")}</span>`;
    }
    const pager = document.getElementById("pager");
    if (pager) {
      const prev = seq.pages[idx - 1], next = seq.pages[idx + 1];
      pager.innerHTML = `
        ${prev ? `<a href="${root}${prev.path}.html${q}"><small>← 上一課</small><b>${prev.t}</b></a>` : `<a href="${root}index.html#${seqId}"><small>← 回到</small><b>目錄</b></a>`}
        ${next ? `<a class="next" href="${root}${next.path}.html${q}"><small>下一課 →</small><b>${next.t}</b></a>` : `<a class="next" href="${root}index.html#${seqId}"><small>這個單元完成了！</small><b>回到目錄 →</b></a>`}`;
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
