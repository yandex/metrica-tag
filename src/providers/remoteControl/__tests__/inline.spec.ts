import * as chai from 'chai';
import * as sinon from 'sinon';

import {
    remoteControl,
    UTILS_CLOSEST_KEY,
    UTILS_GET_DATA_KEY,
    UTILS_HIDE_PHONES_KEY,
    UTILS_KEY,
    UTILS_SELECT_KEY,
} from 'src/providers/remoteControl/remoteControl';
import * as events from 'src/utils/events';
import * as domUtils from 'src/utils/dom';
import * as globalUtils from 'src/storage/global';
import * as functionUtils from 'src/utils/function';
import type { AnyFunc } from 'src/utils/function/types';

describe('remoteControl / inline', () => {
    const sandbox = sinon.createSandbox();

    let eventHandlerOn: sinon.SinonStub;
    let eventHandlerUn: sinon.SinonStub;
    let testEventData = {};
    let insertScriptStub: sinon.SinonStub;
    let setValSpy: sinon.SinonSpy;
    let bindArgsStub: sinon.SinonStub;

    const metrikaOrigin = 'https://metrika.example.com';
    const externalOrigin = 'https://iframe-toloka.com';

    const windowStub = {
        JSON,
    } as unknown as Window;

    beforeEach(() => {
        eventHandlerOn = sinon
            .stub()
            .callsFake((ctx: Window, event: string, cb: AnyFunc) => {
                cb(testEventData);
            });
        eventHandlerUn = sinon.stub();

        sandbox.stub(events, 'cEvent').returns({
            on: eventHandlerOn,
            un: eventHandlerUn,
        });

        setValSpy = sandbox.spy();

        insertScriptStub = sandbox.stub(domUtils, 'insertScript');
        sandbox.stub(globalUtils, 'getGlobalStorage').returns({
            setVal: setValSpy,
            setSafe: sandbox.spy(),
            getVal: sandbox.spy(),
        });

        bindArgsStub = sandbox.stub(functionUtils, 'bindArgs');
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createResourcePath = (entity: string) =>
        `https://yastatic.net/s3/metrika/1.2.3/form-selector/${entity}_ru.js`;

    const createMessageData = (
        fileId: string,
        data?: string,
        origin: string = metrikaOrigin,
    ) => ({
        origin,
        data: JSON.stringify({
            id: `${fileId}-new-id`,
            action: 'appendremote',
            version: '3',
            inline: true,
            data,
            lang: 'ru',
            appVersion: '1.2.3',
            fileId,
        }),
    });

    const checkUtils = (entityKey: string) => {
        const setValSpyCall = setValSpy.getCall(1);
        sinon.assert.calledWith(setValSpyCall, UTILS_KEY);

        const utils = setValSpyCall.args[1][entityKey];

        chai.expect(utils).to.have.property(UTILS_CLOSEST_KEY);
        chai.expect(utils).to.have.property(UTILS_SELECT_KEY);
        chai.expect(utils).to.have.property(UTILS_GET_DATA_KEY);
    };

    const checkHidePhones = (phones: string[]) => {
        const setValSpyCall = setValSpy.getCall(1);
        sinon.assert.calledWith(setValSpyCall, UTILS_KEY);

        const utils = setValSpyCall.args[1].phone;
        chai.expect(utils).to.have.property(UTILS_HIDE_PHONES_KEY);

        sinon.assert.calledWith(bindArgsStub, [windowStub, null, phones]);
    };

    it('select form', () => {
        testEventData = createMessageData('form');

        remoteControl(windowStub);

        sinon.assert.calledWith(insertScriptStub, windowStub, {
            src: createResourcePath('form'),
        });
        checkUtils('form');
    });

    it('select button', () => {
        testEventData = createMessageData('button');

        remoteControl(windowStub);

        sinon.assert.calledWith(insertScriptStub, windowStub, {
            src: createResourcePath('button'),
        });
        checkUtils('button');
    });

    it('hide phones - exact phone', () => {
        testEventData = createMessageData(
            'phone',
            '89995556677',
            externalOrigin,
        );

        remoteControl(windowStub);

        sinon.assert.calledWith(insertScriptStub, windowStub, {
            src: createResourcePath('phone'),
        });
        checkHidePhones(['89995556677']);
    });
});
