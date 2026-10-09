import { toast } from 'sonner';

export interface GpsLocationResult {
  formattedText: string;
  lat: number;
  lng: number;
}

export function detectCurrentGpsLocation(
  onSuccess: (result: GpsLocationResult) => void,
  setLoading: (loading: boolean) => void
) {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    toast.error('Geolocation is not supported by your browser.');
    return;
  }

  setLoading(true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      let placeName = '';

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            signal: controller.signal,
            headers: { 'Accept-Language': 'en' },
          }
        );
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const parts = [
            addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood,
            addr.city_district || addr.suburb,
            addr.city || addr.town || addr.village,
            addr.state,
          ].filter(Boolean);

          if (parts.length > 0) {
            placeName = parts.slice(0, 3).join(', ');
          } else if (data.display_name) {
            placeName = data.display_name.split(',').slice(0, 3).join(',').trim();
          }
        }
      } catch {
        // Fallback to coordinates
      }

      const formattedText = placeName
        ? `${placeName} (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)`
        : `GPS: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`;

      onSuccess({
        formattedText,
        lat: latitude,
        lng: longitude,
      });

      setLoading(false);
      toast.success('Current location detected successfully!');
    },
    (error) => {
      setLoading(false);
      let msg = 'Failed to retrieve GPS location.';
      if (error.code === error.PERMISSION_DENIED) {
        msg = 'Location permission was denied. Please allow location access in your browser.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = 'Location position is currently unavailable.';
      } else if (error.code === error.TIMEOUT) {
        msg = 'GPS location request timed out. Please try again.';
      }
      toast.error(msg);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}
