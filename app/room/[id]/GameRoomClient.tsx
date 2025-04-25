"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import WebSocketService, { WebSocketMessage } from "@/hooks/useWebSocket";
import { useGameState } from '@/hooks/useGameStateContext';


interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isOwner?: boolean;
  avatar?: string;
}

interface ChatMessage {
  player: string;
  text: string;
  timestamp: number;
}

interface User {
  id: number;
  name: string;
  avatar?: string;
}

const GameRoomClient = () => {
  const params = useParams();
  const roomId = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiService = useApi();

  const { saveGameState } = useGameState();


  const rawName = searchParams.get("name");
  // 修改为使用 state 变量
  const [roomName, setRoomName] = useState(
    rawName && !rawName.startsWith("Room #") ? rawName : `Room #${roomId}`
  );

  const { value: token } = useLocalStorage<string>("token", "");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [_isLoading, setIsLoading] = useState(true);
  const hasConnected = useRef(false);
  const currentUserRef = useRef<User | null>(null);

  
  // Update currentUserRef when currentUser changes
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((msg: WebSocketMessage) => {
    console.log("WS MSG:", msg.type, msg.content ? JSON.stringify(msg.content).substring(0, 100) : "undefined");
    
    // 在handleWebSocketMessage中处理ROOM_STATE消息·
    if (msg.type === "ROOM_STATE") {
      try {
        console.log("处理ROOM_STATE消息:", msg);
        
        // 更新房间名称（如果服务器提供了）
        if (msg.roomName) {
          console.log("收到房间名称:", msg.roomName);
          setRoomName(msg.roomName);
        }
        
        // 解析玩家数据
        const rawPlayers = (msg as any).players || [];
        
        if (!Array.isArray(rawPlayers)) {
          console.error("players不是数组:", rawPlayers);
          return;
        }
        
        const updatedPlayers = rawPlayers.map((p: any) => ({
          id: String(p.userId || ''),
          name: p.name || 'Unknown',
          isReady: Boolean(p.room_status), // 确保这里正确获取准备状态
          isOwner: Boolean(p.isOwner),
          avatar: p.avatar || "a_01.png",
        }));
        
        console.log("处理后的players:", updatedPlayers);
        
        // 设置玩家列表
        setPlayers(updatedPlayers);
        
        // 更新当前用户状态
        const user = currentUserRef.current;
        if (user?.id) {
          const me = updatedPlayers.find(p => String(p.id) === String(user.id));
          console.log("找到当前用户:", me);
          
          if (me) {
            console.log("更新UI状态 - isReady:", me.isReady);
            setIsReady(me.isReady); // 确保这行生效
            setIsOwner(me.isOwner || false);
          }
        }
        
        // 更新全体准备状态
        const nonOwners = updatedPlayers.filter(p => !p.isOwner);
        const allReady = nonOwners.length > 0 && nonOwners.every(p => p.isReady);
        setAllPlayersReady(allReady);
        
      } catch (err) {
        console.error("处理ROOM_STATE消息出错:", err);
      }
    }
      
      // 处理其他消息...
      if (msg.type === "GAME_STATE") {

        console.log("收到游戏状态，保存到全局状态并跳转", msg.content);
        // 保存游戏状态到全局上下文
        saveGameState(msg.content);

        router.push(`/game/${roomId}`);
      }
      
      if (msg.type === "CHAT_MESSAGE" && msg.content) {
        const chatMsg = {
          player: msg.content.player || "Anonymous",
          text: msg.content.text || "",
          timestamp: msg.content.timestamp || Date.now()
        };
        
        // 检查是否已存在相同消息
        setMessages(prev => {
          // 检查是否已经有相同内容和时间的消息
          const isDuplicate = prev.some(existingMsg => 
            existingMsg.player === chatMsg.player && 
            existingMsg.text === chatMsg.text &&
            Math.abs(existingMsg.timestamp - chatMsg.timestamp) < 3000 // 3秒内认为是同一条消息
          );
          
          if (isDuplicate) {
            return prev; // 不添加重复消息
          }
          return [...prev, chatMsg];
        });
      }
    }, [roomId, saveGameState]);

  // Component initialization
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Get user data from localStorage
        const userStr = localStorage.getItem("currentUser");
        console.log("User data from localStorage:", userStr);
        
        if (!userStr) {
          console.log("No user data in localStorage");
          return router.push("/");
        }

        // Parse user data
        let user;
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.log("Failed to parse user data:", e);
          return router.push("/");
        }
        
        if (!user?.id) {
          console.log("User data missing id field");
          return router.push("/");
        }

        console.log("Setting current user:", user);
        setCurrentUser({ 
          id: user.id, 
          name: user.name, 
          avatar: user.avatar || "a_01.png" 
        });
        currentUserRef.current = { 
          id: user.id, 
          name: user.name, 
          avatar: user.avatar || "a_01.png" 
        };

        // Validate user
        try {
          await apiService.get(`/users/${user.id}`);
        } catch (e) {
          console.log("User validation failed:", e);
        }

        // Connect WebSocket
        if (!hasConnected.current) {
          hasConnected.current = true;
          const ws = WebSocketService.getInstance();
          
          console.log("Connecting to WebSocket...");
          const connected = await ws.connect(token);
          console.log("WebSocket connection status:", connected);
          
          setIsConnected(connected);
          ws.addMessageListener(handleWebSocketMessage);

          if (connected) {
            console.log("Sending JOIN_ROOM message:", {
              type: "JOIN_ROOM",
              roomId,
              content: {
                userId: user.id,
                name: user.name
              }
            });
            
            ws.sendMessage({
              type: "JOIN_ROOM",
              roomId,
              content: {
                userId: user.id,
                name: user.name
              }
            });
            
              ws.sendMessage({
                type: "GET_ROOM_STATE",
                roomId
              });
          }
        }
      } catch (err) {
        console.log("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
    
    // Cleanup function
    return () => {
      console.log("Component unmounting, removing WebSocket listener");
      WebSocketService.getInstance().removeMessageListener(handleWebSocketMessage);
    };
  }, []);

  // Monitor players state changes
  useEffect(() => {
    console.log("Players state updated:", players);
  }, [players]);

  // Handle sending messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !isConnected) return;

    const chatMessage = {
      player: currentUser.name,
      text: newMessage.trim(),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, chatMessage]);
    setNewMessage("");

    WebSocketService.getInstance().sendMessage({
      type: "PLAYER_MESSAGE",
      roomId,
      content: chatMessage
    });
  };

  // Handle ready status
  const handleReady = () => {
    console.log("Ready 按钮点击:", {
      isOwner,
      currentUser,
      isConnected,
      isReady
    });
    
    if (isOwner || !currentUser || !isConnected) return;
    
    // 发送状态切换消息
    const newStatus = !isReady;
    console.log(`尝试将准备状态切换为: ${newStatus}`);
    
    // 使用简化的消息格式
    WebSocketService.getInstance().sendMessage({
      type: "PLAYER_STATUS",
      roomId,
      content: {
        userId: currentUser.id,
        status: newStatus
      }
    });
    
    // 直接更新本地 UI 状态，不等待服务器响应
    // 这样用户会立即看到反馈，即使服务器处理有延迟
    setIsReady(newStatus);
  };

  // Handle starting the game
  const handleStartGame = () => {
    if (!isOwner || !allPlayersReady || !isConnected) return;
    
    console.log("Sending start game message");
    WebSocketService.getInstance().sendMessage({
      type: "START_GAME",
      roomId
    });
  };

  // Handle leaving the room
  const handleLeaveRoom = () => {
    console.log("Leaving room");
    if (isConnected && currentUser) {
      WebSocketService.getInstance().sendMessage({
        type: "LEAVE_ROOM",
        roomId,
        content: { userId: currentUser.id }
      });
    }
    setTimeout(() => router.push("/lobby"), 500);
  };

  // Handle manual room refresh
  const handleRefreshRoomState = () => {
    if (!isConnected) return;
    
    console.log("Manually requesting room state");
    WebSocketService.getInstance().sendMessage({
      type: "GET_ROOM_STATE",
      roomId
    });
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      <img src="/gamesource/tile_background.png" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }} />

      <div style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 10 }}>
        <img src="/gamesource/splendor_logo.png" width={150} />
      </div>

      <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 12px', borderRadius: '4px', backgroundColor: isConnected ? 'rgba(0,128,0,0.7)' : 'rgba(255,0,0,0.7)', color: 'white', fontWeight: 'bold', zIndex: 10 }}>
        {isConnected ? 'Server Connected' : 'Server Disconnected'}
      </div>

      {/* Refresh button */}
      <div style={{ position: 'absolute', top: '60px', right: '20px', zIndex: 10 }}>
        <button 
          onClick={handleRefreshRoomState}
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            color: 'white', 
            border: '1px solid #FFD700',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          Refresh Room
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '1000px', margin: '0 auto', padding: '120px 20px 20px' }}>
        <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>
          <div style={{ width: '60%', backgroundColor: 'rgba(15,33,73,0.7)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', color: 'white' }}>
              {messages.length > 0 ? (
                messages.map((msg, idx) => (
                  <div key={`${msg.timestamp}-${idx}`} style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#FFD700' }}>{msg.player}: </span>
                    <span>{msg.text}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#aaa', textAlign: 'center', marginTop: '20px' }}>
                  No messages in chat yet...
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
              <input 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type your message..." 
                style={{ 
                  flex: 1, 
                  backgroundColor: '#0F2149', 
                  border: '1px solid #FFD700', 
                  color: 'white', 
                  padding: '8px 12px', 
                  borderRadius: '4px 0 0 4px' 
                }} 
              />
              <button 
                type="submit" 
                disabled={!isConnected} 
                style={{ 
                  backgroundColor: '#0F2149', 
                  border: '1px solid #FFD700', 
                  borderLeft: 'none', 
                  color: '#FFD700', 
                  padding: '8px 16px', 
                  borderRadius: '0 4px 4px 0', 
                  cursor: isConnected ? 'pointer' : 'not-allowed', 
                  opacity: isConnected ? 1 : 0.7 
                }}
              >
                Send
              </button>
            </form>
          </div>

          <div style={{ width: '40%', backgroundColor: 'rgba(15,33,73,0.7)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: '#FFD700', marginTop: 0, marginBottom: '16px', textAlign: 'center' }}>Room - {roomName}</h2>

            <div style={{ marginBottom: '20px', flex: 1, overflowY: 'auto' }}>
              {players.length > 0 ? (
                players.map((player, index) => (
                  <div 
                    key={`player-${player.id}-${index}`} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '10px', 
                      borderBottom: '1px solid rgba(255,215,0,0.3)', 
                      color: 'white' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={`/avatar/${player.avatar || 'a_01.png'}`} 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          border: '2px solid #FFD700' 
                        }} 
                      />
                      <div>
                        {player.name} 
                        {player.isOwner ? ' (Owner)' : ''} 
                        {currentUser && String(currentUser.id) === String(player.id) ? ' (You)' : ''}
                      </div>
                    </div>
                    {!player.isOwner && (
                      <div style={{ color: player.isReady ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                        {player.isReady ? 'READY' : 'NOT READY'}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                  No players in the room yet...
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                {isOwner ? (
                  <button 
                    onClick={handleStartGame} 
                    disabled={!allPlayersReady || !isConnected} 
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#0F2149', 
                      border: '2px solid #FFD700', 
                      color: '#FFD700', 
                      padding: '12px', 
                      borderRadius: '4px', 
                      cursor: allPlayersReady && isConnected ? 'pointer' : 'not-allowed', 
                      fontWeight: 'bold', 
                      opacity: allPlayersReady && isConnected ? 1 : 0.7 
                    }}
                  >
                    START GAME
                  </button>
                ) : (
                  <button 
                    onClick={handleReady} 
                    disabled={!isConnected} 
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#0F2149', 
                      border: '2px solid #FFD700', 
                      color: '#FFD700', 
                      padding: '12px', 
                      borderRadius: '4px', 
                      cursor: isConnected ? 'pointer' : 'not-allowed', 
                      fontWeight: 'bold', 
                      opacity: isConnected ? 1 : 0.7 
                    }}
                  >
                    {isReady ? 'CANCEL READY' : 'READY'}
                  </button>
                )}
                <button 
                  onClick={handleLeaveRoom} 
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#0F2149', 
                    border: '2px solid #FFD700', 
                    color: '#FFD700', 
                    padding: '12px', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold' 
                  }}
                >
                  QUIT GAME
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoomClient;