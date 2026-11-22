import React from 'react';
import { 
  Zap, 
  Layers, 
  Cpu, 
  Eye, 
  History, 
  Info, 
  Activity,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendStatus }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'studio', label: 'Enhancement Studio', icon: Layers },
    { id: 'analysis', label: 'AI Image Analysis', icon: Eye },
    { id: 'history', label: 'Processing History', icon: History },
    { id: 'about', label: 'About Project', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-navy-700/60 shadow-lg shadow-navy-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-500 to-cyan-450 p-0.5 shadow-md shadow-electric-500/20 group-hover:shadow-electric-500/40 transition-all">
            <div className="w-full h-full bg-navy-900 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-450 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Infra<span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-400 to-cyan-450">Clarity</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-electric-500/10 text-electric-300 border border-electric-500/20 rounded">
                AI 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Energy & Utilities Inspection Enhancer
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-electric-500/15 text-white border border-electric-500/30 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-450' : 'text-slate-400'}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Backend Connectivity Status */}
        <div className="hidden lg:flex items-center space-x-3 text-xs">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
            backendStatus?.status === 'healthy' 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' 
              : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              backendStatus?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <span className="font-mono">
              {backendStatus?.status === 'healthy' 
                ? `FastAPI PyTorch (${backendStatus.runtime.device.toUpperCase()})` 
                : 'Connecting API...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
