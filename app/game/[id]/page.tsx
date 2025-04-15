"use client";
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  require("./mocks/mockWS.js");
}
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";


// Card Type
interface Card {
  uuid: string;
  level: string;
  color: string;
  points: number;
  cost: { [key: string]: number };
}

// Noble
interface Noble {
  uuid: string;
  points: number;
  requirement: { [key: string]: number };
}

// Player
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

// Game State
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

// Chat Message
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
  const [showChat, setShowChat] = useState(false);
  const [chatNotify, setChatNotify] = useState(false);
 

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChat, setNewChat] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("currentUser") || "{}")
      : {};

  // 新增函数：检查用户是否有足够资源购买卡牌
  const canAffordCard = (card: Card): boolean => {
    if (!gameState) return false;
    
    // 找到当前玩家
    const currentPlayer = gameState.players.find(p => p.uuid === currentUser.uuid);
    if (!currentPlayer) return false;
    
    // 如果不是当前玩家的回合，不允许购买
    if (gameState.turn !== currentPlayer.id) {
      return false;
    }

    // 计算玩家拥有的实际资源(宝石 + 卡牌折扣)
    const playerCards = Object.values(currentPlayer.cards).flat();
    
    // 统计玩家拥有的各颜色卡牌数量（这些可以作为对应颜色的折扣）
    const discounts: { [color: string]: number } = {};
    
    // 初始化所有颜色的折扣为0
    ["r", "g", "b", "u", "w"].forEach(color => {
      discounts[color] = playerCards.filter(c => c.color === color).length;
    });
    
    // 计算购买卡牌需要额外支付的宝石数量
    const requiredGems: { [color: string]: number } = {};
    
    Object.entries(card.cost).forEach(([color, count]) => {
      // 计算需要的宝石 = 卡牌花费 - 已有的同色卡牌折扣
      const discount = discounts[color] || 0;
      const required = Math.max(0, count - discount);
      
      if (required > 0) {
        requiredGems[color] = required;
      }
    });
    
    // 检查玩家是否有足够的宝石
    let wildcardsNeeded = 0;
    
    for (const [color, required] of Object.entries(requiredGems)) {
      const available = currentPlayer.gems[color] || 0;
      
      if (available < required) {
        // 差额需要用通配符宝石补充
        wildcardsNeeded += (required - available);
      }
    }
    
    // 检查玩家的通配符宝石是否足够
    const wildcards = currentPlayer.gems["*"] || 0;
    return wildcards >= wildcardsNeeded;
  };

  // 处理卡牌操作的函数
  const handleCardAction = (action: string, cardUuid: string) => {
    if (!gameState) return;
    
    // 找到当前玩家
    const currentPlayer = gameState.players.find(p => p.uuid === currentUser.uuid);
    if (!currentPlayer) {
      console.warn("Cannot find current player data");
      return;
    }
    
    // 寻找要操作的卡牌
    let targetCard: Card | undefined;
    
    // 从所有展示的卡牌中查找
    for (const level in gameState.cards) {
      const found = gameState.cards[level].find(card => card.uuid === cardUuid);
      if (found) {
        targetCard = found;
        break;
      }
    }
    
    // 如果没找到，可能是从预留卡牌列表中选择的
    if (!targetCard) {
      targetCard = currentPlayer.reserved.find(card => card.uuid === cardUuid);
    }
    
    if (!targetCard) {
      console.warn("Card not found:", cardUuid);
      return;
    }
    
    if (action === "buy") {
      if (canAffordCard(targetCard)) {
        sendAction("buy", cardUuid);
      } else {
        alert("You don't have enough gems to buy this card!");
      }
    } else if (action === "reserve") {
      // 检查是否已经有3张预留卡牌
      if (currentPlayer.reserved.length >= 3) {
        alert("You already have 3 reserved cards!");
      } else {
        sendAction("reserve", cardUuid);
      }
    }
  };

  useEffect(() => {
    if (!gameId) return;

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
            if (!showChat) {
              setChatNotify(true);
            }
            break;
          case "start":
            console.log("Game started!");
            break;
          case "error":
            alert("Error: " + msg.payload);
            break;
          case "info":
            console.log("Hint: " + msg.payload);
            break;
          default:
            break;
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
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
      console.warn("WebSocket is not connected yet");
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

  // 检查是否是当前玩家的回合
  const isPlayerTurn = (): boolean => {
    if (!gameState) return false;
    return gameState.turn === currentUser.id;
  };

  return (
    <div id="game-board" style={{
      backgroundImage: "url('/gamesource/tile_background.png')",
      backgroundSize: "cover",
      backgroundPosition: "center center",
      minHeight: "100vh",
      width: "100%",
      padding: "20px",
      color: "#fff"
    }}>
      <CountdownTimer initialSeconds={30} />
  
      {/* Main game layout */}
      <div style={{
        display: "flex",
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        gap: "20px",
      }}>
        {/* Public Area - Left side */}
        <div id="common-area" style={{
          flex: "3",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {/*Noble Area*/}
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
          
          {/* Cards Area */}
          <div id="level-area">
            {["level1", "level2", "level3"].map((level) => (
              <div key={level} className="card-row flex items-start gap-4 min-w-[1200px] mb-6">
                {/* 卡堆（deck） */}
                <div className={`deck ${level} w-[130px] h-[180px] relative`}>
                  <div className="remaining">{gameState?.decks?.[level] ?? 0}</div>
                  <div className="overlay"></div>
                  <div 
                    className={`reserve ${isPlayerTurn() ? 'active' : 'inactive'}`}
                    onClick={() => {
                      if (isPlayerTurn()) {
                        const currentPlayer = gameState?.players.find(p => p.uuid === currentUser.uuid);
                        if (currentPlayer && currentPlayer.reserved.length < 3) {
                          sendAction("reserve", level);
                        } else {
                          alert("You already have 3 reserved cards!");
                        }
                      } else {
                        alert("It's not your turn!");
                      }
                    }}
                  >
                    <img
                      className="floppy"
                      src="/gamesource/game_page/floppy.png"
                      alt="reserve"
                    />
                  </div>
                </div>
              
                {/* 翻开的卡牌 */}
                <div className={`c_${level} face-up-cards`}>
                  <div className="cards-inner flex gap-4 flex-nowrap overflow-x-auto">
                    {gameState?.cards?.[level]?.map((card) => {
                      const affordable = canAffordCard(card);
                      return (
                        <div
                          key={card.uuid}
                          className={`card card-${card.color} card-${card.level} w-[280px] h-[400px] ${affordable ? 'affordable' : 'not-affordable'}`}
                          onClick={() => handleCardAction("buy", card.uuid)}
                        >
                          <div
                            className={`reserve ${isPlayerTurn() ? 'active' : 'inactive'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isPlayerTurn()) {
                                handleCardAction("reserve", card.uuid);
                              } else {
                                alert("It's not your turn!");
                              }
                            }}
                          >
                            <img
                              className="floppy"
                              src="/gamesource/game_page/floppy.png"
                              alt="reserve"
                            />
                          </div>
                          <div className={`overlay ${affordable ? 'affordable' : 'not-affordable'}`}></div>
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
                      );
                    })}
                  </div>
                </div>
              </div>            
            ))}
          </div>
  
          {/* Public Gem Area */}
          <div id="gem-area">
            {gameState?.gems &&
              Object.entries(gameState.gems).map(([color, count]) => {
                const chipClass = color === "*" ? "schip" : `${color}chip`;
                return (
                  <div
                    key={color}
                    className={`gem ${chipClass} ${isPlayerTurn() ? 'active' : 'inactive'}`}
                    onClick={() => {
                      if (isPlayerTurn()) {
                        sendAction("take", color);
                      } else {
                        alert("It's not your turn!");
                      }
                    }}
                  >
                    <div className="bubble">{count}</div>
                    <div className="underlay"></div>
                  </div>
                );
              })}
          </div>
        </div>
        
        {/* Player Panel - Right side */}
        <div id="player-area" style={{
          flex: "1",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          padding: "10px",
          borderRadius: "8px",
          minWidth: "500px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {gameState?.players?.map((player) => {
            const colorToChip: Record<string, string> = {
              r: "red",
              g: "green",
              b: "blue",
              u: "black",
              w: "white",
              "*": "gold",
            };

            return (
              <div key={player.uuid} className="player">
                {/* Header */}
                <div className="playerHeader">
                  <span>{player.name}</span>
                  <span>Score: {player.score}</span>
                  {gameState.turn === player.id && <span className="turnIndicator">←</span>}
                </div>

                {/* Nobles */}
                {player.nobles.length > 0 && (
                  <div className="nobleStat">
                    <div>Nobles:</div>
                    <div className="nobleCards">
                      {player.nobles.map((noble) => (
                        <div key={noble.uuid} className="noble" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Gems and Cards */}
                <div className="gem-stats">
                {Object.entries(player.gems).map(([color, count]) => {
                  const normalizedColor = color.toLowerCase(); // 保证小写

                  const cardCount = Object.values(player.cards || {})
                    .flat()
                    .filter((card) => card.color.toLowerCase() === normalizedColor).length;

                  return (
                    <div key={color} className="statSet">
                      <div className="stat">{count}/{cardCount}</div>
                      <div className={`chip chip-${colorToChip[normalizedColor] || "black"}`} />
                    </div>
                  );
                })}
                </div>

                {/* Reserved Cards */}
                <div className="reserveCards" style={{
                  minWidth: "450px",
                  minHeight: "220px",
                  display: "flex",
                }}>
                  {[0, 1, 2].map((i) => {
                    const card = player.reserved[i];
                    // 检查当前玩家是否可以购买这张预留卡
                    const isCurrentPlayer = player.uuid === currentUser.uuid;
                    const affordable = card && isCurrentPlayer ? canAffordCard(card) : false;
                    
                    return card ? (
                      <div 
                        key={card.uuid} 
                        className={`card card-sm card-${card.color} ${affordable ? 'affordable' : 'not-affordable'}`}
                        onClick={() => {
                          if (isCurrentPlayer && isPlayerTurn()) {
                            handleCardAction("buy", card.uuid);
                          }
                        }}
                      >
                        <div className="points">{card.points}</div>
                        <div className={`overlay ${affordable ? 'affordable' : 'not-affordable'}`}></div>
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
                    ) : (
                      <div key={i} className="card card-sm placeholder-card" />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
  
      {/* Pass turn */}
      <button
        id="pass-turn"
        onClick={() => {
          if (isPlayerTurn()) {
            sendAction("next", "");
          } else {
            alert("It's not your turn!");
          }
        }}
        style={{
          margin: "20px auto",
          padding: "10px 20px",
          backgroundColor: "#ffd700",
          color: "black",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          opacity: isPlayerTurn() ? 1 : 0.3
        }}
      >
        Pass turn
      </button>
  
      {/* Chat box */}
      <div
        id="chat-box"
        style={{
          position: "fixed",
          right: "20px",
          bottom: -4,
          width: "250px",
          height: "auto",
          backgroundColor: "white",
          border: "2px solid black",
          borderBottom: "none",
          borderTopLeftRadius: "4px",
          borderTopRightRadius: "4px",
          zIndex: 3,
          fontFamily: "monospace",
          fontWeight: "normal",
          fontStyle: "normal",
          opacity: 0.9,
        }}
      >
        {/* Heading */}
        <div
          className={`title${chatNotify ? " blinking" : ""}`}
          onClick={() => {
            setShowChat((prev) => !prev);
            setChatNotify(false);
          }}
          style={{
            width: "230px",
            cursor: "pointer",
            padding: "3px 10px",
            borderBottom: "1px solid black",
            marginBottom: "5px",
          }}
        >
          ::Chat
        </div>
  
        {/* Show Content */}
        {showChat && (
          <>
            {/* Conversation */}
            <div
              className="scroller"
              style={{
                height: "230px",
                overflowY: "scroll",
                padding: "0 10px",
              }}
            >
              {chatMessages.map((msg, idx) => (
                <div key={idx}>
                  <strong>{msg.player}: </strong>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
  
            {/*Input Area*/}
            <form
              id="chat"
              onSubmit={handleSendChat}
              style={{
                width: "240px",
                display: "flex",
                borderTop: "1px solid black",
                padding: "0 5px",
              }}
            >
              <span id="prompt">&gt;</span>
              <input
                id="chat-inner"
                type="text"
                value={newChat}
                onChange={(e) => setNewChat(e.target.value)}
                style={{
                  marginLeft: "5px",
                  fontFamily: "monospace",
                  height: "25px",
                  width: "210px",
                  outline: "none",
                  border: "none",
                }}
              />
            </form>
          </>
        )}
      </div>
    </div>
  );
}