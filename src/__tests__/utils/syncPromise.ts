import type { TransportResponse } from 'src/transport/types';
import type { AnyFunc } from 'src/utils/function/types';

export const syncPromise = {
    then(callback?: AnyFunc) {
        if (callback) {
            callback();
        }
        return this;
    },
    catch() {
        return this;
    },
} as Promise<TransportResponse>;
