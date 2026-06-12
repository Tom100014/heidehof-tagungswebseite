
import React from "react";
import { toast as sonnerToast } from "sonner";

// Re-export the sonner toast directly
export const toast = sonnerToast;

// Define the allowed toast parameter types for compatibility
export interface ToastParams {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "info" | "warning";
  duration?: number;
}

// Create a no-op context for backwards compatibility
const ToastContext = React.createContext<any | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastContext.Provider value={{ toasts: [] }}>
      {children}
    </ToastContext.Provider>
  );
}

// The useToast hook now returns the sonner toast directly with compatibility methods
export function useToast() {
  return {
    toasts: [],
    toast: (params?: ToastParams) => {
      const duration = params?.duration || 2500;
      
      if (params?.variant === "destructive") {
        sonnerToast.error(params.title as string, { 
          description: params.description as string,
          action: params.action,
          duration,
          style: {
            background: 'rgba(0, 0, 0, 0.95)',
            color: '#ffffff',
            border: '2px solid #EF4444',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(20px)'
          }
        });
      } else if (params?.variant === "success") {
        sonnerToast.success(params.title as string, { 
          description: params.description as string,
          action: params.action,
          duration,
          style: {
            background: 'rgba(0, 0, 0, 0.95)',
            color: '#ffffff',
            border: '2px solid #10B981',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
            backdropFilter: 'blur(20px)'
          }
        });
      } else if (params?.variant === "info") {
        sonnerToast(params.title as string, { 
          description: params.description as string,
          action: params.action,
          duration,
          icon: 'ℹ️',
          style: {
            background: 'rgba(0, 0, 0, 0.95)',
            color: '#ffffff',
            border: '2px solid #60A5FA',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 10px 40px rgba(96, 165, 250, 0.3)',
            backdropFilter: 'blur(20px)'
          }
        });
      } else if (params?.variant === "warning") {
        sonnerToast(params.title as string, { 
          description: params.description as string,
          action: params.action,
          duration,
          icon: '⚠️',
          style: {
            background: 'rgba(0, 0, 0, 0.95)',
            color: '#ffffff',
            border: '2px solid #FB923C',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 10px 40px rgba(251, 146, 60, 0.3)',
            backdropFilter: 'blur(20px)'
          }
        });
      } else {
        sonnerToast(params?.title as string, { 
          description: params?.description as string,
          action: params?.action,
          duration,
          style: {
            background: 'rgba(0, 0, 0, 0.95)',
            color: '#ffffff',
            border: '2px solid #D9B567',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 10px 40px rgba(217, 181, 103, 0.3)',
            backdropFilter: 'blur(20px)'
          }
        });
      }
    },
    info: (params?: ToastParams) => {
      sonnerToast(params?.title as string, {
        description: params?.description as string,
        action: params?.action,
        duration: params?.duration || 2500,
        icon: 'ℹ️',
        style: {
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#ffffff',
          border: '2px solid #60A5FA',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 10px 40px rgba(96, 165, 250, 0.3)',
          backdropFilter: 'blur(20px)'
        }
      });
    },
    warning: (params?: ToastParams) => {
      sonnerToast(params?.title as string, {
        description: params?.description as string,
        action: params?.action,
        duration: params?.duration || 2500,
        icon: '⚠️',
        style: {
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#ffffff',
          border: '2px solid #FB923C',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 10px 40px rgba(251, 146, 60, 0.3)',
          backdropFilter: 'blur(20px)'
        }
      });
    },
    success: (params?: ToastParams) => {
      sonnerToast.success(params?.title as string, {
        description: params?.description as string,
        action: params?.action,
        duration: params?.duration || 2500,
        style: {
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#ffffff',
          border: '2px solid #10B981',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(20px)'
        }
      });
    },
    error: (params?: ToastParams) => {
      sonnerToast.error(params?.title as string, {
        description: params?.description as string,
        action: params?.action,
        duration: params?.duration || 2500,
        style: {
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#ffffff',
          border: '2px solid #EF4444',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
          backdropFilter: 'blur(20px)'
        }
      });
    }
  };
}
