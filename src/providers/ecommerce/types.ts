export type GTagEcommerceEvent = [string, string, Record<string, unknown>];
export type GTag4EcommerceEvent = {
    event: string;
    ecommerce: Record<string, unknown>;
};
export type EcommerceEvent = { ecommerce: Record<string, unknown> };

export type EcommerceEventType =
    | GTagEcommerceEvent
    | GTag4EcommerceEvent
    | EcommerceEvent;
