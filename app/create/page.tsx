"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

const CreateGame: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [roomName, setRoomName] = useState('');
  const [playerCount, setPlayerCount] = useState(4);
  const [error, setError] = useState('');
  
  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName) {
      setError('Please enter a room name');
      return;
    }

    try {
      // 实际项目中调用API创建游戏房间
      // const response = await apiService.post("/games", { 
      //   name: roomName, 
      //   maxPlayers: playerCount 
      // });
      // const newRoomId = response.id;
      
      // 模拟创建房间
      const newRoomId = Math.floor(Math.random() * 1000) + 3;
      console.log('Created game room:', { id: newRoomId, name: roomName, playerCount });
      
      // 重定向到新创建的游戏房间
      router.push(`/room/${newRoomId}`);
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
          height={200}
        />
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