import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  previousValue?: number;
  markers?: { value: number; label: string }[];
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  previousValue,
  markers = [],
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  const showPrevious = previousValue !== undefined && Math.abs(value - previousValue) > (step / 2);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-400">{label}</label>
        <div className="flex items-baseline space-x-2">
            <span className="text-xl font-mono font-bold bg-gray-700 text-white px-3 py-1 rounded-md">
                {value.toFixed(2)}
            </span>
            {showPrevious && (
                <span className="text-xs font-mono text-gray-500">(was {previousValue.toFixed(2)})</span>
            )}
        </div>
      </div>
      <div className="relative h-16">
        <div className="relative pt-6">
            {/* Tick Marks */}
            <div className="absolute top-[34px] left-[12px] right-[12px] h-3 pointer-events-none" aria-hidden="true">
                {[0.25, 0.5, 0.75].map(val => {
                    const pos = ((val - min) / (max - min)) * 100;
                    return <div key={val} className="absolute w-px h-1.5 bg-gray-500/70" style={{ left: `${pos}%` }} />;
                })}
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                    // Gradient from blue-500 to indigo-600 for the filled part
                    background: `linear-gradient(to right, #3b82f6, #4f46e5 ${percentage}%, #4b5563 ${percentage}%)`
                }}
            />
            {markers.map(marker => {
                const markerPercentage = ((marker.value - min) / (max - min)) * 100;
                return (
                <div key={marker.label} 
                    className="absolute top-0 transform -translate-x-1/2 text-center group"
                    style={{ left: `${markerPercentage}%` }}>
                    <div className="w-0.5 h-5 bg-indigo-400/70 group-hover:bg-indigo-300 transition-colors"></div>
                    <div className="text-xs text-indigo-400/80 absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-800 rounded">
                        {marker.label}
                    </div>
                </div>
                );
            })}
        </div>
         {/* Labels */}
        <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{min.toFixed(1)}</span>
            <span>{((max-min)/2 + min).toFixed(1)}</span>
            <span>{max.toFixed(1)}</span>
        </div>
      </div>
       <style>{`
          .slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            background: #a5b4fc;
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid #4f46e5;
            margin-top: -6px; /* Centers the thumb on the track */
            transition: background 0.3s;
            position: relative;
            z-index: 10;
          }
          .slider-thumb:hover::-webkit-slider-thumb {
            background: #818cf8;
          }
          .slider-thumb::-moz-range-thumb {
            width: 24px;
            height: 24px;
            background: #a5b4fc;
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid #4f46e5;
            position: relative;
            z-index: 10;
          }
           .slider-thumb:hover::-moz-range-thumb {
            background: #818cf8;
          }
       `}</style>
    </div>
  );
};