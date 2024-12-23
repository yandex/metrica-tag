import { memo } from 'src/utils/function/memo';
import { includes } from 'src/utils/array/includes';
import { getPath, isNull, mix } from 'src/utils/object';
import { pipe } from 'src/utils/function/pipe';
import { equal } from 'src/utils/function/curry';
import { notFn } from 'src/utils/function/identity';
import { cFilter } from 'src/utils/array/filter';
import { getElemCreateFunction, getRootElement, removeNode } from './dom';

type HiddenFrame = {
    frameUrl: string;
    frameEle: HTMLIFrameElement | null;
    owners: string[];
};

export const ACTION_FRAME = 'sc.frame';
export const ACTION_IMAGE = 'sc.image';
export const ACTION_IMAGES = 'sc.images';

export const hiddenFrameRecord = memo(
    (frameUrl: string): HiddenFrame => ({
        frameUrl,
        frameEle: null,
        owners: [],
    }),
);

export const hiddenFrameCreate = (
    ctx: Window,
    url: string,
    ownerId: string,
) => {
    const frameRecord = hiddenFrameRecord(url);
    if (!includes(ownerId, frameRecord.owners)) {
        frameRecord.owners.push(ownerId);
    }

    if (isNull(frameRecord.frameEle)) {
        const createElement = getElemCreateFunction(ctx);

        if (!createElement) {
            return null;
        }

        const frame = createElement('iframe') as HTMLIFrameElement;
        mix(frame.style, {
            display: 'none',
            width: '1px',
            height: '1px',
            visibility: 'hidden',
        });
        frame.src = url;

        const root = getRootElement(ctx);
        if (!root) {
            return null;
        }

        root.appendChild(frame);
        frameRecord.frameEle = frame;
    } else {
        const target = getPath(frameRecord.frameEle, 'contentWindow');
        if (target) {
            target.postMessage('frameReinit', '*');
        }
    }
    return frameRecord.frameEle;
};

export const hiddenFrameRemove = (url: string, ownerId: string) => {
    const frameRecord = hiddenFrameRecord(url);
    if (!includes(ownerId, frameRecord.owners)) {
        return;
    }

    frameRecord.owners = cFilter(
        pipe(equal(ownerId), notFn),
        frameRecord.owners,
    );
    if (!frameRecord.owners.length) {
        removeNode(frameRecord.frameEle as Node);
        frameRecord.frameEle = null;
    }
};
