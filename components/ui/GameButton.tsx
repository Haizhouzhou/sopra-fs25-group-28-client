import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface GameButtonProps {
  src: string;     
  alt: string;       
  href: string;     
  width?: number;   
  height?: number;  
  className?: string; 
  onClick?: () => void; 
}

const GameButton: React.FC<GameButtonProps> = ({
  src,
  alt,
  href,
  width = 300,
  height = 80,
  className = '',
  onClick
}) => {
  return (
    <Link href={href} onClick={onClick} passHref>
      <div className={`relative cursor-pointer game-button ${className}`}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-splendor-gold/0 hover:bg-splendor-gold/10 transition-colors duration-300 rounded-lg"></div>
      </div>
    </Link>
  );
};

export default GameButton;