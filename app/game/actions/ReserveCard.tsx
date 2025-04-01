import React from 'react';
import DevelopmentCard, { DevelopmentCardProps } from '../components/DevelopmentCard';

// Props for the ReserveCard component
interface ReserveCardProps {
  // Array of cards available for reservation
  availableCards: DevelopmentCardProps[];
  // Callback function when a card is reserved
  onReserve: (cardId: string) => void;
}

// ReserveCard component renders cards available for reservation
const ReserveCard: React.FC<ReserveCardProps> = ({ availableCards, onReserve }) => {
  return (
    <div className="reserve-card" style={{ margin: '20px' }}>
      <h3>Reserve a Card</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {availableCards.map((card) => (
          <div
            key={card.id}
            onClick={() => onReserve(card.id)}
            style={{ margin: '5px', cursor: 'pointer' }}
          >
            <DevelopmentCard {...card} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReserveCard;
