// ====== server/controllers/gameController.js ======
const Game = require("../models/Game");
const { placeShipsOnBoard, createEmptyBoard } = require("../services/shipService");

// Create new PVP game (status: open)
exports.createGame = async (req, res) => {
  try {
    const userId = req.user._id;
    const game = new Game({
      players: [userId],
      boardState: {},
      status: "open",
      currentTurn: userId.toString(),
    });
    await game.save();
    res.status(201).json({ id: game._id });
  } catch (err) {
    console.error("Create game failed:", err);
    res.status(500).json({ error: "Create failed." });
  }
};

// Update player's board and potentially activate game
exports.updatePlayerBoard = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { board } = req.body;
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: "Game not found." });

    // Save this player's board
    game.boardState.set(userId, board);

    if (game.isAI) {
      // For AI games, once user deploys, activate immediately
      game.status = "active";
    } else {
      // For PVP games, activate when both players have deployed
      if (game.boardState.size === 2) {
        game.status = "active";
        // Ensure turn stays with host (first player)
        game.currentTurn = game.players[0].toString();
      }
    }

    await game.save();
    res.json({ id: game._id });
  } catch (err) {
    console.error("Update board failed:", err);
    res.status(500).json({ error: "Update board failed." });
  }
};

// Create AI challenge game
exports.createGameAI = async (req, res) => {
  try {
    const userId = req.user._id;
    // Generate AI board
    const aiBoard = placeShipsOnBoard(createEmptyBoard());
    // Initialize empty board for user
    const emptyBoard = createEmptyBoard();

    // Create game record, players array contains only real user
    const game = new Game({
      players: [userId],
      isAI: true,
      status: "open",
      currentTurn: userId.toString(),
      boardState: {},
    });

    // Save both boards: user empty, AI pre-deployed
    game.boardState.set(userId.toString(), emptyBoard);
    game.boardState.set("AI", aiBoard);

    await game.save();
    res.status(201).json({ id: game._id });
  } catch (err) {
    console.error("Create AI game failed:", err);
    res.status(500).json({ error: "Create AI game failed." });
  }
};

// List games for lobby, excluding AI in open games
exports.listGames = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const all = await Game.find()
        .sort({ createdAt: -1 })
        .populate("players", "username");

    const open = all.filter(
        (g) => !g.isAI && g.status === "open" && g.players.length === 1 && g.players[0]._id.toString() !== userId
    );
    const myOpen = all.filter(
        (g) => !g.isAI && g.status === "open" && g.players[0]._id.toString() === userId
    );
    const active = all.filter(
        (g) => g.status === "active" && g.players.some((p) => p._id.toString() === userId)
    );
    const completed = all.filter(
        (g) => g.status === "completed" && g.players.some((p) => p._id.toString() === userId)
    );

    res.json({ open, myOpen, active, completed });
  } catch (err) {
    console.error("List games failed:", err);
    res.status(500).json({ error: "List games failed." });
  }
};

// Get full game data by ID
exports.getGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
        .populate("players", "username")
        .populate("winner", "username");
    if (!game) return res.status(404).json({ error: "Game not found." });

    const obj = game.toObject();
    obj.boardState = Object.fromEntries(game.boardState);
    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Get game failed." });
  }
};

// Join existing game (PVP)
exports.joinGame = async (req, res) => {
  try {
    const userId = req.user._id;
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: "Game not found." });

    // Prevent self-join and overfill
    if (game.players.some((pid) => pid.equals(userId))) {
      return res.status(400).json({ error: "Cannot join your own game." });
    }
    if (game.players.length >= 2) {
      return res.status(400).json({ error: "Room is full." });
    }

    // Add a second player
    game.players.push(userId);
    // Reinitialize boardState for both players
    const emptyBoard = createEmptyBoard();
    const p1Id = game.players[0].toString();
    const existingP1 = game.boardState.get(p1Id) || createEmptyBoard();
    const newMap = new Map();
    newMap.set(p1Id, existingP1);
    newMap.set(userId.toString(), emptyBoard);
    game.boardState = newMap;

    await game.save();
    res.json({ id: game._id });
  } catch (err) {
    console.error("Join game failed:", err);
    res.status(500).json({ error: "Join failed." });
  }
};
