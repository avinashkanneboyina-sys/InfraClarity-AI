// InfraClarity AI - Top‑level application component
// This file was added to wire the existing pages together and fetch initial data.

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EnhancementStudio from './pages/EnhancementStudio.jsx';
import ImageAnalysis from './pages/ImageAnalysis.jsx';
import ProcessingHistory from './pages/ProcessingHistory.jsx';
import { fetchHealth, fetchSamples, fetchHistory, loadSample } from './services/api.js';

export default function App() {
  // UI navigation state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Backend data state
  const [backendStatus, setBackendStatus] = useState(null);
  const [samples, setSamples] = useState([]);
  const [history, setHistory] = useState({ stats: {}, records: [] });

  // Current image record (shared between studio, analysis, etc.)
  const [currentRecord, setCurrentRecord] = useState(null);

  // Initial data fetch – health, sample list, processing history
  useEffect(() => {
    // Health (used for Navbar status badge)
    fetchHealth()
      .then(setBackendStatus)
      .catch((e) => console.error('Health fetch error:', e));

    // Sample images for the dashboard / studio
    fetchSamples()
      .then((data) => setSamples(data.samples || []))
      .catch((e) => console.error('Samples fetch error:', e));

    // Processing history (stats + records)
    fetchHistory()
      .then(setHistory)
      .catch((e) => console.error('History fetch error:', e));
  }, []);

  // Helper to load a sample image via the backend and set the current record
  const handleLoadSample = async (sampleId) => {
    try {
      const record = await loadSample(sampleId);
      setCurrentRecord(record);
      // Refresh history after loading a sample (adds a new record)
      const freshHistory = await fetchHistory();
      setHistory(freshHistory);
    } catch (err) {
      console.error('Load sample error:', err);
    }
  };

  // Render the appropriate page based on activeTab
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            historyData={history}
            samples={samples}
            onSelectSample={handleLoadSample}
            onSelectRecord={setCurrentRecord}
            setActiveTab={setActiveTab}
          />
        );
      case 'studio':
        return (
          <EnhancementStudio
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            samples={samples}
            onRecordUpdated={setCurrentRecord}
            setActiveTab={setActiveTab}
            setHistory={setHistory}
          />
        );
      case 'analysis':
        return (
          <ImageAnalysis
            currentRecord={currentRecord}
            onRecordUpdated={setCurrentRecord}
            setActiveTab={setActiveTab}
          />
        );
      case 'history':
        return (
          <ProcessingHistory
            historyData={history}
            onRefreshHistory={async () => {
              const freshHistory = await fetchHistory();
              setHistory(freshHistory);
            }}
            onSelectRecord={(rec) => {
              setCurrentRecord(rec);
            }}
            setActiveTab={setActiveTab}
          />
        );
      case 'about':
        return (
          <div className="p-8 text-white">
            <h2 className="text-2xl mb-4">About InfraClarity AI</h2>
            <p>Infrastructure inspection image enhancer built with FastAPI and React.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-200 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} backendStatus={backendStatus} />
      <main className="flex-1 container mx-auto px-4 py-6">{renderPage()}</main>
      <Footer />
    </div>
  );
}
