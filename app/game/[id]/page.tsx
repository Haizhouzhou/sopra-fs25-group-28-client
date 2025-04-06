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

  useEffect(() => {
    if (!gameId) return;

    /*if (process.env.NODE_ENV === "development") {
      import("./mocks/mockWS.js");
    }*/

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
            alert("Error" + msg.payload);
            break;
          case "info":
            console.log("hint：" + msg.payload);
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

  return (
    <div id="game-board">
      <CountdownTimer initialSeconds={30} />

      {/* Public Area*/}
      <div id="common-area">
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

        {/* Public Gem Area */}
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
      {/* Player Pannel */}
      <div id="player-area">
        {gameState?.players?.map((player) => (
          <div key={player.uuid} className="player">
            {/* Head */}
            <div className="playerHeader">
              <div className="playerPoints">{player.score}</div>
              <div className="playerName">
                {player.name} {player.id === currentUser.id && "(You)"}
              </div>
              {gameState.turn === player.id && (
                <div className="turnIndicator">&#8592;</div>
              )}
            </div>

            {/* Player's State */}
            {/* Novles have */}
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
            <div className="stats">
              {/* Gem have */}
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

            {/* Reserved Cards */}
            {player.reserved?.length > 0 && (
              <div className="reserveCards">
                {player.reserved.map((card) => (
                  <div
                    key={card.uuid}
                    className={`card card-${card.color} card-${card.level}`}
                    onClick={() => sendAction("buy_reserved", card.uuid)}
                  >
                    <div className="overlay"></div>
                    <div className="underlay"></div>
                    <div className="header">
                      <div className={`color ${card.color}gem`}></div>
                      {card.points > 0 && (
  <div className="points">{card.points}</div>
)}

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

            
          </div>
        ))}
      </div>
      {/* Pass turn */}
      <button
        id="pass-turn"
        onClick={() => sendAction("next", "")}
        style={{ opacity: gameState?.turn === currentUser.id ? 1 : 0.3 }}
      >
        Pass turn
      </button>

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
  {/* Headling*/}
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

  {/* Sho Content */}
  {showChat && (
    <>
      {/* Coversation */}
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


    </div> // game-board END
  );
}
