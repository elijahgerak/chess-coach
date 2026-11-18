// Loads the app's pure modules (data + coach logic) into Node, plus a tiny Stockfish wrapper.
const fs = require("fs");
const path = require("path");
const { Chess } = require("chess.js");
global.Chess = Chess;
const src = f => fs.readFileSync(path.join(__dirname, "..", "src", f), "utf8");
const app = new Function("Chess", src("data.js") + src("core.js") +
  "\nreturn { REPERTOIRE, PATH, FAMILIES, familyOf, PLANS, TRAPS, GOALS, explainMove, bookAt, detectStructure, goalsFor, boardMap, parsePgnText, principleFor, winPct, toCp };")(Chess);

function engine() {
  const sf = require(path.join(__dirname, "..", "vendor", "stockfish", "stockfish-19-lite-single.js"))();
  let pending = null, buf = [];
  sf.listener = line => { if (!pending) return; buf.push(line); if (line.startsWith("bestmove")) { const r = pending; pending = null; r(buf.splice(0)); } };
  sf.processCommand("uci");
  return {
    analyze(fen, depth = 13, mpv = 1) {
      return new Promise(res => {
        pending = lines => {
          const L = {};
          for (const l of lines) { const m = l.match(/multipv (\d+) score (cp|mate) (-?\d+).* pv (.+)$/); if (m && !/bound/.test(l)) L[m[1]] = { score: m[2] === "cp" ? { cp: +m[3] } : { mate: +m[3] }, pv: m[4].split(" ") }; }
          res({ lines: Object.keys(L).sort((a, b) => a - b).map(k => L[k]), depth });
        };
        sf.processCommand("setoption name MultiPV value " + mpv);
        sf.processCommand("position fen " + fen);
        sf.processCommand("go depth " + depth);
      });
    },
    quit() { sf.terminate ? sf.terminate() : sf.processCommand("quit"); },
  };
}
module.exports = { app, engine, Chess };
