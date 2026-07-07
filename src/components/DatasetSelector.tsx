import React, { useState, useRef } from 'react';
import { Dataset, ColumnMetadata, ColumnType } from '../types';
import { defaultDatasets } from '../data/datasets';
import { Database, Upload, CheckCircle, FileSpreadsheet, Layers, Info, Search, X } from 'lucide-react';

interface DatasetSelectorProps {
  selectedDataset: Dataset | null;
  onDatasetSelect: (dataset: Dataset) => void;
}

export default function DatasetSelector({ selectedDataset, onDatasetSelect }: DatasetSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectDefault = (dataset: Dataset) => {
    onDatasetSelect(JSON.parse(JSON.stringify(dataset))); // Deep copy to prevent state mutation
  };

  // Robust client-side CSV parser
  const parseCSV = (text: string): Record<string, any>[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Parse headers, strip quotes
    const headers = parseCSVLine(lines[0]);
    const results: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseCSVLine(lines[i]);
      const row: Record<string, any> = {};

      headers.forEach((header, index) => {
        const rawVal = values[index] !== undefined ? values[index].trim() : '';
        if (rawVal === '') {
          row[header] = null;
        } else if (rawVal.toLowerCase() === 'true') {
          row[header] = true;
        } else if (rawVal.toLowerCase() === 'false') {
          row[header] = false;
        } else if (!isNaN(Number(rawVal)) && rawVal !== '') {
          row[header] = Number(rawVal);
        } else {
          row[header] = rawVal;
        }
      });
      results.push(row);
    }
    return results;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^["']|["']$/g, ''));
    return result;
  };

  const processUploadedFile = (file: File) => {
    setUploadError(null);
    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        if (parsedData.length === 0) {
          setUploadError('No data found in the uploaded CSV.');
          return;
        }

        // Infer column metadata
        const keys = Object.keys(parsedData[0]);
        const columns: ColumnMetadata[] = keys.map((key) => {
          const vals = parsedData.map(row => row[key]).filter(v => v !== null && v !== undefined);
          const distinct = new Set(vals);
          
          let type: ColumnType = 'text';
          const firstVal = vals[0];
          if (typeof firstVal === 'number') type = 'numeric';
          else if (typeof firstVal === 'boolean') type = 'boolean';
          else if (distinct.size <= 5) type = 'categorical';

          const missingCount = parsedData.length - vals.length;

          const metadata: ColumnMetadata = {
            name: key,
            type,
            missingCount,
            distinctValuesCount: distinct.size,
            sampleValues: Array.from(distinct).slice(0, 5).map(String),
          };

          if (type === 'numeric') {
            const numVals = vals as number[];
            const sum = numVals.reduce((a, b) => a + b, 0);
            const mean = sum / (numVals.length || 1);
            metadata.mean = Math.round(mean * 100) / 100;
            metadata.min = Math.min(...numVals);
            metadata.max = Math.max(...numVals);
          }

          return metadata;
        });

        const newDataset: Dataset = {
          id: `upload_${Date.now()}`,
          name: file.name.replace('.csv', ''),
          description: `User-uploaded custom dataset parsed from ${file.name}. Active session dataset.`,
          category: 'Uploaded Data',
          rowCount: parsedData.length,
          columnCount: keys.length,
          columns,
          rawData: parsedData,
        };

        onDatasetSelect(newDataset);
      } catch (err: any) {
        setUploadError(`Failed to parse CSV file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const filteredDatasets = defaultDatasets.filter((ds) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      ds.name.toLowerCase().includes(query) ||
      ds.description.toLowerCase().includes(query) ||
      ds.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6" id="dataset-selector-root">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-line rounded-2xl p-4 shadow-xs" id="dataset-search-bar">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="w-4 h-4 text-text-muted" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets by name, category, or features..."
            className="w-full pl-10 pr-10 py-2.5 bg-panel2/40 border border-line rounded-xl text-xs font-sans text-text placeholder-text-muted focus:outline-hidden focus:ring-1 focus:ring-coral/30 focus:border-coral transition-all"
            id="dataset-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted hover:text-text cursor-pointer"
              title="Clear search"
              id="clear-search-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-text-muted font-mono shrink-0">
          <span>Showing</span>
          <span className="px-2 py-0.5 rounded-md bg-panel2 text-text font-bold">
            {filteredDatasets.length}
          </span>
          <span>of {defaultDatasets.length} available</span>
        </div>
      </div>

      {/* Selection Cards Grid */}
      {filteredDatasets.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center" id="empty-search-state">
          <Database className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-60" />
          <h4 className="font-sans font-medium text-text text-base mb-1">No datasets matched "{searchQuery}"</h4>
          <p className="text-text-muted text-xs max-w-md mx-auto mb-4 leading-relaxed">
            We couldn't find any datasets matching your search criteria. Try using alternative keywords or clearing the filter.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-coral hover:bg-coral/90 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            id="reset-search-btn"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredDatasets.map((ds) => {
            const isSelected = selectedDataset?.id === ds.id;
            return (
              <div
                key={ds.id}
                id={`dataset-card-${ds.id}`}
                onClick={() => handleSelectDefault(ds)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-surface border-coral shadow-sm ring-1 ring-coral/30'
                    : 'bg-surface border-line hover:border-text-muted/40 hover:-translate-y-0.5'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-panel2 text-text-muted text-xs font-mono">
                    {ds.category}
                  </span>
                  {isSelected && <CheckCircle className="w-5 h-5 text-coral shrink-0" />}
                </div>
                <h3 className="font-sans font-semibold text-text text-lg mb-1 leading-tight">
                  {ds.name}
                </h3>
                <p className="text-text-muted text-xs line-clamp-3 mb-4 leading-relaxed">
                  {ds.description}
                </p>
                <div className="flex gap-4 border-t border-line/60 pt-3">
                  <div>
                    <div className="text-[10px] text-text-muted font-mono uppercase">Rows</div>
                    <div className="text-sm font-mono font-medium text-text">{ds.rowCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted font-mono uppercase">Features</div>
                    <div className="text-sm font-mono font-medium text-text">{ds.columnCount}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSV Drag & Drop Upload */}
      <div
        id="csv-dropzone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-coral bg-coral/5'
            : 'border-line hover:border-text-muted/40 hover:bg-surface bg-panel2/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <h3 className="font-sans font-medium text-text text-base mb-1">
          Drag and drop your raw CSV dataset here
        </h3>
        <p className="text-text-muted text-xs mb-3">
          Or click to browse files (limitations: clean headers required, up to 10MB)
        </p>
        {uploadError && (
          <p className="text-amber text-xs font-semibold bg-amber/10 inline-block px-3 py-1 rounded-lg">
            {uploadError}
          </p>
        )}
      </div>

      {/* Active Dataset Overview & Table Preview */}
      {selectedDataset && (
        <div className="bg-surface border border-line rounded-2xl p-6 space-y-6" id="dataset-preview-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-5 h-5 text-coral" />
                <h3 className="font-sans font-semibold text-text text-lg leading-none">
                  Active Dataset: {selectedDataset.name}
                </h3>
              </div>
              <p className="text-text-muted text-xs leading-relaxed">
                {selectedDataset.description}
              </p>
            </div>
            <div className="flex items-center gap-4 bg-panel2/50 px-4 py-2 rounded-xl border border-line/40 font-mono text-xs">
              <div>
                <span className="text-text-muted">ROWS: </span>
                <span className="font-semibold text-text">{selectedDataset.rowCount}</span>
              </div>
              <div className="w-px h-3 bg-line" />
              <div>
                <span className="text-text-muted">COLS: </span>
                <span className="font-semibold text-text">{selectedDataset.columnCount}</span>
              </div>
            </div>
          </div>

          {/* Features / Columns Metadata Details */}
          <div>
            <h4 className="font-sans font-semibold text-text text-sm mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-text-muted" />
              Column Definitions & Stats
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDataset.columns.map((col) => (
                <div key={col.name} className="p-3.5 rounded-xl bg-panel2 border border-line/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-medium text-xs text-text truncate max-w-[150px]" title={col.name}>
                        {col.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-surface border border-line/55 text-text-muted">
                        {col.type}
                      </span>
                    </div>
                    {col.type === 'numeric' && col.mean !== undefined && (
                      <div className="space-y-0.5 font-mono text-[10px] text-text-muted">
                        <div>MEAN: <span className="text-text font-medium">{col.mean}</span></div>
                        <div>RANGE: <span className="text-text font-medium">{col.min} to {col.max}</span></div>
                      </div>
                    )}
                    {col.type !== 'numeric' && (
                      <div className="font-mono text-[10px] text-text-muted">
                        SAMPLES: <span className="text-text font-medium truncate inline-block max-w-[150px]" title={col.sampleValues.join(', ')}>{col.sampleValues.slice(0,3).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-line/30 flex justify-between font-mono text-[9px] text-text-muted">
                    <span>MISSING: <span className={col.missingCount > 0 ? 'text-amber font-semibold' : 'text-text-muted'}>{col.missingCount}</span></span>
                    <span>DISTINCT: <span className="text-text font-semibold">{col.distinctValuesCount}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Table Preview */}
          <div>
            <h4 className="font-sans font-semibold text-text text-sm mb-3 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-text-muted" />
              Raw Data Snapshot (First 8 Rows)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-line/75">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-panel2 border-b border-line text-text-muted font-medium">
                    {selectedDataset.columns.map((col) => (
                      <th key={col.name} className="px-4 py-2.5 whitespace-nowrap">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40 bg-surface">
                  {selectedDataset.rawData.slice(0, 8).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-panel2/20">
                      {selectedDataset.columns.map((col) => {
                        const cellVal = row[col.name];
                        return (
                          <td key={col.name} className="px-4 py-2.5 whitespace-nowrap text-text max-w-[200px] truncate">
                            {cellVal === null || cellVal === undefined ? (
                              <span className="text-amber/70 font-semibold uppercase text-[10px] tracking-wide bg-amber/5 px-1.5 py-0.5 rounded border border-amber/10">NULL</span>
                            ) : typeof cellVal === 'boolean' ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cellVal ? 'bg-teal/5 text-teal border-teal/15' : 'bg-text-muted/5 text-text-muted border-text-muted/15'}`}>
                                {cellVal ? 'TRUE' : 'FALSE'}
                              </span>
                            ) : (
                              String(cellVal)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-panel2/60 border border-line/40 rounded-xl text-xs text-text-muted">
            <Info className="w-4 h-4 text-coral" />
            <span>Dataset has been successfully parsed. Review features and values, then proceed to the <strong>Data Cleaning</strong> stage to handle missing values and scale data.</span>
          </div>
        </div>
      )}
    </div>
  );
}
