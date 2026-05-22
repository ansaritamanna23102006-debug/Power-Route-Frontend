'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useVoltData } from '../../context/VoltDataContext';
import { fetchNearbyPlaces, fetchSafetyScore } from '../../services/mapApiService';
import { api } from '../../services/apiClient';

export default function SafetyPage() {
  const { user } = useAuth();
  const { stations, userCoord, refresh } = useVoltData();
  const router = useRouter();

  // Guardian Shield Mode State
  const [shieldActive, setShieldActive] = useState(false);
  const [guardians, setGuardians] = useState([
    { name: 'Primary Guardian', phone: '+91 98765 43210' },
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [shareMessage, setShareMessage] = useState('Heading to charging station.');
  const [shareSuccess, setShareSuccess] = useState(false);

  // SOS Countdown State
  const [sosCountdown, setSosCountdown] = useState(null);
  const [sosSent, setSosSent] = useState(false);
  const [sosDetails, setSosDetails] = useState(null);

  // Safety Score & Places State
  const [safetyScore, setSafetyScore] = useState(null);
  const [policeStations, setPoliceStations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loadingSafetyInfo, setLoadingSafetyInfo] = useState(false);

  // Reviews State
  const [selectedStationId, setSelectedStationId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Submit Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');
  const [newSafeAlone, setNewSafeAlone] = useState(true);
  const [reviewSubmitError, setReviewSubmitError] = useState(null);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Load Safety Score and Nearby Safe Zones
  useEffect(() => {
    if (userCoord) {
      loadSafetyData();
    }
  }, [userCoord]);

  // Handle countdown tick for SOS
  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown === 0) {
      triggerEmergencySos();
      return;
    }
    const timer = setTimeout(() => {
      setSosCountdown(sosCountdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [sosCountdown]);

  // Load reviews when station selection changes
  useEffect(() => {
    if (selectedStationId) {
      loadReviews(selectedStationId);
    } else {
      setReviews([]);
    }
  }, [selectedStationId]);

  // Automatically select the first station to show reviews
  useEffect(() => {
    if (stations.length > 0 && !selectedStationId) {
      setSelectedStationId(stations[0].id);
    }
  }, [stations]);

  if (!user) return null;

  const loadSafetyData = async () => {
    setLoadingSafetyInfo(true);
    try {
      const lat = userCoord.latitude;
      const lng = userCoord.longitude;

      // 1. Fetch Safety Score
      const scoreRes = await fetchSafetyScore(lat, lng);
      setSafetyScore(scoreRes);

      // 2. Fetch Police Stations (Geoapify category: service.police)
      const policeRes = await fetchNearbyPlaces(lat, lng, 'service.police', 4);
      if (policeRes && policeRes.features) {
        const list = policeRes.features.map(f => ({
          name: f.properties.name || 'Police Substation',
          address: f.properties.address_line2 || 'Nearby',
          dist: f.properties.distance ? `${(f.properties.distance / 1000).toFixed(1)} km` : 'Near'
        }));
        setPoliceStations(list);
      }

      // 3. Fetch Hospitals (Geoapify category: healthcare.hospital)
      const hospitalRes = await fetchNearbyPlaces(lat, lng, 'healthcare.hospital', 4);
      if (hospitalRes && hospitalRes.features) {
        const list = hospitalRes.features.map(f => ({
          name: f.properties.name || 'Hospital Emergency',
          address: f.properties.address_line2 || 'Nearby',
          dist: f.properties.distance ? `${(f.properties.distance / 1000).toFixed(1)} km` : 'Near'
        }));
        setHospitals(list);
      }
    } catch (err) {
      console.error('Failed to load safety data:', err);
    } finally {
      setLoadingSafetyInfo(false);
    }
  };

  const loadReviews = async (stationId) => {
    setLoadingReviews(true);
    try {
      const res = await api(`/women-safety/community-reviews/${stationId}`);
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Toggle Guardian Shield mode
  const handleToggleShield = async () => {
    try {
      const lat = userCoord.latitude;
      const lng = userCoord.longitude;

      if (!shieldActive) {
        // Activate Shield
        await api('/women-safety/activate', {
          method: 'POST',
          body: { lat, lng, guardianContacts: guardians },
        });
        setShieldActive(true);
      } else {
        // Deactivate Shield
        await api('/women-safety/deactivate', {
          method: 'POST',
          body: { lat, lng },
        });
        setShieldActive(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle shield');
    }
  };

  // Add guardian contact
  const handleAddGuardian = (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;
    if (guardians.length >= 5) {
      alert('Maximum 5 guardian contacts allowed');
      return;
    }
    const updated = [...guardians, { name: newContactName, phone: newContactPhone }];
    setGuardians(updated);
    setNewContactName('');
    setNewContactPhone('');

    // If shield is active, sync with backend
    if (shieldActive) {
      api('/women-safety/activate', {
        method: 'POST',
        body: { lat: userCoord.latitude, lng: userCoord.longitude, guardianContacts: updated },
      }).catch(console.error);
    }
  };

  // Remove guardian contact
  const handleRemoveGuardian = (idx) => {
    const updated = guardians.filter((_, i) => i !== idx);
    setGuardians(updated);
    
    if (shieldActive) {
      api('/women-safety/activate', {
        method: 'POST',
        body: { lat: userCoord.latitude, lng: userCoord.longitude, guardianContacts: updated },
      }).catch(console.error);
    }
  };

  // Share live location
  const handleShareLocation = async () => {
    try {
      await api('/women-safety/share-location', {
        method: 'POST',
        body: {
          lat: userCoord.latitude,
          lng: userCoord.longitude,
          message: shareMessage,
        },
      });
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to share location');
    }
  };

  // Start SOS button countdown
  const handleSosPress = () => {
    setSosCountdown(5);
    setSosSent(false);
  };

  const handleCancelSos = () => {
    setSosCountdown(null);
  };

  // Complete SOS trigger
  const triggerEmergencySos = async () => {
    setSosCountdown(null);
    try {
      const res = await api('/women-safety/sos', {
        method: 'POST',
        body: {
          lat: userCoord.latitude,
          lng: userCoord.longitude,
          message: 'EMERGENCY: User triggered one-tap SOS via PoweRoute Client.',
        },
      });
      setSosSent(true);
      setSosDetails(res);
    } catch (err) {
      alert('SOS broadcast failed: ' + err.message);
    }
  };

  // Submit community safety review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedStationId) return;
    
    setReviewSubmitError(null);
    setReviewSubmitSuccess(false);

    try {
      await api('/women-safety/community-review', {
        method: 'POST',
        body: {
          stationId: selectedStationId,
          rating: Number(newRating),
          text: newText,
          safeAlone: newSafeAlone,
        },
      });

      setReviewSubmitSuccess(true);
      setNewText('');
      loadReviews(selectedStationId);
    } catch (err) {
      setReviewSubmitError(err.message || 'Failed to submit safety review');
    }
  };

  return (
    <div className="flex-1 bg-[#0f0720] min-h-screen py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      
      {/* Background ambient animations */}
      <div className="ambient-orb w-[600px] h-[600px] bg-fuchsia-600/5 top-10 left-10 animate-pulse-glow"></div>
      <div className="ambient-orb w-[600px] h-[600px] bg-violet-600/5 bottom-10 right-10 animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white outfit-font">
            VoltPath Shield
          </h1>
          <p className="text-sm text-violet-300/80 mt-1">
            Guardian tracking, safety reviews, and emergency dispatch services.
          </p>
        </div>

        {/* SOS Alert Section (Overlay / Banner when active) */}
        {sosCountdown !== null && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/60 to-fuchsia-950/60 border border-red-500/40 text-center space-y-4 shadow-2xl animate-pulse">
            <h2 className="text-2xl font-black text-white outfit-font">BROADCASTING SOS ALERT</h2>
            <p className="text-sm text-red-200">Alerting registered guardians and emergency rescue teams in {sosCountdown} seconds...</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCancelSos}
                className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-sm cursor-pointer hover:bg-gray-100 active:scale-95 transition-all"
              >
                Cancel SOS (False Alarm)
              </button>
            </div>
          </div>
        )}

        {sosSent && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white outfit-font">✅ SOS Broadcast Transmitted</h2>
                <p className="text-xs text-emerald-300/80 mt-0.5">Emergency dispatched to coordinates: {userCoord.latitude.toFixed(4)}, {userCoord.longitude.toFixed(4)}</p>
              </div>
              <button
                onClick={() => setSosSent(false)}
                className="text-emerald-400 font-bold text-xs hover:text-white"
              >
                Dismiss
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
              <div className="bg-[#1b0e35]/35 p-3 rounded-lg border border-emerald-500/10 text-center">
                <span className="block text-[10px] text-violet-300/60 uppercase">Police Helpline</span>
                <span className="text-base font-bold text-white">{sosDetails?.helplines?.police || '112'}</span>
              </div>
              <div className="bg-[#1b0e35]/35 p-3 rounded-lg border border-emerald-500/10 text-center">
                <span className="block text-[10px] text-violet-300/60 uppercase">Women Shield</span>
                <span className="text-base font-bold text-white">{sosDetails?.helplines?.womenHelpline || '181'}</span>
              </div>
              <div className="bg-[#1b0e35]/35 p-3 rounded-lg border border-emerald-500/10 text-center">
                <span className="block text-[10px] text-violet-300/60 uppercase">Ambulance Rescue</span>
                <span className="text-base font-bold text-white">{sosDetails?.helplines?.ambulance || '108'}</span>
              </div>
              <div className="bg-[#1b0e35]/35 p-3 rounded-lg border border-emerald-500/10 text-center">
                <span className="block text-[10px] text-violet-300/60 uppercase">Fire Control</span>
                <span className="text-base font-bold text-white">{sosDetails?.helplines?.fire || '101'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: SOS Button & Shield Controller */}
          <div className="space-y-6">
            
            {/* SOS Button panel */}
            <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 flex flex-col items-center text-center justify-center min-h-[300px] glass-panel-hover">
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-4">Immediate Emergency</span>
              
              <button
                onClick={handleSosPress}
                disabled={sosCountdown !== null}
                className="w-36 h-36 rounded-full bg-gradient-to-tr from-red-600 to-fuchsia-600 border-4 border-white flex flex-col items-center justify-center shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
              >
                {/* Glowing ring animation */}
                <div className="absolute inset-0 rounded-full border-4 border-fuchsia-500/40 animate-ping"></div>
                <span className="text-3xl">🚨</span>
                <span className="text-xl font-black text-white mt-1.5 tracking-wider outfit-font">SOS</span>
                <span className="text-[9px] text-red-200 uppercase font-semibold mt-1">One-Tap Broadcast</span>
              </button>
              
              <p className="text-xs text-violet-300/50 max-w-xs mt-6">
                Transmits current live coordinate coordinates to nearby EV rescue patrols, police, and registered emergency contacts.
              </p>
            </div>

            {/* Guardian Shield Controls */}
            <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 space-y-5 glass-panel-hover">
              <div className="flex justify-between items-center">
                <div>
                  <span className="block text-xs font-semibold text-violet-300 uppercase tracking-wider">Guardian Shield</span>
                  <span className="text-[10px] text-violet-300/50">Active route telemetry tracking</span>
                </div>
                <button
                  onClick={handleToggleShield}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    shieldActive
                      ? 'bg-fuchsia-600/15 border-fuchsia-500 text-fuchsia-400 font-bold'
                      : 'bg-violet-500/10 border-violet-500/20 text-violet-300'
                  }`}
                >
                  {shieldActive ? '🛡️ Shield Active' : '🛡️ Activate Shield'}
                </button>
              </div>

              {/* Share Live Location */}
              <div className="space-y-2 pt-2 border-t border-violet-500/5">
                <label className="block text-[10px] text-violet-300/50 uppercase font-bold tracking-wider">Broadcast Status Note</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    className="flex-1 bg-[#1b0e35] border border-violet-500/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-violet-300/30 focus:outline-none focus:border-violet-500/50"
                  />
                  <button
                    onClick={handleShareLocation}
                    className="px-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-xs text-white active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    Share
                  </button>
                </div>
                {shareSuccess && (
                  <span className="block text-[10px] text-emerald-400 font-semibold">✓ Location dispatched successfully</span>
                )}
              </div>
            </div>

          </div>

          {/* Column 2: Guardian Contacts & Safezones directory */}
          <div className="space-y-6">
            
            {/* Guardian Contacts */}
            <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 space-y-4 glass-panel-hover">
              <span className="block text-xs font-semibold text-violet-300 uppercase tracking-wider">Guardian Contacts ({guardians.length}/5)</span>
              
              <div className="space-y-2.5">
                {guardians.map((g, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-[#1b0e35]/30 border border-violet-500/10 rounded-xl text-xs">
                    <div>
                      <span className="block font-bold text-white">{g.name}</span>
                      <span className="text-[10px] text-violet-300/60 mt-0.5">{g.phone}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveGuardian(idx)}
                      className="text-red-400 hover:text-red-300 font-bold text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Add contact form */}
              <form onSubmit={handleAddGuardian} className="space-y-3 pt-3 border-t border-violet-500/5">
                <span className="block text-[10px] text-violet-300/50 uppercase font-bold tracking-wider">Add Guardian Contact</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full bg-[#1b0e35] border border-violet-500/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    required
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full bg-[#1b0e35] border border-violet-500/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 text-xs font-bold transition-all cursor-pointer"
                >
                  + Register Guardian Contact
                </button>
              </form>
            </div>

            {/* Emergency Safe Zones nearby */}
            <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 space-y-5 glass-panel-hover">
              <div className="flex justify-between items-center">
                <span className="block text-xs font-semibold text-violet-300 uppercase tracking-wider">Emergency Safe Zones</span>
                <span className="text-[10px] text-violet-400 font-semibold bg-violet-400/10 px-2 py-0.5 rounded border border-violet-400/20">Within 5km</span>
              </div>

              {loadingSafetyInfo ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-violet-300/50">Resolving Geoapify coordinates...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Police Stations */}
                  <div>
                    <h4 className="text-xs font-bold text-violet-300 mb-2 flex items-center gap-1">👮 Police Subsections</h4>
                    <div className="space-y-1.5 pl-2 border-l border-violet-500/10">
                      {policeStations.length === 0 ? (
                        <span className="text-[10px] text-violet-300/40 italic">No police stations resolved in 5km</span>
                      ) : (
                        policeStations.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <span className="text-white font-medium truncate max-w-[170px]">{p.name}</span>
                            <span className="text-violet-300/60 text-[10px] shrink-0 font-semibold">{p.dist}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Hospitals */}
                  <div>
                    <h4 className="text-xs font-bold text-violet-300 mb-2 flex items-center gap-1">🏥 Emergency Hospitals</h4>
                    <div className="space-y-1.5 pl-2 border-l border-violet-500/10">
                      {hospitals.length === 0 ? (
                        <span className="text-[10px] text-violet-300/40 italic">No medical facilities resolved in 5km</span>
                      ) : (
                        hospitals.map((h, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <span className="text-white font-medium truncate max-w-[170px]">{h.name}</span>
                            <span className="text-violet-300/60 text-[10px] shrink-0 font-semibold">{h.dist}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Column 3: Safety score and Community Reviews */}
          <div className="space-y-6">
            
            {/* Safety Score Meter */}
            <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 space-y-4 glass-panel-hover">
              <span className="block text-xs font-semibold text-violet-300 uppercase tracking-wider">Local Safety Index</span>
              
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-full border-4 border-[#1b0e35] flex items-center justify-center bg-violet-950/20 shrink-0">
                  {/* SVG Circle Progress */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      strokeWidth="5"
                      stroke="#d946ef"
                      fill="transparent"
                      strokeDasharray="226"
                      strokeDashoffset={226 - (226 * (safetyScore?.score || 65)) / 100}
                    />
                  </svg>
                  <span className="text-xl font-black text-white">{safetyScore?.score || 65}</span>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {safetyScore?.score >= 80 ? 'Secure Shield Area' : safetyScore?.score >= 50 ? 'Moderate Alert Area' : 'Low Safety Index'}
                  </h4>
                  <p className="text-[10px] text-violet-300/60 mt-0.5">Based on proximity to rescue zones</p>
                </div>
              </div>

              {safetyScore?.factors && safetyScore.factors.length > 0 && (
                <div className="bg-[#1b0e35]/35 p-3 rounded-xl border border-violet-500/10 space-y-1">
                  <span className="block text-[9px] text-violet-300/50 uppercase font-bold tracking-wider">Key Factors</span>
                  {safetyScore.factors.map((f, i) => (
                    <span key={i} className="block text-xs text-violet-200">📌 {f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Community Safety Reviews */}
            <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 space-y-4 glass-panel-hover">
              <span className="block text-xs font-semibold text-violet-300 uppercase tracking-wider">Plug Safety Audits</span>

              {/* Station selector */}
              <div>
                <label className="block text-[10px] text-violet-300/50 uppercase font-bold tracking-wider mb-1.5">Select Charging Station</label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="w-full bg-[#1b0e35] border border-violet-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50"
                >
                  <option value="">-- Choose plug point --</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.distanceKm.toFixed(1)} km)
                    </option>
                  ))}
                </select>
              </div>

              {/* Review Audit History */}
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar border-t border-b border-violet-500/5 py-3">
                {loadingReviews ? (
                  <div className="text-center py-6 text-xs text-violet-300/50">Querying reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-6 text-xs text-violet-300/40 italic">No community safety audits submitted yet. Be the first!</div>
                ) : (
                  reviews.map((r, idx) => (
                    <div key={idx} className="space-y-1.5 border-b border-violet-500/5 pb-2.5 last:border-0 last:pb-0 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-violet-300">{r.user?.name || 'EV Driver'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-yellow-500/10 text-yellow-400 font-bold px-1.5 py-0.2 rounded border border-yellow-500/20">⭐ {r.rating}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            r.safeAlone 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {r.safeAlone ? 'Solo Safe' : 'Alert'}
                          </span>
                        </div>
                      </div>
                      <p className="text-violet-200/80 italic leading-relaxed text-[11px]">"{r.text}"</p>
                      <span className="block text-[8px] text-violet-300/35">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Submit safety audit */}
              {selectedStationId && (
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <span className="block text-[10px] text-violet-300/50 uppercase font-bold tracking-wider">Submit Safety Audit</span>
                  
                  {reviewSubmitError && (
                    <span className="block text-[10px] text-red-400 font-semibold">{reviewSubmitError}</span>
                  )}
                  {reviewSubmitSuccess && (
                    <span className="block text-[10px] text-emerald-400 font-semibold">✓ Review submitted successfully</span>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <label className="text-violet-300/70">Rating:</label>
                      <select
                        value={newRating}
                        onChange={(e) => setNewRating(Number(e.target.value))}
                        className="bg-[#1b0e35] border border-violet-500/20 rounded px-2 py-0.5 text-white"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>{n} Star</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-1.5 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSafeAlone}
                        onChange={(e) => setNewSafeAlone(e.target.checked)}
                        className="rounded border-violet-500/30 bg-[#1b0e35] text-violet-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-violet-300/80">Safe for solo driving</span>
                    </label>
                  </div>

                  <div className="relative">
                    <textarea
                      placeholder="Comment on lighting, CCTV presence, general surroundings..."
                      required
                      minLength={5}
                      maxLength={1000}
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      className="w-full bg-[#1b0e35] border border-violet-500/20 rounded-xl p-2.5 text-xs text-white placeholder-violet-300/30 focus:outline-none focus:border-violet-500/50"
                      rows={2.5}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-xs hover:from-violet-500 hover:to-fuchsia-500 transition-all cursor-pointer rounded-xl"
                  >
                    Submit Audit Report
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
