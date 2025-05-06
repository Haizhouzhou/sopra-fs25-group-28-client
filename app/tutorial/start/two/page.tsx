/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";
import { useParams } from "next/navigation";
import { useWebSocket, WebSocketMessage } from "@/hooks/useWebSocket";
import { useGameState } from "@/hooks/useGameStateContext";
import ResponsiveGameWrapper from "components/ui/ResponsiveGameWrapper";

// --- 接口定义 ---
interface Card {
  uuid: string;
  level: string;
  color: string;
  points: number;
  cost: { [key: string]: number };
  id?: number;
}
interface Noble {
  uuid: string;
  points: number;
  requirement: { [key: string]: number };
  id?: number;
}
interface Player {
  uuid: string;
  id: number | string;
  name: string;
  score: number;
  cards: { [level: string]: Card[] };
  gems: { [color: string]: number };
  nobles: Noble[];
  reserved: Card[];
  userId?: number | string;
  status?: boolean;
}
interface GameState {
  players: Player[];
  gems: { [color: string]: number };
  cards: { [level: string]: Card[] };
  nobles: Noble[];
  decks: { [level: string]: number };
  roomName: string;
  turn?: number;
  log?: string[];
  winner?: number | null;
  currentPlayerId?: number | string;
}
interface ChatMessage {
  player: string;
  text: string;
  timestamp: number;
}
interface GameOverPlayer {
  userId: number | string;
  name: string;
  avatar?: string;
  victoryPoints: number;
}
interface GameOverData {
  players: GameOverPlayer[];
  winnerId: number | string;
}
type TutorialStep =
  | "PreHighlightGem"
  | "PreHighlightCard"
  | "PreHighlightNoble"
  | "PreHighlightPanel"
  | "DialogTryCollectGems"
  | "GemCollectDiff"
  | "EndRoundAfterGemDiff"
  | "DialogGemCollectSame"
  | "GemCollectSame"
  | "EndRoundAfterGemSame"
  | "ModalLearnBuyCard"
  | "CardBuyActive"
  | "EndRoundAfterBuy"
  | "ModalLearnReserve"
  | "ReserveActive"
  | "EndRoundAfterReserve"
  | "Completed";

// 色序
const COLOR_ORDER: string[] = ["r", "g", "b", "u", "w", "x"];

