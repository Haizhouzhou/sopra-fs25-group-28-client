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

  const handleGoBack = () => {
  router.back(); 
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
          <h1 style={{ fontSize: "2.5rem" }}>Welcome to Splendor!</h1>
          <p style={{ fontSize: "1.2rem" }}>
            In Splendor, you take on the role of a rich merchant during the Renaissance.
            You will use your resources to acquire mines, transportation methods, and artisans
            who will allow you to turn raw gems into beautiful jewels.
          </p>

          {/* Action buttons + Back */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: 20,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button onClick={handleGoBack} style={buttonStyle}>
              ← Back
            </button>
            <button style={buttonStyle} onClick={handleStartTutorial}>
              Read Rules
            </button>
            <button style={buttonStyle} onClick={handleReadRules}>
              Start Tutorial
            </button>
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

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#0F2149",
  border: "2px solid #FFD700",
  color: "#FFD700",
  padding: "12px 30px",
  borderRadius: 4,
  cursor: "pointer",
  fontWeight: "bold",
};
