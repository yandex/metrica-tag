export function fnv32a(val: any) {
    const str = `${val}`;
    let hval = 0x811c9dc5;
    const len = str.length;
    for (let i = 0; i < len; i += 1) {
        /* eslint-disable */
        hval ^= str.charCodeAt(i);
        hval +=
            (hval << 1) +
            (hval << 4) +
            (hval << 7) +
            (hval << 8) +
            (hval << 24);
        /* eslint-enable */
    }

    // eslint-disable-next-line no-bitwise
    return hval >>> 0;
}
