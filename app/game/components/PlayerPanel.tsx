// app/game/components/PlayerPanel.tsx
console.log("✅ PlayerPanel loaded");

import React from 'react';

interface Player {
  name: string;
  points: number;
  coins: Record<string, number>;
  cards: Record<string, number>;
}

interface PlayerPanelProps {
  player: Player;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ player }) => {
  const coinDisplay = Object.entries(player.coins).map(([color, count]) => `${color[0].toUpperCase()}: ${count}`).join(' ');
  const cardDisplay = Object.entries(player.cards).map(([color, count]) => `${color[0].toUpperCase()}: ${count}`).join(' ');

  return (
    <div className="player-panel">
      <h3>{player.name}</h3>
      <div>⭐ Points: {player.points}</div>
      <div>💰 Coins: {coinDisplay}</div>
      <div>🃏 Cards: {cardDisplay}</div>
    </div>
  );
};

export default PlayerPanel;
