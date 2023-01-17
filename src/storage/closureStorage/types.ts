export type ClosureState<S> = Record<string, Partial<S>>;

export type StateManager<S> = <R>(fn: (state: ClosureState<S>) => R) => R;

export type DeleteVal = (key: string) => <S>(state: ClosureState<S>) => void;
