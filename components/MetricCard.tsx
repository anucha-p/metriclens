import React from 'react';
import { Tooltip } from './Tooltip';

interface MetricCardProps {
  name: string;
  value: number;
  // FIX: Changed 'explanation' prop type to 'React.ReactNode' to support JSX elements.
  explanation: React.ReactNode;
  change?: number;
  prevThreshold?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  unit?: string;
  ratingType?: 'score' | 'distance';
  valueFormatter?: (value: number) => string;
}

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-indigo-300 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const getScoreRating = (value: number): { text: string; color: string } => {
    if (value >= 0.9) return { text: 'Excellent', color: 'text-green-400' };
    if (value >= 0.8) return { text: 'Good', color: 'text-teal-400' };
    if (value >= 0.7) return { text: 'Fair', color: 'text-yellow-400' };
    return { text: 'Needs Improvement', color: 'text-orange-400' };
};

const getDistanceRating = (value: number): { text: string; color: string } => {
    if (value <= 5) return { text: 'Excellent', color: 'text-green-400' };
    if (value <= 15) return { text: 'Good', color: 'text-teal-400' };
    if (value <= 30) return { text: 'Fair', color: 'text-yellow-400' };
    return { text: 'Needs Improvement', color: 'text-orange-400' };
};

const renderChange = (change: number) => {
    if (Math.abs(change) < 0.0001) {
        return <span className="text-gray-500">= No change</span>;
    }
    const isPositive = change > 0;
    return (
        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{change.toFixed(3)}
        </span>
    );
};

export const MetricCard: React.FC<MetricCardProps> = ({ 
    name, 
    value, 
    explanation, 
    change, 
    prevThreshold, 
    onMouseEnter, 
    onMouseLeave,
    unit,
    ratingType = 'score',
    valueFormatter
}) => {
  const rating = ratingType === 'distance' ? getDistanceRating(value) : getScoreRating(value);
  const displayValue = valueFormatter ? valueFormatter(value) : value.toFixed(3);
  
  return (
    <div 
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col justify-between animate-fade-in shadow-lg h-full transition-all duration-300 hover:scale-105 hover:bg-gray-700 cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div>
        <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-medium text-gray-400">{name}</h3>
            <Tooltip text={explanation}>
               <InfoIcon />
            </Tooltip>
        </div>
        <p className="text-4xl font-bold text-white tracking-tight">
            {displayValue}
            {unit && <span className="text-xl text-gray-400 ml-1">{unit}</span>}
        </p>
      </div>
      <div className="mt-2 text-xs h-8">
        <p className={`font-semibold ${rating.color}`}>{rating.text}</p>
        {change !== undefined && (
             <div className="flex items-center space-x-2">
                {renderChange(change)}
                {prevThreshold !== undefined && Math.abs(change) >= 0.0001 && <span className="text-gray-500">from {prevThreshold.toFixed(2)}</span>}
            </div>
        )}
      </div>
    </div>
  );
};