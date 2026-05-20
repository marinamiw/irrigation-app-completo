import Constants from 'expo-constants';

const getApiUrl = (): string => {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    const host = hostUri?.split(':')[0] ?? 'localhost';
    return `http://${host}:8000`;
  }
  return 'https://your-production-api.com';
};

export const API_URL = getApiUrl();
