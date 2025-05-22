"use client";

import { useRouter } from "next/navigation";

export default function TutorialPage() {
  const router = useRouter();

  const handleStartTutorial = () => {
    router.push("/tutorial/rules");
  };

  const handleReadRules = () => {
    router.push("/tutorial/start/4player");
  };

  const handleBackToLobby = () => {
  router.push("/lobby");
  };


  // 主要按钮样式（Read Rules和Start Tutorial用）
  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: "#0F2149",
    border: "2px solid #FFD700",
    color: "#FFD700",
    padding: "12px 30px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1rem",
    transition: "all 0.3s ease"
  };

  // Back to Lobby按钮样式
  const backButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    backgroundColor: "#1F3A6D", // 稍微浅一点的蓝色
    borderColor: "#90EE90", // 浅绿色边框
    color: "#90EE90"
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
      {/* Background image */}
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

      {/* Main content area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: 800,
          margin: "0 auto",
          padding: "200px 20px 20px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(15,33,73,0.7)",
            borderRadius: 8,
            padding: "2rem",
            textAlign: "center",
            color: "#FFD700",
          }}
        >
        <h1 style={{ 
          fontSize: "3rem", 
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          marginBottom: "1rem"
        }}>
          Welcome to Splendor!
        </h1>
        <p style={{ 
          fontSize: "1.3rem", 
          lineHeight: "1.6",
          maxWidth: "80%",
          margin: "0 auto 2rem",
          textShadow: "1px 1px 3px rgba(0,0,0,0.3)"
        }}>
          In Splendor, you take on the role of a rich merchant during the Renaissance.
          You will use your resources to acquire mines, transportation methods, and artisans
          who will allow you to turn raw gems into beautiful jewels.
        </p>

          {/* 按钮区域 */}
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 20,
    alignItems: "center"
  }}
>
  {/* 主要按钮 */}
  
  <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
    <button 
      onClick={handleBackToLobby} 
      style={backButtonStyle}
      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      Back to Lobby
    </button>

    <button 
      style={primaryButtonStyle} 
      onClick={handleStartTutorial}
      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      Read Rules
    </button>
    <button 
      style={primaryButtonStyle} 
      onClick={handleReadRules}
      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      Start Tutorial
    </button>
  </div>
  
</div>

        </div>
      </div>

      {/* Logo in corner */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
        <img
          src="/gamesource/splendor_logo.png"
          alt="Splendor Logo"
          width={500}
          style={{ height: "auto" }}
        />
      </div>
    </div>
  );
}

