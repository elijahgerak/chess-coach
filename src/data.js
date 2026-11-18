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
7.Nf3
Nd7 {Guard e5, so White's knight can't jump there.}
8.h5
Bh7
9.Bd3 {White offers to swap bishops.}
Bxd3 {Swap. That bishop was White's best attacker.}
10.Qxd3
e6 {Now e6 is perfect. Your bishop is already out.}
11.Bd2
Ngf6
12.O-O-O
Be7 {Get your pieces out and castle. Later, push c5.}
` },
      { name: "Classical via 3.Nd2", weight: 2, pgn: `
1.e4 c6 2.d4 d5
3.Nd2 {Same idea as Nc3: protect e4.}
dxe4
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
5.Be2
c5 {Attack the pawn on d4. It holds up White's pawn on e5.}
6.O-O
Nc6 {Attack d4 again.}
7.c3
cxd4
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
e6
5.g4 {White chases your bishop with pawns.}
Bg6
6.Nge2
c5 {When White attacks on the side, hit the middle. Attack d4.}
` },
      { name: "Advance: 4.Bd3 trade", weight: 1, pgn: `
1.e4 c6 2.d4 d5 3.e5 Bf5
4.Bd3 {White offers to swap bishops.}
Bxd3 {Swap. White's good bishop is gone.}
5.Qxd3
e6
6.Nf3
c5 {Attack d4. It holds up the pawn on e5.}
` },
      { name: "Exchange", weight: 3, pgn: `
1.e4 c6 2.d4 d5
3.exd5 {White swaps pawns.}
cxd5 {Take back with the c-pawn. It points toward the middle.}
4.Bd3
Nc6 {Bring out a knight. It also eyes d4.}
5.c3
Nf6
6.Bf4
Bg4 {Bishop out before e6, like always.}
7.Qb3 {White's queen attacks your pawn on b7.}
Qd7 {Protect b7. Stay calm.}
8.Nd2
e6
9.Ngf3
Bd6 {Offer to swap off White's strong bishop on f4.}
10.Bxd6
Qxd6
11.O-O
O-O {Next: push your b-pawn up to attack White's pawn on c3.}
` },
      { name: "Panov-Botvinnik", weight: 2, pgn: `
1.e4 c6 2.d4 d5 3.exd5 cxd5
4.c4 {White attacks your d5 pawn from the side.}
Nf6
5.Nc3
e6 {Here e6 is fine. The middle is open, so your bishop can come out later.}
6.Nf3
Be7
7.cxd5
Nxd5 {Take back with the knight. On d5 it sits right in front of White's d4 pawn.}
8.Bd3
Nc6 {Attack d4.}
9.O-O
O-O
10.Re1
Bf6 {Attack d4 a third time. Swapping pieces helps you here.}
` },
      { name: "Two Knights", weight: 1, pgn: `
1.e4 c6
2.Nc3 {White brings out a knight first.}
d5
3.Nf3
Bg4 {Attack the knight. You're happy to swap your bishop for it.}
4.h3
Bxf3
5.Qxf3
e6 {Your bishop is gone, so e6 is fine. Your pawns are solid.}
6.d3
Nf6
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
6.Nf3
Nbd7
7.Rc1 {Rook to the c column. That's where the fight will be.}
c6
8.Bd3 {Bring out your last piece.}
dxc4
9.Bxc4 {Take the pawn back with your bishop.}
Nd5 {Black wants to swap pieces to get more room.}
10.Bxe7
Qxe7
11.O-O
Nxc3
12.Rxc3
e5 {Black frees their bishop. Your plan: queen to c2, bishop to b3, keep the pressure on.}
` },
      { name: "QGD: Elephant Trap test", weight: 2, pgn: `
1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5
Nbd7 {Careful! This sets a trap.}
5.e3 {Right. Don't take on d5 with your knight. A trick would cost you a piece.}
Be7
6.Nf3
O-O
7.Rc1 {Back to the normal plan.}
` },
      { name: "Exchange (minority attack)", weight: 3, pgn: `
1.d4 d5 2.c4 e6 3.Nc3 Nf6
4.cxd5 {Swap pawns. You get one simple plan for the whole game.}
exd5
5.Bg5
c6
6.e3
Be7
7.Bd3
Nbd7
8.Qc2
O-O
9.Nf3
Re8
10.O-O
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
6.O-O
a6
7.a4 {Stop b5, which would kick your bishop.}
Nc6
8.Qe2
cxd4
9.Rd1 {Rook to the d column. It attacks d4.}
Be7
10.exd4
O-O
11.Nc3 {Your d4 pawn has no pawn friends next to it. Keep pieces on and attack.}
` },
      { name: "Slav", weight: 3, pgn: `
1.d4 d5 2.c4
c6 {Black protects d5 with a pawn. Their c8 bishop stays free.}
3.Nf3
Nf6
4.Nc3
dxc4 {Black takes the pawn.}
5.a4 {Stop b5, so Black can't keep the extra pawn.}
Bf5
6.e3
e6
7.Bxc4 {Pawn back.}
Bb4
8.O-O
O-O
9.Qe2
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
7.Bd3
O-O
8.O-O
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
6.Nbd2
Qd7
7.Bg2 {Plan: castle, then push a3 and b4. You're a pawn up.}
` },
      { name: "Tarrasch", weight: 1, pgn: `
1.d4 d5 2.c4 e6 3.Nc3
c5 {Black wants active pieces, even if a pawn ends up weak.}
4.cxd5
exd5
5.Nf3
Nc6
6.g3 {Your bishop will go to g2 and aim at d5.}
Nf6
7.Bg2
Be7
8.O-O
O-O
9.Bg5 {Attack the knight that protects d5. Plan: pile up on d5.}
` },
    ],
  },
};

// ===== Key ideas, each with a position to test yourself =====
const CONCEPTS = [
  { id: "ck-bishop", opening: "caro", title: "Bishop out before e6",
    principle: "Get your c8 bishop out before you push e6.",
    why: "If e6 comes first, your own pawns block that bishop in.",
    moves: "e4 c6 d4 d5 e5", prompt: "Get your bishop out in time.",
    accept: ["Bf5"], answer: "Bishop to f5. It gets out before e6 blocks it in." },
  { id: "ck-c5", opening: "caro", title: "Attack the pawn holding the others",
    principle: "Attack the back pawn in a line of pawns. It holds the others up.",
    why: "White's pawn on d4 holds up the pawn on e5. Attack d4, and both get weak.",
    moves: "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2", prompt: "Find the pawn move that attacks d4.",
    accept: ["c5"], answer: "c5. It attacks d4, the pawn holding up e5." },
  { id: "ck-h6", opening: "caro", title: "Give your bishop an escape square",
    principle: "When pawns chase your bishop, give it a safe square.",
    why: "If White pushes h5, your bishop on g6 needs somewhere to go.",
    moves: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4", prompt: "White wants to push h5. Keep your bishop safe.",
    accept: ["h6"], answer: "h6. Now your bishop can drop back to h7." },
  { id: "ck-trade", opening: "caro", title: "Swap off their best attacker",
    principle: "When you have less room, swapping pieces helps you.",
    why: "White's bishop on d3 aims at your king's side. Take it off the board.",
    moves: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3", prompt: "White offers to swap bishops. What do you do?",
    accept: ["Bxd3"], answer: "Take it: your bishop takes on d3." },
  { id: "ck-blockade", opening: "caro", title: "Park a piece in front of a lonely pawn",
    principle: "A pawn with no pawn neighbors is weak. Put a piece right in front of it.",
    why: "No pawn can chase your piece away from that square, and the pawn can't move.",
    moves: "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5", prompt: "Take back on d5 the best way.",
    accept: ["Nxd5"], answer: "Knight takes on d5. Now it sits right in front of White's d4 pawn." },
  { id: "ck-smother", opening: "caro", title: "Watch out for a quick checkmate",
    principle: "Before you move, look at every check your opponent could give.",
    why: "If your g8 knight goes to f6, White's knight jumps to d6 and it's checkmate. Your e7 pawn can't take it: that would expose your king to the queen.",
    moves: "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Nd7 Qe2", prompt: "Bring out a knight safely. One knight move loses right away.",
    accept: ["Ndf6"], answer: "The knight on d7 goes to f6. (The g8 knight to f6 loses to checkmate.)" },
  { id: "ck-minority", opening: "caro", title: "Push your b-pawn",
    principle: "Push your b-pawn toward White's pawns to make a weak spot.",
    why: "Pushing b5 and b4 attacks White's pawn on c3 and leaves White a weak pawn.",
    moves: "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2 e6 Ngf3 Bd6 Bxd6 Qxd6 O-O O-O Rae1", prompt: "Start your plan on the left side of the board.",
    accept: ["Rab8"], answer: "Rook to b8 first. It backs up the b-pawn when it pushes." },
  { id: "qg-back", opening: "qg", title: "You get the pawn back",
    principle: "If Black takes your c4 pawn, you can win it back.",
    why: "Push e3, then your bishop takes on c4. You also get a piece out.",
    moves: "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6", prompt: "Win your pawn back and bring out a piece.",
    accept: ["Bxc4"], answer: "Bishop takes on c4." },
  { id: "qg-elephant", opening: "qg", title: "Don't grab the d5 pawn",
    principle: "If something looks free, look for the trick first.",
    why: "Taking on d5 with your knight looks free, but a trick wins Black a whole piece.",
    moves: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 cxd5 exd5", prompt: "The d5 pawn looks free. Play a good move instead.",
    accept: ["e3", "Nf3"], answer: "e3 (or knight to f3). Taking on d5 falls for a trick." },
  { id: "qg-pin", opening: "qg", title: "Attack the defender",
    principle: "To win a pawn, attack the piece that guards it.",
    why: "Black's knight on f6 guards d5. Your bishop to g5 attacks that knight.",
    moves: "d4 d5 c4 e6 Nc3 Nf6", prompt: "Put more pressure on d5 by going after what guards it.",
    accept: ["Bg5"], answer: "Bishop to g5. It attacks the knight that guards d5." },
  { id: "qg-minority", opening: "qg", title: "Push your b-pawn",
    principle: "Push your b-pawn toward Black's pawns to make a weak spot.",
    why: "Your a- and b-pawns push against Black's three. After the swaps, Black has a weak pawn.",
    moves: "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7 Qc2 O-O Nf3 Re8 O-O Nf8", prompt: "Start your plan on the left side of the board.",
    accept: ["Rab1"], answer: "Rook to b1. It backs up the b4 and b5 pushes." },
  { id: "qg-e4", opening: "qg", title: "Push to e4",
    principle: "Once your pieces are out, push a pawn into the middle.",
    why: "e4 takes space and chases Black's bishop.",
    moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2 Nbd7", prompt: "Your pieces are out. Find the pawn push in the middle.",
    accept: ["e4"], answer: "e4. More space, and Black's bishop has to move." },
  { id: "qg-a4", opening: "qg", title: "Stop b5 with a4",
    principle: "If they try to keep an extra pawn with b5, stop it with a4.",
    why: "Black took on c4 and wants b5 to protect it. a4 stops that.",
    moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4", prompt: "Black took on c4. Stop them from keeping it.",
    accept: ["a4"], answer: "a4. Now b5 doesn't work, and you'll win c4 back." },
  { id: "qg-lasker", opening: "qg", title: "Avoid the trap: knight to f3",
    principle: "Bring out pieces before opening lines near your own king.",
    why: "e3 here lets Black give check with the bishop and set up a nasty trick near your king.",
    moves: "d4 d5 c4 e5 dxe5 d4", prompt: "Black's pawn on d4 is annoying. What's the safe, good move?",
    accept: ["Nf3"], answer: "Knight to f3. Simple and safe." },
  { id: "qg-b5trap", opening: "qg", title: "Punish greedy pawn moves",
    principle: "When they push pawns instead of bringing out pieces, look for an attack.",
    why: "After the pawn swaps, your queen on f3 hits the rook on a8 in a straight line, and it can't be saved.",
    moves: "d4 d5 c4 dxc4 e3 b5 a4 c6 axb5 cxb5", prompt: "Black's left side is wide open. Find the winning queen move.",
    accept: ["Qf3"], answer: "Queen to f3. It attacks the rook on a8." },
];

// ===== How this coach teaches (research summary shown in the app) =====
const METHOD = [
  { t: "Try first, then get the answer", d: "When you make a mistake, you get a chance to find a better move before it's shown. Trying, even when you get it wrong, makes the answer stick better than just being told (Kornell, Hays & Bjork, 2009)." },
  { t: "Quiz yourself, spread out over days", d: "Your mistakes become a practice deck you review on a schedule: tomorrow, then in 3 days, then a week. Self-testing and spacing were the two top-rated study methods in a big review (Dunlosky et al., 2013)." },
  { t: "Principles tied to real positions", d: "Every idea here comes with a position to solve. Strong players recognize thousands of patterns (Chase & Simon; Gobet). A principle sticks when you've used it on the board, not just read it." },
  { t: "Mix it up", d: "Practice mixes Caro-Kann and Queen's Gambit positions so you learn to spot which idea fits, instead of just repeating the same thing." },
  { t: "Study your own games", d: "Serious solo study was the best predictor of chess strength in research on tournament players (Charness et al., 2005). Reviewing your own games targets your actual weak spots." },
];

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
  "qgd": { name: "Pressure on d5", for: "w", focus: "d5", moves: [["Nc3", "Nf3", "Bg5"], ["Rc1"], ["Bd3", "O-O", "Bxc4"], []],
    look: "Your pawns on c4 and d4 face Black's pawns on d5 and e6.",
    steps: [
      { t: "Attack d5: knights to c3 and f3, bishop to g5", check: "w_pressure_d5", why: "d5 is Black's key pawn." },
      { t: "Rook to c1", check: "w_rook_c", why: "When the c-pawns swap, your rook is ready." },
      { t: "Bishop to d3, then castle", check: "castled", why: "If Black takes on c4, take back with the bishop." },
      { t: "Watch for Black pushing c5 or e5", check: "tip", why: "Those pushes free Black's pieces." },
    ],
    quiz: { q: "", right: "", wrong: [], why: "" } },
  "carlsbad": { name: "Push your b-pawn", for: "w", focus: "c6", moves: [["Rb1", "Rab1"], ["b4"], ["b5"], []],
    look: "You have no c-pawn. Black has pawns on c6 and d5.",
    steps: [
      { t: "Rook to b1", check: "w_rook_b1", why: "It backs up your b-pawn." },
      { t: "Push b4", check: "w_b4", why: "Start the push." },
      { t: "Push b5", check: "w_b5", why: "After it swaps on c6, Black is left with a weak pawn." },
      { t: "Keep Black's knight off e4", check: "tip", why: "e4 is Black's best square." },
    ],
    quiz: { q: "", right: "", wrong: [], why: "" } },
  "iqp-for": { name: "Your lonely d4 pawn", for: "w", focus: "e5", moves: [["O-O", "Nc3", "Bd3", "Be2"], ["Ne5"], ["Rd1", "Re1", "Rfd1", "Rfe1"], []],
    look: "Your d4 pawn has no pawn neighbors, but your pieces are active.",
    steps: [
      { t: "Bring out everything and castle", check: "minors_done_castled", why: "That pawn is only worth it if your pieces are active." },
      { t: "Knight to e5", check: "w_knight_e5", why: "Your d4 pawn protects it there." },
      { t: "Rooks to d1 or e1", check: "w_rook_de", why: "Back up the d4 pawn." },
      { t: "Avoid swaps. Attack instead.", check: "tip", why: "Swaps make your lonely pawn weak." },
    ],
    quiz: { q: "", right: "", wrong: [], why: "" } },
  "big-center": { name: "Two pawns in the middle", for: "w", focus: "e5", moves: [["e5"], ["Nh4"], []],
    look: "You have pawns on d4 and e4.",
    steps: [
      { t: "Push e5", check: "w_e5", why: "It kicks Black's knight and gives you room." },
      { t: "Knight to h4 to chase Black's bishop", check: "w_knight_h4", why: "Without that bishop, Black's white squares get weak." },
      { t: "Bring pieces toward Black's king", check: "tip", why: "Your extra room makes an attack there natural." },
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
  { moves: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 cxd5 exd5", san: "Nxd5", note: "This falls for a trap. Black wins a piece.", rule: "If something looks free, look for the trick first." },
  { moves: "d4 d5 c4 e5 dxe5 d4", san: "e3", note: "This walks into a trap. Knight to f3 is safe.", rule: "Bring out pieces before opening lines near your own king." },
  { moves: "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Nd7 Qe2", san: "Ngf6", note: "Now White's knight jumps to d6 and it's checkmate. Your e7 pawn can't take it.", rule: "Before every move, look at every check your opponent could give." },
];
