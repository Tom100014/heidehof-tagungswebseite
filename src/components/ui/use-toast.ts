
// Re-export sonner toast functionality
import { toast as sonnerToast } from "sonner";

// Export the sonner toast with consistent naming
export const toast = sonnerToast;

// Dummy exports to maintain compatibility with existing code that may still use the old API
export const useToast = () => ({
  toast: sonnerToast,
  toasts: []
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => children;
