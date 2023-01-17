import { getPath } from 'src/utils/object/path';

export const getNativeFunction = (functionName: string, owner: any) => {
    const ownerFn = getPath(owner, functionName);
    const fn =
        getPath(owner, `constructor.prototype.${functionName}`) || ownerFn;
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
