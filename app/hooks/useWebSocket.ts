import { useEffect, useState, useRef } from "react";
import { getApiWsDomain } from "@/utils/domain";
import useLocalStorage from "@/hooks/useLocalStorage";

export type WebSocketMessage = {
  type: string;
  roomId?: string;
  sessionId?: string;
  content?: any;
  players?: any[]; 
  ownerId?: number | string;
  ownerName?: string;
  roomName?: string; // 添加roomName字段
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
  
  // 在 connect 方法中添加检查
  async connect(token?: string): Promise<boolean> {
    // 如果已经有连接且状态正常，直接返回
    if (this.socket && 
        (this.socket.readyState === WebSocket.OPEN || 
         this.socket.readyState === WebSocket.CONNECTING)) {
      console.log("[WebSocket] Already connected or connecting");
      return this.ready;
    }
    console.log("[WebSocket] ⏳ Starting connection...");
    await Promise.resolve();

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

// 修改useWebSocket钩子
export function useWebSocket(sessionId: string, onMessage?: (msg: WebSocketMessage) => void) {
  const { value: token } = useLocalStorage<string>("token", "");
  const [connected, setConnected] = useState(false);
  const webSocketService = WebSocketService.getInstance();
  const onMessageRef = useRef(onMessage);
  
  // 更新引用，避免不必要的重连
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // 只在组件挂载和token/sessionId变化时连接
  useEffect(() => {
    if (!token) return;
    
    console.log("准备连接WebSocket，sessionId:", sessionId);
    
    let isActive = true; // 跟踪此效果是否活跃
    webSocketService.setSessionId(sessionId);
    
    const connectWebSocket = async () => {
      if (webSocketService.isConnected()) {
        console.log("WebSocket已连接，不需要重新连接");
        setConnected(true);
        return;
      }
      
      const success = await webSocketService.connect(token);
      if (isActive) {
        setConnected(success);
      }
    };
    
    connectWebSocket();

    const handleMessage = (msg: WebSocketMessage) => {
      if (isActive && onMessageRef.current) {
        onMessageRef.current(msg);
      }
    };
    
    webSocketService.addMessageListener(handleMessage);

    return () => {
      isActive = false;
      console.log("移除WebSocket监听器:", sessionId);
      webSocketService.removeMessageListener(handleMessage);
      // 注意：不要在这里关闭连接，因为其他组件可能正在使用它
    };
  }, [sessionId, token]); // 移除不必要的依赖

  return {
    sendMessage: webSocketService.sendMessage.bind(webSocketService),
    connected,
    webSocketService
  };
}

export default WebSocketService;