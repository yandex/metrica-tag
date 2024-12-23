import * as sinon from 'sinon';
import { METHOD_NAME_PARAMS, ParamsHandler } from 'src/providers/params/const';
import * as counter from 'src/utils/counter/getInstance';
import type { CounterObject } from 'src/utils/counter/type';
import type { CounterOptions } from 'src/utils/counterOptions';
import type { CounterSettings } from 'src/utils/counterSettings/types';
import * as counterSettingsUtils from 'src/utils/counterSettings/counterSettings';
import type { DataLayerObserverObject } from 'src/utils/dataLayerObserver/dataLayerObserver';
import * as ecom from 'src/utils/ecommerce/waitForDataLayer';
import * as numberUtils from 'src/utils/number/number';
import {
    ECOMMERCE_ACTION_FIELD,
    ECOMMERCE_CURRENCY,
    ECOMMERCE_PRODUCTS,
} from 'src/utils/ecommerce/const';
import { ecommerce } from '../ecommerce';

describe('ecommerce', () => {
    const ctx = {} as Window;
    const dataLayerName = 'dl';

    const ecommerceCounterOptions = {
        ecommerce: dataLayerName,
    } as CounterOptions;
    const noEcommerceCounterOptions = {} as CounterOptions;

    const counterSettings = {
        settings: {
            ecommerce: dataLayerName,
        },
    } as CounterSettings;

    const sandbox = sinon.createSandbox();
    let waitForDataLayerStub: sinon.SinonStub<
        Parameters<typeof ecom.waitForDataLayer>,
        ReturnType<typeof ecom.waitForDataLayer>
    >;
    let getCounterStub: sinon.SinonStub<
        Parameters<typeof counter.getCounterInstance>,
        ReturnType<typeof counter.getCounterInstance>
    >;
    let counterSettingsStub: sinon.SinonStub<
        Parameters<typeof counterSettingsUtils.getCounterSettings>,
        ReturnType<typeof counterSettingsUtils.getCounterSettings>
    >;
    let dataLayerHandleSpy: ((event: unknown) => void) | undefined;
    let paramsStub: sinon.SinonStub<
        Parameters<ParamsHandler<CounterObject>>,
        CounterObject
    >;

    const observerMock = {
        observer: {
            on: (callback: (event: unknown) => void) => {
                dataLayerHandleSpy = callback;
            },
        },
    } as DataLayerObserverObject<unknown, void>;

    beforeEach(() => {
        paramsStub = sandbox.stub();
        getCounterStub = sandbox.stub(counter, 'getCounterInstance');
        getCounterStub.returns({
            [METHOD_NAME_PARAMS]: paramsStub,
        });
        sandbox.stub(numberUtils, 'isNumber').returns(true);
        waitForDataLayerStub = sandbox
            .stub(ecom, 'waitForDataLayer')
            .callsFake((_, __, callback) => {
                callback(observerMock);
                return () => {};
            });
        counterSettingsStub = sandbox
            .stub(counterSettingsUtils, 'getCounterSettings')
            .callsFake((__, callback) => {
                callback(counterSettings);
                return Promise.resolve();
            });
        dataLayerHandleSpy = undefined;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("isn't called", () => {
        it('if counter instance is undefined', () => {
            getCounterStub.returns(undefined);
            ecommerce(ctx, ecommerceCounterOptions);
            sinon.assert.notCalled(waitForDataLayerStub);
        });

        it('if ecommerce is off', () => {
            counterSettingsStub.callsFake((_, callback) => {
                callback({} as CounterSettings);
                return Promise.resolve();
            });
            ecommerce(ctx, noEcommerceCounterOptions);
            sinon.assert.notCalled(waitForDataLayerStub);
        });
    });

    describe('is called', () => {
        it('if ecommerce is set in counter options', () => {
            ecommerce(ctx, ecommerceCounterOptions);
            sinon.assert.calledOnce(waitForDataLayerStub);
        });

        it('if ecommerce is set in counter settings', () => {
            ecommerce(ctx, noEcommerceCounterOptions);
            sinon.assert.calledOnce(waitForDataLayerStub);
        });
    });

    it('sends old ecommerce data from dataLayer', () => {
        ecommerce(ctx, ecommerceCounterOptions);
        dataLayerHandleSpy!({
            ecommerce: {
                [ECOMMERCE_CURRENCY]: 123,
            },
        });
        sinon.assert.calledOnceWithExactly(paramsStub, {
            __ym: {
                ecommerce: [
                    {
                        [ECOMMERCE_CURRENCY]: 123,
                    },
                ],
            },
        });
    });

    it('sends new ecommerce events from dataLayer', () => {
        ecommerce(ctx, ecommerceCounterOptions);

        const product = {
            id: 'P12345',
            name: 'Android Warhol T-Shirt',
            listName: 'Search Results',
            brand: 'Google',
            category: 'Apparel/T-Shirts',
            variant: 'Black',
            listPosition: 1,
            quantity: 2,
            price: '2.0',
        };
        dataLayerHandleSpy!([
            'event',
            'view_item',
            {
                ['transaction_id']: 123,
                someRandom: 1234,
                currency: 1,
                items: [product],
            },
        ]);

        sinon.assert.calledOnceWithExactly(paramsStub, {
            __ym: {
                ecommerce: [
                    {
                        detail: {
                            [ECOMMERCE_PRODUCTS]: [product],
                            [ECOMMERCE_ACTION_FIELD]: {
                                id: 123,
                                someRandom: 1234,
                            },
                        },
                        [ECOMMERCE_CURRENCY]: 1,
                    },
                ],
            },
        });
    });

    it('sends G4 ecommerce events (including purchase) from dataLayer', () => {
        ecommerce(ctx, ecommerceCounterOptions);

        const normalizeGoogleProduct = (product: Record<string, unknown>) => {
            const fieldsRename = {
                item_name: 'name',
                item_id: 'id',
                item_brand: 'brand',
                item_variant: 'variant',
                promotion_id: 'promotion_id',
                promotion_name: 'coupon',
                creative_name: 'creative_name',
                creative_slot: 'creative_slot',
                location_id: 'location_id',
                index: 'position',
                quantity: 'quantity',
                price: 'price',
                item_price: 'item_price',
                item_coupon: 'item_coupon',
            };
            const normalized: Record<string, unknown> = {};

            Object.entries(fieldsRename).forEach(([key, renamedKey]) => {
                if (product[key]) {
                    normalized[renamedKey] = product[key];
                }
            });
            const {
                /* eslint-disable camelcase */
                item_category,
                item_category2,
                item_category3,
                item_category4,
            } = product;
            normalized.category = [
                item_category,
                item_category2,
                item_category3,
                item_category4,
                /* eslint-enable camelcase */
            ]
                .filter(Boolean)
                .join('/');

            return normalized;
        };

        const product = {
            item_name: 'Donut Friday Scented T-Shirt',
            item_id: '67890',
            price: '33.75',
            item_brand: 'Google',
            item_category: 'Apparel',
            item_category2: 'Mens',
            item_category3: 'Shirts',
            item_category4: 'Tshirts',
            item_variant: 'Black',
            promotion_id: 'abc123',
            promotion_name: 'summer_promo',
            creative_name: 'instore_suummer',
            creative_slot: '1',
            location_id: 'hero_banner',
            index: 1,
            quantity: '1',
        };

        dataLayerHandleSpy!({
            event: 'view_item',
            ecommerce: {
                items: [product],
            },
        });

        sinon.assert.calledOnceWithExactly(paramsStub, {
            __ym: {
                ecommerce: [
                    {
                        detail: {
                            [ECOMMERCE_PRODUCTS]: [
                                normalizeGoogleProduct(product),
                            ],
                        },
                    },
                ],
            },
        });
        const purchaseProduct1 = {
            item_name: 'Triblend Android T-Shirt',
            item_id: '12345',
            item_price: '15.25',
            item_brand: 'Google',
            item_category: 'Apparel',
            item_variant: 'Gray',
            quantity: 1,
            item_coupon: '123',
        };
        const purchaseProduct2 = {
            item_name: 'Donut Friday Scented T-Shirt',
            item_id: '67890',
            item_price: '33.75',
            item_brand: 'Google',
            item_category: 'Apparel',
            item_variant: 'Black',
            quantity: 1,
        };
        const purchase = {
            transaction_id: 'T12345',
            affiliation: 'Online Store',
            value: '35.43',
            tax: '4.90',
            shipping: '5.99',
            currency: 'EUR',
            coupon: 'SUMMER_SALE',
            items: [purchaseProduct1, purchaseProduct2],
        };

        const purchaseParams = {
            __ym: {
                ecommerce: [
                    {
                        purchase: {
                            [ECOMMERCE_PRODUCTS]: [
                                normalizeGoogleProduct(purchaseProduct1),
                                normalizeGoogleProduct(purchaseProduct2),
                            ],
                            [ECOMMERCE_ACTION_FIELD]: {
                                id: 'T12345',
                                affiliation: 'Online Store',
                                revenue: '35.43',
                                tax: '4.90',
                                shipping: '5.99',
                                coupon: 'SUMMER_SALE',
                            },
                        },
                        [ECOMMERCE_CURRENCY]: 'EUR',
                    },
                ],
            },
        };

        dataLayerHandleSpy!({
            event: 'purchase',
            ecommerce: purchase,
        });
        sinon.assert.calledWith(paramsStub.getCall(1), purchaseParams);

        dataLayerHandleSpy!({
            event: 'purchase',
            ecommerce: {
                purchase,
            },
        });
        sinon.assert.calledWith(paramsStub.getCall(2), purchaseParams);
    });
});
