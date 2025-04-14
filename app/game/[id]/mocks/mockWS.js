//FUll Loaded features test
import { cards, nobles } from "../../../allCards";
/************************************************************************************
export class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1; // OPEN
      this.onopen = null;
      this.onmessage = null;
      this.onclose = null;
  
      // Simulate connection establishment
      setTimeout(() => {
        if (this.onopen) this.onopen();
  
        // Send initial state message
        this.sendMockMessage({
          type: "state",
          payload: {
            players: [
              {
                id: 1,
                name: "Alice",
                uuid: "p1",
                score: 15,
                cards: {
                  level1: [
                    { uuid: "c101", level: "level1", color: "r", points: 0, cost: { r: 1, g: 0, b: 1, u: 0, w: 0 } }
                  ]
                },
                reserved: [
                  { uuid: "rc101", level: "level2", color: "g", points: 1, cost: { r: 2, g: 2, b: 1, u: 1, w: 0 } }
                ],
                gems: { r: 2, g: 1, b: 1, u: 0, w: 0, '*': 1 },
                nobles: [
                  { uuid: "n1", points: 3, requirement: { r: 3, g: 0, b: 0, u: 0, w: 0 } }
                ]
              },
              {
                id: 2,
                name: "Bob",
                uuid: "p2",
                score: 13,
                cards: {
                  level2: [
                    { uuid: "c202", level: "level2", color: "r", points: 2, cost: { r: 2, g: 2, b: 2, u: 0, w: 0 } }
                  ]
                },
                reserved: [
                  { uuid: "rc102", level: "level1", color: "b", points: 0, cost: { r: 0, g: 1, b: 1, u: 1, w: 0 } }
                ],
                gems: { r: 1, g: 2, b: 1, u: 1, w: 0, '*': 1 },
                nobles: [
                  { uuid: "n2", points: 3, requirement: { r: 0, g: 3, b: 3, u: 0, w: 0 } }
                ]
              },
              {
                id: 3,
                name: "Charlie",
                uuid: "p3",
                score: 10,
                cards: {
                  level3: [
                    { uuid: "c301", level: "level3", color: "u", points: 4, cost: { r: 3, g: 2, b: 2, u: 3, w: 2 } }
                  ]
                },
                reserved: [
                  { uuid: "rc103", level: "level1", color: "w", points: 0, cost: { r: 1, g: 0, b: 0, u: 0, w: 1 } }
                ],
                gems: { r: 0, g: 1, b: 1, u: 0, w: 0, '*': 1 },
                nobles: [
                  { uuid: "n3", points: 3, requirement: { r: 0, g: 0, b: 0, u: 3, w: 3 } }
                ]
              },
              {
                id: 4,
                name: "David",
                uuid: "p4",
                score: 9,
                cards: {
                  level1: [
                    { uuid: "c104", level: "level1", color: "g", points: 0, cost: { r: 0, g: 1, b: 1, u: 0, w: 1 } }
                  ]
                },
                reserved: [
                  { uuid: "rc104", level: "level2", color: "b", points: 1, cost: { r: 1, g: 2, b: 2, u: 1, w: 0 } }
                ],
                gems: { r: 2, g: 0, b: 2, u: 1, w: 1, '*': 1 },
                nobles: [
                  { uuid: "n4", points: 4, requirement: { r: 2, g: 2, b: 2, u: 2, w: 2 } }
                ]
              }
            ],
            gems: { r: 4, g: 4, b: 4, u: 4, w: 4, '*': 4 },
            cards: {
              level1: [
                { uuid: "c106", level: "level1", color: "b", points: 0, cost: { r: 1, g: 0, b: 1, u: 0, w: 0 } }
              ],
              level2: [
                { uuid: "c206", level: "level2", color: "w", points: 2, cost: { r: 2, g: 2, b: 2, u: 2, w: 0 } }
              ],
              level3: [
                { uuid: "c308", level: "level3", color: "g", points: 4, cost: { r: 3, g: 3, b: 3, u: 3, w: 3 } }
              ]
            },
            nobles: [
              { uuid: "n1", points: 3, requirement: { r: 3, g: 0, b: 0, u: 0, w: 0 } },
              { uuid: "n2", points: 3, requirement: { r: 0, g: 3, b: 3, u: 0, w: 0 } },
              { uuid: "n3", points: 3, requirement: { r: 0, g: 0, b: 0, u: 3, w: 3 } },
              { uuid: "n4", points: 4, requirement: { r: 2, g: 2, b: 2, u: 2, w: 2 } }
            ],
            decks: { level1: 28, level2: 19, level3: 13 },
            turn: 2,
            log: [
              "Alice bought a card.",
              "Bob took gems.",
              "Charlie reserved a card.",
              "David visited a noble."
            ],
            winner: null
          }
        });
      }, 500);
    }
  
    sendMockMessage(message) {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify(message) });
        }
      }, 1000);
    }
    addEventListener(type, listener) {
        if (type === "open") this.onopen = listener;
        else if (type === "message") this.onmessage = listener;
        else if (type === "close") this.onclose = listener;
      }
      removeEventListener(type, listener) {
        if (type === "open" && this.onopen === listener) this.onopen = null;
        else if (type === "message" && this.onmessage === listener) this.onmessage = null;
        else if (type === "close" && this.onclose === listener) this.onclose = null;
      }
      
    send(data) {
      console.log("MockWebSocket sent:", data);
    }
  
    close() {
      this.readyState = 3;
      if (this.onclose) this.onclose();
    }
  }
  
  // Replace global WebSocket (only in browser environment)
  if (typeof window !== "undefined") {
    window.WebSocket = MockWebSocket;
  }
***********************************************************************************/


  // 4 Players Initial State

  /************************************************************************
  export class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;

    setTimeout(() => {
      if (this.onopen) this.onopen();

      this.sendMockMessage({
        type: "state",
        payload: {
          players: [
            { id: 1, name: "Alice", uuid: "p1", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
            { id: 2, name: "Bob", uuid: "p2", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
            { id: 3, name: "Charlie", uuid: "p3", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
            { id: 4, name: "David", uuid: "p4", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] }
          ],
          gems: { r: 4, g: 4, b: 4, u: 4, w: 4, "*": 5 },
          cards: {
            level1: [
              { uuid: "I001", level: "level1", color: "w", points: 0, cost: { r: 0, g: 0, b: 3, u: 0, w: 0 } },
              { uuid: "I009", level: "level1", color: "b", points: 0, cost: { r: 0, g: 0, b: 0, u: 2, w: 1 } },
              { uuid: "I019", level: "level1", color: "g", points: 0, cost: { r: 1, g: 0, b: 1, u: 1, w: 1 } },
              { uuid: "I033", level: "level1", color: "u", points: 0, cost: { r: 1, g: 2, b: 0, u: 0, w: 0 } }
            ],
            level2: [
              { uuid: "l2c1", level: "level2", color: "r", points: 1, cost: { r: 2, g: 2, b: 2, u: 0, w: 1 } },
              { uuid: "l2c2", level: "level2", color: "g", points: 1, cost: { r: 3, g: 0, b: 3, u: 1, w: 1 } },
              { uuid: "l2c3", level: "level2", color: "b", points: 2, cost: { r: 0, g: 3, b: 2, u: 1, w: 2 } },
              { uuid: "l2c4", level: "level2", color: "w", points: 1, cost: { r: 2, g: 2, b: 1, u: 2, w: 1 } }
            ],
            level3: [
              { uuid: "l3c1", level: "level3", color: "u", points: 3, cost: { r: 4, g: 4, b: 0, u: 0, w: 0 } },
              { uuid: "l3c2", level: "level3", color: "w", points: 4, cost: { r: 3, g: 3, b: 3, u: 3, w: 3 } },
              { uuid: "l3c3", level: "level3", color: "r", points: 5, cost: { r: 5, g: 0, b: 0, u: 0, w: 0 } },
              { uuid: "l3c4", level: "level3", color: "g", points: 4, cost: { r: 2, g: 4, b: 2, u: 2, w: 2 } }
            ]
          },
          decks: {
            level1: 32,
            level2: 22,
            level3: 12
          },
          nobles: [
            { uuid: "N001", points: 3, requirement: { r: 0, g: 0, b: 3, u: 3, w: 3 } },
            { uuid: "n2", points: 3, requirement: { r: 0, g: 0, b: 4, u: 4, w: 0 } },
            { uuid: "n3", points: 3, requirement: { r: 4, g: 0, b: 0, u: 4, w: 0 } },
            { uuid: "n4", points: 3, requirement: { r: 0, g: 4, b: 4, u: 0, w: 0 } },
            { uuid: "n5", points: 3, requirement: { r: 2, g: 2, b: 2, u: 2, w: 2 } }
          ],
          turn: 0,
          log: [],
          winner: null
        }
      });
    }, 500);
  }

  sendMockMessage(message) {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify(message) });
      }
    }, 1000);
  }

  send(data) {
    console.log("MockWebSocket sent:", data);
  }

  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }

  addEventListener(type, listener) {
    if (type === "open") this.onopen = listener;
    else if (type === "message") this.onmessage = listener;
    else if (type === "close") this.onclose = listener;
  }

  removeEventListener(type, listener) {
    if (type === "open" && this.onopen === listener) this.onopen = null;
    else if (type === "message" && this.onmessage === listener) this.onmessage = null;
    else if (type === "close" && this.onclose === listener) this.onclose = null;
  }
}

if (typeof window !== "undefined") {
  window.WebSocket = MockWebSocket;
}
/********************************************************************/

