import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, Legend, Line } from 'recharts';
import type { CurvePoint, ModelType } from '../types';
import { Tooltip } from './Tooltip';

interface PrecisionRecallCurveProps {
  curves: { modelType: ModelType; data: CurvePoint[] }[];
  currentPoint: { recall: number; precision: number };
  f1IsoLines: { f1: number; points: { recall: number; precision: number }[] }[];
}

const MODEL_COLORS: Record<ModelType, string> = {
    'high-performance': '#4ade80', // green-400
    'balanced': '#818cf8', // indigo-400
    'conservative': '#f472b6', // pink-400
};

const MODEL_DISPLAY_NAMES: Record<ModelType, string> = {
    'high-performance': 'High Performance',
    'balanced': 'Balanced',
    'conservative': 'Conservative',
};

const CustomTooltip: React.FC<any> = ({ active, payload, allCurves }) => {
  if (active && payload && payload.length && allCurves) {
    const activePayload = payload.find(p => p.dataKey === 'precision')?.payload;
    if (!activePayload) return null;

    const currentRecall = activePayload.recall;

    const tooltipData = allCurves.map(({ modelType, data }: { modelType: ModelType, data: CurvePoint[] }) => {
      if (!data || data.length === 0) {
        return { modelType, point: null };
      }
      
      const closestPoint = data.reduce((prev, curr) => 
        Math.abs(curr.recall - currentRecall) < Math.abs(prev.recall - currentRecall) ? curr : prev
      );

      return { modelType, point: closestPoint };
    });

    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg text-sm animate-fade-in">
        <p className="font-bold mb-2 text-white">Recall: ~{currentRecall.toFixed(3)}</p>
        {tooltipData.map(({ modelType, point }) => {
          if (!point) return null;
          return (
            <div key={modelType} className="mt-1">
              <p style={{ color: MODEL_COLORS[modelType] }} className="font-semibold">{MODEL_DISPLAY_NAMES[modelType]}</p>
              <ul className="list-disc list-inside text-xs pl-2 text-gray-300">
                <li>Precision: <span className="font-medium text-white">{point.precision.toFixed(3)}</span></li>
                {point.threshold !== undefined && (
                  <li>Threshold: <span className="font-medium text-white">~{point.threshold.toFixed(2)}</span></li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-indigo-300 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const PrecisionRecallCurve: React.FC<PrecisionRecallCurveProps> = ({ curves, currentPoint, f1IsoLines }) => {
  const isComparison = curves.length > 1;
  const title = isComparison ? 'Precision-Recall Curves Comparison' : 'Precision-Recall Curve';
  const prExplanation = "The Precision-Recall (PR) curve illustrates the trade-off between Precision and Recall for different thresholds. It is particularly useful for imbalanced datasets. An ideal model has a curve that reaches the top-right corner, representing high precision and high recall. The F1-Score isolines show points with the same F1-score.";

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-[450px] flex flex-col">
      <div className="relative mb-4">
        <h3 className="text-lg font-bold text-center text-white">{title}</h3>
        <div className="absolute top-0 right-0">
            <Tooltip text={prExplanation}>
                <InfoIcon />
            </Tooltip>
        </div>
      </div>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart margin={{ top: 5, right: 20, left: 25, bottom: 45 }}>
            {!isComparison && (
                <defs>
                  {curves.map(({ modelType }) => (
                    <linearGradient key={`pr-${modelType}`} id={`pr-gradient-${modelType}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={MODEL_COLORS[modelType]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={MODEL_COLORS[modelType]} stopOpacity={0.1}/>
                    </linearGradient>
                  ))}
                </defs>
            )}
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis
              dataKey="recall"
              type="number"
              domain={[0, 1]}
              stroke="#9ca3af"
              label={{ value: 'Recall (TPR)', position: 'insideBottom', offset: -35, fill: '#9ca3af', fontSize: 14 }}
            />
            <YAxis
              dataKey="precision"
              type="number"
              domain={[0, 1]}
              stroke="#9ca3af"
              label={{ value: 'Precision', angle: -90, position: 'center', dx: -15, fill: '#9ca3af', fontSize: 14, style: { textAnchor: 'middle' } }}
            />
            <RechartsTooltip content={<CustomTooltip allCurves={curves} />} cursor={{ stroke: '#a5b4fc', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Legend verticalAlign="top" align="right" iconType="plainline" />
            
            {/* F1 Isolines */}
            {f1IsoLines.map(({ f1, points }) => (
              <Line
                key={`f1-${f1}`}
                data={points}
                type="monotone"
                dataKey="precision"
                stroke="#c084fc"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                name={`F1=${f1}`}
              />
            ))}

            {curves.map(({ modelType, data }) => (
              <Area
                key={modelType}
                type="step"
                data={data}
                dataKey="precision"
                name={MODEL_DISPLAY_NAMES[modelType]}
                stroke={MODEL_COLORS[modelType]}
                fill={isComparison ? MODEL_COLORS[modelType] : `url(#pr-gradient-${modelType})`}
                fillOpacity={isComparison ? 0.25 : 1}
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />
            ))}
            
            {/* Current Point Markers for Primary Model */}
            <ReferenceLine x={currentPoint.recall} stroke="#fca5a5" strokeDasharray="4 4" />
            <ReferenceLine y={currentPoint.precision} stroke="#fca5a5" strokeDasharray="4 4" />
            <ReferenceDot
              x={currentPoint.recall}
              y={currentPoint.precision}
              r={6}
              fill="#ef4444"
              stroke="white"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};