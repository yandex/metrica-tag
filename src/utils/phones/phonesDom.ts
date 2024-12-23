import { cForEach, cMap } from 'src/utils/array/map';
import { waitForBodyTask } from 'src/utils/dom/waitForBody';
import { bindArg } from 'src/utils/function/bind';
import { getPath, isUndefined, cKeys } from 'src/utils/object';
import { getMs, TimeOne } from 'src/utils/time/time';
import { PolyPromise } from 'src/utils/promise';
import { walkTree } from 'src/utils/treeWalker';
import { CounterOptions } from 'src/utils/counterOptions';
import { memo } from 'src/utils/function/memo';
import { arrayJoin } from 'src/utils/array/join';
import { cReduce, ctxReduce } from 'src/utils/array/reduce';
import { includes } from 'src/utils/array/includes';
import { cFilter, filterFalsy } from 'src/utils/array/filter';
import { arrayMerge } from 'src/utils/array/merge';
import { toArray } from 'src/utils/array/utils';
import { isArray } from 'src/utils/array/isArray';
import { removeNonDigits } from '../string/remove';
import { taskFork } from '../async/task';
import { safeDecodeURI } from '../querystring';
import {
    PhoneChangeMap,
    PhoneTuple,
    ReplaceElement,
    ReplacerOptions,
    ReplaceElementLink,
    ReplaceElementText,
    ANY_PHONE,
} from './const';

const phoneMask = memo((phone: string) =>
    arrayJoin('[^\\d<>]*', phone.split('')),
);

export const buildRegExp = memo(
    (phone: string) => new RegExp(phoneMask(phone), 'g'),
);

export const buildAllRegExp = (phoneChangeMap: PhoneChangeMap) =>
    new RegExp(`(?:${arrayJoin('|', cMap(phoneMask, cKeys(phoneChangeMap)))})`);

export const altPhone = (purePhone: string) => {
    const altMap: Record<string, string> = {
        '7': '8',
        '8': '7',
    };

    if (purePhone.length === 11) {
        if (altMap[purePhone[0]]) {
            return `${altMap[purePhone[0]]}${purePhone.slice(1)}`;
        }
    }
    return purePhone;
};

export const reformatPhone = (orig: string, res: string) => {
    const out = [];
    const origArr = orig.split('');
    const resArr = res.split('');
    let posRes = 0;
    for (let posOrig = 0; posOrig < orig.length; posOrig += 1) {
        if (posRes >= resArr.length) {
            break;
        }
        const origChar = origArr[posOrig];
        if (origChar >= '0' && origChar <= '9') {
            out.push(resArr[posRes]);
            posRes += 1;
        } else {
            out.push(origArr[posOrig]);
        }
    }
    return arrayJoin('', out) + res.slice(posRes + 1);
};

// стрелочка не лишняя, нужна новая мапа на каждый вызов
const genPhoneMap = () =>
    /* @__PURE__ */ ctxReduce((accum: PhoneChangeMap, tuple: PhoneTuple) => {
        const [from, replaceTo] = cMap(removeNonDigits, tuple);

        accum[from] = {
            replaceTo,
            tuple,
        };

        const altFrom = altPhone(from);

        if (altFrom !== from) {
            accum[altFrom] = {
                replaceTo: altPhone(replaceTo),
                tuple,
            };
        }
        return accum;
    }, {});

export const selectText = (
    ctx: Window,
    phoneChangeMap: PhoneChangeMap,
    rootNode: HTMLElement,
) => {
    if (!rootNode) {
        return [];
    }
    const nodes: ReplaceElement[] = [];
    const phonesRegExp = buildAllRegExp(phoneChangeMap);
    const excludeNodes = ['script', 'style'] as const;
    walkTree(
        ctx,
        rootNode,
        (node: Node) => {
            const nodeName = getPath(node, 'parentNode.nodeName') || '';
            if (
                node === rootNode ||
                includes(nodeName.toLowerCase(), excludeNodes)
            ) {
                return;
            }
            const text = node.textContent || '';
            const phones = filterFalsy(phonesRegExp.exec(text) || []);
            cForEach((phone) => {
                const purePhone = removeNonDigits(phone);
                if (!isUndefined(phoneChangeMap[purePhone])) {
                    nodes.push({
                        replaceElementType: 'text',
                        replaceHTMLNode: node,
                        replaceFrom: purePhone,
                        replaceTo: reformatPhone(
                            phone,
                            phoneChangeMap[purePhone].replaceTo,
                        ),
                        textOrig: node.textContent || '',
                    });
                }
            }, phones);
        },
        (node: Node) => (phonesRegExp.test(node.textContent || '') ? 1 : 0),
        ctx.NodeFilter.SHOW_TEXT,
    );
    return nodes;
};

