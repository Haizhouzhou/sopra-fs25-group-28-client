"use client";

import { useState, useEffect, ReactNode } from 'react';
import { GAME_BACKGROUND } from '@/utils/constants';


interface ResponsiveGameWrapperProps {
  children: ReactNode;
  debugMode?: boolean;
}

const ResponsiveGameWrapper = ({ 
  children,
  debugMode = true // 开发时可以设为true，发布时改为false
}: ResponsiveGameWrapperProps) => {
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // 根据截图设置必要的尺寸
  const designWidth = 1750;
  const designHeight = 1250;

  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewportSize({ width, height });
      
      // 计算必要的缩放比例
      const horizontalScale = (width) / designWidth;
      const verticalScale = (height) / designHeight;
      
      // 取较小值以确保内容完全可见
      const calculatedScale = Math.min(horizontalScale, verticalScale);
      
      
      // 保守的缩放比例
      const safeScale = calculatedScale * 0.99;
      const finalScale = Math.min(safeScale, 1);
      setScale(finalScale);
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
        justifyContent: 'center', // 改为左对齐，不要居中
        alignItems: 'center',
        position: 'relative',
        overflow: 'auto',
        // 添加一些水平内边距，让游戏不贴边
        paddingLeft: '20px',
    }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center', // 从左侧开始变换
        width: `${designWidth}px`,
        height: `${designHeight}px`,
        transition: 'transform 0.2s ease',
        position: 'relative',
        boxShadow: 'none', // 移除阴影
        border: 'none', // 确保没有边框
        outline: 'none', // 移除轮廓
        overflow: 'hidden' ,// 防止内容溢出
        margin: '0',
      }}>
        {children}
      </div>
      
      {/* 调试信息 - 仅在开发模式显示 */}
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