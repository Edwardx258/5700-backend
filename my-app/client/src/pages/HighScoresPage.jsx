import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/PageLayout.css";

function HighScoresPage() {
  const { user } = useContext(AuthContext);    // user: { id, username, … } 或 null
  const [scores, setScores] = useState([]);

  useEffect(() => {
    async function loadScores() {
      try {
        const res = await fetch("/api/scores", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch scores");
        let data = await res.json();

        // wins ↓, losses ↑, username ↑
        data.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (a.losses !== b.losses) return a.losses - b.losses;
          return a.username.localeCompare(b.username);
        });

        data = data.map((p, i) => ({
          _id: p._id,
          username: p.username,
          wins: p.wins,
          losses: p.losses,
          rank: i + 1,
        }));

        setScores(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadScores();
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
            {scores.map((player) => {
              const isCurrent = user?.username === player.username;
              return (
                  <tr
                      key={player._id}
                      className={isCurrent ? "highlightRow" : ""}
                  >
                    <td>{player.rank}</td>
                    <td>
                      {isCurrent ? (
                          <strong>{player.username}</strong>
                      ) : (
                          player.username
                      )}
                    </td>
                    <td>{player.wins}</td>
                    <td>{player.losses}</td>
                  </tr>
              );
            })}
            </tbody>
          </table>
        </div>
        <footer className="scoreFooter">&copy; 2025 Battleship Game</footer>
      </div>
  );
}

export default HighScoresPage;
