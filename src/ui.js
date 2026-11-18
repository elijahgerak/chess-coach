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
const DEFAULT = { opening: "caro", level: 3, stats: { played: 0, won: 0, drawn: 0, lost: 0 }, games: [], username: "", threat: { on: true, clean: 0 }, guide: { stage: 1, streak: 0 }, learn: {}, sound: true };
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
      S.opening = "caro"; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
      updateBadge(); if (currentView() === "learn") renderLearn();
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

// ================= Spacing =================
const INTERVALS = [0, 1, 3, 7, 16, 35];
function today() { return new Date().toISOString().slice(0, 10); }

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
  const inLevel = v === "learn" && LS.view === "level" && LS.lv;
  const T = inLevel ? [LS.lv.title, LS.refresh ? "Quick refresh" : `Level ${PATH.indexOf(LS.lv) + 1} of ${PATH.length}`] : { learn: ["Caro-Kann", "Learn the moves"], play: ["Stockfish", levelName(S.level)], review: ["Review", "Your chess.com games"] }[v] || ["Caro-Kann", "Learn the moves"];
  $("#top-title").textContent = T[0]; $("#top-sub").textContent = T[1];
  $("#restart").hidden = v !== "play"; $("#open-settings").hidden = v === "review" || inLevel;
}
function currentView() { return (location.hash || "#learn").slice(1); }
function showView(v) {
  if (!["learn", "play", "review"].includes(v)) v = "learn";
  document.querySelectorAll(".view").forEach(x => x.classList.toggle("on", x.id === "view-" + v));
  document.querySelectorAll(".tab").forEach(x => { x.classList.toggle("on", x.dataset.v === v); x.setAttribute("aria-current", x.dataset.v === v ? "page" : "false"); });
  if (v === "learn") renderLearn();
  if (v === "play" && !P.hist.length && !P.busy && !P.over && P.gid === 0) newGame();
  if (v === "review") renderReview();
  setTop(); window.scrollTo(0, 0);
}

// ================= PLAY =================
// You always try first. The card gives the idea (at help level 1), and a Hint button adds more
// one step at a time: idea, then which piece, then the move. Threats are asked, not told.
const P = { game: new Chess(), hist: [], you: "b", opening: "caro", gid: 0, busy: false, over: null, wait: null, retry: null, pre: null, prePromise: null, preFen: null, last: null, mine: null, theirs: null, arrows: [], marks: {}, playing: false, replayId: 0, lastAfterCp: null, oppMistake: null, threat: null, wasInBook: true, leftBookNow: false, suggest: null, revealed: false, helpStep: 0, threatQ: null, found: 0, total: 0 };
let playBoard;
const HELP = ["", "Idea first", "Off"];

function canUserMove() { return ENGINE === "ok" && !P.busy && !P.over && !P.wait && !P.playing && P.game.turn() === P.you; }
function myTurnIdle() { return P.game.turn() === P.you && !P.busy && !P.wait && !P.playing && !P.over; }
function kingSq(g) { if (!g.in_check()) return null; const m = boardMap(g); return Object.keys(m).find(s => m[s].type === "k" && m[s].color === g.turn()); }
if (!S.guide || S.guide.stage > 2) S.guide = { stage: S.guide && S.guide.stage > 2 ? 2 : 1, streak: 0 };

// ---- The suggested move, in words a beginner can follow
function shortComment(c) {
  // Split on real sentence ends (not the dots in "...d5"), keep it to about one line
  const parts = String(c || "").split(/(?<=[a-z0-9)][.!?])\s+(?=[A-Z(])/);
  let out = ""; for (const s of parts) { out += (out ? " " : "") + s; if (out.length >= 40) break; }
  return out.trim();
}
function whyFor(fen, m) {
  const rule = principleFor(fen, m, P.you);
  if (m.captured && rule) return rule;
  const idea = shortIdea(fen, m);
  if (idea && !m.captured) return "This " + idea + ".";
  if (rule) return rule;
  const info = planInfo(); const next = info.plan && info.steps.find(s => s.done === false);
  return next ? `Your plan here: ${next.t}` : "It's the engine's top choice here.";
}
function describeTheirs(m, who) {
  if (m.flags.includes("k") || m.flags.includes("q")) return `${who} castled.`;
  if (m.captured) return `${who} took your ${NAME[m.captured]} on ${m.to} with their ${NAME[m.piece]}.`;
  return `${who} moved their ${NAME[m.piece]} to ${m.to}.`;
}
function describeMove(m) {
  if (m.flags.includes("k") || m.flags.includes("q")) return `Castle: move your king to ${m.to}.`;
  const promo = m.promotion ? " Make it a queen." : "";
  if (m.captured) return `Take the ${NAME[m.captured]} on ${m.to} with your ${NAME[m.piece]}.${promo}`;
  return `Move your ${NAME[m.piece]} from ${m.from} to ${m.to}.${promo}`;
}
function makeSuggest(fen, lines) {
  const g = new Chess(fen);
  const book = bookAt(P.opening, fen);
  if (book.length && !P.oppMistake) {
    const b = book.slice().sort((x, y) => y.weight - x.weight)[0]; const m = g.move(b.san);
    if (m) return { m, why: shortComment(b.c) || whyFor(fen, m), src: "book" };
  }
  const u = P.oppMistake ? P.oppMistake.punish : (lines && lines[0] && lines[0].pv && lines[0].pv[0]);
  if (!u) return null;
  const m = g.move(uciObj(u)); return m ? { m, why: whyFor(fen, m), src: "engine" } : null;
}

