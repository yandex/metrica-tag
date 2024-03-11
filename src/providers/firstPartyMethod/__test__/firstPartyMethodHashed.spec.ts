import { CounterOptions } from 'src/utils/counterOptions';
import * as sinon from 'sinon';
import { expect } from 'chai';
import * as counterLib from 'src/utils/counter';
import { CounterObject } from 'src/utils/counter/type';
import * as debugConsoleUtils from 'src/providers/debugConsole/debugConsole';
import {
    FIRST_PARTY_EMPTY_CONSOLE_MESSAGE,
    FIRST_PARTY_NOT_AN_OBJECT_CONSOLE_MESSAGE,
} from 'src/providers/consoleRenderer/dictionary';
import {
    useFirstPartyMethodHashed,
    encodeRecursiveHashed,
} from '../firstPartyMethodHashed';
import { FirstPartyInputData, FirstPartyOutputData } from '../const';

describe('firstPartyMethodHashed', () => {
    const sandbox = sinon.createSandbox();
    let paramsSpy: sinon.SinonSpy<any[], any>;
    let getCounterInstanceStub: sinon.SinonStub<
        [ctx: Window, counterOptions: CounterOptions],
        CounterObject | undefined
    >;
    const logStub = sandbox.stub();
    const debugConsole = {
        log: logStub,
    } as unknown as debugConsoleUtils.ConsoleObject;
    let debugConsoleStub: sinon.SinonStub<
        [ctx: Window, counterKey: string],
        debugConsoleUtils.ConsoleObject
    >;

    const win = {} as Window;
    const opt = {
        id: 1,
        counterType: '0',
    } as CounterOptions;
    const counterKey = '1:0';

    beforeEach(() => {
        paramsSpy = sandbox.spy();
        getCounterInstanceStub = sandbox
            .stub(counterLib, 'getCounterInstance')
            .returns({ params: paramsSpy } as unknown as CounterObject);
        debugConsoleStub = sandbox
            .stub(debugConsoleUtils, 'DebugConsole')
            .returns(debugConsole);
    });

    afterEach(() => {
        // последовательность важна! restore очищает все стабы из песочницы
        sandbox.reset();
        sandbox.restore();
        logStub.resetHistory();
    });

    describe('firstPartyMethodHashed', () => {
        it('does nothing if counter instance not found', () => {
            getCounterInstanceStub.returns(undefined);
            const testObj: FirstPartyInputData = {};
            useFirstPartyMethodHashed(win, opt)(testObj);
            sinon.assert.notCalled(logStub);
            sinon.assert.notCalled(paramsSpy);
        });

        it('reports if input is not an object and exits', () => {
            const testObj = '1';

            useFirstPartyMethodHashed(
                win,
                opt,
            )(testObj as unknown as FirstPartyInputData);

            sinon.assert.calledOnceWithExactly(
                debugConsoleStub,
                win,
                counterKey,
            );
            sinon.assert.calledOnceWithExactly(
                logStub,
                FIRST_PARTY_NOT_AN_OBJECT_CONSOLE_MESSAGE,
            );
            sinon.assert.notCalled(paramsSpy);
        });

        it('throws an error if input object has no properties', () => {
            const testObj: FirstPartyInputData = {};

            useFirstPartyMethodHashed(win, opt)(testObj);

            sinon.assert.calledOnceWithExactly(
                debugConsoleStub,
                win,
                counterKey,
            );
            sinon.assert.calledOnceWithExactly(
                logStub,
                FIRST_PARTY_EMPTY_CONSOLE_MESSAGE,
            );
            sinon.assert.notCalled(paramsSpy);
        });

        it('encodes and sends valid data', () => {
            const testObj: FirstPartyInputData = {
                a: '1',
                obj: { d: '2', e: '3' },
            };

            expect(() =>
                useFirstPartyMethodHashed(win, opt)(testObj),
            ).to.not.throw();
            sinon.assert.calledOnceWithExactly(paramsSpy, {
                ['__ym']: {
                    [`fpmh`]: [
                        ['a', '1'],
                        [
                            'obj',
                            [
                                ['d', '2'],
                                ['e', '3'],
                            ],
                        ],
                    ],
                },
            });
        });

        it('encodes but does not send a valid input object with no valid properties', () => {
            const testObj = {
                a: 1,
                b: '',
                obj: { c: 2 },
            } as unknown as FirstPartyInputData;

            expect(() =>
                useFirstPartyMethodHashed(win, opt)(testObj),
            ).to.not.throw();
            sinon.assert.notCalled(paramsSpy);
        });
    });

    describe('encodeRecursiveHashed', () => {
        it('recursively converts an object into a multilevel array', () => {
            const testObj: FirstPartyInputData = {
                a: '1',
                obj: { d: '2', e: '3' },
            };

            const result = encodeRecursiveHashed(testObj);
            expect(result).to.be.lengthOf(2);
            const [dataA, dataObj] = result;

            const [keyNameA, valA] = dataA;
            expect(keyNameA).to.eq('a');
            expect(valA).to.eq('1');

            const [keyNameObj, valObj] = dataObj;
            expect(keyNameObj).to.eq('obj');

            expect(valObj).to.be.lengthOf(2);
            const [dataD, dataE] = valObj as FirstPartyOutputData[];

            const [keyNameD, valD] = dataD;
            expect(keyNameD).to.eq('d');
            expect(valD).to.eq('2');

            const [keyNameE, valE] = dataE;
            expect(keyNameE).to.eq('e');
            expect(valE).to.eq('3');
        });

        it('drops non-string values', () => {
            const testObj = { a: '1', b: 2 } as unknown as FirstPartyInputData;

            const result = encodeRecursiveHashed(testObj);
            expect(result).to.be.lengthOf(1);
            const [dataA, rest] = result;

            const [keyNameA, valA] = dataA;
            expect(keyNameA).to.eq('a');
            expect(valA).to.eq('1');
            expect(rest).to.be.undefined;
        });
    });
});
