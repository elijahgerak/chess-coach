// Engine-checks every repertoire move you're taught (Learn levels use the same moves). Flags anything that loses > 4% win chance.
const { app, engine, Chess } = require("./lib");
const { REPERTOIRE, PRINCIPLE_RUNS, parsePgnText, winPct } = app;
const cp = s => s.mate != null ? (s.mate > 0 ? 100000 - s.mate : -100000 - s.mate) : s.cp;
(async () => {
  const sf = engine(); const seen = new Set(); let flagged = 0;
  for (const [key, op] of Object.entries(REPERTOIRE)) for (const line of op.lines) {
    const g = new Chess();
    for (const mv of parsePgnText(line.pgn)) {
      const fen = g.fen(); const mine = g.turn() === op.you; g.move(mv.san);
      if (!mine || seen.has(fen + mv.san)) continue; seen.add(fen + mv.san);
      const b = await sf.analyze(fen); const a = await sf.analyze(g.fen());
      const loss = winPct(cp(b.lines[0].score)) - winPct(-cp(a.lines[0].score));
      if (loss > 4) { flagged++; console.log(`[${key}] ${line.name}: ${mv.san} loses ${loss.toFixed(1)}% (engine: ${b.lines[0].pv[0]})`); }
    }
  }
  // principles: every accepted answer must be within 4% of the engine's best
  for (const r of PRINCIPLE_RUNS) for (const c of r.cards || []) {
    const g = new Chess(); (c.moves ? c.moves.split(" ") : []).forEach(m => g.move(m)); const fen = g.fen();
    const b = await sf.analyze(fen, 15);
    for (const ans of c.answers) {
      const h = new Chess(fen); h.move(ans); if (h.in_checkmate()) continue;
      const a = await sf.analyze(h.fen(), 15);
      const loss = winPct(cp(b.lines[0].score)) - winPct(-cp(a.lines[0].score));
      if (loss > 4) { flagged++; console.log(`[principles] ${r.name} "${c.moves}": ${ans} loses ${loss.toFixed(1)}% (engine: ${b.lines[0].pv[0]})`); }
    }
  }
  console.log(flagged ? `${flagged} move(s) to look at` : "book: every taught move is sound");
  sf.quit();
})();