function overlay() {
  const out = { marks: {}, arrows: [] };
  if (!myTurnIdle()) return out;
  if (P.threatQ && P.threatQ.answered) out.marks[P.threatQ.sq] = "threat";
  const sug = P.suggest;
  if (sug && P.helpStep >= 3) out.arrows.push({ from: sug.m.from, to: sug.m.to });
  else if (sug && P.helpStep === 2) out.marks[sug.m.from] = "hint";
  return out;
}
function renderPlayBoard(anim) {
  const ov = overlay();
  const marks = { ...ov.marks, ...P.marks };
  if (P.oppMistake && P.last && myTurnIdle()) { marks[P.last.from] = marks[P.last.from] || "lastbad"; marks[P.last.to] = "lastbad"; }
  playBoard.set({ fen: P.game.fen(), orientation: P.you, last: P.last, check: kingSq(P.game), arrows: P.arrows.length ? P.arrows : ov.arrows, marks, animate: anim });
}
function updateEval() {}
function setThinking(on) { $("#thinking").classList.toggle("on", on); }

function newGame() {
  P.gid++; coachEngine.stop(); botEngine.stop(); P.replayId++; P.playing = false;
  P.opening = "caro"; P.you = "b";
  Object.assign(P, { threat: null, wasInBook: true, leftBookNow: false, lastAfterCp: null, oppMistake: null, game: new Chess(), hist: [], busy: false, over: null, wait: null, retry: null, pre: null, prePromise: null, last: null, mine: null, theirs: null, arrows: [], marks: {}, suggest: null, revealed: false, helpStep: 0, threatQ: null, found: 0, total: 0 });
  setTop();
  renderPlayBoard(); renderCoach();
  if (P.you === "b") botMove(); else startUserTurn();
}
function startUserTurn() {
  const fen = P.game.fen(); const gid = P.gid;
  P.preFen = fen; P.pre = null; P.revealed = false; P.helpStep = S.guide.stage === 1 ? 1 : 0;
  { const inBook = bookAt(P.opening, fen).length > 0; P.leftBookNow = P.wasInBook && !inBook && P.hist.length >= 4; P.wasInBook = inBook; }
  P.suggest = makeSuggest(fen, null);
  P.prePromise = coachEngine.ready.then(() => analyze(fen, "depth 18 movetime 2500", 3, j => {
    if (P.gid !== gid || P.preFen !== fen || P.suggest || (j.depth || 0) < 10) return;
    const lines = Object.keys(j.lines).sort((a, b) => a - b).map(k => j.lines[k]);
    P.suggest = makeSuggest(fen, lines); renderPlayBoard(); renderCoach();
  })).then(r => {
    if (P.preFen !== fen) return r;
    P.pre = r;
    if (P.lastAfterCp != null && P.theirs && !P.theirs.book && !P.retry) {
      const nowCp = toCp(r.lines[0].score);
      const oppLoss = winPct(nowCp) - winPct(P.lastAfterCp);
      if (oppLoss >= 10 && winPct(P.lastAfterCp) < 90) P.oppMistake = { cls: oppLoss >= 20 ? "blunder" : "mistake", label: P.theirs.label, punish: r.lines[0].pv[0] };
    }
    P.lastAfterCp = null;
    const fin = makeSuggest(fen, r.lines);
    if (fin && (!P.suggest || P.suggest.src !== "book" || P.oppMistake) && (!P.suggest || moveUci(fin.m) !== moveUci(P.suggest.m))) P.suggest = fin;
    renderPlayBoard(); renderCoach();
    return r;
  });
  P.prePromise.catch(() => {});
  renderPlayBoard(); renderCoach();
}
async function onUserMove(m, dragged) {
  if (!canUserMove()) return;
  const gid = P.gid; const fenBefore = P.game.fen();
  const histBefore = P.game.history({ verbose: true });
  const mv = P.game.move(m); if (!mv) return;
  const label = moveWords(mv);
  const usedHelp = P.helpStep; const shownIdea = P.helpStep >= 1 && P.suggest ? P.suggest.why : "";
  P.last = { from: mv.from, to: mv.to }; P.arrows = []; P.marks = {}; P.busy = true; P.theirs = null; P.suggest = null;
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
  const wasRetry = P.retry && P.retry.fen === fenBefore;
  if (P.oppMistake && !["inaccuracy", "mistake", "blunder"].includes(r.cls)) r.punished = moveUci(mv) === P.oppMistake.punish || r.loss < 3;
  P.oppMistake = null; P.threat = null; P.leftBookNow = false;
  P.lastAfterCp = after ? r.afterCp : null;
  P.hist.push({ fenBefore, move: mv, r, label });
  P.mine = { label, san: mv.san, r, fenBefore, move: mv, retry: wasRetry };
  // Did you find it yourself? (the idea alone still counts as yourself)
  const top = ["book", "best", "excellent"].includes(r.cls);
  r.foundSelf = top && usedHelp <= 1; r.usedHelp = usedHelp; r.shownIdea = shownIdea;
  if (!wasRetry) { P.total++; if (r.foundSelf) P.found++; }
  if (S.guide.stage === 1) {
    if (r.foundSelf) S.guide.streak++; else if (r.cls === "mistake" || r.cls === "blunder") S.guide.streak = 0;
    if (S.guide.streak >= 25) { S.guide.stage = 2; S.guide.streak = 0; setTimeout(() => toast("You're finding moves well. I'll stop showing the idea first. Tap Hint if you need it."), 600); }
  }
  save();
  const bad = r.cls === "mistake" || r.cls === "blunder";
  if (bad && !P.game.game_over()) { P.busy = false; P.wait = { fenBefore, move: mv, r, pre }; renderCoach(); setTimeout(() => { if (P.wait && P.wait.r === r) replayPlay(r); }, 700); return; }
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
    onStep && onStep(moveWords(m), i);
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
  P.oppMistake = null; P.revealed = false; P.helpStep = 0; P.threatQ = null;
  P.suggest = makeSuggest(w.fenBefore, w.pre && w.pre.lines);
}
function tryAgain() { cancelReplay(); undoMine(); P.arrows = []; P.mine = null; renderPlayBoard(); renderCoach(); }
function keepPlaying() { cancelReplay(); P.arrows = []; P.wait = null; P.retry = null; if (checkOver()) return; botMove(); }
async function botMove() {
  const gid = P.gid; P.busy = true; setThinking(true); renderCoach();
  const fen = P.game.fen(); const t0 = performance.now();
  let uci, idea = null;
  const book = bookAt(P.opening, fen);
  if (book.length) { const b = pickWeighted(book); uci = b.uci; idea = shortComment(b.c); }
  else { try { uci = await botChoose(fen); } catch (e) { if (P.gid === gid) { setThinking(false); P.busy = false; ENGINE = "fail"; renderCoach(); } return; } }
  await sleep(Math.max(0, 500 - (performance.now() - t0)));
  if (P.gid !== gid) return;
  const mv = P.game.move(uciObj(uci)); if (!mv) { setThinking(false); P.busy = false; return; }
  if (!idea && !mv.captured) { const i = moveIdea(fen, mv); idea = i ? i.charAt(0).toUpperCase() + i.slice(1).replace(/\byour\b/g, "their") + "." : ""; }
  P.last = { from: mv.from, to: mv.to }; P.arrows = []; P.marks = {};
  P.theirs = { label: moveWords(mv), m: mv, idea, book: book.length > 0 };
  P.hist.push({ fenBefore: fen, move: mv, bot: true });
  { const map = boardMap(P.game); const t = Object.keys(map).find(x => map[x].color === P.you && "nbrq".includes(map[x].type) && isHanging(map, x)); P.threat = t ? { sq: t, type: map[t].type } : null;
    P.threatQ = null;
    if (t && S.threat.on) {
      const others = Object.keys(map).filter(x => x !== t && map[x].color === P.you && map[x].type !== "k" && map[x].type !== "p").sort(() => Math.random() - 0.5).slice(0, 2);
      if (others.length < 2) others.push(...Object.keys(map).filter(x => x !== t && !others.includes(x) && map[x].color === P.you && map[x].type === "p").slice(0, 2 - others.length));
      const opts = [t, ...others].map(sq => ({ sq, label: `${NAME[map[sq].type].replace(/^./, c => c.toUpperCase())} on ${sq}` })).sort(() => Math.random() - 0.5);
      P.threatQ = { sq: t, type: map[t].type, opts, answered: false, right: null };
    } }
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
  P.over.count = { blunder: mine.filter(h => h.r.cls === "blunder").length, mistake: mine.filter(h => h.r.cls === "mistake").length };
  const oldLevel = S.level;
  if (res === "won" && S.level < LEVELS.length - 1) S.level++;
  if (res === "lost" && S.level > 0) S.level--;
  if (S.level !== oldLevel) setTimeout(() => toast(`Next opponent: ${levelName(S.level).toLowerCase()}.`), 900);
  const slips = mine.filter(h => h.r.tags && h.r.tags.some(t => t === "hangs" || t === "fork" || t === "allows-mate")).length;
  if (S.threat.on) { S.threat.clean = slips ? 0 : S.threat.clean + 1; if (S.threat.clean >= 3) { S.threat.on = false; setTimeout(() => toast("You're catching threats yourself now. Threat warnings are off."), 4200); } }
  else if (slips >= 2) { S.threat.on = true; S.threat.clean = 0; setTimeout(() => toast("Threat warnings are back on for a bit."), 4200); }
  P.over.found = P.found; P.over.total = P.total;
  if (S.guide.stage === 2 && P.over.count.blunder + P.over.count.mistake >= 3) { S.guide.stage = 1; S.guide.streak = 0; setTimeout(() => toast("I'll show the idea first again for a bit."), 2600); }
  save(); renderPlayBoard(); renderCoach();
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
function contextHTML() {
  const opp = COLOR[other(P.you)];
  if (P.retry) return "That move was a mistake. Try again.";
  if (P.oppMistake) { const c = CLS[P.oppMistake.cls]; return `<em class="tone-${c.tone}">${c.nag}</em> ${opp} just made a ${P.oppMistake.cls === "blunder" ? "big mistake" : "mistake"}. Find how to punish it.`; }
  if (P.leftBookNow) return "The opening is over. Think about your plan.";
  if (P.theirs) return `${esc(P.theirs.m ? describeTheirs(P.theirs.m, opp) : opp + " moved.")}${P.theirs.idea && !P.threatQ ? " " + esc(P.theirs.idea) : ""}`;
  return P.you === "b" ? "You're Black. White moves first." : "You're White, so you move first.";
}
function lastMoveHTML() {
  const r = P.mine && P.mine.r; if (!r) return "";
  if (["book", "best", "excellent"].includes(r.cls)) {
    const head = r.punished ? "You punished it." : r.foundSelf ? "You found it." : "Good move.";
    let why = r.rule || (r.cls === "book" ? r.msg[0] : "");
    if (r.shownIdea) why = "";  // you just read the idea; don't repeat it
    return `<p class="got enter"><b>✓ ${head}</b>${why ? " " + esc(why) : ""}</p>`;
  }
  if (["good", "inaccuracy"].includes(r.cls)) return `<div class="card soft-card enter">${verdictHTML(r, P.mine.label)}${feedbackHTML(r)}</div>`;
  return "";
}
function nextCardHTML() {
  const sug = P.suggest; const firstEver = S.stats.played === 0 && !P.hist.some(x => !x.bot);
  // Threat question comes first: you spot it, I don't tell you
  if (P.threatQ && !P.threatQ.answered) {
    return `<div class="card next enter"><p class="ctx">${contextHTML()}</p><h2 class="do">Something of yours is under attack. Which piece?</h2>
      <div class="choice tq">${P.threatQ.opts.map(o => `<button class="opt" data-tq="${o.sq}"><span><b>${esc(o.label)}</b></span></button>`).join("")}</div></div>`;
  }
  let lines = "";
  if (P.threatQ && P.threatQ.answered) lines += `<p class="why ${P.threatQ.right ? "tone-good" : "tone-worse"}"><b>${P.threatQ.right ? "Right." : "Not that one."}</b> Your ${NAME[P.threatQ.type]} on ${P.threatQ.sq} is under attack. Save it or defend it.</p>`;
  if (P.helpStep >= 1) lines += `<p class="why"><b>Idea:</b> ${sug ? bold(sug.why) : "One second…"}</p>`;
  if (P.helpStep >= 2 && sug) lines += `<p class="why"><b>Piece:</b> the ${NAME[sug.m.piece]} in the blue box.</p>`;
  if (P.helpStep >= 3 && sug) lines += `<p class="why"><b>Move:</b> ${esc(describeMove(sug.m))}</p>`;
  if (firstEver) lines += `<p class="why">Tap a piece, then tap where it should go.</p>`;
  const label = ["Hint", "Which piece?", "Show the move"][P.helpStep];
  const btn = P.helpStep < 3 ? `<button class="pill" data-act="help">${label}</button>` : "";
  return `<div class="card next enter"><p class="ctx">${contextHTML()}</p><div class="do-row"><h2 class="do">${P.retry ? "Find a better move." : "Your move."}</h2>${btn}</div>${lines}${P.hist.length ? `<div><button class="link" data-act="plan">See the plan</button></div>` : ""}</div>`;
}
function renderCoach() {
  const el = $("#coach"); if (!el) return;
  let h = "";
  const opp = COLOR[other(P.you)];
  if (ENGINE === "fail") {
    h = `<div class="card enter"><p class="status">The engine didn't start.</p><p class="say">Reload the page to try again.</p></div>`;
  } else if (P.over) {
    const o = P.over; const t = o.res === "won" ? "You won" : o.res === "lost" ? "You lost" : "Draw";
    const n = o.count.blunder + o.count.mistake;
    h = `<div class="card enter"><p class="status">${t}</p><p class="say">${esc(o.why)} You found <b>${o.found} of ${o.total}</b> moves yourself.</p><p class="better">${n ? `${n} mistake${n > 1 ? "s" : ""} this game.` : "No big mistakes."}</p>
      <div class="actions"><button class="btn primary" data-act="new">Play again</button><button class="btn soft" data-act="review">Review</button></div></div>`;
  } else if (P.wait) {
    const r = P.wait.r;
    h = `<div class="card enter">${verdictHTML(r, P.mine.label)}${feedbackHTML(r)}${r.show ? watchHTML(r) : ""}
      <div class="actions"><button class="btn primary" data-act="retry">Try again</button><button class="btn soft" data-act="keep">Keep playing</button></div></div>`;
  } else if (ENGINE === "loading" && P.game.turn() === P.you) {
    h = `<div class="turn"><p>Loading the engine…</p></div>`;
  } else if (myTurnIdle()) {
    h = lastMoveHTML() + nextCardHTML();
  } else {
    h = `<div class="turn"><p>${P.mine && P.mine.pending ? "Checking your move…" : `${opp} is thinking…`}</p></div>`;
  }
  el.innerHTML = h;
}
function renderPlan() {}
function planInfo() {
  const map = boardMap(P.game); const hist = P.game.history({ verbose: true });
  const num = +P.game.fen().split(" ")[5];
  const goals = goalsFor(map, P.you, hist, num);
  const sid = detectStructure(map, P.you);
  const plan = sid ? PLANS[sid] : null;
  const steps = plan ? plan.steps.map(s => ({ ...s, done: s.check === "tip" ? null : runCheck(s.check, map, P.you, hist) })) : [];
  return { goals, sid, plan, steps };
}
function checklistHTML(items) {
  return `<ul class="checklist">${items.map(i => `<li class="${i.done ? "done" : ""}"><span class="tick ${i.done ? "on" : i.done === null ? "tip" : ""}" aria-label="${i.done ? "Done" : i.done === null ? "Tip" : "Not yet"}"></span><span><b>${esc(i.t)}</b>${i.why ? `<small>${esc(i.why)}</small>` : ""}</span></li>`).join("")}</ul>`;
}
function openPlanSheet() {
  const info = planInfo();
  const planBody = info.plan ? `<section><h3>${esc(info.plan.name)}</h3><p class="sub">${esc(info.plan.look)}</p>${checklistHTML(info.steps)}</section>` : "";
  const goalsBody = `<section><h3>${info.goals.phase === "opening" ? "Opening goals" : info.goals.phase === "endgame" ? "Endgame goals" : "Middlegame goals"}</h3>${checklistHTML(info.goals.items)}</section>`;
  openSheet(`<h2>${info.plan ? "Your plan" : "Your goals"}</h2><p class="lede">${info.plan ? "Based on the pawns on the board right now." : "No special pawn structure yet. Follow the basics."}</p>${planBody}${goalsBody}
    <section><p class="sub"><b>Before every move:</b> look at checks, captures and threats. Yours and your opponent's.</p></section>`);
}

// ================= Settings + first run =================
function openSettings() {
  openSheet(`<h2>Settings</h2>
    <section><h3>Opponent strength</h3><div class="stepper"><button class="btn" data-lv="-1" aria-label="Weaker">−</button><output id="lv">${levelName(S.level)}</output><button class="btn" data-lv="1" aria-label="Stronger">+</button></div><p class="sub">Goes up when you win, down when you lose.</p></section>
    <section><h3>Help</h3><div class="seg" role="group" aria-label="Help level">${[1, 2].map(i => `<button data-help="${i}" class="${S.guide.stage === i ? "on" : ""}">${HELP[i]}</button>`).join("")}</div><p class="sub" id="help-sub">${S.guide.stage === 1 ? "Each turn shows the idea. You find the move." : "Nothing shown. Tap Hint when you need it."}</p></section>
    <section><label class="switch"><span>Sounds</span><input type="checkbox" id="snd" ${S.sound ? "checked" : ""}></label></section>`, sh => {
    sh.querySelector("#snd").onchange = e => { S.sound = e.target.checked; save(); };
    sh.querySelectorAll("[data-help]").forEach(b => b.onclick = () => { S.guide.stage = +b.dataset.help; S.guide.streak = 0; save(); sh.querySelectorAll("[data-help]").forEach(x => x.classList.toggle("on", x === b)); sh.querySelector("#help-sub").textContent = S.guide.stage === 1 ? "Each turn shows the idea. You find the move." : "Nothing shown. Tap Hint when you need it."; if (myTurnIdle()) P.helpStep = Math.max(P.helpStep, S.guide.stage === 1 ? 1 : 0); renderPlayBoard(); renderCoach(); });
    sh.querySelectorAll("[data-lv]").forEach(b => b.onclick = () => { S.level = Math.max(0, Math.min(LEVELS.length - 1, S.level + +b.dataset.lv)); sh.querySelector("#lv").textContent = levelName(S.level); setTop(); save(); });
  });
}

// ================= LEARN: the Caro-Kann as a game =================
// Each level: Watch (an animated clip with one plain sentence per move), Follow (a ghost piece shows
// where to go, you copy it), Solo (no ghost; if you pause, the piece glows, then the ghost returns).
// Finished levels come back for a quick refresh on a spaced schedule. One "Continue" button picks what's next.

// Tiny sound kit (no files): a wooden tock for moves, a chime for right, a soft thud for wrong
const SND = {
  ctx: null,
  init() { if (this.ctx || !S.sound) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
  play(kind) {
    if (!S.sound) return; this.init(); const c = this.ctx; if (!c) return;
    if (c.state === "suspended") c.resume();
    const t = c.currentTime;
    const tone = (f, at, dur, vol, type = "sine") => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t + at);
      g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(vol, t + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(g).connect(c.destination); o.start(t + at); o.stop(t + at + dur + 0.02);
    };
    if (kind === "move") { tone(190, 0, 0.09, 0.22, "triangle"); tone(95, 0, 0.07, 0.12, "sine"); }
    if (kind === "good") { tone(660, 0, 0.18, 0.12); tone(990, 0.07, 0.24, 0.1); }
    if (kind === "bad") { tone(150, 0, 0.18, 0.14, "triangle"); }
    if (kind === "win") { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, 0.09)); }
  },
};
document.addEventListener("pointerdown", () => SND.init(), { once: true });

