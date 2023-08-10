import { getPath } from 'src/utils/object';
import { walkTree } from 'src/utils/treeWalker';

export const getNodeText = (ctx: Window, elem: Element | null) => {
    if (!elem) {
        return '';
    }

    const res: string[] = [];
    const doc = getPath(ctx, 'document')!;
    walkTree(ctx, elem, (node: Node) => {
        let textInfo: string | null | undefined;

        if (node.nodeType === doc.TEXT_NODE) {
            textInfo = node.textContent;
        } else if (node instanceof ctx.HTMLImageElement) {
            textInfo = node.alt;
        } else if (node instanceof ctx.HTMLInputElement) {
            textInfo = node.value;
        }

        textInfo = textInfo && textInfo.trim();
        if (textInfo) {
            res.push(textInfo);
        }
    });

    if (res.length === 0) {
        return '';
    }

    return res.join(' ');
};
