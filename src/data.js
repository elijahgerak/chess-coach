// ===== Opening repertoire (plain-language ideas for every move) =====
// Lines use PGN-style text: moves, with {comments} after the move they explain.
const REPERTOIRE = {
  caro: {
    name: "Caro-Kann",
    you: "b",
    blurb: "You play Black. Solid first, then strike back.",
    lines: [
      { name: "Classical (main line)", weight: 5, pgn: `
1.e4 {White grabs the center.}
c6 {Caro-Kann. You prepare ...d5 while keeping the c8-bishop free (in the French, ...e6 would lock it in).}
2.d4 {White takes the whole center.}
d5 {Hit back at e4 right away.}
3.Nc3 {White defends e4 with a knight.}
dxe4 {Trade pawns. Your pieces get room to come out.}
4.Nxe4
Bf5 {Big rule of the Caro-Kann: bring this bishop out BEFORE you play ...e6. It also attacks the knight.}
5.Ng3 {The knight attacks your bishop.}
Bg6 {Step back but stay on the same good diagonal.}
6.h4 {White wants h5 to chase or trap your bishop.}
h6 {Give the bishop an escape square on h7, so h5 can never trap it.}
7.Nf3
Nd7 {Guards e5 so White's knight can't jump there and hit your bishop.}
8.h5
Bh7
9.Bd3 {White offers a bishop trade.}
Bxd3 {Take it. That bishop was White's best attacking piece.}
10.Qxd3
e6 {NOW ...e6 is perfect: your bishop is already out, and c6-e6 make a strong wall.}
11.Bd2
Ngf6
12.O-O-O
Be7 {Develop, then castle short. Later, hit the center with ...c5.}
` },
      { name: "Classical via 3.Nd2", weight: 2, pgn: `
1.e4 c6 2.d4 d5
3.Nd2 {Same idea as 3.Nc3, keeping c-pawn free.}
dxe4
4.Nxe4
Bf5 {Same position as the main line. Bishop out first!}
5.Ng3 Bg6 6.N1e2 {White brings the other knight toward f4 to hit your bishop.}
Nf6 {Develop and guard the kingside.}
7.Nf4
e5 {Strike the center while White's knights are busy chasing your bishop.}
` },
      { name: "Advance: Short system", weight: 4, pgn: `
1.e4 c6 2.d4 d5
3.e5 {Advance Variation. White grabs space and locks the center.}
Bf5 {Same rule: bishop out before ...e6.}
4.Nf3 {Calm development.}
e6 {Now ...e6 is fine. Your bishop is already outside the pawns.}
5.Be2
c5 {Key idea: attack a pawn chain at its base. White's chain is d4-e5, and d4 is the base.}
6.O-O
Nc6 {More pressure on d4.}
7.c3
cxd4
8.cxd4
Nge7 {This knight heads to f5 or c6-area later. Next: ...Be7, ...O-O and use the open c-file with ...Rc8.}
` },
      { name: "Advance: 4.h4 (Tal)", weight: 1, pgn: `
1.e4 c6 2.d4 d5 3.e5 Bf5
4.h4 {Aggressive: White wants g4 and h5 to trap your bishop.}
h5 {Stop the h-pawn right where it is. Your bishop stays safe.}
5.c4
e6 {Solid. Your bishop is out, so ...e6 is fine now.}
` },
      { name: "Advance: 4.Nc3 and g4", weight: 1, pgn: `
1.e4 c6 2.d4 d5 3.e5 Bf5
4.Nc3
e6
5.g4 {White chases the bishop with pawns.}
Bg6
6.Nge2
c5 {When White attacks on the side, hit back in the center. ...c5 attacks the base of the chain again.}
` },
      { name: "Advance: 4.Bd3 trade", weight: 1, pgn: `
1.e4 c6 2.d4 d5 3.e5 Bf5
4.Bd3 {White offers to trade light-squared bishops.}
Bxd3 {Happy to trade. White's good bishop is gone.}
5.Qxd3
e6
6.Nf3
c5 {Hit the base of the chain.}
` },
      { name: "Exchange", weight: 3, pgn: `
1.e4 c6 2.d4 d5
3.exd5 {Exchange Variation. The center opens up a little.}
cxd5 {Take back toward the center. Your c-file opens for a rook later.}
4.Bd3
Nc6 {Develop and pressure d4.}
5.c3
Nf6
6.Bf4
Bg4 {Again: bishop out before ...e6.}
7.Qb3 {White attacks your b7 pawn.}
Qd7 {Calmly defend b7.}
8.Nd2
e6
9.Ngf3
Bd6 {Offer to trade off White's strong bishop on f4.}
10.Bxd6
Qxd6
11.O-O
O-O {Plan: push ...b5-b4 to attack White's c3 pawn (the "minority attack").}
` },
      { name: "Panov-Botvinnik", weight: 2, pgn: `
1.e4 c6 2.d4 d5 3.exd5 cxd5
4.c4 {Panov Attack. White will end up with a lonely (isolated) d4 pawn but active pieces.}
Nf6
5.Nc3
e6 {Here ...e6 is OK: the center is open, and your bishop can come out later.}
6.Nf3
Be7
7.cxd5
Nxd5 {Put a piece on d5, the square right in front of White's lonely pawn. That square is gold for you.}
8.Bd3
Nc6 {Pressure on d4.}
9.O-O
O-O
10.Re1
Bf6 {Pile up on d4. Plan: trade pieces. The more pieces come off, the weaker the lonely pawn gets.}
` },
      { name: "Two Knights", weight: 1, pgn: `
1.e4 c6
2.Nc3 {Two Knights: White waits on d4.}
d5
3.Nf3
Bg4 {Pin the knight. You don't mind trading bishop for knight here.}
4.h3
Bxf3
5.Qxf3
e6 {The bishop is already traded, so ...e6 makes a rock-solid wall.}
6.d3
Nf6
7.Bd2
Nbd7 {Simple development. Next ...Be7 or ...Bc5, then castle.}
` },
      { name: "Fantasy 3.f3", weight: 1, pgn: `
1.e4 c6 2.d4 d5
3.f3 {Fantasy Variation. White props up e4 with a pawn.}
e6 {Here your bishop can't do much on f5, so go solid with ...e6 and hit with ...Bb4 and ...c5.}
4.Nc3
Bb4 {Pin the knight that guards e4.}
` },
    ],
  },
  qg: {
    name: "Queen's Gambit",
    you: "w",
    blurb: "You play White. Pressure d5 and take space.",
    lines: [
      { name: "QGD Orthodox", weight: 4, pgn: `
1.d4 {Take the center. The queen protects d4.}
d5
2.c4 {The Queen's Gambit. You attack d5 from the side. If Black takes on c4, you'll win the pawn back.}
e6 {Queen's Gambit Declined: solid, but it locks in Black's c8-bishop.}
3.Nc3 {More pressure on d5.}
Nf6
4.Bg5 {Pin the knight that defends d5. More pressure on d5.}
Be7
5.e3 {Solid. Opens a path for your f1-bishop.}
O-O
6.Nf3
Nbd7
7.Rc1 {Put a rook on the c-file, where the action will be.}
c6
8.Bd3 {Develop the last minor piece.}
dxc4
9.Bxc4 {Pawn won back, with a great bishop.}
Nd5 {Black tries to free himself by trading pieces.}
10.Bxe7
Qxe7
11.O-O
Nxc3
12.Rxc3
e5 {Black finally frees his bishop. Your plan: Bb3, Qc2, keep pressure on the center.}
` },
      { name: "QGD: Elephant Trap test", weight: 2, pgn: `
1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5
Nbd7 {Careful! This sets the Elephant Trap.}
5.e3 {Correct. Don't grab on d5: 5.cxd5 exd5 6.Nxd5?? Nxd5! 7.Bxd8 Bb4+ and Black wins a piece.}
Be7
6.Nf3
O-O
7.Rc1 {Back to the main plan.}
` },
      { name: "Exchange (minority attack)", weight: 3, pgn: `
1.d4 d5 2.c4 e6 3.Nc3 Nf6
4.cxd5 {Exchange Variation: you fix the pawns so you get a simple, long-term plan.}
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
11.Rab1 {The minority attack: push b4-b5. Your two queenside pawns attack Black's three and leave him a weak pawn.}
` },
      { name: "Queen's Gambit Accepted", weight: 3, pgn: `
1.d4 d5 2.c4
dxc4 {Black takes the pawn. He gives up the center to get free development.}
3.Nf3 {Develop first. Also stops ...e5.}
Nf6
4.e3 {Opens the bishop's path to c4. The pawn is coming back.}
e6
5.Bxc4 {Pawn back, bishop developed with tempo.}
c5
6.O-O
a6
7.a4 {Stops ...b5, which would push your bishop around.}
Nc6
8.Qe2
cxd4
9.Rd1 {Rook to the open file, hitting d4.}
Be7
10.exd4
O-O
11.Nc3 {You have a lonely (isolated) d4 pawn. Rule: play actively, keep pieces on, and aim for d4-d5 or a kingside attack.}
` },
      { name: "Slav", weight: 3, pgn: `
1.d4 d5 2.c4
c6 {Slav: Black protects d5 with a pawn and keeps his bishop free.}
3.Nf3
Nf6
4.Nc3
dxc4 {Black grabs the pawn.}
5.a4 {Stop ...b5, which would hold on to the extra pawn.}
Bf5
6.e3
e6
7.Bxc4 {Pawn won back.}
Bb4
8.O-O
O-O
9.Qe2
Nbd7
10.e4 {The key central push: you gain space and kick Black's bishop.}
Bg6
11.Bd3 {Plan: e5 to gain more space, Nh4 to hunt the bishop.}
` },
      { name: "Semi-Slav", weight: 2, pgn: `
1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3
e6 {Semi-Slav: very solid.}
5.e3 {Solid development.}
Nbd7
6.Qc2 {The queen eyes e4, preparing the e4 push.}
Bd6
7.Bd3
O-O
8.O-O
dxc4
9.Bxc4 {Next: e4, taking the center.}
` },
      { name: "Albin Countergambit", weight: 1, pgn: `
1.d4 d5 2.c4
e5 {Albin Countergambit: Black gives a pawn for quick play.}
3.dxe5 {Take it.}
d4 {This pawn cramps you.}
4.Nf3 {Correct! 4.e3?? walks into the Lasker Trap: 4...Bb4+ 5.Bd2 dxe3! 6.Bxb4?? exf2+ 7.Ke2 fxg1=N+!}
Nc6
5.g3 {Put your bishop on g2, aimed down the long diagonal.}
Be6
6.Nbd2
Qd7
7.Bg2 {Plan: castle, then a3 and b4 to attack on the queenside. You're a pawn up.}
` },
      { name: "Tarrasch", weight: 1, pgn: `
1.d4 d5 2.c4 e6 3.Nc3
c5 {Tarrasch: Black wants free pieces, even if he gets a lonely pawn.}
4.cxd5
exd5
5.Nf3
Nc6
6.g3 {Bishop to g2 will aim straight at d5.}
Nf6
7.Bg2
Be7
8.O-O
O-O
9.Bg5 {Attack the knight that defends d5. Plan: pile up on the d5 pawn.}
` },
    ],
  },
};

