import * as chai from 'chai';
import * as sinon from 'sinon';
import { CounterOptions } from 'src/utils/counterOptions';
import * as remoteControlUtils from 'src/providers/remoteControl/remoteControl';
import * as defer from 'src/utils/defer/defer';
import { parseDecimalInt } from 'src/utils/number/number';
import {
    CHECK_URL_PARAM,
    LANG_URL_PARAM,
    DEFAULT_LANGUAGE,
    getStatusCheckSearchParams,
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

    const windowWithSearchParams = (inputSearchParams: string) =>
        ({
            location: {
                search: inputSearchParams,
            },
        }) as Window;

    describe('langForCheck', () => {
        it(`returns the value of "${LANG_URL_PARAM}" search parameter as defined in location`, () => {
            const ctx = windowWithSearchParams(
                locationSearchWithCheckParameter,
            );
            const params = getStatusCheckSearchParams(ctx);
            chai.expect(params.lang).to.equal(lang);
        });

        it(`returns "${DEFAULT_LANGUAGE}" when "${LANG_URL_PARAM}" search parameter is not defined in location`, () => {
            const ctx = windowWithSearchParams(
                locationSearchWithoutLangParameter,
            );
            const params = getStatusCheckSearchParams(ctx);
            chai.expect(params.lang).to.equal(DEFAULT_LANGUAGE);
        });
    });

    describe('counterIdForCheck', () => {
        it(`returns the numeric value of "${CHECK_URL_PARAM}" search parameter as defined in location`, () => {
            const ctx = windowWithSearchParams(
                locationSearchWithCheckParameter,
            );
            const { id } = getStatusCheckSearchParams(ctx);
            chai.expect(id).to.equal(numericCounterId);
        });

        it(`returns NaN when "${CHECK_URL_PARAM}" search parameter is not defined in location`, () => {
            const ctx = windowWithSearchParams(
                locationSearchWithoutCheckParameter,
            );
            const { id } = getStatusCheckSearchParams(ctx);
            chai.expect(id).to.be.NaN;
        });
    });

    describe('checkStatusRaw', () => {
        const sandbox = sinon.createSandbox();
        let setDefer: sinon.SinonStub;
        let setupUtilsAndLoadScriptStub: sinon.SinonStub;
        let getResourceUrlStub: sinon.SinonStub;
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
            setDefer = sandbox.stub(defer, 'setDefer');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it(`does not trigger setupAndLoadScript when the check is disabled in search parameters`, () => {
            const ctx = windowWithSearchParams(
                locationSearchWithoutCheckParameter,
            );
            checkStatusRaw(ctx, counterOptions);
            sinon.assert.notCalled(setDefer);
        });

        it(`triggers setupAndLoadScript with counter ID from search parameters`, () => {
            const ctx = windowWithSearchParams(
                locationSearchWithCheckParameter,
            );
            checkStatusRaw(ctx, counterOptions);
            const [, callback, time] = setDefer.getCall(0).args;
            chai.expect(time).to.equal(0);
            callback();
            sinon.assert.calledOnceWithExactly(getResourceUrlStub, ctx, {
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
            const ctx = {
                Ya: {
                    _metrika: {
                        getCounters: () => [{ id: numericCounterId }],
                    },
                },
                location: {
                    search: locationSearchWithCheckParameter,
                },
            } as unknown as Window;

            const status = checkStatusFn(ctx);
            chai.expect(status.id).to.equal(numericCounterId);
            chai.expect(status.counterFound).to.be.true;
        });

        it('returns the counter id and checkStatus=false for missing counter', () => {
            const ctx = {
                Ya: {
                    _metrika: {
                        getCounters: () => [{ id: 2 }],
                    },
                },
                location: {
                    search: locationSearchWithCheckParameter,
                },
            } as unknown as Window;

            const status = checkStatusFn(ctx);
            chai.expect(status.id).to.equal(numericCounterId);
            chai.expect(status.counterFound).to.be.false;
        });
    });
});
