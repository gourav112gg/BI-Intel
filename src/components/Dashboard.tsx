import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Dataset, ModelConfig, ModelEvaluation, AIInsights, AIRecommendation } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Line,
  LineChart,
  ZAxis,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Brain,
  Sliders,
  Sparkles,
  FileText,
  AlertTriangle,
  Award,
  Download,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface DashboardProps {
  dataset: Dataset;
  modelConfig: ModelConfig;
  modelEvaluation: ModelEvaluation;
  theme?: 'light' | 'dark';
}

export default function Dashboard({ dataset, modelConfig, modelEvaluation, theme = 'light' }: DashboardProps) {
  const [simulatorInputs, setSimulatorInputs] = useState<Record<string, number>>({});
  const [simResult, setSimResult] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const handleExportPDF = () => {
    if (!aiInsights) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let y = 45;

    // Title Block on Page 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 26, 41);
    doc.text('Predictive Analysis & Decisions Report', 20, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(115, 125, 140);
    const subtitle = `DATASET: ${dataset.name.toUpperCase()}  |  ALGORITHM: ${modelConfig.algorithm.toUpperCase().replace('_', ' ')}`;
    doc.text(subtitle, 20, 34);

    // Draw a horizontal line separating title from main content
    doc.setDrawColor(220, 225, 234);
    doc.setLineWidth(0.4);
    doc.line(20, 39, 190, 39);

    // Helper to add wrapped paragraphs to handle auto-pagination
    const addWrappedParagraph = (textStr: string, fontSize: number, isBold: boolean, color: [number, number, number], spacingAfter: number = 5) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      
      const lines = doc.splitTextToSize(textStr, 170);
      const lineHeight = fontSize * 0.45; // mm per line approx
      const blockHeight = lines.length * lineHeight;
      
      if (y + blockHeight > 265) {
        doc.addPage();
        y = 30; // Margin top for subsequent pages
      }
      
      lines.forEach((line: string) => {
        doc.text(line, 20, y);
        y += lineHeight;
      });
      
      y += spacingAfter;
    };

    // 1. Dataset Profile
    addWrappedParagraph('1. DATASET PROFILE & PIPELINE SUMMARY', 10, true, [20, 26, 41], 4);
    
    // Grid of Metadata using local relative text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 80, 95);
    doc.text(`Dataset Name: ${dataset.name}`, 20, y);
    doc.text(`Total Observations (Rows): ${dataset.rowCount}`, 105, y);
    y += 4.5;
    doc.text(`Target Response Variable (Y): ${modelConfig.targetColumn}`, 20, y);
    doc.text(`Train / Test Partition Ratio: ${modelConfig.trainTestRatio * 100}% / ${(1 - modelConfig.trainTestRatio) * 100}%`, 105, y);
    y += 10;

    // 2. Evaluation Metrics Block
    addWrappedParagraph('2. MODEL OPTIMIZATION & PERFORMANCE METRICS', 10, true, [20, 26, 41], 4);
    
    // Draw metrics box
    const boxHeight = 35;
    const boxWidth = 170;
    
    doc.setFillColor(244, 246, 249); // light background panel
    doc.rect(20, y, boxWidth, boxHeight, 'F');
    doc.setDrawColor(220, 225, 234);
    doc.setLineWidth(0.3);
    doc.rect(20, y, boxWidth, boxHeight, 'D');
    
    // Divider lines inside the box
    doc.line(20 + boxWidth / 2, y, 20 + boxWidth / 2, y + boxHeight); // vertical divider
    doc.line(20, y + boxHeight / 2, 190, y + boxHeight / 2); // horizontal divider
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(115, 125, 140);
    
    if (modelEvaluation.isClassification) {
      const accuracy = `${Math.round((modelEvaluation.accuracy || 0) * 1000) / 10}%`;
      const f1 = `${modelEvaluation.f1Score}`;
      const precision = `${modelEvaluation.precision}`;
      const recall = `${modelEvaluation.recall}`;
      
      // Quadrant 1 (Top Left)
      doc.text('MODEL ACCURACY', 25, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 26, 41);
      doc.text(accuracy, 25, y + 13);
      
      // Quadrant 2 (Top Right)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(115, 125, 140);
      doc.text('F1-SCORE', 25 + boxWidth / 2, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 95, 69); // Coral color
      doc.text(f1, 25 + boxWidth / 2, y + 13);
      
      // Quadrant 3 (Bottom Left)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(115, 125, 140);
      doc.text('PRECISION', 25, y + 23);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 26, 41);
      doc.text(precision, 25, y + 30);
      
      // Quadrant 4 (Bottom Right)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(115, 125, 140);
      doc.text('RECALL', 25 + boxWidth / 2, y + 23);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 26, 41);
      doc.text(recall, 25 + boxWidth / 2, y + 30);
    } else {
      const r2 = `${modelEvaluation.r2Score}`;
      const mae = `${modelEvaluation.mae}`;
      const rmse = `${modelEvaluation.rmse}`;
      const lat = `${modelEvaluation.trainingTimeMs} ms`;
      
      // Quadrant 1 (Top Left)
      doc.text('R-SQUARED COEFFICIENT', 25, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 26, 41);
      doc.text(r2, 25, y + 13);
      
      // Quadrant 2 (Top Right)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(115, 125, 140);
      doc.text('MEAN ABSOLUTE ERROR', 25 + boxWidth / 2, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 95, 69); // Coral color
      doc.text(mae, 25 + boxWidth / 2, y + 13);
      
      // Quadrant 3 (Bottom Left)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(115, 125, 140);
      doc.text('RMSE (ERROR STD DEV)', 25, y + 23);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 26, 41);
      doc.text(rmse, 25, y + 30);
      
      // Quadrant 4 (Bottom Right)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(115, 125, 140);
      doc.text('OPTIMIZATION LATENCY', 25 + boxWidth / 2, y + 23);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 26, 41);
      doc.text(lat, 25 + boxWidth / 2, y + 30);
    }
    y += boxHeight + 8;

    // 3. AI Insights Block
    addWrappedParagraph('3. AI MACHINE LEARNING EXECUTIVE BRIEF', 10, true, [20, 26, 41], 4);
    addWrappedParagraph(aiInsights.summary, 8.5, false, [70, 80, 95], 8);

    // 4. Feature coefficients table
    addWrappedParagraph('4. PREDICTOR FEATURE COEFFICIENT IMPORTANCES', 10, true, [20, 26, 41], 4);
    
    // Draw table header background
    doc.setFillColor(240, 243, 246);
    doc.rect(20, y, 170, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(50, 60, 80);
    doc.text('PREDICTOR VARIABLE (FEATURE NAME)', 25, y + 4);
    doc.text('RAW IMPACT PERCENTAGE (COEFFICIENT WEIGHT)', 185, y + 4, { align: 'right' });
    y += 6;

    modelEvaluation.featureImportances.forEach((feat, idx) => {
      if (y + 6 > 265) {
        doc.addPage();
        y = 30;
        // Redraw header
        doc.setFillColor(240, 243, 246);
        doc.rect(20, y, 170, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(50, 60, 80);
        doc.text('PREDICTOR VARIABLE (FEATURE NAME)', 25, y + 4);
        doc.text('RAW IMPACT PERCENTAGE (COEFFICIENT WEIGHT)', 185, y + 4, { align: 'right' });
        y += 6;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(250, 251, 253);
        doc.rect(20, y, 170, 6, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(70, 80, 95);
      doc.text(feat.featureName, 25, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.text(`${feat.importance.toFixed(1)}%`, 185, y + 4, { align: 'right' });
      y += 6;
    });
    y += 8;

    // 5. Strategic business recommendations
    addWrappedParagraph('5. STRATEGIC DIRECTIVE RECOMMENDATIONS', 10, true, [20, 26, 41], 4);

    aiInsights.recommendations.forEach((rec) => {
      const titleLines = doc.splitTextToSize(rec.title, 160);
      const textLines = doc.splitTextToSize(rec.text, 160);
      
      const cardHeaderHeight = 5;
      const tHeight = titleLines.length * 4;
      const bHeight = textLines.length * 3.5;
      const padding = 6;
      const totalCardHeight = cardHeaderHeight + tHeight + bHeight + padding;
      
      if (y + totalCardHeight > 265) {
        doc.addPage();
        y = 30;
      }
      
      // Draw card box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 225, 234);
      doc.setLineWidth(0.25);
      doc.rect(20, y, 170, totalCardHeight, 'FD');
      
      // Accent top line
      doc.setFillColor(255, 95, 69);
      doc.rect(20, y, 170, 0.8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(115, 125, 140);
      doc.text(`CATEGORY: ${rec.category.toUpperCase()}`, 24, y + 4);
      doc.text(`IMPACT: ${rec.impact.toUpperCase()}  |  FEASIBILITY: ${rec.feasibility.toUpperCase()}`, 186, y + 4, { align: 'right' });
      
      let cardY = y + 8;
      
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 26, 41);
      titleLines.forEach((line: string) => {
        doc.text(line, 24, cardY);
        cardY += 4;
      });
      
      cardY += 1;
      
      // Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(70, 80, 95);
      textLines.forEach((line: string) => {
        doc.text(line, 24, cardY);
        cardY += 3.5;
      });
      
      y += totalCardHeight + 4;
    });

    // Finalize Headers and Footers on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Top accent line
      doc.setFillColor(20, 26, 41);
      doc.rect(20, 15, 170, 1.2, 'F');
      
      // Header Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(115, 125, 140);
      doc.text('BI INTEL · EXECUTIVE STRATEGIC PERFORMANCE REPORT', 20, 11);
      
      const dateStr = new Date().toLocaleDateString();
      doc.text(`GENERATED: ${dateStr}`, 190, 11, { align: 'right' });
      
      // Footer Divider
      doc.setDrawColor(220, 225, 234);
      doc.setLineWidth(0.2);
      doc.line(20, 280, 190, 280);
      
      // Footer Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(115, 125, 140);
      doc.text('CONFIDENTIAL · FOR INTERNAL DECISION-MAKING PURPOSES ONLY', 20, 285);
      doc.text(`Page ${i} of ${totalPages}`, 190, 285, { align: 'right' });
    }

    doc.save(`BI-Intel-Report-${dataset.name.replace(/\s+/g, '-')}.pdf`);
  };

  // Initialize simulator inputs based on average values of features
  useEffect(() => {
    if (!modelConfig || !modelConfig.features) return;

    const initialInputs: Record<string, number> = {};
    modelConfig.features.forEach((feat) => {
      const colMeta = dataset.columns.find((c) => c.name === feat);
      if (colMeta && colMeta.type === 'numeric' && colMeta.mean !== undefined) {
        initialInputs[feat] = colMeta.mean;
      } else {
        initialInputs[feat] = 0;
      }
    });

    setSimulatorInputs(initialInputs);
  }, [modelConfig, dataset]);

  // Dynamically calculate simulator predictions client-side
  useEffect(() => {
    if (
      Object.keys(simulatorInputs).length === 0 ||
      !modelEvaluation ||
      !modelEvaluation.modelWeights
    )
      return;

    const weights = modelEvaluation.modelWeights;
    const bias = modelEvaluation.modelBias || 0;
    const means = modelEvaluation.means || [];
    const stdDevs = modelEvaluation.stdDevs || [];

    let z = bias;

    modelConfig.features.forEach((feat, idx) => {
      const val = simulatorInputs[feat] !== undefined ? simulatorInputs[feat] : 0;
      const mean = means[idx] !== undefined ? means[idx] : 0;
      const std = stdDevs[idx] !== undefined && stdDevs[idx] !== 0 ? stdDevs[idx] : 1;

      // Standardize input
      const standardizedVal = (val - mean) / std;
      z += standardizedVal * weights[idx];
    });

    if (modelEvaluation.isClassification) {
      const prob = 1 / (1 + Math.exp(-z));
      setSimResult({
        class: prob >= 0.5 ? 'TRUE' : 'FALSE',
        probability: Math.round(prob * 1000) / 10,
      });
    } else {
      // Regression with standard error band
      const residualSum = modelEvaluation.predictions.reduce(
        (sum, pred) => sum + Math.pow(Number(pred.predicted) - Number(pred.actual), 2),
        0
      );
      const stdError = Math.sqrt(residualSum / (modelEvaluation.predictions.length || 1));

      setSimResult({
        value: Math.round(z * 100) / 100,
        lower: Math.round((z - 1.96 * stdError) * 100) / 100,
        upper: Math.round((z + 1.96 * stdError) * 100) / 100,
      });
    }
  }, [simulatorInputs, modelEvaluation, modelConfig]);

  // Fetch AI Insights and Recommendations on model training completion
  useEffect(() => {
    const fetchAIInsights = async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const response = await fetch('/api/ai/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            datasetSummary: {
              name: dataset.name,
              category: dataset.category,
              rowCount: dataset.rowCount,
              columnCount: dataset.columnCount,
            },
            modelEvaluation,
          }),
        });

        if (!response.ok) {
          throw new Error('Could not retrieve insights from server.');
        }

        const data = await response.json();
        setAiInsights(data);
      } catch (err: any) {
        setAiError(err.message || 'Failed to fetch AI Insights.');
      } finally {
        setAiLoading(false);
      }
    };

    fetchAIInsights();
  }, [modelEvaluation, dataset]);

  const handleSliderChange = (feat: string, val: number) => {
    setSimulatorInputs({
      ...simulatorInputs,
      [feat]: val,
    });
  };

  // Setup actual vs predicted chart data
  const chartData = modelEvaluation.predictions.map((p) => ({
    index: p.index + 1,
    actual: typeof p.actual === 'number' ? p.actual : p.actual === 'True' ? 1 : 0,
    predicted: typeof p.predicted === 'number' ? p.predicted : p.predicted === 'True' ? 1 : 0,
  }));

  // Standardized weight feature chart data
  const featureChartData = [...modelEvaluation.featureImportances]
    .sort((a, b) => b.importance - a.importance)
    .map((f) => ({
      name: f.featureName,
      importance: f.importance,
    }));

  return (
    <div className="space-y-6" id="dashboard-root">
      {/* Dashboard Sub-Header / Tool Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-line rounded-2xl p-5 shadow-xs" id="dashboard-header-bar">
        <div>
          <h3 className="font-sans font-bold text-text text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-coral" />
            Performance & Insights Suite
          </h3>
          <p className="text-text-muted text-xs leading-relaxed mt-1">
            Audit system metrics, adjust simulated scenario inputs, and download the full AI strategic brief.
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={aiLoading || !aiInsights}
          className="px-4 py-2.5 bg-coral text-white hover:bg-coral/90 disabled:bg-text-muted/20 disabled:text-text-muted/60 disabled:cursor-not-allowed rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
          id="export-pdf-btn"
        >
          {aiLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing...</span>
            </>
          ) : !aiInsights ? (
            <>
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span>Export Report (PDF)</span>
            </>
          )}
        </button>
      </div>

      {/* 1. Evaluation metrics panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-grid">
        {modelEvaluation.isClassification ? (
          <>
            <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted font-mono uppercase">Model Accuracy</span>
              <div className="text-2xl font-mono font-bold text-text mt-2">
                {Math.round((modelEvaluation.accuracy || 0) * 1000) / 10}%
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Overall correct test classification rate.
              </p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted font-mono uppercase">F1-Score</span>
              <div className="text-2xl font-mono font-bold text-coral mt-2">
                {modelEvaluation.f1Score}
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Harmonic balance between Precision and Recall.
              </p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted font-mono uppercase">Precision</span>
              <div className="text-2xl font-mono font-bold text-text mt-2">
                {modelEvaluation.precision}
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Correctness of classification positive triggers.
              </p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted font-mono uppercase">Recall</span>
              <div className="text-2xl font-mono font-bold text-text mt-2">
                {modelEvaluation.recall}
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Ability to identify all true positive instances.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted font-mono uppercase">R-Squared Coefficient</span>
              <div className="text-2xl font-mono font-bold text-text mt-2">
                {modelEvaluation.r2Score}
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Proportion of variance explained by model predictors.
              </p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted font-mono uppercase">Mean Absolute Error</span>
              <div className="text-2xl font-mono font-bold text-coral mt-2">
                {modelEvaluation.mae}
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Average absolute distance between predictions and actual targets.
              </p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted font-mono uppercase">RMSE (Error Standard Deviation)</span>
              <div className="text-2xl font-mono font-bold text-text mt-2">
                {modelEvaluation.rmse}
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Root Mean Squared Error penalizing large outliers.
              </p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted font-mono uppercase">Optimization Latency</span>
              <div className="text-2xl font-mono font-bold text-text mt-2">
                {modelEvaluation.trainingTimeMs} ms
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Processing time required to reach gradient convergence.
              </p>
            </div>
          </>
        )}
      </div>

      {/* 2. Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-grid">
        {/* Feature Importance Bar Chart - 5 cols */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-2xl p-5 space-y-4">
          <h3 className="font-sans font-semibold text-text text-base flex items-center gap-1.5">
            <Brain className="w-5 h-5 text-coral" />
            Relative Feature Coefficients
          </h3>
          <p className="text-text-muted text-xs leading-relaxed">
            Standardized magnitude weights displaying each predictor variable's raw impact percentage on target estimations.
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureChartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2D3954' : '#DCE1EA'} horizontal={false} />
                <XAxis type="number" stroke={theme === 'dark' ? '#9CA3AF' : '#5B6478'} fontSize={10} fontFamily="monospace" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={theme === 'dark' ? '#9CA3AF' : '#5B6478'}
                  fontSize={10}
                  fontFamily="monospace"
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    borderRadius: '8px',
                    borderColor: theme === 'dark' ? '#2D3954' : '#DCE1EA',
                    backgroundColor: theme === 'dark' ? '#141A29' : '#FFFFFF',
                    color: theme === 'dark' ? '#F3F4F6' : '#10141F',
                  }}
                />
                <Bar dataKey="importance" fill="#FF5F45" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictions Fit Chart - 7 cols */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-5 space-y-4">
          <h3 className="font-sans font-semibold text-text text-base flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-teal" />
            Predictions vs. Actual Values Fit
          </h3>
          <p className="text-text-muted text-xs leading-relaxed">
            Validation plot overlaying estimated outputs vs true values. Overlapping points denote strong coefficient fit.
          </p>
          <div className="h-[280px]">
            {modelEvaluation.isClassification ? (
              // Classification probability/category fit chart
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2D3954' : '#DCE1EA'} />
                  <XAxis dataKey="index" stroke={theme === 'dark' ? '#9CA3AF' : '#5B6478'} fontSize={10} fontFamily="monospace" label={{ value: 'Test Record ID', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis ticks={[0, 1]} stroke={theme === 'dark' ? '#9CA3AF' : '#5B6478'} fontSize={10} fontFamily="monospace" tickFormatter={(v) => v === 1 ? 'TRUE' : 'FALSE'} />
                  <Tooltip
                    contentStyle={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      borderRadius: '8px',
                      borderColor: theme === 'dark' ? '#2D3954' : '#DCE1EA',
                      backgroundColor: theme === 'dark' ? '#141A29' : '#FFFFFF',
                      color: theme === 'dark' ? '#F3F4F6' : '#10141F',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="actual" stroke="#0FA3A3" strokeWidth={2.5} name="Actual Label" activeDot={{ r: 6 }} />
                  <Line type="step" dataKey="predicted" stroke="#FF5F45" strokeWidth={1.5} name="Estimated Label" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              // Regression continuous fit chart
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2D3954' : '#DCE1EA'} />
                  <XAxis dataKey="index" stroke={theme === 'dark' ? '#9CA3AF' : '#5B6478'} fontSize={10} fontFamily="monospace" label={{ value: 'Test Records Index', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#5B6478'} fontSize={10} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      borderRadius: '8px',
                      borderColor: theme === 'dark' ? '#2D3954' : '#DCE1EA',
                      backgroundColor: theme === 'dark' ? '#141A29' : '#FFFFFF',
                      color: theme === 'dark' ? '#F3F4F6' : '#10141F',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="actual" stroke="#0FA3A3" strokeWidth={2} name="Actual Target (Y)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="predicted" stroke="#FF5F45" strokeWidth={2} name="Estimated Target (Y)" dot={{ r: 3 }} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 3. Predictor Simulator & Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="simulator-summary-section">
        {/* ML Simulator Panel - 6 cols */}
        <div className="lg:col-span-6 bg-surface border border-line rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-semibold text-text text-lg pb-3 border-b border-line flex items-center gap-2">
              <Sliders className="w-5 h-5 text-coral" />
              Real-time Predictive Simulator
            </h3>
            <p className="text-text-muted text-xs leading-relaxed mt-3 mb-6">
              Drag input feature sliders to run the fitted model coefficient equation instantly in your browser and evaluate predicted outcomes.
            </p>

            {/* Sim input sliders list */}
            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {modelConfig.features.map((feat) => {
                const colMeta = dataset.columns.find((c) => c.name === feat);
                const isNumeric = colMeta?.type === 'numeric';
                const currentVal = simulatorInputs[feat] !== undefined ? simulatorInputs[feat] : 0;

                return (
                  <div key={feat} className="space-y-1">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-text font-medium truncate max-w-[200px]" title={feat}>{feat}</span>
                      <span className="text-coral font-bold">{currentVal}</span>
                    </div>

                    {isNumeric ? (
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-text-muted">MIN: {colMeta?.min}</span>
                        <input
                          type="range"
                          min={colMeta?.min || 0}
                          max={colMeta?.max || 100}
                          step={colMeta?.min !== undefined && colMeta?.max !== undefined ? Math.round(((colMeta.max - colMeta.min) / 50) * 100) / 100 || 1 : 1}
                          value={currentVal}
                          onChange={(e) => handleSliderChange(feat, parseFloat(e.target.value))}
                          className="w-full accent-coral"
                        />
                        <span className="font-mono text-[10px] text-text-muted">MAX: {colMeta?.max}</span>
                      </div>
                    ) : (
                      // Binary select box
                      <select
                        value={currentVal}
                        onChange={(e) => handleSliderChange(feat, parseFloat(e.target.value))}
                        className="w-full bg-panel2 border border-line/60 rounded-xl px-3 py-1.5 text-xs text-text font-mono focus:outline-none"
                      >
                        <option value={1}>TRUE (1.0)</option>
                        <option value={0}>FALSE (0.0)</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulator Result Output Display */}
          {simResult && (
            <div className="mt-6 p-5 rounded-2xl bg-panel2 border border-line/65 flex flex-col items-center text-center">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider mb-1">
                Estimated Output Outcome ({modelConfig.targetColumn})
              </span>

              {modelEvaluation.isClassification ? (
                <>
                  <div className="text-3xl font-mono font-black text-text leading-tight">
                    {simResult.class}
                  </div>
                  <div className="text-xs font-mono text-text-muted mt-1.5">
                    Trigger Probability: <strong className="text-coral">{simResult.probability}%</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-mono font-black text-text leading-tight">
                    {simResult.value}
                  </div>
                  <div className="text-xs font-mono text-text-muted mt-1.5">
                    95% Confidence Interval Band:{' '}
                    <strong className="text-text">
                      [{simResult.lower} to {simResult.upper}]
                    </strong>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* AI Analytical Insights - 6 cols */}
        <div className="lg:col-span-6 bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-line mb-4">
              <h3 className="font-sans font-semibold text-text text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-coral" />
                AI Strategic Insights
              </h3>
              <button
                onClick={() => setShowReportModal(true)}
                disabled={aiLoading || !aiInsights}
                className="px-3.5 py-1.5 rounded-xl border border-line hover:border-text text-xs font-mono text-text flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5 text-coral" />
                Executive Report
              </button>
            </div>

            {aiLoading ? (
              <div className="py-24 text-center text-text-muted flex flex-col items-center justify-center">
                <Clock className="w-10 h-10 text-coral animate-spin mb-3" />
                <p className="font-sans font-medium text-sm text-text mb-1">Retrieving AI Insights...</p>
                <p className="text-xs max-w-xs leading-relaxed">
                  Gemini Flash 3.5 is analyzing the trained coefficient matrix and testing error residuals to construct strategic strategic recommendations.
                </p>
              </div>
            ) : aiError ? (
              <div className="py-16 text-center text-text-muted flex flex-col items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-amber mb-3" />
                <p className="font-sans font-medium text-sm text-text mb-1">Retrieving Insights Failed</p>
                <p className="text-xs max-w-xs leading-relaxed mb-4">{aiError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-text text-surface text-xs font-mono rounded-xl hover:bg-text/90"
                >
                  Retry API
                </button>
              </div>
            ) : aiInsights ? (
              <div className="space-y-5">
                {/* Summary */}
                <div className="text-xs text-text leading-relaxed bg-panel2/50 border border-line/40 p-4 rounded-xl">
                  <span className="font-mono font-bold uppercase text-[10px] text-text-muted block mb-1">
                    ML Executive Summary:
                  </span>
                  {aiInsights.summary}
                </div>

                {/* Bullets Insights */}
                <div className="space-y-3">
                  <span className="font-mono font-bold uppercase text-[10px] text-text-muted block">
                    Feature Impact Interpretations:
                  </span>
                  <ul className="space-y-2 font-sans text-xs text-text-muted list-disc pl-4 leading-relaxed">
                    {aiInsights.featuresInsight.slice(0, 3).map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>

                {/* Anomalies alert if any */}
                {aiInsights.anomalies && aiInsights.anomalies.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-mono font-bold uppercase text-[10px] text-text-muted block">
                      Data Quality Observations:
                    </span>
                    <ul className="font-mono text-[10px] text-amber/90 space-y-1 list-none leading-relaxed">
                      {aiInsights.anomalies.slice(0, 2).map((an, i) => (
                        <li key={i} className="flex gap-1.5 items-start">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{an}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-text-muted">
                <Brain className="w-12 h-12 text-line mx-auto mb-3" />
                <p className="text-xs leading-relaxed">AI insights are currently unavailable.</p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-text-muted font-mono uppercase text-right mt-6 border-t border-line/45 pt-3.5">
            MODEL: gemini-3.5-flash · Grounded Analytics
          </div>
        </div>
      </div>

      {/* 4. Strategic Recommendations Cards row */}
      {aiInsights && aiInsights.recommendations && (
        <div className="space-y-4" id="recommendations-container">
          <h3 className="font-sans font-semibold text-text text-base flex items-center gap-1.5">
            <Award className="w-5 h-5 text-coral" />
            Strategic Business Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiInsights.recommendations.map((rec: AIRecommendation, i) => (
              <div key={rec.id || i} className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3 font-mono text-[9px] uppercase">
                    <span className="px-2 py-0.5 rounded-full bg-panel2 text-text-muted font-bold">
                      {rec.category}
                    </span>
                    <span
                      className={`font-semibold ${
                        rec.impact === 'high' ? 'text-coral' : 'text-text-muted'
                      }`}
                    >
                      Impact: {rec.impact}
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-text text-sm mb-2">{rec.title}</h4>
                  <p className="text-text-muted text-xs leading-relaxed font-sans">{rec.text}</p>
                </div>
                <div className="border-t border-line/40 pt-3 mt-4 flex justify-between font-mono text-[10px] text-text-muted">
                  <span>Feasibility: <strong className="text-text">{rec.feasibility}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Report Print-friendly Modal */}
      {showReportModal && aiInsights && (
        <div className="fixed inset-0 bg-text/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="report-modal">
          <div className="bg-surface rounded-3xl max-w-4xl w-full border border-line p-8 space-y-8 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-line">
              <div>
                <div className="text-[10px] text-coral font-mono font-bold uppercase tracking-widest">
                  BI INTEL · EXECUTIVE STRATEGIC DELIVERABLE
                </div>
                <h2 className="font-sans font-black text-text text-2xl leading-tight mt-1">
                  Predictive Analysis & Decisions Report
                </h2>
                <p className="text-text-muted text-xs font-mono mt-0.5">
                  DATASET: {dataset.name} · ALGORITHM: {modelConfig.algorithm.toUpperCase().replace('_', ' ')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-coral text-white hover:bg-coral/90 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-text hover:bg-text/90 text-surface rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Print Report
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-line hover:border-text text-text rounded-xl text-xs font-mono transition-all cursor-pointer"
                >
                  Close Report
                </button>
              </div>
            </div>

            {/* Print Body */}
            <div className="space-y-6 print:space-y-6">
              {/* Stats Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-panel2 rounded-2xl border border-line/50 font-mono">
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Dataset Rows</div>
                  <div className="text-sm font-bold text-text">{dataset.rowCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Target Variable</div>
                  <div className="text-sm font-bold text-text truncate max-w-[150px]">{modelConfig.targetColumn}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Validation Split</div>
                  <div className="text-sm font-bold text-text">{modelConfig.trainTestRatio * 100}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Fit Quality</div>
                  <div className="text-sm font-bold text-text">
                    {modelEvaluation.isClassification
                      ? `Accuracy: ${modelEvaluation.accuracy}`
                      : `R²: ${modelEvaluation.r2Score}`}
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono text-text uppercase tracking-wider">
                  1. Executive Summary
                </h4>
                <p className="font-sans text-xs text-text-muted leading-relaxed">
                  {aiInsights.summary}
                </p>
              </div>

              {/* Coefficient Insights */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono text-text uppercase tracking-wider">
                  2. Dynamic Impact & Feature Coefficient Logic
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 font-sans text-xs text-text-muted leading-relaxed">
                    {aiInsights.featuresInsight.map((ins, i) => (
                      <p key={i}>• {ins}</p>
                    ))}
                  </div>
                  {/* Miniature list of importances */}
                  <div className="bg-panel2/40 rounded-xl p-4 border border-line/40 space-y-2 font-mono text-[11px]">
                    <div className="text-[10px] text-text-muted uppercase font-bold border-b border-line pb-1">
                      Fitted Feature Magnitude Rankings
                    </div>
                    {modelEvaluation.featureImportances.map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-text-muted">
                        <span>{f.featureName}</span>
                        <span className="font-bold text-text">{f.importance}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Recommendations */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold font-mono text-text uppercase tracking-wider">
                  3. Strategic Directive Recommendations
                </h4>
                <div className="space-y-4">
                  {aiInsights.recommendations.map((rec: AIRecommendation, i) => (
                    <div key={i} className="border border-line rounded-xl p-4 font-sans">
                      <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-text-muted uppercase">
                        <span>CATEGORY: {rec.category}</span>
                        <span>IMPACT: {rec.impact}</span>
                      </div>
                      <h5 className="font-bold text-text text-sm mb-1">{rec.title}</h5>
                      <p className="text-text-muted text-xs leading-relaxed">{rec.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center font-mono text-[9px] text-text-muted border-t border-line/60 pt-4 mt-6">
              BI INTEL DECISION SUITE · POWERED BY GEMINI AI · DATED {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
