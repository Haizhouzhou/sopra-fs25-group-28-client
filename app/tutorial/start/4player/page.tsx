/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// deno-lint-ignore-file no-explicit-any no-unused-vars
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ResponsiveGameWrapper from "components/ui/ResponsiveGameWrapper"; // Assuming this path is correct
import './tutorial.css'; // Import the tutorial CSS
import { useRouter } from 'next/navigation';



// --- Interfaces ---
interface Card { uuid: string; id: number; level: string; color: string; points: number; cost: { [key: string]: number }; tier?: number; }
interface Noble { uuid: string; id: number; points: number; requirement: { [key: string]: number }; }
interface Player { userId: number | string; name?: string; status?: boolean; id: number; uuid: string; score: number; cards: { [level: string]: Card[] }; bonusGems: { [color: string]: number }; gems: { [color: string]: number }; nobles: Noble[]; reserved: Card[]; }
interface GameState { players: Player[]; gems: { [color: string]: number }; cards: { [level: string]: Card[] }; nobles: Noble[]; decks: { [level: string]: number }; turn: number; log: string[]; winner: number | null; roomName: string; currentPlayerId: number; }

// --- Constants ---
const COLOR_ORDER = ["r", "g", "b", "u", "w", "x"];
const MOCK_USER_ID = 1;

// --- Mock Game State (Corrected Initial State) ---
const mockState: GameState = {
  players: [ { id: MOCK_USER_ID, userId: MOCK_USER_ID, uuid: String(MOCK_USER_ID), name: "Me", score: 0, cards: { level1: [], level2: [], level3: [] }, bonusGems: { r: 0, g: 0, b: 0, u: 0, w: 0 }, gems: { r: 0, g: 0, b: 0, u: 0, w: 0, x: 0 }, nobles: [], reserved: [] }, { id: 2, userId: 2, uuid: "2", name: "Player 2", score: 0, cards: { level1: [], level2: [], level3: [] }, bonusGems: { r: 0, g: 0, b: 0, u: 0, w: 0 }, gems: { r: 0, g: 0, b: 0, u: 0, w: 0, x: 0 }, nobles: [], reserved: [] }, { id: 3, userId: 3, uuid: "3", name: "Player 3", score: 0, cards: { level1: [], level2: [], level3: [] }, bonusGems: { r: 0, g: 0, b: 0, u: 0, w: 0 }, gems: { r: 0, g: 0, b: 0, u: 0, w: 0, x: 0 }, nobles: [], reserved: [] }, { id: 4, userId: 4, uuid: "4", name: "Player 4", score: 0, cards: { level1: [], level2: [], level3: [] }, bonusGems: { r: 0, g: 0, b: 0, u: 0, w: 0 }, gems: { r: 0, g: 0, b: 0, u: 0, w: 0, x: 0 }, nobles: [], reserved: [] } ],
  gems: { r: 4, g: 4, b: 4, u: 4, w: 4, x: 5 },
  cards: { level1: [ { uuid: "l1c1", id: 1, level: "level1", tier: 1, color: "g", points: 0, cost: { r: 1, b: 1, u: 1, w: 1 } }, { uuid: "l1c2", id: 2, level: "level1", tier: 1, color: "b", points: 0, cost: { g: 2, w: 1 } }, { uuid: "l1c3", id: 3, level: "level1", tier: 1, color: "r", points: 0, cost: { u: 3 } }, { uuid: "l1c4", id: 4, level: "level1", tier: 1, color: "w", points: 0, cost: { r: 1, g: 1, b: 2 } }, ], level2: [ { uuid: "l2c1", id: 41, level: "level2", tier: 2, color: "u", points: 2, cost: { b: 5 } }, { uuid: "l2c2", id: 42, level: "level2", tier: 2, color: "r", points: 1, cost: { g: 3, u: 2, w: 1 } }, { uuid: "l2c3", id: 43, level: "level2", tier: 2, color: "g", points: 2, cost: { r: 2, b: 4 } }, { uuid: "l2c4", id: 44, level: "level2", tier: 2, color: "w", points: 3, cost: { w: 6 } }, ], level3: [ { uuid: "l3c1", id: 71, level: "level3", tier: 3, color: "b", points: 4, cost: { r: 7 } }, { uuid: "l3c2", id: 72, level: "level3", tier: 3, color: "w", points: 3, cost: { r: 3, g: 3, b: 5, u: 3 } }, { uuid: "l3c3", id: 73, level: "level3", tier: 3, color: "r", points: 5, cost: { r: 7, x: 3 } }, { uuid: "l3c4", id: 74, level: "level3", tier: 3, color: "g", points: 4, cost: { b: 7, w: 3 } }, ], },
  nobles: [ { uuid: "n1", id: 1, points: 3, requirement: { r: 3, g: 3, b: 0, u: 0, w: 3 } }, { uuid: "n2", id: 2, points: 3, requirement: { r: 0, g: 0, b: 4, u: 4, w: 0 } }, { uuid: "n3", id: 3, points: 3, requirement: { r: 0, g: 3, b: 3, u: 3, w: 0 } }, { uuid: "n4", id: 4, points: 3, requirement: { r: 4, g: 0, b: 0, u: 0, w: 4 } }, { uuid: "n5", id: 5, points: 3, requirement: { r: 0, g: 0, b: 0, u: 4, w: 4 } }, ],
  decks: { level1: 36, level2: 26, level3: 16 }, turn: 0, log: [], winner: null, roomName: "Tutorial Room", currentPlayerId: MOCK_USER_ID,
};