// ===== Big ideas (concepts) with a position to test yourself =====
const CONCEPTS = [
  // Caro-Kann
  { id: "ck-bishop", opening: "caro", title: "Bishop out before ...e6",
    principle: "Get your light-squared bishop outside your pawns before you play ...e6.",
    why: "If you play ...e6 first, your own pawns on e6 and d5 trap the c8-bishop. It becomes a 'bad bishop' that just sits there.",
    moves: "e4 c6 d4 d5 e5", prompt: "White pushed e5. Which move follows the Caro-Kann's #1 rule?",
    accept: ["Bf5"], answer: "...Bf5! The bishop gets out now, before ...e6 shuts the door." },
  { id: "ck-c5", opening: "caro", title: "Hit the base of the chain",
    principle: "Against a pawn chain, attack its base.",
    why: "In the Advance, White's pawns go d4-e5. The base is d4. Attack it with ...c5, and the whole chain gets shaky.",
    moves: "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2", prompt: "Find the pawn move that attacks the base of White's chain.",
    accept: ["c5"], answer: "...c5! It attacks d4, the base of White's d4-e5 chain." },
  { id: "ck-h6", opening: "caro", title: "Answer h4 before h5 traps you",
    principle: "When White's h-pawn charges at your bishop, give the bishop a safe square or stop the pawn.",
    why: "If White gets h4-h5 with your bishop on g6 and no escape, the bishop can be trapped or chased into a bad spot.",
    moves: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4", prompt: "White threatens h5. Keep your bishop safe.",
    accept: ["h6"], answer: "...h6! Now after h5 the bishop can go back to h7. (...h5 is also played, but it leaves a hole on g5.)" },
  { id: "ck-trade", opening: "caro", title: "Trade White's best attacker",
    principle: "When you're a bit cramped, trades help you. Trade off your opponent's most dangerous piece.",
    why: "White's bishop on d3 aims at your kingside. Taking it removes White's main attacker, and each trade gives your pieces more room.",
    moves: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3", prompt: "White offers a bishop trade. What do you do?",
    accept: ["Bxd3"], answer: "...Bxd3! Swap off White's best attacking piece." },
  { id: "ck-blockade", opening: "caro", title: "Block the lonely pawn",
    principle: "Put a piece on the square right in front of an isolated pawn.",
    why: "An isolated pawn has no pawn neighbors to protect it or the square in front of it. A piece there can't be chased by pawns and stops the pawn from moving.",
    moves: "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5", prompt: "Recapture on d5 the right way.",
    accept: ["Nxd5"], answer: "...Nxd5! Your knight sits on d5, right in front of White's lonely d4 pawn." },
  { id: "ck-smother", opening: "caro", title: "Watch out for Nd6 mate",
    principle: "Before you move, check what your opponent's checks and captures would do.",
    why: "With White's queen on e2 pinning your e7 pawn, ...Ngf6?? allows Nd6 checkmate! The e-pawn can't take because it's pinned to your king.",
    moves: "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Nd7 Qe2", prompt: "Develop your knight safely. One natural move loses on the spot.",
    accept: ["Ndf6"], answer: "...Ndf6! (Not ...Ngf6?? Nd6#.)" },
  { id: "ck-minority", opening: "caro", title: "Black's minority attack",
    principle: "Use your extra queenside space: push the b-pawn to attack White's pawn chain.",
    why: "In the Exchange Caro, pushing ...b5-b4 attacks White's c3 pawn and leaves White with a weak pawn to defend.",
    moves: "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2 e6 Ngf3 Bd6 Bxd6 Qxd6 O-O O-O Rae1", prompt: "Start your queenside plan.",
    accept: ["Rab8"], answer: "...Rab8! The rook backs up the b-pawn, then ...b5-b4 comes next. (Pushing ...b5 right away is a bit early.)" },

  // Queen's Gambit
  { id: "qg-back", opening: "qg", title: "The gambit pawn comes back",
    principle: "The Queen's Gambit isn't a real gambit: if Black takes on c4, you simply win the pawn back.",
    why: "With e3 and Bxc4, you get the pawn back AND develop your bishop. Black can't hold the extra pawn without making weaknesses.",
    moves: "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6", prompt: "Win your pawn back while developing.",
    accept: ["Bxc4"], answer: "Bxc4! Pawn back, bishop developed." },
  { id: "qg-elephant", opening: "qg", title: "Don't fall for the Elephant Trap",
    principle: "If a pawn looks free, check for a trick before you grab it.",
    why: "Nxd5?? looks like it wins a pawn, but Black plays ...Nxd5! If Bxd8, then ...Bb4+ forces Qd2, ...Bxd2+ Kxd2 Kxd8 and Black is a piece up.",
    moves: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 cxd5 exd5", prompt: "The d5 pawn looks loose. Play a good move.",
    accept: ["e3", "Nf3"], answer: "e3 (or Nf3). Nxd5?? loses a piece to the Elephant Trap." },
  { id: "qg-pin", opening: "qg", title: "Pin the defender",
    principle: "Attack the piece that guards your target.",
    why: "The knight on f6 defends d5. Pinning it with Bg5 adds pressure on d5 without spending extra moves.",
    moves: "d4 d5 c4 e6 Nc3 Nf6", prompt: "Add pressure on d5 by going after its defender.",
    accept: ["Bg5"], answer: "Bg5! It pins the f6-knight, which defends d5." },
  { id: "qg-minority", opening: "qg", title: "The minority attack",
    principle: "In the Carlsbad structure, push b4-b5 with your queenside pawns.",
    why: "Your two pawns (a and b) attack Black's three. After b5xc6, Black is left with a weak pawn on c6 or d5 that you can attack for the rest of the game.",
    moves: "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7 Qc2 O-O Nf3 Re8 O-O Nf8", prompt: "Start the plan that fits this pawn structure.",
    accept: ["Rab1"], answer: "Rab1! The rook backs up the b-pawn, then b4-b5 comes next. (b4 right away is a bit early.)" },
  { id: "qg-e4", opening: "qg", title: "The central push e4",
    principle: "When you're ready, push your center pawn to gain space.",
    why: "e4 grabs the center, kicks Black's f5-bishop, and opens lines for your pieces.",
    moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2 Nbd7", prompt: "Everything is developed. Find the central push.",
    accept: ["e4"], answer: "e4! Space, tempo on the bishop, and open lines." },
  { id: "qg-a4", opening: "qg", title: "Stop ...b5 with a4",
    principle: "If your opponent wants to hold an extra pawn with ...b5, stop it with a4.",
    why: "In the Slav, after ...dxc4 Black would love ...b5 to protect the c4 pawn. a4 stops that, and you'll win the pawn back.",
    moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4", prompt: "Black grabbed c4. Stop him from holding it.",
    accept: ["a4"], answer: "a4! Now ...b5 is impossible and c4 will fall." },
  { id: "qg-lasker", opening: "qg", title: "Avoid the Lasker Trap",
    principle: "Against the Albin, develop with Nf3. Don't open lines toward your own king.",
    why: "4.e3?? Bb4+ 5.Bd2 dxe3! and if 6.Bxb4?? exf2+ 7.Ke2 fxg1=N+! Black wins big.",
    moves: "d4 d5 c4 e5 dxe5 d4", prompt: "The d4 pawn is annoying. What's the safe, strong move?",
    accept: ["Nf3"], answer: "Nf3! Simple development. Avoid e3." },
  { id: "qg-b5trap", opening: "qg", title: "Punish greedy ...b5",
    principle: "When your opponent pushes pawns instead of developing, look for open lines to attack.",
    why: "Black tried to keep the c4 pawn with ...b5. After a4 and axb5, the long diagonal opens and Qf3 attacks the rook on a8 (and it can't be saved well).",
    moves: "d4 d5 c4 dxc4 e3 b5 a4 c6 axb5 cxb5", prompt: "Black's queenside is wide open. Find the winning queen move.",
    accept: ["Qf3"], answer: "Qf3! It hits the a8-rook along the long diagonal." },
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
  "ck-advance": { name: "Advance structure", for: "b", focus: "d4", moves: [["c5"], ["Nc6", "Qb6", "Ne7", "Nf5", "Nge7"], ["O-O", "Rc8"], []],
    look: "White has pawns on d4 and e5. Your pawns are on d5 and e6.",
    steps: [
      { t: "Hit the base of White's chain with ...c5", check: "b_c5_or_no_wd4", why: "d4 holds up e5. Attack d4 and the chain wobbles." },
      { t: "Pile up on d4: ...Nc6, ...Qb6, a knight to f5", check: "b_pressure_d4", why: "More attackers than defenders on d4 wins it or forces White into passive defense." },
      { t: "Castle and put a rook on the c-file", check: "b_castled_rook_c", why: "Once the c-file opens, your rook belongs there." },
      { t: "If White pushes f4-f5, answer with ...f6", check: "tip", why: "Hit e5 from the other side so White's pawns can't roll forward." },
    ],
    quiz: { q: "Your pawns are on d5 and e6. White's are on d4 and e5. What's your plan?",
      right: "Attack d4 with ...c5, then pile up on it with ...Nc6 and ...Qb6",
      wrong: ["Attack on the kingside with ...g5 and ...h5", "Play ...f6 right away and open your king"],
      why: "Attack the chain at its base. d4 supports e5, so it's the weak point." } },
  "ck-classical": { name: "Caro-Kann wall (c6 + e6)", for: "b", focus: "d4", moves: [["Ngf6", "Nf6", "Be7", "Bd6", "Nd7"], ["O-O", "O-O-O"], ["c5", "e5"], []],
    look: "White has a pawn on d4 but no e-pawn. You have a solid wall on c6 and e6.",
    steps: [
      { t: "Finish developing your knights and bishops", check: "minors_done", why: "Your position is solid. Get everything out before starting fights." },
      { t: "Castle your king to safety", check: "castled", why: "Pick the side where White isn't pushing pawns." },
      { t: "Challenge d4 with ...c5 (or ...e5)", check: "b_break_c5", why: "This frees your pieces and attacks White's only center pawn." },
      { t: "Trade pieces when it's safe", check: "tip", why: "Your pawns are healthy. Fewer pieces means White's attacking chances go away." },
    ],
    quiz: { q: "You have solid pawns on c6 and e6. White has one center pawn on d4. What's your plan?",
      right: "Finish development, castle, then hit d4 with ...c5",
      wrong: ["Push ...b5-b4 right away to grab space", "Leave your king in the center and attack with ...g5"],
      why: "Solid positions win by finishing development first, then striking the center at the right moment." } },
  "ck-exchange": { name: "Exchange structure", for: "b", focus: "c3", moves: [["Rc8", "Rac8", "Rfc8"], ["Rab8", "b5", "b4"], ["Ne4", "Nc4"]],
    look: "Your pawn is on d5 with no c-pawn. White has pawns on c3 and d4.",
    steps: [
      { t: "Put a rook on the open c-file", check: "b_rook_c", why: "The open file is a highway into White's camp." },
      { t: "Minority attack: ...b5-b4 to hit c3", check: "b_minority", why: "Your two queenside pawns attack White's three and leave a weak pawn behind." },
      { t: "Use the outposts on e4 or c4 for a knight", check: "b_knight_outpost", why: "White's pawns can't easily chase a knight from those squares." },
    ],
    quiz: { q: "The c-file is open, White has pawns on c3 and d4. What's your plan?",
      right: "Rook to the c-file, then push ...b5-b4 to attack c3",
      wrong: ["Push ...e5 at once and open the center", "Trade your good bishop for a knight right away"],
      why: "The open c-file plus a minority attack creates a weak White pawn you can target." } },
  "iqp-against": { name: "White's lonely d-pawn (IQP)", for: "b", focus: "d4", moves: [["Nd5", "Nbd5", "Nfd5"], ["Nc6", "Bf6", "Rd8", "Qd6"], []],
    look: "White's d4 pawn has no pawn neighbors (no c- or e-pawn).",
    steps: [
      { t: "Put a knight on d5, right in front of the pawn", check: "b_knight_d5", why: "That square can never be attacked by a pawn. Perfect home for a knight." },
      { t: "Pile up on d4 (...Nc6, ...Bf6, ...Rd8)", check: "b_pressure_d4", why: "The lonely pawn can only be defended by pieces. Make them busy." },
      { t: "Trade pieces, especially White's attackers", check: "tip", why: "Each trade weakens White's attack. In the endgame the lonely pawn is just weak." },
    ],
    quiz: { q: "White has a lonely pawn on d4. What's your plan?",
      right: "Blockade d5 with a knight, attack d4, and trade pieces",
      wrong: ["Avoid trades and launch a pawn storm on your own king's side", "Let White push d4-d5 and open the position"],
      why: "Against an isolated pawn: blockade it, attack it, and trade pieces." } },
  "qgd": { name: "Queen's Gambit tension on d5", for: "w", focus: "d5", moves: [["Nc3", "Nf3", "Bg5"], ["Rc1"], ["Bd3", "O-O", "Bxc4"], []],
    look: "Your pawns on c4 and d4 face Black's d5 and e6.",
    steps: [
      { t: "Pile pressure on d5 (Nc3, Nf3, Bg5)", check: "w_pressure_d5", why: "d5 is the heart of Black's position. Attack it and its defenders." },
      { t: "Rook to c1 for the c-file fight", check: "w_rook_c", why: "When the c-pawns trade, your rook is already on the right file." },
      { t: "Develop Bd3, castle, and take back on c4 with the bishop", check: "castled", why: "If Black takes on c4, Bxc4 wins the pawn back with a developed piece." },
      { t: "Watch for Black's freeing moves ...c5 and ...e5", check: "tip", why: "Black is cramped. Those pushes are how he gets free, so keep them hard to play." },
    ],
    quiz: { q: "Your c4 and d4 pawns face Black's d5 and e6. What's your plan?",
      right: "Pile pressure on d5, put a rook on c1, castle, and take back on c4 with the bishop",
      wrong: ["Grab the d5 pawn with your knight as soon as you can", "Push your g- and h-pawns before developing"],
      why: "Squeeze d5, develop with purpose, and keep Black cramped." } },
  "carlsbad": { name: "Carlsbad structure", for: "w", focus: "c6", moves: [["Rb1", "Rab1"], ["b4"], ["b5"], []],
    look: "You have no c-pawn. Black has pawns on c6 and d5 but no e-pawn.",
    steps: [
      { t: "Rook to b1", check: "w_rook_b1", why: "The rook backs up the b-pawn push." },
      { t: "Push b4", check: "w_b4", why: "Start the minority attack." },
      { t: "Push b5 to hit c6", check: "w_b5", why: "After b5xc6 Black is left with a weak pawn on c6 or d5." },
      { t: "Keep Black's knight out of e4 (Qc2, Bd3)", check: "tip", why: "e4 is Black's best square. Control it." },
    ],
    quiz: { q: "You have no c-pawn. Black has c6 and d5. What's your plan?",
      right: "Minority attack: Rb1, b4, b5 to make a weak Black pawn",
      wrong: ["Push e4 right away even if it hangs a pawn", "Trade queens and push your h-pawn"],
      why: "In the Carlsbad, two pawns attacking three (the minority attack) creates a lasting weakness." } },
  "iqp-for": { name: "Your lonely d-pawn (IQP)", for: "w", focus: "e5", moves: [["O-O", "Nc3", "Bd3", "Be2"], ["Ne5"], ["Rd1", "Re1", "Rfd1", "Rfe1"], []],
    look: "Your d4 pawn has no pawn neighbors, but your pieces are active.",
    steps: [
      { t: "Develop everything and castle", check: "minors_done_castled", why: "The lonely pawn is worth it only if your pieces are active." },
      { t: "Knight to e5", check: "w_knight_e5", why: "d4 supports a knight on e5, a great attacking post." },
      { t: "Rooks to d1 or e1", check: "w_rook_de", why: "Back up the d-pawn and get ready for d4-d5." },
      { t: "Avoid trades; look for d4-d5 or a kingside attack", check: "tip", why: "Trades make the pawn weak. Keep pieces on and play for the initiative." },
    ],
    quiz: { q: "You have a lonely pawn on d4 and active pieces. What's your plan?",
      right: "Keep pieces on, knight to e5, rooks to d1/e1, and look for d4-d5 or an attack",
      wrong: ["Trade as many pieces as possible", "Retreat your pieces to defend the pawn"],
      why: "An isolated pawn gives you activity. Use it before the endgame, where the pawn becomes weak." } },
  "big-center": { name: "Big center (d4 + e4)", for: "w", focus: "e5", moves: [["e5"], ["Nh4"], []],
    look: "You have pawns on d4 and e4. Black has c6 and e6.",
    steps: [
      { t: "Push e5 to gain space", check: "w_e5", why: "It kicks Black's knight and gives your pieces room on the kingside." },
      { t: "Hunt Black's light bishop with Nh4", check: "w_knight_h4", why: "Trading it off leaves Black's light squares weak." },
      { t: "Bring pieces toward the kingside", check: "tip", why: "Your space on the kingside makes an attack there natural." },
    ],
    quiz: { q: "You have a big center with d4 and e4. What's your plan?",
      right: "Push e5 for space, then hunt Black's bishop with Nh4",
      wrong: ["Trade your center pawns right away", "Push your a-pawn to a6"],
      why: "A big center is for gaining space and attacking, not for giving away." } },
};

