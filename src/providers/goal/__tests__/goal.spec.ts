import * as chai from 'chai';
import * as sinon from 'sinon';
import { syncPromise } from 'src/__tests__/utils/syncPromise';
import { WATCH_REFERER_PARAM, WATCH_URL_PARAM } from 'src/api/watch';
import * as art from 'src/providers/artificialHit/artificialHit';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions';
import * as dConsole from 'src/providers/debugConsole/debugConsole';
import { GOAL_PROVIDER, METHOD_NAME_GOAL } from 'src/providers/goal/const';
import * as sender from 'src/sender';
import type { SenderInfo } from 'src/sender/SenderInfo';
import type { CounterOptions } from 'src/utils/counterOptions';
import * as loc from 'src/utils/location/location';
import { PolyPromise } from 'src/utils/promise';
import * as url from 'src/utils/url/url';
import { useGoal } from '../goal';

describe('goal', () => {
    const counterOptions: CounterOptions = {
        id: 1929,
        counterType: DEFAULT_COUNTER_TYPE,
    };
    const sandbox = sinon.createSandbox();
    let winInfo: Window;
    let senderStub: sinon.SinonStub<
        Parameters<typeof sender.getSender>,
        ReturnType<typeof sender.getSender>
    >;
    let locationStub: any;
    let parseUrlStub: any;
    let artificial: any;
    const goalName = 'testGoal';
    const formData = '?i=formId';
    const testParams = { hi: 1 };
    const testCtx = {};
    const testHost = 'testHost';
    const testHref = 'testHref';

    beforeEach(() => {
        winInfo = {} as Window;
        sandbox.stub(dConsole, 'getLoggerFn').returns(() => {
            // nothing
        });
        senderStub = sandbox.stub(sender, 'getSender');
        locationStub = sandbox.stub(loc, 'getLocation');
        locationStub.withArgs(winInfo).returns({
            hostname: testHost,
            href: testHref,
        } as Location);
        parseUrlStub = sandbox.stub(url, 'parseUrl');
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('gets domain from artificial state', (done) => {
        const artificialDomain = 'artificialUrl';
        const artificialPath = 'artificialPath';
        const artificialUrl = `http://${artificialDomain}/${artificialPath}/`;
        const promise = PolyPromise.resolve({});
        artificial = sandbox.stub(art, 'getArtificialState');
        artificial.withArgs(counterOptions).returns({
            url: artificialUrl,
            ref: '',
        });
        senderStub
            .withArgs(winInfo, GOAL_PROVIDER, counterOptions)
            .returns((senderParams: SenderInfo) => {
                const paramsInfo = senderParams!.urlParams!;
                chai.expect(paramsInfo[WATCH_URL_PARAM]).to.be.equal(
                    `goal://${artificialDomain}/${goalName}`,
                );
                return promise;
            });
        parseUrlStub.returns({ hostname: artificialDomain });
        const goalSender = useGoal(winInfo, counterOptions)[METHOD_NAME_GOAL];
        goalSender(goalName);
        promise.then(() => done());
    });
    it('callback without params', () => {
        const callback = sinon.spy();
        senderStub
            .withArgs(winInfo, GOAL_PROVIDER, counterOptions)
            .returns(() => syncPromise);
        const goalSender = useGoal(winInfo, counterOptions)[METHOD_NAME_GOAL];
        goalSender(goalName, callback, testCtx);
        chai.expect(callback.called).to.be.ok;
        chai.expect(callback.calledOn(testCtx)).to.be.ok;
    });
    it('does nothing if target is invalid', () => {
        const spy = senderStub
            .withArgs(winInfo, GOAL_PROVIDER, counterOptions)
            .returns(() => PolyPromise.resolve({}));
        const goalSender = useGoal(winInfo, counterOptions)[METHOD_NAME_GOAL];
        goalSender('');
        chai.expect(spy.called).to.be.not.ok;
    });
    it('returns fn which sends goal', (done) => {
        senderStub
            .withArgs(winInfo, GOAL_PROVIDER, counterOptions)
            .returns((senderParams: SenderInfo, opt: CounterOptions) => {
                chai.expect(opt).to.be.deep.equal(counterOptions);
                chai.expect(
                    senderParams!.urlParams![WATCH_URL_PARAM],
                ).to.be.equal(`goal://${testHost}/${goalName}`);
                chai.expect(
                    senderParams!.urlParams![WATCH_REFERER_PARAM],
                ).to.be.equal(testHref);
                return Promise.resolve('');
            });
        const goalSender = useGoal(winInfo, counterOptions)[METHOD_NAME_GOAL];
        goalSender(
            goalName,
            testParams,
            function a(this: any) {
                chai.expect(this).to.be.equal(testCtx);
                done();
            },
            testCtx,
        );
    });
    it('sends form goal', (done) => {
        senderStub
            .withArgs(winInfo, GOAL_PROVIDER, counterOptions)
            .returns((senderParams: SenderInfo, opt: CounterOptions) => {
                chai.expect(opt).to.be.deep.equal(counterOptions);
                chai.expect(
                    senderParams!.urlParams![WATCH_URL_PARAM],
                ).to.be.equal(`form://${testHost}/${formData}`);
                chai.expect(
                    senderParams!.urlParams![WATCH_REFERER_PARAM],
                ).to.be.equal(testHref);
                return Promise.resolve('');
            });
        const goalSender = useGoal(winInfo, counterOptions, 'form')[
            METHOD_NAME_GOAL
        ];
        goalSender(formData, {}, function a(this: any) {
            done();
        });
    });
    it('calls metrika callback for every request', () => {
        const callbackStub = sinon.stub();
        senderStub
            .withArgs(winInfo, GOAL_PROVIDER, counterOptions)
            .returns(() => syncPromise);

        const goalSender = useGoal(
            winInfo,
            counterOptions,
            'form',
            callbackStub,
        )[METHOD_NAME_GOAL];
        goalSender(formData);
        goalSender(formData);
        chai.expect(callbackStub.getCalls().length).to.eq(2);
    });
});
