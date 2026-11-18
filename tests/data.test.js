// Every repertoire line, Learn level and trap must be legal chess, and every level move must be a taught move.
const { app, Chess } = require("./lib");
const { REPERTOIRE, PATH, FAMILIES, familyOf, TRAPS, PLANS, parsePgnText, bookAt } = app;
let fail = 0;
const bad = msg => { fail++; console.log("FAIL", msg); };
for (const [key, op] of Object.entries(REPERTOIRE))
  for (const line of op.lines) {
    const g = new Chess();
    for (const mv of parsePgnText(line.pgn)) if (!g.move(mv.san)) { bad(`${key} / ${line.name}: illegal ${mv.san}`); break; }
  }
if (Object.keys(REPERTOIRE).join() !== "caro") bad("only the Caro-Kann should be in the repertoire");
for (const lv of PATH) {
  if (!FAMILIES[lv.family]) bad(`level ${lv.id}: unknown family ${lv.family}`);
  if (lv.mix) continue;
  for (const r of lv.runs) {
    const g = new Chess();
    for (const m of r.start ? r.start.split(" ") : []) if (!g.move(m)) { bad(`level ${lv.id}: start move ${m} illegal`); break; }
    for (const m of r.moves.split(" ")) {
      if (!bookAt("caro", g.fen()).some(b => b.san === m)) bad(`level ${lv.id}: ${m} is not a repertoire move here`);
      if (!g.move(m)) { bad(`level ${lv.id}: ${m} illegal`); break; }
    }
    const fam = familyOf(g.history().length ? [...(r.start ? r.start.split(" ") : []), ...r.moves.split(" ")] : []);
    if (lv.family !== "start" && fam !== lv.family) bad(`level ${lv.id}: White's choice reads as ${fam}, expected ${lv.family}`);
  }
}
for (const t of TRAPS) { const g = new Chess(); t.moves.split(" ").forEach(m => g.move(m) || bad(`trap: illegal ${m}`)); if (!g.move(t.san)) bad(`trap ${t.san} illegal`); }
for (const [id, p] of Object.entries(PLANS)) if (!p.focus || !p.moves || p.moves.length < p.steps.filter(s => s.check !== "tip").length) bad(`plan ${id}: missing focus/moves`);
console.log(fail ? `${fail} problem(s)` : "data: all lines, levels, traps and plans OK");
process.exit(fail ? 1 : 0);
