import React, { useEffect } from 'react';
import { useIsMobile } from './use-mobile.tsx';

export const useMobileOptimizations = () => {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) return;

    // Basic mobile optimizations
    const style = document.createElement('style');
    style.textContent = `
      .luxury-form {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 1px solid #d4af37;
        border-radius: 16px;
        padding: 24px;
      }
      
      .luxury-button {
        background: linear-gradient(135deg, #d4af37 0%, #f4e4a1 100%);
        color: #1a1a1a;
        font-weight: 600;
        min-height: 56px;
        border-radius: 12px;
      }
    `;
    
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, [isMobile]);

  return { isMobile };
};