"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input } from "antd";
import mockAuth from "../../mock/auth";

// Optionally, you can import a CSS module or file for additional styling:
// import styles from "@/styles/page.module.css";

interface FormFieldProps {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    // value: token, // is commented out because we do not need the token value
    set: setToken, // we need this method to set the value of the token to the one we receive from the POST request to the backend server API
    // clear: clearToken, // is commented out because we do not need to clear the token when logging in
  } = useLocalStorage<string>("token", ""); // note that the key we are selecting is "token" and the default value we are setting is an empty string
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

  const handleLogin = async (values: FormFieldProps) => {
    try {
      // Call the API service and let it handle JSON serialization and error handling



      //const response = await apiService.post<User>("/users", values); 

      const response = mockAuth.login(values.username, values.password);





      // Use the useLocalStorage hook that returned a setter function (setToken in line 41) to store the token if available
      if (response && response.token) {
        setToken(response.token);
      }

      // Navigate to the user overview
      router.push("/lobby");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the login:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during login.");
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
          backgroundColor: 'rgba(15, 33, 73, 0.7)',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '400px',
          width: '100%'
        }}>
          <Form
            form={form}
            name="login"
            size="large"
            onFinish={handleLogin}
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
                SIGN IN
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


export default Login;
