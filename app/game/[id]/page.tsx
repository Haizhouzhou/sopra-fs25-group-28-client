/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// deno-lint-ignore-file no-explicit-any no-unused-vars
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from 'next/navigation';
import { useWebSocket, WebSocketMessage } from "@/hooks/useWebSocket"; 
import { useGameState } from '@/hooks/useGameStateContext';
import ResponsiveGameWrapper from "components/ui/ResponsiveGameWrapper";





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
  roomName: string;
  currentPlayerId: number;
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

interface GameOverPlayer {
  userId: number | string;
  name: string;
  avatar?: string;
  victoryPoints: number;
}

interface GameOverData {
  players: GameOverPlayer[];
  winnerId: number | string;
}

interface GemChanges {
  [key: string]: number;
}

// 
interface CardAnimationState {
  active: boolean;
  cardId: string;
  sourceRect: DOMRect | null;
  targetRect: DOMRect | null;
  type: string;
  playerId: number | string | null;
  cardClasses?: string;
}

const COLOR_ORDER = ["r", "g", "b", "u", "w", "x"];

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

const buttonStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: "rgba(255, 150, 0, 0.8)",
  border: "3px solid #ff6a00",
  borderRadius: "8px",
  padding: "10px 5px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 0 20px rgba(255, 150, 0, 0.6)",
  fontSize: "20px",
  fontWeight: "bold",
  color: "#000",
  textShadow: "1px 1px 2px rgba(0,0,0,0.5)"
};


