export const syncPromise = {
    then(callback?: (...args: any[]) => any) {
        if (callback) {
            callback();
        }
        return this;
    },
    catch() {
        return this;
    },
} as Promise<void>;
