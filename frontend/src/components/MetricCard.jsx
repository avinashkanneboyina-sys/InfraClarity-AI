import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';

export default function MetricCard({
  title,
  origVal,
  enhVal,
  unit = '',
  deltaPct,
  isHigherBetter = true,
  description
}) {
  const isPositive = deltaPct > 0;
  const isNeutral = deltaPct === 0 || deltaPct === null || deltaPct === undefined;
  
  // Good if (higher is better AND positive) OR (lower is better AND negative)
  const isGood = isHigherBetter ? isPositive : !isPositive;

  const getPillColor = () => {
    if (isNeutral) return 'bg-slate-700 text-slate-300';
    if (isGood) return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
  };

  return (
    <div className="p-4 rounded-xl glass-panel border border-navy-700/60 hover:border-cyan-500/40 transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300 font-sans group-hover:text-cyan-300 transition-colors">
          {title}
        </span>
        {deltaPct !== undefined && deltaPct !== null && (
          <span className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${getPillColor()}`}>
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}</span>
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className="text-xl font-bold font-mono text-white tracking-tight">
            {enhVal !== null && enhVal !== undefined ? enhVal : '—'}
          </span>
          {unit && <span className="ml-1 text-xs text-slate-400 font-mono">{unit}</span>}
        </div>

        <div className="text-right text-[11px] font-mono text-slate-400">
          <span className="text-slate-500">Orig: </span>
          <span>{origVal !== null && origVal !== undefined ? origVal : '—'}</span>
        </div>
      </div>

      {description && (
        <p className="mt-2 text-[11px] text-slate-400 leading-snug border-t border-navy-800/80 pt-2">
          {description}
        </p>
      )}
    </div>
  );
}
