import { expect } from 'chai';
import sinon, { assert, match } from 'sinon';
import {
    WATCH_URL_PARAM,
    WATCH_REFERER_PARAM,
    IS_DOWNLOAD_BR_KEY,
    IS_EXTERNAL_LINK_BR_KEY,
} from 'src/api/watch';
import { mix } from 'src/utils/object';
import type { SenderInfo } from 'src/sender/SenderInfo';
import * as locationUtils from 'src/utils/location';
import * as domUtils from 'src/utils/dom';
import * as getCountersUtils from 'src/providers/getCounters/getCounters';
import * as errorLoggerUtils from 'src/utils/errorLogger';
import * as debugConsoleUtils from 'src/providers/debugConsole/debugConsole';
import * as senderUtils from 'src/sender';
import * as hidUtils from 'src/middleware/watchSyncFlags/brinfoFlags/hid';
import { syncPromise } from 'src/__tests__/utils/syncPromise';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { GetSenderType } from 'src/sender/types';
import type { GlobalStorage } from 'src/storage/global';
import type { LocalStorage } from 'src/storage/localStorage';
import {
    sendClickLink,
    handleClickEventRaw,
    setShouldTrack,
    useClicksProviderRaw,
    addFileExtensionFn,
} from '../clicks';
import { LINK_CLICK_HIT_PROVIDER } from '../const';
import type { SendOptions, UserOptions } from '../types';
import * as tfl from '../getTextFromLink';

