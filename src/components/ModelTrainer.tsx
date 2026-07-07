import React, { useState, useEffect } from 'react';
import { Dataset, ModelAlgorithm, ModelConfig, ModelEvaluation } from '../types';
import { Settings, Play, Sliders, CheckSquare, Square, Info, Activity } from 'lucide-react';

interface ModelTrainerProps {
  dataset: Dataset;
  cleanedData: Record<string, any>[] | null;
  onModelTrained: (evaluation: ModelEvaluation, config: ModelConfig) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ModelTrainer({
  dataset,
  cleanedData,
  onModelTrained,
  isLoading,
  setIsLoading,
}: ModelTrainerProps) {
  const activeData = cleanedData || dataset.rawData;

  const [algorithm, setAlgorithm] = useState<ModelAlgorithm>('linear_regression');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [trainRatio, setTrainRatio] = useState<number>(0.8);
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [iterations, setIterations] = useState<number>(1000);
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect targets and features when dataset/algorithm changes
  useEffect(() => {
    if (!dataset) return;

    // Detect target columns
    const numericCols = dataset.columns.filter((c) => c.type === 'numeric').map((c) => c.name);
    const booleanCols = dataset.columns.filter((c) => c.type === 'boolean').map((c) => c.name);

    if (algorithm === 'logistic_regression') {
      // Classification prefers boolean or low-cardinality discrete targets
      const classCols = [...booleanCols, ...dataset.columns.filter(c => c.type === 'categorical' || (c.type === 'numeric' && c.distinctValuesCount <= 3)).map(c => c.name)];
      if (classCols.length > 0) {
        setTargetColumn(classCols[0]);
      } else if (numericCols.length > 0) {
        setTargetColumn(numericCols[numericCols.length - 1]);
      }
    } else {
      // Regression prefers numeric
      if (numericCols.length > 0) {
        setTargetColumn(numericCols[numericCols.length - 1]);
      }
    }
  }, [dataset, algorithm]);

  useEffect(() => {
    if (!targetColumn) return;

    // Select all other columns (excluding ID and target) as features by default
    const validFeatures = dataset.columns
      .map((c) => c.name)
      .filter((name) => {
        return (
          name !== targetColumn &&
          name !== 'id' &&
          name !== 'outlet_id' &&
          name !== 'customer_id' &&
          name !== 'week_id' &&
          name !== 'date' &&
          name !== 'name'
        );
      });

    setSelectedFeatures(validFeatures);
  }, [targetColumn, dataset]);

  const handleToggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const handleTrainModel = async () => {
    if (selectedFeatures.length === 0) {
      setError('Please select at least one feature to train the model.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const config: ModelConfig = {
      algorithm,
      targetColumn,
      features: selectedFeatures,
      trainTestRatio: trainRatio,
      hyperparameters: {
        maxDepth,
        learningRate,
        iterations,
      },
    };

    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: activeData,
          config,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server failed to train model.');
      }

      const result = await response.json();
      onModelTrained(result.evaluation, config);
    } catch (err: any) {
      setError(err.message || 'Model training failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const trainCount = Math.floor(activeData.length * trainRatio);
  const testCount = activeData.length - trainCount;

  return (
    <div className="space-y-6" id="model-trainer-root">
      {/* Alert if training on raw uncleaned data */}
      {!cleanedData && (
        <div className="bg-amber/5 border border-amber/15 p-4 rounded-xl text-xs text-amber flex items-start gap-2.5">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Notice:</strong> You are training on the raw, uncleaned dataset. Missing values are filled with zeros and outliers are unhandled. We highly recommend visiting the <strong>Data Cleaning</strong> stage first for higher predictive accuracy.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Algorithm & Config - 6 cols */}
        <div className="lg:col-span-6 bg-surface border border-line rounded-2xl p-6 space-y-6">
          <h3 className="font-sans font-semibold text-text text-lg pb-3 border-b border-line flex items-center gap-2">
            <Settings className="w-5 h-5 text-coral" />
            Algorithm & Targets
          </h3>

          {/* Algorithm selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase font-mono text-text">
              Select ML Model Algorithm
            </label>
            <div className="grid grid-cols-1 gap-3 font-mono text-xs">
              {[
                {
                  id: 'linear_regression',
                  name: 'Linear Regression (OLS)',
                  desc: 'Predicts continuous numeric variables using multi-variable linear equations.',
                },
                {
                  id: 'logistic_regression',
                  name: 'Sigmoid Logistic Regression',
                  desc: 'Predicts binary discrete categories or churn likelihood probabilities (0 to 1).',
                },
                {
                  id: 'decision_tree',
                  name: 'Decision Tree Ensemble (Stump)',
                  desc: 'Partitions features into logical split decisions, excellent for capturing non-linear bounds.',
                },
              ].map((alg) => {
                const isSelected = algorithm === alg.id;
                return (
                  <div
                    key={alg.id}
                    onClick={() => setAlgorithm(alg.id as any)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-text border-text text-surface'
                        : 'bg-panel2 border-line/60 text-text hover:border-text-muted/40'
                    }`}
                  >
                    <div className="font-bold text-xs mb-1">{alg.name}</div>
                    <div className={`text-[10px] leading-relaxed ${isSelected ? 'text-surface/80' : 'text-text-muted'}`}>
                      {alg.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target and Features Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase font-mono text-text">
                Target Column (Y)
              </label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full bg-panel2 border border-line/60 rounded-xl px-3 py-2 text-xs text-text font-mono focus:outline-none focus:ring-1 focus:ring-coral"
              >
                {dataset.columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase font-mono text-text">
                Validation Ratio
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="0.9"
                  step="0.1"
                  value={trainRatio}
                  onChange={(e) => setTrainRatio(parseFloat(e.target.value))}
                  className="w-full accent-coral"
                />
                <span className="font-mono text-xs font-semibold text-text whitespace-nowrap">
                  {Math.round(trainRatio * 100)}% Train
                </span>
              </div>
            </div>
          </div>

          {/* Hyperparameters tuning */}
          <div className="bg-panel2 border border-line/45 rounded-xl p-4 space-y-4">
            <h4 className="font-sans font-semibold text-text text-xs flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-text-muted" />
              Adjust Hyperparameters
            </h4>

            {algorithm === 'decision_tree' ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-text-muted">
                  <span>Max Tree Depth:</span>
                  <span className="font-semibold text-text">{maxDepth} nodes</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="6"
                  step="1"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  className="w-full accent-coral"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-text-muted">
                    <span>Learning Rate:</span>
                    <span className="font-semibold text-text">{learningRate}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                    value={learningRate}
                    onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                    className="w-full accent-coral"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-text-muted">
                    <span>GD Iterations:</span>
                    <span className="font-semibold text-text">{iterations}</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="2000"
                    step="100"
                    value={iterations}
                    onChange={(e) => setIterations(parseInt(e.target.value))}
                    className="w-full accent-coral"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Features checklist & Split - 6 cols */}
        <div className="lg:col-span-6 bg-surface border border-line rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-sans font-semibold text-text text-lg pb-3 border-b border-line">
              Select Predictor Features (X)
            </h3>

            {/* Features checklist grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {dataset.columns
                .map((c) => c.name)
                .filter((name) => name !== targetColumn && name !== 'id')
                .map((feat) => {
                  const isChecked = selectedFeatures.includes(feat);
                  return (
                    <div
                      key={feat}
                      onClick={() => handleToggleFeature(feat)}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-surface border-coral/65 shadow-xs'
                          : 'bg-panel2/60 border-line/40 text-text-muted hover:border-text-muted/20'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-coral shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-text-muted/50 shrink-0" />
                      )}
                      <span className="font-mono text-xs text-text font-medium truncate" title={feat}>
                        {feat}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Split size indicators */}
            <div className="space-y-2">
              <h4 className="font-sans font-semibold text-text text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-text-muted" />
                Train/Test Sample Distribution
              </h4>
              <div className="p-4 bg-panel2 border border-line/40 rounded-xl space-y-3 font-mono text-xs text-text-muted">
                <div className="flex justify-between items-center">
                  <span>Total Buffered Rows:</span>
                  <span className="font-semibold text-text">{activeData.length}</span>
                </div>
                {/* Visual bar split */}
                <div className="w-full h-3.5 bg-line/80 rounded-full flex overflow-hidden">
                  <div
                    style={{ width: `${trainRatio * 100}%` }}
                    className="bg-coral h-full transition-all"
                  />
                  <div
                    style={{ width: `${(1 - trainRatio) * 100}%` }}
                    className="bg-teal h-full transition-all"
                  />
                </div>
                <div className="flex justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-coral rounded-xs" />
                    <span>TRAIN SET: <strong className="text-text">{trainCount}</strong> records</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-teal rounded-xs" />
                    <span>TEST SET: <strong className="text-text">{testCount}</strong> records</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-line/50 space-y-4">
            <button
              onClick={handleTrainModel}
              disabled={isLoading}
              className="w-full bg-text hover:bg-text/90 text-surface py-3.5 rounded-xl font-sans font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Activity className="w-4 h-4 animate-spin text-coral" />
              ) : (
                <Play className="w-4 h-4 text-coral fill-coral" />
              )}
              {isLoading ? 'Fitting Model Coefficients...' : 'Begin Model Training & Optimization'}
            </button>

            {error && (
              <p className="text-amber text-xs font-semibold bg-amber/10 p-3 rounded-xl border border-amber/15 leading-relaxed">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
