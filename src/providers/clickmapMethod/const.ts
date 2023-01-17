import { TClickMapParams } from 'src/providers/clickmap/constants';

export const METHOD_NAME_CLICK_MAP = 'clickmap';

export type ClickmapHandler<T = any> = (value?: TClickMapParams) => T;

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Heat map of clicks */
        [METHOD_NAME_CLICK_MAP]?: ClickmapHandler<CounterObject>;
    }
}
