import { ECOMMERCE_FEATURE, PARAMS_FEATURE } from 'generated/features';
import { flags } from '@inject';
import { providersSync } from 'src/providersEntrypoint';
import { addCounterOptions } from 'src/providers/counterOptions';
import { convertToString } from 'src/utils/string';
import { ecommerce } from './ecommerce';

declare module 'src/providers/debugEvents/types' {
    export type EcommerceEvent = DebuggerEventGeneric<
        'ecommerce',
        Record<string, any>
    >;

    export interface DebuggerEventsMap {
        ecom: EcommerceEvent;
    }
}

declare module 'src/utils/counterOptions/types' {
    interface CounterOptions {
        ecommerce?: string;
    }
}

declare module 'src/utils/counterSettings/types' {
    interface CounterSettingsParams {
        /** ecommerce */
        ecommerce?: string;
    }
}

export const initProvider = () => {
    // NOTE: The ecommerce feature depends on params method
    if (flags[ECOMMERCE_FEATURE] && flags[PARAMS_FEATURE]) {
        providersSync.push(ecommerce);
        addCounterOptions({
            ecommerce: {
                optKey: 'ecommerce',
                normalizeFunction: (value: unknown) => {
                    if (!value) {
                        return undefined;
                    }

                    if (value === true) {
                        return 'dataLayer';
                    }

                    return convertToString(value);
                },
            },
        });
    }
};
