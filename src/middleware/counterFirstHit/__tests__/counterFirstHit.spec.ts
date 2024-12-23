import * as sinon from 'sinon';
import { WATCH_URL_PARAM, PAGE_VIEW_BR_KEY } from 'src/api/watch';
import type { GlobalStorage } from 'src/storage/global/global';
import { CounterOptions } from 'src/utils/counterOptions';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import * as storage from 'src/storage/global/getGlobal';
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

    const sandbox = sinon.createSandbox();
    const fakeGlobalStorage = {
        setVal: sandbox.stub(),
    } as unknown as GlobalStorage;

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
        const next = sandbox.stub();

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
        const afterRequestNext = sandbox.stub();
        middleware.afterRequest!(firstHitParams, afterRequestNext);

        sinon.assert.calledOnce(afterRequestNext);
        sinon.assert.calledTwice(next);
    });
});
