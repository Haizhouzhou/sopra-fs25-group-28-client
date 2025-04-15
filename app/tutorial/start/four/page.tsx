"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../../../styles/globals.css";
import { gameState as initialGameState } from "./mockState";

// 定义基础数据类型
interface Card {
  uuid: string;
  level: string;
  color: string;
  points: number;
  cost: { [key: string]: number };
}

interface Noble {
  uuid: string;
  points: number;
  requirement: { [color: string]: number };
}

interface Player {
  id: number;
  name: string;
  uuid: string;
  score: number;
  cards: { [level: string]: Card[] };
  gems: { [color: string]: number };
  nobles: Noble[];
  reserved: Card[];
}

interface GameState {
  players: Player[];
  gems: { [color: string]: number };
  cards: { [level: string]: Card[] };
  nobles: Noble[];
  decks: { [level: string]: number };
  turn: number;
  log: string[];
  winner: number | null;
}

// 倒计时组件
const CountdownTimer = ({ initialSeconds = 30 }: { initialSeconds?: number }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);
  return (
    <div style={{ fontSize: "24px", fontWeight: "bold", margin: "10px" }}>
      {seconds > 0 ? `Time remaining: ${seconds}s` : "Time's up!"}
    </div>
  );
};

// 定义 Tutorial 阶段枚举（增加买卡和保留阶段）
enum TutorialStep {
  PreHighlightGem,         // 0：介绍 Gem 区
  PreHighlightCard,        // 1：介绍 Card 区
  PreHighlightNoble,       // 2：介绍 Noble 区
  PreHighlightGold,        // 3：介绍 Gold（即 "*" gem）
  PreHighlightPanel,       // 4：介绍玩家面板
  DialogTryCollectGems,    // 5：弹窗提示：Let's try to collect Gems...
  GemCollectDiff,          // 6：Gem 收集（3个不同颜色）
  EndRoundAfterGemDiff,    // 7：弹窗：End Round（gem diff 收集完成）
  AutoUpdatePlayers,       // 8：自动更新其他玩家面板（刷新 3 次）
  DialogGemCollectSame,    // 9：弹窗提示：Click on 2 same color gem tokens...
  GemCollectSame,          // 10：Gem 同色收集
  EndRoundAfterGemSame,    // 11：弹窗：End Round（gem same 收集完成）
  ModalLearnBuyCard,       // 12：弹窗提示：Learn how to buy development Card
  CardBuyActive,           // 13：买卡阶段：禁用其他区域，仅目标卡牌 "I009" 激活
  EndRoundAfterBuy,        // 14：弹窗：End Round（buy card 完成）
  ModalLearnReserve,       // 15：弹窗提示：Click the floppy icon on the card to reserve it
  ReserveActive,           // 16：保留卡阶段：禁用其他区域，仅目标卡牌 "I033" 的 reserve 图标激活
  EndRoundAfterReserve,    // 17：弹窗：End Round（reserve 完成）
  Completed                // 18：Tutorial 完成
}

// InfoBox 组件用于 PreHighlight 阶段，不全屏遮挡，带高亮边框
function InfoBox({ message, onOk }: { message: string; onOk: () => void }) {
  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.9)",
      padding: "10px",
      border: "3px solid #ffd700",
      borderRadius: "8px",
      margin: "20px",
      maxWidth: "400px"
    }}>
      <p>{message}</p>
      <button onClick={onOk} style={{ padding: "4px 8px", marginTop: "10px" }}>OK</button>
    </div>
  );
}

// Modal 组件用于全屏弹窗提示
function Modal({ message, onOk }: { message: string; onOk: () => void }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", padding: "20px", borderRadius: "8px",
        maxWidth: "400px", textAlign: "center"
      }}>
        <p>{message}</p>
        <button onClick={onOk} style={{ padding: "8px 16px", marginTop: "10px" }}>OK</button>
      </div>
    </div>
  );
}

// 通用 disabled 样式
const disabledStyle = { opacity: 0.5, pointerEvents: "none" as const };

