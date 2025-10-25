import React, { useState, useEffect } from 'react';
import type { ConfusionMatrixValues } from '../types';

interface ConfusionMatrixProps {
  values: ConfusionMatrixValues;
  previousValues?: ConfusionMatrixValues;
  highlightedCells?: Set<string>;
}

interface CellProps { 
  label: string; 
  value: number; 
  percentage: number; 
  colorClass: string; 
  previousValue?: number;
  isHighlighted?: boolean;
}

const Cell: React.FC<CellProps> = ({ label, value, percentage, colorClass, previousValue, isHighlighted }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 700); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [value, previousValue]);

  // Conditionally apply transition for smooth hover, but disable it during animations to prevent conflicts.
  const transitionClass = !(isAnimating || isHighlighted) ? 'transition-all duration-300' : '';
  
  return (
    <div className={`relative group p-4 rounded-lg flex flex-col items-center justify-center ${colorClass} border border-gray-900/50 h-full hover:scale-105 hover:brightness-125 ${transitionClass} ${isAnimating ? 'animate-pulse-cell' : ''} ${isHighlighted ? 'animate-pulse-cell-infinite' : ''}`}>
      <div className="text-lg font-bold text-white uppercase tracking-wider">{label}</div>
      <div className="text-4xl font-extrabold text-white my-1">{value}</div>
      <div className="text-sm text-gray-300">{percentage.toFixed(1)}%</div>
    </div>
  );
};

const TotalCell: React.FC<{ value: number }> = ({ value }) => (
  <div className="p-2 rounded-lg flex items-center justify-center bg-gray-700/50 font-bold text-xl h-full transition-transform hover:scale-105">
    {value}
  </div>
);


export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ values, previousValues, highlightedCells = new Set() }) => {
  const { tp, fp, fn, tn } = values;
  const total = tp + fp + fn + tn;
  const actualPositive = tp + fn;
  const actualNegative = fp + tn;
  const predPositive = tp + fp;
  const predNegative = fn + tn;

  const getPercentage = (val: number) => (total > 0 ? (val / total) * 100 : 0);

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-fade-in h-[450px] flex flex-col">
      <h3 className="text-lg font-bold text-center mb-4 text-white">Confusion Matrix</h3>
      <div className="grid grid-cols-[3rem_1fr_1fr_5rem] grid-rows-[auto_1fr_1fr_5rem] gap-2 items-center text-xs flex-grow">
        {/* Corner */}
        <div></div>
        {/* Predicted Labels */}
        <div className="text-center text-sm font-semibold text-gray-400 py-2 uppercase tracking-wider">Predicted Positive</div>
        <div className="text-center text-sm font-semibold text-gray-400 py-2 uppercase tracking-wider">Predicted Negative</div>
        <div className="text-center text-sm font-semibold text-gray-400 py-2 uppercase tracking-wider">Total</div>
        
        {/* Actual Positive Row */}
        <div className="flex items-center justify-center h-full w-full">
            <span className="transform -rotate-90 whitespace-nowrap text-sm font-semibold text-gray-400 uppercase tracking-wider">Actual Positive</span>
        </div>
        <Cell label="TP" value={tp} percentage={getPercentage(tp)} colorClass="bg-tp" previousValue={previousValues?.tp} isHighlighted={highlightedCells.has('tp')} />
        <Cell label="FN" value={fn} percentage={getPercentage(fn)} colorClass="bg-fn" previousValue={previousValues?.fn} isHighlighted={highlightedCells.has('fn')} />
        <TotalCell value={actualPositive} />
        
        {/* Actual Negative Row */}
        <div className="flex items-center justify-center h-full w-full">
            <span className="transform -rotate-90 whitespace-nowrap text-sm font-semibold text-gray-400 uppercase tracking-wider">Actual Negative</span>
        </div>
        <Cell label="FP" value={fp} percentage={getPercentage(fp)} colorClass="bg-fp" previousValue={previousValues?.fp} isHighlighted={highlightedCells.has('fp')} />
        <Cell label="TN" value={tn} percentage={getPercentage(tn)} colorClass="bg-tn" previousValue={previousValues?.tn} isHighlighted={highlightedCells.has('tn')} />
        <TotalCell value={actualNegative} />

        {/* Total Row */}
        <div className="text-center font-semibold text-gray-400 uppercase tracking-wider text-sm">Total</div>
        <TotalCell value={predPositive} />
        <TotalCell value={predNegative} />
        <TotalCell value={total} />
      </div>
    </div>
  );
};