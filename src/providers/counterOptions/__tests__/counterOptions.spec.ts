import * as chai from 'chai';
import * as sinon from 'sinon';
import * as counterOptions from '../counterOptions';
import * as consts from '../const';

const { DEFAULT_ID } = consts;
const { normalizeId, normalizeOptionsMap } = counterOptions;

const DEFAULT_RESULT = parseInt(DEFAULT_ID, 10);

describe('counterOptions.ts', () => {
    const id = 22022;
    const stringId = id.toString();

    it('normalizeId string', () => {
        const result = normalizeId(id);
        chai.expect(result).to.eq(id);
    });

    it('normalizeId number', () => {
        const result = normalizeId(stringId);
        chai.expect(result).to.eq(id);
    });

    it('normalizeId wrong', () => {
        const wrongId = '22002test';
        const result = normalizeId(wrongId);
        chai.expect(result).to.eq(DEFAULT_RESULT);
    });

    it('normalize counter type', () => {
        const testCounterType = 1;
        const expectedResult = testCounterType.toString();

        const result = normalizeOptionsMap.counterType(testCounterType);
        chai.expect(result).to.eq(expectedResult);
    });

    it('normalize counter type default', () => {
        const testDefaultCounterType = 1;
        const testCounterType = 0;
        const expectedResult = testCounterType.toString();

        const defaultStub = sinon
            .stub(consts, 'DEFAULT_COUNTER_TYPE')
            .value(testDefaultCounterType);
        const result = normalizeOptionsMap.counterType(testCounterType);
        chai.expect(result).to.eq(expectedResult);

        defaultStub.restore();
    });

    it('normalize sendTitle undefined', () => {
        const sendTitleParam = undefined;
        const result = normalizeOptionsMap.sendTitle(sendTitleParam);

        chai.expect(result).to.eq(true);
    });

    it('normalize sendTitle true', () => {
        const sendTitleParam = true;
        const result = normalizeOptionsMap.sendTitle(sendTitleParam);

        chai.expect(result).to.eq(true);
    });

    it('normalize sendTitle false', () => {
        const sendTitleParam = false;
        const result = normalizeOptionsMap.sendTitle(sendTitleParam);

        chai.expect(result).to.eq(false);
    });

    it('normalize sendTitle 0', () => {
        const sendTitleParam = 0;
        const result = normalizeOptionsMap.sendTitle(sendTitleParam);

        chai.expect(result).to.eq(false);
    });

    it('normalize sendTitle ""', () => {
        const sendTitleParam = '';
        const result = normalizeOptionsMap.sendTitle(sendTitleParam);

        chai.expect(result).to.eq(false);
    });

    it('normalize sendTitle null', () => {
        const sendTitleParam = null;
        const result = normalizeOptionsMap.sendTitle(sendTitleParam);

        chai.expect(result).to.eq(false);
    });
});
