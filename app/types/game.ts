
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
    userId: number | string;
    name?: string;
    status?: boolean;
    id: number;
    uuid: string;
    score: number;
    cards: { [level: string]: Card[] };
    gems: { [color: string]: number };
    nobles: Noble[];
    reserved: Card[];
  }
  