const LS = { view: "map", lv: null, phase: "watch", runs: [], r: 0, i: 0, g: null, moves: [], waiting: false, slips: 0, combo: 0, best: 0, tok: 0, caption: "", sub: "", chip: null, timers: [], refresh: false, done: false };
let learnBoard;
const lstate = id => S.learn[id] || (S.learn[id] = { stars: 0, done: false, box: 0, due: 0 });
function levelUnlocked(i) { return i === 0 || lstate(PATH[i - 1].id).done; }
function dueLevels() { const now = Date.now(); return PATH.filter(l => { const s = S.learn[l.id]; return s && s.done && s.due && s.due <= now; }); }
function updateBadge() { const n = dueLevels().length; const b = $("#badge-learn"); if (b) { b.textContent = n; b.hidden = n === 0; } }
function nextUp() {
  const due = dueLevels().sort((a, b) => S.learn[a.id].due - S.learn[b.id].due)[0];
  if (due) return { lv: due, refresh: true };
  const i = PATH.findIndex((l, k) => levelUnlocked(k) && !lstate(l.id).done);
  if (i >= 0) return { lv: PATH[i], refresh: false };
  return { lv: PATH[PATH.length - 1], refresh: true };
}
function commentFor(fen, san) { const b = bookAt("caro", fen).find(x => x.san === san); return b && b.c ? shortComment(b.c) : ""; }
function buildRuns(lv) {
  if (!lv.mix) return lv.runs.map(r => ({ start: r.start ? r.start.split(" ") : [], moves: r.moves.split(" ") }));
  // Boss: three random lines from the start, first 10 moves each
  const lines = REPERTOIRE.caro.lines.slice(); const pick = [];
  while (pick.length < 3 && lines.length) { const tot = lines.reduce((s, l) => s + l.weight, 0); let x = Math.random() * tot; const k = lines.findIndex(l => (x -= l.weight) <= 0); pick.push(lines.splice(k < 0 ? 0 : k, 1)[0]); }
  return pick.map(l => ({ start: [], moves: parsePgnText(l.pgn).map(m => m.san).slice(0, 10) }));
}
function clearTimers() { LS.timers.forEach(clearTimeout); LS.timers = []; }
function later(fn, ms) { const tok = LS.tok; LS.timers.push(setTimeout(() => { if (LS.tok === tok) fn(); }, ms)); }

