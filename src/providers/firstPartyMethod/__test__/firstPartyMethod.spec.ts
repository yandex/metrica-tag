import * as sinon from 'sinon';
import * as chai from 'chai';
import { noop } from 'src/utils/function';
import * as counterLib from 'src/utils/counter';
import * as loc from 'src/utils/location';
import * as errorLogger from 'src/utils/errorLogger';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { FirstPartyOutputData } from '../const';
import { rawFirstPartyMethod, encodeRecursive } from '../firstPartyMethod';

describe('first party data', () => {
    const sandbox = sinon.createSandbox();
    const testHashResult = 'aaaaa';
    const testResult = 'testResult';
    const opt = {
        id: 1,
        counterType: '0',
    } as CounterOptions;

    const encodeStub = sandbox.stub().named('encoderStub');
    let readStub: sinon.SinonStub<
        Parameters<FileReader['readAsDataURL']>,
        ReturnType<FileReader['readAsDataURL']>
    >;
    let fileReader: FileReader;
    let textEncoderStub: sinon.SinonStub<[], TextEncoder>;
    let digestStub: sinon.SinonStub<
        Parameters<SubtleCrypto['digest']>,
        ReturnType<SubtleCrypto['digest']>
    >;
    let fileReaderStub: sinon.SinonStub<[], FileReader>;
    let windowSpy: Window;
    const paramsSpy = sandbox.spy();
    let isHttpsStub: sinon.SinonStub<
        Parameters<typeof loc.isHttps>,
        ReturnType<typeof loc.isHttps>
    >;
    let getCounterInstanceStub: sinon.SinonStub<
        Parameters<typeof counterLib.getCounterInstance>,
        ReturnType<typeof counterLib.getCounterInstance>
    >;
    let errorLoggerStub: sinon.SinonStub<
        Parameters<typeof errorLogger.errorLogger>,
        ReturnType<typeof errorLogger.errorLogger>
    >;
    let errorLoggerReturnStub: sinon.SinonStub<
        Parameters<ReturnType<typeof errorLogger.errorLogger>>,
        ReturnType<ReturnType<typeof errorLogger.errorLogger>>
    >;

    beforeEach(() => {
        readStub = sandbox.stub();
        fileReader = {
            readAsDataURL: readStub,
        } as unknown as FileReader;
        readStub.callsFake(() => {
            // @ts-ignore
            fileReader.onload({
                target: {
                    result: `,${testResult}`,
                },
            } as ProgressEvent<FileReader>);
        });
        textEncoderStub = sandbox.stub();
        textEncoderStub.returns({
            encode: encodeStub,
        } as unknown as TextEncoder);
        fileReaderStub = sandbox.stub();
        fileReaderStub.returns(fileReader);
        digestStub = sandbox.stub();
        digestStub.resolves(new ArrayBuffer(5));
        windowSpy = {
            TextEncoder: textEncoderStub,
            FileReader: fileReaderStub,
            Blob: sandbox.stub(),
            crypto: {
                subtle: {
                    digest: digestStub,
                },
            },
        } as unknown as Window;
        isHttpsStub = sandbox.stub(loc, 'isHttps').returns(true);
        getCounterInstanceStub = sandbox
            .stub(counterLib, 'getCounterInstance')
            .returns({ params: paramsSpy });
        errorLoggerReturnStub = sandbox.stub();
        errorLoggerStub = sandbox.stub(errorLogger, 'errorLogger');
        errorLoggerStub.returns(errorLoggerReturnStub);
    });

    afterEach(() => {
        // последовательность важна! restore очищает все стабы из песочницы
        sandbox.reset();
        sandbox.restore();
    });

    it('skip yandex_cid', async () => {
        const testObj = { yandex_cid: '1', obj: { d: '1', e: '1' } };
        const [dataA] = await encodeRecursive(windowSpy, testObj);
        const [keyName, val] = dataA;
        chai.expect(keyName).to.be.eq('yandex_cid');
        chai.expect(val).to.be.eq('1');
    });

    it('encode nested objects', async () => {
        const testObj = { a: '1', obj: { d: '1', e: '1' } };
        const [dataA, dataB] = await encodeRecursive(windowSpy, testObj);
        let [keyName, val] = dataA;
        chai.expect(keyName).to.be.eq('a');
        chai.expect(val).to.be.eq(testResult);
        const [keyObj, dataCFull] = dataB;
        chai.expect(keyObj).to.be.eq('obj');
        chai.expect(dataCFull).to.be.lengthOf(2);
        const [dataD, dataE] = dataCFull as FirstPartyOutputData[];
        [keyName, val] = dataD;
        chai.expect(keyName).to.be.eq('d');
        chai.expect(val).to.be.eq(testResult);
        [keyName, val] = dataE;
        chai.expect(keyName).to.be.eq('e');
        chai.expect(val).to.be.eq(testResult);
    });

    it('encode flat objects', async () => {
        const testObj = { a: '1', b: '123' };
        const fullData = await encodeRecursive(windowSpy, testObj);
        chai.expect(fullData).to.be.lengthOf(2);
        const [dataA, dataB] = fullData;
        const [keyName, val1] = dataA;
        chai.expect(keyName).to.be.eq('a');
        chai.expect(val1).to.be.eq(testResult);
        const [keyNameB, valB] = dataB;
        chai.expect(keyNameB).to.be.eq('b');
        chai.expect(valB).to.be.eq(testResult);
    });

    it('rejects if digest broken', async () => {
        digestStub.rejects(testHashResult);
        encodeStub.returns(1);
        const testObj = { a: '1' };
        try {
            await encodeRecursive(windowSpy, testObj);
        } catch (data) {
            const { name: firstResult } = data as Error;
            sandbox.assert.calledOnce(textEncoderStub);
            sandbox.assert.calledWith(
                digestStub,
                'SHA-256',
                1 as unknown as Uint8Array,
            );
            chai.expect(firstResult).to.be.eq(testHashResult);
        }
    });

    it('calls recursive encoder', async () => {
        digestStub.rejects(testHashResult);
        const result = rawFirstPartyMethod(windowSpy, opt);
        const testObj = { a: '1' };
        await result(testObj);
        sandbox.assert.calledOnce(textEncoderStub);
    });

    it('return some method which works with objects with keys', async () => {
        const result = rawFirstPartyMethod(windowSpy, opt);
        const testObj = {};
        await result(testObj)!;
        const error = errorLoggerReturnStub.getCall(0).args[0];
        chai.expect(error).to.have.property('message', 'err.kn(25)fpm.l');
    });

    it('return some method which works with objects only', async () => {
        const result = rawFirstPartyMethod(windowSpy, opt);
        chai.expect(result).to.be.not.eq(noop);
        await result(1 as any);
        const error = errorLoggerReturnStub.getCall(0).args[0];
        chai.expect(error).to.have.property('message', 'err.kn(25)fpm.o');
    });

    it('fail if it not https', () => {
        isHttpsStub.returns(false);
        const result = rawFirstPartyMethod(windowSpy, opt);
        chai.expect(result).to.be.eq(noop);
    });

    it("fail if counter doesn't exist", () => {
        getCounterInstanceStub.returns(undefined);
        const result = rawFirstPartyMethod(windowSpy, opt);
        chai.expect(result).to.be.eq(noop);
    });

    it('fail if not supported', () => {
        const win = {} as Window;
        const result = rawFirstPartyMethod(win, opt);
        chai.expect(result).to.be.eq(noop);
    });

    describe('normalizes phones', () => {
        it('replaces starting "8" with "7', async () => {
            const initialPhone = '8123456';
            const processedPhone = `7123456`;
            const testObj = { phone_number: initialPhone };
            const fullData = await encodeRecursive(windowSpy, testObj);
            chai.expect(fullData).to.be.lengthOf(1);
            const [dataA] = fullData;
            const [keyNameA, valA] = dataA;
            chai.expect(keyNameA).to.be.eq('phone_number');
            chai.expect(valA).to.be.eq(testResult);
            sandbox.assert.calledOnce(textEncoderStub);
            sandbox.assert.calledWith(encodeStub, processedPhone);
        });

        it('keep only digits', async () => {
            const initialPhone = ' (123) 456-789  ';
            const processedPhone = '123456789';
            const testObj = { phone_number: initialPhone };
            const fullData = await encodeRecursive(windowSpy, testObj);
            chai.expect(fullData).to.be.lengthOf(1);
            const [dataA] = fullData;
            const [keyNameA, valA] = dataA;
            chai.expect(keyNameA).to.be.eq('phone_number');
            chai.expect(valA).to.be.eq(testResult);
            sandbox.assert.calledOnce(textEncoderStub);
            sandbox.assert.calledWith(encodeStub, processedPhone);
        });
    });

    describe('normalizes emails', () => {
        const testCases = [
            {
                description: 'normalizes "ya.ru" to "yandex.ru"',
                initial: 'name@ya.ru',
                processed: 'name@yandex.ru',
            },
            {
                description: 'normalizes "yandex.com" to "yandex.ru"',
                initial: 'name@yandex.com',
                processed: 'name@yandex.ru',
            },
            {
                description: 'normalizes "yandex.com.tr" to "yandex.ru""',
                initial: 'name@yandex.com.tr',
                processed: 'name@yandex.ru',
            },
            {
                description: 'replaces dots with dashes for yandex domains',
                initial: 'name.namovich@yandex.ru',
                processed: 'name-namovich@yandex.ru',
            },
            {
                description: 'normalizes "googlemail.com" to "gmail.com"',
                initial: 'name@googlemail.com',
                processed: 'name@gmail.com',
            },
            {
                description: 'removes dots for gmail',
                initial: 'name.naimovich@gmail.com',
                processed: 'namenaimovich@gmail.com',
            },
            {
                description: 'removes suffix after "+" in name for gmail',
                initial: 'name+commercial@gmail.com',
                processed: 'name@gmail.com',
            },
        ];

        testCases.forEach(({ description, initial, processed }) => {
            it(description, async () => {
                const testObj = { email: initial };
                const fullData = await encodeRecursive(windowSpy, testObj);
                chai.expect(fullData).to.be.lengthOf(1);
                const [dataA] = fullData;
                const [keyNameA, valA] = dataA;
                chai.expect(keyNameA).to.be.eq('email');
                chai.expect(valA).to.be.eq(testResult);
                sandbox.assert.calledOnce(textEncoderStub);
                sandbox.assert.calledWith(encodeStub, processed);
            });
        });
    });
});
