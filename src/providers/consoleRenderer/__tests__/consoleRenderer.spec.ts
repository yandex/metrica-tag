import * as sinon from 'sinon';
import * as chai from 'chai';
import * as eventsUtils from 'src/utils/debugEvents';
import { DebuggerEvent } from 'src/utils/debugEvents/types';
import { useConsoleRendererRaw } from '../consoleRenderer';
import * as observerUtils from '../../../utils/dataLayerObserver';
import * as consoleUtils from '../../../utils/console';
import {
    CONSOLE_DICTIONARY,
    EMPTY_LINK_CONSOLE_MESSAGE,
    PAGE_VIEW_CONSOLE_MESSAGE,
} from '../dictionary';

describe('consoleRenderer', () => {
    const sandbox = sinon.createSandbox();
    const fakeEvents: DebuggerEvent[] = [];
    const fakeConsole = {
        log: sandbox.stub(),
        warn: sandbox.stub(),
        error: sandbox.stub(),
    };
    const onObserver = sandbox.stub();
    const fakeObsever = {
        observer: {
            on: onObserver,
        },
    } as unknown as observerUtils.DataLayerObserverObject<unknown, unknown>;
    let getObserver: sinon.SinonStub<
        Parameters<typeof observerUtils.dataLayerObserver>,
        ReturnType<typeof observerUtils.dataLayerObserver>
    >;

    beforeEach(() => {
        sandbox.stub(consoleUtils, 'getConsole').returns(fakeConsole);
        sandbox.stub(eventsUtils, 'getEvents').returns(fakeEvents);
        getObserver = sandbox.stub(observerUtils, 'dataLayerObserver');
    });

    afterEach(() => {
        onObserver.resetHistory();
        sandbox.restore();
        fakeConsole.log.resetHistory();
        fakeConsole.warn.resetHistory();
        fakeConsole.error.resetHistory();
    });

    it('subscribes and renders console messages', () => {
        const win = {} as Window;
        useConsoleRendererRaw(win);

        const [ctx, observerEvents, initCallback] = getObserver.getCall(0).args;
        chai.expect(ctx).to.equal(win);
        chai.expect(observerEvents).to.equal(fakeEvents);
        initCallback!(fakeObsever);
        const [callback] = onObserver.getCall(0).args;

        // Wrong event type
        callback({
            name: 'anything',
            data: {
                args: [123],
                type: 'log',
            },
        });
        sinon.assert.notCalled(fakeConsole.log);

        // Event with filled template
        callback({
            name: 'log',
            data: {
                args: [PAGE_VIEW_CONSOLE_MESSAGE],
                type: 'log',
                variables: {
                    ref: 'http://google.com',
                    id: '123',
                    url: 'http://example.com',
                },
            },
        });
        sinon.assert.calledOnceWithExactly(
            fakeConsole.log,
            'PageView. Counter 123. URL: http://example.com. Referrer: http://google.com',
        );

        // Non fillable template
        callback({
            name: 'log',
            data: {
                args: [EMPTY_LINK_CONSOLE_MESSAGE],
                type: 'warn',
            },
        });
        sinon.assert.calledOnceWithExactly(
            fakeConsole.warn,
            CONSOLE_DICTIONARY[EMPTY_LINK_CONSOLE_MESSAGE],
        );

        // No template
        callback({
            name: 'log',
            data: {
                args: ['message'],
                type: 'error',
            },
        });
        sinon.assert.calledOnceWithExactly(fakeConsole.error, 'message');
    });
});
