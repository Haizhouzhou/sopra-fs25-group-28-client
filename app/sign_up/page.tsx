"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { LoginTokenGetDTO } from "@/types/api";
import type { UserListGetDTO } from "@/types/user";
import { Form, Input, DatePicker } from "antd";
import type { Moment } from "moment";

interface FormFieldProps {
  username: string;
  name: string;
  password: string;
  birthday: Moment;
}

const SignUp: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm<FormFieldProps>();

  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setCurrentUser } = useLocalStorage<UserListGetDTO>("currentUser", {} as UserListGetDTO);
  const { set: setUsername } = useLocalStorage<string>("username", "");
  const [selectedAvatar, setSelectedAvatar] = useState("a_01.png");

  const handleSignUp = async (values: FormFieldProps) => {
    try {
      const payload = {
        username: values.username,
        name: values.name,
        password: values.password,
        birthday: values.birthday.format("YYYY-MM-DD"),
        avatar: selectedAvatar
      };

      const { token } = await apiService.post<LoginTokenGetDTO>("/users", payload);
      setToken(token);

      const users = await apiService.get<UserListGetDTO[]>("/users");
      const me = users.find((u) => u.username === values.username);
      if (me) {
        setCurrentUser(me);
        setUsername(me.username);
        localStorage.setItem("currentUser", JSON.stringify(me));
      }

      router.push("/lobby");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Sign up fail\n${error.message}`);
      } else {
        console.error("Unknown Error:", error);
      }
    }
  };

  const goBack = () => router.push("/");

  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100%", overflow: "hidden" }}>
      <img src="/gamesource/tile_background.png" alt="Background" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: -1 }} />
      <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10 }}>
        <img src="/gamesource/splendor_logo.png" alt="Logo" width={500} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 20px" }}>
        <div style={{ backgroundColor: "rgba(15, 33, 73, 0.7)", borderRadius: "8px", padding: "30px", maxWidth: "400px", width: "100%" }}>
          <Form form={form} name="signup" size="large" onFinish={handleSignUp} layout="vertical">
            <Form.Item name="username" label="USERNAME" rules={[{ required: true, message: "Please input your username!" }]}> 
              <Input placeholder="Username" style={{ backgroundColor: '#0F2149', border: '1px solid #FFD700', color: 'white' }} /> 
            </Form.Item>
            <Form.Item name="name" label="NAME" rules={[{ required: true, message: "Please input your name!" }]}> 
              <Input placeholder="Name" style={{ backgroundColor: '#0F2149', border: '1px solid #FFD700', color: 'white' }} /> 
            </Form.Item>
            <Form.Item name="birthday" label="BIRTHDAY" rules={[{ required: true, message: "Please select your birthday!" }]}> 
              <DatePicker format="YYYY-MM-DD" style={{ width: "100%", backgroundColor: '#0F2149', color: 'white' }} /> 
            </Form.Item>
            <Form.Item name="password" label="PASSWORD" rules={[{ required: true, message: "Please input your password!" }]}> 
              <Input.Password placeholder="Password" style={{ backgroundColor: '#0F2149', border: '1px solid #FFD700', color: 'white' }} /> 
            </Form.Item>

            <Form.Item label="AVATAR" required>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                {Array.from({ length: 8 }, (_, i) => {
                  const filename = `a_0${i + 1}.png`;
                  return (
                    <div key={filename} style={{ textAlign: "center" }}>
                      <img
                        src={`/avatar/${filename}`}
                        alt={`Avatar ${i + 1}`}
                        style={{ width: 60, height: 60, borderRadius: "50%", border: selectedAvatar === filename ? "3px solid #FFD700" : "2px solid #ccc", cursor: "pointer" }}
                        onClick={() => setSelectedAvatar(filename)}
                      />
                    </div>
                  );
                })}
              </div>
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button type="submit" style={{ backgroundColor: '#0F2149', border: '2px solid #FFD700', color: '#FFD700', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold' }}>SIGN UP</button>
              <button type="button" onClick={goBack} style={{ backgroundColor: '#0F2149', border: '2px solid #FFD700', color: '#FFD700', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold' }}>BACK</button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
