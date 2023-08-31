import { pipe } from '../function/pipe';
import { bindThisForMethod } from '../function/bind/bind';
import { firstArg } from '../function/identity';
import { cForEach } from './map';

/* 
Почему не a.push(...b)? Потому что есть бага 
https://bugs.webkit.org/show_bug.cgi?id=80797
*/

/* TODO Concat is widely supported and thus better suits here.
    We can use concat, when it's native and this function as a polyfill */
export const arrayMerge = <A extends any[], B extends any[]>(
    source: A,
    part: B,
) => {
    cForEach(pipe(firstArg, bindThisForMethod('push', source)), part);
    return source;
};
