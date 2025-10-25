import { useRef, useEffect } from 'react';

/**
 * A custom hook that returns the previous value of a variable from the last render.
 * @param value The value to track.
 * @returns The value from the previous render, or undefined on the first render.
 */
export function usePrevious<T>(value: T): T | undefined {
    // FIX: The useRef hook requires an initial value. Provide `undefined` to correctly initialize the ref.
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}
