import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { generateDataset } from '../data/classificationData';
import { useDebounce } from '../hooks/useDebounce';
import { usePrevious } from '../hooks/usePrevious';
import { Slider } from './Slider';
import { MetricCard } from './MetricCard';
import { ConfusionMatrix } from './ConfusionMatrix';
import { RocCurve } from './RocCurve';
import { PrecisionRecallCurve } from './PrecisionRecallCurve';
import { SampleTable } from './SampleTable';
import { ModelComparisonTable } from './ModelComparisonTable';
import { Tooltip } from './Tooltip';
import { MetricTrendsChart } from './MetricTrendsChart';
import { EducationalCallouts } from './EducationalCallouts';
import type { ModelType, ClassificationSample, ConfusionMatrixValues, CurvePoint } from '../types';

// Helper function to calculate metrics for a given threshold
const calculateMetrics = (samples: ClassificationSample[], threshold: number): ConfusionMatrixValues => {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    samples.forEach(sample => {
        const prediction = sample.predictionScore >= threshold ? 1 : 0;
        if (sample.groundTruth === 1 && prediction === 1) tp++;
        else if (sample.groundTruth === 0 && prediction === 1) fp++;
        else if (sample.groundTruth === 1 && prediction === 0) fn++;
        else if (sample.groundTruth === 0 && prediction === 0) tn++;
    });
    return { tp, fp, fn, tn };
};

const calculateDerivedMetrics = ({ tp, fp, fn, tn }: ConfusionMatrixValues) => {
    const total = tp + fp + fn + tn;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0; // also sensitivity
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;
    const accuracy = total > 0 ? (tp + tn) / total : 0;
    const specificity = tn / (tn + fp) || 0;
    const fpr = fp / (fp + tn) || 0;
    return { precision, recall, f1, accuracy, specificity, fpr };
}

const calculateCurve = (dataset: ClassificationSample[]): CurvePoint[] => {
    const points: CurvePoint[] = [];
    const uniqueScores = [...new Set(dataset.map(s => s.predictionScore))];
    // By adding 1.0 and 0.0 to the set, we guarantee the threshold range is fully covered for the Metric Trends chart.
    // The artificial 1.01 and -0.01 points are for ensuring ROC/PR curves start/end at the plot corners.
    const thresholds = [...new Set([1.01, 1.0, ...uniqueScores, 0.0, -0.01])].sort((a: number, b: number) => b - a);

    for (const t of thresholds) {
        const { tp, fp, fn, tn } = calculateMetrics(dataset, t);
        const P = tp + fn;
        const N = fp + tn;
        const tpr = P > 0 ? tp / P : 0; // Recall
        const fpr = N > 0 ? fp / N : 0;
        const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
        const specificity = N > 0 ? tn / N : 0;
        points.push({ threshold: t, tpr, fpr, precision, recall: tpr, specificity });
    }
    return points;
}

const ALL_MODEL_TYPES: ModelType[] = ['high-performance', 'balanced', 'conservative'];

const MODEL_METADATA: Record<ModelType, {
    name: string;
    icon: string;
    description: string;
    strategy: string;
    useCase: string;
}> = {
    'high-performance': {
        name: 'High Performance',
        icon: '🎯',
        description: 'This model is highly confident and excels at finding positive cases.',
        strategy: 'Strategy: Prioritizes Recall (Sensitivity)',
        useCase: 'Use for: Critical screenings (e.g., cancer detection), where missing a positive is very costly.'
    },
    'balanced': {
        name: 'Balanced',
        icon: '⚖️',
        description: 'A standard, all-around model that provides a good trade-off between precision and recall.',
        strategy: 'Strategy: Aims for a balanced F1-Score',
        useCase: 'Use for: General tasks where false positives and false negatives have similar costs.'
    },
    'conservative': {
        name: 'Conservative',
        icon: '🛡️',
        description: 'This model is very cautious, only predicting positive when it is highly certain.',
        strategy: 'Strategy: Prioritizes Precision',
        useCase: 'Use for: Spam filtering, where a false positive (a real email in spam) is highly undesirable.'
    }
};

