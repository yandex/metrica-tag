import * as flags from '@inject';
import * as chai from 'chai';
import {
    ACCURATE_TRACK_BOUNCE_METHOD_FEATURE,
    PREPROD_FEATURE,
} from 'generated/features';
import * as sinon from 'sinon';
import {
    ARTIFICIAL_BR_KEY,
    NOT_BOUNCE_BR_KEY,
    NOT_BOUNCE_CLIENT_TIME_BR_KEY,
} from 'src/api/watch';
import { COUNTER_STATE_NOT_BOUNCE } from 'src/providers/getCounters/const';
import * as getCountersUtils from 'src/providers/getCounters/getCounters';
import * as sender from 'src/sender';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { TransportResponse } from 'src/transport/types';
import type { CounterOptions } from 'src/utils/counterOptions';
import * as counterSettingsStore from 'src/utils/counterSettings/counterSettings';
import type { CounterSettings } from 'src/utils/counterSettings/types';
import * as errorLoggerUtils from 'src/utils/errorLogger/errorLogger';
import type { AnyFunc } from 'src/utils/function/types';
import { getRandom } from 'src/utils/number/random';
import * as time from 'src/utils/time/time';
import * as userTimeDefer from 'src/utils/userTimeDefer/userTimeDefer';
import { DEFAULT_NOT_BOUNCE_TIMEOUT } from '../const';
import { useNotBounceProviderRaw } from '../notBounce';

