import { cForEach, cMap, dirtyReduce } from 'src/utils/array';
import { cKeys } from 'src/utils/object';
import { bindArg } from '../function';
import { isString, stringIndexOf } from '../string';
import {
    ECOMMERCE_ACTION_FIELD,
    ECOMMERCE_CURRENCY,
    GTAG_CATEGORY,
    GTAG_CURRENCY,
    UA_EVENT_PURCHASE,
    GTAG_EVENT_REPLACE_KEYS,
    GtagToUaMappingObject,
    GTAG_TO_UA_EVENT_MAP,
    ECOMMERCE_ITEMS,
    GTAG_COMMON_REPLACE_KEYS,
} from './const';

const getMappedKey = (mappings: Record<string, string>, key: string) => {
    return mappings[key] || GTAG_COMMON_REPLACE_KEYS[key] || key;
};

const mapItemsFields = (
    mappings: Record<string, string>,
    item: Record<string, any>,
) => {
    const formattedItem: Record<string, any> = {};
    cForEach((key) => {
        const iteKey = getMappedKey(mappings, key);
        if (stringIndexOf(key, GTAG_CATEGORY) !== -1) {
            const categoryKey = GTAG_COMMON_REPLACE_KEYS[GTAG_CATEGORY];
            if (!formattedItem[categoryKey]) {
                formattedItem[categoryKey] = item[key];
            } else {
                formattedItem[categoryKey] += `/${item[key]}`;
            }
        } else {
            formattedItem[iteKey] = item[key];
        }
    }, cKeys(item));
    return formattedItem;
};

// https://developers.google.com/tag-manager/ecommerce-ga4
export const dataGTagFormatToEcommerceFormat = (
    eventObject: string | GtagToUaMappingObject,
    data: Record<string, any>,
) => {
    const mapping = isString(eventObject)
        ? GTAG_TO_UA_EVENT_MAP[eventObject]
        : eventObject;

    if (!mapping) {
        return undefined;
    }
    const {
        event,
        mappings,
        uaItemsField,
        gtagItemsField = ECOMMERCE_ITEMS,
    } = mapping;
    const ecommerceData = data[UA_EVENT_PURCHASE] || data;
    const items: Array<Record<string, string>> = ecommerceData[gtagItemsField];

    if (!items) {
        return undefined;
    }

    const mappedItems = cMap(bindArg(mappings, mapItemsFields), items);

    const result: Record<string, any> = {
        [event]: uaItemsField
            ? {
                  [uaItemsField]: mappedItems,
              }
            : mappedItems,
    };

    const ecommerceKeys = cKeys(ecommerceData);
    if (uaItemsField && ecommerceKeys.length > 1) {
        result[event][ECOMMERCE_ACTION_FIELD] = dirtyReduce<
            string,
            Record<string, string>
        >(
            (itemObj, key) => {
                if (key === gtagItemsField) {
                    return itemObj;
                }

                if (key === GTAG_CURRENCY) {
                    result[ECOMMERCE_CURRENCY] = ecommerceData[GTAG_CURRENCY];
                    return itemObj;
                }

                itemObj[getMappedKey(GTAG_EVENT_REPLACE_KEYS, key)] =
                    ecommerceData[key];
                return itemObj;
            },
            {},
            ecommerceKeys,
        );
    }

    return result;
};
