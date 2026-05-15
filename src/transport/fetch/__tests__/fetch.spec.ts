import * as chai from 'chai';
import * as sinon from 'sinon';
import { REQUEST_MODE_KEY } from 'src/api/common';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import { WATCH_WMODE_JSON } from 'src/transport/watchModes';
import type { CounterOptions } from 'src/utils/counterOptions/types';
import * as deferBase from 'src/utils/defer/base';
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
    const checkDebugStack = () => {
        const [actualDebugStack] = createKnownErrStub.getCall(0).args;
        chai.expect(actualDebugStack).to.deep.eq(debugStack);
    };
    const checkTimeoutDebugStack = () => {
        const [actualDebugStack] = createKnownErrStub.getCall(0).args;
        chai.expect(actualDebugStack).to.deep.eq([...debugStack, 'timeout']);
    };

    beforeEach(() => {
        isOk = false;
        json = undefined;
        jsonResult = undefined;

        setDeferBaseStub = sandbox.stub(deferBase, 'setDeferBase').callsFake(((
            _ctx,
            fn,
        ) => {
            fn();
            return 0;
        }) as typeof deferBase.setDeferBase);
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
                    checkTimeoutDebugStack();
                    sinon.assert.calledOnce(abortStub);
                    done();
                });
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
                    checkTimeoutDebugStack();
                    sinon.assert.calledOnce(setDeferBaseStub);
                    done();
                });
        } else {
            chai.assert.fail('Wrong check');
        }
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
                    checkDebugStack();
                    done();
                });
        } else {
            chai.assert.fail('Wrong check');
        }
    });
});
