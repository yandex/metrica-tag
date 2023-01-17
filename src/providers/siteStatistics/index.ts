import { INSERT_SITE_STATISTICS_SCRIPT } from 'generated/features';
import { flags } from '@inject';
import { beforeHitProviders } from 'src/providersEntrypoint';
import { getSiteStatisticsProvider } from './siteStatistics';

declare module 'src/utils/counterSettings/types' {
    interface CounterSettingsParams {
        /** is site statistics iframe enabled */
        sm?: number;
    }
}

export const initProvider = () => {
    if (flags[INSERT_SITE_STATISTICS_SCRIPT]) {
        beforeHitProviders.push(getSiteStatisticsProvider);
    }
};