// --- Tutorial Steps Configuration (English Descriptions, Buy Card Step Added) ---
const tutorialSteps = [
  {
    description: "Welcome to the Splendor Tutorial! Let's start with the Nobles. These tiles grant you 3 Prestige Points if you collect the required number of card bonuses. Nobles are not taken by action—they visit you automatically. Click 'Next'.",
    highlight: ".noble",
    allowedAction: null
  },
  {
    description: "These are the Gem tokens and Gold tokens. There are 7 of each colored gem: Emerald (green), Diamond (white), Sapphire (blue), Onyx (black), and Ruby (red). There are also 5 Gold Joker tokens (yellow). Click 'Next'.",
    highlight: ".gem",
    allowedAction: null
  },
  {
    description: "These are the Development Card decks. Level 1 cards are cheapest and weakest; Level 3 cards are most expensive and strongest. All cards provide bonuses once purchased. Click 'Next'.",
    highlight: ".deck",
    allowedAction: null
  },
  {
    description: "These are the face-up Development Cards available for all players. Each card shows: 1) Prestige Points (top-right), 2) Gem bonus (top-left), and 3) Gem cost (bottom). Click 'Next'.",
    highlight: ".card",
    allowedAction: null
  },
  {
    description: "This is your Player Board. It shows your current gems, permanent bonuses from purchased cards, reserved cards, and your score. Click 'Next'.",
    highlight: `[data-player-id="${MOCK_USER_ID}"]`,
    allowedAction: null
  },
  {
    description: "Your first action: Take Gems. Click the 'Take Gems' button below. You can normally take 3 different colored gems or 2 of the same if at least 4 remain.",
    highlight: "#action-button-take",
    allowedAction: "selectTakeGemsButton"
  },
  {
    description: "Now select 3 different gems: Red, Green, and Blue. Then click the 'Confirm Gems' button to complete your action.",
    highlight: "#gem-selection-area",
    allowedAction: "selectAndConfirmGems",
    targetGems: ["r", "g", "b"]
  },
  {
    description: "Gems collected! Now let's buy a Development Card. Click the 'Buy Card' button below.",
    highlight: "#action-button-buy",
    allowedAction: "selectBuyCardButton"
  },
  {
    description: "Click the Level 1 Red card (ID 3, cost 3 Black). In this tutorial, the cost will be ignored. You will gain a Red bonus for future purchases.",
    highlight: "[data-card-id='3']",
    allowedAction: "buyCard",
    targetCardId: 3
  },
  {
    description: "Card bought! Now let's try reserving a card. Click the 'Reserve Card' button below.",
    highlight: "#action-button-reserve",
    allowedAction: "selectReserveCardButton"
  },
  {
    description: "Now click the Level 2 Green card (ID 43) to reserve it. Reserved cards go into your hand (max 3), and you receive a Gold Joker token.",
    highlight: "[data-card-id='43']",
    allowedAction: "reserveCard",
    targetCardId: 43
  },
  {
    description: "Congratulations! You've completed the tutorial. You’ve learned the three basic actions: Taking Gems, Buying Cards, and Reserving Cards. In a real game, the first player to reach 15 Prestige Points triggers the final round. Click OK to continue.",
    highlight: "none",
    allowedAction: null
  }
];


