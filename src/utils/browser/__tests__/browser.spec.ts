import * as chai from 'chai';
import * as sinon from 'sinon';
import { mix } from 'src/utils/object';
import {
    isMobile,
    isSearchRobot,
    isFacebookInstantArticles,
    isSameSiteBrowser,
    isHeadLess,
    isNotificationAllowed,
    isSelenium,
    getLanguage,
    netType,
    NET_MAP,
    isFF,
    isIE as isIEFn,
    getNavigatorLanguage,
    isAndroid,
    getPlatform,
    isGecko,
    isWebKit,
    isPrerender,
    isITP,
    isIOS,
    isAndroidWebView,
} from '..';

describe('browser Utils', () => {
    const win = (obj: any = {}) => {
        return mix({}, obj) as any as Window;
    };
    const ffWin = (isPrivateMode = false) =>
        ({
            navigator: {
                userAgent: 'Firefox/123',
                serviceWorker: !isPrivateMode || undefined,
            },
            document: {
                documentElement: {
                    style: {
                        MozAppearance: true,
                    },
                },
            },
            InstallTrigger: true,
        } as any);
    const androidWin = () =>
        ({
            navigator: {
                userAgent: 'android mobile',
                platform: 'android',
            },
        } as any);
    const webkitWin = () =>
        ({
            navigator: {
                userAgent: 'WebKit',
            },
        } as any);
    const geckoWin = () =>
        ({
            navigator: {
                userAgent: 'Gecko',
            },
        } as any);

    it('check sameSite browser', () => {
        const result = isSameSiteBrowser({} as any);
        chai.expect(result, 'not same site browser').to.be.false;
        const trueResult = isSameSiteBrowser({
            navigator: {
                userAgent:
                    'Mozilla/5.0 (Linux; Android 8.1.0; DUA-L22) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36',
            },
        } as any);
        chai.expect(trueResult, 'sameSite browser').to.be.true;
    });

    it('should detect old ie', () => {
        const isIE = isIEFn(win());
        chai.expect(isIE).to.be.ok;
    });
    it('should get lang', () => {
        const testLang = 'myTestLang';
        const langWin = {
            navigator: Object.create(
                {
                    userLanguage: testLang,
                },
                {
                    language: {
                        get() {
                            throw new Error('bad property!');
                        },
                    },
                },
            ),
        } as any;
        const result = getNavigatorLanguage(langWin);
        chai.expect(result).to.be.eq(testLang);
    });
    it('should get lang', () => {
        const langWin = {
            navigator: Object.create(
                {
                    ...[
                        'language',
                        'userLanguage',
                        'browserLanguage',
                        'systemLanguage',
                    ].reduce(
                        (acc, key) => ({
                            ...acc,
                            [key]: 1,
                        }),
                        {},
                    ),
                },
                {
                    languages: {
                        get() {
                            throw new Error('bad property!');
                        },
                    },
                },
            ),
        } as any;
        const result = getLanguage(langWin);
        chai.expect(result).to.be.eq('');
    });
    it('should detect new browsers', () => {
        const isIE = isIEFn({
            document: {
                addEventListener: true,
            },
        });
        chai.expect(isIE).to.be.not.ok;
    });
    it('gets custom net type', () => {
        const testType = 'TestType';
        const type = netType(
            win({
                Array,
                navigator: {
                    connection: {
                        type: testType,
                    },
                },
            }),
        );
        chai.expect(type).to.be.equal(testType);
    });
    it('gets net type', () => {
        const testType = 'none';
        const type = netType(
            win({
                Array,
                navigator: {
                    connection: {
                        type: testType,
                    },
                },
            }),
        );
        chai.expect(type).to.be.equal(`${NET_MAP.indexOf(testType)}`);
    });
    it('gets null net type', () => {
        const type = netType(win());
        chai.expect(type).to.be.equal(null);
    });
    it('gets some lang from browser', () => {
        const [one, two] = 'one,two'.split(',');
        const lang = getLanguage(
            win({
                navigator: {
                    userLanguage: one,
                    browserLanguage: two,
                },
            }),
        );
        chai.expect(lang).to.be.equal(one);
    });
    it('gets empty langs from browser', () => {
        const lang = getLanguage(win());
        chai.expect(lang).to.be.equal('');
    });

    const createDetectTest = (
        checkFn: (ctx: any) => boolean,
        winConstruct: () => any,
    ) => {
        const detect = checkFn(winConstruct());
        chai.expect(detect).to.be.true;

        const noDetect = checkFn({} as any);
        chai.expect(noDetect).to.be.false;
    };
    it('should detect ff', () => {
        createDetectTest(isFF, ffWin);
    });

    it('should detect Android', () => {
        createDetectTest(isAndroid, androidWin);
    });

    it('should detect WebKit', () => {
        createDetectTest(isWebKit, webkitWin);
    });

    it('should detect Gecko', () => {
        createDetectTest(isGecko, geckoWin);
    });
    it('checks isSelenium', () => {
        const getAttribute = sinon.fake.returns(true);
        chai.expect(isSelenium({} as any)).to.be.false;
        chai.expect(isSelenium({ callSelenium: true } as any)).to.be.true;
        const fieldName = '__webdriver_script_fn';
        chai.expect(isSelenium({ document: { [fieldName]: true } } as any)).to
            .be.true;
        chai.expect(isSelenium({ external: 'Sequentum1.1' } as any)).to.be.true;
        chai.expect(
            isSelenium({
                document: { documentElement: { getAttribute } },
            } as any),
        ).to.be.true;
        sinon.assert.called(getAttribute);
    });
    it('checks isHeadLess', () => {
        chai.expect(isHeadLess({} as any)).to.be.false;
        chai.expect(isHeadLess({ __nightmare: true } as any)).to.be.true;
        chai.expect(
            isHeadLess({ navigator: { userAgent: 'HeadlessChrome' } } as any),
        ).to.be.true;
        chai.expect(isHeadLess({ navigator: { webdriver: true } } as any)).to.be
            .true;
        chai.expect(isHeadLess({ isChrome: true } as any)).to.be.true;
        chai.expect(isHeadLess({ isChrome: true, chrome: true } as any)).to.be
            .false;
    });
    it('checks isFacebookInstantArticles', () => {
        chai.expect(isFacebookInstantArticles({} as any)).to.be.false;
        const fieldName = 'ia_document';
        chai.expect(
            isFacebookInstantArticles({
                [fieldName]: {
                    shareURL: true,
                },
            } as any),
        ).to.be.false;
        chai.expect(
            isFacebookInstantArticles({
                [fieldName]: {
                    shareURL: true,
                    referrer: true,
                },
            } as any),
        ).to.be.true;
    });
    it('checks isNotificationAllowed', () => {
        chai.expect(isNotificationAllowed({} as any)).to.be.null;
        chai.expect(
            isNotificationAllowed({
                Notification: { permission: 'denied' },
            } as any),
        ).to.be.false;
        chai.expect(
            isNotificationAllowed({
                Notification: { permission: 'granted' },
            } as any),
        ).to.be.true;
    });
    it('checks getPlatform', () => {
        const platform = 'MacIntel';
        const ctx = {
            navigator: {
                platform,
            },
        } as any;
        chai.expect(getPlatform({} as any)).to.be.equal('');
        chai.expect(getPlatform(ctx)).to.be.equal(platform);
    });
    it('checks isPrerender', () => {
        chai.expect(
            isPrerender({ document: { visibilityState: 'visible' } } as any),
        ).to.be.equal(false);
        chai.expect(
            isPrerender({
                document: { webkitVisibilityState: 'visible' },
            } as any),
        ).to.be.equal(false);
        chai.expect(
            isPrerender({ document: { visibilityState: 'prerender' } } as any),
        ).to.be.equal(true);
        chai.expect(
            isPrerender({
                document: { webkitVisibilityState: 'prerender' },
            } as any),
        ).to.be.equal(true);
    });
    it('checks detect bot', () => {
        chai.expect(
            isSearchRobot({
                navigator: {
                    userAgent:
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.101 Safari/537.36',
                },
            } as any),
        ).to.be.equal(false);

        const bots = [
            'AdsBot-Google (+http://www.google.com/adsbot.html)',
            'Googlebot-Video/1.0',
            'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
            'Mozilla/5.0 (compatible; Mail.RU_Bot/Fast/2.0)',
            'StackRambler/2.0 (MSIE incompatible)',
            'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
            'msnbot/1.1 (+http://search.msn.com/msnbot.htm)',
            'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm',
            'Baiduspider+(+http://www.baidu.com/search/spider.htm)',
            // Google crawlers (Googlebot Desktop, Googlebot Smartphone) from https://developers.google.com/search/docs/advanced/crawling/overview-google-crawlers
            'Mozilla/5.0 (Linux; Android 7.0; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4695.0 Mobile Safari/537.36 Chrome-Lighthouse',
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36',
            'Googlebot/2.1 (+http://www.google.com/bot.html)',
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        ];

        bots.map((bot) =>
            chai
                .expect(
                    isSearchRobot({ navigator: { userAgent: bot } } as Window),
                )
                .to.be.equal(true),
        );
    });
    it('check isITPSafari', () => {
        chai.expect(
            isITP(
                win({
                    navigator: {
                        userAgent: 'Mac OS X 10_11_12',
                        vendor: 'Apple',
                    },
                }),
            ),
            'should return false for versions before 10.13',
        ).to.be.false;
        chai.expect(
            isITP(
                win({
                    navigator: {
                        userAgent: 'Mac OS X 10_13_12',
                        vendor: 'Apple',
                    },
                }),
            ),
            'should return false for versions 10.13',
        ).to.be.true;
        chai.expect(
            isITP(
                win({
                    navigator: {
                        userAgent: 'Mac OS X 11_13_12',
                        vendor: 'Apple',
                    },
                }),
            ),
            'should return true for major versions > 10',
        ).to.be.true;
        chai.expect(
            isITP(
                win({
                    navigator: {
                        userAgent: 'iphone',
                        vendor: 'Apple',
                    },
                }),
            ),
            'should return true for iphone',
        ).to.be.true;
    });

    it('check isIOS', () => {
        chai.expect(
            isIOS(
                win({
                    navigator: {
                        userAgent: 'ipad',
                    },
                }),
            ),
            'should return true for ipad, iphone and ipod',
        ).to.be.true;
        chai.expect(
            isIOS(
                win({
                    navigator: {
                        userAgent: 'iphone',
                    },
                }),
            ),
            'should return true for ipad, iphone and ipod',
        ).to.be.true;
        chai.expect(
            isIOS(
                win({
                    navigator: {
                        userAgent: 'ipod',
                    },
                }),
            ),
            'should return true for ipad, iphone and ipod',
        ).to.be.true;
        chai.expect(
            isIOS(
                win({
                    navigator: {
                        userAgent: 'something else',
                    },
                }),
            ),
            'should return false if not ipad, iphone and ipod',
        ).to.be.false;
    });

    it('check isAndroidWebView', () => {
        const uaList = [
            'Mozilla/5.0 (Linux; Android 10; SM-N960F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0',
            'Mozilla/5.0 (Linux; Android 11; Redmi Note 8 Pro Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0',
            'Mozilla/5.0 (Linux; Android 10; MAR-LX1H Build/HUAWEIMAR-L21H; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0',
            'Android something Version/1.1.1 Chrome/11.1.1',
            'Android something Version/2.2. Mobile Safari/1 Chrome/12',
            'something; wv) Chrome/12 Mobile',
            'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 5 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 4.4; Nexus 5 Build/_BuildID_) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 5 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36',
        ];
        uaList.forEach((ua) => {
            const ctx = win({
                navigator: {
                    userAgent: ua,
                },
            });
            chai.assert(
                isAndroidWebView(ctx),
                `Is not android webView "${ua}"`,
            );
        });
        chai.expect(
            isAndroidWebView(
                win({
                    navigator: {
                        userAgent:
                            'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19',
                    },
                }),
            ),
            'should be able to return false',
        ).to.be.false;
    });
    it('check isMobile', () => {
        chai.expect(
            isMobile(
                win({
                    navigator: {
                        userAgent:
                            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
                    },
                }),
            ),
            'should return true for IOS',
        ).to.be.true;
        chai.expect(
            isMobile(
                win({
                    navigator: {
                        userAgent:
                            'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 5 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36',
                        platform: 'Android',
                    },
                }),
            ),
            'should return true for Android',
        ).to.be.true;
        chai.expect(
            isMobile(
                win({
                    orientation: 0,
                }),
            ),
            'should return true for device with orientation',
        ).to.be.true;
        chai.expect(isMobile(win({})), 'should return true for Desktop').to.be
            .false;
    });
});
