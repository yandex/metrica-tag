import { getPath as getFunctionUtils } from 'src/utils/object/path';

// FIXME: get rid of any
export const getNativeFunction = (functionName: string, owner: any) => {
    const ownerFn = getFunctionUtils(owner, functionName);
    const fn =
        getFunctionUtils(owner, `constructor.prototype.${functionName}`) ||
        ownerFn;
    try {
        if (fn && fn.apply) {
            return function nativeFunction() {
                // eslint-disable-next-line prefer-rest-params
                return fn.apply(owner, arguments);
            };
        }
    } catch (e) {
        // ie 8
        return ownerFn;
    }
    return fn;
};
