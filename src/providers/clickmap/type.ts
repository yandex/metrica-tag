import { TMouseButton } from 'src/utils/mouseEvents/mouseEvents';

/**
 * Structure to store click event
 */
export type ClickInfo = {
    /** DOM element */
    element: HTMLElement | null;
    /** Position on page */
    position: { x: number; y: number };
    /** Pressed button number (left/right/middle/etc) */
    button: TMouseButton;
    /** Timestamp */
    time: number;
} | null;
