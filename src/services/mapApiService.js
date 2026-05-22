import { api } from './apiClient';

export async function fetchNearbyPlaces(lat, lng, category, limit = 10) {
  try {
    const res = await api(`/map/places?lat=${lat}&lng=${lng}&category=${category}&limit=${limit}`);
    return res.data;
  } catch (error) {
    console.error('fetchNearbyPlaces error:', error);
    return null;
  }
}

export async function fetchRoute(start, end) {
  try {
    const res = await api('/map/route', {
      method: 'POST',
      body: { start, end },
    });
    return res.data;
  } catch (error) {
    console.error('fetchRoute error:', error);
    return null;
  }
}

export async function fetchSafetyScore(lat, lng) {
  try {
    const res = await api(`/map/safety-score?lat=${lat}&lng=${lng}`);
    return res.data;
  } catch (error) {
    console.error('fetchSafetyScore error:', error);
    return null;
  }
}
