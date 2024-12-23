import * as chai from 'chai';
import { getRandom, RND_MAX } from '../random';

describe('number util', () => {
    const rnd = 0.42;
    const win = {
        Math: {
            random: () => {
                return rnd;
            },
            floor: Math.floor.bind(Math),
            round: Math.round.bind(Math),
        },
    } as any as Window;

    it('random', () => {
        const n = getRandom(win);
        chai.expect(n).to.be.a('number');
        chai.expect(n).to.be.equal(Math.floor(RND_MAX * rnd));
        const max = 100;
        const min = 90;
        const n2 = getRandom(win, max);
        chai.expect(n2).to.be.equal(Math.floor(max * rnd));
        const n3 = getRandom(win, min, max);
        chai.expect(n3).to.be.equal(Math.floor(rnd * (max - min)) + min);
    });
});
