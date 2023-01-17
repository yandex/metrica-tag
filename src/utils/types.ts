/**
 * Наши утилиты для работы с типами в TypeScript
 */
import { List, Any } from 'ts-toolbelt';

/**
 * Делает ключи K опциональными у интерфейса I
 */
export type WithOptionalProperties<I, K extends keyof I> = Omit<I, K> &
    Record<K, I[K] | undefined>;

/**
 * Делает ключи K required у интерфейса I
 */
export type WithRequiredProperties<I, K extends keyof I> = Omit<I, K> &
    Record<K, NonNullable<I[K]>>;

/**
 * Делает ключи K1 required у интерфейса I и ключи K2 required у свойства K2
 */
export type WithRequiredPropertiesDeep<
    I,
    K1 extends keyof I,
    K2 extends keyof NonNullable<I[K1]>,
> = Omit<I, K1> & Record<K1, WithRequiredProperties<NonNullable<I[K1]>, K2>>;

/**
 * Если ключ K принадлежит к интерфейсу I, вернуть I[K],
 * если нет - вернуть Else
 */
export type IsKeyOfObj<K extends string, I, Else = never> = I extends Record<
    K,
    any
>
    ? I[K]
    : Else;

/**
 * Тоже самое что l1.slice(l2.length)
 */
export type SliceFrom<L1 extends any[], L2 extends any[]> = List.Drop<
    L1,
    List.Length<Any.Cast<L2, any[]>, 's'>
>;
