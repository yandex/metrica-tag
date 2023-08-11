import * as chai from 'chai';
import { binaryInsertion, binarySearch } from '../binarySearch';

const targetNumber = 3;
const simpleCallback = (el: number) => el - targetNumber;

describe('bindary search', () => {
    it('returns -1 if element is not found', () => {
        let array: number[] = [];
        chai.expect(binarySearch(array, simpleCallback)).to.equal(-1);

        array = [2, 4, 5, 6];
        chai.expect(binarySearch(array, simpleCallback)).to.equal(-1);
    });
    it('returns index of found element', () => {
        let array: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
        chai.expect(binarySearch(array, simpleCallback)).to.equal(2);

        array = [-3, -2, -1, 0, 1, 2, 3];
        chai.expect(binarySearch(array, simpleCallback)).to.equal(6);
    });
});

describe('binary insertion', () => {
    it("Inserts element into it's correct position", () => {
        let array: number[] = [];
        binaryInsertion(array, simpleCallback, targetNumber);
        chai.expect(array).to.deep.equal([3]);

        array = [1, 2, 4];
        binaryInsertion(array, simpleCallback, targetNumber);
        chai.expect(array).to.deep.equal([1, 2, 3, 4]);

        array = [1, 2, 3, 4];
        binaryInsertion(array, simpleCallback, targetNumber);
        chai.expect(array).to.deep.equal([1, 2, 3, 3, 4]);

        array = [1, 2];
        binaryInsertion(array, simpleCallback, targetNumber);
        chai.expect(array).to.deep.equal([1, 2, 3]);

        array = [4, 5, 6];
        binaryInsertion(array, simpleCallback, targetNumber);
        chai.expect(array).to.deep.equal([3, 4, 5, 6]);
    });
});
