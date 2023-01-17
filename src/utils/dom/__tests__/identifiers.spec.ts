import * as chai from 'chai';
import sinon from 'sinon';
import * as hashUtils from 'src/utils/fnv32a';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import {
    CONTENT,
    DEFAULT_SIZE_LIMIT,
    getData,
    HREF,
    ID,
    NAME,
    PATH,
    GETTERS_MAP as getters,
} from '../identifiers';

describe('ClickTracking', () => {
    const sandbox = sinon.createSandbox();
    const { window } = new JSDOMWrapper();
    const { document } = window;
    const ELEM_PATH = 'F';
    const ELEM_ID = 'elemId';
    const ELEM_NAME = 'elemName';
    const ELEM_HREF = 'elemHref';
    const ELEM_TEXT = 'elemText';

    const ELEM_VALUE = 'elemValue';

    beforeEach(() => {
        sandbox.stub(getters, PATH).returns(ELEM_PATH);
        sandbox.stub(hashUtils, 'fnv32a').callsFake((value) => value);
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('getData', () => {
        const element = document.createElement('BUTTON');
        element.textContent = ELEM_TEXT;
        element.setAttribute('id', ELEM_ID);
        element.setAttribute('name', ELEM_NAME);
        element.setAttribute('href', ELEM_HREF);

        chai.expect(getData(window, element, [ID, NAME, PATH])).to.deep.eq({
            [ID]: ELEM_ID,
            [NAME]: ELEM_NAME,
            [PATH]: ELEM_PATH,
        });

        chai.expect(
            getData(window, element, [ID, NAME, PATH, HREF, CONTENT]),
        ).to.deep.eq({
            [ID]: ELEM_ID,
            [NAME]: ELEM_NAME,
            [PATH]: ELEM_PATH,
            [HREF]: ELEM_HREF,
            [CONTENT]: ELEM_TEXT,
        });

        const bigContentElement = {
            tagName: 'BUTTON',
            textContent: 'a'.repeat(200),
        } as any as HTMLFormElement;

        chai.expect(getData(window, bigContentElement, [CONTENT])).to.deep.eq({
            [CONTENT]: 'a'.repeat(DEFAULT_SIZE_LIMIT),
        });

        const inputElement = document.createElement('INPUT');
        inputElement.setAttribute('value', ELEM_VALUE);

        chai.expect(getData(window, inputElement, [CONTENT])).to.deep.eq({
            [CONTENT]: ELEM_VALUE,
        });

        const nullIdentifierElement = document.createElement('BUTTON');

        chai.expect(
            getData(window, nullIdentifierElement, [CONTENT]),
        ).to.deep.eq({});
    });
});
