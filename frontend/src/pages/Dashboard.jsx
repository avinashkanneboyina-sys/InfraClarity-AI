import React from 'react';
import { 
  Activity, 
  Layers, 
  Sparkles, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Image as ImageIcon,
  Zap,
  Shield,
  Sliders,
  Maximize2
} from 'lucide-react';
import { resolveImageUrl } from '../services/api';

export default function Dashboard({ 
  historyData, 
  samples, 
  onSelectSample, 
  onSelectRecord, 
  setActiveTab 
}) {
  const stats = historyData?.stats || {
    total_processed: 0,
    successful_enhancements: 0,
    generative_enhancements: 0,
    conventional_enhancements: 0,
  };

  const recentRecords = historyData?.records?.slice(0, 4) || [];

  const techniques = [
    {
      id: 'denoise',
      title: 'Image Denoising',
      category: 'Conventional / Deep CNN',
      model: 'DnCNN 17-Layer ResNet & Fast Non-Local Means',
      desc: 'Removes dusk sensor grain, high-ISO thermal noise, and weather scattering while preserving conductor wires and bolts.',
      badge: 'Certified Fidelity',
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300'
    },
    {
      id: 'deblur',
      title: 'AI Deblurring',
      category: 'Deconvolution',
      model: 'Richardson-Lucy PSF Deconvolution & High-Pass Unsharp',
      desc: 'Compensates for drone propeller vibration, optical motion blur, and atmospheric air turbulence.',
      badge: 'Zero Hallucination',
      color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-300'
    },
    {
      id: 'low_light',
      title: 'Low-Light Illumination',
      category: 'Adaptive Curve Mapping',
      model: 'Zero-DCE Dynamic Curves & Multi-Scale Retinex (MSRCR)',
      desc: 'Illuminates shaded pipe underbellies and lattice steel shadows without blowing out daytime skies.',
      badge: 'Photometric',
      color: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-300'
    },
    {
      id: 'contrast',
      title: 'Contrast Enhancement',
      category: 'Luminance Dynamic Range',
      model: 'CLAHE on CIE L*a*b* & Sigmoid S-Curve',
      desc: 'Expands local dynamic range to reveal subtle rust blooms, micro-cracks, and fastener threads.',
      badge: 'Color-Preserving',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300'
    },
    {
      id: 'super_resolution',
      title: 'AI Super-Resolution',
      category: 'Deep Neural Network',
      model: 'Real-ESRGAN (RRDBNet x2 / x4 Deep Residual-in-Residual)',
      desc: 'Reconstructs sub-Nyquist digital zoom captures to 200% and 400% high-fidelity resolution.',
      badge: 'Deep Learning',
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-300'
    },
    {
      id: 'diffusion',
      title: 'Generative Diffusion',
      category: 'Generative AI',
      model: 'Iterative Reverse Diffusion UNet + Anisotropic Guidance',
      desc: 'Generative synthesis for severe weather degradation with automated Hallucination Risk scoring.',
      badge: 'Generative AI',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300'
    }
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-panel-glow border border-navy-700/80 p-8 sm:p-12 tech-grid-bg">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-cyan-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Energy & Utilities Infrastructure AI Inspection Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Clearer Infrastructure. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-400 via-cyan-400 to-emerald-400">
              Confident Utility Decisions.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Engineered specifically for transmission towers, high-voltage lines, oil & gas pipelines, and solar farms. 
            InfraClarity AI combines certified classical computer vision with state-of-the-art Real-ESRGAN super-resolution 
            and Generative Diffusion restoration, backed by strict anti-hallucination protocols.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('studio')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-500 to-cyan-500 text-white font-medium text-sm hover:from-electric-400 hover:to-cyan-400 shadow-lg shadow-electric-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Open Enhancement Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-navy-800/80 hover:bg-navy-700 text-slate-200 border border-navy-600/80 text-sm font-medium transition-all"
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Engineering Architecture</span>
            </button>
          </div>
        </div>

        {/* Ambient background decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-electric-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-2xl glass-panel border border-navy-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL PROCESSED</span>
            <ImageIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-white">
            {stats.total_processed}
          </div>
          <p className="mt-1 text-xs text-slate-400">Inspection captures registered</p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-navy-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SUCCESSFUL RESTORATIONS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-emerald-400">
            {stats.successful_enhancements}
          </div>
          <p className="mt-1 text-xs text-slate-400">Restoration operations executed</p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-navy-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>GENERATIVE AI RESTORATIONS</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-amber-300">
            {stats.generative_enhancements}
          </div>
          <p className="mt-1 text-xs text-slate-400">Diffusion with Hallucination Guard</p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-navy-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>CONVENTIONAL & NEURAL</span>
            <Cpu className="w-4 h-4 text-electric-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-cyan-300">
            {stats.conventional_enhancements}
          </div>
          <p className="mt-1 text-xs text-slate-400">Real-ESRGAN, DnCNN, Zero-DCE</p>
        </div>
      </div>

      {/* Built-in Sample Datasets for 1-Click Demonstration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Preloaded Utility Inspection Sample Datasets
            </h2>
            <p className="text-xs text-slate-400">
              Click any sample to load it directly into the Enhancement Studio with simulated real-world degradation.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2.5 py-1 rounded">
            5 Industrial Assets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {samples.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="group cursor-pointer rounded-xl overflow-hidden glass-panel border border-navy-700/60 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10 transition-all transform hover:-translate-y-1 flex flex-col"
            >
              <div className="h-32 bg-navy-900 overflow-hidden relative">
                <img 
                  src={resolveImageUrl(sample.url)} 
                  alt={sample.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-navy-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-navy-700">
                  {sample.recommended_technique}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 line-clamp-1">
                    {sample.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {sample.degradation}
                  </p>
                </div>

                <div className="pt-2 border-t border-navy-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-cyan-400 font-mono font-medium">Test in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Enhancement Techniques Gallery */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Available AI Restoration Techniques
          </h2>
          <p className="text-xs text-slate-400">
            A comprehensive suite of mathematically certified conventional CV and Generative AI algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {techniques.map((tech) => (
            <div
              key={tech.id}
              className={`p-5 rounded-2xl glass-panel border transition-all ${tech.color}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                    {tech.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {tech.title}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-navy-900/80 border border-current">
                  {tech.badge}
                </span>
              </div>

              <div className="mt-2 text-xs font-mono opacity-90 text-slate-200">
                {tech.model}
              </div>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {tech.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Processing History Teaser */}
      {recentRecords.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Recent Inspection Enhancements
            </h2>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>View Full History ({historyData?.records?.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentRecords.map((rec) => (
              <div
                key={rec.image_id}
                onClick={() => onSelectRecord(rec)}
                className="group cursor-pointer rounded-xl glass-panel border border-navy-700/60 hover:border-cyan-400/50 p-3 flex items-center space-x-3.5 transition-all"
              >
                <div className="w-14 h-14 rounded-lg bg-navy-900 overflow-hidden flex-shrink-0 border border-navy-700">
                  <img 
                    src={resolveImageUrl(rec.enhanced_url || rec.upload_url)} 
                    alt={rec.original_filename}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300">
                    {rec.original_filename}
                  </p>
                  <p className="text-[11px] font-mono text-cyan-400">
                    {rec.last_operation ? rec.last_operation.toUpperCase() : 'UPLOADED'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {rec.processing_time_ms ? `${rec.processing_time_ms.toFixed(0)} ms` : 'Ready'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
