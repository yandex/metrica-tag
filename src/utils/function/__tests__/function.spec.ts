import sinon from 'sinon';
import * as chai from 'chai';
import { getNativeFunction } from 'src/utils/function/isNativeFunction/getNativeFunction';
import { pipe } from '../pipe';
import * as defer from '../../defer/base';
import { constructArray, constructObject } from '../construct';
import { bind, bindThisForMethod } from '../bind/bind';
import { memo } from '../memo';
import { globalMemoWin } from '../globalMemo';
import { callUserCallback } from '../callUserCallback';

describe('utils/function', () => {
    it('constructs new items', () => {
        const testObj = { a: 1 };
        const firstObj = (constructObject as any)(testObj);
        chai.expect(firstObj).to.be.empty;
        const secondObj = constructObject();
        chai.expect(firstObj).to.be.not.eq(secondObj);
        const firstArray = (constructArray as any)(10);
        chai.expect(firstArray).to.be.empty;
        const secondArray = (constructArray as any)(10);
        chai.expect(secondArray).to.be.not.eq(firstArray);
    });
    it('bind', () => {
        const fn = (a: number, b: number) => a + b;
        chai.expect(bind(fn, null, 1)(2)).to.be.equal(3);
    });
    it('bindThis', () => {
        const arr: number[] = [];
        const fn = bindThisForMethod('push', arr) as any;
        fn(1);
        chai.expect(arr).to.be.deep.equal([1]);
    });
    it('pipe', () => {
        const testFn = (a: number, b: number) => a + b;
        chai.expect(pipe(testFn)(1, 2)).to.be.equal(3);
    });
    it('memo', () => {
        let info = 1;
        const fn = () => {
            info += 1;
            return info;
        };
        const memoFn = memo(fn);
        fn();
        chai.expect(info).to.be.equal(2);
        const memres = memoFn();
        chai.expect(info).to.be.equal(memres);
        memoFn();
        memoFn();
        memoFn();
        chai.expect(info).to.be.equal(3);
        const memoFn2 = memo(fn, () => new Date().getTime() + info);
        memoFn2();
        chai.expect(info).to.be.equal(4);
        memoFn2();
        chai.expect(info).to.be.equal(5);

        const memFn3 = memo(
            (arg, second) => {
                info += 1;
                return arg + second;
            },
            (arg, second) => [arg, second].join(),
        );
        memFn3('1', '1');
        memFn3('1', '1');
        chai.expect(info).to.be.equal(6);
    });
    describe('getNativeFunction', () => {
        it('override func', () => {
            const test = sinon.fake();
            function Ctx() {}
            Ctx.prototype = { constructor: Ctx, test };
            const ctx = new (Ctx as any)();
            ctx.test = 1;
            getNativeFunction('test', ctx)();
            chai.expect(test.called).to.be.ok;
        });

        it('get from owner', () => {
            const test = sinon.fake();
            function Ctx(this: any) {
                this.test = test;
            }
            const ctx = new (Ctx as any)();
            getNativeFunction('test', ctx)();
            chai.expect(test.called).to.be.ok;
        });

        it('ie8 (fn in prototype contain object, apply throw exception)', () => {
            const test = () => {};
            function Ctx(this: any) {
                this.test = test;
            }
            const prototypeTest = {};
            Object.defineProperty(prototypeTest, 'apply', {
                get: () => {
                    throw new Error('error');
                },
            });
            Ctx.prototype = {
                constructor: Ctx,
                test: prototypeTest,
            };
            const ctx = new (Ctx as any)();
            chai.expect(getNativeFunction('test', ctx)).to.be.equal(test);
        });
    });
    it('globalMemoFn', () => {
        const win = {} as Window;
        const spy = sinon.spy();
        const otherSpy = sinon.spy();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const testFunction = (ctx: Window) => {
            spy();
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const otherTestFunction = (ctx: Window) => {
            otherSpy();
        };

        const testKey = 'testKey';
        const otherTestKey = 'otherTestKey';
        const wrappedFn = globalMemoWin(testKey, testFunction);

        wrappedFn(win);
        wrappedFn(win);
        globalMemoWin(testKey, testFunction)(win);
        globalMemoWin(otherTestKey, otherTestFunction)(win);

        sinon.assert.calledOnce(spy);
        sinon.assert.calledOnce(otherSpy);
    });

    describe('callUserCallback', () => {
        const ctx: any = {};
        const sandbox = sinon.createSandbox();
        let setDeferStub: sinon.SinonStub;
        const userContext: any = {};
        const arg1 = '1';
        const arg2 = '2';
        const arg3 = '3';

        beforeEach(() => {
            setDeferStub = sandbox.stub(defer, 'setDeferBase');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('calls user callback with context and throws user exception', () => {
            const error = Error('I am an error');
            const callback = sinon.stub().throws(error);
            callUserCallback(ctx, callback, userContext, arg1, arg2, arg3);
            chai.assert(callback.calledOnce);
            chai.assert(callback.calledOn(userContext));
            chai.expect(callback.calledWith(arg1, arg2, arg3));

            chai.assert(setDeferStub.calledOnce);
            const [deferCtx, deferCallback, timeout] =
                setDeferStub.getCall(0).args;
            chai.expect(deferCtx).to.equal(ctx);
            chai.expect(timeout).to.equal(0);
            chai.expect(() => deferCallback()).throws(error);
        });

        it('does nothing if callback is absent', () => {
            callUserCallback(ctx, undefined, userContext, arg1, arg2, arg3);
            chai.assert(setDeferStub.notCalled);
        });
    });
});
