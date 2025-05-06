"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TutorialPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [playerCount, setPlayerCount] = useState<number | null>(null);

  const handleStartTutorial = () => setStep(2);

  const handleReadRules = () => router.push("/tutorial/rules");

  const handlePlayerSelect = (count: number) => setPlayerCount(count);

  const handleStartGame = () => {
    if (!playerCount) return;
    const route = playerCount === 2 ? "two" : playerCount === 3 ? "three" : "four";
    router.push(`/tutorial/start/${route}`);
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        fontFamily: "monospace",
      }}
    >
      {/* 背景图 */}
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

      {/* Logo */}
      <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10 }}>
        <img
          src="/gamesource/splendor_logo.png"
          alt="Splendor Logo"
          width={500}
          style={{ height: "auto" }}
        />
      </div>

      {/* 主内容区 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "800px",
          margin: "0 auto",
          padding: "200px 20px 20px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(15,33,73,0.7)",
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
            color: "#FFD700",
          }}
        >
          <h1 style={{ fontSize: "2.5rem" }}>Welcome to Splendor!</h1>
          <p style={{ fontSize: "1.2rem" }}>
            In Splendor, you take on the role of a rich merchant during the Renaissance.
            You will use your resources to acquire mines, transportation methods, and artisans
            who will allow you to turn raw gems into beautiful jewels.
          </p>

          {/* Step 1：两个按钮 */}
          {step === 1 && (
            <div style={{ marginTop: "2rem", display: "flex", gap: "20px", justifyContent: "center" }}>
              <button style={buttonStyle} onClick={handleStartTutorial}>
                Start Tutorial
              </button>
              <button style={buttonStyle} onClick={handleReadRules}>
                Read Rules
              </button>
            </div>
          )}

           {/* Step 2 */}
           {step >= 2 && (
            <>
              <h2 style={{ fontSize: "2rem", marginTop: 48 }}>How many merchants are playing today?</h2>
              <p style={{ fontSize: "1.2rem" }}>Select the number of players to set up the game.</p>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 20 }}>
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => handlePlayerSelect(count)}
                    //disabled={count !== 4} // 禁用 2、3 人按钮
                    style={{
                      ...buttonStyle,
                      // 被禁用时半透明
                      //opacity: count !== 4 ? 0.5 : 1,
                      // 只有 4 人按钮加上 pulse 动画
                      animation: count === 4 ? "pulse 1.5s ease-in-out infinite" : undefined,
                    }}
                  >
                    {count} Players
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2 - Sub：选择后显示开始按钮 */}
          {step >= 2 && playerCount && (
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
              <button style={buttonStyle} onClick={handleStartGame}>
                Start Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#0F2149",
  border: "2px solid #FFD700",
  color: "#FFD700",
  padding: "12px 30px",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
  fontFamily: "monospace",
};
