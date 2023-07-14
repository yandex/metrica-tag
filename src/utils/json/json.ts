export type JSONValue =
    | null
    | boolean
    | number
    | string
    | unknown[]
    | Record<string, unknown>;

function parse(ctx: Window, text: string | null): JSONValue {
    if (!text) {
        return null;
    }
    try {
        return ctx.JSON.parse(text);
    } catch (e) {
        return null;
    }
}
/**
 * @type function (Object, ...?): (string|null)
 */
const stringify = function a(
    ctx: Window,
    value: any,
    space?: number,
): string | null {
    try {
        return ctx.JSON.stringify(value, null, space);
    } catch (e) {
        return null;
    }
};

export { parse, stringify };
