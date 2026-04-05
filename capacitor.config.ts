import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'meuApp',
  webDir: 'www',
  plugins: {
    GoogleMaps: {
      apiKey: 'AIzaSyD-lFCYNdPjfaGQKLGCw99_NDDjsiPJEak'
    }
  }
};

export default config;
