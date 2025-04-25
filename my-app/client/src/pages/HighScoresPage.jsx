import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/PageLayout.css";
import { listScores } from "../api/api";

function HighScoresPage() {
  const { user } = useContext(AuthContext);
  const [scores, setScores] = useState([]);

  // Simulate fetching scores and sorting
  useEffect(() => {
        listScores()
          .then((data) => {
              // data 是 [{ username, wins, losses }, …]
                  //  wins ↓, losses ↑, username sort
                      setScores(data.map((p, idx) => ({ ...p, rank: idx + 1 })));
            })
          .catch((err) => console.error("Failed to fetch high scores:", err));
      }, []);

  return (
    <div className="scoreContainer">
      <h2 className="scoreTitle">High Scores</h2>
      <div className="scoreTableWrapper">
        <table className="scoreTable">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Wins</th>
              <th>Losses</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((player) => (
              <tr
                key={player.rank}
                className={
                  user?.username === player.name ? "highlightRow" : ""
                }
              >
                <td>{player.rank}</td>
                <td>{player.name}</td>
                <td>{player.wins}</td>
                <td>{player.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="scoreFooter">&copy; 2025 Battleship Game</footer>
    </div>
  );
}

export default HighScoresPage;
