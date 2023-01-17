import * as chai from 'chai';
import * as sinon from 'sinon';
import * as json from 'src/utils/json';
import * as isKnownErrorUtils from 'src/utils/errorLogger/knownError';
import * as errorLogger from 'src/utils/errorLogger/handleError';
import * as nativeFunctionUtils from 'src/utils/function/isNativeFunction';
import { useXHR, SEND_METHOD_NAME } from '..';

class MockXHR {
    private static bad = false;

    private static resp: any = { test: 'hi' };

    private static instance: MockXHR;

    public static setBroken(bad = false) {
        MockXHR.bad = bad;
    }

    public static getInstance() {
        return MockXHR.instance;
    }

    public readyState?: number;

    public withCredentials?: boolean;

    public status?: number;

    public responseText?: string;

    public onreadystatechange?: (a: any) => any;

    public constructor() {
        MockXHR.instance = this;
        this.withCredentials = false;
    }

    public setRequestHeader() {}

    public open() {}

    public send() {
        this.readyState = 1;
        this.status = 200;
    }

    public resolve() {
        this.readyState = 4;
        if (MockXHR.bad) {
            Object.defineProperty(this, 'responseText', {
                get: () => {
                    throw new Error('1');
                },
            });
        } else {
            this.responseText = JSON.stringify(MockXHR.resp);
        }
        if (this.onreadystatechange) {
            this.onreadystatechange({});
        }
    }
}

describe('XHR', () => {
    const sandbox = sinon.createSandbox();
    const resp = {
        test: 'hi',
    };
    let parseStub: any;
    let createKnownErrorStub: sinon.SinonStub;
    beforeEach(() => {
        createKnownErrorStub = sandbox.stub(
            isKnownErrorUtils,
            'createKnownError',
        );
        parseStub = sandbox.stub(json, 'parse');
        sandbox
            .stub(nativeFunctionUtils, 'isNativeFunction')
            .callsFake((fn) => fn === SEND_METHOD_NAME);
        sandbox.stub(errorLogger, 'handleError');
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('should check XHR in ctx', () => {
        const checkResult = useXHR({} as unknown as Window);
        chai.expect(checkResult).to.be.not.ok;
    });
    it('should check XHR in ctx descriptor fail', () => {
        const checkResult = useXHR(
            Object.create(
                {},
                {
                    XMLHttpRequest: {
                        get() {
                            throw new Error('Broken xhr');
                        },
                    },
                },
            ) as unknown as Window,
        );
        chai.expect(checkResult).to.be.not.ok;
    });
    it('should check creds', () => {
        const XHRmockM = function myF() {};
        const checkResult = useXHR({
            XMLHttpRequest: XHRmockM,
        } as any as Window);
        chai.expect(checkResult).to.be.not.ok;
    });
    it('should check good opera conditions', () => {
        class XHRmockM {
            public withCredentials = false;

            public send() {}
        }
        const checkResult = useXHR({
            XMLHttpRequest: XHRmockM,
            location: {
                host: 'привет.рф:12',
            },
            opera: {
                version: () => '13.12',
            },
        } as any as Window);
        chai.expect(checkResult).to.be.ok;
    });
    it('should check bad opera conditions', () => {
        class XHRmockM {
            public withCredentials = false;

            public send() {}
        }
        const checkResult = useXHR({
            XMLHttpRequest: XHRmockM,
            location: {
                host: 'привет.рф:12',
            },
            opera: {
                version: () => '12.12',
            },
        } as any as Window);
        chai.expect(checkResult).to.be.not.ok;
    });
    it('should send bad request', () => {
        MockXHR.setBroken(true);
        const request = useXHR({
            location: {
                host: 'local:10202',
            },
            XMLHttpRequest: MockXHR,
        } as any as Window) as Function;
        const req = request('some', { debugStack: [] });
        MockXHR.getInstance().resolve();
        return req
            .then(() => {
                chai.assert(false);
            })
            .catch(() => {
                chai.assert(true);
            });
    });
    it('should send request', () => {
        MockXHR.setBroken(false);
        const request = useXHR({
            location: {
                host: 'local:10202',
            },
            XMLHttpRequest: MockXHR,
        } as any as Window) as Function;
        parseStub.returns(resp);

        const req = request('some', { debugStack: [] });
        MockXHR.getInstance().resolve();
        return req.then((r: any) => {
            chai.expect(r).to.be.equal(null);

            const requestPromise = request('file://some.url', {
                rHeaders: {
                    one: '1',
                },
                wmode: true,
                debugStack: [],
            });
            MockXHR.getInstance().resolve();
            return requestPromise.then((res: any) => {
                chai.expect(res).to.be.equal(resp);
            });
        });
    });
    it('should fail if no result with wmode', () => {
        MockXHR.setBroken(false);
        const request = useXHR({
            location: {
                host: 'local:10202',
            },
            XMLHttpRequest: MockXHR,
        } as any as Window) as Function;
        const debugStack = ['x', 'h', 'r'];

        parseStub.returns(null);
        const requestPromise = request('file://some.url', {
            wmode: true,
            debugStack,
        });
        MockXHR.getInstance().resolve();
        return requestPromise.catch(() => {
            const [actualDebugStack] = createKnownErrorStub.getCall(0).args;
            chai.expect(debugStack).to.deep.eq(actualDebugStack);
        });
    });
});
