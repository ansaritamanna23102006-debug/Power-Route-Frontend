'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useVoltData } from '../../context/VoltDataContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { vehicle, stations, loading, refresh } = useVoltData();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  // Render dummy trips if none exist
  const trips = [
    { icon: '📍', title: 'Home', dist: '12.3 km', time: 'Today, 08:30 AM', color: 'text-violet-400' },
    { icon: '🏢', title: 'Office', dist: '24.6 km', time: 'Yesterday, 06:20 PM', color: 'text-fuchsia-400' },
    { icon: '🛒', title: 'Mall', dist: '18.7 km', time: 'May 10, 05:40 PM', color: 'text-violet-300' },
  ];

  // Bar heights for chart (percentage-based)
  const barHeights = [30, 70, 20, 90, 40, 80, 50, 100, 30];

  const batteryPct = vehicle?.batteryPct || 60;
  const rangeKm = vehicle?.rangeKm || 215.6;

  return (
    <div className="relative min-h-screen bg-[#0f0720] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Ambient backgrounds */}
      <div className="ambient-orb w-[600px] h-[600px] bg-violet-600/5 top-20 left-10 animate-pulse-glow"></div>
      <div className="ambient-orb w-[600px] h-[600px] bg-fuchsia-600/5 bottom-20 right-10 animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Header summary info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white outfit-font">
              EV Dashboard
            </h1>
            <p className="text-sm text-violet-300/80 mt-1">
              Welcome back, {user.name}. Here is your vehicle status.
            </p>
          </div>
          <button 
            onClick={refresh}
            disabled={loading}
            className="self-start px-4 py-2 text-xs font-bold rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: My Vehicle */}
          <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 flex flex-col justify-between min-h-[280px] glass-panel-hover">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-violet-300 uppercase tracking-wider">My Vehicle</span>
              <span className="text-violet-400 text-xs font-semibold">MG 4 Luxury</span>
            </div>
            
            {/* Visual Vehicle representation */}
            <div className="my-auto flex justify-center py-4">
              <div className="relative w-44 h-16 bg-gradient-to-r from-violet-600/20 to-fuchsia-500/25 border border-violet-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/5">
                <span className="text-[32px] animate-pulse">🚗</span>
                <div className="absolute -bottom-1 left-4 w-3 h-3 bg-violet-500 rounded-full blur-xs"></div>
                <div className="absolute -bottom-1 right-4 w-3 h-3 bg-fuchsia-500 rounded-full blur-xs"></div>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-violet-300/80">Battery Level</span>
                <span className="text-emerald-400 font-bold">{batteryPct}%</span>
              </div>
              <div className="w-full bg-[#1a0d35] rounded-full h-2 overflow-hidden border border-violet-500/10">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${batteryPct}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-end pt-1">
                <div>
                  <span className="block text-[10px] text-violet-300/60 uppercase font-semibold">Estimated Range</span>
                  <span className="text-xl font-black text-white">{rangeKm} km</span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ready
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Battery Ring Status */}
          <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 flex flex-col justify-between min-h-[280px] glass-panel-hover">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-violet-300 uppercase tracking-wider">Charging Details</span>
              <span className="text-violet-400 text-xs">Real-Time</span>
            </div>

            <div className="flex flex-col items-center justify-center my-auto py-2">
              {/* Circular battery ring visualization */}
              <div className="relative w-28 h-28 rounded-full border-4 border-[#1a0d35] flex items-center justify-center">
                {/* SVG circular progress */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="52"
                    strokeWidth="6"
                    stroke="#8b5cf6"
                    fill="transparent"
                    strokeDasharray="326"
                    strokeDashoffset={326 - (326 * batteryPct) / 100}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{batteryPct}%</span>
                  <span className="text-[9px] text-violet-300 font-medium uppercase tracking-wider">Status</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-violet-300 mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping"></span>
                ⚡ Connected to DC Grid
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-violet-500/10 pt-3 text-center mt-2">
              <div>
                <span className="block text-[9px] text-violet-300/60 uppercase font-semibold">Speed</span>
                <span className="text-sm font-bold text-white">
                  {vehicle?.chargeKw > 0 ? `${vehicle.chargeKw} kW` : '150 kW Max'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-violet-300/60 uppercase font-semibold">Time Remaining</span>
                <span className="text-sm font-bold text-white">
                  {vehicle?.timeToFullMin > 0 ? `${vehicle.timeToFullMin}m` : '45m to full'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Action List */}
          <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 flex flex-col justify-between min-h-[280px] glass-panel-hover">
            <div className="mb-4">
              <span className="text-sm font-semibold text-violet-300 uppercase tracking-wider">Smart Assist</span>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <Link 
                href="/map"
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1a0d35]/50 border border-violet-500/15 hover:border-violet-500/35 hover:bg-[#1a0d35] transition-all"
              >
                <span className="text-lg">📍</span>
                <div className="text-left">
                  <span className="block text-xs font-bold text-white">Find Nearby Chargers</span>
                  <span className="text-[10px] text-violet-300/75">Discover optimal plugs on map</span>
                </div>
              </Link>
              
              <Link 
                href="/ai-recommend"
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1a0d35]/50 border border-violet-500/15 hover:border-violet-500/35 hover:bg-[#1a0d35] transition-all"
              >
                <span className="text-lg">🤖</span>
                <div className="text-left">
                  <span className="block text-xs font-bold text-white">AI Route recommendations</span>
                  <span className="text-[10px] text-violet-300/75">Personalized range planning agent</span>
                </div>
              </Link>
              
              <Link 
                href="/safety"
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1a0d35]/50 border border-violet-500/15 hover:border-violet-500/35 hover:bg-[#1a0d35] transition-all"
              >
                <span className="text-lg">🛡️</span>
                <div className="text-left">
                  <span className="block text-xs font-bold text-white">VoltPath Shield & SOS</span>
                  <span className="text-[10px] text-violet-300/75">Safety ratings and one-tap alert</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Card 4: Recent Booking History / Trips */}
          <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 min-h-[300px] flex flex-col justify-between lg:col-span-2 glass-panel-hover">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-violet-300 uppercase tracking-wider">Recent Trips</span>
              <span className="text-[10px] text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded border border-violet-400/25">Activity Logs</span>
            </div>

            <div className="space-y-4 flex-1">
              {trips.map((trip, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-violet-500/5 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 bg-violet-500/10 rounded-full flex items-center justify-center border border-violet-500/15">
                      <span className="text-sm">{trip.icon}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">{trip.title} Station</span>
                      <span className="text-[10px] text-violet-300/70">{trip.time}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block text-xs font-bold ${trip.color}`}>{trip.dist}</span>
                    <span className="text-[10px] text-violet-300/50">Auto-booked</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-violet-500/10 text-center">
              <Link href="/map" className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors">
                View All Activity Logs →
              </Link>
            </div>
          </div>

          {/* Card 5: Cost Analytics Dashboard (Simulated Chart) */}
          <div className="glass-panel p-6 rounded-2xl border border-violet-500/15 min-h-[300px] flex flex-col justify-between glass-panel-hover">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-violet-300 uppercase tracking-wider">Spend Overview</span>
              <span className="text-[10px] text-fuchsia-400 bg-fuchsia-400/15 px-2.5 py-0.5 rounded-full border border-fuchsia-400/30">May</span>
            </div>

            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-3xl font-extrabold text-white">₹1,245</span>
                <span className="text-[10px] block text-violet-300/60 font-semibold uppercase mt-0.5">Total Spend This Month</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400">🌱 Eco Saving</span>
                <span className="text-[10px] block text-violet-300/60 font-semibold uppercase mt-0.5">34 kg CO₂ Saved</span>
              </div>
            </div>

            {/* Custom bar chart */}
            <div className="flex items-end justify-between h-24 border-b border-violet-500/10 pb-2 relative">
              {barHeights.map((height, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 w-full max-w-[12px]">
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-700 ${
                      idx % 2 === 0 ? 'bg-gradient-to-t from-violet-600 to-violet-400 shadow-lg shadow-violet-500/20' : 'bg-gradient-to-t from-fuchsia-500 to-fuchsia-400 shadow-lg shadow-fuchsia-500/20'
                    }`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  ></div>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[8px] text-violet-300/50 pt-2 uppercase font-semibold">
              <span>May 1</span>
              <span>May 10</span>
              <span>May 20</span>
              <span>May 30</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
