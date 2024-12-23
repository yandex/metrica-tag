import sinon from 'sinon';
import * as chai from 'chai';
import * as gs from 'src/storage/global/getGlobal';

import { expect } from 'chai';
import * as closureStorageModule from '../closureStorage';
import { GLOBAL_STORAGE_KEY } from '..';

const { getVal, setVal, deleteVal, closureStorage } = closureStorageModule;

describe('ClosureStorage', () => {
    const sandbox = sinon.createSandbox();
    const ctxStub: any = {};

    afterEach(() => {
        sandbox.restore();
    });

    it('closureStorage keeps state manager in global storage', () => {
        const globalStorage: any = {
            setSafe: sinon.stub(),
            getVal: sandbox.stub(),
        };
        sandbox.stub(gs, 'getGlobalStorage').returns(globalStorage);
        const fn = closureStorage(ctxStub);
        fn((state) => {
            expect(state).to.deep.equal({});
        });
        sinon.assert.calledWith(globalStorage.getVal, GLOBAL_STORAGE_KEY);
        sinon.assert.calledWith(globalStorage.setSafe, GLOBAL_STORAGE_KEY, fn);
    });

    it('getVal/setVal/delVal', () => {
        const state: any = {};
        sandbox
            .stub(closureStorageModule, 'closureStorage')
            .returns((fn) => fn(state));
        setVal(ctxStub, 'a', { b: 1 });
        chai.expect(state).to.deep.equal({ a: { b: 1 } });
        chai.expect(getVal(ctxStub, 'a')).to.deep.equal({ b: 1 });
        deleteVal(ctxStub, 'a');
        chai.expect(state).to.deep.equal({});
    });
});
