import * as sinon from 'sinon';
import * as counterState from 'src/providers/getCounters/getCounters';
import { COUNTER_STATE_CLICKMAP } from 'src/providers/getCounters/const';
import { useClickmapMethodProvider } from '../clickmapMethod';

describe('clickMap method', () => {
    const sandbox = sinon.createSandbox();
    const win = {} as Window;
    const counterOptions = { id: 123 };

    let setSpy: sinon.SinonSpy;

    beforeEach(() => {
        setSpy = sandbox.spy();
        sandbox.stub(counterState, 'counterStateSetter').returns(setSpy);
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('set counter state', () => {
        const value = true;
        const { clickmap } = useClickmapMethodProvider(
            win,
            counterOptions as any,
        );
        clickmap(value);
        sinon.assert.calledWith(setSpy, {
            [COUNTER_STATE_CLICKMAP]: value,
        });
    });

    it('default true', () => {
        const { clickmap } = useClickmapMethodProvider(
            win,
            counterOptions as any,
        );
        clickmap();
        sinon.assert.calledWith(setSpy, {
            [COUNTER_STATE_CLICKMAP]: true,
        });
    });
});
