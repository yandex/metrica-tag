import {
    memo,
    pipe,
    notFn,
    bindArg,
    bind,
    isNativeFunction,
    bindThisForMethodTest,
} from 'src/utils/function';
import { isString } from 'src/utils/string';
import {
    arrayJoin,
    cEvery,
    cMap,
    cReduce,
    cSome,
    includes,
    indexOfWin,
} from 'src/utils/array';
import { ctxPath, getPath, isUndefined } from 'src/utils/object';
import { isFF, isFFVersionRegExp } from 'src/utils/browser/firefox';
import { MIN_EDGE_VERSION, MIN_FIREFOX_VERSION } from 'src/utils/browser/const';
import { checkUserAgent, getAppleUAProps, getAgent } from './utils';
import { parseDecimalInt } from '../number';

export const isWebKit = memo(bindArg(/webkit/, checkUserAgent));
export const isBrokenFromCharCode = memo(
    pipe(
        ctxPath('String.fromCharCode'),
        bindArg('fromCharCode', isNativeFunction),
        notFn,
    ),
);

export const isIOS = memo(
    pipe(getAgent, bindThisForMethodTest(/ipad|iphone|ipod/i)),
);

export const getPlatform = memo((ctx: Window) => {
    return getPath(ctx, 'navigator.platform') || '';
});

export const isSafari = memo((ctx: Window) => {
    const { isApple, userAgentInfo } = getAppleUAProps(ctx);
    return isApple && !userAgentInfo.match('CriOS');
});

const androidUa = bindThisForMethodTest(
    /Android.*Version\/[0-9][0-9.]*\sChrome\/[0-9][0-9.]|Android.*Version\/[0-9][0-9.]*\s(?:Mobile\s)?Safari\/[0-9][0-9.]*\sChrome\/[0-9][0-9.]*|; wv\).*Chrome\/[0-9][0-9.]*\sMobile/,
);
const newWebView = bindThisForMethodTest(/; wv\)/);
export const isAndroidWebView = memo((ctx: Window) => {
    const userAgent = getAgent(ctx);
    return newWebView(userAgent) || androidUa(userAgent);
});

export const SameSiteRegexp = /Chrome\/(\d+)\./;
export const isSameSiteBrowser = memo((ctx: Window): boolean => {
    const userAgent = getPath(ctx, 'navigator.userAgent') || '';
    const match = userAgent.match(SameSiteRegexp);
    if (match && match.length) {
        const version = parseDecimalInt(match[1]);
        return version >= 76;
    }
    return false;
});

export const isAndroid = memo((ctx: Window) => {
    const userAgent = (getAgent(ctx) || '').toLowerCase();
    const platform = getPlatform(ctx);

    return Boolean(
        userAgent.indexOf('android') !== -1 &&
            userAgent.indexOf(userAgent, 'mobile') !== -1 &&
            /^android|linux armv/i.test(platform),
    );
});

export const NET_MAP = [
    'other',
    'none',
    'unknown',
    'wifi',
    'ethernet',
    'bluetooth',
    'cellular',
    'wimax',
    'mixed',
];
export const netType = memo((ctx: Window): string | null => {
    const connectionType: string | null = getPath(
        ctx,
        'navigator.connection.type',
    );
    if (isUndefined(connectionType)) {
        return null;
    }
    const index = indexOfWin(ctx)(connectionType, NET_MAP);
    return index === -1 ? connectionType : `${index}`;
});

export const isIE = memo(pipe(ctxPath('document.addEventListener'), notFn));

export const getNavigatorLanguage = memo((ctx: Window) => {
    const nav = getPath(ctx, 'navigator') || {};
    return cReduce(
        (accum: string, field: string) => {
            return accum || getPath(nav, field);
        },
        '',
        ['language', 'userLanguage', 'browserLanguage', 'systemLanguage'],
    );
});

export const getLanguage = memo((ctx: Window) => {
    const nav = getPath(ctx, 'navigator') || {};
    let result = getNavigatorLanguage(ctx);
    if (!isString(result)) {
        result = '';
        const tempResult = getPath(nav, 'languages.0');
        if (isString(tempResult)) {
            result = tempResult;
        }
    }

    return result.toLowerCase().split('-')[0];
});

export const isIframe = memo((ctx: Window) => {
    let out = false;
    try {
        out = ctx.top !== ctx;
    } catch (e) {
        // empty
    }
    return out;
});

export const isTopWindowAccessible = memo((ctx: Window): boolean => {
    let out = false;
    try {
        out = (ctx.top as any).contentWindow;
    } catch (e) {
        // empty
    }
    return out;
});

export const getJavaEnabled = memo((ctx: Window): boolean => {
    let out = false;
    try {
        out = ctx.navigator.javaEnabled();
    } catch (e) {
        // empty
    }
    return out;
});