export default function TutorialGamePage({ params }: { params: { id: string } }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const router = useRouter();
  const currentUser = { id: 1, name: "Me", uuid: "p1" };

  // Tutorial 当前阶段状态
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(TutorialStep.PreHighlightGem);
  // 用于 GemCollectDiff 阶段，记录已点击的不同 gem（颜色）
  const [collectedDiffGems, setCollectedDiffGems] = useState<string[]>([]);
  // 用于 GemCollectSame 阶段，记录每种 gem 的点击次数
  const [collectedSameGems, setCollectedSameGems] = useState<{ [color: string]: number }>({});
  // 自动更新其他玩家计数（Gem 收集完自动更新玩家阶段）
  const [updateCount, setUpdateCount] = useState(0);

  // 模拟交互动作（基本逻辑保持不变）
  const simulateAction = (action: string, target: string, extraData?: any) => {
    console.log("Simulate Action:", action, target, extraData);
    switch (action) {
      case "take":
        setGameState(prev => {
          const newGems = { ...prev.gems, [target]: Math.max(prev.gems[target] - 1, 0) };
          const updatedPlayers = prev.players.map(player => {
            if (player.id === currentUser.id) {
              return { ...player, gems: { ...player.gems, [target]: (player.gems[target] || 0) + 1 } };
            }
            return player;
          });
          return { ...prev, gems: newGems, players: updatedPlayers };
        });
        break;
      case "buy":
        setGameState(prev => {
          const newCards = { ...prev.cards };
          for (const level in newCards) {
            newCards[level] = newCards[level].filter(card => card.uuid !== target);
          }
          const cardBought = Object.values(prev.cards).flat().find(card => card.uuid === target);
          const updatedPlayers = prev.players.map(player => {
            if (player.id === currentUser.id && cardBought) {
              const playerCards = { ...player.cards };
              if (!playerCards[cardBought.level]) playerCards[cardBought.level] = [];
              playerCards[cardBought.level] = [...playerCards[cardBought.level], cardBought];
              return { ...player, cards: playerCards };
            }
            return player;
          });
          return { ...prev, cards: newCards, players: updatedPlayers };
        });
        break;
      case "reserve":
        setGameState(prev => {
          const newCards = { ...prev.cards };
          for (const level in newCards) {
            newCards[level] = newCards[level].filter(card => card.uuid !== target);
          }
          const cardReserved = Object.values(prev.cards).flat().find(card => card.uuid === target);
          const updatedPlayers = prev.players.map(player => {
            if (player.id === currentUser.id && cardReserved) {
              return { ...player, reserved: [...player.reserved, cardReserved] };
            }
            return player;
          });
          let newGold = prev.gems["*"];
          if (newGold > 0) {
            newGold = newGold - 1;
            updatedPlayers.forEach(player => {
              if (player.id === currentUser.id) {
                player.gems["*"] = (player.gems["*"] || 0) + 1;
              }
            });
          }
          return { ...prev, cards: newCards, players: updatedPlayers, gems: { ...prev.gems, "*": newGold } };
        });
        break;
      case "noble_visit":
        setGameState(prev => {
          const nobleVisited = prev.nobles.find(noble => noble.uuid === target);
          const newNobles = prev.nobles.filter(noble => noble.uuid !== target);
          const updatedPlayers = prev.players.map(player => {
            if (player.id === currentUser.id && nobleVisited) {
              return { ...player, nobles: [...player.nobles, nobleVisited], score: player.score + 3 };
            }
            return player;
          });
          return { ...prev, nobles: newNobles, players: updatedPlayers };
        });
        break;
      case "next":
        setGameState(prev => {
          const nextTurn = (prev.turn + 1) % prev.players.length;
          return { ...prev, turn: nextTurn };
        });
        break;
      default:
        console.log("Action not simulated:", action);
    }
  };

  // Gem 区点击处理
  const handleGemClick = (color: string) => {
    if (tutorialStep === TutorialStep.GemCollectDiff) {
      if (!collectedDiffGems.includes(color) && collectedDiffGems.length < 3) {
        setCollectedDiffGems([...collectedDiffGems, color]);
        simulateAction("take", color);
        if (collectedDiffGems.length + 1 === 3) {
          setTimeout(() => setTutorialStep(TutorialStep.EndRoundAfterGemDiff), 500);
        }
      }
    } else if (tutorialStep === TutorialStep.GemCollectSame) {
      setCollectedSameGems(prev => {
        const count = prev[color] || 0;
        if (count < 2) {
          simulateAction("take", color);
          const newCount = count + 1;
          const updated = { ...prev, [color]: newCount };
          if (newCount === 2) {
            setTimeout(() => setTutorialStep(TutorialStep.EndRoundAfterGemSame), 500);
          }
          return updated;
        }
        return prev;
      });
    }
  };

  // 自动更新其他玩家面板：在 AutoUpdatePlayers 阶段，每隔 1s 调用一次 "next"，累计 3 次后进入 DialogGemCollectSame
  useEffect(() => {
    if (tutorialStep === TutorialStep.AutoUpdatePlayers && updateCount < 3) {
      const t = setTimeout(() => {
        simulateAction("next", "");
        setUpdateCount(updateCount + 1);
      }, 1000);
      return () => clearTimeout(t);
    } else if (tutorialStep === TutorialStep.AutoUpdatePlayers && updateCount === 3) {
      setTutorialStep(TutorialStep.DialogGemCollectSame);
    }
  }, [tutorialStep, updateCount]);

  // CardBuyActive 阶段，仅允许点击目标卡牌 "I009"
  const handleCardClick = (cardUuid: string) => {
    if (tutorialStep === TutorialStep.CardBuyActive && cardUuid === "I009") {
      simulateAction("buy", cardUuid);
      setTutorialStep(TutorialStep.EndRoundAfterBuy);
    }
  };

  // ReserveActive 阶段，仅允许点击目标卡牌 "I033"的floppy图标
  const handleReserveClick = (cardUuid: string) => {
    if (tutorialStep === TutorialStep.ReserveActive && cardUuid === "I033") {
      simulateAction("reserve", cardUuid);
      setTutorialStep(TutorialStep.EndRoundAfterReserve);
    }
  };

  // InfoBox 用于 PreHighlight 阶段
  const renderInfoBox = () => {
    switch (tutorialStep) {
      case TutorialStep.PreHighlightGem:
        return (
          <InfoBox
            message="This is the Gem area. Gems are resources you can collect and use for actions."
            onOk={() => setTutorialStep(TutorialStep.PreHighlightCard)}
          />
        );
      case TutorialStep.PreHighlightCard:
        return (
          <InfoBox
            message="This is the Card area. Development cards give you bonuses and prestige. They are purchased here."
            onOk={() => setTutorialStep(TutorialStep.PreHighlightNoble)}
          />
        );
      case TutorialStep.PreHighlightNoble:
        return (
          <InfoBox
            message="This is the Noble area. Nobles visit you when you have enough bonuses, granting extra prestige."
            onOk={() => setTutorialStep(TutorialStep.PreHighlightGold)}
          />
        );
      case TutorialStep.PreHighlightGold:
        return (
          <InfoBox
            message="This is the Gold area. Gold tokens are obtained when you reserve a card and act as wild tokens."
            onOk={() => setTutorialStep(TutorialStep.PreHighlightPanel)}
          />
        );
      case TutorialStep.PreHighlightPanel:
        return (
          <InfoBox
            message="This is the Player Panel. It shows your current gems, cards, and reserved cards."
            onOk={() => setTutorialStep(TutorialStep.DialogTryCollectGems)}
          />
        );
      default:
        return null;
    }
  };

  // Modal 用于全屏弹窗提示
  const renderModal = () => {
    switch (tutorialStep) {
      case TutorialStep.DialogTryCollectGems:
        return (
          <Modal
            message="Let's try to collect Gems, you can: 1. Collect 3 different color gems 2. Collect 2 same color gems"
            onOk={() => setTutorialStep(TutorialStep.GemCollectDiff)}
          />
        );
      case TutorialStep.EndRoundAfterGemDiff:
        return (
          <Modal
            message="End Round. Click OK to finish this round."
            onOk={() => setTutorialStep(TutorialStep.AutoUpdatePlayers)}
          />
        );
      case TutorialStep.DialogGemCollectSame:
        return (
          <Modal
            message="Click on 2 of the same color (if there are at least 4 left) gem tokens to collect them."
            onOk={() => setTutorialStep(TutorialStep.GemCollectSame)}
          />
        );
      case TutorialStep.EndRoundAfterGemSame:
        return (
          <Modal
            message="End Round. Click OK to finish this round."
            onOk={() => setTutorialStep(TutorialStep.ModalLearnBuyCard)}
          />
        );
      case TutorialStep.ModalLearnBuyCard:
        return (
          <Modal
            message="Learn how to buy development Card."
            onOk={() => setTutorialStep(TutorialStep.CardBuyActive)}
          />
        );
      case TutorialStep.EndRoundAfterBuy:
        return (
          <Modal
            message="End Round. Click OK to finish this round."
            onOk={() => setTutorialStep(TutorialStep.ModalLearnReserve)}
          />
        );
      case TutorialStep.ModalLearnReserve:
        return (
          <Modal
            message="Click the floppy icon on the card to reserve it."
            onOk={() => setTutorialStep(TutorialStep.ReserveActive)}
          />
        );
      case TutorialStep.EndRoundAfterReserve:
        return (
          <Modal
            message="End Round. Click OK to finish this round."
            onOk={() => setTutorialStep(TutorialStep.Completed)}
          />
        );
      default:
        return null;
    }
  };

  // 根据当前阶段控制各区域样式：
  // Gem 区：PreHighlightGem 和 DialogTryCollectGems、GemCollectDiff、GemCollectSame时激活，
  // 其余阶段禁用（但 PreHighlightGold不禁用，只对 "*" 添加额外边框）
  const gemAreaStyle = (() => {
    if (tutorialStep === TutorialStep.PreHighlightGem) {
      return { border: "3px solid #ffd700" };
    }
    return (tutorialStep === TutorialStep.GemCollectDiff || tutorialStep === TutorialStep.GemCollectSame ||
            tutorialStep === TutorialStep.DialogTryCollectGems) ? {} : disabledStyle;
  })();

  // Card 区：PreHighlightCard和 CardBuyActive阶段激活，其余禁用
  const cardAreaStyle = (() => {
    if (tutorialStep === TutorialStep.PreHighlightCard) {
      return { border: "3px solid #ffd700" };
    }
    return (tutorialStep === TutorialStep.CardBuyActive) ? {} : disabledStyle;
  })();

  // Noble 区：PreHighlightNoble阶段激活，其余禁用
  const nobleAreaStyle = (() => {
    if (tutorialStep === TutorialStep.PreHighlightNoble) {
      return { border: "3px solid #ffd700" };
    }
    return disabledStyle;
  })();

  // 玩家面板：PreHighlightPanel阶段激活，其余禁用
  const panelAreaStyle = (() => {
    if (tutorialStep === TutorialStep.PreHighlightPanel) {
      return { border: "3px solid #ffd700" };
    }
    return disabledStyle;
  })();

  // 在 CardBuyActive 阶段，立即禁用 Gem、Noble、Panel 区；在 ReserveActive 阶段，禁用除 Reserve 区中目标 card 外的所有区域
  const globalDisableForBuy = (tutorialStep === TutorialStep.CardBuyActive);
  const globalDisableForReserve = (tutorialStep === TutorialStep.ReserveActive);

  return (
    <div
      id="game-board"
      style={{
        backgroundImage: "url('/gamesource/tile_background.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
        backgroundPosition: "center center",
        minHeight: "100vh",
        width: "100%",
        padding: "20px",
        color: "#fff",
      }}
    >
      {/* PreHighlight 阶段使用 InfoBox，其他使用全屏 Modal */}
      {tutorialStep >= TutorialStep.PreHighlightGem && tutorialStep <= TutorialStep.PreHighlightPanel
        ? renderInfoBox()
        : renderModal()}
      <CountdownTimer initialSeconds={30} />

      {/* 主体布局：公共区（左侧） */}
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          gap: "40px",
        }}
      >
        <div
          id="common-area"
          style={{
            flex: "3",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Noble 区 */}
          <div id="noble-area" style={globalDisableForBuy || globalDisableForReserve ? disabledStyle : nobleAreaStyle}>
            {gameState.nobles.map((noble, idx) => (
              <div
                key={noble.uuid}
                id={`noble${idx}`}
                className="noble"
                onClick={() => simulateAction("noble_visit", noble.uuid)}
                style={{ cursor: "pointer" }}
              >
                <div className="side-bar">
                  <div className="points">{noble.points}</div>
                  <div className="requirement">
                    {Object.entries(noble.requirement).map(([color, count]) =>
                      count > 0 ? (
                        <div key={color} className={`requires ${color}`}>
                          {count}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 卡牌区 */}
          <div id="level-area" style={{ minWidth: "1200px", ...(globalDisableForBuy || globalDisableForReserve ? disabledStyle : cardAreaStyle) }}>
            {["level1", "level2", "level3"].map((level) => (
              <div key={level} className="card-row" style={{ display: "flex", gap: "20px", marginBottom: "20px", zIndex: 10 }}>
                {/* 卡堆 */}
                <div className={`deck ${level}`} style={{ width: "117px", height: "162px", position: "relative", ...(globalDisableForBuy || globalDisableForReserve ? disabledStyle : cardAreaStyle) }}>
                  <div className="remaining" style={{ position: "absolute", top: "5px", left: "5px" }}>
                    {gameState.decks[level] ?? 0}
                  </div>
                  <div className="overlay"></div>
                  <div
                    className="reserve"
                    onClick={() => simulateAction("reserve", level)}
                    style={{ cursor: "pointer" }}
                  >
                    <img className="floppy" src="/gamesource/game_page/floppy.png" alt="reserve" />
                  </div>
                </div>
                {/* 翻开卡牌 */}
                <div className={`c_${level} face-up-cards`}>
                  <div className="cards-inner" style={{ display: "flex", gap: "20px", overflowX: "auto" }}>
                    {gameState.cards[level]?.map((card) => (
                      <div
                        key={card.uuid}
                        className={`card card-${card.color} card-${card.level}`}
                        style={{
                          width: "117px",
                          height: "162px",
                          position: "relative",
                          cursor: tutorialStep === TutorialStep.CardBuyActive
                            ? (card.uuid === "I009" ? "pointer" : "default")
                            : (globalDisableForReserve ? "default" : "pointer"),
                        }}
                        onClick={() =>
                          tutorialStep === TutorialStep.CardBuyActive
                            ? handleCardClick(card.uuid)
                            : simulateAction("buy", card.uuid)
                        }
                      >
                        <div
                          className="reserve"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 在 ReserveActive 阶段，仅允许点击目标卡的 reserve 图标
                            if (tutorialStep === TutorialStep.ReserveActive && card.uuid === "I033") {
                              handleReserveClick(card.uuid);
                            } else {
                              simulateAction("reserve", card.uuid);
                            }
                          }}
                          style={{ position: "absolute", top: "5px", right: "5px", cursor: "pointer" }}
                        >
                          <img className="floppy" src="/gamesource/game_page/floppy.png" alt="reserve" />
                        </div>
                        <div className="overlay"></div>
                        <div className="underlay"></div>
                        <div className="header">
                          <div className={`color ${card.color}gem`}></div>
                          <div className="points">{card.points > 0 ? card.points : ""}</div>
                        </div>
                        <div className="costs">
                          {Object.entries(card.cost).map(([color, count]) =>
                            count > 0 ? (
                              <div key={color} className={`cost ${color}`}>
                                {count}
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 公共宝石区 */}
          <div id="gem-area" style={{ display: "flex", gap: "10px", marginTop: "40px", ...(globalDisableForBuy || globalDisableForReserve ? disabledStyle : gemAreaStyle) }}>
            {Object.entries(gameState.gems).map(([color, count]) => {
              const chipClass = color === "*" ? "schip" : `${color}chip`;
              const extraStyle = (color === "*" && tutorialStep === TutorialStep.PreHighlightGold)
                ? { border: "3px solid #ffd700" }
                : {};
              return (
                <div
                  key={color}
                  className={`gem ${chipClass}`}
                  onClick={() =>
                    (tutorialStep === TutorialStep.GemCollectDiff ||
                      tutorialStep === TutorialStep.GemCollectSame)
                      ? handleGemClick(color)
                      : simulateAction("take", color)
                  }
                  style={{ cursor: "pointer", ...extraStyle }}
                >
                  <div className="bubble">{count}</div>
                  <div className="underlay"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 玩家面板 */}
        <div
          id="player-area"
          style={{
            flex: "1",
            ...panelAreaStyle,
            padding: "10px",
            borderRadius: "8px",
            minWidth: "500px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {gameState.players.map((player) => {
            const colorToChip: Record<string, string> = {
              r: "red",
              g: "green",
              b: "blue",
              u: "black",
              w: "white",
              "*": "gold",
            };
            return (
              <div key={player.uuid} className="player">
                <div className="playerHeader" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{player.name}</span>
                  <span>Score: {player.score}</span>
                  {gameState.turn === player.id && <span className="turnIndicator">←</span>}
                </div>
                {player.nobles.length > 0 && (
                  <div className="nobleStat">
                    <div>Nobles:</div>
                    <div className="nobleCards" style={{ display: "flex", gap: "5px" }}>
                      {player.nobles.map((noble) => (
                        <div key={noble.uuid} className="noble" style={{ width: "40px", height: "40px", border: "1px solid #fff" }} />
                      ))}
                    </div>
                  </div>
                )}
                <div className="gem-stats" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {Object.entries(player.gems).map(([color, count]) => {
                    const normalizedColor = color.toLowerCase();
                    const cardCount = Object.values(player.cards || {})
                      .flat()
                      .filter((card) => card.color.toLowerCase() === normalizedColor).length;
                    return (
                      <div key={color} className="statSet" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div className="stat">{count}/{cardCount}</div>
                        <div className={`chip chip-${colorToChip[normalizedColor] || "black"}`} style={{ width: "20px", height: "20px" }} />
                      </div>
                    );
                  })}
                </div>
                <div className="reserveCards" style={{ display: "flex", gap: "10px", minHeight: "220px" }}>
                  {[0, 1, 2].map((i) => {
                    const card = player.reserved[i];
                    return card ? (
                      <div key={card.uuid} className={`card card-sm card-${card.color}`} style={{ width: "80px", height: "120px", border: "1px solid #fff" }}>
                        <div className="points">{card.points}</div>
                        <div className="costs">
                          {Object.entries(card.cost).map(([color, count]) =>
                            count > 0 ? (
                              <div key={color} className={`cost ${color}`}>{count}</div>
                            ) : null
                          )}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="card card-sm placeholder-card" style={{ width: "80px", height: "120px", border: "1px dashed #fff" }} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pass turn 按钮 */}
      <button
        id="pass-turn"
        onClick={() => {
          if (tutorialStep === TutorialStep.GemCollectDiff && collectedDiffGems.length === 3) {
            setTutorialStep(TutorialStep.EndRoundAfterGemDiff);
          } else if (tutorialStep === TutorialStep.GemCollectSame && Object.values(collectedSameGems).some(count => count >= 2)) {
            setTutorialStep(TutorialStep.EndRoundAfterGemSame);
          } else if (tutorialStep === TutorialStep.CardBuyActive) {
            // 此时等待用户点击目标卡牌
          } else if (tutorialStep === TutorialStep.EndRoundAfterBuy) {
            setTutorialStep(TutorialStep.ModalLearnReserve);
          }
        }}
        style={{
          margin: "20px auto",
          padding: "10px 20px",
          backgroundColor:
            (tutorialStep === TutorialStep.GemCollectDiff && collectedDiffGems.length === 3) ||
            tutorialStep === TutorialStep.AutoUpdatePlayers ||
            (tutorialStep === TutorialStep.GemCollectSame && Object.values(collectedSameGems).some(count => count >= 2)) ||
            tutorialStep === TutorialStep.CardBuyActive ||
            tutorialStep === TutorialStep.EndRoundAfterBuy ||
            tutorialStep === TutorialStep.EndRoundAfterReserve
              ? "#ffd700"
              : "#ccc",
          color: "black",
          border: "none",
          borderRadius: "5px",
          cursor:
            (tutorialStep === TutorialStep.GemCollectDiff && collectedDiffGems.length === 3) ||
            tutorialStep === TutorialStep.AutoUpdatePlayers ||
            (tutorialStep === TutorialStep.GemCollectSame && Object.values(collectedSameGems).some(count => count >= 2)) ||
            tutorialStep === TutorialStep.CardBuyActive ||
            tutorialStep === TutorialStep.EndRoundAfterBuy ||
            tutorialStep === TutorialStep.EndRoundAfterReserve
              ? "pointer"
              : "default",
          fontSize: "16px",
          fontWeight: "bold",
          display: "block",
        }}
      >
        Pass turn
      </button>

      {/* Exit 按钮，始终显示 */}
      <button
        onClick={() => router.push("../")}
        style={{
            position: "fixed",
            top: "70px",// 原来20px 改为35px
            right: "20px",
            padding: "8px 12px",
            backgroundColor: "#f00",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            zIndex: 9999,
        }}
        >
        Exit
        </button>

    </div>
  );
}
