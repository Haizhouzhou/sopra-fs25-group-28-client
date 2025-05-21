"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from "@/hooks/useLocalStorage";
import WebSocketService, { WebSocketMessage } from '@/hooks/useWebSocket';
import type { UserListGetDTO } from "@/types/user";

interface GameRoom {
  id: string;
  name: string;
  owner: string;
  players: string;
  isReady: boolean;
  gameStatus: string | null;
}

const GameLobby: React.FC = () => {
  const router = useRouter();
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: localUser, clear: clearUser } = useLocalStorage<UserListGetDTO>("currentUser", {} as UserListGetDTO);

  const [currentUser, setCurrentUser] = useState<UserListGetDTO | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  
  // 添加防抖计时器引用
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const websocketService = WebSocketService.getInstance();

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'ROOM_LIST' || message.type === 'SERVER_ROOM_LIST') {
      // 清除之前的防抖计时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // 设置新的防抖计时器，延迟300ms处理
      debounceTimerRef.current = setTimeout(() => {
        console.log("处理房间列表数据:", message.content);
        
        // 确保 content 是数组
        const roomInfos = Array.isArray(message.content) ? message.content : [];
        
        // 直接转换数据并更新状态，不再比较变化
        const parsedRooms: GameRoom[] = roomInfos.map((room) => ({
          id: room.roomId,
          name: room.roomName || "Untitled",
          owner: room.owner || 'Unknown',
          players: `${room.players}/${room.maxPlayers || 4}`,
          isReady: false,
          gameStatus: room.gameStatus // 新增解析游戏状态
        }));
        
        console.log("更新房间列表:", parsedRooms);
        setGameRooms(parsedRooms);
      }, 300); // 300ms的防抖时间
    }

    if (message.type === 'ROOM_JOINED') {
      const joinedRoomId = message.roomId || message.content?.roomId;
      if (joinedRoomId) {
        router.push(`/room/${joinedRoomId}`);
      }
    }
  }, [router]); // 移除了 gameRooms 依赖，因为不再需要比较

  const fetchGameRooms = useCallback(() => {
    if (!isConnected || !currentUser) return;
    websocketService.sendMessage({
      type: "GET_ROOMS",
      roomId: "LOBBY",
      sessionId: currentUser.id.toString(),
      content: {
        userId: currentUser.id,
        displayName: currentUser.name
      }
    });
  }, [isConnected, currentUser]);

  const handleLeaderboardClick = () => {
    router.push("/leaderboard");
  };

  useEffect(() => {
    const initialize = async () => {
      if (!token || !localUser?.id) return;
      setIsLoading(true);
      try {
        setCurrentUser(localUser);
        websocketService.setSessionId(localUser.id.toString());
        const connected = await websocketService.connect(token);
        setIsConnected(connected);
        websocketService.addMessageListener(handleWebSocketMessage);
        if (connected) {
          setTimeout(fetchGameRooms, 300);
        }
      } catch (err) {
        console.error("WebSocket connection error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
    
    // 清理函数，清除防抖计时器
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [token, localUser, fetchGameRooms, handleWebSocketMessage]);

  const handleJoinGame = () => {
    if (!selectedRoom || !isConnected || !currentUser) return;
    
    // 找到选中的房间
    const selectedGameRoom = gameRooms.find(room => room.id === selectedRoom);
    
    // 判断房间状态
    if (selectedGameRoom) {
      const [current, max] = selectedGameRoom.players.split('/').map(Number);
      const isFull = current >= max;
      const isRunning = selectedGameRoom.gameStatus === 'RUNNING';
      if (isFull || isRunning) {
        alert(isFull ? "Sorry, the room is full. You can't join at the moment." : "The game has already started. Please try another room.");
        return;
      }
    }
    
    // 发送加入房间的消息
    websocketService.sendMessage({
      type: "JOIN_ROOM",
      roomId: selectedRoom,
      content: {}
    });
  };

  const getCanJoinRoom = () => {
  if (!selectedRoom || !isConnected) return false;
  
  const selectedGameRoom = gameRooms.find(room => room.id === selectedRoom);
  if (!selectedGameRoom) return false;
  
  // 检查房间是否满员
  const [current, max] = selectedGameRoom.players.split('/').map(Number);
  const isFull = current >= max;
  
  // 检查游戏是否正在进行
  const isRunning = selectedGameRoom.gameStatus === 'RUNNING';
  
  return !isFull && !isRunning;
  };


  const handleCreateGame = () => {
    router.push("/create");
  };

  const handleLogout = () => {
    websocketService.disconnect();
    clearToken();
    clearUser();
    router.push("/");
  };

  const handleProfileClick = () => {
    if (currentUser) {
      router.push(`/users/${currentUser.id}`);
    }
  };

  const handleRefreshRooms = () => {
    // 手动刷新时，清除防抖计时器以立即更新
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    fetchGameRooms();
  };

  if (isLoading) {
    return <div style={{ color: 'white' }}>Loading lobby...</div>;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      <img src="/gamesource/tile_background.png" alt="Background" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }} />

      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <img src="/gamesource/splendor_logo.png" alt="Logo" width={500} />
      </div>

      <div style={{ position: 'absolute', top: 20, right: 20, padding: '8px 12px', borderRadius: '4px', backgroundColor: isConnected ? 'rgba(0, 128, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)', color: 'white', fontWeight: 'bold' }}>
        {isConnected ? 'Server Connected' : 'Server Disconnected'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', padding: '200px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 style={{ color: '#FFD700', fontSize: '2.5rem' }}>Game Lobby</h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '20px' }}>
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <img src={`/avatar/${currentUser.avatar || 'a_01.png'}`} alt="Avatar" style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid #FFD700' }} />
                <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.3rem' }}>{currentUser.name}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '20px' }}>
              <button onClick={handleLeaderboardClick} style={{ border: '2px solid #FFD700', color: '#FFD700', padding: '8px 20px', borderRadius: '4px', backgroundColor: '#0F2149' }}>LEADERBOARD</button>
              <button onClick={handleProfileClick} style={{ border: '2px solid #FFD700', color: '#FFD700', padding: '8px 20px', borderRadius: '4px', backgroundColor: '#0F2149' }}>PROFILE</button>
              <button onClick={handleLogout} style={{ border: '2px solid #FFD700', color: '#FFD700', padding: '8px 20px', borderRadius: '4px', backgroundColor: '#0F2149' }}>LOG OUT</button>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 33, 73, 0.7)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#8aff8a', fontSize: '0.9rem' }}>
              {isConnected ? 'Real-time Updates Active' : 'Waiting for connection...'}
            </span>
            <button onClick={handleRefreshRooms} style={{ backgroundColor: '#0F2149', border: '1px solid #FFD700', color: '#FFD700', padding: '4px 12px', borderRadius: 4 }}>REFRESH</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid #FFD700', padding: '8px 0', color: '#FFD700', fontWeight: 'bold' }}>
            <div>Room Id</div>
            <div>Room Name</div>
            <div>Owner</div>
            <div>Players</div>
            <div>Status</div>
          </div>

          {gameRooms.length > 0 ? gameRooms.map((room) => (
            <div key={room.id} onClick={() => setSelectedRoom(room.id)} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              padding: '12px 0',
              color: 'white',
              backgroundColor: selectedRoom === room.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
              cursor: 'pointer',
              alignItems: 'center',
              transition: 'background-color 0.2s ease' // 添加过渡效果
            }}>
              <div>{room.id}</div>
              <div>{room.name}</div>
              <div>{room.owner}</div>
              <div>{room.players}</div>
              <div>{room.gameStatus === null ? 'Waiting to Start' : 
                    room.gameStatus === 'NOT_STARTED' ? 'Waiting to Start' : 
                    room.gameStatus === 'RUNNING' ? 'Game Running' : 
                    room.gameStatus === 'FINISHED' ? 'Game Over' : room.gameStatus}</div> 
            </div>
          )) : (
            <div style={{ 
              padding: 20, 
              textAlign: 'center', 
              color: 'white',
              transition: 'opacity 0.3s ease' // 添加过渡效果
            }}>
              No rooms available. Create a new game!
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <button onClick={handleJoinGame} disabled={!getCanJoinRoom()} style={{
            backgroundColor: '#0F2149',
            border: '2px solid #FFD700',
            color: '#FFD700',
            padding: '12px 30px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: getCanJoinRoom() ? 'pointer' : 'not-allowed',
            opacity: getCanJoinRoom() ? 1 : 0.7
          }}>
            JOIN GAME
          </button>
          <button onClick={handleCreateGame} disabled={!isConnected} style={{
            backgroundColor: '#0F2149',
            border: '2px solid #FFD700',
            color: '#FFD700',
            padding: '12px 30px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            opacity: isConnected ? 1 : 0.7
          }}>
            CREATE NEW GAME
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;