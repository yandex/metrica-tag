export interface PolySetInterface<T> {
    add(value: T): this;
    has(value: T): boolean;
    delete(value: T): boolean;
    clear(): void;
    forEach(
        callback: (value: T, value2: T, set: PolySetInterface<T>) => void,
    ): void;
    size: number;
}

export type PolySetConstructor = new <T>(
    values?: readonly T[] | null,
) => PolySetInterface<T>;
