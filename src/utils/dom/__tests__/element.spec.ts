import { getElementPath } from 'src/utils/dom';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import chai from 'chai';

describe('Element', () => {
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
