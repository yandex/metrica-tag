import { expect, assert } from 'chai';
import * as sinon from 'sinon';
import { REQUEST_MODE_KEY } from 'src/api/common';
import { WATCH_WMODE_JSON } from 'src/transport/watchModes';
import * as knownErrorUtils from 'src/utils/errorLogger/knownError';
import { KNOWN_ERROR } from 'src/utils/errorLogger/consts';
import * as deferBase from 'src/utils/defer/base';
import { useFetch } from '..';

const badFetchError = 'bad controller';

describe('Fetch', () => {
    const someTestUrl = 'url';
    const defaultWatchMode = `${REQUEST_MODE_KEY}=${WATCH_WMODE_JSON}`;
    const someTestResult = { result: 'result' };
    const sandbox = sinon.createSandbox();
    let createKnownErrStub: sinon.SinonStub;
    let debugStack: string[];
    const createRandomDebugStack = () => {
        debugStack = new Array(3)
            .fill(undefined)
            .map(() => Math.random().toString().slice(0, 3));
        return debugStack;
    };
    const checkDebugStack = () => {
        const [actualDebugStack] = createKnownErrStub.getCall(0).args;
        expect(actualDebugStack).to.deep.eq(debugStack);
    };
    let isOk: any;
    let json: any;
    let jsonResult: any;
    const ctx = {} as any;

    beforeEach(() => {
        ctx.fetch = sinon.spy(() =>
            Promise.resolve({
                ok: isOk,
                json: json || (() => Promise.resolve(jsonResult)),
            }),
        );
        sandbox.stub(deferBase, 'setDeferBase').callsFake((_, fn) => fn());
        createKnownErrStub = sandbox.stub(knownErrorUtils, 'createKnownError');
    });

    afterEach(() => {
        ctx.fetch.resetHistory();
        ctx.AbortControllerFake && ctx.AbortControllerFake.resetHistory();
        sandbox.restore();
    });

    it('should check fetch in ctx', () => {
        const checkResult = useFetch({} as unknown as Window);
        expect(checkResult).to.be.not.ok;
    });
    it('should fine with broken abort', (done) => {
        ctx.AbortController = sinon.fake.returns({
            abort: () => {
                throw new Error(badFetchError);
            },
        });
        const checkResult = useFetch(ctx);

        if (checkResult) {
            checkResult(someTestUrl, {
                debugStack: createRandomDebugStack(),
                timeOut: 100,
            })
                .then(() => {
                    assert.fail('Wrong check');
                })
                .catch(() => {
                    checkDebugStack();
                    done();
                });
        } else {
            assert.fail('Wrong check');
        }
    });
    it('should fail with timeOut', (done) => {
        const checkResult = useFetch(ctx);

        if (checkResult) {
            checkResult(someTestUrl, {
                debugStack: createRandomDebugStack(),
                timeOut: 100,
            })
                .then(() => {
                    assert.fail('Wrong check');
                })
                .catch(() => {
                    checkDebugStack();
                    done();
                });
        } else {
            assert.fail('Wrong check');
        }
    });
    it('should call fetch from ctx', (done) => {
        isOk = true;
        jsonResult = someTestResult;

        const checkResult = useFetch(ctx);
        if (checkResult) {
            checkResult(someTestUrl, { debugStack: [], wmode: true })
                .then((result) => {
                    expect(ctx.fetch.getCall(0).args[0]).to.eq(
                        `${someTestUrl}?${defaultWatchMode}`,
                    );
                    expect(result).to.eq(someTestResult);
                    done();
                })
                .catch((e) => done(e));
        } else {
            assert.fail('Wrong check');
        }
    });

    it('should return null if wmode false', (done) => {
        isOk = true;
        const checkResult = useFetch(ctx);
        if (checkResult) {
            checkResult(someTestUrl, { debugStack: [] })
                .then((result) => {
                    expect(result).to.eq(null);
                    done();
                })
                .catch((e) => done(e));
        } else {
            assert.fail('Wrong check');
        }
    });

    it('should fail if json parse error', (done) => {
        isOk = true;
        json = Promise.reject(KNOWN_ERROR).catch(() => {});
        const checkResult = useFetch(ctx);
        if (checkResult) {
            checkResult(someTestUrl, {
                debugStack: createRandomDebugStack(),
                wmode: true,
            })
                .then(() => {
                    expect.fail('Wrong check');
                })
                .catch(() => {
                    checkDebugStack();
                    done();
                });
        } else {
            assert.fail('Wrong check');
        }
    });
});
