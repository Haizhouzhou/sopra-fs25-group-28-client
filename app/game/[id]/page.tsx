"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from 'next/navigation';
import { useWebSocket, WebSocketMessage } from "@/hooks/useWebSocket"; 
import { useGameState } from '@/hooks/useGameStateContext';

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

interface PlayerSnapshot {
  userId: number | string;
  name?: string;
  victoryPoints?: number;
  gems?: Record<string, number>;
  bonusGems?: Record<string, number>;
  reservedCardIds?: number[];
}

type WSMessageType = "state" | "chat" | "start" | "error" | "info" | "ai_hint";
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

// 颜色映射函数
const mapColorToFrontend = (color: string): string => {
  const colorMap: Record<string, string> = {
    'BLACK': 'u', // 应该返回 'u' 而不是 'black'
    'BLUE': 'b',  // 应该返回 'b' 而不是 'blue'
    'GREEN': 'g', // 应该返回 'g' 而不是 'green'
    'RED': 'r',   // 应该返回 'r' 而不是 'red'
    'WHITE': 'w', // 应该返回 'w' 而不是 'white'
    'GOLD': 'x'   // 应该返回 '*' 而不是 'gold'
  };
  
  // 返回对应的颜色代码，如果找不到则返回小写的颜色名
  const result = colorMap[color?.toUpperCase()] || color?.toLowerCase() || 'u';
  return result;
};

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  const sessionId = `game-${gameId}-${Date.now()}`;
  const [pendingGameState, setPendingGameState] = useState<any>(null);
  
  const [showChat, setShowChat] = useState(false);
  const [chatNotify, setChatNotify] = useState(false);

  const [seconds, setSeconds] = useState(30);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const stableGameId = useRef(params.id as string).current;
  const stableSessionId = useRef(`game-${stableGameId}-${Date.now()}`).current;

  const { lastGameState, clearGameState } = useGameState();


  useEffect(() => {
    if (seconds <= 0) {
      setIsTimeUp(true);
      return;
    }
    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [seconds]);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChat, setNewChat] = useState("");
  
  // 使用useWebSocket钩子替代直接创建WebSocket
  const { sendMessage, connected: wsConnected } = useWebSocket(stableSessionId, handleWebSocketMessage);
  
  // 卡牌和贵族数据
  const [cardsData, setCardsData] = useState([]);
  const [noblesData, setNoblesData] = useState([]);

  // for AI hint
  const [hintMessage, setHintMessage] = useState("");
  const [hintLoading, setHintLoading] = useState(false);
  const [hintCount, setHintCount] = useState(0); // 可以限制每场游戏使用次数

  const [roomName, setRoomName] = useState("Test name");

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("currentUser") || "{}")
      : {};

  const hasJoinedRef = useRef(false);


  // WebSocket消息处理函数
  function handleWebSocketMessage(msg: WebSocketMessage) {
    console.log("收到游戏消息类型:", msg.type, "内容:", msg.content);

    if (msg.content) {
      // 如果内容是字符串，尝试解析为JSON
      if (typeof msg.content === 'string') {
        try {
          const parsedContent = JSON.parse(msg.content);
          console.log("解析后的消息内容:", parsedContent);
          
          // 检查解析后的内容中是否有房间名称
          if (parsedContent.roomName) {
            console.log("从解析后的内容获取到房间名称:", parsedContent.roomName);
            setRoomName(parsedContent.roomName);
          }
          
          msg.content = parsedContent;
        } catch (e) {
          console.error("解析JSON失败:", e);
        }
      }
      // 如果已经是对象
      else if (typeof msg.content === 'object') {
        console.log("消息内容(对象):", msg.content);
        
        // 检查对象中是否有房间名称
        if (msg.content.roomName) {
          console.log("从对象内容获取到房间名称:", msg.content.roomName);
          setRoomName(msg.content.roomName);
        }
      }
    }

    switch (msg.type) {
      case "GAME_STATE":
        console.log("收到GAME_STATE消息:", msg);
        
        if (typeof msg.content === 'string') {
          try {
            msg.content = JSON.parse(msg.content);
            console.log("解析后的消息内容:", msg.content);
          } catch (e) {
            console.error("解析 JSON 失败:", e);
          }
        }
        
        if (!msg.content) {
          console.warn("收到空的游戏状态内容");
          return;
        }
        
        if (cardsData.length > 0 && noblesData.length > 0) {
            console.log("游戏ID:", msg.content.gameId);
            console.log("可见卡牌:", 
              msg.content.visibleLevel1cardIds?.length,
              msg.content.visibleLevel2cardIds?.length,
              msg.content.visibleLevel3cardIds?.length
            );
            
            try {
              const gameStateData = transformGameState(msg.content, cardsData, noblesData);
              
              if (gameStateData) {
                console.log("转换后的游戏卡牌数量:", 
                  gameStateData.cards.level1.length,
                  gameStateData.cards.level2.length,
                  gameStateData.cards.level3.length
                );
                setGameState(gameStateData);
              } else {
                console.warn("游戏状态转换结果为null");
              }
            } catch (error) {
              console.error("转换游戏状态失败:", error);
            }
          } else {
            console.warn("卡牌或贵族数据尚未加载完成");
            setPendingGameState(msg.content);
          }
        break;
        
        case "ROOM_STATE":
          console.log("收到ROOM_STATE消息:", msg);
          
          // 尝试获取房间名称
          if (typeof msg.content === 'object' && msg.content) {
            // ✅ 设置房间名称
            if (msg.content.roomName) {
              console.log("从ROOM_STATE获取到房间名称:", msg.content.roomName);
              setRoomName(msg.content.roomName);
            }
        
            // ✅ 设置玩家信息
            if (msg.content.players && Array.isArray(msg.content.players)) {
              console.log("房间中的玩家列表:", msg.content.players);
        
              const userMap: Record<string | number, { name: string }> = {};
              msg.content.players.forEach((player: Player) => {
                if (player && player.userId !== undefined && player.name) {
                  userMap[player.userId] = { name: player.name };
                  console.log(`保存玩家信息: ID ${player.userId}, 名称 ${player.name}`);
                }
              });
        
              if (Object.keys(userMap).length > 0) {
                try {
                  const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
                  const updatedUsers = { ...existingUsers, ...userMap };
                  localStorage.setItem('users', JSON.stringify(updatedUsers));
                  console.log("已更新localStorage中的用户信息:", updatedUsers);
                } catch (e) {
                  console.error("保存用户信息到localStorage失败:", e);
                }
              }
            }
          }
          break;
        
      
      case "GAME_STATE":
        console.log("收到GAME_STATE消息:", msg);
        
        // 如果收到游戏状态且包含玩家数据
        if (typeof msg.content === 'object' && msg.content && msg.content.playerSnapshots) {
          const playerSnapshots = msg.content.playerSnapshots;
          console.log("游戏中的玩家数据:", playerSnapshots);
          
          // 从localStorage获取玩家名称信息
          try {
            const userMap = JSON.parse(localStorage.getItem('users') || '{}');
            console.log("从localStorage获取的用户信息:", userMap);
            
            let needToUpdateBackend = false;
            
            // 为每个playerSnapshot添加名称(如果可能)
            playerSnapshots.forEach((player: PlayerSnapshot) => {
              // 确保player和userId存在
              if (player && player.userId !== undefined) {
                // 如果player没有名称但userMap中有
                if (!player.name && userMap[player.userId] && userMap[player.userId].name) {
                  console.log(`为玩家ID ${player.userId} 添加名称: ${userMap[player.userId].name}`);
                  player.name = userMap[player.userId].name;
                  needToUpdateBackend = true;
                }
              }
            });
            
            if (needToUpdateBackend) {
              console.log("已为玩家添加名称信息，可能需要更新后端");
            }
            
            // 继续处理游戏状态...
            if (cardsData.length > 0 && noblesData.length > 0) {
              try {
                const gameStateData = transformGameState(msg.content, cardsData, noblesData);
                if (gameStateData) {
                  setGameState(gameStateData);
                }
              } catch (error) {
                console.error("转换游戏状态失败:", error);
              }
            } else {
              console.warn("卡牌或贵族数据尚未加载完成");
              setPendingGameState(msg.content);
            }
            
          } catch (e) {
            console.error("从localStorage获取用户信息失败:", e);
          }
        }
        break;
        
      case "CHAT_MESSAGE":
        // 处理聊天消息
        if (msg.content) {
          let playerName = "玩家";
          let messageText = "";
          
          if (typeof msg.content === 'object') {
            playerName = msg.content.player || playerName;
            messageText = msg.content.text || JSON.stringify(msg.content);
          } else {
            messageText = msg.content.toString();
          }
          
          const chatMsg: ChatMessage = {
            player: playerName,
            text: messageText,
            timestamp: Date.now()
          };
          setChatMessages(prev => [...prev, chatMsg]);
          
          // 如果聊天窗口没有打开，显示通知
          if (!showChat) {
            setChatNotify(true);
          }
        }
        break;
        
      case "AI_HINT":
        // 处理AI提示
        if (msg.content) {
          const hintText = typeof msg.content === 'object' 
            ? msg.content.message || JSON.stringify(msg.content)
            : msg.content.toString();
          setHintMessage(hintText);
          setHintLoading(false);
        }
        break;
    }
  }

  // 调试函数：验证颜色格式
