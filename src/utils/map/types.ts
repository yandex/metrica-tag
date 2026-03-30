export interface PolyMapInterface<K, V> {
    get(key: K): V | undefined;
    set(key: K, value: V): this;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
    forEach(
        callback: (value: V, key: K, map: PolyMapInterface<K, V>) => void,
    ): void;
    readonly size: number;
}

export type PolyMapConstructor = new <K, V>(
    entries?: readonly (readonly [K, V])[] | null,
) => PolyMapInterface<K, V>;
