import * as chai from 'chai';
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
    it('rewirite push function twise', (done) => {
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
        setTimeout(() => {
            chai.expect(counter).to.be.equal(2);
            done();
        }, 10);
        layer.push(testNo);
    });
    it('rewirite push function', (done) => {
        const winInfo = win();
        const testElem = 'testElem';
        const testElem2 = 'testElem2';
        const testArray: any[] = [testElem];
        let callCounter = 0;
        dataLayerObserver(winInfo, testArray, ({ observer }) => {
            observer.on((data) => {
                callCounter += 1;
                if (callCounter === 1) {
                    chai.expect(data).to.be.equal(testElem);
                } else {
                    chai.expect(data).to.be.equal(testElem2);
                    done();
                }
            });
        });
        testArray.push(testElem2);
    });
});
