// ================= Small helpers =================
const LOGO_SVG = `/*LOGOSVG*/`;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DAY = 86400000;
const bold = s => esc(s).replace(/\b(\d+\.(?:\.\.)?[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|\d+\.(?:\.\.)?O-O(?:-O)?|(?:[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h]x[a-h][1-8]|O-O(?:-O)?)(?:=[QRBN])?[+#]?)(?![\w])/g, "<b>$1</b>");

let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 3800); }

// ================= Saved state =================
const KEY = "ckqg-coach-v1";
const DEFAULT = { opening: null, level: 3, pause: true, plan: { stage: 1, games: 0, streak: 0, miss: 0, manual: false }, deck: {}, stats: { played: 0, won: 0, drawn: 0, lost: 0 }, games: [], username: "", newDay: { d: "", n: 0 }, lines: {}, newLines: { d: "", n: 0 }, threat: { on: true, clean: 0 } };
let S = JSON.parse(JSON.stringify(DEFAULT));
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) {}
const Store = { ref: null, saving: false, dirty: false, t: 0 };
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  Store.dirty = true; clearTimeout(Store.t); Store.t = setTimeout(flush, 1500);
}
async function flush() {
  if (!Store.ref || Store.saving || !Store.dirty) return;
  Store.saving = true; Store.dirty = false;
  try { await Store.ref.set(JSON.parse(JSON.stringify(S))); } catch (e) { }
  Store.saving = false; if (Store.dirty) flush();
}
async function connectPlatform() {
  const use = window.claude && window.claude.use;
  if (!use) return;
  try {
    const [user, db] = await Promise.all([use("user"), use("db")]);
    if (!user || !db) return;
    const uid = await user.id(); if (!uid) return;
    Store.ref = db.doc(`data/users/${uid}/state`);
    const snap = await Store.ref.get();
    if (snap.exists) {
      const data = snap.data();
      S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), JSON.parse(JSON.stringify(data)));
      seedConcepts(); seedLines(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
      updateBadge(); if (currentView() === "practice") renderPractice();
      if (currentView() === "review") renderReview();
      setTop();
    } else { Store.dirty = true; flush(); }
  } catch (e) { }
}

// ================= Engine: Stockfish 19 in a Web Worker =================
function parseInfo(line) {
  const t = line.split(" "); const o = { multipv: 1 };
  for (let i = 1; i < t.length; i++) {
    const k = t[i];
    if (k === "depth") o.depth = +t[++i];
    else if (k === "multipv") o.multipv = +t[++i];
    else if (k === "score") { const kind = t[++i], v = +t[++i]; o.score = kind === "cp" ? { cp: v } : { mate: v }; if (t[i + 1] === "lowerbound" || t[i + 1] === "upperbound") { o.bound = true; i++; } }
    else if (k === "pv") { o.pv = t.slice(i + 1); break; }
  }
  return o.bound || !o.pv || !o.score ? null : o;
}
class Engine {
  constructor() { this.job = null; this.queue = Promise.resolve(); this.ready = this._boot(); }
  async _boot() {
    for (const p of ["stockfish-19-lite-single.js", "stockfish-19-asm.js"]) {
      try { await this._start(p); this.flavor = p; return true; } catch (e) { console.warn("Engine failed to start:", p, e); }
    }
    throw new Error("no engine");
  }
  _start(path) {
    return new Promise((res, rej) => {
      let w; try { w = new Worker(path); } catch (e) { rej(e); return; }
      const t = setTimeout(() => { w.terminate(); rej("timeout"); }, 20000);
      w.onmessage = e => {
        if (String(e.data).startsWith("uciok")) { clearTimeout(t); this.w = w; w.onmessage = ev => this._line(String(ev.data)); res(); }
      };
      w.onerror = err => { clearTimeout(t); try { w.terminate(); } catch (x) {} rej(err && err.message || "worker error"); };
      w.postMessage("uci");
    });
  }
  _line(line) {
    const j = this.job; if (!j) return;
    if (line.startsWith("info ") && line.includes(" pv ")) {
      const info = parseInfo(line);
      if (info) { j.lines[info.multipv] = info; j.depth = Math.max(j.depth, info.depth || 0); j.onInfo && j.onInfo(j); }
    } else if (line.startsWith("bestmove")) {
      this.job = null;
      const lines = Object.keys(j.lines).sort((a, b) => a - b).map(k => j.lines[k]);
      j.resolve({ lines, bestmove: line.split(" ")[1], depth: j.depth });
    }
  }
  search({ fen, go, options = {}, onInfo }) {
    const run = async () => {
      await this.ready;
      return new Promise(resolve => {
        this.job = { lines: {}, depth: 0, resolve, onInfo };
        for (const [k, v] of Object.entries(options)) this.w.postMessage(`setoption name ${k} value ${v}`);
        this.w.postMessage("position fen " + fen);
        this.w.postMessage("go " + go);
      });
    };
    const p = this.queue.then(run, run); this.queue = p.catch(() => {}); return p;
  }
  stop() { if (this.job && this.w) this.w.postMessage("stop"); }
}
const coachEngine = new Engine();
const botEngine = new Engine();
let ENGINE = "loading";
coachEngine.ready.then(() => { ENGINE = "ok"; renderCoach(); }).catch(() => { ENGINE = "fail"; renderCoach(); });

const FULL = { UCI_LimitStrength: "false", "Skill Level": 20 };
async function analyze(fen, go, mpv = 1, onInfo) {
  const g = new Chess(fen);
  if (g.game_over()) return { lines: [{ score: g.in_checkmate() ? { mate: 0 } : { cp: 0 }, pv: [] }], depth: 99 };
  const r = await coachEngine.search({ fen, go, options: { ...FULL, MultiPV: mpv }, onInfo });
  if (!r.lines.length) r.lines = [{ score: { cp: 0 }, pv: r.bestmove && r.bestmove !== "(none)" ? [r.bestmove] : [] }];
  return r;
}

// Opponent strength. Under 1320, Stockfish can't limit itself, so the coach picks among its top moves with some randomness.
const LEVELS = [
  { elo: 600, weak: [1, 8, 320] }, { elo: 800, weak: [2, 6, 190] }, { elo: 1000, weak: [3, 5, 120] }, { elo: 1200, weak: [5, 4, 70] },
  { elo: 1400 }, { elo: 1600 }, { elo: 1800 }, { elo: 2000 }, { elo: 2200 }, { elo: 2500 }, { elo: 2800 }, { max: true },
];
const levelName = i => LEVELS[i].max ? "Full strength" : `About ${LEVELS[i].elo}`;
async function botChoose(fen) {
  const L = LEVELS[S.level];
  if (L.weak) {
    const [depth, mpv, T] = L.weak;
    const r = await botEngine.search({ fen, go: `depth ${depth}`, options: { ...FULL, MultiPV: mpv } });
    const lines = r.lines.filter(l => l.pv && l.pv.length);
    if (!lines.length) return r.bestmove;
    const best = toCp(lines[0].score);
    const ws = lines.map(l => Math.exp(-(best - toCp(l.score)) / T));
    let x = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lines.length; i++) { x -= ws[i]; if (x <= 0) return lines[i].pv[0]; }
    return lines[0].pv[0];
  }
  if (L.max) return (await botEngine.search({ fen, go: "movetime 1500", options: { ...FULL, MultiPV: 1 } })).bestmove;
  return (await botEngine.search({ fen, go: `movetime ${700 + (Math.random() * 600 | 0)}`, options: { UCI_LimitStrength: "true", UCI_Elo: L.elo, MultiPV: 1 } })).bestmove;
}

// ================= Spaced practice deck =================
const INTERVALS = [0, 1, 3, 7, 16, 35];
function today() { return new Date().toISOString().slice(0, 10); }
function seedConcepts() {
  for (const c of CONCEPTS) {
    const id = "c:" + c.id; if (S.deck[id]) continue;
    const g = new Chess(); c.moves.split(" ").forEach(m => g.move(m));
    S.deck[id] = { id, kind: "concept", fen: g.fen(), accept: c.accept, prompt: c.prompt, answer: c.answer, principle: c.principle, why: c.why, title: c.title, opening: c.opening, box: 0, due: 0, isNew: true };
  }
}
// Repertoire lines as drill cards (learned move by move, spaced like everything else)
function seedLines() {
  const all = [];
  for (const [op, R] of Object.entries(REPERTOIRE)) R.lines.forEach((l, i) => all.push({ op, l, i }));
  all.sort((a, b) => b.l.weight - a.l.weight || a.i - b.i);
  all.forEach((x, n) => { const id = x.op + ":" + x.l.name; if (!S.lines[id]) S.lines[id] = { id, opening: x.op, name: x.l.name, box: 0, due: 0, isNew: true, order: n }; else S.lines[id].order = n; });
}
function dueLines() {
  const now = Date.now(); const d = today();
  if (S.newLines.d !== d) S.newLines = { d, n: 0 };
  const L = Object.values(S.lines).filter(l => REPERTOIRE[l.opening].lines.some(x => x.name === l.name));
  const due = L.filter(l => !l.isNew && l.due <= now);
  const fresh = L.filter(l => l.isNew).sort((a, b) => a.order - b.order).slice(0, Math.max(0, 2 - S.newLines.n));
  return { due, fresh, count: due.length + fresh.length, learned: L.filter(l => !l.isNew && l.box >= 1).length, total: L.length };
}
function addMistakeCard(fen, mv, r, pre, source, label) {
  const id = "m:" + fenKey(fen);
  if (S.deck[id] || !r.best) return false;
  const top = (pre && pre.lines || []).filter(l => l.pv && l.pv[0]).map(l => ({ uci: l.pv[0], cp: toCp(l.score) }));
  S.deck[id] = { id, kind: "mistake", fen, accept: [r.best], top, bestCp: r.bestCp, played: mv.san, label, prompt: `You played ${label} here${source === "review" ? " in a chess.com game" : ""}. Find a better move.`, answer: r.better || `Better was ${r.best}.`, why: r.msg[0] || "", box: 0, due: Date.now() + 20 * 3600000, added: Date.now() };
  save(); updateBadge(); return true;
}
function dueCards() {
  const now = Date.now(); const d = today();
  if (S.newDay.d !== d) S.newDay = { d, n: 0 };
  const due = Object.values(S.deck).filter(c => !c.isNew && c.due <= now);
  const fresh = Object.values(S.deck).filter(c => c.isNew).slice(0, Math.max(0, 4 - S.newDay.n));
  return { due, fresh, count: due.length + fresh.length };
}
function updateBadge() {
  const n = dueCards().count + dueLines().count; const b = $("#badge-practice");
  b.textContent = n; b.hidden = n === 0;
}
function schedule(card, ok) {
  if (card.isNew) { card.isNew = false; S.newDay.n++; }
  card.box = ok ? Math.min(card.box + 1, INTERVALS.length - 1) : 1;
  card.due = Date.now() + (ok ? INTERVALS[card.box] : 1) * DAY - 3600000;
  save(); updateBadge();
}
function nextDueText() {
  const later = [...Object.values(S.deck), ...Object.values(S.lines)].filter(c => !c.isNew).map(c => c.due).filter(t => t > Date.now()).sort((a, b) => a - b)[0];
  if (!later) return "";
  const h = (later - Date.now()) / 3600000;
  return h < 20 ? "Next review: later today." : h < 44 ? "Next review: tomorrow." : `Next review: in ${Math.round(h / 24)} days.`;
}

