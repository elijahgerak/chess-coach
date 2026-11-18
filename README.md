# Caro-Kann & QG Coach

Play Stockfish in the **Caro-Kann** (as Black) or the **Queen's Gambit** (as White). After every move the coach tells you, in one plain sentence, what went wrong, plays out the moves that show the problem, and gives you the better move with a rule of thumb behind it.

**Live:** https://elijahgerak.github.io/chess-coach/ (open in Safari → Share → Add to Home Screen)

- **Play:** Stockfish 19, strength from about 600 to full, adjusting as you win and lose. Mistakes pause the game so you can try again. Your plan is drawn on the board.
- **Practice:** your mistakes and key opening ideas come back on a spaced schedule.
- **Review:** paste a chess.com game (Share → PGN → Copy) and find the better moves at your key moments.

## Develop

```bash
npm install          # chess.js for tests
npm test             # data legality + coach verdicts against the real engine
npm run test:book    # engine-checks every move the repertoire teaches (slow)
npm run serve        # build and open http://localhost:8765
npm run deploy       # build and publish to GitHub Pages
```

Source lives in `src/`, `python3 build.py` stitches it into `site/` (GitHub Pages) and `dist/` (Claude artifact). See `CLAUDE.md` for how everything fits together.

Engine: [Stockfish.js](https://github.com/nmrugg/stockfish.js) (GPL-3.0, in `vendor/stockfish`). Piece art: cburnett set via lichess chessground (CC BY-SA 3.0).
