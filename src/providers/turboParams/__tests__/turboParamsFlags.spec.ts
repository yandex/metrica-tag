import * as chai from 'chai';
import { IS_TURBO_PAGE_BR_KEY, TURBO_PAGE_ID_BR_KEY } from 'src/api/watch';
import { BRINFO_FLAG_GETTERS } from 'src/middleware/watchSyncFlags/brinfoFlags';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { CounterOptions } from 'src/utils/counterOptions';
import { setTurboInfo } from 'src/utils/turboParams';
import { initProvider } from '..';

describe('watchSyncFlags', () => {
    const testTpid = 123;
    const counterOpt: CounterOptions = {
        id: 1,
        counterType: '0',
    };
    const senderParams: SenderInfo = {};

    it(`has no ${IS_TURBO_PAGE_BR_KEY} and ${TURBO_PAGE_ID_BR_KEY} keys without the feature flag`, () => {
        chai.expect(BRINFO_FLAG_GETTERS).not.to.have.property(
            IS_TURBO_PAGE_BR_KEY,
        );
    });

    describe('sets', () => {
        beforeEach(() => {
            initProvider();
        });

        it(IS_TURBO_PAGE_BR_KEY, () => {
            const winInfo = {} as Window;
            const counterOptions: CounterOptions = {
                ...counterOpt,
                id: 100,
            };
            let isTurboPageFlag = BRINFO_FLAG_GETTERS[IS_TURBO_PAGE_BR_KEY](
                winInfo,
                counterOptions,
                senderParams,
            );
            chai.expect(isTurboPageFlag).to.equal(null);

            setTurboInfo(counterOptions, {
                __ym: { turbo_page: 1, turbo_page_id: testTpid },
            });
            isTurboPageFlag = BRINFO_FLAG_GETTERS[IS_TURBO_PAGE_BR_KEY](
                winInfo,
                counterOptions,
                senderParams,
            );
            chai.expect(isTurboPageFlag).to.equal(1);
        });

        it(TURBO_PAGE_ID_BR_KEY, () => {
            const winInfo = {} as Window;
            const counterOptions: CounterOptions = {
                ...counterOpt,
                id: 101,
            };

            let turboPageIdFlag = BRINFO_FLAG_GETTERS[TURBO_PAGE_ID_BR_KEY](
                winInfo,
                counterOptions,
                senderParams,
            );
            chai.expect(turboPageIdFlag).to.equal(null);

            setTurboInfo(counterOptions, {
                __ym: { turbo_page: 1, turbo_page_id: testTpid },
            });
            turboPageIdFlag = BRINFO_FLAG_GETTERS[TURBO_PAGE_ID_BR_KEY](
                winInfo,
                counterOptions,
                senderParams,
            );
            chai.expect(turboPageIdFlag).to.be.equal(testTpid);
        });
    });
});
