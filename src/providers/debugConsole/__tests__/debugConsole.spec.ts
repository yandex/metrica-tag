import * as chai from 'chai';
import * as sinon from 'sinon';
import {
    DEBUG_CONSOLE_FEATURE,
    DEBUG_EVENTS_FEATURE,
} from 'generated/features';
import * as inject from '@inject';
import * as consoleUtils from 'src/utils/console';
import * as cookieStorage from 'src/storage/cookie';
import { noop } from 'src/utils/function';
import { CounterOptions } from 'src/utils/counterOptions';
import { DebugConsole, useDebugConsoleProvider } from '../debugConsole';
import { DEBUG_STORAGE_FLAG, DEBUG_URL_PARAM } from '../const';

describe('providers / DebugConsole', () => {
    const cookieStore = {
        getVal: () => null,
        setVal: sinon.stub(),
    };
    const sandbox = sinon.createSandbox();
    const myConsole = {
        log: sandbox.stub<any[], void>(),
        error: sandbox.stub<any[], void>(),
        warn: sandbox.stub<any[], void>(),
    };

    beforeEach(() => {
        sandbox.stub(consoleUtils, 'getConsole').returns(myConsole);
        sandbox
            .stub(cookieStorage, 'globalCookieStorage')
            .returns(cookieStore as any);
    });

    afterEach(() => {
        cookieStore.setVal.resetHistory();
        sandbox.restore();
    });

    it('Creates debug console if feature flag is set, sets debug cookie, and waits for global flag to be set', () => {
        const ctx = {
            location: {
                href: `https://example.com?${DEBUG_URL_PARAM}=1`,
                host: 'example.com',
            },
        } as unknown as Window;
        const counterOpt = {
            id: 1,
            counterType: '0',
        } as unknown as CounterOptions;
        const dConsole = DebugConsole(ctx as any, '1:0');

        chai.expect(
            cookieStore.setVal.calledWith(
                DEBUG_STORAGE_FLAG,
                '1',
                undefined,
                ctx.location.host,
            ),
            'set flag not called',
        ).to.be.true;

        dConsole.log('1');
        const commonDconsole = DebugConsole(ctx as any, '');
        commonDconsole.warn('2');
        commonDconsole.error('3');

        sinon.assert.notCalled(myConsole.log);
        sinon.assert.notCalled(myConsole.warn);
        sinon.assert.notCalled(myConsole.error);

        useDebugConsoleProvider(ctx, counterOpt);

        sinon.assert.calledWith(myConsole.log, '1');
        sinon.assert.calledWith(myConsole.warn, '2');
        sinon.assert.calledWith(myConsole.error, '3');

        dConsole.log('2');
        sinon.assert.calledWith(myConsole.log, '2');
    });

    it('Returns noop console if feature flag is not set', () => {
        sandbox.stub(inject.flags, DEBUG_CONSOLE_FEATURE).value(false);
        sandbox.stub(inject.flags, DEBUG_EVENTS_FEATURE).value(false);
        const dConsole = DebugConsole({} as unknown as Window, '2');

        chai.expect(dConsole.log).to.equal(noop);
        chai.expect(dConsole.warn).to.equal(noop);
        chai.expect(dConsole.error).to.equal(noop);
    });
});
