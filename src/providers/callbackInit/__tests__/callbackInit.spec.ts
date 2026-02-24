import * as chai from 'chai';
import type { AnyFunc } from 'src/utils/function/types';
import { callbackInit, CALLBACK_ARRAY_NAME } from '../callbackInit';

describe('callbackInit', () => {
    const [one, many] = CALLBACK_ARRAY_NAME;
    const win = (fnOne: AnyFunc, fnTwo: AnyFunc) => {
        const out: Record<string, any> = {};
        out[one] = fnOne;
        out[many] = [fnTwo];
        return out;
    };
    it('empty is ok', () => {
        const winInfo: Record<string, any> = {};
        callbackInit(winInfo as any as Window);
        chai.expect(winInfo[one]).to.be.equal(undefined);
        chai.expect(winInfo[many]).to.be.equal(undefined);
    });
    it('call functions in ctx', () => {
        let firstCall = false;
        let secondCall = false;
        const winInfo = win(
            () => {
                firstCall = true;
            },
            () => {
                secondCall = true;
            },
        );
        callbackInit(winInfo as any as Window);
        chai.expect(firstCall).to.be.ok;
        chai.expect(secondCall).to.be.ok;
        chai.expect(winInfo[one]).to.be.equal(undefined);
        chai.expect(winInfo[many]).to.be.equal(undefined);
    });
    it('recursive callback', () => {
        // eslint-disable-next-line prefer-const
        let callbacks;
        const fn = () => {
            callbacks.push(fn);
        };
        callbacks = [fn];
        const winInfo = { [many]: callbacks };
        callbackInit(winInfo as any as Window);
    });
});