export const ClassificationDemo: React.FC = () => {
    const [selectedModels, setSelectedModels] = useState<ModelType[]>(['balanced']);
    const [threshold, setThreshold] = useState(0.5);
    const [thresholdHistory, setThresholdHistory] = useState<number[]>([]);
    const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
    const debouncedThreshold = useDebounce(threshold, 100);
    const prevDebouncedThreshold = usePrevious(debouncedThreshold);

    const primaryModel = selectedModels[0];
    const prevPrimaryModel = usePrevious(primaryModel);

    const [metricChanges, setMetricChanges] = useState({
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1: 0,
        specificity: 0,
    });

    const allDatasets = useMemo(() => {
        const datasets: { [key in ModelType]?: ClassificationSample[] } = {};
        ALL_MODEL_TYPES.forEach(modelType => {
            datasets[modelType] = generateDataset(modelType);
        });
        return datasets as Record<ModelType, ClassificationSample[]>;
    }, []);

    const allModelsCurveData = useMemo(() => {
        const curves: { [key in ModelType]?: CurvePoint[] } = {};
        ALL_MODEL_TYPES.forEach(modelType => {
            curves[modelType] = calculateCurve(allDatasets[modelType]);
        });
        return curves as Record<ModelType, CurvePoint[]>;
    }, [allDatasets]);

    const allModelAUCs = useMemo(() => {
        const aucs: Partial<Record<ModelType, number>> = {};
        ALL_MODEL_TYPES.forEach(modelType => {
            const modelCurveData = allModelsCurveData[modelType];
            const rocPoints = modelCurveData.map(p => ({ fpr: p.fpr, tpr: p.tpr })).sort((a,b) => a.fpr - b.fpr);
            let auc = 0;
            for (let i = 1; i < rocPoints.length; i++) {
                auc += (rocPoints[i].fpr - rocPoints[i-1].fpr) * (rocPoints[i].tpr + rocPoints[i-1].tpr) / 2;
            }
            aucs[modelType] = auc;
        });
        return aucs;
    }, [allModelsCurveData]);


    const handleModelToggle = useCallback((toggledModel: ModelType) => {
        setSelectedModels(prev => {
            const isSelected = prev.includes(toggledModel);
            if (isSelected) {
                if (prev.length === 1) return prev; // Prevent unselecting the last model
                return prev.filter(m => m !== toggledModel);
            }
            return [...prev, toggledModel];
        });
    }, []);

    // The primary model drives the detailed charts and tables
    const primaryDataset = allDatasets[primaryModel];
    const primaryCurveData = allModelsCurveData[primaryModel];

    const confusionMatrixValues = useMemo(() => {
        return calculateMetrics(primaryDataset, debouncedThreshold);
    }, [primaryDataset, debouncedThreshold]);
    
    const prevConfusionMatrixValues = useMemo(() => {
        if (prevDebouncedThreshold === undefined || debouncedThreshold === prevDebouncedThreshold) {
            return undefined;
        }
        return calculateMetrics(primaryDataset, prevDebouncedThreshold);
    }, [primaryDataset, debouncedThreshold, prevDebouncedThreshold]);
    
    const optimalThresholds = useMemo(() => {
        if (!primaryCurveData || primaryCurveData.length <= 2) {
            return { maxF1: 0.5, maxAccuracy: 0.5, maxYoudens: 0.5 };
        }
        
        const validPoints = primaryCurveData.slice(1, primaryCurveData.length - 1);
        
        let maxF1 = -1, tForMaxF1 = 0.5;
        let maxAccuracy = -1, tForMaxAccuracy = 0.5;
        let maxYoudens = -1, tForMaxYoudens = 0.5;

        for (const point of validPoints) {
            const { precision, recall, tpr, fpr, threshold } = point;
            const f1 = (2 * precision * recall) / (precision + recall) || 0;
            if (f1 > maxF1) {
                maxF1 = f1;
                tForMaxF1 = threshold;
            }

            const youdens = tpr - fpr;
            if (youdens > maxYoudens) {
                maxYoudens = youdens;
                tForMaxYoudens = threshold;
            }

            const { tp, tn } = calculateMetrics(primaryDataset, threshold);
            const accuracy = (tp + tn) / primaryDataset.length;
            if (accuracy >= maxAccuracy) { // Use >= to prefer higher thresholds
                maxAccuracy = accuracy;
                tForMaxAccuracy = threshold;
            }
        }
        
        return { 
            maxF1: tForMaxF1, 
            maxAccuracy: tForMaxAccuracy,
            maxYoudens: tForMaxYoudens
        };

    }, [primaryCurveData, primaryDataset]);

    const comparisonData = useMemo(() => {
        return selectedModels.map(modelType => {
            const dataset = allDatasets[modelType];
            const { tp, fp, fn, tn } = calculateMetrics(dataset, debouncedThreshold);
            const total = tp + fp + fn + tn;
            const precision = tp / (tp + fp) || 0;
            const recall = tp / (tp + fn) || 0;
            const f1 = 2 * (precision * recall) / (precision + recall) || 0;
            const accuracy = total > 0 ? (tp + tn) / total : 0;
            const auc = allModelAUCs[modelType] || 0;

            return { modelType, metrics: { accuracy, precision, recall, f1, auc }};
        });
    }, [selectedModels, allDatasets, allModelAUCs, debouncedThreshold]);

    const derivedMetrics = useMemo(() => {
        const thresholdMetrics = calculateDerivedMetrics(confusionMatrixValues);
        const auc = allModelAUCs[primaryModel] || 0;
        return { ...thresholdMetrics, auc };
    }, [confusionMatrixValues, allModelAUCs, primaryModel]);

    useEffect(() => {
        // Reset changes if the model is switched
        if (prevPrimaryModel !== undefined && primaryModel !== prevPrimaryModel) {
            setMetricChanges({ accuracy: 0, precision: 0, recall: 0, f1: 0, specificity: 0 });
            setThresholdHistory([]);
            return;
        }

        // Only calculate changes if the threshold has actually changed
        if (prevDebouncedThreshold !== undefined && debouncedThreshold !== prevDebouncedThreshold) {
            const prevMetrics = calculateDerivedMetrics(calculateMetrics(primaryDataset, prevDebouncedThreshold));
            
            setMetricChanges({
                accuracy: derivedMetrics.accuracy - prevMetrics.accuracy,
                precision: derivedMetrics.precision - prevMetrics.precision,
                recall: derivedMetrics.recall - prevMetrics.recall,
                f1: derivedMetrics.f1 - prevMetrics.f1,
                specificity: derivedMetrics.specificity - prevMetrics.specificity,
            });
            
            setThresholdHistory(prev => {
                const newHistory = [prevDebouncedThreshold, ...prev];
                return [...new Set(newHistory)].slice(0, 5); // Keep last 5 unique
            });
        }
    }, [debouncedThreshold, prevDebouncedThreshold, primaryModel, prevPrimaryModel, primaryDataset, derivedMetrics]);

    const f1IsoLines = useMemo(() => {
        const f1Scores = [0.2, 0.5, 0.8];
        return f1Scores.map(f1 => {
            const points = [];
            for (let r = 0.01; r <= 1; r += 0.01) {
                if (2 * r - f1 > 0) {
                    const p = (f1 * r) / (2 * r - f1);
                    if (p >= 0.01 && p <= 1) {
                        points.push({ recall: r, precision: p });
                    }
                }
            }
            return { f1, points };
        });
    }, []);

    const currentPointData = useMemo(() => {
        const { recall, precision, fpr } = derivedMetrics;
        return { 
            roc: { fpr, tpr: recall }, 
            pr: { recall, precision } 
        };
    }, [derivedMetrics]);
    
    const sliderMarkers = useMemo(() => [
        { value: optimalThresholds.maxF1, label: 'Max F1' },
        { value: optimalThresholds.maxAccuracy, label: 'Max Accuracy' },
        { value: optimalThresholds.maxYoudens, label: "Youden's J" },
    ], [optimalThresholds]);

    const selectedCurveData = useMemo(() => {
        return selectedModels.map(modelType => {
            return {
                modelType,
                data: allModelsCurveData[modelType]
            };
        });
    }, [selectedModels, allModelsCurveData]);
    
    const quickThresholdButtons = useMemo(() => [
        {
            id: 'default',
            label: 'Default',
            value: 0.5,
            tooltip: 'Reset threshold to default (0.50)',
        },
        {
            id: 'maxF1',
            label: 'Max F1-Score',
            value: optimalThresholds.maxF1,
            tooltip: `Set threshold to maximize F1-Score (${optimalThresholds.maxF1.toFixed(2)})`,
        },
        {
            id: 'maxAccuracy',
            label: 'Max Accuracy',
            value: optimalThresholds.maxAccuracy,
            tooltip: `Set threshold to maximize Accuracy (${optimalThresholds.maxAccuracy.toFixed(2)})`,
        },
        {
            id: 'maxYoudens',
            label: "Youden's Index",
            value: optimalThresholds.maxYoudens,
            tooltip: `Set threshold to maximize Youden's J Index (${optimalThresholds.maxYoudens.toFixed(2)})`,
        },
    ], [optimalThresholds]);

    const tooltipExplanations = {
        accuracy: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Accuracy</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">(TP + TN) / Total</p>
                <p className="text-sm mb-2">The percentage of all predictions (both positive and negative) that were correct. It provides a general sense of performance.</p>
                <p className="text-sm"><strong className="text-indigo-300">When to use:</strong> Best for balanced datasets where every class is equally important.</p>
                <p className="text-xs text-gray-400 italic mt-2">Be cautious: Can be misleading on imbalanced datasets. A model can achieve high accuracy by simply always predicting the most common class.</p>
            </div>
        ),
        precision: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Precision</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">TP / (TP + FP)</p>
                <p className="text-sm mb-2">Of all the times the model predicted POSITIVE, what percentage were actually correct.</p>
                <p className="text-sm"><strong className="text-indigo-300">When it matters:</strong> When the cost of a False Positive is high.</p>
                <p className="text-xs text-gray-400 italic mt-2">Example: In spam filtering, you want high precision. You would rather let a spam email through (False Negative) than send a real email to spam (False Positive).</p>
            </div>
        ),
        recall: (
             <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Recall (Sensitivity)</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">TP / (TP + FN)</p>
                <p className="text-sm mb-2">Of all the actual POSITIVE cases, what percentage did the model correctly identify.</p>
                <p className="text-sm"><strong className="text-indigo-300">When it matters:</strong> When the cost of a False Negative is high.</p>
                <p className="text-xs text-gray-400 italic mt-2">Example: In medical screening for a disease, you want high recall. It's better to have a false alarm (False Positive) than to miss a real case (False Negative).</p>
            </div>
        ),
        f1: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">F1-Score</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">2 * (Prec * Rec) / (Prec + Rec)</p>
                <p className="text-sm mb-2">The harmonic mean of Precision and Recall. It provides a single score that balances the trade-off between them.</p>
                <p className="text-sm"><strong className="text-indigo-300">When to use:</strong> Excellent for imbalanced datasets or when you care equally about False Positives and False Negatives.</p>
            </div>
        ),
        specificity: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Specificity</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">TN / (TN + FP)</p>
                <p className="text-sm mb-2">Of all the actual NEGATIVE cases, what percentage did the model correctly identify. Also known as the True Negative Rate.</p>
                <p className="text-sm"><strong className="text-indigo-300">When it matters:</strong> When correctly identifying negatives is crucial and avoiding false alarms is a priority.</p>
                <p className="text-xs text-gray-400 italic mt-2">Example: A test to confirm a patient does *not* have a disease must have high specificity to avoid unnecessary treatments.</p>
            </div>
        ),
        auc: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Area Under the Curve (AUC)</p>
                <p className="text-sm mb-2">Summarizes the ROC curve with a single number. It represents the model's ability to distinguish between positive and negative classes across all thresholds.</p>
                <p className="text-sm"><strong className="text-indigo-300">Interpretation:</strong></p>
                <ul className="list-disc list-inside text-xs pl-2 text-gray-300">
                    <li>1.0 = Perfect model</li>
                    <li>0.5 = No better than random chance</li>
                    <li>0.0 = Perfectly incorrect model</li>
                </ul>
                <p className="text-xs text-gray-400 italic mt-2">Advantage: It is threshold-independent, giving a general measure of the model's separability power.</p>
            </div>
        ),
    };


    return (
        <div className="space-y-6 pb-8">
            <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl space-y-6">
                 <div className="w-full">
                    <label className="text-lg font-bold text-gray-300 mb-4 block text-center sm:text-left">Select & Compare Model Archetypes</label>
                    <div className="flex flex-col sm:flex-row justify-around items-stretch gap-4">
                        {ALL_MODEL_TYPES.map(type => {
                            const meta = MODEL_METADATA[type];
                            const auc = allModelAUCs[type];
                            const tooltipContent = (
                                <div className="text-left">
                                    <p className="font-bold text-white mb-1">{meta.strategy}</p>
                                    <p className="mb-2">{meta.description}</p>
                                    <p className="text-gray-400 text-xs italic mt-1">{meta.useCase}</p>
                                </div>
                            );
                            return (
                                <div key={type} className="flex flex-col items-center gap-2 flex-grow">
                                    <Tooltip text={tooltipContent}>
                                        <button onClick={() => handleModelToggle(type)}
                                            className={`w-full px-3 py-2 text-base font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${selectedModels.includes(type) ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            <span>{meta.icon}</span>
                                            <span>{meta.name}</span>
                                        </button>
                                    </Tooltip>
                                    <div className="text-xs font-mono bg-gray-900/50 text-indigo-300 px-2 py-0.5 rounded-full">
                                        AUC: {auc ? auc.toFixed(3) : '...'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <Slider 
                    label="Classification Threshold" 
                    value={threshold} 
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    previousValue={prevDebouncedThreshold}
                    markers={sliderMarkers}
                />
                <div className="pt-4 border-t border-gray-700/50">
                    <div className={`grid ${thresholdHistory.length > 0 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 place-items-center'} gap-6 items-start`}>
                        <div className="flex flex-col items-center sm:items-start w-full">
                            <label className="text-base font-medium text-gray-400 mb-2">Quick Thresholds:</label>
                            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                                {quickThresholdButtons.map(btn => {
                                    const isActive = Math.abs(threshold - btn.value) < 0.001;
                                    return (
                                        <Tooltip key={btn.id} text={btn.tooltip}>
                                            <button
                                                onClick={() => setThreshold(btn.value)}
                                                className={`text-sm transition-colors px-3 py-1.5 rounded-md ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-indigo-600'}`}
                                            >
                                                {btn.label}
                                            </button>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </div>

                        {thresholdHistory.length > 0 && (
                            <div className="flex flex-col items-center sm:items-end w-full">
                                <div className="flex items-center gap-3 mb-2">
                                    <p className="text-base font-medium text-gray-400">Recent Thresholds:</p>
                                    <button
                                        onClick={() => setThresholdHistory([])}
                                        className="text-xs font-mono transition-colors px-2 py-0.5 rounded-md bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white"
                                        title="Clear history"
                                    >
                                        [✕ Clear]
                                    </button>
                                </div>
                                <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
                                    {thresholdHistory.map((h, index) => {
                                        const isActive = Math.abs(threshold - h) < 0.001;
                                        return (
                                            <button
                                                key={`${h}-${index}`}
                                                onClick={() => setThreshold(h)}
                                                className={`font-mono text-sm transition-colors px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                                    isActive 
                                                    ? 'bg-indigo-500 text-white font-bold' 
                                                    : 'bg-gray-700 hover:bg-indigo-600'
                                                }`}
                                            >
                                                {h.toFixed(2)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedModels.length > 1 && <ModelComparisonTable data={comparisonData} />}

            <div className="text-center pt-2 text-gray-400">
                Showing detailed metrics for: <span className="font-bold text-white capitalize">{MODEL_METADATA[primaryModel].name}</span>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                    <ConfusionMatrix values={confusionMatrixValues} previousValues={prevConfusionMatrixValues} highlightedCells={highlightedCells} />
                </div>
                <div className="lg:col-span-1">
                    <SampleTable samples={primaryDataset} threshold={debouncedThreshold} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2 lg:col-span-3">
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <MetricCard name="Accuracy" value={derivedMetrics.accuracy} change={metricChanges.accuracy} prevThreshold={prevDebouncedThreshold} explanation={tooltipExplanations.accuracy} onMouseEnter={() => setHighlightedCells(new Set(['tp', 'tn']))} onMouseLeave={() => setHighlightedCells(new Set())} />
                        <MetricCard name="Precision" value={derivedMetrics.precision} change={metricChanges.precision} prevThreshold={prevDebouncedThreshold} explanation={tooltipExplanations.precision} onMouseEnter={() => setHighlightedCells(new Set(['tp', 'fp']))} onMouseLeave={() => setHighlightedCells(new Set())} />
                        <MetricCard name="Recall (Sensitivity)" value={derivedMetrics.recall} change={metricChanges.recall} prevThreshold={prevDebouncedThreshold} explanation={tooltipExplanations.recall} onMouseEnter={() => setHighlightedCells(new Set(['tp', 'fn']))} onMouseLeave={() => setHighlightedCells(new Set())} />
                        <MetricCard name="F1-Score" value={derivedMetrics.f1} change={metricChanges.f1} prevThreshold={prevDebouncedThreshold} explanation={tooltipExplanations.f1} onMouseEnter={() => setHighlightedCells(new Set(['tp', 'fp', 'fn']))} onMouseLeave={() => setHighlightedCells(new Set())} />
                        <MetricCard name="Specificity" value={derivedMetrics.specificity} change={metricChanges.specificity} prevThreshold={prevDebouncedThreshold} explanation={tooltipExplanations.specificity} onMouseEnter={() => setHighlightedCells(new Set(['tn', 'fp']))} onMouseLeave={() => setHighlightedCells(new Set())} />
                        <MetricCard name="AUC" value={derivedMetrics.auc} explanation={tooltipExplanations.auc} />
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <RocCurve curves={selectedCurveData} currentPoint={currentPointData.roc} />
                <PrecisionRecallCurve curves={selectedCurveData} currentPoint={currentPointData.pr} f1IsoLines={f1IsoLines} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetricTrendsChart data={primaryCurveData} currentThreshold={debouncedThreshold} />
                <EducationalCallouts metrics={derivedMetrics} threshold={debouncedThreshold} />
            </div>
        </div>
    );
};