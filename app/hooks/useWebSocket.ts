import { useEffect, useState } from "react";
import { getApiWsDomain } from '@/utils/domain';
import useLocalStorage from "@/hooks/useLocalStorage";

export type WebSocketMessage = {
  type: string;
  roomId?: string;
  sessionId?: string;
  content?: any;
};

export type RoomInfo = {
  maxPlayers: number;
  currentPlayers: number;
  isReady: boolean;
  players: PlayerInfo[];
};

export type PlayerInfo = {
  name: string;
  room_status: boolean;
};

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private sessionId?: string;
  private userId?: number | string;
  private username?: string;       // 登录名
  private displayName?: string;    // 昵称（name）
  private ready: boolean = false;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  async connect(token?: string): Promise<boolean> {
    console.log("[WebSocket] ⏳ Starting connection...");

    const userStr = typeof window !== 'undefined' ? localStorage.getItem("currentUser") : null;
    const localUser = userStr ? JSON.parse(userStr) : null;

    this.userId = localUser?.id || `guest-${Date.now()}`;
    this.username = localUser?.username || `guest-${Date.now()}`;
    this.displayName = localUser?.name || 'Guest';
    this.sessionId = `user-${this.userId}-${Date.now()}`;

    const wsToken = token || localStorage.getItem("token") || `guest-${Date.now()}`;
    const wsUrl = `${getApiWsDomain()}/WebServer/${wsToken}`;
    this.socket = new WebSocket(wsUrl);

    return new Promise((resolve) => {
      this.socket!.onopen = () => {
        console.log('[WebSocket] ✅ Connected as', this.displayName);
        this.ready = true;
        this.notifyConnectionListeners(true);
        resolve(true);
      };

      this.socket!.onclose = () => {
        console.log('[WebSocket] ❌ Disconnected');
        this.ready = false;
        this.notifyConnectionListeners(false);
      };

      this.socket!.onerror = (error) => {
        console.error('[WebSocket] 🛑 Error:', error);
        this.ready = false;
        resolve(false);
      };

      this.socket!.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.notifyMessageListeners(message);
        } catch (err) {
          console.error('[WebSocket] ❓ Message parse error:', err);
        }
      };
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.ready = false;
    }
  }

  sendMessage(message: Partial<WebSocketMessage> & { type: string }): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const fullMessage = {
        type: message.type,
        roomId: message.roomId || null,
        sessionId: this.sessionId || String(this.userId || ""),
        content: {
          ...message.content,
          displayName: this.displayName  // ✅ 改为 displayName
        }
      };
      this.socket.send(JSON.stringify(fullMessage));
    } else {
      console.warn("[WebSocket] Not connected");
    }
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  addMessageListener(listener: (message: WebSocketMessage) => void): void {
    if (!this.messageListeners.includes(listener)) {
      this.messageListeners.push(listener);
    }
  }

  removeMessageListener(listener: (message: WebSocketMessage) => void): void {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }

  removeConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  isConnected(): boolean {
    return this.ready && this.socket?.readyState === WebSocket.OPEN;
  }

  private notifyMessageListeners(message: WebSocketMessage): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }
}

export function useWebSocket(sessionId: string, onMessage?: (msg: WebSocketMessage) => void) {
  const { value: token } = useLocalStorage<string>("token", "");
  const [connected, setConnected] = useState(false);
  const webSocketService = WebSocketService.getInstance();

  useEffect(() => {
    if (!token) return;

    webSocketService.setSessionId(sessionId);
    webSocketService.connect(token).then(setConnected);

    const handler = (msg: WebSocketMessage) => onMessage?.(msg);
    const connHandler = (isConn: boolean) => setConnected(isConn);

    webSocketService.addMessageListener(handler);
    webSocketService.addConnectionListener(connHandler);

    return () => {
      webSocketService.removeMessageListener(handler);
      webSocketService.removeConnectionListener(connHandler);
    };
  }, [sessionId, token, onMessage]);

  return {
    sendMessage: (msg: Omit<WebSocketMessage, "sessionId">) => webSocketService.sendMessage(msg),
    connected,
    webSocketService
  };
}

export default WebSocketService;
