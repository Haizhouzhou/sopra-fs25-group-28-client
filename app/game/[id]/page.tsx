"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// 🧩 卡牌类型
interface Card {
  uuid: string;
  level: string;
  color: string;
  points: number;
  cost: { [key: string]: number };
}

// 👑 贵族卡类型
interface Noble {
  uuid: string;
  points: number;
  requirement: { [key: string]: number };
}

// 🧍‍♂️ 玩家类型
interface Player {
  id: number;
  name: string;
  uuid: string;
  score: number;
  cards: { [level: string]: Card[] };
  gems: { [color: string]: number };
  nobles: Noble[];
  reserved: Card[];
}

// 🎲 游戏状态类型
interface GameState {
  players: Player[];
  gems: { [color: string]: number };
  cards: { [level: string]: Card[] };
  nobles: Noble[];
  decks: { [level: string]: number };
  turn: number;
  log: string[];
  winner: number | null;
}

// 💬 聊天消息
interface ChatMessage {
  player: string;
  text: string;
  timestamp: number;
}

type WSMessageType = "state" | "chat" | "start" | "error" | "info";
interface WSMessage {
  type: WSMessageType;
  payload: any;
}

const CountdownTimer = ({ initialSeconds = 30 }: { initialSeconds?: number }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);
  return (
    <div style={{ fontSize: "24px", fontWeight: "bold", margin: "10px" }}>
      {seconds > 0 ? `Time remaining: ${seconds}s` : "Time's up!"}
    </div>
  );
};

