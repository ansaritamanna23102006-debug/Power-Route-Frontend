'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useVoltData } from '../../context/VoltDataContext';
import { api } from '../../services/apiClient';

export default function AiRecommendPage() {
  const { user } = useAuth();
  const { vehicle, userCoord, refresh } = useVoltData();
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Hello! I am your VoltAgent, your intelligent EV navigator. Ask me about charging stations, range estimates, battery care, or how to plan your next trip efficiently.",
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedStationInfo, setSelectedStationInfo] = useState(null);

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!user) return null;

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Gather EV battery / vehicle context to enrich LLM prompt
      const context = `Vehicle Model: ${vehicle?.evVehicleModel || 'Generic EV'}. Current Battery: ${vehicle?.batteryPct}%. Range: ${vehicle?.rangeKm} km. Capacity: ${vehicle?.batteryCapacityKwh} kWh.`;
      
      const payload = {
        message: textToSend,
        context,
        lat: userCoord?.latitude,
        lng: userCoord?.longitude,
      };

      const res = await api('/ai/chat', {
        method: 'POST',
        body: payload,
      });

      const responseData = res.data || {};
      
      const agentMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: responseData.reply || "I've processed your request but didn't receive a detailed reply. How else can I help you?",
        time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        nearestStation: responseData.nearestStation,
        provider: responseData.provider,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      const errorMessage = {
        id: `error-${Date.now()}`,
        sender: 'agent',
        text: `Error connecting to VoltAgent: ${error.message || 'Network Timeout'}. Ensure backend is running.`,
        time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (q) => {
    handleSendMessage(q);
  };

  const quickPrompts = [
    { text: "Find nearest charging station", icon: "📍" },
    { text: "Predict my EV range", icon: "🔋" },
    { text: "Give me battery health tips", icon: "❤️" },
    { text: "Cost estimation guide", icon: "₹" },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] relative overflow-hidden bg-[#0f0720]">
      
      {/* Background ambient light orbs */}
      <div className="ambient-orb w-[500px] h-[500px] bg-violet-600/5 -top-20 -left-20"></div>
      <div className="ambient-orb w-[500px] h-[500px] bg-fuchsia-600/5 bottom-10 right-10"></div>

      {/* Left Sidebar: Vehicle context dashboard */}
      <div className="w-full lg:w-[350px] p-6 bg-[#110825]/90 border-r border-violet-500/10 backdrop-blur-md z-10 flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Header Title */}
          <div>
            <h2 className="text-xl font-bold tracking-wide outfit-font text-white flex items-center gap-2">
              <span>🤖</span> VoltPath Agent
            </h2>
            <p className="text-xs text-violet-300/60 mt-1">Smart context-aware EV conversational service</p>
          </div>

          {/* Vehicle Stats Card */}
          <div className="bg-[#1b0e35]/60 border border-violet-500/15 p-4 rounded-xl space-y-3.5">
            <h3 className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Injected Context</h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-violet-300/60">Model:</span>
                <span className="font-semibold text-white">{vehicle?.evVehicleModel || 'MG 4 Luxury'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-violet-300/60">SoC / Battery:</span>
                <span className="font-semibold text-emerald-400">{vehicle?.batteryPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-violet-300/60">Est. Range:</span>
                <span className="font-semibold text-fuchsia-400">{vehicle?.rangeKm} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-violet-300/60">Location coords:</span>
                <span className="font-semibold text-white truncate max-w-[120px]">
                  {userCoord ? `${userCoord.latitude.toFixed(4)}, ${userCoord.longitude.toFixed(4)}` : 'Resolving'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-3">Quick inquiries</h3>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(p.text)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1b0e35]/35 border border-violet-500/10 text-left hover:border-violet-500/35 hover:bg-[#1b0e35]/65 active:scale-[0.98] transition-all cursor-pointer text-xs font-medium text-violet-200/90"
              >
                <span>{p.icon}</span>
                <span>{p.text}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-violet-500/10 flex items-center justify-between text-[10px] text-violet-300/50">
          <span>AI Engine: VoltNeural v1.2</span>
          <span>● Online</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full z-10 bg-[#0c051a]/30">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((m) => {
            const isAgent = m.sender === 'agent';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isAgent ? '' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-md ${
                  isAgent 
                    ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white shadow-violet-500/25' 
                    : 'bg-violet-900/60 text-fuchsia-300 border border-violet-500/25'
                }`}>
                  {isAgent ? 'VA' : 'U'}
                </div>

                {/* Message Bubble Container */}
                <div className="space-y-2">
                  <div className={`p-4 rounded-2xl text-sm border shadow-lg ${
                    isAgent
                      ? m.isError 
                        ? 'bg-red-950/20 border-red-500/30 text-red-300 shadow-red-500/5'
                        : 'bg-[#180a31]/80 border-violet-500/15 text-white shadow-violet-500/5'
                      : 'bg-violet-950/40 border-violet-500/30 text-violet-100 shadow-violet-500/10'
                  }`}>
                    {/* Message Body */}
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    
                    {/* LLM Engine metadata */}
                    {isAgent && m.provider && (
                      <div className="mt-2 text-[9px] text-violet-300/40 uppercase tracking-wider text-right font-medium">
                        Processed via {m.provider}
                      </div>
                    )}
                  </div>

                  {/* Interactive Enrichment Card (If station returned) */}
                  {isAgent && m.nearestStation && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/40 to-fuchsia-950/40 border border-violet-500/25 shadow-lg shadow-violet-500/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="block text-[10px] text-fuchsia-400 font-bold uppercase tracking-wider">Identified nearest station</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{m.nearestStation.name}</h4>
                        <span className="text-xs text-violet-300/70">📍 Distance: {m.nearestStation.distanceKm} km away</span>
                      </div>
                      
                      <button
                        onClick={() => router.push('/map')}
                        className="px-4 py-2 rounded-lg bg-violet-600 text-white font-bold text-xs hover:bg-violet-500 active:scale-[0.98] transition-all cursor-pointer shrink-0"
                      >
                        Reserve Slot Now
                      </button>
                    </div>
                  )}

                  {/* Message Time */}
                  <span className={`block text-[9px] text-violet-300/35 font-medium ${
                    isAgent ? 'text-left pl-1' : 'text-right pr-1'
                  }`}>
                    {m.time}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                VA
              </div>
              <div className="p-4 rounded-2xl bg-[#180a31]/80 border border-violet-500/15 text-white flex items-center gap-1.5 shadow-lg shadow-violet-500/5">
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Panel */}
        <div className="p-4 border-t border-violet-500/10 bg-[#110825]/60 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex gap-3 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask VoltAgent..."
              disabled={isTyping}
              className="flex-1 bg-[#1b0e35] border border-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-violet-300/40 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              Send Message
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
