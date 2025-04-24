// src/contexts/GameContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
    fetchGame,
    makeMove as apiMakeMove,
    updateBoard as apiUpdateBoard,
} from "../api/api";

export const GameContext = createContext();
export const useGameContext = () => useContext(GameContext);

const BOARD_SIZE = 10;
const SHIP_SIZES = [5, 4, 3, 3, 2];

function placeShipsOnBoard(board) {
    const newB = board.map(r => [...r]);
    SHIP_SIZES.forEach(size => {
        let placed = false;
        while (!placed) {
            const horizontal = Math.random() < 0.5;
            const row = Math.floor(
                Math.random() * (horizontal ? BOARD_SIZE : BOARD_SIZE - size + 1)
            );
            const col = Math.floor(
                Math.random() * (horizontal ? BOARD_SIZE - size + 1 : BOARD_SIZE)
            );
            if (canPlaceShip(newB, row, col, size, horizontal)) {
                for (let i = 0; i < size; i++) {
                    const r = row + (horizontal ? 0 : i);
                    const c = col + (horizontal ? i : 0);
                    newB[r][c] = "S";
                }
                placed = true;
            }
        }
    });
    return newB;
}

export const GameProvider = ({ children }) => {
    const { user } = useAuth();
    const userId = user?._id || user?.id;

    // --- 1)  ---
    const [gameId, setGameId] = useState(null);
    const [isPlacing, setIsPlacing] = useState(true);
    const [shipsToPlace, setShipsToPlace] = useState(
        SHIP_SIZES.map((size, idx) => ({ id: idx, size, orientation: "horizontal" }))
    );
    const [playerBoard, setPlayerBoard] = useState(createEmptyBoard());
    const [opponentBoard, setOpponentBoard] = useState(createEmptyBoard());
    const [currentTurn, setCurrentTurn] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);

    // --- 2)  localStorage gameId ---
    useEffect(() => {
        const id = localStorage.getItem("currentGameId");
        if (id) setGameId(id);
    }, []);

    // --- 3)  gameId  userId  ---
    useEffect(() => {
        if (!gameId || !userId) return;
        fetchGame(gameId)
            .then((data) => {
                const bs = data.boardState;

                if (bs[userId]?.flat().some((c) => c === "S")) {
                    setIsPlacing(false);
                }
                setPlayerBoard(bs[userId] || createEmptyBoard());
                const oppId = Object.keys(bs).find((k) => k !== userId);
                setOpponentBoard(bs[oppId] || createEmptyBoard());
                setCurrentTurn(data.currentTurn);
                setGameOver(data.status === "completed");
                setWinner(data.winner);
            })
            .catch((err) => console.error("Failed to fetch game.", err));
    }, [gameId, userId]);

    // --- 4) drag and drop ---
    const handleShipDrop = (ship, row, col) => {
        if (!isPlacing) return false;
        const newB = playerBoard.map((r) => [...r]);
        const horizontal = ship.orientation === "horizontal";
        // boundary check
        for (let i = 0; i < ship.size; i++) {
            const r = row + (horizontal ? 0 : i);
            const c = col + (horizontal ? i : 0);
            if (r >= BOARD_SIZE || c >= BOARD_SIZE || newB[r][c] !== "") {
                return false;
            }
        }
        // place
        for (let i = 0; i < ship.size; i++) {
            const r = row + (horizontal ? 0 : i);
            const c = col + (horizontal ? i : 0);
            newB[r][c] = "S";
        }
        setPlayerBoard(newB);
        setShipsToPlace((prev) => prev.filter((s) => s.id !== ship.id));
        return true;
    };

    const rotateShip = (shipId) => {
        setShipsToPlace((prev) =>
            prev.map((s) =>
                s.id === shipId
                    ? { ...s, orientation: s.orientation === "horizontal" ? "vertical" : "horizontal" }
                    : s
            )
        );
    };

    // --- 5) update  ---
    useEffect(() => {
        if (isPlacing && shipsToPlace.length === 0) {
            apiUpdateBoard(gameId, playerBoard)
                .then(() => {
                    setIsPlacing(false);
                })
                .catch((err) => console.error("Failed to push placement to server", err));
        }
    }, [shipsToPlace, playerBoard, gameId, isPlacing]);

    // --- 6) player move ---
    const handlePlayerMove = async (row, col) => {
        if (isPlacing || gameOver || currentTurn !== userId) return;
        try {
            const updated = await apiMakeMove(gameId, { row, col });
            const bs = updated.boardState;
            setPlayerBoard(bs[userId]);
            const oppId = Object.keys(bs).find((k) => k !== userId);
            setOpponentBoard(bs[oppId]);
            setCurrentTurn(updated.currentTurn);
            if (updated.status === "completed") {
                setGameOver(true);
                setWinner(updated.winner);
            }
        } catch (err) {
            console.error("Move failed.", err);
        }
    };

    return (
        <GameContext.Provider
            value={{
                gameId,
                isPlacing,
                shipsToPlace,
                playerBoard,
                opponentBoard,
                currentTurn,
                gameOver,
                winner,
                handleShipDrop,
                rotateShip,
                handlePlayerMove,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

// createEmptyBoard
function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(""));
}
// placement helper: can this ship fit here?
function canPlaceShip(board, row, col, size, horizontal) {
    for (let i = 0; i < size; i++) {
        const r = row + (horizontal ? 0 : i);
        const c = col + (horizontal ? i : 0);
        if (
            r < 0 ||
            c < 0 ||
            r >= BOARD_SIZE ||
            c >= BOARD_SIZE ||
            board[r][c] !== null
        ) {
            return false;
        }
    }
    return true;
}