import { expect } from 'chai';
import * as def from 'src/utils/defer';
import * as functionUtils from 'src/utils/function';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import * as sinon from 'sinon';
import {
    sendToFrame,
    getIframeState,
    watchFramesRemoval,
} from '../iframeConnector';
import * as iframeConnector from '../iframeConnector';
import { ConnectorState } from '../types';

describe('iframeConnector', () => {
    const sandbox = sinon.createSandbox();
    let serializeStub: sinon.SinonStub<any, any>;
    let deferStub: sinon.SinonStub<any, any>;

    beforeEach(() => {
        deferStub = sandbox.stub(def, 'setDefer');
        serializeStub = sandbox.stub();
        serializeStub.returns({
            meta: {},
        });
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('set defer if everything is ok', () => {
        const postMessageStub = sandbox.stub();
        const win = {} as any;
        const iframeCtx = {
            postMessage: postMessageStub,
        } as any;
        deferStub.callsFake((ctx: any, cb) => {
            expect(ctx).to.be.eq(win);
            cb();
            const state = getIframeState(win);
            expect(state.pending).to.be.empty;
        });
        const result = sendToFrame(win, serializeStub, iframeCtx, {}, () => {});
        expect(result).to.be.undefined;
        sinon.assert.calledOnce(postMessageStub);
        sinon.assert.calledOnce(deferStub);
    });

    it('call postMessage in sendToFrame', () => {
        const iframeCtx = {
            postMessage: sandbox.stub().throws('Broken post'),
        } as any;
        const result = sendToFrame(
            {} as any,
            serializeStub,
            iframeCtx,
            {},
            () => {},
        );
        expect(result).to.be.undefined;
        sinon.assert.notCalled(deferStub);
    });

    it('return not ok if iframe ctx empty', () => {
        const iframeCtx = {} as any;
        const result = sendToFrame(
            {} as any,
            serializeStub,
            iframeCtx,
            {},
            () => {},
        );
        expect(result).to.be.undefined;
        sinon.assert.notCalled(deferStub);
    });

    it('clears stray frames', async () => {
        // Window type disallows setting window.window = null, but its real life case when frame removed from document
        // So we construct own type instead of ConnectorState
        type NullableWindowConnectorStateMock = {
            children: { [key: string]: { window: { [key: string]: any } } };
        };

        const state: NullableWindowConnectorStateMock = {
            children: {
                '123': {
                    window: { window: {} },
                },
                '456': {
                    window: { window: {} },
                },
            },
        };

        sandbox
            .stub(iframeConnector, 'getIframeState')
            .returns(state as ConnectorState);
        sandbox.stub(functionUtils, 'isNativeFunction').returns(true);

        const { window } = new JSDOMWrapper(
            '<body><iframe src="/" id="f123"></iframe><iframe src="/" id="f456"></iframe></body>',
        );

        watchFramesRemoval(window);

        expect(state).to.be.deep.equal({
            children: {
                '123': {
                    window: { window: {} },
                },
                '456': {
                    window: { window: {} },
                },
            },
        });

        state.children['456'].window.window = null;
        await window.document.querySelector('#f456')!.remove();

        expect(state).to.be.deep.equal({
            children: {
                '123': {
                    window: { window: {} },
                },
            },
        });
    });
});