// --- Helper Functions ---
const mapColorToFrontend = (color: string): string => { const colorMap: Record<string, string> = { 'BLACK': 'u', 'BLUE': 'b', 'GREEN': 'g', 'RED': 'r', 'WHITE': 'w', 'GOLD': 'x' }; return colorMap[color?.toUpperCase()] || color?.toLowerCase() || 'u'; };
const calculateBonusGems = (cards: { [level: string]: Card[] }): { [color: string]: number } => { const bonuses: { [color: string]: number } = { r: 0, g: 0, b: 0, u: 0, w: 0 }; if (cards && typeof cards === 'object') { Object.values(cards).flat().forEach(card => { if (card && card.color && bonuses[card.color] !== undefined) { bonuses[card.color]++; } }); } return bonuses; };

// --- Reusable Card Component ---
interface CardComponentProps { card: Card; onClick?: (uuid: string, id: number, element: HTMLDivElement) => void; isDisabled?: boolean; isAffordable?: boolean; size?: 'normal' | 'small'; className?: string; }
const CardComponent: React.FC<CardComponentProps> = ({ card, onClick, isDisabled = false, isAffordable = true, size = 'normal', className = '' }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const handleClick = () => { if (onClick && !isDisabled && cardRef.current) { onClick(card.uuid, card.id, cardRef.current); } };
    const sizeClass = size === 'small' ? 'card-small' : '';
    const shortColor = card.color.length === 1 ? card.color : mapColorToFrontend(card.color);

    return ( <div ref={cardRef} key={card.uuid} data-card-id={card.id} className={`card card-${shortColor} card-${card.level} ${sizeClass} ${isDisabled ? 'tutorial-inactive' : 'tutorial-active'} ${className}`} onClick={handleClick} style={{ cursor: isDisabled ? 'not-allowed' : (onClick ? 'pointer' : 'default') }} >
            {!isDisabled && <div className={`overlay ${isAffordable ? 'affordable' : 'not-affordable'}`}></div>} <div className="underlay"></div> <div className="header"> <div className={`color ${shortColor}gem`}></div> <div className="points">{card.points > 0 ? card.points : ""}</div> </div> <div className="costs"> {Object.entries(card.cost).map(([costColor, count]) => count > 0 ? (<div key={costColor} className={`cost ${mapColorToFrontend(costColor)}`}>{count}</div>) : null )} </div> </div> );
};

