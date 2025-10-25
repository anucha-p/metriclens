import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { ClassificationSample } from '../types';
import { usePrevious } from '../hooks/usePrevious';

interface SampleTableProps {
    samples: ClassificationSample[];
    threshold: number;
}

type FilterType = 'all' | 'tp' | 'fp' | 'fn' | 'tn';
type SortType = 'score_desc' | 'score_asc' | 'uncertain';
type SampleStatus = 'TP' | 'FP' | 'FN' | 'TN';

interface ProcessedSample extends ClassificationSample {
    predicted: 0 | 1;
    status: SampleStatus;
}

const SampleTableRow: React.FC<{ sample: ProcessedSample }> = React.memo(({ sample }) => {
    const [isJustChanged, setIsJustChanged] = useState(false);
    const prevPredicted = usePrevious(sample.predicted);

    useEffect(() => {
        if (prevPredicted !== undefined && prevPredicted !== sample.predicted) {
            setIsJustChanged(true);
            const timer = setTimeout(() => setIsJustChanged(false), 1000); // animation duration
            return () => clearTimeout(timer);
        }
    }, [sample.predicted, prevPredicted]);

    const isBorderline = sample.predictionScore >= 0.45 && sample.predictionScore <= 0.55;
    const isCorrect = sample.status === 'TP' || sample.status === 'TN';

    const statusMap = {
        TP: { icon: '✅', color: 'text-green-400', bgColor: '' },
        FP: { icon: '❌', color: 'text-red-400', bgColor: 'bg-red-900/40' },
        FN: { icon: '❌', color: 'text-orange-400', bgColor: 'bg-orange-900/40' },
        TN: { icon: '✅', color: 'text-blue-400', bgColor: '' },
    };

    const { icon, color, bgColor } = statusMap[sample.status];

    return (
        <tr className={`border-b border-gray-700 ${!isCorrect ? bgColor : 'hover:bg-gray-700/50'} ${isJustChanged ? 'animate-highlight-row' : ''}`}>
            <td className="px-4 py-2 font-mono">{sample.id}</td>
            <td className={`px-4 py-2 font-semibold ${sample.groundTruth === 1 ? 'text-green-400' : 'text-blue-400'}`}>
                {sample.groundTruth === 1 ? 'Positive' : 'Negative'}
            </td>
            <td className="px-4 py-2 font-mono">{sample.predictionScore.toFixed(2)}</td>
            <td className={`px-4 py-2 font-semibold ${sample.predicted === 1 ? 'text-green-400' : 'text-blue-400'}`}>
                {sample.predicted === 1 ? 'Positive' : 'Negative'}
            </td>
            <td className={`px-4 py-2 font-semibold ${color}`}>
                <div className="flex items-center space-x-2">
                    <span className="text-lg">{isBorderline ? '⚠️' : icon}</span>
                    <span>{sample.status}</span>
                </div>
            </td>
        </tr>
    );
});


export const SampleTable: React.FC<SampleTableProps> = ({ samples, threshold }) => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [sort, setSort] = useState<SortType>('score_desc');
    const [showNearThreshold, setShowNearThreshold] = useState(false);

    const baseProcessedSamples = useMemo(() => {
        return samples.map(sample => {
            // FIX: Explicitly type 'predicted' as '0 | 1' to match the 'ProcessedSample' interface.
            const predicted: 0 | 1 = sample.predictionScore >= threshold ? 1 : 0;
            let status: SampleStatus;
            if (predicted === 1 && sample.groundTruth === 1) status = 'TP';
            else if (predicted === 1 && sample.groundTruth === 0) status = 'FP';
            else if (predicted === 0 && sample.groundTruth === 1) status = 'FN';
            else status = 'TN';
            return { ...sample, predicted, status };
        });
    }, [samples, threshold]);

    const filterCounts = useMemo(() => {
        return baseProcessedSamples.reduce((acc, sample) => {
            acc[sample.status.toLowerCase() as keyof typeof acc]++;
            return acc;
        }, { tp: 0, fp: 0, fn: 0, tn: 0 });
    }, [baseProcessedSamples]);

    const finalSamples = useMemo(() => {
        let processed = [...baseProcessedSamples];

        if (showNearThreshold) {
            processed = processed.filter(s => Math.abs(s.predictionScore - threshold) <= 0.1);
        }

        if (filter !== 'all') {
            processed = processed.filter(s => s.status.toLowerCase() === filter);
        }

        processed.sort((a, b) => {
            switch (sort) {
                case 'score_asc': return a.predictionScore - b.predictionScore;
                case 'uncertain': return Math.abs(a.predictionScore - 0.5) - Math.abs(b.predictionScore - 0.5);
                case 'score_desc':
                default:
                    return b.predictionScore - a.predictionScore;
            }
        });

        return processed;

    }, [baseProcessedSamples, filter, sort, showNearThreshold, threshold]);

    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col h-[450px] animate-fade-in">
            <h3 className="text-lg font-bold text-left mb-2 text-white">Sample Predictions</h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
                 <select value={filter} onChange={e => setFilter(e.target.value as FilterType)} className="bg-gray-700 text-white text-sm rounded-md px-2 py-1 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 flex-grow">
                    <option value="all">Show All ({baseProcessedSamples.length})</option>
                    <option value="tp">True Positives ({filterCounts.tp})</option>
                    <option value="fp">False Positives ({filterCounts.fp})</option>
                    <option value="fn">False Negatives ({filterCounts.fn})</option>
                    <option value="tn">True Negatives ({filterCounts.tn})</option>
                </select>
                <select value={sort} onChange={e => setSort(e.target.value as SortType)} className="bg-gray-700 text-white text-sm rounded-md px-2 py-1 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 flex-grow">
                    <option value="score_desc">Sort by Score (High-Low)</option>
                    <option value="score_asc">Sort by Score (Low-High)</option>
                    <option value="uncertain">Sort by Most Uncertain</option>
                </select>
                 <button onClick={() => setShowNearThreshold(!showNearThreshold)} className={`text-sm px-2 py-1 rounded-md transition-colors ${showNearThreshold ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    Near Threshold
                </button>
            </div>
            <div className="flex-grow overflow-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-3">ID</th>
                            <th scope="col" className="px-4 py-3">True Label</th>
                            <th scope="col" className="px-4 py-3">Pred. Score</th>
                            <th scope="col" className="px-4 py-3">Predicted</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finalSamples.map(sample => (
                            <SampleTableRow key={sample.id} sample={sample} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}