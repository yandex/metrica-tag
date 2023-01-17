import * as chai from 'chai';
import * as sinon from 'sinon';
import { CounterOptions } from 'src/utils/counterOptions';
import * as phonesDom from 'src/utils/phones/phonesDom';
import { PhoneChangeMap, ReplaceElement } from 'src/utils/phones';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';

describe('phones / phonesDom', () => {
    const { window } = new JSDOMWrapper();
    const { document } = window;
    const sandbox = sinon.createSandbox();
    let rootNode: HTMLElement;
    let node: HTMLElement;
    let link: HTMLAnchorElement;
    beforeEach(() => {
        node = document.createElement('div');
        node.innerHTML = '+8(777)666-55-11';
        link = document.createElement('a');
        link.innerHTML = '+8(777)666-55-22';
        link.href = 'tel:+8(777)666-55-22';
        rootNode = document.createElement('div');
        rootNode.appendChild(node);
        rootNode.appendChild(link);
        document.body.appendChild(rootNode);
    });
    afterEach(() => {
        document.body.removeChild(rootNode);
        sandbox.restore();
    });

    it('buildRegExp', () => {
        const { buildRegExp } = phonesDom;
        const mask = buildRegExp('1234');

        chai.expect('1 2 3 4 5'.match(mask)).to.include('1 2 3 4');
        chai.expect('1 - 2 + 3 ( 4 ) 5'.match(mask)).to.include(
            '1 - 2 + 3 ( 4',
        );
        chai.expect('2 2 3 4 5'.match(mask)).to.equal(null);
    });

    it('reformatPhone', () => {
        const { reformatPhone } = phonesDom;
        chai.expect(
            reformatPhone('+8 (777) 666-55-44', '12223334455'),
        ).to.equal('+1 (222) 333-44-55');
        chai.expect(reformatPhone('8 777 666-55-44', '12223334455')).to.equal(
            '1 222 333-44-55',
        );
        chai.expect(reformatPhone('+87776665544', '12223334455')).to.equal(
            '+12223334455',
        );
        chai.expect(reformatPhone('8 777 666-55-44', '122233344')).to.equal(
            '1 222 333-44',
        );
    });

    it('selectText', () => {
        const { selectText } = phonesDom;
        const ret = selectText(window, {
            '87776665511': {
                replaceTo: '11111',
                tuple: ['2222', '2222'],
            },
            '87776665522': {
                replaceTo: '22222',
                tuple: ['2222', '2222'],
            },
        } as PhoneChangeMap);
        chai.expect(ret.length).to.equal(2);
        const [foundNode1] = ret;
        chai.expect(foundNode1.replaceElementType).to.equal('text');
        chai.expect(foundNode1.replaceFrom).to.equal('87776665511');
        chai.expect(foundNode1.replaceTo).to.equal('1(111)1');
    });
    it('selectLink', () => {
        const { selectLink } = phonesDom;

        const ret = selectLink(window, {
            '87776665511': {
                replaceTo: '87776665512',
                tuple: ['87776665511', '87776665512'],
            },
            '87776665522': {
                replaceTo: '87776665523',
                tuple: ['87776665522', '87776665523'],
            },
        } as PhoneChangeMap);
        chai.expect(ret.length).to.equal(2);
        const [foundNode1, foundNode2] = ret;
        chai.expect(foundNode1.replaceElementType).to.equal('href');
        chai.expect(foundNode1.replaceFrom).to.equal('87776665522');
        chai.expect(foundNode1.replaceTo).to.equal('8(777)666-55-23');

        chai.expect(foundNode2.replaceElementType).to.equal('text');
        chai.expect(foundNode2.replaceFrom).to.equal('87776665522');
        chai.expect(foundNode2.replaceTo).to.equal('8(777)666-55-23');
    });
    it('selectLink / any', () => {
        const { selectLink } = phonesDom;

        const ret = selectLink(window, {
            '': {
                replaceTo: '',
                tuple: ['*', ''],
            },
        } as PhoneChangeMap);
        chai.expect(ret.length).to.equal(2);
        const [foundNode1, foundNode2] = ret;
        chai.expect(foundNode1.replaceElementType).to.equal('href');
        chai.expect(foundNode1.replaceFrom).to.equal('');
        chai.expect(foundNode1.replaceTo).to.equal('');

        chai.expect(foundNode2.replaceElementType).to.equal('text');
        chai.expect(foundNode2.replaceFrom).to.equal('87776665522');
        chai.expect(foundNode2.replaceTo).to.equal('');
    });
    it('createPhoneDomReplacer', async () => {
        const { createPhoneDomReplacer } = phonesDom;
        const transformer = sinon.spy();
        const counterOptions = {} as CounterOptions;

        const replacer = createPhoneDomReplacer(window, counterOptions, {
            transformer,
        });
        await replacer.replacePhonesDom([
            ['87776665511', '+72223334411'],
            ['87776665522', '+72223334422'],
        ]);
        sinon.assert.callCount(transformer, 4);

        sinon.assert.calledWith(
            transformer.getCall(0),
            window,
            counterOptions,
            {
                replaceFrom: '87776665522',
                replaceHTMLNode: link,
                textOrig: 'tel:+8(777)666-55-22',
                replaceTo: '7(222)333-44-22',
                replaceElementType: 'href',
            } as ReplaceElement,
        );

        sinon.assert.calledWith(
            transformer.getCall(1),
            window,
            counterOptions,
            {
                replaceFrom: '87776665522',
                replaceHTMLNode: link.childNodes[0],
                textOrig: '+8(777)666-55-22',
                replaceTo: '7(222)333-44-22',
                replaceElementType: 'text',
            } as ReplaceElement,
        );

        sinon.assert.calledWith(
            transformer.getCall(2),
            window,
            counterOptions,
            {
                replaceFrom: '87776665511',
                replaceHTMLNode: node.childNodes[0],
                textOrig: '+8(777)666-55-11',
                replaceTo: '7(222)333-44-11',
                replaceElementType: 'text',
            } as ReplaceElement,
        );

        sinon.assert.calledWith(
            transformer.getCall(3),
            window,
            counterOptions,
            {
                replaceFrom: '87776665522',
                replaceHTMLNode: link.childNodes[0],
                textOrig: '+8(777)666-55-22',
                replaceTo: '7(222)333-44-22',
                replaceElementType: 'text',
            } as ReplaceElement,
        );
    });
});