export const isSelenium = memo((ctx: Window) => {
    const winProps = ['_selenium', 'callSelenium', '_Selenium_IDE_Recorder'];
    const docProps = [
        '__webdriver_evaluate',
        '__selenium_evaluate',
        '__webdriver_script_function',
        '__webdriver_script_func',
        '__webdriver_script_fn',
        '__fxdriver_evaluate',
        '__driver_unwrapped',
        '__webdriver_unwrapped',
        '__driver_evaluate',
        '__selenium_unwrapped',
        '__fxdriver_unwrapped',
    ];
    const external = getPath(ctx, 'external');
    const externalStr = getPath(external, 'toString')
        ? `${external.toString()}` // toString может вернуть undefined
        : '';
    const isSequentum = externalStr.indexOf('Sequentum') !== -1;
    const documentElement = getPath(ctx, 'document.documentElement');
    const docElemProps = ['selenium', 'webdriver', 'driver'];

    return !!(
        cSome(bindArg(ctx, getPath), winProps) ||
        cSome(bindArg(getPath(ctx, 'document'), getPath), docProps) ||
        isSequentum ||
        (documentElement &&
            cSome(
                bind(documentElement.getAttribute, documentElement),
                docElemProps,
            ))
    );
});

export const isHeadLess = memo(
    (ctx: Window) =>
        !!(
            cSome(bindArg(ctx, getPath), [
                '_phantom',
                '__nightmare',
                'callPhantom',
            ]) ||
            /(PhantomJS)|(HeadlessChrome)/.test(getAgent(ctx)) ||
            getPath(ctx, 'navigator.webdriver') ||
            (getPath(ctx, 'isChrome') && !getPath(ctx, 'chrome'))
        ),
);

export const isFacebookInstantArticles = memo((ctx: Window) =>
    cEvery(bindArg(ctx, getPath), [
        'ia_document.shareURL',
        'ia_document.referrer',
    ]),
);

export const isNotificationAllowed = (ctx: Window) => {
    const permission = getPath(ctx, 'Notification.permission');
    switch (permission) {
        case 'denied':
            return false;
        case 'granted':
            return true;
        default:
            return null;
    }
};

export const isPrerender = (ctx: Window) =>
    includes(
        'prerender',
        cMap(bindArg(getPath(ctx, 'document'), getPath), [
            'webkitVisibilityState',
            'visibilityState',
        ]),
    );

const botRegExp = new RegExp(
    arrayJoin('|', [
        'yandex.com/bots',
        'Googlebot',
        'APIs-Google',
        'Mediapartners-Google',
        'AdsBot-Google',
        'FeedFetcher-Google',
        'Google-Read-Aloud',
        'DuplexWeb-Google',
        'Google Favicon',
        'googleweblight',
        'Chrome-Lighthouse',
        'Mail.RU_Bot',
        'StackRambler',
        'Slurp',
        'msnbot',
        'bingbot',
        'www.baidu.com/search/spi_?der.htm',
    ]).replace(/[./]/g, '\\$&'),
);

export const isSearchRobot = memo(
    pipe(ctxPath('navigator.userAgent'), bindThisForMethodTest(botRegExp)),
);

export const isITP = memo((ctx: Window) => {
    const agent = getAgent(ctx) || '';
    const macOSmatch = agent.match(/Mac OS X ([0-9]+)_([0-9]+)/);
    const version = macOSmatch ? [+macOSmatch[1], +macOSmatch[2]] : [0, 0];
    const isIOSmatch = agent.match(/iPhone OS ([1-9]+)_([0-9]+)/);
    const isOSVersion = isIOSmatch ? +isIOSmatch[1] : 0;

    if (isOSVersion >= 14) {
        return true;
    }
    return (
        (isIOS(ctx) ||
            version[0] > 10 ||
            (version[0] === 10 && version[1] >= 13)) &&
        isSafari(ctx)
    );
});

const edgeReg = /Edg\/(\d+)\./;

export const isEdgeMinVersion = (ctx: Window, minVersion: number) => {
    const agent = getAgent(ctx);
    if (agent) {
        const versionList = agent.match(edgeReg);
        if (versionList && versionList.length > 1) {
            const no = parseDecimalInt(versionList[1]);
            return no >= minVersion;
        }
    }
    return false;
};

export const isFFVersion = (ctx: Window, minVersion: number) => {
    if (isFF(ctx) && minVersion) {
        const agent = getAgent(ctx);
        const version = agent.match(isFFVersionRegExp);
        if (version && version.length) {
            return +version[1] >= minVersion;
        }
    }
    return false;
};

// All tracking protection browsers: intillectual TP, enhanced TP, etc
export const isTP = memo((ctx: Window) => {
    return (
        isITP(ctx) ||
        isFFVersion(ctx, MIN_FIREFOX_VERSION) ||
        isEdgeMinVersion(ctx, MIN_EDGE_VERSION)
    );
});

/*
    window.orientation есть только в мобильных браузерах
    https://caniuse.com/?search=window.orientation
 */
export const isMobile = (ctx: Window) =>
    isIOS(ctx) ||
    isAndroid(ctx) ||
    /mobile/i.test(getAgent(ctx)) ||
    !isUndefined(getPath(ctx, 'orientation'));
