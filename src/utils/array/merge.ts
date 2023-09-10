import { pipe } from '../function/pipe';
import { bindThisForMethod } from '../function/bind/bind';
import { firstArg } from '../function/identity';
import { cForEach } from './map';

/**
    @function arrayMerge
    @summary Why use this instaead of a.push(...b)? Because of the bug here https://bugs.webkit.org/show_bug.cgi?id=80797
*/
export const arrayMerge = <A extends any[], B extends any[]>(
    source: A,
    part: B,
) => {
    cForEach(pipe(firstArg, bindThisForMethod('push', source)), part);
    return source;
};
