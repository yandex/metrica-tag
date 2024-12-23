import * as chai from 'chai';
import * as sinon from 'sinon';
import {
    WATCH_URL_PARAM,
    PAGE_VIEW_BR_KEY,
    WATCH_ENCODING_PARAM,
    WATCH_CLASS_PARAM,
} from 'src/api/watch';
import {
    DEFAULT_COUNTER_TYPE,
    RSYA_COUNTER_TYPE,
} from 'src/providers/counterOptions';
import * as brInfoUtils from 'src/utils/browserInfo/browserInfo';
import type { InternalSenderInfo } from 'src/sender/SenderInfo';
import type { CounterOptions } from 'src/utils/counterOptions';
import { senderWatchInfo } from '../senderWatchInfo';
import { WATCH_RESOURCE } from '../const';

describe('sender middleware/watch', () => {
    const win = {} as Window;
    const brInfo = brInfoUtils.browserInfo({
        [PAGE_VIEW_BR_KEY]: 1,
    });
    const watchUrl = 'http://example.com';

    const sandbox = sinon.createSandbox();
    let browserInfoStub: sinon.SinonStub<
        Parameters<typeof brInfoUtils.browserInfo>,
        ReturnType<typeof brInfoUtils.browserInfo>
    >;
    let getValStub = sandbox.stub<
        Parameters<brInfoUtils.BrowserInfo['getVal']>,
        ReturnType<brInfoUtils.BrowserInfo['getVal']>
    >();

    let browserInfoResult: brInfoUtils.BrowserInfo;
    const nextSpy = sandbox.spy(() => {});

    beforeEach(() => {
        getValStub = sandbox.stub();
        browserInfoResult = {
            getVal: getValStub,
        } as unknown as brInfoUtils.BrowserInfo;
        browserInfoStub = sandbox.stub(brInfoUtils, 'browserInfo');
        browserInfoStub.returns(browserInfoResult);
    });

    afterEach(() => {
        sandbox.restore();
        nextSpy.resetHistory();
    });

    it('sets default request parameters', () => {
        const counterId = 123;
        const counterOptions = {
            id: counterId,
            counterType: DEFAULT_COUNTER_TYPE,
        } as CounterOptions;
        const senderParams: InternalSenderInfo = {
            transportInfo: { debugStack: [] },
        };

        const middleware = senderWatchInfo(win, counterOptions);
        middleware.beforeRequest!(senderParams, nextSpy);

        sinon.assert.calledOnce(nextSpy);
        chai.expect(senderParams).to.deep.eq({
            transportInfo: {
                debugStack: [],
                wmode: false,
            },
            urlParams: {
                [WATCH_URL_PARAM]: '',
                [WATCH_ENCODING_PARAM]: 'utf-8',
            },
            urlInfo: {
                resource: `${WATCH_RESOURCE}/${counterId}`,
            },
            brInfo: browserInfoResult,
        });
    });

    it('sets request parameters with type for non-default counter type', () => {
        const counterOptions = {
            id: 123,
            counterType: RSYA_COUNTER_TYPE,
        } as CounterOptions;
        const senderParams: InternalSenderInfo = {
            transportInfo: {
                debugStack: [],
            },
            urlParams: {
                [WATCH_URL_PARAM]: watchUrl,
            },
            brInfo,
        };
        getValStub.callsFake((flag) => (flag === PAGE_VIEW_BR_KEY ? 1 : 0));

        const middleware = senderWatchInfo(win, counterOptions);
        middleware.beforeRequest!(senderParams, nextSpy);

        sinon.assert.calledOnce(nextSpy);
        chai.expect(senderParams).to.deep.eq({
            transportInfo: {
                debugStack: [],
                wmode: true,
            },
            urlParams: {
                [WATCH_URL_PARAM]: watchUrl,
                [WATCH_ENCODING_PARAM]: 'utf-8',
                [WATCH_CLASS_PARAM]: RSYA_COUNTER_TYPE,
            },
            urlInfo: {
                resource: `${WATCH_RESOURCE}/123`,
            },
            brInfo,
        });
    });
});
