import { isIE as isIEFn } from 'src/utils/browser/browser';
import { flags, argOptions, getVersion } from '@inject';
import { Constructor } from 'src/types';

const constructorName: Constructor =
    argOptions.construct || `Metr${argOptions.version}`;

const isTestBuild = flags.LOCAL_FEATURE && typeof argOptions === 'object';

export const host = argOptions.host || 'localhost:3030';

const isIE = isIEFn(window);

export const config = {
    METRIKA_COUNTER: 24226447,
    ERROR_LOGGER_COUNTER: 26302566,
    RESOURCES_TIMINGS_COUNTER: 51533966,
    GOALS_EXP_COUNTER: 65446441,
    cProtocol: isTestBuild ? 'http:' : 'https:',
    buildVersion: getVersion(),
    constructorName,
    MAX_LEN_URL: isIE ? 512 : 2048,
    MAX_LEN_SITE_INFO: isIE ? 512 : 2048,
    MAX_LEN_TITLE: isIE ? 100 : 400,
    MAX_LEN_IL: 100, // макс. длина текста внутренних ссылок
    NOINDEX: 'noindex',
};
