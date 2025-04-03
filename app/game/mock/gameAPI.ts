// app/game/mock/gameAPI.ts

export async function fetchGameState(gameId: string) {
    console.log(`📥 Fetching game state for ID: ${gameId}`);
  
    return {
      players: [
        {
          name: 'Elvis',
          points: 0,
          coins: { red: 1, blue: 0, green: 0, black: 0, white: 1, yellow: 0 },
          cards: { red: 0, blue: 0, green: 1, black: 0, white: 0 },
        },
        {
          name: 'OrcPawn',
          points: 0,
          coins: { red: 0, blue: 2, green: 1, black: 0, white: 0, yellow: 1 },
          cards: { red: 1, blue: 0, green: 0, black: 0, white: 0 },
        },
        {
          name: 'Tupac',
          points: 0,
          coins: { red: 0, blue: 0, green: 2, black: 1, white: 1, yellow: 0 },
          cards: { red: 0, blue: 1, green: 0, black: 0, white: 1 },
        },
        {
          name: 'Leroy Jenkins',
          points: 0,
          coins: { red: 1, blue: 1, green: 0, black: 0, white: 0, yellow: 1 },
          cards: { red: 1, blue: 0, green: 0, black: 1, white: 0 },
        },
      ],
      availableGems: [
        { type: 'red', count: 5 },
        { type: 'blue', count: 5 },
        { type: 'green', count: 5 },
        { type: 'black', count: 5 },
        { type: 'white', count: 5 },
        { type: 'yellow', count: 5 },
      ],
      cardLevels: [
        { level: 1, cards: [] },
        { level: 2, cards: [] },
        { level: 3, cards: [] },
      ],
      nobleTiles: [],
    };
  }
  
  export async function performAction(gameId: string, action: any) {
    console.log(`⚙️ Mock performAction: "${action}" for game ${gameId}`);
    return fetchGameState(gameId);
  }
  