//3 Players Initial State
/************************************************************************
export class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1;
      this.onopen = null;
      this.onmessage = null;
      this.onclose = null;
  
      setTimeout(() => {
        if (this.onopen) this.onopen();
  
        this.sendMockMessage({
          type: "state",
          payload: {
            players: [
              { id: 1, name: "Alice", uuid: "p1", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
              { id: 2, name: "Bob", uuid: "p2", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
              { id: 3, name: "Charlie", uuid: "p3", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] }
            ],
            gems: { r: 4, g: 4, b: 4, u: 4, w: 4, "*": 5 },
            cards: {
              level1: [
                { uuid: "l1c1", level: "level1", color: "r", points: 0, cost: { r: 1, g: 1, b: 1, u: 1, w: 1 } },
                { uuid: "l1c2", level: "level1", color: "g", points: 0, cost: { r: 2, g: 0, b: 2, u: 0, w: 1 } },
                { uuid: "l1c3", level: "level1", color: "b", points: 0, cost: { r: 0, g: 1, b: 2, u: 1, w: 1 } },
                { uuid: "l1c4", level: "level1", color: "w", points: 0, cost: { r: 1, g: 1, b: 0, u: 2, w: 1 } }
              ],
              level2: [
                { uuid: "l2c1", level: "level2", color: "r", points: 1, cost: { r: 2, g: 2, b: 2, u: 0, w: 1 } },
                { uuid: "l2c2", level: "level2", color: "g", points: 1, cost: { r: 3, g: 0, b: 3, u: 1, w: 1 } },
                { uuid: "l2c3", level: "level2", color: "b", points: 2, cost: { r: 0, g: 3, b: 2, u: 1, w: 2 } },
                { uuid: "l2c4", level: "level2", color: "w", points: 1, cost: { r: 2, g: 2, b: 1, u: 2, w: 1 } }
              ],
              level3: [
                { uuid: "l3c1", level: "level3", color: "u", points: 3, cost: { r: 4, g: 4, b: 0, u: 0, w: 0 } },
                { uuid: "l3c2", level: "level3", color: "w", points: 4, cost: { r: 3, g: 3, b: 3, u: 3, w: 3 } },
                { uuid: "l3c3", level: "level3", color: "r", points: 5, cost: { r: 5, g: 0, b: 0, u: 0, w: 0 } },
                { uuid: "l3c4", level: "level3", color: "g", points: 4, cost: { r: 2, g: 4, b: 2, u: 2, w: 2 } }
              ]
            },
            decks: {
              level1: 32,
              level2: 22,
              level3: 12
            },
            nobles: [
              { uuid: "n1", points: 3, requirement: { r: 3, g: 3, b: 3, u: 0, w: 0 } },
              { uuid: "n2", points: 3, requirement: { r: 0, g: 0, b: 4, u: 4, w: 0 } },
              { uuid: "n3", points: 3, requirement: { r: 4, g: 0, b: 0, u: 4, w: 0 } },
              { uuid: "n4", points: 3, requirement: { r: 0, g: 4, b: 4, u: 0, w: 0 } }
            ],
            turn: 0,
            log: [],
            winner: null
          }
        });
      }, 500);
    }
  
    sendMockMessage(message) {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify(message) });
        }
      }, 1000);
    }
  
    send(data) {
      console.log("MockWebSocket sent:", data);
    }
  
    close() {
      this.readyState = 3;
      if (this.onclose) this.onclose();
    }
  
    addEventListener(type, listener) {
      if (type === "open") this.onopen = listener;
      else if (type === "message") this.onmessage = listener;
      else if (type === "close") this.onclose = listener;
    }
  
    removeEventListener(type, listener) {
      if (type === "open" && this.onopen === listener) this.onopen = null;
      else if (type === "message" && this.onmessage === listener) this.onmessage = null;
      else if (type === "close" && this.onclose === listener) this.onclose = null;
    }
  }
  
  if (typeof window !== "undefined") {
    window.WebSocket = MockWebSocket;
  }
  
***********************************************************************/


