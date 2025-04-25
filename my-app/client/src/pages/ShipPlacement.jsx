// ====== client/src/pages/ShipPlacement.jsx ======
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameContext } from "../contexts/GameContext";
import { updateBoard, fetchGame } from "../api/api";
import "../styles/PageLayout.css";

function ShipPlacement() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const {
        playerBoard,
        shipsToPlace,
        handleShipDrop,
        rotateShip,
    } = useGameContext();

    useEffect(() => {
        // Check ship placement
        if (shipsToPlace.length === 0) {
            updateBoard(gameId, playerBoard)
                .then((game) => {
                    if (game.status === "active") {
                        // active game
                        navigate(`/game/${gameId}`);
                    } else {
                        // Wait
                        const tid = setInterval(async () => {
                            try {
                                const updated = await fetchGame(gameId);
                                if (updated.status === "active") {
                                    clearInterval(tid);
                                    navigate(`/game/${gameId}`);
                                }
                            } catch (err) {
                                console.error("Polling game status failed", err);
                            }
                        }, 1000);
                    }
                })
                .catch((err) => {
                    console.error("Failed to submit ship placement", err);
                });
        }
    }, [shipsToPlace, playerBoard, navigate, gameId]);

    return (
        <div className="pageContainer">
            <h2 className="title">Place Your Ships</h2>
            <div className="shipPlacementContainer">
                {/* Ship placement */}
                <div className="shipList">
                    <h3>Ships to Place</h3>
                    {shipsToPlace.length > 0 ? (
                        shipsToPlace.map((ship) => (
                            <div
                                key={ship.id}
                                className="shipItem"
                                style={{
                                    display: "flex",
                                    flexDirection: ship.orientation === "horizontal" ? "row" : "column",
                                }}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("shipId", ship.id.toString());
                                    e.dataTransfer.setData("shipSize", ship.size.toString());
                                    e.dataTransfer.setData("shipOrientation", ship.orientation);
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    rotateShip(ship.id);
                                }}
                            >
                                {Array.from({ length: ship.size }).map((_, idx) => (
                                    <div key={idx} className="shipSquare"></div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p>All ships placed. Redirecting to game...</p>
                    )}
                </div>

                {/* Game board */}
                <div className="board">
                    {playerBoard.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`tile ${cell === "S" ? "shipPlaced" : ""}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const shipId = parseInt(e.dataTransfer.getData("shipId"), 10);
                                    const shipSize = parseInt(e.dataTransfer.getData("shipSize"), 10);
                                    const shipOrientation = e.dataTransfer.getData("shipOrientation");
                                    handleShipDrop({ id: shipId, size: shipSize, orientation: shipOrientation }, rowIndex, colIndex);
                                }}
                            ></div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default ShipPlacement;
