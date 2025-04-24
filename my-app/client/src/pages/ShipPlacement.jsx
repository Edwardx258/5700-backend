import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "../contexts/GameContext";
import { updateBoard } from "../api/api";
import "../styles/PageLayout.css";


function ShipPlacement() {
  const {
    playerBoard,
    shipsToPlace,
    handleShipDrop,
    rotateShip,
  } = useGameContext();

  const navigate = useNavigate();


  // Check if all ships are placed (assume 5 ships)
  useEffect(() => {
    if (shipsToPlace.length === 0) {
      const gameId = localStorage.getItem("currentGameId");
      updateBoard(gameId, playerBoard)
          .then(() => navigate(`/game/${gameId}`))
          .catch(console.error);
    }
  }, [navigate, playerBoard, shipsToPlace]);



  return (
    <div className="pageContainer">
      <h2 className="title">Place Your Ships</h2>
      <div className="shipPlacementContainer">
        {/* Ship list */}
        <div className="shipList">
          <h3>Ships to Place</h3>
          {shipsToPlace.length > 0 ? (
            shipsToPlace.map((ship) => (
              <div
                key={ship.id}
                className="shipItem"
                style={{
                  display: "flex",
                  flexDirection:
                    ship.orientation === "horizontal" ? "row" : "column",
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
                {Array.from({ length: ship.size }).map((_, index) => (
                  <div key={index} className="shipSquare"></div>
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
                  const ship = { id: shipId, size: shipSize, orientation: shipOrientation };
                  handleShipDrop(ship, rowIndex, colIndex);
                  // No need to call setPlayerBoard here if handleShipDrop updates it internally
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

