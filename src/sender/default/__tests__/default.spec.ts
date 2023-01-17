import * as chai from 'chai';
import * as sinon from 'sinon';
import { DEBUG_EVENTS_FEATURE } from 'generated/features';
import * as inject from '@inject';
import * as time from 'src/utils/time';
import { REQUEST_BODY_KEY } from 'src/api/watch';
import { CONTENT_TYPE_HEADER } from 'src/sender/default/const';
import { browserInfo } from 'src/utils/browserInfo';
import { telemetry } from 'src/utils/telemetry/telemetry';
import type { TransportList } from 'src/transport';
import { useDefaultSender } from '../default';
import * as query from '../query';
import { createWatchQuery } from '../query/watchAPI';

describe('sender/default', () => {
    const win = {} as Window;
    const url1 = 'https://example.com';
    const url2 = 'https://example2.com';
    const result = 'body-content';
    const transportException = 'Transport is broken';

    const sandbox = sinon.createSandbox();
    const createUrlResponses = (
        r1: boolean,
        r2: boolean,
        r3: boolean,
        r4: boolean,
    ) => {
        return {
            [url1]: {
                tr1: r1,
                tr2: r2,
            },
            [`${url1}/1`]: {
                tr1: r1,
                tr2: r2,
            },
            [url2]: {
                tr1: r3,
                tr2: r4,
            },
            [`${url2}/1`]: {
                tr1: r3,
                tr2: r4,
            },
        };
    };
    let transportSuccesses: ReturnType<typeof createUrlResponses>;
    const transport1 = sandbox.stub().callsFake((url: string) => {
        return transportSuccesses[url].tr1
            ? Promise.resolve(result)
            : Promise.reject(new Error(transportException));
    });
    const transport2 = sandbox.stub().callsFake((url: string) => {
        return transportSuccesses[url].tr2
            ? Promise.resolve(result)
            : Promise.reject(new Error(transportException));
    });
    const transportList: TransportList = [
        [0, transport1],
        [1, transport2],
    ];
    const urlsList = [url1, url2];
    let timeStub: sinon.SinonStub<
        Parameters<typeof time.TimeOne>,
        ReturnType<typeof time.TimeOne>
    >;

    beforeEach(() => {
        sandbox.stub(inject.flags, DEBUG_EVENTS_FEATURE).value(false);
        sandbox.stub(query, 'createQuery').value(createWatchQuery);
        timeStub = sandbox.stub(time, 'TimeOne');
        timeStub.returns(<R>() => 100 as unknown as R);
    });

    afterEach(() => {
        transport1.resetHistory();
        transport2.resetHistory();
        sandbox.restore();
    });

    it('works correctly if first transport is correct', async () => {
        transportSuccesses = createUrlResponses(true, true, true, true);
        const sender = useDefaultSender(win, transportList);
        const response = await sender(
            { transportInfo: { debugStack: [] } },
            urlsList,
        );

        chai.expect(response.responseData).to.be.equal(result);
        chai.expect(response.urlIndex).to.be.equal(0);

        sinon.assert.calledOnceWithExactly(transport1, url1, {
            debugStack: [0],
            rQuery: {},
            verb: 'GET',
        });
    });

    it('adds redirect and adds browserInfo to url and makes urlEncoded rBody', async () => {
        transportSuccesses = createUrlResponses(true, true, true, true);
        const sender = useDefaultSender(win, transportList);
        const rBody = 'body';
        const brInfo = browserInfo();
        const tel = telemetry();
        brInfo.setVal('rt', 123);

        const response = await sender(
            {
                privateSenderInfo: {
                    noRedirect: true,
                },
                brInfo,
                telemetry: tel,
                transportInfo: {
                    debugStack: ['smth'],
                    rBody,
                },
            },
            urlsList,
        );

        chai.expect(response.responseData).to.be.equal(result);
        chai.expect(response.urlIndex).to.be.equal(0);

        sinon.assert.calledOnceWithExactly(transport1, `${url1}/1`, {
            rHeaders: {
                [CONTENT_TYPE_HEADER]: 'application/x-www-form-urlencoded',
            },
            verb: 'POST',
            rBody: `${REQUEST_BODY_KEY}=${rBody}`,
            rQuery: {
                ['browser-info']: brInfo.setVal('st', 100).serialize(),
                t: 'ti(0)',
            },
            debugStack: ['smth', 0],
        });
    });

    it('iterates all transports an all urls if they are broken', async () => {
        transportSuccesses = createUrlResponses(false, false, false, false);
        const sender = useDefaultSender(win, transportList);
        try {
            await sender({ transportInfo: { debugStack: ['smth'] } }, urlsList);
        } catch (err) {
            sinon.assert.calledTwice(transport1);
            sinon.assert.calledTwice(transport2);
            chai.expect(err).to.be.ok;
            chai.expect((err as Error).message).to.eq(transportException);
        }
    });

    it('iterates all transports if all but last is broken', async () => {
        transportSuccesses = createUrlResponses(false, false, false, true);
        const sender = useDefaultSender(win, transportList);

        const response = await sender(
            { transportInfo: { debugStack: ['smth'] } },
            urlsList,
        );

        chai.expect(response.responseData).to.be.equal(result);
        chai.expect(response.urlIndex).to.be.equal(1);

        sinon.assert.calledTwice(transport1);
        sinon.assert.calledTwice(transport2);
        sinon.assert.calledWith(transport2.getCall(1), url2, {
            debugStack: ['smth', 0, 1, 0, 1],
            rQuery: {},
            verb: 'GET',
        });
    });
});
