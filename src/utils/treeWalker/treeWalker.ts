import { isTextNode } from 'src/utils/dom';
import { arrayMerge, cForEach } from 'src/utils/array';
import { isNil, isFunction } from 'src/utils/object';
import { bindThisForMethod, firstArg, FirstArgOfType, pipe } from '../function';

type NodeFilterFn = (n: Node) => number | boolean;

type TreeWalkerCallback = (n: Node) => boolean | number | void;

type TreeWalkerHandler = (n: Node) => void;

const nodeToArray = (ctx: Window, node: Node, filterCb?: NodeFilterFn) => {
    const result: Node[] = [];
    const resultPusher = pipe(
        firstArg as FirstArgOfType<Node>,
        bindThisForMethod('push', result),
    );

    if (isFunction(filterCb)) {
        const isAccepted = filterCb(node);
        if (isNil(isAccepted) || isAccepted === ctx.NodeFilter.FILTER_ACCEPT) {
            resultPusher(node);
        }
    } else {
        resultPusher(node);
    }

    if (node.childNodes && node.childNodes.length > 0) {
        const { childNodes } = node;
        for (let i = 0, l = childNodes.length; i < l; i += 1) {
            const nodes = nodeToArray(ctx, childNodes[i]);
            cForEach(resultPusher, nodes);
        }
    }

    return result;
};

/**
 *
 * @param ctx Window
 * @param root Root node
 * @param callback on each childNode
 * @param filterCb which nodes to accept
 * @param whatToSeek type of entities to seek
 * @param forceRoot traverse even if root is not accepted by filterCb
 */
export const walkTree = (
    ctx: Window,
    root: Node,
    callback: TreeWalkerCallback,
    filterCb?: NodeFilterFn,
    whatToSeek = -1,
    forceRoot = false,
) => {
    const acceptNode = (node: Node) => {
        if (isFunction(filterCb)) {
            return filterCb(node)
                ? ctx.NodeFilter.FILTER_ACCEPT
                : ctx.NodeFilter.FILTER_REJECT;
        }

        return ctx.NodeFilter.FILTER_ACCEPT;
    };

    const isRootAccepted = acceptNode(root);
    if (
        isFunction(callback) &&
        (forceRoot || isRootAccepted === ctx.NodeFilter.FILTER_ACCEPT)
    ) {
        if (isRootAccepted) {
            callback(root);
        }
        if (!isTextNode(root)) {
            const walker = ctx.document.createTreeWalker(
                root,
                whatToSeek,
                filterCb ? { acceptNode } : null,
                false,
            );
            while (walker.nextNode()) {
                const res = callback(walker.currentNode);
                if (res === false) {
                    break;
                }
            }
        }
    }
};

export const getAllNodes = (
    ctx: Window,
    root: Node,
    filterCb?: NodeFilterFn,
) => {
    const result: Node[] = [];

    if (root) {
        if (ctx.document.documentElement.contains(root)) {
            walkTree(ctx, root, bindThisForMethod('push', result), filterCb);
        } else {
            arrayMerge(result, nodeToArray(ctx, root, filterCb));
        }
    }

    return result;
};

export const eachNode = (
    ctx: Window,
    root: Node,
    callback: TreeWalkerHandler,
    filterCb?: NodeFilterFn,
) => {
    if (root) {
        const nodesList = getAllNodes(ctx, root, filterCb);
        cForEach(callback, nodesList);
    }
};
