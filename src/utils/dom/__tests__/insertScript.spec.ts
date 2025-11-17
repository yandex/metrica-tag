import * as chai from 'chai';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import { mix } from 'src/utils/object';
import * as scriptUtils from '../insertScript';

describe('dom / utils - insertScript', () => {
    const { window } = new JSDOMWrapper();
    const win = (noCreate = false, noHead = false) => {
        return mix({
            document: {
                createElement: noCreate
                    ? false
                    : window.document.createElement.bind(window.document),
                getElementsByTagName: (tagName: string) => {
                    if (noHead && tagName === 'head') {
                        return [];
                    }
                    return window.document.getElementsByTagName(tagName);
                },
            },
        });
    };
    const testUrl = 'testUrl';
    const options: scriptUtils.ScriptOptions = {
        src: testUrl,
    };
    it('fail when createElem broken', () => {
        const winInfo = win(true);
        const scriptTag = scriptUtils.insertScript(winInfo, options);
        chai.expect(scriptTag).to.be.not.ok;
    });
    it('no fail when head missed', () => {
        const winInfo = win(false, true);
        const scriptTag = scriptUtils.insertScript(winInfo, options);
        chai.expect(scriptTag).to.be.ok;
        if (scriptTag) {
            chai.expect(scriptTag.src).to.be.equal(testUrl);
        }
    });
    it('loads script', () => {
        const winInfo = win();
        const scriptTag = scriptUtils.insertScript(winInfo, options);
        chai.expect(scriptTag).to.be.ok;
        if (scriptTag) {
            chai.expect(scriptTag.src).to.be.equal(testUrl);
            chai.expect(scriptTag.charset).to.be.equal('utf-8');
            chai.expect(scriptTag.type).to.be.equal('text/javascript');
        }
    });
    it('sets data attributes', () => {
        const customOptions: scriptUtils.ScriptOptions = {
            ...options,
            dataAttributes: {
                testId: '12345678',
            },
        };
        const scriptTag = scriptUtils.insertScript(window, customOptions);
        chai.expect(scriptTag).to.be.ok;
        if (scriptTag) {
            chai.expect(scriptTag.src).to.be.equal(testUrl);
            chai.expect(scriptTag.charset).to.be.equal('utf-8');
            chai.expect(scriptTag.type).to.be.equal('text/javascript');
            chai.expect(scriptTag.dataset.testId).to.be.eq('12345678');
        }
    });
});
