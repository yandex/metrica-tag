import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sender from 'src/sender';
import * as timeUtils from 'src/utils/time/time';
import * as browserInfo from 'src/utils/browserInfo/browserInfo';
import * as settings from 'src/utils/counterSettings/counterSettings';
import * as errorLoggerUtils from 'src/utils/errorLogger/errorLogger';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { useRetransmitProvider } from '../retransmit';
import * as getRetransmitRequests from '../getRetransmitRequests';

describe('provider / retransmit', () => {
    const win = {} as Window;
    const counterId = 132;
    const counterOptions: CounterOptions = { id: counterId, counterType: '0' };
    const senderStub = sinon.stub().resolves();

    const firstReq = {
        resource: 'r1',
        counterId: '1234',
        counterType: '0',
        params: {
            a: 1,
        },
        postParams: {
            c: 1,
        },
        browserInfo: {
            a: 1,
            b: 1,
        },
        retransmitIndex: '1',
    };
    const secondReq = {
        resource: 'r2',
        counterId: '555',
        counterType: '0',
        params: {
            b: 1,
        },
        postParams: {
            z: 1,
        },
        browserInfo: {
            f: 1,
            r: 1,
        },
        retransmitIndex: '2',
    };
    const thirdReq = {
        resource: 'r3',
        counterId: '1233124',
        counterType: '0',
        params: {
            c: 1,
        },
        postParams: {
            z: 1,
        },
        browserInfo: {
            f: 1,
            r: 1,
        },
        retransmitIndex: '3',
    };

    const sandbox = sinon.createSandbox();
    let getSenderStub: sinon.SinonStub<any, any>;
    let timeStub: sinon.SinonStub<any, any>;
    let retransmitRequestsStub: sinon.SinonStub<any, any>;
    let getCoutnerSettingsStub: sinon.SinonStub<any, any>;
    let brInfoStub: sinon.SinonStub<any, any>;
    let errorLoggerStub: sinon.SinonStub<any, any>;

    beforeEach(() => {
        brInfoStub = sandbox.stub(browserInfo, 'browserInfo');
        errorLoggerStub = sandbox.stub();

        brInfoStub.callsFake((a: any) => a);
        timeStub = sandbox.stub(timeUtils, 'TimeOne');
        timeStub.returns(() => 0);
        getCoutnerSettingsStub = sandbox.stub(settings, 'getCounterSettings');
        getCoutnerSettingsStub.callsFake((_, fn) =>
            Promise.resolve(
                fn({
                    settings: { pcs: '', eu: false },
                    userData: {},
                }),
            ),
        );
        retransmitRequestsStub = sandbox.stub(
            getRetransmitRequests,
            'getRetransmitRequests',
        );
        getSenderStub = sandbox.stub(sender, 'getSender');
        sandbox.stub(errorLoggerUtils, 'errorLogger').returns(errorLoggerStub);
        getSenderStub.returns(senderStub);
        retransmitRequestsStub.returns([firstReq, secondReq, thirdReq]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('Makes retransmit calls and iterates through stored requests', () => {
        return useRetransmitProvider(win, counterOptions).then(() => {
            const senderCalls = senderStub.getCalls();
            chai.expect(senderCalls.length).to.equal(3);

            let [senderOptions, counterOptionsCalled] = senderCalls[0].args;
            chai.expect(counterOptionsCalled).to.deep.equal({
                id: firstReq.counterId,
                counterType: firstReq.counterType,
            });
            chai.expect(senderOptions).to.deep.equal({
                transportInfo: {
                    rBody: firstReq.postParams,
                },
                brInfo: firstReq.browserInfo,
                urlParams: firstReq.params,
                middlewareInfo: {
                    retransmitIndex: '1',
                },
                urlInfo: {
                    resource: 'r1',
                },
            } as any);

            [senderOptions, counterOptionsCalled] = senderCalls[1].args;
            chai.expect(counterOptionsCalled).to.deep.equal({
                id: secondReq.counterId,
                counterType: secondReq.counterType,
            });
            chai.expect(senderOptions).to.deep.equal({
                transportInfo: {
                    rBody: secondReq.postParams,
                },
                brInfo: secondReq.browserInfo,
                urlParams: secondReq.params,
                middlewareInfo: {
                    retransmitIndex: '2',
                },
                urlInfo: {
                    resource: 'r2',
                },
            } as any);

            [senderOptions, counterOptionsCalled] = senderCalls[2].args;
            chai.expect(counterOptionsCalled).to.deep.equal({
                id: thirdReq.counterId,
                counterType: thirdReq.counterType,
            });
            chai.expect(senderOptions).to.deep.equal({
                transportInfo: {
                    rBody: thirdReq.postParams,
                },
                brInfo: thirdReq.browserInfo,
                urlParams: thirdReq.params,
                middlewareInfo: {
                    retransmitIndex: '3',
                },
                urlInfo: {
                    resource: 'r3',
                },
            } as unknown as SenderInfo);
        });
    });

    it('catches transport errors', () => {
        let error: string;
        const buggyPromise = Promise.resolve()
            .then(() => {
                error = `smth ${Math.random()}`;
                return Promise.reject(error);
            })
            .catch((err) => {
                throw err;
            });
        getSenderStub.returns(() => buggyPromise);

        return useRetransmitProvider(win, counterOptions).then(() => {
            const actualErrors = errorLoggerStub
                .getCalls()
                .map(({ args }) => args[0]);
            chai.expect(actualErrors.length).to.eq(3);
            actualErrors.forEach((actualError) => {
                chai.expect(actualError).to.eq(error);
            });
        });
    });
});
