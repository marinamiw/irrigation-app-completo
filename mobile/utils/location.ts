import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

const FALLBACK_COORDS: Coords = { latitude: -15.7942, longitude: -47.8822 };

export async function getCurrentCoords(): Promise<Coords> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(FALLBACK_COORDS); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(FALLBACK_COORDS),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return FALLBACK_COORDS;

    // Tenta última posição conhecida primeiro — instantâneo
    const last = await Location.getLastKnownPositionAsync();
    if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };

    // Fallback: posição atual com timeout de 10s
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    );
    const loc = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      timeout,
    ]);
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return FALLBACK_COORDS;
  }
}
