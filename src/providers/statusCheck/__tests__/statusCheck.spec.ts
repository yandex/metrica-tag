import * as chai from 'chai';
import * as sinon from 'sinon';
import { CounterOptions } from 'src/utils/counterOptions';
import * as remoteControlUtils from 'src/providers/remoteControl/remoteControl';

import { parseDecimalInt } from 'src/utils/number';
import {
    CHECK_URL_PARAM,
    LANG_URL_PARAM,
    DEFAULT_LANGUAGE,
    langForCheck,
    counterIdForCheck,
} from '../urlSearchParams';
import { checkStatusRaw } from '../statusCheck';
import { checkStatusFn } from '../statusCheckFn';

describe('CHECK_STATUS_FEATURE', () => {
    const counterId = '1';
    const numericCounterId = parseDecimalInt(counterId);
    const lang = 'ru';
    const locationSearchWithCheckParameter = `?${CHECK_URL_PARAM}=${counterId}&${LANG_URL_PARAM}=${lang}`;
    const locationSearchWithoutLangParameter = `?${CHECK_URL_PARAM}=${counterId}`;
    const locationSearchWithoutCheckParameter = `?counterid=${counterId}`;

    const windowWithSearchParams = (inputSearchParams: string) => ({
        location: {
            search: inputSearchParams,
        },
    });

    describe('langForCheck', () => {
        it(`returns the value of "${LANG_URL_PARAM}" search parameter as defined in location`, () => {
            const ctx: any = windowWithSearchParams(
                locationSearchWithCheckParameter,
            );
            const parsedLang = langForCheck(ctx);
            chai.expect(parsedLang).to.equal(lang);
        });

        it(`returns "${DEFAULT_LANGUAGE}" when "${LANG_URL_PARAM}" search parameter is not defined in location`, () => {
            const ctx: any = windowWithSearchParams(
                locationSearchWithoutLangParameter,
            );
            const parsedLang = langForCheck(ctx);
            chai.expect(parsedLang).to.equal(DEFAULT_LANGUAGE);
        });
    });

    describe('counterIdForCheck', () => {
        it(`returns the numeric value of "${CHECK_URL_PARAM}" search parameter as defined in location`, () => {
            const ctx: any = windowWithSearchParams(
                locationSearchWithCheckParameter,
            );
            const parsedCounterId = counterIdForCheck(ctx);
            chai.expect(parsedCounterId).to.equal(numericCounterId);
        });

        it(`returns NaN when "${CHECK_URL_PARAM}" search parameter is not defined in location`, () => {
            const ctx: any = windowWithSearchParams(
                locationSearchWithoutCheckParameter,
            );
            const parsedCounterId = counterIdForCheck(ctx);
            chai.expect(parsedCounterId).to.be.NaN;
        });
    });

    describe('checkStatusRaw', () => {
        const sandbox = sinon.createSandbox();
        let setupUtilsAndLoadScriptStub: sinon.SinonStub;
        let getResourceUrlStub: sinon.SinonStub;
        let clock: sinon.SinonFakeTimers;
        const src = 'https://example.com/script.js';
        const counterOptions: CounterOptions = {
            id: numericCounterId,
            counterType: '0',
        };

        beforeEach(() => {
            setupUtilsAndLoadScriptStub = sandbox.stub(
                remoteControlUtils,
                'setupUtilsAndLoadScript',
            );
            getResourceUrlStub = sandbox
                .stub(remoteControlUtils, 'getResourceUrl')
                .returns(src);

            clock = sinon.useFakeTimers();
        });

        afterEach(() => {
            sandbox.restore();
            clock.restore();
        });

        it(`does not trigger setupAndLoadScript when the check is disabled in search parameters`, () => {
            const ctx: any = windowWithSearchParams(
                locationSearchWithoutCheckParameter,
            );
            ctx.setTimeout = setTimeout;
            checkStatusRaw(ctx, counterOptions);
            clock.runAll();
            chai.expect(setupUtilsAndLoadScriptStub.callCount).to.equal(0);
        });

        it(`triggers setupAndLoadScript with counter ID from search parameters`, () => {
            const ctx: any = windowWithSearchParams(
                locationSearchWithCheckParameter,
            );
            ctx.setTimeout = setTimeout;
            checkStatusRaw(ctx, counterOptions);
            clock.runAll();
            sinon.assert.calledOnceWithExactly(getResourceUrlStub, {
                ['lang']: 'ru',
                ['fileId']: 'status',
            });
            sinon.assert.calledWith(
                setupUtilsAndLoadScriptStub,
                ctx,
                src,
                counterId,
            );
        });
    });

    describe('checkStatusFn', () => {
        it('returns the counter id and checkStatus=true for existing counter', () => {
            const ctx: any = {
                Ya: {
                    _metrika: {
                        getCounters: () => [{ id: numericCounterId }],
                    },
                },
                location: {
                    search: locationSearchWithCheckParameter,
                },
            };

            const status = checkStatusFn(ctx);
            chai.expect(status.id).to.equal(numericCounterId);
            chai.expect(status.counterFound).to.be.true;
        });

        it('returns the counter id and checkStatus=false for missing counter', () => {
            const ctx: any = {
                Ya: {
                    _metrika: {
                        getCounters: () => [{ id: 2 }],
                    },
                },
                location: {
                    search: locationSearchWithCheckParameter,
                },
            };

            const status = checkStatusFn(ctx);
            chai.expect(status.id).to.equal(numericCounterId);
            chai.expect(status.counterFound).to.be.false;
        });
    });
});
