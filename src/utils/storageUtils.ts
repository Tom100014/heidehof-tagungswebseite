
import { safeLocalStorage } from './safeImport';

export const getStorageItem = (key: string): string | null => {
  return safeLocalStorage.getItem(key);
};

export const setStorageItem = (key: string, value: string): boolean => {
  return safeLocalStorage.setItem(key, value);
};

export const removeStorageItem = (key: string): boolean => {
  return safeLocalStorage.removeItem(key);
};

export const getStorageObject = <T>(key: string, defaultValue: T): T => {
  const item = getStorageItem(key);
  if (!item) return defaultValue;
  
  try {
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn('Failed to parse storage item:', key, error);
    return defaultValue;
  }
};

export const setStorageObject = <T>(key: string, value: T): boolean => {
  try {
    return setStorageItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to stringify storage item:', key, error);
    return false;
  }
};
