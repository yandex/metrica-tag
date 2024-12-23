import * as sinon from 'sinon';
import { useMiddlewareSender } from 'src/sender/middleware';
import * as middleware from 'src/middleware/combine';
import * as defaultSender from 'src/sender/default/default';
import { expect } from 'chai';
import type { InternalSenderInfo, SenderInfo } from 'src/sender/SenderInfo';
import type { DefaultSenderResult } from 'src/sender/default';
import type { TransportList } from 'src/transport';
import type { Middleware } from 'src/middleware/types';
import * as host from '../returnFullHost';

describe('sender/middleware', () => {
    let defaultSenderStub: sinon.SinonStub<
        [senderInfo: InternalSenderInfo, urls: string[]],
        Promise<DefaultSenderResult>
    >;
    let useDefaultSenderStub: sinon.SinonStub<
        [ctx: Window, transports: TransportList],
        (
            senderInfo: InternalSenderInfo,
            urls: string[],
        ) => Promise<DefaultSenderResult>
    >;
    let combineMiddlewaresStub: sinon.SinonStub<
        [
            rawMiddlewareList: Middleware[],
            senderParams: SenderInfo,
            before?: boolean,
        ],
        Promise<void>
    >;
    let fullHostStub: sinon.SinonStub<
        [resource: string, argHost?: string | undefined],
        string
    >;
    const sandbox = sinon.createSandbox();

    const win = {} as Window;
    const testData = 'testDate';
    const testHost = 'testHost';

    beforeEach(() => {
        defaultSenderStub = sandbox.stub();
        defaultSenderStub.resolves({
            responseData: testData,
            urlIndex: 1,
        });

        fullHostStub = sandbox.stub(host, 'returnFullHost');
        fullHostStub.returns(testHost);

        combineMiddlewaresStub = sandbox.stub(middleware, 'combineMiddlewares');

        useDefaultSenderStub = sandbox.stub(defaultSender, 'useDefaultSender');
        useDefaultSenderStub.returns(defaultSenderStub);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('calls default sender and returns its response when middlewares resolve', async () => {
        combineMiddlewaresStub.resolves();
        const senderInfo: InternalSenderInfo = {
            transportInfo: {
                debugStack: [1],
            },
        };

        const sender = useMiddlewareSender(win, [], []);
        const result = await sender(senderInfo);

        expect(result).to.be.eq(testData);
        expect(senderInfo.responseInfo).to.be.eq(testData);
        sinon.assert.calledOnceWithExactly(defaultSenderStub, senderInfo, [
            testHost,
        ]);
        sinon.assert.calledTwice(combineMiddlewaresStub);
    });

    it('rejects when middlewares reject and does no calls to sender', async () => {
        combineMiddlewaresStub.rejects();

        const sender = useMiddlewareSender(win, [], []);
        try {
            const senderInfo: InternalSenderInfo = {
                transportInfo: {
                    debugStack: [1],
                },
            };
            await sender(senderInfo);
        } catch {}

        sinon.assert.notCalled(defaultSenderStub);
        sinon.assert.calledOnce(combineMiddlewaresStub);
    });
});
