// app/tutorial/start/four/mockState.ts

// 与 page.tsx 中相同的类型定义
export interface Card {
  uuid: string;
  level: `level${1|2|3}`;
  color: string;
  points: number;
  cost: Record<string, number>;
}

export interface Noble {
  uuid: string;
  points: number;
  requirement: Record<string, number>;
}

export interface Player {
  userId: number;
  uuid: string;
  name: string;
  score: number;
  cards: { level1: Card[]; level2: Card[]; level3: Card[] };
  gems: Record<string, number>;
  nobles: Noble[];
  reserved: Card[];
}

export interface GameState {
  players: Player[];
  gems: Record<string, number>;
  cards: { level1: Card[]; level2: Card[]; level3: Card[] };
  nobles: Noble[];
  decks: { level1: number; level2: number; level3: number };
  turn: number;
  log: string[];
  winner: number | null;
  roomName: string;
  currentPlayerId: number;
}

// 4 人示例玩家
const players: Player[] = [
  {
    userId: 1,
    uuid: "1",
    name: "You",
    score: 0,
    gems: { r: 1, g: 2, b: 1, u: 0, w: 1, x: 0 },
    cards: { level1: [], level2: [], level3: [] },
    nobles: [],
    reserved: []
  },
  {
    userId: 2,
    uuid: "2",
    name: "Player 2",
    score: 0,
    gems: { r: 0, g: 1, b: 1, u: 1, w: 1, x: 0 },
    cards: { level1: [], level2: [], level3: [] },
    nobles: [],
    reserved: []
  },
  {
    userId: 3,
    uuid: "3",
    name: "Player 3",
    score: 0,
    gems: { r: 1, g: 0, b: 1, u: 1, w: 0, x: 0 },
    cards: { level1: [], level2: [], level3: [] },
    nobles: [],
    reserved: []
  },
  {
    userId: 4,
    uuid: "4",
    name: "Player 4",
    score: 0,
    gems: { r: 1, g: 1, b: 0, u: 0, w: 1, x: 0 },
    cards: { level1: [], level2: [], level3: [] },
    nobles: [],
    reserved: []
  },
];

// 模拟公共宝石池
const gemsPool: Record<string, number> = {
  r: 4,
  g: 4,
  b: 4,
  u: 4,
  w: 4,
  x: 5
};

// 教程关卡用的示例卡牌
const cards: { level1: Card[]; level2: Card[]; level3: Card[] } = {
  level1: [
    { uuid: "I001", level: "level1", color: "r", points: 0, cost: { r: 1, g: 0, b: 0, u: 0, w: 0 } },
    { uuid: "I009", level: "level1", color: "b", points: 1, cost: { b: 1, g: 1, r: 0, u: 0, w: 0 } },
    { uuid: "I010", level: "level1", color: "g", points: 0, cost: { r: 2, g: 0, b: 0, u: 0, w: 0 } },
    { uuid: "I011", level: "level1", color: "w", points: 0, cost: { u: 1, r: 0, g: 0, b: 0, w: 0 } },
  ],
  level2: [
    { uuid: "I021", level: "level2", color: "r", points: 2, cost: { r: 2, g: 2, b: 0, u: 0, w: 0 } },
    { uuid: "I033", level: "level2", color: "u", points: 2, cost: { u: 2, w: 1, r: 0, g: 0, b: 0 } },
    { uuid: "I034", level: "level2", color: "b", points: 1, cost: { b: 3, r: 0, g: 0, u: 0, w: 0 } },
    { uuid: "I035", level: "level2", color: "g", points: 2, cost: { g: 3, r: 0, b: 0, u: 0, w: 0 } },
  ],
  level3: [
    { uuid: "I041", level: "level3", color: "w", points: 3, cost: { r: 3, b: 3, g: 0, u: 0, w: 0 } },
    { uuid: "I042", level: "level3", color: "r", points: 4, cost: { r: 4, g: 1, b: 0, u: 0, w: 0 } },
    { uuid: "I043", level: "level3", color: "g", points: 3, cost: { g: 4, b: 1, r: 0, u: 0, w: 0 } },
    { uuid: "I044", level: "level3", color: "u", points: 5, cost: { u: 3, w: 2, r: 0, g: 0, b: 0 } },
  ],
};

// 教程演示用的贵族
const nobles: Noble[] = [
  { uuid: "N001", points: 3, requirement: { r: 3, g: 3, b: 0, u: 0, w: 0 } },
  { uuid: "N002", points: 3, requirement: { g: 0, b: 3, r: 4, u: 0, w: 0 } },
  { uuid: "N003", points: 3, requirement: { b: 0, u: 3, r: 0, g: 0, w: 3 } },
  { uuid: "N004", points: 3, requirement: { u: 0, w: 3, r: 0, g: 0, b: 2 } },
  { uuid: "N005", points: 3, requirement: { u: 0, w: 0, r: 0, g: 4, b: 2 } },
];

// 卡堆剩余计数
const decks = {
  level1: 40 - cards.level1.length,
  level2: 30 - cards.level2.length,
  level3: 20 - cards.level3.length,
};

// 最终导出一个完整的模拟游戏状态
export const tutorialGameState: GameState = {
  players,
  gems: gemsPool,
  cards,
  nobles,
  decks,
  turn: 0,
  log: [],
  winner: null,
  roomName: "Tutorial Room",
  currentPlayerId: 1,
};
