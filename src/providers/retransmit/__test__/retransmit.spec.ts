import * as sinon from 'sinon';
import * as retransmitState from 'src/middleware/retransmit/state';
import type { CounterOptions } from 'src/utils/counterOptions';
import { RetransmitState } from 'src/middleware/retransmit/state';
import * as sendRetransmitRequests from '../sendRetransmitRequests';
import { useRetransmitProvider } from '../retransmit';

describe('provider / retransmit', () => {
    const win = {} as Window;
    const counterId = 132;
    const counterOptions: CounterOptions = { id: counterId, counterType: '0' };

    const firstReq: retransmitState.RetransmitInfo = {
        resource: 'r1',
        counterId: 1234,
        counterType: '0',
        params: { param: 'value' },
        postParams: 'param1=value1',
        browserInfo: {
            a: 1,
            b: 1,
        },
        retransmitIndex: 1,
        protocol: 'https:',
        host: 'example.com',
        ghid: 987654321,
        time: 1234567890,
    };

    const sandbox = sinon.createSandbox();
    let sendRetransmitRequestsStub: sinon.SinonStub<
        Parameters<typeof sendRetransmitRequests.sendRetransmitRequests>,
        ReturnType<typeof sendRetransmitRequests.sendRetransmitRequests>
    >;
    let getRetransmitStateStub: sinon.SinonStub<
        Parameters<typeof retransmitState.getRetransmitState>,
        ReturnType<typeof retransmitState.getRetransmitState>
    >;

    beforeEach(() => {
        getRetransmitStateStub = sandbox.stub(
            retransmitState,
            'getRetransmitState',
        );
        sendRetransmitRequestsStub = sandbox.stub(
            sendRetransmitRequests,
            'sendRetransmitRequests',
        );
        getRetransmitStateStub.returns({
            getNotExpired: () => [firstReq],
            clearExpired: sandbox.stub(),
            add: sandbox.stub(),
            delete: sandbox.stub(),
            length: sandbox.stub(),
            updateRetry: sandbox.stub(),
            clear: sandbox.stub(),
        } as RetransmitState);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('Makes retransmit calls and iterates through stored requests', () => {
        useRetransmitProvider(win, counterOptions);

        sinon.assert.calledOnceWithExactly(getRetransmitStateStub, win);

        sinon.assert.calledOnceWithExactly(
            sendRetransmitRequestsStub,
            win,
            counterOptions,
            [firstReq],
        );
    });
});
