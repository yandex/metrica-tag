/**
 * @file Build time variables definition for tests.
 */

import { features } from 'generated/features';
import { Args, BuildFlags } from './types';

/*
 * This module is used only for tests and therefore sets up some variables not available during testing:
 * 1. window is not defined in Node;
 * 2. build flags, argOptions and resourceId are provided as env variables.
 */
if (!global.window) {
    // @ts-ignore
    global.window = {};
}

export const flags: Readonly<BuildFlags> = features.reduce((acc, feature) => {
    acc[feature] = true;
    return acc;
}, {} as BuildFlags);

let args = {};
try {
    args = JSON.parse(process.env.ARG_OPTIONS || '');
} catch (e) {
    // empty
}
export const argOptions = Object.assign(args, {
    version: 'unitTest',
    host: 'mc.yandex.ru',
}) as Readonly<Args>;

export const resourceId = 'test.js';
