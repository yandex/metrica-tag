/* eslint-env mocha */
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import * as chai from 'chai';
import { localStorage } from '../localStorage';

describe('LocalStorage', () => {
    const { window } = new JSDOMWrapper(undefined, {
        url: 'https://example.com',
    });
    let storage: any;
    const name = 'test';
    const val = { foo: [1, 3, 4, 5] };

    beforeEach(() => {
        window.localStorage.removeItem(name);
        storage = localStorage(window);
    });
    it('should write storage', () => {
        storage.setVal(name, val);
        chai.expect(storage.getVal(name)).to.be.deep.equal(val);
        storage.delVal(name);
        chai.expect(storage.getVal(name)).to.be.not.ok;
    });
    it('should work with other prefix', () => {
        const st = localStorage(window, '', '_a_');
        st.setVal(name, val);
        chai.expect(st.getVal(name)).to.be.deep.equal(val);
        st.delVal(name);
        chai.expect(st.getVal(name)).to.be.not.ok;
    });
    it('should work without storage', () => {
        const badName = `bad${name}`;
        const badStore = localStorage(
            Object.create(
                {
                    JSON: window.JSON as any,
                },
                {
                    localStorage: {
                        get: () => {
                            throw new Error('1');
                        },
                    },
                },
            ) as any as Window,
        );
        badStore.setVal(badName, val);
        chai.expect(badStore.getVal(badName)).to.be.not.ok;
        badStore.delVal(badName);
        chai.expect(badStore.getVal(badName)).to.be.not.ok;
    });
});
