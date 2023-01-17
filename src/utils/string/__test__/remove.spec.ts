import * as chai from 'chai';
import { removeNonDigits, removeSpaces } from '../remove';

describe('string remove utils behave as expected', () => {
    it('removeSpaces', () => {
        chai.expect(removeSpaces('+8 (777) 666-55-44')).to.equal(
            '+8(777)666-55-44',
        );
    });

    it('removeNonDigits', () => {
        chai.expect(removeNonDigits('+8 (777) 666-55-44')).to.equal(
            '87776665544',
        );
    });
});
