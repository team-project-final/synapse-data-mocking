/* mermaid-init.js
   ── mermaid diagram 렌더 + 클릭 확대 모달 ──
   docs HTML에서 <script src="mermaid-init.js"> 로 로드.
   mermaid CDN은 이 스크립트 앞에 먼저 로드되어야 한다.
*/
(function () {
  "use strict";

  /* ── 1. mermaid 초기화 ── */
  if (typeof mermaid === "undefined") return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    themeVariables: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "14px",
      primaryColor: "#1e293b",
      primaryTextColor: "#e2e8f0",
      primaryBorderColor: "#22d3ee",
      lineColor: "#4a5468",
      secondaryColor: "#111827",
      tertiaryColor: "#0b111c",
      mainBkg: "#111827",
      nodeBorder: "#22d3ee",
      clusterBkg: "#0b111c",
      clusterBorder: "#1e293b",
      titleColor: "#f8fafc",
      edgeLabelBackground: "#0b111c",
    },
  });

  /* ── 2. .mermaid-block → SVG 변환 ── */
  var blocks = document.querySelectorAll(".mermaid-block");
  var pending = blocks.length;
  if (!pending) return;

  var counter = 0;

  blocks.forEach(function (block) {
    var codeEl = block.querySelector("code");
    if (!codeEl) return;

    var source = codeEl.textContent || "";
    // HTML 엔티티 복원
    source = source
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    var id = "mmd-" + ++counter;

    mermaid
      .render(id, source.trim())
      .then(function (result) {
        var svg = result.svg;
        // 기존 내용 교체
        block.innerHTML = "";
        block.className = "mermaid-rendered";

        // 라벨
        var label = document.createElement("div");
        label.className = "mermaid-label";
        label.textContent = "DIAGRAM";
        block.appendChild(label);

        // SVG 컨테이너
        var fig = document.createElement("figure");
        fig.className = "mermaid-svg";
        fig.innerHTML = svg;
        fig.title = "클릭하여 확대";
        block.appendChild(fig);

        // 호버 툴팁
        var tip = document.createElement("div");
        tip.className = "mermaid-zoom-tip";
        tip.textContent = "클릭하여 확대";
        fig.appendChild(tip);

        // 클릭 → 모달
        fig.addEventListener("click", function () {
          var svgEl = fig.querySelector("svg");
          if (svgEl) openZoomModal(svgEl.outerHTML);
        });
      })
      .catch(function (err) {
        // 렌더 실패 → 원본 코드 유지, 에러 메시지 추가
        var errDiv = document.createElement("div");
        errDiv.style.cssText =
          "color:#f87171;font-size:12px;margin-top:6px;font-family:var(--font-mono)";
        errDiv.textContent = "렌더 실패: " + err.message;
        block.appendChild(errDiv);
      });
  });

  /* ── 3. 줌 모달 (SvgZoomModal 포팅) ── */
  function openZoomModal(svgHtml) {
    // 기존 모달 제거
    var existing = document.getElementById("mermaid-zoom-modal");
    if (existing) existing.remove();

    var state = { scale: 1, tx: 0, ty: 0, dragging: false, sx: 0, sy: 0, stx: 0, sty: 0 };

    // 백드롭
    var backdrop = document.createElement("div");
    backdrop.id = "mermaid-zoom-modal";
    backdrop.className = "mzm-backdrop";

    // 툴바
    var toolbar = document.createElement("div");
    toolbar.className = "mzm-toolbar";

    var scaleLabel = document.createElement("span");
    scaleLabel.className = "mzm-scale";
    scaleLabel.textContent = "100%";

    var btnPlus = btn("+", function () { setScale(state.scale + 0.25); });
    var btnMinus = btn("−", function () { setScale(state.scale - 0.25); });
    var btnReset = btn("초기화", function () { state.tx = 0; state.ty = 0; setScale(state.initialScale || 1); applyTransform(); });
    btnReset.style.marginLeft = "8px";
    btnReset.style.fontSize = "12px";

    var hint = document.createElement("span");
    hint.className = "mzm-hint";
    hint.textContent = "드래그: 이동 · 스크롤: 확대/축소 · ESC: 닫기";

    var btnClose = btn("✕", close);
    btnClose.style.fontSize = "18px";
    btnClose.style.padding = "4px 12px";

    var leftGroup = document.createElement("div");
    leftGroup.className = "mzm-group";
    leftGroup.appendChild(btnPlus);
    leftGroup.appendChild(scaleLabel);
    leftGroup.appendChild(btnMinus);
    leftGroup.appendChild(btnReset);

    toolbar.appendChild(leftGroup);
    toolbar.appendChild(hint);
    toolbar.appendChild(btnClose);

    // SVG 뷰포트
    var viewport = document.createElement("div");
    viewport.className = "mzm-viewport";

    var transform = document.createElement("div");
    transform.className = "mzm-transform";

    var svgWrap = document.createElement("div");
    svgWrap.className = "mzm-svg-wrap";
    svgWrap.innerHTML = svgHtml;

    transform.appendChild(svgWrap);
    viewport.appendChild(transform);
    backdrop.appendChild(toolbar);
    backdrop.appendChild(viewport);
    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    // 초기 스케일 계산 (fit to viewport)
    requestAnimationFrame(function () {
      var svg = svgWrap.querySelector("svg");
      if (!svg) return;
      var rw = svg.getBoundingClientRect().width;
      var rh = svg.getBoundingClientRect().height;
      if (!rw || !rh) return;
      var pad = 48;
      var aw = viewport.clientWidth - pad * 2;
      var ah = viewport.clientHeight - pad * 2;
      var fit = Math.min(aw / rw, ah / rh);
      var clamped = Math.max(1, Math.min(8, fit));
      state.initialScale = clamped;
      setScale(clamped);
    });

    // 이벤트
    viewport.addEventListener("wheel", function (e) {
      e.preventDefault();
      setScale(state.scale - e.deltaY * 0.002);
    }, { passive: false });

    viewport.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      state.dragging = true;
      state.sx = e.clientX;
      state.sy = e.clientY;
      state.stx = state.tx;
      state.sty = state.ty;
      viewport.setPointerCapture(e.pointerId);
      viewport.style.cursor = "grabbing";
    });

    viewport.addEventListener("pointermove", function (e) {
      if (!state.dragging) return;
      state.tx = state.stx + (e.clientX - state.sx);
      state.ty = state.sty + (e.clientY - state.sy);
      applyTransform();
    });

    viewport.addEventListener("pointerup", function () {
      state.dragging = false;
      viewport.style.cursor = "grab";
    });

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) close();
    });

    var onKey = function (e) { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);

    function setScale(s) {
      state.scale = Math.max(0.2, Math.min(8, s));
      scaleLabel.textContent = Math.round(state.scale * 100) + "%";
      applyTransform();
    }

    function applyTransform() {
      transform.style.transform =
        "translate(" + state.tx + "px," + state.ty + "px) scale(" + state.scale + ")";
    }

    function close() {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      backdrop.remove();
    }

    function btn(text, handler) {
      var b = document.createElement("button");
      b.className = "mzm-btn";
      b.textContent = text;
      b.addEventListener("click", handler);
      return b;
    }
  }
})();
