import * as sinon from 'sinon';
import { expect } from 'chai';
import * as inject from '@inject';
import { TELEMETRY_FEATURE } from 'generated/features';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import * as sender from 'src/sender';
import * as counterSettings from 'src/utils/counterSettings/counterSettings';
import * as async from 'src/utils/async/async';
import * as asyncHelpers from 'src/utils/async/helpers';
import * as errorLogger from 'src/utils/errorLogger/errorLogger';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { SenderInfo } from 'src/sender/SenderInfo';
import { telemetry } from 'src/utils/telemetry/telemetry';
import type { RetransmitInfo } from 'src/middleware/retransmit/state';
import { CounterSettings } from 'src/utils/counterSettings/types';
import { RETRANSMIT_BRINFO_KEY } from 'src/api/watch';
import { sendRetransmitRequests } from '../sendRetransmitRequests';

describe('sendRetransmitRequests', () => {
    const sandbox = sinon.createSandbox();
    const settings = {} as CounterSettings;

    let mockCtx: Window;
    const mockCounterOpt: CounterOptions = {
        id: 12345,
        counterType: '0',
    };
    const mockRequests: RetransmitInfo[] = [
        {
            protocol: 'https:',
            host: 'example.com',
            resource: '/watch',
            counterId: 12345,
            counterType: '0',
            postParams: 'param1=value1',
            params: { param: 'value' },
            browserInfo: { [RETRANSMIT_BRINFO_KEY]: '1' },
            ghid: 987654321,
            time: 1234567890,
            retransmitIndex: 1,
        },
    ];
    let mockSender: sinon.SinonStub<
        Parameters<ReturnType<typeof sender.getSender>>,
        ReturnType<ReturnType<typeof sender.getSender>>
    >;
    let mockGetCounterSettings: sinon.SinonStub<
        Parameters<typeof counterSettings.getCounterSettings>,
        ReturnType<typeof counterSettings.getCounterSettings>
    >;
    let mockRunAsync: sinon.SinonStub<
        Parameters<typeof async.runAsync>,
        ReturnType<typeof async.runAsync>
    >;
    let mockIterateTaskWithConstraints: sinon.SinonStub<
        Parameters<typeof asyncHelpers.iterateTaskWithConstraints>,
        ReturnType<typeof asyncHelpers.iterateTaskWithConstraints>
    >;
    let mockErrorLogger: sinon.SinonStub<
        Parameters<typeof errorLogger.errorLogger>,
        ReturnType<typeof errorLogger.errorLogger>
    >;
    let injectFlags: sinon.SinonStub;

    beforeEach(() => {
        // Create mock context
        mockCtx = {
            Array,
            postMessage: sinon.stub(),
        } as unknown as Window;

        // Mock dependencies
        mockSender = sandbox
            .stub<
                Parameters<ReturnType<typeof sender.getSender>>,
                ReturnType<ReturnType<typeof sender.getSender>>
            >()
            .resolves();
        sandbox.stub(sender, 'getSender').returns(mockSender);

        mockGetCounterSettings = sandbox
            .stub<
                Parameters<typeof counterSettings.getCounterSettings>,
                ReturnType<typeof counterSettings.getCounterSettings>
            >()
            .callsFake((counterOpt, callback) =>
                Promise.resolve(callback(settings)),
            );
        sandbox
            .stub(counterSettings, 'getCounterSettings')
            .value(mockGetCounterSettings);

        mockRunAsync = sandbox.stub();
        sandbox.stub(async, 'runAsync').value(mockRunAsync);

        mockIterateTaskWithConstraints = sandbox.stub();
        sandbox
            .stub(asyncHelpers, 'iterateTaskWithConstraints')
            .value(mockIterateTaskWithConstraints);

        mockErrorLogger = sandbox
            .stub<
                Parameters<typeof errorLogger.errorLogger>,
                ReturnType<typeof errorLogger.errorLogger>
            >()
            .returns(sinon.stub());
        sandbox.stub(errorLogger, 'errorLogger').value(mockErrorLogger);

        // Mock flags
        injectFlags = sandbox.stub(inject, 'flags').value(inject.flags);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('calls getCounterSettings with correct parameters', () => {
        sendRetransmitRequests(mockCtx, mockCounterOpt, mockRequests);

        sinon.assert.calledOnceWithExactly(
            mockGetCounterSettings,
            mockCounterOpt,
            sinon.match.func,
        );
    });

    it('calls runAsync with correct parameters when getCounterSettings resolves', (done) => {
        sendRetransmitRequests(mockCtx, mockCounterOpt, mockRequests);

        setTimeout(() => {
            sinon.assert.calledOnce(mockRunAsync);
            sinon.assert.calledWith(mockRunAsync, mockCtx, sinon.match.func);
            done();
        }, 0);
    });

    it('calls iterateTaskWithConstraints with correct parameters', () => {
        sendRetransmitRequests(mockCtx, mockCounterOpt, mockRequests);

        // Get the function passed to runAsync and call it
        mockRunAsync.yield(
            mockCtx,
            mockRequests,
            sinon.match.func,
            sinon.match.number,
            sinon.match.string,
        );

        sinon.assert.calledOnce(mockIterateTaskWithConstraints);
        sinon.assert.calledWith(
            mockIterateTaskWithConstraints,
            mockCtx,
            mockRequests,
            sinon.match.func,
            sinon.match.number,
            sinon.match.string,
        );
    });

    it('creates retransmit sender with correct parameters', () => {
        sendRetransmitRequests(mockCtx, mockCounterOpt, mockRequests);

        // Get the function passed to runAsync and call it
        mockRunAsync.yield(
            mockCtx,
            mockRequests,
            sinon.match.func,
            sinon.match.number,
            sinon.match.string,
        );

        // Get the iterateTaskWithConstraints callback and call it with a request
        mockIterateTaskWithConstraints.yield(mockRequests[0]);

        sinon.assert.calledOnce(mockSender);
        sinon.assert.calledWith(
            mockSender,
            sinon.match.object,
            sinon.match.object,
        );
    });

    it('creates senderInfo with correct structure', () => {
        sendRetransmitRequests(mockCtx, mockCounterOpt, mockRequests);

        // Get the function passed to runAsync and call it
        mockRunAsync.yield(
            mockCtx,
            mockRequests,
            sinon.match.func,
            sinon.match.number,
            sinon.match.string,
        );

        // Get the iterateTaskWithConstraints callback and call it with a request
        mockIterateTaskWithConstraints.yield(mockRequests[0]);

        const senderInfo: SenderInfo = mockSender.getCall(0).args[0];
        const counterOptions: CounterOptions = mockSender.getCall(0).args[1];

        // Check counterOptions
        expect(counterOptions).to.deep.include({
            id: mockRequests[0].counterId,
            counterType: mockRequests[0].counterType,
        });
        // Check senderInfo structure
        expect(senderInfo).to.deep.include({
            transportInfo: { rBody: mockRequests[0].postParams },
            urlParams: mockRequests[0].params,
            middlewareInfo: {
                retransmitIndex: mockRequests[0].retransmitIndex,
            },
            urlInfo: {
                resource: mockRequests[0].resource,
            },
        });
        expect(senderInfo.brInfo!.serialize()).to.deep.eq(
            browserInfo(mockRequests[0].browserInfo).serialize(),
        );
    });

    it('includes telemetry in senderInfo when TELEMETRY_FEATURE is enabled and telemetry data exists', () => {
        // Add telemetry data to request
        const requestWithTelemetry: RetransmitInfo = {
            ...mockRequests[0],
            telemetry: { t: 'data' },
        };

        sendRetransmitRequests(mockCtx, mockCounterOpt, [requestWithTelemetry]);

        // Get the function passed to runAsync and call it
        mockRunAsync.yield(
            mockCtx,
            [requestWithTelemetry],
            sinon.match.func,
            sinon.match.number,
            sinon.match.string,
        );

        // Get the iterateTaskWithConstraints callback and call it with a request
        mockIterateTaskWithConstraints.yield(requestWithTelemetry);

        const senderInfo: SenderInfo = mockSender.getCall(0).args[0];

        // Check that telemetry is included
        expect(senderInfo.telemetry!.serialize()).to.deep.eq(
            telemetry(requestWithTelemetry.telemetry).serialize(),
        );
    });

    it('does not include telemetry in senderInfo when TELEMETRY_FEATURE is disabled', () => {
        // Disable telemetry feature
        injectFlags.value({
            ...inject.flags,
            [TELEMETRY_FEATURE]: false,
        });

        // Add telemetry data to request
        const requestWithTelemetry: RetransmitInfo = {
            ...mockRequests[0],
            telemetry: { t: 'data' },
        };

        sendRetransmitRequests(mockCtx, mockCounterOpt, [requestWithTelemetry]);

        // Get the function passed to runAsync and call it
        mockRunAsync.yield(
            mockCtx,
            [requestWithTelemetry],
            sinon.match.func,
            sinon.match.number,
            sinon.match.string,
        );

        // Get the iterateTaskWithConstraints callback and call it with a request
        mockIterateTaskWithConstraints.yield(requestWithTelemetry);

        const senderInfo: SenderInfo = mockSender.getCall(0).args[0];

        // Check that telemetry is not included
        expect(senderInfo.telemetry).to.be.undefined;
    });

    it('handles sender rejection and calls error logger', (done) => {
        const error = new Error('Sender failed');
        mockSender.rejects(error);
        mockErrorLogger.returns(sinon.stub());

        sendRetransmitRequests(mockCtx, mockCounterOpt, mockRequests).then(
            () => {
                mockRunAsync.yield(
                    mockCtx,
                    mockRequests,
                    sinon.match.func,
                    sinon.match.number,
                    sinon.match.string,
                );

                mockIterateTaskWithConstraints.yield(mockRequests[0]);

                setTimeout(() => {
                    sinon.assert.called(mockErrorLogger);
                    done();
                }, 10);
            },
        );
    });

    it('handles getCounterSettings rejection and calls error logger', (done) => {
        const error = new Error('getCounterSettings failed');
        mockGetCounterSettings.rejects(error);
        mockErrorLogger.returns(sinon.stub());

        sendRetransmitRequests(mockCtx, mockCounterOpt, mockRequests).then(
            () => {
                setTimeout(() => {
                    sinon.assert.called(mockErrorLogger);
                    sinon.assert.notCalled(mockSender);
                    done();
                }, 10);
            },
        );
    });

    it('completes execution without waiting for request promises to resolve when sending three requests asynchronously', (done) => {
        const mockRequestsThree: RetransmitInfo[] = [
            { ...mockRequests[0], retransmitIndex: 1 },
            { ...mockRequests[0], retransmitIndex: 2 },
            { ...mockRequests[0], retransmitIndex: 3 },
        ];

        const deferredPromises: Array<{
            resolve: (value?: any) => void;
            reject: (reason?: unknown) => void;
        }> = [];
        mockSender.callsFake(() => {
            return new Promise((resolve, reject) => {
                deferredPromises.push({ resolve, reject });
            });
        });

        const resultPromise = sendRetransmitRequests(
            mockCtx,
            mockCounterOpt,
            mockRequestsThree,
        );

        resultPromise.then(() => {
            sinon.assert.calledOnce(mockRunAsync);

            mockRunAsync.yield(
                mockCtx,
                mockRequestsThree,
                sinon.match.func,
                sinon.match.number,
                sinon.match.string,
            );

            sinon.assert.calledOnce(mockIterateTaskWithConstraints);
            mockRequestsThree.forEach((request) => {
                mockIterateTaskWithConstraints.yield(request);
            });

            sinon.assert.callCount(mockSender, 3);
            deferredPromises.forEach(({ resolve }) => resolve());

            setTimeout(() => {
                expect(mockSender.callCount).to.equal(3);
                done();
            }, 10);
        });
    });
});
