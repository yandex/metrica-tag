import { CookieStorage, globalCookieStorage } from 'src/storage/cookie';
import { globalLocalStorage } from 'src/storage/localStorage';
import { getRandom, parseDecimalInt } from 'src/utils/number';
import { getSec, TimeOne } from 'src/utils/time';
import { globalMemoWin, IS_RECOVERED_FN_KEY } from 'src/utils/function';
import { CounterOptions } from 'src/utils/counterOptions';
import { arrayJoin } from '../array';

export const setUid = (
    cookieStorageObj: CookieStorage,
    cookieName: string,
    longCookieName: string,
    duration: number,
    curTime: number,
    localDomain: string | undefined,
    uidVal: string,
) => {
    cookieStorageObj.setVal(cookieName, uidVal, duration, localDomain);
    cookieStorageObj.setVal(
        longCookieName,
        `${curTime}`,
        duration,
        localDomain,
    );
};

const getUidState = (ctx: Window, counterOptions: CounterOptions) => {
    const ls = globalLocalStorage(ctx);
    const cookie = globalCookieStorage(ctx);
    const cookieName = counterOptions.ldc || 'uid';

    return [ls.getVal<string>(cookieName), cookie.getVal(cookieName)];
};

const isRecoveredRaw = globalMemoWin(
    IS_RECOVERED_FN_KEY,
    (ctx: Window, counterOptions: CounterOptions) => {
        const [lsUid, uid] = getUidState(ctx, counterOptions);

        return !uid && lsUid;
    },
);

export const isRecovered = (ctx: Window, counterOptions: CounterOptions) => {
    return !counterOptions.noCookie && isRecoveredRaw(ctx, counterOptions);
};

const generateNewUid = (ctx: Window, curTime: number) =>
    arrayJoin('', [
        curTime,
        /*
    rawMin = 1 000 000
    Domain-wide uid is considered valid if it has a minimum 17 symbols: 10 in timestamp and 7 random

    rawMax = 999 999 999
    If random is 10 symbols, max_uint64 = 1844674407 370 955 161 5 will overflow in 2028 year
    */
        getRandom(ctx, 1000000, 999999999),
    ]);

export const getUid = (ctx: Window, counterOptions: CounterOptions) => {
    const localDomainCookie = counterOptions.ldc;
    const cookieName = localDomainCookie || 'uid';
    const localDomain = localDomainCookie ? ctx.location.hostname : undefined;
    const longCookieName = 'd';
    const cookie = globalCookieStorage(ctx);
    const ls = globalLocalStorage(ctx);
    const duration = 365 * 24 * 60; // year
    const timeInfo = TimeOne(ctx);
    const curTime = timeInfo(getSec);
    const [lsUid, cookieUid] = getUidState(ctx, counterOptions);
    let uid = cookieUid;
    const lastCheck = cookie.getVal(longCookieName);

    // Мемоизировать значение в функции isRecovered, перед перезаписью куки
    isRecoveredRaw(ctx, counterOptions);

    let shouldUpdateCookieUid = false;

    if (!uid && lsUid) {
        uid = lsUid;
        shouldUpdateCookieUid = true;
    }
    if (!uid) {
        uid = generateNewUid(ctx, curTime);
        shouldUpdateCookieUid = true;
    } else if (
        !lastCheck ||
        curTime - parseDecimalInt(lastCheck) > (duration * 60) / 2
    ) {
        shouldUpdateCookieUid = true;
    }

    if (shouldUpdateCookieUid && !counterOptions.noCookie) {
        setUid(
            cookie,
            cookieName,
            longCookieName,
            duration,
            curTime,
            localDomain,
            uid,
        );
    }

    ls.setVal(cookieName, uid);

    return uid;
};
