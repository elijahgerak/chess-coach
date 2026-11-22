// Every repertoire line, duel card and trap must be legal chess.
const { app, Chess } = require("./lib");
const { REPERTOIRE, FAMILIES, RUNS, QG_RUNS, D4_RUNS, familyOf, duelCards, fenKey, TRAPS, PLANS, parsePgnText } = app;
let fail = 0;
const bad = msg => { fail++; console.log("FAIL", msg); };
for (const [key, op] of Object.entries(REPERTOIRE))
  for (const line of op.lines) {
    const g = new Chess();
    for (const mv of parsePgnText(line.pgn)) if (!g.move(mv.san)) { bad(`${key} / ${line.name}: illegal ${mv.san}`); break; }
  }
if (Object.keys(REPERTOIRE).join() !== "caro,qg") bad("the repertoire should be the Caro-Kann and the Queen's Gambit");
let total = 0;
for (const [op, runs, first] of [["caro", [...RUNS, ...D4_RUNS], "c6"], ["qg", QG_RUNS, "d4"]]) {
  const deck = duelCards(op), you = REPERTOIRE[op].you; total += deck.order.length;
  if (deck.order.length < 30) bad(`${op} duel: only ${deck.order.length} cards`);
  if (deck.cards[deck.order[0]].main !== first) bad(`${op} duel: the first answer should be ${first}`);
  for (const k of deck.order) {
    const c = deck.cards[k]; const g = new Chess(); c.sans.forEach(m => g.move(m) || bad(`duel ${c.sans.join(" ")}: illegal`));
    if (g.turn() !== you) bad(`duel ${c.sans.join(" ")}: should be your move`);
    if (!c.why) bad(`duel ${c.sans.join(" ")}: ${c.main} needs a {comment} (it's the reason shown with the ghost)`);
    if (!c.answers.includes(c.main)) bad(`duel ${c.sans.join(" ")}: main answer missing`);
    for (const a of c.answers) if (!new Chess(g.fen()).move(a)) bad(`duel ${c.sans.join(" ")}: answer ${a} illegal`);
    if (c.parent && !deck.cards[c.parent]) bad(`duel ${c.sans.join(" ")}: parent missing`);
    if (c.parent && deck.cards[c.parent].depth >= c.depth) bad(`duel ${c.sans.join(" ")}: parent should come earlier`);
    if (!FAMILIES[familyOf(c.sans, op)]) bad(`duel ${c.sans.join(" ")}: no family`);
  }
  // every card sits in exactly one run
  const inRun = {};
  for (const r of runs) {
    if (!FAMILIES[r.family]) bad(`run ${r.id}: unknown family`);
    if (r.all) continue;
    if (r.cues.length < 4 || r.cues.length > 8) bad(`run ${r.id}: ${r.cues.length} cards (keep 4-8)`);
    for (const cue of r.cues) {
      const g = new Chess(); (cue ? cue.split(" ") : []).forEach(m => g.move(m) || bad(`run ${r.id}: illegal ${m} in "${cue}"`));
      const k = fenKey(g.fen());
      if (!deck.cards[k]) bad(`run ${r.id}: "${cue}" is not a position you answer`);
      else if (inRun[k]) bad(`run ${r.id}: "${cue}" is also in ${inRun[k]}`); else inRun[k] = r.id;
    }
  }
  for (const k of deck.order) if (!inRun[k]) bad(`no ${op} run has "${deck.cards[k].sans.join(" ")}"`);
}
for (const t of TRAPS) { const g = new Chess(); t.moves.split(" ").forEach(m => g.move(m) || bad(`trap: illegal ${m}`)); if (!g.move(t.san)) bad(`trap ${t.san} illegal`); }
for (const [id, p] of Object.entries(PLANS)) if (!p.focus || !p.moves || p.moves.length < p.steps.filter(s => s.check !== "tip").length) bad(`plan ${id}: missing focus/moves`);
console.log(fail ? `${fail} problem(s)` : `data: all lines, ${total} duel cards, traps and plans OK`);
process.exit(fail ? 1 : 0);
