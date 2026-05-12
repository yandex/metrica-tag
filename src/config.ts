import { flags, argOptions, getVersion } from '@inject';
import type { Constructor } from 'src/types';

export const constructorName: Constructor =
    argOptions.construct || `Metr${argOptions.version}`;
export const host = argOptions.host || 'localhost:3030';

const isTestBuild = flags.LOCAL_FEATURE && typeof argOptions === 'object';
export const cProtocol = isTestBuild ? 'http:' : 'https:';
export const buildVersion = getVersion();
export const NOINDEX = 'noindex';
