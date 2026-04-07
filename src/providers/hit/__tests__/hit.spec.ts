import * as sinon from 'sinon';
import * as sender from 'src/sender';
import { WATCH_URL_PARAM, WATCH_REFERER_PARAM } from 'src/api/watch';
import { CounterOptions } from 'src/utils/counterOptions';
import * as DebugConsole from 'src/providers/debugConsole/debugConsole';
import * as counterSettingsStorage from 'src/utils/counterSettings/counterSettings';
import * as deferModule from 'src/utils/defer/defer';
import { useRawHitProvider } from '../hit';
import { CounterSettings } from 'src/utils/counterSettings/types';
import { TransportResponse } from 'src/transport/types';

describe('hit', () => {
    const locationHref = 'test';
    const testReferer = 'testReferer';
    const counterOpt: CounterOptions = {
        id: 13,
        counterType: '0',
    };
    const counterSettings = {
        a: 1,
        b: 2,
    } as unknown as CounterSettings;
    const senderMock = sinon
        .stub<
            Parameters<ReturnType<typeof sender.getSender>>,
            ReturnType<ReturnType<typeof sender.getSender>>
        >()
        .resolves(counterSettings as unknown as TransportResponse);
    const sandbox = sinon.createSandbox();
    let getSenderMock: sinon.SinonStub<
        Parameters<typeof sender.getSender>,
        ReturnType<typeof sender.getSender>
    >;
    let provideSettingsStub: sinon.SinonStub<
        Parameters<typeof counterSettingsStorage.setSettings>,
        ReturnType<typeof counterSettingsStorage.setSettings>
    >;
    let counterSettingsStorageStub: sinon.SinonStub<
        Parameters<typeof counterSettingsStorage.getCounterSettings>,
        ReturnType<typeof counterSettingsStorage.getCounterSettings>
    >;

    beforeEach(() => {
        getSenderMock = sandbox.stub(sender, 'getSender');
        getSenderMock.returns(senderMock);
        sandbox.stub(DebugConsole, 'consoleLog');
        sandbox.stub(deferModule, 'setDefer').callsFake((_, fn) => {
            fn();
            return 1;
        });
        provideSettingsStub = sandbox.stub(
            counterSettingsStorage,
            'setSettings',
        );
        counterSettingsStorageStub = sandbox.stub(
            counterSettingsStorage,
            'getCounterSettings',
        );
        counterSettingsStorageStub.callsFake((_, fn) =>
            Promise.resolve(fn(counterSettings)),
        );
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('sends hits and ads counter settings into the storage', async () => {
        const winInfo = {
            location: {
                href: locationHref,
                host: locationHref,
            },
            Array,
            document: {
                referrer: testReferer,
            },
            JSON,
            isFinite,
        } as Window;

        await useRawHitProvider(winInfo, counterOpt);

        sinon.assert.calledOnceWithExactly(
            senderMock,
            sinon.match({
                urlParams: {
                    [WATCH_URL_PARAM]: locationHref,
                    [WATCH_REFERER_PARAM]: testReferer,
                },
            }),
            counterOpt,
        );
        sinon.assert.calledOnceWithExactly(
            provideSettingsStub,
            winInfo,
            counterOpt,
            counterSettings,
        );
    });
});
