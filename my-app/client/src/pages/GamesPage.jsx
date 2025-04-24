import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {fetchGame, createNewGame, joinGame,createAIGame} from "../api/api";
import "../styles/PageLayout.css";

function GamesPage() {
  const { isLoggedIn, user } = useContext(AuthContext);
  const [lists, setLists] = useState({
         open: [],
         myOpen: [],
         active: [],
         completed: []
   });
  const navigate = useNavigate();
  const currentUsername = user?.username;

  useEffect(() => {
    const loadGames = async () => {
      const { open, myOpen, active, completed } = await fetchGame();
      setLists({ open, myOpen, active, completed });
    };
    loadGames();
  }, []);

  const handleNewGame = async () => {
    try {
      const newGame = await createNewGame();
      localStorage.setItem("currentGameId", newGame.id);
      navigate("/place-ships");
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

    const handleAIGame = async () => {
        try {
            const game = await createAIGame();
            localStorage.setItem("currentGameId", game._id.toString());
            navigate("/place-ships"); // let user play the game first, then let AI play
        } catch (e) {
            console.error("Failed to create AI game", e);
        }
    };

  const handleJoinGame = async (gameId) => {
      try {
          await joinGame(gameId);      // ① add users to game.players
          localStorage.setItem("currentGameId", gameId);
          navigate("/place-ships");    // ② jump to ship placement
      } catch (err) {
          console.error("Join failed:", err);
      }
  };

  if (!isLoggedIn) {
    return (
      <div className="pageContainer">
        <h2 className="title">Please log in to access the game lobby.</h2>
      </div>
    );
  }

  // Categorize games from backend
    const {
        open:   openGames,
           myOpen: myOpenGames,
           active: myActiveGames,
        completed: myCompletedGames
     } = lists;

    const renderMyOpen = lists.myOpen.map(g => (
        <li key={g._id}>
            Game #{g._id}
            <button onClick={()=>handleJoinGame(g._id)}>Join</button>
            <button onClick={()=>handleChallengeAI(g._id)}>Challenge AI</button>
        </li>
    ));


  const renderGameList = (title, gameList, showJoin = false) => (
    gameList.length > 0 && (
      <section className="mt-10">
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <ul className="space-y-3">
          {gameList.map((game) => (
            <li
              key={game._id}
              className="flex justify-between items-center bg-white p-4 rounded shadow-md max-w-lg mx-auto"
            >
              <span>
                Game #{game._id.slice(-6)} hosted by <strong>{game.players[0].username}</strong>
              </span>
              {showJoin && (
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={() => handleJoinGame(game._id)}
                >
                  Join
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    )
  );

  return (
    <div className="pageContainer">
      <header className="pageHeader">
        <h2 className="text-2xl font-bold mb-4">Game Lobby</h2>
        <p className="text-gray-600">Create or join a Battleship game.</p>
        <button className="primaryButton mt-4" onClick={handleNewGame}>
          Start New Game
        </button>
          <button onClick={async () => {
              const aiGame = await createAIGame();
              localStorage.setItem("currentGameId", aiGame.id);
              navigate("/place-ships");
          }}>Challenge AI</button>
      </header>

        {renderGameList("Open Games",       openGames,    { showJoin: true })}
              {renderGameList("My Open Games",    myOpenGames) }
              {renderGameList("My Active Games",  myActiveGames) }
              {renderGameList("My Completed Games", myCompletedGames, {
                 extraLabel: g => g.winner === user.username ? "You Won" : "You Lost"
              })}

      <footer className="pageFooter">
        <p>&copy; 2025 Battleship Game</p>
      </footer>
    </div>
  );
}

export default GamesPage;
