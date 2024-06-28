import { has } from '../object';
import { closest } from './closest';

export const isRemovedFromDoc = (ctx: Window, element: HTMLElement) => {
    if (has(element, 'isConnected')) {
        return !element.isConnected;
    }

    return closest('html', ctx, element) !== ctx.document.documentElement;
};
