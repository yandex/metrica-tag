/**
 * This interface is used by the instance of the counter
 * It is empty because every provider is meant to declare methods they add to CounterObject themselves.
 * To see an example of this see src/providers/params/const.ts
 * This approach is meant to make providers more self-contained and code overall more modular.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CounterObject {}
