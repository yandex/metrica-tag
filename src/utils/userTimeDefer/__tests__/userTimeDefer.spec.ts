import * as sinon from 'sinon';
import * as eventUtils from 'src/utils/events/events';
import type { EventSetter } from 'src/utils/events/types';
import type { AnyFunc } from 'src/utils/function/types';
import * as timeUtils from 'src/utils/time/time';
import * as browserUtils from 'src/utils/browser/browser';
import { setUserTimeDefer } from '../userTimeDefer';

type WindowWithTimeMocks = Window & {
    resetTimeouts: () => void;
    getNowTime: () => number;
    makeTimePass: (time: number) => void;
};

const timeoutMock = () => {
    let timeoutsHash: { [id: number]: [AnyFunc, number] } = {};
    let timeoutId = 0;
    let now = 0;

    return {
        document: {},
        setTimeout: (callback: AnyFunc, time: number) => {
            timeoutId += 1;
            timeoutsHash[timeoutId] = [callback, time];

            return timeoutId;
        },
        clearTimeout: (id: number) => {
            delete timeoutsHash[id];
        },
        resetTimeouts: () => {
            now = 0;
            timeoutId = 0;
            timeoutsHash = {};
        },
        getNowTime: () => now,
        makeTimePass: (time: number) => {
            now += time;
            Object.keys(timeoutsHash).forEach((stringId) => {
                const id = +stringId;
                const [callback, timeoutTime] = timeoutsHash[id];
                if (timeoutTime <= time) {
                    callback();
                    delete timeoutsHash[id];
                }

                timeoutsHash[id] = [callback, timeoutTime - time] as [
                    AnyFunc,
                    number,
                ];
            });
        },
    } as WindowWithTimeMocks;
};

describe('userTimeDefer', () => {
    const sandbox = sinon.createSandbox();
    const callback = sandbox.spy();
    let timeUtilsStub: sinon.SinonStub<
        [ctx: Window],
        <R>(fn: (a: timeUtils.TimeState) => R) => R
    >;
    let isIEStub: sinon.SinonStub<[ctx: Window], boolean>;
    let eventsStub: sinon.SinonStub<[ctx: Window], EventSetter>;

    beforeEach(() => {
        isIEStub = sandbox.stub(browserUtils, 'isIE');
        timeUtilsStub = sandbox.stub(timeUtils, 'TimeOne');
        eventsStub = sandbox.stub(eventUtils, 'cEvent');
    });

    afterEach(() => {
        sandbox.restore();
        callback.resetHistory();
    });

    it('Just sets regular timeout for IE and clears it', () => {
        isIEStub.returns(true);
        timeUtilsStub.returns(<T>() => 100 as unknown as T);
        const ctx = timeoutMock();

        const destroy = setUserTimeDefer(ctx, callback, 100);
        destroy();
        ctx.makeTimePass(1000);
        sinon.assert.notCalled(callback);

        setUserTimeDefer(ctx, callback, 100);
        ctx.makeTimePass(1000);
        sinon.assert.calledOnce(callback);
    });

    it('Removes callback from non IE window', () => {
        isIEStub.returns(false);
        timeUtilsStub.returns(<T>() => 100 as unknown as T);
        eventsStub.returns({
            on: () => () => {},
            un: () => {},
        });
        const ctx = timeoutMock();
        const destroy = setUserTimeDefer(ctx, callback, 100);
        destroy();
        ctx.makeTimePass(1000);

        sinon.assert.notCalled(callback);
    });

    it('Works normally with blur and other events', () => {
        const ctx = timeoutMock();
        const eventsHash: Record<string, AnyFunc> = {};
        isIEStub.returns(false);
        timeUtilsStub.returns(<R>() => ctx.getNowTime() as unknown as R);
        eventsStub.returns({
            on<E extends Window, M extends WindowEventMap, T extends keyof M>(
                elem: E,
                names: T[],
                fn: (this: E, ev: M[T]) => any,
            ) {
                names.forEach((name) => {
                    eventsHash[name as string] = fn;
                });
                return () => {};
            },
            un: () => {},
        });

        setUserTimeDefer(ctx, callback, 1000);
        ctx.makeTimePass(300);
        eventsHash.scroll();
        sinon.assert.notCalled(callback);

        ctx.makeTimePass(100);
        eventsHash.blur();
        sinon.assert.notCalled(callback);

        eventsHash.focus();
        sinon.assert.notCalled(callback);

        ctx.makeTimePass(600);
        sinon.assert.calledOnce(callback);
    });
});