// Goal checklist by phase (checks run on the board)
const GOALS = {
  opening: [
    { id: "center", t: "Fight for the center" },
    { id: "develop", t: "Develop your knights and bishops" },
    { id: "castle", t: "Castle your king to safety" },
    { id: "connect", t: "Connect your rooks" },
  ],
  middlegame: [
    { id: "castle", t: "King safe (castled)" },
    { id: "rooks", t: "Rooks on open files" },
    { id: "worst", t: "Improve your worst piece" },
    { id: "targets", t: "Find a weak pawn or square to attack" },
  ],
  endgame: [
    { id: "king", t: "Bring your king toward the center" },
    { id: "passed", t: "Push passed pawns (rooks behind them)" },
    { id: "trade", t: "Ahead? Trade pieces, not pawns" },
  ],
};

// Famous traps: a note shown when you step into one
const TRAPS = [
  { moves: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 cxd5 exd5", san: "Nxd5", note: "This falls for the Elephant Trap. Black wins a piece.", rule: "If something looks free, look for the trick first." },
  { moves: "d4 d5 c4 e5 dxe5 d4", san: "e3", note: "This walks into the Lasker Trap. Play Nf3 instead.", rule: "Develop your pieces before opening lines near your own king." },
  { moves: "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Nd7 Qe2", san: "Ngf6", note: "Nd6 is checkmate. Your e-pawn is pinned to your king.", rule: "Before every move, look at all of your opponent's checks." },
];
