import sinon from 'sinon';
import {
    BUTTON_SELECTOR,
    closestButton,
    MAYBE_BUTTON_SELECTOR,
} from 'src/utils/dom/button';
import * as closestUtils from 'src/utils/dom/closest';
import * as selectUtils from 'src/utils/dom/select';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import chai from 'chai';

describe('dom utils - button', () => {
    const sandbox = sinon.createSandbox();
    const { window } = new JSDOMWrapper();
    const { document } = window;

    beforeEach(() => {});

    afterEach(() => {
        sandbox.restore();
    });

    it('exact button', () => {
        const target = document.createElement('button');

        sandbox
            .stub(closestUtils, 'closest')
            .withArgs(BUTTON_SELECTOR, window, target)
            .returns(target);

        chai.expect(closestButton(window, target)).to.eq(target);
    });

    it('maybe button', () => {
        const target = document.createElement('button');
        const div = document.createElement('div');

        sandbox
            .stub(closestUtils, 'closest')
            .withArgs(BUTTON_SELECTOR, window, target)
            .returns(null)
            .withArgs(MAYBE_BUTTON_SELECTOR, window, target)
            .returns(div);
        sandbox.stub(selectUtils, 'select').returns([]);

        chai.expect(closestButton(window, target)).to.eq(div);
    });

    it('invalid maybe button', () => {
        const target = document.createElement('span');
        const div = document.createElement('div');
        const childDiv = document.createElement('div');

        sandbox
            .stub(closestUtils, 'closest')
            .withArgs(BUTTON_SELECTOR, window, target)
            .returns(null)
            .withArgs(MAYBE_BUTTON_SELECTOR, window, target)
            .returns(div);
        sandbox.stub(selectUtils, 'select').returns([childDiv]);

        chai.expect(closestButton(window, target)).to.eq(null);
    });
});
