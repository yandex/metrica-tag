import { pipe } from 'src/utils/function/pipe';
import { cKeys } from 'src/utils/object';
import { head } from '../array/utils';

export type ObfuscatedKey = { [key: string]: 1 };

type Deobfuscate = {
    <K extends string>(obj: Record<K, any>): K;
};

export const deobfuscate: Deobfuscate = pipe(cKeys, head) as Deobfuscate;
