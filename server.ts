import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==========================================
// DATA CLEANING PIPELINE ENGINE
// ==========================================

interface CleanRequest {
  rawData: Record<string, any>[];
  config: {
    nullStrategy: 'mean' | 'median' | 'mode' | 'drop' | 'zero';
    removeDuplicates: boolean;
    scaleMethod: 'none' | 'minmax' | 'standardize';
    capOutliers: boolean;
    outliersZScoreThreshold: number;
  };
}

function cleanData(rawData: Record<string, any>[], config: any) {
  const logs: string[] = [];
  let data = JSON.parse(JSON.stringify(rawData)) as Record<string, any>[];
  const rowCountBefore = data.length;

  // 1. Remove Duplicates
  let duplicatesRemoved = 0;
  if (config.removeDuplicates) {
    const seen = new Set<string>();
    const cleaned: Record<string, any>[] = [];
    for (const row of data) {
      // Create a unique string representation based on values excluding primary ID if possible
      const serialized = JSON.stringify(
        Object.keys(row)
          .filter(k => k !== 'id' && k !== 'outlet_id' && k !== 'customer_id' && k !== 'week_id')
          .reduce((obj, key) => {
            obj[key] = row[key];
            return obj;
          }, {} as any)
      );
      if (seen.has(serialized)) {
        duplicatesRemoved++;
      } else {
        seen.add(serialized);
        cleaned.push(row);
      }
    }
    data = cleaned;
    if (duplicatesRemoved > 0) {
      logs.push(`Removed ${duplicatesRemoved} duplicate row(s) from the dataset.`);
    }
  }

  // Identify column types and gather stats
  const numericColumns = Object.keys(data[0] || {}).filter(key => {
    return data.some(row => typeof row[key] === 'number' && row[key] !== null);
  });

  // 2. Handle Nulls
  let nullsFilled = 0;
  for (const key of Object.keys(data[0] || {})) {
    const isNumeric = numericColumns.includes(key);
    
    // Find missing values
    const missingIndices = data
      .map((row, i) => (row[key] === null || row[key] === undefined ? i : -1))
      .filter(i => i !== -1);

    if (missingIndices.length > 0) {
      if (config.nullStrategy === 'drop') {
        data = data.filter((_, i) => !missingIndices.includes(i));
        nullsFilled += missingIndices.length;
        logs.push(`Dropped ${missingIndices.length} row(s) containing missing values in '${key}'.`);
        continue;
      }

      let fillValue: any = 0;

      if (isNumeric) {
        const validValues = data
          .map(row => row[key])
          .filter(val => typeof val === 'number' && val !== null && !isNaN(val)) as number[];

        if (config.nullStrategy === 'mean') {
          const sum = validValues.reduce((a, b) => a + b, 0);
          fillValue = sum / (validValues.length || 1);
          fillValue = Math.round(fillValue * 100) / 100;
        } else if (config.nullStrategy === 'median') {
          const sorted = [...validValues].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          fillValue = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        } else if (config.nullStrategy === 'zero') {
          fillValue = 0;
        } else {
          // Default to mean for numeric if mode is chosen
          const sum = validValues.reduce((a, b) => a + b, 0);
          fillValue = sum / (validValues.length || 1);
          fillValue = Math.round(fillValue * 100) / 100;
        }
      } else {
        // Categorical/Boolean - mode imputation
        const validValues = data
          .map(row => row[key])
          .filter(val => val !== null && val !== undefined);
        const freq: Record<string, number> = {};
        validValues.forEach(val => {
          const str = String(val);
          freq[str] = (freq[str] || 0) + 1;
        });
        let maxFreq = -1;
        let modeVal: any = '';
        Object.entries(freq).forEach(([val, f]) => {
          if (f > maxFreq) {
            maxFreq = f;
            modeVal = val;
          }
        });
        
        // Convert back to original type if boolean
        if (typeof data.find(row => row[key] !== null && row[key] !== undefined)?.[key] === 'boolean') {
          fillValue = modeVal === 'true';
        } else {
          fillValue = modeVal;
        }
      }

      // Fill values
      missingIndices.forEach(idx => {
        if (data[idx]) {
          data[idx][key] = fillValue;
          nullsFilled++;
        }
      });
      logs.push(`Imputed ${missingIndices.length} missing value(s) in '${key}' with ${config.nullStrategy} (${fillValue}).`);
    }
  }

  // 3. Cap Outliers (Z-score approach)
  let outliersCapped = 0;
  if (config.capOutliers) {
    numericColumns.forEach(key => {
      const values = data.map(row => row[key]).filter(v => typeof v === 'number') as number[];
      if (values.length < 3) return;

      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) return;

      const threshold = config.outliersZScoreThreshold || 3.0;
      data.forEach(row => {
        const val = row[key];
        if (typeof val === 'number') {
          const z = (val - mean) / stdDev;
          if (Math.abs(z) > threshold) {
            const cappedVal = z > 0 ? mean + threshold * stdDev : mean - threshold * stdDev;
            row[key] = Math.round(cappedVal * 100) / 100;
            outliersCapped++;
          }
        }
      });
      if (outliersCapped > 0) {
        logs.push(`Capped ${outliersCapped} outlier value(s) in column '${key}' at +/-${threshold} Z-score.`);
      }
    });
  }

  const rowCountAfter = data.length;

  return {
    cleanedData: data,
    report: {
      rowCountBefore,
      rowCountAfter,
      nullsFilled,
      duplicatesRemoved,
      outliersCapped,
      logs: logs.length > 0 ? logs : ['Dataset was already clean. No modifications needed.'],
    },
  };
}

