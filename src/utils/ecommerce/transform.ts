import { cForEach, cMap, cReduce } from 'src/utils/array';
import { cKeys } from 'src/utils/object';
import {
    ECOMMERCE_ACTION_FIELD,
    ECOMMERCE_CURRENCY,
    ECOMMERCE_PRODUCTS,
    GTAG_CATEGORY,
    GTAG_CURRENCY,
    GTAG_EVENT_PURCHASE,
    GTAG_REPLACE_KEYS,
} from './const';

const itemsMappingField = (item: Record<string, any>) => {
    const formattedItem: Record<string, any> = {};
    cForEach((key) => {
        const iteKey = GTAG_REPLACE_KEYS[key] || key;
        if (key.indexOf(GTAG_CATEGORY) !== -1) {
            const categoryKey = GTAG_REPLACE_KEYS[GTAG_CATEGORY];
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
    methodName: string,
    data: Record<string, any>,
    itemsField: string,
) => {
    const ecommerceData = data[GTAG_EVENT_PURCHASE] || data;
    const items: Array<Record<string, string>> = ecommerceData[itemsField];

    if (!items) {
        return undefined;
    }

    const result: Record<string, any> = {
        [methodName]: {
            [ECOMMERCE_PRODUCTS]: cMap(itemsMappingField, items),
        },
    };

    const ecommerceKeys = cKeys(ecommerceData);
    if (ecommerceKeys.length > 1) {
        result[methodName][ECOMMERCE_ACTION_FIELD] = cReduce<
            string,
            Record<string, string>
        >(
            (itemObj, key) => {
                if (key === itemsField) {
                    return itemObj;
                }

                if (key === GTAG_CURRENCY) {
                    result[ECOMMERCE_CURRENCY] = ecommerceData[GTAG_CURRENCY];
                    return itemObj;
                }

                itemObj[GTAG_REPLACE_KEYS[key] || key] = ecommerceData[key];
                return itemObj;
            },
            {},
            ecommerceKeys,
        );
    }

    return result;
};
