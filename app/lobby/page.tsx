"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import WebSocketService, { WebSocketMessage } from '@/hooks/useWebSocket';

interface GameRoom {
  id: string;
  name: string;
  owner: string;
  players: string;
  isReady: boolean;
}

interface User {
  id: number;
  name: string;
  avatar: string;
}

const GameLobby: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('Received message in lobby:', message);

    if (message.type === 'ROOM_LIST') {
      const roomInfos = message.content || [];
      const parsedRooms: GameRoom[] = roomInfos.map((room: any) => ({
        id: room.roomId,
        name: room.roomName,
        owner: room.owner || 'Unknown',
        players: `${room.players}/${room.maxPlayers || 4}`,
        isReady: false
      }));
      setGameRooms(parsedRooms);
    } else if (message.type === 'ROOM_JOINED') {
      const roomId = message.roomId;
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    }
  }, [router]);

  const fetchGameRooms = useCallback(() => {
    if (!isConnected) return;
    WebSocketService.getInstance().sendMessage({
      type: "GET_ROOMS",
      content: {}
    });
  }, [isConnected]);

  useEffect(() => {
    const initializeConnection = async () => {
      setIsLoading(true);
      try {
        const userStr = localStorage.getItem("currentUser");
        if (!userStr) return router.push('/');

        const user = JSON.parse(userStr);
        if (!user || !user.id) return router.push('/');

        setCurrentUser({
          id: user.id,
          name: user.name,
          avatar: user.avatar || "a_01.png"
        });

        const websocketService = WebSocketService.getInstance();
        const connected = await websocketService.connect(user.id, user.name);
        setIsConnected(connected);

        websocketService.addMessageListener(handleWebSocketMessage);

        if (connected) {
          setTimeout(() => {
            websocketService.sendMessage({ type: "GET_ROOMS", content: {} });
          }, 300);
        }
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnection();

    return () => {
      WebSocketService.getInstance().removeMessageListener(handleWebSocketMessage);
    };
  }, [router, handleWebSocketMessage]);

  const handleJoinGame = () => {
    if (!selectedRoom || !isConnected) return;
    WebSocketService.getInstance().sendMessage({
      type: 'JOIN_ROOM',
      roomId: selectedRoom
    });
  };

  const handleCreateGame = () => {
    router.push('/create');
  };

  const handleLogout = () => {
    WebSocketService.getInstance().disconnect();
    clearToken();
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  const handleProfileClick = () => {
    if (currentUser) {
      router.push(`/users/${currentUser.id}`);
    }
  };

  const handleRefreshRooms = () => {
    fetchGameRooms();
  };

  if (isLoading) {
    return <div style={{ backgroundColor: '#0F2149', color: '#FFD700', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
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
                <img src={`/avatar/${currentUser.avatar}`} alt="Avatar" style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid #FFD700' }} />
                <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.3rem' }}>{currentUser.name}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '20px' }}>
              <button onClick={handleProfileClick} style={{ border: '2px solid #FFD700', color: '#FFD700', padding: '8px 20px', borderRadius: '4px', backgroundColor: '#0F2149' }}>PROFILE</button>
              <button onClick={handleLogout} style={{ border: '2px solid #FFD700', color: '#FFD700', padding: '8px 20px', borderRadius: '4px', backgroundColor: '#0F2149' }}>LOG OUT</button>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 33, 73, 0.7)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button onClick={handleRefreshRooms} style={{ backgroundColor: '#0F2149', border: '1px solid #FFD700', color: '#FFD700', padding: '4px 12px', borderRadius: 4 }}>REFRESH</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #FFD700', padding: '8px 0', color: '#FFD700', fontWeight: 'bold' }}>
            <div>Room Id</div>
            <div>Room Name</div>
            <div>Owner</div>
            <div>Players</div>
          </div>

          {gameRooms.length > 0 ? gameRooms.map((room) => (
            <div key={room.id} onClick={() => setSelectedRoom(room.id)} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '12px 0', color: 'white', backgroundColor: selectedRoom === room.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent', cursor: 'pointer' }}>
              <div>{room.id}</div>
              <div>{room.name}</div>
              <div>{room.owner}</div>
              <div>{room.players}</div>
            </div>
          )) : <div style={{ padding: 20, textAlign: 'center', color: 'white' }}>No rooms available. Create a new game!</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <button onClick={handleJoinGame} disabled={!selectedRoom || !isConnected} style={{ backgroundColor: '#0F2149', border: '2px solid #FFD700', color: '#FFD700', padding: '12px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: (!selectedRoom || !isConnected) ? 'not-allowed' : 'pointer', opacity: (!selectedRoom || !isConnected) ? 0.7 : 1 }}>JOIN GAME</button>
          <button onClick={handleCreateGame} disabled={!isConnected} style={{ backgroundColor: '#0F2149', border: '2px solid #FFD700', color: '#FFD700', padding: '12px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: isConnected ? 'pointer' : 'not-allowed', opacity: isConnected ? 1 : 0.7 }}>CREATE NEW GAME</button>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
