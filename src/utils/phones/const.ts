import { CounterOptions } from 'src/utils/counterOptions';

export type PhoneTuple = [string, string];

export const ReplaceElementText = 'text';
export const ReplaceElementLink = 'href';
export type ReplaceElementType =
    | typeof ReplaceElementText
    | typeof ReplaceElementLink;

export type ReplaceElement = {
    replaceElementType: ReplaceElementType;
    replaceHTMLNode: Node | HTMLAnchorElement;
    replaceFrom: string;
    replaceTo: string;
    textOrig: string;
};

export type PhoneChangeMapItem = {
    replaceTo: string;
    tuple: PhoneTuple;
};

export type PhoneChangeMap = {
    [key: string]: PhoneChangeMapItem;
};

export type TransformPhoneFn = (
    ctx: Window,
    counterOpt: CounterOptions | null,
    item: ReplaceElement,
) => boolean;

export type ReplacerOptions = {
    transformer: TransformPhoneFn;
    needReplaceTypes?: Partial<Record<ReplaceElementType, boolean>>;
};

export const ANY_PHONE = '*';
