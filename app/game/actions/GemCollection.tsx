import React from 'react';
import GemToken from '../components/GemToken';

// Props for the GemCollection component
interface GemCollectionProps {
  // Array of available gems with type and count
  availableGems: { type: string; count: number }[];
  // Callback function when a gem is collected
  onCollect: (gemType: string) => void;
}

// GemCollection component renders available gems for collection
const GemCollection: React.FC<GemCollectionProps> = ({ availableGems, onCollect }) => {
  return (
    <div className="gem-collection" style={{ margin: '20px' }}>
      <h3>Available Gems</h3>
      <div style={{ display: 'flex' }}>
        {availableGems.map((gem) => (
          <GemToken
            key={gem.type}
            type={gem.type}
            count={gem.count}
            onClick={() => onCollect(gem.type)}
          />
        ))}
      </div>
    </div>
  );
};

export default GemCollection;
