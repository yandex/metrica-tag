import { getElementPath, getElementCSSSelector } from 'src/utils/dom';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import chai from 'chai';

describe('Element', () => {
    describe('getElementPath', () => {
        const { window } = new JSDOMWrapper(`<span id="ignored"></span>
            <span>
                <div>
                    <b id="id">Hello!</b>
                </div>
            </span>`);

        it('get path', () => {
            const el = window.document.querySelector('#id') as HTMLElement;

            chai.expect(getElementPath(window, el)).eq('<AW1');
        });

        it('ignore element', () => {
            const el = window.document.querySelector('#id') as HTMLElement;
            const ignored = window.document.querySelector(
                '#ignored',
            ) as HTMLElement;

            chai.expect(getElementPath(window, el, ignored)).eq('<AW');
        });
    });

    describe('getElementCSSSelector', () => {
        it('returns null if it is impossible to get unique selector', () => {
            const { window } = new JSDOMWrapper(`
                <div>
                    <div class="non-unique">
                    </div>
                    <div class="non-unique">
                    </div>
                </div>
            `);

            const element = window.document.querySelector(
                '.non-unique',
            ) as HTMLElement;
            const result = getElementCSSSelector(window, element);
            chai.expect(result).to.be.null;
        });

        it('returns unique multi-component selector with id', () => {
            const { window } = new JSDOMWrapper(`
                <div>
                    <div id="unique">
                        <div class="non-unique"></div>
                    </div>
                    <div class="non-unique">
                    </div>
                </div>
            `);
            const element = window.document.querySelector(
                '#unique .non-unique',
            ) as HTMLElement;
            const result = getElementCSSSelector(window, element);
            chai.expect(result).to.equal('#unique .non-unique');
        });
    });
});
