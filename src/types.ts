export type ColumnType = 'numeric' | 'categorical' | 'boolean' | 'date' | 'text';

export interface ColumnMetadata {
  name: string;
  type: ColumnType;
  missingCount: number;
  distinctValuesCount: number;
  sampleValues: string[];
  mean?: number;
  stdDev?: number;
  min?: number;
  max?: number;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnMetadata[];
  rawData: Record<string, any>[];
}

export type NullStrategy = 'mean' | 'median' | 'mode' | 'drop' | 'zero';
export type ScaleMethod = 'none' | 'minmax' | 'standardize';

export interface CleaningConfig {
  nullStrategy: NullStrategy;
  removeDuplicates: boolean;
  scaleMethod: ScaleMethod;
  capOutliers: boolean;
  outliersZScoreThreshold: number; // e.g. 3.0
}

export interface CleaningReport {
  rowCountBefore: number;
  rowCountAfter: number;
  nullsFilled: number;
  duplicatesRemoved: number;
  outliersCapped: number;
  logs: string[];
}

export type ModelAlgorithm = 'linear_regression' | 'logistic_regression' | 'decision_tree';

export interface ModelConfig {
  algorithm: ModelAlgorithm;
  targetColumn: string;
  features: string[];
  trainTestRatio: number; // e.g. 0.8 for 80/20
  hyperparameters: {
    maxDepth?: number;
    learningRate?: number;
    iterations?: number;
  };
}

export interface FeatureImportance {
  featureName: string;
  importance: number; // raw value or percentage
}

export interface PredictionResult {
  index: number;
  actual: number | string;
  predicted: number | string;
  error?: number;
}

export interface ModelEvaluation {
  algorithm: string;
  targetColumn: string;
  isClassification: boolean;
  // Regression metrics
  r2Score?: number;
  mae?: number;
  rmse?: number;
  // Classification metrics
  accuracy?: number;
  f1Score?: number;
  precision?: number;
  recall?: number;
  // Performance and importance
  featureImportances: FeatureImportance[];
  predictions: PredictionResult[];
  trainingTimeMs: number;
  modelWeights?: number[];
  modelBias?: number;
  means?: number[];
  stdDevs?: number[];
}

export interface AIRecommendation {
  id: string;
  category: 'strategic' | 'tactical' | 'operational' | 'data';
  title: string;
  text: string;
  impact: 'high' | 'medium' | 'low';
  feasibility: 'high' | 'medium' | 'low';
}

export interface AIInsights {
  summary: string;
  anomalies: string[];
  featuresInsight: string[];
  recommendations: AIRecommendation[];
}
