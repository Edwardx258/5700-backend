// ====== client/src/pages/GamesPage.jsx ======
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { listGames, createNewGame, joinGame, createAIGame } from "../api/api";
import "../styles/PageLayout.css";

function GamesPage() {
    const { isLoggedIn, user } = useContext(AuthContext);
    const [lists, setLists] = useState({ open: [], myOpen: [], active: [], completed: [] });
    const navigate = useNavigate();

    // all game
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const { openGames, myOpen, active, completed } = await listGames();
                setLists({ open: openGames, myOpen, active, completed });
            } catch (err) {
                console.error('Failed to load games:', err);
            }
        };
        fetchGames();
    }, []);

    // pvp
    const handleNewGame = async () => {
        try {
            const { id } = await createNewGame();
            localStorage.setItem("currentGameId", id);
            navigate(`/place-ships/${id}`);
        } catch (err) {
            console.error('Failed to create game:', err);
        }
    };

    // join current
    const handleJoinGame = async (gameId) => {
        try {
            await joinGame(gameId);
            localStorage.setItem("currentGameId", gameId);
            navigate("/place-ships/${id}");
        } catch (err) {
            console.error('Join failed:', err);
        }
    };

    // AI challenge
    const handleChallengeAI = async () => {
        try {
            const aiGame = await createAIGame();
            localStorage.setItem("currentGameId", aiGame.id);
            navigate("/place-ships");
        } catch (err) {
            console.error('Challenge AI failed:', err);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="pageContainer">
                <h2 className="title">Please log in to access the game lobby.</h2>
            </div>
        );
    }

    const { open, myOpen, active, completed } = lists;

    const renderGameList = (title, games, options = {}) => {
        const { showJoin = false } = options;
        if (!games || games.length === 0) return null;
        return (
            <section className="mt-6">
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <ul className="space-y-3">
                    {games.map((g) => (
                        <li
                            key={g._id}
                            className="flex justify-between items-center bg-white p-4 rounded shadow max-w-lg mx-auto"
                        >
              <span>
                Game #{g._id.slice(-6)} hosted by <strong>{g.players[0].username}</strong>
              </span>
                            {showJoin && (
                                <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    onClick={() => handleJoinGame(g._id)}
                                >
                                    Join
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </section>
        );
    };

    return (
        <div className="pageContainer">
            <header className="pageHeader">
                <h2 className="text-2xl font-bold mb-4">Game Lobby</h2>
                <p className="text-gray-600">Create or join a Battleship game.</p>
                <div className="mt-4 flex gap-3">
                    <button className="primaryButton" onClick={handleNewGame}>
                        Start New Game
                    </button>
                    <button className="secondaryButton" onClick={handleChallengeAI}>
                        Challenge AI
                    </button>
                </div>
            </header>

            {renderGameList("Open Games", open, { showJoin: true })}
            {renderGameList("My Open Games", myOpen)}
            {renderGameList("My Active Games", active)}
            {renderGameList("My Completed Games", completed)}

            <footer className="pageFooter">
                <p>&copy; 2025 Battleship Game</p>
            </footer>
        </div>
    );
}

export default GamesPage;