// ================= Sheet + views =================
function openSheet(html, mount) {
  const sh = $("#sheet"), sc = $("#scrim");
  sh.innerHTML = `<div class="grab" aria-hidden="true"></div>` + html;
  sh.hidden = false; sc.hidden = false; sh.style.transform = "";
  requestAnimationFrame(() => requestAnimationFrame(() => { sh.classList.add("on"); sc.classList.add("on"); }));
  mount && mount(sh);
  sh.setAttribute("tabindex", "-1"); sh.focus({ preventScroll: true });
}
function closeSheet() {
  const sh = $("#sheet"), sc = $("#scrim");
  sh.classList.remove("on"); sc.classList.remove("on"); sh.style.transform = "";
  setTimeout(() => { if (!sh.classList.contains("on")) { sh.hidden = true; sc.hidden = true; } }, 460);
  if (SHEET_ONCLOSE) { const f = SHEET_ONCLOSE; SHEET_ONCLOSE = null; f(); }
}
let SHEET_ONCLOSE = null;
(function sheetDrag() {
  let y0 = null, dy = 0;
  document.addEventListener("pointerdown", e => { const sh = $("#sheet"); if (!sh.classList.contains("on")) return; if (e.target.closest(".grab") || (e.target === sh && e.offsetY < 40)) { y0 = e.clientY; dy = 0; sh.style.transition = "none"; } });
  document.addEventListener("pointermove", e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); $("#sheet").style.transform = `translateY(${dy}px)`; });
  document.addEventListener("pointerup", () => { if (y0 == null) return; const sh = $("#sheet"); sh.style.transition = ""; y0 = null; if (dy > 90) closeSheet(); else sh.style.transform = ""; });
})();

function setTop() {
  const v = currentView();
  const T = { play: ["Stockfish", levelName(S.level)], practice: ["Practice", "Your openings, ideas and mistakes"], review: ["Review", "Your chess.com games"] }[v] || ["Stockfish", levelName(S.level)];
  $("#top-title").textContent = T[0]; $("#top-sub").textContent = T[1];
  $("#restart").hidden = v !== "play"; $("#open-settings").hidden = v !== "play";
}
function currentView() { return (location.hash || "#play").slice(1); }
function showView(v) {
  if (!["play", "practice", "review"].includes(v)) v = "play";
  document.querySelectorAll(".view").forEach(x => x.classList.toggle("on", x.id === "view-" + v));
  document.querySelectorAll(".tab").forEach(x => { x.classList.toggle("on", x.dataset.v === v); x.setAttribute("aria-current", x.dataset.v === v ? "page" : "false"); });
  if (v === "practice") renderPractice();
  if (v === "review") renderReview();
  setTop(); window.scrollTo(0, 0);
}

// ================= PLAY =================
const P = { game: new Chess(), hist: [], you: "b", opening: "caro", gid: 0, busy: false, over: null, wait: null, retry: null, hintText: "", hintStep: 0, pre: null, prePromise: null, preFen: null, last: null, mine: null, theirs: null, arrows: [], marks: {}, plan: { asked: {}, answered: {} }, playing: false, replayId: 0, lastAfterCp: null, oppMistake: null, threat: null, wasInBook: true, leftBookNow: false };
let playBoard;

