import * as chai from 'chai';
import { WATCH_REFERER_PARAM, WATCH_URL_PARAM } from 'src/api/watch';
import { isFalseURL } from 'src/middleware/watchSyncFlags/brinfoFlags/falseUrl';
import type { CounterOptions } from 'src/utils/counterOptions';

describe('falseUrl', () => {
    const counterOptions: CounterOptions = {
        id: 1,
        counterType: '0',
    };
    const domReferer = 'domReferer/';
    const domURL = 'domURL';
    const senderReferer = 'senderRefer';
    const senderUrl = 'senderUrl/';
    const win = () => {
        return {
            document: {
                referrer: domReferer,
            },
            location: {
                href: domURL,
            },
        } as any as Window;
    };
    it('send null status', () => {
        const winInfo = win();
        const status = isFalseURL(winInfo, counterOptions, {});
        chai.expect(status).to.be.equal(null);
    });
    it('send 0 status', () => {
        const winInfo = win();
        const status = isFalseURL(winInfo, counterOptions, {
            urlParams: {
                [WATCH_REFERER_PARAM]: domReferer,
                [WATCH_URL_PARAM]: domURL,
            },
        });
        chai.expect(status).to.be.equal(0);
    });
    it('send 1 status', () => {
        const winInfo = win();
        const status = isFalseURL(winInfo, counterOptions, {
            urlParams: {
                [WATCH_REFERER_PARAM]: senderReferer,
                [WATCH_URL_PARAM]: `${domURL}`,
            },
        });
        chai.expect(status).to.be.equal(1);
    });
    it('send 2 status', () => {
        const winInfo = win();
        const status = isFalseURL(winInfo, counterOptions, {
            urlParams: {
                [WATCH_REFERER_PARAM]: domReferer.slice(0, -1),
                [WATCH_URL_PARAM]: senderUrl,
            },
        });
        chai.expect(status).to.be.equal(2);
    });
    it('send 3 status', () => {
        const winInfo = win();
        const status = isFalseURL(winInfo, counterOptions, {
            urlParams: {
                [WATCH_REFERER_PARAM]: senderReferer,
                [WATCH_URL_PARAM]: senderUrl,
            },
        });
        chai.expect(status).to.be.equal(3);
    });
});
