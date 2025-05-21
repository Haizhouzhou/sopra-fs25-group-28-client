// 在 ResponsiveGameWrapper 中添加以下修改

"use client";
import { useState, useEffect, ReactNode } from 'react';
import { GAME_BACKGROUND } from '@/utils/constants';

interface ResponsiveGameWrapperProps {
  children: ReactNode;
  debugMode?: boolean;
}

const ResponsiveGameWrapper = ({ 
  children,
  debugMode = false 
}: ResponsiveGameWrapperProps) => {
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  
  // 修改设计宽度和高度
  const designWidth = 1750;
  const designHeight = 1250;
  
  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewportSize({ width, height });
      
      // 重要：检查是否需要应用最小宽度限制
      const minTotalWidth = 900; // 左侧区域500px + 右侧区域350px + 间距50px
      
      if (width < minTotalWidth) {
        // 如果屏幕宽度小于最小总宽度，计算缩放因子
        const newScale = width / minTotalWidth;
        // 限制最小缩放因子，确保界面不会过小
        setScale(Math.max(newScale, 0.6));
      } else {
        // 正常情况下的缩放逻辑
        const horizontalScale = width / designWidth;
        const verticalScale = height / designHeight;
        const calculatedScale = Math.min(horizontalScale, verticalScale);
        const safeScale = calculatedScale * 0.99;
        setScale(Math.min(safeScale, 1));
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!mounted) {
    return <div style={{ width: '100vw', height: '100vh' }}></div>;
  }
  
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: GAME_BACKGROUND,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '0',
    }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        width: `${designWidth}px`,
        height: `${designHeight}px`,
        transition: 'transform 0.2s ease',
        position: 'relative',
        boxSizing: 'border-box',
        margin: '0',
      }}>
        {children}
      </div>
      
      {/* 调试信息 */}
      {debugMode && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          fontSize: '12px',
          borderRadius: '5px',
          zIndex: 9999
        }}>
          Screen: {viewportSize.width}×{viewportSize.height} | 
          Scale: {scale.toFixed(2)} | 
          Design: {designWidth}×{designHeight}
        </div>
      )}
    </div>
  );
};

export default ResponsiveGameWrapper;