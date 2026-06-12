import React from 'react';
import { PWAProvider } from '@/components/pwa/PWAProvider';
// Expose for legacy references that might expect a global variable
// @ts-ignore
;(globalThis as any).PWAProvider = (props: { children: React.ReactNode }) => (
  <PWAProvider>{props.children}</PWAProvider>
);


class PWABoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }>{
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('PWAProvider crashed – rendering without PWA features:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.children}</>;
    }
    return (
      <PWAProvider>
        {this.props.children}
      </PWAProvider>
    );
  }
}

export const SafePWAProvider = ({ children }: { children: React.ReactNode }) => {
  return <PWABoundary>{children}</PWABoundary>;
};
