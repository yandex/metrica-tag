import * as chai from 'chai';
import * as sinon from 'sinon';
import * as asyncModule from 'src/utils/async/iterator';
import { HIT_PROVIDER } from 'src/providers';
import { CounterOptions } from 'src/utils/counterOptions';
import { getProviderMiddlewares } from '..';
import { combineMiddlewares } from '../combine';
import type { Middleware } from '../types';

describe('index Middleware', () => {
    const sandbox = sinon.createSandbox();
    let forOfStub: sinon.SinonStub<any, any>;
    beforeEach(() => {
        forOfStub = sandbox.stub(asyncModule, 'iterForOf');
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('getMiddlewares same length every call', () => {
        const provider = '1';
        const win = {} as any;
        const counterOptions: CounterOptions = {
            id: 12,
            counterType: '0',
        };
        const res1 = getProviderMiddlewares(win, provider, counterOptions);
        const lengthRes1 = res1.length;
        const res2 = getProviderMiddlewares(win, provider, counterOptions);
        chai.expect(res2).to.be.lengthOf(lengthRes1);
    });
    it('combine middleware last next should be called', () => {
        forOfStub.returns(() => {});
        const middlewareList: Middleware[] = [
            {
                afterRequest: (a, next) => {
                    chai.expect(next).to.be.ok;
                    next();
                },
            },
        ];
        combineMiddlewares(middlewareList, {});

        sinon.assert.calledOnce(forOfStub);
        const {
            args: [combineMiddlewaresList],
        } = forOfStub.getCall(0);
        chai.expect(combineMiddlewaresList).to.be.lengthOf(2);
        const [, lastMiddleware] = combineMiddlewaresList;
        const nextStub = sandbox.stub();
        lastMiddleware.beforeRequest({}, nextStub);
        sinon.assert.calledOnce(nextStub);
    });
    it('returns non empty list', () => {
        const middlewares = getProviderMiddlewares(window, HIT_PROVIDER, {
            id: 1,
            counterType: '1',
        });
        chai.expect(middlewares.length).to.be.ok;
    });
});
