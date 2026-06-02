import sinon from 'sinon';
import chai from 'chai';
import { getAllNodes } from 'src/utils/treeWalker';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';

describe('treeWalker - getAllNodes', () => {
    const sandbox = sinon.createSandbox();
    const { window } = new JSDOMWrapper();
    const { document } = window;

    afterEach(() => {
        sandbox.restore();
    });

    it('skips root when contains throws (root is not a real Node)', () => {
        const root = document.createElement('div');
        const child = document.createElement('span');
        root.appendChild(child);

        sandbox
            .stub(document.documentElement, 'contains')
            .throws(
                new TypeError(
                    'Node.contains: Argument 1 does not implement interface Node.',
                ),
            );

        const result = getAllNodes(window, root);

        chai.expect(result).to.have.length(0);
    });

    it('uses walkTree when the node is in the document', () => {
        const root = document.createElement('div');
        const child = document.createElement('span');
        root.appendChild(child);
        document.body.appendChild(root);

        const result = getAllNodes(window, root);

        chai.expect(result).to.have.length(2);
        chai.expect(result[0]).to.eq(root);
        chai.expect(result[1]).to.eq(child);

        document.body.removeChild(root);
    });

    it('falls back to manual traversal when documentElement is null', () => {
        const root = document.createElement('div');
        const child = document.createElement('span');
        root.appendChild(child);

        sandbox
            .stub(document, 'documentElement')
            .value(null as unknown as HTMLElement);

        const result = getAllNodes(window, root);

        chai.expect(result).to.have.length(2);
        chai.expect(result[0]).to.eq(root);
        chai.expect(result[1]).to.eq(child);
    });

    it('returns an empty array when root is not a Node', () => {
        chai.expect(getAllNodes(window, {} as unknown as Node)).to.have.length(
            0,
        );
        chai.expect(
            getAllNodes(window, 'str' as unknown as Node),
        ).to.have.length(0);
    });
});
