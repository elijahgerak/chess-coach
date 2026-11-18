// ================= Core chess helpers =================
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const NAME = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
const COLOR = { w: "White", b: "Black" };
const FILES = "abcdefgh";
const other = c => (c === "w" ? "b" : "w");
const fenKey = fen => fen.split(" ").slice(0, 4).join(" ");
const sqFR = sq => [FILES.indexOf(sq[0]), +sq[1]];
const frSq = (f, r) => (f >= 0 && f < 8 && r >= 1 && r <= 8 ? FILES[f] + r : null);
const uciObj = u => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || undefined });
const moveUci = m => m.from + m.to + (m.promotion || "");

function boardMap(game) {
  const map = {};
  const b = game.board();
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const p = b[r][f];
    if (p) map[FILES[f] + (8 - r)] = p;
  }
  return map;
}
function material(map, color) {
  let s = 0;
  for (const k in map) if (map[k].color === color) s += VAL[map[k].type];
  return s;
}
function matDiff(map, me) { return material(map, me) - material(map, other(me)); }

// Squares a piece on `sq` attacks (pseudo, ignores pins)
function attacksFrom(map, sq) {
  const p = map[sq]; if (!p) return [];
  const [f, r] = sqFR(sq); const out = [];
  const add = (df, dr) => { const s = frSq(f + df, r + dr); if (s) out.push(s); };
  const ray = (df, dr) => { let x = f + df, y = r + dr; while (true) { const s = frSq(x, y); if (!s) break; out.push(s); if (map[s]) break; x += df; y += dr; } };
  if (p.type === "p") { const d = p.color === "w" ? 1 : -1; add(-1, d); add(1, d); }
  else if (p.type === "n") [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(([a, b]) => add(a, b));
  else if (p.type === "k") [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => add(a, b));
  else {
    if (p.type !== "r") [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => ray(a, b));
    if (p.type !== "b") [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => ray(a, b));
  }
  return out;
}
function attackers(map, target, color) {
  const out = [];
  for (const s in map) if (map[s].color === color && attacksFrom(map, s).includes(target)) out.push(s);
  return out;
}
function mobility(map, sq) {
  const me = map[sq].color;
  return attacksFrom(map, sq).filter(s => !map[s] || map[s].color !== me).length;
}

// ================= Evaluation helpers =================
// score objects are {cp} or {mate}, from the side-to-move's view
function toCp(sc) {
  if (!sc) return 0;
  if (sc.mate != null) return sc.mate > 0 ? 100000 - sc.mate : -100000 - sc.mate;
  return sc.cp;
}
function winPct(cp) {
  const c = Math.max(-2000, Math.min(2000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}
function evalWords(cp) {
  if (cp > 50000) return "a forced checkmate for you";
  if (cp < -50000) return "a forced checkmate against you";
  if (cp >= 300) return "winning for you";
  if (cp >= 120) return "clearly better for you";
  if (cp >= 45) return "a little better for you";
  if (cp > -45) return "about equal";
  if (cp > -120) return "a little worse for you";
  if (cp > -300) return "clearly worse for you";
  return "losing";
}
function fmtEval(cpWhite) {
  if (cpWhite > 50000) return "M" + (100000 - cpWhite);
  if (cpWhite < -50000) return "-M" + (100000 + cpWhite);
  const v = cpWhite / 100;
  return (v > 0 ? "+" : "") + v.toFixed(1);
}
function amountWords(n) {
  if (n >= 8) return "about a queen's worth of material";
  if (n >= 6) return "a rook and a pawn";
  if (n >= 5) return "a rook";
  if (n >= 4) return "a piece and a pawn";
  if (n >= 3) return "a piece";
  if (n >= 2) return "two pawns";
  return "a pawn";
}

const CLS = {
  best: { label: "Best move", nag: "!", tone: "good" },
  excellent: { label: "Excellent", nag: "!", tone: "good" },
  good: { label: "Good move", nag: "", tone: "ok" },
  book: { label: "Book move", nag: "", tone: "book" },
  inaccuracy: { label: "Inaccuracy", nag: "?!", tone: "warn" },
  mistake: { label: "Mistake", nag: "?", tone: "bad" },
  blunder: { label: "Blunder", nag: "??", tone: "worse" },
};
function classify(loss, wpAfter, wpBefore, isBest) {
  let c;
  if (isBest || loss < 1) c = isBest ? "best" : "excellent";
  else if (loss < 2.5) c = "excellent";
  else if (loss < 6) c = "good";
  else if (loss < 11) c = "inaccuracy";
  else if (loss < 20) c = "mistake";
  else c = "blunder";
  const rank = ["best", "excellent", "good", "inaccuracy", "mistake", "blunder"];
  const cap = x => { if (rank.indexOf(c) > rank.indexOf(x)) c = x; };
  if (wpAfter >= 93) cap("good");
  else if (wpAfter >= 82) cap("inaccuracy");
  if (wpBefore <= 8) cap("inaccuracy");
  return c;
}

// SAN line from a fen + uci list
function pvToSan(fen, pv, n = 6) {
  const g = new Chess(fen); const out = [];
  for (const u of (pv || []).slice(0, n)) { const m = g.move(uciObj(u)); if (!m) break; out.push(m); }
  return out;
}
function sanLine(fen, moves) {
  // moves: verbose list starting at fen
  const g = new Chess(fen); let num = +fen.split(" ")[5]; let turn = fen.split(" ")[1];
  const parts = [];
  moves.forEach((m, i) => {
    if (turn === "w") parts.push(num + "." + m.san);
    else parts.push((i === 0 ? num + "..." : "") + m.san);
    if (turn === "b") num++;
    turn = other(turn);
  });
  return parts.join(" ");
}
// A move in plain words: "knight g8 → e7", "pawn takes on d5", "castle"
function moveWords(m) {
  if (!m) return "";
  if (m.flags && (m.flags.includes("k") || m.flags.includes("q"))) return "castle";
  if (m.captured) return `${NAME[m.piece]} takes on ${m.to}`;
  return `${NAME[m.piece]} ${m.from} → ${m.to}`;
}
function sanWords(fen, san) { const m = new Chess(fen).move(san); return m ? moveWords(m) : san; }
function moveLabel(fen, san) {
  const [, turn, , , , num] = fen.split(" ");
  return turn === "w" ? `${num}.${san}` : `${num}...${san}`;
}

// Follow a PV and return the material swing for `me` once captures settle
function materialSwing(fen, pv, me, maxPlies = 8) {
  const g = new Chess(fen);
  const start = matDiff(boardMap(g), me);
  let settled = start; let quiet = 0;
  for (let i = 0; i < Math.min(maxPlies, (pv || []).length); i++) {
    const m = g.move(uciObj(pv[i])); if (!m) break;
    if (m.captured || m.promotion) quiet = 0; else quiet++;
    const now = matDiff(boardMap(g), me);
    if (quiet >= 1) settled = now;
    if (quiet >= 2) break;
  }
  if (quiet < 1) settled = matDiff(boardMap(g), me);
  return settled - start;
}

// ================= Opening book =================
function parsePgnText(pgn) {
  const out = []; const re = /\{([^}]*)\}|([^\s{}]+)/g; let m;
  while ((m = re.exec(pgn))) {
    if (m[1] !== undefined) { if (out.length) out[out.length - 1].c = m[1].trim(); }
    else { const t = m[2].replace(/^\d+\.+/, ""); if (t) out.push({ san: t }); }
  }
  return out;
}
function buildBook(op) {
  const tree = new Map();
  for (const line of op.lines) {
    const g = new Chess();
    for (const mv of parsePgnText(line.pgn)) {
      const key = fenKey(g.fen());
      const m = g.move(mv.san); if (!m) break;
      if (!tree.has(key)) tree.set(key, new Map());
      const node = tree.get(key);
      const cur = node.get(m.san) || { san: m.san, uci: moveUci(m), weight: 0, c: "", lines: [] };
      cur.weight += line.weight; if (mv.c && !cur.c) cur.c = mv.c;
      if (!cur.lines.includes(line.name)) cur.lines.push(line.name);
      node.set(m.san, cur);
    }
  }
  return tree;
}
const BOOKS = {};
function bookAt(opening, fen) {
  if (!BOOKS[opening]) BOOKS[opening] = buildBook(REPERTOIRE[opening]);
  const node = BOOKS[opening].get(fenKey(fen));
  return node ? [...node.values()] : [];
}
function pickWeighted(list) {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of list) { r -= x.weight; if (r <= 0) return x; }
  return list[0];
}

// ================= Move ideas in plain words =================
function moveIdea(fen, m) {
  // m: verbose move in the position `fen`
  const g = new Chess(fen); const map = boardMap(g);
  if (m.flags.includes("k") || m.flags.includes("q")) return "it castles your king to safety";
  const after = new Chess(fen); after.move({ from: m.from, to: m.to, promotion: m.promotion });
  if (after.in_checkmate()) return "it's checkmate";
  if (m.captured) return `it takes the ${NAME[m.captured]} on ${m.to}`;
  if (after.in_check()) return "it gives check";
  const home = m.color === "w" ? "1" : "8";
  if ((m.piece === "n" || m.piece === "b") && m.from[1] === home) return `it brings your ${NAME[m.piece]} out`;
  if (m.piece === "p" && "de".includes(m.from[0])) return "it puts a pawn in the middle";
  if (m.piece === "p" && m.from[0] === "c") return "it attacks the middle from the side";
  if (m.piece === "r") {
    const amap = boardMap(after); const f = m.to[0]; let own = false;
    for (let r = 1; r <= 8; r++) { const p = amap[f + r]; if (p && p.type === "p" && p.color === m.color) own = true; }
    if (!own) return "it puts your rook on a column with no pawns";
  }
  // threatens something?
  const amap = boardMap(after);
  const hits = attacksFrom(amap, m.to).filter(s => amap[s] && amap[s].color !== m.color && amap[s].type !== "p" && (VAL[amap[s].type] > VAL[m.piece] || !attackers(amap, s, amap[s].color).length));
  if (hits.length) return `it attacks the ${NAME[amap[hits[0]].type]} on ${hits[0]}`;
  return "";
}

// ================= Principle checks =================
function minorsStatus(map, c) {
  const home = c === "w" ? { n: ["b1", "g1"], b: ["c1", "f1"] } : { n: ["b8", "g8"], b: ["c8", "f8"] };
  let total = 0, out = 0;
  for (const s in map) {
    const p = map[s]; if (p.color !== c || (p.type !== "n" && p.type !== "b")) continue;
    total++; if (!home[p.type].includes(s)) out++;
  }
  return { total, out };
}
function hasCastled(history, c, map) {
  if (history && history.some(h => h.color === c && (h.flags.includes("k") || h.flags.includes("q")))) return true;
  if (!history || !history.length) {
    const r = c === "w" ? "1" : "8";
    return ["g" + r, "c" + r, "b" + r, "h" + r].some(s => map[s] && map[s].type === "k" && map[s].color === c);
  }
  return false;
}
function principleNotes(ctx) {
  const { fenBefore, move, me, history, opening } = ctx;
  const notes = [];
  const g = new Chess(fenBefore); const map = boardMap(g);
  const myNum = +fenBefore.split(" ")[5];
  const mine = (history || []).filter(h => h.color === me);
  const dev = minorsStatus(map, me);
  if (myNum <= 12) {
    if (move.piece === "q" && !move.captured && myNum <= 8 && dev.out < 3)
      notes.push("Queen out too early. It gets chased while your opponent brings out pieces.");
    if ("nbrq".includes(move.piece) && !move.captured && dev.out < dev.total) {
      const movedBefore = mine.some(h => h.to === move.from);
      const threatened = attackers(map, move.from, other(me)).length > 0;
      if (movedBefore && !threatened && move.piece !== "q")
        notes.push("Same piece twice. Bring out a new piece instead.");
    }
    if (move.piece === "k" && !move.flags.includes("k") && !move.flags.includes("q") && !hasCastled(history, me, map))
      notes.push("Your king moved, so you can't castle anymore.");
    if (move.piece === "p" && "abgh".includes(move.from[0]) && dev.out < 2 && myNum <= 8)
      notes.push("Edge pawn moves don't help. Bring out pieces instead.");
  }
  if (opening === "caro" && me === "b" && move.san === "e6" && map.c8 && map.c8.type === "b" && map.c6 && map.c6.type === "p") {
    const bm = g.moves({ square: "c8", verbose: true }).map(x => x.to);
    if (bm.includes("f5") || bm.includes("g4"))
      notes.push("Get your c8 bishop out before e6, or your pawns block it in.");
  }
  if (move.piece === "p" && "fgh".includes(move.from[0]) && hasCastled(history, me, map)) {
    const kSq = Object.keys(map).find(s => map[s].type === "k" && map[s].color === me);
    if (kSq && "fgh".includes(kSq[0])) notes.push("Pawn pushes in front of your king make holes.");
  }
  return notes;
}

let TRAPMAP = null;
function trapNote(fen, san) {
  if (!TRAPMAP) { TRAPMAP = new Map(); for (const t of TRAPS) { const g = new Chess(); t.moves.split(" ").forEach(x => g.move(x)); TRAPMAP.set(fenKey(g.fen()) + "|" + t.san, t); } }
  const t = TRAPMAP.get(fenKey(fen) + "|" + san); return t ? t.note : null;
}
// ================= The coach: explain a move in plain words =================
// ---- Basic principles: pick the rule that explains a move, from what it actually does on the board ----
function isHanging(map, sq) {
  const p = map[sq]; if (!p || p.type === "k") return false;
  const att = attackers(map, sq, other(p.color)); if (!att.length) return false;
  const def = attackers(map, sq, p.color);
  return !def.length || att.some(a => VAL[map[a].type] < VAL[p.type]);
}
function isPassed(map, sq, c) {
  const [f, r] = sqFR(sq);
  for (const s in map) { const q = map[s]; if (q.type !== "p" || q.color === c) continue; const [qf, qr] = sqFR(s); if (Math.abs(qf - f) <= 1 && (c === "w" ? qr > r : qr < r)) return false; }
  return true;
}
function hitsChainBase(map, sq, c) {
  // Does my pawn on sq attack an enemy pawn that holds up another pawn but has no pawn behind it?
  const [f, r] = sqFR(sq); const d = c === "w" ? 1 : -1; const them = other(c);
  const isTheirPawn = s2 => s2 && map[s2] && map[s2].type === "p" && map[s2].color === them;
  for (const df of [-1, 1]) {
    const t = frSq(f + df, r + d); if (!isTheirPawn(t)) continue;
    const [tf, tr] = sqFR(t);
    const guarded = [-1, 1].some(x => isTheirPawn(frSq(tf + x, tr + d)));
    const holdsChain = [-1, 1].some(x => isTheirPawn(frSq(tf + x, tr - d)));
    if (!guarded && holdsChain) { const up = [-1, 1].map(x => frSq(tf + x, tr - d)).find(isTheirPawn); return { t, up }; }
  }
  return null;
}
function principleFor(fen, m, me) {
  const g = new Chess(fen); const map = boardMap(g); const num = +fen.split(" ")[5];
  const phase = gamePhase(map, num);
  const after = new Chess(fen); after.move({ from: m.from, to: m.to, promotion: m.promotion }); const amap = boardMap(after);
  if (after.in_checkmate()) return "Look at every check first. Some are checkmate.";
  if (m.captured) {
    const defended = attackers(map, m.to, other(me)).length > 0;
    if (!defended) return "If nothing guards a piece, take it.";
    if (VAL[m.captured] > VAL[m.piece]) return "Swap a cheap piece for an expensive one when you can.";
    if (m.piece === "p" && Math.abs(3.5 - FILES.indexOf(m.to[0])) < Math.abs(3.5 - FILES.indexOf(m.from[0]))) return "When a pawn takes, take toward the middle of the board.";
    if (matDiff(map, me) >= 2 && VAL[m.captured] === VAL[m.piece]) return "When you're ahead, swap pieces. Fewer pieces, easier win.";
  }
  if (m.piece !== "k" && isHanging(map, m.from)) return "First, save pieces that are being attacked.";
  const mine = Object.keys(map).filter(x => map[x].color === me && x !== m.from);
  if (mine.some(x => isHanging(map, x) && !isHanging(amap, x))) return "Protect pieces that nothing is guarding.";
  if (m.flags.includes("k") || m.flags.includes("q")) return "Castle early. It tucks your king safely into the corner.";
  if (phase === "endgame" && m.piece === "k") return "With few pieces left, use your king. Walk it to the middle.";
  if (m.piece === "p" && isPassed(amap, m.to, me) && phase !== "opening") return "A pawn with no enemy pawns ahead can become a queen. Push it.";
  if (m.piece === "p") { const cb = hitsChainBase(amap, m.to, me); if (cb) return `Attack the pawn on ${cb.t}. It's holding up the pawn on ${cb.up}.`; }
  if (m.piece === "p" && ["c4", "c5", "d4", "d5", "e4", "e5"].includes(m.to)) return "Pawns in the middle of the board give you more room.";
  const home = me === "w" ? "1" : "8";
  if ((m.piece === "n" || m.piece === "b") && m.from[1] === home && phase !== "endgame") return "At the start, bring out a new piece every move.";
  if (m.piece === "r") { const P = pawnsOf(amap, me); if (!fileHas(P, m.to[0])) return "Rooks are strongest on columns with no pawns."; }
  const targets = attacksFrom(amap, m.to).filter(x => amap[x] && amap[x].color !== me && amap[x].type !== "k" && (amap[x].type !== "p" || !attackers(amap, x, other(me)).length) && (VAL[amap[x].type] > VAL[m.piece] || !attackers(amap, x, other(me)).length));
  if (targets.length >= 2) return "Attack two things at once. They can only save one.";
  if (targets.length) {
    const t = targets[0]; const tp = amap[t];
    if (tp.type === "p" && ["d4", "d5", "e4", "e5"].includes(t)) return `Only pieces guard the pawn on ${t}. Attack it more times than it's guarded.`;
    return "Attack something. Then they have to answer you.";
  }
  const before = mobility(map, m.from), afterMob = mobility(amap, m.to);
  if ("nbrq".includes(m.piece) && afterMob - before >= 3) return "Move a piece that isn't doing much to a square where it does more.";
  return null;
}
function trapRule(fen, san) { trapNote(fen, san); const t = TRAPMAP.get(fenKey(fen) + "|" + san); return t ? t.rule : null; }
function ruleForMistake(tags, msg) {
  if (tags.includes("allows-mate")) return "Before every move, look at every check your opponent could give.";
  if (tags.includes("missed-mate")) return "Look at every check first. Some are checkmate.";
  if (tags.includes("fork")) return "Watch for one piece attacking two of yours at once.";
  if (tags.includes("hangs")) return /for free|unprotected/.test(msg) ? "Before every move, ask: what can my opponent take?" : "Before moving there, count how many pieces attack it and how many guard it.";
  return null;
}
// Short ideas, for "Better: Nf6, develops your knight."
function shortIdea(fen, m) {
  const i = moveIdea(fen, m); if (!i) return "";
  return i.replace(/^it /, "").replace("'s checkmate", "is checkmate");
}
function settleIndex(fen, pv, max = 6) {
  const g = new Chess(fen); let lastCap = 0;
  for (let i = 0; i < Math.min(max, (pv || []).length); i++) { const m = g.move(uciObj(pv[i])); if (!m) break; if (m.captured || m.promotion || g.in_check()) lastCap = i + 1; }
  return Math.max(1, Math.min(max, lastCap || 1));
}
// before: analysis of fenBefore (me to move). after: analysis of fenAfter (opponent to move).
function explainMove(ctx) {
  const { fenBefore, move, me, before, after, opening, history, book } = ctx;
  const opp = COLOR[other(me)];
  const bestLine = before.lines[0];
  const bestCp = toCp(bestLine.score);
  const afterCp = after ? -toCp(after.lines[0].score) : bestCp;
  const wpB = winPct(bestCp), wpA = winPct(afterCp);
  const loss = Math.max(0, wpB - wpA);
  const isBest = bestLine.pv[0] === moveUci(move);
  const isBook = book && book.some(b => b.san === move.san);
  let cls = isBook ? "book" : classify(loss, wpA, wpB, isBest);
  if (isBook && loss >= 11) cls = classify(loss, wpA, wpB, false);
  const gA = new Chess(fenBefore); gA.move({ from: move.from, to: move.to, promotion: move.promotion }); const fenAfter = gA.fen();
  const bestMoves = pvToSan(fenBefore, bestLine.pv, 6);
  const best = bestMoves[0];
  const replyPv = after ? after.lines[0].pv : [];
  const reply = after ? pvToSan(fenAfter, replyPv, 6) : [];
  const out = { rule: null, cls, loss, wpBefore: wpB, wpAfter: wpA, bestCp, afterCp, msg: [], better: "", best: best ? best.san : null, bestUci: bestLine.pv[0], reply: reply.map(r => r.san), replyUci: replyPv[0] || null, tags: [], show: null, fenAfter };
  const bad = ["inaccuracy", "mistake", "blunder"].includes(cls);
  const bookMove = book && book.length ? book.slice().sort((a, b) => b.weight - a.weight)[0] : null;
  const trap = trapNote(fenBefore, move.san);
  const betterLine = () => (!best || best.san === move.san) ? "" : `Better: ${moveWords(best)}`;

  if (cls === "book") {
    const b = book.find(x => x.san === move.san);
    out.msg.push(b && b.c ? b.c : "That's the right opening move.");
    return out;
  }
  if (!bad) {
    const idea = shortIdea(fenBefore, move);
    const notes = cls === "good" ? principleNotes({ fenBefore, move, me, history, opening }) : [];
    if (notes.length) out.msg.push(notes[0]);
    else out.msg.push(cls === "best" ? "That's the top move." : cls === "excellent" ? "Excellent move." : "Good move.");
    if (cls === "good") { out.better = betterLine(); out.rule = best ? principleFor(fenBefore, best, me) : null; }
    else out.rule = principleFor(fenBefore, move, me);
    if (bookMove && bookMove.san !== move.san && cls !== "best" && (!best || bookMove.san !== best.san || cls !== "good")) out.better = (out.better ? out.better + ". " : "") + `Opening move here: ${sanWords(fenBefore, bookMove.san)}`;
    return out;
  }

  // ---- Bad move: one short reason, plus moves to play out on the board ----
  const afterSc = after ? after.lines[0].score : null;
  const net = (after ? materialSwing(fenAfter, replyPv, me) : 0) + (move.captured ? VAL[move.captured] : 0);
  const bestSwing = materialSwing(fenBefore, bestLine.pv, me);
  const fromAfter = (n, caption) => { out.show = { fen: fenAfter, pv: replyPv.slice(0, n), caption }; };
  const fromBefore = (n, caption) => { out.show = { fen: fenBefore, pv: bestLine.pv.slice(0, n), caption }; };

  if (trap) { out.tags.push("trap"); out.msg.push(trap); fromAfter(Math.min(5, settleIndex(fenAfter, replyPv, 7)), "Watch:"); }
  else if (afterSc && afterSc.mate != null && afterSc.mate > 0) {
    const n = afterSc.mate; out.tags.push("allows-mate");
    out.msg.push(`This lets ${opp} checkmate you${n <= 3 ? " in " + n : ""}.`);
    fromAfter(Math.min(2 * n - 1, 7), "Watch:");
  } else if (bestLine.score.mate != null && bestLine.score.mate > 0 && !(afterSc && afterSc.mate != null && afterSc.mate < 0)) {
    out.tags.push("missed-mate");
    out.msg.push(`You had checkmate: ${moveWords(best)}.`);
    fromBefore(Math.min(2 * bestLine.score.mate - 1, 7), "What you missed:");
  } else if (wpB >= 80 && loss >= 15) {
    out.tags.push("missed-win");
    out.msg.push(`You missed a winning move: ${moveWords(best)}.`);
    fromBefore(Math.min(5, bestLine.pv.length), "What you missed:");
  } else if (net <= -1 && loss >= 6) {
    const r = reply[0]; const amt = amountWords(-net);
    const amap = boardMap(new Chess(fenAfter));
    if (r && r.captured && r.to === move.to) {
      out.tags.push("hangs");
      out.msg.push(attackers(amap, move.to, me).length ? `This loses ${amt}. ${opp} can take it and come out ahead.` : `Your ${NAME[move.piece]} on ${move.to} can be taken for free.`);
    } else if (r && r.captured) {
      out.tags.push("hangs"); out.msg.push(`This leaves your ${NAME[r.captured]} on ${r.to} unprotected.`);
    } else if (r) {
      const g2 = new Chess(fenAfter); g2.move(r.san); const m2 = boardMap(g2);
      const hit = attacksFrom(m2, r.to).filter(s => m2[s] && m2[s].color === me && (VAL[m2[s].type] >= 3 || m2[s].type === "k"));
      if (hit.length >= 2) { out.tags.push("fork"); out.msg.push(`${opp}'s ${NAME[r.piece]} can attack two of your pieces at once.`); }
      else out.msg.push(`This loses ${amt}.`);
    }
    fromAfter(/for free/.test(out.msg[0]) ? 1 : Math.min(3, settleIndex(fenAfter, replyPv, 6)), "Watch:");
  } else if (bestSwing >= 1 && net < bestSwing && loss >= 6) {
    out.tags.push("missed-win");
    out.msg.push(`You could have won ${amountWords(bestSwing)}: ${moveWords(best)}.`);
    fromBefore(Math.min(3, settleIndex(fenBefore, bestLine.pv, 6)), "What you missed:");
  } else {
    const notes = principleNotes({ fenBefore, move, me, history, opening });
    out.msg.push(notes.length ? notes[0] : `This gives ${opp} the better game.`);
    fromAfter(Math.min(3, replyPv.length), "Watch:");
  }
  out.better = betterLine();
  if (bookMove && bookMove.san !== move.san && (!best || bookMove.san !== best.san)) out.better += `. Opening move here: ${sanWords(fenBefore, bookMove.san)}`;
  const forcing = ["If nothing guards a piece, take it.", "Swap a cheap piece for an expensive one when you can.", "Attack two things at once. They can only save one.", "Look at every check first. Some are checkmate."];
  const bestRule = best ? principleFor(fenBefore, best, me) : null;
  out.rule = (trap && trapRule(fenBefore, move.san)) || ruleForMistake(out.tags, out.msg[0] || "")
    || (out.tags.includes("missed-win") ? (forcing.includes(bestRule) ? bestRule : "First look at checks, captures and attacks.") : null)
    || bestRule || "Before you move, ask what your opponent wants to do next.";
  if (out.show && !out.show.pv.length) out.show = null;
  return out;
}

// ================= Plans and goals =================
function pawnsOf(map, c) { const s = new Set(); for (const k in map) if (map[k].type === "p" && map[k].color === c) s.add(k); return s; }
function fileHas(set, f) { for (const s of set) if (s[0] === f) return true; return false; }
function detectStructure(map, me) {
  const W = pawnsOf(map, "w"), B = pawnsOf(map, "b");
  if (me === "b") {
    if (W.has("e5") && W.has("d4") && B.has("d5") && B.has("e6")) return "ck-advance";
    if (W.has("d4") && !fileHas(W, "c") && !fileHas(W, "e") && !fileHas(B, "d")) return "iqp-against";
    if (B.has("d5") && !fileHas(B, "c") && W.has("d4") && W.has("c3") && !fileHas(W, "e")) return "ck-exchange";
    if (W.has("d4") && !fileHas(W, "e") && B.has("e6") && (B.has("c6") || B.has("c5")) && !fileHas(B, "d")) return "ck-classical";
  }
  return null;
}
function pieceOn(map, sq, c, t) { const p = map[sq]; return p && p.color === c && (!t || p.type === t); }
function rookOnFile(map, c, files) { for (const k in map) if (map[k].type === "r" && map[k].color === c && files.includes(k[0])) return true; return false; }
function runCheck(id, map, me, history) {
  const W = pawnsOf(map, "w"), B = pawnsOf(map, "b");
  const dev = minorsStatus(map, me);
  switch (id) {
    case "b_c5_or_no_wd4": return B.has("c5") || !fileHas(B, "c") || !W.has("d4");
    case "b_pressure_d4": return attackers(map, "d4", "b").length >= 2;
    case "b_castled_rook_c": return hasCastled(history, "b", map) && rookOnFile(map, "b", "c");
    case "minors_done": return dev.out >= dev.total;
    case "castled": return hasCastled(history, me, map);
    case "b_break_c5": return B.has("c5") || B.has("e5") || !fileHas(B, "c");
    case "b_rook_c": return rookOnFile(map, "b", "c");
    case "b_minority": return B.has("b5") || B.has("b4");
    case "b_knight_outpost": return pieceOn(map, "e4", "b", "n") || pieceOn(map, "c4", "b", "n");
    case "b_knight_d5": return pieceOn(map, "d5", "b", "n");
    case "w_pressure_d5": return attackers(map, "d5", "w").length >= 3;
    case "w_rook_c": return rookOnFile(map, "w", "c");
    case "w_rook_b1": return rookOnFile(map, "w", "b");
    case "w_b4": return W.has("b4") || W.has("b5") || !fileHas(W, "b");
    case "w_b5": return W.has("b5") || !fileHas(W, "b");
    case "minors_done_castled": return dev.out >= dev.total && hasCastled(history, "w", map);
    case "w_knight_e5": return pieceOn(map, "e5", "w", "n");
    case "w_rook_de": return rookOnFile(map, "w", "de");
    case "w_e5": return W.has("e5");
    case "w_knight_h4": return pieceOn(map, "h4", "w", "n");
  }
  return false;
}
function gamePhase(map, moveNum) {
  const q = Object.values(map).filter(p => p.type === "q").length;
  const nonPawn = c => Object.values(map).filter(p => p.color === c && "nbrq".includes(p.type)).reduce((s, p) => s + VAL[p.type], 0);
  if ((q === 0 && nonPawn("w") <= 13 && nonPawn("b") <= 13) || (nonPawn("w") <= 8 && nonPawn("b") <= 8)) return "endgame";
  return moveNum <= 12 ? "opening" : "middlegame";
}
function worstPiece(map, me) {
  let worst = null;
  for (const s in map) {
    const p = map[s]; if (p.color !== me || !"nbr".includes(p.type)) continue;
    const mob = mobility(map, s);
    if (!worst || mob < worst.mob) worst = { sq: s, type: p.type, mob };
  }
  return worst;
}
function goalsFor(map, me, history, moveNum) {
  const phase = gamePhase(map, moveNum);
  const dev = minorsStatus(map, me);
  const items = GOALS[phase].map(g => ({ ...g }));
  for (const it of items) {
    if (it.id === "center") {
      const P = pawnsOf(map, me);
      it.done = ["c4", "c5", "d4", "d5", "e4", "e5"].some(s => P.has(s)) || (history || []).some(h => h.color === me && h.piece === "p" && "de".includes(h.from[0]));
    } else if (it.id === "develop") { it.done = dev.out >= dev.total; it.t += ` (${dev.out}/${dev.total})`; }
    else if (it.id === "castle") it.done = hasCastled(history, me, map);
    else if (it.id === "connect") {
      const r = me === "w" ? "1" : "8";
      const rooks = FILES.split("").filter(f => pieceOn(map, f + r, me, "r"));
      if (rooks.length >= 2) {
        const a = FILES.indexOf(rooks[0]), b = FILES.indexOf(rooks[1]); let clear = true;
        for (let f = a + 1; f < b; f++) if (map[FILES[f] + r]) clear = false;
        it.done = clear;
      } else it.done = rooks.length === 1 && !FILES.split("").some(f => map[f + r] && map[f + r].color === me && "nbq".includes(map[f + r].type));
    } else if (it.id === "rooks") {
      const P = pawnsOf(map, me); let ok = false;
      for (const k in map) if (map[k].type === "r" && map[k].color === me && !fileHas(P, k[0])) ok = true;
      it.done = ok;
    } else if (it.id === "worst") {
      const w = worstPiece(map, me);
      if (w) { it.done = w.mob >= 4; it.t = it.done ? "Every piece has good squares" : `Find a better square for your ${NAME[w.type]} on ${w.sq}`; }
      else it.done = true;
    } else if (it.id === "king") {
      const k = Object.keys(map).find(s => map[s].type === "k" && map[s].color === me);
      const [f, r] = sqFR(k); it.done = f >= 2 && f <= 5 && r >= 3 && r <= 6;
    } else if (it.id === "passed") {
      const mine = pawnsOf(map, me), theirs = pawnsOf(map, other(me)); let ok = false;
      for (const s of mine) {
        const [f, r] = sqFR(s); let free = true;
        for (const t of theirs) { const [tf, tr] = sqFR(t); if (Math.abs(tf - f) <= 1 && (me === "w" ? tr > r : tr < r)) free = false; }
        if (free) ok = true;
      }
      it.done = ok;
    } else it.done = null; // advice only
  }
  return { phase, items };
}

// Where to push: attackers vs defenders on the plan's key square
function pressureOn(map, sq, me) {
  const mine = attackers(map, sq, me).length, theirs = attackers(map, sq, other(me)).length;
  const p = map[sq]; const enemyThere = p && p.color !== me;
  return { sq, mine, theirs, enemyThere };
}
function pressureText(pr, opp) {
  if (pr.enemyThere) {
    const lead = pr.mine > pr.theirs ? "You have more attackers than defenders there." : pr.mine === pr.theirs ? "It's even. Add one more attacker." : "Add more attackers.";
    const n = k => k === 1 ? "once" : k === 2 ? "twice" : k + " times";
    return `${pr.mine ? `You attack ${pr.sq} ${n(pr.mine)}.` : `Nothing of yours attacks ${pr.sq} yet.`} ${pr.theirs ? `${opp} defends it ${n(pr.theirs)}.` : `${opp} isn't defending it.`} ${lead}`;
  }
  return `${pr.mine} of your pieces cover ${pr.sq}, ${pr.theirs} of ${opp}'s do.${pr.mine <= pr.theirs ? " Add more." : ""}`;
}
