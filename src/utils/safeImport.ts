
// Sichere Browser-Erkennung für SSR-Kompatibilität
export const isBrowser = typeof window !== 'undefined';

export const runIfBrowser = (callback: () => void) => {
  if (isBrowser) {
    try {
      callback();
    } catch (error) {
      console.warn('Browser operation failed:', error);
    }
  }
};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.getItem failed:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    if (!isBrowser) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage.setItem failed:', error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    if (!isBrowser) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error);
      return false;
    }
  }
};
