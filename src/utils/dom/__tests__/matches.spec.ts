import { expect } from 'chai';
import * as sinon from 'sinon';
import * as fn from 'src/utils/function/isNativeFunction/isNativeFunction';
import { getMatchesFunction } from '../dom';

describe('getMatchesFunction', () => {
    const sandbox = sinon.createSandbox();
    let isNativeStub: sinon.SinonStub<any, any>;
    beforeEach(() => {
        isNativeStub = sandbox.stub(fn, 'isNativeFunction');
        isNativeStub.returns(true);
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('return null if function not in Prototype', () => {
        isNativeStub.returns(false);
        const res = getMatchesFunction({} as any);
        expect(res).to.be.null;
    });
    it('return null if function not in context', () => {
        const res = getMatchesFunction({} as any);
        expect(res).to.be.null;
    });
    it('find function if it exist', () => {
        const excpetResult = {};
        const res = getMatchesFunction({
            Element: {
                prototype: {
                    matches: excpetResult,
                },
            },
        } as any);
        expect(res).to.be.eq(excpetResult);
    });
});
