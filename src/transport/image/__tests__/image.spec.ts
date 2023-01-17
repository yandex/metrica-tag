import * as chai from 'chai';
import sinon from 'sinon';
import * as domUtils from 'src/utils/dom';
import * as browserUtils from 'src/utils/browser';
import * as knownErrorUtils from 'src/utils/errorLogger/knownError';
import * as defer from 'src/utils/defer/base';
import { REQUEST_MODE_KEY } from 'src/api/common';
import * as wm from '../../watchModes';
import { useImage } from '../image';

describe('Image', () => {
    const ctx: any = {};
    const URL = 'http://example.com';
    const timeoutId = 123;
    const debugStack = [1, 2, 3];
    const knownError = Error();

    const sandbox = sinon.createSandbox();
    const fakeRoot: any = {
        appendChild: sandbox.stub(),
    };
    const createElementFunctionStub = sandbox.stub();
    let getCreateElementFunctionStub: sinon.SinonStub;
    let setDeferStub: sinon.SinonStub;
    let clearDeferStub: sinon.SinonStub;
    let getSrcUrlStub: sinon.SinonStub;
    let removeNodeStub: sinon.SinonStub;
    let createKnownErrroStub: sinon.SinonStub;

    beforeEach(() => {
        createKnownErrroStub = sandbox
            .stub(knownErrorUtils, 'createKnownError')
            .returns(knownError);
        sandbox.stub(browserUtils, 'isSafari').returns(true);
        sandbox.stub(domUtils, 'getRootElement').returns(fakeRoot);
        getCreateElementFunctionStub = sandbox
            .stub(domUtils, 'getElemCreateFunction')
            .returns(createElementFunctionStub);
        setDeferStub = sandbox.stub(defer, 'setDeferBase').returns(timeoutId);
        clearDeferStub = sandbox.stub(defer, 'clearDefer');
        getSrcUrlStub = sandbox.stub(wm, 'getSrcUrl').returns(URL);
        removeNodeStub = sandbox.stub(domUtils, 'removeNode');
    });

    const checkImageCreationAndSetup = () => {
        const fakeImage: any = {
            style: {},
        };
        const senderUrl = 'http://exmp.com';
        const options = {
            debugStack,
            rQuery: {
                [REQUEST_MODE_KEY]: 'something',
                a: 'b',
            },
        };
        createElementFunctionStub.returns(fakeImage);
        const request = useImage(ctx) as Function;

        const requestPromise = request(senderUrl, options);
        const [url, opts, q] = getSrcUrlStub.getCall(0).args;
        chai.expect(url).to.equal(senderUrl);
        chai.expect(opts).to.equal(options);
        chai.expect(q).to.deep.equal({ a: 'b' });

        sinon.assert.calledOnce(setDeferStub);
        chai.expect(fakeImage.src).to.equal(URL);
        chai.expect(typeof fakeImage.onerror).to.equal('function');
        chai.expect(typeof fakeImage.onload).to.equal('function');
        chai.expect(fakeImage.style).to.deep.equal({
            position: 'absolute',
            visibility: 'hidden',
            width: '0px',
            height: '0px',
        });

        sinon.assert.calledWith(fakeRoot.appendChild, fakeImage);

        return { fakeImage, requestPromise };
    };

    afterEach(() => {
        sandbox.restore();
    });

    it('should fail if create element function is broken', () => {
        getCreateElementFunctionStub.returns(null);
        chai.assert(!useImage(ctx));
    });

    it('should resolve if onload is called', () => {
        const { fakeImage, requestPromise } = checkImageCreationAndSetup();
        fakeImage.onload();

        sinon.assert.calledWith(removeNodeStub, fakeImage);
        sinon.assert.calledWith(clearDeferStub, ctx, timeoutId);

        return requestPromise;
    });

    it('should fail if timeout exceeded', () => {
        const { requestPromise } = checkImageCreationAndSetup();
        const callback = setDeferStub.getCall(0).args[1];
        callback();

        sinon.assert.calledWith(createKnownErrroStub, debugStack);
        return requestPromise
            .then(() => {
                chai.assert(false);
            })
            .catch((error: Error) => {
                chai.expect(error).to.equal(knownError);
            });
    });

    it('should fail if onerror is called', () => {
        const { fakeImage, requestPromise } = checkImageCreationAndSetup();
        fakeImage.onerror(Error());

        sinon.assert.calledWith(createKnownErrroStub, debugStack);
        return requestPromise
            .then(() => {
                chai.assert(false);
            })
            .catch((error: Error) => {
                chai.expect(error).to.equal(knownError);
            });
    });
});
