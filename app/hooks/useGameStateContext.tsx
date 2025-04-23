import React, { createContext, useState, useContext, ReactNode } from 'react';

// 定义游戏状态的类型
type GameState = any; // 这里可以用你实际的GameState类型替换

// 定义Context的类型
type GameStateContextType = {
  lastGameState: GameState | null;
  saveGameState: (state: GameState) => void;
  clearGameState: () => void;
};

// 创建Context
const GameStateContext = createContext<GameStateContextType | null>(null);

// 创建Provider组件
export function GameStateProvider({ children }: { children: ReactNode }) {
  const [lastGameState, setLastGameState] = useState<GameState | null>(null);
  
  const saveGameState = (state: GameState) => {
    console.log("保存游戏状态到全局:", state);
    setLastGameState(state);
  };
  
  const clearGameState = () => {
    setLastGameState(null);
  };
  
  return (
    <GameStateContext.Provider value={{ lastGameState, saveGameState, clearGameState }}>
      {children}
    </GameStateContext.Provider>
  );
}

// 创建Hook函数
export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}