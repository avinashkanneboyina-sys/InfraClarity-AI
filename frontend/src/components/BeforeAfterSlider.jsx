import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  MoveHorizontal, 
  Clock, 
  Sparkles, 
  Maximize, 
  ZoomIn, 
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { resolveImageUrl } from '../services/api';

export default function BeforeAfterSlider({
  originalUrl,
  enhancedUrl,
  originalDims,
  enhancedDims,
  processingTimeMs,
  operationName,
  modelUsed,
  isGenerative
}) {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef(null);

  const origSrc = resolveImageUrl(originalUrl);
  const enhSrc = resolveImageUrl(enhancedUrl);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  useEffect(() => {
    const onMouseUp = () => setIsDragging(false);
    const onMouseMove = (e) => {
      if (isDragging) handleMove(e.clientX);
    };

    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isDragging, handleMove]);

  if (!origSrc) {
    return (
      <div className="h-96 rounded-2xl border border-dashed border-navy-700 flex items-center justify-center bg-navy-900/30 text-slate-400">
        No inspection image loaded.
      </div>
    );
  }

  // If not yet enhanced, show original alone with preview badge
  if (!enhSrc) {
    return (
      <div className="relative rounded-2xl overflow-hidden glass-panel border border-navy-700/60 shadow-xl bg-navy-950/80">
        <div className="p-3 bg-navy-900/70 border-b border-navy-800 flex justify-between items-center text-xs">
          <span className="font-mono text-cyan-400 font-medium">Input Inspection Preview</span>
          {originalDims?.width && originalDims?.height ? (
            <span className="text-slate-400 font-mono">
              {originalDims?.width} × {originalDims?.height} px
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-center p-4 max-h-[600px] overflow-hidden">
          <img 
            src={origSrc} 
            alt="Original" 
            className="max-h-[540px] w-auto object-contain rounded-lg shadow-md"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden glass-panel border border-navy-700/60 shadow-2xl transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 bg-navy-950/95 flex flex-col' : ''
    }`}>
      {/* Top Metadata Header */}
      <div className="p-3 bg-navy-900/80 border-b border-navy-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <span className="px-2.5 py-1 rounded-md bg-navy-800 text-slate-200 font-mono font-medium border border-navy-700">
            {operationName ? operationName.toUpperCase() : 'RESTORED'}
          </span>
          {isGenerative && (
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 font-medium border border-amber-500/25">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generative AI</span>
            </span>
          )}
          <span className="text-slate-400 truncate max-w-xs font-mono hidden sm:inline">
            {modelUsed}
          </span>
        </div>

        {/* Processing Timing & Dimensions */}
        <div className="flex items-center space-x-4">
          {processingTimeMs > 0 && (
            <div className="flex items-center space-x-1.5 text-slate-300 font-mono bg-navy-800/70 px-2.5 py-1 rounded border border-navy-700/60">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{processingTimeMs.toFixed(1)} ms</span>
            </div>
          )}

          <div className="hidden sm:flex items-center space-x-2 text-slate-400 font-mono">
            <span>Orig: {originalDims?.width}×{originalDims?.height}</span>
            <span className="text-cyan-400">→</span>
            <span className="text-emerald-300 font-medium">Enh: {enhancedDims?.width}×{enhancedDims?.height}</span>
          </div>

          {/* Zoom & Fullscreen Controls */}
          <div className="flex items-center space-x-1 bg-navy-800/90 p-0.5 rounded-lg border border-navy-700">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              title="Zoom In"
              className="p-1 hover:text-white text-slate-400 hover:bg-navy-700 rounded transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
              title="Zoom Out"
              className="p-1 hover:text-white text-slate-400 hover:bg-navy-700 rounded transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Reset Zoom"
              className="p-1 hover:text-white text-slate-400 hover:bg-navy-700 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-1 hover:text-white text-slate-400 hover:bg-navy-700 rounded transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Split Viewport */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchMove={handleTouchMove}
        className="relative flex-1 select-none cursor-ew-resize overflow-hidden flex items-center justify-center bg-navy-950 p-2 min-h-[420px] max-h-[640px]"
      >
        <div 
          className="relative max-w-full max-h-full transition-transform duration-100 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base Layer: Enhanced Image */}
          <img 
            src={enhSrc} 
            alt="Enhanced" 
            className="block max-h-[580px] w-auto max-w-full object-contain pointer-events-none rounded shadow-lg"
          />

          {/* Reveal Layer: Original Image (Clipped) */}
          <div 
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img 
              src={origSrc} 
              alt="Original" 
              className="block max-h-[580px] w-auto max-w-full object-contain pointer-events-none rounded shadow-lg"
            />
          </div>

          {/* Visual Divider Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_#38bdf8] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Center Slider Grab Handle */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-navy-900 border-2 border-cyan-400 shadow-xl flex items-center justify-center text-cyan-300">
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>

          {/* Overlay Corner Pills */}
          <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-300 border border-navy-700 pointer-events-none">
            Original Degraded
          </div>
          <div className="absolute top-3 right-3 bg-cyan-950/80 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-mono text-cyan-300 border border-cyan-700/60 pointer-events-none">
            Enhanced Result
          </div>
        </div>
      </div>

      {/* Bottom Range Slider Scrubbing Bar */}
      <div className="p-3 bg-navy-900/60 border-t border-navy-800/80 flex items-center space-x-4">
        <span className="text-[11px] font-mono text-slate-400 w-16">Original</span>
        <input 
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-navy-700 rounded-lg"
        />
        <span className="text-[11px] font-mono text-cyan-300 w-16 text-right">Enhanced</span>
      </div>
    </div>
  );
}
