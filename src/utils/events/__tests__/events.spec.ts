import * as chai from 'chai';
import * as sinon from 'sinon';
import * as functionUtils from 'src/utils/function';
import { checkSupportsPassive, opts } from '..';
import { cEvent } from '../events';

describe('EventHelper', () => {
    let isNativeMock: any;
    beforeEach(() => {
        isNativeMock = sinon
            .stub(functionUtils, 'isNativeFunction')
            .callsFake((_, f: Function) => Boolean(f));
    });
    afterEach(() => {
        isNativeMock.restore();
    });
    it('Checks passive opt', () => {
        const mock: any = {
            addEventListener: (event: string, cb: Function, opt: any) => {
                return opt.passive;
            },
        };

        chai.expect(checkSupportsPassive(mock)).to.be.ok;
    });
    it('Mix opt if it undef', () => {
        const c = opts(true)(undefined);
        if (typeof c !== 'boolean') {
            chai.expect(c.passive).to.be.true;
            chai.expect(c.capture).to.be.true;
        }
    });
    it('Opt return boolean if opt not supported', () => {
        const c = opts(false)(undefined);
        if (typeof c === 'boolean') {
            chai.expect(c).to.be.false;
        }
    });
    it('Uses correct methods for target with addEventListender', () => {
        const addableTarget: any = {
            addEventListener: sinon.spy(),
            removeEventListener: sinon.spy(),
        };
        const cb = () => {};
        const options = { passive: false, capture: true };
        const handler = cEvent({
            addEventListener: (event: string, callback: Function, opt: any) => {
                return opt.passive;
            },
        } as any);
        const offCb = handler.on(addableTarget, ['event'], cb, options);

        chai.expect(addableTarget.addEventListener.called).to.be.ok;
        chai.expect(
            addableTarget.addEventListener.calledWith('event', cb, options),
        ).to.be.ok;

        offCb();

        chai.expect(addableTarget.removeEventListener.called).to.be.ok;
        chai.expect(
            addableTarget.removeEventListener.calledWith('event', cb, options),
        ).to.be.ok;
    });
    it('Uses correct methods for target without addEventListender', () => {
        const attachableTarget: any = {
            attachEvent: sinon.spy(),
            detachEvent: sinon.spy(),
        };
        const cb = () => {};
        const options = { passive: true, capture: true };
        const handler = cEvent({
            addEventListener: () => {},
        } as any);
        const offCb = handler.on(attachableTarget, ['event'], cb, options);

        chai.expect(attachableTarget.attachEvent.called).to.be.ok;
        chai.expect(attachableTarget.attachEvent.calledWith('onevent', cb)).to
            .be.ok;

        offCb();

        chai.expect(attachableTarget.detachEvent.called).to.be.ok;
        chai.expect(attachableTarget.detachEvent.calledWith('onevent', cb)).to
            .be.ok;
    });
    it("Doesn't crush on invalid target", () => {
        const invalidTarget: any = {};
        const handler = cEvent(window);
        const offCb = handler.on(invalidTarget, ['event'], () => {}, {});
        offCb();
    });
});
