import { isNil } from './assertions';

const nativeHasOwnProperty = Object.prototype.hasOwnProperty;

export const has = (
    object: any,
    property: string,
): ReturnType<typeof nativeHasOwnProperty> =>
    isNil(object) ? false : nativeHasOwnProperty.call(object, property);
