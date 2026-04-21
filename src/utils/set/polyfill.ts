import { cIndexOfWin } from '../array/indexOf';
import { cForEach } from '../array/map';
import { PolySetInterface } from './types';

/**
 * Set polyfill.
 * Be aware it does not use the SameValueZero algorithm to check the value during the execution of the add function,
 * so two NaN values will not be the same as well as -0 and +0.
 */
export class SetPoly<T> implements PolySetInterface<T> {
    _values: T[] = [];
    size = 0;

    constructor(values?: readonly T[] | null) {
        if (values) {
            cForEach((value: T) => {
                this.add(value);
            }, values);
        }
    }

    add(value: T): this {
        const index = cIndexOfWin(value, this._values);
        if (index === -1) {
            this._values.push(value);
            this.size = this._values.length;
        }
        return this;
    }

    has(value: T): boolean {
        return cIndexOfWin(value, this._values) !== -1;
    }

    delete(value: T): boolean {
        const index = cIndexOfWin(value, this._values);
        if (index === -1) {
            return false;
        }
        this._values.splice(index, 1);
        this.size = this._values.length;
        return true;
    }

    clear(): void {
        this._values = [];
        this.size = 0;
    }

    forEach(callback: (value: T, value2: T, set: this) => void): void {
        cForEach((value) => {
            callback(value, value, this);
        }, this._values);
    }
}

export const convertSetToArray = <T>(set: PolySetInterface<T>): T[] => {
    const result: T[] = [];
    set.forEach((value) => {
        result.push(value);
    });
    return result;
};
