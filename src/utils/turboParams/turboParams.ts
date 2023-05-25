import { INTERNAL_PARAMS_KEY } from 'src/providers/params/const';
import { getCounterKey } from 'src/utils/counterOptions/getCounterKey';
import type { CounterOptions, Params } from 'src/utils/counterOptions/types';
import { getPath } from 'src/utils/object';

export type TurboInfo = {
    tp?: number;
    tpId?: number;
};

const turboInfo: Record<string, TurboInfo> = {};

const TURBO_PARAMS_PATH = `${INTERNAL_PARAMS_KEY}.turbo_page`;

export const setTurboInfo = (options: CounterOptions, params: Params) => {
    const counterId = getCounterKey(options);
    const tp = getPath(params, TURBO_PARAMS_PATH);
    const tpId = getPath(params, `${TURBO_PARAMS_PATH}_id`);

    if (!turboInfo[counterId]) {
        turboInfo[counterId] = {};
    }

    if (tp || tpId) {
        turboInfo[counterId].tp = tp;
        turboInfo[counterId].tpId = tpId;
    }
};

export const isTurboPage = (options: CounterOptions) => {
    const id = getCounterKey(options);
    return turboInfo[id] && turboInfo[id].tp;
};

export const getTurboPageId = (options: CounterOptions) => {
    const id = getCounterKey(options);
    return (turboInfo[id] && turboInfo[id].tpId) || null;
};
