import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nafindo.buktiin',
  appName: 'Buktiin',
  webDir: 'dist',
  server: {
    allowNavigation: ['nafindo.github.io']
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