export class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;

    setTimeout(() => {
      if (this.onopen) this.onopen();

      // 预定义需要展示的 uuid 列表
      const level1Uuids = ["I001", "I009", "I019", "I033"];
      const level2Uuids = ["II013", "II022", "II024", "II030"];
      const level3Uuids = ["III002", "III004", "III006", "III008"];
      const nobleUuids = ["N001", "N002", "N004", "N005", "N009"];

      // 使用预定义的 uuid 查找 allCards.js 数据源中的对象
      const getCardByUuid = (uuid) => {
        const card = cards.find((c) => c.uuid === uuid);
        if (!card) console.warn(`Card with uuid ${uuid} not found`);
        return card;
      };
      const getNobleByUuid = (uuid) => {
        const noble = nobles.find((n) => n.uuid === uuid);
        if (!noble) console.warn(`Noble with uuid ${uuid} not found`);
        return noble;
      };

      this.sendMockMessage({
        type: "state",
        payload: {
          players: [
            { id: 1, name: "Alice", uuid: "p1", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
            { id: 2, name: "Bob", uuid: "p2", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
            { id: 3, name: "Charlie", uuid: "p3", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] },
            { id: 4, name: "David", uuid: "p4", score: 0, cards: {}, reserved: [], gems: { r: 0, g: 0, b: 0, u: 0, w: 0, "*": 0 }, nobles: [] }
          ],
          gems: { r: 4, g: 4, b: 4, u: 4, w: 4, "*": 5 },
          cards: {
            level1: level1Uuids.map(getCardByUuid),
            level2: level2Uuids.map(getCardByUuid),
            level3: level3Uuids.map(getCardByUuid)
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
        }
      });
    }, 500);
  }

  sendMockMessage(message) {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify(message) });
      }
    }, 1000);
  }

  send(data) {
    console.log("MockWebSocket sent:", data);
  }

  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }

  addEventListener(type, listener) {
    if (type === "open") this.onopen = listener;
    else if (type === "message") this.onmessage = listener;
    else if (type === "close") this.onclose = listener;
  }

  removeEventListener(type, listener) {
    if (type === "open" && this.onopen === listener) this.onopen = null;
    else if (type === "message" && this.onmessage === listener) this.onmessage = null;
    else if (type === "close" && this.onclose === listener) this.onclose = null;
  }
}

if (typeof window !== "undefined") {
  window.WebSocket = MockWebSocket;
}
