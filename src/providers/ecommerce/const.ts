import {
    GTAG_EVENT_ADD,
    GTAG_EVENT_CHECKOUT,
    GTAG_EVENT_DETAIL,
    GTAG_EVENT_PURCHASE,
    GTAG_EVENT_REMOVE,
} from 'src/utils/ecommerce';

export const GTAG_EVENTS: Record<string, string> = {
    ['view_item']: GTAG_EVENT_DETAIL,
    ['add_to_cart']: GTAG_EVENT_ADD,
    ['remove_from_cart']: GTAG_EVENT_REMOVE,
    ['begin_checkout']: GTAG_EVENT_CHECKOUT,
    [GTAG_EVENT_PURCHASE]: GTAG_EVENT_PURCHASE,
};
