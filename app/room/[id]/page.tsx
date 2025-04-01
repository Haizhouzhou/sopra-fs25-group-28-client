"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

// 类型定义
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

interface PageProps {
  params: {
    id: string;
  };
}

const GameRoom = ({ params }: PageProps) => {
  const roomId = params.id;
  const router = useRouter();
  const apiService = useApi();
  const searchParams = useSearchParams();

  const rawName = searchParams.get("name");
  const roomName = rawName && !rawName.startsWith("Room #")
    ? rawName
    : `Room #${roomId}`;

  const [players, setPlayers] = useState<Player[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: username } = useLocalStorage<string>("username", "");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  const isCurrentUser = (player: Player) => String(player.id) === String(currentUser.id);
  const isOwnerFromParam = searchParams.get("owner") === "true";

  // 加载 mock 玩家
  useEffect(() => {
    const isTestRoom = roomId === "999"; // 房间 ID 为 999 则是测试房间
    const isOwnerFromMock = !isTestRoom; // 如果是测试房间就不是 owner
    const mockPlayers: Player[] = [
      { id: '101', name: 'Tom', isReady: true, avatar: 'a_02.png', isOwner: isTestRoom},
      { id: '102', name: 'Jeanette', isReady: true, avatar: 'a_03.png' },
      { id: '103', name: 'Jack', isReady: true, avatar: 'a_04.png' },
      {
        id: String(currentUser.id || "0"),
        name: currentUser.name || 'You',
        avatar: currentUser.avatar || 'a_01.png',
        isReady: false,
        isOwner: isOwnerFromMock
      }
    ];

    setPlayers(mockPlayers);
    setIsOwner(isOwnerFromMock);

    setMessages([
      { player: 'Jeanette', text: 'Hello ~', timestamp: Date.now() - 60000 },
      { player: 'Tom', text: 'Hello everyone!', timestamp: Date.now() - 45000 },
      { player: 'Jack', text: 'Good Luck and have fun!', timestamp: Date.now() - 30000 }
    ]);
  }, [roomId]);

  // 更新准备状态与房主判断
  useEffect(() => {
    const nonOwnerPlayers = players.filter(p => !p.isOwner);
    setAllPlayersReady(nonOwnerPlayers.length > 0 && nonOwnerPlayers.every(p => p.isReady));

    if (!isOwner) {
      const me = players.find(p => isCurrentUser(p));
      if (me) setIsReady(me.isReady);
    }
  }, [players]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      player: currentUser.name || "You",
      text: newMessage.trim(),
      timestamp: Date.now()
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleReady = () => {
    if (isOwner) return;

    const newReady = !isReady;
    setIsReady(newReady);

    const updatedPlayers = players.map(p =>
      isCurrentUser(p) && !p.isOwner ? { ...p, isReady: newReady } : p
    );
    setPlayers(updatedPlayers);
  };

  const handleStartGame = () => {
    if (isOwner && allPlayersReady) {
      router.push(`/game/${roomId}`);
    }
  };

  const handleLeaveRoom = () => {
    router.push('/lobby');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
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
      <div style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 10 }}>
        <img src="/gamesource/splendor_logo.png" alt="Splendor Logo" width={150} style={{ height: 'auto' }} />
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '120px 20px 20px'
      }}>
        <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>
          {/* Chat */}
          <div style={{
            width: '60%',
            backgroundColor: 'rgba(15, 33, 73, 0.7)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', color: 'white' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#FFD700' }}>{msg.player}: </span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
              <input
                type="text"
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
              <button type="submit" style={{
                backgroundColor: '#0F2149',
                border: '1px solid #FFD700',
                borderLeft: 'none',
                color: '#FFD700',
                padding: '8px 16px',
                borderRadius: '0 4px 4px 0',
                cursor: 'pointer'
              }}>
                Send
              </button>
            </form>
          </div>

          {/* Players */}
          <div style={{
            width: '40%',
            backgroundColor: 'rgba(15, 33, 73, 0.7)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{
              color: '#FFD700',
              marginTop: 0,
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Room - {roomName}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              {players.map((player) => (
                <div key={player.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={`/avatar/${player.avatar || 'a_01.png'}`}
                      alt="Avatar"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2px solid #FFD700'
                      }}
                    />
                    <div>
                      {player.name} {player.isOwner ? '(Owner)' : ''}
                      {isCurrentUser(player) ? ' (You)' : ''}
                    </div>
                  </div>
                  {!player.isOwner && (
                    <div style={{
                      color: player.isReady ? '#4CAF50' : '#F44336',
                      fontWeight: 'bold'
                    }}>
                      {player.isReady ? 'READY' : 'NOT READY'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 控制按钮 */}
            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                {isOwner ? (
                  <button
                    onClick={handleStartGame}
                    disabled={!allPlayersReady}
                    style={{
                      flex: 1,
                      backgroundColor: '#0F2149',
                      border: '2px solid #FFD700',
                      color: '#FFD700',
                      padding: '12px',
                      borderRadius: '4px',
                      cursor: allPlayersReady ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    {allPlayersReady ? 'START GAME' : 'Wait for all players ready'}
                  </button>
                ) : (
                  <button
                    onClick={handleReady}
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
                    {isReady ? 'CANCEL READY' : 'READY!'}
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

export default GameRoom;
