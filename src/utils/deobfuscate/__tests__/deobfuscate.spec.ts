import { cReverse } from 'src/utils/array/reverse';
import * as chai from 'chai';
import { deobfuscate } from '../deobfuscate';

const obfuscate = (obj: Record<string, any>) => {
    const cp = { ...obj };
    Object.keys(cp).forEach((key) => {
        const value = cp[key];
        delete cp[key];
        cp[cReverse(key.split('')).join('')] = value;
    });
    return cp;
};

describe('deobfuscate', () => {
    it('should deobfuscate key', () => {
        const value = 'value';
        const testObj = obfuscate({ value });
        const deobfuscatedKey = deobfuscate(obfuscate({ value: 1 }));

        chai.expect(testObj[deobfuscatedKey]).to.eq(value);
    });
});
