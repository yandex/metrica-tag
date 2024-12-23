import { ctxIncludes } from 'src/utils/array/includes';
import { cFilter } from 'src/utils/array/filter';
import { cReduce } from 'src/utils/array/reduce';
import {
    dataGTagFormatToEcommerceFormat,
    ECOMMERCE_ALLOWED_EVENTS,
} from 'src/utils/ecommerce';
import { cKeys, getPath, isObject } from 'src/utils/object';
import { isString } from 'src/utils/string';
import { isEmptyArray } from 'src/utils/array/utils';

/**
 * Handle direct pushes to datalayer with event name set as a separate property. E.g.:
 * ```typescript
 * dataLayer.push({
 *  'event': 'productClick',
 *  'ecommerce': {
 *    'click': {
 *      'actionField': {'list': 'Search Results'},
 *      'products': [{
 *        'name': productObj.name,
 *        'id': productObj.id,
 *        'price': productObj.price,
 *        'brand': productObj.brand,
 *        'category': productObj.cat,
 *        'variant': productObj.variant,
 *        'position': productObj.position
 *       }]
 *     }
 *   },
 *});
 * ```
 */
export const handleTagManagerEcommerce = (
    event: unknown,
): Record<string, unknown> | undefined => {
    const ecommerce: unknown = getPath(event, 'ecommerce') || {};
    const eventType: unknown = getPath(event, 'event') || '';
    if (!isObject(ecommerce) || !isString(eventType)) {
        return undefined;
    }

    return dataGTagFormatToEcommerceFormat(eventType, ecommerce);
};

/**
 * Handle direct pushes to datalayer with event name set as a key of `ecommerce` object. E.g.:
 * ```typescript
 * dataLayer.push({
 *  'ecommerce': {
 *    'detail': {
 *      'actionField': {'list': 'Apparel Gallery'},
 *      'products': [{
 *        'name': 'Triblend Android T-Shirt',
 *        'id': '12345',
 *        'price': '15.25',
 *        'brand': 'Google',
 *        'category': 'Apparel',
 *        'variant': 'Gray'
 *       }]
 *     }
 *   }
 * });
 * ```
 */
export const handleEcommerce = (
    event: unknown,
): Record<string, unknown> | undefined => {
    const ecommerce: unknown = getPath(event, 'ecommerce');
    if (!isObject<Record<string, string>>(ecommerce)) {
        return undefined;
    }

    const allowedKeys = cFilter(
        ctxIncludes(ECOMMERCE_ALLOWED_EVENTS),
        cKeys(ecommerce),
    );
    const ecommerceData = cReduce(
        (collector, key) => {
            collector[key] = ecommerce[key];
            return collector;
        },
        {} as Record<string, unknown>,
        allowedKeys,
    );

    return !isEmptyArray(cKeys(ecommerceData)) ? ecommerceData : undefined;
};
