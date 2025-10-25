import React from 'react';

interface PixelStatisticsProps {
  pixelCounts: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
}

const StatBar: React.FC<{ label: string; value: number; percentage: number; colorClass: string }> = ({ label, value, percentage, colorClass }) => {
    const barPercentage = (percentage * 100);
    
    // Use a minimum width for the bar to ensure it's visible even for very small percentages
    const displayPercentage = Math.max(barPercentage, 0.5);

    return (
        <div className="grid grid-cols-12 items-center gap-2 sm:gap-4 text-sm">
            <div className="col-span-4 font-semibold text-gray-300">{label}</div>
            <div className="col-span-3 font-mono text-right text-white">{value.toLocaleString()}</div>
            <div className="col-span-5 flex items-center space-x-2">
                <div className="w-full bg-gray-700/50 rounded-full h-2.5" title={`${barPercentage.toFixed(2)}%`}>
                    <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${displayPercentage}%` }}></div>
                </div>
                <span className="w-16 text-right font-mono text-gray-400">{barPercentage.toFixed(1)}%</span>
            </div>
        </div>
    );
};


export const PixelStatistics: React.FC<PixelStatisticsProps> = ({ pixelCounts }) => {
    const { tp, fp, fn, tn } = pixelCounts;
    const totalPixels = tp + fp + fn + tn;

    if (totalPixels === 0) {
        return null;
    }

    const getPercentage = (value: number) => totalPixels > 0 ? value / totalPixels : 0;

    const stats = [
        { label: 'True Positives', value: tp, percentage: getPercentage(tp), colorClass: 'bg-green-500' },
        { label: 'False Positives', value: fp, percentage: getPercentage(fp), colorClass: 'bg-red-500' },
        { label: 'False Negatives', value: fn, percentage: getPercentage(fn), colorClass: 'bg-blue-500' },
        { label: 'True Negatives', value: tn, percentage: getPercentage(tn), colorClass: 'bg-gray-500' }
    ];

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-fade-in">
            <h3 className="text-lg font-bold text-center mb-4 text-white">📊 Pixel-Level Statistics</h3>
            <div className="space-y-3">
                <div className="text-center text-gray-400 mb-4 border-b border-gray-700 pb-3">
                    Total Pixels: <span className="font-mono font-bold text-white text-lg">{totalPixels.toLocaleString()}</span>
                </div>
                {stats.map(stat => (
                    <StatBar
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        percentage={stat.percentage}
                        colorClass={stat.colorClass}
                    />
                ))}
            </div>
        </div>
    );
};
