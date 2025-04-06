"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// 🧩 卡牌类型
interface Card {
  uuid: string;
  level: string; // level1, level2, level3
  color: string; // w, u, g, b, r
  points: number;
  cost: { [key: string]: number }; // 每种颜色的花费
}

// 🧍‍♂️ 玩家类型
interface Player {
  id: number;
  name: string;
  uuid: string;
  score: number;
  cards: { [level: string]: Card[] }; // 已拥有的卡牌
  gems: { [color: string]: number }; // 持有的宝石
  nobles: Noble[];
  reserved: Card[];
}

// 👑 贵族卡类型
interface Noble {
  uuid: string;
  points: number;
  requirement: { [key: string]: number }; // 获得条件
}

// 🎲 游戏状态类型
interface GameState {
  players: Player[];
  gems: { [color: string]: number };
  cards: { [level: string]: Card[] };
  nobles: Noble[];
  decks: { [level: string]: number };
  turn: number; // 当前回合玩家 id
  log: string[];
  winner: number | null;
}

// 💬 聊天消息
interface ChatMessage {
  player: string;
  text: string;
  timestamp: number;
}

// 🔄 WebSocket 消息类型
type WSMessageType = "state" | "chat" | "start" | "error" | "info";
interface WSMessage {
  type: WSMessageType;
  payload: any;
}

// ⏱️ 倒计时组件（30秒）
const CountdownTimer = ({ initialSeconds = 30 }: { initialSeconds?: number }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
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

  // 🧠 状态管理
  const [gameState, setGameState] = useState<GameState | null>(null); // 游戏主状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]); // 聊天记录
  const [newChat, setNewChat] = useState(""); // 新消息输入框
  const [wsConnected, setWsConnected] = useState(false); // WebSocket 连接状态
  const wsRef = useRef<WebSocket | null>(null); // 保留 WebSocket 实例

  // 📦 获取当前用户信息（从 localStorage 读取）
  const currentUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("currentUser") || "{}")
    : {};

  // 🌐 建立 WebSocket 连接
  useEffect(() => {
    if (!gameId) return;

    // 💻 如果是开发环境，引入 mock WebSocket 模块
    if (process.env.NODE_ENV === "development") {
      import("./mocks/mockWS.js");
    }

    // 🧩 拼接后端 WebSocket 地址（请根据后端实际部署情况修改）
    const wsUrl = `wss://yourserver.com/ws?gid=${gameId}&pid=${currentUser.id || 0}&uuid=${currentUser.uuid || ""}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // ✅ 建立连接成功
    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
    };

    // 📥 接收到服务器消息
    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        console.log("WS message received:", msg);

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

    // 🔌 断开连接
    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    };

    // 🔁 清理
    return () => {
      ws.close();
    };
  }, [gameId, currentUser]);

  // 🚀 通用动作发送函数（支持带 extraData）
  const sendAction = (action: string, target: string, extraData?: any) => {
    if (wsRef.current && wsConnected) {
      const message = { action, target, token: currentUser.token, ...(extraData || {}) };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket 尚未连接");
    }
  };

  // ✉️ 发送聊天消息
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
      {/* ⏱️ 倒计时条 */}
      <CountdownTimer initialSeconds={30} />

      {/* 🎯 公共区域 */}
      <div id="common-area">
        {/* 👑 贵族展示区 */}
        <div id="noble-area">
          {gameState?.nobles?.map((noble, idx) => (
            <div
              key={noble.uuid}
              id={`noble${idx}`} // 背景图通过编号匹配 noble0, noble1...
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

        {/* 🃏 卡牌展示区 */}
        <div id="level-area">
          {["level1", "level2", "level3"].map((level) => (
            <div key={level}>
              {/* 抽牌堆（带数量显示） */}
              <div className={`deck ${level}`}>
                <div className="remaining">
                  {gameState?.decks?.[level] ?? 0}
                </div>
                <div className="overlay"></div>
                <div className="reserve" onClick={() => sendAction("reserve", level)}>
                  <img
                    className="floppy"
                    src="/gamesource/game_page/floppy.png"
                    alt="reserve"
                  />
                </div>
              </div>

              {/* 翻开卡牌 */}
              <div className={`c_${level} face-up-cards`}>
                <div className="cards-inner">
                  {gameState?.cards?.[level]?.map((card) => (
                    <div
                      key={card.uuid}
                      className={`card card-${card.color} card-${card.level}`}
                      onClick={() => sendAction("buy", card.uuid)}
                    >
                      {/* 保留图标（点击不影响购买） */}
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
                        <div className="points">
                          {card.points > 0 ? card.points : ""}
                        </div>
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
            Object.entries(gameState.gems).map(([color, count]) => (
              <div
                key={color}
                className={`gem ${color}chip`}
                onClick={() => sendAction("take", color)}
              >
                <div className="bubble">{count}</div>
                <div className="underlay"></div>
              </div>
            ))}
        </div>
      </div>
      {/* 👥 玩家面板 */}
      <div id="player-area">
        {gameState?.players?.map((player) => (
          <div key={player.uuid} className="player">
            {/* 头部信息：分数 + 名字 + 回合箭头 */}
            <div className="playerHeader">
              <div className="playerPoints">{player.score}</div>
              <div className="playerName" onClick={() => {
                // 此处可扩展：点击名称可选择玩家或弹出改名框
              }}>
                {player.name} {player.id === currentUser.id && "(You)"}
              </div>
              {gameState.turn === player.id && (
                <div className="turnIndicator">&#8592;</div>
              )}
            </div>

            {/* 玩家摘要视图（可扩展为完整展开视图） */}
            <div className="stats">
              {/* 💠 宝石统计（待实现真实数据渲染） */}
              <div className="gem-stats">
              {Object.entries(player.gems).map(([color, count]) => {
    if (color === "*") return null;

    // 统计该颜色卡牌数
    const cardCount = Object.values(player.cards || {})
      .flat()
      .filter((card) => card.color === color).length;

    return (
      <div key={color} className="statSet">
        {/* 上方矩形，显示 M/N */}
        <div className={`stat stat${color}`}>
          {count}/{cardCount}
        </div>
        {/* 下方颜色标识图标 */}
        <div>
          <img className="labelImg" src="/gamesource/game_page/labels.png" />
        </div>
      </div>
    );
  })}
</div>

              {/* 🃏 保留卡简略视图（小矩形块） */}
              <div className="reservedStat">
                {player.reserved?.map((card) => (
                  <div
                    key={card.uuid}
                    className={`card card-${card.color} card-${card.level}`}
                  ></div>
                ))}
              </div>
            </div>
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
        {/* 聊天记录 */}
        <div style={{ maxHeight: "150px", overflowY: "auto", color: "white" }}>
          {chatMessages.map((msg, idx) => (
            <div key={idx}>
              <strong>{msg.player}: </strong>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>

        {/* 输入框 + 发送按钮 */}
        <form
          onSubmit={handleSendChat}
          style={{ display: "flex", marginTop: "5px" }}
        >
          <input
            type="text"
            value={newChat}
            onChange={(e) => setNewChat(e.target.value)}
            placeholder="Type your message..."
            style={{ flex: 1, padding: "8px" }}
          />
          <button type="submit" style={{ padding: "8px 16px" }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
