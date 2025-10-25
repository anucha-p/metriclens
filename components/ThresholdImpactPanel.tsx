import React from 'react';

export const ThresholdImpactPanel: React.FC = () => {
    return (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 animate-fade-in h-full">
            <h3 className="text-lg font-bold text-white text-center">Threshold Impact</h3>
            <div className="border-b border-gray-700 w-1/2 mx-auto my-3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-300 mt-4">
                <div className="sm:border-r sm:border-gray-700 sm:pr-8">
                    <p className="font-semibold text-lg text-orange-400 mb-2">↓ Lower (e.g., 0.30)</p>
                    <ul className="list-none space-y-1 pl-2">
                        <li>- More pixels detected</li>
                        <li>- <span className="font-semibold text-green-400">Higher</span> Recall</li>
                        <li>- <span className="font-semibold text-red-400">Lower</span> Precision</li>
                        <li>- More <span className="font-semibold text-red-400">False Positives</span></li>
                    </ul>
                </div>
                
                <div className="sm:pl-8">
                    <p className="font-semibold text-lg text-indigo-400 mb-2">↑ Higher (e.g., 0.70)</p>
                    <ul className="list-none space-y-1 pl-2">
                        <li>- Fewer pixels detected</li>
                        <li>- <span className="font-semibold text-red-400">Lower</span> Recall</li>
                        <li>- <span className="font-semibold text-green-400">Higher</span> Precision</li>
                        <li>- More <span className="font-semibold text-blue-400">False Negatives</span></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
