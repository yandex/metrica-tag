import { memo } from 'src/utils/function/memo';
import { isString, stringIncludes, stringIndexOf } from 'src/utils/string';
import { indexOfWin } from 'src/utils/array/utils';
import { cMap } from 'src/utils/array/map';
import { includes } from 'src/utils/array/includes';
import { cSome } from 'src/utils/array/some';
import { cReduce } from 'src/utils/array/reduce';
import { ctxPath, getPath, isUndefined } from 'src/utils/object';
import { isFF, isFFVersionRegExp } from 'src/utils/browser/firefox';
import { MIN_EDGE_VERSION, MIN_FIREFOX_VERSION } from 'src/utils/browser/const';
import {
    bind,
    bindArg,
    bindThisForMethodTest,
} from 'src/utils/function/bind/bind';
import { pipe } from 'src/utils/function/pipe';
import { isNativeFunction } from 'src/utils/function/isNativeFunction/isNativeFunction';
import { notFn } from 'src/utils/function/identity';
import { parseDecimalInt } from '../number/number';
import { checkUserAgent, getAppleUAProps, getAgent } from './utils';

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

    return (
        stringIncludes(userAgent, 'android') &&
        stringIncludes(userAgent, 'mobile')
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

export const isIE: (ctx: Window) => boolean = memo(
    pipe(ctxPath('document.addEventListener'), notFn),
);

export const getNavigatorLanguage = memo((ctx: Window) => {
    const nav = getPath(ctx, 'navigator') || {};
    return cReduce(
        (accum: string | null, field: string) => {
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
    const top = getPath(ctx, 'top') || ctx;
    return top !== ctx;
});

export const isTopWindowAccessible: (ctx: Window) => Window | null = memo(
    ctxPath('top.contentWindow'),
);

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
    const external = getPath(ctx, 'external')!;
    /* eslint-disable no-restricted-properties */
    const externalStr = getPath(external, 'toString')
        ? `${external.toString()}` // toString может вернуть undefined
        : '';
    /* eslint-enable no-restricted-properties */
    const isSequentum = stringIndexOf(externalStr, 'Sequentum') !== -1;
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

export const isFacebookInstantArticles = memo(
    (ctx: Window) =>
        !!(
            getPath(ctx, 'ia_document.shareURL') &&
            getPath(ctx, 'ia_document.referrer')
        ),
);

export const isNotificationAllowed = (ctx: Window) => {
    const permission = getPath(ctx, 'Notification.permission');
    if (permission === 'denied') {
        return false;
    }
    if (permission === 'granted') {
        return true;
    }
    return null;
};

export const isPrerender = (ctx: Window) =>
    includes(
        'prerender',
        cMap(bindArg(getPath(ctx, 'document'), getPath), [
            'webkitVisibilityState',
            'visibilityState',
        ]),
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

// All tracking protection browsers: intellectual TP, enhanced TP, etc
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
