import * as chai from 'chai';
import { mix } from 'src/utils/object';
import { loadScript, ScriptOptions } from '../loadScript';

describe('dom / utils - loadScript', () => {
    const win = (noCreate = false, noHead = false) => {
        const elemMok = {
            appendChild: () => {},
            insertBefore: () => {},
        };
        return mix({
            document: {
                createElement: noCreate ? false : () => elemMok,
                getElementsByTagName: (tagName: string) => {
                    if (noHead && tagName === 'head') {
                        return [];
                    }
                    return [elemMok];
                },
            },
        });
    };
    const testUrl = 'testUrl';
    const options: ScriptOptions = {
        src: testUrl,
    };
    it('fail when createElem broken', () => {
        const winInfo = win(true);
        const scriptTag = loadScript(winInfo, options);
        chai.expect(scriptTag).to.be.not.ok;
    });
    it('no fail when head missed', () => {
        const winInfo = win(false, true);
        const scriptTag = loadScript(winInfo, options);
        chai.expect(scriptTag).to.be.ok;
        if (scriptTag) {
            chai.expect(scriptTag.src).to.be.equal(testUrl);
        }
    });
    it('loads script', () => {
        const winInfo = win();
        const scriptTag = loadScript(winInfo, options);
        chai.expect(scriptTag).to.be.ok;
        if (scriptTag) {
            chai.expect(scriptTag.src).to.be.equal(testUrl);
            chai.expect(scriptTag.charset).to.be.equal('utf-8');
            chai.expect(scriptTag.type).to.be.equal('text/javascript');
        }
    });
});
