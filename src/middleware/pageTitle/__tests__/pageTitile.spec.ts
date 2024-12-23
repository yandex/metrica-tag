import * as chai from 'chai';
import { TITLE_BR_KEY } from 'src/api/watch';
import { mix } from 'src/utils/object';
import { CounterOptions } from 'src/utils/counterOptions';
import { browserInfo } from 'src/utils/browserInfo/browserInfo';
import { pageTitle } from '../pageTitle';

const titleMock = (title: string, setTitle = false) => {
    const out = {
        document: {
            getElementsByTagName: (name: string) => {
                if (name !== 'title') {
                    return [];
                }
                return [
                    {
                        innerHtml: title,
                    },
                ];
            },
        },
    } as unknown as Window;
    if (setTitle) {
        out.document.title = title;
    }
    return out;
};
describe('pageTitle', () => {
    const win = (title: string) => {
        const out = {};
        mix(out, titleMock(title));
        return out as unknown as Window;
    };
    const testTitle = 'testTitle';
    const counterOpt: CounterOptions = {
        id: 2,
        counterType: '0',
        sendTitle: true,
    };
    it('skip empty brInfo', (done) => {
        const winInfo = win(testTitle);
        const middleware = pageTitle(winInfo, counterOpt);
        if (middleware.beforeRequest) {
            middleware.beforeRequest({}, done);
        }
    });
    it('set title form opt', () => {
        const winInfo = win('');
        const brInfo = browserInfo();
        const middleware = pageTitle(winInfo, counterOpt);
        if (middleware.beforeRequest) {
            middleware.beforeRequest(
                {
                    brInfo,
                    middlewareInfo: {
                        title: testTitle,
                    },
                },
                () => {
                    chai.expect(brInfo.getVal(TITLE_BR_KEY)).to.be.equal(
                        testTitle,
                    );
                },
            );
        }
    });
    it('skip empty title', () => {
        const winInfo = win('');
        const brInfo = browserInfo();
        const middleware = pageTitle(winInfo, counterOpt);
        if (middleware.beforeRequest) {
            middleware.beforeRequest(
                {
                    brInfo,
                },
                () => {
                    chai.expect(brInfo.getVal(TITLE_BR_KEY)).to.be.equal('');
                },
            );
        }
    });
    it('get title from page', () => {
        const winInfo = win(testTitle);
        const brInfo = browserInfo();
        const middleware = pageTitle(winInfo, counterOpt);
        if (middleware.beforeRequest) {
            middleware.beforeRequest(
                {
                    brInfo,
                },
                () => {
                    chai.expect(brInfo.getVal(TITLE_BR_KEY)).to.be.equal(
                        testTitle,
                    );
                },
            );
        }
    });
    it('set empty title with false sendTitle param', () => {
        const winInfo = {} as unknown as Window;
        const brInfo = browserInfo();
        const opts: CounterOptions = {
            id: 2,
            counterType: '0',
            sendTitle: false,
        };

        const middleware = pageTitle(winInfo, opts);
        if (middleware.beforeRequest) {
            middleware.beforeRequest(
                {
                    brInfo,
                },
                () => {
                    chai.expect(brInfo.getVal(TITLE_BR_KEY)).to.be.undefined;
                },
            );
        }
    });
});
