import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, Line, Legend } from 'recharts';
import type { CurvePoint, ModelType } from '../types';
import { Tooltip } from './Tooltip';

interface RocCurveProps {
  curves: { modelType: ModelType; data: CurvePoint[] }[];
  currentPoint: { fpr: number; tpr: number };
}

const MODEL_COLORS: Record<ModelType, string> = {
    'high-performance': '#4ade80', // green-400
    'balanced': '#818cf8', // indigo-400
    'conservative': '#f472b6', // pink-400
};

const CustomTooltip: React.FC<any> = ({ active, payload, allCurves }) => {
  if (active && payload && payload.length && allCurves) {
    const activePayload = payload[0].payload;
    if (!activePayload) return null;

    const currentFpr = activePayload.fpr;

    const tooltipData = allCurves.map(({ modelType, data }: { modelType: ModelType, data: CurvePoint[] }) => {
      if (!data || data.length === 0) {
        return { modelType, point: null };
      }
      
      const closestPoint = data.reduce((prev, curr) => 
        Math.abs(curr.fpr - currentFpr) < Math.abs(prev.fpr - currentFpr) ? curr : prev
      );

      return { modelType, point: closestPoint };
    });

    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg text-sm animate-fade-in">
        <p className="font-bold mb-2 text-white">FPR: ~{currentFpr.toFixed(3)}</p>
        {tooltipData.map(({ modelType, point }) => {
          if (!point) return null;
          const specificity = 1 - point.fpr;
          return (
            <div key={modelType} className="mt-1">
              <p style={{ color: MODEL_COLORS[modelType] }} className="font-semibold capitalize">{modelType.replace('-', ' ')}</p>
              <ul className="list-disc list-inside text-xs pl-2 text-gray-300">
                <li>TPR (Sensitivity): <span className="font-medium text-white">{point.tpr.toFixed(3)}</span></li>
                <li>Specificity: <span className="font-medium text-white">{specificity.toFixed(3)}</span></li>
                <li>Threshold: <span className="font-medium text-white">~{point.threshold.toFixed(2)}</span></li>
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

export const RocCurve: React.FC<RocCurveProps> = ({ curves, currentPoint }) => {
  const title = curves.length > 1 ? 'ROC Curves Comparison' : 'ROC Curve';
  const rocExplanation = "The Receiver Operating Characteristic (ROC) curve shows the trade-off between the True Positive Rate (Sensitivity) and the False Positive Rate (1 - Specificity) at various threshold settings. An ideal model has a curve that hugs the top-left corner, indicating high sensitivity and high specificity. The diagonal line represents a random guess.";
  
  const randomGuessData = [{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }];

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-[450px] flex flex-col">
      <div className="relative mb-4">
        <h3 className="text-lg font-bold text-center text-white">{title}</h3>
          <div className="absolute top-0 right-0">
            <Tooltip text={rocExplanation}>
              <InfoIcon />
            </Tooltip>
          </div>
      </div>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart margin={{ top: 5, right: 20, left: 25, bottom: 45 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis
              dataKey="fpr"
              type="number"
              domain={[0, 1]}
              stroke="#9ca3af"
              label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -35, fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              dataKey="tpr"
              type="number"
              domain={[0, 1]}
              stroke="#9ca3af"
              label={{ value: 'True Positive Rate (Recall)', angle: -90, position: 'insideLeft', offset: -10, fill: '#9ca3af', fontSize: 12 }}
            />
            <RechartsTooltip content={<CustomTooltip allCurves={curves} />} cursor={{ stroke: '#a5b4fc', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Legend verticalAlign="top" align="right" iconType="plainline" />

            <Line data={randomGuessData} type="linear" dataKey="tpr" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Random Guess (AUC=0.5)" />

            {curves.map(({ modelType, data }) => (
              <Area
                key={modelType}
                type="step"
                data={data}
                dataKey="tpr"
                name={modelType.replace('-', ' ')}
                stroke={MODEL_COLORS[modelType]}
                fill={MODEL_COLORS[modelType]}
                fillOpacity={curves.length > 1 ? 0.2 : 0.4}
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />
            ))}

            {/* Current Point Markers for Primary Model */}
            <ReferenceLine x={currentPoint.fpr} stroke="#fca5a5" strokeDasharray="4 4" />
            <ReferenceLine y={currentPoint.tpr} stroke="#fca5a5" strokeDasharray="4 4" />
            {/* FIX: Removed 'isFront' prop as it is not supported by the ReferenceDot component's props type. */}
            <ReferenceDot
              x={currentPoint.fpr}
              y={currentPoint.tpr}
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