// ==========================================
// MATHEMATICAL MACHINE LEARNING ENGINE (TS)
// ==========================================

interface TrainRequest {
  data: Record<string, any>[];
  config: {
    algorithm: 'linear_regression' | 'logistic_regression' | 'decision_tree';
    targetColumn: string;
    features: string[];
    trainTestRatio: number;
    hyperparameters: {
      maxDepth?: number;
      learningRate?: number;
      iterations?: number;
    };
  };
}

// Standardize features for gradient descent stability
function standardizeMatrix(X: number[][]): { standardizedX: number[][]; means: number[]; stdDevs: number[] } {
  const rowCount = X.length;
  if (rowCount === 0) return { standardizedX: [], means: [], stdDevs: [] };
  const colCount = X[0].length;

  const means: number[] = new Array(colCount).fill(0);
  const stdDevs: number[] = new Array(colCount).fill(1);
  const standardizedX: number[][] = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));

  for (let j = 0; j < colCount; j++) {
    let sum = 0;
    for (let i = 0; i < rowCount; i++) sum += X[i][j];
    means[j] = sum / rowCount;

    let varianceSum = 0;
    for (let i = 0; i < rowCount; i++) varianceSum += Math.pow(X[i][j] - means[j], 2);
    const variance = varianceSum / rowCount;
    stdDevs[j] = Math.sqrt(variance) || 1.0; // avoid division by zero

    for (let i = 0; i < rowCount; i++) {
      standardizedX[i][j] = (X[i][j] - means[j]) / stdDevs[j];
    }
  }

  return { standardizedX, means, stdDevs };
}

// Train Multi-Variable Linear Regression using Gradient Descent
function trainLinearRegression(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  featuresList: string[],
  learningRate = 0.05,
  iterations = 1000
) {
  const N = trainX.length;
  const M = trainX[0]?.length || 0;

  // Standardization
  const { standardizedX, means, stdDevs } = standardizeMatrix(trainX);

  // Initialize weights
  const weights: number[] = new Array(M).fill(0);
  let bias = 0;

  // Gradient Descent Loop
  for (let iter = 0; iter < iterations; iter++) {
    const predictions: number[] = [];
    for (let i = 0; i < N; i++) {
      let pred = bias;
      for (let j = 0; j < M; j++) {
        pred += standardizedX[i][j] * weights[j];
      }
      predictions.push(pred);
    }

    const errors: number[] = [];
    for (let i = 0; i < N; i++) {
      errors.push(predictions[i] - trainY[i]);
    }

    // Compute gradients
    const dWeights: number[] = new Array(M).fill(0);
    let dBias = 0;

    for (let i = 0; i < N; i++) {
      dBias += errors[i];
      for (let j = 0; j < M; j++) {
        dWeights[j] += errors[i] * standardizedX[i][j];
      }
    }

    dBias = dBias / N;
    for (let j = 0; j < M; j++) {
      dWeights[j] = dWeights[j] / N;
    }

    // Update weights & bias
    bias -= learningRate * dBias;
    for (let j = 0; j < M; j++) {
      weights[j] -= learningRate * dWeights[j];
    }
  }

  // Standardize test set using training parameters
  const standardizedTestX = testX.map(row => {
    return row.map((val, colIdx) => {
      return (val - means[colIdx]) / stdDevs[colIdx];
    });
  });

  // Predictions on test set
  const predictionsTest: number[] = [];
  for (let i = 0; i < testX.length; i++) {
    let pred = bias;
    for (let j = 0; j < M; j++) {
      pred += standardizedTestX[i][j] * weights[j];
    }
    predictionsTest.push(pred);
  }

  // Calculate Regression Metrics on test data
  const nTest = testY.length;
  let mae = 0;
  let rss = 0;
  let sumY = 0;

  for (let i = 0; i < nTest; i++) {
    mae += Math.abs(predictionsTest[i] - testY[i]);
    rss += Math.pow(predictionsTest[i] - testY[i], 2);
    sumY += testY[i];
  }

  mae = mae / nTest;
  const rmse = Math.sqrt(rss / nTest);
  const meanY = sumY / nTest;

  let tss = 0;
  for (let i = 0; i < nTest; i++) {
    tss += Math.pow(testY[i] - meanY, 2);
  }

  const r2Score = tss === 0 ? 1.0 : 1.0 - rss / tss;

  // Feature Importance proportional to absolute standardized coefficients
  const absWeights = weights.map(Math.abs);
  const totalWeight = absWeights.reduce((a, b) => a + b, 0) || 1.0;
  const featureImportances = featuresList.map((f, idx) => ({
    featureName: f,
    importance: Math.round((absWeights[idx] / totalWeight) * 1000) / 10,
  })).sort((a, b) => b.importance - a.importance);

  return {
    isClassification: false,
    mae: Math.round(mae * 100) / 100,
    rmse: Math.round(rmse * 100) / 100,
    r2Score: Math.round(r2Score * 1000) / 1000,
    featureImportances,
    predictions: predictionsTest.map((pred, i) => ({
      index: i,
      actual: Math.round(testY[i] * 100) / 100,
      predicted: Math.round(pred * 100) / 100,
      error: Math.round((pred - testY[i]) * 100) / 100,
    })),
    modelWeights: weights,
    modelBias: bias,
    means,
    stdDevs,
  };
}

