import Constants from 'expo-constants';

const getApiUrl = (): string => {
  // Prioridade 1: variável de ambiente definida no .env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // Prioridade 2 (dev): usa o mesmo host do Expo — funciona em emulador e dispositivo físico
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    const host = hostUri?.split(':')[0] ?? 'localhost';
    return `http://${host}:8000`;
  }

  // Prioridade 3: produção
  return 'https://your-production-api.com';
};

export const API_URL = getApiUrl();