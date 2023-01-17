import * as chai from 'chai';
import * as sinon from 'sinon';
import { hidePhones, HOVER_TIMEOUT } from 'src/utils/phones';
import { CounterOptions } from 'src/utils/counterOptions';
import * as counter from 'src/utils/counter';
import * as phonesDom from 'src/utils/phones/phonesDom';
import * as eventUtils from 'src/utils/events';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import * as phonesHide from '../phonesHide';

describe('phoneHide / phoneHide', () => {
    const { window } = new JSDOMWrapper();
    const { document } = window;
    const sandbox = sinon.createSandbox();
    let replacePhonesDom: sinon.SinonSpy;
    let extLink: sinon.SinonSpy;

    const counterOptions = {} as CounterOptions;

    let rootNode: HTMLElement;
    let node: HTMLElement;
    let link: HTMLAnchorElement;

    beforeEach(() => {
        replacePhonesDom = sandbox.spy();

        sandbox.stub(phonesDom, 'createPhoneDomReplacer').returns({
            replacePhonesDom,
        } as any);

        extLink = sandbox.spy();
        sandbox.stub(counter, 'getCounterInstance').returns({
            extLink,
        } as any);

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

    it('transformPhone / hover', (done) => {
        const { transformPhone } = phonesHide;
        let hoverCb: ({ target }: { target: HTMLElement }) => void = () => {};

        sandbox.stub(eventUtils, 'cEvent').returns({
            on: (_element: HTMLElement, _events: string[], cb: () => void) => {
                if (_events.some((item) => item === 'mouseenter')) {
                    hoverCb = cb;
                }

                return () => {};
            },
        } as any);

        transformPhone(window, counterOptions, {
            replaceFrom: '87776665511',
            replaceHTMLNode: node.childNodes[0],
            textOrig: '+8 (777) 666-55-11',
            replaceTo: '',
            replaceElementType: 'text',
        } as any);

        chai.expect(node.textContent).to.include('+8 (777) 666-55-11');

        const wrapper = node.childNodes[0] as HTMLElement;
        chai.expect(wrapper.nodeName).to.eq('SMALL');

        hoverCb({ target: wrapper });

        setTimeout(() => {
            chai.expect(node.childNodes[0].textContent).to.include(
                '+8 (777) 666-55-11',
            );

            sinon.assert.calledWith(extLink, 'tel:87776665511', {});
            done();
        }, HOVER_TIMEOUT * 2);
    });

    it('transformPhone / mouseleave', (done) => {
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
        } as any);

        transformPhone(window, counterOptions, {
            replaceFrom: '87776665511',
            replaceHTMLNode: node.childNodes[0],
            textOrig: '+8 (777) 666-55-11',
            replaceTo: '',
            replaceElementType: 'text',
        } as any);

        chai.expect(node.textContent).to.include('+8 (777) 666-55-11');

        const wrapper = node.childNodes[0] as HTMLElement;
        chai.expect(wrapper.nodeName).to.eq('SMALL');

        hoverCb({ target: wrapper });

        setTimeout(() => {
            leaveCb({ target: wrapper });
            setTimeout(() => {
                sinon.assert.notCalled(extLink);
                done();
            }, HOVER_TIMEOUT * 2);
        }, HOVER_TIMEOUT / 2);
    });

    it('transformPhone / mouseleave child', (done) => {
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
        } as any);

        transformPhone(window, counterOptions, {
            replaceFrom: '87776665511',
            replaceHTMLNode: node.childNodes[0],
            textOrig: '+8 (777) 666-55-11',
            replaceTo: '',
            replaceElementType: 'text',
        } as any);

        chai.expect(node.textContent).to.include('+8 (777) 666-55-11');

        const wrapper = node.childNodes[0] as HTMLElement;
        chai.expect(wrapper.nodeName).to.eq('SMALL');

        const someChild = wrapper.childNodes[0] as HTMLElement;
        chai.expect(someChild.nodeName).to.eq('SMALL');

        hoverCb({ target: wrapper });
        hoverCb({ target: someChild });

        setTimeout(() => {
            leaveCb({ target: someChild });
            setTimeout(() => {
                sinon.assert.called(extLink);
                done();
            }, HOVER_TIMEOUT * 2);
        }, HOVER_TIMEOUT / 2);
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
