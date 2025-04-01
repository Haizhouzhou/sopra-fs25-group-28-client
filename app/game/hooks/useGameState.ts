// app/game/hooks/useGameState.ts

import { useState, useEffect } from 'react';
import { fetchGameState, performAction } from '../mock/gameAPI';

const useGameState = (gameId: string = 'default') => {
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const loadGameState = async () => {
      try {
        const state = await fetchGameState(gameId);
        console.log('✅ fetchGameState returned:', state);
        setGameState(state);
        setLoading(false);
      } catch (err) {
        console.error('❌ Failed to fetch game state:', err);
        setError(err);
        setLoading(false);
      }
    };

    loadGameState();
  }, [gameId]);

  const handleAction = async (action: string) => {
    console.log(`⚙️ Mock action triggered: ${action}`);
    const updatedState = await performAction(gameId, action);
    setGameState(updatedState);
  };

  return { gameState, loading, error, handleAction };
};

export default useGameState;
