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
        src="/gamesource/homepage/homepage_background_Upscaler.webp"
        alt="Splendor Background"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* 添加右侧渐变蒙版 */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '1000px',
        height: '100%',
        background: 'linear-gradient(to right, rgba(15, 33, 73, 0), rgba(15, 33, 73, 0.7) 50%, rgba(15, 33, 73, 0.9))',
        zIndex: 15
      }} />

      {/* CSS 样式 */}
      <style jsx>{`
        .animated-button {
          position: relative;
          width: 400px;
          height: 100px;
          border-radius: 8px;
          z-index: 1111;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.3), -10px -10px 30px rgba(255, 215, 0, 0.1);
          transition: all 0.3s ease;
        }

        .animated-button:hover {
          transform: scale(1.02);
          box-shadow: 15px 15px 40px rgba(0, 0, 0, 0.4), -15px -15px 40px rgba(255, 215, 0, 0.2);
        }

        .button-bg {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 394px;
          height: 94px;
          z-index: 2;
          background: rgba(15, 33, 73, 0.75);
          backdrop-filter: blur(24px);
          border-radius: 6px;
          overflow: hidden;
          outline: 3px solid #FFD700;
        }

        .button-text {
          position: relative;
          z-index: 3;
          color: #FFD700;
          font-size: 40px;
          font-weight: bold;
          text-decoration: none;
          font-family: 'Trajan Pro', 'Times New Roman', serif;
          letter-spacing: 2px;
        }
        .blob {
          position: absolute;
          z-index: 1;
          top: 0;
          left: 0;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, #FFD700 0%, #FFA500 50%, rgba(255, 215, 0, 0.3) 80%, transparent 100%);
          opacity: 0.9;
          filter: blur(25px);
          animation: blob-bounce 6s infinite linear;
          pointer-events: none;
          animation-delay: 0s;
        }

        .blob-secondary {
          position: absolute;
          z-index: 1;
          top: 0;
          left: 0;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: radial-gradient(circle, #00BFFF 0%, #1E90FF 40%, rgba(30, 144, 255, 0.4) 70%, transparent 100%);
          opacity: 0.8;
          filter: blur(22px);
          animation: blob-bounce-reverse 6s infinite linear;
          pointer-events: none;
          animation-delay: 0.5s;
        }

        .blob-third {
          position: absolute;
          z-index: 1;
          top: 0;
          left: 0;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: radial-gradient(circle, #FF1493 0%, #FF6347 30%, rgba(255, 99, 71, 0.5) 60%, transparent 100%);
          opacity: 0.9;
          filter: blur(20px);
          animation: blob-bounce-diagonal 6s infinite linear;
          pointer-events: none;
          animation-delay: 1s;
        }

        @keyframes blob-bounce {
          0% {
            transform: translate(-10px, 5px);
          }
          50% {
            transform: translate(320px, 5px);
          }
          100% {
            transform: translate(-10px, 5px);
          }
        }

        @keyframes blob-bounce-reverse {
          0% {
            transform: translate(-10px, 5px);
          }
          50% {
            transform: translate(320px, 5px);
          }
          100% {
            transform: translate(-10px, 5px);
          }
        }

        @keyframes blob-bounce-diagonal {
          0% {
            transform: translate(-10px, 5px);
          }
          50% {
            transform: translate(320px, 5px);
          }
          100% {
            transform: translate(-10px, 5px);
          }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        right: '120px',
        top: '65%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '60px',
        zIndex: 20
      }}>
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <div className="animated-button">
            <div className="blob"></div>
            <div className="blob-secondary"></div>
            <div className="blob-third"></div>
            <div className="button-bg"></div>
            <span className="button-text">SIGN IN</span>
          </div>
        </Link>

        <Link href="/sign_up" style={{ textDecoration: 'none' }}>
          <div className="animated-button">
            <div className="blob"></div>
            <div className="blob-secondary"></div>
            <div className="blob-third"></div>
            <div className="button-bg"></div>
            <span className="button-text">SIGN UP</span>
          </div>
        </Link>
      </div>
    </div>
  );
}