export default function GamePage({ params }: { params: { id: string } }) {
  const gameId = params.id;
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChat, setNewChat] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("currentUser") || "{}")
      : {};

  useEffect(() => {
    if (!gameId) return;

    if (process.env.NODE_ENV === "development") {
      import("./mocks/mockWS.js");
    }

    const wsUrl = `wss://yourserver.com/ws?gid=${gameId}&pid=${currentUser.id || 0}&uuid=${currentUser.uuid || ""}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
    };
    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        switch (msg.type) {
          case "state":
            setGameState(msg.payload);
            break;
          case "chat":
            setChatMessages((prev) =>
              Array.isArray(msg.payload) ? [...prev, ...msg.payload] : [...prev, msg.payload]
            );
            break;
          case "start":
            console.log("Game started!");
            break;
          case "error":
            alert("错误：" + msg.payload);
            break;
          case "info":
            console.log("提示：" + msg.payload);
            break;
          default:
            break;
        }
      } catch (e) {
        console.error("WebSocket 消息解析失败：", e);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [gameId, currentUser]);

  const sendAction = (action: string, target: string, extraData?: any) => {
    if (wsRef.current && wsConnected) {
      const message = { action, target, token: currentUser.token, ...(extraData || {}) };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket 尚未连接");
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChat.trim()) return;

    const message: ChatMessage = {
      player: currentUser.name || "You",
      text: newChat.trim(),
      timestamp: Date.now(),
    };

    sendAction("chat", "", message);
    setChatMessages((prev) => [...prev, message]);
    setNewChat("");
  };

  return (
    <div id="game-board">
      <CountdownTimer initialSeconds={30} />

      {/* 🎯 公共区域 */}
      <div id="common-area">
        {/* 👑 贵族展示区域 */}
        <div id="noble-area">
          {gameState?.nobles?.map((noble, idx) => (
            <div
              key={noble.uuid}
              id={`noble${idx}`}
              className="noble"
              onClick={() => sendAction("noble_visit", noble.uuid)}
            >
              <div className="side-bar">
                <div className="points">{noble.points}</div>
                <div className="requirement">
                  {Object.entries(noble.requirement).map(([color, count]) =>
                    count > 0 ? (
                      <div key={color} className={`requires ${color}`}>
                        {count}
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* 🃏 卡牌展示区域 */}
        <div id="level-area">
          {["level1", "level2", "level3"].map((level) => (
            <div key={level}>
              <div className={`deck ${level}`}>
                <div className="remaining">{gameState?.decks?.[level] ?? 0}</div>
                <div className="overlay"></div>
                <div className="reserve" onClick={() => sendAction("reserve", level)}>
                  <img
                    className="floppy"
                    src="/gamesource/game_page/floppy.png"
                    alt="reserve"
                  />
                </div>
              </div>

              <div className={`c_${level} face-up-cards`}>
                <div className="cards-inner">
                  {gameState?.cards?.[level]?.map((card) => (
                    <div
                      key={card.uuid}
                      className={`card card-${card.color} card-${card.level}`}
                      onClick={() => sendAction("buy", card.uuid)}
                    >
                      <div
                        className="reserve"
                        onClick={(e) => {
                          e.stopPropagation();
                          sendAction("reserve", card.uuid);
                        }}
                      >
                        <img
                          className="floppy"
                          src="/gamesource/game_page/floppy.png"
                          alt="reserve"
                        />
                      </div>
                      <div className="overlay"></div>
                      <div className="underlay"></div>
                      <div className="header">
                        <div className={`color ${card.color}gem`}></div>
                        <div className="points">{card.points > 0 ? card.points : ""}</div>
                      </div>
                      <div className="costs">
                        {Object.entries(card.cost).map(([color, count]) =>
                          count > 0 ? (
                            <div key={color} className={`cost ${color}`}>
                              {count}
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 💎 公共宝石池 */}
        <div id="gem-area">
          {gameState?.gems &&
            Object.entries(gameState.gems).map(([color, count]) => {
              const chipClass = color === "*" ? "schip" : `${color}chip`;
              return (
                <div
                  key={color}
                  className={`gem ${chipClass}`}
                  onClick={() => sendAction("take", color)}
                >
                  <div className="bubble">{count}</div>
                  <div className="underlay"></div>
                </div>
              );
            })}
        </div>
      </div>
      {/* 👥 玩家面板 */}
      <div id="player-area">
        {gameState?.players?.map((player) => (
          <div key={player.uuid} className="player">
            {/* 头部信息 */}
            <div className="playerHeader">
              <div className="playerPoints">{player.score}</div>
              <div className="playerName">
                {player.name} {player.id === currentUser.id && "(You)"}
              </div>
              {gameState.turn === player.id && (
                <div className="turnIndicator">&#8592;</div>
              )}
            </div>

            {/* 玩家状态区 */}
            <div className="stats">
              {/* 💠 宝石统计 */}
              <div className="gem-stats">
                {Object.entries(player.gems).map(([color, count]) => {
                  if (color === "*") {
                    return (
                      <div key="gold" className="statSet">
                        <div className="stat staty">{count}</div>
                        <div>
                          <img
                            className="labelImg"
                            src="/gamesource/game_page/labelgold.png"
                            alt="gold"
                          />
                        </div>
                      </div>
                    );
                  }

                  const cardCount = Object.values(player.cards || {})
                    .flat()
                    .filter((card) => card.color === color).length;

                  return (
                    <div key={color} className="statSet">
                      <div className={`stat stat${color}`}>
                        {count}/{cardCount}
                      </div>
                      <div>
                        <img
                          className="labelImg"
                          src="/gamesource/game_page/labels.png"
                          alt={color}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🃏 保留卡展示区域（与 stats 分离） */}
            {player.reserved?.length > 0 && (
              <div className="reserveCards">
                {player.reserved.map((card) => (
                  <div
                    key={card.uuid}
                    className={`card card-${card.color} card-${card.level}`}
                  >
                    <div className="overlay"></div>
                    <div className="underlay"></div>
                    <div className="header">
                      <div className={`color ${card.color}gem`}></div>
                      <div className="points">{card.points}</div>
                    </div>
                    <div className="costs">
                      {Object.entries(card.cost).map(([color, count]) =>
                        count > 0 ? (
                          <div key={color} className={`cost ${color}`}>
                            {count}
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 👑 拥有贵族卡展示 */}
            {player.nobles?.length > 0 && (
              <div className="nobleStat">
                <div className="nobleLabel">Nobel</div>
                <div className="nobleCards">
                  {player.nobles.map((noble, idx) => (
                    <div
                      key={noble.uuid}
                      className="noble"
                      id={`noble${idx}`}
                      style={{
                        width: "65px",
                        height: "65px",
                        marginLeft: "4px",
                        marginTop: "10px",
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* 🔘 结束回合按钮 */}
      <button
        id="pass-turn"
        onClick={() => sendAction("next", "")}
        style={{ opacity: gameState?.turn === currentUser.id ? 1 : 0.3 }}
      >
        Pass turn
      </button>

      {/* 💬 聊天区域（固定底部） */}
      <div
        id="chat-panel"
        style={{
          position: "fixed",
          bottom: "0",
          width: "100%",
          background: "#16181D",
          padding: "10px",
        }}
      >
        {/* 聊天记录展示区域 */}
        <div
          style={{
            maxHeight: "150px",
            overflowY: "auto",
            color: "white",
            paddingBottom: "4px",
          }}
        >
          {chatMessages.map((msg, idx) => (
            <div key={idx}>
              <strong>{msg.player}: </strong>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>

        {/* 聊天输入栏 */}
        <form
          onSubmit={handleSendChat}
          style={{ display: "flex", marginTop: "5px" }}
        >
          <input
            type="text"
            value={newChat}
            onChange={(e) => setNewChat(e.target.value)}
            placeholder="Type your message..."
            style={{ flex: 1, padding: "8px", marginRight: "6px" }}
          />
          <button type="submit" style={{ padding: "8px 16px" }}>
            Send
          </button>
        </form>
      </div>
    </div> // game-board 结束
  );
}
