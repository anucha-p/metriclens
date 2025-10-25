import type { ModelType, ClassificationSample } from '../types';

// Simple Linear Congruential Generator (LCG) for seeded random numbers.
// This creates a function that returns predictable "random" numbers, ensuring
// the dataset is the same on every app load.
const createSeededRandom = (seed: number) => {
    return () => {
        // Parameters from Numerical Recipes
        seed = (seed * 1664525 + 1013904223) % 4294967296; // 2^32
        return seed / 4294967296;
    };
};

// Creates a more natural, bell-curve-like distribution of scores around a mean.
const createGaussianRandom = (randomFunc: () => number, mean: number, stdDev: number) => {
    return () => {
        let u = 0, v = 0;
        while (u === 0) u = randomFunc(); // Converting [0,1) to (0,1)
        while (v === 0) v = randomFunc();
        const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return num * stdDev + mean;
    };
};


export const generateDataset = (modelType: ModelType): ClassificationSample[] => {
    // Fixed seeds for each model type to ensure data is permanent and distinct
    const seeds: Record<ModelType, number> = {
        'high-performance': 12345,
        'balanced': 67890,
        'conservative': 13579,
    };

    const random = createSeededRandom(seeds[modelType]);
    const samples: ClassificationSample[] = [];

    for (let i = 0; i < 200; i++) {
        const groundTruth = random() > 0.5 ? 1 : 0;
        let predictionScore;

        switch (modelType) {
            case 'high-performance': {
                // Highly separated scores with very little noise, representing a confident model.
                const gaussianRandom = createGaussianRandom(random, groundTruth === 1 ? 0.9 : 0.1, 0.08);
                predictionScore = gaussianRandom();
                break;
            }
            case 'conservative': {
                // Scores are heavily clustered around the middle, representing a low-confidence model.
                const gaussianRandom = createGaussianRandom(random, groundTruth === 1 ? 0.6 : 0.4, 0.1);
                predictionScore = gaussianRandom();
                break;
            }
            case 'balanced':
            default: {
                // Good separation but with significant and realistic overlap.
                const gaussianRandom = createGaussianRandom(random, groundTruth === 1 ? 0.75 : 0.25, 0.2);
                predictionScore = gaussianRandom();
                break;
            }
        }

        // Clamp scores to be within the valid [0, 1] range
        predictionScore = Math.max(0, Math.min(1, predictionScore));

        samples.push({
            id: i,
            groundTruth,
            predictionScore,
        });
    }

    return samples;
};