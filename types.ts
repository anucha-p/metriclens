export type ModelType = 'high-performance' | 'conservative' | 'balanced';

export interface ClassificationSample {
    id: number;
    groundTruth: 0 | 1;
    predictionScore: number;
}

export interface SegmentationSample {
    id: string;
    name: string;
    gt_description_line1: string;
    gt_description_line2: string;
    originalImage: string;
    groundTruthMask: string;
    predictionMask: string;
    hausdorffDistance?: number;
    boundaryF1?: number;
    taskDescription: string;
}

export interface ConfusionMatrixValues {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
}
export interface CurvePoint {
    threshold: number;
    tpr: number;
    fpr: number;
    precision: number;
    recall: number;
    specificity: number;
}