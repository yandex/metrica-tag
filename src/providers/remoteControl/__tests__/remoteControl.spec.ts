import * as chai from 'chai';
import * as sinon from 'sinon';
import { yaNamespace } from 'src/const';
import { metrikaNamespace } from 'src/storage/global';
import * as functionUtils from 'src/utils/function';
import * as events from 'src/utils/events';
import * as global from 'src/storage/global';
import type { EventSetter } from 'src/utils/events/types';
import * as fnv32a from 'src/utils/fnv32a';
import * as inject from '@inject';
import { LOCAL_FEATURE } from 'generated/features';
import * as remoteControl from '../remoteControl';

describe('isAllowedStatic', () => {
    const origins = [
        'yastatic.net/s3/metrika',
        's3.mds.yandex.net/internal-metrika-betas',
        'username.dev.webvisor.com',
        'username.dev.metrika.yandex.ru',
    ];

    for (let i = 0; i < origins.length; i += 1) {
        const origin = origins[i];

        it(`works with ${origin}`, () => {
            chai.expect(
                remoteControl.isAllowedResource(`https://${origin}/1.js`),
            ).to.be.true;
            chai.expect(
                remoteControl.isAllowedResource(`https://${origin}/1.2.3/1.js`),
                'одиночные точки',
            ).to.be.true;
            chai.expect(
                remoteControl.isAllowedResource(
                    `https://${origin}/any/number/1.js`,
                ),
                'любой подпуть',
            ).to.be.true;

            chai.expect(
                remoteControl.isAllowedResource(`http://${origin}/1.js`),
                'http',
            ).to.be.false;
            chai.expect(
                remoteControl.isAllowedResource(`https://${origin}aaa/1.js`),
                'проверка на путь',
            ).to.be.false;
            chai.expect(
                remoteControl.isAllowedResource(`https://${origin}/evil?1.js`),
                'проверка на query params',
            ).to.be.false;
            chai.expect(
                remoteControl.isAllowedResource(`https://${origin}/1.jssss`),
                'проверка на расширение файла',
            ).to.be.false;
            chai.expect(
                remoteControl.isAllowedResource(`https://sub.${origin}/1.js`),
                'проверка на субдомен',
            ).to.be.false;
            chai.expect(
                remoteControl.isAllowedResource(`https://${origin}/../../1.js`),
                'проверка на .. в пути',
            ).to.be.false;
        });
    }
});

describe('isAllowedOrigin', () => {
    const shouldMatch = [
        'http://webvisor.com',
        'http://webvisor.com/',
        'http://.sub.domain.webvisor.com/',
        'http://.sub.domain.webvisor.com',
        'https://test.metrika.yandex.ru',
        'https://metrika.yandex.ru',
        'https://metrica.yandex.com',
    ];
    const shouldNotMatch = [
        'https://webvisor.com',
        'https://webvisor.com/',
        'https://sub.domain.webvisor.com',
        'http://webvisor.com/path/to/smth',
        'http://metrika.yandex.ru',
    ];

    it('shouldMatch', () => {
        shouldMatch.forEach((origin) => {
            chai.expect(
                remoteControl.isAllowedOrigin(origin),
                `Origin ${origin} should be allowed`,
            ).to.be.true;
        });
    });
    it('shouldNotMatch', () => {
        shouldNotMatch.forEach((origin) => {
            chai.expect(
                remoteControl.isAllowedOrigin(origin),
                `Origin ${origin} should NOT be allowed`,
            ).to.be.false;
        });
    });
});

