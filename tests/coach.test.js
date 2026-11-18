// The coach's verdicts and reasons on known positions (uses the real engine).
const { app, engine, Chess } = require("./lib");
const { explainMove, bookAt } = app;
const cases = [
  { name: "hangs a bishop", moves: "e4 c6 d4 d5 e5 e6 Nf3 c5 c3 Nc6 Be2 Qb6 O-O Bd7 Na3 cxd4 cxd4 Bd6", op: "caro", me: "b", cls: ["blunder", "mistake"], msg: /taken for free/, rule: /what can my opponent take/ },
  { name: "Karpov smothered mate", moves: "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Nd7 Qe2 Ngf6", op: "caro", me: "b", cls: ["blunder"], msg: /checkmate/ },
  { name: "Elephant Trap", moves: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 cxd5 exd5 Nxd5", op: "qg", me: "w", cls: ["blunder", "mistake"], msg: /trap/ },
  { name: "book move", moves: "e4 c6 d4 d5 e5 Bf5", op: "caro", me: "b", cls: ["book"] },
  { name: "locked bishop", moves: "e4 c6 d4 d5 e5 e6", op: "caro", me: "b", cls: ["good", "inaccuracy", "excellent"], msg: /bishop out before/ },
];
(async () => {
  const sf = engine(); let fail = 0;
  for (const c of cases) {
    const g = new Chess(); const all = c.moves.split(" "); all.slice(0, -1).forEach(m => g.move(m));
    const fenBefore = g.fen(); const history = g.history({ verbose: true });
    const before = await sf.analyze(fenBefore, 13, 3); const move = g.move(all[all.length - 1]); const after = await sf.analyze(g.fen(), 13, 1);
    const r = explainMove({ fenBefore, move, me: c.me, before, after, opening: c.op, history, book: bookAt(c.op, fenBefore) });
    const ok = c.cls.includes(r.cls) && (!c.msg || c.msg.test(r.msg.join(" "))) && (!c.rule || c.rule.test(r.rule || ""));
    if (!ok) fail++;
    console.log(`${ok ? "ok  " : "FAIL"} ${c.name}: [${r.cls}] ${r.msg[0] || ""} | ${r.better} | Rule: ${r.rule}`);
  }
  sf.quit(); process.exit(fail ? 1 : 0);
})();
