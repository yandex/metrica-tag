import { expect } from 'chai';
import { getNodeText } from 'src/utils/dom/nodeText';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';

describe('it gets node text', () => {
    const data = [
        {
            input: '<div>TEST_TEXT</div>',
            output: 'TEST_TEXT',
            title: 'Extract text from one node',
        },
        {
            input: '<img src="" alt="TEST_TEXT">',
            output: 'TEST_TEXT',
            title: 'Extract alt',
        },
        {
            input: '',
            output: '',
            title: 'Empty input',
        },
        {
            input: '<div><div><div><div><span>TEST_TEXT</span></div></div></div></div>',
            output: 'TEST_TEXT',
            title: 'Extract one text from node tree',
        },
        {
            input: '<div><div> TEST_TEXT<div><span>TEST_TEXT</span></div> TEST_TEXT</div>',
            output: 'TEST_TEXT TEST_TEXT TEST_TEXT',
            title: 'Extract 3 texts from node tree',
        },
        {
            input: '<section>TEST_TEXT<span>TEST_TEXT <img src="" alt="TEST_TEXT"></span></section>',
            output: 'TEST_TEXT TEST_TEXT TEST_TEXT',
            title: 'Extract from innerText and alt',
        },
    ];

    data.forEach(({ input, output, title = '' }) => {
        const { window } = new JSDOMWrapper();
        const { document } = window;
        const element = document.createElement('DIV');
        element.innerHTML = input;

        it(title, () => {
            const result = getNodeText(window, element);
            expect(result).to.be.eq(output);
        });
    });
});
