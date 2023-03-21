import { arrayFrom, arrayFromPoly } from 'src/utils/array/arrayFrom';

export const argsToArray = (args: IArguments) => {
    if (arrayFrom) {
        try {
            return arrayFrom(args);
        } catch (e) {
            // do nothing
        }
    }

    return arrayFromPoly(args);
};
