import * as chai from 'chai';
import { AsyncMapFn, getAsync, setAsync } from '../AsyncMap';

describe('AsyncMap', () => {
    const defaultValues: Record<string, number> = {
        a: 1,
        b: 2,
        c: 3,
    };
    const keys = ['a', 'b', 'c'];
    let storage = AsyncMapFn<number>();

    beforeEach(() => {
        storage = AsyncMapFn<number>();
    });

    it('Instantiates with params', async () => {
        for (let i = 0; i < keys.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            storage(setAsync(keys[i], defaultValues[keys[i]]));
        }

        for (let i = 0; i < keys.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const result = await storage(getAsync(keys[i]));
            chai.expect(result).to.equal(i + 1);
        }
    });

    it('Sets and then gets', async () => {
        const storageSet = AsyncMapFn<string>();
        storageSet(setAsync('10', 'settings'));
        const result = await storageSet(getAsync('10'));
        chai.expect(result).to.equal('settings');
    });

    it('Gets and then sets', async () => {
        const storageGet = AsyncMapFn<string>();
        storageGet(setAsync('10', 'settings'));
        const result = await storageGet(getAsync('10'));
        chai.expect(result).to.equal('settings');
    });
});
