import { getPath } from 'src/utils/object';
import { getTagName } from './dom';

/**
 * Возвращает элемент ссылки из события
 */
export const getTargetLink = (event: MouseEvent): HTMLAnchorElement | null => {
    let target = null;
    try {
        // Выглядит так будто иногда мы можем поймать события из фреймов?
        // Соответственно мы можем словить ошибку пытаясь получить доступ к нему
        target = (event.target || event.srcElement) as HTMLElement;
    } catch (e) {}

    if (target) {
        if ((target as any).nodeType === 3) {
            // Текстовая нода, Safari bug
            target = target.parentNode as HTMLElement;
        }

        let tag = getTagName(target);
        while (
            getPath(target, 'parentNode.nodeName') &&
            ((tag !== 'a' && tag !== 'area') ||
                !(
                    (target as HTMLAnchorElement).href ||
                    target.getAttribute('xlink:href')
                ))
        ) {
            target = target.parentNode as HTMLElement;
            tag = getTagName(target);
        }

        if (!(target as HTMLAnchorElement).href) {
            return null;
        }

        return target as HTMLAnchorElement;
    }

    return null;
};
