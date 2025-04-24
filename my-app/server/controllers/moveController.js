// server/controllers/moveController.js
const Game = require("../models/Game");
const { createEmptyBoard, placeShipsOnBoard } = require("../services/shipService");

exports.makeMove = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { row, col } = req.body;
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: "Game not found." });

    // 1) Only click when active
    if (game.status !== "active") {
      return res.status(400).json({ error: "Game is not active." });
    }

    // 2) AI or PVP
    const isAI = !!game.isAI;

    // 3) Make sure is player's turn
    if (!isAI) {
      // Both of the players
      if (game.currentTurn.toString() !== userId) {
        return res.status(403).json({ error: "Not your turn." });
      }
      // Find userId
      const opponentId = game.players
          .map(p => p.toString())
          .find(id => id !== userId);
      const board = game.boardState.get(opponentId);
      if (!board) return res.status(500).json({ error: "Opponent board missing." });

      // 4) Check repeat click
      const cell = board[row][col];
      if (cell === "H" || cell === "M") {
        return res.status(400).json({ error: "This cell has been probed." });
      }

      // 5) target or untarget
      const hit = cell === "S";
      board[row][col] = hit ? "H" : "M";

      // 6) Store move
      game.moves.push({
        by: req.user._id,
        row,
        col,
        result: hit ? "H" : "M",
      });

      // 7) If the game finished
      const stillShip = board.flat().some(c => c === "S");
      if (!stillShip) {
        game.status = "completed";
        game.winner = req.user._id;
      } else {
        game.currentTurn = opponentId;
      }

      await game.save();
      return res.json(game);

    } else {
      // AI move
      // 3a) Players' turn
      if (game.currentTurn.toString() !== userId) {
        return res.status(403).json({ error: "Not your turn." });
      }

      // 4a) Attack AI board
      const boardAI = game.boardState.get("AI");
      if (!boardAI) return res.status(500).json({ error: "AI board missing." });
      if (boardAI[row][col] === "H" || boardAI[row][col] === "M") {
        return res.status(400).json({ error: "This cell has been probed." });
      }
      const hitPlayer = boardAI[row][col] === "S";
      boardAI[row][col] = hitPlayer ? "H" : "M";
      game.moves.push({ by: req.user._id, row, col, result: hitPlayer ? "H" : "M" });

      // 5a) If player win
      const aiStill = boardAI.flat().some(c => c === "S");
      if (!aiStill) {
        game.status = "completed";
        game.winner = req.user._id;
        await game.save();
        return res.json(game);
      }

      // 6a) Ai behavior
      const boardPlayer = game.boardState.get(userId);
      // Find position without click
      const avail = [];
      for (let r = 0; r < boardPlayer.length; r++) {
        for (let c = 0; c < boardPlayer[r].length; c++) {
          if (boardPlayer[r][c] !== "H" && boardPlayer[r][c] !== "M") {
            avail.push({ r, c });
          }
        }
      }
      const mv = avail[Math.floor(Math.random() * avail.length)];
      const hitAI = boardPlayer[mv.r][mv.c] === "S";
      boardPlayer[mv.r][mv.c] = hitAI ? "H" : "M";
      game.moves.push({
        by: "AI",
        row: mv.r,
        col: mv.c,
        result: hitAI ? "H" : "M",
      });

      // 7a) If AI win
      const playerStill = boardPlayer.flat().some(c => c === "S");
      if (!playerStill) {
        game.status = "completed";
        game.winner = "AI";
      } else {
        game.currentTurn = userId;
      }

      await game.save();
      return res.json(game);
    }

  } catch (err) {
    console.error("makeMove error:", err);
    return res.status(500).json({ error: "Move failed." });
  }
};