function startLevel(lv, refresh) {
  clearTimers(); LS.tok++;
  Object.assign(LS, { view: "level", lv, refresh, phase: refresh || lv.mix ? "solo" : "watch", runs: buildRuns(lv), r: 0, slips: 0, combo: 0, best: 0, done: false, chip: null });
  renderLearn(); startRun();
}
function startRun() {
  clearTimers(); LS.tok++;
  const run = LS.runs[LS.r]; const g = new Chess(); run.start.forEach(m => g.move(m));
  Object.assign(LS, { g, i: 0, waiting: false, caption: LS.phase === "watch" ? "Watch." : LS.phase === "follow" ? "Copy the see-through piece." : "Your turn. No help this time.", sub: "", chip: null, last: null });
  learnBoard.clearGhost();
  learnBoard.set({ fen: g.fen(), orientation: "b", last: null });
  renderLearnPanel();
  later(stepRun, LS.phase === "watch" ? 700 : 600);
}
function sansSoFar() { return [...LS.runs[LS.r].start, ...LS.runs[LS.r].moves.slice(0, LS.i)]; }
function stepRun() {
  const run = LS.runs[LS.r];
  if (LS.i >= run.moves.length) { runDone(); return; }
  const san = run.moves[LS.i]; const fen = LS.g.fen();
  const mine = LS.g.turn() === "b";
  const c = commentFor(fen, san);
  if (!mine || LS.phase === "watch") {
    const m = LS.g.move(san); LS.i++;
    LS.last = { from: m.from, to: m.to };
    learnBoard.set({ fen: LS.g.fen(), orientation: "b", last: LS.last, check: kingSq(LS.g), animate: { from: m.from, to: m.to } });
    SND.play("move");
    if (!mine) { const fam = familyOf(sansSoFar()); if (fam !== "start" && (!LS.chip || LS.chip.fam !== fam)) LS.chip = { fam, fresh: true }; }
    LS.caption = mine ? describeMove(m) : describeTheirs(m, "White");
    LS.sub = c;
    renderLearnPanel(true);
    later(stepRun, LS.phase === "watch" ? (mine ? 2300 : 1900) : 650);
    return;
  }
  // Your move (follow or solo)
  const m = new Chess(fen).move(san);
  LS.want = m; LS.wantC = c; LS.waiting = true; LS.helped = false;
  if (LS.phase === "follow") { learnBoard.ghost(m.from, m.to, "b" + m.piece.toUpperCase()); LS.caption = describeMove(m); LS.sub = c; }
  else {
    LS.caption = "Your move."; LS.sub = "";
    later(() => { if (LS.waiting) { learnBoard.glow(m.from); LS.sub = "Try the glowing piece."; renderLearnPanel(); } }, 4500);
    later(() => { if (LS.waiting) { LS.helped = true; learnBoard.ghost(m.from, m.to, "b" + m.piece.toUpperCase()); LS.caption = describeMove(m); LS.sub = c; renderLearnPanel(); } }, 9000);
  }
  renderLearnPanel(true);
}
function onLearnMove(mv) {
  if (!LS.waiting) return;
  const want = LS.want; const g = LS.g;
  if (mv.from === want.from && mv.to === want.to) {
    clearTimers(); LS.tok++;
    const m = g.move(want.san); LS.i++; LS.waiting = false;
    if (LS.helped && LS.phase === "solo") LS.slips++;
    LS.combo = LS.helped ? 0 : LS.combo + 1; LS.best = Math.max(LS.best, LS.combo);
    learnBoard.clearGhost();
    LS.last = { from: m.from, to: m.to };
    learnBoard.set({ fen: g.fen(), orientation: "b", last: LS.last, check: kingSq(g), animate: { from: m.from, to: m.to } });
    learnBoard.pop(m.to); SND.play("good");
    LS.caption = "Yes!"; LS.sub = LS.wantC;
    renderLearnPanel(true);
    later(stepRun, 1200);
  } else {
    LS.combo = 0; LS.helped = true;
    learnBoard.set({ fen: g.fen(), orientation: "b", last: LS.last });
    learnBoard.shake(mv.from); SND.play("bad");
    learnBoard.ghost(want.from, want.to, "b" + want.piece.toUpperCase());
    LS.caption = "Not that one. Follow the see-through piece."; LS.sub = describeMove(want);
    renderLearnPanel(true);
  }
}
function runDone() {
  LS.waiting = false; learnBoard.clearGhost();
  if (LS.r + 1 < LS.runs.length) { LS.r++; LS.caption = "Next one…"; LS.sub = ""; renderLearnPanel(true); later(startRun, 900); return; }
  // Whole set done for this phase
  if (LS.phase === "watch") { LS.caption = "That's the whole idea."; LS.sub = "Now you play it, with a see-through piece to copy."; LS.between = true; renderLearnPanel(true); return; }
  if (LS.phase === "follow") { LS.caption = "Nice copying."; LS.sub = "Now from memory. If you pause, I'll help."; LS.between = true; renderLearnPanel(true); return; }
  levelDone();
}
function nextPhase(ph) { LS.between = false; LS.phase = ph; LS.r = 0; LS.slips = 0; startRun(); }
function levelDone() {
  const st = lstate(LS.lv.id);
  const stars = LS.slips === 0 ? 3 : LS.slips <= 2 ? 2 : 1;
  const firstTime = !st.done;
  st.stars = Math.max(st.stars, stars); st.done = true;
  st.box = stars === 3 ? Math.min((firstTime ? 0 : st.box) + 1, INTERVALS.length - 1) : 1;
  st.due = Date.now() + INTERVALS[st.box] * DAY - 3600000;
  save(); updateBadge();
  LS.done = true; LS.stars = stars; LS.caption = stars === 3 ? "Perfect!" : "Level done!";
  LS.sub = stars === 3 ? "Every move from memory." : `You needed help ${LS.slips === 1 ? "once" : LS.slips + " times"}. It comes back tomorrow so it sticks.`;
  SND.play("win"); renderLearnPanel(true);
}
function quitLevel() { clearTimers(); LS.tok++; LS.view = "map"; LS.between = false; learnBoard && learnBoard.clearGhost(); renderLearn(); }

