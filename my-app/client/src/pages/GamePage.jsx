// src/pages/GamePage.jsx
import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { fetchGame, makeMove } from "../api/api.jsx";
import GameBoard from "../components/GameBoard";
import "../styles/PageLayout.css";

export default function GamePage() {
  const { id } = useParams();             // Router game_id
  const navigate = useNavigate();
  const { isLoggedIn, user } = useContext(AuthContext);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login status
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
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
  }, [id, isLoggedIn, navigate]);

  useEffect(() => {
       if (loading || !game || game.status === "completed") return;
       const interval = setInterval(async () => {
           try {
               const updated = await fetchGame(id);
               // only change happen
                   if (JSON.stringify(updated.boardState) !== JSON.stringify(game.boardState) ||
                       updated.currentTurn !== game.currentTurn ||
                       updated.status !== game.status) {
                   setGame(updated);
                 }
             } catch (err) {
               console.error("Polling failed:", err);
             }
         }, 3000); //per second

           return () => clearInterval(interval);
     }, [game, id, loading]);

  // Click opponent's cell
  const handleCellClick = async (r, c) => {
    if (!game || game.status !== "active") return;
    // Click on the player's turn, but not on AI's turn
    if (game.currentTurn !== user.username && game.currentTurn !== user._id) return;

    try {
      await makeMove(id, { row: r, col: c });
      // fetch updated game data
      const updated = await fetchGame(id);
      setGame(updated);
    } catch (err) {
      console.error("Click failed", err);
    }
  };

  if (loading) return <div className="pageContainer">Loading…</div>;
  if (!game) return <div className="pageContainer">Game not found</div>;

  // depend on backend data.boardState
  const meKey = user.id || user._id;
  const boards = game.boardState;
  const myBoard = boards[meKey];
  const opponentKey = Object.keys(boards).find((k) => k !== meKey);
  const opponentBoard = boards[opponentKey];

  // If AI or not
  const isAI = game.isAI || opponentKey === "AI";

  return (
      <div className="pageContainer">
        <h2 className="title">
          {game.status === "completed"
              ? `Game Over! ${game.winner?.username || (isAI ? "AI" : "")} Wins!`
              : `Current Turn: ${
                  game.currentTurn === meKey ? "You" : isAI ? "AI" : "Opponent"
              }`}
        </h2>

        <div className="boards" style={{ display: "flex", gap: 40 }}>
          <div>
            <h3>Your Board</h3>
            <GameBoard
                boardData={myBoard}
                isOwnBoard={true}
                isInteractive={false}
            />
          </div>

          <div>
            <h3>Opponent's Board</h3>
            <GameBoard
                boardData={opponentBoard}
                isOwnBoard={false}
                // Click on
                isInteractive={
                    game.status === "active" && game.currentTurn === meKey
                }
                onCellClick={handleCellClick}
            />
          </div>
        </div>
      </div>
  );
}
