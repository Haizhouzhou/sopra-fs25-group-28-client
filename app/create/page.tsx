"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from "@/hooks/useApi";
import WebSocketService, { useWebSocket, WebSocketMessage } from "@/hooks/useWebSocket";

const CreateGame: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [roomName, setRoomName] = useState('');
  const [playerCount, setPlayerCount] = useState(4);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // 用于防止重复跳转
  const hasNavigatedRef = useRef(false);

  // 获取用户信息
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const sessionId = user?.id?.toString() || Math.random().toString(36).substring(2, 15);

  // 使用WebSocket服务
  const { connected, sendMessage } = useWebSocket(sessionId, handleWebSocketMessage);

  // WebSocket消息处理
  function handleWebSocketMessage(message: WebSocketMessage) {
    console.log('Received WebSocket message in create game:', message);

    const roomId = message.roomId || (message.content && message.content.roomId);

    if (
      (message.type === 'ROOM_CREATED' || message.type === 'ROOM_STATE') &&
      roomId &&
      !hasNavigatedRef.current
    ) {
      hasNavigatedRef.current = true; 
      console.log('Navigating to room:', roomId);
      router.push(`/room/${roomId}?name=${encodeURIComponent(roomName)}`);
    }
  }

  // 更新连接状态
  useEffect(() => {
    setIsConnected(connected);
  }, [connected]);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName) {
      setError('Please enter a room name');
      return;
    }

    if (!connected) {
      setError('Not connected to server. Please try again.');
      return;
    }

    try {
      sendMessage({
        type: 'CREATE_ROOM',
        content: {
          maxPlayers: playerCount,
        }
      });

    } catch (error) {
      setError('Failed to create game room. Please try again.');
      console.error("Error creating game room:", error);
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* 背景图 */}
      <img
        src="/gamesource/tile_background.png"
        alt="Splendor Background"
        style={{ 
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1
        }}
      />

      {/* Logo 在左上角 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10
      }}>
        <img
          src="/gamesource/splendor_logo.png"
          alt="Splendor Logo"
          width={500}
          style={{ height: 'auto' }}
        />
      </div>

      {/* 连接状态指示器 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '8px 12px',
        borderRadius: '4px',
        backgroundColor: isConnected ? 'rgba(0, 128, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)',
        color: 'white',
        fontWeight: 'bold',
        zIndex: 10
      }}>
        {isConnected ? 'Server Connected' : 'Server Disconnected'}
      </div>

      {/* 主内容区 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '0 20px'
      }}>
        <h1 style={{
          color: '#FFD700',
          fontSize: '2.5rem',
          marginBottom: '30px'
        }}>
          Create New Game
        </h1>

        {/* 表单容器 */}
        <div style={{
          backgroundColor: 'rgba(15, 33, 73, 0.7)',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '500px',
          width: '100%'
        }}>
          <form onSubmit={handleCreateGame}>
            {/* 房间名称 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: '#FFD700', 
                fontSize: '1.25rem',
                marginBottom: '8px'
              }}>
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Please input room name"
                style={{
                  width: '100%',
                  backgroundColor: '#0F2149',
                  border: '1px solid #FFD700',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '10px 15px'
                }}
              />
            </div>

            {/* 玩家数量 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                color: '#FFD700', 
                fontSize: '1.25rem',
                marginBottom: '8px'
              }}>
                Number of Players
              </label>
              <select
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#0F2149',
                  border: '1px solid #FFD700',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '10px 15px'
                }}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>

            {/* 错误信息 */}
            {error && (
              <div style={{ 
                color: 'red', 
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {/* 按钮区域 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '20px'
            }}>
              <button
                type="submit"
                disabled={!isConnected}
                style={{
                  backgroundColor: '#0F2149',
                  border: '2px solid #FFD700',
                  color: '#FFD700',
                  padding: '10px 25px',
                  borderRadius: '4px',
                  cursor: isConnected ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  opacity: isConnected ? 1 : 0.7
                }}
              >
                CREATE NEW GAME
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/lobby')}
                style={{
                  backgroundColor: '#0F2149',
                  border: '2px solid #FFD700',
                  color: '#FFD700',
                  padding: '10px 25px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                BACK
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGame;