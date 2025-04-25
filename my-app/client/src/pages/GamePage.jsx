// src/pages/GamePage.jsx
import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { fetchGame, makeMove } from "../api/api";
import GameBoard from "../components/GameBoard";
import "../styles/PageLayout.css";

export default function GamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useContext(AuthContext);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  const toGrid = (board, size = 10) => {
    if (!board || !Array.isArray(board)) return [];
    if (Array.isArray(board[0])) return board;
    return Array.from({ length: size }, (_, row) =>
        board.slice(row * size, row * size + size)
    );
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        const data = await fetchGame(id);
        setGame(data);
      } catch (err) {
        console.error("Load failed.", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isLoggedIn]);

  const handleCellClick = async (r, c) => {
    const meKey = user.id || user._id;
    if (!game || game.status !== "active") return;
    if (game.currentTurn !== meKey) return;

    try {
      await makeMove(id, { row: r, col: c });
      const updated = await fetchGame(id);
      setGame(updated);
    } catch (err) {
      console.error("Click failed", err);
    }
  };

  if (!isLoggedIn) {
    return (
        <div className="pageContainer">
          <h2 className="title">Please log in to view the game.</h2>
        </div>
    );
  }

  if (loading) return <div className="pageContainer">Loading…</div>;
  if (!game) return <div className="pageContainer">Game not found</div>;

  const meKey = user.id || user._id;
  const boards = game.boardState;
  const myBoard = toGrid(boards[meKey]);
  const opponentKey = Object.keys(boards).find((k) => k !== meKey);
  const opponentBoard = toGrid(boards[opponentKey]);
  const isAI = game.isAI || opponentKey === "AI";

  return (
      <div className="pageContainer">
        <h2 className="title">
          {game.status === "completed"
              ? `Game Over! ${game.winner?.username || (isAI ? "AI" : "Opponent")} Wins!`
              : game.status === "open"
                  ? "Waiting for opponent to join and place ships…"
                  : `Current Turn: ${
                      game.currentTurn === meKey ? "You" : isAI ? "AI" : "Opponent"
                  }`}
        </h2>

        <div className="boards" style={{ display: "flex", gap: 40 }}>
          <div>
            <h3>Opponent's Board</h3>
            <GameBoard
                boardData={opponentBoard}
                isOwnBoard={false}
                isInteractive={game.status === "active" && game.currentTurn === meKey}
                onCellClick={handleCellClick}
            />
          </div>

          <div>
            <h3>Your Board</h3>
            <GameBoard
                boardData={myBoard}
                isOwnBoard={true}
                isInteractive={false}
            />
          </div>
        </div>
      </div>
  );
}