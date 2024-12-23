import * as chai from 'chai';
import * as sinon from 'sinon';
import * as functionUtils from 'src/utils/function/isNativeFunction/isNativeFunction';
import * as arrayUtils from 'src/utils/array/indexOf';
import { closest } from 'src/utils/dom/closest';

describe('don / utils - closest', () => {
    const sandbox = sinon.createSandbox();
    const nativeFake = (_: any, fn: any) => {
        return Boolean(fn);
    };
    beforeEach(() => {
        sandbox.stub(functionUtils, 'isNativeFunction').callsFake(nativeFake);
        sandbox
            .stub(arrayUtils, 'cIndexOf')
            .returns((needle: any, haystack: ArrayLike<any>) =>
                Array.prototype.indexOf.call(haystack, needle),
            );
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('returns null if there is no Element or element is null', () => {
        let ctx: any = {};
        const element: any = {};
        const selector = 'selector';
        chai.expect(closest(selector, ctx, element)).to.equal(null);

        ctx = {
            Element: { prototype: { closest: () => {} } },
            document: {},
        };
        chai.expect(closest(selector, ctx, null as any)).to.equal(null);
    });

    it('uses closest method if avaliable', () => {
        const ctx: any = {
            Element: { prototype: { closest: () => {} } },
            document: {},
        };
        const result: any = {};
        const element: any = {
            closest: () => result,
        };
        const selector = 'selector';
        chai.expect(closest(selector, ctx, element)).to.equal(result);
    });

    it('uses match method if avaliable', () => {
        const result: any = {
            nodeType: 1,
        };
        const element: any = {
            nodeType: 1,
            parentElement: {
                nodeType: 1,
                parentElement: result,
            },
        };
        const matchesFunction = function matches(this: any) {
            return this === result;
        };
        const ctx: any = {
            Element: { prototype: { oMatchesSelector: matchesFunction } },
            document: {},
        };
        const selector = 'selector';
        chai.expect(closest(selector, ctx, element)).to.equal(result);
    });

    it('uses querySelectorAll method if avaliable', () => {
        const result: any = {
            nodeType: 1,
        };
        const element: any = {
            nodeType: 1,
            parentElement: {
                nodeType: 1,
                parentElement: result,
            },
        };
        const selectedNodes = [{}, {}, {}, {}, result, {}, {}];
        const ctx: any = {
            Element: { prototype: { querySelectorAll: () => {} } },
            document: {
                querySelectorAll: () => {
                    return selectedNodes;
                },
            },
        };
        const selector = 'selector';

        chai.expect(closest(selector, ctx, element)).to.equal(result);
    });
});
