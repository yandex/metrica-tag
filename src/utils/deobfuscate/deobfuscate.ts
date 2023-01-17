import { pipe } from 'src/utils/function';
import { cKeys } from 'src/utils/object';
import { head } from '../array';

export type ObfuscatedKey = { [key: string]: 1 };

export const deobfuscate: <K extends string>(obj: Record<K, any>) => K = pipe(
    cKeys,
    head,
);
