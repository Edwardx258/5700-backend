// src/components/GameBoard.jsx
import React from "react";
import clsx from "clsx";

export default function GameBoard({
                                    boardData = [],
                                    isOwnBoard = false,  // Show ships on own board only
                                    isInteractive = false,
                                    onCellClick,
                                  }) {
  return (
      <div className="grid grid-cols-10 gap-1">
        {boardData.map((row, r) =>
            row.map((cell, c) => {
              const isHit = cell === "H";
              const isMiss = cell === "M";
              const hasShip = cell === "S";
              let cls = "w-8 h-8 border bg-blue-200";

              if (isHit) cls += " bg-red-500";
              else if (isMiss) cls += " bg-gray-300";
              else if (hasShip && isOwnBoard) cls += " bg-green-400";

              return (
                  <div
                      key={`${r}-${c}`}
                      className={clsx(cls, isInteractive && "cursor-pointer")}
                      onClick={() => isInteractive && onCellClick(r, c)}
                  >
                    {isHit ? "💥" : isMiss ? "⚪" : ""}
                  </div>
              );
            })
        )}
      </div>
  );
}
