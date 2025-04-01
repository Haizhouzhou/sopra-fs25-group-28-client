// app/game/mock/mockGameState.ts

import { DevelopmentCardProps } from '../components/DevelopmentCard';

const mockGameState = {
  players: [
    {
      name: 'Elvis',
      points: 3,
      coins: { red: 1, blue: 1, green: 0, black: 0, white: 2, yellow: 0 },
      cards: { red: 0, blue: 1, green: 0, black: 0, white: 0 },
    },
    // Add other players...
  ],
  availableGems: [
    { type: 'red', count: 4 },
    { type: 'blue', count: 2 },
    { type: 'green', count: 5 },
  ],
  cardLevels: [
    {
      level: 1,
      cards: [
        {
          id: 'c1',
          level: 1,
          points: 0,
          color: 'green',
          cost: [
            { type: 'red', count: 2 },
            { type: 'blue', count: 1 },
          ],
        },
        {
          id: 'c2',
          level: 1,
          points: 1,
          color: 'blue',
          cost: [
            { type: 'green', count: 1 },
            { type: 'red', count: 2 },
          ],
        },
      ],
    },
    {
      level: 2,
      cards: [
        {
          id: 'c3',
          level: 2,
          points: 3,
          color: 'yellow',
          cost: [
            { type: 'green', count: 3 },
            { type: 'blue', count: 2 },
          ],
        },
        {
          id: 'c4',
          level: 2,
          points: 5,
          color: 'red',
          cost: [
            { type: 'yellow', count: 4 },
            { type: 'green', count: 3 },
          ],
        },
      ],
    },
    // Add more levels as required...
  ],
  nobleTiles: [],
};

export default mockGameState;
