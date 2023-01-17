import { trimText } from 'src/utils/string/remove';

export const textFromLink = (elem: HTMLElement) => {
    const text = trimText(
        elem.innerHTML && elem.innerHTML.replace(/<\/?[^>]+>/gi, ''),
    );

    if (text) {
        return text;
    }

    const innerImage = elem.querySelector('img');
    if (innerImage) {
        return trimText(
            innerImage.getAttribute('title') || innerImage.getAttribute('alt'),
        );
    }

    return '';
};
