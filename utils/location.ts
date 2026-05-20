import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

export async function getCurrentCoords(): Promise<Coords> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada pelo navegador'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão de localização negada');
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}