function starsHTML(n) { return `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map(k => `<i class="${k <= n ? "on" : ""}"></i>`).join("")}</span>`; }
function renderLearn() {
  const v = $("#view-learn"); if (!v) return;
  setTop();
  if (LS.view === "map") {
    const up = nextUp(); const doneN = PATH.filter(l => lstate(l.id).done).length;
    v.innerHTML = `${doneN === 0 ? `<p class="intro">When White starts with the pawn to e4, you answer with the Caro-Kann. Nine short levels: watch the moves, copy them, then play them yourself.</p>` : ""}
      <button class="btn primary wide go" id="learn-go">${up.refresh ? "Refresh" : doneN ? "Continue" : "Start"}: ${esc(up.lv.title)}</button>
      <ol class="path">${PATH.map((l, k) => { const s = lstate(l.id); const open = levelUnlocked(k); const due = s.done && s.due <= Date.now(); const fam = FAMILIES[l.family];
        return `<li><button class="node ${s.done ? "done" : ""} ${open ? "" : "locked"} ${due ? "due" : ""}" data-lv="${k}" ${open ? "" : "disabled"} style="--fam:${fam.color}">
          <span class="dot" aria-hidden="true">${s.done ? "" : open ? k + 1 : ""}</span>
          <span class="txt"><b>${esc(l.title)}</b><span>${esc(l.sub)}</span></span>
          ${s.done ? (due ? `<span class="tag">Refresh</span>` : starsHTML(s.stars)) : open ? "" : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="Locked"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`}
        </button></li>`; }).join("")}</ol>`;
    v.querySelector("#learn-go").onclick = () => startLevel(up.lv, up.refresh);
    v.querySelectorAll("[data-lv]").forEach(b => b.onclick = () => { const l = PATH[+b.dataset.lv]; const s = lstate(l.id); startLevel(l, s.done && s.due <= Date.now()); });
    learnBoard = null;
    return;
  }
  v.innerHTML = `<div class="live"><div class="main"><div class="bar"><div class="phases" id="phases"></div><button class="icon-btn" id="learn-quit" aria-label="Back to levels">${ICONS.close}</button></div><div id="learn-board"></div></div><div class="side"><div class="coach" id="learn-panel" aria-live="polite"></div></div></div>`;
  learnBoard = new Board(v.querySelector("#learn-board"), { interactive: () => LS.waiting, onMove: m => onLearnMove(m) });
  learnBoard.set({ fen: (LS.g || new Chess()).fen(), orientation: "b" });
  v.querySelector("#learn-quit").onclick = quitLevel;
}
function renderLearnPanel(anim) {
  const p = $("#learn-panel"); if (!p) return;
  const ph = $("#phases");
  if (ph) { const steps = LS.refresh || LS.lv.mix ? ["solo"] : ["watch", "follow", "solo"]; const names = { watch: "Watch", follow: "Copy", solo: "Solo" };
    ph.innerHTML = steps.map(s => `<span class="${s === LS.phase ? "on" : steps.indexOf(s) < steps.indexOf(LS.phase) ? "past" : ""}">${names[s]}</span>`).join(""); }
  let h = "";
  if (LS.chip) { const f = FAMILIES[LS.chip.fam]; h += `<p class="chip ${LS.chip.fresh ? "enter" : ""}" style="--fam:${f.color}">${esc(f.name)}</p>`; LS.chip.fresh = false; }
  h += `<p class="cap ${anim ? "enter" : ""}">${esc(LS.caption)}</p>`;
  if (LS.sub) h += `<p class="capsub ${anim ? "enter" : ""}">${esc(LS.sub)}</p>`;
  if (LS.done) {
    h += `<div class="won enter">${starsHTML(LS.stars)}</div><div class="actions"><button class="btn primary" data-l="next">Next</button><button class="btn soft" data-l="again">Play again</button></div>`;
  } else if (LS.between) {
    h += `<div class="actions">${LS.phase === "watch" ? `<button class="btn soft" data-l="rewatch">Watch again</button><button class="btn primary" data-l="follow">My turn</button>` : `<button class="btn primary" data-l="solo">Go</button>`}</div>`;
  } else if (LS.phase === "watch") {
    h += `<div class="actions"><button class="link" data-l="skip">Skip the clip</button></div>`;
  }
  if (LS.phase !== "watch" && LS.combo >= 2 && !LS.done) h += `<p class="combo">${LS.combo} in a row</p>`;
  p.innerHTML = h;
  p.querySelectorAll("[data-l]").forEach(b => b.onclick = () => {
    const a = b.dataset.l;
    if (a === "follow") nextPhase("follow");
    if (a === "solo") nextPhase("solo");
    if (a === "rewatch") nextPhase("watch");
    if (a === "skip") { clearTimers(); LS.tok++; LS.between = true; LS.caption = "That's the whole idea."; LS.sub = "Now you play it, with a see-through piece to copy."; renderLearnPanel(true); }
    if (a === "again") startLevel(LS.lv, false);
    if (a === "next") { const up = nextUp(); startLevel(up.lv, up.refresh); }
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
    open = left ? `You left the ${name} moves with ${moveWords(RV.moves[left.x.i])}. The ${name} move there is ${sanWords(RV.fens[left.x.i], left.b.sort((a, c) => c.weight - a.weight)[0].san)}.` : `You played the ${name} moves all the way through the opening.`;
  } else open = "This game wasn't a Caro-Kann, so there's no repertoire check.";
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
    const label = moveWords(m);
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
      if (last.color === RV.you) h += verdictHTML(r, moveWords(last)) + feedbackHTML(r);
      else if (pun) { const c = CLS[r.cls]; h += `<div class="card enter"><div class="verdict"><span class="nag tone-${c.tone}" aria-hidden="true">${c.nag}</span><h2 class="tone-${c.tone}">${last.color === "w" ? "White" : "Black"}'s ${r.cls}</h2><span class="mv">${esc(moveWords(last))}</span></div><p class="say">You could punish it: <b>${esc(moveWords(pun))}</b>.</p></div>`; }
      else h += `<p class="theirs">${esc(describeTheirs(last, last.color === "w" ? "White" : "Black"))}</p>`;
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
  renderReview();
}

// ================= Boot =================
const ICONS = {
  close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
};
function wire() {
  playBoard = new Board($("#play-board"), { interactive: canUserMove, onMove: (m, d) => onUserMove(m, d) });
  $("#coach").addEventListener("click", e => {
    const t = e.target.closest("[data-tq]");
    if (t && P.threatQ && !P.threatQ.answered) { P.threatQ.answered = true; P.threatQ.right = t.dataset.tq === P.threatQ.sq; renderPlayBoard(); renderCoach(); return; }
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act;
    if (a === "plan") openPlanSheet();
    if (a === "retry") tryAgain(); if (a === "keep") keepPlaying();
    if (a === "help") { P.helpStep = Math.min(3, P.helpStep + 1); renderPlayBoard(); renderCoach(); }
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
  S.opening = "caro"; ["deck", "lines", "newLines", "newDay", "plan", "pause"].forEach(k => delete S[k]); save();
  wire(); updateBadge(); showView(currentView());
  renderPlayBoard(); renderCoach();
  connectPlatform();
}
