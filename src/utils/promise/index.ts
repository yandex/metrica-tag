/* eslint-disable no-bitwise */
// https://github.com/RubenVerborgh/promiscuous !?!?
import * as polyPromise from 'promise-polyfill';
import { POLYFILLS_FEATURE } from 'generated/features';
import { flags } from '@inject';
import { bind } from 'src/utils/function/bind';
import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';
import { getPath } from 'src/utils/object';

/* eslint-disable-next-line import/no-mutable-exports */
export let PolyPromise: PromiseConstructor = window.Promise;

if (flags[POLYFILLS_FEATURE]) {
    const construct = toNativeOrFalse(PolyPromise as any, 'Promise');
    const resolve = toNativeOrFalse(
        getPath(PolyPromise, 'resolve')!,
        'resolve',
    );
    const reject = toNativeOrFalse(getPath(PolyPromise, 'reject')!, 'reject');
    const all = toNativeOrFalse(getPath(PolyPromise, 'all')!, 'all');
    if (construct && resolve && reject && all) {
        const anyPromise = function promiseWrapper(
            a: ConstructorParameters<PromiseConstructor>[0],
        ) {
            return new Promise(a);
        } as any;
        anyPromise.resolve = bind(resolve, PolyPromise);
        anyPromise.reject = bind(reject, PolyPromise);
        anyPromise.all = bind(all, PolyPromise);
        PolyPromise = anyPromise;
    } else {
        PolyPromise = polyPromise.default;
    }
}
