"use client";

import React from "react";
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
  const { set: setCurrentUser } = useLocalStorage<UserListGetDTO>(
    "currentUser",
    {} as UserListGetDTO
  );
  const { set: setUsername } = useLocalStorage<string>("username", "");

  const handleSignUp = async (values: FormFieldProps) => {
    try {
      // 1. 注册时格式化生日
      const payload = {
        username: values.username,
        name: values.name,
        password: values.password,
        birthday: values.birthday.format("YYYY-MM-DD"),
      };
      const { token } = await apiService.post<LoginTokenGetDTO>(
        "/users",
        payload
      );
      setToken(token);

      // 2. 拉取所有用户，找到自己
      const users = await apiService.get<UserListGetDTO[]>("/users");
      const me = users.find((u) => u.username === values.username);
      if (me) {
        setCurrentUser(me);
        setUsername(me.username);
        localStorage.setItem("currentUser", JSON.stringify(me));
      }

      // 3. 跳转到大厅
      router.push("/lobby");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Sign up fail\n${error.message}`);
      } else {
        console.error("Unknown Error:", error);
      }
    }
  };

  const goBack = () => {
    router.push("/");
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <img
        src="/gamesource/tile_background.png"
        alt="Splendor Background"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
        }}
      >
        <img
          src="/gamesource/splendor_logo.png"
          alt="Splendor Logo"
          width={500}
          height={200}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(15, 33, 73, 0.7)",
            borderRadius: "8px",
            padding: "30px",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <Form
            form={form}
            name="signup"
            size="large"
            onFinish={handleSignUp}
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="USERNAME"
              rules={[{ required: true, message: "Please input your username!" }]}
            >
              <Input
                placeholder="Please input your username"
                style={{
                  backgroundColor: "#0F2149",
                  border: "1px solid #FFD700",
                  color: "white",
                  borderRadius: "4px",
                  padding: "10px 15px",
                }}
              />
            </Form.Item>
            <Form.Item
              name="name"
              label="NAME"
              rules={[{ required: true, message: "Please input your name!" }]}
            >
              <Input
                placeholder="Please input your name"
                style={{
                  backgroundColor: "#0F2149",
                  border: "1px solid #FFD700",
                  color: "white",
                  borderRadius: "4px",
                  padding: "10px 15px",
                }}
              />
            </Form.Item>
            <Form.Item
              name="birthday"
              label="BIRTHDAY"
              rules={[{ required: true, message: "Please select your birthday!" }]}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%", backgroundColor: "#0F2149", color: "white" }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="PASSWORD"
              rules={[{ required: true, message: "Please input your password!" }]}
            >
              <Input.Password
                placeholder="Please input your password"
                style={{
                  backgroundColor: "#0F2149",
                  border: "1px solid #FFD700",
                  color: "white",
                  borderRadius: "4px",
                  padding: "10px 15px",
                }}
              />
            </Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              <button
                type="submit"
                style={{
                  backgroundColor: "#0F2149",
                  border: "2px solid #FFD700",
                  color: "#FFD700",
                  padding: "8px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                }}
              >
                SIGN UP
              </button>
              <button
                type="button"
                onClick={goBack}
                style={{
                  backgroundColor: "#0F2149",
                  border: "2px solid #FFD700",
                  color: "#FFD700",
                  padding: "8px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
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