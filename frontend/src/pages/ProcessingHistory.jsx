import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  Download, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Layers,
  ExternalLink,
  RefreshCw,
  Eye
} from 'lucide-react';
import { resolveImageUrl, getDownloadUrl, getReportUrl, clearHistory } from '../services/api';

export default function ProcessingHistory({
  historyData,
  onRefreshHistory,
  onSelectRecord,
  setActiveTab
}) {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const records = historyData?.records || [];
  const stats = historyData?.stats || {};

  const handleConfirmClear = async () => {
    try {
      setIsClearing(true);
      setErrorMessage(null);
      await clearHistory();
      if (onRefreshHistory) {
        await onRefreshHistory();
      }
      setShowConfirmModal(false);
      setActionMessage("All processing history records have been cleared.");
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to clear processing history.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleOpenInStudio = (record) => {
    if (onSelectRecord) onSelectRecord(record);
    if (setActiveTab) setActiveTab('studio');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Processing History & Auditing Dossiers
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chronological audit log of all inspection image uploads, restoration operations, and quantitative metrics.
          </p>
        </div>

        {/* Action Button: Clear All History */}
        <div className="flex items-center space-x-3">
          {records.length > 0 && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isClearing}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-mono transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All History</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-400 hover:text-emerald-200">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">×</button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-navy-700/60">
          <span className="text-xs font-mono text-slate-400">Total Processed</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{stats.total_processed ?? records.length}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-navy-700/60">
          <span className="text-xs font-mono text-emerald-400">Enhanced Assets</span>
          <p className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{stats.successful_enhancements ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-navy-700/60">
          <span className="text-xs font-mono text-cyan-400">Conventional Restorations</span>
          <p className="text-2xl font-bold text-cyan-300 mt-1 font-mono">{stats.conventional_enhancements ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-navy-700/60">
          <span className="text-xs font-mono text-amber-400">Generative Diffusion</span>
          <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{stats.generative_enhancements ?? 0}</p>
        </div>
      </div>

      {/* History Records List or Empty State */}
      {records.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-navy-700 bg-navy-900/30 space-y-3">
          <div className="w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center mx-auto text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No processing history available</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload inspection imagery in the Enhancement Studio or test built-in infrastructure samples to generate restoration dossiers.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('studio')}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-mono transition-colors"
            >
              Open Enhancement Studio
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SHOWING {records.length} AUDIT RECORDS</span>
          </div>

          <div className="space-y-3">
            {records.map((rec, idx) => {
              const origUrl = rec.original_url || rec.upload_url;
              const enhUrl = rec.enhanced_url;
              const metrics = rec.metrics;
              const dims = rec.dimensions || {};

              return (
                <div
                  key={rec.image_id || idx}
                  className="rounded-2xl glass-panel border border-navy-700/60 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-navy-600 transition-all"
                >
                  {/* Left: Thumbnail & Core Info */}
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-navy-900 border border-navy-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img
                        src={resolveImageUrl(enhUrl || origUrl)}
                        alt={rec.original_filename || "Inspection Asset"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                          {rec.original_filename || "Inspection Capture"}
                        </span>
                        {rec.is_generative_ai && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Generative
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                        <span className="text-cyan-400 font-semibold">
                          {rec.last_operation ? rec.last_operation.toUpperCase() : 'UPLOADED'}
                        </span>
                        <span>•</span>
                        <span>{dims.width ? `${dims.width}×${dims.height} px` : 'N/A'}</span>
                        <span>•</span>
                        <span>{rec.processing_time_ms ? `${rec.processing_time_ms.toFixed(1)} ms` : '0 ms'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm sm:max-w-lg">
                        {rec.model_used || "Original unenhanced upload"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={() => handleOpenInStudio(rec)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white border border-navy-700 text-xs font-mono transition-colors"
                      title="Load this record in Enhancement Studio"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View in Studio</span>
                    </button>

                    {enhUrl && (
                      <a
                        href={getDownloadUrl(rec.image_id)}
                        download
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-mono transition-colors"
                        title="Download enhanced image"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Image</span>
                      </a>
                    )}

                    <a
                      href={getReportUrl(rec.image_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-800 text-slate-300 hover:text-white hover:bg-navy-750 border border-navy-700 text-xs font-mono transition-colors"
                      title="Download Markdown Inspection Dossier"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">Report</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-navy-900 border border-navy-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear All Processing History?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-navy-950 p-3 rounded-xl border border-navy-800">
              This will clear all {records.length} history log records from the system dashboard and audit view. 
              <strong> Stored image files, original captures, and AI weights will remain safe on disk.</strong>
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white border border-navy-700 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-semibold shadow-lg shadow-rose-900/30 transition-colors"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Clear All History</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
