import { noop } from 'src/utils/function/noop';
import type { AnyFunc } from 'src/utils/function/types';
import * as time from 'src/utils/time/time';
import * as sinon from 'sinon';
import { expect } from 'chai';
import Sinon from 'sinon';
import {
    iterForOf,
    iterForEach,
    iterNextCall,
    iterPop,
    iterPopUntilMaxTime,
} from '../iterator';

describe('iterator universal', () => {
    const win = {} as Window;
    const testArrayOrigin = [1, 2, 3, 4];
    let timeOneStub: Sinon.SinonStub<
        Parameters<typeof time.TimeOne>,
        ReturnType<typeof time.TimeOne>
    >;
    const sandbox = sinon.createSandbox();

    beforeEach(() => {
        timeOneStub = sandbox.stub(time, 'TimeOne');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('call pop iterator until max time', () => {
        const callCounter = sandbox.spy();
        let timeCallCounter = 0;
        timeOneStub.returns(<R>() => {
            timeCallCounter += 1;
            if (timeCallCounter === 1) {
                return 1 as R;
            }
            return 1000000 as R;
        });
        const iterFn = iterForOf(testArrayOrigin.slice(), callCounter);
        iterFn(iterPopUntilMaxTime(win, 10));
        sinon.assert.calledOnce(callCounter);
    });

    it('create pop iterator', () => {
        const arrayToMerge = testArrayOrigin.slice();
        const historyArray = [4, 4, 3, 2, 1, 3, 2, 1];
        const checkHistoryArray: number[] = [];
        const iterFn = iterForOf(testArrayOrigin.slice(), (elem, list) => {
            if (arrayToMerge.length && Array.isArray(list)) {
                list.push(arrayToMerge.pop()!);
            }
            checkHistoryArray.push(elem);
            return elem;
        });
        const result = iterFn(iterPop(noop));
        expect(result).to.be.eq(1);
        expect(checkHistoryArray).to.be.deep.eq(historyArray);
        expect(arrayToMerge).to.lengthOf(0);
    });

    it('create iterator for array', () => {
        const testArray = testArrayOrigin.slice();
        const readyArray: number[] = [];
        const iterFn = iterForOf<number, number>(testArray);
        iterFn(
            iterForEach((result: number) => {
                readyArray.push(result);
            }),
        );
        expect(readyArray).to.be.deep.eq(testArray);

        const iterFn2 = iterForOf(testArray, (a) => a * 2);
        const result = iterFn2(iterForEach(noop));
        expect(result).to.be.deep.eq([2, 4, 6, 8]);
    });

    it('iter on next functions', () => {
        let count = 0;
        const syncFn = (next: () => void) => {
            count += 1;
            next();
        };
        const finishFn = (next: () => void) => {
            count += 1;
            expect(count).to.be.eq(3);
            next();
        };
        const iterator = iterForOf(
            [syncFn, syncFn, finishFn],
            (fn: AnyFunc, next) => {
                fn(next);
            },
        );
        iterator(iterNextCall);
        expect(count).to.be.eq(3);
    });
});
