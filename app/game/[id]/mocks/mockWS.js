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
  
        // 发送初始状态消息
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
  
    send(data) {
      console.log("MockWebSocket sent:", data);
    }
  
    close() {
      this.readyState = 3;
      if (this.onclose) this.onclose();
    }
  }
  
  // 替换全局 WebSocket（仅在浏览器环境）
  if (typeof window !== "undefined") {
    window.WebSocket = MockWebSocket;
  }
  