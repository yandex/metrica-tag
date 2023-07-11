import { cForEach } from 'src/utils/array';
import { getPath } from 'src/utils/object';
import { errorLogger } from 'src/utils/errorLogger';
import { Observer, observer, Listener } from './observer';

export type Emitter<T, U> = {
    on: (a: string[], listener: Listener<T, U>) => Emitter<T, U>;
    off: (a: string[], listener: Listener<T, U>) => Emitter<T, U>;
    trigger: (a: string, d?: any) => any[];
};

export const emitter = <T, U>(ctx: Window): Emitter<T, U> => {
    const observers: Record<string, Observer<T, U>> = {};

    return {
        on(events: string[], subscriber: Listener<T, U>) {
            cForEach((event) => {
                if (!getPath(observers, event)) {
                    observers[event] = observer(ctx);
                }
                observers[event].on(subscriber);
            }, events);
            return this;
        },
        off(events: string[], subscriber: Listener<T, U>) {
            cForEach((event) => {
                if (getPath(observers, event)) observers[event].off(subscriber);
            }, events);
            return this;
        },
        trigger: (eventName: string, event?: T) =>
            getPath(observers, eventName)
                ? errorLogger(
                      ctx,
                      `e.${event}`,
                      observers[eventName].trigger,
                  )(event)
                : [],
    };
};
