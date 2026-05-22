'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import AuthScreen from '../components/AuthScreen';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0720] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-violet-300">Synchronizing Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0f0720] flex flex-col justify-center overflow-hidden">
      
      {/* Background Ambient Effects */}
      <div className="ambient-orb w-[500px] h-[500px] bg-violet-600/10 -top-40 -left-40 animate-pulse-glow"></div>
      <div className="ambient-orb w-[600px] h-[600px] bg-fuchsia-600/10 -bottom-40 -right-40 animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto w-full px-6 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Product Intro */}
        <div className="space-y-8 text-center lg:text-left">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-6">
              <span>⚡</span>
              <span>Next-Gen EV Network</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white outfit-font">
              Intelligent Routing for <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-300 bg-clip-text text-transparent neon-text-violet">
                Electric Vehicles
              </span>
            </h1>
            
            <p className="mt-6 text-base sm:text-lg text-violet-200/70 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
              PowerRoute optimizes your journeys with real-time station availability, battery range forecasting, and customized itineraries powered by AI.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="glass-panel p-4 rounded-xl text-center">
              <span className="block text-xl font-bold text-white">500K+</span>
              <span className="text-[10px] text-violet-300/75 uppercase tracking-wider font-semibold">Stations</span>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center">
              <span className="block text-xl font-bold text-fuchsia-400">99.9%</span>
              <span className="text-[10px] text-violet-300/75 uppercase tracking-wider font-semibold">Uptime</span>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center">
              <span className="block text-xl font-bold text-violet-400">AI-Gen</span>
              <span className="text-[10px] text-violet-300/75 uppercase tracking-wider font-semibold">Routes</span>
            </div>
          </div>

          {/* Core App Features */}
          <div className="space-y-3 hidden sm:block">
            <div className="flex items-center gap-3 text-sm text-violet-200/90 justify-center lg:justify-start">
              <span className="text-violet-400 text-base">🛡️</span>
              <span><strong>VoltPath Shield:</strong> Specialized safety reviews and SOS emergency network.</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-violet-200/90 justify-center lg:justify-start">
              <span className="text-violet-400 text-base">🤖</span>
              <span><strong>Conversational Agent:</strong> Multi-turn recommendation system.</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-violet-200/90 justify-center lg:justify-start">
              <span className="text-violet-400 text-base">🔋</span>
              <span><strong>Smart Estimation:</strong> Battery range analysis accounting for terrain and cabin loads.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Screen */}
        <div className="w-full flex justify-center">
          <AuthScreen />
        </div>
      </div>
    </div>
  );
}
