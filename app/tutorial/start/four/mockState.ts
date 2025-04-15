/*// 定义卡牌、贵族、玩家、教程步骤和总体教程状态的数据结构

export interface Card {
    uuid: string;
    level: string;
    color: string;
    points: number;
    cost: { [key: string]: number };
  }
  
  export interface Noble {
    uuid: string;
    points: number;
    requirement: { [key: string]: number };
  }
  
  export interface Player {
    id: number;
    name: string;
    uuid: string;
    score: number;
    cards: { [level: string]: Card[] };
    gems: { [key: string]: number };
    nobles: Noble[];
    reserved: Card[];
  }
  
  export interface TutorialStep {
    step: number;
    description: string;
    action:
      | "continue"
      | "take3gems"
      | "take_more_gems"
      | "card_structure"
      | "buy"
      | "reserve"
      | "noble_visit"
      | "finish_tutorial";
  }
  
  export interface TutorialState {
    players: Player[];
    gems: { [key: string]: number };
    tutorialSteps: TutorialStep[];
    currentStep: number;
    cards: {
      level1: Card[];
      level2: Card[];
      level3: Card[];
    };
    decks: {
      level1: number;
      level2: number;
      level3: number;
    };
    nobles: Noble[];
  }
  
  // 构造一个模拟的教程状态
  export const tutorialState: TutorialState = {
    players: [
      { id: 1, name: "Alice", uuid: "p1", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
      { id: 2, name: "Bob", uuid: "p2", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
      { id: 3, name: "Charlie", uuid: "p3", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
      { id: 4, name: "David", uuid: "p4", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] }
    ],
    gems: { r: 7, g: 7, b: 7, u: 7, w: 7, "*": 5 },
    tutorialSteps: [
      {
        step: 4,
        description:
          "Action Overview:\n选择以下四个行动之一：\n• 取 3 个不同颜色的宝石\n• 取 2 个相同颜色的宝石\n• 购买一张发展卡\n• 保留一张卡并获得一枚黄金宝石\n点击“Continue”进入下一步。",
        action: "continue"
      },
      {
        step: 5,
        description:
          "First Turn – Take 3 Gems:\nClick on 3 different gem tokens (非黄金) to collect them.",
        action: "take3gems"
      },
      {
        step: 6,
        description:
          "Second Turn – More Gems:\nTake another turn. You can:\n• Take 3 different gems again\n• OR 2 of the same color (if there are at least 4 left)\nRemember: You cannot exceed 10 tokens.",
        action: "take_more_gems"
      },
      {
        step: 7,
        description:
          "Card Structure Explanation:\nLet’s look at a development card:\n• Top-left: Prestige Points\n• Center: Bonus (discount color)\n• Bottom: Cost (required gems)\nBonuses help you buy future cards cheaper!\nClick Continue to proceed.",
        action: "card_structure"
      },
      {
        step: 8,
        description:
          "Third Turn – Buy Development:\nClick on a card you can afford to buy.\nThe card that you can pay for will glow.",
        action: "buy"
      },
      {
        step: 9,
        description:
          "Fourth Turn – Reserve + Gold:\nYou can reserve any card to plan ahead — or block others!\nYou also gain 1 gold (wild token).\nClick on a card to reserve it. (Hint: You can hold up to 3 reserved cards.)",
        action: "reserve"
      },
      {
        step: 10,
        description:
          "Noble Visit:\nIf your Bonuses match a Noble’s requirement, they will visit you at the end of your turn.\nYou cannot refuse. Each visit = +3 points.\nClick on the Noble area to simulate the visit.",
        action: "noble_visit"
      },
      {
        step: 11,
        description:
          "Game End:\nWhen a player reaches 15 Prestige Points, finish the current round.\nThe player with the most points wins!\nTap to finish the tutorial.",
        action: "finish_tutorial"
      }
    ],
    currentStep: 4,
    cards: {
      level1: [
        {
          uuid: "I001",
          level: "level1",
          color: "red",
          points: 0,
          cost: { r: 0, g: 1, b: 0, u: 0, w: 0 }
        },
        {
          uuid: "I009",
          level: "level1",
          color: "blue",
          points: 0,
          cost: { r: 1, g: 0, b: 0, u: 0, w: 0 }
        }
      ],
      level2: [
        {
          uuid: "II013",
          level: "level2",
          color: "green",
          points: 1,
          cost: { r: 0, g: 1, b: 1, u: 0, w: 0 }
        }
      ],
      level3: [
        {
          uuid: "III002",
          level: "level3",
          color: "black",
          points: 3,
          cost: { r: 0, g: 0, b: 1, u: 2, w: 0 }
        }
      ]
    },
    decks: {
      level1: 30,
      level2: 20,
      level3: 10
    },
    nobles: [
      {
        uuid: "N001",
        points: 3,
        requirement: { r: 3, g: 0, b: 0, u: 0, w: 0 }
      }
    ]
  };
  */


  import { cards, nobles } from "../../../allCards";

  interface Card {
    uuid: string;
    level: string;
    color: string;
    points: number;
    cost: { [key: string]: number };
  }
  
  interface Noble {
    uuid: string;
    points: number;
    requirement: { [color: string]: number };
  }
  
  // UUID arrays
  const level1Uuids = ["I001", "I009", "I019", "I033"];
  const level2Uuids = ["II013", "II022", "II024", "II030"];
  const level3Uuids = ["III002", "III004", "III006", "III008"];
  const nobleUuids = ["N001", "N002", "N004", "N005", "N009"];
  
  const getCardByUuid = (uuid: string): Card => {
    const card = cards.find((c) => c.uuid === uuid);
    if (!card) {
      console.warn(`Card with uuid ${uuid} not found`);
      throw new Error(`Card with uuid ${uuid} not found`);
    }
    return card;
  };
  
  const getNobleByUuid = (uuid: string): Noble => {
    const noble = nobles.find((n) => n.uuid === uuid);
    if (!noble) {
      console.warn(`Noble with uuid ${uuid} not found`);
      throw new Error(`Noble with uuid ${uuid} not found`);
    }
    return noble;
  };
  
  export const gameState = {
    players: [
      {
        id: 1,
        name: "Me",
        uuid: "p1",
        score: 0,
        cards: {},
        reserved: [],
        gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 },
        nobles: [],
      },
      {
        id: 2,
        name: "Player 2",
        uuid: "p2",
        score: 0,
        cards: {},
        reserved: [],
        gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 },
        nobles: [],
      },
      {
        id: 3,
        name: "Player 3",
        uuid: "p3",
        score: 0,
        cards: {},
        reserved: [],
        gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 },
        nobles: [],
      },
      {
        id: 4,
        name: "Player 4",
        uuid: "p4",
        score: 0,
        cards: {},
        reserved: [],
        gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 },
        nobles: [],
      },
    ],
    gems: { r: 7, g: 7, b: 7, u: 7, w: 7, "*": 5 },
    cards: {
      level1: level1Uuids.map(getCardByUuid),
      level2: level2Uuids.map(getCardByUuid),
      level3: level3Uuids.map(getCardByUuid),
    },
    decks: {
      level1: cards.filter(card => card.level === "level1").length - level1Uuids.length,
      level2: cards.filter(card => card.level === "level2").length - level2Uuids.length,
      level3: cards.filter(card => card.level === "level3").length - level3Uuids.length,
    },
    nobles: nobleUuids.map(getNobleByUuid),
    turn: 0,
    log: [],
    winner: null
  };
  