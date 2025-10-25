import type { SegmentationSample } from '../types';

// Helper to create a base64 mask with a shape
const createMask = (
  shape: 'circle' | 'square', 
  type: 'gt' | 'pred', 
  size = 128,
  offsetX = 0,
  offsetY = 0
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);

  if (type === 'gt') {
    ctx.fillStyle = '#fff';
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(size / 2 + offsetX, size / 2 + offsetY, size / 3, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(size / 4 + offsetX, size / 4 + offsetY, size / 2, size / 2);
    }
  } else { // 'pred'
    const gradient = ctx.createRadialGradient(
      size / 2 + offsetX, 
      size / 2 + offsetY, 
      0, 
      size / 2 + offsetX, 
      size / 2 + offsetY, 
      size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.8)');
    gradient.addColorStop(0.8, 'rgba(100, 100, 100, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = gradient;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(size / 2 + offsetX, size / 2 + offsetY, size / 2.5, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(size / 5 + offsetX, size / 5 + offsetY, size * 0.6, size * 0.6);
    }
  }
  return canvas.toDataURL();
};

export const segmentationDataset: SegmentationSample[] = [
    {
        id: 'perfect_circle',
        name: 'Perfect Circle Example',
        gt_description_line1: 'Target: Simple Circle',
        gt_description_line2: '(Synthetic annotation)',
        originalImage: 'https://placehold.co/256x256/2F3747/E0E0E0?text=Sample+1',
        groundTruthMask: createMask('circle', 'gt', 256),
        predictionMask: createMask('circle', 'pred', 256),
        hausdorffDistance: 4.8,
        boundaryF1: 0.96,
        taskDescription: 'This is a simple circle segmentation task.',
    },
    {
        id: 'offset_square',
        name: 'Offset Square Example',
        gt_description_line1: 'Target: Square Shape',
        gt_description_line2: '(Slight misalignment)',
        originalImage: 'https://placehold.co/256x256/581C87/E0E0E0?text=Sample+2',
        groundTruthMask: createMask('square', 'gt', 256),
        predictionMask: createMask('square', 'pred', 256, 15, -10),
        hausdorffDistance: 18.0,
        boundaryF1: 0.72,
        taskDescription: 'This task shows a slight misalignment between the prediction and the ground truth.',
    },
    {
        id: 'missed_shape',
        name: 'Mismatched Shape Example',
        gt_description_line1: 'Target: Circle vs. Square',
        gt_description_line2: '(Model predicts wrong class)',
        originalImage: 'https://placehold.co/256x256/9D174D/E0E0E0?text=Sample+3',
        groundTruthMask: createMask('circle', 'gt', 256, 40, 40),
        predictionMask: createMask('square', 'pred', 256),
        hausdorffDistance: 62.5,
        boundaryF1: 0.18,
        taskDescription: 'This task demonstrates a model predicting the wrong shape class (a square instead of a circle).',
    },
];