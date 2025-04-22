"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { LoginTokenGetDTO } from "@/types/api";
import type { UserListGetDTO } from "@/types/user";
import { Form, Input } from "antd";

interface FormFieldProps {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();

  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setCurrentUser } = useLocalStorage<UserListGetDTO>("currentUser", {} as UserListGetDTO);
  const { set: setUsername } = useLocalStorage<string>("username", "");

  const handleLogin = async (values: FormFieldProps) => {
    try {
      const { token } = await apiService.put<LoginTokenGetDTO>("/login", values);
      if (!token) throw new Error("登录失败，token 为空");
  
      // 🔐 写入 token
      setToken(token);
  
      // 获取当前用户信息
      const users = await apiService.get<UserListGetDTO[]>("/users");
      const me = users.find((u) => u.username === values.username);
      if (me) {
        setCurrentUser(me); // 存入 localStorage
      }
      if (!me) throw new Error("未找到用户信息");
  
      // 👇 确保用户信息写入 localStorage
      setCurrentUser(me);
      setUsername(me.username);

      setTimeout(() => {
        router.push("/lobby");
      }, 100);
  
      // ✅ 跳转前做一次确认（可选）
      console.log("[Login] 设置成功，跳转 /lobby");
  
      // 🚀 跳转
      router.push("/lobby");
    } catch (error) {
      if (error instanceof Error) {
        alert(`登录失败：\n${error.message}`);
        console.error(error.message);
      } else {
        console.error("未知错误：", error);
      }
    }
  };
  

  const goBack = () => {
    router.push("/");
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* 背景图 */}
      <img
        src="/gamesource/tile_background.png"
        alt="Splendor Background"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }}
      />

      {/* Logo 在左上角 */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
        <img src="/gamesource/splendor_logo.png" alt="Splendor Logo" width={500} height={200} />
      </div>

      {/* 表单容器 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 20px' }}>
        <div style={{ backgroundColor: 'rgba(15, 33, 73, 0.7)', borderRadius: '8px', padding: '30px', maxWidth: '400px', width: '100%' }}>
          <Form form={form} name="login" size="large" onFinish={handleLogin} layout="vertical">
            {/* 用户名输入框 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#FFD700', fontSize: '1.25rem', marginBottom: '8px' }}>
                USERNAME
              </label>
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Please input your username!" }]}
                style={{ marginBottom: 0 }}
              >
                <Input 
                  placeholder="Please input your username" 
                  style={{ backgroundColor: '#0F2149', border: '1px solid #FFD700', color: 'white', borderRadius: '4px', padding: '10px 15px' }}
                />
              </Form.Item>
            </div>

            {/* 密码输入框 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', color: '#FFD700', fontSize: '1.25rem', marginBottom: '8px' }}>
                PASSWORD
              </label>
              <Form.Item
                name="password"
                rules={[{ required: true, message: "Please input your password!" }]}
                style={{ marginBottom: 0 }}
              >
                <Input.Password 
                  placeholder="Please input your password" 
                  style={{ backgroundColor: '#0F2149', border: '1px solid #FFD700', color: 'white', borderRadius: '4px', padding: '10px 15px' }}
                />
              </Form.Item>
            </div>

            {/* 按钮区域 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button
                type="submit"
                style={{ backgroundColor: '#0F2149', border: '2px solid #FFD700', color: '#FFD700', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
              >
                SIGN IN
              </button>

              <button
                type="button"
                onClick={goBack}
                style={{ backgroundColor: '#0F2149', border: '2px solid #FFD700', color: '#FFD700', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
              >
                BACK
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
