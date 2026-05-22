'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../../context/AuthContext';
import { useVoltData } from '../../context/VoltDataContext';
import { fetchRoute } from '../../services/mapApiService';
import { api } from '../../services/apiClient';

// Dynamically import MapComponent to avoid SSR errors with Leaflet
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#130b24]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-violet-300 font-semibold">Generating Neural Map...</span>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const { user } = useAuth();
  const { stations, userCoord, loading, refresh } = useVoltData();
  const router = useRouter();

  // Selected Station State
  const [selectedStation, setSelectedStation] = useState(null);
  
  // Filtering & Searching States
  const [searchQuery, setSearchQuery] = useState('');
  const [minPower, setMinPower] = useState(0); // 0 (any), 22, 50, 100
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyEmergency, setOnlyEmergency] = useState(false);

  // Booking Modal / Form State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState(30); // minutes
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Routing State
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Set default booking date/time when modal opens
  useEffect(() => {
    if (showBookingModal) {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      setBookingDate(`${yr}-${mo}-${dy}`);
      
      const hr = String(now.getHours()).padStart(2, '0');
      const mn = String(now.getMinutes()).padStart(2, '0');
      setBookingTime(`${hr}:${mn}`);
      
      setBookingError(null);
      setBookingSuccess(false);
    }
  }, [showBookingModal]);

  // Filtering Logic
  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPower = s.maxKw >= minPower;
      const matchesAvailability = !onlyAvailable || s.availablePorts > 0;
      const matchesEmergency = !onlyEmergency || s.isEmergencyCapable;
      return matchesSearch && matchesPower && matchesAvailability && matchesEmergency;
    });
  }, [stations, searchQuery, minPower, onlyAvailable, onlyEmergency]);

  if (!user) return null;

  // Handle station selection
  const handleSelectStation = (station) => {
    setSelectedStation(station);
    setRouteCoords(null);
    setRouteSummary(null);
  };

  // Fetch ORS Route
  const handleGetRoute = async () => {
    if (!selectedStation) return;
    setIsLoadingRoute(true);
    setRouteCoords(null);
    setRouteSummary(null);

    const start = [userCoord.longitude, userCoord.latitude];
    const end = [selectedStation.longitude, selectedStation.latitude];

    const data = await fetchRoute(start, end);
    setIsLoadingRoute(false);

    if (data && data.features && data.features.length > 0) {
      const routeFeature = data.features[0];
      const coords = routeFeature.geometry.coordinates.map((c) => [c[1], c[0]]); // [lat, lng]
      setRouteCoords(coords);
      
      const summary = routeFeature.properties?.summary;
      if (summary) {
        setRouteSummary({
          distanceKm: (summary.distance / 1000).toFixed(1),
          durationMin: Math.round(summary.duration / 60),
        });
      }
    } else {
      alert('Could not generate path. Verify ORS key settings.');
    }
  };

  // Submit Booking request
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedStation) return;
    
    setIsSubmittingBooking(true);
    setBookingError(null);
    
    try {
      const isoDateTime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      
      const res = await api('/bookings/create', {
        method: 'POST',
        body: {
          chargingStationId: selectedStation.id,
          bookingTime: isoDateTime,
          chargingDurationMinutes: Number(duration),
        },
      });

      setBookingSuccess(true);
      refresh(); // Refresh data to update status/bookings
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
      }, 2000);
    } catch (err) {
      setBookingError(err.message || 'Failed to book slot');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] relative overflow-hidden bg-[#0f0720]">
      
      {/* Ambient background glows */}
      <div className="ambient-orb w-[400px] h-[400px] bg-violet-600/5 -top-10 -left-10"></div>
      
      {/* Sidebar: Lists Stations & Booking Interface */}
      <div className="w-full md:w-[420px] h-1/2 md:h-full flex flex-col bg-[#110825]/90 border-r border-violet-500/10 backdrop-blur-md z-10 relative">
        
        {/* Search & Filters */}
        <div className="p-5 border-b border-violet-500/10 space-y-4">
          <h2 className="text-xl font-bold tracking-wide outfit-font text-white flex items-center gap-2">
            <span>📍</span> Discovery Map
          </h2>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search station or place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1b0e35] border border-violet-500/20 rounded-xl text-sm text-white placeholder-violet-300/40 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
            <span className="absolute left-3 top-2.5 text-violet-300/55 text-sm">🔍</span>
          </div>

          {/* Quick Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-violet-300/75">
              <span>Filter Speed:</span>
              <div className="flex gap-1">
                {[0, 22, 50, 100].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setMinPower(speed)}
                    className={`px-2 py-1 rounded font-semibold transition-all ${
                      minPower === speed
                        ? 'bg-violet-600 text-white'
                        : 'bg-[#1b0e35] text-violet-300/80 hover:bg-violet-500/15'
                    }`}
                  >
                    {speed === 0 ? 'All' : `${speed}kW+`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-violet-300/85">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-violet-500/30 bg-[#1b0e35] text-violet-600 focus:ring-0 focus:ring-offset-0"
                />
                <span>Available Slots Only</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyEmergency}
                  onChange={(e) => setOnlyEmergency(e.target.checked)}
                  className="rounded border-violet-500/30 bg-[#1b0e35] text-violet-600 focus:ring-0 focus:ring-offset-0"
                />
                <span>Shield SOS Plugs</span>
              </label>
            </div>
          </div>
        </div>

        {/* Station List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-violet-300/70">Scanning grid...</span>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-12 text-violet-300/50 text-xs">
              No matching charging stations found near you.
            </div>
          ) : (
            filteredStations.map((station) => {
              const isSelected = selectedStation?.id === station.id;
              return (
                <div
                  key={station.id}
                  onClick={() => handleSelectStation(station)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-violet-950/40 border-violet-500/60 shadow-lg shadow-violet-500/10'
                      : 'bg-[#1a0e33]/40 border-violet-500/10 hover:border-violet-500/30 hover:bg-[#1a0e33]/60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">{station.name}</h3>
                      <p className="text-[10px] text-violet-300/60 mt-0.5">{station.address}</p>
                    </div>
                    {station.isEmergencyCapable && (
                      <span className="text-[9px] bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                        SOS Shield
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-violet-500/5 text-center text-xs">
                    <div>
                      <span className="block text-[9px] text-violet-300/50 uppercase font-semibold">Speed</span>
                      <span className="font-bold text-violet-300">{station.maxKw} kW</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-violet-300/50 uppercase font-semibold">Available</span>
                      <span className={`font-bold ${station.availablePorts > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {station.availablePorts} / {station.totalPorts}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-violet-300/50 uppercase font-semibold">Distance</span>
                      <span className="font-bold text-white">{station.distanceKm.toFixed(1)} km</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Station detail drawer / panel */}
        {selectedStation && (
          <div className="p-5 border-t border-violet-500/15 bg-[#170a31] space-y-4">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-base font-bold text-white">{selectedStation.name}</h3>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-violet-300/50 hover:text-white text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>
              <p className="text-xs text-violet-300/70 mt-1">{selectedStation.address}</p>
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-semibold">
                  ⚡ {selectedStation.maxKw} kW Speed
                </span>
                <span className="text-[10px] bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded-full font-semibold">
                  ₹{selectedStation.pricePerKwh}/kWh
                </span>
                {selectedStation.rating > 0 && (
                  <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                    ⭐ {selectedStation.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Route Summary */}
            {routeSummary && (
              <div className="bg-[#1b0e35]/80 p-3 rounded-lg border border-violet-500/10 flex justify-between items-center text-xs">
                <div>
                  <span className="block text-[9px] text-violet-300/50 uppercase font-semibold">Route Est.</span>
                  <span className="font-bold text-white">{routeSummary.distanceKm} km ({routeSummary.durationMin} mins)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/20">
                  Optimal Path Loaded
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGetRoute}
                disabled={isLoadingRoute}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-violet-600/10 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isLoadingRoute ? 'Calculating...' : '🏎️ Get Directions'}
              </button>
              
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] shadow-lg shadow-violet-500/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📅</span> Reserve Plug
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Content View */}
      <div className="flex-1 h-1/2 md:h-full relative z-0">
        <MapComponent
          userCoord={userCoord}
          stations={filteredStations}
          targetStation={selectedStation}
          onSelectStation={handleSelectStation}
          routeCoords={routeCoords}
        />
        
        {/* Floating Quick Stats Panel on the Map */}
        <div className="absolute top-4 right-4 z-10 hidden sm:block">
          <div className="glass-panel p-4 rounded-xl border border-violet-500/15 text-xs space-y-1.5 max-w-[220px]">
            <div className="flex justify-between items-center text-violet-300/80">
              <span>Grid Status:</span>
              <span className="text-emerald-400 font-bold">Online ⚡</span>
            </div>
            <div className="flex justify-between items-center text-violet-300/80">
              <span>Your Location:</span>
              <span className="font-bold text-white">
                {userCoord ? `${userCoord.latitude.toFixed(3)}°, ${userCoord.longitude.toFixed(3)}°` : 'Resolving'}
              </span>
            </div>
            <div className="flex justify-between items-center text-violet-300/80">
              <span>Found Stations:</span>
              <span className="font-bold text-fuchsia-400">{filteredStations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal Overlay */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-[#070311]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-violet-500/20 bg-[#160d2b] relative space-y-6">
            
            {/* Header */}
            <div>
              <h3 className="text-lg font-bold text-white outfit-font">Reserve Charging Spot</h3>
              <p className="text-xs text-violet-300/70 mt-1">{selectedStation?.name}</p>
            </div>

            {bookingSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
                <span className="text-4xl animate-bounce">🎉</span>
                <span className="text-sm font-bold text-emerald-400">Reservation Successful!</span>
                <p className="text-xs text-violet-300/70">Your booking slot has been secured. Redirecting...</p>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">
                
                {bookingError && (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold">
                    ⚠️ {bookingError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-violet-300/60 font-bold uppercase tracking-wider mb-1.5">Date</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-[#1b0e35] border border-violet-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-violet-300/60 font-bold uppercase tracking-wider mb-1.5">Time</label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-[#1b0e35] border border-violet-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-violet-300/60 font-bold uppercase tracking-wider mb-1.5">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-[#1b0e35] border border-violet-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/60"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                    <option value={120}>120 Minutes</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs text-violet-300/70 border-t border-violet-500/5">
                  <span>Charging Speed:</span>
                  <span className="font-bold text-white">{selectedStation?.maxKw} kW (DC Fast)</span>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-[#1b0e35] border border-violet-500/10 text-violet-300/70 hover:text-white hover:bg-violet-500/10 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition-all cursor-pointer"
                  >
                    {isSubmittingBooking ? 'Reserving...' : 'Confirm Reservation'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
