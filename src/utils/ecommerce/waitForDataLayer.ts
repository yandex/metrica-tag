import { isArray } from 'src/utils/array';
import {
    dataLayerObserver,
    DataLayerObserverObject,
} from 'src/utils/dataLayerObserver';
import { clearDefer, setDefer } from 'src/utils/defer';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { getPath } from 'src/utils/object';

const ECOMMERCE_WAIT_TIME = 1000;

export const waitForDataLayer = ctxErrorLogger(
    'dl.w',
    <EventType = string>(
        ctx: Window,
        name: string,
        cb: (e: DataLayerObserverObject<EventType, void>) => void,
    ) => {
        let observerObject:
            | false
            | DataLayerObserverObject<EventType, void>
            | undefined;
        let timeoutId = 0;

        const getObserver = () => {
            const dataLayer: unknown = getPath(ctx, name);
            observerObject =
                isArray<EventType>(dataLayer) &&
                dataLayerObserver<EventType, void>(ctx, dataLayer, cb);

            if (observerObject) {
                return;
            }

            timeoutId = setDefer(
                ctx,
                getObserver,
                ECOMMERCE_WAIT_TIME,
                'ec.dl',
            );
        };

        getObserver();
        return () => clearDefer(ctx, timeoutId);
    },
);