// 初始 Tutorial 用 gameState
const initialTutorialGameState: GameState = {
  players: [
    {
      uuid: "player1_tutorial",
      id: "player1_tutorial",
      userId: "player1_tutorial",
      name: "You (Tutorial)",
      score: 0,
      gems: { r: 1, g: 1, b: 1, u: 1, w: 1, x: 0 },
      cards: { level1: [], level2: [], level3: [] },
      nobles: [],
      reserved: [],
      status: true,
    },
    {
      uuid: "player2_dummy",
      id: "player2_dummy",
      userId: "player2_dummy",
      name: "Opponent 1",
      score: 2,
      gems: { r: 2, g: 0, b: 2, u: 0, w: 1, x: 1 },
      cards: { level1: [], level2: [], level3: [] },
      nobles: [],
      reserved: [],
      status: false,
    },
    {
      uuid: "player3_dummy",
      id: "player3_dummy",
      userId: "player3_dummy",
      name: "Opponent 2",
      score: 1,
      gems: { r: 0, g: 2, b: 0, u: 2, w: 0, x: 0 },
      cards: { level1: [], level2: [], level3: [] },
      nobles: [],
      reserved: [],
      status: false,
    },
    {
      uuid: "player4_dummy",
      id: "player4_dummy",
      userId: "player4_dummy",
      name: "Opponent 3",
      score: 0,
      gems: { r: 1, g: 1, b: 1, u: 1, w: 1, x: 0 },
      cards: { level1: [], level2: [], level3: [] },
      nobles: [],
      reserved: [],
      status: false,
    },
  ],
  gems: { r: 4, g: 4, b: 4, u: 4, w: 4, x: 5 },
  cards: {
    level1: [
      { uuid: "c1-1t", level: "level1", color: "b", points: 0, cost: { w: 1, u: 1, g: 1, r: 1 }, id: 1 },
      { uuid: "c1-2t", level: "level1", color: "g", points: 0, cost: { b: 1, r: 2 }, id: 2 },
      { uuid: "c1-3t", level: "level1", color: "r", points: 0, cost: { w: 3 }, id: 3 },
      { uuid: "c1-4t", level: "level1", color: "w", points: 1, cost: { u: 4 }, id: 4 },
    ],
    level2: [
      { uuid: "c2-1t", level: "level2", color: "u", points: 1, cost: { b: 3, g: 2, r: 2 }, id: 41 },
      { uuid: "c2-2t", level: "level2", color: "r", points: 2, cost: { g: 5 }, id: 42 },
      { uuid: "c2-3t", level: "level2", color: "w", points: 2, cost: { r: 5, u: 3 }, id: 43 },
      { uuid: "c2-4t", level: "level2", color: "b", points: 3, cost: { w: 6 }, id: 44 },
    ],
    level3: [
      { uuid: "c3-1t", level: "level3", color: "g", points: 3, cost: { w: 3, b: 3, u: 5, r: 3 }, id: 71 },
      { uuid: "c3-2t", level: "level3", color: "w", points: 4, cost: { r: 7 }, id: 72 },
      { uuid: "c3-3t", level: "level3", color: "u", points: 4, cost: { w: 3, g: 6, b: 3 }, id: 73 },
      { uuid: "c3-4t", level: "level3", color: "b", points: 5, cost: { w: 7, u: 3 }, id: 74 },
    ],
  },
  nobles: [
    { uuid: "n1t", points: 3, requirement: { r: 4, g: 4 }, id: 1 },

    { uuid: "n4t", points: 3, requirement: { g: 3, b: 3, u: 3 }, id: 4 },
    { uuid: "n5t", points: 3, requirement: { w: 3, r: 3, u: 3 }, id: 5 },
  ],
  decks: { level1: 36, level2: 26, level3: 16 },
  roomName: "Tutorial Room",
  currentPlayerId: "player1_tutorial",
  turn: 0,
  log: [],
  winner: null,
};


