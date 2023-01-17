import { isArray } from 'src/utils/array';
import {
    dataGTagFormatToEcommerceFormat,
    ECOMMERCE_ITEMS,
} from 'src/utils/ecommerce';
import { argsToArray } from 'src/utils/function/args';
import { isNumber } from 'src/utils/number';
import { isObject, len } from 'src/utils/object';
import { isString } from 'src/utils/string';
import { GTAG_EVENTS } from './const';

/**
 * Handle `gtag` calls (indirect push of function arguments into datalayer). E.g.:
 * ```typescript
 * gtag('event', 'purchase', {
 *     "transaction_id": "24.031608523954162",
 *     "affiliation": "Google online store",
 *     "currency": "USD",
 *     "shipping": 7.50,
 *     "tax": 1.80,
 *     "value": 33.30,
 *     "items": [
 *         {
 *             "id": "P12345",
 *             "name": "Android Warhol T-Shirt",
 *             "brand": "Google",
 *             "category": "Apparel/T-Shirts",
 *             "variant": "Black",
 *             "list_name": "Search Results",
 *             "list_position": 1,
 *             "quantity": 2,
 *             "price": 12.00
 *         }
 *     ]
 * });
 * ```
 */
export const handleGtagEcommerce = (
    ctx: Window,
    rawEvent: unknown,
): Record<string, unknown> | undefined => {
    let event = rawEvent;

    if (!isArray(rawEvent) && isNumber(ctx, len(rawEvent))) {
        event = argsToArray(event as IArguments);
    }

    if (!isArray(event)) {
        return undefined;
    }
    const [nameSpace, method, data] = event;
    if (!isString(method) || !isObject<Record<string, string>>(data)) {
        return undefined;
    }
    const eventName = GTAG_EVENTS[method];

    if (!(nameSpace === 'event' && eventName)) {
        return undefined;
    }

    return dataGTagFormatToEcommerceFormat(eventName, data, ECOMMERCE_ITEMS);
};
