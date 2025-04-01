// app/game/actions/PlayerActions.tsx

import React from 'react';

interface PlayerActionsProps {
  onCollectGems: () => void;
  onReserveCard: () => void;
  onPurchaseCard: () => void;
  onEndTurn: () => void;
}

const PlayerActions: React.FC<PlayerActionsProps> = ({
  onCollectGems,
  onReserveCard,
  onPurchaseCard,
  onEndTurn,
}) => {
  return (
    <div>
      <h3>🎮 Player Actions</h3>
      <button onClick={onCollectGems}>💎 Collect Gems</button>
      <button onClick={onReserveCard}>📦 Reserve Card</button>
      <button onClick={onPurchaseCard}>🛒 Purchase Card</button>
      <button onClick={onEndTurn}>✅ End Turn</button>
    </div>
  );
};

export default PlayerActions;
