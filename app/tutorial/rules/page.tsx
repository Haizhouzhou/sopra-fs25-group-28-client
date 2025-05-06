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
          <li style={{ marginBottom: "0.5rem" }}>
            <a href="#overview" style={{ color: "#FFD700", textDecoration: "none" }}>
              Overview 📋
            </a>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <a href="#setup" style={{ color: "#FFD700", textDecoration: "none" }}>
              Setup 🛠️
            </a>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <a href="#players" style={{ color: "#FFD700", textDecoration: "none" }}>
              2–3 Players 👥
            </a>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <a href="#rules" style={{ color: "#FFD700", textDecoration: "none" }}>
              Game Rules 🎲
            </a>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <a href="#actions" style={{ color: "#FFD700", textDecoration: "none" }}>
              Actions 🎯
            </a>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <a href="#upkeep" style={{ color: "#FFD700", textDecoration: "none" }}>
              Upkeep 🔄
            </a>
          </li>
          <li>
            <a href="#win" style={{ color: "#FFD700", textDecoration: "none" }}>
              Winning 🏆
            </a>
          </li>
        </ul>
      </nav>

      {/* Logo (scrolls with content) */}
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
            Player count, game length and overview ⏱️
          </h2>
          <p>
            Splendor is a resource-management game for two to four players that plays in about 30
            minutes. Players take the role of merchants racing to produce the most renowned
            jewellery of the Renaissance by collecting raw gems, buying developments and
            attracting wealthy patrons.
          </p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="setup" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>
            How to set up Splendor 🔧
          </h2>
          <p>
            Divide the development cards into their respective decks. You can tell which deck a
            development card belongs to by counting the white dots printed on its back. Those
            white dots also indicate the deck’s level, from one to three.
          </p>
          <p>
            Shuffle the decks separately and place them in a column, with level one at the bottom
            and level three at the top. Reveal four cards from each deck and place them in a line
            next to their respective decks. You should now have a three-by-four grid of face-up
            development cards, each deck sitting next to a line of face-up cards of the same level.
          </p>
          <p>
            Pick five noble tiles at random and return the rest to the box. Place those tiles where
            everyone can see them.
          </p>
          <p>
            Lastly, divide the gem and gold tokens by colour and place them so that every player
            can reach them easily. This is the token supply:
          </p>
          <p>💚 Emerald, 🤍 Diamond, 💙 Sapphire, 🖤 Onyx, ❤️ Ruby, 💛 Gold</p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="players" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>
            How to play Splendor with two or three players 🎮
          </h2>
          <p>
            Splendor’s setup for 2 or 3 players is slightly different, as the game uses fewer
            gems and noble tiles. The number of gold tokens and development cards does not
            change with player count.
          </p>
          <p>For a two-player game, use only 3 noble tiles and 4 gems each: 💚 🤍 💙 🖤 ❤️</p>
          <p>For a three-player game, use only 4 noble tiles and 5 gems each: 💚 🤍 💙 🖤 ❤️</p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="rules" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>Splendor rules 🎲</h2>
          <p>
            The goal of Splendor is to be the first player to reach 15 prestige points by accumulating
            development cards and noble tiles. Cards and tiles are worth the number of points
            indicated by the white number in the top left. Cards with no number printed in the top
            left are worth zero points.
          </p>
          <p>
            Starting from the first player and continuing clockwise, players must perform one action per turn: gathering gems, reserving a development card, or buying a development card.
          </p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="actions" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>Actions 🎯</h2>

          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Gather gems:</h3>
          <p>
            Take three gems of different colours or two gems of the same colour (only if at least four remain). End your turn with a maximum of 10 tokens (gems + gold), returning any extras.
          </p>

          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Reserve a card:</h3>
          <p>
            Reserve a face-up card or draw from a deck. Gain one gold token (joker) if available. You may hold up to three reserved cards.
          </p>

          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Buy a card:</h3>
          <p>
            Spend tokens matching the card’s cost. Gold tokens act as jokers. Each bonus from previously bought cards discounts future purchases of that colour by one.
          </p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="upkeep" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>Upkeep 🔄</h2>
          <p>
            Refill face-up cards after purchases/reservations. At turn end, check for noble visits: if you meet a noble’s bonus requirements, you automatically gain that noble tile (worth 3 points), one per turn.
          </p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="win" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>Winning 🏆</h2>
          <p>
            When a player reaches 15 prestige points, finish the current round so everyone has equal turns. Highest prestige wins; ties broken by fewest purchased development cards.
          </p>
          <p>
            Score only bought development cards and noble tiles. Reserved cards do not score.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RulesPage;