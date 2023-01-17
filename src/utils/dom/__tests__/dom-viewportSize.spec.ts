import { expect } from 'chai';
import { getViewportSize, getVisualViewportSize } from '../dom';

describe('dom getViewportSize/visualViewportSize', () => {
    it('uses visual viewport size for regular viewport if possible', () => {
        const win = {
            Math,
            visualViewport: {
                width: 10,
                height: 20,
                scale: 2,
            },
            documentElement: {
                clientWidth: 10,
                clientHeight: 10,
            },
        } as any;
        expect(getViewportSize(win)).to.be.deep.eq([20, 40]);
    });
    it('works without root element', () => {
        const win = {
            innerWidth: 10,
            innerHeight: 10,
        } as any;
        expect(getViewportSize(win)).to.be.deep.eq([10, 10]);
    });
    it('works with root element', () => {
        const win = {
            document: {
                documentElement: {
                    clientWidth: 10,
                    clientHeight: 10,
                },
            },
        } as any;
        expect(getViewportSize(win)).to.be.deep.eq([10, 10]);
    });
    it('returns null if visualViewport is absent in the window', () => {
        const win: any = {};
        expect(getVisualViewportSize(win)).to.be.eq(null);
    });
    it('gets visual viewport size', () => {
        const win: any = {
            visualViewport: {
                width: 10,
                height: 20,
                scale: 2,
            },
        };
        expect(getVisualViewportSize(win)).to.be.deep.eq([10, 20, 2]);
    });
});