describe('getResourceUrl', () => {
    // eslint-disable-next-line no-restricted-globals
    const ctx = { isFinite, isNaN } as Window;
    it('Only allowed langs', () => {
        ['ru', 'en', 'tr'].forEach((lang) => {
            chai.expect(
                remoteControl.getResourceUrl(ctx, {
                    lang,
                    appVersion: '1.2.3',
                    fileId: 'button',
                }),
            ).to.eq(
                `https://yastatic.net/s3/metrika/1.2.3/form-selector/button_${lang}.js`,
            );
        });
        chai.expect(
            remoteControl.getResourceUrl(ctx, {
                lang: 'de',
                appVersion: '1.2.3',
                fileId: 'button',
            }),
        ).to.eq('');
    });

    it('Only allowed ids', () => {
        ['button', 'form'].forEach((fileId) => {
            chai.expect(
                remoteControl.getResourceUrl(ctx, {
                    lang: 'ru',
                    appVersion: '1.2.3',
                    fileId,
                }),
            ).to.eq(
                `https://yastatic.net/s3/metrika/1.2.3/form-selector/${fileId}_ru.js`,
            );
        });
        chai.expect(
            remoteControl.getResourceUrl(ctx, {
                lang: 'ru',
                appVersion: '1.2.3',
                fileId: '',
            }),
        ).to.eq('');
    });

    it('Validate version', () => {
        chai.expect(
            remoteControl.getResourceUrl(ctx, {
                lang: 'ru',
                appVersion: '11.22.33',
                fileId: 'button',
            }),
        ).to.eq(
            'https://yastatic.net/s3/metrika/11.22.33/form-selector/button_ru.js',
        );
        chai.expect(
            remoteControl.getResourceUrl(ctx, {
                lang: 'ru',
                appVersion: '1684933',
                fileId: 'button',
            }),
        ).to.eq(
            'https://yastatic.net/s3/metrika/1684933/form-selector/button_ru.js',
        );
        chai.expect(
            remoteControl.getResourceUrl(ctx, {
                lang: 'ru',
                appVersion: 'invalidVer',
                fileId: 'button',
            }),
        ).to.eq('https://yastatic.net/s3/metrika/form-selector/button_ru.js');
        chai.expect(
            remoteControl.getResourceUrl(ctx, {
                lang: 'ru',
                appVersion: '1.a',
                fileId: 'button',
            }),
        ).to.eq('https://yastatic.net/s3/metrika/1/form-selector/button_ru.js');
        chai.expect(
            remoteControl.getResourceUrl(ctx, {
                lang: 'ru',
                appVersion: '/.//.',
                fileId: 'button',
            }),
        ).to.eq('https://yastatic.net/s3/metrika/form-selector/button_ru.js');
        chai.expect(
            remoteControl.getResourceUrl(ctx, {
                lang: 'ru',
                appVersion: '0.0.0',
                fileId: 'button',
            }),
        ).to.eq(
            'https://yastatic.net/s3/metrika/0.0.0/form-selector/button_ru.js',
        );
    });

    it('Beta url', () => {
        chai.expect(
            remoteControl.getResourceUrl(ctx, {
                lang: 'ru',
                appVersion: '1.2.3',
                fileId: 'button',
                beta: true,
            }),
        ).to.eq(
            'https://s3.mds.yandex.net/internal-metrika-betas/1.2.3/form-selector/button_ru.js',
        );
    });
});

describe('remoteControl/onMessage', () => {
    const sandbox = sinon.createSandbox();
    const ctx = { JSON } as Window;
    let handleMessageStub: sinon.SinonStub<
        [ctx: Window, event: MessageEvent, message: remoteControl.Message],
        void
    >;

    beforeEach(() => {
        sandbox.stub(inject, 'flags').value({
            [LOCAL_FEATURE]: false,
        });
        handleMessageStub = sandbox.stub(remoteControl, 'handleMessage');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('ignores events with unknown action', () => {
        remoteControl.onMessage(ctx, {
            data: JSON.stringify({ action: 'something_wrong' }),
            origin: 'https://metrika.yandex.com',
        } as MessageEvent);
        sinon.assert.notCalled(handleMessageStub);
    });

    it('handles events from valid metrika origins', () => {
        const message = {
            action: 'appendremote',
        } as remoteControl.Message;
        const origin = 'https://metrika.yandex.com';
        const event = {
            data: JSON.stringify(message),
            origin,
        } as MessageEvent;
        remoteControl.onMessage(ctx, event);
        sinon.assert.calledWith(handleMessageStub, ctx, event, message);
    });
});

describe('remoteControl', () => {
    const eventHandlerUnsubscribe = sinon.stub();
    const eventHandlerOn = sinon
        .stub<Parameters<EventSetter['on']>, ReturnType<EventSetter['on']>>()
        .returns(eventHandlerUnsubscribe);
    const eventHandlerUn = sinon.stub();
    const getGlobalValue = sinon.stub();
    const setGlobalValue = sinon.stub();
    const hashResult = 100;
    const sandbox = sinon.createSandbox();

    let cEvent: sinon.SinonStub<
        Parameters<typeof events.cEvent>,
        ReturnType<typeof events.cEvent>
    >;

    beforeEach(() => {
        sandbox.stub(fnv32a, 'fnv32a').returns(hashResult);
        sandbox
            .stub(functionUtils, 'bindArg')
            .callsFake((arg, callback) => callback);
        getGlobalValue.withArgs(remoteControl.REMOTE_CONTROL).returns(false);
        sandbox.stub(global, 'getGlobalStorage').returns({
            getVal: getGlobalValue,
            setSafe: setGlobalValue,
            setVal: setGlobalValue,
        });
        cEvent = sandbox.stub(events, 'cEvent');
        cEvent.returns({
            on: eventHandlerOn,
            un: eventHandlerUn,
        } as EventSetter);
    });

    afterEach(() => {
        eventHandlerUnsubscribe.resetHistory();
        eventHandlerOn.resetHistory();
        eventHandlerUn.resetHistory();
        getGlobalValue.resetHistory();
        setGlobalValue.resetHistory();
        sandbox.restore();
    });

    it('sets event listener only once', () => {
        const windowStub = {
            [yaNamespace]: {
                [metrikaNamespace]: {},
            },
        } as Window;

        remoteControl.remoteControl(windowStub);

        sinon.assert.calledOnceWithExactly(
            eventHandlerOn,
            windowStub,
            ['message'],
            remoteControl.onMessage,
        );

        getGlobalValue.withArgs(remoteControl.REMOTE_CONTROL).returns(true);

        remoteControl.remoteControl(windowStub);
        remoteControl.remoteControl(windowStub);

        sinon.assert.calledOnce(eventHandlerOn);
    });
});
