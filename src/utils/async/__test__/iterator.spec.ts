import { call, noop } from 'src/utils/function';
import * as time from 'src/utils/time';
import * as sinon from 'sinon';
import { expect } from 'chai';
import Sinon from 'sinon';
import {
    iterForOf,
    iterForEach,
    iterForEachUntilMaxTime,
    iterNextCall,
    iterBreak,
    iterPop,
    iterPopUntilMaxTime,
} from '../iterator';

describe('iterator universal', () => {
    let win: any;
    const testArrayOrigin = [1, 2, 3, 4];
    let timeOneStub: Sinon.SinonStub<any, any>;
    let winGlo: any;
    if (typeof global !== 'undefined') {
        winGlo = 'nodejsTest' in global ? global : window;
    }
    const sandbox = sinon.createSandbox();
    beforeEach(() => {
        timeOneStub = sandbox.stub(time, 'TimeOne');
        win = {
            setTimeout: setTimeout.bind(winGlo),
        };
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('call pop iterator until max time', () => {
        const callCounter = sandbox.spy();
        let timeCallCounter = 0;
        timeOneStub.returns(() => {
            timeCallCounter += 1;
            if (timeCallCounter === 1) {
                return 1;
            }
            return 1000000;
        });
        const iterFn = iterForOf<number, any>(
            testArrayOrigin.slice(),
            callCounter,
        );
        iterFn(iterPopUntilMaxTime(win, 10));
        sinon.assert.calledOnce(callCounter);
    });
    it('create pop iterator', () => {
        const arrayToMerge = testArrayOrigin.slice();
        const historyArray = [4, 4, 3, 2, 1, 3, 2, 1];
        const checkHistoryArray: number[] = [];
        const iterFn = iterForOf<number, any>(
            testArrayOrigin.slice(),
            (elem, list) => {
                if (arrayToMerge.length) {
                    list.push(arrayToMerge.pop());
                }
                checkHistoryArray.push(elem);
                return elem;
            },
        );
        const result = iterFn(iterPop(noop));
        expect(result).to.be.eq(1);
        expect(checkHistoryArray).to.be.deep.eq(historyArray);
        expect(arrayToMerge).to.lengthOf(0);
    });
    it('create iterator for array', () => {
        const testArray = testArrayOrigin.slice();
        const readyArray: number[] = [];
        const iterFn = iterForOf(testArray);
        iterFn(
            iterForEach((result: number) => {
                readyArray.push(result);
            }) as any,
        );
        expect(readyArray).to.be.deep.eq(testArray);

        const iterFn2 = iterForOf(testArray, (a) => a * 2);
        const result = iterFn2(iterForEach(noop) as any);
        expect(result).to.be.deep.eq([2, 4, 6, 8]);
    });
    it('iter on next functions', (done) => {
        let count = 0;
        let iterator: Function | null;
        const syncFn = (stop: boolean) => (next: Function) => {
            count += 1;
            if (stop && iterator) {
                iterator(iterBreak);
            }
            next();
        };
        const asyncFn = (next: Function) => {
            setTimeout(() => {
                count += 1;
                next();
            }, 100);
        };
        const finishFn = (next: Function) => {
            count += 1;
            expect(count).to.be.eq(4);
            done();
            next();
        };
        iterator = iterForOf(
            [syncFn(false), asyncFn, syncFn(false), finishFn],
            (fn: Function, next) => {
                fn(next);
            },
        );
        iterator(iterNextCall);
        expect(count).to.be.eq(1);
    });
});

describe.skip('browser iterator', () => {
    return;
    it('create iterate until timeout', () => {
        let count = 0;
        let sum = 0;
        const fn = () => {
            let r = 0;
            for (let i = 0; i < 10000; i += 1) {
                r += Math.random() + i;
            }
            count += 1;
            sum += r;
        };
        const iterFn = iterForOf([fn, fn, fn], call);
        iterFn(iterForEachUntilMaxTime(window, 0));
        expect(count).to.be.equal(1);
        expect(sum).to.be.not.equal(0);
    });
});
