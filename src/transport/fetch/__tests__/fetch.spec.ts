import * as chai from 'chai';
import * as sinon from 'sinon';
import { REQUEST_MODE_KEY } from 'src/api/common';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import { WATCH_WMODE_JSON } from 'src/transport/watchModes';
import type { CounterOptions } from 'src/utils/counterOptions/types';
import * as deferBase from 'src/utils/defer/base';
import * as defer from 'src/utils/defer/defer';
import { KNOWN_ERROR } from 'src/utils/errorLogger/consts';
import * as knownErrorUtils from 'src/utils/errorLogger/knownError';
import { useFetch } from '..';

const badFetchError = 'bad controller';

describe('Fetch', () => {
    const opt: CounterOptions = {
        id: 123,
        counterType: DEFAULT_COUNTER_TYPE,
    };
    const someTestUrl = 'url';
    const defaultWatchMode = `${REQUEST_MODE_KEY}=${WATCH_WMODE_JSON}`;
    const someTestResult = { result: 'result' };
    const sandbox = sinon.createSandbox();

    let createKnownErrStub: sinon.SinonStub<
        Parameters<typeof knownErrorUtils.createKnownError>,
        ReturnType<typeof knownErrorUtils.createKnownError>
    >;
    let setDeferBaseStub: sinon.SinonStub<
        Parameters<typeof deferBase.setDeferBase>,
        ReturnType<typeof deferBase.setDeferBase>
    >;
    let clearDeferStub: sinon.SinonStub<
        Parameters<typeof defer.clearDefer>,
        ReturnType<typeof defer.clearDefer>
    >;
    let fetchStub: sinon.SinonStub<
        Parameters<NonNullable<Window['fetch']>>,
        ReturnType<NonNullable<Window['fetch']>>
    >;
    let abortControllerStub: sinon.SinonStub<[], AbortController>;
    let abortStub: sinon.SinonStub<
        Parameters<AbortController['abort']>,
        ReturnType<AbortController['abort']>
    >;

    let isOk: boolean;
    let json: (() => Promise<unknown>) | undefined;
    let jsonResult: unknown;
    let debugStack: string[];

    let ctx: Window;

    const createRandomDebugStack = () => {
        debugStack = new Array(3)
            .fill(undefined)
            .map(() => Math.random().toString().slice(0, 3));
        return debugStack;
    };
    beforeEach(() => {
        isOk = false;
        json = undefined;
        jsonResult = undefined;

        setDeferBaseStub = sandbox.stub(deferBase, 'setDeferBase').returns(0);
        clearDeferStub = sandbox.stub(defer, 'clearDefer');
        createKnownErrStub = sandbox.stub(knownErrorUtils, 'createKnownError');

        fetchStub = sandbox.stub<
            Parameters<NonNullable<Window['fetch']>>,
            ReturnType<NonNullable<Window['fetch']>>
        >();
        fetchStub.callsFake(() =>
            Promise.resolve({
                ok: isOk,
                json: json || (() => Promise.resolve(jsonResult)),
            } as Response),
        );

        abortStub = sandbox.stub<
            Parameters<AbortController['abort']>,
            ReturnType<AbortController['abort']>
        >();
        abortStub.throws(new Error(badFetchError));

        abortControllerStub = sandbox.stub<[], AbortController>().returns({
            abort: abortStub,
        } as unknown as AbortController);

        ctx = {
            fetch: fetchStub,
            AbortController: abortControllerStub,
        } as unknown as Window;
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should check fetch in ctx', () => {
        const checkResult = useFetch({} as Window, opt);
        chai.expect(checkResult).to.be.not.ok;
    });

    it('should fine with broken abort', (done) => {
        const checkResult = useFetch(ctx, opt);

        if (checkResult) {
            checkResult(someTestUrl, {
                debugStack: createRandomDebugStack(),
                timeOut: 100,
            })
                .then(() => {
                    chai.assert.fail('Wrong check');
                })
                .catch(() => {
                    sinon.assert.calledWith(
                        createKnownErrStub,
                        debugStack.concat('timeout'),
                    );
                    sinon.assert.calledOnce(abortStub);
                    done();
                });
            setDeferBaseStub.yield();
        } else {
            chai.assert.fail('Wrong check');
        }
    });

    it('should fail with timeOut', (done) => {
        const checkResult = useFetch(ctx, opt);

        if (checkResult) {
            checkResult(someTestUrl, {
                debugStack: createRandomDebugStack(),
                timeOut: 100,
            })
                .then(() => {
                    chai.assert.fail('Wrong check');
                })
                .catch(() => {
                    sinon.assert.calledWith(
                        createKnownErrStub,
                        debugStack.concat('timeout'),
                    );
                    sinon.assert.calledOnce(setDeferBaseStub);
                    done();
                });
            setDeferBaseStub.yield();
        } else {
            chai.assert.fail('Wrong check');
        }
    });

    it('should not abort subsequent requests when a previous one times out', async () => {
        // Each AbortController instance owns its own signal that flips on abort().
        abortControllerStub.reset();
        abortControllerStub.callsFake(() => {
            const signal = { aborted: false };
            return {
                signal,
                abort: () => {
                    signal.aborted = true;
                },
            } as AbortController;
        });

        // fetch rejects immediately if it is handed an already-aborted signal,
        // mirroring the real browser behavior.
        fetchStub.reset();
        fetchStub.callsFake((_url, init) => {
            if (init?.signal?.aborted) {
                return Promise.reject(new Error('aborted'));
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(someTestResult),
            } as Response);
        });

        const checkResult = useFetch(ctx, opt);
        if (!checkResult) {
            chai.assert.fail('Wrong check');
        }

        // First request times out: fire the registered timeout callback -> abort().
        const firstRequest = checkResult(someTestUrl, {
            debugStack: createRandomDebugStack(),
            timeOut: 100,
        });
        setDeferBaseStub.yield();
        await firstRequest.then(
            () => chai.assert.fail('first request should time out'),
            () => {
                sinon.assert.calledWith(
                    createKnownErrStub,
                    debugStack.concat('timeout'),
                );
            },
        );

        // The backend is healthy and the second request has no timeout, so it
        // must not be poisoned by the previous request's abort.
        const secondResult = await checkResult(someTestUrl, {
            debugStack: createRandomDebugStack(),
            wmode: true,
        });

        chai.expect(secondResult).to.eq(someTestResult);
    });

    it('should clear the timeout once the request settles', async () => {
        isOk = true;
        jsonResult = someTestResult;

        const timeoutId = 42;
        setDeferBaseStub.returns(timeoutId);

        const checkResult = useFetch(ctx, opt);
        if (!checkResult) {
            chai.assert.fail('Wrong check');
        }

        const result = await checkResult(someTestUrl, {
            debugStack: createRandomDebugStack(),
            timeOut: 100,
            wmode: true,
        });

        chai.expect(result).to.eq(someTestResult);
        sinon.assert.calledOnceWithExactly(clearDeferStub, ctx, timeoutId);
    });

    it('should call fetch from ctx', (done) => {
        isOk = true;
        jsonResult = someTestResult;

        const checkResult = useFetch(ctx, opt);
        if (checkResult) {
            checkResult(someTestUrl, { debugStack: [], wmode: true })
                .then((result) => {
                    sinon.assert.calledOnceWithExactly(
                        fetchStub,
                        `${someTestUrl}?${defaultWatchMode}`,
                        sinon.match.object,
                    );

                    chai.expect(result).to.eq(someTestResult);
                    done();
                })
                .catch(() => {
                    chai.assert.fail('Error');
                });
        } else {
            chai.assert.fail('Wrong check');
        }
    });

    it('should return null if wmode false', (done) => {
        isOk = true;
        const checkResult = useFetch(ctx, opt);
        if (checkResult) {
            checkResult(someTestUrl, { debugStack: [] })
                .then((result) => {
                    chai.expect(result).to.eq(null);
                    done();
                })
                .catch((e) => done(e));
        } else {
            chai.assert.fail('Wrong check');
        }
    });

    it('should fail if json parse error', (done) => {
        isOk = true;
        json = () => Promise.reject(KNOWN_ERROR);
        const checkResult = useFetch(ctx, opt);
        if (checkResult) {
            checkResult(someTestUrl, {
                debugStack: createRandomDebugStack(),
                wmode: true,
            })
                .then(() => {
                    chai.assert.fail('Wrong check');
                })
                .catch(() => {
                    sinon.assert.calledWith(createKnownErrStub, debugStack);
                    done();
                });
        } else {
            chai.assert.fail('Wrong check');
        }
    });
});
