import * as sinon from 'sinon';
import * as chai from 'chai';
import * as fn from 'src/utils/function';
import * as nf from 'src/utils/function/isNativeFunction/isNativeFn';
import { createConsole } from '../console';

describe('utils/console', () => {
    let isNativeStub: sinon.SinonStub<any, any>;
    let logStub: sinon.SinonStub<any, any>;
    let noopStub: sinon.SinonStub<any, any>;
    let console: {
        log?: sinon.SinonStub<any, any>;
        warn?: sinon.SinonStub<any, any>;
        error?: sinon.SinonStub<any, any>;
    };
    const sandbox = sinon.createSandbox();
    beforeEach(() => {
        logStub = sandbox.stub();
        isNativeStub = sandbox.stub(nf, 'isNativeFn');
        isNativeStub.callsFake((name, func) => !!func);
        noopStub = sandbox.stub(fn, 'noop');
        console = {
            log: logStub,
        };
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('returns log instead error if error is not native', () => {
        const win = {
            console,
        } as any;
        const logger = createConsole(win, '');
        logger.error(1);
        sinon.assert.calledOnce(logStub);
    });

    it('handle log is not native', () => {
        const consoleCtx = {};
        const win = {
            console: consoleCtx,
        } as any;
        const logger = createConsole(win, '');
        logger.log(1);
        chai.assert(noopStub.calledWith(1));
    });
});