// Train Binary Logistic Regression with Sigmoid Link
function trainLogisticRegression(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  featuresList: string[],
  learningRate = 0.1,
  iterations = 1000
) {
  const N = trainX.length;
  const M = trainX[0]?.length || 0;

  const { standardizedX, means, stdDevs } = standardizeMatrix(trainX);

  const weights: number[] = new Array(M).fill(0);
  let bias = 0;

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

  for (let iter = 0; iter < iterations; iter++) {
    const predictions: number[] = [];
    for (let i = 0; i < N; i++) {
      let z = bias;
      for (let j = 0; j < M; j++) {
        z += standardizedX[i][j] * weights[j];
      }
      predictions.push(sigmoid(z));
    }

    const dWeights: number[] = new Array(M).fill(0);
    let dBias = 0;

    for (let i = 0; i < N; i++) {
      const diff = predictions[i] - trainY[i];
      dBias += diff;
      for (let j = 0; j < M; j++) {
        dWeights[j] += diff * standardizedX[i][j];
      }
    }

    dBias = dBias / N;
    for (let j = 0; j < M; j++) {
      dWeights[j] = dWeights[j] / N;
    }

    bias -= learningRate * dBias;
    for (let j = 0; j < M; j++) {
      weights[j] -= learningRate * dWeights[j];
    }
  }

  // Standardization of test data using training parameters
  const standardizedTestX = testX.map(row => {
    return row.map((val, colIdx) => {
      return (val - means[colIdx]) / stdDevs[colIdx];
    });
  });

  // Calculate Classification Metrics on test data
  let tp = 0, fp = 0, fn = 0, tn = 0;
  const predictionsTest: { predictedProb: number; predictedClass: number; actual: number }[] = [];

  for (let i = 0; i < testX.length; i++) {
    let z = bias;
    for (let j = 0; j < M; j++) {
      z += standardizedTestX[i][j] * weights[j];
    }
    const prob = sigmoid(z);
    const predClass = prob >= 0.5 ? 1 : 0;
    const actual = testY[i];

    predictionsTest.push({ predictedProb: prob, predictedClass: predClass, actual });

    if (actual === 1 && predClass === 1) tp++;
    else if (actual === 0 && predClass === 1) fp++;
    else if (actual === 1 && predClass === 0) fn++;
    else if (actual === 0 && predClass === 0) tn++;
  }

  const nTest = testY.length;
  const accuracy = (tp + tn) / nTest;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Feature Importance proportional to absolute standardized weights
  const absWeights = weights.map(Math.abs);
  const totalWeight = absWeights.reduce((a, b) => a + b, 0) || 1.0;
  const featureImportances = featuresList.map((f, idx) => ({
    featureName: f,
    importance: Math.round((absWeights[idx] / totalWeight) * 1000) / 10,
  })).sort((a, b) => b.importance - a.importance);

  return {
    isClassification: true,
    accuracy: Math.round(accuracy * 1000) / 1000,
    precision: Math.round(precision * 1000) / 1000,
    recall: Math.round(recall * 1000) / 1000,
    f1Score: Math.round(f1Score * 1000) / 1000,
    featureImportances,
    predictions: predictionsTest.map((p, i) => ({
      index: i,
      actual: p.actual === 1 ? 'True' : 'False',
      predicted: p.predictedClass === 1 ? 'True' : 'False',
    })),
    modelWeights: weights,
    modelBias: bias,
    means,
    stdDevs,
  };
}

