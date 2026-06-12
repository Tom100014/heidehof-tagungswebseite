import { useState, useEffect } from 'react';

export interface IOSDeviceInfo {
  isIOS: boolean;
  isIPhone: boolean;
  isIPad: boolean;
  hasNotch: boolean;
  hasDynamicIsland: boolean;
  deviceModel: string;
  safeAreaTop: number;
  safeAreaBottom: number;
}

const getIOSDeviceInfo = (): IOSDeviceInfo => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (!isIOS) {
    return {
      isIOS: false,
      isIPhone: false,
      isIPad: false,
      hasNotch: false,
      hasDynamicIsland: false,
      deviceModel: 'Unknown',
      safeAreaTop: 0,
      safeAreaBottom: 0
    };
  }

  const isIPhone = /iPhone/.test(userAgent);
  const isIPad = /iPad/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Detect specific device models based on screen dimensions and pixel ratio
  const screenHeight = window.screen.height;
  const screenWidth = window.screen.width;
  const pixelRatio = window.devicePixelRatio || 1;
  
  let deviceModel = 'iOS Device';
  let hasNotch = false;
  let hasDynamicIsland = false;
  let safeAreaTop = 20; // Default status bar height
  let safeAreaBottom = 0;

  if (isIPhone) {
    // iPhone with Dynamic Island (iPhone 14 Pro, 15, 16 series)
    if ((screenHeight === 932 && screenWidth === 430) || // iPhone 15 Pro Max, 14 Pro Max
        (screenHeight === 852 && screenWidth === 393) || // iPhone 15 Pro, 14 Pro
        (screenHeight === 844 && screenWidth === 390) || // iPhone 15, 15 Plus
        (screenHeight === 926 && screenWidth === 428) || // iPhone 15 Plus
        (screenHeight === 956 && screenWidth === 440) || // iPhone 16 Pro Max
        (screenHeight === 874 && screenWidth === 402)) { // iPhone 16 Pro
      hasDynamicIsland = true;
      safeAreaTop = 54; // Dynamic Island height
      safeAreaBottom = 34;
      deviceModel = 'iPhone with Dynamic Island';
    }
    // iPhone with Notch (iPhone X, 11, 12, 13 series)
    else if ((screenHeight === 896 && screenWidth === 414) || // iPhone 11, XR, 12, 13
             (screenHeight === 844 && screenWidth === 390) || // iPhone 12 mini, 13 mini
             (screenHeight === 926 && screenWidth === 428) || // iPhone 12 Pro Max, 13 Pro Max
             (screenHeight === 812 && screenWidth === 375)) { // iPhone X, XS, 11 Pro
      hasNotch = true;
      safeAreaTop = 44; // Notch height
      safeAreaBottom = 34;
      deviceModel = 'iPhone with Notch';
    }
    // iPhone without Notch (iPhone 8 and earlier)
    else {
      safeAreaTop = 20; // Status bar only
      safeAreaBottom = 0;
      deviceModel = 'iPhone Classic';
    }
  } else if (isIPad) {
    // iPad detection
    safeAreaTop = 24; // iPad status bar
    safeAreaBottom = 0;
    deviceModel = 'iPad';
  }

  const deviceInfo = {
    isIOS,
    isIPhone,
    isIPad,
    hasNotch,
    hasDynamicIsland,
    deviceModel,
    safeAreaTop,
    safeAreaBottom
  };

  // Debug logging
  if (isIOS) {
    console.log('🍎 iOS Device Info:', {
      ...deviceInfo,
      screenHeight,
      screenWidth,
      pixelRatio
    });
  }

  return deviceInfo;
};

export const useIOSDeviceDetection = (): IOSDeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<IOSDeviceInfo>(() => {
    if (typeof window !== 'undefined') {
      return getIOSDeviceInfo();
    }
    return {
      isIOS: false,
      isIPhone: false,
      isIPad: false,
      hasNotch: false,
      hasDynamicIsland: false,
      deviceModel: 'Unknown',
      safeAreaTop: 0,
      safeAreaBottom: 0
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDeviceInfo = () => {
      setDeviceInfo(getIOSDeviceInfo());
    };

    // Initial detection
    updateDeviceInfo();

    // Listen for orientation changes
    window.addEventListener('orientationchange', updateDeviceInfo);
    window.addEventListener('resize', updateDeviceInfo);

    return () => {
      window.removeEventListener('orientationchange', updateDeviceInfo);
      window.removeEventListener('resize', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};