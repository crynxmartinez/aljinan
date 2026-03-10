import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sa.tasheel.app',
  appName: 'Tasheel',
  webDir: 'public',
  server: {
    url: 'https://www.tasheel.live',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
