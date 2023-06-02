import * as chai from 'chai';
import * as sinon from 'sinon';
import type { TaskInterface } from 'src/utils/async';
import * as browser from 'src/utils/browser';
import * as waitForBodyTask from 'src/utils/dom/waitForBody';
import type { CounterOptions } from 'src/utils/counterOptions';
import * as counterSettings from 'src/utils/counterSettings';
import type { CounterSettings } from 'src/utils/counterSettings';
import * as siteStatisticsLayout from '../layout/siteStatisticsLayout';
import { useSiteStatisticsProvider } from '../siteStatistics';

describe('siteStatisticsProvider', () => {
    let ctx = {} as Window;
    const settings = { settings: {} } as CounterSettings;
    const counterOptions: CounterOptions = { id: 1, counterType: '0' };

    const sandbox = sinon.createSandbox();

    const waitForBodyFork: TaskInterface<void> = (fn) =>
        fn((_, resolve) => resolve());

    let waitForBodyTaskStub: sinon.SinonStub<
        Parameters<typeof waitForBodyTask.waitForBodyTask>,
        ReturnType<typeof waitForBodyTask.waitForBodyTask>
    >;
    let isMobileStub: sinon.SinonStub<
        Parameters<typeof browser.isMobile>,
        ReturnType<typeof browser.isMobile>
    >;
    let getCounterSettingsStub: sinon.SinonStub<
        Parameters<typeof counterSettings.getCounterSettings>,
        ReturnType<typeof counterSettings.getCounterSettings>
    >;
    let siteStatisticsLayoutStub: sinon.SinonStub<
        Parameters<typeof siteStatisticsLayout.siteStatisticsLayout>,
        ReturnType<typeof siteStatisticsLayout.siteStatisticsLayout>
    >;
    let destructStub: sinon.SinonSpy<
        Parameters<
            ReturnType<typeof siteStatisticsLayout.siteStatisticsLayout>
        >,
        ReturnType<ReturnType<typeof siteStatisticsLayout.siteStatisticsLayout>>
    >;

    beforeEach(() => {
        ctx = {} as Window; // Because of globalMemoWin we need a new window in each test.
        settings.settings.sm = 1;
        isMobileStub = sandbox.stub(browser, 'isMobile').returns(false);
        waitForBodyTaskStub = sandbox
            .stub(waitForBodyTask, 'waitForBodyTask')
            .returns(waitForBodyFork);
        getCounterSettingsStub = sandbox.stub(
            counterSettings,
            'getCounterSettings',
        );
        getCounterSettingsStub.callsFake((_, callback) =>
            Promise.resolve(settings).then((a) => callback(a)),
        );
        destructStub = sandbox.spy(() => {});
        siteStatisticsLayoutStub = sandbox
            .stub(siteStatisticsLayout, 'siteStatisticsLayout')
            .returns(destructStub);
    });

    afterEach(() => {
        sandbox.restore();
        sandbox.reset();
    });

    it('triggers once on a page', async () => {
        const secondCounterOptions: CounterOptions = {
            id: 2,
            counterType: '0',
        };
        const result1 = await useSiteStatisticsProvider(ctx, counterOptions);
        const result2 = await useSiteStatisticsProvider(
            ctx,
            secondCounterOptions,
        );
        sinon.assert.calledOnce(siteStatisticsLayoutStub);
        chai.expect(result1).to.eq(result2);
    });

    it('does not trigger on mobile', async () => {
        isMobileStub.returns(true);
        await useSiteStatisticsProvider(ctx, counterOptions);
        sinon.assert.notCalled(waitForBodyTaskStub);
    });

    it('does not trigger if sm setting not provided', async () => {
        settings.settings.sm = undefined;
        await useSiteStatisticsProvider(ctx, counterOptions);
        sinon.assert.notCalled(siteStatisticsLayoutStub);
    });

    it('is destructible', async () => {
        const destruct = await useSiteStatisticsProvider(ctx, counterOptions);
        chai.expect(destruct).to.eq(destructStub);
        destruct && destruct();
        sinon.assert.calledOnce(destructStub);
    });
});
