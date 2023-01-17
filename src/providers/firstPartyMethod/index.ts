import { FIRST_PARTY_METHOD_FEATURE } from 'generated/features';
import { flags } from '@inject';
import { providersSync } from 'src/providersEntrypoint';
import {
    METHOD_NAME_FIRST_PARTY,
    METHOD_NAME_FIRST_PARTY_HASHED,
} from './const';
import { useFirstPartyMethod } from './firstPartyMethod';
import { useFirstPartyMethodHashed } from './firstPartyMethodHashed';

export const initProvider = () => {
    if (flags[FIRST_PARTY_METHOD_FEATURE]) {
        providersSync.push((ctx, counterOptions) => ({
            [METHOD_NAME_FIRST_PARTY]: useFirstPartyMethod(ctx, counterOptions),
            [METHOD_NAME_FIRST_PARTY_HASHED]: useFirstPartyMethodHashed(
                ctx,
                counterOptions,
            ),
        }));
    }
};
