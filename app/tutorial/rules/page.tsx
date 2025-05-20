"use client";

import React from "react";
import Link from "next/link";
// If you start using Next.js Image, uncomment this:
// import Image from 'next/image'; 

// Define precise types for gem colors and collections of gems
type GemColor = "white" | "blue" | "green" | "red" | "black";

// GemCollection means an object where keys are GemColors, and if a key exists, its value is a number.
// It allows for some gem colors to be absent from the cost/requirements.
type GemCollection = {
  [K in GemColor]?: number;
};

// Interface for the card structure
interface ExampleCard {
  id: number;
  points: number;
  color: string; 
  tier: number;
  cost: GemCollection; 
}

// Interface for the noble structure
interface ExampleNoble {
  id: number;
  points: number;
  requirements: GemCollection; 
  imageIndex: number;
}

const exampleCardsData: ExampleCard[] = [
  { id: 8, points: 0, color: "blue", tier: 1, cost: { white: 1, green: 1, red: 1, black: 1 } },
  { id: 14, points: 1, color: "red", tier: 1, cost: { white: 4 } },
  { id: 45, points: 3, color: "blue", tier: 2, cost: { blue: 6 } },
  { id: 49, points: 5, color: "blue", tier: 3, cost: { white: 7, blue: 3 } },
];

const exampleNoblesData: ExampleNoble[] = [
  { id: 1, points: 3, requirements: { red: 3, blue: 3 }, imageIndex: 0 },
  { id: 2, points: 3, requirements: { white: 4, black: 4 }, imageIndex: 1 },
  { id: 3, points: 3, requirements: { green: 3, black: 3 }, imageIndex: 2 },
  { id: 4, points: 3, requirements: { red: 4, green: 4 }, imageIndex: 3 },
  { id: 5, points: 3, requirements: { blue: 4, white: 4 }, imageIndex: 4 },
  { id: 6, points: 3, requirements: { red: 3, white: 3, black: 3 }, imageIndex: 5 },
  { id: 7, points: 3, requirements: { blue: 3, green: 3, red: 3 }, imageIndex: 6 },
  { id: 8, points: 3, requirements: { black: 3, blue: 3, white: 3 }, imageIndex: 7 },
  { id: 9, points: 3, requirements: { green: 4, red: 0, black: 4 }, imageIndex: 8 },
  { id: 10, points: 3, requirements: { white: 4, blue: 0, green: 4 }, imageIndex: 9 }, 
];

const gemTableInfo = [
  { key: 'ruby', name: 'Ruby', cssColor: 'red', displayTableColor: 'Red', quantity: 7, title: 'Ruby (Red Gem)' },
  { key: 'emerald', name: 'Emerald', cssColor: 'green', displayTableColor: 'Green', quantity: 7, title: 'Emerald (Green Gem)' },
  { key: 'sapphire', name: 'Sapphire', cssColor: 'blue', displayTableColor: 'Blue', quantity: 7, title: 'Sapphire (Blue Gem)' },
  { key: 'onyx', name: 'Onyx', cssColor: 'black', displayTableColor: 'Black', quantity: 7, title: 'Onyx (Black Gem)' },
  { key: 'diamond', name: 'Diamond', cssColor: 'white', displayTableColor: 'White', quantity: 7, title: 'Diamond (White Gem)' },
  { key: 'gold', name: 'Gold', cssColor: 'gold', displayTableColor: 'Yellow (Wildcard)', quantity: 5, title: 'Gold (Wildcard)' }
];


