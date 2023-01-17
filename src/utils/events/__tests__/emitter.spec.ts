import * as chai from 'chai';
import { emitter } from '../emiter';

const win = () => {
    const out = {
        Array,
    };
    return out as any as Window;
};
describe('emitter', () => {
    it('calls event handlers on trigger', (done) => {
        const winInfo = win();
        const eventEmiter = emitter(winInfo);
        const eventName = 'testEmiterEvent';
        const eventData = 'testData';
        let handleCounter = 0;
        let callCounter = 0;
        const handlerResultAdd = 'counterAdd';
        const handlerResult = 'handleInfo';
        const couterAdd = () => {
            callCounter += 1;
            return handlerResultAdd;
        };
        const info = eventEmiter
            .on([eventName], couterAdd)
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

        const nextInfo = eventEmiter
            .off([eventName], couterAdd)
            .trigger(eventName, eventData);

        chai.expect(nextInfo).to.be.deep.equal([handlerResult]);

        eventEmiter.off(['someDoesNotExist'], () => {});
    });
});
