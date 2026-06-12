
// This file is now deprecated - using direct Sonner import in main.tsx
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-center"
      richColors={false}
      closeButton={true}
      duration={2500}
      toastOptions={{
        classNames: {
          toast: "hotel-toast-luxury",
          title: "hotel-toast-title",
          description: "hotel-toast-description",
          closeButton: "hotel-toast-close",
        },
        style: {
          background: 'rgba(0, 0, 0, 0.95)',
          border: '2px solid #D9B567',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 10px 40px rgba(217, 181, 103, 0.3)',
          backdropFilter: 'blur(20px)',
          marginTop: 'max(20px, env(safe-area-inset-top))',
          maxWidth: '90vw',
        }
      }}
    />
  );
}
