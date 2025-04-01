"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "antd";

interface User {
  id: number;
  username: string;
  name: string;
  password: string;
  avatar?: string;
}

const Profile: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("a_01.png");

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const currentUser = users.find((u: User) => u.id === userId);
    if (currentUser) {
      setUser(currentUser);
      setName(currentUser.name);
      setAvatar(currentUser.avatar || "a_01.png");
    } else {
      alert("User not found");
      router.push("/");
    }
  }, [userId, router]);

  const handleSave = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map((u: User) =>
      u.id === userId ? { ...u, name, avatar } : u
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (currentUser?.id === userId) {
      localStorage.setItem("currentUser", JSON.stringify({ ...currentUser, name, avatar }));
    }

    alert("Profile updated!");
  };

  const handleBack = () => {
    router.push("/lobby");
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* 背景图 */}
      <img
        src="/gamesource/tile_background.png"
        alt="Background"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1
        }}
      />

      {/* Logo */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10
      }}>
        <img
          src="/gamesource/splendor_logo.png"
          alt="Logo"
          width={500}
          style={{ height: 'auto' }}
        />
      </div>

      {/* 内容区 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '0 20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(15, 33, 73, 0.7)',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '500px',
          width: '100%',
          color: '#FFD700'
        }}>
          <h1 style={{ textAlign: 'center' }}>Edit Profile</h1>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#FFD700', 
              fontSize: '1.25rem',
              marginBottom: '8px'
            }}>
              USERNAME
            </label>
            <div
              style={{
                color: 'white',
                fontSize: '1rem',
                padding: '4px 0',
                lineHeight: '1.6'
              }}
            >
              {user?.username}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#FFD700',
              fontSize: '1.25rem',
              marginBottom: '8px'
            }}>
              NAME
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={{
                backgroundColor: '#0F2149',
                border: '1px solid #FFD700',
                color: 'white',
                borderRadius: '4px',
                padding: '10px 15px'
              }}
            />
          </div>

          {/* Avatar 区域 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              color: '#FFD700',
              fontSize: '1.25rem',
              marginBottom: '8px'
            }}>
              AVATAR
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "15px",
              justifyContent: "center"
            }}>
              {Array.from({ length: 8 }, (_, i) => {
                const filename = `a_0${i + 1}.png`;
                return (
                  <div key={filename} style={{ textAlign: "center" }}>
                    <img
                      src={`/avatar/${filename}`}
                      alt={`Avatar ${i + 1}`}
                      style={{
                        width: "70px",
                        height: "70px",
                        borderRadius: "50%",
                        border: avatar === filename ? "3px solid #FFD700" : "2px solid #ccc",
                        cursor: "pointer"
                      }}
                      onClick={() => setAvatar(filename)}
                    />
                    <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>#{i + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 按钮区域 */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={handleBack}
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

            <button
              onClick={handleSave}
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
              SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
