import React, { useState } from 'react';
import { 
  Upload,
  Sparkles,
  Layers,
  Sliders,
  Download,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Cpu,
  Eye,
  Columns,
  Maximize2,
  HelpCircle,
  Zap,
  ShieldCheck,
  SplitSquareVertical
} from 'lucide-react';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import MetricCard from '../components/MetricCard';
import HallucinationWarning from '../components/HallucinationWarning';
import { 
  uploadImage,
  enhanceImage,
  resolveImageUrl,
  getDownloadUrl,
  getReportUrl,
  loadSample,
  fetchHistory,
  compareImages
} from '../services/api';

const RESTORATION_OPS = [
  {
    id: 'denoise',
    name: 'Image Denoising',
    category: 'Conventional / Deep CNN',
    model: 'Fast Non-Local Means & DnCNN Residuals',
    badge: 'Certified Fidelity',
    isGenerative: false,
    description: 'Suppresses thermal sensor noise, dusk grain, and atmospheric scattering on conductor lines and steel lattices.',
    defaultParams: { strength: 1.0, method: 'fast_nlm' }
  },
  {
    id: 'deblur',
    name: 'AI Deblurring',
    category: 'Deconvolution',
    model: 'Richardson-Lucy PSF Deconvolution & High-Pass Unsharp',
    badge: 'Zero Hallucination',
    isGenerative: false,
    description: 'Eliminates drone motion blur, gimbal shake, and optical defocus on high-voltage transmission assets.',
    defaultParams: { strength: 1.0, method: 'richardson_lu', iterations: 10 }
  },
  {
    id: 'low_light',
    name: 'Low-Light Illumination',
    category: 'Curve Mapping',
    model: 'Zero-DCE Dynamic Curves & Multi-Scale Retinex (MSRCR)',
    badge: 'Photometric',
    isGenerative: false,
    description: 'Expands dark shadows under pipeline casings, transformer flanges, and overcast inspections without clipping.',
    defaultParams: { boost: 1.3, method: 'zero_dce' }
  },
  {
    id: 'contrast',
    name: 'Contrast Enhancement',
    category: 'Luminance Dynamic Range',
    model: 'CLAHE on CIE L*a*b* & Sigmoid S-Curve',
    badge: 'Color-Preserving',
    isGenerative: false,
    description: 'Accentuates micro-corrosion, surface spalling, bolt threads, and weld seams by adaptive histogram equalization.',
    defaultParams: { clip_limit: 2.5, method: 'clahe_lab' }
  },
  {
    id: 'super_resolution',
    name: 'AI Super-Resolution',
    category: 'Deep Neural Network',
    model: 'Real-ESRGAN (RRDBNet x2 / x4 Deep Residual)',
    badge: 'Deep Learning',
    isGenerative: false,
    description: 'Upscales sub-Nyquist drone telephoto captures by 200% or 400% using learned structural edge priors.',
    defaultParams: { scale: 2, use_neural: true }
  },
  {
    id: 'diffusion',
    name: 'Generative Diffusion',
    category: 'Generative AI',
    model: 'Iterative Reverse Diffusion UNet & Anisotropic Guidance',
    badge: 'Generative AI',
    isGenerative: true,
    description: 'Stochastic diffusion synthesis for severe weather degradation. Generates fine texture with automated Hallucination Risk scoring.',
    defaultParams: { strength: 0.5, steps: 6 }
  }
];

