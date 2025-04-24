// server/controllers/gameController.js
const Game = require("../models/Game");
const {
  createEmptyBoard,
  placeShipsOnBoard,
} = require("../services/shipService");

// Create new game (status: open)
exports.createGame = async (req, res) => {
  try {
    const userId = req.user._id;
    const game = new Game({
      players: [userId],
      boardState: {},
      status: "open",
    });
    await game.save();
    res.status(201).json(game);
  } catch (err) {
    console.error("Create game failed:", err);
    res.status(500).json({ error: "Create failed." });
  }
};

// server/controllers/gameController.js
exports.updatePlayerBoard = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { board } = req.body;
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: "Game not found." });

    // save board
    game.boardState.set(userId, board);

    // AI challenger
    if (game.isAI) {
      game.status = "active";
    }

    await game.save();
    return res.json({ id: game._id });
  } catch (err) {
    console.error("Update board failed:", err);
    return res.status(500).json({ error: "Update board failed." });
  }
};

//Challenge AI
// server/controllers/gameController.js
exports.createGameAI = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    // ① AI
    const aiBoard = placeShipsOnBoard(createEmptyBoard());
    // ② User empty board
    const emptyBoard = createEmptyBoard();

    // the only use isAI
    const game = new Game({
      players: [userId, "AI"],
      isAI: true,
      status: "open",
      currentTurn: userId,
      boardState: new Map([
        [userId.toString(), boardEmpty],
        ["AI", boardAI]
      ]),
    });

    await game.save();

    res.status(201).json({ id: game._id });
  } catch (err) {
    console.error("Create AI game failed:", err);
    res.status(500).json({ error: "Create AI game failed." });
  }
};



// List all games for current user
exports.listGames = async (req, res) => {
  try {
    const userId = req.user._id;
    const all = await Game.find().populate("players", "username").exec();
    const open = all.filter(
      (g) => g.status === "open" && !g.players.some((p) => p._id.equals(userId))
    );
    const myOpen = all.filter(
      (g) => g.status === "open" && g.players.some((p) => p._id.equals(userId))
    );
    const active = all.filter(
      (g) =>
        g.status === "active" && g.players.some((p) => p._id.equals(userId))
    );
    const completed = all.filter(
      (g) =>
        g.status === "completed" && g.players.some((p) => p._id.equals(userId))
    );
    res.json({ open, myOpen, active, completed });
  } catch (err) {
    console.error("List games failed:", err);
    res.status(500).json({ error: "List games failed." });
  }
};

// Get game details by id
// server/controllers/gameController.js
exports.getGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
        .populate("players","username")
        .populate("winner","username")
        .exec();
    if (!game) return res.status(404).json({error:"Game not found."});

    // toObject converts Map to JS Map
    const obj = game.toObject();
    obj.boardState = Object.fromEntries(game.boardState);
    // { "<userId>": [...], "AI": [...] }

    return res.json(obj);
  } catch(err) {
    console.error(err);
    return res.status(500).json({error:"Get game failed."});
  }
};


// Join a game and initialize boards
exports.joinGame = async (req, res) => {
  try {
    const userId = req.user._id;
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: "Game not found." });
    //Check player's ID
    if (game.players.some((pid) => pid.equals(userId))) {
      return res.status(400).json({ error: "Cannot join your own game." });
    }

    if (game.players.length >= 2)
      return res.status(400).json({ error: "Room is full." });

    // Add second player
    game.players.push(userId);
    game.status = "active";

    // Initialize boards for both players
    const [p1, p2] = game.players;
    const board1 = placeShipsOnBoard(createEmptyBoard());
    const board2 = placeShipsOnBoard(createEmptyBoard());
    game.boardState = new Map();
    game.boardState.set(p1.toString(), board1);
    game.boardState.set(p2.toString(), board2);

    // Set first turn to the creator (p1)
    game.currentTurn = p1;
    await game.save();
    res.json(game);
  } catch (err) {
    console.error("Join game failed:", err);
    res.status(500).json({ error: "Join failed." });
  }
};
