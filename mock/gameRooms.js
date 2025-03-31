// 模拟游戏房间服务
const mockGameRooms = {
    // 初始游戏房间
    rooms: [
      { id: 1, name: "Tom's Game", owner: "user1", maxPlayers: 4, currentPlayers: ["user1"], status: "waiting" },
      { id: 2, name: "Jeanette's Game", owner: "user2", maxPlayers: 4, currentPlayers: ["user2", "user1"], status: "waiting" }
    ],
    
    // 初始化
    init() {
      if (typeof window !== 'undefined') {
        if (!localStorage.getItem('gameRooms')) {
          localStorage.setItem('gameRooms', JSON.stringify(this.rooms));
        }
      }
    },
    
    // 获取所有房间
    getAllRooms() {
      if (typeof window === 'undefined') return [];
      
      const rooms = JSON.parse(localStorage.getItem('gameRooms') || '[]');
      
      // 格式化为前端显示格式
      return rooms.map(room => ({
        id: room.id,
        name: room.name,
        owner: room.owner,
        players: `${room.currentPlayers.length}/${room.maxPlayers}`
      }));
    },
    
    // 创建房间
    createRoom(name, maxPlayers, username) {
      if (typeof window === 'undefined') return null;
      
      const rooms = JSON.parse(localStorage.getItem('gameRooms') || '[]');
      
      const newRoom = {
        id: rooms.length + 1,
        name,
        owner: username,
        maxPlayers,
        currentPlayers: [username],
        status: "waiting"
      };
      
      rooms.push(newRoom);
      localStorage.setItem('gameRooms', JSON.stringify(rooms));
      return newRoom;
    },
    
    // 加入房间
    joinRoom(roomId, username) {
      if (typeof window === 'undefined') return null;
      
      const rooms = JSON.parse(localStorage.getItem('gameRooms') || '[]');
      const roomIndex = rooms.findIndex(r => r.id === roomId);
      
      if (roomIndex === -1) {
        throw new Error('Room not found');
      }
      
      const room = rooms[roomIndex];
      
      // 检查是否已满
      if (room.currentPlayers.length >= room.maxPlayers) {
        throw new Error('Room is full');
      }
      
      // 检查用户是否已在房间
      if (room.currentPlayers.includes(username)) {
        return room; // 用户已在房间中
      }
      
      room.currentPlayers.push(username);
      rooms[roomIndex] = room;
      localStorage.setItem('gameRooms', JSON.stringify(rooms));
      return room;
    },
    
    // 获取房间详情
    getRoomDetails(roomId) {
      if (typeof window === 'undefined') return null;
      
      const rooms = JSON.parse(localStorage.getItem('gameRooms') || '[]');
      return rooms.find(r => r.id === parseInt(roomId));
    }
  };
  
  // 检查环境 - 只在客户端初始化
  if (typeof window !== 'undefined') {
    mockGameRooms.init();
  }
  
  export default mockGameRooms;