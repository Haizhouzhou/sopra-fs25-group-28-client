"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import WebSocketService, { WebSocketMessage } from "@/hooks/useWebSocket";
import { useParams } from 'next/navigation';

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

  const rawName = searchParams.get("name");
  const roomName = rawName && !rawName.startsWith("Room #") ? rawName : `Room #${roomId}`;

  const { value: token } = useLocalStorage<string>("token", "");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleWebSocketMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === "ROOM_STATE" && msg.content?.players) {
      const ownerId = msg.content.ownerId;
      const updatedPlayers = msg.content.players.map((player: any) => ({
        id: player.userId,
        name: player.name,
        isReady: Boolean(player.room_status),
        isOwner: String(player.userId) === String(ownerId),
        avatar: player.avatar || 'a_01.png'
      }));
      setPlayers(updatedPlayers);

      if (currentUser) {
        const isUserOwner = String(currentUser.id) === String(ownerId);
        setIsOwner(isUserOwner);
        const me = updatedPlayers.find((p: Player) => String(p.id) === String(currentUser.id));
        setIsReady(me?.isReady || false);
      }

      const nonOwners = updatedPlayers.filter((p: Player) => !p.isOwner);
      setAllPlayersReady(nonOwners.length > 0 && nonOwners.every((p: Player) => p.isReady));      
    }

    if (msg.type === "GAME_STATE") {
      router.push(`/game/${roomId}`);
    }

    if (msg.type === "CHAT_MESSAGE") {
      const chatMsg = {
        player: msg.content.player || "Anonymous",
        text: msg.content.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, chatMsg]);
    }
  }, [roomId, currentUser]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem("currentUser");
        if (!userStr) return router.push("/");

        const user = JSON.parse(userStr);
        if (!user?.id) return router.push("/");

        setCurrentUser({ id: user.id, name: user.name, avatar: user.avatar || "a_01.png" });

        const ws = WebSocketService.getInstance();
        const connected = await ws.connect(user.id, user.name);
        setIsConnected(connected);
        ws.addMessageListener(handleWebSocketMessage);

        if (connected) {
          ws.sendMessage({
            type: "JOIN_ROOM",
            roomId,
            content: {
              userId: user.id,
              name: user.name
            }
          });
        }
      } catch (err) {
        console.error("init error", err);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
    return () => WebSocketService.getInstance().removeMessageListener(handleWebSocketMessage);
  }, []);

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

  const handleReady = () => {
    if (isOwner || !currentUser || !isConnected) return;
    WebSocketService.getInstance().sendMessage({
      type: "PLAYER_STATUS",
      roomId,
      content: {
        userId: currentUser.id,
        status: !isReady
      }
    });
    setIsReady(!isReady);
  };

  const handleStartGame = () => {
    if (!isOwner || !allPlayersReady || !isConnected) return;
    WebSocketService.getInstance().sendMessage({
      type: "START_GAME",
      roomId
    });
  };

  const handleLeaveRoom = () => {
    if (isConnected && currentUser) {
      WebSocketService.getInstance().sendMessage({
        type: "LEAVE_ROOM",
        roomId,
        content: { userId: currentUser.id }
      });
    }
    setTimeout(() => router.push("/lobby"), 500);
  };

  if (isLoading || !currentUser) {
    return <div style={{ background: "#0F2149", color: "#FFD700", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Loading...</div>;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      <img src="/gamesource/tile_background.png" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }} />

      <div style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 10 }}>
        <img src="/gamesource/splendor_logo.png" width={150} />
      </div>

      <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 12px', borderRadius: '4px', backgroundColor: isConnected ? 'rgba(0,128,0,0.7)' : 'rgba(255,0,0,0.7)', color: 'white', fontWeight: 'bold', zIndex: 10 }}>
        {isConnected ? 'Server Connected' : 'Server Disconnected'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '1000px', margin: '0 auto', padding: '120px 20px 20px' }}>
        <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>
          <div style={{ width: '60%', backgroundColor: 'rgba(15,33,73,0.7)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', color: 'white' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#FFD700' }}>{msg.player}: </span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." style={{ flex: 1, backgroundColor: '#0F2149', border: '1px solid #FFD700', color: 'white', padding: '8px 12px', borderRadius: '4px 0 0 4px' }} />
              <button type="submit" disabled={!isConnected} style={{ backgroundColor: '#0F2149', border: '1px solid #FFD700', borderLeft: 'none', color: '#FFD700', padding: '8px 16px', borderRadius: '0 4px 4px 0', cursor: isConnected ? 'pointer' : 'not-allowed', opacity: isConnected ? 1 : 0.7 }}>Send</button>
            </form>
          </div>

          <div style={{ width: '40%', backgroundColor: 'rgba(15,33,73,0.7)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: '#FFD700', marginTop: 0, marginBottom: '16px', textAlign: 'center' }}>Room - {roomName}</h2>

            <div style={{ marginBottom: '20px' }}>
              {players.map((player) => (
                <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid rgba(255,215,0,0.3)', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={`/avatar/${player.avatar || 'a_01.png'}`} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #FFD700' }} />
                    <div>
                      {player.name} {player.isOwner ? '(Owner)' : ''} {String(currentUser?.id) === String(player.id) ? '(You)' : ''}

                    </div>
                  </div>
                  {!player.isOwner && (
                    <div style={{ color: player.isReady ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                      {player.isReady ? 'READY' : 'NOT READY'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                {isOwner ? (
                  <button onClick={handleStartGame} disabled={!allPlayersReady || !isConnected} style={{ flex: 1, backgroundColor: '#0F2149', border: '2px solid #FFD700', color: '#FFD700', padding: '12px', borderRadius: '4px', cursor: allPlayersReady && isConnected ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: allPlayersReady && isConnected ? 1 : 0.7 }}>START GAME</button>
                ) : (
                  <button onClick={handleReady} disabled={!isConnected} style={{ flex: 1, backgroundColor: '#0F2149', border: '2px solid #FFD700', color: '#FFD700', padding: '12px', borderRadius: '4px', cursor: isConnected ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: isConnected ? 1 : 0.7 }}>{isReady ? 'CANCEL READY' : 'READY'}</button>
                )}
                <button onClick={handleLeaveRoom} style={{ flex: 1, backgroundColor: '#0F2149', border: '2px solid #FFD700', color: '#FFD700', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>QUIT GAME</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoomClient;
