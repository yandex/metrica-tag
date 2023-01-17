import * as sinon from 'sinon';
import * as browser from 'src/utils/browser';
import * as counterSettings from 'src/utils/counterSettings';
import { CounterOptions } from 'src/utils/counterOptions';
import * as hidePhonesUtils from 'src/utils/phones/phonesHide';
import * as isBrokenPhones from 'src/utils/phones/isBrokenPhones';
import { usePhoneHideProvider } from '../phoneHide';

describe('phoneHide / phoneHide', () => {
    const sandbox = sinon.createSandbox();
    let isMobileStub: sinon.SinonStub;
    let getCounterSettingsStub: sinon.SinonStub;
    let hidePhonesUtilStub: sinon.SinonStub;

    const win = {} as Window;
    const counterOptions = {} as CounterOptions;

    beforeEach(() => {
        isMobileStub = sandbox.stub(browser, 'isMobile');
        isMobileStub.returns(false);
        sandbox.stub(browser, 'isBrokenFromCharCode').returns(false);

        getCounterSettingsStub = sandbox.stub(
            counterSettings,
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

        usePhoneHideProvider(win, counterOptions);
        sinon.assert.notCalled(getCounterSettingsStub);
    });

    it('do nothig if phone change enabled', async () => {
        getCounterSettingsStub.callsFake((options, fn) => {
            fn({
                settings: {
                    phchange: {
                        clientId: '1',
                        orderId: '2',
                        phones: [['87776665522', '87776665523']],
                    },
                },
            });
        });

        usePhoneHideProvider(win, counterOptions);
        sinon.assert.notCalled(hidePhonesUtilStub);
    });

    it('do nothig if phone change enabled', async () => {
        const phones = ['*'];
        getCounterSettingsStub.callsFake((options, fn) => {
            fn({
                settings: {
                    phhide: phones,
                },
            });
        });

        usePhoneHideProvider(win, counterOptions);
        sinon.assert.calledWith(
            hidePhonesUtilStub,
            win,
            counterOptions,
            phones,
        );
    });
});
