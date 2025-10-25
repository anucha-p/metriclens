import React, { useState, useRef, useEffect, useMemo } from 'react';
import { segmentationDataset } from '../data/segmentationData';
import { useDebounce } from '../hooks/useDebounce';
import { Slider } from './Slider';
import { MetricCard } from './MetricCard';
import { ThresholdImpactPanel } from './ThresholdImpactPanel';
import { ImageContextPanel } from './ImageContextPanel';

const CanvasPanel: React.FC<{
  title: string;
  description: React.ReactNode;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  children?: React.ReactNode;
}> = ({ title, description, canvasRef, children }) => (
    <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 flex flex-col">
        <h3 className="font-semibold mb-1 text-gray-300 text-center">{title}</h3>
        <div className="text-xs text-gray-500 h-10 flex items-center justify-center mb-1 text-center">
            {description}
        </div>
        <canvas ref={canvasRef} className="w-full h-auto rounded-md aspect-square bg-black"></canvas>
        {children}
    </div>
);


export const SegmentationDemo: React.FC = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [threshold, setThreshold] = useState(0.5);
    const debouncedThreshold = useDebounce(threshold, 100);
    const [pixelCounts, setPixelCounts] = useState({ tp: 0, fp: 0, fn: 0, tn: 0 });
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: React.ReactNode } | null>(null);

    const originalCanvasRef = useRef<HTMLCanvasElement>(null);
    const gtCanvasRef = useRef<HTMLCanvasElement>(null);
    const predCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlapCanvasRef = useRef<HTMLCanvasElement>(null);
    const tpCanvasRef = useRef<HTMLCanvasElement>(null);
    const fpCanvasRef = useRef<HTMLCanvasElement>(null);
    const fnCanvasRef = useRef<HTMLCanvasElement>(null);
    const tnCanvasRef = useRef<HTMLCanvasElement>(null);

    const canvasAreaRef = useRef<HTMLDivElement>(null);
    const gtImageDataRef = useRef<Uint8ClampedArray | null>(null);
    const predProbDataRef = useRef<Uint8ClampedArray | null>(null);

    const currentSample = segmentationDataset[currentImageIndex];

    useEffect(() => {
        const canvases = [
            originalCanvasRef.current, gtCanvasRef.current, predCanvasRef.current, overlapCanvasRef.current,
            tpCanvasRef.current, fpCanvasRef.current, fnCanvasRef.current, tnCanvasRef.current,
        ];
        if (canvases.some(c => !c)) return;

        const originalCtx = originalCanvasRef.current!.getContext('2d')!;
        const gtCtx = gtCanvasRef.current!.getContext('2d')!;
        const predCtx = predCanvasRef.current!.getContext('2d')!;
        const overlapCtx = overlapCanvasRef.current!.getContext('2d')!;
        const tpCtx = tpCanvasRef.current!.getContext('2d')!;
        const fpCtx = fpCanvasRef.current!.getContext('2d')!;
        const fnCtx = fnCanvasRef.current!.getContext('2d')!;
        const tnCtx = tnCanvasRef.current!.getContext('2d')!;
        
        const originalImg = new Image();
        const gtMask = new Image();
        const predMask = new Image();

        const loadImages = async () => {
            originalImg.crossOrigin = 'Anonymous';
            originalImg.src = currentSample.originalImage;
            gtMask.src = currentSample.groundTruthMask;
            predMask.src = currentSample.predictionMask;
            
            await Promise.all([
                new Promise(res => originalImg.onload = res),
                new Promise(res => gtMask.onload = res),
                new Promise(res => predMask.onload = res),
            ]);
            
            const w = originalImg.width;
            const h = originalImg.height;

            canvases.forEach(c => { if(c) { c.width = w; c.height = h; } });
            
            originalCtx.drawImage(originalImg, 0, 0, w, h);
            gtCtx.drawImage(gtMask, 0, 0, w, h);
            
            const tempPredCanvas = document.createElement('canvas');
            tempPredCanvas.width = w;
            tempPredCanvas.height = h;
            const tempPredCtx = tempPredCanvas.getContext('2d')!;
            tempPredCtx.drawImage(predMask, 0, 0, w, h);
            
            const originalImageData = originalCtx.getImageData(0, 0, w, h).data;
            const gtImageData = gtCtx.getImageData(0, 0, w, h).data;
            const predProbImageData = tempPredCtx.getImageData(0, 0, w, h);
            const predProbData = predProbImageData.data;

            gtImageDataRef.current = gtImageData;
            predProbDataRef.current = predProbData;
            
            const predImageData = predCtx.createImageData(w, h);
            const predData = predImageData.data;

            const overlapImageData = overlapCtx.createImageData(w, h);
            const tpImageData = tpCtx.createImageData(w, h);
            const fpImageData = fpCtx.createImageData(w, h);
            const fnImageData = fnCtx.createImageData(w, h);
            const tnImageData = tnCtx.createImageData(w, h);

            let tp = 0, fp = 0, fn = 0, tn = 0;

            for (let i = 0; i < predProbData.length; i += 4) {
                const gtIsWhite = gtImageData[i] > 128;
                const predProb = predProbData[i] / 255;
                const predIsWhite = predProb >= debouncedThreshold;
                
                const val = predIsWhite ? 255 : 0;
                predData[i] = predData[i+1] = predData[i+2] = val;
                predData[i+3] = 255;

                if(gtIsWhite && predIsWhite) { // TP
                    tp++;
                    // Green for TP
                    overlapImageData.data[i] = 74; overlapImageData.data[i+1] = 222; overlapImageData.data[i+2] = 128; overlapImageData.data[i+3] = 200;
                    tpImageData.data[i] = 74; tpImageData.data[i+1] = 222; tpImageData.data[i+2] = 128; tpImageData.data[i+3] = 200;
                } else if (!gtIsWhite && predIsWhite) { // FP
                    fp++;
                    // Red for FP
                    overlapImageData.data[i] = 248; overlapImageData.data[i+1] = 113; overlapImageData.data[i+2] = 113; overlapImageData.data[i+3] = 200;
                    fpImageData.data[i] = 248; fpImageData.data[i+1] = 113; fpImageData.data[i+2] = 113; fpImageData.data[i+3] = 200;
                } else if (gtIsWhite && !predIsWhite) { // FN
                    fn++;
                    // Blue for FN
                    overlapImageData.data[i] = 96; overlapImageData.data[i+1] = 165; overlapImageData.data[i+2] = 250; overlapImageData.data[i+3] = 200;
                    fnImageData.data[i] = 96; fnImageData.data[i+1] = 165; fnImageData.data[i+2] = 250; fnImageData.data[i+3] = 200;
                } else { // TN
                    tn++;
                    // Black for TN in main overlap
                    overlapImageData.data[i] = 0; overlapImageData.data[i+1] = 0; overlapImageData.data[i+2] = 0; overlapImageData.data[i+3] = 255;
                    // Transparent overlay for TN breakdown
                    tnImageData.data[i] = originalImageData[i];
                    tnImageData.data[i+1] = originalImageData[i+1];
                    tnImageData.data[i+2] = originalImageData[i+2];
                    tnImageData.data[i+3] = 50;
                }
            }
            
            predCtx.putImageData(predImageData, 0, 0);
            overlapCtx.putImageData(overlapImageData, 0, 0);
            tpCtx.putImageData(tpImageData, 0, 0);
            fpCtx.putImageData(fpImageData, 0, 0);
            fnCtx.putImageData(fnImageData, 0, 0);
            tnCtx.drawImage(originalImg, 0, 0); // Draw original image as background for TN
            tnCtx.putImageData(tnImageData,0,0);
            setPixelCounts({tp, fp, fn, tn});
        };

        loadImages();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSample, debouncedThreshold]);

    const metrics = useMemo(() => {
        const { tp, fp, fn, tn } = pixelCounts;
        const totalPixels = tp + fp + fn + tn;
        const iou = tp / (tp + fp + fn) || 0;
        const dice = (2 * tp) / (2 * tp + fp + fn) || 0;
        const accuracy = (tp + tn) / totalPixels || 0;
        const precision = tp / (tp + fp) || 0;
        const recall = tp / (tp + fn) || 0;
        const f1 = 2 * (precision * recall) / (precision + recall) || 0;
        const specificity = tn / (tn + fp) || 0;

        return { iou, dice, accuracy, precision, recall, f1, specificity };
    }, [pixelCounts]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!canvasAreaRef.current || !gtImageDataRef.current || !predProbDataRef.current) return;

        const containerRect = canvasAreaRef.current.getBoundingClientRect();
        const target = e.target as HTMLElement;

        if (target.tagName.toLowerCase() !== 'canvas') {
            if (tooltip?.visible) handleMouseLeave();
            return;
        }

        const canvas = target as HTMLCanvasElement;
        const canvasRect = canvas.getBoundingClientRect();

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const x = mouseX - canvasRect.left;
        const y = mouseY - canvasRect.top;

        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;
        const canvasX = Math.floor(x * scaleX);
        const canvasY = Math.floor(y * scaleY);

        if (canvasX < 0 || canvasX >= canvas.width || canvasY < 0 || canvasY >= canvas.height) {
            if (tooltip?.visible) handleMouseLeave();
            return;
        }

        const index = (canvasY * canvas.width + canvasX) * 4;
        const gtIsWhite = gtImageDataRef.current[index] > 128;
        const predProb = predProbDataRef.current[index] / 255;
        const predIsWhite = predProb >= debouncedThreshold;

        let classification = '';
        if (gtIsWhite && predIsWhite) classification = 'True Positive';
        else if (!gtIsWhite && predIsWhite) classification = 'False Positive';
        else if (gtIsWhite && !predIsWhite) classification = 'False Negative';
        else classification = 'True Negative';

        setTooltip({
            visible: true,
            x: mouseX - containerRect.left + 15,
            y: mouseY - containerRect.top + 15, // Position below cursor
            content: (
                <div className="text-xs">
                    <p>Pixel ({canvasX}, {canvasY})</p>
                    <p>Classification: <span className="font-semibold">{classification}</span></p>
                    <p>Ground Truth: <span className="font-mono">{gtIsWhite ? '1.0' : '0.0'}</span></p>
                    <p>Prediction: <span className="font-mono">{predProb.toFixed(2)}</span></p>
                </div>
            )
        });
    };

    const handleMouseLeave = () => {
        setTooltip(prev => prev ? { ...prev, visible: false } : null);
    };

    const totalPixels = pixelCounts.tp + pixelCounts.fp + pixelCounts.fn + pixelCounts.tn;
    
    const tooltipExplanations = {
        iou: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">IoU (Jaccard Index)</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">TP / (TP + FP + FN)</p>
                <p className="text-sm mb-2">Measures the overlap between the predicted mask and the ground truth mask. It's one of the most common metrics for segmentation.</p>
                <p className="text-sm"><strong className="text-indigo-300">Interpretation:</strong> A value of 1.0 means perfect overlap, while 0 means no overlap.</p>
            </div>
        ),
        dice: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Dice Coefficient</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">(2 * TP) / (2*TP + FP + FN)</p>
                <p className="text-sm mb-2">Also measures overlap, similar to IoU. It's the harmonic mean of precision and recall if you consider TP, FP, FN as pixel counts.</p>
                <p className="text-sm"><strong className="text-indigo-300">When to use:</strong> Very common in medical imaging. It tends to be slightly more forgiving of small errors than IoU.</p>
            </div>
        ),
        f1: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">F1-Score</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">2 * (Prec * Rec) / (Prec + Rec)</p>
                <p className="text-sm mb-2">The harmonic mean of pixel-level Precision and Recall. It provides a single score that balances the trade-off between them.</p>
                <p className="text-sm"><strong className="text-indigo-300">When to use:</strong> Excellent for images where the object to be segmented is small compared to the background (imbalanced classes).</p>
            </div>
        ),
        accuracy: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Accuracy</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">(TP + TN) / Total Pixels</p>
                <p className="text-sm mb-2">The percentage of all pixels (both object and background) that were correctly classified.</p>
                <p className="text-sm"><strong className="text-indigo-300">When to use:</strong> Good when the object and background have a similar number of pixels.</p>
                <p className="text-xs text-gray-400 italic mt-2">Be cautious: Can be very misleading if the object is small. A model can get 99% accuracy by just predicting "background" for every pixel.</p>
            </div>
        ),
        precision: (
             <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Precision</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">TP / (TP + FP)</p>
                <p className="text-sm mb-2">Of all the pixels the model labeled as "object", what percentage were actually part of the object.</p>
                <p className="text-sm"><strong className="text-indigo-300">When it matters:</strong> When you want to be very sure that the predicted mask is clean and doesn't include background noise (low False Positives).</p>
            </div>
        ),
        recall: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Recall</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">TP / (TP + FN)</p>
                <p className="text-sm mb-2">Of all the actual "object" pixels, what percentage did the model find.</p>
                <p className="text-sm"><strong className="text-indigo-300">When it matters:</strong> When it's critical to find all parts of the object, even if it means incorrectly labeling some background pixels (higher False Positives).</p>
            </div>
        ),
        specificity: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Specificity</p>
                <p className="text-xs font-mono bg-gray-900 rounded px-1 py-0.5 inline-block mb-2">TN / (TN + FP)</p>
                <p className="text-sm mb-2">Of all the actual "background" pixels, what percentage did the model correctly identify as background.</p>
                <p className="text-sm"><strong className="text-indigo-300">When it matters:</strong> When you need to be very sure you are not misclassifying the background, e.g., to avoid occluding important details behind a predicted mask.</p>
            </div>
        ),
        boundaryF1: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Boundary F1 Score</p>
                <p className="text-sm mb-2">An F1-Score calculated only on the pixels near the boundary of the ground truth object.</p>
                <p className="text-sm"><strong className="text-indigo-300">Why it's useful:</strong> Standard IoU/Dice might not penalize incorrect boundaries enough if the object is large. This metric specifically evaluates how well the predicted boundary aligns with the true boundary. A high score means a precise boundary.</p>
            </div>
        ),
        hausdorff: (
            <div className="text-left max-w-xs">
                <p className="font-bold text-white mb-1">Hausdorff Distance</p>
                <p className="text-sm mb-2">A measure of how far two shapes are from each other. It finds the point on the predicted boundary that is farthest from any point on the true boundary.</p>
                <p className="text-sm"><strong className="text-indigo-300">Interpretation:</strong> A lower value is better, indicating the boundaries are close. It is very sensitive to outliers and can highlight significant prediction errors like detached segments. Units are in pixels.</p>
            </div>
        ),
    };

    return (
        <div className="space-y-6">
            <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl space-y-4">
                 <div className="flex justify-center items-center gap-4">
                    <label className="text-sm font-medium text-gray-400">Select Image:</label>
                    {segmentationDataset.map((sample, index) => (
                        <button key={sample.id} onClick={() => setCurrentImageIndex(index)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${currentImageIndex === index ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            Image {index + 1}
                        </button>
                    ))}
                </div>
                <Slider label="Segmentation Threshold" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} />
            </div>

            <div ref={canvasAreaRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="relative space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                    <CanvasPanel title="Original" description={<p>{currentSample.name}</p>} canvasRef={originalCanvasRef} />
                    <CanvasPanel title="Ground Truth" description={<p>{currentSample.gt_description_line1}<br/>{currentSample.gt_description_line2}</p>} canvasRef={gtCanvasRef} />
                    <CanvasPanel title="Prediction" description={<p>Model Output<br/>(Threshold: {threshold.toFixed(2)})</p>} canvasRef={predCanvasRef} />
                    <CanvasPanel title="Overlap" description={<p>Error Analysis<br/>TP/FP/FN regions</p>} canvasRef={overlapCanvasRef} />
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-center mb-4 text-white">
                        Overlap Breakdown
                        {totalPixels > 0 && (
                             <span className="text-sm font-normal text-gray-400 ml-2">
                                (Total Pixels: {totalPixels.toLocaleString()})
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                        <CanvasPanel title="True Positive" description={<p className="text-green-400">{pixelCounts.tp.toLocaleString()} ({(totalPixels > 0 ? pixelCounts.tp / totalPixels * 100 : 0).toFixed(1)}%)<br/>Correctly detected</p>} canvasRef={tpCanvasRef} />
                        <CanvasPanel title="False Positive" description={<p className="text-red-400">{pixelCounts.fp.toLocaleString()} ({(totalPixels > 0 ? pixelCounts.fp / totalPixels * 100 : 0).toFixed(1)}%)<br/>Incorrectly detected</p>} canvasRef={fpCanvasRef} />
                        <CanvasPanel title="False Negative" description={<p className="text-blue-400">{pixelCounts.fn.toLocaleString()} ({(totalPixels > 0 ? pixelCounts.fn / totalPixels * 100 : 0).toFixed(1)}%)<br/>Missed detection</p>} canvasRef={fnCanvasRef} />
                        <CanvasPanel title="True Negative" description={<p className="text-gray-400">{pixelCounts.tn.toLocaleString()} ({(totalPixels > 0 ? pixelCounts.tn / totalPixels * 100 : 0).toFixed(1)}%)<br/>Correct background</p>} canvasRef={tnCanvasRef} />
                    </div>
                </div>

                {tooltip?.visible && (
                    <div style={{ transform: `translate(${tooltip.x}px, ${tooltip.y}px)` }} className="absolute top-0 left-0 bg-gray-900 border border-gray-600 rounded-md p-2 shadow-lg pointer-events-none z-10">
                        {tooltip.content}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard name="IoU (Jaccard)" value={metrics.iou} explanation={tooltipExplanations.iou} />
                    <MetricCard name="Dice Coefficient" value={metrics.dice} explanation={tooltipExplanations.dice} />
                    <MetricCard name="F1-Score" value={metrics.f1} explanation={tooltipExplanations.f1} />
                    <MetricCard name="Accuracy" value={metrics.accuracy} explanation={tooltipExplanations.accuracy} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard name="Precision" value={metrics.precision} explanation={tooltipExplanations.precision} />
                    <MetricCard name="Recall" value={metrics.recall} explanation={tooltipExplanations.recall} />
                    <MetricCard name="Specificity" value={metrics.specificity} explanation={tooltipExplanations.specificity} />
                    <MetricCard name="Boundary F1" value={currentSample.boundaryF1 ?? 0} explanation={tooltipExplanations.boundaryF1} />
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard name="Hausdorff Distance" value={currentSample.hausdorffDistance ?? 0} explanation={tooltipExplanations.hausdorff} ratingType="distance" unit="pixels" valueFormatter={(v) => v.toFixed(2)} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ThresholdImpactPanel />
                    <ImageContextPanel
                        sample={currentSample}
                        pixelCounts={pixelCounts}
                        metrics={metrics}
                        threshold={debouncedThreshold}
                    />
                </div>
            </div>
        </div>
    );
};