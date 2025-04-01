'use client';

import React from 'react';
import GameBoard from './board/GameBoard';
import PlayerPanel from './components/PlayerPanel';
import PlayerActions from './actions/PlayerActions';
import './GamePage.css';

const GamePage = () => {
  const mockPlayer = {
    name: 'Elvis',
    points: 3,
    coins: { red: 1, blue: 1, green: 0, black: 0, white: 2, yellow: 0 },
    cards: { red: 0, blue: 1, green: 0, black: 0, white: 0 }
  };

  return (
    <div className="game-container">
      <div className="top-row">
        <PlayerPanel player={mockPlayer} />
        <GameBoard
          availableGems={[
            { type: 'red', count: 4 },
            { type: 'blue', count: 2 },
            { type: 'green', count: 5 },
          ]}
          cardLevels={[
            { level: 1, cards: [] },
            { level: 2, cards: [] },
          ]}
          nobleTiles={[]}
        />
        <PlayerPanel player={mockPlayer} />
      </div>

      <div className="middle-row">
        <PlayerActions
          onCollectGems={() => console.log('Collecting Gems')}
          onReserveCard={() => console.log('Reserving Card')}
          onPurchaseCard={() => console.log('Purchasing Card')}
          onEndTurn={() => console.log('Ending Turn')}
        />
      </div>

      <div className="bottom-row">
        <PlayerPanel player={mockPlayer} />
        <div style={{ flex: 1 }} />
        <PlayerPanel player={mockPlayer} />
      </div>
    </div>
  );
};

export default GamePage;