function checkColorFormat(obj: any, path: string = 'root') {
  if (!obj) return;
  
  if (typeof obj === 'object') {
    // 检查是否有颜色相关的字段
    if (obj.color) {
      console.log(`路径 ${path}.color 的值为: ${obj.color}, 类型: ${typeof obj.color}`);
    }
    
    // 检查是否有cost字段
    if (obj.cost && typeof obj.cost === 'object') {
      console.log(`路径 ${path}.cost 包含颜色:`, Object.keys(obj.cost).join(', '));
    }
    
    // 递归检查所有字段
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        checkColorFormat(value, `${path}.${key}`);
      }
    });
  }
}

  // 在连接成功后发送加入房间消息
  useEffect(() => {
    if (wsConnected && !hasJoinedRef.current) {
      console.log("WebSocket连接成功，发送加入房间消息");
      sendMessage({
        type: "JOIN_ROOM",
        roomId: gameId
      });
      hasJoinedRef.current = true; // 确保只发一次
    }
  }, [wsConnected, gameId, sendMessage]);

  
  // 加载卡牌和贵族数据
  useEffect(() => {
    console.log("开始加载卡牌和贵族数据...");
    
    // 使用绝对路径
    Promise.all([
      fetch('/cards.json').then(response => {
        console.log("卡牌数据响应:", response.status);
        if (!response.ok) {
          throw new Error(`加载卡牌数据失败: ${response.status}`);
        }
        return response.json();
      }),
      fetch('/noblemen.json').then(response => {
        console.log("贵族数据响应:", response.status);
        if (!response.ok) {
          throw new Error(`加载贵族数据失败: ${response.status}`);
        }
        return response.json();
      })
    ])
    .then(([cards, nobles]) => {
      console.log("卡牌数据加载完成，共", cards.length, "张卡牌");
      console.log("贵族数据加载完成，共", nobles.length, "个贵族");
      setCardsData(cards);
      setNoblesData(nobles);
      
      // 处理任何待处理的游戏状态
      if (pendingGameState) {
        try {
          console.log("处理待处理的游戏状态:", pendingGameState);
          const gameStateData = transformGameState(pendingGameState, cards, nobles);
          if (gameStateData) {
            setGameState(gameStateData);
            setPendingGameState(null);
          }
        } catch (error) {
          console.error("处理待处理游戏状态时出错:", error);
        }
      }
    })
    .catch(error => {
      console.error("加载游戏数据失败:", error);
    });
  }, [pendingGameState]);

  function inspectObject(obj: any, label: string = "") {
    if (!obj) {
      console.log(`${label} 是 null 或 undefined`);
      return;
    }
    
    console.log(`${label} 类型: ${typeof obj}`);
    console.log(`${label} 属性列表: ${Object.keys(obj).join(", ")}`);
    
    // 针对GameState消息特别处理
    if (obj.visibleLevel1cardIds) {
      console.log(`Level1卡牌ID: ${obj.visibleLevel1cardIds.join(", ")}`);
    }
  }

  // 监听卡牌和贵族数据加载
  useEffect(() => {
    if (lastGameState && cardsData.length > 0 && noblesData.length > 0) {
      console.log("从全局状态加载游戏数据:", lastGameState);
      try {
        const gameStateData = transformGameState(lastGameState, cardsData, noblesData);
        if (gameStateData) {
          setGameState(gameStateData);
        }
      } catch (error) {
        console.error("转换游戏状态失败:", error);
      }
    }
  }, [lastGameState, cardsData, noblesData]);

  // 转换游戏状态函数 - 改进版本
  function transformGameState(data: any, cardsData: any[], noblesData: any[]): GameState | null {
    console.log("正在转换游戏状态:", data);
    
    if (!data) {
      console.warn("收到空的游戏状态数据");
      return null;
    }
    
    // 查找卡牌的辅助函数
    const getCardById = (id: number): Card | null => {
      if (!id) return null;
      
      const card = cardsData.find(c => c.id === id);
      if (!card) {
        console.warn(`未找到ID为 ${id} 的卡牌`);
        return null;
      }
      
      // 为调试添加日志
      console.log(`找到卡牌ID ${id}:`, card);
      
      // 直接使用原始颜色名称，不进行转换
      return {
        uuid: card.id.toString(),
        level: `level${card.tier}`,
        color: mapColorToFrontend(card.color), 
        points: card.points || 0,
        cost: transformCost(card.cost) 
      };
    };
    
    // 查找贵族的辅助函数
    const getNobleById = (id: number): Noble | null => {
      if (!id) return null;
      
      const noble = noblesData.find(n => n.id === id);
      if (!noble) {
        console.warn(`未找到ID为 ${id} 的贵族`);
        return null;
      }
      
      // 直接使用原始数据
      return {
        uuid: noble.id.toString(),
        points: noble.influence || 3,
        requirement: transformCost(noble.cost || {}) // 直接使用原始成本对象
      };
    };
    

    
    // 转换花费到前端格式
    const transformCost = (cost: Record<string, number> | undefined): Record<string, number> => {
      if (!cost) return {};
      
      const result: Record<string, number> = {};
      Object.entries(cost).forEach(([color, count]) => {
        if (count && count > 0) {
          // 确保这里返回的是不带引号的颜色代码
          const frontendColor = mapColorToFrontend(color);
          result[frontendColor] = count;
        }
      });
      
      return result;
    };
    
    // 转换宝石到前端格式
    const transformGems = (gems: Record<string, number> | undefined): Record<string, number> => {
      if (!gems) return {};
      const result: Record<string, number> = {};
      Object.entries(gems).forEach(([color, count]) => {
        const frontendColor = mapColorToFrontend(color);
        result[frontendColor] = count;
      });
      return result;
    };
    
    // 构建玩家数据
    const players = (data.playerSnapshots || []).map((player: PlayerSnapshot, index: number) => {

      let playerName = player.name; // 首先尝试使用PlayerSnapshot中的name
  
      if (!playerName) {
        // 如果没有名称但有userId，尝试从localStorage获取
        if (player.userId !== undefined) {
          try {
            const userMap = JSON.parse(localStorage.getItem('users') || '{}');
            if (userMap[player.userId] && userMap[player.userId].name) {
              playerName = userMap[player.userId].name;
            }
          } catch (e) {
            console.error("获取用户名称失败:", e);
          }
        }
        
        // 如果仍然没有名称，使用默认名称
        if (!playerName) {
          playerName = `Player ${index + 1}`;
        }
      }      
      // 初始化各个级别的空卡牌集合
      const playerCards: {[level: string]: Card[]} = {
        level1: [],
        level2: [],
        level3: []
      };
      
      // 获取玩家预留的卡牌
      const reservedCards = (player.reservedCardIds || [])
        .map((id: number) => getCardById(id))
        .filter(Boolean) as Card[];
      
      return {
        id: player.userId,
        uuid: String(player.userId),
        name: playerName,
        score: player.victoryPoints || 0,
        cards: playerCards,
        gems: transformGems(player.gems || {}),
        nobles: [], // 后端目前没有提供玩家拥有的贵族信息
        reserved: reservedCards
      };
    });
    
    // 按级别构建卡牌数据，确保没有空值
    const cards: {[level: string]: Card[]} = {
      level1: [],
      level2: [],
      level3: []
    };
    
    // 处理level 1卡牌
    if (data.visibleLevel1cardIds && Array.isArray(data.visibleLevel1cardIds)) {
      cards.level1 = data.visibleLevel1cardIds
        .map((id: number) => getCardById(id))
        .filter(Boolean) as Card[];
    }
    
    // 处理level 2卡牌
    if (data.visibleLevel2cardIds && Array.isArray(data.visibleLevel2cardIds)) {
      cards.level2 = data.visibleLevel2cardIds
        .map((id: number) => getCardById(id))
        .filter(Boolean) as Card[];
    }
    
    // 处理level 3卡牌
    if (data.visibleLevel3cardIds && Array.isArray(data.visibleLevel3cardIds)) {
      cards.level3 = data.visibleLevel3cardIds
        .map((id: number) => getCardById(id))
        .filter(Boolean) as Card[];
    }
    
    // 构建贵族数据
    const nobles = (data.visibleNobleIds || [])
      .map((id: number) => getNobleById(id))
      .filter(Boolean) as Noble[];
    
    const result = {
      players,
      gems: transformGems(data.availableGems || {}),
      cards,
      nobles,
      decks: {
        level1: 40 - (cards.level1.length || 0),
        level2: 30 - (cards.level2.length || 0),
        level3: 20 - (cards.level3.length || 0)
      },
      turn: data.currentPlayerIndex || 0,
      log: [],
      winner: null
    };
    
    console.log("转换后的游戏状态:", result);
    console.log("各级别卡牌数量:", {
      level1: result.cards.level1.length,
      level2: result.cards.level2.length,
      level3: result.cards.level3.length
    });
    
    checkColorFormat(result, 'gameState');
    return result;
  }

  // 检查用户是否有足够资源购买卡牌
  const canAffordCard = (card: Card): boolean => {
    if (!gameState) return false;
    
    // 找到当前玩家
    const currentPlayer = gameState.players.find(p => p.id === currentUser.id);
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
    const currentPlayer = gameState.players.find(p => p.id === currentUser.id);
    if (!currentPlayer) {
      console.warn("找不到当前玩家数据");
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
      console.warn("未找到卡牌:", cardUuid);
      return;
    }
    
    if (action === "buy") {
      if (canAffordCard(targetCard)) {
        sendAction("buy", cardUuid);
      } else {
        alert("您没有足够的宝石购买此卡!");
      }
    } else if (action === "reserve") {
      // 检查是否已经有3张预留卡牌
      if (currentPlayer.reserved.length >= 3) {
        alert("您已经有3张预留卡牌了!");
      } else {
        sendAction("reserve", cardUuid);
      }
    }
  };

  const requestAiHint = () => {
    if (!isPlayerTurn() || hintCount >= 3) return; // 限制使用3次
    
    setHintLoading(true);
    setHintMessage("");
    
    // 发送AI提示请求
    sendMessage({
      type: "AI_HINT",
      roomId: gameId,
      content: { target: "" }
    });
    
    // 增加使用次数
    setHintCount(prev => prev + 1);
  };

  // 发送动作到WebSocket
  const sendAction = (action: string, target: string, extraData: Record<string, any> = {}) => {
    if (!wsConnected) {
      console.warn("WebSocket尚未连接");
      return;
    }
    
    // 映射前端动作到后端动作类型
    let messageType;
    switch (action) {
      case "buy":
        messageType = "BUY_CARD";
        break;
      case "reserve":
        messageType = "RESERVE_CARD";
        break;
      case "take":
        messageType = "TAKE_GEM";
        break;
      case "chat":
        messageType = "PLAYER_MESSAGE";
        break;
      case "next":
        messageType = "END_TURN";
        break;
      default:
        messageType = action.toUpperCase();
    }
    
    sendMessage({
      type: messageType,
      roomId: gameId,
      content: {
        userId: currentUser.id,
        target,
        ...extraData
      }
    });
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

  const colorToChip: Record<string, string> = {
    r: "red",
    g: "green",
    b: "blue",
    u: "black",
    w: "white",
    "*": "gold",
  };
  
  return (
    <div id="game-board" style={{
      backgroundImage: "url('/gamesource/tile_background.png')",
      backgroundSize: "cover",
      backgroundPosition: "center center",
      minHeight: "100vh",
      width: "100%",
      padding: "20px",
      color: "#fff",
      display: "flex",
      flexDirection: "column", // 垂直堆叠所有内容
      alignItems: "center" // 水平居中
    }}>

      {/* game logo and room name */}
      <div style={{
        display: "flex",
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "500px", // Match the main game layout's max-width
        margin: "0 auto", 
        padding: "0 20px",
        marginBottom: "20px"
      }}>
        <img 
          src="/gamesource/splendor_logo.png" 
          alt="Splendor" 
          style={{
            height: "60px", 
            maxWidth: "200px" 
          }}
        />
        <div style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#FFD700", // Gold color
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
        }}>
          Room: {roomName}
        </div>
      </div>

      {/* Main game layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 800px", // 左侧自适应，右侧固定800px宽度
        width: "100%",
        maxWidth: "1600px",
        margin: "0 auto",
        gap: "30px", // 两区域之间的间距
        alignItems: "start" // 从顶部开始对齐
      }}>
        {/* Public Area - Left side */}
        <div id="common-area" style={{
          flex: "2", // 从3减少
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "900px" // 设置最大宽度
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
                        <div key={color} className={`requires ${mapColorToFrontend(color)}`}>
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
          <div id="level-area" style={{
            width: "100%",
            height: "auto",
            marginBottom: "5px" 
          }}>
            {["level1", "level2", "level3"].map((level) => (
              <div key={level} className="card-row" style={{
                display: "flex",
                alignItems: "start",
                gap: "15px",
                marginBottom: "20px",
                width: "100%",
                overflowX: "visible"
              }}>
                {/* 卡堆（deck） */}
                <div className={`deck ${level} w-[130px] h-[180px] relative`}>
                  <div className="remaining" style={{
                    position: "absolute",
                    borderRadius: "50%",
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "2px solid white",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "15px",
                    color: "white",
                    zIndex: 2
                  }}>
                    {gameState?.decks?.[level] ?? 0}
                  </div>
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
                  <div className="cards-inner flex-nowrap overflow-x-auto">
                  {gameState?.cards?.[level]?.map((card) => (
                    <div
                      key={card.uuid}
                      className={`card card-${card.color.toLowerCase()} card-${card.level}`}
                      onClick={() => handleCardAction("buy", card.uuid)}
                    >
                        <div
                          className={`reserve ${isPlayerTurn() ? 'active' : 'inactive'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPlayerTurn()) {
                              handleCardAction("reserve", card.uuid);
                            }
                          }}
                        >
                          <img
                            className="floppy"
                            src="/gamesource/game_page/floppy.png"
                            alt="reserve"
                          />
                        </div>
                        <div className={`overlay ${canAffordCard(card) ? 'affordable' : 'not-affordable'}`}></div>
                        <div className="underlay"></div>
                        <div className="header">
                          <div className={`color ${card.color.toLowerCase()}gem`}></div>
                          <div className="points">{card.points > 0 ? card.points : ""}</div>
                        </div>
                        <div className="costs">
                          {Object.entries(card.cost).map(([costColor, count]) =>
                            count > 0 ? (
                              <div key={costColor} className={`cost ${mapColorToFrontend(costColor)}`}>
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
          <div id="gem-area" style={{
            width: "100%",
            height: "84px",
            display: "flex",
            justifyContent: "space-around",
            marginTop: "5px" 
          }}>
            {gameState?.gems &&
              Object.entries(gameState.gems).map(([color, count]) => {
                const lowerColor = color.toLowerCase(); 
                let chipClass = `${mapColorToFrontend(color)}chip`;
                if (lowerColor === "gold") {
                  chipClass = "schip";
                } else if (lowerColor === "black") {
                  chipClass = "uchip";
                } else if (lowerColor === "blue") {
                  chipClass = "bchip";
                } else if (lowerColor === "red") {
                  chipClass = "rchip";
                } else if (lowerColor === "green") {
                  chipClass = "gchip";
                } else if (lowerColor === "white") {
                  chipClass = "wchip";
                } else {
                  chipClass = `${lowerColor}chip`; // fallback
                }
              
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
                    <div className="bubble" style={{
                      position: "absolute",
                      top: "-5px",
                      left: "-5px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "2px solid white",
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "15px",
                      color: "white",
                      zIndex: 2
                    }}>
                      {count}
                    </div>
                    <div className="underlay"></div>
                  </div>
                );
              })}
          </div>
        </div>
        
        {/* Player Panel - Right side */}
        <div style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          gap: "50px",
          width: "100%",
        }}>
          {/* Player panels */}
          <div id="player-area" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr", // 2列网格
            gridTemplateRows: "auto auto", // 2行网格，高度自适应
            gap: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            padding: "10px", 
            borderRadius: "8px",
            width: "100%",
            maxWidth: "800px",
            maxHeight: "calc(100vh - 350px)",
            overflowY: "visible",
            alignContent: "start"
          }}>
            {gameState?.players?.map((player) => {
              // 定义颜色映射
              const colorToChip = {
                r: "red",
                g: "green",
                b: "blue",
                u: "black",
                w: "white",
                "*": "gold",
              };
  
              return (
                <div key={player.uuid} className="player" style={{
                  padding: "6px",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "5px",
                  width: "100%",
                  height: "auto",
                  maxHeight: "280px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  {/* Header */}
                  <div className="playerHeader" style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "5px", // 减小底部边距
                    fontSize: "0.95em" // 稍微缩小字体
                  }}>
                    <span>{player.name}</span>
                    <span>Score: {player.score}</span>
                    {gameState.turn === player.id && <span className="turnIndicator">←</span>}
                  </div>
  
                  {/* Nobles */}
                  {player.nobles.length > 0 && (
                    <div className="nobleStat" style={{
                      marginBottom: "8px"
                    }}>
                      <div>Nobles:</div>
                      <div className="nobleCards" style={{ display: "flex", gap: "5px" }}>
                        {player.nobles.map((noble) => (
                          <div key={noble.uuid} className="noble" />
                        ))}
                      </div>
                    </div>
                  )}
  
                  {/* Gems and Cards */}
                  <div className="gem-stats" style={{
                    display: "flex",
                    flexWrap: "nowrap", // 不换行
                    justifyContent: "space-around", // 均匀分布
                    gap: "5px",
                    marginBottom: "10px",
                    width: "100%"
                  }}>
                    {Object.entries(player.gems).map(([color, count]) => {
                      const normalizedColor = color.toLowerCase();
                      
                      const cardCount = Object.values(player.cards || {})
                        .flat()
                        .filter((card) => card.color.toLowerCase() === normalizedColor).length;
  
                      // 确定颜色
                      const chipColor = color === 'r' ? 'red' : 
                                        color === 'g' ? 'green' : 
                                        color === 'b' ? 'blue' : 
                                        color === 'u' ? 'black' : 
                                        color === 'w' ? 'white' : 
                                        color === '*' ? 'gold' : 'black';
  
                      return (
                        <div key={color} className="statSet" style={{ 
                          margin: "0",
                          minWidth: "auto", // 移除最小宽度
                          textAlign: "center"
                        }}>
                          <div className="stat" style={{ 
                            fontSize: "0.8em", 
                            padding: "2px 4px"
                          }}>{count}/{cardCount}</div>
                          <div className={`chip chip-${chipColor}`} style={{
                            width: "30px", // 缩小宝石图标
                            height: "30px"
                          }} />
                        </div>
                      );
                    })}
                  </div>
  
                  {/* Reserved Cards */}
                  <div className="reserveCards">
                    {[0, 1, 2].map((i) => {
                      const card = player.reserved[i];
                      
                      if (card) {
                        return (
                          <div 
                            key={card.uuid} 
                            className={`card card-${card.color} ${card.level}`}
                            onClick={() => {
                              if (player.id === currentUser.id && isPlayerTurn()) {
                                handleCardAction("buy", card.uuid);
                              }
                            }}
                          >
                            <div className="points">{card.points}</div>
                            <div className="overlay"></div>
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
                      } else {
                        return (
                          <div 
                            key={`reserved-empty-${i}`}
                            style={{ 
                              width: "32%",
                              aspectRatio: "0.7", 
                              border: "1px dashed rgba(255,255,255,0.3)",
                              borderRadius: "4px",
                              backgroundColor: "rgba(0,0,0,0.1)"
                            }} 
                          />
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* AI Assistant Area */}
          <div id="ai-hint-area" style={{
            width: "100%",
            maxWidth: "800px",
            minHeight: "160px",
            backgroundColor: "rgba(20, 10, 80, 0.8)",
            border: "2px solid #6644ff",
            borderRadius: "8px",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(102, 68, 255, 0.5)"
          }}>
            <h3 style={{
              color: "#ffffff",
              marginBottom: "15px",
              fontSize: "20px",
              textAlign: "center"
            }}>AI Strategic Advisor</h3>
            
            <div id="ai-hint-content" style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              borderRadius: "5px",
              padding: "10px",
              marginBottom: "10px",
              minHeight: "80px",
              width: "100%",
              fontSize: "14px",
              overflow: "auto"
            }}>
              {hintMessage ? (
                <div>{hintMessage}</div>
              ) : (
                <div style={{ opacity: 0.7, textAlign: "center", marginTop: "30px" }}>
                  Click the button below for AI strategy advice
                </div>
              )}
            </div>
            
            <button 
              onClick={requestAiHint}
              disabled={hintLoading || !isPlayerTurn()}
              style={{
                padding: "8px 15px",
                backgroundColor: isPlayerTurn() ? "rgba(0, 100, 255, 0.7)" : "rgba(100, 100, 100, 0.5)",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: isPlayerTurn() ? "pointer" : "not-allowed",
                fontWeight: "bold",
                fontSize: "14px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {hintLoading ? (
                <span>Thinking...</span>
              ) : (
                <span>Get AI Advice {hintCount > 0 ? `(${hintCount}/3 used)` : ""}</span>
              )}
            </button>
          </div>
          
          {/* Game Control Area */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "800px",
            gap: "15px"
          }}>
            {/* Countdown Area */}
            <div style={{
              flex: "1",
              backgroundColor: isTimeUp ? "rgba(255, 100, 100, 0.8)" : "rgba(255, 200, 0, 0.8)",
              border: `3px solid ${isTimeUp ? "#ff3333" : "#ffa500"}`,
              borderRadius: "8px",
              padding: "10px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 20px ${isTimeUp ? "rgba(255, 100, 100, 0.6)" : "rgba(255, 200, 0, 0.6)"}`,
              animation: isTimeUp ? "pulse 2s infinite" : "none"
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: "bold",
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                color: "#000"
              }}>
                {seconds > 0 ? `Timer: ${seconds}s` : "Time's up!"}
              </div>
            </div>
            
            {/* Pass Turn Button */}
            <div style={{
              flex: "1",
              backgroundColor: "rgba(255, 150, 0, 0.8)",
              border: "3px solid #ff6a00",
              borderRadius: "8px",
              padding: "10px 5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isPlayerTurn() ? "pointer" : "not-allowed",
              boxShadow: "0 0 20px rgba(255, 150, 0, 0.6)",
              opacity: isPlayerTurn() ? 1 : 0.5
            }}
            onClick={() => {
              if (isPlayerTurn()) {
                sendAction("next", "");
              } else {
                alert("It's not your turn!");
              }
            }}
            >
              <div style={{
                fontSize: "24px",
                fontWeight: "bold",
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                color: "#000"
              }}>
                PASS TURN
              </div>
            </div>
          </div>
        </div>
      </div>
  
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
  )}