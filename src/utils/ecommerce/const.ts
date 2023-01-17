export const ECOMMERCE_SETTINGS_SOURCE_FLAG = 'ecs';

export const FB_SOURCE = '0';
export const DATA_LAYER_SOURCE = '1';
export const GA3_SOURCE = '2';
export const GA4_SOURCE = '3';
export const UA_SOURCE = '4';

export const ECOMMERCE_KEY = 'ecommerce';
export const ECOMMERCE_VERSION_KEY = 'version';
export const ECOMMERCE_ITEMS = 'items';
export const ECOMMERCE_PRODUCTS = 'products';
export const ECOMMERCE_ACTION_FIELD = 'actionField';
export const ECOMMERCE_CURRENCY = 'currencyCode';
export const GTAG_CATEGORY = 'item_category';
export const GTAG_EVENT_PURCHASE = 'purchase';
export const GTAG_CURRENCY = 'currency';
export const GTAG_EVENT_CHECKOUT = 'checkout';
export const GTAG_EVENT_REMOVE = 'remove';
export const GTAG_EVENT_ADD = 'add';
export const GTAG_EVENT_DETAIL = 'detail';

export const GTAG_REPLACE_KEYS: Record<string, string> = {
    ['transaction_id']: 'id',
    ['item_id']: 'id',
    ['item_name']: 'name',
    ['item_brand']: 'brand',
    ['promotion_name']: 'coupon',
    ['index']: 'position',
    ['item_variant']: 'variant',
    ['value']: 'revenue',
    [GTAG_CATEGORY]: 'category',
};

/**
 * @see METR-23618
 */
export const ECOMMERCE_ALLOWED_EVENTS = [
    ECOMMERCE_CURRENCY,
    GTAG_EVENT_ADD,
    'delete',
    GTAG_EVENT_REMOVE,
    GTAG_EVENT_PURCHASE,
    GTAG_EVENT_CHECKOUT,
    GTAG_EVENT_DETAIL,
];
