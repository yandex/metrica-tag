import { expect } from 'chai';
import { arrayMerge } from '../merge';

describe('arrayMerge', () => {
    it('mutate first array to second', () => {
        const first: any[] = [];
        const second = [1, 2, 3];
        const result = arrayMerge(first, second);
        expect(result).to.be.eq(first);
        expect(first).to.be.deep.eq(second);
    });
});
