import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import type { CurvePoint } from '../types';
import { Tooltip } from './Tooltip';

interface MetricTrendsChartProps {
  data: CurvePoint[];
  currentThreshold: number;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg text-sm animate-fade-in">
        <p className="font-bold mb-2 text-white">Threshold: {label.toFixed(3)}</p>
        {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toFixed(3)}</p>
        ))}
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


export const MetricTrendsChart: React.FC<MetricTrendsChartProps> = ({ data, currentThreshold }) => {
  // Filter out the artificial start/end points for a cleaner graph
  const chartData = data.filter(p => p.threshold >= 0 && p.threshold <= 1);
  const chartExplanation = "This chart shows how Precision, Recall, and Specificity change as the classification threshold is adjusted. The point where Precision and Recall curves cross often indicates a good balance between the two, which is where the F1-Score is typically maximized.";

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-[450px] flex flex-col animate-fade-in">
      <div className="relative mb-4">
        <h3 className="text-lg font-bold text-center text-white">📊 Metric Trends vs. Threshold</h3>
        <div className="absolute top-0 right-0">
          <Tooltip text={chartExplanation}>
            <InfoIcon />
          </Tooltip>
        </div>
      </div>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 25, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis
              dataKey="threshold"
              type="number"
              domain={[0, 1]}
              reversed={false}
              stroke="#9ca3af"
              label={{ value: 'Threshold', position: 'insideBottom', offset: -20, fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              type="number"
              domain={[0, 1]}
              stroke="#9ca3af"
              label={{ value: 'Metric Value', angle: -90, position: 'insideLeft', offset: -10, fill: '#9ca3af', fontSize: 12 }}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#a5b4fc', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Legend verticalAlign="top" />

            <Line type="monotone" dataKey="precision" name="Precision" stroke="#2dd4bf" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="recall" name="Recall (Sensitivity)" stroke="#818cf8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="specificity" name="Specificity" stroke="#f472b6" strokeWidth={2} dot={false} />

            <ReferenceLine x={currentThreshold} stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};