import * as sinon from 'sinon';
import * as eventUtils from 'src/utils/events/events';
import { AnyFunc } from 'src/utils/function/types';
import { noop } from 'src/utils/function/noop';
import * as scriptUtils from '../insertScript';
import { loadScript } from '../loadScript';

describe('dom / utils - loadScript', () => {
    const ctx = {} as Window;
    const sandbox = sinon.createSandbox();
    let insertScript: sinon.SinonStub<
        Parameters<typeof scriptUtils.insertScript>,
        ReturnType<typeof scriptUtils.insertScript>
    >;
    const onEvent =
        sandbox.stub<[target: HTMLElement, events: string[], cb: AnyFunc]>();
    const fakeEventSubscriber = {
        on: onEvent,
    } as unknown as ReturnType<typeof eventUtils.cEvent>;
    const fakeScript = {} as HTMLScriptElement;

    beforeEach(() => {
        insertScript = sandbox
            .stub(scriptUtils, 'insertScript')
            .returns(fakeScript);
        sandbox.stub(eventUtils, 'cEvent').returns(fakeEventSubscriber);
    });

    afterEach(() => {
        sandbox.restore();
        onEvent.resetHistory();
    });

    it('Loads script only once and calls onLoadCb after script is loaded and load event fired', () => {
        const scriptName = 'working-script.js?var=222&b=p';

        const onLoad1 = sinon.stub();
        loadScript(ctx, scriptName, onLoad1);
        sinon.assert.calledWithExactly(
            onEvent,
            fakeScript,
            ['load'],
            sinon.match.func,
        );
        sinon.assert.notCalled(onLoad1);

        onEvent.firstCall.yield();
        sinon.assert.calledOnce(onLoad1);

        const onLoad2 = sinon.stub();
        loadScript(ctx, scriptName, onLoad2);
        sinon.assert.calledOnce(onLoad2);
        sinon.assert.calledTwice(onEvent);
        sinon.assert.calledOnceWithExactly(insertScript, ctx, {
            src: scriptName,
        });
    });

    it('Loads script only once and calls onErrorCb after script load has failed and error event fired', () => {
        const scriptName = 'broken-script.js';

        const onError1 = sinon.stub();
        loadScript(ctx, scriptName, noop, onError1);
        sinon.assert.calledWithExactly(
            onEvent,
            fakeScript,
            ['error'],
            sinon.match.func,
        );
        sinon.assert.notCalled(onError1);

        onEvent.secondCall.yield();
        sinon.assert.calledOnce(onError1);

        const onError2 = sinon.stub();
        loadScript(ctx, scriptName, noop, onError2);
        sinon.assert.calledOnce(onError2);
        sinon.assert.calledTwice(onEvent);
        sinon.assert.calledOnceWithExactly(insertScript, ctx, {
            src: scriptName,
        });
    });

    it('Loads the same script with different url params', () => {
        const scriptName = 'working-script.js?var=223&b=be';

        const onLoad1 = sinon.stub();
        loadScript(ctx, scriptName, onLoad1);
        sinon.assert.calledWithExactly(
            onEvent,
            fakeScript,
            ['load'],
            sinon.match.func,
        );
        sinon.assert.notCalled(onLoad1);

        onEvent.firstCall.yield();
        sinon.assert.calledOnce(onLoad1);

        const onLoad2 = sinon.stub();
        loadScript(ctx, scriptName, onLoad2, noop);
        sinon.assert.calledOnce(onLoad2);
        sinon.assert.calledTwice(onEvent);
        sinon.assert.calledOnceWithExactly(insertScript, ctx, {
            src: scriptName,
        });
    });
});
