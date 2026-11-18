// ===== Opening repertoire (plain-language ideas for every move) =====
// Lines use PGN-style text: moves, with {comments} after the move they explain.
const REPERTOIRE = {
  caro: {
    name: "Caro-Kann",
    you: "b",
    blurb: "You play Black. Stay solid, then strike back.",
    lines: [
      { name: "Classical (main line)", weight: 5, pgn: `
1.e4 {White puts a pawn in the middle.}
c6 {Getting ready to play d5. Your c8 bishop can still come out.}
2.d4 {White adds a second pawn in the middle.}
d5 {Attack White's pawn on e4.}
3.Nc3 {White protects e4 with a knight.}
dxe4 {Take it. Swapping pawns gives your pieces room.}
4.Nxe4
Bf5 {Bring your bishop out now, before e6 blocks it in. It also hits the knight.}
5.Ng3 {White's knight attacks your bishop.}
Bg6 {Step back. Your bishop stays on a good line.}
6.h4 {White wants to push h5 and trap your bishop.}
h6 {Make room on h7, so your bishop can always escape there.}
7.Nf3 {White brings out a knight.}
Nd7 {Guard e5, so White's knight can't jump there.}
8.h5 {White pushes again and attacks your bishop.}
Bh7 {Step back to h7. That's why you made room there.}
9.Bd3 {White offers to swap bishops.}
Bxd3 {Swap. That bishop was White's best attacker.}
10.Qxd3 {White takes back with the queen.}
e6 {Now e6 is perfect. Your bishop is already out.}
11.Bd2 {White gets ready to castle on the queen's side.}
Ngf6 {Knight out. It guards your king's side.}
12.O-O-O {White castles toward the queen's side.}
Be7 {Get your pieces out and castle. Later, push c5.}
` },
      { name: "Classical via 3.Nd2", weight: 2, pgn: `
1.e4 c6 2.d4 d5
3.Nd2 {Same idea as Nc3: protect e4.}
dxe4 {Take it, same as against the other knight.}
4.Nxe4
Bf5 {Same as the main line. Bishop out first.}
5.Ng3 Bg6 6.N1e2 {White brings the other knight over to chase your bishop.}
Nf6 {Bring out a knight and guard your king's side.}
7.Nf4
e5 {Hit the middle while White's knights chase your bishop.}
` },
      { name: "Advance: Short system", weight: 4, pgn: `
1.e4 c6 2.d4 d5
3.e5 {White pushes past you. The middle is locked now.}
Bf5 {Same rule: bishop out before e6.}
4.Nf3 {White just brings out pieces.}
e6 {Now e6 is fine. Your bishop is already out.}
5.Be2 {White gets ready to castle.}
c5 {Attack the pawn on d4. It holds up White's pawn on e5.}
6.O-O {White castles.}
Nc6 {Attack d4 again.}
7.c3
cxd4 {Swap pawns. Afterward, no pawn can protect White's d4 pawn.}
8.cxd4
Nge7 {Bring out your last knight. Next: bishop to e7, castle, rook to c8.}
` },
      { name: "Advance: 4.h4 (Tal)", weight: 1, pgn: `
1.e4 c6 2.d4 d5 3.e5 Bf5
4.h4 {White wants g4 and h5 to trap your bishop.}
h5 {Stop that pawn right here. Your bishop stays safe.}
5.c4
e6 {Your bishop is out, so e6 is fine now.}
` },
      { name: "Advance: 4.Nc3 and g4", weight: 1, pgn: `
1.e4 c6 2.d4 d5 3.e5 Bf5
4.Nc3
e6 {Close the wall. Your bishop is already out.}
5.g4 {White chases your bishop with pawns.}
Bg6 {Step back. Your bishop stays outside the wall.}
6.Nge2
c5 {When White attacks on the side, hit the middle. Attack d4.}
` },
      { name: "Advance: 4.Bd3 trade", weight: 1, pgn: `
1.e4 c6 2.d4 d5 3.e5 Bf5
4.Bd3 {White offers to swap bishops.}
Bxd3 {Swap. White's good bishop is gone.}
5.Qxd3
e6 {Close the wall. Nothing is stuck behind it.}
6.Nf3
c5 {Attack d4. It holds up the pawn on e5.}
` },
      { name: "Exchange", weight: 3, pgn: `
1.e4 c6 2.d4 d5
3.exd5 {White swaps pawns.}
cxd5 {Take back with the c-pawn. It points toward the middle.}
4.Bd3 {White points a bishop at your king's side.}
Nc6 {Bring out a knight. It also eyes d4.}
5.c3 {White protects d4 with a pawn.}
Nf6 {Bring out your other knight.}
6.Bf4 {White brings out the other bishop.}
Bg4 {Bishop out before e6, like always.}
7.Qb3 {White's queen attacks your pawn on b7.}
Qd7 {Protect b7. Stay calm.}
8.Nd2
e6 {Close the wall. Your bishop is already out.}
9.Ngf3
Bd6 {Offer to swap off White's strong bishop on f4.}
10.Bxd6
Qxd6 {Take back with the queen.}
11.O-O
O-O {Next: push your b-pawn up to attack White's pawn on c3.}
` },
      { name: "Panov-Botvinnik", weight: 2, pgn: `
1.e4 c6 2.d4 d5 3.exd5 cxd5
4.c4 {White attacks your d5 pawn from the side.}
Nf6 {Bring out a knight. It protects d5.}
5.Nc3 {White attacks d5 again.}
e6 {Here e6 is fine. The middle is open, so your bishop can come out later.}
6.Nf3 {White brings out a knight.}
Be7 {Bishop out, so you can castle soon.}
7.cxd5 {White swaps pawns on d5.}
Nxd5 {Take back with the knight. On d5 it sits right in front of White's d4 pawn.}
8.Bd3
Nc6 {Attack d4.}
9.O-O
O-O {Castle. Your king is safe now.}
10.Re1
Bf6 {Attack d4 a third time. Swapping pieces helps you here.}
` },
      { name: "Two Knights", weight: 1, pgn: `
1.e4 c6
2.Nc3 {White brings out a knight first.}
d5 {Put your pawn in the middle anyway.}
3.Nf3 {White brings out the other knight.}
Bg4 {Attack the knight. You're happy to swap your bishop for it.}
4.h3
Bxf3 {Take the knight instead of stepping back.}
5.Qxf3
e6 {Your bishop is gone, so e6 is fine. Your pawns are solid.}
6.d3
Nf6 {Knight out. It guards your king's side.}
7.Bd2
Nbd7 {Just bring out pieces. Next a bishop out, then castle.}
` },
      { name: "Fantasy 3.f3", weight: 1, pgn: `
1.e4 c6 2.d4 d5
3.f3 {White protects e4 with a pawn.}
e6 {Play it safe. Next your bishop comes out and c5 hits the middle.}
4.Nc3
Bb4 {Your bishop attacks the knight that protects e4.}
` },
    ],
  },
};

