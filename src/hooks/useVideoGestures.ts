import { useEffect, RefObject } from 'react';

interface UseVideoGesturesProps {
  containerRef: RefObject<HTMLDivElement>;
  videoRef: RefObject<HTMLVideoElement>;
  onSingleTap?: () => void;
  onDoubleTap?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const useVideoGestures = ({
  containerRef,
  videoRef,
  onSingleTap,
  onDoubleTap,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}: UseVideoGesturesProps) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;

      const isQuick = deltaTime < 300;
      const isSwipe = Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50;

      if (isSwipe) {
        // Horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 50 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < -50 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
        // Vertical swipe
        else {
          if (deltaY > 50 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < -50 && onSwipeUp) {
            onSwipeUp();
          }
        }
      } else if (isQuick) {
        // Tap detection
        const timeSinceLastTap = touchEndTime - lastTapTime;
        
        if (timeSinceLastTap < 300 && onDoubleTap) {
          // Double tap
          onDoubleTap();
          lastTapTime = 0; // Reset to prevent triple tap
        } else {
          // Single tap (with delay to wait for potential double tap)
          lastTapTime = touchEndTime;
          setTimeout(() => {
            if (lastTapTime === touchEndTime && onSingleTap) {
              onSingleTap();
            }
          }, 300);
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, videoRef, onSingleTap, onDoubleTap, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
};
