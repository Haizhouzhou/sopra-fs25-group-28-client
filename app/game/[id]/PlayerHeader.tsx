import type { Player } from "@/types/game";

interface PlayerHeaderProps {
    player: Player;
    currentUserId: number | string;
    currentTurnPlayerId: number | string;
  }
  
  export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
    player,
    currentUserId,
    currentTurnPlayerId
  }) => {
    const isYou = player.id === currentUserId;
    const isCurrentTurn = player.id === currentTurnPlayerId;
  
    return (
      <div
        className="player-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: isYou ? "bold" : "normal",
          color: isYou ? "#00f5ff" : "#fff",
          backgroundColor: isCurrentTurn ? "rgba(255, 215, 0, 0.1)" : "transparent",
          border: isCurrentTurn ? "2px solid gold" : "1px solid transparent",
          borderRadius: "6px",
          padding: "4px 8px",
          animation: isCurrentTurn ? "pulse 2s infinite" : "none"
        }}
      >
        <span>
          {isYou ? "You" : player.name}
          {isCurrentTurn && (
            <span style={{ marginLeft: "5px", fontSize: "18px" }}>🕹️</span>
          )}
        </span>
        <span>Score: {player.score}</span>
      </div>
    );
  };
  