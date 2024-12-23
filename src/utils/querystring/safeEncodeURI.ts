import { cFilter } from '../array/filter';
import { arrayJoin } from '../array/join';

export const safeEncodeURIComponent = (str: string) => {
    try {
        return encodeURIComponent(str);
    } catch (e) {}
    const simpleUTF = arrayJoin(
        '',
        cFilter((char) => {
            const charCode = char.charCodeAt(0);
            return charCode <= 0xd800;
        }, str.split('')),
    );
    return encodeURIComponent(simpleUTF);
};
