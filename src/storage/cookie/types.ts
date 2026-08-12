export type CookieGetter = <
    M extends boolean = false,
    R extends M extends true ? string[] | null : string | null = M extends true
        ? string[] | null
        : string | null,
>(
    ctx: Window,
    name: string,
    multi?: M,
) => R;

export type CookieStorageGetter = <
    M extends boolean = false,
    R extends M extends true ? string[] | null : string | null = M extends true
        ? string[] | null
        : string | null,
>(
    name: string,
    multi?: M,
) => R;
