import * as chai from 'chai';
import { isNativeFn } from '../isNativeFn';

describe('isNativeFunction', () => {
    it('checks native functions correctly', () => {
        const func = function a() {
            // do nothing
        };
        let toString = '';
        func.toString = () => toString;

        toString = 'function func () {[native-code]}';
        chai.assert(isNativeFn('func', func));

        toString = 'function func() {[native code]}';
        chai.assert(isNativeFn('func', func));

        toString = 'function () { a = 123; }';
        chai.assert(!isNativeFn('func', func));

        chai.assert(!isNativeFn('func', null as any));

        chai.assert(!isNativeFn('func', {} as any));
    });

    it("Doesn't throw exception if something weird happens", () => {
        const func = function a() {
            // do nothing
        };
        func.toString = () => {
            throw Error();
        };

        chai.assert(!isNativeFn('func', func));
    });
});
