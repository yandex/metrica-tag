import { flags } from '@inject';
import { toNativeOrFalse } from 'src/utils/function/isNativeFunction/toNativeOrFalse';
import { getPath } from 'src/utils/object';
import { MapPoly } from './polyfill';
import { PolyMapConstructor } from './types';

const getPolyMap = (): PolyMapConstructor => {
    if (flags.POLYFILLS_ES6_FEATURE) {
        const NativeMap = Map;
        const construct = toNativeOrFalse(NativeMap as any, 'Map');
        if (!construct) {
            return MapPoly;
        }

        const get = toNativeOrFalse(
            getPath(NativeMap.prototype, 'get')!,
            'get',
        );
        const set = toNativeOrFalse(
            getPath(NativeMap.prototype, 'set')!,
            'set',
        );
        const has = toNativeOrFalse(
            getPath(NativeMap.prototype, 'has')!,
            'has',
        );
        const del = toNativeOrFalse(
            getPath(NativeMap.prototype, 'delete')!,
            'delete',
        );
        const clear = toNativeOrFalse(
            getPath(NativeMap.prototype, 'clear')!,
            'clear',
        );
        const forEach = toNativeOrFalse(
            getPath(NativeMap.prototype, 'forEach')!,
            'forEach',
        );

        if (get && set && has && del && clear && forEach) {
            return NativeMap;
        }

        return MapPoly;
    }

    return Map;
};

export const PolyMap: PolyMapConstructor = /* @__PURE__ */ getPolyMap();