export default function EnhancementStudio({
  currentRecord,
  setCurrentRecord,
  samples,
  onRecordUpdated,
  setActiveTab,
  setHistory
}) {
  const [selectedOp, setSelectedOp] = useState('super_resolution');
  const [params, setParams] = useState({ scale: 2, use_neural: true });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side' | 'enhanced'
  const [referenceFile, setReferenceFile] = useState(null);
  const [referenceFileName, setReferenceFileName] = useState('');

  const currentOpConfig = RESTORATION_OPS.find(op => op.id === selectedOp) || RESTORATION_OPS[0];

  const handleSelectOp = (opId) => {
    setSelectedOp(opId);
    const opConfig = RESTORATION_OPS.find(op => op.id === opId);
    if (opConfig) {
      setParams({ ...opConfig.defaultParams });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Invalid file format. Please upload JPG, JPEG, or PNG images.");
      return;
    }

    // Validate size (< 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File exceeds 25 MB limit. Please select a smaller inspection capture.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const record = await uploadImage(file, referenceFile);
      setCurrentRecord(record);
      if (onRecordUpdated) onRecordUpdated(record);
      setSuccessMessage(`Inspection image "${file.name}" uploaded successfully (${record.dimensions?.width ?? "?"}×${record.dimensions?.height ?? "?"} px).`);
    } catch (err) {
      setErrorMessage(err.message || "Failed to upload inspection image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReferenceUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFile(file);
      setReferenceFileName(file.name);
      setSuccessMessage(`Ground-truth reference "${file.name}" attached. Real PSNR/SSIM will be computed upon enhancement.`);
    }
  };

  const handleSelectSample = async (sampleId) => {
    try {
      setIsUploading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const record = await loadSample(sampleId);
      setCurrentRecord(record);
      if (onRecordUpdated) onRecordUpdated(record);
      setSuccessMessage(`Sample "${record.original_filename || record.filename || sampleId}" loaded. Ready for enhancement.`);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load sample image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunEnhancement = async () => {
    if (!currentRecord?.image_id) {
      setErrorMessage("Please upload an inspection image or select a sample first.");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updated = await enhanceImage(
        currentRecord.image_id,
        selectedOp,
        params,
        referenceFile
      );

      // Update the current record and notify parent
      setCurrentRecord(updated);
      if (onRecordUpdated) onRecordUpdated(updated);

      // ---- NEW: Refresh processing history ----
      try {
        const freshHistory = await fetchHistory();
        if (setHistory) setHistory(freshHistory);
      } catch (e) {
        console.warn('Failed to refresh history after enhancement:', e);
      }

      // ---- NEW: Retrieve comparison data (backend /compare) ----
      try {
        const cmp = await compareImages(updated.image_id);
        // Store comparison in a local state (if component wants to use it later)
        // For now we just keep it on the record for downstream pages
        setCurrentRecord((prev) => ({ ...prev, comparison: cmp }));
      } catch (e) {
        console.warn('Comparison fetch failed:', e);
      }

    } catch (e) {
      setErrorMessage(e.message || "Enhancement execution failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const metrics = currentRecord?.metrics;
  const originalDims = metrics?.dimensions?.original || currentRecord?.dimensions || {};
  const enhancedDims = metrics?.dimensions?.enhanced || currentRecord?.enhanced_dimensions || {};

  return (
    <div className="space-y-8">
      {/* Studio Header & Quick Samples */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              AI Enhancement Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Apply deep learning super-resolution, deblurring, denoising, and generative restoration to utility inspection imagery.
          </p>
        </div>

        {/* Quick Sample Selector */}
        {samples?.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 hidden xl:inline">Load Sample:</span>
            <div className="flex flex-wrap gap-1.5">
              {samples.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSample(s.id)}
                  className="px-2.5 py-1 text-xs rounded-md bg-navy-850 hover:bg-navy-750 text-slate-300 hover:text-white border border-navy-700 transition-colors font-mono"
                  title={s.description}
                >
                  {s.id.split('_')[0]}
                </button>
              ))}
            </div>
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
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">×</button>
        </div>
      )}

      {/* Main Studio Grid: Left Controls (1/3) & Right Viewport (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls & Parameters */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Upload Card */}
          <div className="p-5 rounded-2xl glass-panel border border-navy-700/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 font-mono flex items-center space-x-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>1. INPUT INSPECTION IMAGE</span>
              </span>
              {currentRecord && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready
                </span>
              )}
            </div>
            {/* Drag & Drop Upload Input */}
            <label className="relative border-2 border-dashed border-navy-700 hover:border-cyan-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-navy-900/40 hover:bg-navy-900/80 transition-all group">
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/jpg" 
                onChange={handleFileUpload}
                disabled={isUploading || isProcessing}
                className="hidden" 
              />
              <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 group-hover:scale-105 transition-all mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-200 text-center">Click to browse or drag & drop inspection photo</p>
              <p className="text-[11px] text-slate-400 mt-1">JPG, JPEG, PNG • Up to 25 MB</p>
              {isUploading && (
                <div className="absolute inset-0 bg-navy-950/80 backdrop-blur rounded-xl flex items-center justify-center space-x-2 text-xs text-cyan-300">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading inspection capture...</span>
                </div>
              )}
            </label>

            {/* Optional Ground-Truth Reference Upload */}
            <div className="pt-2 border-t border-navy-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center space-x-1">
                  <span>Ground-Truth Reference</span>
                  <span className="text-[10px] text-slate-400">(Optional for PSNR/SSIM)</span>
                </span>
                {referenceFileName && (
                  <span className="text-[11px] font-mono text-cyan-400 truncate max-w-[140px]">
                    {referenceFileName}
                  </span>
                )}
              </div>
              <label className="mt-2 block text-center py-2 px-3 rounded-lg bg-navy-800/60 hover:bg-navy-800 border border-navy-700 text-[11px] text-slate-300 hover:text-white cursor-pointer transition-colors">
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg" 
                  onChange={handleReferenceUpload}
                  className="hidden" 
                />
                {referenceFileName ? `Replace: ${referenceFileName}` : "+ Attach Clean Reference Photo"}
              </label>
            </div>
          </div>

          {/* 2. Restoration Operation Selector */}
          <div className="p-5 rounded-2xl glass-panel border border-navy-700/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 font-mono flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>2. SELECT ENHANCEMENT TECHNIQUE</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {RESTORATION_OPS.length} Techniques
              </span>
            </div>
            <div className="space-y-2">
              {RESTORATION_OPS.map((op) => {
                const isSelected = selectedOp === op.id;
                return (
                  <div
                    key={op.id}
                    onClick={() => handleSelectOp(op.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-electric-500/15 border-cyan-400/60 shadow-md shadow-cyan-500/10' : 'bg-navy-900/40 border-navy-800 hover:border-navy-700 hover:bg-navy-900/80'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>${op.name}</span>
                        {op.isGenerative && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Generative AI
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isSelected ? 'bg-cyan-400/20 text-cyan-300' : 'bg-navy-800 text-slate-400'}`}>${op.badge}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">${op.description}</p>
                    <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                      <Cpu className="w-3 h-3 text-cyan-400/70" />
                      <span className="truncate">${op.model}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Operational Hyperparameters */}
          <div className="p-5 rounded-2xl glass-panel border border-navy-700/60 shadow-xl space-y-4">
            <span className="text-xs font-semibold text-slate-200 font-mono flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>3. TECHNIQUE HYPERPARAMETERS</span>
            </span>
            {/* Denoising Params */}
            {selectedOp === 'denoise' && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>Filter Strength (h)</span>
                    <span className="font-mono text-cyan-400">{params.strength || 1.0}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.5" 
                    step="0.1"
                    value={params.strength || 1.0}
                    onChange={(e) => setParams({ ...params, strength: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 bg-navy-700 rounded h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>Preserve wire grain (0.5)</span>
                    <span>Heavy dusk noise (2.5)</span>
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5">Algorithmic Method</label>
                  <select 
                    value={params.method || 'fast_nlm'}
                    onChange={(e) => setParams({ ...params, method: e.target.value })}
                    className="w-full bg-navy-850 border border-navy-700 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-cyan-400 outline-none"
                  >
                    <option value="fast_nlm">Fast Non-Local Means (Dual Luma/Chroma Filtering)</option>
                    <option value="dncnn">DnCNN 17-Layer Residual Neural Network</option>
                  </select>
                </div>
              </div>
            )}
            {/* Deblurring Params */}
            {selectedOp === 'deblur' && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>Richardson-Lucy Iterations</span>
                    <span className="font-mono text-cyan-400">{params.iterations || 10}</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="25" 
                    step="1"
                    value={params.iterations || 10}
                    onChange={(e) => setParams({ ...params, iterations: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400 bg-navy-700 rounded h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>Fast (3 iters)</span>
                    <span>Deep convergence (25 iters)</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>High-Pass Sharpness Strength</span>
                    <span className="font-mono text-cyan-400">{params.strength || 1.0}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1"
                    value={params.strength || 1.0}
                    onChange={(e) => setParams({ ...params, strength: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 bg-navy-700 rounded h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            )}
            {/* Low-Light Params */}
            {selectedOp === 'low_light' && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>Exposure Curve Multiplier</span>
                    <span className="font-mono text-cyan-400">×{params.boost || 1.3}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="2.5" 
                    step="0.1"
                    value={params.boost || 1.3}
                    onChange={(e) => setParams({ ...params, boost: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 bg-navy-700 rounded h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>Subtle shade lift (1.0)</span>
                    <span>Deep twilight / underbelly (2.5)</span>
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5">Illumination Algorithm</label>
                  <select 
                    value={params.method || 'zero_dce'}
                    onChange={(e) => setParams({ ...params, method: e.target.value })}
                    className="w-full bg-navy-850 border border-navy-700 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-cyan-400 outline-none"
                  >
                    <option value="zero_dce">Zero-DCE (Deep Curve Estimation Curves)</option>
                    <option value="retinex">Multi-Scale Retinex with Color Restoration (MSRCR)</option>
                  </select>
                </div>
              </div>
            )}
            {/* Contrast Params */}
            {selectedOp === 'contrast' && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>CLAHE Clip Limit</span>
                    <span className="font-mono text-cyan-400">{params.clip_limit || 2.5}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="6.0" 
                    step="0.5"
                    value={params.clip_limit || 2.5}
                    onChange={(e) => setParams({ ...params, clip_limit: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 bg-navy-700 rounded h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>Natural (1.0)</span>
                    <span>High Inspection Defect Contrast (6.0)</span>
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5">Color Space Transformation</label>
                  <select 
                    value={params.method || 'clahe_lab'}
                    onChange={(e) => setParams({ ...params, method: e.target.value })}
                    className="w-full bg-navy-850 border border-navy-700 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-cyan-400 outline-none"
                  >
                    <option value="clahe_lab">CIE L*a*b* Luminance Equalization (Preserves Rust Hue)</option>
                    <option value="sigmoid">Sigmoidal High-Contrast S-Curve</option>
                  </select>
                </div>
              </div>
            )}
            {/* Super-Resolution Params */}
            {selectedOp === 'super_resolution' && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-2">
                    <span>Upscaling Factor</span>
                    <span className="font-mono text-cyan-400 font-semibold">{params.scale || 2}× Scale</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setParams({ ...params, scale: 2 })}
                      className={`py-2 px-3 rounded-lg font-mono text-xs border transition-all ${params.scale === 2 ? 'bg-electric-500/20 border-cyan-400 text-white font-semibold' : 'bg-navy-850 border-navy-700 text-slate-300 hover:bg-navy-800'}`}
                    >
                      2× Super-Resolution
                    </button>
                    <button 
                      type="button"
                      onClick={() => setParams({ ...params, scale: 4 })}
                      className={`py-2 px-3 rounded-lg font-mono text-xs border transition-all ${params.scale === 4 ? 'bg-electric-500/20 border-cyan-400 text-white font-semibold' : 'bg-navy-850 border-navy-700 text-slate-300 hover:bg-navy-800'}`}
                    >
                      4× Ultra-Resolution
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <input 
                    type="checkbox"
                    id="use_neural"
                    checked={params.use_neural ?? true}
                    onChange={(e) => setParams({ ...params, use_neural: e.target.checked })}
                    className="accent-cyan-400 rounded cursor-pointer"
                  />
                  <label htmlFor="use_neural" className="text-slate-300 cursor-pointer">
                    Enable Real-ESRGAN Residual-in-Residual Backpropagation
                  </label>
                </div>
              </div>
            )}
            {/* Generative Diffusion Params */}
            {selectedOp === 'diffusion' && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>Reverse Diffusion Guidance Steps</span>
                    <span className="font-mono text-amber-400 font-semibold">{params.steps || 6} steps</span>
                  </div>
                  <input 
                    type="range"
                    min="3"
                    max="15"
                    step="1"
                    value={params.steps || 6}
                    onChange={(e) => setParams({ ...params, steps: parseInt(e.target.value) })}
                    className="w-full accent-amber-400 bg-navy-700 rounded h-1.5 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>Generative Denoising Prior Strength</span>
                    <span className="font-mono text-amber-400 font-semibold">{params.strength || 0.5}</span>
                  </div>
                  <input 
                    type="range"
                    min="0.2"
                    max="0.8"
                    step="0.05"
                    value={params.strength || 0.5}
                    onChange={(e) => setParams({ ...params, strength: parseFloat(e.target.value) })}
                    className="w-full accent-amber-400 bg-navy-700 rounded h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>Conservative (Low Hallucination)</span>
                    <span>High Synthesis</span>
                  </div>
                </div>
              </div>
            )}
            {/* Execute Enhancement Button */}
            <button
              onClick={handleRunEnhancement}
              disabled={isProcessing || !currentRecord?.image_id}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${isProcessing || !currentRecord?.image_id ? 'bg-navy-800 text-slate-500 cursor-not-allowed border border-navy-700' : currentOpConfig.isGenerative ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-900/30' : 'bg-gradient-to-r from-electric-600 to-cyan-500 hover:from-electric-500 hover:to-cyan-400 text-white shadow-electric-500/25'}`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing {currentOpConfig.name}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Restoration</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Viewport & Inspection Metrics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Generative AI Hallucination Warning Banner */}
          {(currentOpConfig.isGenerative || currentRecord?.is_generative_ai) && (
            <HallucinationWarning 
              riskData={currentRecord?.operation_details?.hallucination_risk}
              disclaimer={currentRecord?.operation_details?.disclaimer}
            />
          )}
          {/* View Mode Bar */}
          <div className="flex items-center justify-between bg-navy-900/80 p-2 rounded-xl border border-navy-800">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('slider')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${viewMode === 'slider' ? 'bg-electric-500/20 text-cyan-300 border border-electric-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Split Slider</span>
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${viewMode === 'side-by-side' ? 'bg-electric-500/20 text-cyan-300 border border-electric-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
            </div>
            {/* Actions: Download Enhanced & Report */}
            {currentRecord?.enhanced_url && (
              <div className="flex items-center space-x-2">
                <a 
                  href={getDownloadUrl(currentRecord.image_id)}
                  download
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-mono transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
                <a 
                  href={getReportUrl(currentRecord.image_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-800 text-slate-300 hover:text-white hover:bg-navy-750 border border-navy-700 text-xs font-mono transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Summary</span>
                </a>
              </div>
            )}
          </div>

          {/* Interactive Inspection Viewport */}
          {viewMode === 'slider' ? (
            <BeforeAfterSlider
              originalUrl={currentRecord?.original_url}
              enhancedUrl={currentRecord?.enhanced_url}
              originalDims={originalDims}
              enhancedDims={enhancedDims}
              processingTimeMs={currentRecord?.processing_time_ms}
              operationName={currentRecord?.operation || selectedOp}
              modelUsed={currentRecord?.model_used}
              isGenerative={currentRecord?.is_generative_ai}
            />
          ) : (
            /* Side-by-Side View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl glass-panel border border-navy-700/60 p-3 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span className="text-slate-300 font-semibold">Original Degraded</span>
                  <span>{originalDims?.width} × {originalDims?.height} px</span>
                </div>
                <div className="bg-navy-950 rounded-lg p-2 min-h-[320px] flex items-center justify-center">
                  {currentRecord?.original_url ? (
                    <img 
                      src={resolveImageUrl(currentRecord.original_url)} 
                      alt="Original" 
                      className="max-h-[320px] w-auto object-contain rounded"
                    />
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">Upload an inspection image to preview</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl glass-panel border border-navy-700/60 p-3 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono text-cyan-300">
                  <span className="font-semibold">Enhanced Result</span>
                  <span>{enhancedDims?.width} × {enhancedDims?.height} px</span>
                </div>
                <div className="bg-navy-950 rounded-lg p-2 min-h-[320px] flex items-center justify-center">
                  {currentRecord?.enhanced_url ? (
                    <img 
                      src={resolveImageUrl(currentRecord.enhanced_url)} 
                      alt="Enhanced" 
                      className="max-h-[320px] w-auto object-contain rounded shadow"
                    />
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">Run restoration to view output</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Image Quality Metrics Dashboard */}
          <div className="p-5 rounded-2xl glass-panel border border-navy-700/60 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200 font-mono">
                  QUANTITATIVE INSPECTION CLARITY METRICS
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Calculated in real-time
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetricCard
                title="Laplacian Sharpness"
                origVal={metrics?.sharpness_variance?.original}
                enhVal={metrics?.sharpness_variance?.enhanced}
                deltaPct={metrics?.sharpness_variance?.delta_pct}
                isHigherBetter={true}
                description="High-frequency edge response across conductors, welds, and structural lattice joints."
              />

              <MetricCard
                title="RMS Contrast Score"
                origVal={metrics?.contrast_rms?.original}
                enhVal={metrics?.contrast_rms?.enhanced}
                deltaPct={metrics?.contrast_rms?.delta_pct}
                isHigherBetter={true}
                description="Standard deviation of luminance dynamic range."
              />

              <MetricCard
                title="Shannon Entropy"
                origVal={metrics?.entropy?.original}
                enhVal={metrics?.entropy?.enhanced}
                deltaPct={metrics?.entropy?.delta_pct}
                unit="bits"
                isHigherBetter={true}
                description="Information density across pixel intensity distributions."
              />

              <MetricCard
                title="Mean Luminance"
                origVal={metrics?.brightness_mean?.original}
                enhVal={metrics?.brightness_mean?.enhanced}
                deltaPct={metrics?.brightness_mean?.delta_pct}
                isHigherBetter={true}
                description="Average pixel intensity across full sensor capture."
              />

              <MetricCard
                title="Signal-to-Noise (SNR)"
                origVal={metrics?.snr_db?.original}
                enhVal={metrics?.snr_db?.enhanced}
                deltaPct={metrics?.snr_db?.delta_pct}
                unit="dB"
                isHigherBetter={true}
                description="Ratio of signal power to noise background."
              />

              {/* Ground Truth PSNR & SSIM Card */}
              <div className="p-4 rounded-xl glass-panel border border-navy-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300 font-sans">
                    PSNR / SSIM Fidelity
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${metrics?.reference_based?.ground_truth_available ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-navy-800 text-slate-400'}`}
                  >
                    {metrics?.reference_based?.ground_truth_available ? 'Real GT Reference' : 'No Reference GT'}
                  </span>
                </div>

                <div className="my-2">
                  {metrics?.reference_based?.ground_truth_available ? (
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-sm">
                        <span className="text-slate-400">PSNR:</span>
                        <span className="text-cyan-400 font-bold">{metrics.reference_based.psnr_db} dB</span>
                      </div>
                      <div className="flex justify-between font-mono text-sm">
                        <span className="text-slate-400">SSIM:</span>
                        <span className="text-emerald-400 font-bold">{metrics.reference_based.ssim}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-slate-400 leading-snug">
                      N/A (Reference-Free inspection)
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-tight border-t border-navy-800/80 pt-1.5">
                  {metrics?.reference_based?.ground_truth_available 
                    ? "Evaluated strictly against verified ground-truth reference."
                    : "Per rigorous engineering standards, PSNR & SSIM are omitted without clean reference."}
                </p>
              </div>
            </div>

            {/* Quick Link to AI Image Analysis */}
            <div className="mt-4 p-4 rounded-xl bg-navy-900/60 border border-navy-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">
                  Ready for Vision-Language Semantic Inspection?
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Query the Vision-Language Model to identify utility components, image quality flaws, and generate an inspection report.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('analysis')}
                className="px-3.5 py-2 rounded-lg bg-electric-500/15 hover:bg-electric-500/25 text-cyan-300 text-xs font-medium border border-electric-500/30 transition-colors whitespace-nowrap"
              >
                Open VLM Analysis →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
