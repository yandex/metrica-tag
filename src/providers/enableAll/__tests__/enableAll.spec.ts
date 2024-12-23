import * as sinon from 'sinon';
import { CounterOptions } from 'src/utils/counterOptions';
import * as counterUtils from 'src/utils/counter/getInstance';
import { METHOD_NAME_TRACK_LINKS } from 'src/providers/clicks/const';
import { useEnableAllProvider } from '../enableAll';
import { METHOD_NAME_CLICK_MAP } from '../../clickmapMethod/const';
import { METHOD_NAME_ENABLE_ALL } from '../const';

describe('enableAll', () => {
    const sandbox = sinon.createSandbox();
    const win = {} as Window;
    const counterId = 123;

    let clickmapSpy: sinon.SinonSpy;
    let trackLinksSpy: sinon.SinonSpy;

    beforeEach(() => {
        clickmapSpy = sandbox.spy();
        trackLinksSpy = sandbox.spy();

        sandbox.stub(counterUtils, 'getCounterInstance').returns({
            [METHOD_NAME_CLICK_MAP]: clickmapSpy,
            [METHOD_NAME_TRACK_LINKS]: trackLinksSpy,
        } as any);
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('enableAll in counterOptions', () => {
        useEnableAllProvider(win, {
            id: counterId,
            enableAll: true,
        } as CounterOptions);
        sinon.assert.calledWith(clickmapSpy, true);
        sinon.assert.calledWith(trackLinksSpy, true);
    });

    it('enableAll method', () => {
        const method = useEnableAllProvider(win, {
            id: counterId,
        } as CounterOptions)[METHOD_NAME_ENABLE_ALL];
        method();

        sinon.assert.calledOnce(clickmapSpy);
        sinon.assert.calledWith(clickmapSpy, true);
        sinon.assert.calledOnce(trackLinksSpy);
        sinon.assert.calledWith(trackLinksSpy, true);
    });
});
