"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* 背景图 */}
      <img
        src="/gamesource/homepage/homepage_background.jpg"
        alt="Splendor Background"
        style={{ 
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      <div style={{
        position: 'absolute',
        right: '50px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        zIndex: 10
      }}>
        <Link href="/login">
          <img
            src="/gamesource/homepage/homepage_button_sign_in.png"
            alt="Sign In"
            width={300}
            style={{ cursor: 'pointer' }}
          />
        </Link>
        
        <Link href="/sign_up">
          <img
            src="/gamesource/homepage/homepage_button_sign_up.png"
            alt="Sign Up"
            width={300}
            style={{ cursor: 'pointer' }}
          />
        </Link>
        
        {/* <Link href="/tutorial">
          <img
            src="/gamesource/homepage/homepage_button_tutorial.png"
            alt="Tutorial"
            width={300}
            style={{ cursor: 'pointer' }}
          />
        </Link> */}
      </div>
    </div>
  );
}
