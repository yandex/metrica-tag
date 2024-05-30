import * as chai from 'chai';
import * as sinon from 'sinon';

import {
    remoteControl,
    UTILS_CLOSEST_KEY,
    UTILS_GET_DATA_KEY,
    UTILS_KEY,
    UTILS_SELECT_KEY,
} from 'src/providers/remoteControl/remoteControl';
import * as events from 'src/utils/events';
import * as domUtils from 'src/utils/dom';
import type { EventSetter } from 'src/utils/events/types';
import * as globalUtils from 'src/storage/global';
import type { GlobalStorage } from 'src/storage/global';

describe('remoteControl / inline', () => {
    const sandbox = sinon.createSandbox();

    let eventHandlerOn: sinon.SinonStub<
        Parameters<EventSetter['on']>,
        ReturnType<EventSetter['on']>
    >;
    let eventHandlerUn: sinon.SinonStub<
        Parameters<EventSetter['un']>,
        ReturnType<EventSetter['un']>
    >;
    let insertScriptStub: sinon.SinonStub<
        Parameters<typeof domUtils.insertScript>,
        ReturnType<typeof domUtils.insertScript>
    >;
    let setValSpy: sinon.SinonSpy<
        Parameters<globalUtils.GlobalStorage['setVal']>,
        ReturnType<globalUtils.GlobalStorage['setVal']>
    >;

    const metrikaOrigin = 'https://metrika.example.com';

    const windowStub = {
        JSON,
    } as unknown as Window;

    beforeEach(() => {
        eventHandlerOn = sinon.stub();
        eventHandlerUn = sinon.stub();
        sandbox.stub(events, 'cEvent').returns({
            on: eventHandlerOn,
            un: eventHandlerUn,
        } as EventSetter);

        insertScriptStub = sandbox.stub(domUtils, 'insertScript');

        setValSpy = sandbox.spy(
            (name: string, value: unknown) => ({} as GlobalStorage),
        );
        sandbox.stub(globalUtils, 'getGlobalStorage').returns({
            setVal: setValSpy,
            setSafe: sandbox.spy(),
            getVal: sandbox.spy(),
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createResourcePath = (entity: string) =>
        `https://yastatic.net/s3/metrika/1.2.3/form-selector/${entity}_ru.js`;

    const createMessageData = (fileId: string) =>
        ({
            origin: metrikaOrigin,
            data: JSON.stringify({
                id: `${fileId}-new-id`,
                action: 'appendremote',
                version: '3',
                inline: true,
                lang: 'ru',
                appVersion: '1.2.3',
                fileId,
            }),
        } as MessageEvent<string>);

    const checkUtils = (entityKey: string) => {
        const setValSpyCall = setValSpy.getCall(1);
        sinon.assert.calledWith(setValSpyCall, UTILS_KEY, sinon.match.object);

        const utils = setValSpyCall.args[1] as Record<string, unknown>;
        const entityUtils = utils[entityKey];

        chai.expect(entityUtils).to.have.property(UTILS_CLOSEST_KEY);
        chai.expect(entityUtils).to.have.property(UTILS_SELECT_KEY);
        chai.expect(entityUtils).to.have.property(UTILS_GET_DATA_KEY);
    };

    it('select form', () => {
        eventHandlerOn.callsFake((ctx, _events, cb) => {
            cb.call(ctx, createMessageData('form'));
            return () => {};
        });

        remoteControl(windowStub);

        sinon.assert.calledWith(insertScriptStub, windowStub, {
            src: createResourcePath('form'),
        });
        checkUtils('form');
    });

    it('select button', () => {
        eventHandlerOn.callsFake((ctx, _events, cb) => {
            cb.call(ctx, createMessageData('button'));
            return () => {};
        });

        remoteControl(windowStub);

        sinon.assert.calledWith(insertScriptStub, windowStub, {
            src: createResourcePath('button'),
        });
        checkUtils('button');
    });
});
