import { flags } from '@inject';
import { PolySetConstructor } from './types';
import { toNativeOrFalse } from '../function/isNativeFunction/toNativeOrFalse';
import { getPath } from '../object/path';
import { SetPoly } from './polyfill';

const getPolySet = (): PolySetConstructor => {
    if (flags.POLYFILLS_ES6_FEATURE) {
        const NativeSet = Set;
        const construct = toNativeOrFalse(NativeSet as any, 'Set');
        if (!construct) {
            return SetPoly;
        }
        const add = toNativeOrFalse(
            getPath(NativeSet.prototype, 'add')!,
            'add',
        );
        const has = toNativeOrFalse(
            getPath(NativeSet.prototype, 'has')!,
            'has',
        );
        const del = toNativeOrFalse(
            getPath(NativeSet.prototype, 'delete')!,
            'delete',
        );
        const clear = toNativeOrFalse(
            getPath(NativeSet.prototype, 'clear')!,
            'clear',
        );
        const forEach = toNativeOrFalse(
            getPath(NativeSet.prototype, 'forEach')!,
            'forEach',
        );

        if (add && has && del && clear && forEach) {
            return Set;
        }

        return SetPoly;
    }
    return Set;
};

export const PolySet: PolySetConstructor = /* @__PURE__ */ getPolySet();
