import React from 'react';
import { ShieldAlert, Cpu, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-navy-800/80 bg-navy-950/80 mt-16 py-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <span className="font-semibold text-slate-200 text-sm">InfraClarity AI</span>
            <p className="mt-1 text-slate-400 leading-relaxed">
              Industrial-grade Generative AI image restoration platform for high-voltage transmission towers, 
              conductors, pipelines, and utility infrastructure.
            </p>
          </div>

          <div className="flex items-center space-x-2 p-3 rounded-lg bg-navy-900/60 border border-navy-700/50">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-[11px] text-slate-300 leading-tight">
              <strong className="text-amber-300">Engineering Protocol:</strong> Enhanced visual imagery serves as diagnostic assistance. 
              Original raw imagery remains the legal baseline for structural sign-off.
            </p>
          </div>

          <div className="text-right md:text-right flex flex-col md:items-end space-y-1">
            <span className="text-slate-300 font-mono">Academic Demonstration System</span>
            <p className="text-[11px] text-slate-500">
              PyTorch • Real-ESRGAN • Zero-DCE • DnCNN • Richardson-Lucy • OpenCV • FastAPI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
