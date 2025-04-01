import React from 'react';
import DevelopmentCard, { DevelopmentCardProps } from '../components/DevelopmentCard';

// Props for the PurchaseCard component
interface PurchaseCardProps {
  // Array of cards available for purchase
  availableCards: DevelopmentCardProps[];
  // Callback function when a card is purchased
  onPurchase: (cardId: string) => void;
}

// PurchaseCard component renders cards available for purchase along with a purchase button
const PurchaseCard: React.FC<PurchaseCardProps> = ({ availableCards, onPurchase }) => {
  return (
    <div className="purchase-card" style={{ margin: '20px' }}>
      <h3>Purchase a Card</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {availableCards.map((card) => (
          <div key={card.id} style={{ margin: '5px' }}>
            <DevelopmentCard {...card} />
            <button onClick={() => onPurchase(card.id)} style={{ marginTop: '5px' }}>
              Purchase
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchaseCard;
