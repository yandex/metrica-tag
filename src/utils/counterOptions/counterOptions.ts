import { RSYA_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import { OptionsKeysMaps } from 'src/providers/counterOptions/types';
import { cReduce } from 'src/utils/array';
import { entries, getPath } from 'src/utils/object';
import { equal, memo } from '../function';
import { CounterOptions, CounterTypeInterface } from './types';

const turboInfo: Record<
    string,
    {
        tp?: number;
        tpid?: number;
    }
> = {};

const TURBO_PARAMS_PATH = '__ym.turbo_page';

const getCounterKey = memo((opt: CounterOptions) => {
    return `${opt.id}:${opt.counterType}`;
});

const setTurboInfo = (options: CounterOptions, params: any) => {
    const counterId = getCounterKey(options);
    const tp = getPath(params, TURBO_PARAMS_PATH);
    const tpid = getPath(params, `${TURBO_PARAMS_PATH}_id`);

    if (!turboInfo[counterId]) {
        turboInfo[counterId] = {};
    }

    if (tp || tpid) {
        turboInfo[counterId].tp = tp;
        turboInfo[counterId].tpid = tpid;
    }
};

const isTurboPage = (options: CounterOptions) => {
    const id = getCounterKey(options);
    return turboInfo[id] && turboInfo[id].tp;
};

// Добавляем в типизацию строку, чтобы можно было проверять любые инпуты
const isRsyaCounter = equal<CounterTypeInterface | string>(RSYA_COUNTER_TYPE);

const getTurboPageId = (options: CounterOptions) => {
    const id = getCounterKey(options);
    return (turboInfo[id] && turboInfo[id].tpid) || null;
};

const getOriginalOptions = (
    counterOptions: CounterOptions,
    optionsKeysMap: OptionsKeysMaps,
): CounterOptions => {
    return cReduce(
        (futureOptions: Record<string, any>, [obfuscatedKey, value]) => {
            const { optKey } = optionsKeysMap[obfuscatedKey];

            futureOptions[optKey] = value;

            return futureOptions;
        },
        {},
        entries(counterOptions),
    ) as unknown as CounterOptions;
};

const normalizeOptions = (
    counterId: Record<string, unknown> | number,
    optionsKeysMap: OptionsKeysMaps,
    counterParams?: Record<string, unknown>,
    counterType?: number,
    counterDefer?: boolean,
): CounterOptions => {
    const counterData: Record<string, unknown> =
        typeof counterId === 'object'
            ? counterId
            : {
                  id: counterId,
                  counterType,
                  counterDefer,
                  params: counterParams,
              };

    const options = cReduce(
        (
            acc: Record<string, any>,
            [obfuscatedKey, { optKey: key, normalizeFunction: normalize }],
        ) => {
            const value = counterData[key];
            acc[obfuscatedKey] = normalize ? normalize(value) : value;

            return acc;
        },
        {},
        entries(optionsKeysMap),
    ) as unknown as CounterOptions;

    setTurboInfo(options, options.params || {});

    return options;
};

export {
    getCounterKey,
    getOriginalOptions,
    normalizeOptions,
    isTurboPage,
    getTurboPageId,
    setTurboInfo,
    isRsyaCounter,
};
