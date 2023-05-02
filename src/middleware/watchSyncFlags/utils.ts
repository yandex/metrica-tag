import { curry2 } from 'src/utils/function';
import { getGlobalStorage } from 'src/storage/global';

export const getGSFlag = curry2((flagName: string, ctx: Window) => {
    const gs = getGlobalStorage(ctx);
    return gs.getVal<string | number | null>(flagName, null);
});
