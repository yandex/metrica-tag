import * as chai from 'chai';
import {
    ECOMMERCE_ACTION_FIELD,
    ECOMMERCE_CURRENCY,
    ECOMMERCE_ITEMS,
    ECOMMERCE_PRODUCTS,
    GTAG_CURRENCY,
    GTAG_EVENT_ADD,
} from '../const';
import { dataGTagFormatToEcommerceFormat } from '../transform';

describe('Ecommerce', () => {
    describe('dataGTagFormatToEcommerceFormat: ', () => {
        it('returns undefined if no items field found', () => {
            const transformed = dataGTagFormatToEcommerceFormat(
                GTAG_EVENT_ADD,
                {},
                ECOMMERCE_ITEMS,
            );

            chai.expect(transformed).to.be.undefined;
        });

        it('maps items to Metrika ecommerce format', () => {
            const data = {
                [ECOMMERCE_ITEMS]: [
                    {
                        item_id: 1,
                        item_name: 'product1',
                    },
                ],
            };
            const transformed = dataGTagFormatToEcommerceFormat(
                GTAG_EVENT_ADD,
                data,
                ECOMMERCE_ITEMS,
            );

            chai.expect(transformed).to.deep.eq({
                [GTAG_EVENT_ADD]: {
                    [ECOMMERCE_PRODUCTS]: [
                        {
                            id: 1,
                            name: 'product1',
                        },
                    ],
                },
            });
        });

        it('maps currency field to Metrika ecommerce format', () => {
            const data = {
                [ECOMMERCE_ITEMS]: [],
                [GTAG_CURRENCY]: 'RUB',
            };
            const transformed = dataGTagFormatToEcommerceFormat(
                GTAG_EVENT_ADD,
                data,
                ECOMMERCE_ITEMS,
            );

            chai.expect(transformed).to.deep.eq({
                [GTAG_EVENT_ADD]: {
                    [ECOMMERCE_PRODUCTS]: [],
                    [ECOMMERCE_ACTION_FIELD]: {},
                },
                [ECOMMERCE_CURRENCY]: 'RUB',
            });
        });

        it('maps known fields to Metrika ecommerce format', () => {
            const data = {
                [ECOMMERCE_ITEMS]: [],
                transaction_id: 1,
                value: 2,
            };
            const transformed = dataGTagFormatToEcommerceFormat(
                GTAG_EVENT_ADD,
                data,
                ECOMMERCE_ITEMS,
            );

            chai.expect(transformed).to.deep.eq({
                [GTAG_EVENT_ADD]: {
                    [ECOMMERCE_PRODUCTS]: [],
                    [ECOMMERCE_ACTION_FIELD]: {
                        id: 1,
                        revenue: 2,
                    },
                },
            });
        });

        it('records unknown fields as is', () => {
            const data = {
                [ECOMMERCE_ITEMS]: [],
                transaction_hash: 'abc',
            };
            const transformed = dataGTagFormatToEcommerceFormat(
                GTAG_EVENT_ADD,
                data,
                ECOMMERCE_ITEMS,
            );

            chai.expect(transformed).to.deep.eq({
                [GTAG_EVENT_ADD]: {
                    [ECOMMERCE_PRODUCTS]: [],
                    [ECOMMERCE_ACTION_FIELD]: {
                        transaction_hash: 'abc',
                    },
                },
            });
        });
    });
});
