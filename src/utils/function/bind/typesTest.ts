import { Bind, BindArg, BindArgs } from '../types';

const testFn = (a: number, b: string, c: boolean) => [a, b, c] as const;
const testWithOneArgFn = (a?: string) => a;
const testUnlimitedArgsFn = (...args: any[]) => args;

declare const bind: Bind;

const bound1 = bind(() => 2, null);
bound1();
// @ts-expect-error
const bound2 = bind(() => 2, null, '123');
const bound3 = bind(testFn, null);
bound3(123, '123', true);
const bound4 = bind(testFn, null, 123);
bound4('123', true);
const bound5 = bind(testFn, null, 123, '123');
bound5(true);
// @ts-expect-error
const bound6 = bind(testFn, null, '123');
const bound7 = bind(testWithOneArgFn, null);
bound7();
bound7('123');
const bound8 = bind(testWithOneArgFn, null, '123');
bound8();
// @ts-expect-error
bound8('123');
const bound9 = bind(testUnlimitedArgsFn, null, 'unlimited args');
bound9('1', 2, true);

declare const bindArg: BindArg;

const boundArg1 = bindArg(123, testFn);
boundArg1('test', false);
// @ts-expect-error
boundArg1('test');
const boundArg2 = bindArg('123', boundArg1);
boundArg2(false);
const boundArg3 = bindArg(false, boundArg2);
boundArg3();
// @ts-expect-error
boundArg3(false);
const boundArg4 = bindArg(undefined, boundArg3);
boundArg4();

declare const bindArgs: BindArgs;

const boundArgs1 = bindArgs([123] as [number], testFn);
boundArgs1('test', false);
const boundArgs2 = bindArgs(['123'] as [string], boundArgs1);
boundArgs2(false);
const boundArgs3 = bindArgs([false] as [boolean], boundArgs2);
boundArgs3();
// @ts-expect-error
const boundArgs4 = bindArgs([undefined], boundArg3);
const boundArgs5 = bindArgs([123, '123'] as [number, string], testFn);
boundArgs5(false);
// @ts-expect-error
const boundArgs6 = bindArgs([123, 123], testFn);
