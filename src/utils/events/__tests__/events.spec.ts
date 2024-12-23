import * as chai from 'chai';
import * as sinon from 'sinon';
import * as functionUtils from 'src/utils/function/isNativeFunction/isNativeFunction';
import type { AnyFunc } from 'src/utils/function/types';
import { cEvent, checkSupportsPassive, opts } from '../events';

describe('EventHelper', () => {
    let isNativeMock: sinon.SinonStub<
        Parameters<typeof functionUtils.isNativeFunction>,
        ReturnType<typeof functionUtils.isNativeFunction>
    >;
    beforeEach(() => {
        isNativeMock = sinon
            .stub(functionUtils, 'isNativeFunction')
            .callsFake((_, f) => Boolean(f));
    });
    afterEach(() => {
        isNativeMock.restore();
    });
    it('Checks passive opt', () => {
        const mock = {
            addEventListener: (
                type: string,
                listener: EventListenerOrEventListenerObject,
                opt?: AddEventListenerOptions,
            ): unknown => opt?.passive,
        } as Window;

        chai.expect(checkSupportsPassive(mock)).to.be.ok;
    });
    it('Mix opt if it undef', () => {
        const c = opts(true)(undefined);
        if (typeof c !== 'boolean') {
            chai.expect(c!.passive).to.be.true;
            chai.expect(c!.capture).to.be.true;
        }
    });
    it('Opt return boolean if opt not supported', () => {
        const c = opts(false)(undefined);
        if (typeof c === 'boolean') {
            chai.expect(c).to.be.false;
        }
    });
    it('Uses correct methods for target with addEventListener', () => {
        const addEventListenerSpy = sinon.spy();
        const removeEventListenerSpy = sinon.spy();
        const addableTarget = {
            addEventListener: addEventListenerSpy,
            removeEventListener: removeEventListenerSpy,
        } as unknown as Window;
        const cb = () => {};
        const options = { passive: false, capture: true };
        const handler = cEvent({
            addEventListener: (event: string, callback: AnyFunc, opt: any) => {
                return opt.passive;
            },
            removeEventListener: () => {},
        } as unknown as Window);
        const offCb = handler.on(addableTarget, ['change'], cb, options);
        sinon.assert.calledWith(addEventListenerSpy, 'change', cb, options);

        offCb();

        sinon.assert.calledWith(removeEventListenerSpy, 'change', cb, options);
    });
    it('Uses correct methods for target without addEventListener', () => {
        const attachEventSpy = sinon.spy();
        const detachEventSpy = sinon.spy();
        const attachableTarget = {
            attachEvent: attachEventSpy,
            detachEvent: detachEventSpy,
        } as unknown as Window;
        const cb = () => {};
        const options = { passive: true, capture: true };
        const handler = cEvent({
            addEventListener: () => {},
            attachEvent: () => {},
            detachEvent: () => {},
        } as unknown as Window);
        const offCb = handler.on(attachableTarget, ['change'], cb, options);

        sinon.assert.calledWith(attachEventSpy, 'onchange', cb);

        offCb();

        sinon.assert.calledWith(detachEventSpy, 'onchange', cb);
    });
    it("Doesn't crush on invalid target", () => {
        chai.expect(() => {
            const invalidTarget = {} as Window;
            const validTarget = {} as Window;
            const handler = cEvent(validTarget);
            const offCb = handler.on(invalidTarget, ['change'], () => {}, {});
            offCb();
        }).to.not.throw();
    });
});
