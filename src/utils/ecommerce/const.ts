export const ECOMMERCE_SETTINGS_SOURCE_FLAG = 'ecs';

export const FB_SOURCE = '0';
export const DATA_LAYER_SOURCE = '1';
export const GA3_SOURCE = '2';
export const GA4_SOURCE = '3';
export const UA_SOURCE = '4';

export const ECOMMERCE_GOODS = 'goods';
export const ECOMMERCE_KEY = 'ecommerce';
export const ECOMMERCE_VERSION_KEY = 'version';
export const ECOMMERCE_ITEMS = 'items';
export const ECOMMERCE_PRODUCTS = 'products';
export const ECOMMERCE_ACTION_FIELD = 'actionField';
export const ECOMMERCE_CURRENCY = 'currencyCode';
export const GTAG_CATEGORY = 'item_category';
export const UA_EVENT_PURCHASE = 'purchase';
export const UA_EVENT_CHECKOUT = 'checkout';
export const UA_EVENT_REMOVE = 'remove';
export const UA_EVENT_ADD = 'add';
export const UA_EVENT_DETAIL = 'detail';
export const UA_EVENT_DELETE = 'delete';

export const GTAG_COMMON_REPLACE_KEYS: Record<string, string> = {
    ['transaction_id']: 'id',
    ['item_brand']: 'brand',
    ['index']: 'position',
    ['item_variant']: 'variant',
    ['value']: 'revenue',
    [GTAG_CATEGORY]: 'category',
    ['item_list_name']: 'list',
};

export const GTAG_PRODUCTS_REPLACE_KEYS = {
    ['item_id']: 'id',
    ['item_name']: 'name',
    ['promotion_name']: 'coupon',
};

export const GTAG_EVENT_REPLACE_KEYS: Record<string, string> = {
    ['promotion_name']: 'name',
};

/**
 * @see METR-23618
 */
export const ECOMMERCE_ALLOWED_EVENTS = [
    ECOMMERCE_CURRENCY,
    UA_EVENT_ADD,
    UA_EVENT_DELETE,
    UA_EVENT_REMOVE,
    UA_EVENT_PURCHASE,
    UA_EVENT_CHECKOUT,
    UA_EVENT_DETAIL,
];

export const GTAG_EVENT_VIEW_ITEM = 'view_item';
export const GTAG_EVENT_ADD_TO_CART = 'add_to_cart';
export const GTAG_REMOVE_FROM_CART = 'remove_from_cart';
export const GTAG_EVENT_BEGIN_CHECKOUT = 'begin_checkout';
export const GTAG_EVENT_PURCHASE = 'purchase';
export const GTAG_EVENT_VIEW_ITEM_LIST = 'view_item_list';
export const GTAG_EVENT_SELECT_ITEM = 'select_item';
export const GTAG_EVENT_VIEW_PROMOTION = 'view_promotion';
export const GTAG_EVENT_SELECT_PROMOTION = 'select_promotion';
export const GTAG_CURRENCY = 'currency';

export type GtagToUaMappingObject = {
    event: string;
    mappings: Record<string, string>;
    uaItemsField?: string;
    gtagItemsField?: string;
};

export const GTAG_TO_UA_EVENT_MAP: Record<string, GtagToUaMappingObject> = {
    [GTAG_EVENT_VIEW_ITEM]: {
        event: UA_EVENT_DETAIL,
        mappings: GTAG_PRODUCTS_REPLACE_KEYS,
        uaItemsField: ECOMMERCE_PRODUCTS,
    },
    [GTAG_EVENT_ADD_TO_CART]: {
        event: UA_EVENT_ADD,
        mappings: GTAG_PRODUCTS_REPLACE_KEYS,
        uaItemsField: ECOMMERCE_PRODUCTS,
    },
    [GTAG_REMOVE_FROM_CART]: {
        event: UA_EVENT_REMOVE,
        mappings: GTAG_PRODUCTS_REPLACE_KEYS,
        uaItemsField: ECOMMERCE_PRODUCTS,
    },
    [GTAG_EVENT_BEGIN_CHECKOUT]: {
        event: UA_EVENT_CHECKOUT,
        mappings: GTAG_PRODUCTS_REPLACE_KEYS,
        uaItemsField: ECOMMERCE_PRODUCTS,
    },
    [GTAG_EVENT_PURCHASE]: {
        event: UA_EVENT_PURCHASE,
        mappings: GTAG_PRODUCTS_REPLACE_KEYS,
        uaItemsField: ECOMMERCE_PRODUCTS,
    },
};