// --- Tutorial Overlay Component ---
interface TutorialOverlayProps { step: number; totalSteps: number; onNext: () => void; gameState: GameState | null; onFinish: () => void;}
const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, totalSteps, onNext, gameState ,
  onFinish}) => {
  const currentStepConfig = tutorialSteps[step];
  useEffect(() => { const highlightElement = () => { const existingHighlights = document.querySelectorAll('.tutorial-highlight-overlay'); existingHighlights.forEach(el => el.remove()); if (!currentStepConfig || currentStepConfig.highlight === "none") return; const elements = document.querySelectorAll(currentStepConfig.highlight); if (elements.length > 0) { elements.forEach(targetElement => { const rect = targetElement.getBoundingClientRect(); const overlay = document.createElement('div'); overlay.className = 'tutorial-highlight-overlay'; overlay.style.position = 'fixed'; overlay.style.left = `${rect.left - 5}px`; overlay.style.top = `${rect.top - 5}px`; overlay.style.width = `${rect.width + 10}px`; overlay.style.height = `${rect.height + 10}px`; overlay.style.border = '3px solid yellow'; overlay.style.boxShadow = '0 0 15px 5px rgba(255, 255, 0, 0.5)'; overlay.style.borderRadius = '8px'; overlay.style.pointerEvents = 'none'; overlay.style.zIndex = '1999'; overlay.style.transition = 'all 0.2s ease-in-out'; document.body.appendChild(overlay); }); } }; const timer = setTimeout(highlightElement, 50); window.addEventListener('resize', highlightElement); window.addEventListener('scroll', highlightElement); return () => { clearTimeout(timer); window.removeEventListener('resize', highlightElement); window.removeEventListener('scroll', highlightElement); const existingHighlights = document.querySelectorAll('.tutorial-highlight-overlay'); existingHighlights.forEach(el => el.remove()); } }, [step, currentStepConfig, gameState]);
  if (!currentStepConfig) return null; const isFinalStep = step === totalSteps - 1;
const showNextButton = currentStepConfig.allowedAction === null && !isFinalStep;

  return ( <> <div style={{ position: 'fixed', bottom: '20px', right: '20px', left: 'auto', transform: 'none', width: 'auto', minWidth: '300px', maxWidth: '450px', backgroundColor: 'rgba(0, 0, 0, 0.9)', color: 'white', border: '2px solid gold', borderRadius: '10px', padding: '15px 25px', zIndex: '2000', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px', color: 'gold', fontSize: '1.1em' }}> Tutorial Step {step + 1} / {totalSteps} </h3>
        <p style={{ margin: '0 0 15px 0', lineHeight: '1.5' }}>{currentStepConfig.description}</p>
        {showNextButton && step < totalSteps -1 && ( <button onClick={onNext} style={{ padding: '10px 25px', fontSize: '16px', cursor: 'pointer', backgroundColor: 'gold', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold', transition: 'background-color 0.2s ease', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e6c300')} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'gold')} > Next </button> )}
        {isFinalStep && (
  <button
    onClick={onFinish} 
    style={{
      padding: '10px 25px',
      fontSize: '16px',
      cursor: 'pointer',
      backgroundColor: '#00cc66',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontWeight: 'bold',
      transition: 'background-color 0.2s ease',
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto'
    }}
    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#00b35a')}
    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#00cc66')}
  >
    Finish Tutorial
  </button>
)}
  
      </div> </> );
};

