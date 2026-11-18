// Every repertoire line, concept position and trap must be legal chess.
const { app, Chess } = require("./lib");
const { REPERTOIRE, CONCEPTS, TRAPS, PLANS, parsePgnText } = app;
let fail = 0;
const bad = msg => { fail++; console.log("FAIL", msg); };
for (const [key, op] of Object.entries(REPERTOIRE))
  for (const line of op.lines) {
    const g = new Chess();
    for (const mv of parsePgnText(line.pgn)) if (!g.move(mv.san)) { bad(`${key} / ${line.name}: illegal ${mv.san}`); break; }
  }
for (const c of CONCEPTS) {
  const g = new Chess();
  for (const s of c.moves.split(" ")) if (!g.move(s)) { bad(`concept ${c.id}: illegal ${s}`); break; }
  if (g.turn() !== REPERTOIRE[c.opening].you) bad(`concept ${c.id}: wrong side to move`);
  for (const a of c.accept) if (!new Chess(g.fen()).move(a)) bad(`concept ${c.id}: answer ${a} illegal`);
}
for (const t of TRAPS) { const g = new Chess(); t.moves.split(" ").forEach(m => g.move(m) || bad(`trap: illegal ${m}`)); if (!g.move(t.san)) bad(`trap ${t.san} illegal`); }
for (const [id, p] of Object.entries(PLANS)) if (!p.focus || !p.moves || p.moves.length < p.steps.filter(s => s.check !== "tip").length) bad(`plan ${id}: missing focus/moves`);
console.log(fail ? `${fail} problem(s)` : "data: all lines, concepts, traps and plans OK");
process.exit(fail ? 1 : 0);
