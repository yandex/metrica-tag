export type Buffer<ItemType> = {
    bufferArray: ItemType[];
    push: (...items: ItemType[]) => void;
    flush: () => ItemType[];
    slice: (start?: number, end?: number) => ItemType[];
};

export const createBuffer = <ItemType>(maxSize: number): Buffer<ItemType> => {
    const buffer: ItemType[] = [];

    return {
        bufferArray: buffer,
        push(...args: ItemType[]) {
            const result = buffer.push(...args);
            if (buffer.length > maxSize) {
                buffer.splice(0, buffer.length - maxSize);
            }
            return result;
        },
        flush() {
            return buffer.splice(0, buffer.length);
        },
        slice(start, end) {
            return buffer.slice(start, end);
        },
    };
};
