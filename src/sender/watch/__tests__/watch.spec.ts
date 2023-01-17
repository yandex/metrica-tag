import * as chai from 'chai';
import * as sinon from 'sinon';
import * as middlewareSender from 'src/sender/middleware';
import {
    WATCH_URL_PARAM,
    PAGE_VIEW_BR_KEY,
    ARTIFICIAL_BR_KEY,
} from 'src/api/watch';
import {
    DEFAULT_COUNTER_TYPE,
    RSYA_COUNTER_TYPE,
} from 'src/providers/counterOptions';
import { browserInfo } from 'src/utils/browserInfo';
import type { Middleware, MiddlewareHandler } from 'src/middleware/types';
import type { InternalSenderInfo } from 'src/sender/SenderInfo';
import type { CounterOptions } from 'src/utils/counterOptions';
import * as senderMiddlewares from 'src/middleware/senderMiddlewares';
import { useSenderWatch } from '../watch';

describe('sender/watch', () => {
    const win = {} as Window;
    const brInfo = browserInfo({
        [PAGE_VIEW_BR_KEY]: 1,
        [ARTIFICIAL_BR_KEY]: 1,
    });
    const watchUrl = 'http://example.com';

    const sandbox = sinon.createSandbox();
    // Middleware
    let getSenderMiddlewaresStub: sinon.SinonStub<
        Parameters<typeof senderMiddlewares.getSenderMiddlewares>,
        ReturnType<typeof senderMiddlewares.getSenderMiddlewares>
    >;
    const beforeRequestStub =
        sandbox.stub<
            Parameters<MiddlewareHandler>,
            ReturnType<MiddlewareHandler>
        >();
    const senderWatchInfoMW: Middleware = {
        beforeRequest: beforeRequestStub,
    };
    // Sender
    let middlewareSenderStub: sinon.SinonStub<
        Parameters<typeof middlewareSender.useMiddlewareSender>,
        ReturnType<typeof middlewareSender.useMiddlewareSender>
    >;
    const response: Record<string, unknown> = {};
    const senderSpy = sandbox
        .stub<
            Parameters<ReturnType<typeof middlewareSender.useMiddlewareSender>>,
            ReturnType<ReturnType<typeof middlewareSender.useMiddlewareSender>>
        >()
        .resolves(response);

    beforeEach(() => {
        getSenderMiddlewaresStub = sandbox
            .stub(senderMiddlewares, 'getSenderMiddlewares')
            .returns([senderWatchInfoMW]);
        middlewareSenderStub = sandbox.stub(
            middlewareSender,
            'useMiddlewareSender',
        );
        middlewareSenderStub.returns(senderSpy);
    });

    afterEach(() => {
        sandbox.restore();
        senderSpy.resetHistory();
    });

    it('sends request for default counter type', async () => {
        const counterOptions = {
            id: 123,
            counterType: DEFAULT_COUNTER_TYPE,
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
        const sender = useSenderWatch(win, [], []);
        const result = await sender(senderParams, counterOptions);

        chai.expect(result).to.equal(response);
        sinon.assert.calledOnce(getSenderMiddlewaresStub);
        sinon.assert.calledOnceWithExactly(
            middlewareSenderStub,
            win,
            [],
            [senderWatchInfoMW],
        );
        sinon.assert.calledOnceWithExactly(senderSpy, {
            transportInfo: {
                debugStack: [],
            },
            brInfo,
            urlParams: {
                [WATCH_URL_PARAM]: watchUrl,
            },
        });
    });

    it('sends request with type for non-default counter type', async () => {
        const counterOptions = {
            id: 123,
            counterType: RSYA_COUNTER_TYPE,
        } as unknown as CounterOptions;
        const senderParams = {
            transportInfo: {
                debugStack: [],
            },
            urlParams: {
                [WATCH_URL_PARAM]: watchUrl,
            },
            brInfo,
        } as InternalSenderInfo;
        const sender = useSenderWatch(win, [], []);
        const result = await sender(senderParams, counterOptions);

        chai.expect(result).to.equal(response);
        sinon.assert.calledOnce(getSenderMiddlewaresStub);
        sinon.assert.calledOnceWithExactly(
            middlewareSenderStub,
            win,
            [],
            [senderWatchInfoMW],
        );
        sinon.assert.calledOnceWithExactly(senderSpy, {
            transportInfo: {
                debugStack: [],
            },
            brInfo,
            urlParams: {
                [WATCH_URL_PARAM]: watchUrl,
            },
        });
    });
});
