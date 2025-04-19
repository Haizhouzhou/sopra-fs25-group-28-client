// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from "react";
import { getApiDomain } from '@/utils/domain';

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

// 单例模式的WebSocket服务，确保全局只有一个连接
class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private sessionId?: string;
  private userId?: number | string;
  private username?: string;
  private ready: boolean = false;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // 连接到WebSocket服务器
  connect(userId?: number | string, username?: string): Promise<boolean> {
    return new Promise((resolve) => {
      // 更详细的日志
      console.log(`Attempting to connect WebSocket with userId: ${userId}, username: ${username}`);
      
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log("WebSocket already connected");
        resolve(true);
        return;
      }
  
      // 如果没有有效的用户ID，生成一个临时ID
      const actualUserId = userId || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
      this.userId = actualUserId;
      this.username = username || 'Guest';
      
      // 生成唯一sessionId
      this.sessionId = `user-${actualUserId}-${Date.now()}`;
      console.log(`Generated sessionId: ${this.sessionId}`);
      
      // 本地测试用localhost，实际部署使用domain.ts中的域名
      const wsUrl = process.env.NODE_ENV === 'development' 
        ? "ws://localhost:8080/WebServer/" 
        : `ws://${getApiDomain()}/WebServer/`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        console.log('Current sessionId:', this.sessionId);
        console.log('Current userId:', this.userId);
        this.ready = true;
        this.notifyConnectionListeners(true);
        resolve(true);
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.ready = false;
        this.notifyConnectionListeners(false);
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.ready = false;
        resolve(false);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('Received message:', message);
          this.notifyMessageListeners(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    });
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.ready = false;
    }
  }

  // 创建游戏房间
  createRoom(maxPlayers: number, roomName?: string): void {
    this.sendMessage({
      type: 'CREATE_ROOM',
      content: { 
        maxPlayers,
        roomName 
      }
    });
  }

  // 加入游戏房间
  joinRoom(roomId: string): void {
    this.sendMessage({
      type: 'JOIN_ROOM',
      roomId: roomId,
      content: { 
        userId: this.userId,
        username: this.username 
      }
    });
  }

  // 离开游戏房间
  leaveRoom(roomId: string): void {
    this.sendMessage({
      type: 'LEAVE_ROOM',
      roomId: roomId
    });
  }

  // 更改玩家状态（准备/取消准备）
  changePlayerStatus(roomId: string): void {
    this.sendMessage({
      type: 'PLAYER_STATUS',
      roomId: roomId
    });
  }

  // 发送消息
  sendMessage(message: Omit<WebSocketMessage, "sessionId">): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // 构造完整消息
      const fullMessage = { 
        type: message.type, 
        roomId: message.roomId || null, 
        sessionId: this.sessionId || String(this.userId || ""), 
        content: message.content || null 
      };
      
      console.log("Sending WebSocket message:", fullMessage);
      this.socket.send(JSON.stringify(fullMessage));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  // 设置会话ID
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  // 添加消息监听器
  addMessageListener(listener: (message: WebSocketMessage) => void): void {
    // 检查是否已存在相同的监听器，避免重复添加
    const exists = this.messageListeners.some(l => l === listener);
    if (!exists) {
      this.messageListeners.push(listener);
    }
  }

  // 移除消息监听器
  removeMessageListener(listener: (message: WebSocketMessage) => void): void {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  // 添加连接状态监听器
  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }

  // 移除连接状态监听器
  removeConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.ready && this.socket?.readyState === WebSocket.OPEN;
  }

  // 通知所有消息监听器
  private notifyMessageListeners(message: WebSocketMessage): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  // 通知所有连接状态监听器
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }
}

// React Hook 包装器，方便在React组件中使用WebSocket服务
export function useWebSocket(sessionId: string, onMessage?: (msg: WebSocketMessage) => void) {
  const [connected, setConnected] = useState(false);
  const webSocketService = WebSocketService.getInstance();
  const userStr = typeof window !== 'undefined' ? localStorage.getItem("currentUser") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;
  const username = user?.name;

  useEffect(() => {
    // 设置会话ID
    webSocketService.setSessionId(sessionId);
    
    // 连接WebSocket
    webSocketService.connect(userId, username).then(connected => {
      setConnected(connected);
    });

    // 添加消息监听器
    const messageHandler = (message: WebSocketMessage) => {
      if (onMessage) {
        onMessage(message);
      }
    };
    webSocketService.addMessageListener(messageHandler);

    // 添加连接状态监听器
    const connectionHandler = (connected: boolean) => {
      setConnected(connected);
    };
    webSocketService.addConnectionListener(connectionHandler);

    // 清理函数
    return () => {
      webSocketService.removeMessageListener(messageHandler);
      webSocketService.removeConnectionListener(connectionHandler);
    };
  }, [sessionId, onMessage]);

  // 返回发送消息的函数和连接状态
  return {
    sendMessage: (msg: Omit<WebSocketMessage, "sessionId">) => webSocketService.sendMessage(msg),
    connected,
    webSocketService
  };
}

export default WebSocketService;