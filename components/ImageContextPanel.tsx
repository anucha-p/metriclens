import React from 'react';
import type { SegmentationSample } from '../types';

interface ImageContextPanelProps {
  sample: SegmentationSample;
  pixelCounts: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
  metrics: {
    recall: number;
    precision: number;
  };
  threshold: number;
}

export const ImageContextPanel: React.FC<ImageContextPanelProps> = ({ sample, pixelCounts, metrics, threshold }) => {
    const { tp, fp, fn } = pixelCounts;

    const falsePositiveRateAmongDetections = (fp / (tp + fp)) * 100 || 0;
    const falseNegativeRate = (fn / (tp + fn)) * 100 || 0;

    return (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 animate-fade-in h-full">
            <h3 className="text-lg font-bold text-white text-center">💡 Understanding This Image</h3>
            <div className="border-b border-gray-700 w-1/2 mx-auto my-3"></div>
            <div className="space-y-4 text-sm text-gray-300 mt-4">
                <p>{sample.taskDescription}</p>
                <ul className="list-disc list-inside space-y-1">
                    <li><span className="font-semibold">White pixels</span> = Object detected</li>
                    <li><span className="font-semibold">Black pixels</span> = Background</li>
                    <li><span className="font-semibold">Goal:</span> Accurately outline the target shape</li>
                </ul>
                <div className="border-t border-gray-700 pt-3">
                    <p className="font-semibold text-gray-100">At threshold <span className="font-mono text-indigo-300">{threshold.toFixed(2)}</span>:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>
                            Model correctly detects <span className="font-bold text-green-400">{(metrics.recall * 100).toFixed(1)}%</span> of the target pixels.
                        </li>
                        <li>
                            <span className="font-bold text-red-400">{falsePositiveRateAmongDetections.toFixed(1)}%</span> of detected pixels are false alarms.
                        </li>
                        <li>
                            Model misses <span className="font-bold text-blue-400">{falseNegativeRate.toFixed(1)}%</span> of the actual target pixels.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
