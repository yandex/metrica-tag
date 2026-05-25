import { Buffer, createBuffer } from 'src/utils/buffer/buffer';

export type ExecutionTimingSample = {
    scope: string;
    startTime: number;
    endTime: number;
};

const MAX_EXECUTION_TIMING_SAMPLES = 100;

const executionTimingBuffer: Buffer<ExecutionTimingSample> =
    createBuffer<ExecutionTimingSample>(MAX_EXECUTION_TIMING_SAMPLES);

export const pushExecutionTiming = (
    scope: string,
    startTime: number,
    endTime: number,
) => {
    executionTimingBuffer.push({ scope, startTime, endTime });
};

export const getExecutionTimingBuffer = () => executionTimingBuffer;
