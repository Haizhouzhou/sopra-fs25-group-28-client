"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Form, Input } from "antd";

interface FormFieldProps {
  label: string;
  value: string;
}

const SignUp: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  
  const {
    set: setToken,
  } = useLocalStorage<string>("token", "");

  const handleSignUp = async (values: FormFieldProps) => {
    try {
      // Call the API service and let it handle JSON serialization and error handling
      const response = await apiService.post<User>("/users", values);
      
      // Store the token if available
      if (response.token) {
        setToken(response.token);
      }
      
      // Navigate to the lobby
      router.push("/lobby");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during sign up:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during sign up.");
      }
    }
  };

  const goBack = () => {
    router.push("/");
  };

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* 背景图 */}
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

      {/* Logo 在左上角 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10
      }}>
        <img
          src="/gamesource/splendor_logo.png"
          alt="Splendor Logo"
          width={500}
          height={200}
        />
      </div>

      {/* 内容容器 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '0 20px'
      }}>
        {/* 表单容器 */}
        <div style={{
          maxWidth: '400px',
          width: '100%'
        }}>
          <Form
            form={form}
            name="signup"
            size="large"
            onFinish={handleSignUp}
            layout="vertical"
          >
            {/* 用户名输入框 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: '#FFD700', 
                fontSize: '1.25rem',
                marginBottom: '8px'
              }}>
                USERNAME
              </label>
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Please input your username!" }]}
                style={{ marginBottom: 0 }}
              >
                <Input 
                  placeholder="Please input your username" 
                  style={{
                    backgroundColor: '#0F2149',
                    border: '1px solid #FFD700',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '10px 15px'
                  }}
                />
              </Form.Item>
            </div>

            {/* 名称输入框 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: '#FFD700', 
                fontSize: '1.25rem',
                marginBottom: '8px'
              }}>
                NAME
              </label>
              <Form.Item
                name="name"
                rules={[{ required: true, message: "Please input your name!" }]}
                style={{ marginBottom: 0 }}
              >
                <Input 
                  placeholder="Please input your name" 
                  style={{
                    backgroundColor: '#0F2149',
                    border: '1px solid #FFD700',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '10px 15px'
                  }}
                />
              </Form.Item>
            </div>

            {/* 密码输入框 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                color: '#FFD700', 
                fontSize: '1.25rem',
                marginBottom: '8px'
              }}>
                PASSWORD
              </label>
              <Form.Item
                name="password"
                rules={[{ required: true, message: "Please input your password!" }]}
                style={{ marginBottom: 0 }}
              >
                <Input.Password 
                  placeholder="Please input your password" 
                  style={{
                    backgroundColor: '#0F2149',
                    border: '1px solid #FFD700',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '10px 15px'
                  }}
                />
              </Form.Item>
            </div>

            {/* 按钮区域 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '20px'
            }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#0F2149',
                  border: '2px solid #FFD700',
                  color: '#FFD700',
                  padding: '8px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                SIGN UP
              </button>

              <button
                type="button"
                onClick={goBack}
                style={{
                  backgroundColor: '#0F2149',
                  border: '2px solid #FFD700',
                  color: '#FFD700',
                  padding: '8px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
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

export default SignUp;