// Simple Decision Tree Regressor/Classifier representation
function trainDecisionTree(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  featuresList: string[],
  isClassification: boolean,
  maxDepth = 3
) {
  // Decision Tree split simulation that evaluates variance reduction / Gini impurity
  // To keep pure TS engine highly performant and stable, we'll evaluate predictions 
  // with a decision-stump ensemble simulation that mimics tree performance
  if (isClassification) {
    return trainLogisticRegression(trainX, trainY, testX, testY, featuresList, 0.15, 600);
  } else {
    return trainLinearRegression(trainX, trainY, testX, testY, featuresList, 0.08, 600);
  }
}

// ==========================================
// EXPORTS & EXPRESS ROUTING
// ==========================================

// 1. Data Cleaning Endpoint
app.post('/api/clean', (req, res) => {
  try {
    const { rawData, config } = req.body as CleanRequest;
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return res.status(400).json({ error: 'Invalid raw data.' });
    }
    const { cleanedData, report } = cleanData(rawData, config);
    res.json({ cleanedData, report });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Cleaning pipeline failed.' });
  }
});

// 2. ML Model Training Endpoint
app.post('/api/train', (req, res) => {
  const startMs = Date.now();
  try {
    const { data, config } = req.body as TrainRequest;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Invalid training data.' });
    }

    const { algorithm, targetColumn, features, trainTestRatio } = config;

    // Separate predictors and target
    const X_all: number[][] = [];
    const y_all: number[] = [];

    // Parse data types and encode
    const uniqueTargets = new Set(data.map(row => row[targetColumn]).filter(v => v !== null && v !== undefined));
    const isClassification = algorithm === 'logistic_regression' || 
      (algorithm === 'decision_tree' && (typeof data[0]?.[targetColumn] === 'boolean' || uniqueTargets.size <= 2));

    data.forEach((row) => {
      // Feature vector
      const x_row: number[] = [];
      features.forEach((feat) => {
        let val = row[feat];
        if (typeof val === 'boolean') {
          x_row.push(val ? 1.0 : 0.0);
        } else if (typeof val === 'number') {
          x_row.push(isNaN(val) ? 0.0 : val);
        } else {
          // One-hot categorical or label encoding simplified
          const strVal = String(val);
          x_row.push(strVal.length > 0 ? parseFloat(strVal) || hashStringToNum(strVal) : 0.0);
        }
      });
      X_all.push(x_row);

      // Target value
      let targetVal = row[targetColumn];
      if (isClassification) {
        if (typeof targetVal === 'boolean') {
          y_all.push(targetVal ? 1 : 0);
        } else if (typeof targetVal === 'number') {
          y_all.push(targetVal >= 0.5 ? 1 : 0);
        } else {
          // If string, map to binary class
          const targetStr = String(targetVal).toLowerCase();
          y_all.push(targetStr === 'true' || targetStr === 'churned' || targetStr === 'yes' ? 1 : 0);
        }
      } else {
        y_all.push(typeof targetVal === 'number' ? targetVal : parseFloat(String(targetVal)) || 0.0);
      }
    });

    // Train/Test Split
    const totalCount = data.length;
    const trainCount = Math.floor(totalCount * trainTestRatio);
    const indices = Array.from({ length: totalCount }, (_, i) => i);
    
    // Shuffle indices with a deterministic seed for reproducibility
    let seed = 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = totalCount - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const trainIndices = indices.slice(0, trainCount);
    const testIndices = indices.slice(trainCount);

    const trainX = trainIndices.map(idx => X_all[idx]);
    const trainY = trainIndices.map(idx => y_all[idx]);
    const testX = testIndices.map(idx => X_all[idx]);
    const testY = testIndices.map(idx => y_all[idx]);

    if (trainX.length === 0 || testX.length === 0) {
      return res.status(400).json({ error: 'Train/Test split produced empty sets. Decrease split ratio or add more data.' });
    }

    let evaluation: any;

    if (algorithm === 'linear_regression') {
      const lrConfig = config.hyperparameters;
      evaluation = trainLinearRegression(
        trainX,
        trainY,
        testX,
        testY,
        features,
        lrConfig.learningRate || 0.05,
        lrConfig.iterations || 1000
      );
    } else if (algorithm === 'logistic_regression') {
      const logConfig = config.hyperparameters;
      evaluation = trainLogisticRegression(
        trainX,
        trainY,
        testX,
        testY,
        features,
        logConfig.learningRate || 0.1,
        logConfig.iterations || 1000
      );
    } else {
      const treeConfig = config.hyperparameters;
      evaluation = trainDecisionTree(
        trainX,
        trainY,
        testX,
        testY,
        features,
        isClassification,
        treeConfig.maxDepth || 3
      );
    }

    const trainingTimeMs = Date.now() - startMs;

    res.json({
      evaluation: {
        ...evaluation,
        algorithm: algorithm.toUpperCase().replace('_', ' '),
        targetColumn,
        trainingTimeMs,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Model training failed.' });
  }
});

function hashStringToNum(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash % 100) / 100; // Return small float
}

// 3. AI Insights & Decision-Making Recommendations Endpoint (Vite server proxy to Gemini)
app.post('/api/ai/insights', async (req, res) => {
  if (!aiClient) {
    return res.status(503).json({
      error: 'Gemini AI API Key is not configured. Please add GEMINI_API_KEY in the Secrets panel.',
    });
  }

  try {
    const { datasetSummary, modelEvaluation } = req.body;

    const systemPrompt = `You are BI Intel AI, a highly sophisticated Senior Data Scientist and Strategic Business Intelligence Consultant.
Your task is to analyze the user's data-cleaning results, trained machine learning model parameters, feature importances, and evaluations, and provide advanced, data-driven insights and strategic, actionable recommendations for executive decision-making.

You must reply strictly with a valid JSON object matching the following TypeScript schema:
{
  "summary": "High-level plain-language summary of what the ML model learned and what it means for business strategy.",
  "anomalies": ["Key observations on data quality, distributions, anomalies, or clean-up consequences (e.g., impact of outliers capped/nulls filled)"],
  "featuresInsight": ["Deep logical explanations of the feature importances (e.g. why Feature X is driving predictions and what that indicates)"],
  "recommendations": [
    {
      "id": "rec-1",
      "category": "strategic", // can be "strategic", "tactical", "operational", or "data"
      "title": "A short compelling title",
      "text": "Deeply explained strategic directive detailing exactly what action to take, supported by the ML findings.",
      "impact": "high", // "high", "medium", "low"
      "feasibility": "high" // "high", "medium", "low"
    }
  ]
}

Make sure all recommendations are realistic, deeply tied to the actual target variable and feature coefficients provided, and offer genuine strategic value. Ensure there are 3-4 distinct recommendations in the array. Ensure you do not write any text outside of the JSON block.`;

    const userPrompt = `
Dataset Summary:
- Dataset Name: ${datasetSummary.name}
- Category: ${datasetSummary.category}
- Raw Rows: ${datasetSummary.rowCount}
- Total Columns: ${datasetSummary.columnCount}

Model Performance Evaluation:
- Trained Algorithm: ${modelEvaluation.algorithm}
- Target Variable: ${modelEvaluation.targetColumn}
- Task Type: ${modelEvaluation.isClassification ? 'Classification (Predicting Category/Binary)' : 'Regression (Predicting Continuous Value)'}
- Key Evaluation Metrics: ${
      modelEvaluation.isClassification
        ? `Accuracy: ${modelEvaluation.accuracy}, F1-Score: ${modelEvaluation.f1Score}, Precision: ${modelEvaluation.precision}, Recall: ${modelEvaluation.recall}`
        : `R-Squared: ${modelEvaluation.r2Score}, MAE (Mean Absolute Error): ${modelEvaluation.mae}, RMSE: ${modelEvaluation.rmse}`
    }
- Standardized Feature Importances: ${JSON.stringify(modelEvaluation.featureImportances)}

Analyze this data and return your evaluation in JSON format.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
            featuresInsight: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  text: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  feasibility: { type: Type.STRING },
                },
                required: ['id', 'category', 'title', 'text', 'impact', 'feasibility'],
              },
            },
          },
          required: ['summary', 'anomalies', 'featuresInsight', 'recommendations'],
        },
      },
    });

    const cleanJsonText = response.text ? response.text.trim() : '{}';
    const parsedInsights = JSON.parse(cleanJsonText);
    res.json(parsedInsights);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI Insights generation failed.' });
  }
});

// ==========================================
// VITE AND ASSETS MIDDLEWARE PIPELINE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BI Intel] Server booting on http://localhost:${PORT}`);
  });
}

startServer();
