import React, { useState } from 'react';
import { Dataset, CleaningConfig, CleaningReport } from '../types';
import { Sparkles, RefreshCw, Trash2, ArrowRight, ShieldAlert, Terminal, HelpCircle } from 'lucide-react';

interface DataCleaningPanelProps {
  dataset: Dataset;
  onDataCleaned: (cleanedData: Record<string, any>[], report: CleaningReport, config: CleaningConfig) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function DataCleaningPanel({ dataset, onDataCleaned, isLoading, setIsLoading }: DataCleaningPanelProps) {
  const [config, setConfig] = useState<CleaningConfig>({
    nullStrategy: 'mean',
    removeDuplicates: true,
    scaleMethod: 'none',
    capOutliers: true,
    outliersZScoreThreshold: 3.0,
  });

  const [cleaningReport, setCleaningReport] = useState<CleaningReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunCleaning = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawData: dataset.rawData,
          config,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server failed to clean data.');
      }

      const result = await response.json();
      setCleaningReport(result.report);
      onDataCleaned(result.cleanedData, result.report, config);
    } catch (err: any) {
      setError(err.message || 'Cleaning execution failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="data-cleaning-panel-root">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cleaning Configuration controls - 5 cols */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-2xl p-6 space-y-6">
          <h3 className="font-sans font-semibold text-text text-lg pb-3 border-b border-line flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-coral" />
            Cleaning Configuration
          </h3>

          {/* 1. Null handling */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase font-mono text-text">
              Null Value Imputation
            </label>
            <p className="text-text-muted text-[11px] leading-relaxed mb-1">
              Specify how missing data (NaN/NULL cells) should be filled in each column.
            </p>
            <select
              value={config.nullStrategy}
              onChange={(e) => setConfig({ ...config, nullStrategy: e.target.value as any })}
              className="w-full bg-panel2 border border-line/60 rounded-xl px-3 py-2 text-xs text-text font-mono focus:outline-none focus:ring-1 focus:ring-coral"
            >
              <option value="mean">Mean (Averages - for Numeric columns)</option>
              <option value="median">Median (Middle value - protects against outliers)</option>
              <option value="mode">Mode (Most frequent - for Categorical/Boolean)</option>
              <option value="zero">Zero (Fill with absolute zero values)</option>
              <option value="drop">Drop Rows (Discard any row containing a NULL cell)</option>
            </select>
          </div>

          {/* 2. Remove Duplicates */}
          <div className="flex items-start justify-between p-3.5 rounded-xl bg-panel2 border border-line/40">
            <div className="space-y-1 pr-4">
              <label className="block text-xs font-semibold uppercase font-mono text-text flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5 text-text-muted" />
                Drop Duplicates
              </label>
              <p className="text-text-muted text-[10px] leading-relaxed">
                Identify and remove duplicate entries based on identical feature records.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-0.5">
              <input
                type="checkbox"
                checked={config.removeDuplicates}
                onChange={(e) => setConfig({ ...config, removeDuplicates: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-line/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-coral"></div>
            </label>
          </div>

          {/* 3. Feature Scaling */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase font-mono text-text">
              Statistical Scaling
            </label>
            <p className="text-text-muted text-[11px] leading-relaxed mb-1">
              Prepares numeric features by normalizing variables so they are directly comparable.
            </p>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {[
                { value: 'none', title: 'None', desc: 'Raw original' },
                { value: 'minmax', title: 'MinMax', desc: 'Scales [0, 1]' },
                { value: 'standardize', title: 'Z-Score', desc: 'Mean=0, Std=1' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setConfig({ ...config, scaleMethod: m.value as any })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    config.scaleMethod === m.value
                      ? 'bg-text text-surface border-text'
                      : 'bg-panel2 border-line/60 text-text hover:border-text-muted/40'
                  }`}
                >
                  <div className="font-semibold text-xs leading-none mb-1">{m.title}</div>
                  <div className="text-[9px] text-text-muted/80 leading-none">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Outliers Capping */}
          <div className="space-y-3.5 p-3.5 rounded-xl bg-panel2 border border-line/40">
            <div className="flex items-start justify-between">
              <div className="space-y-1 pr-4">
                <label className="block text-xs font-semibold uppercase font-mono text-text flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-text-muted" />
                  Cap Extreme Outliers
                </label>
                <p className="text-text-muted text-[10px] leading-relaxed">
                  Capping values that fall outside a set number of Standard Deviations.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={config.capOutliers}
                  onChange={(e) => setConfig({ ...config, capOutliers: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-line/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-coral"></div>
              </label>
            </div>

            {config.capOutliers && (
              <div className="space-y-1.5 border-t border-line/30 pt-3">
                <div className="flex justify-between font-mono text-xs text-text-muted">
                  <span>Z-Score Threshold:</span>
                  <span className="font-semibold text-text">{config.outliersZScoreThreshold.toFixed(1)} σ</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="4.0"
                  step="0.5"
                  value={config.outliersZScoreThreshold}
                  onChange={(e) => setConfig({ ...config, outliersZScoreThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-coral"
                />
                <div className="flex justify-between text-[9px] font-mono text-text-muted">
                  <span>1.5 (Strict)</span>
                  <span>3.0 (Typical)</span>
                  <span>4.0 (Loose)</span>
                </div>
              </div>
            )}
          </div>

          {/* Trigger button */}
          <button
            onClick={handleRunCleaning}
            disabled={isLoading}
            className="w-full bg-coral hover:bg-coral/90 text-white py-3 rounded-xl font-sans font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-coral/20 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isLoading ? 'Cleaning Dataset...' : 'Execute Cleaning Pipeline'}
          </button>

          {error && (
            <p className="text-amber text-xs font-semibold bg-amber/10 p-3 rounded-xl border border-amber/15 leading-relaxed">
              {error}
            </p>
          )}
        </div>

        {/* Live Cleaning Report / Logging Terminal - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cleaning Stats Comparison */}
          <div className="bg-surface border border-line rounded-2xl p-6 space-y-6 flex flex-col justify-between h-full">
            <div>
              <h3 className="font-sans font-semibold text-text text-lg pb-3 border-b border-line">
                Cleaning Pipeline Report
              </h3>

              {!cleaningReport ? (
                <div className="py-20 text-center text-text-muted flex flex-col items-center justify-center">
                  <Terminal className="w-12 h-12 text-line mb-3" />
                  <p className="font-sans font-medium text-sm text-text mb-1">Pipeline is idle</p>
                  <p className="text-xs max-w-xs leading-relaxed">
                    Set your custom data-cleaning parameters on the left and click "Execute Cleaning Pipeline" to train on cleaned records.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 pt-4">
                  {/* Clean stats metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3.5 rounded-xl bg-panel2 border border-line/45 text-center">
                      <div className="text-[10px] text-text-muted font-mono uppercase mb-0.5">Initial Rows</div>
                      <div className="text-lg font-mono font-bold text-text-muted line-through leading-none">
                        {cleaningReport.rowCountBefore}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-panel2 border border-line/45 text-center">
                      <div className="text-[10px] text-teal font-mono uppercase mb-0.5">Cleaned Rows</div>
                      <div className="text-lg font-mono font-bold text-teal leading-none flex items-center justify-center gap-1">
                        {cleaningReport.rowCountAfter}
                        <ArrowRight className="w-3.5 h-3.5 text-teal" />
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-panel2 border border-line/45 text-center">
                      <div className="text-[10px] text-text-muted font-mono uppercase mb-0.5">Nulls Handled</div>
                      <div className="text-lg font-mono font-bold text-text leading-none">
                        {cleaningReport.nullsFilled}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-panel2 border border-line/45 text-center">
                      <div className="text-[10px] text-text-muted font-mono uppercase mb-0.5">Capped Outliers</div>
                      <div className="text-lg font-mono font-bold text-text leading-none">
                        {cleaningReport.outliersCapped}
                      </div>
                    </div>
                  </div>

                  {/* Terminal Execution Logs */}
                  <div className="space-y-2">
                    <h4 className="font-sans font-semibold text-text text-sm flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-text-muted" />
                      Pipeline Terminal Execution Log
                    </h4>
                    <div className="bg-[#0B0E17] rounded-xl p-4 font-mono text-[11px] text-teal space-y-2 max-h-[220px] overflow-y-auto shadow-inner border border-[#2D3954]/40">
                      <div className="text-text-muted/60 mb-1 flex justify-between items-center border-b border-white/10 pb-1.5">
                        <span>BI-INTEL CORE ENGINE VER 1.2</span>
                        <span>STDOUT</span>
                      </div>
                      <div className="text-white/65">[system] Booting Data Cleaning Engine...</div>
                      <div className="text-white/65">[system] Read raw matrix containing {cleaningReport.rowCountBefore} row records and {dataset.columnCount} features.</div>
                      {cleaningReport.logs.map((log, i) => (
                        <div key={i} className="leading-relaxed">
                          <span className="text-coral select-none">❯</span> {log}
                        </div>
                      ))}
                      <div className="text-teal font-medium">[success] Data Cleaning Pipeline finished successfully. Dataset ready for model fitting.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cleaningReport && (
              <div className="bg-teal/5 border border-teal/15 p-3.5 rounded-xl text-xs text-teal/80 flex items-start gap-2 mt-6">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  The dataset has been cleaned, filtered, and is currently buffered in-memory. Navigate to the <strong>Model Trainer</strong> tab to set up target features and fit your predictive models.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
