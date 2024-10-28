import * as chai from 'chai';
import * as sinon from 'sinon';
import {
    DEBUG_CONSOLE_FEATURE,
    DEBUG_EVENTS_FEATURE,
} from 'generated/features';
import * as inject from '@inject';
import { noop } from 'src/utils/function';
import * as debuggerEventsUtils from 'src/utils/debugEvents';
import { DebugConsole } from '../debugConsole';
import { DEBUG_URL_PARAM } from '../const';

describe('providers / DebugConsole', () => {
    const cookieStore = {
        getVal: () => null,
        setVal: sinon.stub(),
    };
    const sandbox = sinon.createSandbox();
    let dispatchDebuggerEvent: sinon.SinonStub<
        Parameters<typeof debuggerEventsUtils.dispatchDebuggerEvent>,
        ReturnType<typeof debuggerEventsUtils.dispatchDebuggerEvent>
    >;

    beforeEach(() => {
        dispatchDebuggerEvent = sandbox.stub(
            debuggerEventsUtils,
            'dispatchDebuggerEvent',
        );
    });

    afterEach(() => {
        cookieStore.setVal.resetHistory();
        sandbox.restore();
    });

    it('Creates debug console if feature flag is set', () => {
        const win = {
            location: {
                href: `https://example.com?${DEBUG_URL_PARAM}=1`,
                host: 'example.com',
            },
        } as unknown as Window;
        const counterKey = '1:0';
        const dConsole = DebugConsole(win, counterKey);
        const args = [1, 2];
        const vars = { a: 1, b: 2 };
        dConsole.log(args, vars);
        dConsole.warn(args, vars);
        dConsole.error(args, vars);
        sinon.assert.calledThrice(dispatchDebuggerEvent);

        sinon.assert.calledWith(dispatchDebuggerEvent.getCall(0), win, {
            ['name']: 'log',
            ['counterKey']: counterKey,
            ['data']: {
                ['args']: args,
                ['type']: 'log',
                ['variables']: vars,
            },
        });

        sinon.assert.calledWith(dispatchDebuggerEvent.getCall(1), win, {
            ['name']: 'log',
            ['counterKey']: counterKey,
            ['data']: {
                ['args']: args,
                ['type']: 'warn',
                ['variables']: vars,
            },
        });

        sinon.assert.calledWith(dispatchDebuggerEvent.getCall(2), win, {
            ['name']: 'log',
            ['counterKey']: counterKey,
            ['data']: {
                ['args']: args,
                ['type']: 'error',
                ['variables']: vars,
            },
        });
    });

    it('Returns noop console if feature flag is not set', () => {
        sandbox.stub(inject.flags, DEBUG_CONSOLE_FEATURE).value(false);
        sandbox.stub(inject.flags, DEBUG_EVENTS_FEATURE).value(false);
        const dConsole = DebugConsole({} as Window, '2');

        chai.expect(dConsole.log).to.equal(noop);
        chai.expect(dConsole.warn).to.equal(noop);
        chai.expect(dConsole.error).to.equal(noop);
    });

    it('Returns noop console if counter is silent', () => {
        const dConsole = DebugConsole({} as Window, '26812653:0');

        chai.expect(dConsole.log).to.equal(noop);
        chai.expect(dConsole.warn).to.equal(noop);
        chai.expect(dConsole.error).to.equal(noop);
    });
});