export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  const [pendingGameState, setPendingGameState] = useState<any>(null);
  
  const [showChat, setShowChat] = useState(false);
  const [chatNotify, setChatNotify] = useState(false);

  const [seconds, setSeconds] = useState(59); //自动 passturn 倒计时, 需要同步修改effect
  const [isTimeUp, setIsTimeUp] = useState(false);

  const stableSessionId = useRef(getStableSessionId(gameId)).current;

  const { lastGameState} = useGameState();

  const [currentAction, setCurrentAction] = useState<"take" | "buy" | "reserve" | null>(null);
  const [selectedGems, setSelectedGems] = useState<string[]>([]);

  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  
  

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChat, setNewChat] = useState("");
  
  // 使用useWebSocket钩子替代直接创建WebSocket
  const { sendMessage, connected: wsConnected, webSocketService } = useWebSocket(stableSessionId, handleWebSocketMessage);
  
  // 卡牌和贵族数据
  const [cardsData, setCardsData] = useState([]);
  const [noblesData, setNoblesData] = useState([]);

  // for AI hint
  const [hintMessage, setHintMessage] = useState("");
  const [hintLoading, setHintLoading] = useState(false);
  const [hintCount, setHintCount] = useState(0); // 可以限制每场游戏使用次数

  const [roomName, setRoomName] = useState("Test name");
  const [userMap, setUserMap] = useState<Record<string | number, { name: string }>>({});

  const currentUser =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("currentUser") || "{}")
    : {};

  const hasJoinedRef = useRef(false);
  const [, setLastHandledPlayerId] = useState<number | null>(null);

  const aiActiveRef = useRef(false); // 表示当前是否在等待 AI

  const [gemChanges, setGemChanges] = useState<GemChanges>({});
  const prevGameState = useRef<GameState | null>(null);

  const [cardAnimation, _setCardAnimation] = useState<CardAnimationState>({
    active: false,
    cardId: '',
    sourceRect: null,
    targetRect: null,
    type: '',
    playerId: null
  });

  const [aiHintProcessedForTurn, setAiHintProcessedForTurn] = useState(false);


  const [isFinalRound, setIsFinalRound] = useState(false);
  const [showFinalRoundAnimation, setShowFinalRoundAnimation] = useState(false);


  // 计时器显示文本函数
  const getTimerDisplay = () => {
    // 如果正在等待AI提示
    if (hintLoading) {
      return "Waiting for AI Hint...";
    }
    
    // 如果不是当前玩家的回合
    if (gameState && gameState.currentPlayerId !== currentUser.id) {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
      const playerName = currentPlayer?.name || "Other player";
      return `${playerName}'s turn`;
    }
    
    // 如果是当前玩家的回合但时间到了
    if (isTimeUp) {
      return "Time's up!";
    }
    
    // 如果是当前玩家的回合，且在当前回合已收到AI提示但还未执行操作
    if (aiHintProcessedForTurn && gameState?.currentPlayerId === currentUser.id && !currentAction) {
      return "Choose Action";
    }
    
    // 正常计时显示
    return `Timer: ${seconds}s`;
  };



  const triggerCardAnimation = (_cardId: string, type: string, playerId: number | string, cardElement: HTMLElement) => {
    if (!cardElement) return;
    
    // 获取位置信息
    const sourceRect = cardElement.getBoundingClientRect();
    const playerElement = document.querySelector(`[data-player-id="${playerId}"]`);
    if (!playerElement) return;
    const targetRect = playerElement.getBoundingClientRect();
    
    // 创建动画元素
    const animatedCard = document.createElement('div');
    // 复制原始卡牌的样式
    animatedCard.className = cardElement.className;
    animatedCard.style.position = 'fixed';
    animatedCard.style.left = `${sourceRect.left}px`;
    animatedCard.style.top = `${sourceRect.top}px`;
    animatedCard.style.width = `${sourceRect.width}px`;
    animatedCard.style.height = `${sourceRect.height}px`;
    animatedCard.style.zIndex = '1400';
    animatedCard.style.pointerEvents = 'none';
    
    // 添加到文档
    document.body.appendChild(animatedCard);
    
    // 创建并添加标签
    const label = document.createElement('div');
    label.textContent = type === "buy" ? "BUY!" : "RESERVE!";
    label.style.position = 'fixed';
    label.style.top = `${sourceRect.top - 30}px`;
    label.style.left = `${sourceRect.left + sourceRect.width/2}px`;
    label.style.transform = 'translateX(-50%)';
    label.style.backgroundColor = type === "buy" ? "#22cc22" : "#ff9900";
    label.style.color = 'white';
    label.style.padding = '3px 10px';
    label.style.borderRadius = '5px';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '16px';
    label.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    label.style.zIndex = '1500';
    label.style.pointerEvents = 'none';
    
    document.body.appendChild(label);
    
    // 执行动画
    const startTime = performance.now(); // 不需要参数
    const duration = 1000; // 1秒动画
    
    function animate(currentTime: number) { // 添加类型注解
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 1) {
        // 计算卡牌当前位置
        const currentX = sourceRect.left + progress * (targetRect.left + targetRect.width/2 - sourceRect.left);
        const currentY = sourceRect.top + progress * (targetRect.top + targetRect.height/2 - sourceRect.top);
        const scale = 1 - (0.5 * progress);
        const opacity = 0.9 * (1 - progress);
        
        // 更新卡牌位置
        animatedCard.style.transform = `translate(${currentX - sourceRect.left}px, ${currentY - sourceRect.top}px) scale(${scale})`;
        animatedCard.style.opacity = opacity.toString();
        
        requestAnimationFrame(animate);
      } else {
        // 动画结束，移除元素
        document.body.removeChild(animatedCard);
        document.body.removeChild(label);
      }
    }
    
    requestAnimationFrame(animate);
    
    // 在原始卡牌上添加高亮效果
    cardElement.classList.add('card-highlight');
    setTimeout(() => {
      if (cardElement) {
        cardElement.classList.remove('card-highlight');
      }
    }, 1000);
  };



  useEffect(() => {
    if (cardAnimation.active && cardAnimation.sourceRect && cardAnimation.targetRect) {
      const sourceRect = cardAnimation.sourceRect as DOMRect;
      const targetRect = cardAnimation.targetRect as DOMRect;
      
      // 直接记录这些值以便调试
      console.log("Source position:", sourceRect.left, sourceRect.top);
      console.log("Target position:", targetRect.left, targetRect.top);
      
      document.documentElement.style.setProperty(
        '--source-x', 
        `${sourceRect.left}px`
      );
      document.documentElement.style.setProperty(
        '--source-y', 
        `${sourceRect.top}px`
      );
      document.documentElement.style.setProperty(
        '--target-x', 
        `${targetRect.left + (targetRect.width / 2)}px`
      );
      document.documentElement.style.setProperty(
        '--target-y', 
        `${targetRect.top + (targetRect.height / 2)}px`
      );
    }
  }, [cardAnimation]);
  
  useEffect(() => {
    if (gameState && prevGameState.current) {
      const changes: GemChanges = {};
      
      // 遍历所有玩家
      gameState.players.forEach(player => {
        const prevPlayer = prevGameState.current?.players.find(p => p.id === player.id);
        if (prevPlayer) {
          // 检查宝石和卡牌数量变化
          ['r', 'g', 'u', 'b', 'w', 'x'].forEach(color => {
            const prevGems = prevPlayer.gems[color] || 0;
            const prevCards = Object.values(prevPlayer.cards || {})
              .flat()
              .filter((card: any) => card.color === color).length;
            
            const currGems = player.gems[color] || 0;
            const currCards = Object.values(player.cards || {})
              .flat()
              .filter((card: any) => card.color === color).length;
            
            const prevTotal = prevGems + prevCards;
            const currTotal = currGems + currCards;
            
            if (currTotal !== prevTotal) {
              const diff = currTotal - prevTotal;
              if (diff !== 0) {
                changes[`${player.id}-${color}`] = diff;
              }
            }
          });
        }
      });
      
      if (Object.keys(changes).length > 0) {
        setGemChanges(changes);
        // 2秒后清除动画
        setTimeout(() => {
          setGemChanges({});
        }, 2000);
      }

       const hasFinalRound = gameState.players.some(player => player.score >= 5); // FINAL ROUND CONDITION
        if (hasFinalRound && !isFinalRound) {
          setIsFinalRound(true);
          setShowFinalRoundAnimation(true);
          // 3秒后关闭动画
          setTimeout(() => {
            setShowFinalRoundAnimation(false);
          }, 2000);
        }
    }
    
    
    // 保存当前状态用于下次比较
    prevGameState.current = gameState;
  }, [gameState, isFinalRound]);


  useEffect(() => {
    if (seconds <= 0 || aiActiveRef.current || hintLoading) return; // 添加hintLoading条件
  
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
  
          // 自动结束回合
          if (gameState && gameState.currentPlayerId === currentUser.id) {
            sendMessage({
              type: "END_TURN",
              roomId: gameId,
              sessionId: stableSessionId,
              content: {
                userId: currentUser.id,
                target: ""
              }
            });
          }
  
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    return () => clearInterval(timer);
  }, [seconds, gameState, currentUser.id, gameId, stableSessionId, sendMessage, hintLoading]); // 添加hintLoading依赖
  

  useEffect(() => {
    if (gameState && gameState.currentPlayerId === currentUser.id) {
      setSeconds(59);
      setIsTimeUp(false); 
      setLastHandledPlayerId(null);
      setAiHintProcessedForTurn(false); // 重置AI提示处理状态
    }
  }, [gameState?.currentPlayerId, currentUser.id]);
  
  
  //持久化sessionId
  function getStableSessionId(gameId: string): string {
    if (typeof window === "undefined") return "";
  
    const key = `stable-session-${gameId}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;
  
    const newSessionId = `game-${gameId}-${Date.now()}`;
    localStorage.setItem(key, newSessionId);
    return newSessionId;
  }

  

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
        console.log("游戏状态原始数据:", msg.content);
        console.log("当前玩家索引:", msg.content.currentPlayerIndex);
        console.log("玩家顺序:", msg.content.playerOrder);
        console.log("计算得到的当前玩家ID:", msg.content.playerOrder?.[msg.content.currentPlayerIndex]);        
        // 处理游戏状态更新
        if (cardsData.length > 0 && noblesData.length > 0) {
          try {
            console.log("数据已就绪，处理游戏状态");
            const gameStateData = transformGameState(msg.content, cardsData, noblesData, userMap);
            if (gameStateData) {
              console.log("设置新游戏状态:", gameStateData);
              setGameState(gameStateData);
              setPendingGameState(null); // 清除缓存
            }
          } catch (err) {
            console.error("转换游戏状态失败:", err);
            setPendingGameState(msg.content); // 出错时保留缓存
          }
        } else {
          console.log("🕓 数据未就绪，缓存GAME_STATE");
          setPendingGameState(msg.content);
        }
        break;

      
        
        case "ROOM_STATE":{
          console.log("收到ROOM_STATE消息:", msg);

          const roomContent = msg.content;
          if (roomContent) {
            // 更新房间名
            if (roomContent.roomName || roomContent.name) {
              setRoomName(roomContent.roomName || roomContent.name);
            }

            // 保存玩家名称映射
            if (Array.isArray(roomContent.players)) {
              const userMap: Record<string, { name: string }> = {};
              roomContent.players.forEach((player: PlayerSnapshot) => {
                if (player?.userId && player?.name) {
                  userMap[player.userId] = { name: player.name };
                }
              });
              setUserMap(userMap);
            }
          }
          break;}
        
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
          //setChatMessages(prev => [...prev, chatMsg]);
          
          // 如果聊天窗口没有打开，显示通知
          if (!showChat) {
            setChatNotify(true);
          }
        }
        break;
        
        case "AI_HINT":
          if (msg.content) {
            let parsedContent = msg.content;
        
            // 尝试解析字符串
            if (typeof msg.content === 'string') {
                parsedContent = JSON.parse(msg.content);
            }
        
            const hintText = parsedContent?.hint || parsedContent?.message || JSON.stringify(parsedContent);
            setHintMessage(hintText);
            setHintLoading(false);
            aiActiveRef.current = false;
            setAiHintProcessedForTurn(true);
          }
          break;

        case "GAME_OVER":
          console.log("Game Over data received:", msg.content);
          if (msg.content) {
            let content: GameOverData;
            if (typeof msg.content === 'string') {
              try {
                content = JSON.parse(msg.content);
              } catch (e) {
                console.error("Failed to parse GAME_OVER message:", e);
                return;
              }
            } else {
              content = msg.content as GameOverData;
            }
            
            setGameOverData(content);
            setGameOver(true);
          }
          break;
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
    })
    .catch(error => {
      console.error("加载游戏数据失败:", error);
    });
  }, [pendingGameState]);


  // 监听卡牌和贵族数据加载
  useEffect(() => {
    if (lastGameState && cardsData.length > 0 && noblesData.length > 0) {
      console.log("从全局状态加载游戏数据:", lastGameState);
      try {
        const gameStateData = transformGameState(lastGameState, cardsData, noblesData, userMap);
        if (gameStateData) {
          setGameState(gameStateData);
        }
      } catch (error) {
        console.error("转换游戏状态失败:", error);
      }
    }
  }, [lastGameState, cardsData, noblesData]);


// 添加这个useEffect专门处理pendingGameState
useEffect(() => {
  if (pendingGameState && cardsData.length > 0 && noblesData.length > 0) {
    console.log("数据已就绪，处理缓存的游戏状态");
    try {
      const gameStateData = transformGameState(
        pendingGameState, 
        cardsData, 
        noblesData, 
        userMap
      );
      if (gameStateData) {
        console.log("从缓存设置游戏状态:", gameStateData);
        setGameState(gameStateData);
        setPendingGameState(null);
      }
    } catch (error) {
      console.error("处理缓存游戏状态失败:", error);
    }
  }
}, [pendingGameState, cardsData, noblesData, userMap]);
  
  
const mapFrontendToBackendGemColor = (shortCode: string): string => {
  const reverseMap: Record<string, string> = {
    r: "RED",
    g: "GREEN",
    b: "BLUE",
    u: "BLACK",
    w: "WHITE",
    x: "GOLD"
  };
  return reverseMap[shortCode] || shortCode;
};

//action logic
const handleGemSelect = (color: string) => {

  if (hintLoading) {
    alert("Please wait for the AI advice to complete.");
    return;
  }

  if (selectedGems.includes(color)) {
    setSelectedGems(selectedGems.filter(c => c !== color));
  } else {
    if (selectedGems.length >= 3) return;
    setSelectedGems([...selectedGems, color]);
  }
  console.log("选中颜色:", color, "映射发送为:", mapFrontendToBackendGemColor(color));
};

const handleConfirmGems = () => {

  if (hintLoading) {
    alert("Please wait for the AI advice to complete.");
    return;
  }

  const publicGems = gameState?.gems || {};

  // 玩家选了两个相同颜色的宝石
  if (selectedGems.length === 1) {
    const color = selectedGems[0];
    if (publicGems[color] < 4) {
      alert("Cannot take two gems of the same color: at least 4 gems must be available to do so!");
      return; // 取消发送
    }

    sendAction("take_double", "", { color: mapFrontendToBackendGemColor(color) });
  }

  // 玩家选了三个不同颜色的宝石
  else if (selectedGems.length === 3) {
    const invalid = selectedGems.some(color => publicGems[color] <= 0);
    if (invalid) {
      alert("One or more selected gem colors are unavailable!");
      return;
    }

    const colors = selectedGems.map(mapFrontendToBackendGemColor);
    sendAction("take_three", "", { colors });
  }

  // 其他情况都不合法
  else {
    alert("Invalid selection: choose 3 different or 1 color twice.");
    return;
  }

  // 合法才执行这些
  setCurrentAction(null);
  setSelectedGems([]);
  setSeconds(0); // 倒计时归零
  sendAction("next", "");
};




  // 转换游戏状态函数 - 改进版本
  function transformGameState(data: any, cardsData: any[], noblesData: any[], userMap: Record<string | number, { name: string }>): GameState | null {    console.log("正在转换游戏状态:", data);
    console.log("正在转换游戏状态:", data);
    console.log("当前玩家索引:", data.currentPlayerIndex);
    console.log("玩家顺序:", data.playerOrder);
    console.log("计算的当前玩家ID:", data.playerOrder?.[data.currentPlayerIndex]);

    if (!data) {
      console.warn("收到空的游戏状态数据");
      return null;
    }


      
    // 查找卡牌的辅助函数
    const getCardById = (id: number | string): Card | null => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      const card = cardsData.find(c => c.id === numId);
      if (!card) {
        console.warn(`未找到ID为 ${numId} 的卡牌`);
        return null;
      }

      const mappedColor = mapColorToFrontend(card.color);
      console.log(`卡牌 ${numId}: 后端颜色=${card.color}, 前端颜色=${mappedColor}`);

      return {
        uuid: card.id.toString(),
        level: `level${card.tier}`,
        color: mapColorToFrontend(card.color),
        points: card.points || 0,
        cost: transformCost(card.cost)
      };
    };
    
    const transformCost = (cost: Record<string, number> | undefined): Record<string, number> => {
      if (!cost) return {};
      const result: Record<string, number> = {};
      Object.entries(cost).forEach(([color, count]) => {
        if (count && count > 0) {
          const frontendColor = mapColorToFrontend(color);
          result[frontendColor] = count;
        }
      });
      return result;
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
        points: noble.influence ?? 3,
        requirement: transformCost(noble.cost || {}) // 直接使用原始成本对象
      };
    };
    
    const COLOR_ORDER = ["r", "g", "b", "u", "w", "x"];
    // 转换宝石到前端格式
    const transformGems = (gems: Record<string, number> | undefined): Record<string, number> => {
      const result: Record<string, number> = {};
    
      // 初始化所有颜色为 0，确保有序并不缺项
      COLOR_ORDER.forEach(color => result[color] = 0);
    
      if (gems) {
        Object.entries(gems).forEach(([color, count]) => {
          const frontendColor = mapColorToFrontend(color);
          if (frontendColor in result) {
            result[frontendColor] = count;
          }
        });
      }
    
      return result;
    };
    
    // 构建玩家数据
    const players = (data.playerSnapshots || []).map((player: PlayerSnapshot, index: number) => {

      let playerName = player.name;
      const isDefaultName = typeof playerName === 'string' && playerName.startsWith("Player ");

      const userIdKey = String(player.userId); // 强制转字符串
      const mappedName = userMap[userIdKey]?.name;


       // ✅ 使用提前读取的 userMap
       if (!playerName || isDefaultName) {
        playerName = mappedName || `Player ${index + 1}`;
      }

      if (!playerName) {
        playerName = `Player ${index + 1}`;
      }

      // 如果仍然没有，就用默认
      if (!playerName) {
        playerName = `Player ${index + 1}`;
      }
      // 初始化各个级别的空卡牌集合
      const playerCards: {[level: string]: Card[]} = {
        level1: [],
        level2: [],
        level3: []
      };

      // bonusGems
      const bonusGems = player.bonusGems || {};
      Object.entries(bonusGems).forEach(([color, count]) => {
        const shortColor = mapColorToFrontend(color);
        const level = "level1"; // 假设所有折扣卡显示为level1
        const baseCard: Card = {
          uuid: `bonus-${shortColor}-${index}`, // 确保唯一
          level,
          color: shortColor,
          points: 0,
          cost: {}
        };
        for (let i = 0; i < count; i++) {
          playerCards[level].push({ ...baseCard, uuid: `${baseCard.uuid}-${i}` });
        }
      });



      
      // 获取玩家预留的卡牌
      const reservedCards = (player.reservedCardIds || [])
        .map((id: number) =>  {
          console.log(`📥 玩家 ${player.name || player.userId} 预定卡ID:`, id);
          const found = getCardById(id);
          if (!found) {
            console.warn("⚠️ 未能从 cardsData 找到卡牌，ID =", id);
          } else {
            console.log("✅ 找到预定卡:", found);
          }
          return found;
        }).filter(Boolean) as Card[];
      
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
      winner: null,
      roomName: data.roomName || "Unknown Room",
      currentPlayerId: Number(data.playerOrder?.[data.currentPlayerIndex]) || 0,
    };
    
    // console.log("转换后的游戏状态:", result);
    // console.log("各级别卡牌数量:", {
    //   level1: result.cards.level1.length,
    //   level2: result.cards.level2.length,
    //   level3: result.cards.level3.length
    // });
    
    console.log("转换后的结果 - turn:", result.turn);
    console.log("转换后的结果 - currentPlayerId:", result.currentPlayerId);

    // checkColorFormat(result, 'gameState');
    return result;
  }

  // 检查用户是否有足够资源购买卡牌
  const canAffordCard = (card: Card): boolean => {
    if (!gameState) return false;
    
    // 找到当前玩家
    const currentPlayer = gameState.players.find(p => p.id === currentUser.id);
    if (!currentPlayer) return false;
    
    // 如果不是当前玩家的回合，不允许购买
    if (gameState.currentPlayerId !== currentUser.id) {
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
    const wildcards = currentPlayer.gems["x"] || 0;
    return wildcards >= wildcardsNeeded;
  };

  // 处理卡牌操作的函数
  const handleCardAction = (cardUuid: string, clickedElement: HTMLElement) => {

    if (hintLoading) {
      alert("Please wait for the AI advice to complete.");
      return;
    }

    if (!gameState) return;
  
    // Ensure the player has selected an action
    if (currentAction !== "buy" && currentAction !== "reserve") {
      alert("Please choose an action before interacting with cards.");
      return;
    }
  
    // Find the current player
    const currentPlayer = gameState.players.find(p => p.id === currentUser.id);
    if (!currentPlayer) {
      console.warn("Current player not found.");
      return;
    }
  
    // Try to find the clicked card
    let targetCard: Card | undefined;
  
    // Search visible cards
    for (const level in gameState.cards) {
      const found = gameState.cards[level].find(card => card.uuid === cardUuid);
      if (found) {
        targetCard = found;
        break;
      }
    }
  
    // Search reserved cards if not found
    if (!targetCard) {
      targetCard = currentPlayer.reserved.find(card => card.uuid === cardUuid);
    }
  
    if (!targetCard) {
      console.warn("Card not found:", cardUuid);
      return;
    }
  
    // Action-specific logic
    if (currentAction === "buy") {
      if (canAffordCard(targetCard)) {
        triggerCardAnimation(cardUuid, "buy", currentUser.id, clickedElement);

      setTimeout(() => {
        sendAction("buy", cardUuid);
        setCurrentAction(null); // Auto pass after action
        setSeconds(0); //倒计时归零
        sendAction("next", "");
      }, 1000);

      } else {
        alert("You don't have enough gems to buy this card.");
      }
    } else if (currentAction === "reserve") {
      if (currentPlayer.reserved.length >= 3) {
        alert("You already have 3 reserved cards.");
      } else {
        triggerCardAnimation(cardUuid, "reserve", currentUser.id, clickedElement);

        setTimeout(() => {
          console.log("📤 发送 RESERVE 请求, cardUuid =", cardUuid);
          sendAction("reserve", cardUuid);
          setCurrentAction(null); // Auto pass after action
          setSeconds(0); //倒计时归零
          sendAction("next", ""); 
        }, 1000);
      }
    }
  };
  

  const requestAiHint = () => {
    if (!isPlayerTurn() || hintCount >= 3) return; // 限制使用3次
    
    setHintLoading(true);
    setHintMessage("");
    
    aiActiveRef.current = true; // 标记 AI 开始
    setSeconds(0); // 停止倒计时

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
        target = mapFrontendToBackendGemColor(target);
        break;
      case "chat":
        messageType = "PLAYER_MESSAGE";
        break;
      case "next":
        messageType = "END_TURN";
        break;
      case "take_three":
        messageType = "TAKE_THREE_GEMS";
        break;
      case "take_double":
        messageType = "TAKE_DOUBLE_GEM";
        break;
      default:
        messageType = action.toUpperCase();
    }
    
    sendMessage({
      type: messageType,
      roomId: gameId,
      sessionId: stableSessionId,
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

  const isPlayerTurn = useCallback((): boolean => {
    if (!gameState) return false;
    
    // 避免不必要的多次调用
    const result = gameState.currentPlayerId === currentUser.id;
    return result;
  }, [gameState, currentUser.id]);

  
  const GameOverModal = () => {
    if (!gameOver || !gameOverData) return null;
    
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
      }}>
        <div style={{
          width: "80%",
          maxWidth: "600px",
          backgroundColor: "rgba(20, 20, 40, 0.95)",
          borderRadius: "10px",
          border: "3px solid gold",
          boxShadow: "0 0 30px rgba(255, 215, 0, 0.7)",
          padding: "20px",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h2 style={{
            fontSize: "36px",
            textAlign: "center",
            margin: "10px 0 20px 0",
            color: "gold",
            textShadow: "0 0 10px rgba(255, 215, 0, 0.7)"
          }}>Game Over</h2>
          
          <div style={{
            width: "100%",
            margin: "10px 0 20px 0"
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0 8px"
            }}>
              <thead>
                <tr style={{
                  height: "40px",
                  fontSize: "18px",
                  color: "#FFD700"
                }}>
                  <th style={{ textAlign: "center", width: "10%" }}>#</th>
                  <th style={{ textAlign: "left", width: "20%" }}>Avatar</th>
                  <th style={{ textAlign: "left", width: "40%" }}>Player</th>
                  <th style={{ textAlign: "center", width: "30%" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {gameOverData.players
                  .sort((a, b) => b.victoryPoints - a.victoryPoints)
                  .map((player, index) => {
                    const isWinner = player.userId === gameOverData.winnerId;
                    return (
                      <tr key={player.userId} style={{
                        height: "60px",
                        backgroundColor: isWinner ? "rgba(255, 215, 0, 0.2)" : "rgba(30, 30, 60, 0.7)",
                        border: isWinner ? "2px solid gold" : "1px solid #444",
                        borderRadius: "8px",
                        transform: isWinner ? "scale(1.05)" : "scale(1)",
                        transition: "all 0.3s ease"
                      }}>
                        <td style={{ 
                          textAlign: "center", 
                          fontWeight: "bold",
                          color: isWinner ? "gold" : "white"
                        }}>
                          {index + 1}
                        </td>
                        <td style={{ 
                          textAlign: "center",
                          padding: "5px"
                        }}>
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: isWinner ? "gold" : "#666",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                            overflow: "hidden"
                          }}>
                            {player.avatar ? (
                              <img 
                                src={`/avatar/${player.avatar}`} 
                                alt={player.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover"
                                }}
                              />
                            ) : (
                              <div style={{
                                fontSize: "20px",
                                fontWeight: "bold",
                                color: "#333"
                              }}>
                                {player.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ 
                          fontWeight: isWinner ? "bold" : "normal",
                          color: isWinner ? "gold" : "white",
                          fontSize: isWinner ? "18px" : "16px"
                        }}>
                          {player.name}
                          {isWinner && (
                            <span style={{ marginLeft: "10px" }}>👑</span>
                          )}
                        </td>
                        <td style={{ 
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: isWinner ? "24px" : "20px",
                          color: isWinner ? "gold" : "white"
                        }}>
                          {player.victoryPoints}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          
          <div style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "15px"
          }}>
            <button
              onClick={() => {
                if (webSocketService?.isConnected()) {
                  console.log("Closing WebSocket before navigating back to lobby...");
                  webSocketService.disconnect();
                }
                globalThis.location.href = "/lobby"}
              }
              style={{
                padding: "10px 20px",
                backgroundColor: "rgba(100, 100, 200, 0.8)",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Back to Lobby
            </button>
            
            <button
              onClick={() => setGameOver(false)}
              style={{
                padding: "10px 20px",
                backgroundColor: "rgba(100, 200, 100, 0.8)",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              View Board
            </button>
          </div>
        </div>
      </div>
    );
  };

  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const QuitConfirmModal = () => {
    if (!showQuitConfirm) return null;
    
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
      }}>
        <div style={{
          width: "60%",
          maxWidth: "400px",
          backgroundColor: "rgba(20, 20, 40, 0.95)",
          borderRadius: "10px",
          border: "3px solid #cc0000",
          boxShadow: "0 0 30px rgba(255, 0, 0, 0.7)",
          padding: "20px",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h2 style={{
            fontSize: "24px",
            textAlign: "center",
            margin: "10px 0 20px 0",
            color: "white"
          }}>Quit Game</h2>
          
          <p style={{
            textAlign: "center",
            margin: "0 0 20px 0",
            fontSize: "18px"
          }}>
            Are you sure you want to quit the game and return to lobby?
          </p>
          
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px"
          }}>
            <button
              onClick={() => {
                if (webSocketService?.isConnected()) {
                  console.log("退出游戏前关闭WebSocket连接...");
                  webSocketService.disconnect();
                }
                globalThis.location.href = "/lobby";
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#cc0000",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Quit to Lobby
            </button>
            
            <button
              onClick={() => setShowQuitConfirm(false)}
              style={{
                padding: "10px 20px",
                backgroundColor: "rgba(100, 100, 200, 0.8)",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Back to Game
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveGameWrapper>
    
    <div id="game-board" style={{
      // background: GAME_BACKGROUND,
      background: 'transparent',
      backgroundSize: "cover",
      backgroundPosition: "center center",
      minHeight: "100vh",
      width: "100%",
      padding: "0", // 移除内边距
      margin: "0", // 移除外边距
      border: "none", // 移除边框
      outline: "none", // 移除轮廓
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>

    {gameOverData && !gameOver && (
      <button 
        onClick={() => setGameOver(true)}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1001,
          backgroundColor: "gold",
          color: "#000",
          border: "2px solid #fff",
          padding: "8px 12px",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Show Result
      </button>
    )}

      {/* Quit Game Button */}
      <button 
        onClick={() => setShowQuitConfirm(true)}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 1001,
          backgroundColor: "#cc0000",
          color: "white",
          fontWeight: "bold",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "2px solid white",
          cursor: "pointer",
          boxShadow: "0 0 10px rgba(255, 0, 0, 0.5)",
          transition: "all 0.2s ease"
        }}
      >
        Quit Game
      </button>

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
          Room: {gameState?.roomName || roomName}
          {isFinalRound && (
            <div className="final-round-indicator">
              FINAL ROUND
            </div>
          )}
        </div>
      </div>

      {/* Main game layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto auto", // 左侧自适应，右侧固定800px宽度
        width: "100%",
        maxWidth: "2000px",
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
                  </div>
                </div>
              
                {/* 翻开的卡牌 */}
                <div className={`c_${level} face-up-cards`}>
                  <div className="cards-inner flex-nowrap overflow-x-auto">
                    {gameState?.cards?.[level]?.map((card) => (
                      <div
                        key={card.uuid}
                        data-card-id={card.uuid}
                        className={`card card-${card.color} card-${card.level}`}
                        onClick={(e) => handleCardAction(card.uuid, e.currentTarget)}
                      >
                        <div
                          className={`reserve ${isPlayerTurn() ? 'active' : 'inactive'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPlayerTurn()) {
                              handleCardAction(card.uuid, e.currentTarget);
                            }
                          }}
                        >
                        </div>
                        <div className={`overlay ${canAffordCard(card) ? 'affordable' : 'not-affordable'}`}></div>
                        <div className="underlay"></div>
                        
                        <div className="header">
                          <div className={`color ${card.color}gem`}></div> 
                          <div className="points">{card.points > 0 ? card.points : ""}</div>
                        </div>

                        <div className="costs">
                          {Object.entries(card.cost).map(([costColor, count]) =>
                            count > 0 ? (
                              <div key={costColor} className={`cost ${costColor}`}>
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
              COLOR_ORDER.map((color) => {
                const count = gameState.gems[color] || 0;
                const chipClass = `${color}chip`; // 直接使用 class 名称，无需 if 判断

                return (
                  <div
                    key={color}
                    className={`gem ${chipClass} ${isPlayerTurn() ? 'active' : 'inactive'}`}
                    onClick={() => {
                      if (!isPlayerTurn()) return;

                      if (currentAction !== "take") {
                        alert("Please choose 'Take Gems' first.");
                        return;
                      }

                      handleGemSelect(color);
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
              })
            }

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
              return (
                <div key={player.uuid} data-player-id={player.id} className="player" style={{
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
                    marginBottom: "5px",
                    fontSize: "0.95em",
                    fontWeight: player.id === currentUser.id ? "bold" : "normal",
                    color: player.id === currentUser.id ? "#90ee90" : "white", // 当前用户绿色
                    animation: gameState.currentPlayerId === player.id ? "pulse 2s infinite" : "none"
                  }}>
                    <span>
                      {gameState.currentPlayerId === player.id && "Current Player: "}
                      {player.id === currentUser.id ? "You" : player.name}
                    </span>
                    <span>Score: {player.score}</span>
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
                    justifyContent: "space-between", // 改为space-between更合理的分布
                    gap: "2px", // 减小间距
                    marginBottom: "10px",
                    width: "100%",
                    minWidth: "100%", // 确保最小宽度
                    overflow: "visible" // 改为visible，让内容不被裁剪
                  }}>
                    {['r', 'g', 'u', 'b', 'w', 'x'].map((color) => {
                      const count = player.gems[color] || 0;

                      const cardCount = Object.values(player.cards || {})
                        .flat()
                        .filter((card) => card.color === color).length;

                      const totalCount = count + cardCount;


                      const chipColor = color === 'r' ? 'red' :
                                        color === 'g' ? 'green' :
                                        color === 'b' ? 'blue' :
                                        color === 'u' ? 'black' :
                                        color === 'w' ? 'white' :
                                        color === 'x' ? 'gold' : 'black';

                      return (
                        <div key={color} className="statSet" style={{ 
                          margin: "0",
                          minWidth: "45px",
                          textAlign: "center",
                          flexShrink: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center"
                        }}>
                          {/* 添加总数大数字显示 */}
                          <div style={{
                            fontSize: "24px", // 更大的字体
                            fontWeight: "bold",
                            marginBottom: "2px",
                            position: "relative",
                            color: color === 'r' ? '#ff3333' : // 红色
                                  color === 'g' ? '#33cc33' : // 绿色
                                  color === 'b' ? '#3333ff' : // 蓝色
                                  color === 'u' ? '#333333' : // 黑色
                                  color === 'w' ? '#ffffff' : // 白色
                                  color === 'x' ? '#ffcc00' : // 金色
                                  'white',
                            textShadow: color === 'w' ? '1px 1px 2px #000' : 'none',
                            fontFamily: "'Arial Black', Gadget, sans-serif" // 更改字体
                          }}>
                            {totalCount}

                            {/* 变化动画 */}
                              {gemChanges[`${player.id}-${color}`] && (
                                <div
                                  className="gem-change-indicator"
                                  style={{
                                    position: "absolute",
                                    top: "-20px",
                                    right: "-15px",
                                    color: gemChanges[`${player.id}-${color}`] > 0 ? '#33cc33' : '#ff3333',
                                    fontSize: "18px",
                                    fontWeight: "bold",
                                    opacity: 1,
                                    animation: "fadeUpAndOut 2s forwards"
                                  }}
                                >
                                  {gemChanges[`${player.id}-${color}`] > 0 ? 
                                    `+${gemChanges[`${player.id}-${color}`]}` : 
                                    gemChanges[`${player.id}-${color}`]}
                                </div>
                              )}

                          </div>

                          <div className="stat" style={{ 
                            fontSize: "0.8em", 
                            padding: "2px 4px"
                          }}>{count} + {cardCount}</div>
                          <div className={`chip chip-${chipColor}`} style={{
                            width: "30px",
                            height: "30px"
                          }} />
                        </div>
                      );
                    })}

                  </div>
  
                  {/* Reserved Cards */}
                  <div className="reserveCards">
                    {[0, 1, 2].map((i) => {
                      const card = player.reserved?.[i];

                      if (card) {
                        const shortColor = card.color && card.color.length === 1 
                          ? card.color 
                          : mapColorToFrontend(card.color);

                        return (
                          <div
                            key={card.uuid}
                            className={`card card-${shortColor} card-${card.level}`} // 移除 card-${i}，保持与主区域一致
                            onClick={(e) => {
                              if (player.id === currentUser.id && isPlayerTurn()) {
                                handleCardAction(card.uuid, e.currentTarget);
                              }
                            }}
                          >
                            <div className="header">
                              <div className={`color ${shortColor}gem`}></div>
                              <div className="points">{card.points}</div>
                            </div>
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
                              aspectRatio: "0.8",
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
          <div id="ai-hint-content" style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "5px",
            padding: "10px",
            marginBottom: "10px",
            minHeight: "80px",
            width: "100%",
            fontSize: "20px",
            fontWeight: "bold",
            color: "#FFD700",
            border: "2px solid #FFD700",
            boxShadow: "0 0 20px rgba(255, 215, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center"
          }}>
            {hintMessage ? (
              <div style={{
                backgroundColor: "#cc0000",
                color: "white",
                fontWeight: "bold",
                padding: "6px 10px",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 0 8px rgba(255, 0, 0, 0.5)",
                transition: "all 0.2s ease"
              }}>{hintMessage}</div>
            ) : (
              <div style={{ opacity: 0.7 }}>
                Click the button below for AI strategy advice
              </div>
            )}
          </div>


         {/* 主按钮 & 取消按钮区域 */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              justifyContent: "flex-start",
              marginTop: "6px",
              paddingLeft: "15px"
            }}
          >
            {hintLoading ? (
              <>
                <button
                  disabled
                  style={{
                    padding: "8px 24px",
                    fontWeight: "bold",
                    fontSize: "18px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "rgba(0, 100, 255, 0.9)", // 蓝色
                    color: "white",
                    boxShadow: "0 0 10px rgba(0, 100, 255, 0.6)",
                  }}
                >
                  Thinking...
                </button>

                <button
                  onClick={() => {
                    setHintLoading(false);
                    setHintMessage("AI request canceled.");
                  }}
                  style={{
                    padding: "8px 24px",
                    fontWeight: "bold",
                    fontSize: "18px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "crimson", // 红色
                    color: "white",
                    boxShadow: "0 0 10px rgba(255, 0, 0, 0.6)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={requestAiHint}
                disabled={!isPlayerTurn()}
                style={{
                  padding: "8px 24px",
                  fontWeight: "bold",
                  fontSize: "18px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: isPlayerTurn()
                    ? "rgba(0, 100, 255, 0.9)"
                    : "rgba(100, 100, 100, 0.5)",
                  color: "white",
                  cursor: isPlayerTurn() ? "pointer" : "not-allowed",
                  boxShadow: isPlayerTurn()
                    ? "0 0 10px rgba(0, 100, 255, 0.6)"
                    : "none",
                  transition: "all 0.2s ease"
                }}
              >
                Get AI Advice {hintCount > 0 ? `(${hintCount}/3 used)` : ""}
              </button>
            )}
          </div>





          {isPlayerTurn() && (
            <div style={{
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              {currentAction === null ? (
                <>
                  <div style={{ fontSize: "18px", marginBottom: "10px", color: "#FFD700" }}>
                    Please take your action:
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
                    <button onClick={() => setCurrentAction("take")} style={buttonStyle}>Take Gems</button>
                    <button onClick={() => setCurrentAction("buy")} style={buttonStyle}>Buy Card</button>
                    <button onClick={() => setCurrentAction("reserve")} style={buttonStyle}>Reserve Card</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: "10px", color: "#80ffcc" }}>
                    You selected: <strong>{currentAction.toUpperCase()}</strong>
                  </div>
                  <button onClick={() => {
                    setCurrentAction(null);
                    setSelectedGems([]);
                  }} style={{
                    ...buttonStyle,
                    backgroundColor: "#cc3333"
                  }}>Back</button>
                </>
              )}
            </div>
          )}

            {currentAction === "take" && (
              <div style={{
                marginTop: "10px",
                textAlign: "center"
              }}>
                <div style={{ color: "#fff", marginBottom: "5px" }}>
                  Select gems: 3 different or 2 of the same
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  flexWrap: "wrap"
                }}>
                  {["r", "g", "b", "u", "w"].map(color => (
                    <div
                      key={color}
                      className={`${color}chip gem ${selectedGems.includes(color) ? "selected" : ""}`}
                      onClick={() => handleGemSelect(color)}
                      style={{
                        width: "76px",
                        height: "76px",
                        border: selectedGems.includes(color)
                          ? "3px solid yellow"
                          : "1px solid #aaa",
                        borderRadius: "50%",
                        cursor: "pointer"
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: "10px" }}>
                  <button
                    onClick={handleConfirmGems}
                    style={{ ...buttonStyle, backgroundColor: "#22bb55" }}
                  >
                    Confirm Gems
                  </button>
                </div>
              </div>
            )}



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
                {getTimerDisplay()}
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
              if (hintLoading) {
                alert("Please wait for the AI advice to complete.");
                return;
              }
              if (isPlayerTurn()) {
                setSeconds(0); //倒计时归零
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
          color: "black",
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
      {gameOver && <GameOverModal />}
      {<QuitConfirmModal />}

      {/* 卡牌移动动画*/}
      {cardAnimation.active && cardAnimation.sourceRect && cardAnimation.targetRect && (
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1000
        }}
      >
        {/* 卡牌动画元素 */}
        <div
          className={cardAnimation.cardClasses || "card card-animate"}
          style={{
            position: "fixed", // 改为fixed
            left: `${(cardAnimation.sourceRect as DOMRect).left}px`,
            top: `${(cardAnimation.sourceRect as DOMRect).top}px`,
            width: `${(cardAnimation.sourceRect as DOMRect).width}px`,
            height: `${(cardAnimation.sourceRect as DOMRect).height}px`,
            boxShadow: "0 0 15px rgba(255, 215, 0, 0.8)",
            animation: "moveCard 1s forwards",
            zIndex: 1400 // 确保在标签下方但在其他内容上方
          }}
        />
        
        {/* 单独的标签元素 - 固定在原始卡牌位置 */}
        <div className="action-label" style={{
          position: "fixed", 
          top: `${window.scrollY + (cardAnimation.sourceRect as DOMRect).top - 30}px`,
          left: `${window.scrollX + (cardAnimation.sourceRect as DOMRect).left + ((cardAnimation.sourceRect as DOMRect).width / 2)}px`,
          transform: "translateX(-50%)",
          backgroundColor: cardAnimation.type === "buy" ? "#22cc22" : "#ff9900",
          color: "white",
          padding: "3px 10px",
          borderRadius: "5px",
          fontWeight: "bold",
          fontSize: "16px",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
          zIndex: 1500,
          animation: "pulse 0.5s infinite alternate",
          pointerEvents: "none"
        }}>
          {cardAnimation.type === "buy" ? "BUY!" : "RESERVE!"}
        </div>
      </div>
    )}


      {/* 最终回合动画 */}
      {showFinalRoundAnimation && (
        <div className="final-round-overlay">
          <div className="final-round-animation">
            FINAL ROUND!
          </div>
        </div>
      )}

    </div>


    </ResponsiveGameWrapper>
  )}