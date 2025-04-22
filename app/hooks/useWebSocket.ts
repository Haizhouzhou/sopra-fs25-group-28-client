import { useEffect, useState } from "react";
import { getApiWsDomain } from "@/utils/domain";
import useLocalStorage from "@/hooks/useLocalStorage";

export type WebSocketMessage = {
  type: string;
  roomId?: string;
  sessionId?: string;
  content?: any;
  players?: any[]; // 添加这一行
  ownerId?: number | string; // 可能也需要这个
  ownerName?: string; // 可能也需要这个
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
  avatar?: string;
  userId?: string | number;
};

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private sessionId?: string;
  private userId?: number | string;
  private username?: string;       // 登录用用户名
  private displayName?: string;    // 显示名（昵称）
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

    const rawToken = token || localStorage.getItem("token") || "";
    const wsToken = typeof rawToken === "string" ? rawToken.replace(/"/g, "") : "";
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
          console.log('[WebSocket] Received raw message:', event.data.substring(0, 200));
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('[WebSocket] Parsed message:', message);
          this.notifyMessageListeners(message);
        } catch (err) {
          console.error('[WebSocket] Message parse error:', err, 'Raw data:', event.data.substring(0, 200));
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
    if (!message.type) {
      console.error("Cannot send message without type:", message);
      return;
    }
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // 处理PLAYER_STATUS消息
      if (message.type === "PLAYER_STATUS") {
        const content = message.content || {};
        const statusMessage = {
          type: message.type,
          roomId: message.roomId,
          sessionId: this.sessionId,
          content: {
            userId: content.userId,     // 保持在content中
            status: content.status,     // 保持在content中
            displayName: this.displayName,
            avatar: this.getAvatar()
          }
        };
        console.log("Sending PLAYER_STATUS message:", statusMessage);
        this.socket.send(JSON.stringify(statusMessage));
        return;
      }
      
      // For all other message types
      const baseContent = message.content || {};
      const fullMessage = {
        type: message.type,
        roomId: message.roomId || null,
        sessionId: this.sessionId || String(this.userId || ""),
        content: {
          ...baseContent,
          displayName: this.displayName,
          avatar: this.getAvatar()
        }
      };
      console.log("Sending WebSocket message:", fullMessage);
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

  private getAvatar(): string {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem("currentUser") : null;
    const localUser = userStr ? JSON.parse(userStr) : null;
    return localUser?.avatar || 'a_01.png';
  }
}

export function useWebSocket(sessionId: string, onMessage?: (msg: WebSocketMessage) => void) {
  const { value: token } = useLocalStorage<string>("token", "");
  const [connected, setConnected] = useState(false);
  const webSocketService = WebSocketService.getInstance();

  useEffect(() => {
    if (!token) return;

    webSocketService.setSessionId(sessionId);
    
    const connectWebSocket = async () => {
      const success = await webSocketService.connect(token);
      setConnected(success);
      
      if (success) {
        console.log("WebSocket connection established with session ID:", sessionId);
      } else {
        console.error("WebSocket connection failed");
      }
    };
    
    connectWebSocket();

    const handler = (msg: WebSocketMessage) => {
      console.log("WebSocket message received in hook:", msg.type);
      onMessage?.(msg);
    };
    
    const connHandler = (isConn: boolean) => {
      console.log("WebSocket connection status changed:", isConn);
      setConnected(isConn);
    };

    webSocketService.addMessageListener(handler);
    webSocketService.addConnectionListener(connHandler);

    return () => {
      console.log("Cleaning up WebSocket listeners");
      webSocketService.removeMessageListener(handler);
      webSocketService.removeConnectionListener(connHandler);
    };
  }, [sessionId, token, onMessage]);

  const sendMessageWithLogging = (msg: Omit<WebSocketMessage, "sessionId">) => {
    console.log("Sending message via useWebSocket hook:", msg);
    webSocketService.sendMessage(msg);
  };

  return {
    sendMessage: sendMessageWithLogging,
    connected,
    webSocketService
  };
}

export default WebSocketService;