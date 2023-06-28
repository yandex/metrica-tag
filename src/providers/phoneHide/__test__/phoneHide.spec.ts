import * as sinon from 'sinon';
import * as browser from 'src/utils/browser';
import * as counterSettingsUtil from 'src/utils/counterSettings';
import type { CounterSettings } from 'src/utils/counterSettings';
import type { CounterOptions } from 'src/utils/counterOptions';
import * as hidePhonesUtils from 'src/utils/phones/phonesHide';
import * as isBrokenPhones from 'src/utils/phones/isBrokenPhones';
import { usePhoneHideProvider } from '../phoneHide';

describe('phoneHide / phoneHide', () => {
    const sandbox = sinon.createSandbox();
    let isMobileStub: sinon.SinonStub<
        Parameters<typeof browser.isMobile>,
        ReturnType<typeof browser.isMobile>
    >;
    let getCounterSettingsStub: sinon.SinonStub<
        Parameters<typeof counterSettingsUtil.getCounterSettings>,
        ReturnType<typeof counterSettingsUtil.getCounterSettings>
    >;
    let hidePhonesUtilStub: sinon.SinonStub<
        Parameters<typeof hidePhonesUtils.hidePhones>,
        ReturnType<typeof hidePhonesUtils.hidePhones>
    >;

    const win = {} as Window;
    const counterOptions = {} as CounterOptions;

    beforeEach(() => {
        isMobileStub = sandbox.stub(browser, 'isMobile');
        isMobileStub.returns(false);
        sandbox.stub(browser, 'isBrokenFromCharCode').returns(false);

        getCounterSettingsStub = sandbox.stub(
            counterSettingsUtil,
            'getCounterSettings',
        );
        hidePhonesUtilStub = sandbox.stub(hidePhonesUtils, 'hidePhones');
        sandbox.stub(isBrokenPhones, 'isBrokenPhones').returns(false);
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('not desktop', async () => {
        isMobileStub.returns(true);

        await usePhoneHideProvider(win, counterOptions);
        sinon.assert.notCalled(getCounterSettingsStub);
    });

    it('does nothing if phone change enabled', async () => {
        const counterSettings = {
            settings: {
                phchange: {
                    clientId: '1',
                    orderId: '2',
                    phones: [['87776665522', '87776665523']],
                },
            },
        } as unknown as CounterSettings;
        getCounterSettingsStub.callsFake((options, fn) =>
            Promise.resolve(counterSettings).then(fn),
        );

        await usePhoneHideProvider(win, counterOptions);
        sinon.assert.notCalled(hidePhonesUtilStub);
    });

    it('does nothing if phone change enabled', async () => {
        const phones = ['*'];
        const counterSettings = {
            settings: {
                phhide: phones,
            },
        } as unknown as CounterSettings;
        getCounterSettingsStub.callsFake((options, fn) =>
            Promise.resolve(counterSettings).then(fn),
        );

        await usePhoneHideProvider(win, counterOptions);
        sinon.assert.calledWith(
            hidePhonesUtilStub,
            win,
            counterOptions,
            phones,
        );
    });
});
