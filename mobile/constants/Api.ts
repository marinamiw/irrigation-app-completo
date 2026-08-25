import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = (): string => {
  // Variável de ambiente definida no .env (produção ou override manual)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri ?? '';
    const host = hostUri.split(':')[0];

    // Emulador Android: 127.0.0.1 no emulador aponta pro próprio emulador,
    // não para o PC. 10.0.2.2 é o alias do host no emulador Android.
    if (Platform.OS === 'android' && (host === '127.0.0.1' || host === 'localhost' || !host)) {
      return 'http://10.0.2.2:8000';
    }

    // Dispositivo físico ou iOS simulator: usa o IP do Metro
    if (host) return `http://${host}:8000`;

    return 'http://localhost:8000';
  }

  return 'https://climora.up.railway.app';
};

export const API_URL = getApiUrl();