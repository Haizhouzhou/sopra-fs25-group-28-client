'use client';
import React from 'react';

const GameBoard = ({ availableGems, cardLevels, nobleTiles }: any) => {
  return (
    <div className="game-board">
      {/* <GameEndCondition /> ← 先移除 */}
      <h3>🪙 Gems</h3>
      {availableGems.map((gem: any) => (
        <div key={gem.type}>{gem.type}: {gem.count}</div>
      ))}
      <h3>📜 Card Levels</h3>
      {cardLevels.map((lvl: any) => (
        <div key={lvl.level}>Level {lvl.level} - {lvl.cards.length} cards</div>
      ))}
      <h3>👑 Nobles</h3>
      <div>{nobleTiles.length} nobles available</div>
    </div>
  );
};

export default GameBoard;