function canUserMove() { return ENGINE === "ok" && !P.busy && !P.over && !P.wait && !P.playing && P.game.turn() === P.you; }
function kingSq(g) { if (!g.in_check()) return null; const m = boardMap(g); return Object.keys(m).find(s => m[s].type === "k" && m[s].color === g.turn()); }
function planOverlay() {
  // Rings on the squares that matter right now, plus an arrow for the next plan move when the engine agrees it's sound
  const out = { marks: {}, arrows: [] };
  if (P.game.turn() !== P.you || P.busy || P.wait || P.playing || P.over || P.oppMistake || (P.threat && S.threat.on) || !P.hist.length) return out;
  const info = planInfo(); if (planPending(info)) return out;
  if (S.plan.stage >= 3 && !P.plan.answered[info.sid]) return out;
  if (info.plan) {
    out.marks[info.plan.focus] = "focus";
    const idx = info.steps.findIndex(s => s.done === false);
    const cand = idx >= 0 && info.plan.moves && info.plan.moves[idx] ? info.plan.moves[idx] : [];
    if (cand.length && P.pre) {
      const top = new Set(P.pre.lines.filter(l => l.pv && l.pv[0] && winPct(toCp(l.score)) >= winPct(toCp(P.pre.lines[0].score)) - 6).map(l => l.pv[0]));
      const legal = P.game.moves({ verbose: true }).filter(m => cand.includes(m.san.replace(/[+#]/g, "")) && top.has(moveUci(m)));
      if (legal[0]) out.arrows.push({ from: legal[0].from, to: legal[0].to, kind: "plan" });
    }
  } else {
    const map = boardMap(P.game); const g = info.goals.items.find(i => i.done === false);
    if (g && g.id === "develop") { const home = P.you === "w" ? { n: ["b1", "g1"], b: ["c1", "f1"] } : { n: ["b8", "g8"], b: ["c8", "f8"] }; for (const t of ["n", "b"]) for (const sq of home[t]) if (map[sq] && map[sq].type === t && map[sq].color === P.you) out.marks[sq] = "focus"; }
    if (g && g.id === "castle") { const k = Object.keys(map).find(x => map[x].type === "k" && map[x].color === P.you); if (k) out.marks[k] = "focus"; }
    if (g && g.id === "worst") { const w = worstPiece(map, P.you); if (w) out.marks[w.sq] = "focus"; }
  }
  return out;
}
function renderPlayBoard(anim) {
  const ov = planOverlay();
  const marks = { ...ov.marks, ...P.marks };
  if (P.oppMistake && P.last) { marks[P.last.from] = marks[P.last.from] || "lastbad"; marks[P.last.to] = "lastbad"; }
  else if (P.threat && S.threat.on && P.game.turn() === P.you && !P.busy && !P.wait) marks[P.threat.sq] = "threat";
  playBoard.set({ fen: P.game.fen(), orientation: P.you, last: P.last, check: kingSq(P.game), arrows: P.arrows.length ? P.arrows : ov.arrows, marks, animate: anim });
}
function updateEval(score, stm) {
  if (!score || !$("#evalfill")) return;
  const cpMe = (stm === P.you ? 1 : -1) * toCp(score);
  $("#evalfill").style.width = winPct(cpMe).toFixed(1) + "%";
  $("#evalbar").setAttribute("aria-label", `Your winning chances: ${Math.round(winPct(cpMe))}%`);
}
function setThinking(on) { $("#thinking").classList.toggle("on", on); }

function newGame() {
  P.gid++; coachEngine.stop(); botEngine.stop(); P.replayId++; P.playing = false;
  P.opening = S.opening || "caro"; P.you = REPERTOIRE[P.opening].you;
  Object.assign(P, { threat: null, wasInBook: true, leftBookNow: false, lastAfterCp: null, oppMistake: null, game: new Chess(), hist: [], busy: false, over: null, wait: null, retry: null, hintText: "", hintStep: 0, pre: null, prePromise: null, last: null, mine: null, theirs: null, arrows: [], marks: {}, plan: { asked: {}, answered: {} } });
  setTop();
  renderPlayBoard(); renderCoach(); renderPlan();
  if (P.you === "b") botMove(); else startUserTurn();
}
function startUserTurn() {
  const fen = P.game.fen(); const gid = P.gid;
  P.preFen = fen; P.pre = null; P.hintText = ""; P.hintStep = 0;
  { const inBook = bookAt(P.opening, fen).length > 0; P.leftBookNow = P.wasInBook && !inBook && P.hist.length >= 4; P.wasInBook = inBook; }
  P.prePromise = coachEngine.ready.then(() => analyze(fen, "depth 18 movetime 2500", 3, j => { if (P.gid === gid && P.preFen === fen && j.lines[1]) updateEval(j.lines[1].score, P.you); }))
    .then(r => {
      if (P.preFen !== fen) return r;
      P.pre = r;
      if (P.lastAfterCp != null && P.theirs && !P.theirs.book && !P.retry) {
        const nowCp = toCp(r.lines[0].score);
        const oppLoss = winPct(nowCp) - winPct(P.lastAfterCp);
        if (oppLoss >= 10 && winPct(P.lastAfterCp) < 90) { P.oppMistake = { cls: oppLoss >= 20 ? "blunder" : "mistake", label: P.theirs.label, punish: r.lines[0].pv[0] }; }
      }
      P.lastAfterCp = null;
      renderPlayBoard(); renderCoach();
      return r;
    });
  P.prePromise.catch(() => {});
  renderCoach(); renderPlan();
}
async function onUserMove(m, dragged) {
  if (!canUserMove()) return;
  const gid = P.gid; const fenBefore = P.game.fen();
  const histBefore = P.game.history({ verbose: true });
  const mv = P.game.move(m); if (!mv) return;
  const label = moveLabel(fenBefore, mv.san);
  P.last = { from: mv.from, to: mv.to }; P.arrows = []; P.marks = {}; P.busy = true; P.theirs = null; P.hintText = "";
  P.mine = { label, san: mv.san, pending: true };
  renderPlayBoard(dragged ? null : { from: mv.from, to: mv.to }); renderCoach();
  coachEngine.stop();
  let pre = await P.prePromise.catch(() => null);
  if (P.gid !== gid) return;
  if (!pre || pre.depth < 8 || pre.lines[0].pv[0] == null) pre = await analyze(fenBefore, "depth 12 movetime 800", 3);
  const book = bookAt(P.opening, fenBefore);
  const isBook = book.some(b => b.san === mv.san);
  const after = isBook ? null : await analyze(P.game.fen(), "depth 15 movetime 1000", 1);
  if (P.gid !== gid) return;
  const r = explainMove({ fenBefore, move: mv, me: P.you, before: pre, after, opening: P.opening, history: histBefore, book });
  if (after) updateEval(after.lines[0].score, P.game.turn());
  const wasRetry = P.retry && P.retry.fen === fenBefore;
  if (P.oppMistake && !["inaccuracy", "mistake", "blunder"].includes(r.cls)) r.punished = moveUci(mv) === P.oppMistake.punish || r.loss < 3;
  P.oppMistake = null; P.threat = null; P.leftBookNow = false;
  P.lastAfterCp = after ? r.afterCp : null;
  P.hist.push({ fenBefore, move: mv, r, label });
  P.mine = { label, san: mv.san, r, fenBefore, move: mv, retry: wasRetry };
  const bad = r.cls === "mistake" || r.cls === "blunder";
  if (bad && !wasRetry) addMistakeCard(fenBefore, mv, r, pre, "play", label);
  if (bad && S.pause && !P.game.game_over()) { P.busy = false; P.wait = { fenBefore, move: mv, r, pre }; renderCoach(); setTimeout(() => { if (P.wait && P.wait.r === r) replayPlay(r); }, 700); return; }
  if (!bad) P.retry = null;
  if (checkOver()) return;
  botMove();
}
// Play a line of moves on a board so you can see the problem
async function playLine(board, show, orientation, onStep, cancelled) {
  const g = new Chess(show.fen);
  board.set({ fen: show.fen, orientation, last: null });
  await sleep(450);
  for (let i = 0; i < show.pv.length; i++) {
    if (cancelled()) return false;
    const fb = g.fen(); const m = g.move(uciObj(show.pv[i])); if (!m) break;
    board.set({ fen: g.fen(), orientation, last: { from: m.from, to: m.to }, check: kingSq(g), animate: { from: m.from, to: m.to } });
    onStep && onStep(moveLabel(fb, m.san), i);
    await sleep(1000);
  }
  if (cancelled()) return false;
  await sleep(800);
  return !cancelled();
}
async function replayPlay(r) {
  if (!r || !r.show) return;
  const id = ++P.replayId; P.playing = true; P.arrows = []; renderCoach();
  await playLine(playBoard, r.show, P.you, label => { const w = $("#watch"); if (w) w.innerHTML = `${esc(r.show.caption)} <b>${esc(label)}</b>`; }, () => P.replayId !== id);
  if (P.replayId !== id) return;
  P.playing = false;
  if (P.wait && r.show.pv[0]) { const a = uciObj(r.show.pv[0]); P.arrows = [{ from: a.from, to: a.to, kind: r.show.fen === r.fenAfter ? "bad" : "" }]; }
  renderPlayBoard(); renderCoach();
}
function cancelReplay() { if (P.playing) { P.replayId++; P.playing = false; } }
function undoMine() {
  const w = P.wait; P.game.undo(); P.hist.pop();
  const h = P.game.history({ verbose: true }); const l = h[h.length - 1];
  P.last = l ? { from: l.from, to: l.to } : null;
  P.retry = { fen: w.fenBefore, r: w.r, tries: (P.retry && P.retry.fen === w.fenBefore ? P.retry.tries : 0) + 1 };
  P.wait = null; P.pre = w.pre; P.preFen = w.fenBefore; P.prePromise = Promise.resolve(w.pre);
  if (w.pre && w.pre.lines[0]) updateEval(w.pre.lines[0].score, P.you);
  P.hintText = ""; P.hintStep = 0; P.oppMistake = null;
}
function tryAgain() { cancelReplay(); undoMine(); P.mine = null; renderPlayBoard(); renderCoach(); }
function showBetter() {
  cancelReplay(); const w = P.wait; undoMine();
  const b = uciObj(w.r.bestUci); P.arrows = [{ from: b.from, to: b.to }];
  P.hintText = w.r.better || `Play ${w.r.best}.`; P.mine = null;
  renderPlayBoard(); renderCoach();
}
function keepPlaying() { cancelReplay(); P.arrows = []; P.wait = null; P.retry = null; if (checkOver()) return; botMove(); }
function giveHint() {
  const pre = P.pre; if (!pre || !pre.lines[0].pv[0]) { P.hintText = "One second, the coach is still looking…"; renderCoach(); return; }
  const fen = P.game.fen(); const best = pvToSan(fen, pre.lines[0].pv, 1)[0];
  P.hintStep++;
  if (P.hintStep === 1) {
    const map = boardMap(P.game);
    const threatened = Object.keys(map).filter(s => map[s].color === P.you && map[s].type !== "k" && map[s].type !== "p" && attackers(map, s, other(P.you)).length && (!attackers(map, s, P.you).length || attackers(map, s, other(P.you)).some(a => VAL[map[a].type] < VAL[map[s].type])));
    const idea = moveIdea(fen, best);
    if (threatened.length && best.from === threatened[0]) P.hintText = `Your ${NAME[map[threatened[0]].type]} on ${threatened[0]} is under attack. Deal with that first.`;
    else P.hintText = idea ? `Look for a move that ${idea.replace(/^it /, "")}.` : "Which of your pieces isn't doing much? Find it a better square.";
  } else if (P.hintStep === 2) { P.marks = { [best.from]: "hint" }; P.hintText = `Move the piece on ${best.from}.`; renderPlayBoard(); }
  else { P.marks = {}; P.arrows = [{ from: best.from, to: best.to, kind: "hint" }]; P.hintText = `Play ${best.san}.`; renderPlayBoard(); }
  renderCoach();
}
async function botMove() {
  const gid = P.gid; P.busy = true; setThinking(true); renderCoach();
  const fen = P.game.fen(); const t0 = performance.now();
  let uci, idea = null;
  const book = bookAt(P.opening, fen);
  if (book.length) { const b = pickWeighted(book); uci = b.uci; idea = b.c; }
  else { try { uci = await botChoose(fen); } catch (e) { if (P.gid === gid) { setThinking(false); P.busy = false; ENGINE = "fail"; renderCoach(); } return; } }
  await sleep(Math.max(0, 500 - (performance.now() - t0)));
  if (P.gid !== gid) return;
  const mv = P.game.move(uciObj(uci)); if (!mv) { setThinking(false); P.busy = false; return; }
  if (!idea) { const i = moveIdea(fen, mv); idea = i ? i.charAt(0).toUpperCase() + i.slice(1).replace(/\byour\b/g, "their") + "." : ""; }
  P.last = { from: mv.from, to: mv.to }; P.arrows = []; P.marks = {};
  P.theirs = { label: moveLabel(fen, mv.san), idea, book: book.length > 0 };
  P.hist.push({ fenBefore: fen, move: mv, bot: true });
  { const map = boardMap(P.game); const t = Object.keys(map).find(x => map[x].color === P.you && "nbrq".includes(map[x].type) && isHanging(map, x)); P.threat = t ? { sq: t, type: map[t].type } : null; }
  setThinking(false); P.busy = false;
  renderPlayBoard({ from: mv.from, to: mv.to });
  if (checkOver()) return;
  startUserTurn();
}
function checkOver() {
  const g = P.game; if (!g.game_over()) return false;
  let res, why;
  if (g.in_checkmate()) { res = g.turn() === P.you ? "lost" : "won"; why = "Checkmate."; }
  else { res = "drawn"; why = g.in_stalemate() ? "Stalemate." : g.in_threefold_repetition() ? "Draw by repetition." : g.insufficient_material() ? "Draw. Not enough pieces left to checkmate." : "Draw."; }
  finishGame(res, why); return true;
}
function finishGame(res, why) {
  P.over = { res, why }; P.busy = false; setThinking(false);
  S.stats.played++; S.stats[res]++;
  const mine = P.hist.filter(h => !h.bot && h.r);
  P.over.count = { blunder: mine.filter(h => h.r.cls === "blunder").length, mistake: mine.filter(h => h.r.cls === "mistake").length, inaccuracy: mine.filter(h => h.r.cls === "inaccuracy").length };
  const avgLoss = mine.length ? mine.reduce((s, h) => s + Math.min(h.r.loss, 40), 0) / mine.length : 0;
  P.over.acc = Math.max(0, Math.min(100, Math.round(103.17 * Math.exp(-0.0435 * avgLoss) - 3.17)));
  const oldLevel = S.level;
  if (res === "won" && S.level < LEVELS.length - 1) S.level++;
  if (res === "lost" && S.level > 0) S.level--;
  if (S.level !== oldLevel) setTimeout(() => toast(`Next opponent: ${levelName(S.level).toLowerCase()}.`), 900);
  const slips = mine.filter(h => h.r.tags && h.r.tags.some(t => t === "hangs" || t === "fork" || t === "allows-mate")).length;
  if (S.threat.on) { S.threat.clean = slips ? 0 : S.threat.clean + 1; if (S.threat.clean >= 3) { S.threat.on = false; setTimeout(() => toast("You're catching threats yourself now. Threat warnings are off."), 4200); } }
  else if (slips >= 2) { S.threat.on = true; S.threat.clean = 0; setTimeout(() => toast("Threat warnings are back on for a bit."), 4200); }
  if (!S.plan.manual && S.plan.stage === 1) { S.plan.games++; if (S.plan.games >= 2) { S.plan.stage = 2; S.plan.streak = 0; setTimeout(() => toast("Next step: I'll quiz you on the plan before showing it."), 2600); } }
  save(); renderCoach(); renderPlan();
}
function gamePgn() {
  const g = new Chess(); for (const h of P.hist) g.move(h.move.san);
  g.header("Event", "Coach game", "Date", today().replace(/-/g, "."), "White", P.you === "w" ? "You" : "Stockfish", "Black", P.you === "b" ? "You" : "Stockfish", "Result", P.over ? (P.over.res === "drawn" ? "1/2-1/2" : (P.over.res === "won") === (P.you === "w") ? "1-0" : "0-1") : "*");
  return g.pgn();
}

function verdictHTML(r, label) {
  const c = CLS[r.cls];
  return `<div class="verdict">${c.nag ? `<span class="nag tone-${c.tone}" aria-hidden="true">${c.nag}</span>` : ""}<h2 class="tone-${c.tone}">${c.label}</h2><span class="mv">${esc(label)}</span></div>`;
}
function feedbackHTML(r) {
  let h = r.msg.slice(0, 1).map(m => `<p class="say enter">${bold(m)}</p>`).join("");
  if (r.better) h += `<p class="better enter">${bold(r.better)}</p>`;
  if (r.rule) h += `<p class="rule enter"><b>Rule:</b> ${esc(r.rule)}</p>`;
  return h;
}
function watchHTML(r) { return P.playing ? `<p class="watch" id="watch">${esc(r.show.caption)}</p>` : `<div><button class="link" data-act="watch">Replay the moves</button></div>`; }
function renderCoach() {
  const el = $("#coach"); if (!el) return;
  let h = "";
  const opp = COLOR[other(P.you)];
  if (ENGINE === "fail") {
    h = `<div class="card enter"><p class="status">The engine didn't start.</p><p class="say">Reload the page to try again.</p></div>`;
  } else if (P.over) {
    const o = P.over; const t = o.res === "won" ? "You won" : o.res === "lost" ? "You lost" : "Draw";
    const n = o.count.blunder + o.count.mistake;
    h = `<div class="card enter"><p class="status">${t}</p><p class="say">${esc(o.why)} ${n ? `${n} mistake${n > 1 ? "s" : ""} saved to Practice.` : "No big mistakes."}</p>
      <div class="actions"><button class="btn primary" data-act="new">Play again</button><button class="btn soft" data-act="review">Review</button></div></div>`;
  } else if (P.wait) {
    const r = P.wait.r;
    h = `<div class="card enter">${verdictHTML(r, P.mine.label)}${feedbackHTML(r)}${r.show ? watchHTML(r) : ""}
      <div class="actions"><button class="btn primary" data-act="retry">Try again</button><button class="btn soft" data-act="keep">Keep playing</button></div></div>`;
  } else {
    let turn = "", hintBtn = "";
    if (ENGINE === "loading" && P.game.turn() === P.you) turn = "Loading the engine…";
    else if (P.busy && !(P.mine && P.mine.pending)) turn = `${opp} is thinking…`;
    else if (P.mine && P.mine.pending) turn = "Checking your move…";
    else if (!P.busy && P.game.turn() === P.you) {
      const first = !P.hist.some(x => !x.bot);
      turn = P.retry ? "Find a better move." : "Your move.";
      if (P.oppMistake && !P.retry) turn = `<em class="tone-${CLS[P.oppMistake.cls].tone}">${CLS[P.oppMistake.cls].nag}</em> ${opp}'s <b>${esc(P.oppMistake.label)}</b> was a ${P.oppMistake.cls}.<span>Find the move that punishes it.</span>`;
      if (!P.oppMistake && !P.retry && P.threat && S.threat.on) turn += `<span class="tone-worse">Watch out: your ${NAME[P.threat.type]} on ${P.threat.sq} is under attack.</span>`;
      else if (!P.oppMistake && !P.retry && P.leftBookNow) turn += `<span>The opening is over. Now follow your plan below.</span>`;
      if (first && !P.retry) turn += P.you === "b" ? `<span>You're Black. Answer with <b>...c6</b>, the Caro-Kann.</span>` : `<span>You're White. Start with <b>d4</b>, then <b>c4</b>.</span>`;
      hintBtn = `<button class="pill" data-act="hint">${P.hintStep ? "More help" : "Hint"}</button>`;
    }
    if (turn) h += `<div class="turn"><p>${turn}</p>${hintBtn}</div>`;
    if (P.hintText) h += `<p class="say enter">${bold(P.hintText)}</p>`;
    if (!P.busy && P.game.turn() === P.you && !P.oppMistake && !(P.threat && S.threat.on)) h += planStripHTML();
    if (P.mine && P.mine.r) {
      const r = P.mine.r;
      h += `<div class="card enter">${r.punished ? `<p class="say"><b>You punished their mistake.</b></p>` : ""}${P.mine.retry && !["mistake", "blunder"].includes(r.cls) ? `<p class="say"><b>That's better.</b></p>` : ""}${verdictHTML(r, P.mine.label)}${feedbackHTML(r)}${r.show && P.playing ? watchHTML(r) : ""}</div>`;
    }
  }
  el.innerHTML = h;
}
function planInfo() {
  const map = boardMap(P.game); const hist = P.game.history({ verbose: true });
  const num = +P.game.fen().split(" ")[5];
  const goals = goalsFor(map, P.you, hist, num);
  const sid = detectStructure(map, P.you);
  const plan = sid ? PLANS[sid] : null;
  const steps = plan ? plan.steps.map(s => ({ ...s, done: s.check === "tip" ? null : runCheck(s.check, map, P.you, hist) })) : [];
  return { goals, sid, plan, steps };
}
function planStripHTML() {
  if (!P.hist.length || P.over) return "";
  const info = planInfo();
  const opp = COLOR[other(P.you)];
  if (planPending(info)) return `<button class="plan-strip ask" data-act="plan"><span class="dotring" aria-hidden="true"></span><span class="txt"><b>Quick question: what's your plan here?</b><span>Tap to answer.</span></span></button>`;
  if (info.plan && (S.plan.stage < 3 || P.plan.answered[info.sid])) {
    const next = info.steps.find(s => s.done === false) || info.steps[0];
    const pr = pressureOn(boardMap(P.game), info.plan.focus, P.you);
    return `<button class="plan-strip" data-act="plan"><span class="dotring" aria-hidden="true"></span><span class="txt"><b>Plan: ${esc(next.t)}</b><span>${esc(pressureText(pr, opp))}</span></span></button>`;
  }
  if (info.plan) return `<button class="plan-strip" data-act="plan"><span class="dotring" aria-hidden="true"></span><span class="txt"><b>What's your plan?</b><span>Tap to check it.</span></span></button>`;
  const g = info.goals.items.find(i => i.done === false) || info.goals.items.find(i => i.done === null);
  if (!g) return "";
  return `<button class="plan-strip" data-act="plan"><span class="dotring" aria-hidden="true"></span><span class="txt"><b>Goal: ${esc(g.t)}</b><span>The ringed ${g.id === "develop" ? "pieces still need to come out" : g.id === "castle" ? "king should castle soon" : "square is where to look"}.</span></span></button>`;
}
function planPending(info) { return info.sid && S.plan.stage >= 2 && !P.plan.answered[info.sid] && !P.over; }
function renderPlan() {
  const row = $("#plan-row"); if (row) row.hidden = true; return;
  if (!P.hist.length) { row.hidden = true; return; }
  row.hidden = false;
  const info = planInfo();
  let k, v, dots = "";
  if (planPending(info)) { k = "Quick question"; v = "What's your plan here?"; row.classList.add("ask"); }
  else {
    row.classList.remove("ask");
    if (info.plan) {
      const real = info.steps.filter(s => s.done !== null);
      const next = info.steps.find(s => s.done === false) || info.steps[info.steps.length - 1];
      k = "Your plan"; v = next.t;
      dots = real.map(s => `<i class="${s.done ? "on" : ""}"></i>`).join("");
    } else {
      const g = info.goals; const real = g.items.filter(i => i.done !== null);
      const next = real.find(i => !i.done) || g.items.find(i => i.done === null) || g.items[0];
      k = "Next goal"; v = next.t;
      dots = real.map(i => `<i class="${i.done ? "on" : ""}"></i>`).join("");
    }
  }
  row.innerHTML = `<span class="txt"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></span><svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
}
function checklistHTML(items) {
  return `<ul class="checklist">${items.map(i => `<li class="${i.done ? "done" : ""}"><span class="tick ${i.done ? "on" : i.done === null ? "tip" : ""}" aria-label="${i.done ? "Done" : i.done === null ? "Tip" : "Not yet"}"></span><span><b>${esc(i.t)}</b>${i.why ? `<small>${esc(i.why)}</small>` : ""}</span></li>`).join("")}</ul>`;
}
const STAGES = ["Show me", "Quiz me", "On my own"];
function openPlanSheet() {
  const info = planInfo();
  const pending = planPending(info);
  let h = "";
  if (info.plan && pending && S.plan.stage === 2) {
    const q = info.plan.quiz; const opts = [q.right, ...q.wrong].map((t, i) => ({ t, right: i === 0 })).sort(() => Math.random() - 0.5);
    h += `<h2>What's your plan?</h2><p class="lede">${esc(q.q)}</p><section><div class="choice" id="quiz">${opts.map(o => `<button class="opt" data-right="${o.right ? 1 : 0}"><span><b>${esc(o.t)}</b></span></button>`).join("")}</div><p class="say" id="quiz-why" hidden></p></section><div id="plan-after" hidden></div>`;
  } else if (info.plan && pending && S.plan.stage === 3) {
    h += `<h2>Make your plan</h2><p class="lede">Look at the pawns. Think of your next 2 or 3 steps, then check.</p>
      <section><div class="actions"><button class="btn primary wide" data-act="reveal-plan">Show the plan</button></div></section><div id="plan-after" hidden></div>`;
  }
  const planBody = info.plan ? `<section><h3>${esc(info.plan.name)}</h3><p class="sub">${esc(info.plan.look)}</p>${checklistHTML(info.steps)}</section>` : "";
  const goalsBody = `<section><h3>${info.goals.phase === "opening" ? "Opening goals" : info.goals.phase === "endgame" ? "Endgame goals" : "Middlegame goals"}</h3>${checklistHTML(info.goals.items)}</section>`;
  const habit = `<section><p class="habit"><b>Before every move:</b> look at checks, captures, and threats. Yours and your opponent's.</p></section>`;
  const stage = `<section><p class="sub">${S.plan.stage === 1 ? "Right now I show you the plan. Soon I'll quiz you, then you'll make your own." : S.plan.stage === 2 ? `I quiz you first now. ${Math.max(0, 4 - S.plan.streak)} more right in a row and you'll make your own plans.` : "You make the plan now, then check it."}</p></section>`;
  if (pending) h += `<div id="plan-hidden" hidden>${planBody}${goalsBody}</div>`;
  else h += `<h2>${info.plan ? "Your plan" : "Your goals"}</h2><p class="lede">${info.plan ? "Based on the pawns on the board right now." : "No special pawn structure yet. Follow the basics."}</p>${planBody}${goalsBody}`;
  h += habit + stage;
  openSheet(h, sh => {
    const reveal = () => { const a = sh.querySelector("#plan-after"); const hid = sh.querySelector("#plan-hidden"); if (a && hid) { a.innerHTML = hid.innerHTML; a.hidden = false; } P.plan.answered[info.sid] = true; renderPlan(); };
    sh.querySelectorAll("#quiz .opt").forEach(b => b.onclick = () => {
      if (sh.querySelector("#quiz").dataset.done) return; sh.querySelector("#quiz").dataset.done = 1;
      const right = b.dataset.right === "1";
      sh.querySelectorAll("#quiz .opt").forEach(x => x.classList.add(x.dataset.right === "1" ? "right" : (x === b ? "wrong" : "")));
      const w = sh.querySelector("#quiz-why"); w.hidden = false; w.innerHTML = `<b>${right ? "Right." : "Not quite."}</b> ${esc(info.plan.quiz.why)}`;
      if (!S.plan.manual) {
        S.plan.streak = right ? S.plan.streak + 1 : 0;
        if (S.plan.streak >= 4) { S.plan.stage = 3; S.plan.miss = 0; setTimeout(() => toast("You're ready. From now on, you make the plan and I check it."), 600); }
      }
      save(); reveal();
    });
    const rv = sh.querySelector('[data-act="reveal-plan"]');
    if (rv) rv.onclick = () => {
      reveal(); rv.parentElement.innerHTML = `<p class="sub">Did your plan match?</p><button class="btn primary" data-self="1">I had it</button><button class="btn soft" data-self="0">I missed it</button>`;
      sh.querySelectorAll("[data-self]").forEach(b => b.onclick = () => {
        const ok = b.dataset.self === "1";
        if (!S.plan.manual) { S.plan.miss = ok ? 0 : S.plan.miss + 1; if (S.plan.miss >= 2) { S.plan.stage = 2; S.plan.streak = 0; toast("Let's go back to quizzes for a bit."); } }
        save(); b.parentElement.innerHTML = `<p class="sub">${ok ? "Nice. Keep doing that every game." : "No problem. Read the plan above, then try it on the board."}</p>`;
      });
    };
  });
}

// ================= Settings + first run =================
function openingOptions(sel) {
  return ["caro", "qg"].map(k => `<button class="opt ${sel === k ? "on" : ""}" data-open="${k}"><img src="${PIECES[REPERTOIRE[k].you === "b" ? "bN" : "wN"]}" alt=""><span><b>${REPERTOIRE[k].name}</b><span>${esc(REPERTOIRE[k].blurb)}</span></span></button>`).join("");
}
function openChooser() {
  openSheet(`<div class="sheet-mark" aria-hidden="true">${LOGO_SVG.replace(/id="c"/, 'id="c2"').replace(/url\(#c\)/, "url(#c2)")}</div><h2>What do you want to get good at?</h2><p class="lede">Pick one. You can switch any time.</p><div class="choice">${openingOptions(null)}</div>`, sh => {
    sh.querySelectorAll("[data-open]").forEach(b => b.onclick = () => { S.opening = b.dataset.open; save(); closeSheet(); newGame(); });
  });
  SHEET_ONCLOSE = () => { if (!S.opening) { S.opening = "caro"; save(); newGame(); } };
}
function openSettings() {
  openSheet(`<h2>Settings</h2>
    <section><h3>Opening</h3><div class="choice">${openingOptions(S.opening)}</div></section>
    <section><h3>Opponent strength</h3><div class="stepper"><button class="btn" data-lv="-1" aria-label="Weaker">−</button><output id="lv">${levelName(S.level)}</output><button class="btn" data-lv="1" aria-label="Stronger">+</button></div><p class="sub">Goes up when you win, down when you lose.</p></section>`, sh => {
    sh.querySelectorAll("[data-open]").forEach(b => b.onclick = () => { const ch = S.opening !== b.dataset.open; S.opening = b.dataset.open; save(); closeSheet(); if (ch) newGame(); });
    sh.querySelectorAll("[data-lv]").forEach(b => b.onclick = () => { S.level = Math.max(0, Math.min(LEVELS.length - 1, S.level + +b.dataset.lv)); sh.querySelector("#lv").textContent = levelName(S.level); setTop(); save(); });
  });
}

// ================= PRACTICE =================
const PR = { queue: [], i: 0, card: null, state: "idle", res: null, wrongOnce: new Set(), right: 0, total: 0 };
let prBoard;
function startPractice() {
  const { due, fresh } = dueCards(); const L = dueLines();
  const lines = [...L.due.sort((a, b) => a.due - b.due).slice(0, 3), ...L.fresh].map(l => ({ kind: "line", id: l.id }));
  const cards = [...due, ...fresh].sort(() => Math.random() - 0.5).slice(0, 8);
  const q = [...lines, ...cards];
  Object.assign(PR, { queue: q, i: 0, state: "ask", res: null, wrongOnce: new Set(), right: 0, total: q.length, ld: null });
  loadCard();
}
function loadCard() {
  PR.card = PR.queue[PR.i]; PR.res = null; PR.hint = false; PR.ld = null;
  if (!PR.card) { PR.state = "done"; renderPractice(); return; }
  if (PR.card.kind === "line") { startLine(PR.card); return; }
  PR.state = "ask"; renderPractice();
}
// ---- Line drill: you play your moves, the coach plays the other side
function startLine(item) {
  const card = S.lines[item.id]; const R = REPERTOIRE[card.opening];
  const line = R.lines.find(l => l.name === card.name);
  PR.ld = { id: item.id, card, op: card.opening, name: card.name, moves: parsePgnText(line.pgn), i: 0, g: new Chess(), me: R.you, misses: 0, fix: null, learn: card.isNew && !item.test, test: !!item.test, flash: "", token: (PR.ldToken = (PR.ldToken || 0) + 1) };
  PR.state = "line"; renderPractice();
  setTimeout(lineAdvance, 500);
}
async function lineAdvance() {
  const ld = PR.ld; if (!ld) return; const tok = ld.token;
  while (ld.i < ld.moves.length && ld.g.turn() !== ld.me) {
    const fen = ld.g.fen(); const m = ld.g.move(ld.moves[ld.i].san); ld.i++;
    ld.last = { from: m.from, to: m.to }; ld.theirs = { label: moveLabel(fen, m.san), c: ld.moves[ld.i - 1].c };
    renderPractice({ from: m.from, to: m.to });
    await sleep(650);
    if (!PR.ld || PR.ld.token !== tok) return;
  }
  if (ld.i >= ld.moves.length) { lineDone(); return; }
  ld.waiting = true; renderPractice();
}
function onLineMove(m) {
  const ld = PR.ld; if (!ld || !ld.waiting) return;
  const want = ld.moves[ld.i]; const fen = ld.g.fen();
  const mv = ld.g.move(m); if (!mv) return;
  if (mv.san.replace(/[+#]/g, "") === want.san.replace(/[+#]/g, "")) {
    ld.i++; ld.waiting = false; ld.last = { from: mv.from, to: mv.to };
    ld.flash = ld.fix || ld.learn ? "" : "Right."; ld.fix = null;
    renderPractice({ from: mv.from, to: mv.to });
    setTimeout(lineAdvance, 350);
  } else {
    ld.g.undo();
    if (!ld.fix && !ld.learn) ld.misses++;
    ld.fix = { label: moveLabel(fen, want.san), c: want.c, tried: mv.san };
    ld.flash = ""; renderPractice();
  }
}
function lineDone() {
  const ld = PR.ld; const card = ld.card; ld.waiting = false; ld.done = true;
  if (ld.learn) {
    card.isNew = false; card.box = 0; card.due = Date.now(); S.newLines.n++;
    PR.queue.push({ kind: "line", id: ld.id, test: true });
  } else if (!PR.wrongOnce.has(ld.id)) {
    const ok = ld.misses === 0;
    card.box = ok ? Math.min(card.box + 1, INTERVALS.length - 1) : 1;
    card.due = Date.now() + INTERVALS[card.box] * DAY - 3600000;
    if (ok) PR.right++; else { PR.wrongOnce.add(ld.id); PR.queue.push({ kind: "line", id: ld.id, test: true }); }
  }
  save(); updateBadge(); renderPractice();
}
function renderLine(v, anim) {
  const ld = PR.ld;
  if (!v.querySelector(".live")) {
    v.innerHTML = `<div class="live"><div class="main"><div class="bar"><div class="who"><b id="pr-count"></b><span id="pr-side"></span></div><button class="icon-btn" id="pr-quit" aria-label="End session">${ICONS.close}</button></div><div id="pr-board"></div></div><div class="side"><div class="coach" id="pr-coach" aria-live="polite"></div></div></div>`;
    prBoard = new Board(v.querySelector("#pr-board"), { interactive: () => (PR.state === "ask") || (PR.state === "line" && PR.ld && PR.ld.waiting), onMove: m => PR.state === "line" ? onLineMove(m) : onPracticeMove(m) });
    v.querySelector("#pr-quit").onclick = () => { PR.state = "idle"; PR.ld = null; renderPractice(); };
  }
  v.querySelector("#pr-count").textContent = `${Math.min(PR.i + 1, PR.queue.length)} of ${PR.queue.length}`;
  v.querySelector("#pr-side").textContent = `${REPERTOIRE[ld.op].name}: ${ld.name}`;
  const want = ld.waiting ? ld.moves[ld.i] : null; const arrows = [];
  if (want && (ld.learn || ld.fix)) { const g2 = new Chess(ld.g.fen()); const w = g2.move(want.san); if (w) arrows.push({ from: w.from, to: w.to, kind: ld.fix ? "" : "plan" }); }
  prBoard.set({ fen: ld.g.fen(), orientation: ld.me, last: ld.last, check: kingSq(ld.g), arrows, animate: anim });
  const opp = COLOR[other(ld.me)];
  let h = "";
  if (ld.done) {
    const perfect = !ld.learn && ld.misses === 0;
    h += `<div class="card enter"><p class="status">${ld.learn ? "Line learned" : perfect ? "Perfect" : "Line done"}</p><p class="say">${ld.learn ? "Now try it from memory. It's coming up again at the end of this session." : perfect ? "You remembered every move. See you in a few days." : `${ld.misses} miss${ld.misses > 1 ? "es" : ""}. You'll play this line again at the end.`}</p>
      <div class="actions"><button class="btn primary" data-pr="next">Next</button></div></div>`;
  } else {
    const head = ld.learn ? "New line. Play the arrow moves and read why." : ld.test && ld.card.box === 0 ? "From memory now. No arrows." : "Play your moves from memory.";
    h += `<div class="turn"><p>${ld.waiting ? "Your move." : `${opp} is moving…`}<span>${head}</span></p></div>`;
    if (ld.flash) h += `<p class="say enter tone-good"><b>${ld.flash}</b></p>`;
    if (ld.fix) h += `<div class="card enter"><div class="verdict"><span class="nag tone-bad" aria-hidden="true">?</span><h2 class="tone-bad">Not this line's move</h2><span class="mv">You tried ${esc(ld.fix.tried)}</span></div><p class="say">Play <b>${esc(ld.fix.label)}</b>.${ld.fix.c ? " " + esc(ld.fix.c) : ""}</p></div>`;
    else if (want && ld.learn) h += `<div class="card enter"><p class="say">Play <b>${esc(moveLabel(ld.g.fen(), want.san))}</b>.${want.c ? " " + esc(want.c) : ""}</p></div>`;
    else if (ld.theirs && ld.theirs.c && ld.learn) h += `<p class="better">${opp} played <b>${esc(ld.theirs.label)}</b>. ${esc(ld.theirs.c)}</p>`;
  }
  const co = v.querySelector("#pr-coach"); co.innerHTML = h;
  co.querySelectorAll("[data-pr]").forEach(b => b.onclick = () => { if (b.dataset.pr === "next") { PR.i++; loadCard(); } });
}
async function onPracticeMove(m) {
  if (PR.state !== "ask") return;
  const c = PR.card; const g = new Chess(c.fen); const mv = g.move(m); if (!mv) return;
  PR.state = "grading"; PR.last = { from: mv.from, to: mv.to };
  renderPractice({ from: mv.from, to: mv.to }, g.fen());
  let ok = c.accept.includes(mv.san), note = "";
  if (!ok && c.top && c.top.some(t => t.uci === moveUci(mv) && t.cp >= c.bestCp - 40)) ok = true;
  if (!ok) {
    try {
      const me = new Chess(c.fen).turn();
      const best = c.bestCp != null ? c.bestCp : toCp((await analyze(c.fen, "depth 13 movetime 700", 1)).lines[0].score);
      const a = await analyze(g.fen(), "depth 13 movetime 700", 1);
      const loss = winPct(best) - winPct(-toCp(a.lines[0].score));
      if (loss < 4) { ok = true; note = c.kind === "concept" ? "That works too. The idea here, though, is:" : "That works too."; }
    } catch (e) { }
  }
  PR.res = { ok, san: mv.san, note }; PR.afterFen = g.fen();
  gradeCard(c, ok);
  PR.state = "answered"; renderPractice();
}
function gradeCard(c, ok) {
  const first = !PR.wrongOnce.has(c.id);
  if (!first) return;
  if (ok) PR.right++; else { PR.wrongOnce.add(c.id); PR.queue.push(c); }
  schedule(S.deck[c.id] || c, ok);
}
function renderPractice(anim, fenOverride) {
  const v = $("#view-practice");
  if (PR.state === "line" && PR.ld) { renderLine(v, anim); return; }
  if (PR.state === "idle" || PR.state === "done") {
    const L = dueLines(); const count = dueCards().count + L.count;
    const done = PR.state === "done";
    v.innerHTML = `<div class="hero"><span class="big">${done ? (PR.total ? `${PR.right}/${PR.total}` : "0") : count}</span>
      <h2 class="status">${done ? "Session done" : count ? "to practice today" : "All caught up"}</h2>
      <p>${done ? `${nextDueText() || "Come back tomorrow."} Short sessions every day beat long ones once a week.` : count ? "Your opening lines first, then ideas and mistakes from your games." : `${nextDueText() || ""} Play a game. Your mistakes become new practice.`}</p>
      <div class="meter" aria-label="Opening lines learned"><i style="width:${Math.round(L.learned / Math.max(1, L.total) * 100)}%"></i></div>
      <p class="sub">${L.learned} of ${L.total} opening lines learned</p></div>
      <div class="actions">${count && !done ? `<button class="btn primary wide" id="pr-start">Start practice</button>` : done && count ? `<button class="btn primary wide" id="pr-start">Keep going (${count} left)</button>` : `<button class="btn primary wide" id="pr-play">Play a game</button>`}</div>`;
    const st = v.querySelector("#pr-start"); if (st) st.onclick = startPractice;
    const pl = v.querySelector("#pr-play"); if (pl) pl.onclick = () => { location.hash = "#play"; };
    return;
  }
  const c = PR.card; const turn = c.fen.split(" ")[1];
  if (v.querySelector(".live") && !prBoard) v.innerHTML = "";
  if (!v.querySelector(".live")) {
    v.innerHTML = `<div class="live"><div class="main"><div class="bar"><div class="who"><b id="pr-count"></b><span id="pr-side"></span></div><button class="icon-btn" id="pr-quit" aria-label="End session">${ICONS.close}</button></div><div id="pr-board"></div></div><div class="side"><div class="coach" id="pr-coach" aria-live="polite"></div></div></div>`;
    prBoard = new Board(v.querySelector("#pr-board"), { interactive: () => (PR.state === "ask") || (PR.state === "line" && PR.ld && PR.ld.waiting), onMove: m => PR.state === "line" ? onLineMove(m) : onPracticeMove(m) });
    v.querySelector("#pr-quit").onclick = () => { PR.state = "idle"; renderPractice(); };
  }
  v.querySelector("#pr-count").textContent = `${Math.min(PR.i + 1, PR.queue.length)} of ${PR.queue.length}`;
  v.querySelector("#pr-side").textContent = `${turn === "w" ? "White" : "Black"} to move`;
  const arrows = []; let fen = c.fen, last = null;
  if (PR.state === "grading") { fen = fenOverride; last = PR.last; }
  if (PR.state === "answered") {
    if (PR.res.ok) { fen = PR.afterFen; last = PR.last; }
    else { const g = new Chess(c.fen); const b = g.move(c.accept[0]); if (b) arrows.push({ from: b.from, to: b.to }); }
  }
  prBoard.set({ fen, orientation: turn, last, arrows, animate: anim });
  const co = v.querySelector("#pr-coach");
  let h = "";
  if (c.kind === "concept") h += `<p class="sub">${esc(REPERTOIRE[c.opening].name)}: ${esc(c.title)}</p>`;
  h += `<p class="prompt">${esc(c.prompt)}</p>`;
  if (PR.state === "ask") {
    h += PR.hint ? `<p class="say enter">${esc(c.kind === "concept" ? c.principle : c.why || "Check every capture and every check first.")}</p>` : "";
    h += `<div class="actions">${PR.hint ? "" : `<button class="btn soft" data-pr="hint">Hint</button>`}<button class="btn soft" data-pr="skip">Show answer</button></div>`;
  } else if (PR.state === "grading") h += `<p class="status">Checking…</p>`;
  else {
    const ok = PR.res.ok;
    h += `<div class="verdict enter">${ok ? `<span class="nag tone-good" aria-hidden="true">!</span>` : `<span class="nag tone-bad" aria-hidden="true">?</span>`}<div><h2 class="tone-${ok ? "good" : "bad"}">${ok ? "Correct" : PR.res.san ? "Not quite" : "Here's the answer"}</h2>${PR.res.san ? `<span class="mv">You played ${esc(PR.res.san)}</span>` : ""}</div></div>`;
    if (PR.res.note) h += `<p class="say">${esc(PR.res.note)}</p>`;
    h += `<p class="say enter">${bold(c.answer)}</p>`;
    if (c.kind === "concept") h += `<p class="say enter">${esc(c.why)}</p>`; else if (c.why && !ok) h += `<p class="say enter">${bold(c.why)}</p>`;
    if (!ok && PR.wrongOnce.has(c.id)) h += `<p class="sub">You'll get this one again at the end.</p>`;
    h += `<div class="actions"><button class="btn primary" data-pr="next">Next</button></div>`;
  }
  co.innerHTML = h;
  co.querySelectorAll("[data-pr]").forEach(b => b.onclick = () => {
    const a = b.dataset.pr;
    if (a === "hint") { PR.hint = true; renderPractice(); }
    if (a === "skip") { PR.res = { ok: false, san: null }; gradeCard(c, false); PR.state = "answered"; renderPractice(); }
    if (a === "next") { PR.i++; loadCard(); }
  });
}

// ================= REVIEW =================
const RV = { playing: false, replayId: 0, mode: "import", g: null, fens: [], moves: [], A: [], R: [], you: "w", idx: 0, key: [], k: 0, kState: "ask", kRes: null, opening: null, headers: {}, run: 0 };
let rvBoard;
const EXAMPLE_PGN = `[Event "Example game"]\n[White "Opponent"]\n[Black "You"]\n[Result "1-0"]\n\n1. e4 c6 2. d4 d5 3. e5 e6 4. Nf3 c5 5. c3 Nc6 6. Be2 Qb6 7. O-O Bd7 8. Na3 cxd4 9. cxd4 Bd6 10. exd6 Nf6 11. Nb5 O-O 12. Bf4 1-0`;
function cleanPgn(t) {
  return t.replace(/\r/g, "").replace(/\{[^}]*\}/g, " ").replace(/\$\d+/g, " ").replace(/\([^()]*\)/g, " ").replace(/\d+\.\.\./g, " ").replace(/[ \t]+/g, " ");
}
function splitPgns(t) { return t.split(/\n\s*\n(?=\[Event )/).map(s => s.trim()).filter(Boolean); }
function parseGame(pgn) {
  const g = new Chess(); const ok = g.load_pgn(cleanPgn(pgn), { sloppy: true });
  if (!ok) return null; const h = g.header();
  return { g, headers: h, pgn };
}
function importText(text) {
  const games = splitPgns(text).map(parseGame).filter(Boolean);
  if (!games.length) return null;
  for (const x of games.slice().reverse()) {
    const id = (x.headers.Link || x.headers.Site || "") + (x.headers.Date || "") + (x.headers.White || "") + (x.headers.Black || "") + x.g.history().slice(0, 12).join("");
    if (!S.games.some(s => s.id === id)) S.games.unshift({ id, pgn: x.pgn, white: x.headers.White || "White", black: x.headers.Black || "Black", result: x.headers.Result || "*", date: x.headers.Date || "", added: Date.now() });
  }
  S.games = S.games.slice(0, 12); save();
  return games[0];
}
function guessSide(h) {
  const u = (S.username || "").trim().toLowerCase();
  if (u && (h.White || "").toLowerCase() === u) return "w";
  if (u && (h.Black || "").toLowerCase() === u) return "b";
  if ((h.White || "") === "You") return "w";
  if ((h.Black || "") === "You") return "b";
  return null;
}
function openingOf(moves, you) {
  const s = moves.slice(0, 3).map(m => m.san);
  if (you === "b" && s[0] === "e4" && s[1] === "c6") return "caro";
  if (you === "w" && s[0] === "d4" && s[1] === "d5" && s[2] === "c4") return "qg";
  return null;
}
async function startReview(parsed, side) {
  const run = ++RV.run;
  RV.headers = parsed.headers; RV.pgn = parsed.pgn;
  const moves = parsed.g.history({ verbose: true });
  const g = new Chess(); const fens = [g.fen()];
  for (const m of moves) { g.move(m.san); fens.push(g.fen()); }
  Object.assign(RV, { mode: "running", moves, fens, A: [], R: [], you: side, idx: moves.length, key: [], k: 0, kState: "ask", opening: openingOf(moves, side) });
  renderReview();
  for (let i = 0; i < fens.length; i++) {
    if (RV.run !== run) return;
    try { RV.A[i] = await analyze(fens[i], "depth 12 movetime 280", 1); } catch (e) { RV.mode = "error"; renderReview(); return; }
    const p = $("#rv-progress"); if (p) p.style.width = ((i + 1) / fens.length * 100).toFixed(1) + "%";
    const t = $("#rv-progress-text"); if (t) t.textContent = `Checking move ${Math.ceil((i + 1) / 2)} of ${Math.ceil(fens.length / 2)}…`;
  }
  let added = 0;
  for (let i = 0; i < moves.length; i++) {
    const me = moves[i].color;
    RV.R[i] = explainMove({ fenBefore: fens[i], move: moves[i], me, before: RV.A[i], after: RV.A[i + 1], opening: me === side ? RV.opening : null, history: moves.slice(0, i), book: me === side && RV.opening ? bookAt(RV.opening, fens[i]) : [] });
    if (me === side && ["mistake", "blunder"].includes(RV.R[i].cls)) {
      RV.key.push(i);
      if (addMistakeCard(fens[i], moves[i], RV.R[i], RV.A[i], "review", moveLabel(fens[i], moves[i].san))) added++;
    }
  }
  RV.key = RV.key.sort((a, b) => RV.R[b].loss - RV.R[a].loss).slice(0, 5).sort((a, b) => a - b);
  RV.added = added; RV.mode = "done"; RV.k = 0; RV.kState = RV.key.length ? "ask" : "browse";
  RV.idx = RV.key.length ? RV.key[0] : moves.length;
  renderReview();
}
function reviewSummary() {
  const mine = RV.R.map((r, i) => ({ r, i })).filter(x => RV.moves[x.i].color === RV.you);
  const n = c => mine.filter(x => x.r.cls === c).length;
  const parts = []; if (n("blunder")) parts.push(`${n("blunder")} blunder${n("blunder") > 1 ? "s" : ""}`); if (n("mistake")) parts.push(`${n("mistake")} mistake${n("mistake") > 1 ? "s" : ""}`); if (n("inaccuracy")) parts.push(`${n("inaccuracy")} inaccurac${n("inaccuracy") > 1 ? "ies" : "y"}`);
  let open = "";
  if (RV.opening) {
    let left = null;
    for (const x of mine) { const b = bookAt(RV.opening, RV.fens[x.i]); if (!b.length) break; if (!b.some(bb => bb.san === RV.moves[x.i].san)) { left = { x, b }; break; } }
    const name = REPERTOIRE[RV.opening].name;
    open = left ? `You left the ${name} repertoire with ${moveLabel(RV.fens[left.x.i], RV.moves[left.x.i].san)}. The repertoire move was ${moveLabel(RV.fens[left.x.i], left.b.sort((a, c) => c.weight - a.weight)[0].san)}.` : `You stayed in the ${name} repertoire the whole way through the opening.`;
  } else open = "This game wasn't a Caro-Kann or Queen's Gambit, so there's no repertoire check.";
  return `<p class="say">You played ${RV.you === "w" ? "White" : "Black"}${RV.headers[RV.you === "w" ? "Black" : "White"] ? " against " + esc(RV.headers[RV.you === "w" ? "Black" : "White"]) : ""}. ${parts.length ? "You made " + parts.join(", ") + "." : "No big mistakes."}</p><p class="say">${bold(open)}</p>`;
}
function graphSVG() {
  const n = RV.fens.length; if (n < 2) return "";
  const W = 600, H = 64;
  const ys = RV.A.map((a, i) => { const stm = RV.fens[i].split(" ")[1]; const cpW = (stm === "w" ? 1 : -1) * toCp(a.lines[0].score); const cpMe = RV.you === "w" ? cpW : -cpW; return H - winPct(cpMe) / 100 * H; });
  const x = i => i / (n - 1) * W;
  let d = `M0,${H} ` + ys.map((y, i) => `L${x(i).toFixed(1)},${y.toFixed(1)}`).join(" ") + ` L${W},${H} Z`;
  const dots = RV.R.map((r, i) => (RV.moves[i].color === RV.you && (r.cls === "blunder" || r.cls === "mistake")) ? `<circle class="${r.cls === "blunder" ? "bad" : "mis"}" cx="${x(i + 1).toFixed(1)}" cy="${ys[i + 1].toFixed(1)}" r="5"/>` : "").join("");
  return `<svg class="graph" id="rv-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Your winning chances through the game"><path class="area" d="${d}"/><line class="mid" x1="0" x2="${W}" y1="${H / 2}" y2="${H / 2}"/><line class="now" x1="${x(RV.idx)}" x2="${x(RV.idx)}" y1="0" y2="${H}"/>${dots}</svg>`;
}
function renderReview(anim) {
  const v = $("#view-review");
  if (RV.mode === "import" || RV.mode === "side" || RV.mode === "error") {
    v.querySelector(".live") && (rvBoard = null);
    const recent = S.games.slice(0, 6);
    v.innerHTML = `<div class="hero"><h2 class="status">Review a game</h2><p>I'll find your biggest mistakes and let you find the better move.</p></div>
      ${RV.mode === "side" ? `<p class="prompt">Which one is you?</p><div class="actions"><button class="btn soft" data-side="w">${esc(RV.pending.headers.White || "White")}</button><button class="btn soft" data-side="b">${esc(RV.pending.headers.Black || "Black")}</button></div>` : `
      <ol class="steps"><li>Open the game on <b>chess.com</b></li><li>Tap <b>Share</b>, then <b>PGN</b>, then <b>Copy</b></li><li>Paste it here</li></ol>
      <textarea id="rv-paste" rows="5" placeholder="Paste the game here"></textarea>
      ${RV.mode === "error" ? `<p class="say tone-worse">That didn't look like a game. Copy the PGN from chess.com and paste it again.</p>` : ""}
      <div class="actions"><button class="btn primary" id="rv-go">Review game</button></div><div><button class="link" id="rv-example">No game handy? Try an example</button></div>`}
      ${recent.length && RV.mode !== "side" ? `<section class="list" aria-label="Recent games">${recent.map((x, i) => `<button data-recent="${i}"><b>${esc(x.white)} vs ${esc(x.black)}</b><span>${esc(x.result)} ${esc(x.date)}</span></button>`).join("")}</section>` : ""}`;
    const go = v.querySelector("#rv-go");
    const begin = parsed => { if (!parsed) { RV.mode = "error"; renderReview(); return; } const side = guessSide(parsed.headers); RV.pending = parsed; if (side) startReview(parsed, side); else { RV.mode = "side"; renderReview(); } };
    if (go) go.onclick = () => begin(importText(v.querySelector("#rv-paste").value));
    const ex = v.querySelector("#rv-example"); if (ex) ex.onclick = () => begin(parseGame(EXAMPLE_PGN));
    v.querySelectorAll("[data-recent]").forEach(b => b.onclick = () => begin(parseGame(S.games[+b.dataset.recent].pgn)));
    v.querySelectorAll("[data-side]").forEach(b => b.onclick = () => { const nm = RV.pending.headers[b.dataset.side === "w" ? "White" : "Black"]; if (nm && nm !== "You" && !/^(white|black|opponent|\?)$/i.test(nm)) { S.username = nm; save(); } startReview(RV.pending, b.dataset.side); });
    return;
  }
  if (RV.mode === "running") {
    v.innerHTML = `<div class="hero"><h2 class="status">Reviewing your game</h2><p id="rv-progress-text">Starting the engine…</p></div><div class="progress"><i id="rv-progress"></i></div>`;
    return;
  }
  // done
  if (!v.querySelector(".live")) {
    v.innerHTML = `<div class="live"><div class="main"><div class="bar"><div class="who"><b id="rv-sub"></b></div><button class="icon-btn" id="rv-close" aria-label="Review another game">${ICONS.close}</button></div><div id="rv-board"></div><div id="rv-graph-wrap"></div></div><div class="side"><div class="coach" id="rv-coach" aria-live="polite"></div></div></div>`;
    rvBoard = new Board(v.querySelector("#rv-board"), { interactive: () => !RV.playing && RV.kState === "ask" && RV.key.length && RV.k < RV.key.length, onMove: m => onReviewMove(m) });
    v.querySelector("#rv-close").onclick = () => { RV.mode = "import"; RV.run++; RV.replayId++; RV.playing = false; renderReview(); };
  }
  const i = RV.idx;
  const inKey = RV.kState !== "browse" && RV.k < RV.key.length;
  v.querySelector("#rv-sub").textContent = inKey ? `Key moment ${RV.k + 1} of ${RV.key.length}` : "All moves";
  v.querySelector("#rv-graph-wrap").innerHTML = inKey ? "" : graphSVG();
  const gr = v.querySelector("#rv-graph"); if (gr) gr.onclick = e => { const r = gr.getBoundingClientRect(); RV.kState = "browse"; RV.idx = Math.round((e.clientX - r.left) / r.width * (RV.fens.length - 1)); renderReview(); };
  const co = v.querySelector("#rv-coach");
  let h = "";
  if (inKey) {
    const ki = RV.key[RV.k]; const m = RV.moves[ki]; const r = RV.R[ki];
    const label = moveLabel(RV.fens[ki], m.san);
    if (RV.k === 0 && RV.kState === "ask") h += reviewSummary();
    if (RV.kState === "ask") {
      rvBoard.set({ fen: RV.fens[ki], orientation: RV.you, last: ki > 0 ? { from: RV.moves[ki - 1].from, to: RV.moves[ki - 1].to } : null });
      h += `<p class="prompt">You played <b>${esc(label)}</b> here. Find a better move.</p><div class="actions"><button class="btn soft" data-rv="reveal">Show answer</button></div>`;
    } else {
      const res = RV.kRes;
      const b = uciObj(r.bestUci);
      if (!RV.playing) rvBoard.set({ fen: RV.fens[ki], orientation: RV.you, arrows: [{ from: b.from, to: b.to }, { from: m.from, to: m.to, kind: "bad" }], animate: null });
      const head = res && res.ok ? `<div class="verdict"><span class="nag tone-good" aria-hidden="true">!</span><h2 class="tone-good">You found it</h2><span class="mv">${esc(res.san)}</span></div>` : res && res.san ? `<div class="verdict"><span class="nag tone-bad" aria-hidden="true">?</span><h2 class="tone-bad">Not quite</h2><span class="mv">You tried ${esc(res.san)}</span></div>` : verdictHTML(r, label);
      h += `<div class="card enter">${head}${feedbackHTML(r)}${RV.playing ? `<p class="watch" id="rv-watch">${esc(r.show.caption)}</p>` : (r.show ? `<div><button class="link" data-rv="watch">Replay the moves</button></div>` : "")}
        <div class="actions"><button class="btn primary" data-rv="next">${RV.k + 1 < RV.key.length ? "Next moment" : "See the whole game"}</button></div></div>`;
    }
  } else {
    if (!RV.key.length && RV.kState === "browse" && !RV.browsed) h += reviewSummary();
    if (RV.added) h += `<p class="sub">${RV.added} position${RV.added > 1 ? "s" : ""} added to Practice.</p>`;
    const last = i > 0 ? RV.moves[i - 1] : null;
    const arrows = [];
    let pun = null;
    if (last) {
      const r = RV.R[i - 1];
      if (last.color === RV.you && ["inaccuracy", "mistake", "blunder"].includes(r.cls) && r.bestUci) { const b = uciObj(r.bestUci); arrows.push({ from: b.from, to: b.to }); }
      if (last.color !== RV.you && ["mistake", "blunder"].includes(r.cls) && RV.A[i] && RV.A[i].lines[0].pv[0]) { pun = pvToSan(RV.fens[i], RV.A[i].lines[0].pv, 1)[0]; if (pun) arrows.push({ from: pun.from, to: pun.to }); }
    }
    rvBoard.set({ fen: RV.fens[i], orientation: RV.you, last: last ? { from: last.from, to: last.to } : null, arrows, animate: anim });
    if (last) {
      const r = RV.R[i - 1];
      if (last.color === RV.you) h += verdictHTML(r, moveLabel(RV.fens[i - 1], last.san)) + feedbackHTML(r);
      else if (pun) { const c = CLS[r.cls]; h += `<div class="card enter"><div class="verdict"><span class="nag tone-${c.tone}" aria-hidden="true">${c.nag}</span><h2 class="tone-${c.tone}">${last.color === "w" ? "White" : "Black"}'s ${r.cls}</h2><span class="mv">${esc(moveLabel(RV.fens[i - 1], last.san))}</span></div><p class="say">You could punish it with <b>${esc(pun.san)}</b>.</p></div>`; }
      else h += `<p class="theirs">${last.color === "w" ? "White" : "Black"} played <b>${esc(moveLabel(RV.fens[i - 1], last.san))}</b>.</p>`;
    } else h += `<p class="sub">Starting position.</p>`;
    h += `<div class="nav"><button class="btn" data-rv="first" aria-label="First move">«</button><button class="btn" data-rv="prev" aria-label="Previous move">‹</button><button class="btn" data-rv="nextmv" aria-label="Next move">›</button><button class="btn" data-rv="last" aria-label="Last move">»</button></div>`;
    h += `<div class="moves" aria-label="Moves">${RV.moves.map((m, j) => { const mark = (m.color === RV.you || ["mistake", "blunder"].includes(RV.R[j].cls)) ? CLS[RV.R[j].cls].nag : ""; return `${m.color === "w" ? `<span class="n">${Math.floor(j / 2) + 1}.</span>` : ""}<button data-mv="${j + 1}" class="${j + 1 === i ? "on" : ""}">${esc(m.san)}${mark ? `<span class="tone-${CLS[RV.R[j].cls].tone}">${mark}</span>` : ""}</button>`; }).join("")}</div>`;
  }
  co.innerHTML = h;
  co.querySelectorAll("[data-rv]").forEach(b => b.onclick = () => {
    const a = b.dataset.rv;
    if (a === "reveal") { RV.kRes = null; RV.kState = "shown"; renderReview(); replayReview(); }
    if (a === "next") { RV.replayId++; RV.playing = false; RV.k++; RV.kState = RV.k < RV.key.length ? "ask" : "browse"; RV.browsed = RV.k >= RV.key.length; RV.idx = RV.k < RV.key.length ? RV.key[RV.k] : RV.moves.length; renderReview(); }
    if (a === "watch") replayReview();
    if (a === "first") RV.idx = 0; if (a === "prev") RV.idx = Math.max(0, RV.idx - 1); if (a === "nextmv") RV.idx = Math.min(RV.moves.length, RV.idx + 1); if (a === "last") RV.idx = RV.moves.length;
    if (["first", "prev", "nextmv", "last"].includes(a)) { RV.browsed = true; renderReview(a === "nextmv" && RV.idx > 0 ? { from: RV.moves[RV.idx - 1].from, to: RV.moves[RV.idx - 1].to } : null); }
  });
  co.querySelectorAll("[data-mv]").forEach(b => b.onclick = () => { RV.idx = +b.dataset.mv; RV.browsed = true; renderReview(); });
}
async function replayReview() {
  const ki = RV.key[RV.k]; const r = RV.R[ki]; if (!r || !r.show) return;
  const id = ++RV.replayId; RV.playing = true; renderReview();
  const showGame = { fen: RV.fens[ki], pv: [moveUci(RV.moves[ki]), ...(r.show.fen === r.fenAfter ? r.show.pv : [])], caption: "In your game:" };
  const sh = r.show.fen === r.fenAfter ? showGame : r.show;
  await playLine(rvBoard, sh, RV.you, label => { const w = $("#rv-watch"); if (w) w.innerHTML = `${esc(sh.caption)} <b>${esc(label)}</b>`; }, () => RV.replayId !== id);
  if (RV.replayId !== id) return;
  RV.playing = false; renderReview();
}
async function onReviewMove(m) {
  const ki = RV.key[RV.k]; const fen = RV.fens[ki]; const g = new Chess(fen); const mv = g.move(m); if (!mv) return;
  RV.kState = "grading";
  rvBoard.set({ fen: g.fen(), orientation: RV.you, last: { from: mv.from, to: mv.to } });
  $("#rv-coach").innerHTML = `<p class="status">Checking…</p>`;
  let ok = moveUci(mv) === RV.R[ki].bestUci;
  if (!ok) { try { const a = await analyze(g.fen(), "depth 13 movetime 700", 1); ok = winPct(RV.R[ki].bestCp) - winPct(-toCp(a.lines[0].score)) < 4; } catch (e) { } }
  RV.kRes = { ok, san: mv.san }; RV.kState = "shown"; setTimeout(replayReview, 900);
  const card = S.deck["m:" + fenKey(fen)]; if (card && ok) { card.box = 1; card.due = Date.now() + 3 * DAY; save(); updateBadge(); }
  renderReview();
}

// ================= Boot =================
const ICONS = {
  close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
};
function wire() {
  playBoard = new Board($("#play-board"), { interactive: canUserMove, onMove: (m, d) => onUserMove(m, d) });
  $("#coach").addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act;
    if (a === "plan") openPlanSheet();
    if (a === "retry") tryAgain(); if (a === "show") showBetter(); if (a === "keep") keepPlaying(); if (a === "hint") giveHint();
    if (a === "new") newGame();
    if (a === "review") { const parsed = parseGame(gamePgn()); location.hash = "#review"; startReview(parsed, P.you); }
    if (a === "watch") { const r = (P.wait || P.mine || {}).r; if (r && !P.busy) replayPlay(r); }
  });
  $("#plan-row").onclick = openPlanSheet;
  $("#open-settings").onclick = openSettings;
  $("#restart").onclick = () => { closeSheet(); newGame(); };
  $("#scrim").onclick = closeSheet;
  $("#sheet").addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "new") { closeSheet(); newGame(); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#sheet").classList.contains("on")) closeSheet(); });
  document.querySelectorAll(".tab").forEach(t => t.onclick = () => { location.hash = "#" + t.dataset.v; });
  window.addEventListener("hashchange", () => showView(currentView()));
}
function boot() {
  seedConcepts(); seedLines(); save();
  wire(); updateBadge(); showView(currentView());
  if (!S.opening) { P.opening = "caro"; P.you = "b"; renderPlayBoard(); renderCoach(); openChooser(); }
  else newGame();
  connectPlatform();
}
