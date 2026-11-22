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
      { name: "Against d4: Slav", weight: 3, pgn: `
1.d4 {White starts with the queen's pawn.}
d5 {Take your share of the middle, same as against e4.}
2.c4 {White attacks your pawn on d5 from the side.}
c6 {Guard d5 with a pawn. That's the Caro-Kann idea again.}
3.Nf3 {White brings out a knight.}
Nf6 {Knight out. It guards d5 too.}
4.Nc3 {White attacks d5 again.}
dxc4 {Take the pawn. White has to spend time winning it back.}
5.a4 {White stops you from holding the pawn with b5.}
Bf5 {Bishop out before e6, just like in the Caro-Kann.}
6.e3 {White gets ready to take back on c4.}
e6 {Now close the wall. Your bishop is already out.}
7.Bxc4 {White wins the pawn back.}
Bb4 {Bishop out. It pins White's knight to the king.}
8.O-O {White castles.}
O-O {Castle. Your king is safe.}` },
      { name: "Against d4: Slav, knight first", weight: 1, pgn: `
1.d4 d5 2.c4 c6
3.Nc3 {White brings out the other knight first.}
Nf6 {Knight out. It guards d5.}
4.Nf3 dxc4 5.a4 Bf5` },
      { name: "Against d4: Slav, quiet e3", weight: 1, pgn: `
1.d4 d5 2.c4 c6 3.Nf3 Nf6
4.e3 {White quietly guards c4 and d4.}
Bf5 {Bishop out before e6.}
5.Nc3 {White brings out the other knight.}
e6 {Close the wall now.}
6.Nh4 {The knight chases your bishop.}
Bg6 {Step back. Your bishop stays outside the wall.}
7.Nxg6 {White takes your bishop.}
hxg6 {Take back. Your rook gets room on the side.}` },
      { name: "Against d4: White swaps on d5", weight: 2, pgn: `
1.d4 d5 2.c4 c6
3.cxd5 {White swaps pawns in the middle.}
cxd5 {Take back with the side pawn. Now it stands in the middle.}
4.Nc3 {White attacks d5.}
Nf6 {Knight out. It guards d5.}
5.Bf4 {White brings out a bishop.}
Nc6 {Other knight out.}
6.e3 {White opens a path for the other bishop.}
Bf5 {Bishop out, before e6.}
7.Nf3 {White brings out the last knight.}
e6 {Close the wall. Your bishop is already out.}` },
      { name: "Against d4: London", weight: 2, pgn: `
1.d4 d5
2.Bf4 {White brings a bishop out early. This is called the London.}
c5 {Hit the pawn on d4 right away.}
3.e3 {White props up d4.}
Nc6 {Knight out. It attacks d4 too.}
4.Nf3 {White guards d4 with a knight.}
Nf6 {Other knight out.}
5.c3 {White guards d4 with another pawn.}
Qb6 {Queen out. She attacks the pawn on b2, which White's bishop left behind.}
6.Qb3 {White blocks with the queen.}
c4 {Push past. Now White's queen has to move.}
7.Qc2 {The queen steps back.}
Bf5 {Bishop out, and it attacks White's queen.}` },
      { name: "Against d4: knight first", weight: 1, pgn: `
1.d4 d5
2.Nf3 {White brings out a knight first.}
Nf6 {Knight out too.}
3.c4 {White attacks d5 from the side.}
c6 {Guard d5 with a pawn, the Caro-Kann way.}
4.Nc3 dxc4` },
      { name: "Against d4: knight, then London", weight: 1, pgn: `
1.d4 d5 2.Nf3 Nf6
3.Bf4 {White brings the bishop out: the London again.}
c5 {Hit the pawn on d4 right away.}
4.e3 {White props up d4.}
Nc6 {Knight out. It attacks d4 too.}
5.c3 Qb6` },
    ],
  },
  qg: {
    name: "Queen's Gambit",
    you: "w",
    blurb: "You play White. Pressure Black's d5 pawn and take space.",
    lines: [
      { name: "QGD Orthodox", weight: 4, pgn: `
1.d4 {Put a pawn in the middle.}
d5
2.c4 {Attack Black's d5 pawn from the side. If Black takes it, you'll win it back.}
e6 {Black protects d5, but blocks in their c8 bishop.}
3.Nc3 {Attack d5 again.}
Nf6
4.Bg5 {Attack the knight that protects d5.}
Be7
5.e3 {Open a path for your f1 bishop.}
O-O
6.Nf3 {Bring out your knight. It guards the middle.}
Nbd7
7.Rc1 {Rook to the c column. That's where the fight will be.}
c6
8.Bd3 {Bring out your last piece.}
dxc4
9.Bxc4 {Take the pawn back with your bishop.}
Nd5 {Black wants to swap pieces to get more room.}
10.Bxe7 {Swap bishops.}
Qxe7
11.O-O {Castle. Your king is safe.}
Nxc3
12.Rxc3 {Take back with the rook.}
e5 {Black frees their bishop. Your plan: queen to c2, bishop to b3, keep the pressure on.}
` },
      { name: "QGD: Elephant Trap test", weight: 2, pgn: `
1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5
Nbd7 {Careful! This sets a trap.}
5.e3 {Right. Don't take on d5 with your knight. A trick would cost you a piece.}
Be7
6.Nf3 {Bring out your knight.}
O-O
7.Rc1 {Back to the normal plan.}
` },
      { name: "Exchange (minority attack)", weight: 3, pgn: `
1.d4 d5 2.c4 e6 3.Nc3 Nf6
4.cxd5 {Swap pawns. You get one simple plan for the whole game.}
exd5
5.Bg5 {Attack the knight that guards d5.}
c6
6.e3 {Open a path for your other bishop.}
Be7
7.Bd3 {Bishop out.}
Nbd7
8.Qc2 {Queen out, next to your bishop.}
O-O
9.Nf3 {Knight out.}
Re8
10.O-O {Castle. Your king is safe.}
Nf8
11.Rab1 {Plan: push your b-pawn to b4, then b5. That leaves Black with a weak pawn.}
` },
      { name: "Queen's Gambit Accepted", weight: 3, pgn: `
1.d4 d5 2.c4
dxc4 {Black takes the pawn. In return, Black gets free moves for pieces.}
3.Nf3 {Bring out a knight first.}
Nf6
4.e3 {This opens the way for your bishop to take back on c4.}
e6
5.Bxc4 {Pawn back, and your bishop is out.}
c5
6.O-O {Castle. Your king is safe.}
a6
7.a4 {Stop b5, which would kick your bishop.}
Nc6
8.Qe2 {Queen out. Your rook can come to the middle next.}
cxd4
9.Rd1 {Rook to the d column. It attacks d4.}
Be7
10.exd4 {Take back.}
O-O
11.Nc3 {Your d4 pawn has no pawn friends next to it. Keep pieces on and attack.}
` },
      { name: "Slav", weight: 3, pgn: `
1.d4 d5 2.c4
c6 {Black protects d5 with a pawn. Their c8 bishop stays free.}
3.Nf3 {Bring out a knight. It guards d4.}
Nf6
4.Nc3 {Attack d5 again.}
dxc4 {Black takes the pawn.}
5.a4 {Stop b5, so Black can't keep the extra pawn.}
Bf5
6.e3 {Open a path for your bishop.}
e6
7.Bxc4 {Pawn back.}
Bb4
8.O-O {Castle. Your king is safe.}
O-O
9.Qe2 {Queen out. It backs up a push to e4.}
Nbd7
10.e4 {Push to e4. You take the middle and chase Black's bishop.}
Bg6
11.Bd3 {Next: push e5, and chase the bishop with your knight from h4.}
` },
      { name: "Semi-Slav", weight: 2, pgn: `
1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3
e6 {Black builds a strong wall.}
5.e3 {Calmly bring out pieces.}
Nbd7
6.Qc2 {Your queen gets ready to support a push to e4.}
Bd6
7.Bd3 {Bishop out. It backs up the push to e4.}
O-O
8.O-O {Castle. Your king is safe.}
dxc4
9.Bxc4 {Next: push e4 and take the middle.}
` },
      { name: "Albin Countergambit", weight: 1, pgn: `
1.d4 d5 2.c4
e5 {Black gives up a pawn to get fast play.}
3.dxe5 {Take it.}
d4 {This pawn gets in your way.}
4.Nf3 {Right. Pushing e3 here walks into a trap.}
Nc6
5.g3 {Get ready to put your bishop on g2.}
Be6
6.Nbd2 {Bring out your other knight. It can go after the pawn on d4 later.}
Qd7
7.Bg2 {Plan: castle, then push a3 and b4. You're a pawn up.}
` },
      { name: "Tarrasch", weight: 1, pgn: `
1.d4 d5 2.c4 e6 3.Nc3
c5 {Black wants active pieces, even if a pawn ends up weak.}
4.cxd5 {Swap pawns in the middle.}
exd5
5.Nf3 {Bring out a knight.}
Nc6
6.g3 {Your bishop will go to g2 and aim at d5.}
Nf6
7.Bg2 {Bishop out. It aims at d5.}
Be7
8.O-O {Castle. Your king is safe.}
O-O
9.Bg5 {Attack the knight that protects d5. Plan: pile up on d5.}
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
  dfour: { name: "White starts with d4", color: "#0f8b8d" },
  "cb-bishop": { name: "Bishop out before e6", color: "#2f9e5b" },
  "cb-side": { name: "Hit the middle from the side", color: "#e07a1f" },
  "cb-back": { name: "Take back toward the middle", color: "#2f7fd1" },
  "cb-safe": { name: "Keep your bishop safe", color: "#7a5ae0" },
  "qb-d5": { name: "Pressure the pawn on d5", color: "#0f8b8d" },
  "qb-out": { name: "Everything out first", color: "#2f7fd1" },
  "qb-pawn": { name: "Win the pawn back calmly", color: "#e07a1f" },
  "qb-castle": { name: "Castle before the fight", color: "#7a5ae0" },
  london: { name: "White's bishop comes out early", color: "#e07a1f" },
  hold: { name: "Black holds with e6", color: "#2f9e5b" },
  slav: { name: "Black holds with c6", color: "#2f7fd1" },
  takes: { name: "Black takes the pawn", color: "#e07a1f" },
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

const QG_RUNS = [
  { id: "qg-first", name: "Your first moves", family: "start", cues: ["", "d4 d5", "d4 d5 c4 e6", "d4 d5 c4 dxc4", "d4 d5 c4 c6", "d4 d5 c4 e5"] },
  { id: "qg-hold", name: "Black holds with e6", family: "hold", cues: ["d4 d5 c4 e6 Nc3 Nf6", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3 dxc4"] },
  { id: "qg-hold2", name: "Black holds, part 2", family: "hold", cues: ["d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3 dxc4 Bxc4 Nd5", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3 dxc4 Bxc4 Nd5 Bxe7 Qxe7", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3 dxc4 Bxc4 Nd5 Bxe7 Qxe7 O-O Nxc3", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 e3 Be7"] },
  { id: "qg-swap", name: "You swap on d5", family: "hold", cues: ["d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7 Qc2 O-O", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7 Qc2 O-O Nf3 Re8", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7 Qc2 O-O Nf3 Re8 O-O Nf8"] },
  { id: "qg-takes", name: "Black takes the pawn", family: "takes", cues: ["d4 d5 c4 dxc4 Nf3 Nf6", "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6", "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5", "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6", "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 a4 Nc6", "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 a4 Nc6 Qe2 cxd4", "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 a4 Nc6 Qe2 cxd4 Rd1 Be7", "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 a4 Nc6 Qe2 cxd4 Rd1 Be7 exd4 O-O"] },
  { id: "qg-slav", name: "Black holds with c6", family: "slav", cues: ["d4 d5 c4 c6 Nf3 Nf6", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2 Nbd7", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2 Nbd7 e4 Bg6"] },
  { id: "qg-wall", name: "Black builds a wall", family: "slav", cues: ["d4 d5 c4 c6 Nf3 Nf6 Nc3 e6", "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7", "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Qc2 Bd6", "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Qc2 Bd6 Bd3 O-O", "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Qc2 Bd6 Bd3 O-O O-O dxc4"] },
  { id: "qg-pawn", name: "Black gives up a pawn", family: "rare", cues: ["d4 d5 c4 e5 dxe5 d4", "d4 d5 c4 e5 dxe5 d4 Nf3 Nc6", "d4 d5 c4 e5 dxe5 d4 Nf3 Nc6 g3 Be6", "d4 d5 c4 e5 dxe5 d4 Nf3 Nc6 g3 Be6 Nbd2 Qd7"] },
  { id: "qg-c5", name: "Black hits back with c5", family: "rare", cues: ["d4 d5 c4 e6 Nc3 c5", "d4 d5 c4 e6 Nc3 c5 cxd5 exd5", "d4 d5 c4 e6 Nc3 c5 cxd5 exd5 Nf3 Nc6", "d4 d5 c4 e6 Nc3 c5 cxd5 exd5 Nf3 Nc6 g3 Nf6", "d4 d5 c4 e6 Nc3 c5 cxd5 exd5 Nf3 Nc6 g3 Nf6 Bg2 Be7", "d4 d5 c4 e6 Nc3 c5 cxd5 exd5 Nf3 Nc6 g3 Nf6 Bg2 Be7 O-O O-O"] },
  { id: "qg-all", name: "Everything", family: "start", all: true },
];

const D4_RUNS = [ // the Caro-Kann player's answer to 1.d4 (the Slav and the London)
  { id: "d4-first", name: "White starts with d4", family: "dfour", cues: ["d4", "d4 d5 c4", "d4 d5 Bf4", "d4 d5 Nf3", "d4 d5 c4 c6 Nf3", "d4 d5 c4 c6 Nc3", "d4 d5 c4 c6 cxd5"] },
  { id: "d4-slav", name: "White attacks with c4", family: "attack", cues: ["d4 d5 c4 c6 Nf3 Nf6 Nc3", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O", "d4 d5 Nf3 Nf6 c4"] },
  { id: "d4-quiet", name: "Quiet moves and swaps", family: "swap", cues: ["d4 d5 c4 c6 Nf3 Nf6 e3", "d4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3", "d4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3 e6 Nh4", "d4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3 e6 Nh4 Bg6 Nxg6", "d4 d5 c4 c6 cxd5 cxd5 Nc3", "d4 d5 c4 c6 cxd5 cxd5 Nc3 Nf6 Bf4", "d4 d5 c4 c6 cxd5 cxd5 Nc3 Nf6 Bf4 Nc6 e3", "d4 d5 c4 c6 cxd5 cxd5 Nc3 Nf6 Bf4 Nc6 e3 Bf5 Nf3"] },
  { id: "d4-london", name: "The London", family: "london", cues: ["d4 d5 Bf4 c5 e3", "d4 d5 Bf4 c5 e3 Nc6 Nf3", "d4 d5 Bf4 c5 e3 Nc6 Nf3 Nf6 c3", "d4 d5 Bf4 c5 e3 Nc6 Nf3 Nf6 c3 Qb6 Qb3", "d4 d5 Bf4 c5 e3 Nc6 Nf3 Nf6 c3 Qb6 Qb3 c4 Qc2", "d4 d5 Nf3 Nf6 Bf4", "d4 d5 Nf3 Nf6 Bf4 c5 e3"] },
  { id: "d4-all", name: "Everything", family: "dfour", all: true },
];

// ===== Principles: the ideas behind your openings, one per run, drilled on positions from your own lines.
// Caro-Kann ideas (you're Black) first, then Queen's Gambit ideas (you're White). Answers and reasons come from the repertoire.
const PRINCIPLE_RUNS = [
  { id: "cb-bishop", op: "caro", name: "Bishop out before e6", family: "cb-bishop", rule: "Get your light bishop out before you play e6. Otherwise it gets stuck behind your own pawns.", cues: ["e4 c6 d4 d5 Nc3 dxe4 Nxe4", "e4 c6 d4 d5 e5", "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4", "d4 d5 c4 c6 cxd5 cxd5 Nc3 Nf6 Bf4 Nc6 e3", "d4 d5 c4 c6 Nf3 Nf6 e3"] },
  { id: "cb-side", op: "caro", name: "Hit the middle from the side", family: "cb-side", rule: "When White's pawns block the middle, attack the pawn holding them up (usually with c5).", cues: ["e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2", "e4 c6 d4 d5 e5 Bf5 Bd3 Bxd3 Qxd3 e6 Nf3", "e4 c6 d4 d5 e5 Bf5 Nc3 e6 g4 Bg6 Nge2", "d4 d5 Bf4", "d4 d5 Nf3 Nf6 Bf4", "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 O-O"] },
  { id: "cb-back", op: "caro", name: "Take back toward the middle", family: "cb-back", rule: "When you take back, pick the piece or pawn that ends up closer to the middle.", cues: ["e4 c6 d4 d5 exd5", "d4 d5 c4 c6 cxd5", "d4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3 e6 Nh4 Bg6 Nxg6", "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5"] },
  { id: "cb-safe", op: "caro", name: "Keep your bishop safe", family: "cb-safe", rule: "Your bishop is your best piece outside the wall. When it's chased, step back, or make an escape square first.", cues: ["e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3", "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4", "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5", "e4 c6 d4 d5 e5 Bf5 Nc3 e6 g4", "e4 c6 d4 d5 e5 Bf5 h4", "d4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3 e6 Nh4"] },
  { id: "qb-d5", op: "qg", name: "Pressure the pawn on d5", family: "qb-d5", rule: "Black's pawn on d5 is your target. Keep adding pieces that attack it.", cues: ["d4 d5", "d4 d5 c4 e6", "d4 d5 c4 e6 Nc3 Nf6", "d4 d5 c4 c6", "d4 d5 c4 c6 Nf3 Nf6", "d4 d5 c4 e6 Nc3 c5"] },
  { id: "qb-out", op: "qg", name: "Everything out first", family: "qb-out", rule: "Bring every piece out before you attack.", cues: ["d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7 Qc2 O-O"] },
  { id: "qb-pawn", op: "qg", name: "Win the pawn back calmly", family: "qb-pawn", rule: "If Black takes on c4, don't chase it. Bring pieces out and the pawn comes back.", cues: ["d4 d5 c4 dxc4", "d4 d5 c4 dxc4 Nf3 Nf6", "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6"] },
  { id: "qb-castle", op: "qg", name: "Castle before the fight", family: "qb-castle", rule: "Castle before the middle opens up.", cues: ["d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5", "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7 Qc2 O-O Nf3 Re8", "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4", "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Qc2 Bd6 Bd3 O-O", "d4 d5 c4 e6 Nc3 c5 cxd5 exd5 Nf3 Nc6 g3 Nf6 Bg2 Be7", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3 dxc4 Bxc4 Nd5 Bxe7 Qxe7"] },
  { id: "r-all", name: "Everything", family: "start", all: true },
];
// The principle cards: the same positions as in the opening decks, tagged with their idea and side
function principleCards() {
  const decks = { caro: duelCards("caro"), qg: duelCards("qg") }, cards = {}, order = [];
  for (const r of PRINCIPLE_RUNS) for (const cue of r.cues || []) {
    const g = new Chess(); (cue ? cue.split(" ") : []).forEach(m => g.move(m));
    const key = fenKey(g.fen()), base = decks[r.op].cards[key];
    if (!base) continue;
    cards[key] = { ...base, parent: null, fam: r.family, rule: r.rule, side: REPERTOIRE[r.op].you };
    order.push(key);
  }
  return { cards, order };
}

// White's choice → family, so the duel can flash the right color
function familyOf(sans, op = "caro") {
  const s = sans.join(" ");
  if (op === "caro" && s.startsWith("d4")) {
    if (/^d4 d5 (Nf3 Nf6 )?Bf4/.test(s)) return "london";
    if (s.startsWith("d4 d5 c4 c6 cxd5")) return "swap";
    if (/^d4 d5 (Nf3 Nf6 )?c4/.test(s)) return "attack";
    return "dfour";
  }
  if (s.startsWith("d4")) {
    if (/^d4 d5 c4 (e5|e6 Nc3 c5)/.test(s)) return "rare";
    if (s.startsWith("d4 d5 c4 dxc4")) return "takes";
    if (s.startsWith("d4 d5 c4 c6")) return "slav";
    if (s.startsWith("d4 d5 c4 e6")) return "hold";
    return "start";
  }
  if (s.startsWith("e4 c6 Nc3")) return "rare";
  if (/^e4 c6 d4 d5 (Nc3|Nd2)/.test(s)) return "protect";
  if (/^e4 c6 d4 d5 e5/.test(s)) return /e5 Bf5 (h4|Bd3|Nc3)/.test(s) ? "rare" : "push";
  if (/^e4 c6 d4 d5 exd5 cxd5 c4/.test(s)) return "attack";
  if (/^e4 c6 d4 d5 exd5/.test(s)) return "swap";
  if (/^e4 c6 d4 d5 f3/.test(s)) return "rare";
  return "start";
}
