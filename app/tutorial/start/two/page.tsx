"use client";

import React, { useState } from "react";
import { tutorialGameState } from "./mockState";

// --- 类型定义 ---
interface Card {
  uuid: string;
  level: `level${1 | 2 | 3}`;
  color: string;
  points: number;
  cost: Record<string, number>;
}
interface Noble {
  uuid: string;
  points: number;
  requirement: Record<string, number>;
}

type TutorialStep =
  | "PreHighlightGem" | "PreHighlightCard" | "PreHighlightNoble"
  | "PreHighlightGold" | "PreHighlightPanel" | "DialogTryCollectGems"
  | "GemCollectDiff" | "EndRoundAfterGemDiff" | "AutoUpdatePlayers"
  | "DialogGemCollectSame" | "GemCollectSame" | "EndRoundAfterGemSame"
  | "ModalLearnBuyCard" | "CardBuyActive" | "EndRoundAfterBuy"
  | "ModalLearnReserve" | "ReserveActive" | "EndRoundAfterReserve"
  | "Completed";

// --- 步骤提示文案 ---
const stepMessages: Record<TutorialStep, string> = {
  PreHighlightGem:      "This is the Gem area. Gems are resources you can collect and use for actions.",
  PreHighlightCard:     "This is the Card area. Development cards give you bonuses and prestige. They are purchased here.",
  PreHighlightNoble:    "This is the Noble area. Nobles visit you when you have enough bonuses, granting extra prestige.",
  PreHighlightGold:     "This is the Gold area. Gold tokens are obtained when you reserve a card and act as wild tokens.",
  PreHighlightPanel:    "This is the Player Panel. It shows your current gems, cards, and reserved cards.",
  DialogTryCollectGems: "Let's try to collect Gems, you can: 1. Collect 3 different color gems 2. Collect 2 same color gems",
  GemCollectDiff:       "",
  EndRoundAfterGemDiff: "End Round. Click OK to finish this round.",
  AutoUpdatePlayers:    "Waiting for other players...",
  DialogGemCollectSame: "Click on 2 of the same color (if there are at least 4 left) gem tokens to collect them.",
  GemCollectSame:       "",
  EndRoundAfterGemSame: "End Round. Click OK to finish this round.",
  ModalLearnBuyCard:    "Click on the card to buy development Card.",
  CardBuyActive:        "",
  EndRoundAfterBuy:     "End Round. Click OK to finish this round.",
  ModalLearnReserve:    "Click the floppy icon on the card to reserve it.",
  ReserveActive:        "",
  EndRoundAfterReserve: "End Round. Click OK to finish this round.",
  Completed:            "Congratulations! You’ve completed the tutorial.",
};

// --- 步骤顺序映射 ---
const nextStep: Partial<Record<TutorialStep, TutorialStep>> = {
  PreHighlightGem:      "PreHighlightCard",
  PreHighlightCard:     "PreHighlightNoble",
  //PreHighlightNoble:    "PreHighlightGold",
  //PreHighlightGold:     "PreHighlightPanel",
  PreHighlightNoble:     "PreHighlightPanel",
  PreHighlightPanel:    "DialogTryCollectGems",
  DialogTryCollectGems: "GemCollectDiff",
  EndRoundAfterGemDiff: "AutoUpdatePlayers",
  AutoUpdatePlayers:    "DialogGemCollectSame",
  DialogGemCollectSame: "GemCollectSame",
  EndRoundAfterGemSame: "ModalLearnBuyCard",
  ModalLearnBuyCard:    "CardBuyActive",
  EndRoundAfterBuy:     "ModalLearnReserve",
  ModalLearnReserve:    "ReserveActive",
  EndRoundAfterReserve: "Completed",
};

// 颜色顺序
const COLOR_ORDER = ["r","g","b","u","w","x"];

