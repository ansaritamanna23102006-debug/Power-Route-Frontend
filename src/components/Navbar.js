'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '⚡' },
    { href: '/map', label: 'Live Map', icon: '📍' },
    { href: '/ai-recommend', label: 'AI Planner', icon: '🤖' },
    { href: '/safety', label: 'VoltPath Shield', icon: '🛡️' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full px-4 py-3 bg-[#0f0720]/85 backdrop-blur-md border-b border-violet-500/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
            <span className="text-white text-xs font-black">P</span>
          </div>
          <span className="text-xl font-black tracking-wider bg-gradient-to-r from-violet-300 via-fuchsia-300 to-white bg-clip-text text-transparent">
            POWEROUTE
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-[#1a0d35]/60 p-1 rounded-full border border-violet-500/10">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-violet-200/80 hover:text-white hover:bg-violet-500/10'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-violet-300 font-semibold">{user.name}</span>
            <span className="text-[10px] text-fuchsia-400 font-medium">
              {user.evVehicleModel || 'EV Driver'}
            </span>
          </div>

          <button
            onClick={logout}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
