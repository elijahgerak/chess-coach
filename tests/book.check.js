// Engine-checks every repertoire move you're taught (Learn levels use the same moves). Flags anything that loses > 4% win chance.
const { app, engine, Chess } = require("./lib");
const { REPERTOIRE, parsePgnText, winPct } = app;
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
  console.log(flagged ? `${flagged} move(s) to look at` : "book: every taught move is sound");
  sf.quit();
})();
