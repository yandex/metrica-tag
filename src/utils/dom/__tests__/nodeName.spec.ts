import { expect } from 'chai';
import { getNodeName } from '../dom';

describe('it gets node name', () => {
    it('works for empty node', () => {
        const result = getNodeName(null as any);
        expect(result).to.be.eq(undefined);
    });

    it('works for non empty node', () => {
        let node: any = {
            tagName: '1',
        };
        let result = getNodeName(node as any);
        expect(result).to.be.eq('1');

        node = {
            nodeName: '1',
        };
        result = getNodeName(node as any);
        expect(result).to.be.eq('1');

        node = {};
        result = getNodeName(node as any);
        expect(result).to.be.eq(undefined);
    });

    it('works with non string values', () => {
        const node = {
            nodeName: {},
            tagName: '1',
        };
        const result = getNodeName(node as any);
        expect(result).to.be.eq('1');
    });
});
