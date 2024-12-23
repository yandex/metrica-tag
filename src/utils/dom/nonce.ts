import { cFind } from '../array/find';
import { select } from './select';

export const getNonce = (ctx: Window) => {
    const nonceEl = cFind(
        ({ nonce }: Element) => !!nonce,
        select('style, link, script', ctx.document),
    );
    return nonceEl ? nonceEl.nonce : undefined;
};