// --- Main Tutorial Page Component ---
export default function TutorialPage() {
    const router = useRouter();
  const [step, setStep] = useState(0);
  const [currentGameState, setCurrentGameState] = useState<GameState>(() => JSON.parse(JSON.stringify(mockState)));
  const [selectedGems, setSelectedGems] = useState<string[]>([]);
  const [currentAction, setCurrentAction] = useState<"take" | "buy" | "reserve" | null>(null);

   const gameState = currentGameState;
   const currentUser = gameState.players.find(p => p.id === MOCK_USER_ID);

   useEffect(() => { if (!currentUser) return; const currentCards = currentUser.cards; const calculatedBonuses = calculateBonusGems(currentCards); if (JSON.stringify(calculatedBonuses) !== JSON.stringify(currentUser.bonusGems)) { console.log("Recalculating bonus gems due to card change..."); setCurrentGameState(prev => { const playerIndex = prev.players.findIndex(p => p.id === MOCK_USER_ID); if (playerIndex === -1) return prev; const updatedPlayers = [...prev.players]; updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], bonusGems: calculatedBonuses }; return {...prev, players: updatedPlayers}; }); } }, [currentUser?.cards]);

  const advanceStep = () => { const nextStepIndex = step + 1; if (nextStepIndex < tutorialSteps.length) { console.log(`Advancing PASSIVE step from ${step} to ${nextStepIndex}`); setCurrentAction(null); setSelectedGems([]); setStep(nextStepIndex); } else { console.log("Tutorial finished"); } };
  const canAffordCard = (card: Card): boolean => { if (!currentUser) return false; const discounts: { [color: string]: number } = currentUser.bonusGems || { r: 0, g: 0, b: 0, u: 0, w: 0 }; const requiredGems: { [color: string]: number } = {}; let wildcardsNeeded = 0; Object.entries(card.cost).forEach(([color, count]) => { const discount = discounts[mapColorToFrontend(color)] || 0; const required = Math.max(0, count - discount); if (required > 0) requiredGems[mapColorToFrontend(color)] = required; }); for (const [color, required] of Object.entries(requiredGems)) { const available = currentUser.gems[color] || 0; if (available < required) wildcardsNeeded += (required - available); } const wildcards = currentUser.gems["x"] || 0; return wildcards >= wildcardsNeeded; };

  const handleSelectActionButton = (action: "take" | "buy" | "reserve") => { const currentStepConfig = tutorialSteps[step]; const allowed = currentStepConfig?.allowedAction; console.log(`Button clicked: ${action}, Allowed action: ${allowed}, Current Step: ${step}`); if (allowed === "selectTakeGemsButton" && action === "take") { setCurrentAction(action); setStep(step + 1); } else if (allowed === "selectBuyCardButton" && action === "buy") { setCurrentAction(action); setStep(step + 1); } else if (allowed === "selectReserveCardButton" && action === "reserve") { setCurrentAction(action); setStep(step + 1); } else { alert(`Tutorial: Please follow instructions for Step ${step + 1}. Action: ${allowed}. Desc: ${currentStepConfig?.description}`); } };
  const handleGemSelect = (color: string) => { const currentStepConfig = tutorialSteps[step]; if (currentStepConfig?.allowedAction !== "selectAndConfirmGems") { alert(`Tutorial: Cannot select gems now. Step ${step + 1}: ${currentStepConfig?.description}`); return; } if (selectedGems.includes(color)) { setSelectedGems(selectedGems.filter(c => c !== color)); return; } if (selectedGems.length >= 3) { alert("Tutorial: Only 3 different gems."); return; } if (gameState.gems[color] <= 0) { alert("Tutorial: Gem not available."); return; } const targetGemsSet = new Set(currentStepConfig.targetGems || []); if (!targetGemsSet.has(color)) { alert(`Tutorial: Please select required gems: ${currentStepConfig.targetGems?.join(', ')}.`); return; } const newSelection = [...selectedGems, color]; setSelectedGems(newSelection); console.log("Selected gems (in handler):", newSelection); };
  const handleConfirmGems = () => { const currentStepConfig = tutorialSteps[step]; if (currentStepConfig?.allowedAction !== "selectAndConfirmGems") { alert(`Tutorial: Not time to confirm gems. Step ${step + 1}: ${currentStepConfig?.description}`); return; } const requiredGems = new Set(currentStepConfig.targetGems || []); const selectionCorrect = selectedGems.length === requiredGems.size && selectedGems.every(gem => requiredGems.has(gem)); if (!selectionCorrect) { alert(`Tutorial: Incorrect gems. Select ${currentStepConfig.targetGems?.join(', ')}.`); return; } console.log("Simulating gem take via confirm (Step 6)..."); setCurrentGameState(prev => { const newState = JSON.parse(JSON.stringify(prev)); const playerIndex = newState.players.findIndex((p: Player) => p.id === MOCK_USER_ID); if(playerIndex !== -1) { selectedGems.forEach(gemColor => { if (newState.gems[gemColor] > 0) { newState.gems[gemColor]--; newState.players[playerIndex].gems[gemColor]++; } else { console.warn(`Tutorial Sim: Gem ${gemColor} unavailable.`); } }); } else { console.error("Tutorial Sim Error: Player not found."); } return newState; }); alert("Tutorial: Gems taken! Moving to next step."); setCurrentAction(null); setSelectedGems([]); setStep(step + 1); console.log("Manually advancing to step 7 after confirm"); };
  const handleCardAction = (cardUuid: string, cardId: number, _clickedElement: HTMLElement) => { const currentStepConfig = tutorialSteps[step]; const isBuyActionStep = currentStepConfig?.allowedAction === 'buyCard'; const isReserveActionStep = currentStepConfig?.allowedAction === 'reserveCard'; if (!isBuyActionStep && !isReserveActionStep) { alert(`Tutorial: Cannot interact with cards now. Step ${step + 1}: ${currentStepConfig?.description}`); return; } if (cardId !== currentStepConfig?.targetCardId) { alert(`Tutorial: Click specific card (Expected ID: ${currentStepConfig?.targetCardId}, Clicked ID: ${cardId}).`); return; } let targetCard: Card | null = null; let cardLocation: 'level1' | 'level2' | 'level3' | null = null; for (const level of ['level1', 'level2', 'level3'] as const) { if (gameState.cards[level]) { const found = gameState.cards[level].find(c => c.id === cardId); if (found) { targetCard = found; cardLocation = level; break; } } } if (!targetCard || !cardLocation) { alert("Tutorial Error: Card not found."); return; }
      if (isBuyActionStep) { console.log(`Simulating buy action for card ${cardId}`); setCurrentGameState(prev => { const newState = JSON.parse(JSON.stringify(prev)); const playerIndex = newState.players.findIndex((p: Player) => p.id === MOCK_USER_ID); const cardIndex = newState.cards[cardLocation!].findIndex((c:Card) => c.id === cardId); if (playerIndex !== -1 && cardIndex !== -1) { const player = newState.players[playerIndex]; const cardToBuy = newState.cards[cardLocation!][cardIndex]; newState.cards[cardLocation!].splice(cardIndex, 1); if (!player.cards[cardLocation!]) player.cards[cardLocation!] = []; player.cards[cardLocation!].push(cardToBuy); player.score += cardToBuy.points; } else { console.error("Tutorial Buy Sim Error: Player or Card not found."); } return newState; }); alert("Tutorial: Card 'purchased'! Moving to next step."); setCurrentAction(null); setStep(step + 1); console.log("Manually advancing to step 9 after buy"); }
      else if (isReserveActionStep) { console.log(`Simulating reserve action for card ${cardId}`); const player = gameState.players.find(p => p.id === MOCK_USER_ID); if (player && player.reserved.length >= 3) { alert("Tutorial: Max 3 reserved cards."); return; } setCurrentGameState(prev => { const newState = JSON.parse(JSON.stringify(prev)); const playerIndex = newState.players.findIndex((p: Player) => p.id === MOCK_USER_ID); const cardIndex = newState.cards[cardLocation!].findIndex((c: Card) => c.id === cardId); if (playerIndex !== -1 && cardIndex !== -1) { const player = newState.players[playerIndex]; const cardToReserve = newState.cards[cardLocation!][cardIndex]; newState.cards[cardLocation!].splice(cardIndex, 1); player.reserved.push(cardToReserve); if (newState.gems.x > 0) { newState.gems.x--; player.gems.x++; } else { console.warn("Tutorial Sim: No gold token available."); } } else { console.error("Tutorial Reserve Sim Error: Player/Card not found."); } return newState; }); alert("Tutorial: Card reserved! Moving to next step."); setCurrentAction(null); setStep(step + 1); console.log("Manually advancing to step 11 after reserve"); } };

  const buttonStyle: React.CSSProperties = { flex: 1, backgroundColor: "rgba(255, 150, 0, 0.8)", border: "3px solid #ff6a00", borderRadius: "8px", padding: "10px 5px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 0 20px rgba(255, 150, 0, 0.6)", fontSize: "16px", fontWeight: "bold", color: "#000", textShadow: "1px 1px 2px rgba(0,0,0,0.5)", opacity: 1, transition: 'opacity 0.3s ease, background-color 0.3s ease' };
  const inactiveButtonStyle: React.CSSProperties = { ...buttonStyle, opacity: 0.5, cursor: 'not-allowed', backgroundColor: "rgba(150, 150, 150, 0.5)", border: "3px solid #888", boxShadow: "none", pointerEvents: 'none' };
  const currentStepConfig = tutorialSteps[step]; const allowedAction = currentStepConfig?.allowedAction;
  const enableTakeGemsButton = allowedAction === "selectTakeGemsButton"; const enableReserveCardButton = allowedAction === "selectReserveCardButton"; const enableBuyCardButton = allowedAction === "selectBuyCardButton";
  const enableGemSelection = allowedAction === "selectAndConfirmGems"; const enableConfirmGemsButton = allowedAction === "selectAndConfirmGems";
  const requiredGemsForConfirm = new Set(currentStepConfig?.targetGems || []); const confirmSelectionReady = selectedGems.length === requiredGemsForConfirm.size && selectedGems.every(gem => requiredGemsForConfirm.has(gem));
  const finalEnableConfirm = enableConfirmGemsButton && confirmSelectionReady;
  const enableCardInteraction = (cardId: number): boolean => { return ((allowedAction === 'buyCard' || allowedAction === 'reserveCard') && cardId === currentStepConfig?.targetCardId); };

  return (
    <ResponsiveGameWrapper>
      {/* Back Button */}
<div
  style={{
    position: "fixed",
    top: "20px",
    left: "20px",
    zIndex: 1000,
  }}
>
  <button
    onClick={() => router.push("/tutorial")}
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
</div>

      <TutorialOverlay step={step} totalSteps={tutorialSteps.length} onNext={advanceStep} gameState={gameState} onFinish={() => router.push('/tutorial')} />
      <div id="game-board">
         <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "600px", margin: "0 auto", padding: "20px 20px 0", marginBottom: "20px" }}>
           <img src="/gamesource/splendor_logo.png" alt="Splendor" style={{ height: "50px", maxWidth: "150px" }} /> <div style={{ fontSize: "20px", fontWeight: "bold", color: "#FFD700", textShadow: "1px 1px 3px rgba(0,0,0,0.6)" }}> Room: {gameState?.roomName} </div>
         </div>
         <div className="main-game-grid" style={{ width: "100%", alignItems: "start" }}>
            <div id="common-area">
                <div id="noble-area"> {gameState?.nobles?.map((noble, idx) => ( <div key={noble.uuid} id={`noble${idx}`} className={`noble ${allowedAction === null && step === 0 ? 'tutorial-active' : 'tutorial-inactive'}`}> <div className="points">{noble.points}</div> <div className="requirement"> {Object.entries(noble.requirement).map(([color, count]) => count > 0 ? (<div key={color} className={`requires ${mapColorToFrontend(color)}`}>{count}</div>) : null )} </div> </div> ))} </div>
                <div id="level-area" style={{ width: "100%", height: "auto", marginBottom: "5px" }}> {["level3", "level2", "level1"].map((level) => ( <div key={level} className="card-row" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", width: "100%", overflowX: "auto", paddingBottom: '10px' }}> <div className={`deck ${level} w-[100px] h-[140px] relative flex-shrink-0 ${allowedAction === null && step === 2 ? 'tutorial-active' : 'tutorial-inactive'}`}> <div className="remaining">{gameState?.decks?.[level as keyof GameState['decks']] ?? 0}</div> <div className="overlay"></div> </div> <div className={`c_${level} face-up-cards flex-grow-1`}> <div className="cards-inner flex flex-nowrap gap-2"> {gameState?.cards?.[level as keyof GameState['cards']]?.map((card) => ( <CardComponent key={card.uuid} card={card} isDisabled={!enableCardInteraction(card.id)} isAffordable={canAffordCard(card)} onClick={handleCardAction} size="normal" className={allowedAction === null && step === 3 ? 'tutorial-active' : ''} /> ))} </div> </div> </div> ))} </div>
                <div id="gem-area"> {gameState?.gems && COLOR_ORDER.map((color) => { const count = gameState.gems[color] || 0; const isActive = allowedAction === null && step === 1; return ( <div key={color} className={`gem ${color}chip ${isActive ? 'tutorial-active' : 'tutorial-inactive'}`} > <div className="bubble">{count}</div> <div className="underlay"></div> </div> ); })} </div>
            </div>
            <div className="player-panel-container">
                <div id="player-area">
                    {gameState?.players?.map((player) => (
                        <div key={player.uuid} data-player-id={player.id} className={`player ${allowedAction === null && step === 4 && player.id === MOCK_USER_ID ? 'tutorial-active' : 'tutorial-inactive'}`}>
                            <div className="playerHeader"> <span>{player.id === MOCK_USER_ID ? "You" : player.name}</span> <span>Score: {player.score}</span> </div>
                            <div className="gem-stats"> {COLOR_ORDER.map((color) => { const gemCount = player.gems[color] || 0; const bonusCount = player.bonusGems?.[color] || 0; const totalCount = gemCount + bonusCount; return ( <div key={color} className="statSet"> <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "1px", position: "relative", color: color === 'r' ? '#ff3333' : color === 'g' ? '#33cc33' : color === 'b' ? '#3333ff' : color === 'u' ? '#555555' : color === 'w' ? '#ffffff' : color === 'x' ? '#ffcc00' : 'white', textShadow: color === 'w' ? '1px 1px 1px #000' : 'none', fontFamily: "'Arial Black', Gadget, sans-serif" }}>{totalCount}</div> <div className="stat">{gemCount}+{bonusCount}</div> <div className={`chip ${color}chip`} /> </div> ); })} </div>
                            {/* Uses CardComponent for reserved cards, size controlled by .card-small in CSS */}
                            <div className="reserveCards"> {[0, 1, 2].map((i) => { const card = player.reserved?.[i]; if (card) { return ( <CardComponent key={card.uuid + '-reserved'} card={card} isDisabled={true} size="small" /> ); } else { return (<div key={`reserved-empty-${i}`} className="card-placeholder-small"/>); } })} </div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", marginBottom: "10px", color: "#FFD700" }}> {currentAction === null ? "Choose your action:" : (currentAction === 'take' && allowedAction === "selectAndConfirmGems" ? "Select Gems Below:" : `Action: ${currentAction.toUpperCase()}`)} </div>
                    {currentAction === null && ( <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}> <button id="action-button-take" onClick={() => handleSelectActionButton("take")} style={enableTakeGemsButton ? buttonStyle : inactiveButtonStyle} disabled={!enableTakeGemsButton} > Take Gems </button> <button id="action-button-buy" onClick={() => handleSelectActionButton("buy")} style={enableBuyCardButton ? buttonStyle : inactiveButtonStyle} disabled={!enableBuyCardButton} > Buy Card </button> <button id="action-button-reserve" onClick={() => handleSelectActionButton("reserve")} style={enableReserveCardButton ? buttonStyle : inactiveButtonStyle} disabled={!enableReserveCardButton} > Reserve Card </button> </div> )}
                    {currentAction !== null && ( <button onClick={() => { setCurrentAction(null); setSelectedGems([]); if (step === 6) setStep(5); else if (step === 8) setStep(7); else if (step === 10) setStep(9); }} style={{ ...buttonStyle, backgroundColor: "#cc3333", flex: 'none', padding: '8px 18px', fontSize: '16px', marginBottom: '10px' }}>Back</button> )}
                </div>
                {currentAction === "take" && allowedAction === "selectAndConfirmGems" && (
                  <div id="gem-selection-area" style={{ marginTop: "10px", padding: "15px", backgroundColor: "rgba(0,0,0,0.3)", border: "2px solid #aaa", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ color: "#fff", marginBottom: "10px", fontSize: "14px" }}> Select gems: 3 different (Please select 🔴Ruby(red gem), 🟢Emerald(green gem) and 🔵Sapphire(blue gem)) </div>
                    <div className="flex justify-center gap-2 flex-wrap mb-4">
                      {["r", "g", "b", "u", "w"].map(color => ( <div key={color} className={`gem ${color}chip ${enableGemSelection ? 'tutorial-active' : 'tutorial-inactive'} ${selectedGems.includes(color) ? "selected" : ""}`} onClick={() => { if(enableGemSelection) handleGemSelect(color); }} style={{ width: "50px", height: "50px", cursor: enableGemSelection ? "pointer" : "not-allowed", border: selectedGems.includes(color) ? "3px solid yellow" : (enableGemSelection ? '1px solid #aaa' : '1px solid #555'), }} /> ))}
                    </div>
                    <button id="confirm-gems-button" onClick={handleConfirmGems} style={finalEnableConfirm ? {...buttonStyle, backgroundColor: "#22bb55", flex:'none', padding: '8px 25px', fontSize: '16px'} : {...inactiveButtonStyle, flex:'none', padding: '8px 25px', fontSize: '16px'}} disabled={!finalEnableConfirm} > Confirm Gems </button>
                  </div>
                )}
            </div>
         </div>
      </div>
    </ResponsiveGameWrapper>
  );
}
