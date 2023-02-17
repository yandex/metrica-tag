import { arrayFrom, arrayFromPoly } from 'src/utils/array/arrayFrom';

export const argsToArray = (args: IArguments) => {
    try {
        return arrayFrom(args);
    } catch (e) {
        // do nothing
    }
    return arrayFromPoly(args);
};
