import { yaNamespace } from 'src/const';
import { CounterTypeInterface, isRsyaCounter } from '../counterOptions';

const DIRECT = 'Direct';

declare global {
    interface yaNamespaceStorage {
        [DIRECT]?: boolean;
    }
}

/**
 * Detects Direct ads on the page.
 */
export function yaDirectExists(ctx: Window, counterType: CounterTypeInterface) {
    return (
        isRsyaCounter(counterType) &&
        ctx[yaNamespace] &&
        ctx[yaNamespace]![DIRECT]
    );
}
