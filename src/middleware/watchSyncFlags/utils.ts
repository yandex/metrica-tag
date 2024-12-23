import { curry2 } from 'src/utils/function/curry';
import { getGlobalStorage } from 'src/storage/global/getGlobal';

export const getGSFlag = curry2((flagName: string, ctx: Window) => {
    const gs = getGlobalStorage(ctx);
    return gs.getVal<string | number | null>(flagName, null);
});
