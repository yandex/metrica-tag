import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sender from 'src/sender';
import { WATCH_URL_PARAM, WATCH_REFERER_PARAM } from 'src/api/watch';
import { CounterOptions } from 'src/utils/counterOptions';
import * as DebugConsole from 'src/providers/debugConsole/debugConsole';
import * as counterSettingsStorage from 'src/utils/counterSettings/counterSettings';
import * as deferModule from 'src/utils/defer/defer';
import { useRawHitProvider } from '../hit';

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
    };
    const senderMock = sinon.stub().returns(Promise.resolve(counterSettings));
    const sandbox = sinon.createSandbox();
    let getSenderMock: any;
    let provideSettingsStub: sinon.SinonStub<any, any>;
    let counterSettingsStorageStub: sinon.SinonStub<any, any>;

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
        counterSettingsStorageStub.callsFake((_, _1, fn) =>
            Promise.resolve(fn()),
        );
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('sends hits and ads counter settings into the storage', () => {
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
        };

        return useRawHitProvider(winInfo as any as Window, counterOpt).then(
            () => {
                const [senderOpt, counterOptions] = senderMock.getCall(0).args;
                const { urlParams } = senderOpt;
                chai.expect(counterOptions).to.equal(counterOpt);
                chai.expect(urlParams[WATCH_URL_PARAM]).to.equal(locationHref);
                chai.expect(urlParams[WATCH_REFERER_PARAM]).to.equal(
                    testReferer,
                );

                const [, counterOptM, counterSettingsM] =
                    provideSettingsStub.getCall(0).args;
                chai.expect(counterOptM).to.equal(counterOptions);
                chai.expect(counterSettingsM).to.deep.equal(counterSettingsM);
            },
        );
    });
});
