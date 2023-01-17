import { CounterTypeInterface, isRsyaCounter } from '../counterOptions';

/**
 * Наличие на странице объявлений Директа
 *
 * @param {CounterTypeInterface} counterType - тип счётчика, 0 - обычный, 1 - РСЯ
 * @return {boolean}
 */
export function yaDirectExists(ctx: Window, counterType: CounterTypeInterface) {
    return isRsyaCounter(counterType) && ctx.Ya && ctx.Ya.Direct;
}
