export function mapStationFromApi(raw) {
  const [lng, lat] = raw.location?.coordinates || [0, 0];
  const total = raw.slotAvailability?.totalSlots ?? 0;
  const available = raw.slotAvailability?.availableSlots ?? 0;
  return {
    id: String(raw._id),
    name: raw.stationName || 'Charging station',
    address: lat && lng ? `${Number(lat).toFixed(4)}°, ${Number(lng).toFixed(4)}°` : 'On file',
    distanceKm: raw.distanceKm ?? 0,
    availablePorts: available,
    totalPorts: total > 0 ? total : 1,
    maxKw: raw.chargingSpeedKw ?? 0,
    pricePerKwh: raw.pricing?.perKwh ?? 0,
    rating: raw.ratings?.average ?? 0,
    network: (raw.chargerTypes || []).slice(0, 2).join(' · ') || 'Power Route',
    amenities: raw.chargerTypes || [],
    latitude: Number(lat) || 0,
    longitude: Number(lng) || 0,
    isEmergencyCapable: Boolean(raw.isEmergencyCapable),
  };
}

export function mapStationForAi(station) {
  return {
    id: station.id,
    name: station.name,
    lat: station.latitude,
    lng: station.longitude,
    chargerTypes: station.amenities,
    chargingSpeedKw: station.maxKw,
    availableSlots: station.availablePorts,
    totalSlots: station.totalPorts,
    pricePerKwh: station.pricePerKwh,
    ratingsAverage: station.rating,
  };
}

export function mapAiRecommendations(payload) {
  const ranked = payload?.alternatives || payload?.ranked || [];
  const source =
    ranked.length > 0
      ? ranked
      : [payload?.bestChargingStation, payload?.backupChargingStation].filter(Boolean);
  return source.slice(0, 6).map((item, i) => {
    const st = item.station || item;
    const name = st?.name || st?.stationName || 'Charging hub';
    const reasons = item.reasons || [];
    return {
      id: st?.id || st?._id || `ai-${i}`,
      title: `Charge at ${name}`,
      reason: reasons.length ? reasons.join('. ') : 'Optimized for your route and charger type.',
      confidence: Math.round(Math.min(99, Math.max(50, item.matchScore ?? 75))),
    };
  });
}

export function mapBookingHistory(bookings) {
  return bookings.map((b) => {
    const station = b.chargingStation;
    const hours = (b.chargingDurationMinutes || 60) / 60;
    const kw = station?.chargingSpeedKw || 50;
    const kwh = Math.round(kw * hours * 0.85 * 10) / 10;
    const perKwh = station?.pricing?.perKwh || 0;
    const fee = station?.pricing?.sessionFee || 0;
    return {
      id: String(b._id),
      date: b.bookingTime
        ? new Date(b.bookingTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '—',
      kwh,
      cost: Math.round((fee + kwh * perKwh) * 100) / 100,
      station: station?.stationName || 'Unknown',
      status: b.status,
    };
  });
}

export function buildEnergyWeek(bookings) {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const buckets = labels.map((day) => ({ day, kwh: 0 }));
  const now = new Date();
  for (const b of bookings) {
    if (!b.bookingTime) continue;
    const d = new Date(b.bookingTime);
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays < 0 || diffDays > 6) continue;
    const idx = (d.getDay() + 6) % 7;
    const hours = (b.chargingDurationMinutes || 60) / 60;
    const kw = b.chargingStation?.chargingSpeedKw || 50;
    buckets[idx].kwh += Math.round(kw * hours * 0.85 * 10) / 10;
  }
  return buckets.map((b) => ({ ...b, kwh: Math.round(b.kwh) }));
}

export function mapVehicleFromUser(user, extras = {}) {
  const v = user?.vehicle || user || {};
  return {
    batteryPct: Number(v.currentBatteryPercent ?? extras.batteryPct ?? 0),
    rangeKm: Number(extras.rangeKm ?? 0),
    isCharging: Boolean(extras.isCharging ?? false),
    chargeKw: Number(extras.chargeKw ?? 0),
    timeToFullMin: Number(extras.timeToFullMin ?? 0),
    ecoScore: Number(extras.ecoScore ?? 0),
    monthlySpendUsd: Number(extras.monthlySpendUsd ?? 0),
    evVehicleModel: v.evVehicleModel || '',
    batteryCapacityKwh: Number(v.batteryCapacityKwh ?? 60),
  };
}
