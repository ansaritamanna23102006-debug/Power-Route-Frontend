'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { login, signup, verifyEmail, resendOtp } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await signup(name, email, phone, password);
        setSuccess('Registration successful! Verification code sent to your email.');
        setMode('verify');
      } else if (mode === 'verify') {
        await verifyEmail(email, otp);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    try {
      await resendOtp(email);
      setSuccess('Verification code resent successfully.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto z-10">
      
      {/* Decorative Orbs */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-violet-600/30 rounded-full blur-2xl animate-float"></div>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-fuchsia-600/30 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Main glass box */}
      <div className="glass-panel p-8 rounded-2xl border border-violet-500/20 relative overflow-hidden">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 items-center justify-center shadow-lg shadow-violet-500/25 mb-4 animate-bounce">
            <span className="text-white text-lg font-black">⚡</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white outfit-font">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'verify' && 'Verify Email'}
          </h2>
          <p className="text-xs text-violet-300/80 mt-1.5">
            {mode === 'login' && 'Access your EV charging assistant'}
            {mode === 'register' && 'Join the intelligent EV network'}
            {mode === 'verify' && `We sent a 6-digit OTP code to ${email}`}
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Registration fields */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-violet-200 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f0720]/60 border border-violet-500/25 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-violet-200 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f0720]/60 border border-violet-500/25 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm text-white transition-all"
                />
              </div>
            </>
          )}

          {/* Email field (only in login or register modes) */}
          {mode !== 'verify' && (
            <div>
              <label className="block text-[11px] font-semibold text-violet-200 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@domain.com"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f0720]/60 border border-violet-500/25 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm text-white transition-all"
              />
            </div>
          )}

          {/* Password field */}
          {mode !== 'verify' && (
            <div>
              <label className="block text-[11px] font-semibold text-violet-200 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f0720]/60 border border-violet-500/25 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm text-white transition-all"
              />
            </div>
          )}

          {/* OTP field */}
          {mode === 'verify' && (
            <div>
              <label className="block text-[11px] font-semibold text-violet-200 uppercase tracking-wider mb-1.5">Verification Code (OTP)</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f0720]/60 border border-violet-500/25 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-center text-lg tracking-widest text-white transition-all"
              />
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Processing...' : (
              mode === 'login' ? 'Sign In' :
              mode === 'register' ? 'Register Account' : 'Verify Account'
            )}
          </button>
        </form>

        {/* Resend and toggles */}
        <div className="mt-6 pt-6 border-t border-violet-500/10 text-center">
          {mode === 'verify' ? (
            <button
              onClick={handleResendOtp}
              className="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
            >
              Didn't receive a code? Resend OTP
            </button>
          ) : (
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs font-semibold text-violet-300 hover:text-white transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
