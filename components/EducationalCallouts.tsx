import React, { useMemo } from 'react';

interface EducationalCalloutsProps {
    metrics: {
        recall: number;
        specificity: number;
        precision: number;
    };
    threshold: number;
}

export const EducationalCallouts: React.FC<EducationalCalloutsProps> = ({ metrics, threshold }) => {
    
    const { goodFor, avoidFor } = useMemo(() => {
        if (threshold <= 0.35) {
            return {
                goodFor: 'Medical screening, fraud detection. This "wide net" approach prioritizes finding all potential positives (high recall).',
                avoidFor: 'Spam filtering where false positives are very disruptive. This setting will produce many false alarms.',
            };
        }
        if (threshold >= 0.65) {
            return {
                goodFor: 'Spam filtering, final diagnoses. This "selective" approach prioritizes accuracy in positive predictions (high precision).',
                avoidFor: 'Initial screening tasks where missing a positive case is unacceptable. This setting will miss many true positives.',
            };
        }
        return {
            goodFor: 'General purpose tasks where false positives and negatives have similar costs. This offers a balanced performance.',
            avoidFor: 'Highly imbalanced datasets, where a "balanced" threshold might still perform poorly on the minority class.',
        };
    }, [threshold]);

    return (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 animate-fade-in">
            <div className="flex justify-center items-center">
                <h3 className="text-lg font-bold text-white">💡 Understanding Your Results</h3>
            </div>

            <div className="mt-4 space-y-4 text-gray-300">
                <div className="border-t border-gray-700 pt-4">
                    <p className="font-semibold text-gray-100">At threshold <span className="font-mono text-indigo-300">{threshold.toFixed(2)}</span>:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>
                            You correctly identify <span className="font-bold text-green-400">{(metrics.recall * 100).toFixed(1)}%</span> of all actual positive cases.
                            <span className="text-xs text-gray-400 ml-2">(This is your Recall or Sensitivity)</span>
                        </li>
                        <li>
                            You correctly identify <span className="font-bold text-green-400">{(metrics.specificity * 100).toFixed(1)}%</span> of all actual negative cases.
                                <span className="text-xs text-gray-400 ml-2">(This is your Specificity)</span>
                        </li>
                        <li>
                            When your model predicts positive, it is correct <span className="font-bold text-green-400">{(metrics.precision * 100).toFixed(1)}%</span> of the time.
                                <span className="text-xs text-gray-400 ml-2">(This is your Precision)</span>
                        </li>
                    </ul>
                </div>
                <div className="border-t border-gray-700 pt-4">
                    <p className="font-semibold text-gray-100">Key Trade-offs:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong className="text-red-400">Lowering the threshold</strong> is like casting a wider net. You'll catch more true positives (higher Recall), but you'll also incorrectly label more negatives as positives (more False Positives, lower Precision).</li>
                        <li><strong className="text-blue-400">Raising the threshold</strong> is like being more selective. You'll make fewer mistakes on positive predictions (higher Precision), but you'll miss more of the actual positive cases (more False Negatives, lower Recall).</li>
                    </ul>
                </div>
                <div className="border-t border-gray-700 pt-4">
                    <p className="font-semibold text-gray-100">When to Use This Threshold:</p>
                    <div className="mt-2 space-y-1 text-sm">
                        <div className="flex items-start">
                            <span className="font-bold text-green-400 mr-2 shrink-0">✓ Good for:</span>
                            <span>{goodFor}</span>
                        </div>
                        <div className="flex items-start mt-1">
                            <span className="font-bold text-red-400 mr-2 shrink-0">✗ Consider Alternatives for:</span>
                            <span>{avoidFor}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};