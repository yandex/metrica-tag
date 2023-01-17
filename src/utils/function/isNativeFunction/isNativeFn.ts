const APPROXIMATE_LENGHT_OF_NATIVE_FN_STRINGIFIED = 35;
const nativeCode = '[native code]';
const NATIVE_CODE_LENGTH = nativeCode.length;
const SEPARATOR_INDEX = 7;

export const isNativeFn = (functionName: string, fn: Function) => {
    // ie8: "typeof window.attachEvent" => "object"
    const isNil = !fn;
    const isNotAFunction = typeof fn !== 'function';
    if (isNil || isNotAFunction) {
        return false;
    }
    let stringifiedFN: string;
    try {
        stringifiedFN = `${fn}`;
    } catch (e) {
        return false;
    }

    const fnLength = stringifiedFN.length;

    if (
        fnLength >
        APPROXIMATE_LENGHT_OF_NATIVE_FN_STRINGIFIED + functionName.length
    ) {
        return false;
    }

    const lastIndexOfInterest = fnLength - NATIVE_CODE_LENGTH;
    let substrIndex = 0;
    // it starts with index 8 because stringifiedFN starts with "function"
    for (let i = 8; i < fnLength; i += 1) {
        if (
            nativeCode[substrIndex] === stringifiedFN[i] ||
            (substrIndex === SEPARATOR_INDEX && stringifiedFN[i] === '-')
        ) {
            substrIndex += 1;
        } else {
            substrIndex = 0;
        }

        if (substrIndex === NATIVE_CODE_LENGTH - 1) {
            return true;
        }

        if (!substrIndex && i > lastIndexOfInterest) {
            return false;
        }
    }

    return false;
};