// ===== Game plans by pawn structure (the coach detects the structure on the board) =====
// Each step has a check id the app knows how to test, or "tip" for advice only.
const PLANS = {
  "ck-advance": { name: "White pushed to e5", for: "b", focus: "d4", moves: [["c5"], ["Nc6", "Qb6", "Ne7", "Nf5", "Nge7"], ["O-O", "Rc8"], []],
    look: "White has pawns on d4 and e5. Yours are on d5 and e6.",
    steps: [
      { t: "Attack d4 with your c-pawn (c5)", check: "b_c5_or_no_wd4", why: "d4 holds up e5. If d4 falls, e5 gets weak too." },
      { t: "Attack d4 more: knight to c6, queen to b6", check: "b_pressure_d4", why: "More attackers than defenders wins the pawn." },
      { t: "Castle, then a rook to c8", check: "b_castled_rook_c", why: "When the c column opens, your rook is ready." },
      { t: "If White pushes f4 and f5, push f6", check: "tip", why: "Hit e5 from the other side." },
    ],
    quiz: { q: "", right: "", wrong: [], why: "" } },
  "ck-classical": { name: "Your solid wall (c6 + e6)", for: "b", focus: "d4", moves: [["Ngf6", "Nf6", "Be7", "Bd6", "Nd7"], ["O-O", "O-O-O"], ["c5", "e5"], []],
    look: "White has a pawn on d4. Your pawns on c6 and e6 make a wall.",
    steps: [
      { t: "Bring out your knights and bishops", check: "minors_done", why: "Your position is safe. Get everything out first." },
      { t: "Castle", check: "castled", why: "Tuck your king away before the fight starts." },
      { t: "Attack d4 with your c-pawn (c5)", check: "b_break_c5", why: "It's White's only pawn in the middle." },
      { t: "Swap pieces when it's safe", check: "tip", why: "Your pawns are healthy. Fewer pieces means less danger for you." },
    ],
    quiz: { q: "", right: "", wrong: [], why: "" } },
  "ck-exchange": { name: "Open c column", for: "b", focus: "c3", moves: [["Rc8", "Rac8", "Rfc8"], ["Rab8", "b5", "b4"], ["Ne4", "Nc4"]],
    look: "Your pawn is on d5. White has pawns on c3 and d4.",
    steps: [
      { t: "Put a rook on the c column", check: "b_rook_c", why: "It's empty, so your rook can go far." },
      { t: "Push your b-pawn to b5, then b4", check: "b_minority", why: "It attacks White's pawn on c3." },
      { t: "Put a knight on e4 or c4", check: "b_knight_outpost", why: "White's pawns can't chase it away easily." },
    ],
    quiz: { q: "", right: "", wrong: [], why: "" } },
  "iqp-against": { name: "White's lonely d4 pawn", for: "b", focus: "d4", moves: [["Nd5", "Nbd5", "Nfd5"], ["Nc6", "Bf6", "Rd8", "Qd6"], []],
    look: "White's d4 pawn has no pawn neighbors.",
    steps: [
      { t: "Put a knight on d5", check: "b_knight_d5", why: "Right in front of the pawn. No pawn can chase it away." },
      { t: "Attack d4 with more pieces", check: "b_pressure_d4", why: "Only pieces can guard a lonely pawn. Keep them busy." },
      { t: "Swap pieces", check: "tip", why: "Each swap makes White's attack weaker." },
    ],
    quiz: { q: "", right: "", wrong: [], why: "" } },
};