export const selectLink = (ctx: Window, phoneChangeMap: PhoneChangeMap) => {
    const rootNode = ctx.document.body;
    if (!rootNode) {
        return [];
    }
    const phonesRegExp = buildAllRegExp(phoneChangeMap);

    return cReduce(
        (accum: ReplaceElement[], link: HTMLAnchorElement) => {
            const originalHref = getPath(link, 'href');
            const href = safeDecodeURI(originalHref || '');
            if (href.slice(0, 4) === 'tel:') {
                const [foundPhone] = phonesRegExp.exec(href) || [];
                const purePhone = foundPhone ? removeNonDigits(foundPhone) : '';

                const phoneChangeMapItem = phoneChangeMap[purePhone];
                if (
                    !isUndefined(phoneChangeMapItem) &&
                    (purePhone || phoneChangeMapItem.tuple[0] === ANY_PHONE)
                ) {
                    accum.push({
                        replaceElementType: 'href',
                        replaceHTMLNode: link,
                        replaceFrom: purePhone,
                        replaceTo: reformatPhone(
                            foundPhone!,
                            phoneChangeMap[purePhone].replaceTo,
                        ),
                        textOrig: originalHref!,
                    });

                    const telFromHref = removeNonDigits(href.slice(4));
                    const textsPhoneChangeMap = genPhoneMap()([
                        purePhone
                            ? phoneChangeMapItem.tuple
                            : [telFromHref, ''],
                    ]);

                    arrayMerge(
                        accum,
                        selectText(ctx, textsPhoneChangeMap, link),
                    );
                }
            }

            return accum;
        },
        [],
        toArray<HTMLAnchorElement>(rootNode.querySelectorAll('a')),
    );
};

type ReplacedPhones = { phones: PhoneTuple[]; perf: number };

export const createPhoneDomReplacer = (
    ctx: Window,
    counterOpt: CounterOptions | null,
    replacerOptions: ReplacerOptions,
) => {
    const {
        transformer,
        needReplaceTypes = {
            [ReplaceElementLink]: true,
            [ReplaceElementText]: true,
        },
    } = replacerOptions;
    let phoneChangeMap: PhoneChangeMap;

    const replaceElContent = (item: ReplaceElement) => {
        if (transformer(ctx, counterOpt, item)) {
            return (
                phoneChangeMap[item.replaceFrom] &&
                phoneChangeMap[item.replaceFrom].tuple
            );
        }
        return null;
    };

    return (substitutions: PhoneTuple[]) =>
        new PolyPromise<ReplacedPhones>((resolve, reject) => {
            if (!substitutions || !substitutions.length) {
                reject();
            }
            phoneChangeMap = genPhoneMap()(substitutions);
            waitForBodyTask(ctx)(
                taskFork(bindArg({ phones: [], perf: 0 }, resolve), () => {
                    const timer = TimeOne(ctx);
                    const startTime = timer(getMs);

                    const links = needReplaceTypes[ReplaceElementLink]
                        ? selectLink(ctx, phoneChangeMap)
                        : [];
                    const texts = needReplaceTypes[ReplaceElementText]
                        ? selectText(ctx, phoneChangeMap, ctx.document.body)
                        : [];

                    resolve({
                        phones: cFilter(
                            isArray,
                            filterFalsy(
                                cMap(replaceElContent, links.concat(texts)),
                            ),
                        ),
                        perf: timer(getMs) - startTime,
                    });
                }),
            );
        });
};
