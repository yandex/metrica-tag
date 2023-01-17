export type EventOptionsFull = {
    capture?: boolean;
    passive?: boolean;
};
export type EventOptions = EventOptionsFull | boolean;
export type EventElement = Element | Document | Window;
export type Listener = [EventElement, string, Function, EventOptions];
export type ListenerArgs = [
    EventElement,
    string,
    Function,
    EventOptions,
    boolean,
];