describe('notBounce', () => {
    const window = { Math } as Window;
    let senderInfo: SenderInfo | undefined;
    const timeouts: [number, AnyFunc][] = [];
    const sandbox = sinon.createSandbox();

    let counterStateStub: sinon.SinonStub<
        Parameters<ReturnType<typeof getCountersUtils.counterStateSetter>>,
        ReturnType<ReturnType<typeof getCountersUtils.counterStateSetter>>
    >;
    let setUserTimeDeferStub: sinon.SinonStub<
        Parameters<typeof userTimeDefer.setUserTimeDefer>,
        ReturnType<typeof userTimeDefer.setUserTimeDefer>
    >;
    let getSenderStub: sinon.SinonStub<
        Parameters<typeof sender.getSender>,
        ReturnType<typeof sender.getSender>
    >;
    let senderSpy: sinon.SinonSpy<
        [opt: SenderInfo],
        Promise<TransportResponse>
    >;
    let stateGetterStub: sinon.SinonStub<
        Parameters<typeof getCountersUtils.counterStateGetter>,
        ReturnType<typeof getCountersUtils.counterStateGetter>
    >;

    const getCounterOpt = (
        accurateTrackBounce?: number | boolean,
    ): CounterOptions => ({
        id: getRandom(window, 100),
        counterType: '0',
        accurateTrackBounce,
    });
    const verifyCounterStateCall = (
        callIndex: number,
        expectedValue: boolean,
    ) => {
        const { args } = counterStateStub.getCall(callIndex);
        chai.expect(args[0]).to.deep.eq({ accurateTrackBounce: expectedValue });
        chai.expect(args.length).to.eq(1);
    };

    let randomStub: sinon.SinonStub<
        Parameters<typeof Math.random>,
        ReturnType<typeof Math.random>
    >;

    beforeEach(() => {
        sandbox
            .stub(counterSettingsStore, 'getCounterSettings')
            .callsFake((opts, cb) => {
                cb({ firstHitClientTime: 100 } as CounterSettings);

                return Promise.resolve();
            });

        sandbox.stub(flags, 'flags').value({
            [PREPROD_FEATURE]: false,
            [ACCURATE_TRACK_BOUNCE_METHOD_FEATURE]: true,
        });
        sandbox.stub(time, 'TimeOne').returns(<R>() => 0 as unknown as R);
        senderInfo = undefined;
        timeouts.splice(0, timeouts.length);

        randomStub = sandbox.stub(Math, 'random');
        randomStub.returns(0.01);

        setUserTimeDeferStub = sandbox.stub(userTimeDefer, 'setUserTimeDefer');
        setUserTimeDeferStub.callsFake((ctx, callback, t) => {
            const timeoutId = timeouts.push([t, callback]) - 1;
            return () => {
                timeouts.splice(timeoutId, 1);
            };
        });

        senderSpy = sinon.spy((senderOpt: SenderInfo) => {
            senderInfo = senderOpt;
            return Promise.resolve('');
        });
        getSenderStub = sandbox.stub(sender, 'getSender');
        getSenderStub.returns(senderSpy);

        sandbox
            .stub(errorLoggerUtils, 'errorLogger')
            .callsFake(
                (...args: unknown[]) => args[args.length - 1] as AnyFunc,
            );
        counterStateStub = sandbox.stub();
        sandbox
            .stub(getCountersUtils, 'counterStateSetter')
            .returns(counterStateStub);
        stateGetterStub = sandbox
            .stub(getCountersUtils, 'counterStateGetter')
            .returns(() => ({ [COUNTER_STATE_NOT_BOUNCE]: undefined }));
    });

    afterEach(() => {
        sandbox.restore();
        senderSpy.resetHistory();
    });

    it('Does nothing if no accurateTrackBounce is set', () => {
        const { notBounce } = useNotBounceProviderRaw(
            window,
            getCounterOpt(undefined),
        );
        chai.expect(timeouts.length).to.equal(0);
        chai.expect(typeof notBounce).to.equal('function');
    });

    it('Sets timeout if accurateTrackBounce is set and clears timeout if returned callback called', () => {
        const { notBounce } = useNotBounceProviderRaw(
            window,
            getCounterOpt(200),
        );
        chai.expect(timeouts).to.have.lengthOf(1);
        notBounce();
        const { brInfo } = senderInfo!;
        chai.expect(brInfo!.getVal(NOT_BOUNCE_BR_KEY)).to.equal(1);
        chai.expect(brInfo!.getVal(NOT_BOUNCE_CLIENT_TIME_BR_KEY)).to.equal(
            100,
        );
        chai.expect(brInfo!.getVal(ARTIFICIAL_BR_KEY)).to.equal(1);
        chai.expect(timeouts).to.have.lengthOf(0);
    });

    it('Sets default timeout if accurateTrackBounce is set to true', () => {
        useNotBounceProviderRaw(window, getCounterOpt(true));
        const [timeout, callback] = timeouts[0]!;
        chai.expect(timeout).to.equal(DEFAULT_NOT_BOUNCE_TIMEOUT);
        chai.expect(typeof callback).to.equal('function');
    });

    it('Sets counter state', () => {
        const { notBounce } = useNotBounceProviderRaw(
            window,
            getCounterOpt(true),
        );

        verifyCounterStateCall(0, true);
        notBounce();
        verifyCounterStateCall(1, true);
    });

    it('Make request on repeat call', () => {
        const { notBounce } = useNotBounceProviderRaw(
            window,
            getCounterOpt(false),
        );
        notBounce();
        chai.expect(senderSpy.called).to.be.ok;
    });

    it('Use accurateTrackBounce method', () => {
        const testTimeout = 123;
        const { accurateTrackBounce } = useNotBounceProviderRaw(
            window,
            getCounterOpt(undefined),
        );
        chai.expect(timeouts.length).to.equal(0);
        accurateTrackBounce!(testTimeout);
        const [timeout, callback] = timeouts[0]!;
        chai.expect(timeouts.length).to.equal(1);
        chai.expect(timeout).to.equal(testTimeout);
        chai.expect(typeof callback).to.equal('function');
    });

    it('Call accurateTrackBounce once', () => {
        stateGetterStub.returns(() => ({ [COUNTER_STATE_NOT_BOUNCE]: true }));
        const { accurateTrackBounce } = useNotBounceProviderRaw(
            window,
            getCounterOpt(undefined),
        );
        accurateTrackBounce!();
        chai.expect(timeouts.length).to.equal(0);
    });
});
