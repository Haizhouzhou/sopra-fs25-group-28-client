// app/game/[id]/mocks/mockWS.js

export class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1; // OPEN
      this.onopen = null;
      this.onmessage = null;
      this.onclose = null;
  
      // 模拟连接建立
      setTimeout(() => {
        if (this.onopen) this.onopen();
  
        // 模拟发送初始游戏状态
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
                  ],
                  level2: [],
                  level3: []
                },
                gems: { r: 2, g: 1, b: 1, u: 0, w: 0, '*': 1},
                nobles: [],
                reserved: []
              },
              {
                id: 2,
                name: "Bob",
                uuid: "p2",
                score: 13,
                cards: {
                  level1: [],
                  level2: [
                    { uuid: "c202", level: "level2", color: "r", points: 2, cost: { r: 2, g: 2, b: 2, u: 0, w: 0 } }
                  ],
                  level3: []
                },
                gems: { r: 1, g: 2, b: 1, u: 1, w: 0 },
                nobles: [],
                reserved: []
              },
              {
                id: 3,
                name: "Charlie",
                uuid: "p3",
                score: 10,
                cards: {
                  level1: [],
                  level2: [],
                  level3: [
                    { uuid: "c301", level: "level3", color: "u", points: 4, cost: { r: 3, g: 2, b: 2, u: 3, w: 2 } }
                  ]
                },
                gems: { r: 0, g: 1, b: 1, u: 0, w: 0 },
                nobles: [],
                reserved: []
              },
              {
                id: 4,
                name: "David",
                uuid: "p4",
                score: 9,
                cards: {
                  level1: [
                    { uuid: "c104", level: "level1", color: "g", points: 0, cost: { r: 0, g: 1, b: 1, u: 0, w: 1 } }
                  ],
                  level2: [],
                  level3: []
                },
                gems: { r: 2, g: 0, b: 2, u: 1, w: 1 },
                nobles: [],
                reserved: [
                  { uuid: "rc105", level: "level2", color: "b", points: 1, cost: { r: 1, g: 2, b: 2, u: 1, w: 0 } }
                ]
              }
            ],
            gems: { r: 4, g: 4, b: 4, u: 4, w: 4, '*': 4},
            cards: {
              level1: [
                { uuid: "c106", level: "level1", color: "b", points: 0, cost: { r: 1, g: 0, b: 1, u: 0, w: 0 } },
                { uuid: "c107", level: "level1", color: "u", points: 0, cost: { r: 0, g: 1, b: 0, u: 1, w: 1 } }
              ],
              level2: [
                { uuid: "c206", level: "level2", color: "w", points: 2, cost: { r: 2, g: 2, b: 2, u: 2, w: 0 } }
              ],
              level3: [
                { uuid: "c308", level: "level3", color: "g", points: 4, cost: { r: 3, g: 3, b: 3, u: 3, w: 3 } }
              ]
            },
            nobles: [
              { uuid: "n201", points: 3, requirement: { r: 3, g: 0, b: 3, u: 3, w: 3 } },
              { uuid: "n202", points: 4, requirement: { r: 4, g: 4, b: 0, u: 4, w: 2 } }
            ],
            decks: { level1: 30, level2: 20, level3: 15 },
            turn: 2,
            log: [
              "Alice bought a card.",
              "Bob took gems.",
              "Charlie reserved a level3 card.",
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
  
    send(data) {
      console.log("MockWebSocket sent:", data);
      // 可在此添加对特定 action 的模拟响应逻辑
    }
  
    close() {
      this.readyState = 3; // CLOSED
      if (this.onclose) this.onclose();
    }
  }
  
  // 替换浏览器的全局 WebSocket（仅限开发模式）
  if (typeof window !== "undefined") {
    window.WebSocket = MockWebSocket;
  }
  