const RulesPage = () => {
  const keywordLinkStyle: React.CSSProperties = {
    color: "#FFD700",
    textDecoration: "underline",
    cursor: "pointer",
  };

  const cardWidthPx = 160;
  const cardBonusGemWidthPercent = 0.321;
  const cardBonusGemCalculatedWidth = cardWidthPx * cardBonusGemWidthPercent;

  const colorMappings: Record<string, { initial: string; gemClass: string; chipClass: string; costClass: string; nobleClass?: string }> = {
    blue: { initial: 'b', gemClass: 'bgem', chipClass: 'bchip', costClass: 'b', nobleClass: 'b' },
    red: { initial: 'r', gemClass: 'rgem', chipClass: 'rchip', costClass: 'r', nobleClass: 'r' },
    green: { initial: 'g', gemClass: 'ggem', chipClass: 'gchip', costClass: 'g', nobleClass: 'g' },
    black: { initial: 'u', gemClass: 'ugem', chipClass: 'uchip', costClass: 'u', nobleClass: 'u' },
    white: { initial: 'w', gemClass: 'wgem', chipClass: 'wchip', costClass: 'w', nobleClass: 'w' },
    gold: { initial: 'x', gemClass: 'xgem', chipClass: 'xchip', costClass: 'x' }
  };

  const getMappedColorValue = (colorName: string, type: keyof typeof colorMappings.blue) => {
    const lowerColorName = colorName.toLowerCase();
    if (colorMappings[lowerColorName] && colorMappings[lowerColorName][type]) {
      return colorMappings[lowerColorName][type];
    }
    return colorName.charAt(0);
  };

  const renderCosts = (costObject: GemCollection) => {
    return Object.entries(costObject).map(([color, count]) => (
      <div key={color} className={`cost ${getMappedColorValue(color, 'costClass')}`} title={`${count} ${color}`}>
        {count}
      </div>
    ));
  };

  const renderNobleRequirements = (requirements: GemCollection) => {
    return Object.entries(requirements)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
      .map(([color, count]) => (
        <div
          key={color}
          className={`requires ${getMappedColorValue(color, 'nobleClass')}`}
          title={`${count} ${color} cards`}
          style={{
            width: '14px',
            height: '14px',
            fontSize: '10px', 
            lineHeight: '14px', 
          }}
        >
          {count}
        </div>
      ));
  };

  const InlineGoldChip = () => (
    <div
        className={`gem ${getMappedColorValue('gold', 'chipClass')}`}
        style={{
            width: '1em',
            height: '1em',
            display: 'inline-block',
            verticalAlign: 'middle',
            marginRight: '0.2em',
            marginLeft: '0.2em',
            borderRadius: '50%'
        }}
        title="Gold Token"
    ></div>
  );
  
  const NAV_CONTENT_WIDTH = 220;
  const NAV_PADDING_HORIZONTAL = 20 + 20;
  const NAV_VISUAL_WIDTH = NAV_CONTENT_WIDTH + NAV_PADDING_HORIZONTAL;
  const GAP_NAV_CONTENT = 20;
  const RULES_CONTENT_MAX_WIDTH = 800;
  const TOTAL_EFFECTIVE_CONTENT_WIDTH = NAV_VISUAL_WIDTH + GAP_NAV_CONTENT + RULES_CONTENT_MAX_WIDTH;

  const BACK_BUTTON_TOP = 20;
  const BACK_BUTTON_HEIGHT_ESTIMATE = 36;
  const GAP_BELOW_BACK_BUTTON = 10;
  const NAV_TOP_CALC = `${BACK_BUTTON_TOP + BACK_BUTTON_HEIGHT_ESTIMATE + GAP_BELOW_BACK_BUTTON}px`;

  const LOGO_OFFSET_FROM_BLOCK_START = 80;
  const baseLeftOffsetCalc = `calc((100vw - ${TOTAL_EFFECTIVE_CONTENT_WIDTH}px) / 2)`;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "auto",
        color: "#FFD700",
      }}
    >
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

      <div
        style={{
          position: "fixed",
          top: `${BACK_BUTTON_TOP}px`,
          left: baseLeftOffsetCalc,
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
              fontWeight: "bold",
            }}
          >
            ← Back
          </button>
        </Link>
      </div>

    <nav
      style={{
        position: "fixed",
        top: NAV_TOP_CALC,
        left: baseLeftOffsetCalc,
        width: `${NAV_CONTENT_WIDTH}px`,
        backgroundColor: "rgba(15,33,73,0.8)",
        padding: "20px", 
        borderRadius: "8px",
        zIndex: 20,
      }}
    >
      <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>📜 Contents</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.6 ,whiteSpace: 'nowrap'}}>
        <li>
          <a href="#overview" style={{ color: "#FFD700", textDecoration: "none" }}>Overview 📋</a>
        </li>
        <li>
          <span style={{ color: "#FFD700" }}>Components 💎</span>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, marginLeft: "1em" }}>
            <li>
              <a href="#gem-tokens" style={{ color: "#FFD700", textDecoration: "none" }}>↳ Gem Tokens</a>
            </li>
            <li>
              <a href="#development-cards" style={{ color: "#FFD700", textDecoration: "none" }}>↳ Development Cards</a>
            </li>
            <li>
              <a href="#noble-tiles" style={{ color: "#FFD700", textDecoration: "none" }}>↳ Noble Tiles</a>
            </li>
          </ul>
        </li>
        <li>
          <a href="#setup" style={{ color: "#FFD700", textDecoration: "none" }}>Setup 🛠️</a>
        </li>
        <li>
          <a href="#players" style={{ color: "#FFD700", textDecoration: "none" }}>2–3 Players 👥</a>
        </li>
        <li>
          <a href="#actions" style={{ color: "#FFD700", textDecoration: "none" }}>Actions 🎯</a>
        </li>
        <li>
          <a href="#upkeep" style={{ color: "#FFD700", textDecoration: "none" }}>Upkeep 🔄</a>
        </li>
        <li>
          <a href="#winning" style={{ color: "#FFD700", textDecoration: "none" }}>Winning 🏆</a>
        </li>
        <li>
          <a href="#system-features" style={{ color: "#FFD700", textDecoration: "none" }}>System Features ⚙️</a>
        </li>
      </ul>
    </nav>

      <div
        style={{
          position: "absolute",
          top: `${BACK_BUTTON_TOP}px`,
          left: `calc(${baseLeftOffsetCalc} + ${LOGO_OFFSET_FROM_BLOCK_START}px)`,
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

      <div
        style={{
          maxWidth: `${RULES_CONTENT_MAX_WIDTH}px`,
          marginTop: "150px",
          marginRight: baseLeftOffsetCalc,
          marginBottom: "40px",
          marginLeft: `calc(${baseLeftOffsetCalc} + ${NAV_VISUAL_WIDTH}px + ${GAP_NAV_CONTENT}px)`,
          padding: "20px",
          backgroundColor: "rgba(15,33,73,0.8)",
          borderRadius: "8px",
          lineHeight: "1.6",
          fontSize: "1rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", textAlign: "center", marginBottom: "1.5rem", color: "#FFD700" }}>
          Splendor Rules 🏰
        </h1>

        <section id="overview" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem", color: "#FFD700"  }}>
            🎯 Overview 📋
          </h2>
          <p>
            Splendor is a resource-management game for 2–4 players, taking about 30 minutes.
            Players collect <a href="#gem-tokens" style={keywordLinkStyle}>gem tokens</a> to purchase <a href="#development-cards" style={keywordLinkStyle}>development cards</a>, earn permanent bonuses,
            and attract <a href="#noble-tiles" style={keywordLinkStyle}>nobles</a> for prestige points. The first to reach 15 points wins.
          </p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="components" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem", color: "#FFD700" }}>
            🧩 Game Components 💎
          </h2>

          <h3 id="gem-tokens" style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>💎 Gem Tokens</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', marginBottom: '15px', justifyContent: 'center' }}>
            {gemTableInfo.map(gem => (
              <div key={gem.key} className={`gem ${getMappedColorValue(gem.cssColor, 'chipClass')}`} title={gem.title}>
                <div className="bubble" style={{ display: 'none' }}>{gem.quantity}</div>
              </div>
            ))}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "left" }}>Gem Type</th>
                <th style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "left" }}>Color</th>
                <th style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "center" }}>Icon</th>
                <th style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "center" }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {gemTableInfo.map(gemInfo => (
                <tr key={gemInfo.key}>
                  <td style={{ border: "1px solid #FFD700", padding: "8px" }}>{gemInfo.name}</td>
                  <td style={{ border: "1px solid #FFD700", padding: "8px" }}>{gemInfo.displayTableColor}</td>
                  <td style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "center" }}>
                    <div
                      className={`gem ${getMappedColorValue(gemInfo.cssColor, 'chipClass')}`}
                      style={{ width: '24px', height: '24px', margin: 'auto', display: 'inline-block', verticalAlign: 'middle', borderRadius: '50%' }}
                      title={gemInfo.title}
                    ></div>
                  </td>
                  <td style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "center" }}>{gemInfo.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <em>Note: <a href="#gem-tokens" style={keywordLinkStyle}>Gold tokens</a> are wildcards and are only obtained when reserving cards. Players may hold a maximum of 10 <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a>, including <a href="#gem-tokens" style={keywordLinkStyle}>gold</a>.</em>
          </p>

          <h3 id="development-cards" style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>🃏 Development Cards</h3>
          <p>Example <a href="#development-cards" style={keywordLinkStyle}>Development Cards</a>:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', marginBottom: '15px', justifyContent: 'center',color: 'white', }}>
            {exampleCardsData.map(card => (
              <div key={card.id} className={`card card-${getMappedColorValue(card.color, 'initial')} card-level${card.tier}`} title={`Tier ${card.tier} ${card.color} card, ${card.points} points`}>
                <div className="header">
                  {card.points > 0 && <div className="points" style={{ color: 'white' }}>{card.points}</div>}
                </div>
                <div
                  className={`color ${getMappedColorValue(card.color, 'gemClass')}`}
                  style={{
                    height: `${cardBonusGemCalculatedWidth}px`,
                    top: '2%'
                  }}
                ></div>
                <div className="costs">
                  {renderCosts(card.cost)}
                </div>
              </div>
            ))}
          </div>
          <p>There are 90 <a href="#development-cards" style={keywordLinkStyle}>Development Cards</a> divided into three levels:</p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
            <thead><tr><th style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "left" }}>Level</th><th style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "center" }}>Quantity</th><th style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "left" }}>Card Strength / Cost</th></tr></thead>
            <tbody>
                <tr><td style={{ border: "1px solid #FFD700", padding: "8px" }}>Level 1</td><td style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "center" }}>40 cards</td><td style={{ border: "1px solid #FFD700", padding: "8px" }}>Least expensive</td></tr>
                <tr><td style={{ border: "1px solid #FFD700", padding: "8px" }}>Level 2</td><td style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "center" }}>30 cards</td><td style={{ border: "1px solid #FFD700", padding: "8px" }}>Moderately expensive</td></tr>
                <tr><td style={{ border: "1px solid #FFD700", padding: "8px" }}>Level 3</td><td style={{ border: "1px solid #FFD700", padding: "8px", textAlign: "center" }}>20 cards</td><td style={{ border: "1px solid #FFD700", padding: "8px" }}>Most expensive</td></tr>
            </tbody>
          </table>
          <p><strong><a href="#development-cards" style={keywordLinkStyle}>Development Card</a> details:</strong></p>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li><strong>Top-left corner (only on some cards):</strong> Prestige Points (from 0 to 5).</li>
            <li><strong>Top-right corner:</strong> Color indicating the <a href="#gem-tokens" style={keywordLinkStyle}>gem</a> bonus type.</li>
            <li><strong>Bottom-left corner:</strong> <a href="#gem-tokens" style={keywordLinkStyle}>Gem</a> cost (vertically displayed, <a href="#gem-tokens" style={keywordLinkStyle}>gem</a> colors and quantities required).</li>
          </ul>
          <p>
            When purchased, <a href="#development-cards" style={keywordLinkStyle}>Development Cards</a> permanently grant <a href="#gem-tokens" style={keywordLinkStyle}>gem</a> bonuses to players, reducing future purchase costs by 1 <a href="#gem-tokens" style={keywordLinkStyle}>gem</a> of that type per bonus.
          </p>

          <h3 id="noble-tiles" style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>👑 Noble Tiles</h3>
          <p>Example <a href="#noble-tiles" style={keywordLinkStyle}>Noble Tiles</a> (all 10 types shown below as examples):</p>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', marginBottom: '15px', justifyContent: 'center' }}>
            {exampleNoblesData.map(noble => ( 
              <div
                key={noble.id}
                id={`noble${noble.imageIndex}`}
                className="noble"
                style={{
                  width: '100px',
                  height: '100px',
                  color: 'white',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  position: 'relative',    
                  padding: '5px',        
                  boxSizing: 'border-box',
                }}
                title={`Noble - ${noble.points} Points`}
              >
                <div
                  className="points"
                  style={{
                    position: 'absolute',
                    top: '4px',            
                    left: '4px',           
                    fontSize: '16px',      
                    fontWeight: 'bold',
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)'
                  }}
                >
                  {noble.points}
                </div>
                <div className="requirement" style={{ alignItems: 'flex-start', justifyContent: 'flex-end', gap: '3px', marginTop: '40px' }}>
                  {renderNobleRequirements(noble.requirements)}
                </div>
              </div>
            ))}
          </div>
          <p>There are 10 <a href="#noble-tiles" style={keywordLinkStyle}>Noble Tiles</a> in total for the game setup, from which a subset are chosen.</p>
          <p><strong><a href="#noble-tiles" style={keywordLinkStyle}>Noble Tile</a> details:</strong></p>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li><strong>Top-left corner:</strong> Prestige Points awarded (always 3 points).</li>
            <li><strong>Bottom-left corner:</strong> Requirements (e.g., 3 red bonus cards + 3 white bonus cards).</li>
          </ul>
          <p><em>See Upkeep section for how <a href="#noble-tiles" style={keywordLinkStyle}>Nobles</a> are acquired.</em></p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="setup" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem", color: "#FFD700" }}>🛠️ Game Setup (Initial Layout)</h2>
          <p>The game board is automatically prepared at the start of each game. Here&apos;s what you&apos;ll see:</p>
          <ol style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li>
              <strong><a href="#development-cards" style={keywordLinkStyle}>Development Cards</a>:</strong>
              <ul style={{ paddingLeft: "1.2rem", marginTop: "0.2rem", listStyleType: "disc" }}>
                <li>Three decks of cards (Level 1, Level 2, Level 3) are prepared.</li>
                <li>Four cards from each level are dealt face-up, creating a 3x4 grid of available cards. The remaining cards form face-down draw piles for each level.</li>
              </ul>
            </li>
            <li>
              <strong><a href="#noble-tiles" style={keywordLinkStyle}>Noble Tiles</a>:</strong> A number of <a href="#noble-tiles" style={keywordLinkStyle}>Noble tiles</a> equal to &quot;the number of players + 1&quot; are randomly selected from the available pool and displayed face-up.
            </li>
            <li>
              <strong><a href="#gem-tokens" style={keywordLinkStyle}>Gem Tokens</a>:</strong> All <a href="#gem-tokens" style={keywordLinkStyle}>gem tokens</a> (Ruby, Emerald, Sapphire, Onyx, Diamond) and <a href="#gem-tokens" style={keywordLinkStyle}>Gold tokens</a> are available in a central supply.
            </li>
            <li>
              <strong>Starting Player:</strong> The game randomly selects a player to take the first turn.
            </li>
          </ol>
          <p><em>(Refer to the <a href="#players" style={keywordLinkStyle}>2–3 Players Adjustments</a> section for modifications to <a href="#gem-tokens" style={keywordLinkStyle}>gem token</a> availability and the number of <a href="#noble-tiles" style={keywordLinkStyle}>Noble tiles</a> based on player count.)</em></p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="players" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem", color: "#FFD700" }}>👥 2–3 Players Adjustments</h2>
          <p>For games with fewer than 4 players, the initial game setup is adjusted as follows:</p>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li><strong>2 players:</strong> 
                <ul style={{ paddingLeft: "1.2rem", marginTop: "0.2rem", listStyleType: "disc" }}>
                    <li>Only 4 of each colored <a href="#gem-tokens" style={keywordLinkStyle}>gem token</a> (excluding gold) are made available in the supply.</li>
                    <li>3 <a href="#noble-tiles" style={keywordLinkStyle}>Noble tiles</a> (2 players + 1) are revealed.</li>
                </ul>
            </li>
            <li><strong>3 players:</strong>
                <ul style={{ paddingLeft: "1.2rem", marginTop: "0.2rem", listStyleType: "disc" }}>
                    <li>Only 5 of each colored <a href="#gem-tokens" style={keywordLinkStyle}>gem token</a> (excluding gold) are made available in the supply.</li>
                    <li>4 <a href="#noble-tiles" style={keywordLinkStyle}>Noble tiles</a> (3 players + 1) are revealed.</li>
                </ul>
            </li>
          </ul>
          <p>The number of <a href="#development-cards" style={keywordLinkStyle}>development cards</a> and <a href="#gem-tokens" style={keywordLinkStyle}>gold tokens</a> (5) remains the same regardless of player count.</p>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />
        
        <section id="actions" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem", color: "#FFD700" }}>🎯 Turn Structure & Player Actions</h2>
          <p>On your turn, you must perform <strong>one</strong> of the following four actions:</p>
          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>1️⃣ Take Gems</h3>
          <p>Collect <a href="#gem-tokens" style={keywordLinkStyle}>gem tokens</a> from the central supply. You have two options:</p>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li>Take 3 <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a> of <strong>different</strong> colors.</li>
            <li>Take 2 <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a> of the <strong>same</strong> color (this is only allowed if there are at least 4 <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a> of that color remaining in the supply before you take them).</li>
          </ul>
          <p><em>You may hold a maximum of 10 <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a> (<a href="#gem-tokens" style={keywordLinkStyle}>gems</a> + <a href="#gem-tokens" style={keywordLinkStyle}>gold</a>) in total. If taking <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a> results in you having more than 10, you must immediately discard <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a> of your choice back to the supply until you have 10.</em></p>

          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>2️⃣ Buy a Development Card</h3>
          <p>Purchase one face-up <a href="#development-cards" style={keywordLinkStyle}>Development Card</a> from the display rows or one of the cards you have previously reserved.</p>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li>Pay the <a href="#gem-tokens" style={keywordLinkStyle}>gem</a> costs shown at the bottom-left corner of the card by returning <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a> to the supply.</li>
            <li><a href="#gem-tokens" style={keywordLinkStyle}>Gold tokens</a> ( <InlineGoldChip /> ) act as wildcards and can substitute for any color <a href="#gem-tokens" style={keywordLinkStyle}>gem</a>.</li>
            <li>Permanent <a href="#gem-tokens" style={keywordLinkStyle}>gem</a> bonuses from <a href="#development-cards" style={keywordLinkStyle}>Development Cards</a> you&apos;ve already purchased provide discounts on future purchases. For example, if you have 2 red bonus cards, any card costing red <a href="#gem-tokens" style={keywordLinkStyle}>gems</a> will be 2 red <a href="#gem-tokens" style={keywordLinkStyle}>gems</a> cheaper for you. A card&apos;s cost in a specific <a href="#gem-tokens" style={keywordLinkStyle}>gem</a> color cannot be reduced below zero.</li>
            <li>Place the purchased card face-up in front of you. It provides a permanent <a href="#gem-tokens" style={keywordLinkStyle}>gem</a> bonus of its color and any Prestige Points indicated.</li>
          </ul>

          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>3️⃣ Reserve a Development Card</h3>
          <p>Reserve one visible <a href="#development-cards" style={keywordLinkStyle}>Development Card</a> from the display rows or draw the top card from one of the three <a href="#development-cards" style={keywordLinkStyle}>Development Card decks</a> (without showing it to other players) to reserve.</p>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li>If you take a card from the display, it is not immediately replaced.</li>
            <li>Receive 1 <a href="#gem-tokens" style={keywordLinkStyle}>gold token</a> ( <InlineGoldChip /> ) from the central supply (if any are available). If you have 10 <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a> already, you must discard one <a href="#gem-tokens" style={keywordLinkStyle}>token</a> (it can be the <a href="#gem-tokens" style={keywordLinkStyle}>gold token</a> you just received or another <a href="#gem-tokens" style={keywordLinkStyle}>token</a>) to stay at the 10-<a href="#gem-tokens" style={keywordLinkStyle}>token</a> limit.</li>
            <li>You may have a maximum of 3 reserved cards at any one time.</li>
            {/* THIS LINE IS CORRECTED: */}
            <li>Reserved cards are kept in your hand, hidden from other players, and may only be purchased by you in a future turn (using the &quot;Buy a <a href="#development-cards" style={keywordLinkStyle}>Development Card</a>&quot; action).</li>
          </ul>

          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>4️⃣ Pass Turn</h3>
           <p>A player may choose to voluntarily skip their action.</p>
           <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
             <li>This can be chosen explicitly. (In some online versions, if a turn timer expires, the turn automatically passes).</li>
           </ul>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="upkeep" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem", color: "#FFD700" }}>🔄 Upkeep (End of Turn)</h2>
          <p>After performing your action (and discarding <a href="#gem-tokens" style={keywordLinkStyle}>tokens</a> if over the limit):</p>
          <ol style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li><strong>Refill <a href="#development-cards" style={keywordLinkStyle}>Development Cards</a>:</strong> If you purchased or reserved a face-up <a href="#development-cards" style={keywordLinkStyle}>Development Card</a> from one of the rows, a new card is immediately drawn from the corresponding deck to replace it in the display. If the deck is empty, the slot remains empty.</li>
            <li><strong>Attract <a href="#noble-tiles" style={keywordLinkStyle}>Nobles</a>:</strong> Check if the permanent <a href="#gem-tokens" style={keywordLinkStyle}>gem</a> bonuses on the <a href="#development-cards" style={keywordLinkStyle}>Development Cards</a> you own meet the requirements of any face-up <a href="#noble-tiles" style={keywordLinkStyle}>Noble tiles</a>.
              <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
                <li>If your bonuses match the requirements of one or more <a href="#noble-tiles" style={keywordLinkStyle}>Noble tiles</a>, you <strong>must</strong> choose one of those <a href="#noble-tiles" style={keywordLinkStyle}>Nobles</a>. Take the <a href="#noble-tiles" style={keywordLinkStyle}>Noble tile</a> and place it in front of you. It is worth 3 Prestige Points.</li>
                <li>You may only acquire one <a href="#noble-tiles" style={keywordLinkStyle}>Noble</a> per turn, even if you meet the requirements for multiple <a href="#noble-tiles" style={keywordLinkStyle}>Nobles</a>.</li>
                <li>A <a href="#noble-tiles" style={keywordLinkStyle}>Noble tile</a>, once acquired, is kept permanently and does not need to be &quot;paid for&quot; beyond having the required bonus cards. Acquired <a href="#noble-tiles" style={keywordLinkStyle}>Noble tiles</a> are not replaced.</li>
              </ul>
            </li>
          </ol>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />

        <section id="winning" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem", color: "#FFD700" }}>🏁 Game End & Winning 🏆</h2>
          <ol style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li>When any player reaches <strong>15 or more Prestige Points</strong> at the end of their turn (after attracting a <a href="#noble-tiles" style={keywordLinkStyle}>Noble</a>, if applicable), the current round of play is completed. This means every player will have had the same number of turns.</li>
            <li>After the round finishes, the player with the most Prestige Points wins the game.</li>
            <li><strong>Tie-Breaker:</strong> If two or more players have the same highest number of Prestige Points, the player among them who has purchased the fewest <a href="#development-cards" style={keywordLinkStyle}>Development Cards</a> wins the game.</li>
          </ol>
          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>📊 Prestige Points Scoring</h3>
          <p>Your total Prestige Points are the sum of:</p>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li>Prestige Points printed on the <a href="#development-cards" style={keywordLinkStyle}>Development Cards</a> you have purchased.</li>
            <li>3 Prestige Points for each <a href="#noble-tiles" style={keywordLinkStyle}>Noble tile</a> you possess.</li>
          </ul>
        </section>
        <hr style={{ borderColor: "#FFD700", margin: "2rem 0" }} />
        
        <section id="system-features" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem", color: "#FFD700" }}>⚙️ System Features</h2>
          <p>These features relate to the game system, particularly in digital versions:</p>
          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>⏳ Turn Time Limit & Timeout</h3>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li>Each player have a time limit (<strong>60 seconds</strong>) per turn to perform one action.</li>
            <li>If a player fails to act within the time limit, their turn may automatically pass.</li>
          </ul>
          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem", marginBottom: "0.5rem", color: "#FFD700" }}>💡 Request AI Advice</h3>
          <p>Each player is able to request AI assistance once per game</p>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li>Clicking an &quot;AI Advice&quot; button could provide strategy suggestions.</li>
            <li>The turn timer might pause while waiting for AI advice and resume afterward.</li>
          </ul>
        </section>

      </div> {/* End of Rules Content */}
    </div> /* End of Main Div */
  );
};

export default RulesPage;