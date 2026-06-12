import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9370815e4154414994438ccbb25f7005',
  appName: 'hotel-der-heidehof-agent-neu-1',
  webDir: 'dist',
  server: {
    url: 'https://9370815e-4154-4149-9443-8ccbb25f7005.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F172A',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;