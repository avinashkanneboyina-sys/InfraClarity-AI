import React, { useState } from 'react';
import { 
  Eye, 
  Cpu, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  RefreshCw, 
  Layers, 
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import { analyzeImage, resolveImageUrl, getReportUrl } from '../services/api';

export default function ImageAnalysis({ currentRecord, onRecordUpdated, setActiveTab }) {
  const [context, setContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const analysis = currentRecord?.analysis;
  const imageSrc = resolveImageUrl(currentRecord?.enhanced_url || currentRecord?.original_url);

  const handleRunAnalysis = async () => {
    if (!currentRecord?.image_id) {
      setErrorMessage("No inspection image loaded. Please upload or select an image in the Enhancement Studio first.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);
      const res = await analyzeImage(currentRecord.image_id, context);
      const updatedRecord = { ...currentRecord, analysis: res.analysis };
      if (onRecordUpdated) onRecordUpdated(updatedRecord);
    } catch (err) {
      setErrorMessage(err.message || "Vision-Language analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              AI Vision-Language Inspection Analysis
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Multimodal AI analysis of industrial infrastructure assets, visible components, optical degradation diagnosis, and inspection summary.
          </p>
        </div>

        {currentRecord?.image_id && (
          <div className="flex items-center space-x-3">
            <a
              href={getReportUrl(currentRecord.image_id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-750 text-slate-200 border border-navy-700 text-xs font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Executive Report</span>
            </a>
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">×</button>
        </div>
      )}

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image Card & Context Query Input (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Inspection Target Image Preview */}
          <div className="rounded-2xl glass-panel border border-navy-700/60 p-4 space-y-3 shadow-xl">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Inspection Target Frame</span>
              </span>
              {currentRecord && (
                <span className="text-slate-400">
                  {currentRecord.dimensions?.width} × {currentRecord.dimensions?.height} px
                </span>
              )}
            </div>

            <div className="bg-navy-950 rounded-xl p-2 min-h-[260px] flex items-center justify-center overflow-hidden">
              {imageSrc ? (
                <img 
                  src={imageSrc} 
                  alt="Inspection Target" 
                  className="max-h-[340px] w-auto object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 text-xs">
                  <p>No inspection frame selected.</p>
                  <button
                    onClick={() => setActiveTab('studio')}
                    className="mt-2 text-cyan-400 hover:underline"
                  >
                    Select an image in Studio →
                  </button>
                </div>
              )}
            </div>

            {currentRecord?.enhanced_url && (
              <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 p-2 rounded-lg flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyzing AI-Enhanced Image Frame ({currentRecord.model_used})</span>
              </div>
            )}
          </div>

          {/* Context & Query Prompt Card */}
          <div className="rounded-2xl glass-panel border border-navy-700/60 p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200 font-mono">
                INSPECTION DOMAIN CONTEXT (OPTIONAL)
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Provide optional field context (e.g. asset ID, utility sector, inspection conditions) to guide multimodal semantic priors:
            </p>

            <textarea
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. 500kV High-Voltage Lattice Tower inspection, overcast weather, drone gimbal inspection at 35m altitude."
              className="w-full bg-navy-900 border border-navy-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 outline-none font-mono"
            />

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !currentRecord?.image_id}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg ${
                isAnalyzing || !currentRecord?.image_id
                  ? 'bg-navy-800 text-slate-500 cursor-not-allowed border border-navy-700'
                  : 'bg-gradient-to-r from-electric-600 to-cyan-500 hover:from-electric-500 hover:to-cyan-400 text-white shadow-electric-500/25'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Multimodal Analysis...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>{analysis ? 'Re-Run Vision-Language Analysis' : 'Run Vision-Language Analysis'}</span>
                </>
              )}
            </button>
          </div>

          {/* Mandatory Engineering & Regulatory Notice */}
          <div className="rounded-xl border border-navy-700/80 bg-navy-900/60 p-4 space-y-2">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Inspection Standard Compliance Protocol</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This system assesses visual asset components and photographic quality limits. It strictly <strong>does not claim</strong> to certify structural integrity or substitute certified Non-Destructive Testing (NDT) / ultrasonic / thermographic sensor diagnostics.
            </p>
          </div>
        </div>

        {/* Right Column: VLM Semantic Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {!analysis ? (
            <div className="rounded-2xl glass-panel border border-dashed border-navy-700 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-navy-800 border border-navy-700 flex items-center justify-center mx-auto text-cyan-400">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">
                Awaiting Vision-Language Analysis
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Click <strong>"Run Vision-Language Analysis"</strong> to extract infrastructure component classifications, evaluate optical quality degradation, and generate an inspection report.
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* 1. Asset Classification Header Card */}
              <div className="p-6 rounded-2xl glass-panel border border-navy-700/80 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                      Identified Infrastructure Asset
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">
                      {analysis.asset_classification?.primary_asset}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-400">Confidence:</span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                      {(analysis.asset_classification?.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-navy-800">
                  <div>
                    <span className="text-slate-500 font-mono">Domain:</span>
                    <p className="text-slate-300 font-medium">{analysis.asset_classification?.domain}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono">Inspection Utility:</span>
                    <p className="text-slate-300 font-medium">{analysis.asset_classification?.typical_use}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono">Line Geometry:</span>
                    <p className="text-slate-300 font-medium">
                      {analysis.photometric_features?.num_lines} Contours Detected
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Visible Components Breakdown */}
              <div className="p-5 rounded-2xl glass-panel border border-navy-700/80 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 font-mono flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>IDENTIFIED STRUCTURAL & ELECTRICAL COMPONENTS</span>
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {analysis.visible_components?.length || 0} Components
                  </span>
                </div>

                <div className="divide-y divide-navy-800">
                  {analysis.visible_components?.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <h4 className="text-xs font-semibold text-slate-200">
                            {item.component}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 pl-3.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-navy-800 text-slate-300 border border-navy-700 whitespace-nowrap">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Image Quality Problems Diagnosis */}
              <div className="p-5 rounded-2xl glass-panel border border-navy-700/80 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 font-mono flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>PHOTOMETRIC & SENSOR QUALITY DEFICIENCIES</span>
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">
                    {analysis.image_quality_problems?.length || 0} Flaws Diagnosed
                  </span>
                </div>

                {analysis.image_quality_problems?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>High optical quality. No severe degradation identified.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysis.image_quality_problems?.map((prob, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-navy-900/60 border border-navy-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                            <span className="text-amber-400">⚠</span>
                            <span>{prob.issue}</span>
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            prob.severity === 'High' 
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' 
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {prob.severity} Severity
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {prob.impact}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-navy-800 text-[10px] font-mono text-slate-400">
                          <span>{prob.metrics}</span>
                          <span className="text-cyan-400 font-medium">
                            Remedy: {prob.recommended_technique}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Inspection-Oriented Visual Summary */}
              <div className="p-5 rounded-2xl glass-panel border border-navy-700/80 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 font-mono flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>INSPECTION-ORIENTED EXECUTIVE VISUAL SUMMARY</span>
                  </span>
                </div>

                <div className="bg-navy-950/70 rounded-xl p-4 border border-navy-800 text-xs text-slate-300 leading-relaxed space-y-3 font-sans">
                  <p>
                    {analysis.visual_summary?.executive_summary}
                  </p>
                  <p>
                    {analysis.visual_summary?.environmental_context}
                  </p>
                  <div className="pt-2 border-t border-navy-800 text-[11px] text-slate-400">
                    <strong className="text-slate-300 font-mono">Restoration Guidance: </strong>
                    {analysis.visual_summary?.restoration_readiness}
                  </div>
                </div>
              </div>

              {/* Regulatory Disclaimer Card */}
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex items-start space-x-3 text-slate-400 text-xs">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {analysis.regulatory_disclaimer}
                </p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
