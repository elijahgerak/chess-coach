// Every repertoire line, duel card and trap must be legal chess.
const { app, Chess } = require("./lib");
const { REPERTOIRE, FAMILIES, RUNS, familyOf, duelCards, fenKey, TRAPS, PLANS, parsePgnText } = app;
let fail = 0;
const bad = msg => { fail++; console.log("FAIL", msg); };
for (const [key, op] of Object.entries(REPERTOIRE))
  for (const line of op.lines) {
    const g = new Chess();
    for (const mv of parsePgnText(line.pgn)) if (!g.move(mv.san)) { bad(`${key} / ${line.name}: illegal ${mv.san}`); break; }
  }
if (Object.keys(REPERTOIRE).join() !== "caro") bad("only the Caro-Kann should be in the repertoire");
const deck = duelCards();
if (deck.order.length < 30) bad(`duel: only ${deck.order.length} cards`);
if (deck.cards[deck.order[0]].main !== "c6") bad("duel: the first card should be 1.e4, answer c6");
for (const k of deck.order) {
  const c = deck.cards[k]; const g = new Chess(); c.sans.forEach(m => g.move(m) || bad(`duel ${c.sans.join(" ")}: illegal`));
  if (g.turn() !== "b") bad(`duel ${c.sans.join(" ")}: should be Black to move`);
  if (!c.answers.includes(c.main)) bad(`duel ${c.sans.join(" ")}: main answer missing`);
  for (const a of c.answers) if (!new Chess(g.fen()).move(a)) bad(`duel ${c.sans.join(" ")}: answer ${a} illegal`);
  if (c.parent && !deck.cards[c.parent]) bad(`duel ${c.sans.join(" ")}: parent missing`);
  if (c.parent && deck.cards[c.parent].depth >= c.depth) bad(`duel ${c.sans.join(" ")}: parent should come earlier`);
  if (!FAMILIES[familyOf(c.sans)]) bad(`duel ${c.sans.join(" ")}: no family`);
}
// every card sits in exactly one run
const inRun = {};
for (const r of RUNS) {
  if (!FAMILIES[r.family]) bad(`run ${r.id}: unknown family`);
  if (r.all) continue;
  if (r.cues.length < 4 || r.cues.length > 8) bad(`run ${r.id}: ${r.cues.length} cards (keep 4-8)`);
  for (const cue of r.cues) {
    const g = new Chess(); cue.split(" ").forEach(m => g.move(m) || bad(`run ${r.id}: illegal ${m} in "${cue}"`));
    const k = fenKey(g.fen());
    if (!deck.cards[k]) bad(`run ${r.id}: "${cue}" is not a position you answer`);
    else if (inRun[k]) bad(`run ${r.id}: "${cue}" is also in ${inRun[k]}`); else inRun[k] = r.id;
  }
}
for (const k of deck.order) if (!inRun[k]) bad(`no run has "${deck.cards[k].sans.join(" ")}"`);
for (const t of TRAPS) { const g = new Chess(); t.moves.split(" ").forEach(m => g.move(m) || bad(`trap: illegal ${m}`)); if (!g.move(t.san)) bad(`trap ${t.san} illegal`); }
for (const [id, p] of Object.entries(PLANS)) if (!p.focus || !p.moves || p.moves.length < p.steps.filter(s => s.check !== "tip").length) bad(`plan ${id}: missing focus/moves`);
console.log(fail ? `${fail} problem(s)` : `data: all lines, ${deck.order.length} duel cards, traps and plans OK`);
process.exit(fail ? 1 : 0);
