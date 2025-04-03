// app/game/components/DevelopmentCard.tsx

import React from 'react';
import './DevelopmentCard.css';

interface Cost {
  type: string;
  count: number;
}

export interface DevelopmentCardProps {
  id: string;
  level: number;
  points: number;
  color: string;
  cost: Cost[];
}

const DevelopmentCard: React.FC<DevelopmentCardProps> = ({ level, points, color, cost }) => {
  return (
    <div className={`card border-${color}`}>
      <div className="card-top">
        <span className="points">{points > 0 ? `⭐${points}` : ''}</span>
        <span className="bonus">{getGemIcon(color)}</span>
      </div>
      <div className="card-costs">
        {cost.map((c, idx) => (
          <div key={idx} className="cost">
            {getGemIcon(c.type)} {c.count}
          </div>
        ))}
      </div>
    </div>
  );
};

function getGemIcon(type: string): string {
  const icons: Record<string, string> = {
    red: '🔴', blue: '🔵', green: '🟢', black: '⚫', white: '⚪', yellow: '🟡', diamond: '💎',
  };
  return icons[type] || '❓';
}

export default DevelopmentCard;
