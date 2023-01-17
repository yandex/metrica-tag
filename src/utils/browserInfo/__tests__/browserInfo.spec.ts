/* eslint-env mocha */
import * as chai from 'chai';
import { TITLE_BR_KEY } from 'src/api/watch';
import { browserInfo, setInSerialized } from '..';

describe('BrowserInfo', () => {
    it('inits', () => {
        const flags = {
            test: 1,
        };
        const info = browserInfo(flags);
        const emInfo = browserInfo(null);
        chai.expect(emInfo.ctx()).to.be.deep.equal({});
        chai.expect(info.ctx()).to.be.deep.equal(flags);
        chai.expect(info.setVal('q', 1).ctx()).to.be.deep.equal({
            test: 1,
            q: 1,
        });
        chai.expect(flags).to.be.deep.equal({
            test: 1,
            q: 1,
        });
        chai.expect(info.serialize()).to.equal('test:1:q:1');
        const titleinfo = browserInfo();
        const titleText = 'some tiltle with : as text';
        titleinfo.setVal(TITLE_BR_KEY, titleText);
        titleinfo.setVal('q', '1');
        chai.expect(titleinfo.ctx()).to.be.deep.equal({
            [TITLE_BR_KEY]: titleText,
            q: '1',
        });
        chai.expect(titleinfo.serialize()).to.equal(
            `q:1:${TITLE_BR_KEY}:${titleText}`,
        );
    });
    it('setInSerialized', () => {
        const testValue = 'ti:1:td:2:undefined:is not a function';
        chai.expect(setInSerialized(testValue, 'ti', '2')).to.eq(
            'ti:2:td:2:undefined:is not a function',
        );
        chai.expect(setInSerialized(testValue, 'td', 'true')).to.eq(
            'ti:1:td:true:undefined:is not a function',
        );
        chai.expect(setInSerialized(testValue, 'undefined', '')).to.eq(
            'ti:1:td:2:undefined:',
        );
        chai.expect(setInSerialized(testValue, 'missing key', 'smth')).to.eq(
            testValue,
        );
    });
});
