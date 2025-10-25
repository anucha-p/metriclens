import React from 'react';
import type { ModelType } from '../types';

interface ComparisonData {
    modelType: ModelType;
    metrics: {
        accuracy: number;
        precision: number;
        recall: number;
        f1: number;
        auc: number;
    };
}

interface ModelComparisonTableProps {
    data: ComparisonData[];
}

type MetricKey = keyof ComparisonData['metrics'];
const METRIC_KEYS: MetricKey[] = ['accuracy', 'precision', 'recall', 'f1', 'auc'];

const METRIC_NAMES: Record<MetricKey, string> = {
    accuracy: 'Accuracy',
    precision: 'Precision',
    recall: 'Recall',
    f1: 'F1-Score',
    auc: 'AUC'
};

export const ModelComparisonTable: React.FC<ModelComparisonTableProps> = ({ data }) => {

    const bestValues = React.useMemo(() => {
        const best: Partial<Record<MetricKey, number>> = {};
        if (data.length > 0) {
            METRIC_KEYS.forEach(key => {
                best[key] = Math.max(...data.map(d => d.metrics[key]));
            });
        }
        return best;
    }, [data]);

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-fade-in">
            <h3 className="text-lg font-bold text-center mb-4 text-white">Model Performance Comparison</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-3 rounded-l-lg">Model</th>
                            {METRIC_KEYS.map(key => (
                                <th scope="col" className="px-4 py-3 text-right" key={key}>{METRIC_NAMES[key]}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(({ modelType, metrics }) => (
                            <tr key={modelType} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-4 py-3 font-semibold capitalize text-white">{modelType.replace('-', ' ')}</td>
                                {METRIC_KEYS.map(key => {
                                    const value = metrics[key];
                                    const isBest = data.length > 1 && value === bestValues[key];
                                    return (
                                        <td key={key} className={`px-4 py-3 font-mono text-right transition-colors duration-300 ${isBest ? 'text-green-400 font-bold' : ''}`}>
                                            {value.toFixed(3)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};