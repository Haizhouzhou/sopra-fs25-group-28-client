"use client";

import React from "react";
import Link from "next/link";

const RulesPage = () => {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "auto",
        fontFamily: "monospace",
        color: "#FFD700",
      }}
    >
      {/* Background */}
      <img
        src="/gamesource/tile_background.png"
        alt="Splendor Background"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
        }}
      />

      {/* Back Button */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 20,
        }}
      >
        <Link href="/tutorial">
          <button
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "#FFD700",
              border: "none",
              padding: "8px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            ← Back
          </button>
        </Link>
      </div>

      {/* Left Navigation */}
      <nav
        style={{
          position: "fixed",
          top: "120px",
          left: "20px",
          width: "200px",
          backgroundColor: "rgba(15,33,73,0.8)",
          padding: "20px",
          borderRadius: "8px",
          zIndex: 20,
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>📜 Contents</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.6 }}>
          <li><a href="#overview" style={{ color: "#FFD700", textDecoration: "none" }}>Overview 📋</a></li>
          <li><a href="#components" style={{ color: "#FFD700", textDecoration: "none" }}>Components 💎</a></li>
          <li key="setup"><a href="#setup" style={{ color: "#FFD700", textDecoration: "none" }}>Setup 🛠️</a></li>
          <li><a href="#players" style={{ color: "#FFD700", textDecoration: "none" }}>2–3 Players 👥</a></li>
          <li><a href="#actions" style={{ color: "#FFD700", textDecoration: "none" }}>Actions 🎯</a></li>
          <li><a href="#upkeep" style={{ color: "#FFD700", textDecoration: "none" }}>Upkeep 🔄</a></li>
          <li><a href="#winning" style={{ color: "#FFD700", textDecoration: "none" }}>Winning 🏆</a></li>
        </ul>
      </nav>

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "100px",
          zIndex: 10,
        }}
      >
        <img
          src="/gamesource/splendor_logo.png"
          alt="Splendor Logo"
          width={500}
          style={{ height: "auto" }}
        />
      </div>

      {/* Rules Content */}
      <div
        style={{
          maxWidth: "800px",
          margin: "150px 20px 40px 260px",
          padding: "20px",
          backgroundColor: "rgba(15,33,73,0.8)",
          borderRadius: "8px",
          lineHeight: "1.6",
          fontSize: "1rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
          Splendor Rules 🏰
        </h1>

        <section id="overview" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>
            Overview 📋
          </h2>
          <p>
            Splendor is a resource-management game for 2–4 players, taking about 30 minutes.
            Players collect gem tokens to purchase development cards, earn permanent bonuses,
            and attract nobles for prestige points. The first to reach 15 points triggers the
            final round; highest score wins.
          </p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="components" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>
            Components 💎
          </h2>
          <ul style={{ paddingLeft: "1.2rem" }}>
            <li>7 Ruby tokens (red)🔴</li>
            <li>7 Emerald tokens (green)🟢</li>
            <li>7 Sapphire tokens (blue)🔵</li>
            <li>7 Onyx tokens (black)⚫</li>
            <li>7 Diamond tokens (white)⚪</li>            
            <li>5 Gold Joker tokens (yellow)🟨</li>
            <li>90 Development cards:
              <ul style={{ marginTop: "0.5rem", marginLeft: "1.2rem" }}>
                <li>40 Level 1 cards</li>
                <li>30 Level 2 cards</li>
                <li>20 Level 3 cards</li>
              </ul>
            </li>
            <li>10 Noble tiles</li>
          </ul>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="setup" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>
            Setup 🛠️
          </h2>
          <p>1. Shuffle each development deck separately and place Level 1–3 stacked.</p>
          <p>2. Reveal 4 cards from each deck in rows beside them (3×4 grid).</p>
          <p>3. Shuffle noble tiles, reveal one more than player count, remove the rest.</p>
          <p>4. Place tokens in supply: gems and gold tokens reachable by all.</p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="players" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>
            2–3 Players 👥
          </h2>
          <p>
            For fewer players, remove some gems and nobles:
          </p>
          <p>
            • 2 players: remove 3 of each colored gem (4 remain), reveal 3 nobles.<br/>
            • 3 players: remove 2 of each colored gem (5 remain), reveal 4 nobles.
          </p>
          <p>No other changes to cards or gold tokens.</p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="actions" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>
            Actions 🎯
          </h2>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Take Gems:</h3>
          <p>
            Either take 3 different colored gems, or 2 of the same color (only if ≥4 remain).
            You may hold up to 10 tokens (gems + gold) total.
          </p>

          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Reserve a Card:</h3>
          <p>
            Reserve any face-up card or draw and reserve from deck. Gain 1 Gold token if available.
            Max 3 reserved cards in hand.
          </p>

          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Buy a Card:</h3>
          <p>
            Spend tokens equal to the card’s cost. Gold = jokers. Permanent bonuses from purchased
            cards discount future costs by 1 each.
          </p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="upkeep" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>
            Upkeep 🔄
          </h2>
          <p>
            Refill cards after buys/reserves. At turn end, check nobles: if you meet a noble’s
            bonus requirements, you automatically gain that tile (worth 3 points), max one per
            turn.
          </p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="winning" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>
            Winning 🏆
          </h2>
          <p>
            Once a player reaches 15 Prestige Points, finish the current round so all have equal
            turns. Highest prestige wins; ties broken by fewest purchased cards.
          </p>
          <p>
            Score = sum of development cards’ points + noble tiles’ points.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RulesPage;
