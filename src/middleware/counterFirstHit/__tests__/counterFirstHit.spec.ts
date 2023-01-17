import * as sinon from 'sinon';
import { WATCH_URL_PARAM, PAGE_VIEW_BR_KEY } from 'src/api/watch';
import { CounterOptions } from 'src/utils/counterOptions';
import { browserInfo } from 'src/utils/browserInfo';
import * as storage from 'src/storage/global';
import { counterFirstHit } from '../counterFirstHit';

describe('wait for first hit', () => {
    const opt = () => {
        const counterOptions: CounterOptions = {
            id: Math.random() * 100,
            counterType: '0',
        };
        return counterOptions;
    };
    const win = () => {
        return {} as Window;
    };
    const fakeGlobalStorage: any = { setVal: sinon.stub() };

    const sandbox = sinon.createSandbox();
    beforeEach(() => {
        sandbox.stub(storage, 'getGlobalStorage').returns(fakeGlobalStorage);
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('waits for first hit', () => {
        const winInfo = win();
        const brInfo = browserInfo();
        const middleware = counterFirstHit(winInfo, opt());
        const next = sinon.stub();

        // not first hit
        middleware.beforeRequest!(
            {
                brInfo,
                urlParams: {
                    [WATCH_URL_PARAM]: 'test-url',
                },
            },
            next,
        );
        sinon.assert.notCalled(next);
        // first hit
        const firstHitParams = {
            brInfo: browserInfo({
                [PAGE_VIEW_BR_KEY]: 1,
            }),
            urlParams: {},
        };
        middleware.beforeRequest!(firstHitParams, next);
        const afterRequestNext = sinon.stub();
        middleware.afterRequest!(firstHitParams, afterRequestNext);

        sinon.assert.calledOnce(afterRequestNext);
        sinon.assert.calledTwice(next);
    });
});