// --- Helper: 根据 shortColor 返回实际 CSS 颜色 ---
function getGemColor(shortColor: string): string {
  switch (shortColor) {
    case "r": return "crimson";
    case "g": return "green";
    case "b": return "blue";
    case "u": return "black";
    case "w": return "white";
    case "x": return "gold";
    default:  return "gray";
  }
}

// --- 通用 Modal 组件 ---
const TutorialModal: React.FC<{
  message: string;
  onOk: () => void;
  buttonText?: string;
  overlay?: boolean;
}> = ({ message, onOk, buttonText = "OK", overlay = true }) => (
  <div style={{
    position: "fixed", top: 0, left: 0,
    width: "100%", height: "100%",
    backgroundColor: overlay ? "rgba(0,0,0,0.6)" : "transparent",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      maxWidth: "400px",
      textAlign: "center"
    }}>
      <p style={{ marginBottom: "20px", fontSize: "18px", color: "black" }}>
        {message}
      </p>
      <button onClick={onOk} style={{
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#ff6a00",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
      }}>
        {buttonText}
      </button>
    </div>
  </div>
);

// --- 判断区域可交互 ---
function isAreaActive(step: TutorialStep, area: "gem" | "card" | "reserve") {
  if (area === "gem")    return step === "GemCollectDiff" || step === "GemCollectSame";
  if (area === "card")   return step === "CardBuyActive";
  if (area === "reserve")return step === "ReserveActive";
  return false;
}

