import { cForEach } from 'src/utils/array/map';
import { cIndexOfWin } from 'src/utils/array/indexOf';
import { PolyMapInterface } from './types';

export class MapPoly<K, V> implements PolyMapInterface<K, V> {
    private _keys: K[] = [];
    private _values: V[] = [];
    size = 0;

    constructor(entries?: readonly (readonly [K, V])[] | null) {
        if (entries) {
            cForEach(([key, value]: readonly [K, V]) => {
                this.set(key, value);
            }, entries);
        }
    }

    set(key: K, value: V): this {
        const index = cIndexOfWin(key, this._keys);
        if (index === -1) {
            this._keys.push(key);
            this._values.push(value);
            this.size = this._keys.length;
        } else {
            this._values[index] = value;
        }
        return this;
    }

    get(key: K): V | undefined {
        const index = cIndexOfWin(key, this._keys);
        if (index === -1) {
            return undefined;
        }
        return this._values[index];
    }

    has(key: K): boolean {
        return cIndexOfWin(key, this._keys) !== -1;
    }

    delete(key: K): boolean {
        const index = cIndexOfWin(key, this._keys);
        if (index === -1) {
            return false;
        }
        this._keys.splice(index, 1);
        this._values.splice(index, 1);
        this.size = this._keys.length;
        return true;
    }

    clear(): void {
        this._keys = [];
        this._values = [];
        this.size = 0;
    }

    forEach(callback: (value: V, key: K, map: this) => void): void {
        cForEach((key: K, i: number) => {
            callback(this._values[i], key, this);
        }, this._keys);
    }
}
