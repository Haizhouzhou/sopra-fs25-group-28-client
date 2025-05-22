/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// deno-lint-ignore-file no-explicit-any no-unused-vars
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from 'next/navigation';
import { useWebSocket, WebSocketMessage } from "@/hooks/useWebSocket"; 
import { useGameState } from '@/hooks/useGameStateContext';
import ResponsiveGameWrapper from "components/ui/ResponsiveGameWrapper";

import ReactDOM from 'react-dom';






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
  isInThisGame?: boolean;
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
  visibleNobleIds?: number[]; // 添加这一行

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
  isInThisGame?: boolean; 
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
  const [hintCount, setHintCount] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`ai-hint-count-${gameId}`);
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  });

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

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sounds, setSounds] = useState<{[key: string]: HTMLAudioElement | null}>({
    buyCard: null,
    takeGem: null,
    reserveCard: null,
    nobleVisit: null,
    gameOver: null,
    passturn: null,
    AIhint:null,
  });


  const [showNobleVisitAnimation, setShowNobleVisitAnimation] = useState(false);
  const [lastNobleCount, setLastNobleCount] = useState(0);

  const [isPageRefreshed, setIsPageRefreshed] = useState(false);
  
  const requestGameState = useCallback(() => {
    if (!wsConnected || !stableSessionId || !gameId) return;
    
    // 清除之前的请求超时
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }
    
    // 设置新的超时
    requestTimeoutRef.current = setTimeout(() => {
      console.log("Recover game...");
      sendMessage({
        type: "GET_GAME_STATE",
        roomId: gameId,
        sessionId: stableSessionId,
        content: {
          userId: currentUser.id
        }
      });
      requestTimeoutRef.current = null;
    }, 300); // 300ms 防抖
  }, [wsConnected, stableSessionId, gameId, sendMessage, currentUser.id]);

  const refreshRequestSent = useRef(false);
  
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    // 正常计时显示
    return `Timer: ${seconds}s`;
  };


  // 计算玩家当前拥有的宝石总数
  const countPlayerGems = (player: Player | undefined) => {
    if (!player || !player.gems) return 0;
    
    return Object.values(player.gems).reduce((total, count) => total + count, 0);
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

  const sendLeaveRoomMessage = useCallback(() => {
  if (wsConnected && gameId) {
    console.log("Leaving Room...");
    sendMessage({
      type: "LEAVE_ROOM",
      roomId: gameId,
      sessionId: stableSessionId,
      content: {
        userId: currentUser.id
      }
    });
    
    // 短暂延迟后关闭连接，确保消息能发送出去
    setTimeout(() => {
      if (webSocketService?.isConnected()) {
        console.log("Close WebSocket Connection...");
        webSocketService.disconnect();
      }
    }, 200);
  } else {
    // 如果连接已断开，直接进行下一步
    if (webSocketService?.isConnected()) {
      webSocketService.disconnect();
    }
  }
}, [wsConnected, gameId, stableSessionId, sendMessage, currentUser.id, webSocketService]);


  // 添加这个 useEffect 在组件的顶层
  useEffect(() => {
    return () => {
      // 清理所有超时
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, []);

  // useEffect用于检测页面刷新
  useEffect(() => {
    // 检测是否是页面刷新
    const wasRefreshed = () => {
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      
      if (navEntries.length > 0 && navEntries[0].type === "reload") {
        return true;
      }
      
      // 兼容性检查，如果performance API不可用
      if (!navEntries.length && document.referrer.includes(window.location.host)) {
        return true;
      }
      
      return false;
    };
    
    if (wasRefreshed() && wsConnected && !refreshRequestSent.current) {
      refreshRequestSent.current = true;
      setTimeout(() => {
        requestGameState();
      }, 500);
    }
  }, [wsConnected, requestGameState]);


  useEffect(() => {
    if (cardAnimation.active && cardAnimation.sourceRect && cardAnimation.targetRect) {
      const sourceRect = cardAnimation.sourceRect as DOMRect;
      const targetRect = cardAnimation.targetRect as DOMRect;
      
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

    const hasFinalRound = gameState.players.some(player => player.score >= 15); // FINAL ROUND CONDITION
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
    if (seconds <= 0 || aiActiveRef.current) return; // 添加hintLoading条件
  
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
  }, [seconds, gameState, currentUser.id, gameId, stableSessionId, sendMessage]); // 添加hintLoading依赖
  

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
    console.log("Receive state:", msg.type, "Content:", msg.content);
    if (msg.type === "GAME_STATE" && typeof msg.content === 'object') {
    // 获取当前贵族ID数量
    const visibleNobleIds = msg.content.visibleNobleIds || [];
    const currentNobleCount = visibleNobleIds.length;
    // 检测贵族数量是否减少
    if (lastNobleCount > 0 && currentNobleCount < lastNobleCount) {
      // 触发动画
      setShowNobleVisitAnimation(true);
      playSound('nobleVisit');
      // 2秒后关闭动画
      window.setTimeout(() => {
        setShowNobleVisitAnimation(false);
      }, 2000);
    }
    // 更新贵族数量
    setLastNobleCount(currentNobleCount);
  }


    if (msg.content) {
      // 如果内容是字符串，尝试解析为JSON
      if (typeof msg.content === 'string') {
        try {
          const parsedContent = JSON.parse(msg.content);          
          // 检查解析后的内容中是否有房间名称
          if (parsedContent.roomName) {
            setRoomName(parsedContent.roomName);
          }
          
          msg.content = parsedContent;
        } catch (e) {
        }
      }
      // 如果已经是对象
      else if (typeof msg.content === 'object') {
        // 检查对象中是否有房间名称
        if (msg.content.roomName) {
          setRoomName(msg.content.roomName);
        }
      }
    }

    switch (msg.type) {
      case "GAME_STATE":
        // console.log("游戏状态原始数据:", msg.content);
        // console.log("当前玩家索引:", msg.content.currentPlayerIndex);
        // console.log("玩家顺序:", msg.content.playerOrder);
        // console.log("计算得到的当前玩家ID:", msg.content.playerOrder?.[msg.content.currentPlayerIndex]);        
        // 处理游戏状态更新
        if (cardsData.length > 0 && noblesData.length > 0) {
          try {
            const gameStateData = transformGameState(msg.content, cardsData, noblesData, userMap);
            if (gameStateData) {
              // console.log("设置新游戏状态:", gameStateData);

              // 检查是否是页面刷新后收到的第一个状态更新
              if (isPageRefreshed && gameStateData.currentPlayerId === currentUser.id) {
                setAiHintProcessedForTurn(true); // 使其显示"Choose Action"
                setSeconds(30); // 设置合理的倒计时时间
                setIsPageRefreshed(false); // 重置页面刷新标记
              }

              setGameState(gameStateData);
              setPendingGameState(null); // 清除缓存
              refreshRequestSent.current = true; // 标记已收到游戏状态，不再请求
            }
          } catch (err) {
            setPendingGameState(msg.content); // 出错时保留缓存
          }
        } else {
          setPendingGameState(msg.content);
        }
        break;

      
        
        case "ROOM_STATE":{
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
            playSound('gameOver');

          }
          break;
    }
  }


  // 在连接成功后发送加入房间消息
  useEffect(() => {
    if (wsConnected && !hasJoinedRef.current) {
      sendMessage({
        type: "JOIN_ROOM",
        roomId: gameId
      });
      hasJoinedRef.current = true; // 确保只发一次
      
      // 检测是否是页面刷新 - 避开TypeScript错误
      const wasRefreshed = () => {
        try {
          // 使用any类型避开TypeScript检查
          const entries = performance.getEntriesByType("navigation") as any[];
          return entries.length > 0 && entries[0].type === "reload";
        } catch (e) {
          // 如果上面的方法不可用，返回false
          return false;
        }
      };
      
      // 如果是页面刷新，请求游戏状态
      if (wasRefreshed() && !refreshRequestSent.current) {
        refreshRequestSent.current = true;
        // 延迟请求，确保加入房间处理完成
        setTimeout(() => requestGameState(), 1000);
      }
    }
  }, [wsConnected, gameId, sendMessage, requestGameState]);

  
  // 加载卡牌和贵族数据
  useEffect(() => {    
    // 使用绝对路径
    Promise.all([
      fetch('/cards.json').then(response => {
        if (!response.ok) {
          throw new Error(`加载卡牌数据失败: ${response.status}`);
        }
        return response.json();
      }),
      fetch('/noblemen.json').then(response => {
        if (!response.ok) {
          throw new Error(`加载贵族数据失败: ${response.status}`);
        }
        return response.json();
      })
    ])
    .then(([cards, nobles]) => {
      setCardsData(cards);
      setNoblesData(nobles);
    })
    .catch(error => {
    });
  }, [pendingGameState]);


  // 监听卡牌和贵族数据加载
  useEffect(() => {
    if (lastGameState && cardsData.length > 0 && noblesData.length > 0) {
      try {
        const gameStateData = transformGameState(lastGameState, cardsData, noblesData, userMap);
        if (gameStateData) {
          setGameState(gameStateData);
        }
      } catch (error) {
      }
    }
  }, [lastGameState, cardsData, noblesData]);


// 添加这个useEffect专门处理pendingGameState
useEffect(() => {
  if (pendingGameState && cardsData.length > 0 && noblesData.length > 0) {
    try {
      const gameStateData = transformGameState(
        pendingGameState, 
        cardsData, 
        noblesData, 
        userMap
      );
      if (gameStateData) {
        setGameState(gameStateData);
        setPendingGameState(null);
      }
    } catch (error) {
      console.error("fail:", error);
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

  // 获取当前玩家
  const currentPlayer = gameState?.players.find(p => p.id === currentUser.id);
  if (!currentPlayer) return;
  
  // 计算当前宝石总数
  const currentGemCount = countPlayerGems(currentPlayer);
  
  if (selectedGems.includes(color)) {
    // 如果已选择，取消选择这个颜色
    setSelectedGems(selectedGems.filter(c => c !== color));
  } else {
    // 如果选择3个不同颜色
    if (selectedGems.length < 3 && !selectedGems.includes(color)) {
      // 检查添加后是否会超过10个
      if (currentGemCount + (selectedGems.length + 1) > 10) {
        alert("The total number of gems will be more than 10 when taken! Please use some gems first.");
        return;
      }
      setSelectedGems([...selectedGems, color]);
    }
    // 如果选择2个相同颜色，实际上这种情况在handleConfirmGems中处理
  }
  // console.log("选中颜色:", color, "映射发送为:", mapFrontendToBackendGemColor(color));
};

const handleConfirmGems = () => {
  if (hintLoading) {
    alert("Please wait for the AI advice to complete.");
    return;
  }

  const publicGems = gameState?.gems || {};
  
  // 获取当前玩家
  const currentPlayer = gameState?.players.find(p => p.id === currentUser.id);
  if (!currentPlayer) return;
  
  // 计算当前宝石总数
  const currentGemCount = countPlayerGems(currentPlayer);

  // 定义动画函数
  const animateSelectedGems = () => {
    selectedGems.forEach(color => {
      const gemElements = document.querySelectorAll(`.${color}chip.gem`);
      gemElements.forEach(element => {
        element.classList.add('gem-confirm-animation');
        setTimeout(() => {
          element.classList.remove('gem-confirm-animation');
        }, 1000);
      });
    });
  };

  // 玩家选了一个颜色的宝石(双倍)
  if (selectedGems.length === 1) {
    const color = selectedGems[0];
    
    // 检查公共区域是否有足够的宝石
    if (publicGems[color] < 4) {
      alert("Cannot take two gems of the same color: at least 4 gems must be available to do so!");
      return;
    }
    
    // 检查拿取后是否会超过10个
    if (currentGemCount + 2 > 10) {
      alert("The total number of gems will be more than 10 when taken! Please use some gems first.");
      return;
    }

    // 先执行动画
    animateSelectedGems();
    // 播放拾取宝石音效
    playSound('takeGem');
    
    // 然后发送请求
    setTimeout(() => {
      sendAction("take_double", "", { color: mapFrontendToBackendGemColor(color) });
      
      // 在请求成功回调中执行下面的操作
      // 设置状态
      setCurrentAction(null);
      setSelectedGems([]);
      
      // 等待前一个请求完成后再结束回合
      setTimeout(() => {
        sendAction("next", "");
      }, 300);
    }, 300);
  }
  
  // 玩家选了三个不同颜色的宝石
  else if (selectedGems.length === 3) {
    // 检查公共区域是否有足够的宝石
    const invalid = selectedGems.some(color => publicGems[color] <= 0);
    if (invalid) {
      alert("One or more selected gem colors are unavailable!");
      return;
    }
    
    // 检查拿取后是否会超过10个
    if (currentGemCount + 3 > 10) {
      alert("The total number of gems will be more than 10 when taken! Please use some gems first.");
      return;
    }

    // 先执行动画
    animateSelectedGems();
    // 播放拾取宝石音效 
    playSound('takeGem');
    
    // 然后发送请求
    setTimeout(() => {
      const colors = selectedGems.map(mapFrontendToBackendGemColor);
      sendAction("take_three", "", { colors });
      
      // 设置状态
      setCurrentAction(null);
      setSelectedGems([]);
      
      // 等待前一个请求完成后再结束回合
      setTimeout(() => {
        sendAction("next", "");
      }, 300);
    }, 300);
  }

  // 其他情况都不合法
  else {
    alert("Invalid selection: choose 3 different or 1 color twice.");
    return;
  }
};



  // 转换游戏状态函数 - 改进版本
  function transformGameState(data: any, cardsData: any[], noblesData: any[], userMap: Record<string | number, { name: string }>): GameState | null {

    if (!data) {
      return null;
    }


      
    // 查找卡牌的辅助函数
    const getCardById = (id: number | string): Card | null => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      const card = cardsData.find(c => c.id === numId);
      if (!card) {
        return null;
      }

      const mappedColor = mapColorToFrontend(card.color);

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
          const found = getCardById(id);
          if (!found) {
          } else {
            console.log("找到预定卡:", found);
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
        reserved: reservedCards,
        isInThisGame: player.isInThisGame !== false
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
        level1: data.level1CardDeckSize !== undefined ? data.level1CardDeckSize : 0,
        level2: data.level2CardDeckSize !== undefined ? data.level2CardDeckSize : 0,
        level3: data.level3CardDeckSize !== undefined ? data.level3CardDeckSize : 0
      },
      turn: data.currentPlayerIndex || 0,
      log: [],
      winner: null,
      roomName: data.roomName || "Unknown Room",
      currentPlayerId: Number(data.playerOrder?.[data.currentPlayerIndex]) || 0,
    };
    

    return result;
  }

  // 计算所需宝石
const calculateMissingGems = (card: Card): { [color: string]: number } => {
  if (!gameState) return {};
  
  // 找到当前玩家
  const currentPlayer = gameState.players.find(p => p.id === currentUser.id);
  if (!currentPlayer) return {};
  
  // 计算玩家拥有的实际资源(宝石 + 卡牌折扣)
  const playerCards = Object.values(currentPlayer.cards).flat();
  
  // 统计玩家拥有的各颜色卡牌数量（这些可以作为对应颜色的折扣）
  const discounts: { [color: string]: number } = {};
  
  // 初始化所有颜色的折扣为0
  ["r", "g", "b", "u", "w"].forEach(color => {
    discounts[color] = playerCards.filter(c => c.color === color).length;
  });
  
  // 计算缺少的宝石
  const missingGems: { [color: string]: number } = {};
  
  Object.entries(card.cost).forEach(([color, count]) => {
    // 计算需要的宝石 = 卡牌花费 - 已有的同色卡牌折扣 - 已有的宝石
    const discount = discounts[color] || 0;
    const available = currentPlayer.gems[color] || 0;
    const required = Math.max(0, count - discount);
    const missing = Math.max(0, required - available);
    
    if (missing > 0) {
      missingGems[color] = missing;
    }
  });
  
  // 计算通配符缺口
  const totalMissing = Object.values(missingGems).reduce((sum, val) => sum + val, 0);
  const wildcards = currentPlayer.gems["x"] || 0;
  if (totalMissing > wildcards) {
    missingGems["total"] = totalMissing - wildcards;
  }
  
  return missingGems;
};


const [tooltipInfo, setTooltipInfo] = useState<{
  show: boolean;
  card: Card | null;
  mousePosition: { x: number; y: number }; // 新增鼠标位置
  missing: { [color: string]: number };
}>({
  show: false,
  card: null,
  mousePosition: { x: 0, y: 0 }, // 初始鼠标位置
  missing: {}
});

// 鼠标移动监听
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => { // 添加明确的类型注解
    if (tooltipInfo.show) {
      // 更新提示框位置为鼠标位置
      setTooltipInfo(prev => ({
        ...prev,
        mousePosition: { x: e.clientX + 20, y: e.clientY - 10 } // 偏移一点点，不要正好在鼠标下
      }));
    }
  };
  
  window.addEventListener('mousemove', handleMouseMove);
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, [tooltipInfo.show]);

// 加载音效
useEffect(() => {
  if (typeof window !== "undefined") {
    setSounds({
      buyCard: new Audio('/gamesource/Sound_effect/Buy_Card.mp3'),
      takeGem: new Audio('/gamesource/Sound_effect/Take_Gem2.mp3'),
      reserveCard: new Audio('/gamesource/Sound_effect/Reserve_Card.mp3'),
      nobleVisit: new Audio('/gamesource/Sound_effect/Noble_Visit.mp3'),
      gameOver: new Audio('/gamesource/Sound_effect/GameOver.mp3'),
      passturn: new Audio('/gamesource/Sound_effect/Pass_Rurn.mp3'),
      AIhint: new Audio('/gamesource/Sound_effect/Take_Gem.mp3'),
    });
  }
}, []);

// 播放音效的函数
const playSound = (soundName: string) => {
  if (!soundEnabled) return;
  
  const sound = sounds[soundName];
  if (sound) {
    // 重置音频以便可以重复播放
    sound.pause();
    sound.currentTime = 0;
    sound.play().catch(err => console.error("Sound fail:", err));
  }
};


const TooltipPortal = () => {
  if (!tooltipInfo.show || !tooltipInfo.card) return null;
  
  // 获取当前玩家的金币数量
  const currentPlayer = gameState?.players.find(p => p.id === currentUser.id);
  const goldCount = currentPlayer?.gems?.x || 0; // 'x' 是金币的代码
  
  return ReactDOM.createPortal(
    <div 
      id="card-tooltip"
      style={{
        position: "fixed",
        left: `${tooltipInfo.mousePosition.x}px`,
        top: `${tooltipInfo.mousePosition.y}px`,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        border: "2px solid gold",
        borderRadius: "8px",
        padding: "10px",
        zIndex: 99999,
        color: "white",
        boxShadow: "0 0 15px rgba(255, 215, 0, 0.6)",
        width: "250px",
        pointerEvents: "none"
      }}
    >
      <div style={{ 
        marginBottom: "12px", 
        color: "#FFFFFF",
        fontSize: "16px", 
        fontWeight: "bold",
        backgroundColor: "rgba(70, 70, 70, 0.7)",
        borderRadius: "4px",
        padding: "5px 10px",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        textAlign: "center"
      }}>
        Card ID: {tooltipInfo.card.uuid}
      </div>

      <div style={{ marginBottom: "8px", fontWeight: "bold", color: "#FFD700" }}>
        Required Resources:
      </div>
      {Object.keys(tooltipInfo.missing).length > 0 ? (
        <div>
          <div style={{ marginBottom: "5px", fontSize: "15px" }}>You need:</div>
          {Object.entries(tooltipInfo.missing).map(([color, count]) => {
            if (color === "total") {
              return (
                <div key={color} style={{ color: "#ff6666", fontWeight: "bold" }}>
                  Total missing: {count} gems
                </div>
              );
            }
            
            const colorName = color === 'r' ? 'Red' :
                            color === 'g' ? 'Green' :
                            color === 'b' ? 'Blue' :
                            color === 'u' ? 'Black' :
                            color === 'w' ? 'White' :
                            color === 'x' ? 'Gold' : color;
            
            const textColor = color === 'r' ? '#ff3333' :
                          color === 'g' ? '#33cc33' :
                          color === 'b' ? '#3333ff' :
                          color === 'u' ? '#aaaaaa' :
                          color === 'w' ? '#ffffff' :
                          color === 'x' ? '#ffcc00' : 'white';
                            
            return (
              <div key={color} style={{ 
                display: "flex", 
                alignItems: "center", 
                margin: "3px 0",
                color: textColor,
                textShadow: color === 'w' ? '1px 1px 2px #000' : 'none'
              }}>
                <div className={`${color}chip`} style={{ 
                  width: "20px", 
                  height: "20px", 
                  marginRight: "8px",
                  flexShrink: 0
                }}></div>
                <span>{colorName}: {count}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: "#33cc33" }}>You can afford this card!</div>
      )}
      
      {/* 显示玩家拥有的金币数量 */}
      {goldCount > 0 && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          margin: "8px 0",
          borderTop: "1px solid rgba(255, 215, 0, 0.3)",
          paddingTop: "8px"
        }}>
          <div className="xchip" style={{ 
            width: "20px", 
            height: "20px", 
            marginRight: "8px",
            flexShrink: 0
          }}></div>
          <span style={{ 
            color: "#ffcc00", 
            fontWeight: "bold",
            textShadow: "0 0 5px rgba(255, 204, 0, 0.4)"
          }}>
            You have {goldCount} Gold coins
          </span>
        </div>
      )}
      
      {tooltipInfo.card.points > 0 && (
        <div style={{ marginTop: "8px", color: "#FFD700" }}>
          Victory Points: {tooltipInfo.card.points}
        </div>
      )}
    </div>,
    document.body
  );
};


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
    let isFromReserved = false;
  
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
       if (targetCard) {
      isFromReserved = true; // 标记卡牌来自预留区
    }
    }
  
    if (!targetCard) {
      console.warn("Card not found:", cardUuid);
      return;
    }
  
    // Action-specific logic
    if (currentAction === "buy") {
      if (canAffordCard(targetCard)) {
        triggerCardAnimation(cardUuid, "buy", currentUser.id, clickedElement);
        playSound('buyCard');

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
        // 如果卡牌来自预留区，阻止玩家预留
        if (isFromReserved) {
          alert("This Card Already Reserved!");
          return;
        }

        if (currentPlayer.reserved.length >= 3) {
          alert("You already have 3 reserved cards.");
          return;
        }

        // 检查预留后宝石总数是否会超过10个
        const currentGemCount = countPlayerGems(currentPlayer);
        // 预留卡会获得1个金色宝石
        if (currentGemCount + 1 > 10) {
          alert("You will have more than 10 gems after reserving! Please use some gems first.");
          return;
        }

        triggerCardAnimation(cardUuid, "reserve", currentUser.id, clickedElement);
        playSound('reserveCard');

        setTimeout(() => {
          sendAction("reserve", cardUuid);
          setCurrentAction(null); // Auto pass after action
          setSeconds(0); //倒计时归零
          sendAction("next", ""); 
        }, 1000);
      }
  };
  

  const requestAiHint = () => {
  if (!isPlayerTurn() || hintCount >= 1 || seconds < 10) return; // 限制1次 添加 seconds < 10 条件
    
    setHintLoading(true);
    setHintMessage("");
    
    aiActiveRef.current = true; // 标记 AI 开始

    // 发送AI提示请求
    sendMessage({
      type: "AI_HINT",
      roomId: gameId,
      content: { target: "" }
    });
    
    // 增加使用次数
      setHintCount(prev => {
        const newCount = prev + 1;
        // 同时保存到 localStorage
        sessionStorage.setItem(`ai-hint-count-${gameId}`, newCount.toString());
        return newCount;
      });
  };

  // 发送动作到WebSocket
  const sendAction = (action: string, target: string, extraData: Record<string, any> = {}) => {
    if (!wsConnected) {
      console.warn("WebSocket not connect");
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
                sessionStorage.removeItem(`ai-hint-count-${gameId}`);
                sendLeaveRoomMessage();
                // 短暂延迟后跳转，确保离开消息能发送出去
                setTimeout(() => {
                  globalThis.location.href = "/lobby";
                }, 500);
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "rgba(100, 100, 200, 0.8)",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
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
                sessionStorage.removeItem(`ai-hint-count-${gameId}`);
                sendLeaveRoomMessage();
                setTimeout(() => {
                  globalThis.location.href = "/lobby";
                }, 500);
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#cc0000",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
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
          boxShadow: "0 0 10px rgba(255, 0, 0, 0.5)",
          transition: "all 0.2s ease"
        }}
      >
        Quit Game
      </button>

      {/* 音效开关按钮*/}
      <button 
        onClick={() => setSoundEnabled(prev => !prev)}
        style={{
          position: "fixed",
          top: "20px",
          left: "150px", // 放在Quit Game按钮右侧
          zIndex: 1001,
          backgroundColor: soundEnabled ? "rgba(0, 150, 0, 0.8)" : "rgba(150, 150, 150, 0.8)",
          color: "white",
          fontWeight: "bold",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "2px solid white",
          boxShadow: soundEnabled ? "0 0 10px rgba(0, 255, 0, 0.5)" : "none",
          transition: "all 0.2s ease"
        }}
      >
        {soundEnabled ? "🔊 Sound Effect On" : "🔇 Sound Effect Off"}
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
        gridTemplateColumns: "auto auto", 
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
          <div id="noble-area" 
            style={{ 
            width: '150%', 
            display: 'flex',
            justifyContent: 'flex-start',
            marginRight: 'auto', 
            maxWidth: '100%',
            overflowX: 'auto' 
          }}
        >
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
                        if (currentPlayer) {
                          if (currentPlayer.reserved.length >= 3) {
                            alert("You already have 3 reserved cards!");
                            return;
                          }
                          
                          // 检查预留后宝石总数是否会超过10个
                          const currentGemCount = countPlayerGems(currentPlayer);
                          if (currentGemCount + 1 > 10) {
                            alert("You will have more than 10 gems after reserving! Please use some gems first.");
                            return;
                          }
                          
                          sendAction("reserve", level);
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
                        className={`card card-${card.color} card-${card.level} clickable`} 
                        onClick={(e) => handleCardAction(card.uuid, e.currentTarget)}
                        onMouseEnter={(e) => {
                          const missing = calculateMissingGems(card);
                          setTooltipInfo({
                            show: true,
                            card: card,
                            mousePosition: { x: e.clientX + 20, y: e.clientY - 10 }, // 初始位置是鼠标位置偏移
                            missing: missing
                          });
                        }}
                      onMouseLeave={() => setTooltipInfo(prev => ({ ...prev, show: false }))}
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
          gap: "25px",
          width: "100%",
          minWidth: "700px", // 确保最小宽度
          overflow: "auto",
          overflowX: "hidden", // 添加这个属性

        }}>
          {/* Player panels */}
          <div id="player-area" style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)", 
            gap: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            padding: "10px", 
            borderRadius: "8px",
            width: "100%",
            minWidth: "600px", // 增加整体最小宽度
            height: (gameState?.players?.length || 0) <= 2 ? "400px" : "750px",
            maxHeight: (gameState?.players?.length || 0) <= 2 ? "400px" : "750px",
            overflowY: "auto", // 改为auto，需要时才显示滚动条
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
                  height: "350px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  {/* Header */}
                  <div className="playerHeader" style={{
                    display: "flex",
                    flexDirection: "column", // 改为纵向排列
                    alignItems: "center", // 居中对齐
                    marginBottom: "10px",
                    padding: "5px",
                    borderRadius: "5px",
                    backgroundColor: gameState.currentPlayerId === player.id ? "rgba(25, 118, 210, 0.5)" : "rgba(0, 0, 0, 0.4)", // 蓝色主题
                    border: gameState.currentPlayerId === player.id ? "2px solid #64b5f6" : "1px solid rgba(255, 255, 255, 0.2)", // 浅蓝色边框
                    boxShadow: gameState.currentPlayerId === player.id ? "0 0 15px rgba(100, 181, 246, 0.6)" : "none", // 蓝色发光效果
                    animation: gameState.currentPlayerId === player.id ? "pulse 2s infinite" : "none",
                    transition: "all 0.3s ease"
                  }}>
                    {/* 玩家名称 - 第一行 */}
                    <div style={{
                      width: "100%",
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: gameState.currentPlayerId === player.id ? "#90ee90" : (player.id === currentUser.id ? "#FFD700" : "white"),
                      textAlign: "center",
                      textShadow: gameState.currentPlayerId === player.id ? "0 0 10px rgba(85, 255, 51, 0.8)" : "none"
                    }}>
                      {gameState.currentPlayerId === player.id && <span style={{marginRight: "5px"}}>Current Player:</span>}
                      {player.id === currentUser.id ? "You!" : player.name}
                      {player.isInThisGame === false && (
                        <span style={{
                          color: "#ff4444",
                          marginLeft: "8px",
                          fontSize: "14px",
                          fontWeight: "normal"
                        }}>
                          (Quit)
                        </span>
                      )}
                    </div>
                    
                    {/* 宝石数和分数 - 第二行 */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "0.9em",
                      marginTop: "5px",
                      padding: "2px 5px"
                    }}>
                      {/* 宝石总数 */}
                      <span style={{
                        backgroundColor: countPlayerGems(player) >= 10 ? "rgba(255, 50, 50, 0.7)" : "rgba(30, 30, 80, 0.6)", 
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: "bold"
                      }}>
                        Total Gems: {countPlayerGems(player)}/10
                      </span>
                      
                      {/* 分数 */}
                      <span style={{
                        backgroundColor: "rgba(255, 215, 0, 0.7)",
                        color: "#000",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: "bold"
                      }}>
                        Victory Points: {player.score}
                      </span>
                    </div>
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
              <div className="reserveCards" style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                height: "200px" , // 增加固定高度
                marginTop: "10px",
                marginBottom: "10px", // 增加底部间距
                gap: "8px", // 确保有间距
                overflow: "visible" ,// 确保内容不被裁剪
                cursor:"pointer"
              
              }}>
                {[0, 1, 2].map((i) => {
                  const card = player.reserved?.[i];

                  if (card) {
                    const shortColor = card.color && card.color.length === 1 
                      ? card.color 
                      : mapColorToFrontend(card.color);

                    return (
                      <div
                        key={card.uuid}
                        className={`card card-${shortColor} card-${card.level}`}
                        onClick={(e) => {
                          if (player.id === currentUser.id && isPlayerTurn()) {
                            handleCardAction(card.uuid, e.currentTarget);
                          }
                        }}
                        onMouseEnter={(e) => {
                          const missing = calculateMissingGems(card);
                          setTooltipInfo({
                            show: true,
                            card: card,
                            mousePosition: { x: e.clientX + 20, y: e.clientY - 10 },
                            missing: missing
                          });
                        }}
                        onMouseLeave={() => setTooltipInfo(prev => ({ ...prev, show: false }))}
                        style={{
                          width: "30%", // 设为百分比宽度
                          height: "150px", // 固定高度
                          maxWidth: "110px", // 设置最大宽度
                          margin: "0", // 移除外边距
                          position: "relative",
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
                          width: "30%", // 与卡片宽度一致
                          height: "150px", // 固定高度
                          maxWidth: "110px", // 最大宽度
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
          
          <div id="ai-hint-content" style={{
            flex: 1,
            display: "flex", // 改为 flex 布局
            flexDirection: "row", // 水平方向排列
            alignItems: "center", // 垂直居中
            justifyContent: "flex-start", // 靠左对齐
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "5px",
            padding: "10px",
            marginBottom: "5px",
            minHeight: "80px",
            width: "100%",
            // border: "2px solid #FFD700",
            // boxShadow: "0 0 20px rgba(255, 215, 0, 0.4)"
          }}>
            {/* 按钮保持原来的大小和样式 */}
            <div style={{ 
              marginRight: "15px", // 添加右边距，与对话框分隔
              flexShrink: 0 // 防止按钮被压缩
            }}>
              {hintLoading ? (
                <button
                  disabled
                  style={{
                    padding: "8px 24px",
                    fontWeight: "bold",
                    fontSize: "18px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "rgba(0, 100, 255, 0.9)",
                    color: "white",
                    boxShadow: "0 0 10px rgba(0, 100, 255, 0.6)",
                  }}
                >
                  Thinking...
                </button>
              ) : (
                <button
                onClick={() => {
                    playSound('AIhint');
                    requestAiHint();
                  }}
                  disabled={!isPlayerTurn() || hintCount >= 1 || seconds < 10}
                  className={
                    !isPlayerTurn() || hintCount >= 1 || seconds < 10 ? "disabled" : "clickable"
                  }
                  style={{
                    padding: "8px 24px",
                    fontWeight: "bold",
                    fontSize: "18px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor:
                      !isPlayerTurn() || hintCount >= 1 || seconds < 10
                        ? "rgba(120, 120, 120, 0.5)"
                        : "rgba(0, 100, 255, 0.9)",
                    color: "white",
                    boxShadow:
                      !isPlayerTurn() || hintCount >= 1 || seconds < 10
                        ? "none"
                        : "0 0 10px rgba(0, 100, 255, 0.6)",
                    transition: "all 0.2s ease",
                    opacity: !isPlayerTurn() || hintCount >= 1 || seconds < 10 ? 0.6 : 1,
                  }}
                >
                  {hintCount >= 1 ? "Used" : seconds < 10 ? "Time Low" : "Get AI Advice"}
                </button>
              )}
            </div>
            
            {/* 对话框部分 */}
            <div style={{
              flex: 1, // 占用剩余空间
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              borderRadius: "5px",
              padding: "10px",
              minHeight: "60px",
              fontSize: "18px", // 稍微减小字体
              fontWeight: "bold",
              color: "#FFD700",
              border: "1px solid #FFD700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}>
              {hintMessage ? (
                <div style={{
                  backgroundColor: "#003ee8",
                  color: "white",
                  fontWeight: "bold",
                  padding: "6px 10px",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "20px",
                  boxShadow: "0 0 8px rgba(0, 100, 255, 0.9)",
                  transition: "all 0.2s ease",
                  maxWidth: "100%", // 确保文字不溢出
                  wordWrap: "break-word" // 允许长文本换行
                }}>{hintMessage}</div>
              ) : (
                <div style={{ opacity: 0.7 }}>
                  Click the button for AI strategy advice
                </div>
              )}
            </div>
          </div>


          {isPlayerTurn() && (
            <div style={{
              marginTop: "5px",
              marginBottom: "10px",
              padding: "10px",
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "8px",
              textAlign: "center",
              width: "100%",
              minWidth: "700px", // 增加最小宽度，确保内容不会被压缩
              overflowX: "visible", // 允许内容溢出但不显示滚动条
              boxSizing: "border-box", // 确保边框和内边距计入宽度
            }}>
              {currentAction === null ? (
                <>
                  <div style={{
                    fontSize: "24px",
                    marginBottom: "15px",
                    color: "#33FF33",
                    fontWeight: "bold",
                    textShadow: "0 0 8px rgba(51, 255, 51, 0.7)",
                    animation: "pulse 1.5s infinite",
                    textAlign: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "2px solid #33FF33"
                  }}>
                    Please take your action!
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
                    <button 
                    onClick={() => {
                        playSound('passturn'); 
                        setCurrentAction("take")
                      }} 
                      style={buttonStyle}>
                        Take Gems</button>
                    <button 
                    onClick={() => {
                        playSound('passturn');
                        setCurrentAction("buy")
                      }}
                       style={buttonStyle}>Buy Card</button>
                    <button 
                    onClick={() => {
                      playSound('passturn');
                      setCurrentAction("reserve")
                      }}
                    style={buttonStyle}>Reserve Card</button>
                  </div>
                </>
              ) : (
                <>
                  {/* 这里是选择后的状态 */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}>
                    {/* 第一行: 选择状态 */}
                    <div style={{ 
                      color: "#80ffcc", 
                      fontSize: "22px",
                      fontWeight: "bold",
                      textShadow: "0 0 6px rgba(128, 255, 204, 0.7)",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "2px solid #80ffcc",
                      textAlign: "center"
                    }}>
                      You selected: <strong style={{color: "#FFD700"}}>{currentAction.toUpperCase()}</strong>
                    </div>
                    
                    {/* 第二行: Back按钮 + 宝石选择区域 (水平排列) */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px"
                    }}>
                      {/* 左侧: Back按钮 */}
                      <button 
                        onClick={() => {
                          playSound('passturn');
                          setCurrentAction(null);
                          setSelectedGems([]);
                        }} 
                        style={{
                          ...buttonStyle,
                          backgroundColor: "#cc3333",
                          minWidth: "80px",
                          flexShrink: 0,
                          height: "45px"
                        }}
                      >
                        Back
                      </button>
                      
                      {/* 右侧: 宝石选择区域 (仅当选择take时显示) */}
                      {currentAction === "take" && (
                        <div style={{
                          flex: 1,
                          backgroundColor: "rgba(0, 0, 0, 0.3)",
                          padding: "5px 10px",
                          borderRadius: "10px",
                          border: "2px solid #22bb55",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}>
                          {/* 提示文字 */}
                          <div style={{ 
                            color: "#FFFFFF", 
                            fontSize: "16px",
                            fontWeight: "bold",
                            textShadow: "0 0 6px rgba(255, 255, 255, 0.6)",
                            whiteSpace: "nowrap",
                            marginRight: "10px"
                          }}>
                            Select: <span style={{color: "#FFD700"}}>3 diff</span> or <span style={{color: "#FFD700"}}>2 same</span>
                          </div>
                          
                          {/* 宝石选择 */}
                          <div style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "6px",
                            flex: 1
                          }}>
                            {["r", "g", "b", "u", "w"].map(color => (
                              <div
                                key={color}
                                className={`${color}chip gem ${selectedGems.includes(color) ? "selected" : ""}`}
                                onClick={() => {
                                    playSound('passturn'); 
                                    handleGemSelect(color);
                                }}
                                style={{
                                  width: "45px",
                                  height: "45px",
                                  border: selectedGems.includes(color)
                                    ? "3px solid #FFD700"
                                    : "1px solid #aaa",
                                  borderRadius: "50%",
                                  boxShadow: selectedGems.includes(color)
                                    ? "0 0 10px rgba(255, 215, 0, 0.7)"
                                    : "none"
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* 确认按钮 */}
                          <button
                            onClick={handleConfirmGems}
                            style={{ 
                              backgroundColor: "#22bb55", 
                              fontSize: "16px",
                              padding: "5px 10px",
                              border: "2px solid #fff",
                              borderRadius: "6px",
                              fontWeight: "bold",
                              color: "#000",
                              boxShadow: "0 0 8px rgba(34, 187, 85, 0.5)",
                              marginLeft: "10px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            Confirm
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
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
            <div   
            className={isPlayerTurn() ? "clickable" : "disabled"}
            style={{
              flex: "1",
              backgroundColor: "rgba(255, 150, 0, 0.8)",
              border: "3px solid #ff6a00",
              borderRadius: "8px",
              padding: "10px 5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(255, 150, 0, 0.6)",
              opacity: isPlayerTurn() ? 1 : 0.5,
              cursor:"pointer"
            }}
            onClick={() => {
              playSound('passturn');
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
  

      {/* 
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
        <div
          className={`title${chatNotify ? " blinking" : ""}`}
          onClick={() => {
            setShowChat((prev) => !prev);
            setChatNotify(false);
          }}
          style={{
            width: "230px",
            padding: "3px 10px",
            borderBottom: "1px solid black",
            marginBottom: "5px",
          }}
        >
          ::Chat
        </div>
  
        {showChat && (
          <>
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
      */}


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

      {/* 贵族访问动画 - 简化版 */}
      {showNobleVisitAnimation && (
        <div className="noble-visit-overlay">
          <div className="noble-visit-animation">
            NOBLE VISIT!
          </div>
        </div>
      )}

      <TooltipPortal />
    </ResponsiveGameWrapper>
  )}