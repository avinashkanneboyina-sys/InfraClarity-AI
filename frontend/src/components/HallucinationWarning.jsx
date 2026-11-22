import React from 'react';
import { AlertTriangle, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function HallucinationWarning({ riskData, disclaimer }) {
  const riskScore = riskData?.risk_score ?? 35;
  const riskLevel = riskData?.risk_level ?? "MODERATE (Texture Synthesis Active)";

  const getBadgeColor = () => {
    if (riskScore < 25) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    if (riskScore < 55) return "bg-amber-500/15 text-amber-300 border-amber-500/35";
    return "bg-rose-500/15 text-rose-300 border-rose-500/35";
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-navy-900/90 to-amber-500/5 p-4 shadow-lg backdrop-blur">
      <div className="flex items-start space-x-3.5">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0 mt-0.5 border border-amber-500/30">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-amber-200">
                Generative AI Restoration Advisory & Hallucination Guard
              </span>
              <span className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-medium">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Diffusion Active</span>
              </span>
            </div>

            <div className={`px-2.5 py-1 rounded text-xs font-mono font-medium border ${getBadgeColor()}`}>
              Hallucination Risk: {riskScore}% ({riskLevel})
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {disclaimer || 
              "Generative diffusion models reconstruct textures probabilistically and can hallucinate microscopic details (such as micro-cracks, surface pitting, or bolt contours). Enhanced output is certified strictly for visual assistance. Original raw imagery must remain the primary legal and engineering evidence for utility sign-offs."
            }
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400 font-mono">
            <span>• Novel Edge Discrepancy: {riskData?.novel_edge_fraction ? `${(riskData.novel_edge_fraction * 100).toFixed(1)}%` : 'Active Guard'}</span>
            <span>• Structural Edge Retention: Enforced</span>
            <span>• ISO 55000 / NDT Protocol: Visual Assist Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
