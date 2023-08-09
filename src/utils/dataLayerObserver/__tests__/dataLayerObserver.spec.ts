import * as chai from 'chai';
import * as sinon from 'sinon';
import { dataLayerObserver } from '../dataLayerObserver';

const win = () => {
    const out = {
        Array,
    };
    return out as any as Window;
};

describe('dataLayerObserver', () => {
    it('no fail with null elem', () => {
        const winInfo = win();
        let counter = 0;
        dataLayerObserver(winInfo, undefined as any, () => {
            counter += 1;
        });
        chai.expect(counter).to.be.equal(0);
    });
    it('rewrite push function twice', () => {
        const layer: number[] = [];
        const winInfo = win();
        const testNo = 1;
        let counter = 0;
        dataLayerObserver<number, void>(winInfo, layer, ({ observer }) => {
            observer.on((no) => {
                counter += 1;
                chai.expect(no).to.be.equal(testNo);
            });
        });
        dataLayerObserver<number, void>(winInfo, layer, ({ observer }) => {
            observer.on((no) => {
                counter += 1;
                chai.expect(no).to.be.equal(testNo);
            });
        });
        layer.push(testNo);
        chai.expect(counter).to.be.equal(2);
    });
    it('rewrite push function', () => {
        const winInfo = win();
        const testElem = 'testElem';
        const testElem2 = 'testElem2';
        const testArray: any[] = [testElem];

        const onDataStub = sinon.stub();
        dataLayerObserver(winInfo, testArray, ({ observer }) => {
            observer.on(onDataStub);
        });
        testArray.push(testElem2);

        sinon.assert.calledTwice(onDataStub);
        sinon.assert.calledWith(onDataStub, testElem);
        sinon.assert.calledWith(onDataStub, testElem2);
    });
});