export default function TutorialFourPage() {
  
  // —— WebSocket & Context Hook —— //
  const stableSessionId = useRef(`tutorial-session-${Date.now()}`).current;
  const { lastGameState: contextGameState } = useGameState();

  // —— 通用 State —— //
  const [gameState, setGameState] =
    useState<GameState | null>(initialTutorialGameState);
  const [roomName] = useState(initialTutorialGameState.roomName);
  const [seconds, setSeconds] = useState(59);


  // —— Tutorial 专属 State —— //
  const [step, setStep] = useState<TutorialStep>("PreHighlightGem");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<string>("");
  const [highlightedArea, setHighlightedArea] =
    useState<string | null>(null);
  const [diffSelected, setDiffSelected] = useState<string[]>([]);
  const [sameSelected, setSameSelected] = useState<{
    color: string | null;
    count: number;
  }>({ color: null, count: 0 });
  const currentUser = {
    id: "player1_tutorial",
    name: "You (Tutorial)",
    uuid: "player1_tutorial",
  };
  // tutorialPlayer 引用
  const tutorialPlayer =
    gameState?.players.find((p) => p.id === currentUser.id) ||
    gameState!.players[0];

  // === 新增：判断能否购买卡片（Tutorial 专用） === //
  const canAffordCardTutorial = useCallback(
    (card: Card): boolean => {
      if (!tutorialPlayer || !gameState) return false;
      // 复制玩家宝石
      const playerGems = { ...tutorialPlayer.gems };
      let goldNeeded = 0;
      // 统计已购卡带来的折扣
      const ownedCards = Object.values(tutorialPlayer.cards).flat();
      const discounts: Record<string, number> = {};
      ["r", "g", "b", "u", "w"].forEach((c) => {
        discounts[c] = ownedCards.filter((x) => x.color === c).length;
      });
      // 先用折扣再用宝石，不够用 x
      Object.entries(card.cost).forEach(([clr, cnt]) => {
        if (clr === "x") return;
        const needed = Math.max(0, cnt - (discounts[clr] || 0));
        if ((playerGems[clr] || 0) >= needed) {
          playerGems[clr] = (playerGems[clr] || 0) - needed;
        } else {
          goldNeeded += needed - (playerGems[clr] || 0);
          playerGems[clr] = 0;
        }
      });
      return (playerGems.x || 0) >= goldNeeded;
    },
    [tutorialPlayer, gameState]
  );

  // —— WebSocket 消息处理占位 —— //
  function handleWebSocketMessage(msg: WebSocketMessage) {
    console.log("Tutorial: Received WS message:", msg);
  }
const [isTimeUp, setIsTimeUp] = useState(false);
  // 其余 useEffect、handler、render 函数保留不变……
  useEffect(() => {
    // 定时器
    if (seconds <= 0) return;
    const t = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seconds]);

  // ========== Tutorial 专属 Logic: 步骤文字、高亮、下一步 ========== //
  const getModalContent = (s: TutorialStep): string => {
    switch (s) {
      case "PreHighlightGem":
        return "This is the Gem area. Gems are the resources you use to take actions.";
      case "PreHighlightCard":
        return "This is the Card area. Cards provide permanent gem discounts and prestige points.";
      case "PreHighlightNoble":
        return "This is the Noble area. Fulfill their requirements to gain an extra 3 prestige points.";
      case "PreHighlightPanel":
        return "This is the Player Panel. It shows each player's gems, card discounts, score, and reserved cards.";
      case "DialogTryCollectGems":
        return "Let's start by collecting gems. You can either take 3 gems of different colors, OR 2 gems of the same color (only if there are at least 4 of that color available). Click 'OK' to continue.";
      case "GemCollectDiff":
        return "ACTION: Select 3 gems of different colors from the supply."; // Provide action text even if modal hides
      case "EndRoundAfterGemDiff":
        return "Great! You took 3 different gems. This ends your turn. Click 'OK' to learn the other way to collect gems.";
      case "DialogGemCollectSame":
        return "Now, let's try taking 2 gems of the same color. Remember, you can only do this if there are at least 4 gems of that color available in the supply. Click 'OK' to try.";
      case "GemCollectSame":
        return "ACTION: Select 2 gems of the same color (from a pile with 4+). Click the same pile twice."; // Provide action text
      case "EndRoundAfterGemSame":
        return "Excellent! You took 2 gems of the same color. Your turn ends. Click 'OK' to learn how to buy cards.";
      case "ModalLearnBuyCard":
        return "Next, let's buy a card. Choose a card you can afford using your gem discounts (from previously bought cards), your gem tokens, and gold (joker) gems if needed. Affordable cards will be highlighted. Click 'OK', then click an affordable card.";
      case "CardBuyActive":
        return "ACTION: Click on a highlighted card (one you can afford) to purchase it."; // Provide action text
      case "EndRoundAfterBuy":
        return "Purchase successful! The card is added to your panel, providing a permanent discount and points. Your turn ends. Click 'OK' to learn about reserving cards.";
      case "ModalLearnReserve":
        return "You can also reserve a card. This moves the card to your reserved area (max 3). You also take one gold (joker) gem, if available. Reserved cards can only be purchased by you later. Click 'OK', then click any card to reserve it.";
      case "ReserveActive":
        return "ACTION: Click on any card from the board or decks to reserve it."; // Provide action text
      case "EndRoundAfterReserve":
        return "Reservation successful! You received a gold gem (if one was available). Only you can buy this reserved card later. Your turn ends. Click 'OK' to finish the tutorial.";
      case "Completed":
        return "Tutorial Complete! You've learned the basic actions: taking gems, buying cards, and reserving cards. Enjoy the game!";
      default:
          return ""; // Should not happen
    }
    return "";
  };

  const handleNext = () => {
    switch (step) {
      case "PreHighlightGem":
        setStep("PreHighlightCard");
        break;
      case "PreHighlightCard":
        setStep("PreHighlightNoble");
        break;
      case "PreHighlightNoble":
        setStep("PreHighlightPanel");
        break;
      case "PreHighlightPanel":
        setStep("DialogTryCollectGems");
        break;
      case "DialogTryCollectGems":
        setStep("GemCollectDiff");
        break;
      case "EndRoundAfterGemDiff":
        setStep("DialogGemCollectSame");
        break;
      case "DialogGemCollectSame":
        setStep("GemCollectSame");
        break;
      case "EndRoundAfterGemSame":
        setStep("ModalLearnBuyCard");
        break;
      case "ModalLearnBuyCard":
        setStep("CardBuyActive");
        break;
      case "EndRoundAfterBuy":
        setStep("ModalLearnReserve");
        break;
      case "ModalLearnReserve":
        setStep("ReserveActive");
        break;
      case "EndRoundAfterReserve":
        setStep("Completed");
        break;
      case "Completed":
        window.location.href = "/";
        break;
    }
  };

  const getHighlightStyle = (area: string): React.CSSProperties => {
    if (highlightedArea === area) {
      return {
        outline: "4px solid gold",
        boxShadow: "0 0 15px 5px gold",
        borderRadius: "8px",
        transition: "outline 0.3s ease, box-shadow 0.3s ease",
        position: "relative",
        zIndex: 10,
      };
    }
    return {};
  };

  // ========== Tutorial 操作 Handlers ========== //
  // 1) 取 3 不同宝石
  const handleGemSelectDiff = (color: string) => {
    if (step !== "GemCollectDiff" || color === "x" || !gameState || !tutorialPlayer) return;
    if ((gameState.gems[color] || 0) <= 0) return;
    const updated = diffSelected.includes(color)
      ? diffSelected.filter((c) => c !== color)
      : [...diffSelected, color];
    if (updated.length > 3) return;
    setDiffSelected(updated);
    if (updated.length === 3) {
      // 更新 state
      setGameState((prev) => {
        if (!prev) return prev;
        const newPool = { ...prev.gems };
        const np = { ...tutorialPlayer.gems };
        updated.forEach((c) => {
          newPool[c] = Math.max(0, (newPool[c] || 0) - 1);
          np[c] = (np[c] || 0) + 1;
        });
        const updatedPlayer = { ...tutorialPlayer, gems: np };
        return {
          ...prev,
          gems: newPool,
          players: prev.players.map((p) =>
            p.id === updatedPlayer.id ? updatedPlayer : p
          ),
        };
      });
      setStep("EndRoundAfterGemDiff");
    }
  };

  // 2) 取 2 同色宝石
  const handleGemSelectSame = (color: string) => {
    if (step !== "GemCollectSame" || color === "x" || !gameState || !tutorialPlayer) return;
    const available = gameState.gems[color] || 0;
    if (available < 2) return;
    if (sameSelected.color === null) {
      setSameSelected({ color, count: 1 });
    } else if (sameSelected.color === color && sameSelected.count === 1) {
      // 实际取两枚
      setGameState((prev) => {
        if (!prev) return prev;
        const newPool = { ...prev.gems };
        const np = { ...tutorialPlayer.gems };
        newPool[color] = Math.max(0, (newPool[color] || 0) - 2);
        np[color] = (np[color] || 0) + 2;
        const updatedPlayer = { ...tutorialPlayer, gems: np };
        return {
          ...prev,
          gems: newPool,
          players: prev.players.map((p) =>
            p.id === updatedPlayer.id ? updatedPlayer : p
          ),
        };
      });
      setSameSelected({ color, count: 2 });
      setStep("EndRoundAfterGemSame");
    }
  };

  // 3) 买卡
  const handleBuyTutorial = (card: Card, level: string) => {
    if (step !== "CardBuyActive" || !gameState || !tutorialPlayer) return;
    if (!canAffordCardTutorial(card)) return;
    setGameState((prev) => {
      if (!prev) return prev;
      const np = { ...tutorialPlayer.gems };
      let goldUsed = 0;
      // 计算折扣
      const owned = Object.values(tutorialPlayer.cards).flat();
      const disc: Record<string, number> = {};
      ["r", "g", "b", "u", "w"].forEach((c) => {
        disc[c] = owned.filter((x) => x.color === c).length;
      });
      // 扣费
      Object.entries(card.cost).forEach(([clr, cnt]) => {
        if (clr === "x") return;
        const need = Math.max(0, cnt - (disc[clr] || 0));
        if (np[clr] >= need) {
          np[clr] -= need;
        } else {
          goldUsed += need - np[clr];
          np[clr] = 0;
        }
      });
      np.x = Math.max(0, (np.x || 0) - goldUsed);
      // 更新卡牌面板
      const nc = { ...tutorialPlayer.cards };
      if (!nc[level]) nc[level] = [];
      nc[level].push(card);
      // 更新分数
      const newScore = tutorialPlayer.score + card.points;
      // 从桌面移除
      const newDesk = { ...prev.cards };
      newDesk[level] = newDesk[level].filter((c) => c.uuid !== card.uuid);
      const updatedPlayer: Player = {
        ...tutorialPlayer,
        gems: np,
        cards: nc,
        score: newScore,
      };
      return {
        ...prev,
        cards: newDesk,
        players: prev.players.map((p) =>
          p.id === updatedPlayer.id ? updatedPlayer : p
        ),
      };
    });
    setStep("EndRoundAfterBuy");
  };

  // 4) 预定
  const handleReserveTutorial = (card: Card, level: string) => {
    if (step !== "ReserveActive" || !gameState || !tutorialPlayer) return;
    if (tutorialPlayer.reserved.length >= 3) return;
    setGameState((prev) => {
      if (!prev) return prev;
      const newPool = { ...prev.gems };
      const np = { ...tutorialPlayer.gems };
      // 取金
      if ((newPool.x || 0) > 0) {
        newPool.x!--;
        np.x = (np.x || 0) + 1;
      }
      // 更新预定
      const reserved = [...tutorialPlayer.reserved, card];
      // 从桌面移除
      const newDesk = { ...prev.cards };
      newDesk[level] = newDesk[level].filter((c) => c.uuid !== card.uuid);
      const updatedPlayer: Player = {
        ...tutorialPlayer,
        reserved,
        gems: np,
      };
      return {
        ...prev,
        gems: newPool,
        cards: newDesk,
        players: prev.players.map((p) =>
          p.id === updatedPlayer.id ? updatedPlayer : p
        ),
      };
    });
    setStep("EndRoundAfterReserve");
  };

  // ========== Step 变更时，更新 Modal & 高亮 ========== //
  useEffect(() => {
    const dialog = getModalContent(step);
    const dialogSteps: TutorialStep[] = [
      "PreHighlightGem", "PreHighlightCard", "PreHighlightNoble",
      "PreHighlightPanel", "DialogTryCollectGems", "EndRoundAfterGemDiff",
      "DialogGemCollectSame", "EndRoundAfterGemSame", "ModalLearnBuyCard",
      "EndRoundAfterBuy", "ModalLearnReserve", "EndRoundAfterReserve", "Completed",
    ];
    setShowModal(dialogSteps.includes(step));
    setModalContent(dialog);
    // 区域高亮
    switch (step) {
      case "PreHighlightGem": setHighlightedArea("gems"); break;
      case "PreHighlightCard": setHighlightedArea("cards"); break;
      case "PreHighlightNoble": setHighlightedArea("nobles"); break;
      case "PreHighlightPanel": setHighlightedArea("panel"); break;
      case "GemCollectDiff": case "GemCollectSame":
        setHighlightedArea("gems"); break;
      case "CardBuyActive":
        setHighlightedArea("affordableCards"); break;
      case "ReserveActive":
        setHighlightedArea("allCards"); break;
      default:
        setHighlightedArea(null); break;
    }
    // 重置选中状态
    if (step === "GemCollectDiff") setDiffSelected([]);
    if (step === "GemCollectSame") setSameSelected({ color: null, count: 0 });
  }, [step]);

  // ========== Render: Modal & ActionButtons ========== //
  const renderTutorialModal = () => {
    if (!showModal) return null;
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: "rgba(40,40,60,0.95)",
          padding: "30px", borderRadius: "10px",
          border: "3px solid gold",
          boxShadow: "0 0 25px rgba(255,215,0,0.6)",
          color: "white", maxWidth: "500px", textAlign: "center"
        }}>
          <p style={{ fontSize: "1.2em", marginBottom: "25px" }}>
            {modalContent}
          </p>
          <button
            onClick={handleNext}
            style={{
              padding: "12px 25px", fontSize: "1.1em",
              fontWeight: "bold", cursor: "pointer",
              backgroundColor: "gold", color: "black",
              border: "none", borderRadius: "5px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              transition: "background-color 0.2s ease"
            }}
          >
            {step === "Completed" ? "回到菜单" : "OK"}
          </button>
        </div>
      </div>
    );
  };

  const renderTutorialActionButtons = () => {
    const isTake = step === "GemCollectDiff" || step === "GemCollectSame";
    const isBuy = step === "CardBuyActive";
    const isRes = step === "ReserveActive";
    const allow = ["DialogTryCollectGems", "GemCollectDiff", "GemCollectSame",
      "ModalLearnBuyCard", "CardBuyActive", "ModalLearnReserve", "ReserveActive"
    ].includes(step);

    const base: React.CSSProperties = {
      flex: 1, border: "3px solid #ff6a00", borderRadius: "8px",
      padding: "10px 5px", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "20px", fontWeight: "bold", color: "#000",
      textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
      cursor: allow ? "pointer" : "not-allowed",
      transition: "all 0.2s ease",
      boxShadow: allow ? "0 0 20px rgba(255,150,0,0.6)" : "none",
      backgroundColor: allow ? "rgba(255,150,0,0.8)" : "rgba(150,150,150,0.6)"
    };
    return allow ? (
      <div style={{
        display: "flex", gap: "15px",
        marginTop: "20px", marginBottom: "20px",
        width: "100%", maxWidth: "700px",
        margin: "0 auto", padding: "0 20px"
      }}>
        <button style={isTake ? { ...base, transform: "scale(1.03)", boxShadow: "0 0 25px 8px rgba(255,180,0,0.8)" } : base} disabled={!isTake}>
          Take Gems
        </button>
        <button style={isBuy ? { ...base, transform: "scale(1.03)", boxShadow: "0 0 25px 8px rgba(255,180,0,0.8)" } : base} disabled={!isBuy}>
          Buy Card
        </button>
        <button style={isRes ? { ...base, transform: "scale(1.03)", boxShadow: "0 0 25px 8px rgba(255,180,0,0.8)" } : base} disabled={!isRes}>
          Reserve Card
        </button>
      </div>
    ) : null;
  };

  // ========== 主 JSX ========== //
  return (
    <ResponsiveGameWrapper>
      {renderTutorialModal()}

      <div
        id="game-board"
        style={{
          background: "transparent",
          minHeight: "100vh",
          width: "100%",
          padding: 0,
          margin: 0,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        

        {/* 顶部标题栏 */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "500px",
            margin: "0 auto",
            padding: "0 20px",
            marginBottom: "20px",
            flexShrink: 0,
          }}
        >
          <img
            src="/gamesource/splendor_logo.png"
            alt="Splendor"
            style={{ height: "60px", maxWidth: "200px" }}
          />
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#FFD700",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            Room: {roomName}
          </div>
        </div>

        {/* 主布局：左侧公共区域 & 右侧玩家面板 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            width: "100%",
            maxWidth: "2000px",
            margin: "0 auto",
            gap: "30px",
            alignItems: "start",
            flexGrow: 1,
            overflow: "auto",
          }}
        >
          {/* 左侧：公共区域 */}
          <div
            id="common-area"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxWidth: "900px",
              minHeight: 0,
            }}
          >
            {/* 贵族区 */}
            <div
              id="noble-area"
              style={{
                ...getHighlightStyle("nobles"),
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                minHeight: "100px",
              }}
            >
              {gameState?.nobles
                ?.slice(0, (gameState?.players?.length ?? 0) + 1)
                .map((noble, idx) => (
                  <div key={noble.uuid} className="noble">
                    <div className="side-bar">
                      <div className="points">{noble.points}</div>
                      <div className="requirement">
                        {Object.entries(noble.requirement).map(
                          ([color, count]) =>
                            count > 0 ? (
                              <div
                                key={color}
                                className={`requires ${color}`}
                              >
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
            <div
              id="level-area"
              style={{
                ...getHighlightStyle("cards"),
                width: "100%",
                marginBottom: "5px",
              }}
            >
              {(["level1", "level2", "level3"] as const).map((level) => (
                <div
                  key={level}
                  className="card-row"
                  style={{
                    display: "flex",
                    alignItems: "start",
                    gap: "15px",
                    marginBottom: "20px",
                    width: "100%",
                  }}
                >
                  <div className={`deck ${level} w-[130px] h-[180px] relative`}>
                    <div
                      className="remaining"
                      style={{
                        position: "absolute",
                        borderRadius: "50%",
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "2px solid white",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "15px",
                        color: "white",
                        zIndex: 2,
                      }}
                    >
                      {gameState?.decks?.[level] ?? 0}
                    </div>
                  </div>
                  <div
                    className={`c_${level} face-up-cards flex gap-3`}
                    style={{ display: "flex", gap: "3px", flexWrap: "nowrap", overflowX: "auto" }}
                  >
                    {gameState?.cards?.[level]?.map((card) => {
                      const affordable = canAffordCardTutorial(card);
                      const style: React.CSSProperties = {};
                      let classes = `card card-${card.color} card-${card.level}`;
                      if (highlightedArea === "affordableCards" && affordable) {
                        style.outline = "3px solid yellow";
                        style.boxShadow = "0 0 10px yellow";
                        style.cursor = "pointer";
                      } else if (highlightedArea === "allCards") {
                        style.outline = "3px solid cyan";
                        style.cursor = "pointer";
                      }
                      const clickableBuy = step === "CardBuyActive" && affordable;
                      const clickableRes = step === "ReserveActive";
                      if (clickableBuy || clickableRes) classes += " clickable";
                      return (
                        <div
                          key={card.uuid}
                          className={classes}
                          style={style}
                          onClick={() => {
                            if (clickableBuy) handleBuyTutorial(card, level);
                            else if (clickableRes) handleReserveTutorial(card, level);
                          }}
                        >
                          <div className="header">
                            <div className={`color ${card.color}gem`}></div>
                            <div className="points">
                              {card.points > 0 ? card.points : ""}
                            </div>
                          </div>
                          <div className="costs">
                            {Object.entries(card.cost).map(
                              ([c, cnt]) =>
                                cnt > 0 ? (
                                  <div key={c} className={`cost ${c}`}>
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

            {/* 宝石区 */}
            <div
              id="gem-area"
              style={{
                ...getHighlightStyle("gems"),
                width: "100%",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                flexWrap: "wrap",
                marginTop: "5px",
                paddingBottom: "10px",
              }}
            >
              {COLOR_ORDER.map((color) => {
                const count = gameState?.gems?.[color] || 0;
                const selDiff = diffSelected.includes(color);
                const selSame = sameSelected.color === color;
                const clickable =
                  (step === "GemCollectDiff" || step === "GemCollectSame") &&
                  color !== "x";
                const gemStyle: React.CSSProperties = {
                  cursor: clickable ? "pointer" : "default",
                  opacity: clickable ? 1 : 0.7,
                  transition: "outline 0.2s ease, opacity 0.2s ease",
                  position: "relative",
                };
                if (selDiff) gemStyle.outline = "3px solid yellow";
                if (selSame) gemStyle.outline = "3px solid lightgreen";
                return (
                  <div
                    key={color}
                    className={`gem ${color}chip`}
                    style={gemStyle}
                    onClick={() => {
                      if (step === "GemCollectDiff") handleGemSelectDiff(color);
                      else if (step === "GemCollectSame") handleGemSelectSame(color);
                    }}
                  >
                    <div
                      className="bubble"
                      style={{
                        position: "absolute",
                        top: "-5px",
                        left: "-5px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "2px solid white",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "15px",
                        color: "white",
                        zIndex: 2,
                      }}
                    >
                      {count}{" "}
                      {selSame && (
                        <span style={{ marginLeft: "5px", color: "lightgreen" }}>
                          ({sameSelected.count})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧：玩家面板 & 控件 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              width: "100%",
              maxWidth: "800px",
            }}
          >
            {/* 玩家列表 */}
            <div
              id="player-area"
              style={{
                ...getHighlightStyle("panel"),
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                backgroundColor: "rgba(0,0,0,0.3)",
                padding: "10px",
                borderRadius: "8px",
                width: "100%",
                overflowY: "visible",
                alignContent: "start",
              }}
            >
              {gameState?.players.map((p) => {
                const isMe = p.id === currentUser.id;
                const isTurn = gameState.currentPlayerId === p.id;
                return (
                  <div
                    key={p.uuid}
                    className="player"
                    style={{
                      padding: "6px",
                      backgroundColor: "rgba(0,0,0,0.2)",
                      borderRadius: "5px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      maxHeight: "280px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="playerHeader"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: isMe ? "#90ee90" : "white",
                        fontWeight: isMe ? "bold" : "normal",
                        animation: isTurn ? "pulse 2s infinite" : "none",
                      }}
                    >
                      <span>{p.name}</span>
                      <span>Score: {p.score}</span>
                    </div>
                    <div
                      className="gem-stats"
                      style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        justifyContent: "space-around",
                        gap: "5px",
                        marginBottom: "10px",
                        width: "100%",
                        overflow: "auto",
                      }}
                    >
                      {COLOR_ORDER.map((c) => {
                        const gc = p.gems[c] || 0;
                        const cc =
                          (p.cards.level1.filter((x) => x.color === c).length || 0) +
                          (p.cards.level2.filter((x) => x.color === c).length || 0) +
                          (p.cards.level3.filter((x) => x.color === c).length || 0);
                        return (
                          <div
                            key={c}
                            className="statSet"
                            style={{
                              textAlign: "center",
                              margin: 0,
                              minWidth: "auto",
                            }}
                          >
                            <div
                              className="stat"
                              style={{ fontSize: "0.8em", padding: "2px 4px" }}
                            >
                              {gc}+{cc}
                            </div>
                            <div
                              className={`chip chip-${c}`}
                              style={{ width: "30px", height: "30px", margin: "auto" }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                    {/* 预定卡 */}
                    <div
                      className="reserveCards"
                      style={{ display: "flex", gap: "5px", marginTop: "5px", minHeight: "50px" }}
                    >
                      {[0, 1, 2].map((i) => {
                        const card = p.reserved[i];
                        if (card) {
                          const canClick =
                            p.id === currentUser.id &&
                            step === "CardBuyActive" &&
                            canAffordCardTutorial(card);
                          const reservedStyle: React.CSSProperties = {
                            width: "30%",
                            aspectRatio: "0.7",
                            position: "relative",
                            overflow: "hidden",
                          };
                          if (canClick) {
                            reservedStyle.cursor = "pointer";
                            reservedStyle.outline = "3px solid yellow";
                            reservedStyle.boxShadow = "0 0 10px yellow";
                          }
                          return (
                            <div
                              key={card.uuid}
                              className={`card card-${card.color} card-${card.level} reserved-small`}
                              style={reservedStyle}
                              onClick={() => canClick && handleBuyTutorial(card, card.level)}
                            >
                              <div className="header" style={{ fontSize: "0.7em" }}>
                                <div
                                  className={`color ${card.color}gem`}
                                  style={{ width: "12px", height: "12px" }}
                                ></div>
                                <div className="points">
                                  {card.points > 0 ? card.points : ""}
                                </div>
                              </div>
                              <div className="costs" style={{ fontSize: "0.6em" }}>
                                {Object.entries(card.cost).map(
                                  ([cc, ct]) => ct > 0 ? `${ct}${cc} ` : null
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={`empty-${i}`}
                              style={{
                                width: "30%",
                                aspectRatio: "0.7",
                                border: "1px dashed rgba(255,255,255,0.3)",
                                borderRadius: "4px",
                                backgroundColor: "rgba(0,0,0,0.1)",
                              }}
                            />
                          );
                        }
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tutorial 专用操作按钮 */}
            {renderTutorialActionButtons()}
            {/* 其他原有功能区域略（AI 提示、原始操作按钮、计时 & PASS TURN、聊天框） */}
          </div>
        </div>
      </div>
    </ResponsiveGameWrapper>
  );
}
