import * as chai from 'chai';
import { emitter } from '../emitter';

const win = () => {
    const out = {
        Array,
    };
    return out as any as Window;
};
describe('emitter', () => {
    it('calls event handlers on trigger', (done) => {
        const winInfo = win();
        const eventEmitter = emitter(winInfo);
        const eventName = 'testEmitterEvent';
        const eventData = 'testData';
        let handleCounter = 0;
        let callCounter = 0;
        const handlerResultAdd = 'counterAdd';
        const handlerResult = 'handleInfo';
        const counterAdd = () => {
            callCounter += 1;
            return handlerResultAdd;
        };
        const info = eventEmitter
            .on([eventName], counterAdd)
            .on([eventName], (data) => {
                handleCounter += 1;
                chai.expect(data).to.be.equal(eventData);
                if (handleCounter === 2) {
                    chai.expect(callCounter).to.be.equal(1);
                    done();
                }
                return handlerResult;
            })
            .trigger(eventName, eventData);
        chai.expect(info).to.be.deep.equal([handlerResultAdd, handlerResult]);

        const nextInfo = eventEmitter
            .off([eventName], counterAdd)
            .trigger(eventName, eventData);

        chai.expect(nextInfo).to.be.deep.equal([handlerResult]);

        eventEmitter.off(['someDoesNotExist'], () => {});
    });
});