describe('clicks.ts', () => {
    const win = {} as Window;
    const currentLocationHostname = 'my-site.ru';
    const currentLocationHref = `https://${currentLocationHostname}/path?a=1`;
    const counterOptions: CounterOptions = {
        id: 123,
        counterType: '0',
    };
    const url = 'some-url';
    const title = 'This is title';
    const params = {
        param: 'wop-wop',
    };

    describe('sendClickLink', () => {
        const sandbox = sinon.createSandbox();
        let senderStub: sinon.SinonStub<
            Parameters<GetSenderType<typeof LINK_CLICK_HIT_PROVIDER>>,
            ReturnType<GetSenderType<typeof LINK_CLICK_HIT_PROVIDER>>
        >;
        let callbackSpy: sinon.SinonSpy<
            Parameters<Required<UserOptions>['callback']>,
            ReturnType<Required<UserOptions>['callback']>
        >;
        let getLoggerFn: sinon.SinonStub<
            Parameters<typeof debugConsoleUtils.getLoggerFn>,
            ReturnType<typeof debugConsoleUtils.getLoggerFn>
        >;

        beforeEach(() => {
            senderStub = sinon.stub();
            senderStub.returns(syncPromise);
            callbackSpy = sinon.spy(() => {});
            getLoggerFn = sandbox.stub(debugConsoleUtils, 'getLoggerFn');

            sandbox.stub(locationUtils, 'getLocation').returns({
                href: currentLocationHref,
                hostname: currentLocationHostname,
            } as Location);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('add file extension list and just string', () => {
            const mut: string[] = [];
            addFileExtensionFn(mut)('a');
            expect(mut).to.be.deep.eq(['a']);
            const mut2: string[] = ['0'];
            addFileExtensionFn(mut2)(['a', 'b']);
            expect(mut2).to.be.deep.eq(['0', 'a', 'b']);
        });

        it('properly sets browserInfo', () => {
            sendClickLink(win, counterOptions, {
                url,
                userOptions: {
                    title,
                    params,
                },
                isExternalLink: true,
                isDownload: true,
                sender: senderStub,
            });

            assert.calledOnce(senderStub);
            assert.calledWith(
                senderStub,
                match(
                    ({ brInfo }: SenderInfo) =>
                        brInfo!.getVal(IS_EXTERNAL_LINK_BR_KEY) === 1,
                ),
                counterOptions,
            );
            assert.calledWith(
                senderStub,
                match(
                    ({ brInfo }: SenderInfo) =>
                        brInfo!.getVal(IS_DOWNLOAD_BR_KEY) === 1,
                ),
                counterOptions,
            );
        });

        it('properly sets params', () => {
            sendClickLink(win, counterOptions, {
                url,
                userOptions: {
                    title,
                    params,
                },
                noIndex: true,
                sender: senderStub,
            });

            const spyCall = senderStub.getCall(0);
            const senderOptions: SenderInfo = spyCall.args[0];

            delete senderOptions.brInfo;

            assert.calledOnce(senderStub);
            expect(senderOptions).to.deep.equal({
                middlewareInfo: {
                    title,
                    params,
                    noIndex: true,
                },
                urlParams: {
                    [WATCH_URL_PARAM]: url,
                    [WATCH_REFERER_PARAM]: currentLocationHref,
                },
            });
        });

        it('respects forceUrl', () => {
            const forceUrl = 'https://example.com/force_url';
            const counterOptionsForce = mix({}, counterOptions, {
                forceUrl,
            });

            sendClickLink(win, counterOptionsForce, {
                url,
                userOptions: {
                    title,
                    params,
                },
                noIndex: true,
                sender: senderStub,
            });

            const spyCall = senderStub.getCall(0);

            assert.calledWith(
                spyCall,
                match.hasNested(`urlParams.${WATCH_REFERER_PARAM}`, forceUrl),
                counterOptionsForce,
            );
        });

        it('calls callback', () => {
            sendClickLink(win, counterOptions, {
                url,
                sender: senderStub,
                userOptions: {
                    callback: callbackSpy,
                    ctx: 'hey',
                },
            });

            assert.calledOnce(callbackSpy);
            assert.calledOn(callbackSpy, 'hey');
        });

        describe('calls getLoggerFn with proper message', () => {
            const defaultOptions: Partial<SendOptions> = {
                url,
                isDownload: false,
                isExternalLink: false,
                userOptions: {
                    ctx: 'hey',
                },
            };

            const assertGetLoggerFnCall = (
                message: string,
                options: SendOptions,
            ) => {
                assert.calledOnce(getLoggerFn);
                assert.calledWith(
                    getLoggerFn,
                    win,
                    counterOptions,
                    message,
                    options.userOptions,
                );
            };

            beforeEach(() => {
                defaultOptions.sender = senderStub;
                defaultOptions.userOptions!.callback = callbackSpy;
            });

            it('for a local download link', () => {
                const options = {
                    ...defaultOptions,
                    isDownload: true,
                } as SendOptions;
                const message = `File. Counter ${counterOptions.id}. Url: ${options.url}`;

                sendClickLink(win, counterOptions, options);

                assertGetLoggerFnCall(message, options);
            });

            it('for an external download link', () => {
                const options = {
                    ...defaultOptions,
                    isDownload: true,
                    isExternalLink: true,
                } as SendOptions;
                const message = `Ext link - File. Counter ${counterOptions.id}. Url: ${options.url}`;

                sendClickLink(win, counterOptions, options);

                assertGetLoggerFnCall(message, options);
            });

            it('for an external link', () => {
                const options = {
                    ...defaultOptions,
                    isExternalLink: true,
                } as SendOptions;
                const message = `Ext link. Counter ${counterOptions.id}. Url: ${options.url}`;

                sendClickLink(win, counterOptions, options);

                assertGetLoggerFnCall(message, options);
            });
        });
    });

    describe('handleClickEvent', () => {
        const sandbox = sinon.createSandbox();

        let senderStub: sinon.SinonStub<
            Parameters<GetSenderType<typeof LINK_CLICK_HIT_PROVIDER>>,
            ReturnType<GetSenderType<typeof LINK_CLICK_HIT_PROVIDER>>
        >;
        let globalStorageGetValSpy: sinon.SinonStub<
            Parameters<GlobalStorage['getVal']>,
            ReturnType<GlobalStorage['getVal']>
        >;
        let globalStorageSpy: GlobalStorage;
        let localStorageSetValSpy: sinon.SinonStub<
            Parameters<LocalStorage['setVal']>,
            ReturnType<LocalStorage['setVal']>
        >;
        let localStorageSpy: LocalStorage;
        let getTargetLinkStub: sinon.SinonStub<
            Parameters<typeof domUtils.getTargetLink>,
            ReturnType<typeof domUtils.getTargetLink>
        >;
        let isSameDomainStub: sinon.SinonStub<
            Parameters<typeof locationUtils.isSameDomain>,
            ReturnType<typeof locationUtils.isSameDomain>
        >;
        let textFromLinkStub: sinon.SinonStub<
            Parameters<typeof tfl.textFromLink>,
            ReturnType<typeof tfl.textFromLink>
        >;

        beforeEach(() => {
            senderStub = sinon.stub();
            senderStub.returns(syncPromise);
            globalStorageGetValSpy = sandbox.stub();
            globalStorageSpy = {
                getVal: globalStorageGetValSpy,
                setVal: sandbox.stub(),
            } as unknown as GlobalStorage;
            localStorageSetValSpy = sandbox.stub();
            localStorageSpy = {
                getVal: sandbox.stub(),
                setVal: localStorageSetValSpy,
            } as unknown as LocalStorage;
            getTargetLinkStub = sandbox.stub(domUtils, 'getTargetLink');
            isSameDomainStub = sandbox.stub(locationUtils, 'isSameDomain');
            textFromLinkStub = sandbox.stub(tfl, 'textFromLink');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('respects ym-disable-tracklink', () => {
            getTargetLinkStub.returns({
                className: 'link1 ym-disable-tracklink link2',
            } as HTMLAnchorElement);

            handleClickEventRaw(
                {
                    ctx: win,
                    counterOptions,
                    hitId: 123,
                    sender: senderStub,
                    globalStorage: globalStorageSpy,
                    counterLocalStorage: localStorageSpy,
                    fileExtensions: [],
                    trackLinksEnabled: () => true,
                },
                {} as MouseEvent,
            );

            assert.notCalled(senderStub);
        });

        it('respects ym-external-link', () => {
            getTargetLinkStub.returns({
                className: 'link1 ym-external-link link2',
                href: currentLocationHref,
                hostname: currentLocationHostname,
            } as HTMLAnchorElement);
            textFromLinkStub.returns('click me');

            handleClickEventRaw(
                {
                    ctx: win,
                    counterOptions,
                    hitId: 123,
                    sender: senderStub,
                    globalStorage: globalStorageSpy,
                    counterLocalStorage: localStorageSpy,
                    fileExtensions: [],
                    trackLinksEnabled: () => true,
                },
                {} as MouseEvent,
            );

            const spyCall = senderStub.getCall(0);

            assert.calledOnce(senderStub);
            assert.calledWith(
                spyCall,
                match(
                    ({ brInfo }: SenderInfo) =>
                        brInfo!.getVal(IS_EXTERNAL_LINK_BR_KEY) === 1,
                ),
                counterOptions,
            );
            assert.calledWith(
                spyCall,
                match.hasNested(
                    `urlParams.${WATCH_URL_PARAM}`,
                    currentLocationHref,
                ),
                counterOptions,
            );
            assert.calledWith(
                spyCall,
                match(
                    (options: SenderInfo) =>
                        options.middlewareInfo!.title === 'click me',
                ),
                counterOptions,
            );
        });

        it('saves link text to storage', () => {
            getTargetLinkStub.returns({
                className: 'link',
                href: currentLocationHref,
                hostname: currentLocationHostname,
                innerHTML: 'click me',
            } as HTMLAnchorElement);
            textFromLinkStub.returns('click me');
            isSameDomainStub.returns(true);

            globalStorageGetValSpy.returns(() => '');

            handleClickEventRaw(
                {
                    ctx: win,
                    counterOptions,
                    hitId: 123,
                    sender: senderStub,
                    globalStorage: globalStorageSpy,
                    counterLocalStorage: localStorageSpy,
                    fileExtensions: [],
                    trackLinksEnabled: () => true,
                },
                {} as MouseEvent,
            );

            assert.calledWith(
                localStorageSetValSpy.lastCall,
                match.any,
                'click me',
            );
        });

        it('handles internal download link', () => {
            const fileUrl = `https://${currentLocationHostname}/file.mp3`;
            getTargetLinkStub.returns({
                className: 'link',
                href: fileUrl,
                hostname: currentLocationHostname,
            } as HTMLAnchorElement);
            isSameDomainStub.returns(true);

            handleClickEventRaw(
                {
                    ctx: win,
                    counterOptions,
                    hitId: 123,
                    sender: senderStub,
                    globalStorage: globalStorageSpy,
                    counterLocalStorage: localStorageSpy,
                    fileExtensions: [],
                    trackLinksEnabled: () => true,
                },
                {} as MouseEvent,
            );

            const spyCall = senderStub.lastCall;

            assert.calledOnce(senderStub);
            assert.calledWith(
                spyCall,
                match.hasNested(`urlParams.${WATCH_URL_PARAM}`, fileUrl),
                counterOptions,
            );
            assert.calledWith(
                spyCall,
                match(
                    ({ brInfo }: SenderInfo) =>
                        !brInfo!.getVal(IS_EXTERNAL_LINK_BR_KEY) &&
                        brInfo!.getVal(IS_DOWNLOAD_BR_KEY) === 1,
                ),
                counterOptions,
            );
        });

        it('handles external download link', () => {
            const fileUrl = `https://example.com/file.mp3`;
            getTargetLinkStub.returns({
                className: 'link',
                href: fileUrl,
            } as HTMLAnchorElement);
            isSameDomainStub.returns(false);

            handleClickEventRaw(
                {
                    ctx: win,
                    counterOptions,
                    hitId: 123,
                    sender: senderStub,
                    globalStorage: globalStorageSpy,
                    counterLocalStorage: localStorageSpy,
                    fileExtensions: [],
                    trackLinksEnabled: () => true,
                },
                {} as MouseEvent,
            );

            const spyCall = senderStub.lastCall;

            assert.calledOnce(senderStub);
            assert.calledWith(
                spyCall,
                match.hasNested(`urlParams.${WATCH_URL_PARAM}`, fileUrl),
                counterOptions,
            );
            assert.calledWith(
                spyCall,
                match(
                    ({ brInfo }: SenderInfo) =>
                        brInfo!.getVal(IS_EXTERNAL_LINK_BR_KEY) === 1 &&
                        brInfo!.getVal(IS_DOWNLOAD_BR_KEY) === 1,
                ),
                counterOptions,
            );
        });

        it('ignores bad protocols', () => {
            getTargetLinkStub.returns({
                className: 'link',
                href: 'data:eee',
            } as HTMLAnchorElement);
            isSameDomainStub.returns(false);

            handleClickEventRaw(
                {
                    ctx: win,
                    counterOptions,
                    hitId: 123,
                    sender: senderStub,
                    globalStorage: globalStorageSpy,
                    counterLocalStorage: localStorageSpy,
                    fileExtensions: [],
                    trackLinksEnabled: () => true,
                },
                {} as MouseEvent,
            );

            assert.notCalled(senderStub);
        });

        it('should do nothing if trackLinks is disabled', () => {
            handleClickEventRaw(
                {
                    ctx: win,
                    counterOptions,
                    hitId: 123,
                    sender: senderStub,
                    globalStorage: globalStorageSpy,
                    counterLocalStorage: localStorageSpy,
                    fileExtensions: [],
                    trackLinksEnabled: () => false,
                },
                {} as MouseEvent,
            );
            expect(getTargetLinkStub.notCalled).to.be.true;
        });
    });

    describe('trackLinks flag', () => {
        const sandbox = sinon.createSandbox();
        const ctxStub = {} as Window;
        let counterStateStub: sinon.SinonStub;
        const verifyCounterStateCall = (
            callIndex: number,
            rawValue: unknown,
            expectedValue: boolean,
        ) => {
            const { args } = counterStateStub.getCall(callIndex);
            expect(
                args[0],
                `expected to return ${expectedValue} if the value is ${rawValue}`,
            ).to.deep.eq({
                trackLinks: expectedValue,
            });
            expect(args.length).to.eq(1);
        };

        beforeEach(() => {
            sandbox
                .stub(errorLoggerUtils, 'errorLogger')
                .callsFake(
                    (...args: unknown[]) =>
                        args[
                            args.length - 1
                        ] as typeof errorLoggerUtils.errorLogger,
                );
            counterStateStub = sandbox.stub();
            sandbox
                .stub(getCountersUtils, 'counterStateSetter')
                .returns(counterStateStub);
            sandbox
                .stub(senderUtils, 'getSender')
                .returns((() => Promise.resolve({})) as ReturnType<
                    typeof senderUtils.getSender
                >);
            sandbox.stub(hidUtils, 'getHid').returns(1);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should sets counter state correctly', () => {
            const testCases: [any, boolean][] = [
                [{}, true],
                [null, true],
                ['', true],
                ['dd', true],
                [12, false],
                [true, true],
                [false, false],
                [[], true],
                [() => {}, false],
                [NaN, false],
                [undefined, false],
            ];
            testCases.forEach(([rawParam, expected], i) => {
                setShouldTrack(counterStateStub, rawParam);
                verifyCounterStateCall(i, rawParam, expected);
            });
        });

        it('provider changes counter state based on counterOptions', () => {
            useClicksProviderRaw(ctxStub, {
                trackLinks: {},
            } as CounterOptions);

            const { trackLinks } = useClicksProviderRaw(ctxStub, {
                trackLinks: false,
            } as CounterOptions);

            verifyCounterStateCall(0, {}, true);
            expect(counterStateStub.getCalls().length).to.eq(1);

            trackLinks(true);
            verifyCounterStateCall(1, true, true);
            expect(counterStateStub.getCalls().length).to.eq(2);
        });
    });
});