// Goals by game phase (checks run on the board)
const GOALS = {
  opening: [
    { id: "center", t: "Put a pawn in the middle" },
    { id: "develop", t: "Get your knights and bishops out" },
    { id: "castle", t: "Castle your king" },
    { id: "connect", t: "Clear your back row so your rooks see each other" },
  ],
  middlegame: [
    { id: "castle", t: "King safe (castled)" },
    { id: "rooks", t: "Rooks on columns with no pawns" },
    { id: "worst", t: "Move your least useful piece" },
    { id: "targets", t: "Find a weak pawn to attack" },
  ],
  endgame: [
    { id: "king", t: "Walk your king to the middle" },
    { id: "passed", t: "Push a pawn that has no enemy pawns in front" },
    { id: "trade", t: "Ahead? Swap pieces, not pawns" },
  ],
};

// Famous traps: a note shown when you step into one
const TRAPS = [
  { moves: "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Nd7 Qe2", san: "Ngf6", note: "Now White's knight jumps to d6 and it's checkmate. Your e7 pawn can't take it.", rule: "Before every move, look at every check your opponent could give." },
];

// ===== Learn (reflex duel): each kind of White move gets a color, so you link White's choice to your answer.
const FAMILIES = {
  start: { name: "Start", color: "#5b6b62" },
  protect: { name: "White protects", color: "#2f9e5b" },
  push: { name: "White pushes", color: "#e07a1f" },
  swap: { name: "White swaps", color: "#2f7fd1" },
  attack: { name: "White attacks d5", color: "#7a5ae0" },
  rare: { name: "Rare tries", color: "#d14f8a" },
};
// ===== Learn runs: each run is a fixed set of positions (White just moved, you answer).
// Clear a run 5 times (finish with a heart left) to open the next. Every card in the deck is in exactly one run.
const RUNS = [
  { id: "first", name: "White's first moves", family: "start", cues: ["e4", "e4 c6 d4", "e4 c6 d4 d5 Nc3", "e4 c6 d4 d5 Nd2", "e4 c6 d4 d5 e5", "e4 c6 d4 d5 exd5"] },
  { id: "protect", name: "White protects", family: "protect", cues: ["e4 c6 d4 d5 Nc3 dxe4 Nxe4", "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3", "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4", "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3", "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5"] },
  { id: "protect2", name: "White protects, part 2", family: "protect", cues: ["e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3", "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3", "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6 Bd2", "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6 Bd2 Ngf6 O-O-O", "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Bf5 Ng3 Bg6 N1e2", "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Bf5 Ng3 Bg6 N1e2 Nf6 Nf4"] },
  { id: "push", name: "White pushes", family: "push", cues: ["e4 c6 d4 d5 e5 Bf5 Nf3", "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2", "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 O-O", "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 O-O Nc6 c3", "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 O-O Nc6 c3 cxd4 cxd4"] },
  { id: "swap", name: "White swaps", family: "swap", cues: ["e4 c6 d4 d5 exd5 cxd5 Bd3", "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3", "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4", "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3", "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2", "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2 e6 Ngf3", "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2 e6 Ngf3 Bd6 Bxd6", "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2 e6 Ngf3 Bd6 Bxd6 Qxd6 O-O"] },
  { id: "c4", name: "White attacks with c4", family: "attack", cues: ["e4 c6 d4 d5 exd5 cxd5 c4", "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3", "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3", "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5", "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5 Nxd5 Bd3", "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5 Nxd5 Bd3 Nc6 O-O", "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5 Nxd5 Bd3 Nc6 O-O O-O Re1"] },
  { id: "rarepush", name: "Surprise pushes", family: "rare", cues: ["e4 c6 d4 d5 e5 Bf5 h4", "e4 c6 d4 d5 e5 Bf5 h4 h5 c4", "e4 c6 d4 d5 e5 Bf5 Nc3", "e4 c6 d4 d5 e5 Bf5 Nc3 e6 g4", "e4 c6 d4 d5 e5 Bf5 Nc3 e6 g4 Bg6 Nge2", "e4 c6 d4 d5 e5 Bf5 Bd3", "e4 c6 d4 d5 e5 Bf5 Bd3 Bxd3 Qxd3", "e4 c6 d4 d5 e5 Bf5 Bd3 Bxd3 Qxd3 e6 Nf3"] },
  { id: "rarestart", name: "Surprise starts", family: "rare", cues: ["e4 c6 Nc3", "e4 c6 Nc3 d5 Nf3", "e4 c6 Nc3 d5 Nf3 Bg4 h3", "e4 c6 Nc3 d5 Nf3 Bg4 h3 Bxf3 Qxf3", "e4 c6 Nc3 d5 Nf3 Bg4 h3 Bxf3 Qxf3 e6 d3", "e4 c6 Nc3 d5 Nf3 Bg4 h3 Bxf3 Qxf3 e6 d3 Nf6 Bd2", "e4 c6 d4 d5 f3", "e4 c6 d4 d5 f3 e6 Nc3"] },
  { id: "all", name: "Everything", family: "start", all: true },
];

// White's choice → family, so the duel can flash the right color
function familyOf(sans) {
  const s = sans.join(" ");
  if (s.startsWith("e4 c6 Nc3")) return "rare";
  if (/^e4 c6 d4 d5 (Nc3|Nd2)/.test(s)) return "protect";
  if (/^e4 c6 d4 d5 e5/.test(s)) return /e5 Bf5 (h4|Bd3|Nc3)/.test(s) ? "rare" : "push";
  if (/^e4 c6 d4 d5 exd5 cxd5 c4/.test(s)) return "attack";
  if (/^e4 c6 d4 d5 exd5/.test(s)) return "swap";
  if (/^e4 c6 d4 d5 f3/.test(s)) return "rare";
  return "start";
}
