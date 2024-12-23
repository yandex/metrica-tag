import * as sinon from 'sinon';
import * as browserUtils from 'src/utils/browser/browser';
import * as uidUtils from 'src/utils/uid/uid';
import { CounterOptions } from 'src/utils/counterOptions';
import * as frameConnectorUtils from 'src/utils/iframeConnector/iframeConnector';
import * as chai from 'chai';
import {
    IFRAME_MESSAGE_DUID,
    IframeConnector,
} from 'src/utils/iframeConnector';
import { getSelfOrParentUid } from '../uid';

describe('uid in browser info', () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => {
        sandbox.restore();
    });

    function makeStubs({
        isTP,
        isIframe,
        hasSameCounterIdParent,
    }: {
        isTP: boolean;
        isIframe: boolean;
        hasSameCounterIdParent: boolean;
    }) {
        sandbox.stub(browserUtils, 'isTP').returns(isTP);
        sandbox.stub(browserUtils, 'isIframe').returns(isIframe);
        sandbox.stub(uidUtils, 'getUid').returns('own duid');

        const opt: CounterOptions = {
            id: Math.random() * 100,
            counterType: '0',
        };

        const ctx = {} as Window;

        const iframeConnector = {
            parents: {
                [hasSameCounterIdParent ? opt.id : 200]: {
                    info: {
                        [IFRAME_MESSAGE_DUID]: 'parent duid',
                    },
                },
            },
        };
        sandbox
            .stub(frameConnectorUtils, 'counterIframeConnector')
            .returns(iframeConnector as IframeConnector);

        return { ctx, opt };
    }

    it('should return own duid if not in frame', () => {
        const { ctx, opt } = makeStubs({
            isTP: true,
            isIframe: false,
            hasSameCounterIdParent: false,
        });
        chai.expect(getSelfOrParentUid(ctx, opt)).to.be.equal('own duid');
    });

    it('should return own duid if not ITP', () => {
        const { ctx, opt } = makeStubs({
            isTP: false,
            isIframe: true,
            hasSameCounterIdParent: false,
        });
        chai.expect(getSelfOrParentUid(ctx, opt)).to.be.equal('own duid');
    });

    it('should return own duid if not have parent with same id', () => {
        const { ctx, opt } = makeStubs({
            isTP: true,
            isIframe: true,
            hasSameCounterIdParent: false,
        });
        chai.expect(getSelfOrParentUid(ctx, opt)).to.be.equal('own duid');
    });

    it('should return parent duid', () => {
        const { ctx, opt } = makeStubs({
            isTP: true,
            isIframe: true,
            hasSameCounterIdParent: true,
        });
        chai.expect(getSelfOrParentUid(ctx, opt)).to.be.equal('parent duid');
    });
});
