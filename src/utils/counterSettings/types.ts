/* eslint-disable camelcase */
import { COUNTER_SETTINGS_SETTINGS_KEY } from './const';

export type ConditionRef = {
    track_id: string; // если не указан - остановить обработку, но замен не делать
    type: 'ref';
    patterns: string[];
    params?: string[];
};

export type ConditionAdv = {
    track_id: string; // если не указан - остановить обработку, но замен не делать
    type: 'adv';
    RefererPattern?: string[];
    ServiceNamePattern?: string[];
    yandex_direct?: boolean;
    google_adwords?: boolean;
    direct_orders?: string[]; // только при yandex_direct = true
    direct_camp?: string[]; // только при yandex_direct = true
};

export type Substitution = {
    selector: string;
    text: string;
};

/**
 * Counter settings as received from backend on the first hit.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CounterSettingsParams {}

export interface RawCounterSettings {
    [COUNTER_SETTINGS_SETTINGS_KEY]: CounterSettingsParams;
}

export type CounterSettings = RawCounterSettings & {
    firstHitClientTime: number;
};
