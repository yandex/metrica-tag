import * as chai from 'chai';
import { isYandexDomain } from '../location';

describe('Location', () => {
    it('isYandexDomain', () => {
        ['yandex.ru', '123.yandex.ru'].forEach((hostname) => {
            const ctx = {
                location: { hostname },
            } as Window;
            chai.expect(isYandexDomain(ctx)).to.be.true;
        });
    });
});
