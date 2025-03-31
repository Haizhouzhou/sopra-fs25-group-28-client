"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

// 游戏房间类型定义
interface GameRoom {
  id: number;
  name: string;
  owner: string;
  players: string; // 例如 "2/4" 表示当前2名玩家，最多4名
}

const GameLobby: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [username, setUsername] = useState<string>('');
  
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");

  // 获取游戏房间列表
  useEffect(() => {
    const fetchGameRooms = async () => {
      try {
        // 实际项目中从API获取游戏房间列表
        // const response = await apiService.get<GameRoom[]>("/games");
        // setGameRooms(response);
        
        // 模拟数据
        setGameRooms([
          { id: 1, name: "Tom's Game", owner: "Tom", players: "1/4" },
          { id: 2, name: "Jeanette's Game", owner: "Jeanette", players: "2/4" }
        ]);
      } catch (error) {
        console.error("Failed to fetch game rooms:", error);
      }
    };

  }, [router, token, apiService]);

  // 加入游戏
  const handleJoinGame = async () => {
    if (selectedRoom === null) {
      alert("Please select a game room first");
      return;
    }

    try {
      // 实际项目中调用API加入游戏
      // await apiService.post(`/games/${selectedRoom}/join`);
      
      // 导航到游戏房间
      router.push(`/room/${selectedRoom}`);
    } catch (error) {
      console.error("Failed to join game:", error);
      alert("Failed to join the game. Please try again.");
    }
  };

  // 创建新游戏
  const handleCreateGame = () => {
    router.push('/create');
  };

  // 登出
  const handleLogout = () => {
    clearToken();
    router.push('/');
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
        style={{ height: 'auto' }} // 移除固定高度，使其自动保持比例
        />
      </div>

      {/* 主内容区 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '200px 20px 20px',
      }}>
        {/* 顶部导航栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 style={{
            color: '#FFD700',
            fontSize: '2.5rem',
            margin: 0
          }}>
            Game Lobby
          </h1>
          
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#0F2149',
              border: '2px solid #FFD700',
              color: '#FFD700',
              padding: '8px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            LOG OUT
          </button>
        </div>

        {/* 游戏房间列表 */}
        <div style={{
          backgroundColor: 'rgba(15, 33, 73, 0.7)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          {/* 表头 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderBottom: '1px solid #FFD700',
            padding: '8px 0',
            color: '#FFD700',
            fontWeight: 'bold'
          }}>
            <div>Room Id</div>
            <div>Room Name</div>
            <div>Owner Name</div>
            <div>Players</div>
          </div>

          {/* 房间列表 */}
          {gameRooms.map((room) => (
            <div 
              key={room.id} 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                padding: '12px 0',
                color: 'white',
                backgroundColor: selectedRoom === room.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onClick={() => setSelectedRoom(room.id)}
            >
              <div>{room.id}</div>
              <div>{room.name}</div>
              <div>{room.owner}</div>
              <div>{room.players}</div>
            </div>
          ))}
        </div>

        {/* 按钮区域 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <button
            onClick={handleJoinGame}
            disabled={selectedRoom === null}
            style={{
              backgroundColor: '#0F2149',
              border: '2px solid #FFD700',
              color: '#FFD700',
              padding: '12px 30px',
              borderRadius: '4px',
              cursor: selectedRoom === null ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: selectedRoom === null ? 0.7 : 1
            }}
          >
            JOIN GAME
          </button>
          
          <button
            onClick={handleCreateGame}
            style={{
              backgroundColor: '#0F2149',
              border: '2px solid #FFD700',
              color: '#FFD700',
              padding: '12px 30px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            CREATE NEW GAME
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;