// --- 主组件 ---  
export default function TutorialPage() {
  const [step, setStep] = useState<TutorialStep>("PreHighlightGem");
  const [diffSelected, setDiffSelected] = useState<string[]>([]);
  const [sameColor, setSameColor] = useState<string | null>(null);
  const [sameCount, setSameCount] = useState(0);

  const {
    players,
    gems: availableGems,
    cards: tutorialCards,
    nobles: tutorialNobles,
    currentPlayerId
  } = tutorialGameState;

  const currentPlayer = players.find(p => p.userId === currentPlayerId)!;
  const playerGems = currentPlayer.gems;
  const playerCardsCount = Object.values(currentPlayer.cards)
    .flat()
    .reduce<Record<string, number>>((acc, c) => {
      acc[c.color] = (acc[c.color] || 0) + 1;
      return acc;
    }, {});
  
  // 点击 Modal OK
  const handleNext = () => {
    if (step === "Completed") {
      window.location.href = "/tutorial";
      return;
    }
    const nxt = nextStep[step];
    if (nxt) {
      setStep(nxt);
      setDiffSelected([]);
      setSameColor(null);
      setSameCount(0);
    }
  };

  // --- Handler: 收集不同色 gems ---
  const handleGemDiff = (c: string) => {
    if (step !== "GemCollectDiff") return;
    if (diffSelected.includes(c)) return;
    const arr = [...diffSelected, c];
    setDiffSelected(arr);
    if (arr.length >= 3) setTimeout(() => setStep("EndRoundAfterGemDiff"), 500);
  };

  // --- Handler: 收集同色 gems ---
  const handleGemSame = (c: string) => {
    if (step !== "GemCollectSame") return;
    if (sameCount === 0) {
      setSameColor(c);
      setSameCount(1);
    } else if (sameCount === 1 && c === sameColor) {
      setSameCount(2);
      setTimeout(() => setStep("EndRoundAfterGemSame"), 500);
    }
  };

  // --- Handler: 购买卡片 ---
  const handleCardClick = (id: string) => {
    if (step === "CardBuyActive" && id === "I009") {
      setStep("EndRoundAfterBuy");
    }
  };

  // --- Handler: 预留卡片 ---
  const handleReserveClick = (id: string) => {
    if (step === "ReserveActive" && id === "I033") {
      setStep("EndRoundAfterReserve");
    }
  };

  // 判断是否在前置高亮阶段（只影响 Modal overlay）
  const isPreHighlight = [
    "PreHighlightGem","PreHighlightCard","PreHighlightNoble",
    "PreHighlightGold","PreHighlightPanel"
  ].includes(step);

  return (
    <>
      {/* Modal */}
      {stepMessages[step] !== "" && (
        <TutorialModal
          message={stepMessages[step]}
          onOk={handleNext}
          buttonText={step === "Completed" ? "Return" : "OK"}
          overlay={!isPreHighlight}
        />
      )}

      {/* 主布局 */}
      <div
        id="tutorial-board"
        style={{
          backgroundImage: "url('/gamesource/tile_background.png')",
          backgroundSize: "cover",
          minHeight: "100vh",
          padding: "20px",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            width: "100%",
            maxWidth: "1200px",
            gap: "30px",
            marginTop: "20px",
          }}
        >
          {/* 左侧公共区域 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Noble 区 */}
<div
  id="noble-area"
  style={{
    display: "flex",
    gap: "10px",
    padding: "10px",
    boxShadow: step === "PreHighlightNoble" ? "0 0 15px 4px gold" : undefined,
    borderRadius: step === "PreHighlightNoble" ? "6px" : undefined,
  }}
>
  {tutorialNobles.map((noble, i) => (
    <div
      key={noble.uuid}
      id={`noble${i}`}
      className="noble"
      style={{
        cursor: step === "PreHighlightNoble" ? "pointer" : "default",
        padding: "8px",
        backgroundColor: "rgba(50,50,60,0.8)",
        borderRadius: "6px",
        textAlign: "center",
        minWidth: "60px",
        position: "relative", // ✅ 新增：让points和requirements可以绝对定位
      }}
    >
      {/* Points 左上角 */}
      <div
        className="points"
        style={{
          position: "absolute",
          top: "6px",
          left: "6px",
          fontSize: "20px",
          fontWeight: "bold",
          color: "gold",
        }}
      >
        {noble.points}
      </div>

      {/* Requirement 左下角 */}
<div
  className="requirements"
  style={{
    position: "absolute",
    bottom: "6px",
    left: "6px",
    display: "flex",
    flexDirection: "column", // ✅ 改成纵向排列
    gap: "4px",
    justifyContent: "flex-start",
    alignItems: "flex-start", // ✅ 左对齐
  }}
>
  {Object.entries(noble.requirement).map(([col, cnt]) =>
    cnt > 0 ? (
      <div
        key={col}
        style={{
          width: "18px",
          height: "24px",
          
          backgroundColor: getGemColor(col),
          color: col === "w" ? "black" : "white",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {cnt}
      </div>
    ) : null
  )}
</div>

    </div>
  ))}
</div>


            {/* Card 区 */}
            <div
              id="level-area"
              style={{
                padding: "10px",
                boxShadow: step === "PreHighlightCard" ? "0 0 15px 4px gold" : undefined,
                borderRadius: step === "PreHighlightCard" ? "6px" : undefined,
              }}
            >
              {(["level1", "level2", "level3"] as const).map((level) => (
                <div key={level} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                  <div className={`deck ${level}`} />


                  <div style={{ display: "flex", gap: "8px" }}>
                    {tutorialCards[level].slice(0, 4).map((card) => {
                      const buyActive = isAreaActive(step, "card") && card.uuid === "I009";
                      const resActive = isAreaActive(step, "reserve") && card.uuid === "I033";
                      return (
                        <div
                          key={card.uuid}
                          onClick={() => handleCardClick(card.uuid)}
                          className={[
                            "card",
                            `card-${card.color}`,
                            `card-${card.level}`,
                            buyActive || resActive ? "highlight-active highlight-pulse" : "",
                            (isAreaActive(step, "card") && !buyActive) ||
                            (isAreaActive(step, "reserve") && !resActive)
                              ? "disabled"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={{
                            width: "100px",
                            height: "140px",
                            position: "relative",
                            borderRadius: "8px",
                            backgroundColor: "#222",
                            color: "white",
                            overflow: "hidden",
                          }}
                        >
                          {/* reserve 按钮 */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReserveClick(card.uuid);
                            }}
                            className="reserve"
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              opacity: isAreaActive(step, "reserve") ? (resActive ? 1 : 0.3) : 0,
                            }}
                          >
                            <img
                              className="floppy"
                              src="/gamesource/game_page/floppy.png"
                              alt="reserve"
                              style={{ width: "20px", height: "20px" }}
                            />
                          </div>
                          {/* 点数 */}
                          {card.points > 0 && (
                            <div className="points" style={{ fontSize: "32px", margin: "6px" }}>
                              {card.points}
                            </div>
                          )}
                          {/* 花费 cost */}
                          <div
                            className="costs"
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexWrap: "wrap",
                              justifyContent: "flex-start",
                              position: "absolute",
                              bottom: "-80px",
                              left: "6px",
                            }}
                          >

                            {Object.entries(card.cost).map(([col, cnt]) =>
                              cnt > 0 ? (
                                <div
                                  key={col}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "50%",
                                    backgroundColor: getGemColor(col),
                                    color: col === "w" ? "black" : "white",
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {cnt}
                                </div>
                              ) : null
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {/* Gem 区 */}
          <div
            id="gem-area"
            style={{
              padding: "10px",
              boxShadow: step === "PreHighlightGem" ? "0 0 15px 4px gold" : undefined,
              borderRadius: step === "PreHighlightGem" ? "6px" : undefined,
            }}
          >
            {COLOR_ORDER.map((col) => {
              const hlGold = step === "PreHighlightGold" && col === "x";
              const activeDiff = step === "GemCollectDiff";
              const activeSame = step === "GemCollectSame";
              return (
                <div
                  key={col}
                  onClick={() => {
                    if (activeDiff) handleGemDiff(col);
                    if (activeSame) handleGemSame(col);
                  }}
                  className={[
                    "gem",
                    `${col}chip`,
                    hlGold ? "highlight-active" : "",
                    activeDiff || activeSame ? "" : "disabled",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ cursor: activeDiff || activeSame ? "pointer" : "default" }}
                >
                  {/* 数量泡泡 */}
                  <div className="bubble">{availableGems[col]}</div>
                  {/* 选中态 */}
                  {step === "GemCollectDiff" && diffSelected.includes(col) && (
                    <div className="highlight-selected" />
                  )}
                  {step === "GemCollectSame" && sameColor === col && (
                    <div className="highlight-count">{sameCount}</div>
                  )}
                </div>
              );
            })}
          </div>
          </div>

          

          {/* 右侧玩家面板 */}
          <div
            id="player-panel"
            style={{
              backgroundColor: "rgba(0,0,0,0.3)",
              padding: "10px",
              borderRadius: "8px",
              boxShadow: step === "PreHighlightPanel" ? "0 0 15px 4px gold" : undefined,
            }}
          >
            <div style={{ color: "#90ee90", fontWeight: "bold", marginBottom: "8px" }}>
              {currentPlayer.name} (Score: {currentPlayer.score})
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "8px" }}>
              {Object.entries(playerGems).map(([c, cnt]) => (
                <div key={c} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "14px" }}>
                    {cnt} + {playerCardsCount[c] || 0}
                  </div>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      margin: "4px auto",
                      borderRadius: "50%",
                      backgroundColor: "#888",
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "30%",
                    aspectRatio: "0.7",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    border: "1px dashed #ccc",
                    borderRadius: "4px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 呼吸发光动画 */}
      <style jsx>{`
        @keyframes pulseGlow {
          0% {
            transform: scale(1);
            box-shadow: 0 0 10px 4px gold;
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 20px 8px gold;
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 10px 4px gold;
          }
        }
        .highlight-pulse {
          animation: pulseGlow 1.5s infinite ease-in-out;
        }
      `}</style>
    </>
  );
}
