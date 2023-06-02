import { INSERT_SITE_STATISTICS_SCRIPT } from 'generated/features';
import { flags } from '@inject';
import { beforeHitProviders } from 'src/providersEntrypoint';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import {
    STATISTICS_MODE_KEY,
    useSiteStatisticsProvider,
} from './siteStatistics';

declare module 'src/utils/counterSettings/types' {
    interface CounterSettingsParams {
        /** is site statistics iframe enabled */
        [STATISTICS_MODE_KEY]?: number;
    }
}

export const initProvider = () => {
    if (flags[INSERT_SITE_STATISTICS_SCRIPT]) {
        beforeHitProviders.push(
            ctxErrorLogger('p.st', useSiteStatisticsProvider),
        );
    }
};
