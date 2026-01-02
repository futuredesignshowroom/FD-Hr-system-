// utils/location.ts - Location Utility Functions

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: Date;
}

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true, // Enable high accuracy for exact location
        timeout: 8000, // Increased timeout for better accuracy
        maximumAge: 60000, // 1 minute cache
      }
    );
  });
};

export const getLocationLink = (location: LocationData): string => {
  return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
};

export const formatLocationForDisplay = (location: LocationData): string => {
  return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
};