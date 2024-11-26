import * as chai from 'chai';
import * as sinon from 'sinon';
import { normalizeOptions } from '..';

const id = 1;
const resultId = '1';
const params = {
    a: 1,
};
const counterType = 1;
const counterDefer = true;

describe('Counter Options', () => {
    let normalizeIdFake: any;
    let optionsKeysMapStub: any;

    beforeEach(() => {
        normalizeIdFake = sinon.fake.returns(resultId);
        optionsKeysMapStub = {
            id: {
                optKey: 'id',
                normalizeFunction: normalizeIdFake,
            },
            params: {
                optKey: 'params',
            },
            counterType: {
                optKey: 'type',
            },
            counterDefer: {
                optKey: 'defer',
            },
        };
    });

    afterEach(() => {
        normalizeIdFake.resetHistory();
    });

    it('should take list args', () => {
        const opt: {
            [key: string]: any;
        } = normalizeOptions(
            {
                id,
                params,
                type: counterType,
                defer: counterDefer,
            },
            optionsKeysMapStub,
        );
        sinon.assert.calledOnce(normalizeIdFake);
        chai.expect(opt.id).to.eq(resultId);
        chai.expect(opt.params).to.eq(params);
        chai.expect(opt.counterType).to.eq(counterType);
        chai.expect(opt.counterDefer).to.eq(counterDefer);
    });
    it('should take obj args', () => {
        const trueOpt = {
            id,
            params,
        };
        const opt: {
            [key: string]: any;
        } = normalizeOptions(trueOpt, optionsKeysMapStub);
        sinon.assert.calledOnce(normalizeIdFake);
        chai.expect(opt.id).to.eq(resultId);
        chai.expect(opt.params).to.eq(params);
    });
});
