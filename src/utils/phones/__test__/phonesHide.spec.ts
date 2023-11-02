import * as chai from 'chai';
import * as sinon from 'sinon';
import { hidePhones, HOVER_TIMEOUT } from 'src/utils/phones';
import { CounterOptions } from 'src/utils/counterOptions';
import * as counter from 'src/utils/counter';
import * as defer from 'src/utils/defer';
import type { EventSetter } from 'src/utils/events/types';
import * as phonesDom from 'src/utils/phones/phonesDom';
import * as eventUtils from 'src/utils/events';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import * as phonesHide from '../phonesHide';

describe('phoneHide / phoneHide', () => {
    const { window } = new JSDOMWrapper(undefined, { url: 'http://localhost' });
    const { document } = window;
    const sandbox = sinon.createSandbox();
    let replacePhonesDom: sinon.SinonSpy<
        Parameters<ReturnType<typeof phonesDom.createPhoneDomReplacer>>,
        ReturnType<ReturnType<typeof phonesDom.createPhoneDomReplacer>>
    >;
    let extLink: sinon.SinonSpy;
    let setDefer: sinon.SinonStub<
        Parameters<typeof defer.setDefer>,
        ReturnType<typeof defer.setDefer>
    >;
    let clearDefer: sinon.SinonStub<
        Parameters<typeof defer.clearDefer>,
        ReturnType<typeof defer.clearDefer>
    >;
    const timeoutId = 123;

    const counterOptions = {} as CounterOptions;

    let rootNode: HTMLElement;
    let node: HTMLElement;
    let link: HTMLAnchorElement;

    beforeEach(() => {
        setDefer = sandbox.stub(defer, 'setDefer').returns(timeoutId);
        clearDefer = sandbox.stub(defer, 'clearDefer');
        replacePhonesDom = sandbox.stub();

        sandbox
            .stub(phonesDom, 'createPhoneDomReplacer')
            .returns(replacePhonesDom);

        extLink = sandbox.spy();
        sandbox.stub(counter, 'getCounterInstance').returns({ extLink });

        node = document.createElement('div');
        node.innerHTML = '+8 (777) 666-55-11';
        link = document.createElement('a');
        link.innerHTML = '+8 (777) 666-55-22';
        link.href = 'tel:+8 (777) 666-55-22';
        rootNode = document.createElement('div');
        rootNode.appendChild(node);
        rootNode.appendChild(link);
        document.body.appendChild(rootNode);
    });
    afterEach(() => {
        document.body.removeChild(rootNode);
        sandbox.restore();
    });

    it('transformPhone / hover', () => {
        const { transformPhone } = phonesHide;
        let hoverCb: ({ target }: { target: HTMLElement }) => void = () => {};

        sandbox.stub(eventUtils, 'cEvent').returns({
            on: (_element: HTMLElement, _events: string[], cb: () => void) => {
                if (_events.some((item) => item === 'mouseenter')) {
                    hoverCb = cb;
                }

                return () => {};
            },
        } as EventSetter);

        transformPhone(window, counterOptions, {
            replaceFrom: '87776665511',
            replaceHTMLNode: node.childNodes[0],
            textOrig: '+8 (777) 666-55-11',
            replaceTo: '',
            replaceElementType: 'text',
        });

        chai.expect(node.textContent).to.include('+8 (777) 666-55-11');

        const wrapper = node.childNodes[0] as HTMLElement;
        chai.expect(wrapper.nodeName).to.eq('SMALL');

        hoverCb({ target: wrapper });
        const [, showCb, timeout] = setDefer.getCall(0).args;
        chai.expect(timeout).to.equal(HOVER_TIMEOUT);
        showCb();

        chai.expect(node.childNodes[0].textContent).to.include(
            '+8 (777) 666-55-11',
        );

        sinon.assert.calledWith(extLink, 'tel:87776665511', {});
    });

    it('transformPhone / mouseleave', () => {
        const { transformPhone } = phonesHide;
        let hoverCb: ({ target }: { target: HTMLElement }) => void = () => {};
        let leaveCb: ({ target }: { target: HTMLElement }) => void = () => {};

        sandbox.stub(eventUtils, 'cEvent').returns({
            on: (_element: HTMLElement, _events: string[], cb: () => void) => {
                if (_events.some((item) => item === 'mouseenter')) {
                    hoverCb = cb;
                } else if (_events.some((item) => item === 'mouseleave')) {
                    leaveCb = cb;
                }

                return () => {};
            },
        } as EventSetter);

        transformPhone(window, counterOptions, {
            replaceFrom: '87776665511',
            replaceHTMLNode: node.childNodes[0],
            textOrig: '+8 (777) 666-55-11',
            replaceTo: '',
            replaceElementType: 'text',
        });

        chai.expect(node.textContent).to.include('+8 (777) 666-55-11');

        const wrapper = node.childNodes[0] as HTMLElement;
        chai.expect(wrapper.nodeName).to.eq('SMALL');

        hoverCb({ target: wrapper });
        leaveCb({ target: wrapper });

        leaveCb({ target: wrapper });

        const [, , timeout] = setDefer.getCall(0).args;
        chai.expect(timeout).to.equal(HOVER_TIMEOUT);
        sinon.assert.calledWith(clearDefer, window, timeoutId);
    });

    it('transformPhone / mouseleave child', () => {
        const { transformPhone } = phonesHide;
        let hoverCb: ({ target }: { target: HTMLElement }) => void = () => {};
        let leaveCb: ({ target }: { target: HTMLElement }) => void = () => {};

        sandbox.stub(eventUtils, 'cEvent').returns({
            on: (_element: HTMLElement, _events: string[], cb: () => void) => {
                if (_events.some((item) => item === 'mouseenter')) {
                    hoverCb = cb;
                } else if (_events.some((item) => item === 'mouseleave')) {
                    leaveCb = cb;
                }

                return () => {};
            },
        } as EventSetter);

        transformPhone(window, counterOptions, {
            replaceFrom: '87776665511',
            replaceHTMLNode: node.childNodes[0],
            textOrig: '+8 (777) 666-55-11',
            replaceTo: '',
            replaceElementType: 'text',
        });

        chai.expect(node.textContent).to.include('+8 (777) 666-55-11');

        const wrapper = node.childNodes[0] as HTMLElement;
        chai.expect(wrapper.nodeName).to.eq('SMALL');

        const someChild = wrapper.childNodes[0] as HTMLElement;
        chai.expect(someChild.nodeName).to.eq('SMALL');

        hoverCb({ target: wrapper });
        hoverCb({ target: someChild });

        leaveCb({ target: someChild });
        sinon.assert.notCalled(clearDefer);

        const [, showCb, timeout] = setDefer.getCall(0).args;
        chai.expect(timeout).to.equal(HOVER_TIMEOUT);
        showCb();
        sinon.assert.called(extLink);
    });

    it('hidePhones', () => {
        hidePhones(window, counterOptions, ['*']);
        hidePhones(window, counterOptions, ['*', '8(999)555-66-77']);
        hidePhones(window, counterOptions, ['8(999)5556677', 'invalid']);
        hidePhones(window, counterOptions, ['']);

        sinon.assert.calledWith(replacePhonesDom.getCall(0), [['*', '']]);
        sinon.assert.calledWith(replacePhonesDom.getCall(1), [
            ['*', ''],
            ['89995556677', ''],
        ]);
        sinon.assert.calledWith(replacePhonesDom.getCall(2), [
            ['89995556677', ''],
        ]);
        sinon.assert.calledWith(replacePhonesDom.getCall(3), []);
    });
});
