import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { motion, AnimatePresence } from 'motion/react';
import { Dataset, CleaningConfig, CleaningReport, ModelConfig, ModelEvaluation } from './types';
import { defaultDatasets } from './data/datasets';
import DatasetSelector from './components/DatasetSelector';
import DataCleaningPanel from './components/DataCleaningPanel';
import ModelTrainer from './components/ModelTrainer';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import {
  TrendingUp,
  Database,
  Sparkles,
  Play,
  LayoutDashboard,
  Menu,
  X,
  FileSpreadsheet,
  Cpu,
  Sun,
  Moon,
  Home,
} from 'lucide-react';

export default function App() {
  // Navigation & UI state
  const [viewMode, setViewMode] = useState<'landing' | 'analysis'>('landing');
  const [activeTab, setActiveTab] = useState<'datasets' | 'cleaning' | 'training' | 'dashboard'>('datasets');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Sync scroll event to window
    lenis.on('scroll', () => {
      window.dispatchEvent(new Event('scroll'));
    });

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  const renderNavItems = () => {
    return (
      <>
        {/* Back to Home Page */}
        <button
          onClick={() => {
            setViewMode('landing');
            setMobileMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-semibold text-left transition-all cursor-pointer text-text-muted hover:bg-panel2/65 hover:text-text mb-2 border border-dashed border-line/50"
        >
          <Home className="w-4 h-4 text-coral shrink-0" />
          ← Back to Home
        </button>

        {/* 1. Datasets selection */}
        <button
          onClick={() => {
            setActiveTab('datasets');
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-semibold text-left transition-all cursor-pointer ${
            activeTab === 'datasets'
              ? 'bg-text text-surface'
              : 'text-text-muted hover:bg-panel2/65 hover:text-text'
          }`}
        >
          <Database className="w-4 h-4 text-coral shrink-0" />
          1. Datasets Ingest
        </button>

        {/* 2. Cleaning */}
        <button
          onClick={() => {
            if (selectedDataset) {
              setActiveTab('cleaning');
              setMobileMenuOpen(false);
            }
          }}
          disabled={!selectedDataset}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-semibold text-left transition-all cursor-pointer ${
            activeTab === 'cleaning'
              ? 'bg-text text-surface'
              : 'text-text-muted hover:bg-panel2/65 hover:text-text disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4 text-coral shrink-0" />
          2. Data Cleaning
          {cleanedData && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal" />
          )}
        </button>

        {/* 3. Training */}
        <button
          onClick={() => {
            if (selectedDataset) {
              setActiveTab('training');
              setMobileMenuOpen(false);
            }
          }}
          disabled={!selectedDataset}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-semibold text-left transition-all cursor-pointer ${
            activeTab === 'training'
              ? 'bg-text text-surface'
              : 'text-text-muted hover:bg-panel2/65 hover:text-text disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4 text-coral shrink-0" />
          3. Model Trainer
          {isModelReady && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal" />
          )}
        </button>

        {/* 4. Dashboard (requires training) */}
        <button
          onClick={() => {
            if (isModelReady) {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }
          }}
          disabled={!isModelReady}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-semibold text-left transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-text text-surface'
              : 'text-text-muted hover:bg-panel2/65 hover:text-text disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-coral shrink-0" />
          4. Predictive Dashboard
        </button>

        {/* Divider */}
        <div className="h-px bg-line/60 my-3" />

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer text-text-muted hover:bg-panel2/65 hover:text-text"
          id="theme-toggle-btn"
        >
          <div className="flex items-center gap-3">
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-coral shrink-0" />
            ) : (
              <Sun className="w-4 h-4 text-coral shrink-0" />
            )}
            <span>Theme: {theme === 'light' ? 'Light' : 'Dark'}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-panel2 font-mono text-text border border-line/45">
            {theme.toUpperCase()}
          </span>
        </button>
      </>
    );
  };

  // Keep theme class in sync on document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Active ML pipeline states
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(defaultDatasets[0]); // Default to first dataset for a stellar first-use experience
  const [cleanedData, setCleanedData] = useState<Record<string, any>[] | null>(null);
  const [cleaningReport, setCleaningReport] = useState<CleaningReport | null>(null);
  const [cleaningConfig, setCleaningConfig] = useState<CleaningConfig | null>(null);

  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [modelEvaluation, setModelEvaluation] = useState<ModelEvaluation | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setCleanedData(null);
    setCleaningReport(null);
    setCleaningConfig(null);
    setModelConfig(null);
    setModelEvaluation(null);
    setActiveTab('datasets');
  };

  const handleDataCleaned = (
    data: Record<string, any>[],
    report: CleaningReport,
    config: CleaningConfig
  ) => {
    setCleanedData(data);
    setCleaningReport(report);
    setCleaningConfig(config);
    // Auto advance to training state
    setTimeout(() => {
      setActiveTab('training');
    }, 800);
  };

  const handleModelTrained = (evaluation: ModelEvaluation, config: ModelConfig) => {
    setModelEvaluation(evaluation);
    setModelConfig(config);
    // Auto advance to dashboard state
    setTimeout(() => {
      setActiveTab('dashboard');
    }, 800);
  };

  const handleRedirectToDashboard = (targetTab?: 'datasets' | 'cleaning' | 'training' | 'dashboard') => {
    if (targetTab) {
      setActiveTab(targetTab);
    } else {
      setActiveTab(isModelReady ? 'dashboard' : 'datasets');
    }
    setViewMode('analysis');
  };

  const isModelReady = modelEvaluation !== null && modelConfig !== null;

  if (viewMode === 'landing') {
    return (
      <LandingPage
        onRedirectToDashboard={handleRedirectToDashboard}
        theme={theme}
        setTheme={setTheme}
        isModelReady={isModelReady}
        selectedDataset={selectedDataset}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col md:flex-row font-sans transition-colors duration-200" id="app-viewport">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-[250px] bg-surface border-b md:border-b-0 md:border-r border-line flex flex-col justify-between shrink-0" id="sidebar-nav">

        <div className="flex flex-col h-full">
          {/* Logo Brand Header */}
          <div 
            onClick={() => setViewMode('landing')}
            className="p-6 border-b border-line/60 flex items-center justify-between cursor-pointer hover:bg-panel2/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-6 h-6 stroke-coral shrink-0" viewBox="0 0 26 26" fill="none" strokeWidth="2.4" strokeLinecap="round">
                <path d="M2 18c3-1 5-6 8-6s4 5 7 5 4-8 7-8" />
              </svg>
              <div>
                <h1 className="font-serif font-black tracking-tight text-text text-xl leading-none">
                  BI Intel
                </h1>
                <span className="text-[9px] font-mono font-bold text-text-muted tracking-wider uppercase">
                  Predictive Suite
                </span>
              </div>
            </div>
            {/* Mobile burger toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="md:hidden p-1.5 rounded-lg border border-line hover:border-text-muted/50 text-text cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Item list */}
          <div className="hidden md:block">
            <nav className="p-4 space-y-1.5" id="navigation-panel">
              {renderNavItems()}
            </nav>
          </div>

          <AnimatePresence initial={false}>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="md:hidden overflow-hidden border-t border-line/40 w-full"
              >
                <nav className="p-4 space-y-1.5" id="navigation-panel-mobile">
                  {renderNavItems()}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bounded disclaimer */}
        <div className="p-4 border-t border-line/50 hidden md:block text-[10px] text-text-muted font-mono leading-relaxed bg-panel2/40">
          <div>DATASET PIPELINE:</div>
          <div className="font-semibold text-text truncate mt-0.5">
            {selectedDataset ? selectedDataset.name : 'No Source Selected'}
          </div>
          <div className="text-[9px] text-text-muted/70 mt-1">
            Status: {isModelReady ? 'Coefficient Fitted' : cleanedData ? 'Data Imputed' : 'Raw Selected'}
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-hidden" id="main-content-area">
        {/* Top Header Information Panel */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-line/60 pb-5" id="header-panel">
          <div>
            <div className="text-[10px] text-coral font-mono font-bold uppercase tracking-wider mb-0.5">
              Machine Learning Decision Suite
            </div>
            <h2 className="font-sans font-black text-text text-2xl leading-none">
              {activeTab === 'datasets' && 'Dataset Ingest & Profiling'}
              {activeTab === 'cleaning' && 'Data Cleaning & Preprocessing'}
              {activeTab === 'training' && 'Model Coefficients Training'}
              {activeTab === 'dashboard' && 'Predictive Analytics Dashboard'}
            </h2>
            <p className="text-text-muted text-xs leading-relaxed mt-1">
              {activeTab === 'datasets' && 'Browse, profile raw features, or drop custom CSV spreadsheets into the analytics sandbox.'}
              {activeTab === 'cleaning' && 'Perform statistical imputations, scaling, outlier capping, and observe stdout before-after records.'}
              {activeTab === 'training' && 'Configure train/test partitions, pick target variables (Y), adjust hyper-parameters, and fit equations.'}
              {activeTab === 'dashboard' && 'Interact with simulated predictor sliders, audit coefficients, and retrieve AI executive briefs.'}
            </p>
          </div>

          {/* Selected dataset state indicator */}
          {selectedDataset && (
            <div className="flex items-center gap-3 bg-surface px-4 py-2.5 rounded-xl border border-line/65 shrink-0 self-start sm:self-auto shadow-xs">
              <FileSpreadsheet className="w-4 h-4 text-coral" />
              <div className="font-mono text-xs leading-tight">
                <div className="text-[9px] text-text-muted uppercase font-bold">SOURCE ACTIVE</div>
                <div className="font-semibold text-text text-[11px] truncate max-w-[120px] sm:max-w-[180px]" title={selectedDataset.name}>
                  {selectedDataset.name}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Tab components display switcher */}
        <div id="active-tab-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="will-change-[transform,opacity]"
            >
              {activeTab === 'datasets' && (
                <DatasetSelector
                  selectedDataset={selectedDataset}
                  onDatasetSelect={handleDatasetSelect}
                />
              )}

              {activeTab === 'cleaning' && selectedDataset && (
                <DataCleaningPanel
                  dataset={selectedDataset}
                  onDataCleaned={handleDataCleaned}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              )}

              {activeTab === 'training' && selectedDataset && (
                <ModelTrainer
                  dataset={selectedDataset}
                  cleanedData={cleanedData}
                  onModelTrained={handleModelTrained}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              )}

              {activeTab === 'dashboard' && selectedDataset && modelConfig && modelEvaluation && (
                <Dashboard
                  dataset={selectedDataset}
                  modelConfig={modelConfig}
                  modelEvaluation={modelEvaluation}
                  theme={theme}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
