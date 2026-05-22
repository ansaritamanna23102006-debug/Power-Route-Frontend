export function haversineKm(a, b) {
  const R = 6371;
  const dLat = deg2rad(b.latitude - a.latitude);
  const dLon = deg2rad(b.longitude - a.longitude);
  const lat1 = deg2rad(a.latitude);
  const lat2 = deg2rad(b.latitude);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function deg2rad(d) {
  return (d * Math.PI) / 180;
}

export function buildInterpolatedRoute(from, to, segments = 18) {
  const pts = [];
  const midLat = (from.latitude + to.latitude) / 2;
  const midLng = (from.longitude + to.longitude) / 2;
  const perp = 0.0025 * (segments > 12 ? 1 : 0.6);
  const ctrl = {
    latitude: midLat + perp,
    longitude: midLng - perp,
  };
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat =
      (1 - t) * (1 - t) * from.latitude + 2 * (1 - t) * t * ctrl.latitude + t * t * to.latitude;
    const lng =
      (1 - t) * (1 - t) * from.longitude + 2 * (1 - t) * t * ctrl.longitude + t * t * to.longitude;
    pts.push({ latitude: lat, longitude: lng });
  }
  return pts;
}

export function estimateDriveEta(distanceKm, avgKmh = 26) {
  const roadKm = distanceKm * 1.28;
  const minutes = Math.max(2, Math.round((roadKm / avgKmh) * 60));
  return { minutes, distanceKm: Math.round(roadKm * 10) / 10 };
}

export function nearestStation(user, stations) {
  if (!stations?.length) return null;
  let best = stations[0];
  let bestD = Infinity;
  for (const s of stations) {
    const d = haversineKm(user, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
