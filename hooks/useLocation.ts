import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface UseLocationReturn {
  permission: Location.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationCoords | null>;
  isLoading: boolean;
  error: string | null;
}

export function useLocation(): UseLocationReturn {
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermission(status);
      return status === 'granted';
    } catch (err) {
      setError('Impossible de demander la permission de localisation');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationCoords | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check permission first
      let currentPermission = permission;
      if (!currentPermission) {
        const { status } = await Location.getForegroundPermissionsAsync();
        currentPermission = status;
        setPermission(status);
      }

      if (currentPermission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setError('Permission de localisation refusée');
          return null;
        }
      }

      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Location timeout')), 5000)
        ),
      ]);

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (err) {
      setError('Impossible de récupérer la position');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [permission, requestPermission]);

  return {
    permission,
    requestPermission,
    getCurrentLocation,
    isLoading,
    error,
  };
}
