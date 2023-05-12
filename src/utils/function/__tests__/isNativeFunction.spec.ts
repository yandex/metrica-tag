import * as chai from 'chai';
import { isNativeFunction } from '../isNativeFunction';

describe('isNativeFunction', () => {
    it('checks native functions correctly', () => {
        const func = function a() {
            // do nothing
        };
        let toString = '';
        func.toString = () => toString;

        toString = 'function func () {[native-code]}';
        chai.assert(isNativeFunction('func', func));

        toString = 'function func() {[native code]}';
        chai.assert(isNativeFunction('func', func));

        toString = 'function () { a = 123; }';
        chai.assert(!isNativeFunction('func', func));

        chai.assert(!isNativeFunction('func', null as any));

        chai.assert(!isNativeFunction('func', {} as any));
    });

    it("Doesn't throw exception if something weird happens", () => {
        const func = function a() {
            // do nothing
        };
        func.toString = () => {
            throw Error();
        };

        chai.assert(!isNativeFunction('func', func));
    });
});
