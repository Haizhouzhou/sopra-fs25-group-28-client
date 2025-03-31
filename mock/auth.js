// 模拟认证服务
const mockAuth = {
    // 初始用户
    users: [
      { id: 1, username: "user1", password: "password1", name: "User One" },
      { id: 2, username: "user2", password: "password2", name: "User Two" }
    ],
    
    // 初始化 - 将用户数据存储到 localStorage
    init() {
      if (typeof window !== 'undefined') {
        if (!localStorage.getItem('users')) {
          localStorage.setItem('users', JSON.stringify(this.users));
        }
      }
    },
    
    // 注册
    register(username, password, name) {
      if (typeof window === 'undefined') return null;
      
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // 检查用户名是否已存在
      if (users.some(u => u.username === username)) {
        throw new Error('Username already exists');
      }
      
      // 创建新用户
      const newUser = {
        id: users.length + 1,
        username,
        password,
        name
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // 返回用户信息和模拟令牌
      const token = `mock-token-${Date.now()}`;
      localStorage.setItem('currentUser', JSON.stringify({ ...newUser, token }));
      return { ...newUser, token };
    },
    
    // 登录
    login(username, password) {
      if (typeof window === 'undefined') return null;
      let users = JSON.parse(localStorage.getItem('users') || '[]');

      if (users.length === 0) {
        users = [
          { id: 1, username: "user1", password: "password1", name: "User One" },
          { id: 2, username: "user2", password: "password2", name: "User Two" }
        ];
        localStorage.setItem('users', JSON.stringify(users));
      }

      const user = users.find(u => u.username === username && u.password === password);

      
      if (!user) {
        throw new Error('Invalid username or password');
      }
      
      // 返回用户信息和模拟令牌
      const token = `mock-token-${Date.now()}`;
      localStorage.setItem('token', token);
      return { ...user, token };
    },
    
    // 检查是否已登录
    isLoggedIn() {
      if (typeof window === 'undefined') return false;
      return !!localStorage.getItem('currentUser');
    },
    
    // 获取当前用户信息
    getCurrentUser() {
      if (typeof window === 'undefined') return null;
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    },
    
    // 登出
    logout() {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('currentUser');
    }
  };
  
  // 检查环境 - 只在客户端初始化
  if (typeof window !== 'undefined') {
    mockAuth.init();
  }
  
  export default mockAuth;