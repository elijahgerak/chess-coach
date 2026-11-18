// ================= Board (tap or drag to move) =================
class Board {
  constructor(el, opts = {}) {
    this.el = el; this.opts = opts; this.orientation = "w";
    this.fen = null; this.sel = null; this.arrows = []; this.marks = {}; this.last = null; this.check = null;
    el.classList.add("board");
    el.innerHTML = "";
    this.grid = document.createElement("div"); this.grid.className = "grid"; el.appendChild(this.grid);
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("viewBox", "0 0 800 800"); this.svg.setAttribute("class", "arrows"); this.svg.setAttribute("aria-hidden", "true");
    el.appendChild(this.svg);
    this.squares = {};
    for (let i = 0; i < 64; i++) { const d = document.createElement("div"); d.className = "sq"; this.grid.appendChild(d); }
    el.addEventListener("pointerdown", e => this._down(e));
    window.addEventListener("pointermove", e => this._move(e), { passive: false });
    window.addEventListener("pointerup", e => this._up(e));
    window.addEventListener("pointercancel", () => this._cancelDrag());
  }
  sqAt(i) { // grid index -> square name for current orientation
    const r = Math.floor(i / 8), f = i % 8;
    return this.orientation === "w" ? FILES[f] + (8 - r) : FILES[7 - f] + (r + 1);
  }
  set(o) {
    const prevFen = this.fen;
    Object.assign(this, { arrows: [], marks: {}, last: null, check: null, ...o });
    this.sel = null;
    this.render(o.animate && prevFen ? o.animate : null);
  }
  render(anim) {
    const g = new Chess(this.fen); this.game = g;
    const cells = this.grid.children;
    for (let i = 0; i < 64; i++) {
      const sq = this.sqAt(i); const d = cells[i];
      const [f, r] = sqFR(sq);
      d.className = "sq " + ((f + r) % 2 === 1 ? "l" : "d");
      d.dataset.sq = sq; d.innerHTML = "";
      if (this.last && (this.last.from === sq || this.last.to === sq)) d.classList.add("last");
      if (this.check === sq) d.classList.add("check");
      if (this.marks[sq]) d.classList.add(this.marks[sq]);
      const p = g.get(sq);
      if (p) {
        const img = document.createElement("img");
        img.src = PIECES[p.color + p.type.toUpperCase()]; img.alt = ""; img.draggable = false;
        d.appendChild(img);
        if (anim && anim.to === sq) {
          const [ff, fr] = sqFR(anim.from), [tf, tr] = sqFR(anim.to);
          const dir = this.orientation === "w" ? 1 : -1;
          const dx = (ff - tf) * 100 * dir, dy = (tr - fr) * 100 * dir;
          img.style.transform = `translate(${dx}%, ${dy}%)`;
          img.style.zIndex = 3;
          requestAnimationFrame(() => requestAnimationFrame(() => { img.classList.add("moving"); img.style.transform = ""; }));
          setTimeout(() => { img.classList.remove("moving"); img.style.zIndex = ""; }, 260);
        }
      }
      const showFile = this.orientation === "w" ? r === 1 : r === 8;
      const showRank = this.orientation === "w" ? f === 0 : f === 7;
      if (showFile) { const s = document.createElement("span"); s.className = "cf"; s.textContent = sq[0]; d.appendChild(s); }
      if (showRank) { const s = document.createElement("span"); s.className = "cr"; s.textContent = sq[1]; d.appendChild(s); }
    }
    this._drawArrows();
  }
  _drawArrows() {
    const pos = sq => { const [f, r] = sqFR(sq); return this.orientation === "w" ? [f * 100 + 50, (8 - r) * 100 + 50] : [(7 - f) * 100 + 50, (r - 1) * 100 + 50]; };
    let html = "";
    for (const a of this.arrows) {
      const [x1, y1] = pos(a.from), [x2, y2] = pos(a.to);
      const ang = Math.atan2(y2 - y1, x2 - x1); const len = Math.hypot(x2 - x1, y2 - y1);
      const head = 38, w = 16; const ex = x1 + Math.cos(ang) * (len - head), ey = y1 + Math.sin(ang) * (len - head);
      const px = Math.cos(ang + Math.PI / 2), py = Math.sin(ang + Math.PI / 2);
      const sx = x1 + Math.cos(ang) * 22, sy = y1 + Math.sin(ang) * 22;
      const pts = [[sx + px * w / 2, sy + py * w / 2], [ex + px * w / 2, ey + py * w / 2], [ex + px * 22, ey + py * 22], [x2, y2], [ex - px * 22, ey - py * 22], [ex - px * w / 2, ey - py * w / 2], [sx - px * w / 2, sy - py * w / 2]];
      html += `<polygon class="arrow ${a.kind || ""}" points="${pts.map(p => p.map(n => n.toFixed(1)).join(",")).join(" ")}"/>`;
    }
    this.svg.innerHTML = html;
  }
  _sqFromPoint(x, y) {
    const r = this.grid.getBoundingClientRect();
    if (x < r.left || y < r.top || x >= r.right || y >= r.bottom) return null;
    const f = Math.floor((x - r.left) / (r.width / 8)), rk = Math.floor((y - r.top) / (r.height / 8));
    return this.sqAt(rk * 8 + f);
  }
  _canPick(sq) {
    if (!this.opts.interactive || !this.opts.interactive()) return false;
    const p = this.game.get(sq); return p && p.color === this.game.turn();
  }
  _targets(sq) { return this.game.moves({ square: sq, verbose: true }); }
  _select(sq) {
    this.sel = sq;
    for (const d of this.grid.children) { d.classList.remove("sel"); d.querySelectorAll(".dot").forEach(x => x.remove()); }
    if (!sq) return;
    const cell = this.grid.querySelector(`[data-sq="${sq}"]`); cell.classList.add("sel");
    for (const m of this._targets(sq)) {
      const c = this.grid.querySelector(`[data-sq="${m.to}"]`);
      if (c.querySelector(".dot")) continue;
      const dot = document.createElement("i"); dot.className = "dot" + (m.captured ? " cap" : ""); c.appendChild(dot);
    }
  }
  _down(e) {
    if (!this.game) return;
    const sq = this._sqFromPoint(e.clientX, e.clientY); if (!sq) return;
    const live = this.opts.interactive && this.opts.interactive();
    if (live && this.sel && sq !== this.sel && this._targets(this.sel).some(m => m.to === sq)) { e.preventDefault(); this._try(this.sel, sq); return; }
    if (this._canPick(sq)) {
      e.preventDefault();
      this._select(sq);
      const img = this.grid.querySelector(`[data-sq="${sq}"] img`);
      this.drag = { from: sq, x: e.clientX, y: e.clientY, img, ghost: null, started: false };
    } else this._select(null);
  }
  _move(e) {
    const d = this.drag; if (!d) return;
    if (!d.started && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    e.preventDefault();
    if (!d.started) {
      d.started = true;
      const size = this.grid.getBoundingClientRect().width / 8;
      const gh = d.img.cloneNode(); gh.className = "drag-ghost"; gh.style.width = gh.style.height = size * 1.1 + "px";
      document.body.appendChild(gh); d.ghost = gh; d.size = size * 1.1; d.img.style.opacity = "0.25";
    }
    d.ghost.style.transform = `translate(${e.clientX - d.size / 2}px, ${e.clientY - d.size / 2}px)`;
  }
  _up(e) {
    const d = this.drag; if (!d) return; this.drag = null;
    if (!d.started) return;
    const to = this._sqFromPoint(e.clientX, e.clientY);
    d.ghost.remove(); d.img.style.opacity = "";
    if (to && to !== d.from && this._targets(d.from).some(m => m.to === to)) this._try(d.from, to, true);
  }
  _cancelDrag() { const d = this.drag; if (d && d.ghost) { d.ghost.remove(); d.img.style.opacity = ""; } this.drag = null; }
  async _try(from, to, dragged) {
    const ms = this._targets(from).filter(m => m.to === to);
    let promo;
    if (ms.some(m => m.promotion)) { promo = await this._pickPromotion(to); if (!promo) { this._select(null); return; } }
    this._select(null);
    this.opts.onMove && this.opts.onMove({ from, to, promotion: promo }, dragged);
  }
  _pickPromotion(to) {
    return new Promise(res => {
      const c = this.game.turn(); const wrap = document.createElement("div"); wrap.className = "promo";
      for (const t of ["q", "r", "b", "n"]) {
        const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Promote to " + NAME[t]);
        b.innerHTML = `<img src="${PIECES[c + t.toUpperCase()]}" alt="">`;
        b.onclick = ev => { ev.stopPropagation(); wrap.remove(); res(t); };
        wrap.appendChild(b);
      }
      wrap.onclick = () => { wrap.remove(); res(null); };
      this.el.appendChild(wrap);
    });
  }
}
