import { isNil } from './assertions';

export const { hasOwnProperty } = Object.prototype;

export const has = (
    object: any,
    property: string,
): ReturnType<typeof hasOwnProperty> => {
    return isNil(object) ? false : hasOwnProperty.call(object, property);
};
