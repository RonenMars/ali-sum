import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alisum.app',
  appName: 'Ali-Sum',
  webDir: 'www',
  server: {
    url: 'https://ali-sum.vercel.app',
    cleartext: false,
  },
};

export default config;
