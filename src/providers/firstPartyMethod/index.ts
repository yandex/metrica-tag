import { flags } from '@inject';
import { providersSync } from 'src/providersEntrypoint';
import { YM_LOG_WHITELIST_KEYS } from 'src/providers/params/const';
import {
    FIRST_PARTY_HASHED_PARAMS_KEY,
    FIRST_PARTY_PARAMS_KEY,
    METHOD_NAME_FIRST_PARTY,
    METHOD_NAME_FIRST_PARTY_HASHED,
} from './const';
import { useFirstPartyMethod } from './firstPartyMethod';
import { useFirstPartyMethodHashed } from './firstPartyMethodHashed';

export const initProvider = () => {
    if (flags.FIRST_PARTY_METHOD_FEATURE) {
        providersSync.push((ctx, counterOptions) => ({
            [METHOD_NAME_FIRST_PARTY]: useFirstPartyMethod(ctx, counterOptions),
            [METHOD_NAME_FIRST_PARTY_HASHED]: useFirstPartyMethodHashed(
                ctx,
                counterOptions,
            ),
        }));

        YM_LOG_WHITELIST_KEYS.push(FIRST_PARTY_PARAMS_KEY);
        YM_LOG_WHITELIST_KEYS.push(FIRST_PARTY_HASHED_PARAMS_KEY);
    }
};
