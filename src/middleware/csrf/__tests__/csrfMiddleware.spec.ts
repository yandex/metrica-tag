import * as chai from 'chai';
import * as sinon from 'sinon';
import { CSRF_TOKEN_URL_PARAM } from 'src/api/common';
import { PAGE_VIEW_BR_KEY } from 'src/api/watch';
import * as counterSettingsUtils from 'src/utils/counterSettings';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { CounterSettings } from 'src/utils/counterSettings';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions';
import { csrfMiddleware, CSRF_TOKEN_SETTINGS_KEY } from '../csrfMiddleware';

describe('csrf middleware', () => {
    const windowStub = {} as Window;
    const counterOptions: CounterOptions = {
        id: 1,
        counterType: DEFAULT_COUNTER_TYPE,
    };
    const token = 'abc123';
    const counterSettings = {
        settings: {
            [CSRF_TOKEN_SETTINGS_KEY]: token,
        },
    } as CounterSettings;
    const middleware = csrfMiddleware(windowStub, counterOptions);

    const sandbox = sinon.createSandbox();
    let getCounterSettingsStub: sinon.SinonStub<
        Parameters<typeof counterSettingsUtils.getCounterSettings>,
        ReturnType<typeof counterSettingsUtils.getCounterSettings>
    >;

    beforeEach(() => {
        getCounterSettingsStub = sandbox
            .stub(counterSettingsUtils, 'getCounterSettings')
            .callsFake(
                (_, callBack) =>
                    new Promise<void>((resolve) => {
                        callBack(counterSettings);
                        resolve();
                    }),
            );
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('does nothing on the first hit', (done) => {
        const senderParams = {
            urlParams: {},
            brInfo: {
                getVal: (key: string) => (key === PAGE_VIEW_BR_KEY ? 1 : 0),
            },
        } as SenderInfo;

        middleware.beforeRequest!(senderParams, () => {
            sinon.assert.notCalled(getCounterSettingsStub);
            chai.expect(senderParams.urlParams![CSRF_TOKEN_URL_PARAM]).to.be
                .undefined;
            done();
        });
    });

    it('gets token from settings storage and writes it to urlParams', (done) => {
        const senderParams: SenderInfo = { urlParams: {} };

        middleware.beforeRequest!(senderParams, () => {
            sinon.assert.calledOnceWithExactly(
                getCounterSettingsStub,
                counterOptions,
                sinon.match.any,
            );
            chai.expect(senderParams.urlParams![CSRF_TOKEN_URL_PARAM]).to.eq(
                token,
            );
            done();
        });
    });
});
